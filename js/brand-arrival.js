/* Independent arrival and headline effects; hero scroll mechanics stay untouched. */
(function () {
  'use strict';
  function typeHeadline(heading, preference) {
    if (!heading || preference.matches || document.hidden) return;
    var frame = null, startTime = null, done = false, previous = '';
    var typed = document.createElement('span');
    typed.className = 'headline-typed'; typed.setAttribute('aria-hidden', 'true');
    heading.setAttribute('aria-label', 'We make Business tech easy.');
    heading.classList.add('is-headline-typing'); heading.appendChild(typed);
    function finish() {
      if (done) return;
      done = true; window.cancelAnimationFrame(frame);
      typed.remove(); heading.classList.remove('is-headline-typing');
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('resize', finish); window.removeEventListener('pagehide', finish);
      preference.removeEventListener('change', finish);
    }
    function visibility() { if (document.hidden) finish(); }
    // Fixed rows reserve the final layout before the first character appears.
    var first = document.createElement('span'); first.className = 'headline-line';
    var prefix = document.createElement('span'); prefix.className = 'headline-prefix';
    var row = document.createElement('span'); row.className = 'headline-word-row';
    var word = document.createElement('span'); word.className = 'headline-word';
    var second = document.createElement('span'); second.className = 'headline-line';
    var tail = document.createElement('span'); tail.className = 'headline-tail';
    var accent = document.createElement('span'); accent.className = 'headline-accent';
    row.appendChild(word); first.append(prefix, row); second.append(tail, accent); typed.append(first, second);
    function draw(text) {
      if (text === previous) return;
      previous = text;
      prefix.textContent = text.slice(0, 8);
      var rest = text.slice(8), split = rest.indexOf(' ');
      word.textContent = split === -1 ? rest : rest.slice(0, split);
      var ending = split === -1 ? '' : rest.slice(split + 1);
      tail.textContent = ending.slice(0, 5);
      accent.textContent = ending.slice(5);
      var current = text.length < 8 ? prefix : split === -1 ? word : ending.length <= 5 ? tail : accent;
      [prefix, word, tail, accent].forEach(function (part) { part.classList.toggle('is-typing-target', part === current); });
    }
    function tick(now) {
      if (startTime === null) startTime = now;
      var elapsed = now - startTime;
      if (elapsed >= 3000) { finish(); return; }
      var text;
      if (elapsed < 900) text = 'We make Websites'.slice(0, Math.floor(elapsed / 900 * 16));
      else if (elapsed < 1125) text = 'We make Websites';
      else if (elapsed < 1575) text = 'We make ' + 'Websites'.slice(0, 8 - Math.floor((elapsed - 1125) / 450 * 8));
      else text = 'We make ' + 'Business tech easy'.slice(0, Math.ceil((elapsed - 1575) / 1425 * 18));
      draw(text); frame = window.requestAnimationFrame(tick);
    }
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('resize', finish); window.addEventListener('pagehide', finish);
    preference.addEventListener('change', finish);
    frame = window.requestAnimationFrame(tick);
  }
  function start() {
    if (!document.querySelector('[data-website-hero]')) return;
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var target = document.querySelector('#site-header .brand img'), heading = document.querySelector('#hero-title');
    if (!target || preference.matches || document.hidden || !target.animate) return;
    var navigation = window.performance && window.performance.getEntriesByType('navigation')[0];
    if (navigation && navigation.type === 'back_forward') return;
    var bounds = target.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    var overlay = document.createElement('div'); overlay.className = 'brand-arrival'; overlay.setAttribute('aria-hidden', 'true');
    var backdrop = document.createElement('div'); backdrop.className = 'brand-arrival__backdrop';
    var flight = document.createElement('div'); flight.className = 'brand-arrival__flight';
    var width = Math.min(112, window.innerWidth * .3), height = width * 40 / 54;
    flight.style.cssText = 'left:' + ((window.innerWidth-width)/2) + 'px;top:' + (window.innerHeight/2-height-22) + 'px;width:' + width + 'px;height:' + height + 'px';
    var logo = document.createElement('img'); logo.src = '/images/logo-symbol.svg'; logo.alt = ''; logo.width = 54; logo.height = 40;
    var welcome = document.createElement('div'); welcome.className = 'brand-arrival__welcome';
    var greeting = document.createElement('span'); greeting.textContent = 'Welcome to';
    var wordmark = document.createElement('img'); wordmark.src = '/images/logo-wordmark.svg'; wordmark.alt = ''; wordmark.width = 174; wordmark.height = 58;
    welcome.append(greeting, wordmark); flight.appendChild(logo); overlay.append(backdrop, flight, welcome); document.body.appendChild(overlay);
    target.classList.add('is-brand-arriving'); if (heading) heading.classList.add('is-brand-intro-pending');
    var animations = [], finished = false, fallback;
    function cleanup(typing) {
      if (finished) return;
      finished = true; window.clearTimeout(fallback);
      target.classList.remove('is-brand-arriving'); if (heading) heading.classList.remove('is-brand-intro-pending');
      overlay.remove(); animations.forEach(function (animation) { animation.cancel(); });
      window.removeEventListener('resize', abort); window.removeEventListener('pagehide', abort);
      document.removeEventListener('visibilitychange', visibility); preference.removeEventListener('change', abort);
      if (typing === true) typeHeadline(heading, preference);
    }
    function abort() { cleanup(false); }
    function visibility() { if (document.hidden) abort(); }
    function animate(node, frames, duration, easing) {
      var animation = node.animate(frames, {duration:duration, easing:easing, fill:'forwards'});
      animation.finished.catch(function () {}); animations.push(animation); return animation;
    }
    function fly(node, destination) {
      var origin = node.getBoundingClientRect(); node.style.transformOrigin = '0 0';
      return animate(node, [{transform:'translate(0,0) scale(1,1)'}, {transform:'translate(' + (destination.left-origin.left) + 'px,' + (destination.top-origin.top) + 'px) scale(' + destination.width/origin.width + ',' + destination.height/origin.height + ')'}], 1000, 'cubic-bezier(.65,0,.2,1)');
    }
    window.addEventListener('resize', abort); window.addEventListener('pagehide', abort);
    document.addEventListener('visibilitychange', visibility); preference.addEventListener('change', abort);
    logo.addEventListener('error', abort, {once:true}); wordmark.addEventListener('error', abort, {once:true});
    fallback = window.setTimeout(abort, 2400);
    try {
      var spin = animate(logo, [{transform:'perspective(800px) rotateY(0deg)'}, {transform:'perspective(800px) rotateY(720deg)'}], 1000, 'cubic-bezier(.45,0,.25,1)');
      spin.finished.then(function () {
        if (finished) return;
        // Original logo.svg uses a 238 × 58 viewBox. These pieces align to its exact artwork.
        var rect = target.getBoundingClientRect(), scale = Math.min(rect.width/238, rect.height/58);
        var x = rect.left + (rect.width-238*scale)/2, y = rect.top + (rect.height-58*scale)/2;
        var move = fly(flight, {left:x,top:y+8*scale,width:54*scale,height:40*scale});
        fly(wordmark, {left:x+64*scale,top:y,width:174*scale,height:58*scale});
        animate(greeting, [{opacity:1},{opacity:0}], 200, 'ease-out');
        animate(backdrop, [{opacity:1},{opacity:0}], 700, 'ease-out');
        return move.finished.then(function () { cleanup(true); });
      }).catch(abort);
    } catch (error) { abort(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
