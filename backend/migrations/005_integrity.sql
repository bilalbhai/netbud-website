begin;
create function netbud.check_artwork_approval() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from netbud.artwork a join netbud.order_items i on i.id=a.item_id join netbud.orders o on o.id=i.order_id
 where a.id=new.artwork_id and a.state='validated' and o.customer_id=new.customer_id) then raise exception 'invalid_artwork_approval'; end if;
 return new;
end $$;
create trigger approval_owner before insert on netbud.artwork_approvals for each row execute function netbud.check_artwork_approval();
create function netbud.check_allocation() returns trigger language plpgsql set search_path='' as $$
declare p netbud.payments; item_order uuid; begin
 select * into p from netbud.payments where id=new.payment_id for update;
 select order_id into item_order from netbud.order_items where id=new.item_id;
 if item_order is distinct from p.order_id or p.status<>'confirmed' or p.kind='refund' or
 new.amount_cents+coalesce((select sum(amount_cents) from netbud.payment_allocations where payment_id=new.payment_id),0)>p.amount_cents then raise exception 'invalid_allocation'; end if;
 return new;
end $$;
create trigger allocation_integrity before insert on netbud.payment_allocations for each row execute function netbud.check_allocation();
create trigger immutable_allocation before update or delete on netbud.payment_allocations for each row execute function netbud.immutable();
create function netbud.protect_line_snapshot() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.order_id,new.product_id,new.quantity,new.snapshot,new.amount_cents) is distinct from (old.order_id,old.product_id,old.quantity,old.snapshot,old.amount_cents) then raise exception 'immutable_record'; end if;
 return new;
end $$;
create trigger protect_line_snapshot before update on netbud.order_items for each row execute function netbud.protect_line_snapshot();
revoke all on function netbud.check_artwork_approval(),netbud.check_allocation(),netbud.protect_line_snapshot() from public,anon,authenticated;
commit;
