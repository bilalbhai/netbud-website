import {createApi} from './src/api.mjs';
import {createAdmin} from './src/admin.mjs';
import {supabaseAuth} from './src/auth.mjs';
import {supabaseRepository} from './src/repository.mjs';
// Staging API candidate only. No route, deployment config, scheduler or static-site change.
export function stagingHandler(env,{repo,authenticate}={}){
 if(env.ENVIRONMENT!=='staging'||env.STAGING_ADMIN_APPROVED!=='true'||!/^https:\/\//.test(env.APP_ORIGIN||''))return async()=>Response.json({error:'staging_disabled'},{status:503});
 // Dependency injection supports isolated tests. It is never selected from request fields or env role names.
 repo ||=supabaseRepository(env);authenticate ||=supabaseAuth(env);
 const admin=createAdmin({repo,authenticate,origin:env.APP_ORIGIN});
 const api=createApi({repo,authenticate,origin:env.APP_ORIGIN,rateSecret:env.RATE_LIMIT_HMAC_SECRET,enabled:true,admin});
 return async(request,network)=>{
  if(new URL(request.url).origin!==env.APP_ORIGIN||!new URL(request.url).pathname.startsWith('/api/admin/')||new URL(request.url).pathname.startsWith('/api/admin/session/'))return Response.json({error:'not_found'},{status:404});
  // Staging accepts verified Supabase bearer JWTs only; no ambient-cookie or local-capability fallback.
  return api(request,network);
 };
}
