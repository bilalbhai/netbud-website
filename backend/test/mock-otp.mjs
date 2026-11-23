import {MockMailProvider,dispatchOne} from '../src/outbox.mjs';
// Only the local runner/tests import this. The code is never in the database or an HTTP response.
export class LocalOtpDelivery extends MockMailProvider{
  constructor(repo,writeInbox=async()=>{}){super();this.repo=repo;this.pending=new Map();this.inbox=new Map();this.writeInbox=writeInbox;}
  async enqueue(message){this.pending.set(message.id,message);for(let i=0;i<100&&this.pending.has(message.id);i++){if(!await dispatchOne(this.repo,this))break;}}
  async send(message){
    if(message.message_type==='email_otp'){
      const entry=this.pending.get(message.challenge_id);
      if(!entry||entry.expires<=Date.now())return {outcome:'uncertain'};
      this.inbox.set(entry.email,entry);this.pending.delete(entry.id);
      await this.flush();
    }
    return super.send(message);
  }
  async flush(){for(const [email,value] of this.inbox)if(value.expires<=Date.now())this.inbox.delete(email);for(const [id,value] of this.pending)if(value.expires<=Date.now())this.pending.delete(id);await this.writeInbox([...this.inbox.values()]);}
}
