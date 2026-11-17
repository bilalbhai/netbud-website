begin;
create function public.netbud_claim_mail() returns jsonb
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox; begin
 perform pg_advisory_xact_lock(708134);
 -- An expired send lease is ambiguous, never automatically resend it.
 update netbud.outbox set status='uncertain',lease_token=null where status='sending' and lease_until<now();
 if (select count(*) from netbud.outbox where sent_at>=date_trunc('day',now()) or (status='sending' and lease_until>=now())) >= (select email_daily_max from netbud.limits) then return null; end if;
 select * into m from netbud.outbox where status='queued' and available_at<=now() and attempts<5 order by available_at,id for update skip locked limit 1;
 if not found then return null; end if;
 update netbud.outbox set status='sending',attempts=attempts+1,lease_until=now()+interval '60 seconds',lease_token=gen_random_uuid() where id=m.id returning * into m;
 return to_jsonb(m);
end $$;
create function public.netbud_finish_mail(p_id uuid,p_lease uuid,p_outcome text,p_provider text default null) returns boolean
language plpgsql security definer set search_path='' as $$
declare m netbud.outbox; begin
 select * into m from netbud.outbox where id=p_id for update;
 if m.status is distinct from 'sending' or m.lease_token is distinct from p_lease or m.lease_until<now() then raise exception 'invalid_lease'; end if;
 if p_outcome not in ('sent','retry','uncertain') or p_outcome is null then raise exception 'invalid_input'; end if;
 update netbud.outbox set status=case when p_outcome='retry' then case when attempts>=5 then 'failed' else 'queued' end else p_outcome end,
 available_at=now()+make_interval(secs=>least(3600,30*power(2,m.attempts)::int)),lease_token=null,lease_until=null,
 provider_id=p_provider,sent_at=case when p_outcome='sent' then now() else null end where id=p_id;
 insert into netbud.outbox_attempts(outbox_id,attempt,outcome) values(p_id,m.attempts,case when p_outcome='retry' and m.attempts>=5 then 'failed' else p_outcome end);
 return true;
end $$;
revoke all on function public.netbud_claim_mail() from public,anon,authenticated;
revoke all on function public.netbud_finish_mail(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.netbud_claim_mail(),public.netbud_finish_mail(uuid,uuid,text,text) to service_role;
-- Supabase's storage schema exists in local Supabase. Test harness supplies only its catalogue shape.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('netbud-artwork','netbud-artwork',false,10000000,array['image/jpeg','image/png']);
-- No storage.objects client policies are granted. Buckets and object paths must remain inaccessible
-- to anon/authenticated. Upload/sign routes deliberately do not exist until decoder validation passes.
commit;
