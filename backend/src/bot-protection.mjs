import {fail,digest} from './core.mjs';
// Shared boundary for future checkout, OTP, enquiry and upload handlers. No public routes installed.
export function createTurnstile({secret,hostname,repo,fetcher=fetch,clock=Date.now}){
 if(!secret||!hostname)throw Error('Turnstile configuration required');
 return async function verify(token,action){
  if(!['checkout','otp','enquiry','artwork'].includes(action)||typeof token!=='string'||token.length<1||token.length>2048)fail(403,'bot_verification_failed');
  let r,v;try{r=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret,response:token}),signal:AbortSignal.timeout(5000)});v=await r.json();}catch{fail(503,'bot_verification_unavailable');}
  const age=clock()-Date.parse(v.challenge_ts);
  if(!r.ok||v.success!==true||v.hostname!==hostname||v.action!==action||!Number.isFinite(age)||age< -30000||age>300000)fail(403,'bot_verification_failed');
  if(!await repo.rpc('netbud_launch_bot_once',{p_hash:await digest(token)}))fail(403,'bot_verification_failed');
  return true;
 };
}
