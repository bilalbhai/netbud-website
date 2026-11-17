/* Run the actual shared form handler with an in-memory DOM and fetch; never contact FormSubmit. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('js/main.js','utf8');
const code=source.slice(source.indexOf('  var formLabels'),source.indexOf('  function setFormStatus'))+source.slice(source.indexOf('  function enquiryPayload'),source.indexOf('  function setupPayments'));
let checks=0;function check(value,label){assert.ok(value,label);checks++}
function harness(type='callback',opts={}){
 const fields=['name','business','email','phone','message','selectedProduct','website_confirm'].map(name=>({name,value:({name:'Local Test',business:'Test Business',email:'test@example.invalid',phone:'0425714451',message:'Local mocked test only',selectedProduct:type==='product'?'Custom NFC Business Card':'',website_confirm:opts.spam?'bot':''})[name],disabled:false,required:['name','email'].includes(name),type:name==='email'?'email':'text',tagName:'INPUT',minLength:0,setCustomValidity(t){this.error=t},matches(s){return s===':disabled'?this.disabled:false},removeAttribute(){},hasAttribute(){return false},dataset:{}}));
 const button={disabled:true,innerHTML:'Submit',textContent:''},status={dataset:{}},events={};let reset=0,requests=[],drafts=0;
 const form={dataset:{enquiryForm:type,formTitle:type+' request'},querySelector(s){if(s.includes('[name=')){let m=s.match(/name="([^"]+)/);return fields.find(f=>f.name===m[1])||null}if(s==='[type="submit"]')return button;if(s==='.form-status')return status;return null},querySelectorAll(s){if(s==='[type="submit"]')return[button];if(s.includes('[required]'))return fields.filter(f=>f.required);return fields},addEventListener(k,f){events[k]=f},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},reportValidity(){return !opts.invalid&&!fields.some(f=>f.error)},reset(){reset++;fields.forEach(f=>f.value='')}};
 const config={formEndpoint:'https://formsubmit.co/ajax/bilal@netbud.com.au',formDeliveryVerified:opts.verified!==false};
 let responder=()=>Promise.resolve({ok:true,json:async()=>({success:'true',message:'The form was submitted successfully.'})});
 const cart=opts.empty?[]:[{id:'nfc',quantity:3}];const context={config,cart,products:[],window:{location:{href:opts.url||'https://netbud.com.au/contact/',search:''}},document:{getElementById(){return null}},URLSearchParams,AbortController,JSON,Array,Object,String,Error,Promise,Math,
 FormData:class{constructor(f){this.form=f}forEach(fn){fields.filter(f=>!f.disabled).forEach(f=>fn(f.value,f.name))}},
 safeHttps:s=>s,validAustralianPhone:s=>/^(0[23478]\d{8})$/.test(s),productById:id=>({id,name:'Custom NFC Business Card'}),cartSummaryText:()=> 'Custom NFC Business Card × 3',calculateTotals:()=>({physical:true}),
 setFormStatus(f,t,k){status.textContent=t;status.dataset.state=k;return status},showEnquiryDraft(f,t){drafts++;status.dataset.state='error';status.textContent='Delivery unconfirmed';},
 setTimeout(fn){context.timeout=fn;return 1},clearTimeout(){context.timeout=null},fetch(url,args){requests.push({url,args});return responder(args)}};
 vm.createContext(context);vm.runInContext(code,context);context.setupForms({querySelectorAll:s=>s==='form[data-enquiry-form]'?[form]:[]});
 return{context,form,fields,button,status,events,requests,setResponse(fn){responder=fn},submit(){return events.submit({preventDefault(){}})},get resets(){return reset},get drafts(){return drafts}};
}
(async()=>{
 for(const [type,url] of [['callback','/'],['callback','/contact/'],['contact','/contact/'],['preview','/free-preview/'],['product','/shop/custom-nfc-business-card/'],['checkout','/cart/']]){
  const h=harness(type,{url:'https://netbud.com.au'+url});await h.submit();const p=JSON.parse(h.requests[0].args.body);
  check(h.requests.length===1,type+' posts once');check(p.pageUrl.endsWith(url),type+' source URL');check(p._replyto==='test@example.invalid',type+' Reply-To');check(p.name==='Local Test'&&p.email&&p.phone&&p.business&&p.message,type+' all details');check(p._subject.startsWith('NetBud | '),type+' subject');check(h.status.dataset.state==='success'&&h.resets===1,type+' success resets');check(!h.button.disabled&&!h.form['aria-busy'],type+' controls restored');
  if(type==='checkout')check(p.selectedProducts==='Custom NFC Business Card × 3','basket names and quantities');if(type==='product')check(p._subject==='NetBud | Custom NFC Business Card Enquiry','product subject');
 }
 const failures=[{success:false},{success:'false'},null,[],{}, {success:true,message:'This form needs Activation. Check your email.'},{success:true,error:'Rejected'}];
 for(const result of failures){const h=harness();h.setResponse(async()=>({ok:true,json:async()=>result}));await h.submit();check(h.status.dataset.state!=='success'&&h.resets===0&&h.drafts===1,'JSON rejection preserves details');check(h.fields[0].value==='Local Test','failed request retains input')}
 for(const mode of ['network','html','http','unverified']){const h=harness('contact',{verified:mode!=='unverified'});h.setResponse(async()=>{if(mode==='network')throw Error('offline');return{ok:mode!=='http',json:async()=>{if(mode==='html')throw Error('HTML response');return{success:true}}}});await h.submit();check(h.resets===0&&h.drafts===1&&!h.button.disabled,mode+' safe fallback')}
 for(const opts of [{invalid:true},{spam:true}]){const h=harness('callback',opts);await h.submit();check(h.requests.length===0,'validation/honeypot stops request')}
 const empty=harness('checkout',{empty:true});await empty.submit();check(!empty.requests.length,'empty basket cannot submit');
 const h=harness();let resolve;h.setResponse(()=>new Promise(r=>resolve=r));const pending=h.submit();await h.submit();check(h.requests.length===1&&h.button.disabled,'duplicate blocked while sending');resolve({ok:true,json:async()=>({success:true})});await pending;check(!h.button.disabled,'button unlocked after success');
 const timeout=harness();timeout.setResponse(args=>new Promise((resolve,reject)=>args.signal.addEventListener('abort',()=>reject(Error('timeout')))));const sending=timeout.submit();timeout.context.timeout();await sending;check(timeout.drafts===1&&timeout.resets===0&&!timeout.button.disabled,'timeout keeps input and unlocks');
 console.log(JSON.stringify({checks,failures:0,networkRequests:'mocked only'}));
})().catch(e=>{console.error(e);process.exitCode=1});
