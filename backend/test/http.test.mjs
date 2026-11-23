import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {order} from './database.mjs';
test('loopback HTTP runner creates/replays a test order and rejects staff without authentication',async()=>{
  const child=spawn(process.execPath,[fileURLToPath(new URL('../local.mjs',import.meta.url))],{stdio:['pipe','pipe','pipe'],windowsHide:true});
  const exited=once(child,'exit');
  let stderr='';child.stderr.on('data',b=>{stderr+=b;});
  try {
    await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error(stderr||'Runner exited');}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Runner startup timeout')),10000);t.unref();})]);
    const headers={Origin:'http://127.0.0.1:8787','Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()};
    const send=()=>fetch('http://127.0.0.1:8787/api/test/orders',{method:'POST',headers,body:JSON.stringify(order()),signal:AbortSignal.timeout(5000)});
    const first=await send(),a=await first.json(),second=await send(),b=await second.json();
    assert.equal(first.status,201);assert.equal(second.status,200);assert.equal(a.id,b.id);assert.equal(a.test_only,true);
    const staff=await fetch(`http://127.0.0.1:8787/api/staff/orders/${a.id}`,{signal:AbortSignal.timeout(5000)});assert.equal(staff.status,401);
  } finally {child.kill();await exited;}
});
