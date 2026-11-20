/* NetBud basic opt-in analytics. No Google requests until consent AND owner review gates. */
(function () {
  'use strict';
  if (window.NetBudAnalytics) return;
  var cfg=window.NETBUD_CONFIG||{}, products=window.NETBUD_PRODUCTS||[];
  var consentKey='netbud-analytics-consent', seenKey='netbud-analytics-dedupe-v2', relayKey='netbud-analytics-lookup-v2';
  var allowedEvents=['page_view','view_item_list','select_item','view_item','add_to_cart','remove_from_cart','view_cart','begin_checkout','add_shipping_info','order_submitted','generate_lead','quote_requested','order_lookup_started','order_lookup_verified'];
  var active=false,loaded=false,pageViewed=false,checkoutStarted=false,lastList='',basket=[],serverCatalogue=null,ready=false;
  var categories=['home','shop','product','basket','checkout','contact','services','preview','about','work','pricing','privacy','terms','how_it_works','thank_you'];
  var pages={'/':'home','/shop/':'shop','/cart/':'basket','/checkout/':'checkout','/contact/':'contact','/services/':'services','/free-preview/':'preview','/about/':'about','/portfolio/':'work','/pricing/':'pricing','/privacy/':'privacy','/terms/':'terms','/how-it-works/':'how_it_works','/thank-you/':'thank_you','/custom-websites/':'services','/previews/':'preview'};
  function read(key){try{return localStorage.getItem(key);}catch(error){return null;}}
  function write(key,value){try{localStorage.setItem(key,value);return localStorage.getItem(key)===value;}catch(error){return false;}}
  function product(id){return products.find(function(p){return String(p.id)===String(id);});}
  function cleanPath(path){return path.replace(/\/index\.html$/,'/').replace(/\.html$/,'/');}
  function route(){
    var path=cleanPath(location.pathname), item=products.find(function(p){return path==='/shop/'+p.slug+'/';});
    if(path==='/track/')return {mode:'relay'};
    if(pages[path])return {mode:'public',path:path,category:pages[path]};
    if(item)return {mode:'public',path:'/shop/'+item.slug+'/',category:'product',product:item};
    return {mode:'private'};
  }
  function configured(){return cfg.analyticsEnabled===true&&cfg.analyticsContainerReviewed===true&&/^GTM-[A-Z0-9]+$/.test(cfg.googleTagManagerId||'')&&/^G-[A-Z0-9]+$/.test(cfg.googleAnalyticsId||'')&&(cfg.analyticsAllowedOrigins||[]).indexOf(location.origin)!==-1;}
  function safeUrl(){
    // Do not let a container inspect arbitrary customer-specific query/hash data.
    var valid=true;new URLSearchParams(location.search).forEach(function(value,key){
      if(key==='service'&&products.some(function(p){return p.name===value;}))return;
      if(key==='product'&&product(value))return;
      if(key==='category'&&products.some(function(p){return p.category===value;}))return;
      if(key==='industry'&&products.some(function(p){return (p.industries||[]).indexOf(value)!==-1;}))return;
      var approved=cfg.analyticsCampaignAllowlist&&cfg.analyticsCampaignAllowlist[key];
      if(/^utm_(source|medium|campaign|id|term|content)$/.test(key)&&Array.isArray(approved)&&approved.indexOf(value)!==-1)return;
      valid=false;
    });
    if(location.hash&&['#callback','#enquiry','#product-enquiry','#services','#catalogue','#main','#website-benefits','#cafe','#trades','#professional','#websites','#seo','#systems','#support'].indexOf(location.hash)===-1)valid=false;
    return valid;
  }
  function granted(){return read(consentKey)==='v2:yes';}
  function canSend(){return active&&configured()&&granted()&&route().mode==='public'&&safeUrl();}
  function optionalCookies(){
    document.cookie.split(';').forEach(function(part){var name=part.split('=')[0].trim();if(!/^(_ga(?:_|$)|_gid$|_gat|_gcl_|_gac_|AMP_TOKEN$)/.test(name))return;
      ['',location.hostname,'.'+location.hostname,'.netbud.com.au'].forEach(function(domain){document.cookie=name+'=; Max-Age=0; Path=/; SameSite=Lax'+(domain?'; Domain='+domain:'');});
    });
  }
  function command(){window.dataLayer.push(arguments);}
  function identifiersOff(){if(/^G-[A-Z0-9]+$/.test(cfg.googleAnalyticsId||''))window['ga-disable-'+cfg.googleAnalyticsId]=true;}
  function send(name,data){
    if(!canSend()||allowedEvents.indexOf(name)===-1)return false;
    var r=route(), payload={event:name,page_category:r.category,page_location:(cfg.siteUrl||location.origin).replace(/\/$/,'')+r.path,page_referrer:'',page_title:'NetBud | '+r.category};
    // Every parameter is built here. No caller strings, form values, hrefs or order IDs are spread.
    if(data&&data.items)payload.ecommerce={currency:'AUD',items:data.items};
    if(data&&data.list)payload.item_list_id=data.list;
    if(data&&data.shipping)payload.shipping_tier=data.shipping;
    if(data&&data.kind)payload.basket_kind=data.kind;
    if(data&&Number.isInteger(data.count)&&data.count>=0&&data.count<=2000)payload.item_count=data.count;
    if(data&&['callback','contact','preview','product','checkout'].indexOf(data.form)!==-1)payload.form_category=data.form;
    if(data&&['general','Websites','Digital Growth','Branding & Design','NFC Products','Business Systems & Support'].indexOf(data.service)!==-1)payload.service_type=data.service;
    if(name==='begin_checkout')payload.checkout_stage='started';
    if(name==='order_submitted')payload.checkout_stage='order_received_unpaid';
    window.dataLayer.push({ecommerce:null,item_list_id:null,shipping_tier:null,basket_kind:null,item_count:null,form_category:null,service_type:null,checkout_stage:null});window.dataLayer.push(payload);return true;
  }
  function rows(input){
    if(!Array.isArray(input)||input.length>20)return [];
    return input.filter(function(i){return i&&product(i.id)&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=100;}).map(function(i){return {id:Number(i.id),quantity:i.quantity};});
  }
  function items(input){return rows(input).map(function(i){var p=product(i.id),item={item_id:String(p.id),item_name:p.name,item_category:p.category,quantity:i.quantity};
    var server=serverCatalogue&&serverCatalogue.find(function(x){return x.id===p.id;}), price=server?server.sale_mode==='quote'?null:server.price_cents/100:p.price;
    if(typeof price==='number'&&Number.isFinite(price)&&price>=0&&price<=1000000)item.price=price;
    return item;
  });}
  function aggregate(input){var selected=rows(input),physical=selected.some(function(i){return product(i.id).physical;}),services=selected.some(function(i){return !product(i.id).physical;});return {items:items(selected),kind:physical&&services?'mixed':physical?'physical':'service',count:selected.reduce(function(n,i){return n+i.quantity;},0)};}
  function currentBasket(){try{return rows(JSON.parse(read('netbud-quote-basket-v1')||'[]'));}catch(error){return [];}}
  function view(){
    if(!canSend())return;
    var r=route();if(!pageViewed){pageViewed=true;send('page_view');}
    if(r.category==='product'&&!lastList){lastList='detail';send('view_item',{items:items([{id:r.product.id,quantity:1}])});}
    if(r.category==='shop'){
      var list=Array.from(document.querySelectorAll('[data-product-grid] .product-card[data-product-id]')).map(function(x){return {id:Number(x.dataset.productId),quantity:1};});
      var signature=list.map(function(i){return i.id;}).join(',');if(signature!==lastList){lastList=signature;if(list.length)send('view_item_list',{items:items(list.slice(0,20)),list:'shop'});}
    }
    if(r.category==='basket'&&!lastList){lastList='basket';send('view_cart',aggregate(currentBasket()));}
    if(r.category==='checkout'&&ready&&basket.length&&!checkoutStarted){checkoutStarted=true;send('begin_checkout',aggregate(basket));}
  }
  async function conversion(name,key,data){
    if(!canSend()||typeof key!=='string'||key.length>100||!key||!window.crypto||!crypto.subtle||!navigator.locks)return false;
    try{
      var hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(name+':'+key))),function(b){return b.toString(16).padStart(2,'0');}).join('');
      return await navigator.locks.request('netbud-analytics-conversion',function(){
        if(!canSend())return false;
        var saved;try{saved=JSON.parse(read(seenKey)||'[]');if(!Array.isArray(saved))return false;}catch(error){return false;}
        saved=saved.filter(function(x){return x&&typeof x.hash==='string'&&x.until>Date.now();}).slice(-199);
        if(saved.some(function(x){return x.hash===hash;}))return false;
        saved.push({hash:hash,until:Date.now()+30*86400000});if(!write(seenKey,JSON.stringify(saved)))return false;
        return send(name,data);
      });
    }catch(error){return false;}
  }
  function relay(name){
    if(!configured()||!granted()||route().mode!=='relay'||['order_lookup_started','order_lookup_verified'].indexOf(name)===-1)return false;
    try{var pending=JSON.parse(sessionStorage.getItem(relayKey)||'[]');if(!Array.isArray(pending))pending=[];if(!pending.some(function(x){return x.name===name;}))pending.push({name:name,until:Date.now()+1800000});sessionStorage.setItem(relayKey,JSON.stringify(pending.slice(-2)));return true;}catch(error){return false;}
  }
  function flushRelay(){try{var pending=JSON.parse(sessionStorage.getItem(relayKey)||'[]');sessionStorage.removeItem(relayKey);if(Array.isArray(pending))pending.forEach(function(x){if(x.until>Date.now()&&['order_lookup_started','order_lookup_verified'].indexOf(x.name)!==-1)send(x.name);});}catch(error){}}
  function activate(){
    if(active||!configured()||!granted()||route().mode!=='public'||!safeUrl())return;
    active=true;window.dataLayer=window.dataLayer||[];
    command('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    command('set',{ads_data_redaction:true,url_passthrough:false,allow_google_signals:false,allow_ad_personalization_signals:false,page_location:location.origin+route().path,page_referrer:'',page_title:'NetBud | '+route().category});
    command('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if(/^G-[A-Z0-9]+$/.test(cfg.googleAnalyticsId||''))window['ga-disable-'+cfg.googleAnalyticsId]=false;
    if(!loaded){loaded=true;
      // Google's async GTM bootstrap, consent-gated. No unconditional noscript iframe.
      window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
      var script=document.createElement('script');script.async=true;script.referrerPolicy='no-referrer';script.dataset.netbudGtm='true';script.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(cfg.googleTagManagerId);document.head.appendChild(script);
    }
    window.dataLayer.push({event:'netbud_analytics_init',page_location:(cfg.siteUrl||location.origin).replace(/\/$/,'')+route().path,page_referrer:'',page_title:'NetBud | '+route().category,page_category:route().category});view();flushRelay();
  }
  window.NetBudAnalytics={
    preferences:function(){preferences(true);},
    view:function(){try{view();}catch(error){}},
    cart:function(name,id,quantity){try{var selected=items([{id:Number(id),quantity:quantity}]);if(selected.length&&['add_to_cart','remove_from_cart'].indexOf(name)!==-1)send(name,{items:selected});}catch(error){}},
    checkout:function(input,catalogue){try{basket=rows(input);serverCatalogue=Array.isArray(catalogue)?catalogue:null;ready=true;view();}catch(error){}},
    shipping:function(input,type){try{if(['shipping','pickup','none'].indexOf(type)!==-1&&rows(input).length){var data=aggregate(input);data.shipping=type;send('add_shipping_info',data);}}catch(error){}},
    order:function(id,input,type){if(route().category!=='checkout'||!/^[a-f0-9-]{36}$/.test(id||''))return Promise.resolve(false);var data=aggregate(input);data.shipping=['shipping','pickup','none'].indexOf(type)!==-1?type:undefined;return conversion('order_submitted',id,data);},
    lead:function(id,type,productId,service){if(['callback','contact','preview','product','checkout'].indexOf(type)===-1)return Promise.resolve(false);var p=product(productId),serviceMap={websites:'Websites',seo:'Digital Growth',systems:'Business Systems & Support',branding:'Branding & Design',nfc:'NFC Products',support:'Business Systems & Support'},data={form:type,service:p?p.category:type==='preview'?'Websites':serviceMap[service]||'general'};return Promise.all([conversion('generate_lead',id,data),['product','checkout'].indexOf(type)!==-1?conversion('quote_requested',id,data):Promise.resolve(false)]);},
    lookup:function(name){try{return relay(name);}catch(error){return false;}},
    reject:reject
  };
  function reject(){
    var hadGoogle=loaded; active=false; write(consentKey,'v2:no'); identifiersOff(); optionalCookies();
    try{localStorage.removeItem(seenKey);sessionStorage.removeItem(relayKey);}catch(error){}
    // A hard navigation unloads installed tags/timers. Do not emit a denied-mode cookieless ping.
    window.dataLayer=[];
    if(hadGoogle)location.replace(location.href);
  }
  function preferences(moveFocus){
    if(document.querySelector('.analytics-consent'))return;
    var previous=document.activeElement,banner=document.createElement('aside');banner.className='analytics-consent consent-banner';banner.setAttribute('aria-label','Optional analytics choice');
    var text=document.createElement('p');text.textContent='May we use optional Google Analytics to understand visits, product interest and enquiry journeys? Names, contact details and form messages are not included. '+(loaded?'Turning analytics off refreshes this page; unsaved form entries may be lost.':'Analytics stay off unless you accept.');banner.appendChild(text);
    var link=document.createElement('a');link.href='/privacy/';link.textContent='Read the privacy policy';text.appendChild(document.createTextNode(' '));text.appendChild(link);
    var group=document.createElement('div');group.className='button-group button-row';
    [['yes','Accept analytics'],['no','Reject optional analytics']].forEach(function(option){var button=document.createElement('button');button.type='button';button.className='button '+(option[0]==='yes'?'button-primary':'button-outline');button.setAttribute('data-analytics-'+option[0],'');button.textContent=option[1];button.onclick=function(){banner.remove();if(option[0]==='yes'){write(consentKey,'v2:yes');activate();}else reject();if(previous&&moveFocus)previous.focus({preventScroll:true});};group.appendChild(button);});
    banner.appendChild(group);document.body.appendChild(banner);if(moveFocus)group.querySelector('button').focus();
  }
  function init(){
    if(!configured()||route().mode!=='public')return;
    if(!document.querySelector('[data-analytics-preferences]')){var b=document.createElement('button');b.type='button';b.className='button-link footer-preferences';b.setAttribute('data-analytics-preferences','');b.textContent='Analytics preferences';(document.querySelector('footer')||document.querySelector('main')).appendChild(b);}
    document.addEventListener('click',function(event){var target=event.target.closest('[data-analytics-preferences]');if(target){preferences(true);return;}var a=event.target.closest('a[href]');if(!a||!canSend())return;try{var url=new URL(a.href,location.href);if(url.origin!==location.origin)return;var p=products.find(function(x){return cleanPath(url.pathname)==='/shop/'+x.slug+'/';});if(p)send('select_item',{items:items([{id:p.id,quantity:1}]),list:route().category==='shop'?'shop':'public'});}catch(error){}});
    document.addEventListener('netbud:cataloguechange',view);
    window.addEventListener('storage',function(event){if(event.key===consentKey&&event.newValue!=='v2:yes')reject();});
    if(granted())activate();else{identifiersOff();optionalCookies();if(read(consentKey)!=='v2:no'&&read(consentKey)!=='no')preferences(false);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}());
