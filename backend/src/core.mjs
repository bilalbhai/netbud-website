export class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export const fail = (status, code) => { throw new ApiError(status, code); };
export function keys(value, allowed) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !allowed.includes(k))) fail(400, 'invalid_input');
}
export function text(v, min, max) {
  if (typeof v !== 'string' || v.trim().length < min || v.length > max || /[\x00-\x1f]/.test(v)) fail(400, 'invalid_input');
  return v.trim();
}
export const uuid = v => { if (typeof v !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)) fail(400, 'invalid_input'); return v; };
export function validateOrder(v) {
  keys(v, ['customer','items','delivery','address','designs']); keys(v.customer, ['name','email','phone','business']);
  const customer = {name:text(v.customer.name,1,120), email:text(v.customer.email,3,254).toLowerCase(), phone:text(v.customer.phone,6,30)};
  // This foundation accepts synthetic examples only, never real customer submissions.
  if (!/^[^\s@]+@[^\s@]+\.test$/.test(customer.email)) fail(400,'test_email_required');
  if (v.customer.business !== undefined) customer.business=text(v.customer.business,1,160);
  if (!Array.isArray(v.items) || v.items.length<1 || v.items.length>20) fail(400,'invalid_input');
  const seen=new Set();
  const items=v.items.map(i=>{keys(i,['product_id','quantity']); if (!Number.isSafeInteger(i.product_id)||!Number.isSafeInteger(i.quantity)||i.quantity<1||i.quantity>100||seen.has(i.product_id)) fail(400,'invalid_input'); seen.add(i.product_id); return {product_id:i.product_id,quantity:i.quantity};});
  if (!['none','pickup','shipping'].includes(v.delivery)) fail(400,'invalid_input');
  let address;
  if(v.delivery==='shipping') {
    keys(v.address,['line1','line2','suburb','state','postcode','country']);
    address={line1:text(v.address.line1,1,160),suburb:text(v.address.suburb,1,100),state:text(v.address.state,2,3),postcode:text(v.address.postcode,4,4),country:v.address.country};
    if(v.address.line2) address.line2=text(v.address.line2,1,160);
    if(address.country!=='AU'||!['NSW','VIC','QLD','SA','WA','TAS','ACT','NT'].includes(address.state)||!/^\d{4}$/.test(address.postcode)) fail(400,'invalid_delivery');
  } else if(v.address !== undefined) fail(400,'invalid_delivery');
  const designs=v.designs||[];
  if(!Array.isArray(designs)||designs.length>5)fail(400,'invalid_input');
  const normalized=designs.map(d=>{keys(d,['product_id','name','instructions','destination']);const item=items.find(i=>i.product_id===d.product_id);if(!item||![5,10].includes(d.product_id)||designs.filter(x=>x.product_id===d.product_id).length>item.quantity)fail(400,'invalid_input');const destination=d.destination?text(d.destination,1,500):'';if(destination&&!/^https:\/\//.test(destination))fail(400,'invalid_input');return {product_id:d.product_id,name:text(d.name,1,120),instructions:d.instructions?text(d.instructions,1,1000):'',destination};});
  return {customer,items,delivery:v.delivery,...(address?{address}:{}),...(normalized.length?{designs:normalized}:{})};
}
export async function digest(value) {
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)); return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
}
export async function networkKey(ip, secret) {
  if (!secret || secret.length<32) fail(503,'configuration_required');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const b=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)); return Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
}
