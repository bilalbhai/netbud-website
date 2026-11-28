// Local rendering and mocked API transitions only. No real payment or Auth requests.
import http from 'node:http';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildStaging} from '../build.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const build=await buildStaging(path.resolve('.cache/revolut-browser-'+Date.now()));
const origin='http://127.0.0.1:8978';
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,origin);
  let file=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
  if (file.includes('..')) throw Error();
  const body=await readFile(path.join(build.publicDir,file));
  res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');
  res.end(body);
 }catch{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(8978,'127.0.0.1',resolve));
let browser;
try {
 browser=await chromium.launch({channel:'msedge',headless:true});
 for(const width of [375,430,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let creation=0;
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.origin!==origin)return route.abort();
   if(url.pathname==='/admin/staff-auth.js')return route.fulfill({contentType:'application/javascript',body:"window.NetBudStaff={token:()=> 'synthetic-token',bind:ready=>{window.testReady=ready;document.getElementById('login-form').onsubmit=e=>{e.preventDefault();ready();}},logout:async()=>{}};"});
   if(url.pathname==='/api/ordering/tracking/orders')return route.fulfill({json:{orders:[{id:'10000000-0000-4000-8000-000000000001',reference:'NB-TEST'}],csrf:'synthetic-csrf'}});
   if(url.pathname.endsWith('/status')&&url.pathname.startsWith('/api/'))return route.fulfill({json:[{state:'authorised',amount_cents:3900,refunded_cents:0,review_required:false}]});
   if(url.pathname.endsWith('/checkout')&&url.pathname.startsWith('/api/')){
    creation++;return route.fulfill({status:202,json:{state:'uncertain',checkout_url:null,sandbox:true}});
   }
   return route.continue();
  });
  await page.goto(origin+'/admin/payments/');
  await page.fill('#staff-email','owner@example.test');await page.click('#login-button');
  await page.waitForSelector('#workspace:not([hidden])');
  await page.fill('#order','10000000-0000-4000-8000-000000000001');
  await page.click('#create');await page.waitForFunction(()=>document.getElementById('feedback').textContent.includes('reconciliation'));
  await page.click('#status');await page.waitForFunction(()=>document.getElementById('results').textContent.includes('authorised'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if ([375,1440].includes(width)) await page.screenshot({path:path.resolve('.cache/full-launch/revolut-owner-'+width+'.png'),fullPage:true});
  await page.click('#logout');await page.waitForSelector('#login:not([hidden])');
  await page.goto(origin+'/payment/');await page.fill('#reference','NB-TEST');
  await page.click('button[value=status]');await page.waitForFunction(()=>document.getElementById('results').textContent.includes('authorised'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.click('button[value=checkout]');await page.waitForFunction(()=>document.getElementById('feedback').textContent.includes('reconciliation'));
  assert.equal(creation,2);assert.deepEqual(errors,[]);
  console.log('PASS '+width+'px: owner Sandbox controls, uncertain result, canonical status, guest CSRF transition, logout, no overflow');
  await page.close();
 }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
