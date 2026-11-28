import {fail, keys, uuid, digest, networkKey} from './core.mjs';

const BASE = 'https://sandbox-merchant.revolut.com/';
const VERSION = '2026-10-06';
const states = new Set(['pending','processing','authorised','completed','failed','cancelled','refunded']);
const encoder = new TextEncoder();
function providerId(value) {
  // Revolut UUID-shaped references can use non-RFC version nibbles.
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) fail(502, 'invalid_provider_reference');
  return value;
}

function checkoutUrl(value) {
  let url;
  try { url = new URL(value); } catch { fail(502, 'invalid_provider_response'); }
  if (url.protocol !== 'https:' || !['sandbox-checkout.revolut.com','checkout.revolut.com'].includes(url.hostname)
      || url.username || url.password || url.port) fail(502, 'invalid_provider_response');
  return url.href;
}

export class RevolutSandbox {
  constructor(env, fetcher = fetch) {
    if (env.ENVIRONMENT !== 'staging' || env.REVOLUT_MERCHANT_API_BASE_URL !== BASE
        || !env.REVOLUT_MERCHANT_API_KEY) fail(503, 'sandbox_not_configured');
    this.key = env.REVOLUT_MERCHANT_API_KEY;
    this.fetcher = fetcher;
  }
  async request(path, body) {
    let response;
    try {
      response = await this.fetcher(BASE + 'api/' + path, {
        method: body ? 'POST' : 'GET', redirect: 'error',
        headers: {Authorization: 'Bearer ' + this.key, 'Revolut-Api-Version': VERSION, 'Content-Type': 'application/json'},
        ...(body ? {body: JSON.stringify(body)} : {}),
        signal: AbortSignal.timeout(5000)
      });
    } catch { fail(503, 'provider_outcome_uncertain'); }
    // Creation is never automatically retried. Create-order has no documented idempotency guarantee.
    if (!response.ok) fail(response.status >= 500 ? 503 : 502,
      response.status >= 500 || response.status === 429 ? 'provider_outcome_uncertain' : 'provider_rejected');
    try { return await response.json(); } catch { fail(503, 'provider_outcome_uncertain'); }
  }
  async create(intent, origin) {
    const order = await this.request('orders', {
      amount: intent.amount_cents, currency: 'AUD', capture_mode: 'automatic',
      description: 'NetBud Sandbox demonstration',
      metadata: {netbud_payment_intent: intent.id},
      redirect_url: origin + '/payment/'
    });
    providerId(order.id);
    if (order.amount !== intent.amount_cents || order.currency !== 'AUD'
        || order.metadata?.netbud_payment_intent !== intent.id) fail(502, 'invalid_provider_response');
    return {provider_order: order.id, checkout_url: checkoutUrl(order.checkout_url)};
  }
  async get(id) { return this.request('orders/' + providerId(id)); }
}

export async function verifyRevolutWebhook(request, secrets, now = Date.now()) {
  const timestamp = request.headers.get('revolut-request-timestamp');
  const signatures = (request.headers.get('revolut-signature') || '').split(',').map(s => s.trim());
  if (!/^\d{13}$/.test(timestamp || '') || Math.abs(now - Number(timestamp)) > 300000
      || !Array.isArray(secrets) || !secrets.length || secrets.length > 2 || signatures.length > 4) fail(401, 'invalid_webhook');
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'invalid_webhook');
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 65536) { await reader.cancel(); fail(413, 'request_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  // Sign the exact received bytes. Never trim whitespace or reserialize JSON.
  const prefix = encoder.encode('v1.' + timestamp + '.');
  const signed = new Uint8Array(prefix.length + bytes.length);
  signed.set(prefix); signed.set(bytes, prefix.length);
  let valid = false;
  for (const secret of secrets) {
    if (typeof secret !== 'string' || secret.length < 16) fail(503, 'webhook_not_configured');
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['verify']);
    for (const signature of signatures) {
      if (!/^v1=[a-f0-9]{64}$/.test(signature)) continue;
      const mac = Uint8Array.from(signature.slice(3).match(/../g), x => parseInt(x, 16));
      if (await crypto.subtle.verify('HMAC', key, mac, signed)) valid = true;
    }
  }
  if (!valid) fail(401, 'invalid_webhook');
  let event;
  try { event = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); }
  catch { fail(400, 'invalid_webhook'); }
  providerId(event.order_id);
  if (typeof event.event !== 'string' || event.event.length > 100) fail(400, 'invalid_webhook');
  return {event, fingerprint: await digest(new TextDecoder().decode(bytes))};
}

export async function reconcileRevolut(repo, provider, id, fingerprint, disputed = false) {
  const order = await provider.get(id);
  if (order.id !== id || !states.has(order.state) || order.currency !== 'AUD'
      || !Number.isSafeInteger(order.amount) || order.amount <= 0
      || !Number.isFinite(Date.parse(order.updated_at))) fail(502, 'invalid_provider_response');
  const intentId = uuid(order.metadata?.netbud_payment_intent);
  const intent = await repo.rpc('netbud_revolut', {p_action:'find', p_data:{provider_order:id, intent_id:intentId}});
  if (!intent || intent.id !== intentId || intent.amount_cents !== order.amount
      || (intent.provider_order && intent.provider_order !== id)) fail(409, 'payment_mismatch');
  const refunded = order.refunded_amount ?? 0;
  if (!Number.isSafeInteger(refunded) || refunded < 0 || refunded > order.amount) fail(409, 'payment_mismatch');
  const transactions = [];
  const seen = new Set();
  if (['completed','refunded'].includes(order.state)) {
    for (const payment of order.payments || []) {
      if (payment.state !== 'completed') continue;
      providerId(payment.id);
      if (seen.has(payment.id) || payment.currency !== 'AUD' || !Number.isSafeInteger(payment.amount) || payment.amount <= 0) fail(409, 'payment_mismatch');
      seen.add(payment.id);
      transactions.push({id:payment.id, amount_cents:payment.amount});
    }
    if (transactions.reduce((sum, p) => sum + p.amount_cents, 0) !== order.amount
        || (order.state === 'refunded' && refunded !== order.amount)) fail(409, 'payment_mismatch');
  }
  return repo.rpc('netbud_revolut', {p_action:'reconcile', p_data:{
    intent_id:intent.id, provider_order:id, amount_cents:order.amount, currency:'AUD',
    state:order.state, refunded_cents:refunded, updated_at:order.updated_at,
    fingerprint:fingerprint || await digest(JSON.stringify([id,order.updated_at,order.state,refunded])),
    transactions, review_required:disputed
  }});
}

export function createRevolut({env, repo, authenticate, fetcher = fetch}) {
  const enabled = () => env.ENVIRONMENT === 'staging' && env.REVOLUT_SANDBOX_APPROVED === 'true';
  return async (request, network) => {
    const reply = (status, body) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
    try {
      if (!enabled()) return reply(404, {error:'not_found'});
      const url = new URL(request.url);
      const webhook = url.pathname === '/api/revolut/events';
      if (request.method !== 'POST') fail(405, 'method_not_allowed');
      const provider = new RevolutSandbox(env, fetcher);
      if (webhook) {
        if (env.REVOLUT_WEBHOOK_APPROVED !== 'true') return reply(404, {error:'not_found'});
        if (!await repo.rpc('netbud_rate', {p_key:'revolut-webhooks',p_max:120,p_seconds:60})) fail(429, 'rate_limited');
        if (!env.REVOLUT_WEBHOOK_SECRET) fail(503, 'webhook_not_configured');
        const secrets = [env.REVOLUT_WEBHOOK_SECRET];
        if (env.REVOLUT_WEBHOOK_PREVIOUS_SECRET && Date.parse(env.REVOLUT_WEBHOOK_PREVIOUS_UNTIL) > Date.now()) {
          secrets.push(env.REVOLUT_WEBHOOK_PREVIOUS_SECRET);
        }
        const {event, fingerprint} = await verifyRevolutWebhook(request, secrets);
        // The signed event only requests reconciliation; canonical provider data decides the result.
        await reconcileRevolut(repo, provider, event.order_id, fingerprint, /DISPUT|CHARGEBACK/.test(event.event));
        return reply(200, {received:true});
      }
      if (request.headers.get('origin') !== env.APP_ORIGIN
          || request.headers.get('sec-fetch-site') === 'cross-site') fail(403, 'origin_denied');
      if (!network || !await repo.rpc('netbud_rate', {
        p_key:'revolut:' + await networkKey(network, env.RATE_LIMIT_HMAC_SECRET), p_max:30, p_seconds:600
      })) fail(429, 'rate_limited');
      const guest = url.pathname.startsWith('/api/ordering/payments/');
      let actor, guestHash;
      if (guest) {
        if (env.STAGING_GUEST_APPROVED !== 'true') fail(404, 'not_found');
        const token = (request.headers.get('cookie') || '').split(';').map(s => s.trim())
          .find(s => s.startsWith('__Host-netbud-guest='))?.slice('__Host-netbud-guest='.length);
        if (!/^[a-f0-9]{64}$/.test(token || '')) fail(401, 'verification_required');
        if (request.headers.get('x-csrf-token') !== await networkKey('csrf:' + token, env.OTP_HMAC_SECRET)) fail(403, 'csrf_denied');
        guestHash = await digest(token);
      } else {
        actor = await authenticate(request);
        if (actor.aal !== 'aal2' || !actor.mfaAt || Math.abs(Date.now()/1000 - actor.mfaAt) > 600) fail(403, 'fresh_mfa_required');
        if (await repo.rpc('netbud_staff', {p_actor:actor.id}) !== 'owner') fail(403, 'access_denied');
      }
      const principal = actor ? {p_actor:actor.id} : {p_guest_hash:guestHash};
      if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'json_required');
      // Read once with a strict bound; do not trust Content-Length.
      const bytes = await boundedBody(request, 2048);
      let body; try { body = JSON.parse(bytes); } catch { fail(400, 'invalid_input'); }
      if (url.pathname === '/api/admin/revolut/status' || url.pathname === '/api/ordering/payments/status') {
        keys(body, ['order_id']); uuid(body.order_id);
        const existing = await repo.rpc('netbud_revolut', {p_action:'status', ...principal, p_data:body});
        // Only after scoped lookup may the server fetch a linked provider order.
        for (const intent of existing.slice(-3)) {
          const record = await repo.rpc('netbud_revolut', {p_action:'find',p_data:{intent_id:intent.id}});
          if (record?.provider_order) {
            await reconcileRevolut(repo,provider,record.provider_order,null);
          }
        }
        return reply(200, await repo.rpc('netbud_revolut', {p_action:'status', ...principal, p_data:body}));
      }
      if (!['/api/admin/revolut/checkout','/api/ordering/payments/checkout'].includes(url.pathname)) fail(404, 'not_found');
      keys(body, ['order_id','item_id','purpose']); uuid(body.order_id);
      if (body.item_id) uuid(body.item_id);
      if (!['balance','deposit'].includes(body.purpose)) fail(400, 'invalid_input');
      const intent = await repo.rpc('netbud_revolut', {p_action:'reserve', ...principal,
        p_data:{...body, key:uuid(request.headers.get('idempotency-key')), hash:await digest(JSON.stringify(body))}});
      if (!intent.should_create) {
        return reply(intent.checkout_url ? 200 : 202, {sandbox:true, state:intent.state, checkout_url:intent.checkout_url || null});
      }
      let created;
      try { created = await provider.create(intent, env.APP_ORIGIN); }
      catch (error) {
        await repo.rpc('netbud_revolut', {p_action:error.code === 'provider_rejected' ? 'failed' : 'uncertain', p_data:{intent_id:intent.id}});
        throw error;
      }
      await repo.rpc('netbud_revolut', {p_action:'bind', p_data:{intent_id:intent.id, ...created}});
      return reply(201, {sandbox:true, state:'pending', checkout_url:created.checkout_url});
    } catch (error) {
      return reply(error.status || 503, {error:error.code || 'payment_unavailable'});
    }
  };
}

async function boundedBody(request, max) {
  const reader = request.body?.getReader(); if (!reader) fail(400, 'invalid_input');
  const chunks = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    length += value.length;
    if (length > max) { await reader.cancel(); fail(413, 'request_too_large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}
