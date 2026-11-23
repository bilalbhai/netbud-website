import {spawn} from 'node:child_process';import {once} from 'node:events';import {fileURLToPath} from 'node:url';import {readFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const child=spawn(process.execPath,[fileURLToPath(new URL('../local.mjs',import.meta.url))],{stdio:['pipe','pipe','inherit'],windowsHide:true});const exited=once(child,'exit');let browser;
try{await once(child.stdout,'data');browser=await chromium.launch({channel:'msedge',headless:true});await mkdir(new URL('../../docs/ordering/phase-d-screenshots/',import.meta.url),{recursive:true});
for(const width of [375,430,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>r.request().url().startsWith('http://127.0.0.1:8787/')?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8787/track/');
 const email=`browser${width}@example.test`;
 // Create two synthetic orders without changing public checkout or fixtures.
 await page.evaluate(async email=>{for(let i=0;i<2;i++)await fetch('/api/test/orders',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({customer:{name:'Test Customer',email,phone:'0000000000'},items:[{product_id:5,quantity:1}],delivery:'pickup'})});},email);
 await page.fill('#email',email);await page.click('#send');await page.waitForSelector('#verify:not([hidden])');
 const inbox=JSON.parse(await readFile(new URL('../.cache/otp-inbox.json',import.meta.url),'utf8'));const code=inbox.find(x=>x.email===email).code;
 await page.fill('#code',code);await page.click('#verify-button');await page.waitForSelector('#dashboard:not([hidden])');assert.equal(await page.locator('#orders article').count(),2);
 const cookie=(await page.context().cookies()).find(c=>c.name==='__Host-netbud-guest');assert.ok(cookie?.httpOnly&&cookie?.secure);assert.equal(cookie.sameSite,'Strict');
 assert.equal(await page.evaluate(()=>document.cookie.includes('__Host-netbud-guest')),false);
 await page.locator('#orders article details').first().locator('summary').first().click();
 assert.match(await page.locator('#orders').innerText(),/Payment: unpaid/);assert.match(await page.locator('#orders').innerText(),/No dispatch or tracking has been recorded/);
 assert.equal(await page.locator('input[type=password],input[type=file]').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:fileURLToPath(new URL(`../../docs/ordering/phase-d-screenshots/tracking-${width}.png`,import.meta.url)),fullPage:true});
 await page.click('#logout');await page.waitForSelector('#signin:not([hidden])');assert.equal(await page.locator('#orders article').count(),0);assert.equal((await page.request.get('http://127.0.0.1:8787/api/test/tracking/orders')).status(),401);assert.deepEqual(errors,[]);
 console.log(`PASS ${width}px: private cookie, two orders, truthful states, responsive layout, logout`);await page.close();
}
}finally{await browser?.close();child.kill();await exited;}
