begin;
-- Customer projection retains its field allowlist, using accepted-quote totals only.
create or replace function public.netbud_guest_orders(p_hash text,p_order uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare cid uuid; result jsonb;begin
 select customer_id into cid from netbud.guest_sessions where token_hash=p_hash and revoked_at is null and expires_at>now();
 if not found then return jsonb_build_object('authenticated',false);end if;
 select coalesce(jsonb_agg(row_data order by created_at desc),'[]') into result from (
 select o.created_at,jsonb_build_object('id',o.id,'reference','NB-'||upper(o.id::text),'created_at',o.created_at,'status',o.status,
 'total_cents',(select effective_total from netbud.admin_orders where id=o.id),'shipping_cents',o.shipping_cents,'currency',o.currency,'delivery',o.delivery,'address',o.address,
 'received_cents',coalesce((select sum(case when p.kind='refund' then -p.amount_cents else p.amount_cents end) from netbud.payments p where p.order_id=o.id and p.status='confirmed'),0),
 'items',(select coalesce(jsonb_agg(jsonb_build_object('name',i.snapshot->>'name','quantity',i.quantity,'amount_cents',netbud.item_due(i.id),'tax_class',i.snapshot->>'tax_class','payment_status',i.payment_status,'quote_status',i.quote_status,'artwork_status',i.artwork_status,'production_status',i.fulfilment_status)),'[]') from netbud.order_items i where i.order_id=o.id),
 'shipments',(select coalesce(jsonb_agg(jsonb_build_object('tracking',s.tracking,'status',s.status,'updated_at',s.updated_at,'dispatched_at',s.dispatched_at,'carrier',s.carrier)),'[]') from netbud.deliveries s where s.order_id=o.id),
 'timeline',(select coalesce(jsonb_agg(jsonb_build_object('message',u.message,'created_at',u.created_at) order by u.created_at),'[]') from netbud.customer_updates u where u.order_id=o.id)
 ) row_data from netbud.orders o where o.customer_id=cid and (p_order is null or o.id=p_order)
 ) rows;
 return jsonb_build_object('authenticated',true,'orders',result);
end $$;
commit;
