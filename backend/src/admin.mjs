import {fail,keys,text,uuid,digest,networkKey} from './core.mjs';
const fields={accept:['order_id'],reject:['order_id'],assign:['order_id','staff_id'],staff_permission:['staff_id','role','active'],invite:['email','role'],note:['order_id','note'],quote_draft:['order_id','item_id','amount_cents','deposit_cents','scope','milestones','validity_days'],quote_prepare:['order_id','version_id'],quote_accept:['order_id','version_id','evidence'],manual_payment:['order_id','item_id','amount_cents','kind','evidence','verified'],refund_approve:['order_id','amount_cents','reason'],production:['order_id','item_id','status'],complete:['order_id'],shipment:['order_id','shipment_id','status','tracking','dispatch_date','notes','items','pickup_confirmed'],enquiry_intake:['source','type','fields'],enquiry_assign:['enquiry_id','staff_id'],enquiry_status:['enquiry_id','status'],draft_email:['order_id','message'],request_artwork:['order_id','message'],request_payment:['order_id','message'],order_update:['order_id','message'],tracking_details:['order_id','message']};
export function validateAdmin(action,value){
 if(!fields[action])fail(400,'invalid_input');keys(value,fields[action]);
 for(const [key,v] of Object.entries(value)){
 if(key.endsWith('_id'))uuid(v);
 else if(['amount_cents','deposit_cents'].includes(key)){if(!Number.isSafeInteger(v)||v<0||v>100000000)fail(400,'invalid_input');}
 else if(key==='validity_days'){if(!Number.isInteger(v)||v<1||v>90)fail(400,'invalid_input');}
 else if(['verified','active','pickup_confirmed'].includes(key)){if(typeof v!=='boolean')fail(400,'invalid_input');}
 else if(!['items','fields','milestones'].includes(key))text(v,1,key==='scope'?4000:key==='message'||key==='note'||key==='notes'?1000:500);
 }
 if(action==='quote_draft'){
 if(!Array.isArray(value.milestones)||value.milestones.length>8)fail(400,'invalid_input');
 let sum=0;for(const m of value.milestones){keys(m,['label','amount_cents','due_date']);text(m.label,1,120);if(!Number.isSafeInteger(m.amount_cents)||m.amount_cents<1||!/^\d{4}-\d{2}-\d{2}$/.test(m.due_date))fail(400,'invalid_input');sum+=m.amount_cents;}if(value.milestones.length&&sum!==value.amount_cents)fail(400,'invalid_input');
 }
 if(action==='shipment'){if(!Array.isArray(value.items)||!value.items.length||value.items.length>20)fail(400,'invalid_input');const seen=new Set();for(const item of value.items){keys(item,['item_id','quantity']);uuid(item.item_id);if(seen.has(item.item_id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100)fail(400,'invalid_input');seen.add(item.item_id);}if(value.dispatch_date&&!Number.isFinite(Date.parse(value.dispatch_date)))fail(400,'invalid_input');}
 if(action==='enquiry_intake'){keys(value.fields,['name','email','phone','message']);text(value.fields.name,1,120);text(value.fields.message,1,2000);if(value.fields.phone!==undefined)text(value.fields.phone,0,30);if(!/^[^\s@]+@[^\s@]+\.test$/.test(value.fields.email))fail(400,'test_email_required');if(!/^https:\/\//.test(value.source))fail(400,'invalid_input');}
 return value;
}
export function csv(rows){const cell=v=>{let s=String(v??'');if(/^[\s\u0000-\u001f]*[=+@-]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const columns=rows.length?Object.keys(rows[0]):['id','created_at_sydney','customer_name','email','phone','effective_total','received','outstanding','status'];return [columns.map(cell).join(','),...rows.map(row=>columns.map(k=>cell(row[k])).join(','))].join('\r\n');}
export function createAdmin({repo,authenticate,origin,localSession=null}){
 return async({request,body,reply})=>{
 const u=new URL(request.url),path=u.pathname;
 if(localSession&&path.startsWith('/api/admin/session/')){if(!await repo.rpc('netbud_rate',{p_key:'admin-session:'+await digest(request.headers.get('user-agent')||'local'),p_max:20,p_seconds:600}))fail(429,'rate_limited');return localSession.route({request,body,reply});}
 const identity=await authenticate(request);if(identity.aal!=='aal2')fail(403,'mfa_required');
 if(request.method!=='GET'){
 if(request.headers.get('origin')!==origin)fail(403,'origin_denied');
 if(localSession)await localSession.csrf(request);
 if(!Number.isFinite(identity.mfaAt)||Math.abs(Date.now()/1000-identity.mfaAt)>600)fail(403,'fresh_mfa_required');
 }
 if(request.method==='GET'){
 const resource=path.split('/')[3];
 if(resource==='operations')return reply(200,await repo.rpc('netbud_launch_ops',{p_actor:identity.id}));
 if(!['session','overview','orders','order','staff','enquiries','reports','export'].includes(resource))fail(404,'not_found');
 const query=Object.fromEntries(u.searchParams);keys(query,['page','size','sort','search','status','id']);
 if(query.id)uuid(query.id);if(query.page&&!/^\d+$/.test(query.page))fail(400,'invalid_input');if(query.size&&!/^\d+$/.test(query.size))fail(400,'invalid_input');
 if(resource==='export'&&(!Number.isFinite(identity.mfaAt)||Math.abs(Date.now()/1000-identity.mfaAt)>600))fail(403,'fresh_mfa_required');
 const data=await repo.rpc('netbud_admin_read',{p_actor:identity.id,p_resource:resource,p_query:query});
 if(resource==='export'){const r=new Response(csv(data),{headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="netbud-financial-page.csv"','X-Content-Type-Options':'nosniff'}});return r;}
 if(resource==='session'&&localSession)data.csrf=await localSession.csrfValue(request);
 return reply(200,data);
 }
 if(request.method==='POST'&&path==='/api/admin/action'){
 const v=await body();keys(v,['action','data']);validateAdmin(v.action,v.data);const key=uuid(request.headers.get('idempotency-key'));
 return reply(200,await repo.rpc('netbud_admin_write',{p_actor:identity.id,p_action:v.action,p_data:v.data,p_key:key,p_hash:await digest(JSON.stringify(v))}));
 }
 fail(404,'not_found');
 };
}

// Local-only capability exchange: no fixed passwords, account registration or role override.
export function createLocalAdminSession({repo,origin,capabilities,secret}){
 if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local admin requires loopback');
 const sessions=new Map(),caps=new Map(),cookieName='__Host-netbud-admin';
 const ready=(async()=>{for(const c of capabilities)caps.set(await digest(c.token),{id:c.id,expires:Date.now()+600000});})();
 const token=r=>(r.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';
 async function session(r){const t=token(r);if(!/^[a-f0-9]{64}$/.test(t))fail(401,'authentication_required');const s=sessions.get(await digest(t));if(!s||s.expires<=Date.now())fail(401,'authentication_required');await repo.rpc('netbud_staff',{p_actor:s.id});return s;}
 const csrfValue=async r=>{await session(r);return networkKey('admin-csrf:'+token(r),secret);};
 const cookie=(t,age)=>`${cookieName}=${t}; Path=/; Max-Age=${age}; Secure; HttpOnly; SameSite=Strict`;
 return {
 async authenticate(r){const s=await session(r);return {id:s.id,aal:'aal2',mfaAt:s.mfaAt};},
 csrfValue,
 async csrf(r){if(r.headers.get('x-csrf-token')!==await csrfValue(r))fail(403,'csrf_denied');},
 async route({request,body,reply}){
 await ready;if(new URL(request.url).origin!==origin||request.headers.get('origin')!==origin||request.method!=='POST')fail(403,'origin_denied');
 if(request.url.endsWith('/exchange')){
 const value=await body();keys(value,['capability']);if(!/^[a-f0-9]{64}$/.test(value.capability))fail(401,'authentication_required');const hash=await digest(value.capability),cap=caps.get(hash);if(!cap||cap.expires<=Date.now())fail(401,'authentication_required');caps.delete(hash);await repo.rpc('netbud_staff',{p_actor:cap.id});
 const old=token(request);if(old)sessions.delete(await digest(old));
 const t=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');sessions.set(await digest(t),{id:cap.id,expires:Date.now()+1800000,mfaAt:Date.now()/1000});const r=reply(200,{synthetic_authentication:true});r.headers.set('Set-Cookie',cookie(t,1800));return r;
 }
 if(request.url.endsWith('/logout')){if(request.headers.get('x-csrf-token')!==await csrfValue(request))fail(403,'csrf_denied');sessions.delete(await digest(token(request)));const r=reply(200,{logged_out:true});r.headers.set('Set-Cookie',cookie('',0));return r;}
 fail(404,'not_found');
 }
 };
}
