/* Standalone NFC lifecycle invariants. CSS milestones are inspected in-browser. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let checks=0,restarts=0,observer;
function el(){return{dataset:{},events:{},attrs:{},textContent:'',disabled:false,style:{setProperty(){}},classList:{set:new Set(['is-active']),toggle(k,on){if(on)this.set.add(k);else this.set.delete(k);},add(k){this.set.add(k);},remove(k){this.set.delete(k);if(k==='is-active')restarts++;}},addEventListener(k,fn){this.events[k]=fn;},setAttribute(k,v){this.attrs[k]=v;}};}
const host=el(),panel=el(),pause=el(),replay=el(),status=el(),phone=el(),email=el(),presentation=el();
presentation.querySelector=s=>({'[data-nfc-pause]':pause,'[data-nfc-replay]':replay,'[data-nfc-status]':status}[s]);
host.closest=()=>presentation;host.getBoundingClientRect=()=>({top:2000,bottom:2500});host.querySelector=()=>panel;
host.querySelectorAll=s=>s==='[data-hero-contact-phone]'?[phone]:s==='[data-hero-contact-email]'?[email]:[];
const preference={matches:false,addEventListener(k,fn){this.change=fn;}};
const doc={readyState:'complete',hidden:false,events:{},querySelector:()=>null,querySelectorAll:()=>[host],addEventListener(k,fn){this.events[k]=fn;}};
const win={innerHeight:900,NETBUD_CONFIG:{phoneDisplay:'0425 714 451',contactEmail:'bilal@netbud.com.au'},events:{},matchMedia:()=>preference,addEventListener(k,fn){this.events[k]=fn;},IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}},setTimeout(){throw Error('NFC animation must not require a second timer');}};
function eq(a,b,n){assert.equal(a,b,n);checks++;}function view(ratio){observer([{target:host,isIntersecting:ratio>0,intersectionRatio:ratio}]);}
vm.runInNewContext(fs.readFileSync('js/hero-story.js','utf8'),{window:win,document:doc,Intl,Date,Array,Boolean,Math});
eq(host.dataset.nfcState,'waiting','offscreen does not start');eq(phone.textContent,'0425 714 451','configured phone');eq(email.textContent,'bilal@netbud.com.au','configured email');
view(.8);eq(host.dataset.nfcState,'playing','entry plays');eq(pause.disabled,false,'pause available');
const baseline=restarts;view(.7);view(.9);eq(restarts,baseline,'small visibility changes never restart');
pause.events.click();eq(host.dataset.nfcState,'paused','user pause');view(0);view(.8);eq(host.dataset.nfcState,'paused','reentry preserves user pause');
pause.events.click();eq(host.dataset.nfcState,'playing','resume');doc.hidden=true;doc.events.visibilitychange();eq(host.dataset.nfcState,'waiting','hidden tab suspends');doc.hidden=false;doc.events.visibilitychange();eq(host.dataset.nfcState,'playing','visible tab resumes');
panel.events.animationend({animationName:'unrelated'});eq(host.dataset.nfcState,'playing','unrelated animation does not end demo');panel.events.animationend({animationName:'nfc-section-phone'});eq(host.dataset.nfcState,'complete','phone timeline completes demo');eq(pause.disabled,true,'completed demo has no misleading active pause');view(0);view(.8);eq(host.dataset.nfcState,'complete','completion survives reentry');
replay.events.click();eq(host.dataset.nfcState,'playing','explicit replay starts');eq(restarts,baseline+1,'replay restarts all panel animations once');
preference.matches=true;preference.change();eq(host.dataset.nfcState,'static','reduced motion uses static preview');eq(replay.disabled,true,'static preview disables replay');const reducedCount=restarts;replay.events.click();eq(restarts,reducedCount,'reduced motion cannot start animation');
preference.matches=false;preference.change();eq(host.dataset.nfcState,'playing','motion preference resumes a fresh consistent timeline');win.events.pagehide();eq(host.dataset.nfcState,'waiting','pagehide suspends');win.events.pageshow();eq(host.dataset.nfcState,'playing','pageshow resumes');
console.log(JSON.stringify({checks,failures:0,note:'Standalone NFC lifecycle; actual 10-second animation verified in browser.'}));
