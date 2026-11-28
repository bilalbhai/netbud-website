import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,lstat,copyFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url));
const top=new Set(['about','cart','contact','css','custom-websites','free-preview','how-it-works','images','js','portfolio','previews','pricing','privacy','product','services','shop','terms','thank-you']);
const ext=new Set(['.html','.css','.js','.svg','.png','.jpg','.jpeg','.gif','.webp','.avif','.ico','.woff','.woff2','.ttf','.mp4','.webm']);
const sha=v=>createHash('sha256').update(v).digest('hex');
export async function buildStaging(output=path.join(root,'.cache/phase-h-bundle')){
 const target=path.resolve(output);if(!target.startsWith(path.join(root,'.cache')+path.sep))throw Error('Build output must stay in workspace .cache');
 // Fresh directory only: never recursively delete an arbitrary caller-supplied path.
 await mkdir(target,{recursive:true});const publicDir=path.join(target,'public');
 try{if((await readdir(publicDir)).length)throw Error('Use a fresh build output directory');}catch(e){if(e.code!=='ENOENT')throw e;}
 await mkdir(publicDir,{recursive:true});const manifest=[];
 const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 for(const name of files){
  if(!((!name.includes('/')&&name.endsWith('.html'))||name==='robots.txt'||name==='sitemap.xml'||(top.has(name.split('/')[0])&&ext.has(path.extname(name).toLowerCase()))))continue;
  if(name.split('/').some(p=>p.startsWith('.')||/^(node_modules|backend|docs|private-backups|tmp)$/i.test(p)))continue;
  const source=path.join(root,name);if(!(await lstat(source)).isFile())throw Error('Non-file asset rejected');
  const bytes=await readFile(source);await mkdir(path.dirname(path.join(publicDir,name)),{recursive:true});await copyFile(source,path.join(publicDir,name));manifest.push({path:name,sha256:sha(bytes),unchanged:true});
 }
 const appFiles={'checkout/index.html':'checkout.html','checkout/checkout.js':'checkout.js','checkout/checkout.css':'checkout.css','track/index.html':'tracking.html','track/tracking.js':'tracking.js','admin/index.html':'admin.html','admin/admin.js':'admin.js','admin/admin.css':'admin.css','admin/staff-auth.js':'staff-auth.js','checkout/staging-bot.js':'staging-bot.js','admin/payments/index.html':'sandbox-payments.html','admin/payments.js':'sandbox-payments.js','payment/index.html':'payment.html','payment/payment.js':'payment.js'};
 const transform=(text,destination)=>{
  if(destination.endsWith('.html')){
   text=text.replace('Synthetic local workspace only. No actual MFA login, real mail, payment gateway or live carrier connection. All figures come from the local test database.','Isolated staging workspace. Synthetic orders only. Notifications remain off until the owner approves controlled testing.');
   if(destination==='admin/index.html'){
    text=text.replace('<script src="/admin/admin.js" defer>','<script src="/admin/staff-auth.js" defer></script><script src="/admin/admin.js" defer>');
    const start=text.indexOf('<section class="panel" id="login">'),end=text.indexOf('<div id="workspace"');if(start<0||end<0)throw Error('Login template boundary changed');
    text=text.slice(0,start)+'<section class="panel" id="login"><h2>Staff sign in</h2><p>Invited staff only. Customer accounts are not created.</p><form id="login-form"><label for="staff-email">Staff email</label><input id="staff-email" type="email" autocomplete="username" required><label for="staff-password">Password</label><input id="staff-password" type="password" autocomplete="current-password"><div id="staff-code-section" hidden><p id="enrol-secret"></p><label for="staff-code">Authenticator code</label><input id="staff-code" inputmode="numeric" pattern="[0-9]{6}" autocomplete="one-time-code"></div><button id="login-button">Continue securely</button></form></section>'+text.slice(end);
  }else if(destination.startsWith('checkout/')||destination.startsWith('track/')){text=text.replace('<script src=', '<script src="/checkout/staging-bot.js" defer></script><script src=');text=text.replace(/Local development only\.[\s\S]*?<\/p>/,'Isolated staging only. Use synthetic details and owner-approved test addresses. No payment is taken. Real email tests require separate owner approval.</p>');}
  }
  if(destination==='checkout/checkout.js')text=text.replaceAll('No payment taken or email sent.','No payment taken. Notification delivery is tracked separately.');
  if(destination.endsWith('.js'))text=text.replaceAll('/api/test/','/api/ordering/');
  if(destination==='admin/admin.js'){
   text=text.replace(/^\$\('login-form'\)\.onsubmit=.*$/m,"window.NetBudStaff.bind(async()=>{await enter();say('Staff MFA session opened.');},say);");
   text=text.replace("await api('session/logout',{});","try{await window.NetBudStaff.logout();}finally{out();}");
   if(text.includes('capability')||text.includes('session/exchange'))throw Error('Local capability login leaked');
   text=text.replaceAll("'Synthetic '+session.role","'Staff '+session.role");
   text=text.replaceAll('No email sent or payment gateway used.','Notification delivery is tracked separately. No payment gateway is used.');
   text=text.replaceAll('Recorded locally: ','Recorded in staging: ').replaceAll('Synthetic local session','Staff session');
  }
  return text;
 };
 for(const [dest,source] of Object.entries(appFiles)){const data=transform(await readFile(new URL('./public/'+source,import.meta.url),'utf8'),dest);await mkdir(path.dirname(path.join(publicDir,dest)),{recursive:true});await writeFile(path.join(publicDir,dest),data);manifest.push({path:dest,sha256:sha(data),application:true});}
 const result=await build({entryPoints:[fileURLToPath(new URL('./entry.mjs',import.meta.url))],outfile:path.join(publicDir,'_worker.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',metafile:true,sourcemap:false,legalComments:'none',minify:true});
 if(Object.keys(result.metafile.inputs).some(x=>/local-admin-session|\/test\/|backup\.mjs|local\.mjs/.test(x)))throw Error('Development code in server bundle');
 await writeFile(path.join(publicDir,'_routes.json'),JSON.stringify({version:1,include:['/api/*','/admin/*','/track/*','/checkout/*','/payment/*','/_worker.js','/backend/*','/docs/*'],exclude:[]}));
 for(const name of ['_worker.js','_routes.json'])manifest.push({path:name,sha256:sha(await readFile(path.join(publicDir,name))),application:true});
 await writeFile(path.join(target,'manifest.json'),JSON.stringify({environment:'staging',source:'bilalbhai/netbud-website',files:manifest,serverModules:Object.keys(result.metafile.inputs)},null,2));
 return {target,publicDir,assets:manifest.length,manifest};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await buildStaging(process.argv[2]),(k,v)=>k==='manifest'?undefined:v));
