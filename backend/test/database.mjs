import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {mapDatabaseError} from '../src/repository.mjs';
export const actors={owner:'10000000-0000-4000-8000-000000000001',designer:'10000000-0000-4000-8000-000000000002',fulfilment:'10000000-0000-4000-8000-000000000003',support:'10000000-0000-4000-8000-000000000004',stranger:'10000000-0000-4000-8000-000000000005'};
export async function database() {
  const db=new PGlite();
  // Test-only Supabase catalogues. Auth service/JWT verification and Storage HTTP are NOT emulated.
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key); create table auth.sessions(id uuid primary key,user_id uuid,created_at timestamptz not null default now(),not_after timestamptz);
    create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key,bucket_id text references storage.buckets,name text); alter table storage.objects enable row level security; grant usage on schema storage to anon,authenticated; grant select,insert,update,delete on storage.objects to anon,authenticated;`);
  for(const file of (await readdir(new URL('../migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()) {
    try {await db.exec(await readFile(new URL(`../migrations/${file}`,import.meta.url),'utf8'));} catch(e){await db.exec('rollback');throw e;}
  }
  // Test fixture activation only: migrations leave the entire production catalogue inactive.
  await db.exec("update netbud.products set active=true,sale_mode=case when physical then 'fixed' else 'quote' end");
  for(const [role,id] of Object.entries(actors)) {await db.query('insert into auth.users values($1)',[id]);if(role!=='stranger')await db.query('insert into netbud.staff(user_id,role) values($1,$2)',[id,role]);}
  const repo={async rpc(name,args={}) {
    if(!/^netbud_[a-z_]+$/.test(name))throw Error('Invalid test RPC');
    const entries=Object.entries(args),params=entries.map(([key],i)=>`${key}=>$${i+1}`).join(',');
    try{return (await db.query(`select public.${name}(${params}) as result`,entries.map(([,value])=>typeof value==='object'&&value!==null?JSON.stringify(value):value))).rows[0].result;}catch(e){throw mapDatabaseError(e);}
  }};
  return {db,repo};
}
export const order=(email='customer@example.test')=>({customer:{name:'Test Customer',email,phone:'0000000000'},items:[{product_id:5,quantity:1}],delivery:'pickup'});
