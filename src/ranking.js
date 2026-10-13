import {CONFIG,MODES} from './config.js';
const $=id=>document.getElementById(id),KEY='endroll-online:1';
const API=location.hostname==='127.0.0.1'?location.origin:'https://endroll-rta.y-kawakami700237.chatgpt.site';
const seconds=ms=>(ms/1000).toFixed(3);
const messages={invalid_name:'名前は12文字以内の文字・数字で入力してください。',expired_session:'登録期限が切れました。次のプレイで挑戦してください。',invalid_replay:'記録を確認できませんでした。次のプレイで再挑戦してください。',invalid_elapsed:'オンラインの準備が間に合いませんでした。次のプレイで再挑戦してください。',rate_limited:'少し待ってから、もう一度お試しください。'};
export class Ranking{
 constructor(onChange){
  this.onChange=onChange;this.round=null;this.epoch=0;
  try{this.profile=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{this.profile={};}
  if(!this.profile||typeof this.profile!=='object')this.profile={};
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(this.profile.token||''))this.profile.token=crypto.randomUUID();this.profile.nickname ||= '観客'+this.profile.token.slice(0,4).toUpperCase();this.persist();
  $('rank-nickname').value=this.profile.nickname;
  $('ranking-open').onclick=()=>this.open();$('result-rank-open').onclick=()=>this.open(this.round?.record.mode);
  $('ranking-mode').value=this.profile.mode||((matchMedia('(pointer:coarse)').matches)?'touch':'wheel');
  $('ranking-mode').onchange=()=>this.loadBoard();$('ranking-refresh').onclick=()=>this.loadBoard();
  $('rank-form').onsubmit=e=>{e.preventDefault();this.submit();};
  $('rank-delete').onclick=async()=>{const mode=$('ranking-mode').value;if(!confirm(`${MODES[mode]}のランキング登録を取り消しますか？`))return;try{await this.request('/record',{method:'DELETE',body:{mode}});if(this.round?.record.mode===mode){this.round.record.online=null;this.onChange(this.round.record);$('rank-form').hidden=true;$('rank-position').textContent='登録を取り消しました';$('rank-next').textContent='次のプレイで、また挑戦しよう。';$('rank-message').textContent='';}await this.loadBoard();}catch(e){$('ranking-status').textContent=e.message;}};
 }
 persist(){try{localStorage.setItem(KEY,JSON.stringify(this.profile));}catch{}}
 async request(path,{method='GET',body}={}){
  const response=await fetch(API+'/api'+path,{method,headers:{Authorization:'Bearer '+this.profile.token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(9000)}).catch(()=>{throw new Error('通信できませんでした。接続を確認して再読込してください。');});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(messages[data.error]||'登録できませんでした。少し待って再試行してください。');return data;
 }
 prepareRun(){return this.request('/session',{method:'POST',body:{playerToken:this.profile.token}}).then(data=>({data})).catch(error=>({error}));}
 async showResult(record,run,ticket){
  const round={record,run,ticket};this.round=round;$('result-ranking').hidden=false;$('rank-form').hidden=false;$('rank-submit').disabled=true;$('rank-submit').textContent='この記録を登録';$('rank-position').textContent='順位を確認中…';$('rank-next').textContent='';$('rank-message').textContent='';$('rank-nickname').value=this.profile.nickname;
  if(record.mode==='auto'||run.replayOverflow||run.tick>36000){$('rank-position').textContent='今回はローカル記録';$('rank-message').textContent='通常の操作による5分以内のプレイがランキング対象です。';return;}
  try{
   const [board,session]=await Promise.all([this.request(`/leaderboard?mode=${record.mode}&candidate=${Math.round(record.time*1000)}`),ticket]);
   if(this.round!==round)return;this.renderPosition(board,false);if(session?.data){$('rank-submit').disabled=false;}else $('rank-message').textContent='今回はオンラインの準備ができませんでした。自己ベストはこの端末に保存されます。';
  }catch(e){if(this.round===round){$('rank-position').textContent='ランキングに接続できません';$('rank-message').textContent=e.message;}}
 }
 renderPosition(board,registered){
  const rank=registered?board.me:board.preview;if(!rank)return;
  const total=registered?board.total:rank.total;
  $('rank-position').textContent=!registered&&board.total===0?'最初の記録を刻もう':`${registered?'自己ベスト':'登録すると'} ${rank.rank}位 / ${total}人`;
  $('rank-next').textContent=rank.gapMs!==null?`ひとつ上まで、あと ${seconds(rank.gapMs+1)}秒。`:(board.total?'あなたが先頭。次の挑戦者を待とう。':'みんなの目標になる、最初の挑戦者へ。');
 }
 async submit(){
  const round=this.round;if(!round)return;$('rank-submit').disabled=true;$('rank-message').textContent='操作記録を確認しています…';
  try{
   const {data}=await round.ticket;if(!data)throw new Error('今回はオンライン登録の準備ができませんでした。次のプレイで再挑戦してください。');
   const nickname=$('rank-nickname').value.trim();
   const board=await this.request('/submit',{method:'POST',body:{token:data.token,nickname,replay:{course:CONFIG.version,events:round.run.replay,steps:round.run.tick,time:round.record.time}}});
   if(this.round!==round)return;this.profile.nickname=nickname;this.profile.mode=round.record.mode;this.persist();this.renderPosition(board,true);$('rank-form').hidden=true;$('rank-message').textContent='登録しました。この入力方式の自己ベストで競います。';
   if(board.me?.timeMs===Math.round(round.record.time*1000)){round.record.online={rank:board.me.rank,total:board.total,nickname:board.me.nickname};this.onChange(round.record);}
  }catch(e){if(this.round===round){$('rank-message').textContent=e.message;$('rank-submit').disabled=false;}}
 }
 open(mode){if(mode&&mode!=='auto')$('ranking-mode').value=mode;$('ranking-dialog').showModal();this.loadBoard();}
 async loadBoard(){
  const epoch=++this.epoch,mode=$('ranking-mode').value;$('ranking-status').textContent='記録を読み込んでいます…';$('rank-delete').hidden=true;$('ranking-list').replaceChildren();$('ranking-mine').hidden=true;$('ranking-empty').hidden=true;
  try{
   const board=await this.request('/leaderboard?mode='+mode);if(epoch!==this.epoch)return;$('ranking-status').textContent=`${MODES[mode]} · ${board.total}人参加 · コース ${board.course}`;
   $('ranking-empty').hidden=board.total!==0;
   for(const entry of board.entries){const row=document.createElement('li');row.className=entry.isMe?'ranking-row is-me':'ranking-row';const rank=document.createElement('strong');rank.textContent=entry.rank;const name=document.createElement('span');name.textContent=entry.nickname+(entry.isMe?'（あなた）':'');const time=document.createElement('b');time.textContent=seconds(entry.timeMs)+' s';row.append(rank,name,time);$('ranking-list').append(row);}
   if(board.me){$('ranking-mine').hidden=false;$('rank-delete').hidden=false;$('ranking-mine').textContent=`あなたの自己ベスト：${board.me.rank}位 / ${board.total}人 · ${seconds(board.me.timeMs)}秒`+(board.me.gapMs===null?'':`\nひとつ上まで、あと${seconds(board.me.gapMs+1)}秒。`);}
  }catch(e){if(epoch===this.epoch)$('ranking-status').textContent=e.message;}
 }
}
