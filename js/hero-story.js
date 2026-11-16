/* Two original product demonstrations. No device permissions or contact writes. */
(function () {
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
  function initHeroStory() {
    var host = document.querySelector('[data-hero-story]');
    if (!host || host.dataset.storyBound) return;
    host.dataset.storyBound = 'true';
    var panels = Array.from(host.querySelectorAll('[data-demo-panel]'));
    var control = host.querySelector('[data-story-pause]');
    var title = host.querySelector('[data-story-title]');
    var order = host.querySelector('[data-story-order]');
    var progress = Array.from(host.querySelectorAll('.hero-story__progress > span'));
    if (panels.length !== 2) return;
    var duration = Number(host.dataset.demoInterval) || 3000;
    var preference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var config = window.NETBUD_CONFIG || {};
    var refreshPhoneClock = setupPhoneClock(host);
    var active = 0;
    var timer = null;
    var startedAt = 0;
    var remaining = duration;
    var userPaused = false;
    var pageActive = true;
    var bounds = host.getBoundingClientRect();
    var inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
    var orderFocused = false;
    var clock = function () { return window.performance ? window.performance.now() : Date.now(); };
    host.style.setProperty('--story-duration', duration + 'ms');
    host.querySelectorAll('[data-hero-contact-phone]').forEach(function (node) { node.textContent = config.phoneDisplay || '0425 714 451'; });
    host.querySelectorAll('[data-hero-contact-email]').forEach(function (node) { node.textContent = config.contactEmail || 'bilal@netbud.com.au'; });

    function reduced() { return Boolean(preference && preference.matches); }
    function stopClock() {
      if (timer === null) return;
      window.clearTimeout(timer);
      timer = null;
      remaining = Math.max(0, remaining - (clock() - startedAt));
    }
    function canRun() { return !userPaused && !reduced() && !document.hidden && inView && pageActive && !orderFocused; }
    function updateControl() {
      var moving = canRun();
      host.classList.toggle('is-scene-paused', !moving);
      host.classList.toggle('is-story-reduced', reduced());
      host.dataset.storyState = reduced() ? 'reduced' : moving ? 'playing' : 'paused';
      if (!control) return;
      if (reduced()) {
        control.textContent = 'Next preview ↗';
        control.removeAttribute('aria-pressed');
        control.setAttribute('aria-label', panels[active].dataset.demoPanel === 'websites' ? 'Show the NFC contact-card preview' : 'Show the website preview');
      } else {
        control.innerHTML = userPaused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
        control.setAttribute('aria-pressed', String(userPaused));
        control.setAttribute('aria-label', userPaused ? 'Play product animation' : 'Pause product animation');
      }
    }
    function schedule() {
      stopClock();
      updateControl();
      if (!canRun()) return;
      startedAt = clock();
      timer = window.setTimeout(function () {
        timer = null;
        if (!canRun()) { updateControl(); return; }
        show((active + 1) % panels.length);
      }, remaining);
    }
    function show(index) {
      stopClock();
      active = index;
      remaining = duration;
      panels.forEach(function (panel, i) {
        panel.hidden = i !== active;
        panel.classList.toggle('is-active', i === active);
      });
      progress.forEach(function (item, i) { item.classList.toggle('is-current', i === active); });
      host.dataset.storyActive = panels[active].dataset.demoPanel;
      var website = panels[active].dataset.demoPanel === 'websites';
      if (!website) refreshPhoneClock();
      host.classList.toggle('is-story-website', website);
      if (title) title.textContent = website ? 'Websites for your business' : 'NetBud NFC cards';
      if (order) {
        order.hidden = false;
        order.textContent = website ? 'Explore plans' : 'Order your custom NFC card now';
        order.setAttribute('href', website ? 'pricing.html' : 'product.html?id=5');
        order.setAttribute('aria-label', website ? 'Explore website plans' : 'Order your custom NFC card now');
      }
      schedule();
    }
    if (control) control.addEventListener('click', function () {
      if (reduced()) { show((active + 1) % panels.length); return; }
      userPaused = !userPaused;
      schedule();
    });
    if (order) {
      order.addEventListener('focus', function () { orderFocused = true; schedule(); });
      order.addEventListener('blur', function () { orderFocused = false; schedule(); });
    }
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pagehide', function () { pageActive = false; schedule(); });
    window.addEventListener('pageshow', function () { pageActive = true; schedule(); });
    function motionChanged() {
      stopClock();
      remaining = duration;
      schedule();
    }
    if (preference && preference.addEventListener) preference.addEventListener('change', motionChanged);
    else if (preference && preference.addListener) preference.addListener(motionChanged);
    if (window.IntersectionObserver) {
      try {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) { if (entry.target === host) inView = entry.isIntersecting; });
          schedule();
        }, { threshold: 0 }).observe(host);
      } catch (error) { inView = true; }
    }
    show(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeroStory);
  else initHeroStory();
}());
