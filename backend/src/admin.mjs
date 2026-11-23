import {fail,keys,text,uuid,digest} from './core.mjs';
const fields={accept:['order_id'],reject:['order_id'],assign:['order_id','staff_id'],staff_permission:['staff_id','role','active'],invite:['email','role'],note:['order_id','note'],quote_draft:['order_id','item_id','amount_cents','deposit_cents','scope','milestones','validity_days'],quote_prepare:['order_id','version_id'],quote_accept:['order_id','version_id','evidence'],manual_payment:['order_id','item_id','amount_cents','kind','evidence','verified'],refund_approve:['order_id','amount_cents','reason'],production:['order_id','item_id','status'],complete:['order_id'],shipment:['order_id','shipment_id','status','tracking','dispatch_date','notes','items','pickup_confirmed'],enquiry_intake:['source','type','fields'],enquiry_assign:['enquiry_id','staff_id'],enquiry_status:['enquiry_id','status'],draft_email:['order_id','message'],request_artwork:['order_id','message'],request_payment:['order_id','message'],order_update:['order_id','message'],tracking_details:['order_id','message']};
Object.assign(fields,{retention_hold:['order_id','hold','reason'],retention_record:['order_id','evidence','verified'],refund_record:['order_id','approval_id','evidence','verified'],proof_prepare:['order_id','item_id','manifest','reference','reviewed'],proof_approve:['order_id','item_id','proof_id','reply_hash','from_email','evidence','received_at','verified']});
export function validateAdmin(action,value){
 if(!fields[action])fail(400,'invalid_input');keys(value,fields[action]);
 for(const [key,v] of Object.entries(value)){
 if(key.endsWith('_id'))uuid(v);
 else if(['amount_cents','deposit_cents'].includes(key)){if(!Number.isSafeInteger(v)||v<0||v>100000000)fail(400,'invalid_input');}
 else if(key==='validity_days'){if(!Number.isInteger(v)||v<1||v>90)fail(400,'invalid_input');}
 else if(['verified','active','pickup_confirmed','reviewed','hold'].includes(key)){if(typeof v!=='boolean')fail(400,'invalid_input');}
 else if(!['items','fields','milestones','manifest'].includes(key))text(v,1,key==='scope'?4000:key==='message'||key==='note'||key==='notes'?1000:500);
 }
 if(action==='quote_draft'){
 if(!Array.isArray(value.milestones)||value.milestones.length>8)fail(400,'invalid_input');
 let sum=0;for(const m of value.milestones){keys(m,['label','amount_cents','due_date']);text(m.label,1,120);if(!Number.isSafeInteger(m.amount_cents)||m.amount_cents<1||!/^\d{4}-\d{2}-\d{2}$/.test(m.due_date))fail(400,'invalid_input');sum+=m.amount_cents;}if(value.milestones.length&&sum!==value.amount_cents)fail(400,'invalid_input');
 }
 if(action==='shipment'){if(!Array.isArray(value.items)||!value.items.length||value.items.length>20)fail(400,'invalid_input');const seen=new Set();for(const item of value.items){keys(item,['item_id','quantity']);uuid(item.item_id);if(seen.has(item.item_id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100)fail(400,'invalid_input');seen.add(item.item_id);}if(value.dispatch_date&&!Number.isFinite(Date.parse(value.dispatch_date)))fail(400,'invalid_input');}
 if(action==='enquiry_intake'){keys(value.fields,['name','email','phone','message']);text(value.fields.name,1,120);text(value.fields.message,1,2000);if(value.fields.phone!==undefined)text(value.fields.phone,0,30);if(!/^[^\s@]+@[^\s@]+\.test$/.test(value.fields.email))fail(400,'test_email_required');if(!/^https:\/\//.test(value.source))fail(400,'invalid_input');}
 if(action==='proof_prepare'){if(!Array.isArray(value.manifest)||value.manifest.length<1||value.manifest.length>5)fail(400,'invalid_input');for(const m of value.manifest){keys(m,['design','sha256','reference']);if(!Number.isInteger(m.design)||m.design<1||m.design>5||!/^[a-f0-9]{64}$/.test(m.sha256))fail(400,'invalid_input');text(m.reference,5,500);}}
 if(action==='proof_approve'&&(!/^[a-f0-9]{64}$/.test(value.reply_hash)||!Number.isFinite(Date.parse(value.received_at))))fail(400,'invalid_input');
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
 if(resource==='order'&&(await repo.rpc('netbud_staff',{p_actor:identity.id}))==='owner'){data.manual_proofs=await repo.rpc('netbud_manual_history',{p_actor:identity.id,p_order:query.id});data.manual_retention=await repo.rpc('netbud_manual_retention_status',{p_actor:identity.id,p_order:query.id});}
 if(resource==='export'){const r=new Response(csv(data),{headers:{'Content-Type':'text/csv; charset=utf-8','Cache-Control':'no-store','Content-Disposition':'attachment; filename="netbud-financial-page.csv"','X-Content-Type-Options':'nosniff'}});return r;}
 if(resource==='session'&&localSession)data.csrf=await localSession.csrfValue(request);
 return reply(200,data);
 }
 if(request.method==='POST'&&path==='/api/admin/action'){
 const v=await body();keys(v,['action','data']);validateAdmin(v.action,v.data);const key=uuid(request.headers.get('idempotency-key'));
 return reply(200,await repo.rpc(v.action.startsWith('proof_')?'netbud_manual_proof':v.action.startsWith('retention_')?'netbud_manual_retention':v.action==='refund_record'?'netbud_record_refund':'netbud_admin_write',{p_actor:identity.id,...(v.action==='refund_record'?{}:{p_action:v.action}),p_data:v.data,p_key:key,p_hash:await digest(JSON.stringify(v))}));
 }
 fail(404,'not_found');
 };
}
