begin;
alter table netbud.otp_challenges add column customer_id uuid references netbud.customers;
alter table netbud.guest_sessions alter column customer_id drop not null;
alter table netbud.outbox add column challenge_id uuid references netbud.otp_challenges;
do $$ declare c text;begin
select conname into c from pg_constraint where conrelid='netbud.outbox'::regclass and pg_get_constraintdef(oid) like '%num_nonnulls%';
execute format('alter table netbud.outbox drop constraint %I',c);
end $$;
alter table netbud.outbox add constraint outbox_one_source check(num_nonnulls(order_id,enquiry_id,challenge_id)=1);
create index otp_email on netbud.otp_challenges(email_hash);
create index customer_orders on netbud.orders(customer_id,created_at);

create function public.netbud_otp_begin(p_id uuid,p_email text,p_email_hash text,p_hmac text,p_network text) returns boolean
language plpgsql security definer set search_path='' as $$
declare a boolean;b boolean;c boolean;d boolean;begin
 if p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$' or length(p_hmac)<>64 then raise exception 'invalid_input';end if;
 a:=public.netbud_rate('otp:email:minute:'||p_email_hash,1,60);
 b:=public.netbud_rate('otp:email:hour:'||p_email_hash,5,3600);
 c:=public.netbud_rate('otp:network:'||p_network,20,3600);
 d:=public.netbud_rate('otp:global',80,86400);
 if not (a and b and c and d) then return false;end if;
 -- Serialize replacement codes for the same address; no account existence response.
 perform pg_advisory_xact_lock(hashtextextended(p_email_hash,0));
 update netbud.otp_challenges set consumed_at=now() where email_hash=p_email_hash and consumed_at is null;
 insert into netbud.otp_challenges(id,email_hash,code_hmac,expires_at,customer_id)
 values(p_id,p_email_hash,p_hmac,now()+interval '5 minutes',(select id from netbud.customers where email=p_email));
 insert into netbud.outbox(dedupe_key,message_type,recipient,challenge_id,available_at) values('otp:'||p_id,'email_otp',p_email,p_id,now()-interval '1 hour');
 return true;
end $$;
create function public.netbud_otp_verify(p_id uuid,p_hmac text,p_token_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare ch netbud.otp_challenges;begin
 select * into ch from netbud.otp_challenges where id=p_id for update;
 if not found or ch.consumed_at is not null or ch.expires_at<=now() or ch.attempts>=5 then return false;end if;
 update netbud.otp_challenges set attempts=attempts+1 where id=p_id;
 if ch.code_hmac is distinct from p_hmac then return false;end if;
 update netbud.otp_challenges set consumed_at=now() where id=p_id;
 insert into netbud.guest_sessions(token_hash,customer_id,expires_at) values(p_token_hash,ch.customer_id,now()+interval '30 minutes');
 return true;
end $$;
create function public.netbud_guest_orders(p_hash text,p_order uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cid uuid; result jsonb;begin
 select customer_id into cid from netbud.guest_sessions where token_hash=p_hash and revoked_at is null and expires_at>now();
 if not found then return jsonb_build_object('authenticated',false);end if;
 select coalesce(jsonb_agg(row_data order by created_at desc),'[]') into result from (
 select o.created_at,jsonb_build_object('id',o.id,'reference','NB-'||upper(o.id::text),'created_at',o.created_at,'status',o.status,
 'total_cents',o.total_cents,'shipping_cents',o.shipping_cents,'currency',o.currency,'delivery',o.delivery,'address',o.address,
 'received_cents',coalesce((select sum(case when p.kind='refund' then -p.amount_cents else p.amount_cents end) from netbud.payments p where p.order_id=o.id and p.status='confirmed'),0),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.snapshot->>'name','quantity',i.quantity,'amount_cents',i.amount_cents,'tax_class',i.snapshot->>'tax_class','payment_status',i.payment_status,'quote_status',i.quote_status,'artwork_status',i.artwork_status,'production_status',i.fulfilment_status)),'[]') from netbud.order_items i where i.order_id=o.id),
 'shipments',(select coalesce(jsonb_agg(jsonb_build_object('tracking',s.tracking,'status',s.status,'updated_at',s.updated_at)),'[]') from netbud.deliveries s where s.order_id=o.id),
 'timeline',(select coalesce(jsonb_agg(jsonb_build_object('message',u.message,'created_at',u.created_at) order by u.created_at),'[]') from netbud.customer_updates u where u.order_id=o.id)
 ) row_data from netbud.orders o where o.customer_id=cid and (p_order is null or o.id=p_order)
 ) rows;
 return jsonb_build_object('authenticated',true,'orders',result);
end $$;
create function public.netbud_guest_logout(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 update netbud.guest_sessions set revoked_at=now() where token_hash=p_hash and revoked_at is null;return true;
end $$;
do $$ declare f record;begin
for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in ('netbud_otp_begin','netbud_otp_verify','netbud_guest_orders','netbud_guest_logout') loop
execute format('revoke all on function %s from public,anon,authenticated',f.signature);
execute format('grant execute on function %s to service_role',f.signature);
end loop;end $$;
commit;
