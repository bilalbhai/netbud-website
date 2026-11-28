import {fail,keys,digest,networkKey} from './core.mjs';
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
