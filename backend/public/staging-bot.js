// Staging-only checkout/OTP adapter. Failure never silently bypasses the challenge.
window.NetBudBot=(()=>{
 let configPromise,scriptPromise;
 async function config(){return configPromise ||=fetch('/api/staging/config',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Staging ordering is unavailable.');return r.json();});}
 async function load(){
  if(window.turnstile)return;
  await (scriptPromise ||=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.onload=resolve;s.onerror=()=>reject(Error('Could not load verification. Please retry.'));document.head.append(s);}));
 }
 return {async token(action){
  const c=await config();if(!c.guests||!c.turnstileSiteKey)throw Error('Staging ordering is unavailable.');await load();
  const box=document.createElement('div');box.className='panel';box.setAttribute('aria-label','Security verification');document.querySelector('main').append(box);
  return new Promise((resolve,reject)=>{let id,done=false;const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);if(id!==undefined)window.turnstile.remove(id);box.remove();error?reject(Error(error)):resolve(value);};const timer=setTimeout(()=>finish('Verification expired. Please retry.'),120000);
   id=window.turnstile.render(box,{sitekey:c.turnstileSiteKey,action,callback:v=>finish(null,v),'error-callback':()=>finish('Security verification failed. Please retry.'),'expired-callback':()=>finish('Verification expired. Please retry.')});
  });
 }};
})();
