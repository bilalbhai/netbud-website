import {test} from 'node:test';import assert from 'node:assert/strict';import {performance} from 'node:perf_hooks';import {createTracking} from '../src/tracking.mjs';
test('OTP response delay measures elapsed request time; fast requests wait at least 150ms',async()=>{
 const track=createTracking({repo:{rpc:async()=>false},secret:crypto.randomUUID(),origin:'http://127.0.0.1:8787',delivery:{},localOnly:true});
 const started=performance.now();await track({request:new Request('http://127.0.0.1:8787/api/test/tracking/request',{method:'POST'}),body:async()=>({email:'timing@example.test'}),network:'test',reply:()=>null});
 assert.ok(performance.now()-started>=149,'minimum response delay was skipped');
});
