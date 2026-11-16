/* GitHub Pages clean routes: real directories, no hosting rewrite dependency. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),origin='https://netbud.com.au';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'shop')).filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>'shop/'+f));
const clean=p=>p.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
for(const file of files){
 if(file==='404.html')continue;
 let html=fs.readFileSync(path.join(root,file),'utf8');
 html=html.replace(/\b(href|src)="([^"]+)"/g,(all,key,value)=>{
  if(/^(?:#|mailto:|tel:|data:|javascript:)/.test(value))return all;
  const u=new URL(value,origin+'/'+file);if(u.origin!==origin)return all;
  u.pathname=clean(u.pathname);return key+'="'+u.pathname+u.search+u.hash+'"';
 });
 html=html.replace(/https:\/\/netbud\.com\.au\/[^\s"<>]*\.html/g,x=>clean(x));
 html=html.replace(/data-base="[^"]*"/,'data-base="/"');
 const dest=file==='index.html'?'index.html':file.replace(/\.html$/,'/index.html');
 fs.mkdirSync(path.dirname(path.join(root,dest)),{recursive:true});fs.writeFileSync(path.join(root,dest),html);
}
const sitemap=path.join(root,'sitemap.xml');fs.writeFileSync(sitemap,fs.readFileSync(sitemap,'utf8').replace(/\.html(?=<\/loc>)/g,'/'));
console.log('Generated extension-free directory routes.');
