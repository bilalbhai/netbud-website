begin;
-- Only the trusted server can execute these RPCs. Actor UUIDs come from verified Auth tokens, never JSON bodies.
create function public.netbud_staff(p_actor uuid) returns text
language plpgsql security definer set search_path='' as $$
declare r text; begin
 select role into r from netbud.staff where user_id=p_actor and active;
 if r is null then raise exception 'access_denied'; end if; return r;
end $$;
create function public.netbud_rate(p_key text,p_max integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path='' as $$
declare n integer; begin
 if p_max<1 or p_seconds<1 or p_max is null or p_seconds is null or p_key is null or length(p_key)>160 then raise exception 'invalid_input'; end if;
 if p_key='global:requests' then select request_daily_max into p_max from netbud.limits; end if;
 delete from netbud.rate_limits where key in (select key from netbud.rate_limits where expires_at<now() limit 100);
 insert into netbud.rate_limits as b values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=case when b.expires_at<=now() then 1 else b.count+1 end,
 expires_at=case when b.expires_at<=now() then excluded.expires_at else b.expires_at end returning count into n;
 return n<=p_max;
end $$;
create function public.netbud_create(p_body jsonb,p_key uuid,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o netbud.orders; c uuid; x jsonb; p netbud.products; subtotal integer:=0; physical integer:=0; shipping integer:=0; oid uuid; n integer; customer_email text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select * into o from netbud.orders where idempotency_key=p_key;
 if found then
 if o.request_hash<>p_hash then raise exception 'idempotency_conflict'; end if;
 return jsonb_build_object('id',o.id,'total_cents',o.total_cents,'status',o.status,'replayed',true); end if;
 if pg_database_size(current_database())>(select database_soft_bytes from netbud.limits) then raise exception 'capacity_unavailable'; end if;
 customer_email:=lower(trim(p_body->'customer'->>'email'));
 if p_key is null or p_hash is null or p_body is null or not (p_body ?& array['customer','items','delivery'])
 or not ((p_body->'customer') ?& array['email','name','phone'])
 or length(customer_email)>254 or customer_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.test$' or customer_email is null
 or length(trim(p_body->'customer'->>'name')) not between 1 and 120
 or length(p_body->'customer'->>'phone') not between 6 and 30
 or p_body->>'delivery' not in ('none','pickup','shipping')
 or jsonb_typeof(p_body->'items')<>'array' or jsonb_array_length(p_body->'items') not between 1 and 20 then raise exception 'invalid_input'; end if;
 for x in select * from jsonb_array_elements(p_body->'items') loop
 select * into p from netbud.products where id=(x->>'product_id')::integer and active for share;
 if not found then raise exception 'invalid_product'; end if;
 n:=(x->>'quantity')::integer;
 if n is null or n not between 1 and 100 then raise exception 'invalid_input'; end if;
 if p.sale_mode<>'quote' then subtotal:=subtotal+p.price_cents*n; if p.physical then physical:=physical+p.price_cents*n; end if; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_body->'items') elem join netbud.products pr on pr.id=(elem->>'product_id')::int where pr.physical) then
 if p_body->>'delivery' not in ('shipping','pickup') then raise exception 'invalid_delivery'; end if;
 if p_body->>'delivery'='shipping' then
 if p_body->'address'->>'country' is distinct from 'AU' or coalesce(length(p_body->'address'->>'line1'),0)<1
 or coalesce(length(p_body->'address'->>'suburb'),0)<1 or coalesce(p_body->'address'->>'state','') not in ('NSW','VIC','QLD','SA','WA','TAS','ACT','NT')
 or coalesce(p_body->'address'->>'postcode','') !~ '^[0-9]{4}$' then raise exception 'invalid_delivery'; end if;
 if physical<9900 then shipping:=1495; end if; end if;
 elsif p_body->>'delivery'<>'none' then raise exception 'invalid_delivery'; end if;
 insert into netbud.customers(email,name,phone,business) values(customer_email,p_body->'customer'->>'name',p_body->'customer'->>'phone',p_body->'customer'->>'business')
 on conflict(email) do update set email=excluded.email returning id into c;
 -- Existing contact records are not overwritten by an unverified guest.
 insert into netbud.orders(customer_id,idempotency_key,request_hash,total_cents,shipping_cents,delivery,address)
 values(c,p_key,p_hash,subtotal+shipping,shipping,p_body->>'delivery',case when p_body->>'delivery'='shipping' then p_body->'address' else null end) returning id into oid;
 for x in select * from jsonb_array_elements(p_body->'items') loop
 select * into p from netbud.products where id=(x->>'product_id')::int;
 insert into netbud.order_items(order_id,product_id,quantity,snapshot,amount_cents,quote_status,artwork_status)
 values(oid,p.id,(x->>'quantity')::int,jsonb_build_object('name',p.name,'price_cents',p.price_cents,'version',p.version,'tax_class',p.tax_class),
 case when p.sale_mode='quote' then 0 else p.price_cents*(x->>'quantity')::int end,
 case when p.sale_mode='quote' then 'awaiting_quote' else 'not_required' end,case when p.physical then 'awaiting' else 'not_required' end);
 end loop;
 insert into netbud.outbox(dedupe_key,message_type,recipient,order_id) values('received:'||oid,'order_received',customer_email,oid);
 return jsonb_build_object('id',oid,'total_cents',subtotal+shipping,'status','received','replayed',false);
end $$;
create function public.netbud_order(p_actor uuid,p_order uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r text; o netbud.orders; c netbud.customers; result jsonb; begin
 r:=public.netbud_staff(p_actor);
 if r<>'owner' and not exists(select 1 from netbud.assignments where user_id=p_actor and order_id=p_order) then raise exception 'access_denied'; end if;
 select * into o from netbud.orders where id=p_order;
 if not found then raise exception 'access_denied'; end if;
 select * into c from netbud.customers where id=o.customer_id;
 result:=jsonb_build_object('id',o.id,'status',o.status,'items',(select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.snapshot->>'name','quantity',i.quantity,'artwork_status',i.artwork_status,'fulfilment_status',i.fulfilment_status)),'[]') from netbud.order_items i where i.order_id=o.id));
 if r in ('owner','support') then result:=result||jsonb_build_object('customer',jsonb_build_object('name',c.name,'email',c.email,'phone',c.phone),'total_cents',o.total_cents); end if;
 if r in ('owner','fulfilment') then result:=result||jsonb_build_object('delivery',o.delivery,'address',o.address,'recipient',c.name,'phone',c.phone); end if;
 return result;
end $$;
create function public.netbud_update(p_actor uuid,p_order uuid,p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare old text; begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied'; end if;
 select status into old from netbud.orders where id=p_order for update;
 if old is null then raise exception 'access_denied'; end if;
 if not ((old='received' and p_status in ('accepted','cancelled')) or old=p_status) then raise exception 'invalid_transition'; end if;
 if old<>p_status then
 update netbud.orders set status=p_status where id=p_order;
 insert into netbud.audit(actor,action,order_id) values(p_actor,'order_'||p_status,p_order);
 insert into netbud.outbox(dedupe_key,message_type,recipient,order_id) select p_status||':'||p_order,'order_'||p_status,c.email,p_order from netbud.orders o join netbud.customers c on c.id=o.customer_id where o.id=p_order on conflict do nothing;
 end if;
 return jsonb_build_object('id',p_order,'status',p_status);
end $$;
create function public.netbud_artwork(p_actor uuid,p_order uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r text; begin
 perform public.netbud_order(p_actor,p_order); r:=public.netbud_staff(p_actor);
 if r not in ('owner','designer') then raise exception 'access_denied'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'item_id',a.item_id,'design',a.design,'slot',a.slot,'mime',a.mime,'bytes',a.bytes,'state',a.state)),'[]') from netbud.artwork a join netbud.order_items i on i.id=a.item_id where i.order_id=p_order);
end $$;
-- No customer lookup RPC or OTP route is exposed in Phase B.
do $$ declare f record; begin
 for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'netbud_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
commit;
