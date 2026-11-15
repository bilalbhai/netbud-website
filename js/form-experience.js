/* Gentle form guidance. Validation and enquiry delivery remain in main.js. */
(function () {
  'use strict';

  var enhanced = new WeakMap();
  var assistCounter = 0;
  var fieldSelector = 'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]), select, textarea';
  var guidance = {
    name: 'The name we should ask for.',
    email: 'Where we can send your project details.',
    phone: 'An Australian number we can reach you on.',
    business: 'Optional — leave this blank if you’re still getting started.',
    website: 'Optional — add the full address, starting with https://.',
    message: 'A few useful details are enough to get started.',
    deliveryAddress: 'Where your physical items would need to go.'
  };

  function activeRequired(form) {
    return Array.from(form.querySelectorAll('input[required], select[required], textarea[required]')).filter(function (field) {
      return !field.disabled && field.type !== 'hidden' && field.name !== 'website_confirm';
    });
  }

  function complete(field) {
    if (field.type === 'checkbox' || field.type === 'radio') return field.checked;
    if (!field.value.trim() || !field.validity.valid) return false;
    if (field.name === 'phone' && window.NetBud && typeof window.NetBud.validAustralianPhone === 'function') {
      return window.NetBud.validAustralianPhone(field.value);
    }
    return true;
  }

  function addFieldState(field) {
    if (!field.matches(fieldSelector) || field.closest('.honeypot')) return;
    var wrapper = field.closest('.field');
    if (!wrapper || wrapper.querySelector('[data-field-state]')) return;
    var state = document.createElement('span');
    state.className = 'field-state';
    state.dataset.fieldState = '';
    state.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(state);
  }

  function updateField(field, touched) {
    var wrapper = field.closest('.field');
    if (!wrapper || field.closest('.honeypot') || !field.matches(fieldSelector)) return;
    addFieldState(field);
    if (touched) field.dataset.experienceTouched = 'true';
    var good = !field.disabled && field.dataset.experienceTouched === 'true' && complete(field);
    var invalid = field.getAttribute('aria-invalid') === 'true';
    wrapper.classList.toggle('is-complete', good && !invalid);
    wrapper.classList.toggle('is-invalid', invalid);
    var state = wrapper.querySelector('[data-field-state]');
    if (state) state.textContent = good && !invalid ? '✓ Looks good' : '';
  }

  function enhance(form) {
    if (enhanced.has(form)) return;
    form.classList.add('form-enhanced');

    var progress = document.createElement('div');
    progress.className = 'form-progress';
    var headline = document.createElement('div');
    headline.className = 'form-progress__heading';
    var title = document.createElement('span');
    title.textContent = 'Let’s make a start';
    var count = document.createElement('span');
    count.className = 'form-progress__count';
    headline.append(title, count);
    var track = document.createElement('div');
    track.className = 'form-progress__track';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', 'Required details completed');
    track.setAttribute('aria-valuemin', '0');
    var bar = document.createElement('span');
    track.appendChild(bar);
    progress.append(headline, track);
    var assist = document.createElement('p');
    assist.className = 'form-assist';
    assist.id = 'form-assist-' + (++assistCounter);
    assist.setAttribute('role', 'status');
    assist.setAttribute('aria-live', 'polite');
    assist.setAttribute('aria-atomic', 'true');
    progress.appendChild(assist);
    form.insertBefore(progress, form.firstChild);

    var wasReady = false;
    function update(announce) {
      if (form.getAttribute('aria-busy') === 'true') return;
      var fields = activeRequired(form);
      var done = fields.filter(complete).length;
      var ready = fields.length > 0 && done === fields.length;
      count.textContent = done + ' of ' + fields.length + ' essentials';
      track.setAttribute('aria-valuemax', String(fields.length));
      track.setAttribute('aria-valuenow', String(done));
      track.setAttribute('aria-valuetext', done + ' of ' + fields.length + ' required details completed');
      bar.style.width = (fields.length ? done / fields.length * 100 : 0) + '%';
      progress.classList.toggle('is-ready', ready);
      title.textContent = ready ? 'Ready for your review' : 'Let’s make a start';
      form.querySelectorAll(fieldSelector).forEach(function (field) { updateField(field, false); });
      if (ready && !wasReady && announce) assist.textContent = 'Your required details are ready. You can review the request below.';
      else if (!announce || wasReady && !ready) assist.textContent = form.dataset.enquiryForm === 'callback'
        ? 'Your name, email and phone number are all we need to start.'
        : 'Complete the essentials, then review your request.';
      wasReady = ready;
    }

    enhanced.set(form, update);
    update(false);
    form.addEventListener('focusin', function (event) {
      var field = event.target;
      if (!field.matches(fieldSelector) || field.closest('.honeypot')) return;
      var message = guidance[field.name];
      if (!message && field.tagName === 'SELECT') message = field.required ? 'Choose the option that best fits.' : 'Optional — choose a preference, or leave it as it is.';
      if (!message) message = field.required ? 'Add this detail so we can understand your request.' : 'Optional — add this if it helps explain your project.';
      assist.textContent = message;
    });
    form.addEventListener('focusout', function (event) {
      if (!event.target.matches(fieldSelector)) return;
      updateField(event.target, true);
      update(true);
    });
    form.addEventListener('input', function (event) {
      if (event.target.matches(fieldSelector)) updateField(event.target, false);
      update(true);
    });
    form.addEventListener('change', function (event) {
      if (event.target.matches(fieldSelector)) updateField(event.target, true);
      update(true);
    });
    form.addEventListener('invalid', function (event) {
      updateField(event.target, true);
    }, true);
    form.addEventListener('reset', function () {
      // The reset event fires before the browser restores control values.
      window.requestAnimationFrame(function () {
        form.querySelectorAll('[data-experience-touched]').forEach(function (field) { delete field.dataset.experienceTouched; });
        update(false);
      });
    });
  }

  function scan(root) {
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.matches && root.matches('form[data-enquiry-form]')) enhance(root);
    root.querySelectorAll('form[data-enquiry-form]').forEach(enhance);
  }

  function initialise() {
    scan(document);
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.type === 'attributes') {
            var form = record.target.closest('form[data-enquiry-form]');
            if (form && enhanced.has(form)) enhanced.get(form)(false);
          } else record.addedNodes.forEach(scan);
        });
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['required', 'disabled', 'aria-busy'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
