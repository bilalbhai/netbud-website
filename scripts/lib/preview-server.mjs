// Read-only loopback preview of public NetBud files. No backend, private files or external writes.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=fileURLToPath(new URL('../../',import.meta.url));
export async function preview(port=8971){
 const origin='http://127.0.0.1:'+port;
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,origin),relative=decodeURIComponent(url.pathname).replace(/^\//,''),p=path.resolve(root,relative+(url.pathname.endsWith('/')?'index.html':''));
  if(!p.startsWith(path.resolve(root)+path.sep)||!(relative===''||/^(?:[^/]+\.html|(?:js|css|images|shop|about|cart|contact|custom-websites|free-preview|how-it-works|portfolio|pricing|privacy|product|services|terms|thank-you|previews)\/)/.test(relative))||relative.includes('..'))throw Error('Private path');
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'}[path.extname(p)];if(!type)throw Error('Not public asset');
  const data=await readFile(p);res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Length':data.length});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}});
 await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));return {origin,close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})};
}
