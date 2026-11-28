// Prepare an inert staging upload, never deploy or read environment secrets.
import {buildStaging} from './build.mjs';
import {readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function inspectArtifact(bundle){
 const allowed=new Map(bundle.manifest.map(file=>[file.path,file.sha256]));
 if(!allowed.has('_worker.js')||!allowed.has('_routes.json'))throw Error('Missing reviewed server artifacts');
 const files=[];
 async function walk(dir,prefix=''){
  for(const name of await readdir(dir)){
   const relative=prefix+name,absolute=path.join(dir,name),stat=await lstat(absolute);
   if(stat.isSymbolicLink())throw Error('Symlink in deployment artifact');
   if(stat.isDirectory()){await walk(absolute,relative+'/');continue;}
   if(!stat.isFile()||!allowed.has(relative))throw Error('Unexpected deployment file: '+relative);
   const hash=sha(await readFile(absolute));
   if(allowed.get(relative)&&allowed.get(relative)!==hash)throw Error('Changed deployment file: '+relative);
   files.push({path:relative,sha256:hash,bytes:stat.size});
  }
 }
 await walk(bundle.publicDir);
 if(files.length!==allowed.size)throw Error('Missing deployment file');
 return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export async function prepareCloudflare(project,origin){
 if(!/^[a-z0-9][a-z0-9-]{1,56}[a-z0-9]$/.test(project||''))throw Error('Supply the actual Cloudflare staging project name');
 const url=new URL(origin);
 if(url.protocol!=='https:'||url.origin!==origin||url.hostname!==project+'.pages.dev')throw Error('Use the staging project HTTPS pages.dev origin');
 const bundle=await buildStaging(path.join(root,'.cache','netbud-release-'+randomUUID()));
 const vars=JSON.parse(await readFile(new URL('./config/staging.example.json',import.meta.url),'utf8'));
 vars.APP_ORIGIN=origin;
 await writeFile(path.join(bundle.target,'wrangler.json'),JSON.stringify({name:project,pages_build_output_dir:'./public',compatibility_date:'2026-11-20',vars},null,2)+'\n');
 const files=await inspectArtifact(bundle);
 await writeFile(path.join(bundle.target,'artifact-review.json'),JSON.stringify({preparedAt:new Date().toISOString(),purpose:'staging only; all activation gates false',project,origin,files},null,2)+'\n');
 return {directory:bundle.target,publicDirectory:bundle.publicDir,files:files.length,activation:'disabled',deployed:false};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await prepareCloudflare(process.argv[2],process.argv[3])));
