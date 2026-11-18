// Canonical and sharing metadata is static, so crawlers and no-JS visitors see the same public identity.
const origin='https://netbud.com.au';
const titles={'index.html':'Custom Website Design Sydney & NFC Cards | NetBud','services.html':'Custom-Coded Websites & Digital Services Sydney | NetBud','shop.html':'NFC Cards, Websites & Digital Services Australia | NetBud','about.html':'About NetBud | Your Digital Mate in Western Sydney','contact.html':'Contact NetBud | Websites, NFC Cards & Digital Support','free-preview.html':'Free Homepage Preview for Your Business | NetBud','pricing.html':'Website & Digital Service Pricing Australia | NetBud','how-it-works.html':'How NetBud Works | From Enquiry to Agreed Quote'};
const noindex=new Set(['cart.html','product.html','thank-you.html','privacy.html','terms.html','404.html']);
const esc=v=>v.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
module.exports=function metadata(html,file){
 html=html.replace(/("url":"https:\/\/netbud\.com\.au\/[^"]+)\.html"/g,'$1/"');
 const canonical=origin+(file==='index.html'?'/':file==='custom-websites.html'?'/services/':'/'+file.replace(/\.html$/,'/'));
 if(titles[file])html=html.replace(/<title>[^<]*<\/title>/,'<title>'+esc(titles[file])+'</title>').replace(/(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]*/g,'$1'+esc(titles[file]));
 html=html.replace(/(<meta (?:name|property)="(?:og:image|twitter:image)" content=")[^"]*/g,(all,prefix)=>prefix+origin+'/images/social-card.jpg?v=20261028-b1');
 // Product-specific share art is already absolute and should stay product-specific.
 if(file.startsWith('shop/')){const image=(html.match(/"image":"(https:[^"]+)"/)||[])[1];if(image)html=html.replace(/(<meta (?:name|property)="(?:og:image|twitter:image)" content=")[^"]*/g,'$1'+image);}
 html=html.replace(/<link rel="canonical"[^>]*>/g,'').replace(/<meta property="og:url"[^>]*>/g,'');

 html=html.replace(/(<meta name="robots" content=")[^"]*/,'$1'+(noindex.has(file)?'noindex, follow':'index, follow'));
 if(file==='index.html'&&!html.includes('id="netbud-organisation"')){
  const org={'@context':'https://schema.org','@type':'Organization',name:'NetBud',url:origin,logo:origin+'/images/logo.svg',email:'bilal@netbud.com.au',telephone:'+61425714451',address:{'@type':'PostalAddress',streetAddress:'67-71 Great Western Highway',addressLocality:'Parramatta',addressRegion:'NSW',postalCode:'2150',addressCountry:'AU'},areaServed:['Sydney','Western Sydney','Australia']};
  html=html.replace('</head>','<script id="netbud-organisation" type="application/ld+json">'+JSON.stringify(org)+'</script></head>');
 }
 if(file.startsWith('shop/')&&!html.includes('id="netbud-breadcrumbs"')){
  const name=(html.match(/<title>([^<]+) \| NetBud<\/title>/)||[])[1];if(name){const data={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:origin+'/'},{'@type':'ListItem',position:2,name:'Shop',item:origin+'/shop/'},{'@type':'ListItem',position:3,name:name.replace(/&amp;/g,'&'),item:canonical}]};html=html.replace('</head>','<script id="netbud-breadcrumbs" type="application/ld+json">'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script></head>');}
 }
 if(file!=='404.html')html=html.replace('</head>','<link rel="canonical" href="'+canonical+'"><meta property="og:url" content="'+canonical+'"></head>');
 return html;
};
