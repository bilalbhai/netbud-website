/* State invariants for the desktop controller; rendering is checked in-browser. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
let y=0,checks=0,frames=[],timers=new Map(),serial=0;
function element(dataset={}){return{dataset,attrs:{},events:{},hidden:false,style:{values:{},setProperty(k,v){this.values[k]=String(v);}},classList:{toggle(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,v){this.events[k]=v;}};}
const region=element(),stage={offsetHeight:875},header={offsetHeight:85};
region.offsetHeight=2200;region.getBoundingClientRect=()=>({top:125-y});region.querySelector=s=>s==='.hero-stage'?stage:null;
const host=element({demoInterval:'3000'}),pause=element(),next=element(),order=element(),panels=[element({demoPanel:'websites'}),element({demoPanel:'business-cards'})];
host.closest=()=>region;host.getBoundingClientRect=()=>({top:100,bottom:700});
host.querySelector=s=>({'[data-story-pause]':pause,'[data-story-next]':next,'[data-story-order]':order}[s]||null);
host.querySelectorAll=s=>s==='[data-demo-panel]'?panels:[];
const preference={matches:false,addEventListener(k,fn){this.change=fn;}},desktop={matches:true,addEventListener(k,fn){this.change=fn;}};
const doc={readyState:'complete',hidden:false,querySelector:s=>s==='#site-header'?header:host,dispatchEvent(){},addEventListener(){}};
const win={innerHeight:1000,scrollY:0,performance:{now:()=>0},matchMedia:q=>q.includes('min-width')?desktop:preference,events:{},addEventListener(k,v){this.events[k]=v;},requestAnimationFrame(fn){frames.push(fn);return frames.length;},setTimeout(fn){let id=++serial;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},scrollTo(){}};
vm.runInNewContext(fs.readFileSync('js/hero-story.js','utf8'),{window:win,document:doc,Array,Number,Boolean,Math,Date,CustomEvent:class{}});
function flush(){let pending=frames;frames=[];pending.forEach(fn=>fn());}
function scroll(p){y=40+1325*p;win.scrollY=y;win.events.scroll();flush();}
function eq(a,b,label){assert.equal(a,b,label);checks++;}
flush();eq(timers.size,0,'desktop never leaves an autoplay timer running');
eq(host.dataset.storyState,'scrolling','desktop is scroll-controlled');
scroll(.45);eq(host.dataset.storyActive,'websites','middle scroll keeps website scene');eq(timers.size,0,'website scrub does not start autoplay');
scroll(.7);eq(host.dataset.storyActive,'business-cards','scroll selects NFC');eq(order.attrs.href,'/shop/custom-nfc-business-card/','NFC link remains correct');
eq(timers.size,0,'NFC scrub has no competing timer');
pause.events.click();const held=region.style.values['--hero-progress'];scroll(.9);eq(region.style.values['--hero-progress'],held,'pause freezes presentation without blocking scroll');
pause.events.click();flush();eq(region.style.values['--hero-progress'],'0.9','resume catches up to scroll');
order.events.focus();scroll(.1);eq(order.attrs.href,'/shop/custom-nfc-business-card/','focused product CTA does not change destination');
order.events.blur();flush();eq(host.dataset.storyActive,'websites','blur catches up to actual scroll');
scroll(2);eq(region.style.values['--hero-progress'],'1','progress clamps at end');scroll(-1);eq(region.style.values['--hero-progress'],'0','progress clamps at opening');
preference.matches=true;preference.change();eq(host.dataset.storyState,'reduced','reduced preference exits scroll mode');eq(timers.size,0,'reduced motion has no autoplay');
pause.events.click();eq(host.dataset.storyActive,'business-cards','manual NFC remains accessible');
preference.matches=false;desktop.matches=false;preference.change();eq(timers.size,1,'mobile uses only one existing scene timer');
desktop.matches=true;desktop.change();flush();eq(timers.size,0,'returning to desktop removes autoplay');
console.log(JSON.stringify({checks,failures:0,note:'Desktop state invariants; browser rendering tested separately.'}));
