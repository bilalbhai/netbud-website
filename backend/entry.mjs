import {createIntegration,runOperations} from './src/integration.mjs';
const blocked=/^\/(backend|docs|scripts|test|tests|node_modules|private-backups|_worker|\.git|\.env|\.cache|tmp|output)(\/|\.|$)/i;
const app=/^\/(checkout|track|admin|payment)(\/|$)/;
export default {
 async fetch(request,env){
  const u=new URL(request.url);if(blocked.test(u.pathname)||u.pathname.includes('\\'))return new Response(null,{status:404});
  try{
   if(u.pathname.startsWith('/api/'))return await createIntegration(env)(request,request.headers.get('CF-Connecting-IP'));
   if(app.test(u.pathname)&&(env.ENVIRONMENT!=='staging'||env.STAGING_ADMIN_APPROVED!=='true'))return new Response(null,{status:404});
   const response=await env.ASSETS.fetch(request);
   if(!app.test(u.pathname))return response;
   const r=new Response(response.body,response);r.headers.set('Cache-Control','no-store');r.headers.set('X-Robots-Tag','noindex, nofollow');r.headers.set('Referrer-Policy','no-referrer');r.headers.set('X-Content-Type-Options','nosniff');
   const analytics=/^\/checkout\//.test(u.pathname)?' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com':'';
   r.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://challenges.cloudflare.com"+analytics+"; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com"+analytics+"; frame-src https://challenges.cloudflare.com; img-src 'self'"+analytics+"; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");return r;
  }catch{return Response.json({error:'backend_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
 },
 async scheduled(event,env,ctx){ctx.waitUntil(runOperations(env));}
};
