import {createLocalAdminSession} from './src/local-admin-session.mjs';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {database,actors} from './test/database.mjs';
import {createAdmin} from './src/admin.mjs';
import {createApi} from './src/api.mjs';
import {ApiError} from './src/core.mjs';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createTracking} from './src/tracking.mjs';
import {LocalOtpDelivery} from './test/mock-otp.mjs';
const {db,repo}=await database();
await db.exec('update netbud.runtime_policy set manual_artwork_enabled=true');
const inboxFile=new URL('./.cache/otp-inbox.json',import.meta.url);
await mkdir(new URL('./.cache/',import.meta.url),{recursive:true});
await writeFile(inboxFile,'[]',{mode:0o600});
const delivery=new LocalOtpDelivery(repo,entries=>writeFile(inboxFile,JSON.stringify(entries),{mode:0o600}));
const cleanup=setInterval(()=>delivery.flush().catch(()=>{}),10000);cleanup.unref();
const tracking=createTracking({repo,secret:crypto.randomUUID(),origin:'http://127.0.0.1:8787',delivery,localOnly:true});
const adminFile=new URL('./.cache/admin-access.json',import.meta.url);
const capabilities=Object.entries(actors).filter(([role])=>role!=='stranger').map(([role,id])=>({role,id,token:Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('')}));
await writeFile(adminFile,JSON.stringify(capabilities),{mode:0o600});
const localSession=createLocalAdminSession({repo,origin:'http://127.0.0.1:8787',capabilities,secret:crypto.randomUUID()});
const admin=createAdmin({repo,origin:'http://127.0.0.1:8787',authenticate:localSession.authenticate,localSession});
const handle=createApi({repo,origin:'http://127.0.0.1:8787',rateSecret:crypto.randomUUID(),enabled:true,tracking,admin,
 authenticate:async()=>{throw new ApiError(401,'authentication_required');}});
const server=createServer(async(req,res)=>{
 try {
  const files={'/admin/':['./public/admin.html','text/html'],'/admin/admin.js':['./public/admin.js','text/javascript'],'/admin/admin.css':['./public/admin.css','text/css'],'/track/':['./public/tracking.html','text/html'],'/track/tracking.js':['./public/tracking.js','text/javascript'],'/checkout/':['./public/checkout.html','text/html'],'/checkout/checkout.js':['./public/checkout.js','text/javascript'],'/checkout/checkout.css':['./public/checkout.css','text/css'],'/css/style.css':['../css/style.css','text/css'],'/images/logo.svg':['../images/logo.svg','image/svg+xml']};
  const asset=files[req.url?.split('?')[0]];
  if(asset&&req.method==='GET'){res.writeHead(200,{'Content-Type':asset[1],'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(await readFile(new URL(asset[0],import.meta.url)));return;}
  const request=new Request(`http://127.0.0.1:8787${req.url}`,{method:req.method,headers:req.headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Readable.toWeb(req),duplex:'half'})});
  const response=await handle(request,req.socket.remoteAddress);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(400,{'Cache-Control':'no-store'});res.end('Invalid request');}
});
server.listen(8787,'127.0.0.1',()=>console.log('Disposable test API: http://127.0.0.1:8787 — synthetic .test orders only; staff HTTP access closed; all data lost on exit.'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{clearInterval(cleanup);await rm(inboxFile,{force:true});await rm(adminFile,{force:true});await db.close();process.exit(0);}));
