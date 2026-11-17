/* Automatic loop lifecycle: visibility and reduced motion, without playback controls. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let checks=0,observer;
function el(){return{dataset:{},textContent:'',style:{setProperty(){}},classList:{values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k);}}};}
const host=el(),status=el(),phone=el(),email=el();
host.closest=()=>({querySelector:()=>status});host.getBoundingClientRect=()=>({top:2000,bottom:2500});
host.querySelectorAll=s=>s==='[data-hero-contact-phone]'?[phone]:s==='[data-hero-contact-email]'?[email]:[];
const preference={matches:false,addEventListener(k,fn){this.change=fn;}};
const doc={readyState:'complete',hidden:false,events:{},querySelector:()=>null,querySelectorAll:()=>[host],addEventListener(k,fn){this.events[k]=fn;}};
const win={innerHeight:900,NETBUD_CONFIG:{phoneDisplay:'0425 714 451',contactEmail:'bilal@netbud.com.au'},events:{},matchMedia:()=>preference,addEventListener(k,fn){this.events[k]=fn;},IntersectionObserver:class{constructor(fn){observer=fn;}observe(){}},setTimeout(){throw Error('The CSS loop must not add a timer');}};
function eq(a,b,n){assert.equal(a,b,n);checks++;}function view(ratio){observer([{target:host,isIntersecting:ratio>0,intersectionRatio:ratio}]);}
vm.runInNewContext(fs.readFileSync('js/hero-story.js','utf8'),{window:win,document:doc,Intl,Date,Array,Boolean,Math});
eq(host.dataset.nfcState,'waiting','offscreen starts suspended');eq(phone.textContent,'0425 714 451','phone retained');eq(email.textContent,'bilal@netbud.com.au','email retained');
view(.8);eq(host.dataset.nfcState,'playing','entry starts automatic playback');eq(host.classList.values.has('is-scene-paused'),false,'visible loop runs');
view(.7);view(.9);eq(host.dataset.nfcState,'playing','small scroll changes keep playback');
view(0);eq(host.classList.values.has('is-scene-paused'),true,'offscreen pauses');view(.8);eq(host.dataset.nfcState,'playing','reentry resumes');
doc.hidden=true;doc.events.visibilitychange();eq(host.dataset.nfcState,'waiting','hidden tab pauses');doc.hidden=false;doc.events.visibilitychange();eq(host.dataset.nfcState,'playing','visible tab resumes');
preference.matches=true;preference.change();eq(host.dataset.nfcState,'static','reduced motion stays static');eq(host.classList.values.has('is-nfc-static'),true,'static preview class');
preference.matches=false;preference.change();eq(host.dataset.nfcState,'playing','motion preference resumes');win.events.pagehide();eq(host.dataset.nfcState,'waiting','pagehide pauses');win.events.pageshow();eq(host.dataset.nfcState,'playing','pageshow resumes');
console.log(JSON.stringify({checks,failures:0,note:'Automatic looping lifecycle; 6-second infinite repetition checked in browser.'}));
