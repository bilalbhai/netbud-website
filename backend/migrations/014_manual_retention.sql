begin;
alter table netbud.retention_jobs add column deletion_evidence text,add column deleted_at timestamptz;
-- Manual proof archives need the same advance notice as future uploaded artwork.
do $$ declare definition text;changed text;begin
 definition:=pg_get_functiondef('public.netbud_launch_retention_prepare()'::regprocedure);
 changed:=replace(definition,$old$and exists(select 1 from netbud.artwork a join netbud.order_items i on i.id=a.item_id where i.order_id=z.id and a.state<>'deleted')$old$,$new$and (exists(select 1 from netbud.artwork a join netbud.order_items i on i.id=a.item_id where i.order_id=z.id and a.state<>'deleted') or exists(select 1 from netbud.manual_proofs p join netbud.order_items i on i.id=p.item_id where i.order_id=z.id))$new$);
 if changed=definition then raise exception 'migration_predicate_mismatch';end if;execute changed;
end $$;
create function public.netbud_manual_retention_status(p_actor uuid,p_order uuid) returns jsonb language plpgsql security definer set search_path='' as $$ begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 return coalesce((select to_jsonb(j)||jsonb_build_object('ready',not j.legal_hold and j.state in ('waiting','failed') and o.status='completed' and o.completed_at<=now()-interval '90 days' and m.status='delivered' and m.delivered_at<=now()-interval '7 days') from netbud.retention_jobs j join netbud.orders o on o.id=j.order_id left join netbud.outbox m on m.id=j.notice_id where j.order_id=p_order),'{"state":"not_scheduled","ready":false}'::jsonb);
end $$;
create function public.netbud_manual_retention(p_actor uuid,p_action text,p_data jsonb,p_key uuid,p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;prior_hash text;o netbud.orders;j netbud.retention_jobs;begin
 if public.netbud_staff(p_actor)<>'owner' then raise exception 'access_denied';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_key::text,0));
 select response,hash into result,prior_hash from netbud.admin_requests where actor=p_actor and key=p_key;
 if found then if prior_hash<>p_hash then raise exception 'idempotency_conflict';end if;return result;end if;
 select * into o from netbud.orders where id=(p_data->>'order_id')::uuid for update;if not found then raise exception 'invalid_input';end if;
 insert into netbud.retention_jobs(order_id) values(o.id) on conflict do nothing;
 select * into j from netbud.retention_jobs where order_id=o.id for update;
 if p_action='retention_hold' then
 if p_data->>'hold' not in ('true','false') or length(coalesce(p_data->>'reason','')) not between 5 and 500 or j.state='deleted' then raise exception 'invalid_input';end if;
 update netbud.retention_jobs set legal_hold=(p_data->>'hold')::boolean,updated_at=now() where order_id=o.id;
 result:=jsonb_build_object('status','owner_recorded_retention_hold','hold',(p_data->>'hold')::boolean);
 elsif p_action='retention_record' then
 if not coalesce((public.netbud_manual_retention_status(p_actor,o.id)->>'ready')::boolean,false) or p_data->>'verified' is distinct from 'true' or length(coalesce(p_data->>'evidence','')) not between 5 and 500 then raise exception 'invalid_transition';end if;
 -- This records the owner's actual external deletion. It never pretends to delete email/off-site bytes.
 update netbud.retention_jobs set state='deleted',deletion_evidence=p_data->>'evidence',deleted_at=now(),updated_at=now() where order_id=o.id;
 result:=jsonb_build_object('status','owner_attested_external_artwork_deletion');
 else raise exception 'invalid_input';end if;
 insert into netbud.admin_requests values(p_actor,p_key,p_hash,result);
 insert into netbud.audit(actor,action,order_id,metadata) values(p_actor,p_action,o.id,jsonb_build_object('method','owner_attestation','hold',p_data->'hold','private_evidence_reference',coalesce(p_data->>'reason',p_data->>'evidence')));
 return result;
end $$;
revoke all on function public.netbud_manual_retention_status(uuid,uuid),public.netbud_manual_retention(uuid,text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.netbud_manual_retention_status(uuid,uuid),public.netbud_manual_retention(uuid,text,jsonb,uuid,text) to service_role;
commit;
