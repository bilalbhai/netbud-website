const $ = id => document.getElementById(id);
const say = message => { $('feedback').textContent = message; };
let retry, busy = false;
async function api(path, body, key) {
  const token = window.NetBudStaff.token();
  if (!token) throw Error('Sign in again with your authenticator.');
  const response = await fetch('/api/admin/revolut/' + path, {
    method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer ' + token,...(key?{'Idempotency-Key':key}:{})},
    body:JSON.stringify(body), cache:'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || 'Sandbox request failed.');
  return data;
}
window.NetBudStaff.bind(async () => { $('login').hidden = true; $('workspace').hidden = false; say('Authenticator verified. Owner permission is checked on every payment request.'); }, say);
$('payment-form').onsubmit = async event => {
  event.preventDefault();
  if (busy) return;
  busy = true; $('create').disabled = true;
  const body = {order_id:$('order').value.trim(),purpose:$('purpose').value};
  if ($('item').value.trim()) body.item_id = $('item').value.trim();
  const serialized = JSON.stringify(body);
  if (retry?.body !== serialized) retry = {body:serialized,key:crypto.randomUUID()};
  try {
    const data = await api('checkout', body, retry.key);
    if (data.checkout_url) {
      const url = new URL(data.checkout_url);
      if (url.protocol !== 'https:' || !['checkout.revolut.com','sandbox-checkout.revolut.com'].includes(url.hostname)) throw Error('Unexpected checkout destination.');
      window.location.assign(url.href);
    } else say('Provider outcome is awaiting reconciliation. Repeated clicks will not create another payment.');
  } catch (error) { say(error.message); }
  finally { busy = false; $('create').disabled = false; }
};
$('status').onclick = async () => {
  if (busy) return;
  busy = true; $('status').disabled = true;
  try {
    const data = await api('status',{order_id:$('order').value.trim()});
    $('results').replaceChildren();
    for (const item of data) {
      const p = document.createElement('p');
      p.textContent = item.state + ' · AUD ' + (item.amount_cents/100).toFixed(2)
        + ' · refunded AUD ' + (item.refunded_cents/100).toFixed(2) + (item.review_required?' · Review required':'');
      $('results').append(p);
    }
    say('Canonical Sandbox status checked.');
  } catch (error) { say(error.message); }
  finally { busy = false; $('status').disabled = false; }
};
$('logout').onclick = async () => {
  try { await window.NetBudStaff.logout(); }
  finally { $('workspace').hidden = true; $('login').hidden = false; say('Session ended.'); }
};
