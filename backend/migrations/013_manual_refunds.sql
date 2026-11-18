begin;
create table netbud.refund_records(approval_id uuid primary key references netbud.refund_approvals,payment_id uuid unique not null references netbud.payments);
alter table netbud.refund_records enable row level security;
revoke all on netbud.refund_records from public,anon,authenticated;
create trigger immutable_refund_record before update or delete on netbud.refund_records for each row execute function netbud.immutable();
create function public.netbud_record_refund(p_actor uuid,p_data jsonb,p_key uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare o netbud.orders;approved netbud.refund_approvals;result jsonb;prior_hash text;payment uuid;begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select response,hash into result,prior_hash from netbud.admin_requests where actor=p_actor and key=p_key;
 if found then if prior_hash<>p_hash then raise exception 'idempotency_conflict';end if;return result;end if;
 select * into o from netbud.orders where id=(p_data->>'order_id')::uuid for update;
 select * into approved from netbud.refund_approvals where id=(p_data->>'approval_id')::uuid and order_id=o.id;
 if approved.id is null or p_data->>'verified' is distinct from 'true' or length(coalesce(p_data->>'evidence','')) not between 5 and 500 or exists(select 1 from netbud.refund_records where approval_id=approved.id) then raise exception 'invalid_input';end if;
 if approved.amount_cents>(select received from netbud.admin_orders where id=o.id) then raise exception 'invalid_transition';end if;
 insert into netbud.payments(order_id,provider_reference,kind,amount_cents,status,evidence_reference) values(o.id,'manual-refund:'||p_key,'refund',approved.amount_cents,'confirmed',p_data->>'evidence') returning id into payment;
 insert into netbud.refund_records values(approved.id,payment);
 result:=jsonb_build_object('status','owner_verified_external_refund_record','payment_record',payment);
 insert into netbud.admin_requests values(p_actor,p_key,p_hash,result);insert into netbud.audit(actor,action,order_id,metadata) values(p_actor,'verified_manual_refund',o.id,jsonb_build_object('approval_id',approved.id));return result;
end $$;
create function netbud.payment_summary(oid uuid) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('confirmed_receipts_cents',gross,'confirmed_refunds_cents',refunds,'outstanding_cents',greatest(0,effective_total-received),
 'state',case when refunds>=gross and gross>0 then 'refunded' when refunds>0 then 'partially_refunded' when exists(select 1 from netbud.order_items where order_id=oid and quote_status in ('awaiting_quote','sent')) then 'quote_pending' when received>=effective_total and effective_total>0 then 'paid_and_verified' when received>0 then 'partially_paid' else 'awaiting_payment' end,
 'instructions',coalesce((select case status when 'delivered' then 'delivery_reported' when 'accepted' then 'provider_accepted' when 'queued' then 'queued' when 'sending' then 'sending' else status end from netbud.outbox where order_id=oid and message_type='request_payment' order by available_at desc limit 1),'not_requested'))
 from (select a.*,(select coalesce(sum(amount_cents),0) from netbud.payments where order_id=oid and status='confirmed' and kind<>'refund') gross,(select coalesce(sum(amount_cents),0) from netbud.payments where order_id=oid and status='confirmed' and kind='refund') refunds from netbud.admin_orders a where id=oid) s
$$;
-- Only unprocessed approvals reserve refundable funds; completed refunds must not be subtracted twice.
do $$ declare definition text;changed text;begin
 definition:=pg_get_functiondef('public.netbud_admin_write(uuid,text,jsonb,uuid,text)'::regprocedure);
 changed:=replace(definition,'sum(amount_cents) from netbud.refund_approvals where order_id=oid','sum(r.amount_cents) from netbud.refund_approvals r where r.order_id=oid and not exists(select 1 from netbud.refund_records rr where rr.approval_id=r.id)');
 if changed=definition then raise exception 'migration_predicate_mismatch';end if;execute changed;
end $$;
alter function public.netbud_guest_orders(text,uuid) rename to netbud_guest_orders_before_h;
revoke all on function public.netbud_guest_orders_before_h(text,uuid) from service_role;
create function public.netbud_guest_orders(p_hash text,p_order uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
declare data jsonb;begin
 data:=public.netbud_guest_orders_before_h(p_hash,p_order);
 if data->>'authenticated'<>'true' then return data;end if;
 return jsonb_set(data,'{orders}',(select coalesce(jsonb_agg(x||jsonb_build_object('payment_summary',netbud.payment_summary((x->>'id')::uuid))),'[]') from jsonb_array_elements(data->'orders') x));
end $$;
revoke all on function netbud.payment_summary(uuid) from public,anon,authenticated;
revoke all on function netbud.payment_summary(uuid),public.netbud_record_refund(uuid,jsonb,uuid,text),public.netbud_guest_orders(text,uuid) from public,anon,authenticated;
grant execute on function public.netbud_record_refund(uuid,jsonb,uuid,text),public.netbud_guest_orders(text,uuid) to service_role;
commit;
