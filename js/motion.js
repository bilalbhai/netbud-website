/* One progressive-enhancement layer. No device clocks or catalogue mutations here. */
(function () {
  'use strict';
  var started = false;
  function init() {
    if (started) return;
    started = true;
    var root = document.documentElement;
    var preference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var fine = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : null;
    var reduced = function () { return !preference || preference.matches; };
    var observer, targets = [], ambient = [], timelines = [], tiltSurfaces = [], accordionStates = [];
    var canAnimate = !reduced() && Boolean(window.IntersectionObserver);
    function reveal(element, instant) {
      if (instant) element.classList.add('reveal-instant');
      element.classList.add('is-revealed');
      if (observer) observer.unobserve(element);
    }
    function add(element, kind) {
      if (!element || element.closest('form,.enquiry-review,.hero,[data-demo-panel],.comparison,.cart-layout,[data-layout=legal]')) return;
      if (element.closest('[data-motion]') && !element.hasAttribute('data-motion')) return;
      if (element.hasAttribute('data-motion')) return;
      element.dataset.motion = kind || 'up'; targets.push(element);
    }
    document.querySelectorAll('main>.section>.container>.section-heading,main>.section>.container>h2,.callback-copy,.partner-layout>div:first-child,.preview-copy,.faq-section>div:first-child,.custom-approach>h2,.website-approach>h2').forEach(function(e){add(e);});
    document.querySelectorAll('[data-featured-products],[data-product-grid],.service-groups').forEach(function(group){
      var columns=Math.max(1,Math.min(4,getComputedStyle(group).gridTemplateColumns.split(/\s+/).filter(Boolean).length));
      Array.from(group.children).forEach(function(e,i){add(e);e.style.setProperty('--reveal-delay', Math.min((i%columns)*80,240)+'ms');});
    });
    document.querySelectorAll('.service-detail .split,.benefits-editorial,.founder-intro .split').forEach(function(group,i){
      Array.from(group.children).forEach(function(e,j){add(e,(i+j)%2?'right':'left');});
    });
    document.querySelectorAll('body[data-layout=about] main>.section>.container.split,body[data-layout=preview] main>.section>.container.split').forEach(function(group){Array.from(group.children).forEach(function(e,i){if(!e.querySelector('form'))add(e,i?'right':'left');});});
    document.querySelectorAll('.benefit-editorial,.partner-point,.process-steps>.step h2').forEach(function(e){add(e);});
    // Masks belong to the image frame, never to carousel/card transform owners.
    document.querySelectorAll('[data-portfolio-grid] .portfolio-card:first-child .portfolio-media,body[data-layout=preview] .page-art,body[data-layout=services] #websites .page-art').forEach(function(e){add(e,'mask');});
    document.querySelectorAll('.home-steps,.process-steps,.preview-steps').forEach(function(line){
      line.classList.add('motion-timeline'); timelines.push(line);
      Array.from(line.children).forEach(function(step,i){step.classList.add('motion-step');var number=step.querySelector(':scope>span');if(number)number.classList.add('step-number');step.dataset.stepIndex=String(i);step.style.setProperty('--step-delay', Math.min(i*80,240)+'ms');});
    });
    function reach(step) {
      var line=step.parentElement, index=Number(step.dataset.stepIndex);
      Array.from(line.children).forEach(function(s,i){if(i<=index)s.classList.add('is-step-reached');s.classList.toggle('is-current-step',i===index);});
    }
    document.querySelectorAll('.hero,.cta-band,#site-footer').forEach(function(e){e.dataset.motionAmbient='true';ambient.push(e);});
    function showAll() {
      root.classList.remove('motion-enabled');targets.forEach(function(e){reveal(e,true);});
      timelines.forEach(function(line){Array.from(line.children).forEach(reach);});
      tiltSurfaces.forEach(function(s){s.style.removeProperty('--tilt-x');s.style.removeProperty('--tilt-y');});
      accordionStates.forEach(function(state){if(state.animation)state.animation.cancel();state.details.open=state.targetOpen;state.details.style.removeProperty('overflow');state.animation=null;});
      if(observer)observer.disconnect();
    }
    if (canAnimate) {
      try {
        observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){
          var e=entry.target;
          if(e.hasAttribute('data-motion-ambient')){e.classList.toggle('is-ambient-active',entry.isIntersecting);return;}
          if(!entry.isIntersecting)return;
          if(e.classList.contains('motion-step')){reach(e);observer.unobserve(e);return;}
          reveal(e,false);
        });},{threshold:.08,rootMargin:'0px 0px -8px 0px'});
        root.classList.add('motion-enabled');
        targets.forEach(function(e){e.classList.add('reveal-ready');var r=e.getBoundingClientRect();if(r.top<0||e.contains(document.activeElement))reveal(e,true);else observer.observe(e);});
        ambient.forEach(function(e){observer.observe(e);});timelines.forEach(function(line){Array.from(line.children).forEach(function(e){observer.observe(e);});});
      } catch(error){showAll();}
    } else showAll();
    document.addEventListener('focusin',function(event){targets.forEach(function(e){if(e.contains(event.target)||event.target.contains(e))reveal(e,true);});});
    document.addEventListener('netbud:cataloguechange',function(){targets=targets.filter(function(e){if(e.isConnected)return true;if(observer)observer.unobserve(e);return false;});});
    window.addEventListener('pageshow',function(event){if(event.persisted)showAll();});
    document.addEventListener('visibilitychange',function(){root.classList.toggle('motion-suspended',document.hidden);});
    document.addEventListener('netbud:storyplayback',function(event){root.classList.toggle('motion-paused',Boolean(event.detail&&event.detail.paused));});
    if(preference&&preference.addEventListener)preference.addEventListener('change',function(event){if(event.matches)showAll();});

    var laptop=document.querySelector('.laptop-demo');
    if(laptop){var floating=document.createElement('div');floating.className='showcase-float';laptop.parentNode.insertBefore(floating,laptop);floating.appendChild(laptop);}
    // One featured shop surface; one gallery on each physical-product page.
    var tiltHosts=Array.from(document.querySelectorAll('.shop-hero-art'));
    if(document.querySelector('[data-product-id="5"],[data-product-id="10"]')){var gallery=document.querySelector('.product-gallery');if(gallery)tiltHosts.push(gallery);}
    tiltHosts.forEach(function(host){
      var image=host.querySelector('img');if(!image)return;
      var surface=document.createElement('div');surface.className='motion-tilt-surface';image.parentNode.insertBefore(surface,image);surface.appendChild(image);host.classList.add('motion-tilt-host');tiltSurfaces.push(surface);
      var bounds=null, frame=null, x=0,y=0;
      function reset(){bounds=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;surface.style.removeProperty('--tilt-x');surface.style.removeProperty('--tilt-y');}
      host.addEventListener('pointerenter',function(){if(!reduced()&&fine&&fine.matches)bounds=host.getBoundingClientRect();});
      host.addEventListener('pointermove',function(event){if(!bounds||reduced()||!fine.matches)return;x=(event.clientX-bounds.left)/bounds.width-.5;y=(event.clientY-bounds.top)/bounds.height-.5;if(frame!==null)return;frame=requestAnimationFrame(function(){frame=null;surface.style.setProperty('--tilt-x',Math.max(-2.2,Math.min(2.2,-y*4.4))+'deg');surface.style.setProperty('--tilt-y',Math.max(-2.2,Math.min(2.2,x*4.4))+'deg');});});
      host.addEventListener('pointerleave',reset);host.addEventListener('pointercancel',reset);
    });
    document.querySelectorAll('.faq-list details,.support-benefit').forEach(function(details){
      var summary=details.querySelector('summary');if(!summary)return;
      var body=document.createElement('div');body.className='faq-body';
      while(summary.nextSibling)body.appendChild(summary.nextSibling);details.appendChild(body);
      var state={details:details,animation:null,targetOpen:details.open};accordionStates.push(state);
      summary.addEventListener('click',function(event){
        if(reduced()||typeof details.animate!=='function'){state.targetOpen=!details.open;return;}
        event.preventDefault();var start=details.getBoundingClientRect().height;
        if(state.animation)state.animation.cancel();state.targetOpen=!state.targetOpen;
        details.open=true;details.style.overflow='hidden';
        var css=getComputedStyle(details),shell=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
        var end=state.targetOpen?details.scrollHeight+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth):summary.getBoundingClientRect().height+shell;
        var animation=details.animate([{height:start+'px'},{height:end+'px'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});state.animation=animation;
        animation.onfinish=function(){if(state.animation!==animation)return;if(!state.targetOpen&&body.contains(document.activeElement))summary.focus();details.open=state.targetOpen;details.style.removeProperty('overflow');state.animation=null;};
      });
    });
  }
  window.NetBudMotion={init:init};
}());
