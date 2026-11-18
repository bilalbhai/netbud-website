import {createApi} from './api.mjs';
import {createAdmin} from './admin.mjs';
import {createTracking} from './tracking.mjs';
import {supabaseAuth} from './auth.mjs';
import {supabaseRepository} from './repository.mjs';
import {createTurnstile} from './bot-protection.mjs';
import {DurableOtpDelivery,ResendSender,dispatchLaunchMail,handleResendWebhook} from './launch-email.mjs';
import {fail} from './core.mjs';
const unavailable=()=>Response.json({error:'staging_disabled'},{status:503,headers:{'Cache-Control':'no-store'}});
function publishable(value){if(typeof value!=='string')return false;if(value.startsWith('sb_publishable_'))return true;try{return JSON.parse(atob(value.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role==='anon';}catch{return false;}}
export function createIntegration(env,{repo,authenticate,botGuard,fetcher=fetch}={}){
 let origin;try{origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN)throw Error();}catch{return unavailable;}
 if(env.ENVIRONMENT!=='staging'||env.STAGING_ADMIN_APPROVED!=='true')return unavailable;
 if(['netbud.com.au','www.netbud.com.au'].includes(origin.hostname))return unavailable;
 repo ||=supabaseRepository(env);
 const verify=authenticate||supabaseAuth(env,fetcher);
 const staff=async request=>{const identity=await verify(request);if(!identity.sessionId||!await repo.rpc('netbud_staff_session_live',{p_actor:identity.id,p_session:identity.sessionId}))fail(401,'authentication_required');return identity;};
 const allowed=new Set((env.EMAIL_ALLOWED_RECIPIENTS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean));
 const allowEmail=email=>/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)&&(email.endsWith('.test')||allowed.has(email));
 const guests=env.STAGING_GUEST_APPROVED==='true';
 if(guests&&(!env.TURNSTILE_SECRET_KEY||!env.TURNSTILE_SITE_KEY||env.TURNSTILE_HOSTNAME!==origin.hostname||!env.OTP_TRANSPORT_KEY_HEX||!env.OTP_HMAC_SECRET))return unavailable;
 const tracking=guests?createTracking({repo,origin:origin.origin,secret:env.OTP_HMAC_SECRET,stagingOnly:true,allowEmail,delivery:new DurableOtpDelivery(repo,env.OTP_TRANSPORT_KEY_HEX,allowEmail)}):null;
 const guard=guests?(botGuard||createTurnstile({repo,secret:env.TURNSTILE_SECRET_KEY,hostname:origin.hostname,fetcher})):null;
 const admin=createAdmin({repo,authenticate:staff,origin:origin.origin});
 const api=createApi({repo,authenticate:staff,origin:origin.origin,rateSecret:env.RATE_LIMIT_HMAC_SECRET,enabled:true,admin,tracking,botGuard:guard,allowEmail});
 return async(request,network)=>{
  const url=new URL(request.url);if(url.origin!==origin.origin)return new Response(null,{status:404});
  if(url.pathname==='/api/email/events')return handleResendWebhook(request,{repo,secret:env.RESEND_WEBHOOK_SECRET,enabled:env.EMAIL_WEBHOOK_APPROVED==='true'});
  if(url.pathname==='/api/staging/config'&&request.method==='GET'){
   if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(env.SUPABASE_URL||'')||!publishable(env.SUPABASE_PUBLISHABLE_KEY))return unavailable();
   return Response.json({supabaseUrl:env.SUPABASE_URL,publishableKey:env.SUPABASE_PUBLISHABLE_KEY,turnstileSiteKey:env.TURNSTILE_SITE_KEY||null,guests},{headers:{'Cache-Control':'no-store'}});
  }
  if(url.pathname.startsWith('/api/admin/session/'))return new Response(null,{status:404});
  if(url.pathname.startsWith('/api/admin/'))return api(request,network);
  if(guests&&url.pathname.startsWith('/api/ordering/')){url.pathname=url.pathname.replace('/api/ordering/','/api/test/');return api(new Request(url,request),network);}
  return new Response(null,{status:404});
 };
}
export async function runOperations(env,{repo,fetcher=fetch}={}){
 if(env.ENVIRONMENT!=='staging'||env.SCHEDULER_APPROVED!=='true')return {disabled:true};
 repo ||=supabaseRepository(env);const maintenance=await repo.rpc('netbud_maintenance');
 if(env.TRANSACTIONAL_EMAIL_ENABLED!=='true'||env.EMAIL_DOMAIN_VERIFIED!=='true'||env.EMAIL_OWNER_APPROVED!=='true')return {maintenance,email:'disabled'};
 const sender=new ResendSender({enabled:true,domainVerified:true,ownerApproved:true,apiKey:env.RESEND_API_KEY,allowedRecipients:(env.EMAIL_ALLOWED_RECIPIENTS||'').split(',').map(x=>x.trim()).filter(Boolean),fetcher});
 let attempts=0;while(attempts<3&&await dispatchLaunchMail({repo,sender,transportKey:env.OTP_TRANSPORT_KEY_HEX,enabled:true}))attempts++;
 return {maintenance,attempts};
}
