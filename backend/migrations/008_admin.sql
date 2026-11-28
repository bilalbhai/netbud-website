begin;
alter table netbud.audit add column metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object');
alter table netbud.enquiries add column assigned_to uuid references netbud.staff;
alter table netbud.deliveries add column carrier text not null default 'Australia Post' check(carrier in ('Australia Post','pickup'));
alter table netbud.deliveries add column dispatched_at timestamptz;
alter table netbud.deliveries add column internal_notes text check(length(internal_notes)<=1000);
create table netbud.delivery_items(delivery_id uuid references netbud.deliveries,item_id uuid references netbud.order_items,quantity integer not null check(quantity>0),primary key(delivery_id,item_id));
create table netbud.quote_workflow(version_id uuid primary key references netbud.quote_versions,item_id uuid not null references netbud.order_items,stage text not null default 'draft' check(stage in ('draft','prepared')),milestones jsonb not null default '[]',approval_evidence text);
create table netbud.refund_approvals(id uuid primary key default gen_random_uuid(),order_id uuid not null references netbud.orders,amount_cents integer not null check(amount_cents>0),reason text not null,approved_by uuid not null references netbud.staff,created_at timestamptz not null default now());
create table netbud.internal_notes(id uuid primary key default gen_random_uuid(),order_id uuid not null references netbud.orders,actor uuid not null references netbud.staff,note text not null check(length(note) between 1 and 1000),created_at timestamptz not null default now());
create table netbud.staff_invites(id uuid primary key default gen_random_uuid(),email text not null check(email ~ '^[^[:space:]@]+@[^[:space:]@]+\.test$'),role text not null check(role in ('designer','fulfilment','support')),status text not null default 'draft' check(status='draft'));
create table netbud.admin_requests(actor uuid references netbud.staff,key uuid,hash text not null,response jsonb not null,primary key(actor,key));
create table netbud.communication(id uuid primary key default gen_random_uuid(),order_id uuid references netbud.orders,actor uuid references netbud.staff,kind text not null,state text not null check(state in ('draft_prepared','mock_queued')),created_at timestamptz not null default now());
create index admin_item_order on netbud.order_items(order_id);
create index admin_payment_order on netbud.payments(order_id,status);
create index admin_assignment_staff on netbud.assignments(user_id,order_id);
create index admin_enquiry_staff on netbud.enquiries(assigned_to,status,created_at);
create index admin_quote_item on netbud.quote_workflow(item_id,version_id);
create index admin_delivery_order on netbud.deliveries(order_id);
create index admin_delivery_item on netbud.delivery_items(item_id);
do $$ declare t text;begin
foreach t in array array['delivery_items','quote_workflow','refund_approvals','internal_notes','staff_invites','admin_requests','communication'] loop
execute format('alter table netbud.%I enable row level security',t);execute format('revoke all on netbud.%I from public,anon,authenticated',t);
end loop;end $$;
create trigger immutable_refund before update or delete on netbud.refund_approvals for each row execute function netbud.immutable();
create function netbud.item_due(p_item uuid) returns integer language sql stable set search_path='' as $$
select case when i.quote_status<>'not_required' then coalesce((select v.total_cents from netbud.quote_workflow w join netbud.quote_versions v on v.id=w.version_id join netbud.quote_acceptances a on a.quote_version_id=v.id where w.item_id=i.id order by v.version desc limit 1),0) else i.amount_cents end from netbud.order_items i where i.id=p_item
$$;
create view netbud.admin_orders as
select o.*,c.name customer_name,c.email,c.phone,
 (select string_agg(i.snapshot->>'name',', ') from netbud.order_items i where i.order_id=o.id) products,
 o.shipping_cents+coalesce((select sum(netbud.item_due(i.id)) from netbud.order_items i where i.order_id=o.id),0) effective_total,
 coalesce((select sum(case when p.kind='refund' then -p.amount_cents else p.amount_cents end) from netbud.payments p where p.order_id=o.id and p.status='confirmed'),0) received,
 (select coalesce(jsonb_agg(s.user_id),'[]') from netbud.assignments s where s.order_id=o.id) assigned,
 (select coalesce(string_agg(d.tracking,', '),'') from netbud.deliveries d where d.order_id=o.id) tracking
from netbud.orders o join netbud.customers c on c.id=o.customer_id;
revoke all on netbud.admin_orders from public,anon,authenticated;
create function netbud.production_guard() returns trigger language plpgsql set search_path='' as $$
declare paid bigint; physical boolean;begin
if new.fulfilment_status=old.fulfilment_status then return new;end if;
if not ((old.fulfilment_status='pending' and new.fulfilment_status='processing') or (old.fulfilment_status='processing' and new.fulfilment_status='ready') or (old.fulfilment_status='ready' and new.fulfilment_status in ('shipped','completed')) or (old.fulfilment_status='shipped' and new.fulfilment_status='completed')) then raise exception 'invalid_transition';end if;
if (select status from netbud.orders where id=new.order_id)<>'accepted' then raise exception 'invalid_transition';end if;
if new.quote_status not in ('not_required','accepted') then raise exception 'invalid_transition';end if;
select coalesce(sum(a.amount_cents),0) into paid from netbud.payment_allocations a join netbud.payments p on p.id=a.payment_id where a.item_id=new.id and p.status='confirmed' and p.kind<>'refund';
if paid<netbud.item_due(new.id) or (netbud.item_due(new.id)>0 and new.payment_status<>'paid') then raise exception 'invalid_transition';end if;
select p.physical into physical from netbud.products p where p.id=new.product_id;
if physical then
 if not (select uploads_enabled from netbud.limits) then raise exception 'artwork_validation_unavailable';end if;
 if not exists(select 1 from netbud.artwork a join netbud.artwork_approvals ap on ap.artwork_id=a.id where a.item_id=new.id and a.state='validated' and a.proof_version=(select max(x.proof_version) from netbud.artwork x where x.item_id=new.id)) or new.artwork_status<>'approved' then raise exception 'invalid_transition';end if;
end if;return new;
end $$;
create trigger production_guard before update of fulfilment_status on netbud.order_items for each row execute function netbud.production_guard();
create function netbud.completion_guard() returns trigger language plpgsql set search_path='' as $$ begin
if new.status='completed' and old.status<>'completed' and (old.status<>'accepted' or exists(select 1 from netbud.order_items where order_id=new.id and (fulfilment_status<>'completed' or quote_status not in ('not_required','accepted'))) or exists(select 1 from netbud.admin_orders where id=new.id and received<effective_total)) then raise exception 'invalid_transition';end if;return new;end $$;
create trigger completion_guard before update of status on netbud.orders for each row execute function netbud.completion_guard();
create function public.netbud_admin_read(p_actor uuid,p_resource text,p_query jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare role_name text; oid uuid; result jsonb; page_no int; page_size int; sort_by text;begin
role_name:=public.netbud_staff(p_actor);
page_no:=coalesce((p_query->>'page')::int,1);page_size:=coalesce((p_query->>'size')::int,20);sort_by:=coalesce(p_query->>'sort','date');
if page_no not between 1 and 10000 or page_size not between 1 and 100 or sort_by not in ('date','name','total') or length(coalesce(p_query->>'search',''))>120 then raise exception 'invalid_input';end if;
if sort_by='total' and role_name<>'owner' then raise exception 'access_denied';end if;
if p_resource='session' then return jsonb_build_object('role',role_name,'id',p_actor);end if;
if p_resource='staff' then if role_name<>'owner' then raise exception 'access_denied';end if;return (select coalesce(jsonb_agg(to_jsonb(s)),'[]') from netbud.staff s);end if;
if p_resource='orders' then
 select jsonb_build_object('rows',coalesce(jsonb_agg(data),'[]'),'page',page_no,'size',page_size) into result from (
 select case when role_name='owner' then jsonb_build_object('id',o.id,'reference','NB-'||upper(o.id::text),'date',o.created_at,'name',o.customer_name,'email',o.email,'phone',o.phone,'products',o.products,'total',o.effective_total,'received',o.received,'outstanding',greatest(0,o.effective_total-o.received),'status',o.status,'payment',case when exists(select 1 from netbud.order_items qi where qi.order_id=o.id and qi.quote_status in ('awaiting_quote','sent')) then 'quote_pending' when o.received>=o.effective_total and o.effective_total>0 then 'paid' when o.received>0 then 'partially_paid' else 'pending' end,'assigned',o.assigned,'tracking',o.tracking)
 else jsonb_build_object('id',o.id,'reference','NB-'||upper(o.id::text),'date',o.created_at,'products',o.products,'status',o.status) end data
 from netbud.admin_orders o where (role_name='owner' or exists(select 1 from netbud.assignments a where a.order_id=o.id and a.user_id=p_actor))
 and (coalesce(p_query->>'status','')='' or o.status=p_query->>'status')
 and ((role_name='owner' and (o.customer_name||o.email||o.phone||'NB-'||upper(o.id::text)||coalesce(o.products,'')) ilike '%'||coalesce(p_query->>'search','')||'%') or (role_name<>'owner' and ('NB-'||upper(o.id::text)||coalesce(o.products,'')) ilike '%'||coalesce(p_query->>'search','')||'%'))
 order by case when sort_by='name' and role_name='owner' then o.customer_name end asc,case when sort_by='total' then o.effective_total end desc,o.created_at desc,o.id
 limit page_size offset (page_no-1)*page_size) rows;return result;
end if;
if p_resource='order' then
 oid:=(p_query->>'id')::uuid;result:=public.netbud_order(p_actor,oid);
 result:=result||jsonb_build_object('notes',(select coalesce(jsonb_agg(jsonb_build_object('note',n.note,'at',n.created_at)),'[]') from netbud.internal_notes n where n.order_id=oid and (role_name='owner' or n.actor=p_actor)),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.snapshot->>'name','quantity',i.quantity,'physical',(select physical from netbud.products where id=i.product_id),'artwork',i.artwork_status,'production',i.fulfilment_status,'payment',case when role_name='owner' then i.payment_status else null end,'quote',i.quote_status)),'[]') from netbud.order_items i where i.order_id=oid));
 if role_name in ('owner','designer') then result:=result||jsonb_build_object('designs',(select customisation from netbud.orders where id=oid));end if;
 if role_name in ('owner','fulfilment') then result:=result||jsonb_build_object('shipments',(select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'status',d.status,'tracking',d.tracking,'carrier',d.carrier,'dispatched_at',d.dispatched_at,'updated_at',d.updated_at,'items',(select coalesce(jsonb_agg(to_jsonb(di)),'[]') from netbud.delivery_items di where di.delivery_id=d.id))),'[]') from netbud.deliveries d where d.order_id=oid));end if;
 if role_name='owner' then result:=result||jsonb_build_object('total',(select effective_total from netbud.admin_orders where id=oid),'received',(select received from netbud.admin_orders where id=oid),'payments',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from netbud.payments p where p.order_id=oid),'refunds',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from netbud.refund_approvals r where r.order_id=oid),'quotes',(select coalesce(jsonb_agg(to_jsonb(v)||jsonb_build_object('stage',w.stage,'item_id',w.item_id,'milestones',w.milestones)),'[]') from netbud.quotes q join netbud.quote_versions v on v.quote_id=q.id join netbud.quote_workflow w on w.version_id=v.id where q.order_id=oid));end if;
 return result;
end if;
if p_resource='enquiries' then
 if role_name not in ('owner','support') then raise exception 'access_denied';end if;
 return (select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(x)),'[]'),'page',page_no) from (select e.id,e.created_at,e.fields,e.source_url,e.form_type,e.status,e.assigned_to from netbud.enquiries e where (role_name='owner' or e.assigned_to=p_actor) and (coalesce(p_query->>'status','')='' or e.status=p_query->>'status') and (e.fields::text||e.source_url||e.form_type) ilike '%'||coalesce(p_query->>'search','')||'%' order by e.created_at desc,e.id limit page_size offset (page_no-1)*page_size)x);
end if;
if p_resource in ('overview','reports','export') then
 if role_name<>'owner' then
 if p_resource<>'overview' then raise exception 'access_denied';end if;
 return jsonb_build_object('assigned_orders',(select count(*) from netbud.assignments where user_id=p_actor),'assigned_enquiries',(select count(*) from netbud.enquiries where assigned_to=p_actor));end if;
 if p_resource='export' then insert into netbud.audit(actor,action) values(p_actor,'financial_export');return (select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select id,to_char(created_at at time zone 'Australia/Sydney','YYYY-MM-DD HH24:MI:SS') created_at_sydney,customer_name,email,phone,effective_total,received,greatest(0,effective_total-received) outstanding,status from netbud.admin_orders order by created_at desc,id limit page_size offset (page_no-1)*page_size)x);end if;
 result:=jsonb_build_object('new_orders',(select count(*) from netbud.orders where status='received'),'awaiting_acceptance',(select count(*) from netbud.orders where status='received'),'awaiting_payment',(select count(*) from netbud.admin_orders where effective_total>received and status<>'cancelled'),'awaiting_artwork',(select count(distinct order_id) from netbud.order_items where artwork_status='awaiting'),'in_production',(select count(distinct order_id) from netbud.order_items where fulfilment_status='processing'),'ready_dispatch',(select count(distinct i.order_id) from netbud.order_items i join netbud.products pr on pr.id=i.product_id where i.fulfilment_status='ready' and pr.physical),'completed',(select count(*) from netbud.orders where status='completed'),'new_enquiries',(select count(*) from netbud.enquiries where status='new'),'received_cents',(select coalesce(sum(case when kind='refund' then -amount_cents else amount_cents end),0) from netbud.payments where status='confirmed'),'outstanding_cents',(select coalesce(sum(greatest(0,effective_total-received)),0) from netbud.admin_orders where status<>'cancelled'));
 if p_resource='reports' then result:=result||jsonb_build_object('months',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select to_char(created_at at time zone 'Australia/Sydney','YYYY-MM') month_key,count(*) orders from netbud.orders group by 1 order by 1 desc limit 24)x),'products',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select i.snapshot->>'name' name,sum(i.quantity) ordered_quantity from netbud.order_items i join netbud.orders o on o.id=i.order_id where o.status<>'cancelled' group by 1)x),'refund_approvals',(select count(*) from netbud.refund_approvals),'refunds_confirmed_cents',(select coalesce(sum(amount_cents),0) from netbud.payments where kind='refund' and status='confirmed'),'shipping',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select status,count(*) count from netbud.deliveries group by status)x),'staff_actions',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select actor,action,metadata,created_at from netbud.audit order by id desc limit 100)x),'tax_classifications',(select coalesce(jsonb_agg(to_jsonb(x)),'[]') from (select snapshot->>'tax_class' classification,sum(amount_cents) recorded_base_cents from netbud.order_items group by 1)x));end if;return result;
end if;raise exception 'invalid_input';end $$;
revoke all on function public.netbud_admin_read(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.netbud_admin_read(uuid,text,jsonb) to service_role;
revoke all on all functions in schema netbud from public,anon,authenticated;
commit;
