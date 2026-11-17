import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {database} from './test/database.mjs';
import {createApi} from './src/api.mjs';
import {ApiError} from './src/core.mjs';
const {db,repo}=await database();
const handle=createApi({repo,origin:'http://127.0.0.1:8787',rateSecret:crypto.randomUUID(),enabled:true,
 authenticate:async()=>{throw new ApiError(401,'authentication_required');}});
const server=createServer(async(req,res)=>{
 try {
  const request=new Request(`http://127.0.0.1:8787${req.url}`,{method:req.method,headers:req.headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body:Readable.toWeb(req),duplex:'half'})});
  const response=await handle(request,req.socket.remoteAddress);
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(400,{'Cache-Control':'no-store'});res.end('Invalid request');}
});
server.listen(8787,'127.0.0.1',()=>console.log('Disposable test API: http://127.0.0.1:8787 — synthetic .test orders only; staff HTTP access closed; all data lost on exit.'));
process.on('SIGINT',()=>server.close(async()=>{await db.close();process.exit(0);}));
