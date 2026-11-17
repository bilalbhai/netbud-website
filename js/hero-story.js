/* Independent website-scroll and reusable NFC section controllers. */
(function(){
  'use strict';
  function setupPhoneClock(host) {
    var times = host.querySelectorAll('[data-phone-time]');
    var dates = host.querySelectorAll('[data-phone-date]');
    if (!times.length) return function () {};
    var clockTimer = null;
    var clockActive = true;
    var timeFormat = new Intl.DateTimeFormat('en-AU', {hour:'numeric',minute:'2-digit',hour12:true});
    var dateFormat = new Intl.DateTimeFormat('en-AU', {weekday:'short',day:'numeric',month:'short'});
    function render() {
      var now = new Date();
      var time = timeFormat.formatToParts(now).filter(function (part) { return part.type !== 'dayPeriod'; }).map(function (part) { return part.value; }).join('').trim();
      times.forEach(function (node) { node.textContent = time; });
      dates.forEach(function (node) { node.textContent = dateFormat.format(now); });
    }
    function sync() {
      if (clockTimer !== null) window.clearTimeout(clockTimer);
      clockTimer = null;
      render();
      if (document.hidden || !clockActive) return;
      clockTimer = window.setTimeout(sync, 60000 - (Date.now() % 60000) + 20);
    }
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pagehide', function () { clockActive = false; sync(); });
    window.addEventListener('pageshow', function () { clockActive = true; sync(); });
    sync();
    return render;
  }
  function setupWebsiteHero() {
    var hero = document.querySelector('[data-website-hero]');
    if (!hero || hero.dataset.websiteBound) return;
    hero.dataset.websiteBound = 'true';
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktop = window.matchMedia('(min-width:1000px) and (min-height:760px)');
    var stage = hero.querySelector('.website-stage'), frame = null, last = -1, enabled = false;
    function clamp(n) { return Math.max(0, Math.min(1, n)); }
    function render() {
      frame = null;
      if (!enabled || document.hidden) return;
      var header = document.querySelector('#site-header'), offset = header ? header.offsetHeight : 84;
      var distance = Math.max(1, hero.offsetHeight - stage.offsetHeight);
      var p = clamp((offset - hero.getBoundingClientRect().top) / distance);
      if (p === last) return;
      last = p;
      var approach = clamp(p / .7), exit = clamp((p - .88) / .12);
      hero.style.setProperty('--website-copy-opacity', 1 - clamp((p - .08) / .28));
      hero.style.setProperty('--website-copy-y', (-30 * approach) + 'px');
      hero.style.setProperty('--website-zoom', 1 + .19 * approach - .025 * exit);
      hero.style.setProperty('--website-tilt', (5 * (1 - approach)) + 'deg');
      hero.style.setProperty('--website-showcase-y', (-90 * approach - 10 * exit) + 'px');
      hero.style.setProperty('--website-page-shift', (-15 * approach) + '%');
      hero.style.setProperty('--website-opacity', 1 - .12 * exit);
      hero.classList.toggle('is-website-ending', p > .88);
      hero.dataset.websiteProgress = p.toFixed(3);
    }
    function schedule() { if (enabled && frame === null && !document.hidden) frame = window.requestAnimationFrame(render); }
    function mode() {
      enabled = desktop.matches && !preference.matches && Boolean(window.requestAnimationFrame);
      hero.classList.toggle('is-website-pinned', enabled);
      var header = document.querySelector('#site-header');
      hero.style.setProperty('--website-header', (header ? header.offsetHeight : 84) + 'px');
      if (!enabled) ['--website-copy-opacity','--website-copy-y','--website-zoom','--website-tilt','--website-showcase-y','--website-page-shift','--website-opacity'].forEach(function(key){hero.style.removeProperty(key);});
      last = -1; schedule();
    }
    window.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', mode, {passive:true});
    window.addEventListener('pageshow', mode);
    document.addEventListener('visibilitychange', schedule);
    preference.addEventListener('change', mode); desktop.addEventListener('change', mode); mode();
  }

  function setupNfcDemo(host) {
    if (host.dataset.nfcBound) return;
    var panel = host.querySelector('.studio-panel'), presentation = host.closest('.nfc-presentation');
    var pause = presentation.querySelector('[data-nfc-pause]'), replay = presentation.querySelector('[data-nfc-replay]'), status = presentation.querySelector('[data-nfc-status]');
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var bounds = host.getBoundingClientRect(), visible = bounds.top < window.innerHeight && bounds.bottom > 0;
    var paused = false, complete = false, pageActive = true;
    var config = window.NETBUD_CONFIG || {}, refreshClock = setupPhoneClock(host);
    host.querySelectorAll('[data-hero-contact-phone]').forEach(function(node){node.textContent=config.phoneDisplay || '0425 714 451';});
    host.querySelectorAll('[data-hero-contact-email]').forEach(function(node){node.textContent=config.contactEmail || 'bilal@netbud.com.au';});
    host.dataset.nfcBound = 'true';
    function update() {
      var reduced = preference.matches;
      var playing = !reduced && !paused && !complete && visible && !document.hidden && pageActive;
      host.classList.toggle('is-scene-paused', !playing);
      host.classList.toggle('is-nfc-static', reduced);
      host.dataset.nfcState = reduced ? 'static' : complete ? 'complete' : paused ? 'paused' : playing ? 'playing' : 'waiting';
      pause.disabled = reduced || complete; replay.disabled = reduced;
      pause.textContent = paused ? 'Resume ▷' : 'Pause Ⅱ';
      pause.setAttribute('aria-label', paused ? 'Resume NFC demonstration' : 'Pause NFC demonstration');
      pause.setAttribute('aria-pressed', String(paused));
      status.textContent = reduced ? 'Static contact preview · reduced motion.' : complete ? 'Contact preview · replay whenever you like.' : paused ? 'Demonstration paused.' : playing ? 'A simple connection, in ten seconds.' : 'Ready when you scroll into view.';
    }
    function restart() {
      paused = false; complete = false; refreshClock();
      panel.classList.remove('is-active');
      void panel.offsetWidth; // One deliberate reflow only on an explicit Replay.
      panel.classList.add('is-active'); update();
    }
    pause.addEventListener('click', function(){if(preference.matches || complete)return;paused=!paused;update();});
    replay.addEventListener('click', function(){if(!preference.matches)restart();});
    panel.addEventListener('animationend', function(event){if(event.animationName==='nfc-section-phone'){complete=true;update();}});
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pagehide', function(){pageActive=false;update();});
    window.addEventListener('pageshow', function(){pageActive=true;update();});
    preference.addEventListener('change', function(){if(preference.matches)update();else restart();});
    if (window.IntersectionObserver) {
      var observer = new window.IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.target===host){visible=entry.isIntersecting && entry.intersectionRatio>=.15;update();}});},{threshold:[0,.15]});
      observer.observe(host);
    }
    update();
  }
  function init() { setupWebsiteHero(); document.querySelectorAll('[data-nfc-demo]').forEach(setupNfcDemo); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
