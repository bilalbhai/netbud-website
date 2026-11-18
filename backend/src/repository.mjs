import { ApiError } from './core.mjs';
export function mapDatabaseError(error) {
  const message=String(error?.message||'');
  for(const [name,status] of Object.entries({access_denied:403,idempotency_conflict:409,invalid_transition:409,invalid_product:400,invalid_delivery:400,invalid_input:400,capacity_unavailable:503,invalid_lease:409,artwork_validation_unavailable:409})) if(message.includes(name)) return new ApiError(status,name);
  if(['22P02','23502','23514','22003'].includes(error?.code)) return new ApiError(400,'invalid_input');
  return new ApiError(503,'backend_unavailable');
}
export function supabaseRepository(env, fetcher=fetch) {
  const origin=new URL(env.SUPABASE_URL); if(origin.protocol!=='https:') throw new Error('HTTPS required');
  return { async rpc(name,args={}) {
    if(!/^netbud_(manual_retention|manual_retention_status|record_refund|staff_session_live|manual_proof|manual_history|maintenance|admin_read|admin_write|otp_begin|otp_verify|guest_orders|guest_logout|catalogue|estimate|staff|rate|create|order|update|artwork|claim_mail|finish_mail|launch_(attach_otp|claim|context|finish|event|bot_once|ops|reserve|retention_prepare|retention_candidates))$/.test(name)) throw new Error('Unknown operation');
    let r; try { r=await fetcher(`${origin.origin}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(5000)}); }
    catch { throw new ApiError(503,'backend_unavailable'); }
    let body; try { body=await r.json(); } catch { throw new ApiError(503,'backend_unavailable'); }
    if(!r.ok) throw mapDatabaseError(body); return body;
  }};
}
