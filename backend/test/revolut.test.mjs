import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {database,actors,order} from './database.mjs';
import {createRevolut,RevolutSandbox,verifyRevolutWebhook,reconcileRevolut} from '../src/revolut.mjs';
import {digest} from '../src/core.mjs';

const origin='https://netbud-staging.pages.dev';
const env={ENVIRONMENT:'staging',APP_ORIGIN:origin,REVOLUT_SANDBOX_APPROVED:'true',
 REVOLUT_WEBHOOK_APPROVED:'true',REVOLUT_MERCHANT_API_BASE_URL:'https://sandbox-merchant.revolut.com/',
 REVOLUT_MERCHANT_API_KEY:'synthetic-only',REVOLUT_WEBHOOK_SECRET:'synthetic-webhook-secret',RATE_LIMIT_HMAC_SECRET:'r'.repeat(64)};
const auth=async()=>({id:actors.owner,aal:'aal2',mfaAt:Date.now()/1000});
async function setup(){
 const f=await database();await f.db.exec(await readFile(new URL('../review/015_revolut_sandbox.sql',import.meta.url),'utf8'));return f;
}
async function accepted(repo, email='sandbox@example.test'){
 const o=await repo.rpc('netbud_create',{p_body:order(email),p_key:crypto.randomUUID(),p_hash:'fixture'});
 await repo.rpc('netbud_update',{p_actor:actors.owner,p_order:o.id,p_status:'accepted'});return o;
}
function reserve(repo,o,key=crypto.randomUUID(),extra={}){
 return repo.rpc('netbud_revolut',{p_action:'reserve',p_actor:actors.owner,p_data:{order_id:o.id,purpose:'balance',key,hash:'fixture',...extra}});
}
function request(path,body,key=crypto.randomUUID()){
 return new Request(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body)});
}
async function signed(body,secret=env.REVOLUT_WEBHOOK_SECRET,time=Date.now()){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('v1.'+time+'.'+body));
 return new Request(origin+'/api/revolut/events',{method:'POST',headers:{'Revolut-Request-Timestamp':String(time),'Revolut-Signature':'v1='+Buffer.from(mac).toString('hex')},body});
}
function canonical(i,overrides={}){
 return {id:'20000000-0000-4000-8000-000000000001',amount:i.amount_cents,currency:'AUD',state:'completed',
  updated_at:new Date().toISOString(),metadata:{netbud_payment_intent:i.id},refunded_amount:0,
  payments:[{id:'30000000-0000-4000-8000-000000000001',state:'completed',currency:'AUD',amount:i.amount_cents}],...overrides};
}

test('reviewed additive schema denies browser RPC/table access',async()=>{
 const {db}=await setup();try{
  const row=(await db.query("select has_function_privilege('anon','public.netbud_revolut(text,jsonb,uuid,text)','execute') e,has_schema_privilege('authenticated','netbud','usage') u")).rows[0];
  assert.equal(row.e,false);assert.equal(row.u,false);
  assert.equal((await db.query("select count(*)::int n from pg_class where relnamespace='netbud'::regnamespace and relname like 'revolut_%' and relkind='r' and not relrowsecurity")).rows[0].n,0);
 }finally{await db.close();}
});

test('server pricing includes shipping and repeated keys/clicks share one reservation',async()=>{
 const {db,repo}=await setup();try{
  const input={...order(),delivery:'shipping',address:{country:'AU',line1:'Test',suburb:'Test',state:'NSW',postcode:'2150'}};
  const o=await repo.rpc('netbud_create',{p_body:input,p_key:crypto.randomUUID(),p_hash:'fixture'});
  await repo.rpc('netbud_update',{p_actor:actors.owner,p_order:o.id,p_status:'accepted'});
  const key=crypto.randomUUID(),i=await reserve(repo,o,key);assert.equal(i.amount_cents,5395);
  const results=await Promise.all([reserve(repo,o,key),reserve(repo,o)]);
  assert.ok(results.every(r=>r.id===i.id&&!r.should_create));
  await assert.rejects(repo.rpc('netbud_revolut',{p_action:'reserve',p_actor:actors.owner,p_data:{order_id:o.id,purpose:'balance',key,hash:'different'}}),/idempotency_conflict/);
 }finally{await db.close();}
});

test('verified customer and staff boundaries reject cross-customer and designer payment creation',async()=>{
 const {db,repo}=await setup();try{
  const a=await accepted(repo),b=await accepted(repo,'other@example.test');
  await db.query("insert into netbud.guest_sessions(token_hash,customer_id,expires_at) select 'verified-a',customer_id,now()+interval '1 minute' from netbud.orders where id=$1",[a.id]);
  await assert.rejects(repo.rpc('netbud_revolut',{p_action:'reserve',p_guest_hash:'verified-a',p_data:{order_id:b.id,purpose:'balance',key:crypto.randomUUID(),hash:'test'}}),/access_denied/);
  await assert.rejects(repo.rpc('netbud_revolut',{p_action:'status',p_actor:actors.designer,p_data:{order_id:a.id}}),/access_denied/);
  const i=await repo.rpc('netbud_revolut',{p_action:'reserve',p_guest_hash:'verified-a',p_data:{order_id:a.id,purpose:'balance',key:crypto.randomUUID(),hash:'test'}});
  assert.equal(i.amount_cents,3900);
 }finally{await db.close();}
});

test('quote deposit comes from immutable accepted version',async()=>{
 const {db,repo}=await setup();try{
  const input={...order(),items:[{product_id:1,quantity:1}],delivery:'none'};
  const o=await repo.rpc('netbud_create',{p_body:input,p_key:crypto.randomUUID(),p_hash:'fixture'});
  await repo.rpc('netbud_update',{p_actor:actors.owner,p_order:o.id,p_status:'accepted'});
  const item=(await db.query('select id from netbud.order_items where order_id=$1',[o.id])).rows[0].id;
  const write=(action,data)=>repo.rpc('netbud_admin_write',{p_actor:actors.owner,p_action:action,p_data:{order_id:o.id,item_id:item,...data},p_key:crypto.randomUUID(),p_hash:'fixture'});
  const q=await write('quote_draft',{amount_cents:12000,deposit_cents:2500,scope:'Synthetic scope',milestones:[]});
  await assert.rejects(reserve(repo,o),/invalid_transition/);
  await write('quote_prepare',{version_id:q.version_id});await write('quote_accept',{version_id:q.version_id,evidence:'Synthetic written approval'});
  const i=await reserve(repo,o,crypto.randomUUID(),{purpose:'deposit',item_id:item});assert.equal(i.amount_cents,2500);
 }finally{await db.close();}
});

test('ambiguous provider timeout never retries creation after another click',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo);let calls=0;
  const handler=createRevolut({env,repo,authenticate:auth,fetcher:async()=>{calls++;throw Error('timeout');}});
  const key=crypto.randomUUID(),body={order_id:o.id,purpose:'balance'};
  const first=await handler(request('/api/admin/revolut/checkout',body,key),'test-network');assert.equal(first.status,503);
  const again=await handler(request('/api/admin/revolut/checkout',body),'test-network');assert.equal(again.status,202);
  assert.equal(calls,1);assert.equal((await again.json()).state,'uncertain');
 }finally{await db.close();}
});

test('checkout uses trusted amount and validates hosted URL, origin, owner and fresh MFA',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo);let sent;
  const fetcher=async(url,options)=>{
   assert.equal(url,'https://sandbox-merchant.revolut.com/api/orders');
   sent=JSON.parse(options.body);assert.equal(options.redirect,'error');
   return Response.json({id:crypto.randomUUID(),amount:sent.amount,currency:'AUD',metadata:sent.metadata,checkout_url:'https://sandbox-checkout.revolut.com/payment-link/synthetic'});
  };
  const handler=createRevolut({env,repo,authenticate:auth,fetcher});
  const r=await handler(request('/api/admin/revolut/checkout',{order_id:o.id,purpose:'balance'}),'test');assert.equal(r.status,201);
  assert.equal(sent.amount,3900);assert.equal(sent.redirect_url,origin+'/payment/');assert.equal(sent.capture_mode,'automatic');
  assert.equal((await handler(request('/api/admin/revolut/checkout',{order_id:o.id,purpose:'balance',amount:1}),'test')).status,400);
  const expired=createRevolut({env,repo,authenticate:async()=>({id:actors.owner,aal:'aal2',mfaAt:1}),fetcher});
  assert.equal((await expired(request('/api/admin/revolut/status',{order_id:o.id}),'test')).status,403);
  assert.throws(()=>new RevolutSandbox({...env,REVOLUT_MERCHANT_API_BASE_URL:'https://merchant.revolut.com/'}),/sandbox_not_configured/);
 }finally{await db.close();}
});

test('raw webhook HMAC rejects tampering, stale timestamps and supports secret rotation',async()=>{
 const body=JSON.stringify({event:'ORDER_COMPLETED',order_id:crypto.randomUUID()});
 assert.ok((await verifyRevolutWebhook(await signed(body),[env.REVOLUT_WEBHOOK_SECRET])).fingerprint);
 await assert.rejects(verifyRevolutWebhook(await signed(body,env.REVOLUT_WEBHOOK_SECRET,Date.now()-301000),[env.REVOLUT_WEBHOOK_SECRET]),/invalid_webhook/);
 const r=await signed(body);const tampered=new Request(r.url,{method:'POST',headers:r.headers,body:body+' '});
 await assert.rejects(verifyRevolutWebhook(tampered,[env.REVOLUT_WEBHOOK_SECRET]),/invalid_webhook/);
 assert.ok(await verifyRevolutWebhook(await signed(body,'previous-test-secret'),['new-test-secret-123','previous-test-secret']));
});

test('canonical verification prevents fabricated totals and preserves revenue, duplicate and refund integrity',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo),i=await reserve(repo,o);let data=canonical(i);
  const provider={get:async()=>data};
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,amount:1})},data.id,await digest('mismatch')),/payment_mismatch/);
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,payments:[]})},data.id,await digest('empty')),/payment_mismatch/);
  await reconcileRevolut(repo,provider,data.id,await digest('complete'));
  const duplicate=await reconcileRevolut(repo,provider,data.id,await digest('complete'));assert.equal(duplicate.duplicate,true);
  assert.equal((await db.query('select count(*)::int n from netbud.revolut_transactions')).rows[0].n,1);
  assert.equal(Number((await db.query('select received from netbud.admin_orders where id=$1',[o.id])).rows[0].received),0);
  assert.equal((await db.query('select fulfilment_status from netbud.order_items where order_id=$1',[o.id])).rows[0].fulfilment_status,'pending');
  data={...data,updated_at:new Date(Date.now()+1000).toISOString(),refunded_amount:3900};
  await reconcileRevolut(repo,provider,data.id,await digest('refund'));
  assert.equal((await repo.rpc('netbud_revolut',{p_action:'status',p_actor:actors.owner,p_data:{order_id:o.id}}))[0].refunded_cents,3900);
  const stale=await reconcileRevolut(repo,{get:async()=>({...data,updated_at:'2020-01-01T00:00:00Z',state:'pending'})},data.id,await digest('stale'));assert.equal(stale.stale,true);
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,updated_at:new Date(Date.now()+2000).toISOString(),state:'pending'})},data.id,await digest('regression')),/invalid_transition/);
 }finally{await db.close();}
});

test('signed webhook fetches provider state, handles duplicates and flags disputes without real financial writes',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo),i=await reserve(repo,o),data=canonical(i);
  const handler=createRevolut({env,repo,authenticate:auth,fetcher:async()=>Response.json(data)});
  const body=JSON.stringify({event:'ORDER_COMPLETED',order_id:data.id});
  assert.equal((await handler(await signed(body),'network')).status,200);
  assert.equal((await handler(await signed(body),'network')).status,200);
  assert.equal((await handler(await signed(JSON.stringify({event:'ORDER_DISPUTED',order_id:data.id})),'network')).status,200);
  assert.equal((await repo.rpc('netbud_revolut',{p_action:'status',p_actor:actors.owner,p_data:{order_id:o.id}}))[0].review_required,true);
  assert.equal((await db.query('select count(*)::int n from netbud.payments')).rows[0].n,0);
  assert.equal((await createRevolut({env:{...env,REVOLUT_SANDBOX_APPROVED:'false'},repo,authenticate:auth})(request('/api/admin/revolut/checkout',{}),'network')).status,404);
 }finally{await db.close();}
});

test('provider rejection permits a new attempt while abandoned and authorised checkouts retain their reservation',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo);let calls=0;
  const rejected=createRevolut({env,repo,authenticate:auth,fetcher:async()=>{calls++;return Response.json({error:'declined'},{status:422});}});
  assert.equal((await rejected(request('/api/admin/revolut/checkout',{order_id:o.id,purpose:'balance'}),'test')).status,502);
  const retry=await reserve(repo,o);assert.equal(retry.should_create,true);assert.equal(calls,1);
  const declined=canonical(retry,{id:'651a941a-02ef-af6f-9b6c-458c652e2c6a',state:'pending',payments:[{id:crypto.randomUUID(),state:'failed',currency:'AUD',amount:3900}],updated_at:'2026-01-01T00:00:00Z'});
  await reconcileRevolut(repo,{get:async()=>declined},declined.id,await digest('declined-attempt'));
  assert.equal((await reserve(repo,o)).should_create,false);
  const data=canonical(retry,{id:'651a941a-02ef-af6f-9b6c-458c652e2c6a',state:'authorised',payments:[]});
  await reconcileRevolut(repo,{get:async()=>data},data.id,await digest('auth-only'));
  assert.equal((await reserve(repo,o)).id,retry.id);
  assert.equal((await db.query('select count(*)::int n from netbud.payments')).rows[0].n,0);
  const abandoned=await reserve(repo,o);assert.equal(abandoned.should_create,false);
 }finally{await db.close();}
});

test('canonical mismatch, unknown metadata and duplicate transaction references are rejected',async()=>{
 const {db,repo}=await setup();try{
  const o=await accepted(repo),i=await reserve(repo,o),data=canonical(i);
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,currency:'USD'})},data.id,await digest('currency')),/invalid_provider_response/);
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,metadata:{netbud_payment_intent:crypto.randomUUID()}})},data.id,await digest('unknown')),/payment_mismatch/);
  await assert.rejects(reconcileRevolut(repo,{get:async()=>({...data,payments:[data.payments[0],data.payments[0]]})},data.id,await digest('duplicated')),/payment_mismatch/);
 }finally{await db.close();}
});
