/* Single, visibility-gated frame scheduler. No wheel interception or hero mutations. */
(function(){
 'use strict';
 function init(){
  var root=document.documentElement, preference=matchMedia('(prefers-reduced-motion: reduce)'), desktop=matchMedia('(min-width:1000px) and (min-height:720px)');
  var story=document.querySelector('.scroll-story'), chapters=Array.from(document.querySelectorAll('.story-chapter')), cards=Array.from(document.querySelectorAll('.stack-card')), photos=[], active=new Set(), frame=0;
  // Wrappers isolate parallax from carousel transforms and reveal masks.
  var hosts=Array.from(document.querySelectorAll('body[data-page=home] .portfolio-card:first-child .portfolio-media,body[data-layout=services] .page-art,body[data-layout=portfolio] .portfolio-card:first-child .portfolio-media'));
  hosts.forEach(function(host){var img=host.querySelector('img');if(!img)return;var surface=document.createElement('div');surface.className='parallax-surface';img.parentNode.insertBefore(surface,img);surface.appendChild(img);host.classList.add('parallax-frame');photos.push({host:host,surface:surface});});
  function enabled(){return desktop.matches&&!preference.matches;}
  function update(){
   frame=0;if(!enabled()||document.hidden)return;
   var height=innerHeight, reads=[];
   if(story&&active.has(story)){
    var selected=0,best=Infinity;
    chapters.forEach(function(chapter,i){var r=chapter.getBoundingClientRect(),distance=Math.abs(r.top+r.height/2-height*.52);if(distance<best){best=distance;selected=i;}});
    reads.push(function(){chapters.forEach(function(c,i){c.classList.toggle('is-story-active',i===selected);});story.querySelectorAll('[data-story-image]').forEach(function(img,i){img.classList.toggle('is-current',i===selected);});story.querySelectorAll('.story-progress a').forEach(function(a,i){if(i===selected)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});});
   }
   cards.forEach(function(card,i){if(!active.has(card))return;var next=cards[i+1],ratio=next?Math.max(0,Math.min(1,(height-next.getBoundingClientRect().top)/(height-200))):0;reads.push(function(){card.style.setProperty('--stack-scale',String(1-.04*ratio));});});
   photos.forEach(function(photo){if(!active.has(photo.host))return;var r=photo.host.getBoundingClientRect(),shift=Math.max(-Math.min(18,r.height*.05),Math.min(Math.min(18,r.height*.05),((height/2-r.top-r.height/2)/(height+r.height))*36));reads.push(function(){photo.surface.style.setProperty('--photo-shift',shift+'px');});});
   reads.forEach(function(write){write();});
  }
  function schedule(){if(!frame&&enabled()&&!document.hidden&&active.size)frame=requestAnimationFrame(update);}
  function mode(){root.classList.toggle('scroll-enhanced',enabled());cards.forEach(function(c){c.style.removeProperty('--stack-scale');});photos.forEach(function(p){p.surface.style.removeProperty('--photo-shift');});schedule();}
  if(!window.IntersectionObserver)return;
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)active.add(e.target);else active.delete(e.target);});schedule();},{rootMargin:'100px'});
  [story].concat(cards,photos.map(function(p){return p.host;})).filter(Boolean).forEach(function(e){observer.observe(e);});
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});document.addEventListener('visibilitychange',schedule);
  preference.addEventListener('change',mode);desktop.addEventListener('change',mode);mode();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}());
