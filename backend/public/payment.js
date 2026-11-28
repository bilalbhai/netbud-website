const form = document.getElementById('payment-status');
const feedback = document.getElementById('feedback');
let retry;
form.onsubmit = async event => {
  event.preventDefault();
  const buttons = [...form.querySelectorAll('button')];
  for (const button of buttons) button.disabled = true;
  try {
    const response = await fetch('/api/ordering/tracking/orders', {cache:'no-store'});
    const history = await response.json();
    if (!response.ok) throw Error('Verify your email on Track My Order first.');
    const reference = document.getElementById('reference').value.trim().toUpperCase();
    const order = history.orders?.find(item => item.reference === reference);
    if (!order) throw Error('No matching order in this verified session.');
    const create = event.submitter?.value === 'checkout';
    if (retry?.order !== order.id) retry = {order:order.id,key:crypto.randomUUID()};
    const result = await fetch('/api/ordering/payments/' + (create?'checkout':'status'), {
      method:'POST', headers:{'Content-Type':'application/json','X-CSRF-Token':history.csrf,...(create?{'Idempotency-Key':retry.key}:{})},
      body:JSON.stringify({order_id:order.id,...(create?{purpose:'balance'}:{})})
    });
    const data = await result.json();
    if (!result.ok) throw Error('Payment verification is currently unavailable. Try again later.');
    if (create) {
      if (data.checkout_url) {
        const url = new URL(data.checkout_url);
        if (url.protocol !== 'https:' || !['checkout.revolut.com','sandbox-checkout.revolut.com'].includes(url.hostname)) throw Error('Unexpected checkout destination.');
        window.location.assign(url.href);
      } else feedback.textContent = 'Awaiting provider reconciliation. Repeated clicks will not create a second payment.';
      return;
    }
    const list = document.getElementById('results');
    list.replaceChildren();
    for (const item of data) {
      const p = document.createElement('p');
      p.textContent = 'Sandbox ' + item.state + ' · ' + new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(item.amount_cents/100)
        + (item.review_required ? ' · Owner review required' : '');
      list.append(p);
    }
    feedback.textContent = data.length ? 'Provider verification checked. Sandbox results have no monetary value.' : 'No Sandbox payment recorded.';
  } catch (error) { feedback.textContent = error.message; }
  finally { for (const button of buttons) button.disabled = false; }
};
