/* Two original product demonstrations. No device permissions or contact writes. */
(function () {
  'use strict';
  function setupLaptopIntroduction(host) {
    var laptop = host.querySelector('.laptop-demo');
    if (!laptop) return function () {};
    var surface = laptop.closest('.showcase-float') || laptop;
    var introduction = document.createElement('div');
    introduction.className = 'laptop-cinematic is-cinematic-intro';
    surface.parentNode.insertBefore(introduction, surface);
    introduction.appendChild(surface);
    var photo = laptop.querySelector('.laptop-demo__photo');
    if (photo) ['rim', 'base'].forEach(function (part) {
      var light = document.createElement('span');
      light.className = 'cinematic-reflection cinematic-reflection--' + part;
      light.setAttribute('aria-hidden', 'true');
      photo.appendChild(light);
    });
    function finish() {
      introduction.classList.remove('is-cinematic-intro');
      introduction.dataset.introComplete = 'true';
    }
    introduction.addEventListener('animationend', function (event) {
      if (event.animationName === 'laptop-studio-light') finish();
    });
    return finish;
  }
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
    var nextControl = host.querySelector('[data-story-next]');
    var title = host.querySelector('[data-story-title]');
    var order = host.querySelector('[data-story-order]');
    var progress = Array.from(host.querySelectorAll('.hero-story__progress > span'));
    if (panels.length !== 2) return;
    var duration = Number(host.dataset.demoInterval) || 3000;
    var preference = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var finishLaptopIntroduction = setupLaptopIntroduction(host);
    if (preference && preference.matches) finishLaptopIntroduction();
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
    var scrollRegion = host.closest ? host.closest('[data-scroll-hero]') : null;
    var desktopStory = scrollRegion && window.matchMedia('(min-width:1000px) and (min-height:760px)');
    var scrollMode = false, scrollFrame = null, scrollProgress = -1;
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
    function canRun() { return !scrollMode && !userPaused && !reduced() && !document.hidden && inView && pageActive && !orderFocused; }
    function updateControl() {
      var moving = canRun();
      host.classList.toggle('is-scene-paused', !moving);
      host.classList.toggle('is-story-reduced', reduced());
      host.dataset.storyState = reduced() ? 'reduced' : scrollMode ? (userPaused ? 'paused' : 'scrolling') : moving ? 'playing' : 'paused';
      document.dispatchEvent(new CustomEvent('netbud:storyplayback', {detail:{paused:userPaused}}));
      if (!control) return;
      if (scrollMode) {
        control.textContent = userPaused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
        control.setAttribute('aria-label', userPaused ? 'Resume hero motion' : 'Pause hero motion');
        control.setAttribute('aria-pressed', String(userPaused));
        if (nextControl) { nextControl.textContent = 'Next scene ↗'; nextControl.setAttribute('aria-label', 'Next hero scene'); }
      } else if (reduced()) {
        control.textContent = 'Next preview ↗';
        control.removeAttribute('aria-pressed');
        control.setAttribute('aria-label', panels[active].dataset.demoPanel === 'websites' ? 'Show the NFC contact-card preview' : 'Show the website preview');
      } else {
        if (nextControl) { nextControl.textContent = 'Next ↗'; nextControl.setAttribute('aria-label', 'Next product preview'); }
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
      // Consume an interrupted intro too: changing scenes must never replay it.
      if (index !== 0) finishLaptopIntroduction();
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
        order.setAttribute('href', website ? '/pricing/' : '/shop/custom-nfc-business-card/');
        order.setAttribute('aria-label', website ? 'Explore website plans' : 'Order your custom NFC card now');
      }
      schedule();
    }
    if (control) control.addEventListener('click', function () {
      if (reduced()) { show((active + 1) % panels.length); return; }
      userPaused = !userPaused;
      schedule();
      requestScrollRender();
    });
    if (nextControl) nextControl.addEventListener('click', function () {
      userPaused = false;
      if (scrollMode) {
        var stage = scrollRegion.querySelector('.hero-stage');
        var distance = scrollRegion.offsetHeight - stage.offsetHeight;
        var header = document.querySelector('#site-header');
        var top = scrollRegion.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 84);
        window.scrollTo({top:top + distance * (scrollProgress < .58 ? .82 : 0),behavior:'smooth'});
        schedule(); requestScrollRender(); return;
      }
      show((active + 1) % panels.length);
    });
    if (order) {
      order.addEventListener('focus', function () { orderFocused = true; schedule(); });
      order.addEventListener('blur', function () { orderFocused = false; schedule(); requestScrollRender(); });
    }
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('pagehide', function () { pageActive = false; schedule(); });
    window.addEventListener('pageshow', function () { pageActive = true; schedule(); });
    function motionChanged() {
      if (reduced()) finishLaptopIntroduction();
      stopClock();
      remaining = duration;
      configureScroll();
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
    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function renderScroll() {
      scrollFrame = null;
      if (!scrollMode || userPaused || orderFocused || document.hidden) return;
      var stage = scrollRegion.querySelector('.hero-stage');
      var header = document.querySelector('#site-header');
      var headerHeight = header ? header.offsetHeight : 84;
      var distance = Math.max(1, scrollRegion.offsetHeight - stage.offsetHeight);
      var p = clamp((headerHeight - scrollRegion.getBoundingClientRect().top) / distance);
      if (window.scrollY > 8) scrollRegion.classList.toggle('has-hero-scrolled', true);
      if (p === scrollProgress) return;
      scrollProgress = p;
      var nfc = p >= .58;
      scrollRegion.classList.toggle('is-hero-nfc', nfc);
      if (active !== (nfc ? 1 : 0)) show(nfc ? 1 : 0);
      var immersion = clamp((p - .10) / .38), nfcTime = clamp((p - .58) / .34);
      var visualOpacity = nfc ? Math.min(1, (p - .58) / .045) : 1 - clamp((p - .52) / .06);
      var ending = clamp((p - .94) / .06);
      scrollRegion.style.setProperty('--hero-progress', p);
      scrollRegion.style.setProperty('--hero-copy-opacity', 1 - clamp((p - .06) / .23));
      scrollRegion.style.setProperty('--hero-copy-shift', (-40 * immersion) + 'px');
      scrollRegion.style.setProperty('--hero-zoom', nfc ? String(1 - ending * .05) : String(.94 + immersion * 1.3));
      scrollRegion.style.setProperty('--hero-tilt', nfc ? '0deg' : (8 * (1 - immersion)) + 'deg');
      scrollRegion.style.setProperty('--hero-visual-y', nfc ? (-18 * ending) + 'px' : (-45 * immersion) + 'px');
      scrollRegion.style.setProperty('--hero-visual-opacity', visualOpacity * (1 - ending * .15));
      scrollRegion.style.setProperty('--hero-screen-shift', (-30 * immersion) + '%');
      scrollRegion.style.setProperty('--hero-nfc-delay', (-2.99 * nfcTime) + 's');
      scrollRegion.style.setProperty('--hero-aurora-y', (-35 * p) + 'px');
      scrollRegion.style.setProperty('--hero-light', String(Math.sin(Math.PI * clamp(p / .25)) * .22));
      scrollRegion.style.setProperty('--hero-light-x', (-45 + 90 * clamp(p / .25)) + '%');
      scrollRegion.classList.toggle('is-hero-ending', p > .94);
      var label = scrollRegion.querySelector('[data-hero-chapter]');
      if (label) label.textContent = p > .94 ? '04 / Good things, connected.' : nfc ? '03 / One tap. A real connection.' : p > .16 ? '02 / Step inside your next website.' : '01 / A website, made for you.';
    }
    function requestScrollRender() {
      if (scrollMode && scrollFrame === null && !document.hidden) scrollFrame = window.requestAnimationFrame(renderScroll);
    }
    function configureScroll() {
      if (!scrollRegion) return;
      var previous = scrollMode;
      scrollMode = Boolean(desktopStory.matches && !reduced() && window.requestAnimationFrame);
      scrollRegion.classList.toggle('hero-scroll-active', scrollMode);
      var header = document.querySelector('#site-header');
      scrollRegion.style.setProperty('--hero-header', (header ? header.offsetHeight : 84) + 'px');
      if (scrollMode) { if (!previous) scrollProgress = -1; stopClock(); finishLaptopIntroduction(); requestScrollRender(); }
      else if (previous) { userPaused = false; show(0); }
      updateControl();
    }
    if (scrollRegion) {
      window.addEventListener('scroll', requestScrollRender, {passive:true});
      window.addEventListener('resize', function () { configureScroll(); requestScrollRender(); }, {passive:true});
      document.addEventListener('visibilitychange', requestScrollRender);
      window.addEventListener('pageshow', requestScrollRender);
      if (desktopStory.addEventListener) desktopStory.addEventListener('change', configureScroll);
      configureScroll();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeroStory);
  else initHeroStory();
}());
