// Mock only. Never sends network requests or claims inbox delivery.
export class MockMailProvider {
  constructor(){this.sent=new Map();this.failures=0;}
  async send(message){
    if(this.failures-->0) return {outcome:'retry'};
    if(!this.sent.has(message.dedupe_key))this.sent.set(message.dedupe_key,`mock-${message.id}`);
    return {outcome:'sent',id:this.sent.get(message.dedupe_key)};
  }
}
export async function dispatchOne(repo,provider) {
  if(!(provider instanceof MockMailProvider)) throw new Error('Real email disabled in Phase B');
  const message=await repo.rpc('netbud_claim_mail'); if(!message)return false;
  let result;try{result=await provider.send(message);}catch{result={outcome:'uncertain'};}
  await repo.rpc('netbud_finish_mail',{p_id:message.id,p_lease:message.lease_token,p_outcome:result.outcome,p_provider:result.id||null});
  return true;
}
