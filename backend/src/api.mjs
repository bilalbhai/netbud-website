import {ApiError,fail,keys,uuid,validateOrder,digest,networkKey} from './core.mjs';
// Fetch-compatible core for a future Pages Function. No production route is installed in Phase B.
export function createApi({repo,authenticate,origin,rateSecret,enabled=false,tracking=null,log=()=>{}}) {
  return async function handle(request,networkIdentity) {
    const requestId=crypto.randomUUID();
    const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Request-ID':requestId,'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
    try {
      if(!enabled) fail(503,'development_only');
      if(!networkIdentity) fail(503,'network_identity_required');
      const u=new URL(request.url), path=u.pathname;
      if(request.method!=='GET'&&request.headers.get('Origin')!==origin) fail(403,'origin_denied');
      if(!['GET','POST','PATCH'].includes(request.method)) fail(405,'method_not_allowed');
      const key=await networkKey(networkIdentity,rateSecret);
      if(!await repo.rpc('netbud_rate',{p_key:`network:${key}`,p_max:60,p_seconds:600})) fail(429,'rate_limited');
      if(!await repo.rpc('netbud_rate',{p_key:'global:requests',p_max:80000,p_seconds:86400})) fail(503,'capacity_unavailable');
      async function body() {
        if(!request.headers.get('content-type')?.startsWith('application/json')) fail(415,'json_required');
        const reader=request.body?.getReader(); if(!reader) fail(400,'invalid_json');
        let size=0; const chunks=[];
        while(true) { const {value,done}=await reader.read(); if(done) break; size+=value.length; if(size>16384){await reader.cancel();fail(413,'request_too_large');} chunks.push(value); }
        const bytes=new Uint8Array(size);let offset=0;for(const b of chunks){bytes.set(b,offset);offset+=b.length;}
        try{return JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'invalid_json');}
      }
      if(path.startsWith('/api/test/tracking/')&&tracking)return await tracking({request,body,network:networkIdentity,reply});
      if(path==='/api/test/catalogue'&&request.method==='GET')return reply(200,await repo.rpc('netbud_catalogue'));
      if(path==='/api/test/estimate'&&request.method==='POST'){
        const data=await body();keys(data,['items','delivery']);
        const checked=validateOrder({customer:{name:'Test',email:'preview@example.test',phone:'0000000000'},items:data.items,delivery:data.delivery,...(data.delivery==='shipping'?{address:{line1:'Test',suburb:'Test',state:'NSW',postcode:'2150',country:'AU'}}:{})});
        return reply(200,await repo.rpc('netbud_estimate',{p_items:checked.items,p_delivery:checked.delivery}));
      }
      if(path==='/api/test/orders'&&request.method==='POST') {
        const input=validateOrder(await body()), id=uuid(request.headers.get('idempotency-key'));
        const result=await repo.rpc('netbud_create',{p_body:input,p_key:id,p_hash:await digest(JSON.stringify(input))});
        return reply(result.replayed?200:201,{...result,test_only:true,email_delivery:'mock_pending'});
      }
      const match=/^\/api\/staff\/orders\/([^/]+)(\/artwork)?$/.exec(path);
      if(match) {
        const identity=await authenticate(request);if(identity.aal!=='aal2') fail(403,'mfa_required');
        const id=uuid(match[1]);
        if(request.method==='GET') return reply(200,await repo.rpc(match[2]?'netbud_artwork':'netbud_order',{p_actor:identity.id,p_order:id}));
        if(request.method==='PATCH'&&!match[2]) { if(!Number.isFinite(identity.mfaAt)||Math.abs(Date.now()/1000-identity.mfaAt)>600)fail(403,'fresh_mfa_required'); const value=await body();keys(value,['status']); if(!['accepted','cancelled'].includes(value.status)) fail(400,'invalid_input'); return reply(200,await repo.rpc('netbud_update',{p_actor:identity.id,p_order:id,p_status:value.status})); }
      }
      // No public order lookup, OTP, upload, registration or payment endpoints.
      fail(404,'not_found');
    } catch(error) {
      const e=error instanceof ApiError?error:new ApiError(503,'backend_unavailable');
      log({requestId,status:e.status,code:e.code}); // Deliberately omit bodies, tokens, email and IP.
      return reply(e.status,{error:e.code,request_id:requestId});
    }
  };
}
