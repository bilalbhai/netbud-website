-- READ ONLY. Run only after the management integration confirms project ref
-- pzorzppbxgqespexuers, name netbud-staging and ACTIVE_HEALTHY.
-- SQL's database name alone cannot establish the Supabase project identity.
begin read only;
select current_setting('server_version') as postgres_version,
       to_regprocedure('pg_catalog.gen_random_uuid()') is not null as native_uuid_available,
       to_regclass('auth.users') is not null as auth_users_present,
       to_regclass('auth.sessions') is not null as auth_sessions_present,
       to_regclass('storage.buckets') is not null as storage_buckets_present,
       to_regclass('supabase_migrations.schema_migrations') is not null as migration_ledger_present;

select nspname as application_schema from pg_namespace where nspname='netbud';
select n.nspname as schema_name,c.relname,c.relkind,c.relrowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='netbud' or (n.nspname='public' and c.relkind in ('r','p','v','m'))
order by 1,2;

select p.oid::regprocedure::text as signature,p.prosecdef,p.proconfig
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and left(p.proname,7)='netbud_'
order by 1;

select table_schema,table_name,column_name,data_type
from information_schema.columns
where (table_schema='auth' and
      ((table_name='users' and column_name in ('id','email','email_confirmed_at')) or
       (table_name='sessions' and column_name in ('id','user_id','created_at','not_after'))))
   or (table_schema='storage' and table_name='buckets' and
       column_name in ('id','name','public','file_size_limit','allowed_mime_types'))
order by 1,2,3;

select rolname from pg_roles where rolname in ('anon','authenticated','service_role','postgres');
select extname,extversion from pg_extension order by extname;
select evtname,evtevent,evtenabled from pg_event_trigger order by evtname;
select defaclrole::regrole::text as creator,n.nspname as schema_name,
       defaclobjtype,defaclacl::text
from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
where d.defaclnamespace=0 or n.nspname in ('public','netbud');
commit;

-- After verifying the managed table exists, separately inspect ONLY the intended
-- bucket: select id,public,file_size_limit,allowed_mime_types
-- from storage.buckets where id='netbud-artwork';
-- Read migration history using the authorised list_migrations connector.
-- Do not select customer records, credentials, Auth hashes, refresh tokens or MFA secrets.
