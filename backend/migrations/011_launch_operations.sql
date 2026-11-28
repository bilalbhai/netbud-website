begin;
-- All launch RPCs remain service-role only. No schedules or public activation.
alter table netbud.outbox add column encrypted_payload jsonb,
 add column launch_managed boolean not null default false,
 add column first_attempt_at timestamptz, add column accepted_at timestamptz;
alter table netbud.outbox drop constraint outbox_status_check;
alter table netbud.outbox add constraint outbox_status_check check(status in ('queued','sending','sent','failed','uncertain','accepted','delivered','bounced','expired'));
create table netbud.mail_budget(period text primary key, attempts integer not null check(attempts>=0));
create table netbud.mail_events(event_id text primary key, outbox_id uuid not null references netbud.outbox, kind text not null, received_at timestamptz not null default now());
create unique index outbox_provider_unique on netbud.outbox(provider_id) where provider_id is not null;
-- Outbox business keys already use global request UUIDs. Make the matching draft lookup unambiguous.
create unique index admin_request_global_key on netbud.admin_requests(key);
create table netbud.bot_tokens(hash text primary key check(hash~'^[a-f0-9]{64}$'), expires_at timestamptz not null);
create table netbud.artwork_reservations(id uuid primary key,order_id uuid not null references netbud.orders,bytes bigint not null check(bytes between 1 and 10000000),expires_at timestamptz not null);
create table netbud.retention_jobs(order_id uuid primary key references netbud.orders,notice_id uuid references netbud.outbox,legal_hold boolean not null default false,state text not null default 'waiting' check(state in ('waiting','deleting','deleted','failed')),last_error text,updated_at timestamptz not null default now());
do $$ declare t text;begin foreach t in array array['mail_budget','mail_events','bot_tokens','artwork_reservations','retention_jobs'] loop
execute format('alter table netbud.%I enable row level security',t);end loop;end $$;

create function public.netbud_launch_attach_otp(p_id uuid,p_payload jsonb) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or coalesce(p_payload->>'v','')<>'1' or coalesce(p_payload->>'iv','')!~'^[a-f0-9]{24}$' or coalesce(p_payload->>'cipher','')!~'^[a-f0-9]+$' or length(coalesce(p_payload->>'cipher','')) not between 32 and 1024 then raise exception 'invalid_input';end if;
 update netbud.outbox m set encrypted_payload=p_payload,launch_managed=true from netbud.otp_challenges c
 where m.challenge_id=p_id and c.id=p_id and c.expires_at>now() and c.consumed_at is null and m.status='queued' and m.encrypted_payload is null;
 return found;
end $$;

-- Preserve Phase B's mock dispatcher while ensuring it cannot claim a launch-managed message.
create or replace function public.netbud_claim_mail() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox;begin
 perform pg_advisory_xact_lock(708134);
 update netbud.outbox set status='uncertain',lease_token=null where status='sending' and lease_until<now();
 if (select count(*) from netbud.outbox where sent_at>=date_trunc('day',now()) or (status='sending' and lease_until>=now())) >= (select email_daily_max from netbud.limits) then return null;end if;
 select * into m from netbud.outbox where status='queued' and not launch_managed and available_at<=now() and attempts<5 order by available_at,id for update skip locked limit 1;
 if not found then return null;end if;
 update netbud.outbox set status='sending',attempts=attempts+1,lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid() where id=m.id returning * into m;return to_jsonb(m);
end $$;

create function public.netbud_launch_claim() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox;daily text:='d:'||to_char(now() at time zone 'UTC','YYYY-MM-DD');monthly text:='m:'||to_char(now() at time zone 'UTC','YYYY-MM');used integer;begin
 perform pg_advisory_xact_lock(708134);
 update netbud.outbox set status='uncertain',lease_token=null,encrypted_payload=null where launch_managed and status='sending' and lease_until<now();
 update netbud.outbox msg set status='expired',encrypted_payload=null where msg.status='queued' and msg.challenge_id is not null and exists(select 1 from netbud.otp_challenges c where c.id=msg.challenge_id and (c.expires_at<=now()+interval '5 seconds' or c.consumed_at is not null));
 update netbud.outbox set status='uncertain',encrypted_payload=null where launch_managed and status='queued' and first_attempt_at<now()-interval '23 hours';
 select * into m from netbud.outbox where status='queued' and available_at<=now() and attempts<5 and (challenge_id is null or encrypted_payload is not null) order by (challenge_id is not null) desc,available_at,id for update skip locked limit 1;
 if not found then return null;end if;
 insert into netbud.mail_budget values(daily,0),(monthly,0) on conflict do nothing;
 select attempts into used from netbud.mail_budget where period=daily;
 -- Pessimistically budget every attempt, including retry/uncertain calls. Reserve 20 daily slots for OTP.
 if used>=least((select email_daily_max from netbud.limits),90)-(case when m.challenge_id is null then 20 else 0 end)
 or (select attempts from netbud.mail_budget where period=monthly)>=2700 then return null;end if;
 update netbud.mail_budget set attempts=attempts+1 where period in (daily,monthly);
 update netbud.outbox set launch_managed=true,status='sending',attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()),lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid() where id=m.id returning * into m;
 return to_jsonb(m);
end $$;

create function public.netbud_launch_context(p_id uuid,p_lease uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox;d jsonb;q jsonb;begin
 select * into m from netbud.outbox where id=p_id and launch_managed and status='sending' and lease_token=p_lease and lease_until>now();
 if not found then raise exception 'invalid_lease';end if;
 if m.challenge_id is not null then
 if not exists(select 1 from netbud.otp_challenges where id=m.challenge_id and consumed_at is null and expires_at>now()+interval '5 seconds') then return null;end if;
 return '{}'::jsonb;end if;
 if m.dedupe_key like 'admin:%' then select response->'draft' into d from netbud.admin_requests where key=substring(m.dedupe_key from 7)::uuid;end if;
 if m.message_type='quote_prepared' then
 select jsonb_build_object('version',v.version,'amount_cents',v.total_cents,'scope',v.scope,'valid_until',v.expires_at) into q
 from netbud.quote_versions v join netbud.quote_workflow w on w.version_id=v.id join netbud.quotes z on z.id=v.quote_id
 where v.id=substring(m.dedupe_key from 7)::uuid and w.stage='prepared' and z.order_id=m.order_id;
 end if;
 return jsonb_build_object('reference','NB-'||upper(m.order_id::text),'draft',d,'quote',q);
end $$;

create function public.netbud_launch_finish(p_id uuid,p_lease uuid,p_outcome text,p_provider text default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox;next_state text;begin
 select * into m from netbud.outbox where id=p_id for update;
 if not m.launch_managed or m.status is distinct from 'sending' or m.lease_token is distinct from p_lease or m.lease_until<now() then raise exception 'invalid_lease';end if;
 if p_outcome is null or p_outcome not in ('accepted','retry','uncertain','failed') or (p_outcome='accepted' and nullif(p_provider,'') is null) then raise exception 'invalid_input';end if;
 next_state:=case when p_outcome='retry' then case when m.attempts>=5 then 'failed' else 'queued' end else p_outcome end;
 update netbud.outbox set status=next_state,lease_token=null,lease_until=null,provider_id=p_provider,
 accepted_at=case when p_outcome='accepted' then now() else null end,
 encrypted_payload=case when next_state='queued' then encrypted_payload else null end,
 available_at=now()+make_interval(secs=>least(3600,30*power(2,m.attempts)::int)) where id=p_id;
 insert into netbud.outbox_attempts(outbox_id,attempt,outcome) values(p_id,m.attempts,case when p_outcome='accepted' then 'sent' when next_state='queued' then 'retry' else next_state end);
 -- Legacy attempts 'sent' means mock/API handoff only; delivered_at requires a verified event.
 return true;
end $$;

create function public.netbud_launch_event(p_event text,p_provider text,p_kind text) returns boolean
language plpgsql security definer set search_path='' as $$
declare mid uuid;begin
 if length(p_event) not between 1 and 200 or p_kind not in ('email.delivered','email.bounced','email.failed','email.complained') then raise exception 'invalid_input';end if;
 select id into mid from netbud.outbox where provider_id=p_provider and launch_managed for update;
 if not found then return false;end if; -- Caller must retry unknown IDs: webhook can race API completion.
 insert into netbud.mail_events(event_id,outbox_id,kind) values(p_event,mid,p_kind) on conflict do nothing;
 if not found then return true;end if;
 update netbud.outbox set status=case when p_kind='email.delivered' and status not in ('bounced','failed') then 'delivered' when p_kind='email.delivered' then status when p_kind='email.failed' then 'failed' else 'bounced' end,
 delivered_at=case when p_kind='email.delivered' then coalesce(delivered_at,now()) else delivered_at end where id=mid;
 return true;
end $$;

create function public.netbud_launch_bot_once(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 delete from netbud.bot_tokens where expires_at<now();
 insert into netbud.bot_tokens values(p_hash,now()+interval '6 minutes') on conflict do nothing;return found;
end $$;

create function public.netbud_launch_ops(p_actor uuid) returns jsonb
language plpgsql security definer set search_path='' as $$ begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 return jsonb_build_object('mail',(select coalesce(jsonb_object_agg(status,n),'{}') from (select status,count(*) n from netbud.outbox group by status) s),
 'budget',(select coalesce(jsonb_object_agg(period,attempts),'{}') from netbud.mail_budget),
 'database_bytes',pg_database_size(current_database()),'database_soft_bytes',(select database_soft_bytes from netbud.limits),
 'storage_bytes',(select coalesce(sum(bytes),0) from netbud.artwork where state<>'deleted'),
 'reserved_bytes',(select coalesce(sum(bytes),0) from netbud.artwork_reservations where expires_at>now()),
 'storage_max_bytes',(select storage_max_bytes from netbud.limits),'uploads_enabled',(select uploads_enabled from netbud.limits),
 'retention_failed',(select count(*) from netbud.retention_jobs where state='failed'));
end $$;

create function public.netbud_launch_reserve(p_id uuid,p_order uuid,p_bytes bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare total bigint;begin
 perform pg_advisory_xact_lock(708135);
 if not (select uploads_enabled from netbud.limits) then raise exception 'artwork_validation_unavailable';end if;
 if p_bytes not between 1 and 10000000 or not exists(select 1 from netbud.orders where id=p_order and status in ('received','accepted')) then raise exception 'invalid_input';end if;
 delete from netbud.artwork_reservations where expires_at<=now();
 if exists(select 1 from netbud.artwork_reservations where id=p_id and order_id=p_order and bytes=p_bytes) then return true;end if;
 select coalesce(sum(bytes),0) into total from netbud.artwork where state<>'deleted';
 if total+(select coalesce(sum(bytes),0) from netbud.artwork_reservations)+p_bytes>(select storage_max_bytes from netbud.limits) then raise exception 'capacity_unavailable';end if;
 if (select count(*) from netbud.artwork_reservations where order_id=p_order)+(select count(*) from netbud.artwork a join netbud.order_items i on i.id=a.item_id where i.order_id=p_order and a.state<>'deleted')>=10 then raise exception 'capacity_unavailable';end if;
 insert into netbud.artwork_reservations values(p_id,p_order,p_bytes,now()+interval '10 minutes');return true;
end $$;

-- Dry preparation only. Deletion remains blocked until notice delivery, legal-hold and storage adapters are verified.
create function public.netbud_launch_retention_prepare() returns integer
language plpgsql security definer set search_path='' as $$
declare o record;mid uuid;n integer:=0;begin
 perform pg_advisory_xact_lock(708136);
 for o in select z.id,c.email from netbud.orders z join netbud.customers c on c.id=z.customer_id
 where z.status='completed' and z.completed_at<=now()-interval '83 days' and exists(select 1 from netbud.artwork a join netbud.order_items i on i.id=a.item_id where i.order_id=z.id and a.state<>'deleted')
 loop
 insert into netbud.retention_jobs(order_id) values(o.id) on conflict do nothing;
 if (select legal_hold or state in ('deleting','deleted') from netbud.retention_jobs where order_id=o.id) then continue;end if;
 insert into netbud.outbox(dedupe_key,message_type,recipient,order_id,launch_managed) values('retention:'||o.id,'artwork_retention',o.email,o.id,true) on conflict(dedupe_key) do nothing;
 select id into mid from netbud.outbox where dedupe_key='retention:'||o.id;
 update netbud.retention_jobs set notice_id=mid where order_id=o.id;n:=n+1;
 end loop;return n;
end $$;
create function public.netbud_launch_retention_candidates() returns jsonb
language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('order_id',o.id,'artwork_id',a.id,'object_key',a.object_key)),'[]')
 from netbud.retention_jobs j join netbud.orders o on o.id=j.order_id join netbud.outbox m on m.id=j.notice_id
 join netbud.order_items i on i.order_id=o.id join netbud.artwork a on a.item_id=i.id
 where not j.legal_hold and j.state in ('waiting','failed') and o.status='completed' and o.completed_at<=now()-interval '90 days'
 and m.status='delivered' and m.delivered_at<=now()-interval '7 days' and a.state<>'deleted'
$$;
-- No delete RPC: reliable hold/deletion fencing with hosted object storage is a launch blocker.
do $$ declare f record;begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname like 'netbud_launch_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);end loop;
end $$;
commit;
