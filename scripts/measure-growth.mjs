// Repeatable synthetic browser measurements, not CrUX/field Core Web Vitals.
import {preview,root} from './lib/preview-server.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const phase=process.argv[2];if(!['before','after'].includes(phase))throw Error('Choose before or after');
const app=await preview(),browser=await chromium.launch({channel:'msedge',headless:true});
const dir=path.join(root,'docs/growth-optimisation');await mkdir(dir,{recursive:true});const results=[];
try{
 for(const route of ['/','/shop/custom-nfc-business-card/'])for(let sample=1;sample<=3;sample++){
  const context=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'no-preference'});await context.route('**/*',r=>r.request().url().startsWith(app.origin+'/')?r.continue():r.abort());const page=await context.newPage();
  await page.addInitScript(()=>{window.__review={lcp:0,cls:0,longTasks:0,events:[]};let windowStart=0,lastShift=0,sum=0;
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__review.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries()){if(e.hadRecentInput)continue;if(e.startTime-lastShift>1000||e.startTime-windowStart>5000){sum=0;windowStart=e.startTime;}lastShift=e.startTime;sum+=e.value;window.__review.cls=Math.max(sum,window.__review.cls);}}).observe({type:'layout-shift',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__review.longTasks+=Math.max(0,e.duration-50);}).observe({type:'longtask',buffered:true});
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.interactionId)window.__review.events.push(e.duration);}).observe({type:'event',durationThreshold:16,buffered:true});}catch{}
  });
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:40,downloadThroughput:200000,uploadThroughput:100000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const response=await page.goto(app.origin+route);if(!response.ok())throw Error('Preview returned '+response.status());await page.waitForTimeout(6500);
  const metrics=await page.evaluate(()=>({...window.__review,resources:performance.getEntriesByType('resource').filter(r=>r.name.startsWith(location.origin)).map(r=>({path:new URL(r.name).pathname,bytes:r.transferSize,ms:r.duration})),navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd})),overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelector('h1')?.innerText}));
  results.push({phase,route,width:375,sample,...metrics});console.log(JSON.stringify({phase,route,sample,lcp:metrics.lcp,cls:metrics.cls,longTasks:metrics.longTasks,resourceBytes:metrics.resources.reduce((n,r)=>n+r.bytes,0)}));
  if(sample===1)await page.screenshot({path:path.join(dir,`${phase}-${route==='/'?'home':'nfc'}-375.png`)});await context.close();
 }
 for(const route of ['/','/shop/custom-nfc-business-card/','/contact/']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});await context.route('**/*',r=>r.request().url().startsWith(app.origin+'/')?r.continue():r.abort());const page=await context.newPage();await page.goto(app.origin+route);await page.waitForTimeout(800);await page.screenshot({path:path.join(dir,`${phase}-${route==='/'?'home':route==='/contact/'?'contact':'nfc'}-1440.png`)});await context.close();
 }
 await writeFile(path.join(dir,phase+'-measurements.json'),JSON.stringify({method:'Edge headless, loopback HTTP no-store; 375x900; cold cache; 4x CPU; 40ms latency; 200KB/s download; external fonts/Google blocked; 6.5s observation after load; 3 samples each; not production field data',results},null,2));
}finally{await browser.close();await app.close();}
