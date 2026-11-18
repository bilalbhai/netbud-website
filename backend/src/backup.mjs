// Isolated PGlite fixture backup/restore proof. Not a substitute for a hosted Supabase restore drill.
import {createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
const key=raw=>{if(!/^[a-f0-9]{64}$/.test(raw||''))throw Error('32-byte backup key required');return Buffer.from(raw,'hex');};
export async function backupFixture(db,objects,rawKey){
 const archive=Buffer.from(await (await db.dumpDataDir()).arrayBuffer());
 const files=[];for(const [name,data] of objects){if(!/^[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png)$/.test(name))throw Error('Unsafe object key');const bytes=Buffer.from(data);files.push({name,bytes:bytes.toString('base64'),sha256:hash(bytes)});}
 const plain=Buffer.from(JSON.stringify({version:1,created_at:new Date().toISOString(),archive:archive.toString('base64'),sha256:hash(archive),files}));
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(rawKey),iv);cipher.setAAD(Buffer.from('netbud-local-fixture-v1'));
 const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
 return Buffer.concat([Buffer.from('NB01'),iv,cipher.getAuthTag(),encrypted]);
}
export async function restoreFixture(backup,rawKey,createDatabase){
 const data=Buffer.from(backup);if(data.subarray(0,4).toString()!=='NB01')throw Error('Invalid backup');
 const decipher=createDecipheriv('aes-256-gcm',key(rawKey),data.subarray(4,16));decipher.setAAD(Buffer.from('netbud-local-fixture-v1'));decipher.setAuthTag(data.subarray(16,32));
 const v=JSON.parse(Buffer.concat([decipher.update(data.subarray(32)),decipher.final()]).toString());
 if(v.version!==1||!Array.isArray(v.files))throw Error('Invalid backup');
 const archive=Buffer.from(v.archive,'base64');if(hash(archive)!==v.sha256)throw Error('Archive mismatch');
 const objects=new Map();for(const f of v.files){const b=Buffer.from(f.bytes,'base64');if(hash(b)!==f.sha256||objects.has(f.name)||!/^[a-f0-9-]+\/[a-f0-9-]+\.(jpg|png)$/.test(f.name))throw Error('Object mismatch');objects.set(f.name,b);}
 return {db:await createDatabase(new Blob([archive])),objects,created_at:v.created_at};
}
