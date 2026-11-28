import {runOperations} from './src/integration.mjs';

// Cron-only Worker. Deliberately exposes no HTTP handler.
export default {
  async scheduled(_event, env) {
    try {
      const result = await runOperations(env);
      console.log(JSON.stringify({job: 'staging-operations', disabled: !!result.disabled, attempts: result.attempts ?? 0}));
    } catch {
      // A failed invocation is visible in Worker metrics without logging provider payloads.
      throw new Error('NetBud staging operations failed');
    }
  }
};
