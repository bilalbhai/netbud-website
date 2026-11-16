/* Responsive comparison, short pinned story and user-controlled project carousel. */
(function () {
  'use strict';
  function setupDepthCarousel(track, cards, index) {
    var wrapper = document.createElement('div');
    wrapper.className = 'project-carousel project-carousel--depth';
    track.parentNode.insertBefore(wrapper, track); wrapper.appendChild(track);
    track.id = track.id || 'work-depth-carousel-' + (index + 1);
    track.setAttribute('role', 'region');
    track.setAttribute('aria-roledescription', 'carousel');
    track.setAttribute('aria-label', 'Selected website projects');
    track.tabIndex = 0;
    var status = document.createElement('p');
    status.className = 'sr-only';
    status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    var previous = document.createElement('button'); var next = document.createElement('button');
    previous.type = next.type = 'button';
    previous.className = 'project-depth-arrow project-depth-arrow--previous';
    next.className = 'project-depth-arrow project-depth-arrow--next';
    previous.innerHTML = '<span aria-hidden="true">←</span>';
    next.innerHTML = '<span aria-hidden="true">→</span>';
    previous.setAttribute('aria-label', 'Previous project'); next.setAttribute('aria-label', 'Next project');
    previous.setAttribute('aria-controls', track.id); next.setAttribute('aria-controls', track.id);
    wrapper.append(previous, next, status);
    var active = 0;
    function show(position) {
      active = (position + cards.length) % cards.length;
      cards.forEach(function (card, i) {
        var offset = (i - active + cards.length) % cards.length;
        var current = offset === 0;
        card.classList.toggle('is-depth-current', current);
        card.classList.toggle('is-depth-next', offset === 1);
        card.classList.toggle('is-depth-previous', offset === cards.length - 1);
        card.setAttribute('aria-hidden', String(!current));
        card.inert = !current;
      });
      var heading = cards[active].querySelector('h3');
      status.textContent = 'Project ' + (active + 1) + ' of ' + cards.length + ': ' + (heading ? heading.textContent : 'Website project');
      wrapper.dataset.activeProject = String(active);
    }
    previous.addEventListener('click', function () { show(active - 1); });
    next.addEventListener('click', function () { show(active + 1); });
    track.addEventListener('keydown', function (event) {
      if (event.target !== track || !/^(ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) return;
      event.preventDefault();
      if (event.key === 'Home') show(0);
      else if (event.key === 'End') show(cards.length - 1);
      else show(active + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    var touchStart = null;
    track.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'touch') return;
      touchStart = {x:event.clientX,y:event.clientY};
    });
    track.addEventListener('pointerup', function (event) {
      if (!touchStart) return;
      var x = event.clientX - touchStart.x, y = event.clientY - touchStart.y;
      if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.5) show(active + (x < 0 ? 1 : -1));
      touchStart = null;
    });
    track.addEventListener('pointercancel', function () { touchStart = null; });
    show(0);
  }
  function init() {
    document.querySelectorAll('[data-comparison]').forEach(function (input) {
      var comparison = input.closest('.comparison');
      if (!comparison) return;
      function update() {
        var amount = Math.max(0, Math.min(100, Number(input.value) || 0));
        comparison.style.setProperty('--comparison-tilt', ((amount - 50) * .07) + 'deg');
        comparison.querySelector('.comparison-before').classList.toggle('is-collapsed', amount > 90);
        comparison.querySelector('.comparison-after').classList.toggle('is-collapsed', amount < 10);
      }
      input.addEventListener('input', update);
      input.addEventListener('change', update);
      var divider = comparison.querySelector('.comparison-divider');
      var stage = comparison.querySelector('.comparison-stage');
      var dragging = false;
      function drag(event) {
        if (!dragging) return;
        var bounds = stage.getBoundingClientRect();
        input.value = String(Math.round(Math.max(0, Math.min(100, 100 - (event.clientX - bounds.left) / bounds.width * 100))));
        input.dispatchEvent(new Event('input', {bubbles:true}));
      }
      if (divider && stage && window.PointerEvent) {
        divider.addEventListener('pointerdown', function (event) {
          if (event.button !== 0) return;
          event.preventDefault(); dragging = true;
          divider.setPointerCapture(event.pointerId);
          input.focus({preventScroll:true}); drag(event);
        });
        divider.addEventListener('pointermove', drag);
        function endDrag(event) {
          if (!dragging) return;
          drag(event); dragging = false;
          input.dispatchEvent(new Event('change', {bubbles:true}));
        }
        divider.addEventListener('pointerup', endDrag);
        divider.addEventListener('pointercancel', function () { dragging = false; });
      }
      update();
    });

    document.querySelectorAll('[data-project-carousel]').forEach(function (track, index) {
      var cards = Array.from(track.querySelectorAll('.portfolio-card'));
      if (!cards.length) return;
      if (track.closest('.work-section')) { setupDepthCarousel(track, cards, index); return; }
      var wrapper = document.createElement('div');
      wrapper.className = 'project-carousel';
      track.parentNode.insertBefore(wrapper, track); wrapper.appendChild(track);
      track.id = track.id || 'project-carousel-' + (index + 1);
      track.setAttribute('role', 'region');
      track.setAttribute('aria-label', 'Projects and website concepts');
      track.tabIndex = 0;
      var controls = document.createElement('div'); controls.className = 'project-carousel-controls';
      var status = document.createElement('p');
      var previous = document.createElement('button'); var next = document.createElement('button');
      previous.type = next.type = 'button'; previous.textContent = '←'; next.textContent = '→';
      previous.setAttribute('aria-label', 'Previous project'); next.setAttribute('aria-label', 'Next project');
      previous.setAttribute('aria-controls', track.id); next.setAttribute('aria-controls', track.id);
      controls.append(status, previous, next); wrapper.appendChild(controls);
      function currentIndex() { return cards.reduce(function (best, card, n) { return Math.abs(card.offsetLeft - cards[0].offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - track.scrollLeft) ? n : best; }, 0); }
      function update() {
        var max = track.scrollWidth - track.clientWidth;
        previous.disabled = track.scrollLeft < 3;
        next.disabled = track.scrollLeft >= max - 3;
        var visible = cards.filter(function (card) { return card.offsetLeft - cards[0].offsetLeft < track.scrollLeft + track.clientWidth - 10 && card.offsetLeft - cards[0].offsetLeft + card.offsetWidth > track.scrollLeft + 10; });
        status.textContent = (currentIndex() + 1) + '–' + Math.min(cards.length, currentIndex() + visible.length) + ' of ' + cards.length + ' projects · swipe or use arrows';
      }
      function move(direction) {
        var amount = cards[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        track.scrollBy({ left: direction * amount, behavior: reduced ? 'instant' : 'smooth' });
      }
      previous.addEventListener('click', function () { move(-1); });
      next.addEventListener('click', function () { move(1); });
      track.addEventListener('scroll', update, { passive: true });
      track.addEventListener('keydown', function (event) {
        if (event.target !== track || !/^(ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) return;
        event.preventDefault();
        if (event.key === 'Home' || event.key === 'End') track.scrollTo({left: event.key === 'Home' ? 0 : track.scrollWidth, behavior:'instant'});
        else move(event.key === 'ArrowLeft' ? -1 : 1);
      });
      if (window.ResizeObserver) new ResizeObserver(update).observe(track);
      else window.addEventListener('resize', update, {passive:true});
      update();
    });

    var pending = false;
    function updateHeader() { document.body.classList.toggle('has-scrolled', window.scrollY > 12); pending = false; }
    window.addEventListener('scroll', function () { if (!pending) { pending = true; window.requestAnimationFrame(updateHeader); } }, {passive:true});
    updateHeader();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
