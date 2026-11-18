// HTTPS loopback test; Auth, Turnstile and mail are explicitly mocked. Never a hosted-service claim.
import https from 'node:https';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from 'jose';
import {database,actors} from './database.mjs';
import {buildStaging} from '../build.mjs';
import {createIntegration} from '../src/integration.mjs';
import {supabaseAuth} from '../src/auth.mjs';
import {MockLaunchSender,dispatchLaunchMail} from '../src/launch-email.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='https://127.0.0.1:8943',root=fileURLToPath(new URL('../../',import.meta.url));
const {db,repo}=await database(),pair=await generateKeyPair('ES256'),sessionId=crypto.randomUUID(),factorId=crypto.randomUUID();
const env={ENVIRONMENT:'staging',STAGING_ADMIN_APPROVED:'true',STAGING_GUEST_APPROVED:'true',APP_ORIGIN:origin,SUPABASE_URL:'https://phaseh.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_synthetic',TURNSTILE_SECRET_KEY:'synthetic',TURNSTILE_SITE_KEY:'synthetic',TURNSTILE_HOSTNAME:'127.0.0.1',OTP_HMAC_SECRET:crypto.randomUUID(),OTP_TRANSPORT_KEY_HEX:'ab'.repeat(32),RATE_LIMIT_HMAC_SECRET:crypto.randomUUID()};
await db.query('insert into auth.sessions(id,user_id) values($1,$2)',[sessionId,actors.owner]);await db.exec('update netbud.runtime_policy set manual_artwork_enabled=true');
const token=aal=>new SignJWT({sub:actors.owner,role:'authenticated',aal,session_id:sessionId,amr:aal==='aal2'?[{method:'totp',timestamp:Math.floor(Date.now()/1000)}]:[]}).setProtectedHeader({alg:'ES256'}).setIssuedAt().setExpirationTime('5m').setIssuer(env.SUPABASE_URL+'/auth/v1').setAudience('authenticated').sign(pair.privateKey);
const fetcher=async(url,opts)=>{
 if(url===env.SUPABASE_URL+'/auth/v1/user')return Response.json({id:actors.owner});
 if(url==='https://challenges.cloudflare.com/turnstile/v0/siteverify'){const t=JSON.parse(opts.body).response;return Response.json({success:true,hostname:'127.0.0.1',action:t.split(':')[0],challenge_ts:new Date().toISOString()});}
 throw Error('Unexpected external service request');
};
const handle=createIntegration(env,{repo,authenticate:supabaseAuth(env,fetcher,pair.publicKey),fetcher}),sender=new MockLaunchSender();
const bundle=await buildStaging(path.join(root,'.cache','h-browser-'+crypto.randomUUID()));
const files=new Set(bundle.manifest.map(x=>'/'+x.path));
const screenshotDir=path.join(root,'docs/ordering/phase-h-screenshots');await mkdir(screenshotDir,{recursive:true});
const server=https.createServer({key:await readFile(new URL('../.cache/h-tls/private.key',import.meta.url)),cert:await readFile(new URL('../.cache/h-tls/certificate.pem',import.meta.url))},async(req,res)=>{
 try{
  const u=new URL(req.url,origin);
  if(u.pathname.startsWith('/api/')){
   const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
   const r=await handle(new Request(u,{method:req.method,headers:req.headers,...(req.method==='GET'?{}:{body:Buffer.concat(chunks)})}),req.socket.remoteAddress);
   res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return;
  }
  const p=u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname;if(!files.has(p)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store','Referrer-Policy':'no-referrer',...(/^\/(admin|checkout|track)\//.test(u.pathname)?{'Content-Security-Policy':"default-src 'self'; script-src 'self' https://challenges.cloudflare.com; connect-src 'self' https://*.supabase.co; frame-src https://challenges.cloudflare.com; img-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'"}:{} )});res.end(await readFile(path.join(bundle.publicDir,p)));
 }catch{res.writeHead(503);res.end();}
});
let browser;
try{
 await new Promise(resolve=>server.listen(8943,'127.0.0.1',resolve));browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [375,430,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());if(url.origin===origin)return route.continue();
   const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'apikey,authorization,content-type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
   if(url.origin===env.SUPABASE_URL){
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    let body;if(url.pathname.endsWith('/token'))body={access_token:await token('aal1'),expires_in:300};else if(url.pathname.endsWith('/user'))body={id:actors.owner,factors:width===430?[]:[{id:factorId,status:'verified',factor_type:'totp'}]};else if(url.pathname.endsWith('/factors'))body={id:factorId,totp:{secret:'SYNTHETIC-ENROLLMENT-NOT-A-REAL-KEY'}};else if(url.pathname.endsWith('/challenge'))body={id:crypto.randomUUID()};else if(url.pathname.endsWith('/verify')){assert.equal(request.postDataJSON().code,'123456');body={access_token:await token('aal2'),expires_in:300};}else if(url.pathname.endsWith('/logout')){body={};}else throw Error('Unexpected Auth route');return route.fulfill({headers,body:JSON.stringify(body)});
   }
   if(url.hostname==='challenges.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:"window.turnstile={render:(box,options)=>{queueMicrotask(()=>options.callback(options.action+':'+crypto.randomUUID()));return 'test-widget'},remove:()=>{}}"});
   return route.abort();
  });
  await page.goto(origin+'/checkout/');await page.selectOption('#product','5');await page.click('#add');await page.selectOption('#delivery','pickup');await page.fill('#name','Synthetic Customer');const email='h-browser-'+width+'@example.test';await page.fill('#email',email);await page.fill('#phone','0000000000');await page.waitForFunction(()=>!document.querySelector('#place').disabled);
  assert.equal(await page.locator('input[type=file]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);await page.screenshot({path:path.join(screenshotDir,'checkout-'+width+'.png'),fullPage:true});await page.click('#place');await page.waitForSelector('#confirmation:not([hidden])');assert.equal(await page.evaluate(()=>document.activeElement.id),'confirmation');
  await page.goto(origin+'/track/');await page.fill('#email',email);await page.click('#send');await page.waitForSelector('#verify:not([hidden])');let attempts=0;while(attempts++<10&&await dispatchLaunchMail({repo,sender,transportKey:env.OTP_TRANSPORT_KEY_HEX,enabled:true})){}
  const mail=[...sender.messages.values()].find(m=>m.to===email&&m.subject.includes('verification code'));assert.ok(mail);const code=mail.text.match(/\b\d{8}\b/)[0];await page.fill('#code',code);await page.click('#verify-button');await page.waitForSelector('#dashboard:not([hidden])');
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-netbud-guest');assert.ok(cookie?.httpOnly&&cookie?.secure);assert.equal(cookie.sameSite,'Strict');assert.ok(!await page.evaluate(()=>document.cookie.includes('__Host-netbud-guest')));await page.locator('#orders details summary').first().click();await page.screenshot({path:path.join(screenshotDir,'tracking-'+width+'.png'),fullPage:true});await page.click('#logout');await page.waitForSelector('#signin:not([hidden])');
  await page.goto(origin+'/admin/');await page.fill('#staff-email','owner@example.test');await page.fill('#staff-password','synthetic-test-input');await page.click('#login-button');await page.waitForSelector('#staff-code-section:not([hidden])');assert.equal(await page.locator('#workspace').isVisible(),false);assert.equal(await page.locator('#staff-password').inputValue(),'');await page.fill('#staff-code','123456');await page.click('#login-button');await page.waitForSelector('#workspace:not([hidden])');assert.match(await page.locator('#role').innerText(),/Staff owner/);assert.equal(await page.locator('#enrol-secret').innerText(),'');assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(k=>/token|auth|session/i.test(k))),false);
  await page.locator('button.record-link').first().click();await page.waitForSelector('#detail:not([hidden])');await page.selectOption('#action','accept');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('Order status: accepted'));await page.selectOption('#action','proof_prepare');await page.fill('[data-proof=sha256]','CD'.repeat(32));await page.fill('[data-proof=reference]','synthetic-proof-archive');await page.fill('#f-reference','synthetic-reviewed-delivery');await page.check('#f-reviewed');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#detail').textContent.includes('awaiting actual customer reply'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.keyboard.press('Tab');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');await page.screenshot({path:path.join(screenshotDir,'admin-'+width+'.png'),fullPage:true});await page.click('#logout');await page.waitForSelector('#login:not([hidden])');assert.equal(await page.evaluate(()=>window.NetBudStaff.token()),null);await page.goto(origin+'/');await page.waitForTimeout(1200);assert.ok(await page.locator('h1').first().isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.evaluate(()=>scrollTo(0,800));await page.waitForTimeout(100);await page.evaluate(()=>scrollTo(0,0));assert.deepEqual(errors,[]);console.log('PASS marketing smoke '+width+'px with reduced motion; protected source unchanged');console.log('PASS HTTPS '+width+'px: checkout, mock OTP, Secure HttpOnly cookie, staff JWT/TOTP'+(width===430?' enrollment':'')+', keyboard, reduced motion and logout');await context.close();
 }
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await db.close();}
