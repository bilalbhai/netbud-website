import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {database,actors,order} from './database.mjs';
import {digest,ApiError} from '../src/core.mjs';
import {DurableOtpDelivery,sealOtp,openOtp,renderMail,MockLaunchSender,ResendSender,dispatchLaunchMail,verifyResendEvent,handleResendWebhook} from '../src/launch-email.mjs';
import {createTracking} from '../src/tracking.mjs';
import {createTurnstile} from '../src/bot-protection.mjs';
import {createApi} from '../src/api.mjs';
import {stagingHandler} from '../staging.mjs';
import {backupFixture,restoreFixture} from '../src/backup.mjs';
let db,repo;const key='ab'.repeat(32),origin='http://127.0.0.1:8787';
before(async()=>({db,repo}=await database()));after(async()=>db.close());
const create=async()=>{const body=order(crypto.randomUUID()+'@example.test');return repo.rpc('netbud_create',{p_body:body,p_key:crypto.randomUUID(),p_hash:await digest(JSON.stringify(body))});};
const isolate=async()=>{await db.exec("update netbud.outbox set available_at=now()+interval '2 days' where status='queued';delete from netbud.mail_budget;update netbud.limits set email_daily_max=90,uploads_enabled=false,storage_max_bytes=900000000");};
async function otp(){
 const id=crypto.randomUUID(),email=id+'@example.test',code='12345678';
 assert.equal(await repo.rpc('netbud_otp_begin',{p_id:id,p_email:email,p_email_hash:await digest(email),p_hmac:await digest(code),p_network:id}),true);
 await new DurableOtpDelivery(repo,key).enqueue({id,email,code,expires:Date.now()+299000});return {id,email,code};
}
test('OTP envelope has no plaintext, binds challenge, rejects wrong key and expiry',async()=>{
 const id=crypto.randomUUID(),value=await sealOtp(key,id,'12345678',Date.now()+10000);
 assert.ok(!JSON.stringify(value).includes('12345678'));assert.equal(await openOtp(key,id,value),'12345678');
 await assert.rejects(openOtp('cd'.repeat(32),id,value));await assert.rejects(openOtp(key,crypto.randomUUID(),value));await assert.rejects(openOtp(key,id,value,Date.now()+11000));
});
test('existing OTP handler queues encrypted durable transport and preserves generic response',async()=>{
 await isolate();const tracking=createTracking({repo,secret:crypto.randomUUID(),origin,localOnly:true,delivery:new DurableOtpDelivery(repo,key)});
 const r=await tracking({request:new Request(origin+'/api/test/tracking/request',{method:'POST'}),body:async()=>({email:'durable@example.test'}),network:'test',reply:(s,v)=>Response.json(v,{status:s})});
 assert.equal(r.status,202);const response=await r.json();assert.equal(response.code,undefined);
 const m=(await db.query('select * from netbud.outbox where challenge_id=$1',[response.challenge])).rows[0];assert.ok(m.encrypted_payload);assert.equal(m.launch_managed,true);
});
test('mock launch handoff records accepted, never actual delivery; clears OTP cipher',async()=>{
 await isolate();const challenge=await otp(),sender=new MockLaunchSender();assert.equal(await dispatchLaunchMail({repo,sender,transportKey:key}),false);
 assert.equal(await dispatchLaunchMail({repo,sender,transportKey:key,enabled:true}),true);
 const m=(await db.query('select * from netbud.outbox where challenge_id=$1',[challenge.id])).rows[0];assert.equal(m.status,'accepted');assert.equal(m.delivered_at,null);assert.equal(m.encrypted_payload,null);assert.ok(m.accepted_at);assert.match([...sender.messages.values()][0].text,/12345678/);
});
test('expired and superseded OTP messages never handed to sender',async()=>{
 await isolate();const a=await otp(),b=await otp();await db.query("update netbud.otp_challenges set expires_at=now()-interval '1 second' where id=$1",[a.id]);await db.query('update netbud.otp_challenges set consumed_at=now() where id=$1',[b.id]);
 assert.equal(await dispatchLaunchMail({repo,sender:new MockLaunchSender(),transportKey:key,enabled:true}),false);
 assert.deepEqual((await db.query('select status,encrypted_payload from netbud.outbox where challenge_id in ($1,$2)',[a.id,b.id])).rows.map(x=>[x.status,x.encrypted_payload]),[['expired',null],['expired',null]]);
});
test('missing encrypted OTP is skipped, legacy mock cannot claim launch OTP',async()=>{
 await isolate();const a=await otp();assert.equal(await repo.rpc('netbud_claim_mail'),null);
 await db.query('update netbud.outbox set encrypted_payload=null where challenge_id=$1',[a.id]);assert.equal(await repo.rpc('netbud_launch_claim'),null);
});
test('consumed challenge between claim and send fails the final context check',async()=>{
 await isolate();const a=await otp(),m=await repo.rpc('netbud_launch_claim');await db.query('update netbud.otp_challenges set consumed_at=now() where id=$1',[a.id]);assert.equal(await repo.rpc('netbud_launch_context',{p_id:m.id,p_lease:m.lease_token}),null);
 await repo.rpc('netbud_launch_finish',{p_id:m.id,p_lease:m.lease_token,p_outcome:'failed'});
});
const enabled=(fetcher)=>new ResendSender({enabled:true,domainVerified:true,ownerApproved:true,apiKey:'synthetic-placeholder',allowedRecipients:['email@example.test'],fetcher});
const mail={to:'email@example.test',subject:'NetBud | Test',text:'Synthetic'};
test('real sender refuses disabled, unverified and non-allowlisted recipients without network',async()=>{
 let calls=0;for(const flags of [{},{enabled:true},{enabled:true,domainVerified:true},{enabled:true,domainVerified:true,ownerApproved:true}]){
 await assert.rejects(new ResendSender({...flags,apiKey:'synthetic',fetcher:async()=>{calls++;}}).send(mail,'test'));
 }assert.equal(calls,0);
});
test('Resend sends correct server-only headers, stable idempotency and reply-to; acceptance != delivery',async()=>{
 const id=crypto.randomUUID();let seen;
 const p=enabled(async(url,v)=>{seen={url,v};return Response.json({id});});
 assert.deepEqual(await p.send(mail,'same-key'),{outcome:'accepted',id});assert.equal(seen.url,'https://api.resend.com/emails');assert.equal(seen.v.headers['Idempotency-Key'],'same-key');assert.equal(JSON.parse(seen.v.body).reply_to,'sales@netbud.com.au');assert.equal(JSON.parse(seen.v.body).from,'NetBud <noreply@netbud.com.au>');
});
test('HTTP and JSON outcomes do not fabricate delivery; ambiguous attempts not blindly retried',async()=>{
 for(const [response,outcome] of [[()=>Response.json({}, {status:200}),'uncertain'],[()=>new Response('bad',{status:200}),'uncertain'],[()=>Response.json({}, {status:429}),'retry'],[()=>Response.json({}, {status:503}),'uncertain'],[()=>Response.json({}, {status:422}),'failed'],[()=>{throw Error('timeout');},'uncertain']])assert.equal((await enabled(async()=>response()).send(mail,'key')).outcome,outcome);
});
test('retries are bounded at five attempts and retain the same message identity',async()=>{
 await isolate();await create();let id;
 for(let i=1;i<=5;i++){const m=await repo.rpc('netbud_launch_claim');assert.ok(m);id ||=m.id;assert.equal(m.id,id);await repo.rpc('netbud_launch_finish',{p_id:m.id,p_lease:m.lease_token,p_outcome:'retry'});await db.query('update netbud.outbox set available_at=now() where id=$1',[id]);}
 assert.equal((await db.query('select status from netbud.outbox where id=$1',[id])).rows[0].status,'failed');assert.equal(await repo.rpc('netbud_launch_claim'),null);
});
test('expired launch lease and 23-hour retry window fail closed',async()=>{
 await isolate();await create();const m=await repo.rpc('netbud_launch_claim');await db.query("update netbud.outbox set lease_until=now()-interval '1 second' where id=$1",[m.id]);assert.equal(await repo.rpc('netbud_launch_claim'),null);assert.equal((await db.query('select status from netbud.outbox where id=$1',[m.id])).rows[0].status,'uncertain');
 await create();const n=await repo.rpc('netbud_launch_claim');await repo.rpc('netbud_launch_finish',{p_id:n.id,p_lease:n.lease_token,p_outcome:'retry'});await db.query("update netbud.outbox set first_attempt_at=now()-interval '24 hours',available_at=now() where id=$1",[n.id]);assert.equal(await repo.rpc('netbud_launch_claim'),null);
});
test('daily OTP reserve and monthly budget stop sends without silently discarding mail',async()=>{
 await isolate();await create();await db.exec("insert into netbud.mail_budget values('d:'||to_char(now() at time zone 'UTC','YYYY-MM-DD'),70)");assert.equal(await repo.rpc('netbud_launch_claim'),null);
 const a=await otp(),m=await repo.rpc('netbud_launch_claim');assert.equal(m.challenge_id,a.id);await repo.rpc('netbud_launch_finish',{p_id:m.id,p_lease:m.lease_token,p_outcome:'accepted',p_provider:'mock-budget'});
 await db.exec("insert into netbud.mail_budget values('m:'||to_char(now() at time zone 'UTC','YYYY-MM'),2700) on conflict(period) do update set attempts=2700");assert.equal(await repo.rpc('netbud_launch_claim'),null);
});
test('notification templates never claim payment; missing prepared material fails closed',()=>{
 for(const type of ['order_received','order_accepted','order_cancelled','artwork_retention'])assert.match(renderMail({message_type:type,recipient:mail.to},{reference:'NB-TEST'}).subject,/NetBud/);
 for(const type of ['request_payment','request_artwork','order_update','tracking_details']){assert.throws(()=>renderMail({message_type:type}, {reference:'NB-TEST'}));assert.match(renderMail({message_type:type},{reference:'NB-TEST',draft:{body:'Owner prepared instructions'}}).text,/Owner prepared/);}
 assert.match(renderMail({message_type:'quote_prepared'},{reference:'NB-TEST',quote:{version:2,amount_cents:10000,scope:'Synthetic scope',valid_until:'2026-12-01'}}).text,/not evidence of your approval or payment/);
 assert.throws(()=>renderMail({message_type:'unsupported'},{}));
});
test('existing owner actions render recorded order, quote and communication events without private notes',async()=>{
 await isolate();
 const write=async(action,data)=>repo.rpc('netbud_admin_write',{p_actor:actors.owner,p_action:action,p_data:data,p_key:crypto.randomUUID(),p_hash:await digest(JSON.stringify({action,data}))});
 const o=await create();await write('accept',{order_id:o.id});
 for(const action of ['request_payment','request_artwork','order_update','tracking_details'])await write(action,{order_id:o.id,message:'Synthetic customer-facing '+action});
 await write('note',{order_id:o.id,note:'PRIVATE-NOTE-MUST-NOT-BE-EMAILED'});
 const body=order('quote-mail@example.test');body.items=[{product_id:1,quantity:1}];body.delivery='none';const q=await repo.rpc('netbud_create',{p_body:body,p_key:crypto.randomUUID(),p_hash:await digest(JSON.stringify(body))});
 const item=(await db.query('select id from netbud.order_items where order_id=$1',[q.id])).rows[0].id;
 const version=await write('quote_draft',{order_id:q.id,item_id:item,amount_cents:10000,deposit_cents:2000,scope:'Synthetic website scope',milestones:[]});await write('quote_prepare',{order_id:q.id,version_id:version.version_id});
 const sender=new MockLaunchSender();let sent=0;while(sent<10&&await dispatchLaunchMail({repo,sender,transportKey:key,enabled:true}))sent++;
 assert.equal(sent,8);assert.equal(sender.messages.size,8);const all=[...sender.messages.values()];assert.ok(all.some(v=>/Quote version 1: A\$100.00/.test(v.text)));assert.ok(all.some(v=>/Synthetic customer-facing request_payment/.test(v.text)));assert.ok(all.every(v=>!v.text.includes('PRIVATE-NOTE')));
 assert.equal((await db.query("select count(*)::int n from netbud.outbox where order_id in ($1,$2) and status='failed'",[o.id,q.id])).rows[0].n,0);
});
test('owner operations visibility excludes email/OTP; staff and anon cannot read operations tables',async()=>{
 const v=await repo.rpc('netbud_launch_ops',{p_actor:actors.owner});assert.ok(v.mail);assert.equal(v.uploads_enabled,false);assert.ok(!JSON.stringify(v).includes('@'));
 for(const role of [actors.designer,actors.fulfilment,actors.support])await assert.rejects(repo.rpc('netbud_launch_ops',{p_actor:role}),e=>e.status===403);
 await db.exec('set role anon');try{await assert.rejects(db.query('select * from netbud.mail_budget'),/permission denied/);await assert.rejects(db.query('select public.netbud_launch_claim()'),/permission denied/);}finally{await db.exec('reset role');}
});
test('signed webhook delivery is idempotent; later bounce cannot be erased by older delivery',async()=>{
 await isolate();await create();const m=await repo.rpc('netbud_launch_claim'),provider=crypto.randomUUID();await repo.rpc('netbud_launch_finish',{p_id:m.id,p_lease:m.lease_token,p_outcome:'accepted',p_provider:provider});
 for(let i=0;i<2;i++)assert.equal(await repo.rpc('netbud_launch_event',{p_event:'event-fixture',p_provider:provider,p_kind:'email.delivered'}),true);
 assert.equal((await db.query('select count(*)::int n from netbud.mail_events where outbox_id=$1',[m.id])).rows[0].n,1);
 await repo.rpc('netbud_launch_event',{p_event:'bounce-fixture',p_provider:provider,p_kind:'email.bounced'});await repo.rpc('netbud_launch_event',{p_event:'late-delivery',p_provider:provider,p_kind:'email.delivered'});
 assert.equal((await db.query('select status from netbud.outbox where id=$1',[m.id])).rows[0].status,'bounced');
 assert.equal(await repo.rpc('netbud_launch_event',{p_event:'unknown',p_provider:crypto.randomUUID(),p_kind:'email.delivered'}),false);
});
async function signedEvent({age=0,tamper=false}={}){
 const rawKey=new Uint8Array(32).fill(7),secret='whsec_'+btoa(String.fromCharCode(...rawKey)),ts=String(Math.floor(Date.now()/1000)-age),id='evt-synthetic',body=JSON.stringify({type:'email.delivered',data:{email_id:crypto.randomUUID()}});
 const k=await crypto.subtle.importKey('raw',rawKey,{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(`${id}.${ts}.${body}`)));
 return {secret,request:new Request('https://staging.example.test/mail-events',{method:'POST',headers:{'svix-id':id,'svix-timestamp':ts,'svix-signature':'v1,'+btoa(String.fromCharCode(...sig))},body:body+(tamper?' ':'')})};
}
test('webhook signature verifies raw bytes, expiry and default-off integration',async()=>{
 let v=await signedEvent();assert.equal((await verifyResendEvent(v.request,v.secret)).id,'evt-synthetic');
 for(const opts of [{age:400},{tamper:true}]){v=await signedEvent(opts);await assert.rejects(verifyResendEvent(v.request,v.secret),e=>e.status===401);}
 v=await signedEvent();assert.equal((await handleResendWebhook(v.request,{repo,secret:v.secret})).status,503);
});
const bot=(extra={})=>createTurnstile({secret:'synthetic',hostname:'staging.example.test',repo,fetcher:async()=>Response.json({success:true,hostname:'staging.example.test',action:'checkout',challenge_ts:new Date().toISOString()}),...extra});
test('Turnstile validates exact action, hostname, age, response shape and token replay',async()=>{
 const token=crypto.randomUUID();assert.equal(await bot()(token,'checkout'),true);await assert.rejects(bot()(token,'checkout'),e=>e.status===403);
 for(const v of [{success:false},{success:true,hostname:'evil.test',action:'checkout',challenge_ts:new Date().toISOString()},{success:true,hostname:'staging.example.test',action:'otp',challenge_ts:new Date().toISOString()},{success:true,hostname:'staging.example.test',action:'checkout',challenge_ts:new Date(Date.now()-301000).toISOString()}])await assert.rejects(bot({fetcher:async()=>Response.json(v)})(crypto.randomUUID(),'checkout'),e=>e.status===403);
 await assert.rejects(bot({fetcher:async()=>{throw Error('offline');}})('token','checkout'),e=>e.status===503);
});
test('all future intake actions are checked before handler use; FormSubmit is untouched',async()=>{
 const actions=[];const api=createApi({repo,origin,rateSecret:crypto.randomUUID(),enabled:true,botGuard:async(t,a)=>{actions.push(a);throw Error('blocked');}});
 for(const path of ['/api/test/orders','/api/test/tracking/request','/api/enquiries','/api/artwork/uploads']){const r=await api(new Request(origin+path,{method:'POST',headers:{Origin:origin}}),'test-network');assert.equal(r.status,503);}
 assert.deepEqual(actions,['checkout','otp','enquiry','artwork']);
});
test('storage reservations default disabled; synthetic activation checks file, count and aggregate quotas',async()=>{
 const o=await create();const reserve=bytes=>repo.rpc('netbud_launch_reserve',{p_id:crypto.randomUUID(),p_order:o.id,p_bytes:bytes});await assert.rejects(reserve(100),e=>e.code==='artwork_validation_unavailable');
 await db.exec('update netbud.limits set uploads_enabled=true,storage_max_bytes=150');assert.equal(await reserve(100),true);await assert.rejects(reserve(100),e=>e.code==='capacity_unavailable');await assert.rejects(reserve(10000001));
 await db.exec('update netbud.limits set storage_max_bytes=900000000');for(let i=0;i<9;i++)await reserve(1);await assert.rejects(reserve(1));await db.exec('update netbud.limits set uploads_enabled=false');
});
test('retention requires completion, 90 days, actual delivered notice, seven-day grace and no hold; financial records retained',async()=>{
 await isolate();const o=await create();const item=(await db.query('select id from netbud.order_items where order_id=$1',[o.id])).rows[0].id;
 // Direct synthetic fixture setup intentionally bypasses workflow triggers, never used by runtime.
 await db.exec('set session_replication_role=replica');try{await db.query("update netbud.orders set status='completed',completed_at=now()-interval '91 days' where id=$1",[o.id]);}finally{await db.exec('set session_replication_role=origin');}
 await db.query("insert into netbud.artwork(item_id,design,slot,object_key,mime,bytes,proof_version) values($1,1,1,$2,'image/png',100,1)",[item,`${o.id}/${crypto.randomUUID()}.png`]);
 await repo.rpc('netbud_launch_retention_prepare');assert.deepEqual(await repo.rpc('netbud_launch_retention_candidates'),[]);
 await db.query("update netbud.outbox set status='accepted' where dedupe_key=$1",['retention:'+o.id]);assert.deepEqual(await repo.rpc('netbud_launch_retention_candidates'),[]);
 await db.query("update netbud.outbox set status='delivered',delivered_at=now()-interval '8 days' where dedupe_key=$1",['retention:'+o.id]);assert.equal((await repo.rpc('netbud_launch_retention_candidates')).length,1);
 await db.query('update netbud.retention_jobs set legal_hold=true where order_id=$1',[o.id]);assert.deepEqual(await repo.rpc('netbud_launch_retention_candidates'),[]);assert.ok((await db.query('select id from netbud.orders where id=$1',[o.id])).rows.length);
});
test('staging is off by default, rejects local capability exchange and requires real server identity',async()=>{
 assert.equal((await stagingHandler({})(new Request('https://staging.example.test/api/admin/orders'))).status,503);
 const handle=stagingHandler({ENVIRONMENT:'staging',STAGING_ADMIN_APPROVED:'true',APP_ORIGIN:'https://staging.example.test',RATE_LIMIT_HMAC_SECRET:crypto.randomUUID()},{repo,authenticate:async()=>{throw new ApiError(401,'authentication_required');}});
 assert.equal((await handle(new Request('https://staging.example.test/api/admin/session/exchange'),'test')).status,404);assert.equal((await handle(new Request('https://staging.example.test/api/test/orders'),'test')).status,404);assert.equal((await handle(new Request('https://staging.example.test/api/admin/orders'),'test')).status,401);
});
test('real staging Auth boundary cannot exchange a synthetic capability or trust a role header',async()=>{
 const handle=stagingHandler({ENVIRONMENT:'staging',STAGING_ADMIN_APPROVED:'true',APP_ORIGIN:'https://staging.example.test',SUPABASE_URL:'https://supabase.example.test',RATE_LIMIT_HMAC_SECRET:crypto.randomUUID()},{repo});
 const r=await handle(new Request('https://staging.example.test/api/admin/orders',{headers:{'x-role':'owner','x-capability':'ab'.repeat(32),cookie:'__Host-netbud-admin='+'ab'.repeat(32)}}),'test-network');assert.equal(r.status,401);
});
test('encrypted fixture backup restores database and private bytes; wrong key and tampering fail',async()=>{
 const o=await create(),objectKey=`${o.id}/${crypto.randomUUID()}.png`,objects=new Map([[objectKey,Buffer.from('synthetic-image-bytes-not-customer-artwork')]]);
 await db.query("insert into netbud.payments(order_id,provider_reference,kind,amount_cents,status,evidence_reference) values($1,$2,'deposit',123,'confirmed','synthetic-bank-fixture')",[o.id,crypto.randomUUID()]);
 const archive=await backupFixture(db,objects,key);assert.ok(!archive.includes(Buffer.from('example.test')));
 await assert.rejects(restoreFixture(archive,'cd'.repeat(32),()=>{throw Error('must not open');}));const bad=Buffer.from(archive);bad[bad.length-1]^=1;await assert.rejects(restoreFixture(bad,key,()=>{throw Error('must not open');}));
 const restored=await restoreFixture(archive,key,loadDataDir=>new PGlite({loadDataDir}));try{assert.equal((await restored.db.query('select id from netbud.orders where id=$1',[o.id])).rows[0].id,o.id);assert.equal(restored.objects.get(objectKey).toString(),objects.get(objectKey).toString());assert.ok((await restored.db.query('select count(*)::int n from netbud.outbox')).rows[0].n>0);assert.equal((await restored.db.query('select sum(amount_cents)::int cents from netbud.payments where order_id=$1',[o.id])).rows[0].cents,123);}finally{await restored.db.close();}
});
