/* Run after editing js/products.js: node scripts/build-catalogue.cjs. No dependencies. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
for(const f of ['config','products'])vm.runInContext(fs.readFileSync(path.join(root,'js',f+'.js'),'utf8'),ctx);
const products=ctx.window.NETBUD_PRODUCTS,config=ctx.window.NETBUD_CONFIG;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url='https://netbud.com.au',dir=path.join(root,'shop');fs.mkdirSync(dir,{recursive:true});
const template=fs.readFileSync(path.join(root,'product.html'),'utf8');
const list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
for(const p of products){
 let html=template.replace('data-page="product" data-base=""','data-page="shop" data-base="../" data-product-id="'+p.id+'"');
 html=html.replace(/<title>.*?<\/title>/,'<title>'+esc(p.name)+' | NetBud</title>');
 html=html.replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*/g,'$1'+esc(p.description));
 html=html.replace(/(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]*/g,'$1'+esc(p.name)+' | NetBud');
 html=html.replace(/((?:href|src)=")(css\/|js\/|images\/|index.html|services.html|contact.html)/g,'$1../$2');
 html=html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*/g,'$1'+url+'/'+p.image);
 const canonical=url+'/shop/'+p.slug+'.html';
 const schema={'@context':'https://schema.org','@type':p.physical?'Product':'Service',name:p.name,description:p.description,url:canonical,image:url+'/'+p.image};
 if(p.physical)schema.brand={'@type':'Brand',name:'NetBud'};else schema.provider={'@type':'Organization',name:'NetBud',url};
 html=html.replace('</head>','<link rel="canonical" href="'+canonical+'"><meta property="og:url" content="'+canonical+'"><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script></head>');
 const start=html.indexOf('    <main'),end=html.indexOf('    <footer',start);
 const approach=p.websiteApproach?'<section><h2>'+esc(p.websiteApproach.title)+'</h2><p>'+esc(p.websiteApproach.intro)+'</p>'+list(p.websiteApproach.benefits)+'<p>'+esc(p.websiteApproach.note)+'</p><a href="/services/#website-benefits">Explore the benefits of a custom-built website</a></section><section><h2>Good questions. Clear answers.</h2>'+p.faqs.map(f=>'<details><summary>'+esc(f.q)+'</summary><p>'+esc(f.a)+'</p></details>').join('')+'</section>':'';
 const fallback='<main id="main" tabindex="-1"><div class="container section" data-product-detail><nav aria-label="Breadcrumb"><a href="../shop.html">Shop</a></nav><h1>'+esc(p.name)+'</h1><p>'+esc(p.description)+'</p><img src="../'+p.image+'" width="'+(p.imageWidth||640)+'" height="'+(p.imageHeight||460)+'" decoding="async" fetchpriority="high" alt="'+esc(p.imageAlt||("Illustrative concept for "+p.name))+'"><p class="small muted">'+esc(p.imageCaption === '' ? '' : (p.imageCaption||"Illustrative concept · final scope confirmed in your quote."))+'</p><p>'+esc(config.launchPricingApproved?'From A$'+new Intl.NumberFormat('en-AU').format(p.price)+(p.pricingType==='monthly'?'/month':'')+' · '+p.billingLabel:'Request a quote · '+p.billingLabel)+'</p><h2>Starting package includes</h2>'+list(p.inclusions)+'<h2>Not included in the entry package</h2>'+list(p.exclusions)+'<p>'+esc(p.detail)+'</p>'+approach+'<h2>Options</h2>'+list(p.options)+'<h2>Process</h2>'+list(p.process)+'<p>'+esc(p.note)+'</p><a class="button button-primary" href="../contact.html?service='+encodeURIComponent(p.name)+'#enquiry">Enquire about '+esc(p.name)+'</a></div></main>';
 html=html.slice(0,start)+fallback+html.slice(end);fs.writeFileSync(path.join(dir,p.slug+'.html'),html);
}
const pages=['','services.html','shop.html','pricing.html','portfolio.html','about.html','contact.html','free-preview.html','how-it-works.html'].concat(products.map(p=>'shop/'+p.slug+'.html'));
fs.writeFileSync(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>'  <url><loc>'+url+'/'+p+'</loc></url>').join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\nDisallow: /previews/\nSitemap: '+url+'/sitemap.xml\n');
console.log('Generated '+products.length+' standalone product pages and sitemap. Public launch prices approved: '+config.launchPricingApproved);

require('./build-clean-urls.cjs');
