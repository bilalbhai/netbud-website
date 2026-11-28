import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSandboxOrder} from '../review/revolut-sandbox-probe.mjs';

const id = '10000000-0000-4000-8000-000000000001';
const env = {
  REVOLUT_MERCHANT_API_BASE_URL: 'https://sandbox-merchant.revolut.com/',
  REVOLUT_MERCHANT_API_KEY: 'synthetic-key'
};

test('Sandbox probe rejects live origins and invalid IDs before networking', async () => {
  const never = () => { throw Error('Unexpected network'); };
  await assert.rejects(inspectSandboxOrder({...env, REVOLUT_MERCHANT_API_BASE_URL: 'https://merchant.revolut.com/'}, id, never), /Sandbox origin/);
  await assert.rejects(inspectSandboxOrder(env, '../orders', never), /UUID/);
});

test('Sandbox probe reads canonical state without emitting private response fields', async () => {
  const result = await inspectSandboxOrder(env, id, async (url, options) => {
    assert.equal(url, env.REVOLUT_MERCHANT_API_BASE_URL + 'api/orders/' + id);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    return Response.json({id, state: 'pending', amount: 3900, currency: 'AUD', customer: {email: 'fixture@example.test'}});
  });
  assert.deepEqual(result, {sandbox: true, state: 'pending', amount: 3900, currency: 'AUD'});
});
