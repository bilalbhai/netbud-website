-- REVIEW REQUIRED before applying to hosted netbud-staging.
-- Sandbox receipts are isolated from money received and cannot authorise fulfilment.
begin;
create table netbud.revolut_intents (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references netbud.orders,
 item_id uuid references netbud.order_items,
 purpose text not null check(purpose in ('balance','deposit')),
 request_key uuid unique not null,
 request_hash text not null,
 amount_cents integer not null check(amount_cents>0),
 currency text not null default 'AUD' check(currency='AUD'),
 state text not null default 'dispatching' check(state in ('dispatching','uncertain','pending','processing','authorised','completed','failed','cancelled','refunded')),
 provider_order uuid unique,
 checkout_url text,
 refunded_cents integer not null default 0 check(refunded_cents between 0 and amount_cents),
 review_required boolean not null default false,
 provider_updated_at timestamptz,
 created_at timestamptz not null default now()
);
create index revolut_intent_order on netbud.revolut_intents(order_id);
create table netbud.revolut_events (
 fingerprint text primary key check(fingerprint~'^[a-f0-9]{64}$'),
 intent_id uuid not null references netbud.revolut_intents,
 provider_state text not null,
 refunded_cents integer not null,
 provider_updated_at timestamptz not null,
 recorded_at timestamptz not null default now()
);
create table netbud.revolut_transactions (
 provider_transaction uuid primary key,
 intent_id uuid not null references netbud.revolut_intents,
 amount_cents integer not null check(amount_cents>0),
 recorded_at timestamptz not null default now()
);
alter table netbud.revolut_intents enable row level security;
alter table netbud.revolut_events enable row level security;
alter table netbud.revolut_transactions enable row level security;
revoke all on netbud.revolut_intents,netbud.revolut_events,netbud.revolut_transactions from public,anon,authenticated;
create trigger immutable_revolut_event before update or delete on netbud.revolut_events for each row execute function netbud.immutable();
create trigger immutable_revolut_transaction before update or delete on netbud.revolut_transactions for each row execute function netbud.immutable();

create function public.netbud_revolut(p_action text,p_data jsonb,p_actor uuid default null,p_guest_hash text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o netbud.orders; i netbud.revolut_intents; prior netbud.revolut_intents;
 oid uuid; total bigint; paid bigint; deposit integer; item uuid; purpose text;
 t jsonb; updated timestamptz; provider uuid; target_state text; refunds integer;
begin
 if p_action in ('reserve','status') then
  oid:=(p_data->>'order_id')::uuid;
  select * into o from netbud.orders where id=oid for update;
  if o.id is null then raise exception 'access_denied';end if;
  if p_actor is not null then
   if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
  elsif not exists(select 1 from netbud.guest_sessions where token_hash=p_guest_hash and customer_id=o.customer_id and revoked_at is null and expires_at>now()) then raise exception 'access_denied';
  end if;
  if not o.test_only then raise exception 'access_denied';end if;
  if p_action='status' then
   return coalesce((select jsonb_agg(jsonb_build_object('id',r.id,'purpose',r.purpose,'amount_cents',r.amount_cents,'currency',r.currency,'state',r.state,'refunded_cents',r.refunded_cents,'review_required',r.review_required,'sandbox',true) order by r.created_at) from netbud.revolut_intents r where r.order_id=oid),'[]');
  end if;
  item:=(p_data->>'item_id')::uuid;purpose:=p_data->>'purpose';
  if purpose not in ('balance','deposit') or purpose is null or o.status<>'accepted'
   or exists(select 1 from netbud.order_items where order_id=oid and quote_status not in ('accepted','not_required')) then raise exception 'invalid_transition';end if;
  select * into i from netbud.revolut_intents where request_key=(p_data->>'key')::uuid;
  if found then
   if i.order_id<>oid or i.request_hash<>p_data->>'hash' then raise exception 'idempotency_conflict';end if;
   return to_jsonb(i)||'{"should_create":false,"sandbox":true}'::jsonb;
  end if;
  select * into prior from netbud.revolut_intents where order_id=oid and state in ('dispatching','uncertain','pending','processing','authorised') order by created_at desc limit 1;
  if found then
   if prior.purpose<>purpose or prior.item_id is distinct from item then raise exception 'invalid_transition';end if;
   return to_jsonb(prior)||'{"should_create":false,"sandbox":true}'::jsonb;
  end if;
  select effective_total,received into total,paid from netbud.admin_orders where id=oid;
  paid:=paid+coalesce((select sum(amount_cents-refunded_cents) from netbud.revolut_intents where order_id=oid and state in ('completed','refunded')),0);
  total:=total-paid;
  if purpose='deposit' then
   select v.deposit_cents into deposit from netbud.quote_workflow w
    join netbud.quote_versions v on v.id=w.version_id join netbud.quote_acceptances a on a.quote_version_id=v.id
    join netbud.order_items x on x.id=w.item_id where x.order_id=oid and x.id=item order by v.version desc limit 1;
   if deposit is null then raise exception 'invalid_input';end if;
   deposit:=deposit-coalesce((select sum(a.amount_cents) from netbud.payment_allocations a join netbud.payments p on p.id=a.payment_id where a.item_id=item and p.status='confirmed' and p.kind<>'refund'),0)
    -coalesce((select sum(amount_cents-refunded_cents) from netbud.revolut_intents where order_id=oid and item_id=item and state in ('completed','refunded')),0);
   total:=least(total,deposit);
  elsif item is not null then raise exception 'invalid_input';end if;
  if total<=0 or total>100000000 then raise exception 'invalid_transition';end if;
  insert into netbud.revolut_intents(order_id,item_id,purpose,request_key,request_hash,amount_cents)
   values(oid,item,purpose,(p_data->>'key')::uuid,p_data->>'hash',total) returning * into i;
  return to_jsonb(i)||'{"should_create":true,"sandbox":true}'::jsonb;
 end if;
 -- Trusted server-only reconciliation. No browser role can execute this RPC.
 if p_action='find' then
  select * into i from netbud.revolut_intents where provider_order=(p_data->>'provider_order')::uuid;
  if not found and p_data ? 'intent_id' then select * into i from netbud.revolut_intents where id=(p_data->>'intent_id')::uuid;end if;
  return case when i.id is null then null else to_jsonb(i) end;
 end if;
 select order_id into oid from netbud.revolut_intents where id=(p_data->>'intent_id')::uuid;
 perform 1 from netbud.orders where id=oid for update;
 select * into i from netbud.revolut_intents where id=(p_data->>'intent_id')::uuid for update;
 if i.id is null then raise exception 'access_denied';end if;
 if p_action in ('uncertain','failed') then
  update netbud.revolut_intents set state=p_action where id=i.id and state='dispatching';
 elsif p_action='bind' then
  provider:=(p_data->>'provider_order')::uuid;
  if i.provider_order is not null and i.provider_order<>provider then raise exception 'invalid_transition';end if;
  if p_data->>'checkout_url' !~ '^https://(sandbox-checkout|checkout)\.revolut\.com/' then raise exception 'invalid_input';end if;
  update netbud.revolut_intents set provider_order=provider,checkout_url=p_data->>'checkout_url',state=case when state in ('dispatching','uncertain') then 'pending' else state end where id=i.id;
 elsif p_action='reconcile' then
  provider:=(p_data->>'provider_order')::uuid;updated:=(p_data->>'updated_at')::timestamptz;
  target_state:=p_data->>'state';refunds:=(p_data->>'refunded_cents')::int;
  if (i.provider_order is not null and i.provider_order<>provider)
   or p_data->>'currency' is distinct from 'AUD' or (p_data->>'amount_cents')::int is distinct from i.amount_cents or updated is null
   or target_state not in ('pending','processing','authorised','completed','failed','cancelled','refunded')
   or refunds is null or refunds<0 or refunds>i.amount_cents then raise exception 'invalid_input';end if;
  if exists(select 1 from netbud.revolut_events where fingerprint=p_data->>'fingerprint') then return '{"duplicate":true}'::jsonb;end if;
  if coalesce((p_data->>'review_required')::boolean,false) then update netbud.revolut_intents set review_required=true where id=i.id;end if;
  if i.provider_updated_at is not null and updated<i.provider_updated_at then return '{"stale":true}'::jsonb;end if;
  if (i.state in ('completed','refunded') and target_state not in ('completed','refunded'))
    or refunds<i.refunded_cents then raise exception 'invalid_transition';end if;
  if target_state in ('completed','refunded') then
   if jsonb_typeof(p_data->'transactions') is distinct from 'array' or jsonb_array_length(p_data->'transactions')=0
    or (select sum((x->>'amount_cents')::bigint) from jsonb_array_elements(p_data->'transactions') x)<>i.amount_cents then raise exception 'invalid_input';end if;
   for t in select * from jsonb_array_elements(p_data->'transactions') loop
    if exists(select 1 from netbud.revolut_transactions where provider_transaction=(t->>'id')::uuid and (intent_id<>i.id or amount_cents<>(t->>'amount_cents')::int)) then raise exception 'invalid_transition';end if;
    insert into netbud.revolut_transactions(provider_transaction,intent_id,amount_cents) values((t->>'id')::uuid,i.id,(t->>'amount_cents')::int) on conflict do nothing;
   end loop;
  end if;
  insert into netbud.revolut_events(fingerprint,intent_id,provider_state,refunded_cents,provider_updated_at)
   values(p_data->>'fingerprint',i.id,target_state,refunds,updated);
  update netbud.revolut_intents set provider_order=provider,state=target_state,refunded_cents=refunds,provider_updated_at=updated where id=i.id;
 else raise exception 'invalid_input';end if;
 return jsonb_build_object('recorded',true,'sandbox',true);
end $$;
revoke all on function public.netbud_revolut(text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.netbud_revolut(text,jsonb,uuid,text) to service_role;
commit;
