import {fail,keys,text,uuid,digest,networkKey} from './core.mjs';
const COOKIE='__Host-netbud-guest';
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
export function generateCode(){
  // Rejection sampling avoids modulo bias for eight digits.
  const v=new Uint32Array(1);do{crypto.getRandomValues(v);}while(v[0]>=4200000000);
  return String(v[0]%100000000).padStart(8,'0');
}
export function createTracking({repo,secret,origin,delivery,localOnly=false,stagingOnly=false,allowEmail=email=>/^[^\s@]+@[^\s@]+\.test$/.test(email)}){
  if(!secret||secret.length<32)throw Error('OTP secret required');
  if(localOnly&&!['127.0.0.1','localhost','[::1]'].includes(new URL(origin).hostname))throw Error('Mock tracking requires a loopback origin');
  const mac=value=>networkKey(value,secret);
  const tokenFrom=r=>{const value=(r.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);if(!/^[a-f0-9]{64}$/.test(value||''))fail(401,'verification_required');return value;};
  const cookie=(value,maxAge)=>`${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Strict`;
  return async({request,body,network,reply})=>{
    // Never wire this mock delivery into the edge adapter. Public activation needs real bot protection.
    if((!localOnly&&!stagingOnly)||new URL(request.url).origin!==origin)fail(503,'tracking_disabled');
    if(request.headers.get('sec-fetch-site')==='cross-site'||(request.headers.has('origin')&&request.headers.get('origin')!==origin))fail(403,'origin_denied');
    const path=new URL(request.url).pathname;
    if(path==='/api/test/tracking/request'&&request.method==='POST'){
      const v=await body();keys(v,['email']);const email=text(v.email,3,254).toLowerCase();if(!allowEmail(email))fail(400,'test_email_required');
      const started=Date.now(),id=crypto.randomUUID(),code=generateCode();
      const allowed=await repo.rpc('netbud_otp_begin',{p_id:id,p_email:email,p_email_hash:await mac('email:'+email),p_hmac:await mac('code:'+id+':'+code),p_network:await mac('network:'+network)});
      // An outbox attachment failure must not disclose which addresses passed rate limits.
      if(allowed)try{await delivery.enqueue({id,email,code,expires:Date.now()+300000});}catch{/* Owner operations sees a missing payload; never expose a code or claim delivery. */}
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,150-(Date.now()-started))));
      return reply(202,{challenge:id,message:'If eligible, a verification code will be delivered. Codes expire after five minutes.'});
    }
    if(path==='/api/test/tracking/verify'&&request.method==='POST'){
      const v=await body();keys(v,['challenge','code']);uuid(v.challenge);if(!/^\d{8}$/.test(v.code))fail(400,'invalid_code');
      if(!await repo.rpc('netbud_rate',{p_key:'otp:verify:network:'+await mac(network),p_max:30,p_seconds:600}))fail(429,'rate_limited');
      if(!await repo.rpc('netbud_rate',{p_key:'otp:verify:global',p_max:1000,p_seconds:86400}))fail(429,'rate_limited');
      const token=randomToken();const ok=await repo.rpc('netbud_otp_verify',{p_id:v.challenge,p_hmac:await mac('code:'+v.challenge+':'+v.code),p_token_hash:await digest(token)});
      if(!ok)fail(400,'invalid_or_expired_code');
      // Rotate any existing browser session after successful verification.
      let previous;
      try{previous=tokenFrom(request);}catch(error){if(error.status!==401)throw error;}
      if(previous)await repo.rpc('netbud_guest_logout',{p_hash:await digest(previous)});
      const response=reply(200,{verified:true,csrf:await mac('csrf:'+token)});response.headers.set('Set-Cookie',cookie(token,1800));return response;
    }
    if(path==='/api/test/tracking/logout'&&request.method==='POST'){
      const token=tokenFrom(request);if(request.headers.get('x-csrf-token')!==await mac('csrf:'+token))fail(403,'csrf_denied');
      await repo.rpc('netbud_guest_logout',{p_hash:await digest(token)});const response=reply(200,{logged_out:true});response.headers.set('Set-Cookie',cookie('',0));return response;
    }
    if(request.method==='GET'&&(path==='/api/test/tracking/orders'||/^\/api\/test\/tracking\/orders\/[^/]+$/.test(path))){
      const token=tokenFrom(request),id=path.split('/')[5];if(id)uuid(id);
      const data=await repo.rpc('netbud_guest_orders',{p_hash:await digest(token),p_order:id||null});
      if(!data.authenticated)fail(401,'verification_required');if(id&&!data.orders.length)fail(404,'not_found');
      return reply(200,{orders:data.orders,csrf:await mac('csrf:'+token),artwork_approval_enabled:false});
    }
    fail(404,'not_found');
  };
}
