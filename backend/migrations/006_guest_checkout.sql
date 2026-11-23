begin;
alter table netbud.orders add column customisation jsonb not null default '[]' check(jsonb_typeof(customisation)='array' and jsonb_array_length(customisation)<=5);
alter function public.netbud_create(jsonb,uuid,text) rename to netbud_create_base;
revoke all on function public.netbud_create_base(jsonb,uuid,text) from service_role;
create function public.netbud_create(p_body jsonb,p_key uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; d jsonb; designs jsonb:=coalesce(p_body->'designs','[]'); begin
 if jsonb_typeof(designs)<>'array' or jsonb_array_length(designs)>5 then raise exception 'invalid_input'; end if;
 for d in select * from jsonb_array_elements(designs) loop
 if (d->>'product_id')::int not in (5,10) or coalesce(length(d->>'name'),0) not between 1 and 120 or coalesce(length(d->>'instructions'),0)>1000
 or not exists(select 1 from jsonb_array_elements(p_body->'items') i where i->>'product_id'=d->>'product_id' and (i->>'quantity')::int >= (select count(*) from jsonb_array_elements(designs) z where z->>'product_id'=d->>'product_id')) then raise exception 'invalid_input';end if;
 end loop;
 result:=public.netbud_create_base(p_body-'designs',p_key,p_hash);
 if not (result->>'replayed')::boolean then update netbud.orders set customisation=designs where id=(result->>'id')::uuid;end if;
 return result||jsonb_build_object('reference','NB-'||upper(result->>'id'),'payment_status','pending_payment','approval_status','pending_owner_review');
end $$;
create function public.netbud_catalogue() returns jsonb language sql security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'price_cents',price_cents,'physical',physical,'sale_mode',sale_mode) order by id),'[]') from netbud.products where active;
$$;
create function public.netbud_estimate(p_items jsonb,p_delivery text) returns jsonb language plpgsql security definer set search_path='' as $$
declare x jsonb;p netbud.products; subtotal int:=0; physical int:=0; shipping int:=0; lines jsonb:='[]'; begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 20 or p_delivery not in ('shipping','pickup','none') then raise exception 'invalid_input';end if;
 for x in select * from jsonb_array_elements(p_items) loop
 select * into p from netbud.products where id=(x->>'product_id')::int and active;
 if not found or (x->>'quantity')::int not between 1 and 100 then raise exception 'invalid_product';end if;
 if p.sale_mode<>'quote' then subtotal:=subtotal+p.price_cents*(x->>'quantity')::int;if p.physical then physical:=physical+p.price_cents*(x->>'quantity')::int;end if;end if;
 lines:=lines||jsonb_build_array(jsonb_build_object('name',p.name,'quantity',(x->>'quantity')::int,'quote_required',p.sale_mode='quote','amount_cents',case when p.sale_mode='quote' then 0 else p.price_cents*(x->>'quantity')::int end));
 end loop;
 if p_delivery='shipping' and physical<9900 then shipping:=1495;end if;
 return jsonb_build_object('items',lines,'physical_cents',physical,'shipping_cents',shipping,'total_cents',subtotal+shipping);
end $$;
revoke all on function public.netbud_create(jsonb,uuid,text),public.netbud_catalogue(),public.netbud_estimate(jsonb,text) from public,anon,authenticated;
grant execute on function public.netbud_create(jsonb,uuid,text),public.netbud_catalogue(),public.netbud_estimate(jsonb,text) to service_role;
commit;
