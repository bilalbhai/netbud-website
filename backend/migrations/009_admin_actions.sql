begin;
create unique index manual_payment_evidence on netbud.payments(lower(trim(evidence_reference))) where provider_reference like 'manual:%' and status='confirmed';
create function public.netbud_admin_write(p_actor uuid,p_action text,p_data jsonb,p_key uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare role_name text;oid uuid;item netbud.order_items;target uuid;ref uuid;vnum int;amount int;due int;paid bigint;row_data jsonb;old_hash text;result jsonb:='{}';st text;email_to text;old_qty int;entry jsonb;begin
role_name:=public.netbud_staff(p_actor);
if p_key is null or p_hash is null then raise exception 'invalid_input';end if;
perform pg_advisory_xact_lock(hashtextextended(p_actor::text||p_key::text,0));
select response,hash into result,old_hash from netbud.admin_requests where actor=p_actor and key=p_key;
if found then if old_hash<>p_hash then raise exception 'idempotency_conflict';end if;return result;end if;
result:='{}';
if p_action not in ('staff_permission','invite','enquiry_intake','enquiry_status','enquiry_assign') and not (p_data ? 'order_id') then raise exception 'invalid_input';end if;
if p_action not in ('note','shipment','enquiry_status') and role_name<>'owner' and not (role_name='support' and p_action in ('draft_email','request_artwork','order_update','tracking_details')) then raise exception 'access_denied';end if;
if p_data ? 'order_id' then oid:=(p_data->>'order_id')::uuid;perform public.netbud_order(p_actor,oid);perform 1 from netbud.orders where id=oid for update;end if;
if p_action in ('accept','reject') then result:=public.netbud_update(p_actor,oid,case when p_action='accept' then 'accepted' else 'cancelled' end);
elsif p_action='assign' then
 target:=(p_data->>'staff_id')::uuid;
 if not exists(select 1 from netbud.staff where user_id=target and active) then raise exception 'invalid_input';end if;
 insert into netbud.assignments values(oid,target) on conflict do nothing;
elsif p_action='staff_permission' then
 target:=(p_data->>'staff_id')::uuid;
 if target=p_actor or not exists(select 1 from netbud.staff where user_id=target and role<>'owner') or p_data->>'role' not in ('designer','fulfilment','support') or jsonb_typeof(p_data->'active')<>'boolean' then raise exception 'invalid_input';end if;
 update netbud.staff set role=p_data->>'role',active=(p_data->>'active')::boolean where user_id=target;
elsif p_action='invite' then
 if p_data->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$' or p_data->>'role' not in ('designer','fulfilment','support') then raise exception 'invalid_input';end if;
 insert into netbud.staff_invites(email,role) values(p_data->>'email',p_data->>'role') returning id into ref;result:=jsonb_build_object('invitation_draft_id',ref,'status','draft_only');
elsif p_action='note' then
 if length(p_data->>'note') not between 1 and 1000 then raise exception 'invalid_input';end if;
 insert into netbud.internal_notes(order_id,actor,note) values(oid,p_actor,p_data->>'note');
elsif p_action='quote_draft' then
 select * into item from netbud.order_items where id=(p_data->>'item_id')::uuid and order_id=oid for update;
 amount:=(p_data->>'amount_cents')::int;
 if item.id is null or item.quote_status='not_required' or amount is null or amount<0 or length(p_data->>'scope') not between 1 and 4000 or (p_data->>'deposit_cents')::int not between 0 and amount or coalesce((p_data->>'validity_days')::int,14) not between 1 and 90 or jsonb_typeof(p_data->'milestones')<>'array' then raise exception 'invalid_input';end if;
 select q.id into ref from netbud.quotes q join netbud.quote_versions v on v.quote_id=q.id join netbud.quote_workflow w on w.version_id=v.id where w.item_id=item.id order by v.version desc limit 1;
 if ref is null then insert into netbud.quotes(order_id) values(oid) returning id into ref;end if;
 select coalesce(max(version),0)+1 into vnum from netbud.quote_versions where quote_id=ref;
 insert into netbud.quote_versions(quote_id,version,scope,total_cents,deposit_cents,expires_at) values(ref,vnum,p_data->>'scope',amount,(p_data->>'deposit_cents')::int,now()+make_interval(days=>coalesce((p_data->>'validity_days')::int,14))) returning id into target;
 insert into netbud.quote_workflow(version_id,item_id,milestones) values(target,item.id,p_data->'milestones');result:=jsonb_build_object('version_id',target,'version',vnum,'status','draft');
elsif p_action in ('quote_prepare','quote_accept') then
 target:=(p_data->>'version_id')::uuid;
 select i.* into item from netbud.order_items i join netbud.quote_workflow w on w.item_id=i.id where w.version_id=target and i.order_id=oid for update of i;
 if item.id is null or not exists(select 1 from netbud.quote_versions v where v.id=target and v.expires_at>now() and v.version=(select max(x.version) from netbud.quote_versions x where x.quote_id=v.quote_id)) then raise exception 'invalid_transition';end if;
 if p_action='quote_prepare' then
 if exists(select 1 from netbud.quote_acceptances where quote_version_id=target) then raise exception 'invalid_transition';end if;
 update netbud.quote_workflow set stage='prepared' where version_id=target;update netbud.order_items set quote_status='sent' where id=item.id;
 insert into netbud.outbox(dedupe_key,message_type,recipient,order_id) select 'quote:'||target,'quote_prepared',c.email,oid from netbud.orders o join netbud.customers c on c.id=o.customer_id where o.id=oid on conflict do nothing;
 result:=jsonb_build_object('status','prepared_mock_queued');
 else
 if length(p_data->>'evidence') not between 5 and 500 or not exists(select 1 from netbud.quote_workflow where version_id=target and stage='prepared') then raise exception 'invalid_transition';end if;
 insert into netbud.quote_acceptances(quote_version_id,customer_id,accepted_at) select target,customer_id,now() from netbud.orders where id=oid;
 update netbud.quote_workflow set approval_evidence=p_data->>'evidence' where version_id=target;
 update netbud.order_items set quote_status='accepted' where id=item.id;
 end if;
elsif p_action='manual_payment' then
 select * into item from netbud.order_items where id=(p_data->>'item_id')::uuid and order_id=oid for update;
 amount:=(p_data->>'amount_cents')::int;due:=netbud.item_due(item.id);
 if item.id is null or item.quote_status not in ('not_required','accepted') or p_data->>'verified' is distinct from 'true' or length(p_data->>'evidence') not between 5 and 500 or amount is null or amount<=0 or (select status from netbud.orders where id=oid)<>'accepted' then raise exception 'invalid_transition';end if;
 if amount>(select greatest(0,effective_total-received) from netbud.admin_orders where id=oid) then raise exception 'invalid_input';end if;
 select coalesce(sum(amount_cents),0) into paid from netbud.payment_allocations where item_id=item.id;
 if paid>=due and exists(select 1 from netbud.order_items i where i.order_id=oid and i.id<>item.id and i.payment_status<>'paid') then raise exception 'invalid_transition';end if;
 insert into netbud.payments(order_id,provider_reference,kind,amount_cents,status,evidence_reference) values(oid,'manual:'||p_key,case when p_data->>'kind'='deposit' then 'deposit' else 'balance' end,amount,'confirmed',p_data->>'evidence') returning id into ref;
 if due>paid then insert into netbud.payment_allocations(payment_id,item_id,amount_cents) values(ref,item.id,least(amount,greatest(0,due-paid)));end if;
 if paid+amount>=due then update netbud.order_items set payment_status='paid' where id=item.id;end if;
 result:=jsonb_build_object('payment_record',ref,'status','owner_verified_manual_record');
elsif p_action='refund_approve' then
 amount:=(p_data->>'amount_cents')::int;
 if amount is null or amount<=0 or length(p_data->>'reason') not between 5 and 500 or amount>(select received-coalesce((select sum(amount_cents) from netbud.refund_approvals where order_id=oid),0) from netbud.admin_orders where id=oid) then raise exception 'invalid_input';end if;
 insert into netbud.refund_approvals(order_id,amount_cents,reason,approved_by) values(oid,amount,p_data->>'reason',p_actor);result:=jsonb_build_object('status','refund_approved_not_processed');
elsif p_action='production' then
 select * into item from netbud.order_items where id=(p_data->>'item_id')::uuid and order_id=oid for update;
 if item.id is null or p_data->>'status' not in ('processing','ready','completed') then raise exception 'invalid_input';end if;
 update netbud.order_items set fulfilment_status=p_data->>'status' where id=item.id;
elsif p_action='complete' then
 update netbud.orders set status='completed',completed_at=now() where id=oid;
elsif p_action='shipment' then
 if role_name not in ('owner','fulfilment') then raise exception 'access_denied';end if;
 st:=p_data->>'status';
 if st not in ('ready','shipped','collected') or jsonb_typeof(p_data->'items')<>'array' or jsonb_array_length(p_data->'items')<1 or length(coalesce(p_data->>'notes',''))>1000 then raise exception 'invalid_input';end if;
 if ((select delivery from netbud.orders where id=oid)='pickup') then
 if st='shipped' or (st='collected' and p_data->>'pickup_confirmed' is distinct from 'true') or coalesce(p_data->>'tracking','')<>'' then raise exception 'invalid_input';end if;
 else if st='collected' or (st='shipped' and coalesce(p_data->>'tracking','') !~ '^[A-Za-z0-9]{8,40}$') then raise exception 'invalid_input';end if;end if;
 if p_data ? 'shipment_id' then
 ref:=(p_data->>'shipment_id')::uuid;
 if not exists(select 1 from netbud.deliveries where id=ref and order_id=oid and status='ready') or st not in ('shipped','collected') then raise exception 'invalid_transition';end if;
 else
 if st<>'ready' then raise exception 'invalid_transition';end if;
 insert into netbud.deliveries(order_id,status,carrier,internal_notes) values(oid,st,case when (select delivery from netbud.orders where id=oid)='pickup' then 'pickup' else 'Australia Post' end,p_data->>'notes') returning id into ref;
 end if;
 for entry in select * from jsonb_array_elements(p_data->'items') loop
 select * into item from netbud.order_items where id=(entry->>'item_id')::uuid and order_id=oid for update;
 if item.id is null or item.fulfilment_status not in ('ready','shipped') or (entry->>'quantity')::int not between 1 and item.quantity or not exists(select 1 from netbud.products where id=item.product_id and physical) then raise exception 'invalid_transition';end if;
 if st='ready' then
 select coalesce(sum(di.quantity),0) into old_qty from netbud.delivery_items di join netbud.deliveries dd on dd.id=di.delivery_id where di.item_id=item.id;
 if old_qty+(entry->>'quantity')::int>item.quantity then raise exception 'invalid_transition';end if;
 insert into netbud.delivery_items values(ref,item.id,(entry->>'quantity')::int);
 else
 if not exists(select 1 from netbud.delivery_items where delivery_id=ref and item_id=item.id and quantity=(entry->>'quantity')::int) then raise exception 'invalid_input';end if;
 end if;
 end loop;
 if st<>'ready' and (select count(*) from netbud.delivery_items where delivery_id=ref)<>jsonb_array_length(p_data->'items') then raise exception 'invalid_input';end if;
 update netbud.deliveries set status=st,tracking=nullif(p_data->>'tracking',''),dispatched_at=case when st='shipped' then coalesce((p_data->>'dispatch_date')::timestamptz,now()) else null end,updated_at=now() where id=ref;
 if exists(select 1 from netbud.deliveries where id=ref and dispatched_at>now()) then raise exception 'invalid_input';end if;
 for item in select i.* from netbud.order_items i join netbud.delivery_items di on di.item_id=i.id where di.delivery_id=ref loop
 if (select coalesce(sum(di.quantity),0) from netbud.delivery_items di join netbud.deliveries dd on dd.id=di.delivery_id where di.item_id=item.id and dd.status in ('shipped','collected'))=item.quantity then
 update netbud.order_items set fulfilment_status=case when st='collected' then 'completed' else 'shipped' end where id=item.id;
 end if;end loop;
 insert into netbud.customer_updates(order_id,message) values(oid,'Dispatch record updated: '||st);
 result:=jsonb_build_object('shipment_id',ref,'status',st);
elsif p_action='enquiry_intake' then
 if p_data->'fields'->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$' or length(p_data->'fields'->>'name') not between 1 and 120 or length(p_data->'fields'->>'message') not between 1 and 2000 then raise exception 'invalid_input';end if;
 insert into netbud.enquiries(submission_id,source_url,form_type,fields) values(p_key,p_data->>'source',p_data->>'type',p_data->'fields') returning id into ref;result:=jsonb_build_object('enquiry_id',ref);
elsif p_action='enquiry_status' then
 if role_name not in ('owner','support') then raise exception 'access_denied';end if;
 target:=(p_data->>'enquiry_id')::uuid;
 if not exists(select 1 from netbud.enquiries where id=target and (role_name='owner' or assigned_to=p_actor)) or p_data->>'status' not in ('new','contacted','quoted','closed') then raise exception 'access_denied';end if;
 update netbud.enquiries set status=p_data->>'status' where id=target;
elsif p_action='enquiry_assign' then
 target:=(p_data->>'staff_id')::uuid;
 if not exists(select 1 from netbud.staff where user_id=target and active and role in ('owner','support')) then raise exception 'invalid_input';end if;
 update netbud.enquiries set assigned_to=target where id=(p_data->>'enquiry_id')::uuid;
elsif p_action in ('draft_email','request_artwork','request_payment','order_update','tracking_details') then
 select c.email into email_to from netbud.orders o join netbud.customers c on c.id=o.customer_id where o.id=oid;
 if email_to is null or length(coalesce(p_data->>'message',''))>1000 then raise exception 'invalid_input';end if;
 insert into netbud.communication(order_id,actor,kind,state) values(oid,p_actor,p_action,case when p_action='draft_email' then 'draft_prepared' else 'mock_queued' end);
 if p_action<>'draft_email' then insert into netbud.outbox(dedupe_key,message_type,recipient,order_id) values('admin:'||p_key,p_action,email_to,oid);end if;
 if p_action='order_update' then insert into netbud.customer_updates(order_id,message) values(oid,p_data->>'message');end if;
 result:=jsonb_build_object('state',case when p_action='draft_email' then 'draft_prepared' else 'mock_queued' end,'draft',jsonb_build_object('to',email_to,'subject','NetBud | '||replace(p_action,'_',' '),'body','Order NB-'||upper(oid::text)||E'\n\n'||coalesce(p_data->>'message','Please contact NetBud about your order. No payment link has been issued.')));
else raise exception 'invalid_input';end if;
insert into netbud.audit(actor,action,order_id,metadata) values(p_actor,'admin_'||p_action,oid,jsonb_strip_nulls(jsonb_build_object('staff_id',p_data->'staff_id','enquiry_id',p_data->'enquiry_id','item_id',p_data->'item_id','version_id',p_data->'version_id','role',p_data->'role','active',p_data->'active')));
insert into netbud.admin_requests values(p_actor,p_key,p_hash,result);return result;
end $$;
revoke all on function public.netbud_admin_write(uuid,text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.netbud_admin_write(uuid,text,jsonb,uuid,text) to service_role;
commit;
