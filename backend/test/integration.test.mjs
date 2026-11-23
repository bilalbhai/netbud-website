import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {database,order,actors} from './database.mjs';
import {digest,ApiError} from '../src/core.mjs';
import {createIntegration,runOperations} from '../src/integration.mjs';
import {MockLaunchSender,dispatchLaunchMail} from '../src/launch-email.mjs';
import {draftTax} from '../src/tax-draft.mjs';
import {buildStaging} from '../build.mjs';
import {PGlite} from '@electric-sql/pglite';
import {backupFixture,restoreFixture} from '../src/backup.mjs';
import entry from '../entry.mjs';
let db,repo,env,handler,sessionId;
const origin='https://staging.netbud.test',transport='ab'.repeat(32);
before(async()=>{
 ({db,repo}=await database());sessionId=crypto.randomUUID();await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessionId,actors.owner]);await db.exec('update netbud.runtime_policy set manual_artwork_enabled=true');
 env={ENVIRONMENT:'staging',STAGING_ADMIN_APPROVED:'true',STAGING_GUEST_APPROVED:'true',APP_ORIGIN:origin,SUPABASE_URL:'https://phaseh.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',TURNSTILE_SECRET_KEY:'synthetic',TURNSTILE_SITE_KEY:'synthetic',TURNSTILE_HOSTNAME:'staging.netbud.test',OTP_HMAC_SECRET:crypto.randomUUID(),OTP_TRANSPORT_KEY_HEX:transport,RATE_LIMIT_HMAC_SECRET:crypto.randomUUID()};
 handler=createIntegration(env,{repo,authenticate:async r=>{if(r.headers.get('authorization')!=='Bearer synthetic-owner')throw new ApiError(401,'authentication_required');return {id:actors.owner,aal:'aal2',mfaAt:Date.now()/1000,sessionId};},fetcher:async(url,v)=>{assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');const token=JSON.parse(v.body).response;return Response.json({success:!token.startsWith('bad'),hostname:'staging.netbud.test',action:token.split(':')[0],challenge_ts:new Date().toISOString()});}});
});
after(async()=>db.close());
async function call(path,body,{cookie,csrf,owner=false,token,key,handler:handle=handler}={}){
 const request=new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key||crypto.randomUUID(),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...(owner?{Authorization:'Bearer synthetic-owner'}:{}),...(token?{'X-Turnstile-Token':token}:{})},...(body?{body:JSON.stringify(body)}:{})});return handle(request,'network-'+crypto.randomUUID());
}
const action=async(action,data)=>{const r=await call('/api/admin/action',{action,data},{owner:true});const v=await r.json();assert.equal(r.status,200,JSON.stringify(v));return v;};
const make=async(body=order(crypto.randomUUID()+'@example.test'),key)=>{const r=await call('/api/ordering/orders',body,{token:'checkout:'+crypto.randomUUID(),key});assert.ok([200,201].includes(r.status),await r.clone().text());return r.json();};
async function itemOf(id){return (await db.query('select id from netbud.order_items where order_id=$1',[id])).rows[0].id;}
async function prepare(o,item,count=1){return action('proof_prepare',{order_id:o.id,item_id:item,manifest:Array.from({length:count},(_,i)=>({design:i+1,sha256:'cd'.repeat(32),reference:'synthetic-proof-'+i})),reference:'synthetic-reviewed-proof-delivery',reviewed:true});}
async function approve(o,item,p,email){return action('proof_approve',{order_id:o.id,item_id:item,proof_id:p.proof_id,reply_hash:'ef'.repeat(32),from_email:email,evidence:'synthetic-customer-email-archive',received_at:new Date().toISOString(),verified:true});}

test('staging and production default closed; guest config cannot expose a service-role key',async()=>{
 for(const config of [{},{...env,ENVIRONMENT:'production'},{...env,TURNSTILE_SECRET_KEY:''}])assert.equal((await createIntegration(config)(new Request(origin+'/api/ordering/catalogue'),'test')).status,503);
 const config=await call('/api/staging/config');assert.equal(config.status,200);const v=await config.json();assert.equal(v.OTP_HMAC_SECRET,undefined);assert.equal(v.TURNSTILE_SECRET_KEY,undefined);
 const h=createIntegration({...env,SUPABASE_PUBLISHABLE_KEY:'sb_secret_synthetic'},{repo,authenticate:async()=>({})});assert.equal((await call('/api/staging/config',undefined,{handler:h})).status,503);
});
test('mandatory Turnstile rejects invalid, wrong action and replayed tokens before order mutation',async()=>{
 for(const token of ['bad-token','otp:'+crypto.randomUUID()])assert.equal((await call('/api/ordering/orders',order(),{token})).status,403);
 const token='checkout:'+crypto.randomUUID();assert.equal((await call('/api/ordering/orders',order(),{token})).status,201);assert.equal((await call('/api/ordering/orders',order(),{token})).status,403);
 assert.equal((await call('/api/test/orders',order(),{token:'checkout'})).status,404);
});
test('staging reuses authoritative prices, idempotency, five designs, shipping and mixed quotes',async()=>{
 const body=order('five-designs@example.test');body.items=[{product_id:5,quantity:5},{product_id:1,quantity:1}];body.delivery='shipping';body.address={line1:'1 Test Street',suburb:'Parramatta',state:'NSW',postcode:'2150',country:'AU'};body.designs=Array.from({length:5},(_,i)=>({product_id:5,name:'Synthetic design '+i}));
 const key=crypto.randomUUID(),o=await make(body,key),again=await make(body,key);assert.equal(o.id,again.id);assert.equal(o.total_cents,19500);
 const one=order('shipping@example.test');one.delivery='shipping';one.address=body.address;assert.equal((await make(one)).total_cents,5395);
 assert.equal((await call('/api/ordering/orders',{...body,total_cents:1},{token:'checkout:'+crypto.randomUUID()})).status,400);
});
test('real-address staging admission requires both server and database allowlists',async()=>{
 const body=order('owner-controlled@example.invalid');assert.equal((await call('/api/ordering/orders',body,{token:'checkout:'+crypto.randomUUID()})).status,400);
 // No real address or external send: synthetic .invalid demonstrates the two independent gates.
 await assert.rejects(repo.rpc('netbud_create',{p_body:body,p_key:crypto.randomUUID(),p_hash:'synthetic'}));
});
test('integrated OTP outbox, HTTPS cookie, customer isolation, CSRF and logout',async()=>{
 const email='integrated@example.test',o=await make(order(email));await make(order(email));const other=await make(order('other-integrated@example.test'));
 assert.equal((await call('/api/ordering/tracking/orders')).status,401);
 const request=await call('/api/ordering/tracking/request',{email},{token:'otp:'+crypto.randomUUID()});assert.equal(request.status,202);const {challenge}=await request.json();assert.equal((await repo.rpc('netbud_launch_ops',{p_actor:actors.owner})).uploads_enabled,false);
 const sender=new MockLaunchSender();let count=0;while(count++<30&&await dispatchLaunchMail({repo,sender,transportKey:transport,enabled:true})){}
 const notice=[...sender.messages.values()].find(x=>x.to===email&&x.subject.includes('verification code'));const code=notice.text.match(/\b\d{8}\b/)[0];
 const verified=await call('/api/ordering/tracking/verify',{challenge,code});assert.equal(verified.status,200);assert.match(verified.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Strict/);const cookie=verified.headers.get('Set-Cookie').split(';')[0],{csrf}=await verified.json();
 const history=await (await call('/api/ordering/tracking/orders',undefined,{cookie})).json();assert.equal(history.orders.length,2);assert.ok(history.orders.some(x=>x.id===o.id));assert.equal((await call('/api/ordering/tracking/orders/'+other.id,undefined,{cookie})).status,404);assert.equal((await call('/api/ordering/tracking/verify',{challenge,code})).status,400);
 assert.equal((await call('/api/ordering/tracking/logout',{}, {cookie})).status,403);assert.equal((await call('/api/ordering/tracking/logout',{}, {cookie,csrf})).status,200);assert.equal((await call('/api/ordering/tracking/orders',undefined,{cookie})).status,401);
});
test('five-design manual proof approval, verified payment, partial dispatch and completion',async()=>{
 const email='physical-complete@example.test',body=order(email);body.items[0].quantity=5;body.designs=Array.from({length:5},(_,i)=>({product_id:5,name:'Design '+i}));body.delivery='shipping';body.address={line1:'1 Test Street',suburb:'Test',state:'NSW',postcode:'2150',country:'AU'};const o=await make(body),item=await itemOf(o.id);await action('accept',{order_id:o.id});
 const p=await prepare(o,item,5);await approve(o,item,p,email);
 assert.equal((await call('/api/admin/action',{action:'production',data:{order_id:o.id,item_id:item,status:'processing'}},{owner:true})).status,409);
 await action('request_payment',{order_id:o.id,message:'Synthetic instructions only; no bank account or actual funds.'});await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:19500,kind:'balance',evidence:'synthetic-owner-bank-verification',verified:true});
 await action('production',{order_id:o.id,item_id:item,status:'processing'});await action('production',{order_id:o.id,item_id:item,status:'ready'});
 for(const quantity of [2,3]){const ready=await action('shipment',{order_id:o.id,status:'ready',items:[{item_id:item,quantity}]});await action('shipment',{order_id:o.id,shipment_id:ready.shipment_id,status:'shipped',tracking:'TESTAU000000'+quantity,dispatch_date:new Date().toISOString(),items:[{item_id:item,quantity}]});}
 await action('production',{order_id:o.id,item_id:item,status:'completed'});await action('complete',{order_id:o.id});assert.equal((await repo.rpc('netbud_admin_read',{p_actor:actors.owner,p_resource:'order',p_query:{id:o.id}})).status,'completed');
});
test('proof replacement invalidates old approval; wrong customer, stale version and staff denied',async()=>{
 const email='revision@example.test',o=await make(order(email)),item=await itemOf(o.id);await action('accept',{order_id:o.id});const p=await prepare(o,item);await approve(o,item,p,email);const next=await prepare(o,item);assert.equal(next.version,2);
 for(const data of [{proof_id:p.proof_id,from_email:email},{proof_id:next.proof_id,from_email:'another@example.test'}])assert.equal((await call('/api/admin/action',{action:'proof_approve',data:{order_id:o.id,item_id:item,reply_hash:'ef'.repeat(32),evidence:'synthetic-evidence',received_at:new Date().toISOString(),verified:true,...data}},{owner:true})).status,400);
 await assert.rejects(repo.rpc('netbud_manual_proof',{p_actor:actors.designer,p_action:'proof_prepare',p_data:{},p_key:crypto.randomUUID(),p_hash:'test'}),e=>e.status===403);
 await assert.rejects(db.query('update netbud.manual_proofs set version=9 where id=$1',[p.proof_id]),/immutable_record/);
});
test('shipping cannot proceed on item-only payment even with valid manual proof',async()=>{
 const email='unpaid-shipping@example.test',body=order(email);body.delivery='shipping';body.address={line1:'1 Test',suburb:'Test',state:'NSW',postcode:'2150',country:'AU'};const o=await make(body),item=await itemOf(o.id);await action('accept',{order_id:o.id});const p=await prepare(o,item);await approve(o,item,p,email);await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:3900,kind:'balance',evidence:'synthetic-item-only-payment',verified:true});
 assert.equal((await call('/api/admin/action',{action:'production',data:{order_id:o.id,item_id:item,status:'processing'}},{owner:true})).status,409);
 await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:1495,kind:'balance',evidence:'synthetic-shipping-payment',verified:true});await action('production',{order_id:o.id,item_id:item,status:'processing'});
});
test('approved service deposit permits project start, never full-paid completion',async()=>{
 const body=order('service-deposit@example.test');body.items=[{product_id:1,quantity:1}];body.delivery='none';const o=await make(body),item=await itemOf(o.id);await action('accept',{order_id:o.id});const q=await action('quote_draft',{order_id:o.id,item_id:item,amount_cents:10000,deposit_cents:2000,scope:'Synthetic scoped project',milestones:[]});await action('quote_prepare',{order_id:o.id,version_id:q.version_id});await action('quote_accept',{order_id:o.id,version_id:q.version_id,evidence:'synthetic-specific-written-approval'});
 await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:2000,kind:'deposit',evidence:'synthetic-confirmed-deposit',verified:true});await action('production',{order_id:o.id,item_id:item,status:'processing'});assert.equal((await call('/api/admin/action',{action:'production',data:{order_id:o.id,item_id:item,status:'ready'}},{owner:true})).status,409);
 await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:8000,kind:'balance',evidence:'synthetic-confirmed-balance',verified:true});await action('production',{order_id:o.id,item_id:item,status:'ready'});
});
test('verified manual refund is owner-only, immutable and idempotent; approval alone is no transfer',async()=>{
 const o=await make(),item=await itemOf(o.id);await action('accept',{order_id:o.id});await action('manual_payment',{order_id:o.id,item_id:item,amount_cents:3900,kind:'balance',evidence:'synthetic-refund-original-receipt',verified:true});const approval=await action('refund_approve',{order_id:o.id,amount_cents:500,reason:'Synthetic agreed remedy'});
 const detail=await (await call('/api/admin/order?id='+o.id,undefined,{owner:true})).json();
 const data={order_id:o.id,approval_id:detail.refunds[0].id,evidence:'synthetic-confirmed-bank-refund',verified:true},key=crypto.randomUUID();
 const before=(await repo.rpc('netbud_admin_read',{p_actor:actors.owner,p_resource:'order',p_query:{id:o.id}})).received;assert.equal(Number(before),3900);
 let response=await call('/api/admin/action',{action:'refund_record',data},{owner:true,key});assert.equal(response.status,200,await response.clone().text());response=await call('/api/admin/action',{action:'refund_record',data},{owner:true,key});assert.equal(response.status,200);
 assert.equal(Number((await repo.rpc('netbud_admin_read',{p_actor:actors.owner,p_resource:'order',p_query:{id:o.id}})).received),3400);
 await action('refund_approve',{order_id:o.id,amount_cents:3400,reason:'Synthetic remaining refund'});const current=await (await call('/api/admin/order?id='+o.id,undefined,{owner:true})).json();const last=current.refunds.find(r=>r.amount_cents===3400);await action('refund_record',{order_id:o.id,approval_id:last.id,evidence:'synthetic-final-bank-refund',verified:true});
 await assert.rejects(repo.rpc('netbud_record_refund',{p_actor:actors.support,p_data:data,p_key:crypto.randomUUID(),p_hash:'test'}),e=>e.status===403);
 const customer=(await db.query('select customer_id from netbud.orders where id=$1',[o.id])).rows[0].customer_id;await db.query("insert into netbud.guest_sessions(token_hash,customer_id,expires_at) values('synthetic-refund-summary',$1,now()+interval '5 minutes')",[customer]);const history=await repo.rpc('netbud_guest_orders',{p_hash:'synthetic-refund-summary',p_order:o.id});assert.equal(history.orders[0].payment_summary.state,'refunded');
});
test('staff session revocation and 30-minute age are checked in database on every API call',async()=>{
 assert.equal((await call('/api/admin/session',undefined,{owner:true})).status,200);await db.query("update auth.sessions set created_at=now()-interval '31 minutes' where id=$1",[sessionId]);assert.equal((await call('/api/admin/session',undefined,{owner:true})).status,401);await db.query('update auth.sessions set created_at=now() where id=$1',[sessionId]);await db.query('delete from auth.sessions where id=$1',[sessionId]);assert.equal((await call('/api/admin/session',undefined,{owner:true})).status,401);await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessionId,actors.owner]);
});
test('maintenance scrubs expired code secrets, sessions and rate data, preserves orders and finances',async()=>{
 const count=(await db.query('select count(*)::int n from netbud.orders')).rows[0].n;
 await db.exec("insert into netbud.guest_sessions(token_hash,expires_at) values('synthetic-expired',now()-interval '2 days');insert into netbud.rate_limits values('synthetic-expired',1,now()-interval '1 day')");await repo.rpc('netbud_maintenance');assert.equal((await db.query("select count(*)::int n from netbud.guest_sessions where token_hash='synthetic-expired'")).rows[0].n,0);assert.equal((await db.query('select count(*)::int n from netbud.orders')).rows[0].n,count);
 assert.deepEqual(await runOperations(env,{repo}),{disabled:true});
});
test('external artwork deletion recording requires notice, age and released hold; financial evidence stays',async()=>{
 const row=(await db.query("select o.id from netbud.orders o where o.status='completed' and exists(select 1 from netbud.manual_proofs p join netbud.order_items i on i.id=p.item_id where i.order_id=o.id) limit 1")).rows[0];assert.ok(row);
 await db.query("update netbud.orders set completed_at=now()-interval '91 days' where id=$1",[row.id]);await repo.rpc('netbud_launch_retention_prepare');
 const data={order_id:row.id,evidence:'synthetic-owner-deletion-log-not-a-real-delete',verified:true};assert.equal((await call('/api/admin/action',{action:'retention_record',data},{owner:true})).status,409);
 await db.query("update netbud.outbox set status='delivered',delivered_at=now()-interval '8 days' where dedupe_key=$1",['retention:'+row.id]);await action('retention_hold',{order_id:row.id,hold:true,reason:'Synthetic dispute hold'});assert.equal((await call('/api/admin/action',{action:'retention_record',data},{owner:true})).status,409);
 await action('retention_hold',{order_id:row.id,hold:false,reason:'Synthetic verified resolution'});const r=await action('retention_record',data);assert.equal(r.status,'owner_attested_external_artwork_deletion');assert.ok((await db.query('select proof_id from netbud.manual_proof_approvals limit 1')).rows.length);assert.ok((await db.query('select id from netbud.payments where order_id=$1',[row.id])).rows.length);
});
test('GST draft calculations require reviewed classifications and do not issue invoices',()=>{
 assert.throws(()=>draftTax([{gross_cents:3900,tax_class:'unconfirmed'}]));assert.throws(()=>draftTax([{gross_cents:3900,tax_class:'unconfirmed'}],{classificationsApproved:true}));
 const d=draftTax([{gross_cents:3900,tax_class:'taxable'},{gross_cents:1495,tax_class:'taxable'},{gross_cents:1000,tax_class:'gst_free'}],{classificationsApproved:true});assert.equal(d.gross_cents,6395);assert.equal(d.gst_cents,491);assert.equal(d.document,'draft_not_valid_for_issue');
});
test('encrypted fresh-engine recovery preserves manual approvals, refund ledger and private fixture bytes',async()=>{
 const object=crypto.randomUUID()+'/'+crypto.randomUUID()+'.png',data=Buffer.from('synthetic private bytes, not a customer image'),key='bc'.repeat(32),archive=await backupFixture(db,new Map([[object,data]]),key);
 const before=(await db.query('select count(*)::int n from netbud.manual_proof_approvals')).rows[0].n;assert.ok(before>0);const restored=await restoreFixture(archive,key,loadDataDir=>new PGlite({loadDataDir}));try{assert.equal((await restored.db.query('select count(*)::int n from netbud.manual_proof_approvals')).rows[0].n,before);assert.ok((await restored.db.query('select count(*)::int n from netbud.refund_records')).rows[0].n>0);assert.deepEqual(restored.objects.get(object),data);}finally{await restored.db.close();}
});
test('bundle includes unchanged marketing assets, excludes private files and synthetic login',async()=>{
 const root=fileURLToPath(new URL('../../',import.meta.url)),bundle=await buildStaging(path.join(root,'.cache','h-unit-'+crypto.randomUUID()));
 assert.ok(bundle.manifest.some(x=>x.path==='index.html'));for(const file of bundle.manifest.filter(x=>!x.application)){assert.deepEqual(await readFile(path.join(bundle.publicDir,file.path)),await readFile(path.join(root,file.path)));}
 for(const f of ['backend','docs','.env','CNAME','node_modules','tmp'])assert.ok(!bundle.manifest.some(x=>x.path===f||x.path.startsWith(f+'/')));
 const script=await readFile(path.join(bundle.publicDir,'admin/admin.js'),'utf8'),html=await readFile(path.join(bundle.publicDir,'admin/index.html'),'utf8');
 assert.ok(!script.includes('capability'));assert.ok(!html.includes('capability'));assert.ok(html.includes('/admin/staff-auth.js'));assert.ok(bundle.manifest.some(x=>x.path==='admin/staff-auth.js'));
 const worker=await readFile(path.join(bundle.publicDir,'_worker.js'),'utf8');assert.ok(!worker.includes('createLocalAdminSession'));assert.ok(!worker.includes('PGlite'));
});
test('entry denies private paths and public activation while preserving marketing fallback',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('marketing')}};
 for(const p of ['/backend/.env','/docs/ordering/PHASE_H_REPORT.md','/_worker.js','/.git/config','/admin/'])assert.equal((await entry.fetch(new Request(origin+p),env)).status,404);
 assert.equal(await (await entry.fetch(new Request(origin+'/'),env)).text(),'marketing');assert.equal((await entry.fetch(new Request(origin+'/api/ordering/catalogue'),env)).status,503);
});

test('analytics packaging preserves private page exclusions and checkout CSP boundary',async()=>{
 const env={ENVIRONMENT:'staging',STAGING_ADMIN_APPROVED:'true',ASSETS:{fetch:async()=>new Response('isolated asset')}};
 for(const name of ['admin','track','checkout']){
  const response=await entry.fetch(new Request(origin+'/'+name+'/'),env),csp=response.headers.get('Content-Security-Policy');
  assert.equal(csp.includes('www.googletagmanager.com'),name==='checkout');
 }
 const root=fileURLToPath(new URL('../../',import.meta.url));
 const admin=await readFile(path.join(root,'backend/public/admin.html'),'utf8');assert.ok(!admin.includes('/js/analytics.js'));
 for(const name of ['checkout','tracking'])assert.ok((await readFile(path.join(root,'backend/public/'+name+'.html'),'utf8')).includes('/js/analytics.js'));
 const bundle=await buildStaging(path.join(root,'.cache','h-analytics-'+crypto.randomUUID()));assert.ok(bundle.manifest.some(x=>x.path==='js/analytics.js'));
 assert.ok(!(await readFile(path.join(bundle.publicDir,'admin/index.html'),'utf8')).includes('/js/analytics.js'));
});
