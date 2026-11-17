import { createRemoteJWKSet, jwtVerify } from 'jose';
import { fail } from './core.mjs';
export function supabaseAuth(env, fetcher=fetch, verificationKey) {
  const base=new URL(env.SUPABASE_URL);
  if(base.protocol!=='https:') throw new Error('HTTPS Supabase origin required');
  const jwks=verificationKey||createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json',base));
  return async request=>{
    const token=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(request.headers.get('authorization')||'')?.[1];
    if(!token) fail(401,'authentication_required');
    let payload;
    try { ({payload}=await jwtVerify(token,jwks,{issuer:`${base.origin}/auth/v1`,audience:'authenticated',algorithms:['ES256','RS256'],requiredClaims:['exp','iat','sub','aal','session_id']})); }
    catch { fail(401,'authentication_required'); }
    if(payload.aal!=='aal2'||payload.role!=='authenticated') fail(403,'mfa_required');
    // Live Auth check also rejects invalid/deleted users; staff.active is checked separately on every RPC.
    let response;
    try { response=await fetcher(`${base.origin}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(5000)}); }
    catch { fail(503,'authentication_unavailable'); }
    if(!response.ok) fail(response.status>=500?503:401,'authentication_required');
    const user=await response.json(); if(user.id!==payload.sub) fail(401,'authentication_required');
    const mfaAt=Math.max(0,...(Array.isArray(payload.amr)?payload.amr:[]).filter(x=>x.method==='totp').map(x=>Number(x.timestamp)||0));
    return {id:payload.sub,aal:payload.aal,mfaAt};
  };
}
