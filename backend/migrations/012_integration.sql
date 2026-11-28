begin;
-- Default remains synthetic-only. Owner must approve a separate hosted staging allowlist.
create table netbud.runtime_policy(id boolean primary key default true check(id),environment text not null default 'local' check(environment in ('local','staging')),test_emails text[] not null default '{}',manual_artwork_enabled boolean not null default false);
insert into netbud.runtime_policy default values;
alter table netbud.runtime_policy enable row level security;
create function netbud.email_allowed(value text) returns boolean language sql stable set search_path='' as $$
 select value~'^[^[:space:]@]+@[^[:space:]@]+\.[A-Za-z]{2,}$' and (value~'\.test$' or exists(select 1 from netbud.runtime_policy where environment='staging' and value=any(test_emails)))
$$;
-- Replace only the two existing synthetic-address predicates; every other guard remains intact.
do $$ declare definition text;changed text;begin
 definition:=pg_get_functiondef('public.netbud_create_base(jsonb,uuid,text)'::regprocedure);
 changed:=replace(definition,$old$customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$'$old$,'not netbud.email_allowed(customer_email)');
 if changed=definition then raise exception 'migration_predicate_mismatch';end if;execute changed;
 definition:=pg_get_functiondef('public.netbud_otp_begin(uuid,text,text,text,text)'::regprocedure);
 changed:=replace(definition,$old$p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$'$old$,'not netbud.email_allowed(p_email)');
 if changed=definition then raise exception 'migration_predicate_mismatch';end if;execute changed;
end $$;

-- Supabase documents session_id lookup to detect logout before access-token expiry.
-- auth.sessions belongs to Supabase; migrations never create/reset real Auth records.
create function public.netbud_staff_session_live(p_actor uuid,p_session uuid) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 perform public.netbud_staff(p_actor);
 return exists(select 1 from auth.sessions where id=p_session and user_id=p_actor and created_at>now()-interval '30 minutes' and (not_after is null or not_after>now()));
end $$;

create table netbud.manual_proofs(id uuid primary key default gen_random_uuid(),item_id uuid not null references netbud.order_items,version integer not null check(version>0),manifest jsonb not null,delivery_reference text not null,created_by uuid not null references netbud.staff,created_at timestamptz not null default now(),unique(item_id,version));
create table netbud.manual_proof_approvals(proof_id uuid primary key references netbud.manual_proofs,customer_id uuid not null references netbud.customers,reply_hash text not null check(reply_hash~'^[a-f0-9]{64}$'),evidence_reference text not null,received_at timestamptz not null,recorded_by uuid not null references netbud.staff,recorded_at timestamptz not null default now());
alter table netbud.manual_proofs enable row level security;alter table netbud.manual_proof_approvals enable row level security;
revoke all on netbud.runtime_policy,netbud.manual_proofs,netbud.manual_proof_approvals from public,anon,authenticated;
create trigger immutable_manual_proof before update or delete on netbud.manual_proofs for each row execute function netbud.immutable();
create trigger immutable_manual_approval before update or delete on netbud.manual_proof_approvals for each row execute function netbud.immutable();
create function public.netbud_manual_proof(p_actor uuid,p_action text,p_data jsonb,p_key uuid,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare item netbud.order_items;o netbud.orders;proof netbud.manual_proofs;result jsonb;entry jsonb;n integer;expected integer;record_hash text;begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select response,hash into result,record_hash from netbud.admin_requests where actor=p_actor and key=p_key;
 if found then if record_hash<>p_hash then raise exception 'idempotency_conflict';end if;return result;end if;
 if not (select manual_artwork_enabled from netbud.runtime_policy) then raise exception 'artwork_validation_unavailable';end if;
 select * into o from netbud.orders where id=(p_data->>'order_id')::uuid for update;
 select * into item from netbud.order_items where id=(p_data->>'item_id')::uuid and order_id=o.id for update;
 if item.id is null or o.status<>'accepted' or item.fulfilment_status<>'pending' or not exists(select 1 from netbud.products where id=item.product_id and physical) then raise exception 'invalid_transition';end if;
 if p_action='proof_prepare' then
 expected:=greatest(1,(select count(*) from jsonb_array_elements(o.customisation) d where (d->>'product_id')::int=item.product_id));
 if jsonb_typeof(p_data->'manifest') is distinct from 'array' or jsonb_array_length(p_data->'manifest')<>expected or p_data->>'reviewed' is distinct from 'true' or length(coalesce(p_data->>'reference','')) not between 5 and 500 then raise exception 'invalid_input';end if;
 for entry in select * from jsonb_array_elements(p_data->'manifest') loop
 if (entry->>'design')::int not between 1 and expected or coalesce(entry->>'sha256','')!~'^[a-f0-9]{64}$' or length(coalesce(entry->>'reference','')) not between 5 and 500 then raise exception 'invalid_input';end if;end loop;
 if (select count(distinct x->>'design') from jsonb_array_elements(p_data->'manifest') x)<>expected then raise exception 'invalid_input';end if;
 select coalesce(max(version),0)+1 into n from netbud.manual_proofs where item_id=item.id;
 insert into netbud.manual_proofs(item_id,version,manifest,delivery_reference,created_by) values(item.id,n,p_data->'manifest',p_data->>'reference',p_actor) returning * into proof;
 update netbud.order_items set artwork_status='review' where id=item.id;
 elsif p_action='proof_approve' then
 select * into proof from netbud.manual_proofs where id=(p_data->>'proof_id')::uuid and item_id=item.id;
 if proof.id is null or proof.version<>(select max(version) from netbud.manual_proofs where item_id=item.id) or p_data->>'verified' is distinct from 'true'
 or lower(trim(p_data->>'from_email')) is distinct from (select email from netbud.customers where id=o.customer_id)
 or coalesce(p_data->>'reply_hash','')!~'^[a-f0-9]{64}$' or length(coalesce(p_data->>'evidence','')) not between 5 and 500
 or (p_data->>'received_at')::timestamptz is null or (p_data->>'received_at')::timestamptz<proof.created_at or (p_data->>'received_at')::timestamptz>now() then raise exception 'invalid_input';end if;
 insert into netbud.manual_proof_approvals values(proof.id,o.customer_id,p_data->>'reply_hash',p_data->>'evidence',(p_data->>'received_at')::timestamptz,p_actor,now());
 update netbud.order_items set artwork_status='approved' where id=item.id;
 else raise exception 'invalid_input';end if;
 result:=jsonb_build_object('proof_id',proof.id,'version',proof.version,'status',case when p_action='proof_prepare' then 'awaiting_actual_customer_reply' else 'owner_recorded_customer_evidence' end);
 insert into netbud.admin_requests values(p_actor,p_key,p_hash,result);
 insert into netbud.audit(actor,action,order_id,metadata) values(p_actor,p_action,o.id,jsonb_build_object('proof_id',proof.id,'version',proof.version));return result;
end $$;
create function public.netbud_manual_history(p_actor uuid,p_order uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 return (select coalesce(jsonb_agg(to_jsonb(p)||jsonb_build_object('approval',to_jsonb(a)) order by p.created_at),'[]') from netbud.manual_proofs p join netbud.order_items i on i.id=p.item_id left join netbud.manual_proof_approvals a on a.proof_id=p.id where i.order_id=p_order);
end $$;

-- Keep all existing financial/state guards; introduce an explicit manual-evidence alternative.
alter function netbud.production_guard() rename to production_guard_upload_only;
create function netbud.production_guard() returns trigger language plpgsql set search_path='' as $$
declare paid bigint;physical boolean;manual_ok boolean;required integer;begin
 if new.fulfilment_status=old.fulfilment_status then return new;end if;
 if not ((old.fulfilment_status='pending' and new.fulfilment_status='processing') or (old.fulfilment_status='processing' and new.fulfilment_status='ready') or (old.fulfilment_status='ready' and new.fulfilment_status in ('shipped','completed')) or (old.fulfilment_status='shipped' and new.fulfilment_status='completed')) then raise exception 'invalid_transition';end if;
 if (select status from netbud.orders where id=new.order_id)<>'accepted' or new.quote_status not in ('not_required','accepted') then raise exception 'invalid_transition';end if;
 select coalesce(sum(a.amount_cents),0) into paid from netbud.payment_allocations a join netbud.payments p on p.id=a.payment_id where a.item_id=new.id and p.status='confirmed' and p.kind<>'refund';
 select p.physical into physical from netbud.products p where p.id=new.product_id;
 required:=netbud.item_due(new.id);
 if not physical and new.fulfilment_status='processing' and new.quote_status='accepted' then
 select v.deposit_cents into required from netbud.quote_versions v join netbud.quote_workflow w on w.version_id=v.id join netbud.quote_acceptances a on a.quote_version_id=v.id where w.item_id=new.id order by v.version desc limit 1;
 end if;
 if required is null or paid<required or (required>=netbud.item_due(new.id) and required>0 and new.payment_status<>'paid') or exists(select 1 from netbud.payments where order_id=new.order_id and kind='refund' and status='confirmed') then raise exception 'invalid_transition';end if;
 if physical then
 select exists(select 1 from netbud.manual_proofs p join netbud.manual_proof_approvals a on a.proof_id=p.id where p.item_id=new.id and p.version=(select max(version) from netbud.manual_proofs where item_id=new.id)) and (select manual_artwork_enabled from netbud.runtime_policy) into manual_ok;
 if not manual_ok and exists(select 1 from netbud.manual_proofs where item_id=new.id) then raise exception 'invalid_transition';end if;
 if not manual_ok then
 if not (select uploads_enabled from netbud.limits) then raise exception 'artwork_validation_unavailable';end if;
 if not exists(select 1 from netbud.artwork a join netbud.artwork_approvals ap on ap.artwork_id=a.id where a.item_id=new.id and a.state='validated' and a.proof_version=(select max(x.proof_version) from netbud.artwork x where x.item_id=new.id)) then raise exception 'invalid_transition';end if;
 end if;
 if new.artwork_status<>'approved' then raise exception 'invalid_transition';end if;
 -- Shipping must be paid too, independently of the per-item allocation.
 if (select received from netbud.admin_orders where id=new.order_id)<(select shipping_cents from netbud.orders where id=new.order_id)+(select coalesce(sum(netbud.item_due(id)),0) from netbud.order_items where order_id=new.order_id and payment_status='paid') then raise exception 'invalid_transition';end if;
 end if;return new;
end $$;
drop trigger production_guard on netbud.order_items;
create trigger production_guard before update of fulfilment_status on netbud.order_items for each row execute function netbud.production_guard();

create function public.netbud_maintenance() returns jsonb language plpgsql security definer set search_path='' as $$
declare codes integer;sessions integer;rates integer;begin
 update netbud.outbox m set encrypted_payload=null,status=case when m.status='queued' then 'expired' else m.status end where m.challenge_id is not null and exists(select 1 from netbud.otp_challenges c where c.id=m.challenge_id and (c.expires_at<now() or c.consumed_at is not null));
 update netbud.otp_challenges set code_hmac=repeat('0',64) where expires_at<now() and code_hmac<>repeat('0',64);get diagnostics codes=row_count;
 update netbud.otp_challenges set email_hash=repeat('0',64),customer_id=null where expires_at<now()-interval '1 day';
 update netbud.outbox set recipient='expired-'||id::text||'@example.invalid',encrypted_payload=null where challenge_id is not null and available_at<now()-interval '30 days';
 delete from netbud.guest_sessions where expires_at<now()-interval '1 day' or revoked_at<now()-interval '1 day';get diagnostics sessions=row_count;
 delete from netbud.rate_limits where expires_at<now();get diagnostics rates=row_count;
 delete from netbud.bot_tokens where expires_at<now();delete from netbud.artwork_reservations where expires_at<now();
 -- Financial/audit/business records are untouched. Message metadata is retained; old prepared bodies are scrubbed.
 update netbud.admin_requests set response=response-'draft' where response ? 'draft' and key in (select substring(dedupe_key from 7)::uuid from netbud.outbox where dedupe_key like 'admin:%' and status in ('accepted','delivered','bounced','failed','expired') and coalesce(accepted_at,sent_at,available_at)<now()-interval '30 days');
 return jsonb_build_object('expired_code_secrets',codes,'expired_sessions',sessions,'expired_rate_keys',rates);
end $$;
revoke all on function netbud.email_allowed(text),netbud.production_guard(),netbud.production_guard_upload_only() from public,anon,authenticated;
do $$ declare f record;begin for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in ('netbud_staff_session_live','netbud_manual_proof','netbud_manual_history','netbud_maintenance') loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);execute format('grant execute on function %s to service_role',f.signature);end loop;end $$;
commit;
