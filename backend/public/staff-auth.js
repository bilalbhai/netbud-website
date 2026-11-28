// Invited staff only. Tokens exist in memory; no localStorage, registration or role selection.
window.NetBudStaff=(()=>{
 let config,token=null,expires=0,preMfa=null,factor=null;
 const $=id=>document.getElementById(id);
 async function provider(path,body,jwt){
  const r=await fetch(config.supabaseUrl+'/auth/v1/'+path,{method:body?'POST':'GET',headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(jwt?{Authorization:'Bearer '+jwt}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(10000)});
  const v=await r.json();if(!r.ok)throw Error('Authentication could not be completed. Check your details or contact the owner.');return v;
 }
 function clear(){token=null;expires=0;preMfa=null;factor=null;if($('enrol-secret'))$('enrol-secret').textContent='';}
 return {
 token(){if(Date.now()>=expires){token=null;return null;}return token;},
 async logout(){const current=token;clear();if(current)await provider('logout?scope=local',{},current);},
 bind(onReady,say){
  $('login-form').onsubmit=async e=>{
   e.preventDefault();$('login-button').disabled=true;
   try{
    config ||=await (await fetch('/api/staging/config',{cache:'no-store'})).json();
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl))throw Error('Staff authentication is not configured.');
    if(!preMfa){
     const password=$('staff-password').value;$('staff-password').value='';
     const v=await provider('token?grant_type=password',{email:$('staff-email').value.trim(),password});preMfa=v.access_token;
     if(typeof preMfa!=='string')throw Error('Authentication failed.');
     const user=await provider('user',null,preMfa);factor=user.factors?.find(x=>x.factor_type==='totp'&&x.status==='verified')?.id;
     if(!factor){const enrol=await provider('factors',{factor_type:'totp',friendly_name:'NetBud staff'},preMfa);factor=enrol.id;if(!enrol.totp?.secret)throw Error('Could not prepare TOTP enrollment.');$('enrol-secret').textContent='Add this key privately to your authenticator: '+enrol.totp.secret;}
     $('staff-code-section').hidden=false;$('staff-code').required=true;$('staff-code').focus();say('Enter the six-digit code from your authenticator. Do not share or record your setup key.');return;
    }
    const challenge=await provider('factors/'+encodeURIComponent(factor)+'/challenge',{},preMfa);
    const v=await provider('factors/'+encodeURIComponent(factor)+'/verify',{challenge_id:challenge.id,code:$('staff-code').value.trim()},preMfa);
    $('staff-code').value='';$('enrol-secret').textContent='';if(typeof v.access_token!=='string'||!Number.isFinite(v.expires_in))throw Error('MFA verification failed.');
    token=v.access_token;expires=Date.now()+Math.min(v.expires_in,1800)*1000;preMfa=null;factor=null;await onReady();
   }catch(error){clear();$('staff-code-section').hidden=true;$('staff-code').required=false;say(error.message);}
   finally{$('login-button').disabled=false;}
  };
 },
 };
})();
