import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink} from 'node:fs/promises';
import {prepareCloudflare,inspectArtifact} from '../prepare-cloudflare.mjs';
import path from 'node:path';
test('staging packaging rejects production/custom origins and invalid project names',async()=>{
 for(const [project,origin] of [['bad/../name','https://example.test'],['netbud-synthetic-review','https://netbud.com.au'],['netbud-synthetic-review','http://netbud-synthetic-review.pages.dev']])await assert.rejects(prepareCloudflare(project,origin));
});
test('reviewed staging artifact defaults closed and detects unexpected files and tampering',async()=>{
 const result=await prepareCloudflare('netbud-synthetic-review','https://netbud-synthetic-review.pages.dev');
 assert.equal(result.deployed,false);assert.equal(result.activation,'disabled');
 const config=JSON.parse(await readFile(path.join(result.directory,'wrangler.json'),'utf8'));
 assert.equal(config.vars.STAGING_ADMIN_APPROVED,'false');assert.equal(config.vars.STAGING_GUEST_APPROVED,'false');
 const manifest=JSON.parse(await readFile(path.join(result.directory,'manifest.json'),'utf8'));
 const bundle={publicDir:result.publicDirectory,manifest:manifest.files};
 const extra=path.join(result.publicDirectory,'private.env');await writeFile(extra,'synthetic only');await assert.rejects(inspectArtifact(bundle),/Unexpected/);await unlink(extra);
 const worker=path.join(result.publicDirectory,'_worker.js'),original=await readFile(worker);await writeFile(worker,'tampered synthetic');await assert.rejects(inspectArtifact(bundle),/Changed/);await writeFile(worker,original);
 const home=path.join(result.publicDirectory,'index.html');await writeFile(home,'tampered synthetic');await assert.rejects(inspectArtifact(bundle),/Changed/);
});
