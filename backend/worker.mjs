import {createApi} from './src/api.mjs';
import {supabaseRepository} from './src/repository.mjs';
import {supabaseAuth} from './src/auth.mjs';
// Manual integration candidate only: deliberately outside the site's functions/ directory.
// No deployment configuration, cron registration or public route is installed.
export default {async fetch(request,env){
  if(env.ENVIRONMENT!=='development'||env.ORDERING_ENABLED!=='true')return Response.json({error:'development_only'},{status:503,headers:{'Cache-Control':'no-store'}});
  try {
    const handle=createApi({repo:supabaseRepository(env),authenticate:supabaseAuth(env),origin:env.APP_ORIGIN,rateSecret:env.RATE_LIMIT_HMAC_SECRET,enabled:true});
    // Only trust this header in the actual Cloudflare runtime; local runner uses socket address.
    return await handle(request,request.headers.get('CF-Connecting-IP'));
  } catch {return Response.json({error:'configuration_required'},{status:503,headers:{'Cache-Control':'no-store'}});}
}};
