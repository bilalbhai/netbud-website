const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
let now = 0, serial = 0, timers = new Map(), checks = 0;
function element(dataset = {}) {
  return {dataset, hidden: false, textContent: '', innerHTML: '', attrs: {}, events: {},
    style: {setProperty() {}},
    classList: {values: new Set(), toggle(name, on) { if (on) this.values.add(name); else this.values.delete(name); }},
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    addEventListener(name, fn) { this.events[name] = fn; }
  };
}
const panels = [element({demoPanel:'websites'}), element({demoPanel:'business-cards'})];
const nextControl = element(), control = element(), title = element(), status = element(), order = element(), progress = [element(),element()];
const host = element({demoInterval:'3000'});
host.getBoundingClientRect = () => ({top:100,bottom:600});
host.querySelector = selector => ({'[data-story-next]':nextControl,'[data-story-pause]':control,'[data-story-title]':title,'[data-story-status]':status,'[data-story-order]':order}[selector]);
host.querySelectorAll = selector => selector === '[data-demo-panel]' ? panels : selector === '.hero-story__progress > span' ? progress : [];
const doc = {dispatchEvent() {},readyState:'complete',hidden:false,events:{},querySelector:()=>host,addEventListener(name,fn){this.events[name]=fn;}};
const preference = {matches:false,addEventListener(name,fn){this.change=fn;}};
const win = {innerHeight:900,performance:{now:()=>now},matchMedia:()=>preference,events:{},
  addEventListener(name,fn){this.events[name]=fn;},setTimeout(fn,delay){const id=++serial;timers.set(id,{fn,at:now+delay});return id;},clearTimeout(id){timers.delete(id);}};
function advance(ms) {
  const end = now + ms;
  while (true) {
    const next = [...timers].sort((a,b)=>a[1].at-b[1].at)[0];
    if (!next || next[1].at > end) break;
    now = next[1].at; timers.delete(next[0]); next[1].fn();
  }
  now = end;
}
function eq(actual,expected,message){assert.equal(actual,expected,message);checks++;}
vm.runInNewContext(fs.readFileSync('js/hero-story.js','utf8'),{window:win,document:doc,Date,Array,Number,Math,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}});
eq(host.dataset.storyActive,'websites','website is first');
eq(order.textContent,'Explore plans','website CTA text');
eq(order.attrs.href,'/pricing/','website CTA destination');
eq(timers.size,1,'one timer');
advance(2999); eq(host.dataset.storyActive,'websites','full 3000ms first scene');
advance(1); eq(host.dataset.storyActive,'business-cards','NFC second at 3000ms');
eq(order.hidden,false,'CTA remains available in both scenes');
eq(order.textContent,'Order your custom NFC card now','NFC CTA text');
eq(order.attrs.href,'/shop/custom-nfc-business-card/','NFC CTA destination');
advance(3000); eq(host.dataset.storyActive,'websites','wraps to website');
eq(order.hidden,false,'website CTA available');
advance(500); control.events.click();
eq(timers.size,0,'pause cancels timer');
advance(10000); eq(host.dataset.storyActive,'websites','pause holds scene');
control.events.click(); advance(2499); eq(host.dataset.storyActive,'websites','resume preserves remainder');
advance(1); eq(host.dataset.storyActive,'business-cards','resume finishes remainder');
advance(3000); order.events.focus(); advance(6000); eq(host.dataset.storyActive,'websites','focused CTA destination does not change');
order.events.blur(); advance(3000); eq(host.dataset.storyActive,'business-cards','blur resumes');
doc.hidden=true; doc.events.visibilitychange(); advance(6000); eq(host.dataset.storyActive,'business-cards','hidden document suspends');
doc.hidden=false; doc.events.visibilitychange(); advance(3000); eq(host.dataset.storyActive,'websites','visible document resumes');
preference.matches=true; preference.change(); eq(timers.size,0,'reduced motion disables timer');
control.events.click(); eq(host.dataset.storyActive,'business-cards','reduced motion can manually reach NFC');
eq(control.textContent,'Next preview ↗','reduced motion control remains usable');
preference.matches=false; preference.change(); advance(2999); eq(host.dataset.storyActive,'business-cards','motion preference restart uses full interval');
advance(1); eq(host.dataset.storyActive,'websites','motion preference resumes');
eq(timers.size,1,'only one timer after state changes');
preference.matches=true; preference.change(); nextControl.events.click(); eq(host.dataset.storyActive,'business-cards','explicit next control changes scene in reduced motion');
eq(timers.size,0,'manual next retains reduced-motion suspension');
preference.matches=false; preference.change(); control.events.click(); eq(host.dataset.storyState,'paused','normal user pause is preserved');
nextControl.events.click(); eq(host.dataset.storyActive,'websites','manual next changes a paused NFC scene');
eq(host.dataset.storyState,'playing','manual next starts the selected scene');
eq(timers.size,1,'manual next leaves a single scene timer');
advance(3000); eq(host.dataset.storyActive,'business-cards','manual selection still advances after three seconds');
console.log(JSON.stringify({checks,failures:0,note:'Isolated controller clock/DOM-state checks; browser rendering remains separate.'}));
