// Server-only integration candidate. Nothing imports this from the public website.
import {fail} from './core.mjs';
const enc=new TextEncoder();
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
const bytes=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
async function key(raw){if(!/^[a-f0-9]{64}$/.test(raw||''))throw Error('32-byte transport key required');return crypto.subtle.importKey('raw',bytes(raw),'AES-GCM',false,['encrypt','decrypt']);}
export async function sealOtp(raw,id,code,expires){
 if(!/^\d{8}$/.test(code))throw Error('Invalid OTP');
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(id)},await key(raw),enc.encode(JSON.stringify({code,expires})));
 return {v:1,iv:hex(iv),cipher:hex(cipher)};
}
export async function openOtp(raw,id,payload,now=Date.now()){
 if(payload?.v!==1||!/^[a-f0-9]{24}$/.test(payload.iv)||!/^[a-f0-9]{32,1024}$/.test(payload.cipher))throw Error('Invalid envelope');
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(payload.iv),additionalData:enc.encode(id)},await key(raw),bytes(payload.cipher));
 const value=JSON.parse(new TextDecoder().decode(plain));
 if(!/^\d{8}$/.test(value.code)||!Number.isFinite(value.expires)||value.expires<=now||value.expires>now+300000)throw Error('Expired OTP');
 return value.code;
}
export class DurableOtpDelivery {
 constructor(repo,transportKey){this.repo=repo;this.key=transportKey;}
 async enqueue({id,email,code,expires}){
  // Recipient comes from the original challenge transaction, never a second browser field.
  if(!email.endsWith('.test'))throw Error('Public OTP activation remains blocked');
  const payload=await sealOtp(this.key,id,code,expires);
  await this.repo.rpc('netbud_launch_attach_otp',{p_id:id,p_payload:payload});
 }
}
const titles={order_received:'Order received',order_accepted:'Order accepted',order_cancelled:'Order cancelled',quote_prepared:'Quote prepared',request_payment:'Payment instructions',request_artwork:'Artwork requested',order_update:'Order update',tracking_details:'Dispatch and tracking',artwork_retention:'Artwork retention notice',email_otp:'Your verification code'};
export function renderMail(message,context,code){
 const title=titles[message.message_type];if(!title)throw Error('Unsupported notification');
 const ref=context?.reference||'';
 let text;
 if(message.message_type==='email_otp'){
  if(!/^\d{8}$/.test(code||''))throw Error('Missing code');
  text=`Your NetBud verification code is ${code}. It expires five minutes after the request. Do not share it. If you did not request this, ignore this email.`;
 }else{
  if(!ref)throw Error('Missing order context');
  if(message.message_type==='order_received')text='Order received — payment instructions will be provided after review.';
  else if(message.message_type==='order_accepted')text='NetBud has accepted your order. Payment and artwork requirements still apply.';
  else if(message.message_type==='order_cancelled')text='This order has been cancelled. Please contact NetBud if you have questions. This notification does not confirm a refund or movement of funds.';
  else if(message.message_type==='quote_prepared'){
   if(!context.quote)throw Error('Missing prepared quote');
   text=`Quote version ${context.quote.version}: A$${(context.quote.amount_cents/100).toFixed(2)}\n${context.quote.scope}\nValid until ${context.quote.valid_until}. This is a prepared quote, not evidence of your approval or payment.`;
  }else if(message.message_type==='artwork_retention')text='Your temporary artwork is scheduled for deletion 90 days after completion, and no sooner than seven days after this notice is delivered. Contact sales@netbud.com.au if you need a copy or have an unresolved issue. Required financial records are retained separately.';
  else {if(!context.draft?.body)throw Error('Owner-prepared message required');text=context.draft.body;}
  text=`Order ${ref}\n\n${text}\n\nView recorded progress through NetBud order tracking once it is activated. No online payment link is issued by this system.`;
 }
 return {to:message.recipient,subject:`NetBud | ${title}${ref?' | '+ref:''}`,text};
}
export class MockLaunchSender {
 constructor(){this.messages=new Map();this.real=false;}
 async send(mail,dedupe){this.messages.set(dedupe,{...mail});return {outcome:'accepted',id:'mock-'+dedupe};}
}
export class ResendSender {
 constructor({enabled=false,domainVerified=false,ownerApproved=false,apiKey,allowedRecipients=[],fetcher=fetch}){
  this.real=true;this.enabled=enabled&&domainVerified&&ownerApproved;this.apiKey=apiKey;this.allow=new Set(allowedRecipients);this.fetcher=fetcher;
 }
 async send(mail,dedupe){
  if(!this.enabled||!this.apiKey||!this.allow.has(mail.to))throw Error('Real sending not authorised');
  if(/[\r\n]/.test(mail.to+mail.subject)||!dedupe||dedupe.length>200)throw Error('Invalid message');
  let r;try{r=await this.fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${this.apiKey}`,'Content-Type':'application/json','Idempotency-Key':dedupe},body:JSON.stringify({from:'NetBud <noreply@netbud.com.au>',reply_to:'sales@netbud.com.au',to:[mail.to],subject:mail.subject,text:mail.text}),signal:AbortSignal.timeout(5000)});}catch{return {outcome:'uncertain'};}
  let v;try{v=await r.json();}catch{return {outcome:'uncertain'};}
  // 5xx/timeout can occur after acceptance: never retry automatically on ambiguous results.
  if(r.ok&&typeof v.id==='string'&&/^[a-f0-9-]{36}$/.test(v.id))return {outcome:'accepted',id:v.id};
  if(r.status===429)return {outcome:'retry'};
  return {outcome:r.status>=500||r.ok?'uncertain':'failed'};
 }
}
export async function dispatchLaunchMail({repo,sender,transportKey,enabled=false}){
 if(!enabled)return false;
 const m=await repo.rpc('netbud_launch_claim');if(!m)return false;
 let result;
 try{
  const code=m.challenge_id?await openOtp(transportKey,m.challenge_id,m.encrypted_payload):undefined;
  const context=await repo.rpc('netbud_launch_context',{p_id:m.id,p_lease:m.lease_token});
  // Recheck challenge/lease at the last database boundary before the external call.
  if(context===null)result={outcome:'failed'};
  else result=await sender.send(renderMail(m,context,code),'netbud-'+m.id);
 }catch{result={outcome:'failed'};}
 await repo.rpc('netbud_launch_finish',{p_id:m.id,p_lease:m.lease_token,p_outcome:result.outcome,p_provider:result.id||null});
 return true;
}
// HMAC signature verification uses the raw body, not parsed/re-serialized JSON.
export async function verifyResendEvent(request,secret,now=Date.now()){
 const id=request.headers.get('svix-id'),ts=request.headers.get('svix-timestamp'),signatures=request.headers.get('svix-signature')||'';
 if(!id||id.length>200||!/^\d{10}$/.test(ts||'')||Math.abs(now/1000-Number(ts))>300||!secret?.startsWith('whsec_'))fail(401,'invalid_webhook');
 const body=await request.text();if(enc.encode(body).length>65536)fail(413,'request_too_large');
 let raw;try{raw=Uint8Array.from(atob(secret.slice(6)),c=>c.charCodeAt(0));}catch{fail(401,'invalid_webhook');}
 const k=await crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['verify']);
 let ok=false;for(const sig of signatures.split(' ').slice(0,5)){if(!sig.startsWith('v1,'))continue;try{ok=await crypto.subtle.verify('HMAC',k,Uint8Array.from(atob(sig.slice(3)),c=>c.charCodeAt(0)),enc.encode(`${id}.${ts}.${body}`))||ok;}catch{}}
 if(!ok)fail(401,'invalid_webhook');
 let event;try{event=JSON.parse(body);}catch{fail(400,'invalid_webhook');}
 if(!['email.delivered','email.bounced','email.failed','email.complained'].includes(event.type)||!/^[a-f0-9-]{36}$/.test(event.data?.email_id||''))fail(400,'unsupported_event');
 return {id,provider:event.data.email_id,type:event.type};
}
export async function handleResendWebhook(request,{repo,secret,enabled=false}){
 if(!enabled)return Response.json({error:'webhook_disabled'},{status:503});
 if(request.method!=='POST')return new Response(null,{status:405});
 try{
  const e=await verifyResendEvent(request,secret);
  const saved=await repo.rpc('netbud_launch_event',{p_event:e.id,p_provider:e.provider,p_kind:e.type});
  // Unknown provider IDs can be an acceptance/webhook race: tell the provider to retry.
  return new Response(null,{status:saved?204:503});
 }catch(error){return Response.json({error:'webhook_rejected'},{status:error.status||503});}
}
