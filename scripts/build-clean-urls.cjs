/* GitHub Pages clean routes: real directories, no hosting rewrite dependency. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),origin='https://netbud.com.au';
const files=fs.readdirSync(root).filter(f=>f.endsWith('.html')).concat(fs.readdirSync(path.join(root,'shop')).filter(f=>f.endsWith('.html')&&f!=='index.html').map(f=>'shop/'+f));
const metadata=require('./public-page-meta.cjs');
const clean=p=>p.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
for(const file of files){
 let html=metadata(fs.readFileSync(path.join(root,file),'utf8'),file);
 fs.writeFileSync(path.join(root,file),html);
 html=html.replace(/\b(href|src)="([^"]+)"/g,(all,key,value)=>{
  if(/^(?:#|mailto:|tel:|data:|javascript:)/.test(value))return all;
  const u=new URL(value,origin+'/'+file);if(u.origin!==origin)return all;
  u.pathname=clean(u.pathname);return key+'="'+u.pathname+u.search+u.hash+'"';
 });
 html=html.replace(/https:\/\/netbud\.com\.au\/[^\s"<>]*\.html/g,x=>clean(x));
 html=html.replace(/data-base="[^"]*"/,'data-base="/"');
 html=metadata(html,file);
 const dest=(file==='index.html'||file==='404.html')?file:file.replace(/\.html$/,'/index.html');
 fs.mkdirSync(path.dirname(path.join(root,dest)),{recursive:true});fs.writeFileSync(path.join(root,dest),html);
}
const sitemap=path.join(root,'sitemap.xml');fs.writeFileSync(sitemap,fs.readFileSync(sitemap,'utf8').replace(/\.html(?=<\/loc>)/g,'/'));
console.log('Generated extension-free directory routes.');

fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /previews/\nDisallow: /business-card-concepts/\nDisallow: /docs/\nDisallow: /scripts/\nDisallow: /backend/\nDisallow: /admin/\nDisallow: /track/\nDisallow: /checkout/\nSitemap: '+origin+'/sitemap.xml\n');
