/* Website-only scroll state: no autoplay and no connection to the NFC controller. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');let checks=0,y=0,frames=[],writes=0;
const values={},classes=new Set(),events={},stage={offsetHeight:775};
const hero={dataset:{},offsetHeight:1800,querySelector:()=>stage,getBoundingClientRect:()=>({top:125-y}),classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);}},style:{setProperty(k,v){values[k]=String(v);writes++;},removeProperty(k){delete values[k];}}};
const preference={matches:false,addEventListener(k,fn){this.change=fn;}},desktop={matches:true,addEventListener(k,fn){this.change=fn;}};
const doc={readyState:'complete',hidden:false,events:{},querySelector:s=>s==='#site-header'?{offsetHeight:85}:hero,querySelectorAll:()=>[],addEventListener(k,fn){this.events[k]=fn;}};
const win={matchMedia:q=>q.includes('min-width')?desktop:preference,requestAnimationFrame(fn){frames.push(fn);return frames.length;},addEventListener(k,fn){events[k]=fn;}};
vm.runInNewContext(fs.readFileSync('js/hero-story.js','utf8'),{window:win,document:doc,Math,Boolean});
function flush(){let f=frames;frames=[];f.forEach(fn=>fn());}function scroll(p){y=40+1025*p;events.scroll();flush();}function eq(a,b,n){assert.equal(a,b,n);checks++;}
flush();eq(classes.has('is-website-pinned'),true,'capable desktop pins');eq(values['--website-copy-opacity'],'1','opening copy visible');eq(values['--website-zoom'],'1','opening size stable');
scroll(.5);eq(Number(values['--website-zoom'])>1,true,'scroll brings site forward');eq(Number(values['--website-tilt'].replace('deg',''))<5,true,'perspective straightens');eq(values['--website-copy-opacity'],'0','copy recedes');eq(hero.dataset.websiteProgress,'0.500','single progress source');
scroll(.95);eq(classes.has('is-website-ending'),true,'exit blends');scroll(2);eq(hero.dataset.websiteProgress,'1.000','end clamps');const endWrites=writes;scroll(3);eq(writes,endWrites,'no repeated offscreen DOM writes');
scroll(-1);eq(hero.dataset.websiteProgress,'0.000','opening clamps');eq(classes.has('is-website-ending'),false,'reverse scroll restores opening');
desktop.matches=false;desktop.change();eq(classes.has('is-website-pinned'),false,'mobile uses document flow');eq(values['--website-zoom'],undefined,'mobile clears transform overrides');eq(values['--website-copy-opacity'],undefined,'mobile clears opacity override');
desktop.matches=true;preference.matches=true;preference.change();eq(classes.has('is-website-pinned'),false,'reduced motion never pins');preference.matches=false;preference.change();flush();eq(classes.has('is-website-pinned'),true,'preference change restores desktop');
doc.hidden=true;events.scroll();eq(frames.length,0,'hidden page schedules no motion frame');
console.log(JSON.stringify({checks,failures:0,note:'Website-only scroll invariants; no autoplay timers or forced scrolling.'}));
