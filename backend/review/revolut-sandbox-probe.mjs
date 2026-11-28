// Development-only, read-only Merchant Sandbox probe. Never imported by the Worker.
import {pathToFileURL} from 'node:url';

export async function inspectSandboxOrder(env, orderId, fetcher = fetch) {
  if (env.REVOLUT_MERCHANT_API_BASE_URL !== 'https://sandbox-merchant.revolut.com/'
      || !env.REVOLUT_MERCHANT_API_KEY) {
    throw new Error('Sandbox origin and private Sandbox key required');
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(orderId || '')) {
    throw new Error('Supply a synthetic Sandbox order UUID');
  }
  let response;
  try {
    response = await fetcher(env.REVOLUT_MERCHANT_API_BASE_URL + 'api/orders/' + orderId, {
      method: 'GET',
      redirect: 'error',
      headers: {
        Authorization: 'Bearer ' + env.REVOLUT_MERCHANT_API_KEY,
        'Revolut-Api-Version': '2026-10-06'
      },
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    throw new Error('Sandbox request failed');
  }
  if (!response.ok) throw new Error('Sandbox request rejected with HTTP ' + response.status);
  const order = await response.json();
  if (order.id !== orderId || typeof order.state !== 'string'
      || !Number.isSafeInteger(order.amount) || typeof order.currency !== 'string') {
    throw new Error('Unexpected Sandbox response');
  }
  return {sandbox: true, state: order.state, amount: order.amount, currency: order.currency};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(await inspectSandboxOrder(process.env, process.argv[2])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
