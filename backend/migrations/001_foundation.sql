begin;
create schema netbud;
revoke all on schema netbud from public, anon, authenticated;

create table netbud.limits (
 id boolean primary key default true check(id), database_soft_bytes bigint not null default 400000000,
 storage_max_bytes bigint not null default 900000000, request_daily_max integer not null default 80000,
 email_daily_max integer not null default 90, uploads_enabled boolean not null default false,
 check(database_soft_bytes>0 and storage_max_bytes>0 and request_daily_max>0 and email_daily_max>0)
);
insert into netbud.limits default values;
create table netbud.products (
 id integer primary key, slug text unique not null, name text not null,
 price_cents integer not null check(price_cents>=0), physical boolean not null,
 sale_mode text not null check(sale_mode in ('fixed','quote','hybrid')),
 tax_class text not null default 'unconfirmed' check(tax_class in ('unconfirmed','taxable','gst_free')),
 version integer not null default 1 check(version>0), active boolean not null default false,
 options jsonb not null default '{}' check(jsonb_typeof(options)='object')
);
create table netbud.customers (
 id uuid primary key default gen_random_uuid(), email text unique not null check(email=lower(trim(email)) and length(email)<=254 and position('@' in email)>1),
 name text not null check(length(name) between 1 and 120), phone text not null check(length(phone) between 6 and 30), business text check(length(business)<=160)
);
create table netbud.staff (
 user_id uuid primary key references auth.users(id), role text not null check(role in ('owner','designer','fulfilment','support')), active boolean not null default true
);
create table netbud.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references netbud.customers,
 created_at timestamptz not null default now(), idempotency_key uuid unique not null, request_hash text not null,
 status text not null default 'received' check(status in ('received','accepted','cancelled','completed')),
 currency text not null default 'AUD' check(currency='AUD'), total_cents integer not null check(total_cents>=0),
 shipping_cents integer not null check(shipping_cents in (0,1495)), delivery text not null check(delivery in ('shipping','pickup','none')),
 address jsonb, test_only boolean not null default true check(test_only), completed_at timestamptz,
 check((delivery='shipping' and jsonb_typeof(address)='object') or (delivery<>'shipping' and address is null))
);
create table netbud.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders,
 product_id integer not null references netbud.products, quantity integer not null check(quantity between 1 and 100),
 snapshot jsonb not null, amount_cents integer not null check(amount_cents>=0),
 quote_status text not null default 'not_required' check(quote_status in ('not_required','awaiting_quote','sent','accepted')),
 payment_status text not null default 'unpaid' check(payment_status in ('unpaid','authorised','paid','partially_refunded','refunded')),
 artwork_status text not null default 'awaiting' check(artwork_status in ('awaiting','review','approved','not_required')),
 fulfilment_status text not null default 'pending' check(fulfilment_status in ('pending','ready','processing','shipped','completed'))
);
create table netbud.assignments (order_id uuid references netbud.orders, user_id uuid references netbud.staff, primary key(order_id,user_id));
create table netbud.quotes (id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders);
create table netbud.quote_versions (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references netbud.quotes, version integer not null check(version>0),
 scope text not null, total_cents integer not null check(total_cents>=0), deposit_cents integer not null check(deposit_cents between 0 and total_cents),
 expires_at timestamptz not null default now()+interval '14 days', created_at timestamptz not null default now(), unique(quote_id,version)
);
create table netbud.quote_acceptances (quote_version_id uuid primary key references netbud.quote_versions, accepted_at timestamptz not null, customer_id uuid not null references netbud.customers);
create table netbud.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders, provider_reference text unique not null,
 kind text not null check(kind in ('deposit','balance','refund')), amount_cents integer not null check(amount_cents>0),
 status text not null check(status in ('pending','authorised','confirmed','failed')), recorded_at timestamptz not null default now(), evidence_reference text
);
create table netbud.payment_allocations (payment_id uuid references netbud.payments, item_id uuid references netbud.order_items, amount_cents integer not null check(amount_cents>0), primary key(payment_id,item_id));
create table netbud.artwork (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references netbud.order_items,
 design integer not null check(design between 1 and 5), slot integer not null check(slot between 1 and 2),
 object_key text unique not null check(object_key ~ '^[a-f0-9-]+/[a-f0-9-]+\.(jpg|png)$'),
 mime text not null check(mime in ('image/jpeg','image/png')), bytes integer not null check(bytes between 1 and 10000000),
 state text not null default 'quarantined' check(state in ('quarantined','validated','rejected','deleted')),
 proof_version integer not null check(proof_version>0), unique(item_id,design,slot,proof_version), delete_after timestamptz
);
create table netbud.artwork_approvals (artwork_id uuid primary key references netbud.artwork, customer_id uuid not null references netbud.customers, approved_at timestamptz not null default now());
create table netbud.deliveries (id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders, tracking text check(tracking ~ '^[A-Za-z0-9]{8,40}$'), status text not null check(status in ('pending','ready','shipped','collected')), updated_at timestamptz not null default now());
create table netbud.enquiries (id uuid primary key default gen_random_uuid(), submission_id uuid unique not null, source_url text not null, form_type text not null, fields jsonb not null, status text not null default 'new' check(status in ('new','contacted','quoted','closed')), created_at timestamptz not null default now());
create table netbud.customer_updates (id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders, message text not null check(length(message) between 1 and 2000), created_at timestamptz not null default now());
create table netbud.audit (id bigint generated always as identity primary key, actor uuid references netbud.staff, action text not null, order_id uuid references netbud.orders, created_at timestamptz not null default now());
create table netbud.invoices (id uuid primary key default gen_random_uuid(), order_id uuid not null references netbud.orders, number text unique not null, snapshot jsonb not null, total_cents integer not null check(total_cents>=0), gst_cents integer not null check(gst_cents between 0 and total_cents), issued_at timestamptz not null default now());
create table netbud.outbox (
 id uuid primary key default gen_random_uuid(), dedupe_key text unique not null, message_type text not null, recipient text not null,
 order_id uuid references netbud.orders, enquiry_id uuid references netbud.enquiries,
 status text not null default 'queued' check(status in ('queued','sending','sent','failed','uncertain')),
 attempts integer not null default 0 check(attempts between 0 and 5), available_at timestamptz not null default now(),
 lease_until timestamptz, lease_token uuid, provider_id text, sent_at timestamptz, delivered_at timestamptz,
 check(num_nonnulls(order_id,enquiry_id)=1)
);
create table netbud.outbox_attempts (id bigint generated always as identity primary key, outbox_id uuid not null references netbud.outbox, attempt integer not null, outcome text not null check(outcome in ('sent','retry','failed','uncertain')), at timestamptz not null default now(), unique(outbox_id,attempt));
create table netbud.otp_challenges (id uuid primary key default gen_random_uuid(), email_hash text not null, code_hmac text not null, expires_at timestamptz not null, attempts integer not null default 0 check(attempts between 0 and 5), consumed_at timestamptz);
create table netbud.guest_sessions (token_hash text primary key, customer_id uuid not null references netbud.customers, expires_at timestamptz not null, revoked_at timestamptz);
create table netbud.rate_limits (key text primary key, count integer not null check(count>0), expires_at timestamptz not null);

create function netbud.immutable() returns trigger language plpgsql set search_path='' as $$ begin raise exception 'immutable_record'; end $$;
do $$ declare t text; begin
 foreach t in array array['payments','invoices','quote_versions','quote_acceptances','artwork_approvals','audit','outbox_attempts'] loop
 execute format('create trigger immutable_record before update or delete on netbud.%I for each row execute function netbud.immutable()',t);
 end loop;
 for t in select tablename from pg_tables where schemaname='netbud' loop
 execute format('alter table netbud.%I enable row level security',t);
 execute format('revoke all on netbud.%I from public,anon,authenticated',t);
 end loop;
end $$;
revoke all on all functions in schema netbud from public,anon,authenticated;
revoke all on all sequences in schema netbud from public,anon,authenticated;
alter default privileges in schema netbud revoke execute on functions from public;
commit;
