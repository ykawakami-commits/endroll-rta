import {CONFIG,MODES,speedIntensity,swipeImpulse,wheelImpulse} from './config.js';
import {Run,formatTime} from './engine.js';
import {COURSE} from './credits.js';
import {load,save,best} from './storage.js';
import {Sound} from './audio.js';
import {Renderer} from './renderer.js';
import {reaction,makeShareImage} from './share.js';
import {rewardFor} from './rewards.js';
import {Celebration} from './celebration.js';
import {Cinema} from './cinema.js';
const $=id=>document.getElementById(id);
const prefs=load();const audio=new Sound(prefs.sound);const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const celebration=new Celebration($('result-celebration'));
const cinema=new Cinema($('cinema-canvas'));
let reduced=prefs.reduced||reducedQuery.matches;
let state='title',run=null,renderer=null,last=0,accumulator=0,frameId=0,introTimer=0,finishTimer=0,toastTimer=0,cutTimer=0;
let pointer=null,result=null,shareBlob=null,pendingStart=0,fps=60;
const debug=new URLSearchParams(location.search).has('debug');
for(let i=0;i<30;i++) $('speed-segments').append(document.createElement('i'));
const segments=[...$('speed-segments').children];
function setScreen(name){celebration.stop();if(name!=='result')audio.stopReward();for(const s of ['title','intro','game','result'])$(s+'-screen').hidden=s!==name;state=name;document.body.dataset.screen=name;document.body.classList.toggle('playing',name==='game'||name==='intro');window.scrollTo(0,0);}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function updatePrefs(){document.body.classList.toggle('reduced',reduced);$('motion').setAttribute('aria-pressed',String(reduced));$('motion').setAttribute('aria-label',reduced?'通常の動きにする':'動きを控えめにする');$('cinema-setting').setAttribute('aria-pressed',String(prefs.cinema));$('cinema-state').textContent=prefs.cinema?'ON':'OFF';$('sound').setAttribute('aria-pressed',String(prefs.sound));$('sound-label').textContent=prefs.sound?'SOUND ON':'SOUND OFF';audio.set(prefs.sound);}
updatePrefs();
function titleMusic(){if(state==='title'&&!document.hidden)audio.title();}
titleMusic();
// Autoplay when permitted, otherwise unlock on the first ordinary title interaction.
for(const event of ['pointerdown','pointerup','keydown'])document.addEventListener(event,()=>{if(prefs.sound)titleMusic();},{capture:true});
$('sound').onclick=()=>{prefs.sound=!prefs.sound;updatePrefs();if(prefs.sound)audio.unlock();save(prefs);};
$('motion').onclick=()=>{reduced=!reduced;prefs.reduced=reduced;if(reduced)celebration.stop();updatePrefs();save(prefs);toast(reduced?'動きを控えめにしました':'通常の演出にしました');};
$('cinema-setting').onclick=()=>{prefs.cinema=!prefs.cinema;updatePrefs();save(prefs);};
reducedQuery.addEventListener('change',e=>{reduced=prefs.reduced||e.matches;if(reduced)celebration.stop();updatePrefs();});
function updateBest(){const b=best(prefs.records);$('title-best').textContent=Number.isFinite(b)?formatTime(b)+' s':'—';}
updateBest();
for(const b of document.querySelectorAll('.close-dialog'))b.onclick=()=>b.closest('dialog').close();
for(const d of document.querySelectorAll('dialog')) d.addEventListener('click',e=>{if(e.target!==d||d.id==='interrupt-dialog')return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});
$('help-open').onclick=()=>$('help-dialog').showModal();
$('settings-open').onclick=()=>$('settings-dialog').showModal();
$('records-open').onclick=()=>{const list=$('record-list');list.replaceChildren();for(const [mode,label] of Object.entries(MODES)){const row=document.createElement('div');row.className='record-row';const name=document.createElement('span');name.textContent=label;const score=document.createElement('strong');const b=best(prefs.records,mode);score.textContent=Number.isFinite(b)?formatTime(b)+' s':'—';row.append(name,score);list.append(row);}$('records-dialog').showModal();};
function clearInteraction(){pointer=null;if(run){run.keyboardDown=false;run.keyboardReverse=false;run.cancelGate();}}
function clearRunTimers(){clearTimeout(introTimer);clearTimeout(finishTimer);clearTimeout(cutTimer);cancelAnimationFrame(frameId);cinema.stop();clearInteraction();pendingStart++;}
function start(isRetry=false){
  clearRunTimers();for(const d of document.querySelectorAll('dialog[open]'))d.close();audio.unlock();audio.start();run=new Run();result=null;shareBlob=null;accumulator=0;$('cut-message').classList.remove('visible');$('secret-skip').hidden=true;
  setScreen('intro');const token=pendingStart;
  const begin=()=>{if(token!==pendingStart||state!=='intro')return;setScreen('game');if(!renderer)renderer=new Renderer($('roll'));else renderer.resize();renderer.particles=[];last=performance.now();updateHUD();renderer.draw(run,0,reduced);frameId=requestAnimationFrame(frame);};
  const cinematic=!isRetry&&prefs.cinema&&!reduced;$('intro-screen').classList.toggle('cinema-cut',!cinematic);
  if(cinematic)cinema.play(begin);else introTimer=setTimeout(begin,CONFIG.introCutDuration);
}
$('start').onclick=()=>start();$('retry').onclick=()=>start(true);$('help-play').onclick=()=>start();$('interrupt-retry').onclick=()=>start(true);
function home(){clearRunTimers();audio.update(0,false);for(const d of document.querySelectorAll('dialog[open]'))d.close();setScreen('title');titleMusic();updateBest();$('start').focus({preventScroll:true});}
$('to-title').onclick=home;$('interrupt-title').onclick=home;
function interrupt(reason){if(state!=='game'&&state!=='intro')return;clearRunTimers();state='interrupted';audio.update(0,false);audio.stopMusic();$('secret-skip').hidden=true;$('interrupt-reason').textContent=reason;$('interrupt-dialog').showModal();}
$('exit-run').onclick=()=>interrupt('プレイを中断しました。この回の記録は保存されません。');
$('interrupt-dialog').addEventListener('cancel',e=>{e.preventDefault();home();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){interrupt('画面が非表示になったため中断しました。公平な計測のため、この回の記録は保存されません。');audio.stopMusic();audio.stopReward();celebration.stop();}else titleMusic();});
window.addEventListener('blur',clearInteraction);
window.addEventListener('resize',()=>{if(renderer&&state==='game')renderer.resize();});
function advance(now){
  if(state!=='game'||run.finished)return;
  const elapsed=(now-last)/1000;last=now;
  if(elapsed>CONFIG.maxFrameGap){interrupt('長い処理停止を検知しました。公平な計測のため、この回はやり直しになります。');return;}
  accumulator+=Math.max(0,elapsed);
  while(accumulator>=CONFIG.step&&!run.finished){run.step();accumulator-=CONFIG.step;}
  for(const event of run.events.splice(0)){if(event.type==='cut'){audio.cut();renderer.burst(event.id);$('cut-message').replaceChildren();const text=document.createTextNode('SKIPPED!');const sub=document.createElement('small');sub.textContent=`−${event.amount.toLocaleString()} CREDIT UNITS`;$('cut-message').append(text,sub);$('cut-message').classList.remove('visible');void $('cut-message').offsetWidth;$('cut-message').classList.add('visible');clearTimeout(cutTimer);cutTimer=setTimeout(()=>$('cut-message').classList.remove('visible'),900);}}
  if(run.finished)finish();
}
function frame(now){if(state!=='game')return;const dt=Math.min(.05,(now-last)/1000);if(dt>0)fps=fps*.92+(1/dt)*.08;advance(now);if(state!=='game')return;renderer.draw(run,dt,reduced);updateHUD();audio.update(speedIntensity(run.speed),!run.finished);if(!run.finished)frameId=requestAnimationFrame(frame);}
function updateHUD(){
  $('timer').textContent=formatTime(run.time);const progress=Math.min(100,run.distance/run.goal*100);$('progress-fill').style.width=progress+'%';$('progress-text').textContent=Math.floor(progress)+'%';const ratio=Math.max(0,Math.min(1,run.speed/CONFIG.maxSpeed));$('speed').textContent=(run.speed/CONFIG.baseSpeed).toFixed(1);segments.forEach((s,i)=>s.classList.toggle('on',i<ratio*30));
  const target=$('secret-skip'),bounds=renderer?.gateBounds(run);target.hidden=!bounds||run.finished;
  if(bounds){target.style.transform=`translate(${bounds.x-bounds.width/2}px,${bounds.y-bounds.height/2}px)`;target.style.width=bounds.width+'px';target.style.height=bounds.height+'px';}
  $('control-hint').textContent=run.speed<0?'巻き戻し中 · 手を止めてSKIPをタップ':run.distance<1800?'上へ進む / 下へ戻る · PCは ↑ / ↓':ratio>.8?'KEEP GOING.  最後まで、止まるな。':'見逃したら下へスワイプ / 逆スクロール';
  $('debug').hidden=!debug;if(debug)$('debug').textContent=`COURSE ${CONFIG.version} / ${COURSE.nameCount} NAMES\nFPS ${fps.toFixed(0)} / STEP 120 Hz\nSPEED ${run.speed.toFixed(1)} u/s / MAX ${CONFIG.maxSpeed}\nDIST ${run.distance.toFixed(1)} / ${run.goal.toFixed(1)}\nCUT ${run.cutDistance} / INPUT ${run.mode}`;
}
function push(amount,mode){if(state!=='game'||run.finished)return;advance(performance.now());if(state!=='game'||run.finished)return;if(run.impulse(amount,mode))audio.flick(Math.abs(run.speed));}
const canvas=$('roll');
canvas.addEventListener('pointerdown',e=>{
  if(state!=='game'||run.finished||pointer)return;if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();audio.unlock();
  // Hit-test the frame the player saw before advancing the simulation to this input.
  const rect=canvas.getBoundingClientRect();canvas.setPointerCapture(e.pointerId);
  const candidate=renderer.gateHit(run,e.clientX-rect.left,e.clientY-rect.top)?run.activeGate():null;
  if(candidate)run.pressGate(candidate.id);
  advance(performance.now());if(state!=='game')return;
  pointer={id:e.pointerId,y:e.clientY,x:e.clientX,startX:e.clientX,startY:e.clientY,time:e.timeStamp,mode:e.pointerType==='touch'?'touch':'drag',gate:candidate?.id};
});
canvas.addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId||state!=='game')return;e.preventDefault();
  if(pointer.gate&&Math.hypot(e.clientX-pointer.startX,e.clientY-pointer.startY)>12){pointer.gate=null;run.cancelGate();}
  const dy=pointer.y-e.clientY;const dx=Math.abs(pointer.x-e.clientX);
  const gesture=pointer;
  if(dy!==0&&Math.abs(dy)>=dx)push(swipeImpulse(dy/Math.max(1,canvas.clientHeight)*CONFIG.worldHeight,(e.timeStamp-pointer.time)/1000),pointer.mode);
  if(pointer!==gesture)return;
  pointer.y=e.clientY;pointer.x=e.clientX;pointer.time=e.timeStamp;
});
function release(e){if(pointer?.id===e.pointerId){const gesture=pointer;pointer=null;if(gesture.gate&&e.type==='pointerup'&&state==='game'){advance(performance.now());if(state==='game')run.releaseGate();}else run?.cancelGate();}}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
$('game-screen').addEventListener('wheel',e=>{if(state!=='game'||run.finished)return;e.preventDefault();const amount=wheelImpulse(e.deltaY,e.deltaMode,e.deltaX);if(amount!==0)push(amount,'wheel');},{passive:false});
// The focusable hit target follows the rendered word without adding visible chrome.
$('secret-skip').addEventListener('click',()=>{if(state==='game'){advance(performance.now());if(state==='game')run.gateDown();}});
window.addEventListener('keydown',e=>{
  if(state==='intro'){if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='Escape'){e.preventDefault();interrupt('プレイを中断しました。この回の記録は保存されません。');}return;}
  if(state!=='game'||run.finished)return;
  if(e.code==='Escape'){e.preventDefault();interrupt('プレイを中断しました。この回の記録は保存されません。');return;}
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();else return;
  advance(performance.now());if(state!=='game'||run.finished)return;
  if(e.code==='ArrowDown')run.keyboardReverse=true;else run.keyboardDown=true;
  if(!e.repeat){run.impulse((e.code==='ArrowDown'?-1:1)*CONFIG.keyboardTapImpulse,'keyboard');audio.flick(Math.abs(run.speed));}
});
window.addEventListener('keyup',e=>{if(!run)return;if(e.code==='Space'||e.code==='ArrowUp')run.keyboardDown=false;if(e.code==='ArrowDown')run.keyboardReverse=false;});
function finish(){
  clearInteraction();audio.update(0,false);audio.finish();updateHUD();renderer.draw(run,0,reduced);
  const oldBest=best(prefs.records,run.mode);result={time:run.time,mode:run.mode,cuts:run.used.size,maxSpeed:run.maxSpeed,date:new Date().toISOString(),isBest:run.time<oldBest};
  // Preserve every input category's best, even after many faster runs in another category.
  if(result.isBest)prefs.records=[...prefs.records.filter(r=>r.mode!==result.mode),result];const saved=save(prefs);
  finishTimer=setTimeout(()=>showResult(saved),620);
}
function showResult(saved){
  setScreen('result');const r=reaction(result.time,result.cuts);$('result-time').textContent=formatTime(result.time);$('result-mode').textContent=MODES[result.mode];$('new-best').textContent=result.isBest?'NEW PERSONAL BEST':'RUN COMPLETE';$('result-speed').textContent=(result.maxSpeed/CONFIG.baseSpeed).toFixed(1)+' ×';$('result-best').textContent=formatTime(best(prefs.records,result.mode))+' s';$('rank').textContent=r.rank;$('reaction-text').textContent=r.comment;$('result-kuma').src=`./assets/kosukuma-${r.asset}.png`;$('result-note').textContent=saved?'記録はこのブラウザに、入力方式ごとに保存されます。':'このブラウザでは保存できませんでした。画像で記録を残せます。';
  $('result-heading').setAttribute('tabindex','-1');$('result-heading').focus({preventScroll:true});
  const tier=rewardFor(result.time);$('result-screen').dataset.reward=tier.id;$('reward-badge').hidden=!tier.level;$('reward-basis').hidden=!tier.level;
  $('reward-percent').textContent=`TOP ${tier.percent}%`; $('reward-title').textContent=tier.title;$('reward-rule').textContent=`上位${tier.percent}%相当 · ${tier.maxTime.toFixed(1)}秒以内`;
  celebration.play(tier,reduced);audio.reward(tier.level);
  const record=result;makeShareImage(record).then(blob=>{if(record===result)shareBlob=blob;}).catch(()=>{});
}
async function getBlob(){return shareBlob||(shareBlob=await makeShareImage(result));}
function download(blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`ENDROLL-RTA-${formatTime(result.time)}s.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
$('save-image').onclick=async()=>{const button=$('save-image');button.disabled=true;try{download(await getBlob());toast('結果画像を保存しました');}catch{toast('画像を作成できませんでした。もう一度お試しください。');}finally{button.disabled=false;}};
$('share').onclick=async()=>{
  if(!result)return;const button=$('share');button.disabled=true;
  const shareURL=location.origin+location.pathname;const text=`ENDROLL RTA ${formatTime(result.time)}秒｜${reaction(result.time,result.cuts).rank}\n${MODES[result.mode]}\n映画の余韻をぶっ壊せ。 #ENDROLLRTA #こすくま`;
  try{
    const blob=await getBlob();const file=new File([blob],'endroll-rta.png',{type:'image/png'});
    if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'ENDROLL RTA',text,url:shareURL});
    else if(navigator.share)await navigator.share({title:'ENDROLL RTA',text,url:shareURL});
    else if(navigator.clipboard){await navigator.clipboard.writeText(text+'\n'+shareURL);toast('記録とURLをコピーしました。画像も保存できます。');}
    else{download(blob);toast('結果画像を保存しました。お好きなSNSでシェアできます。');}
  }catch(error){if(error.name!=='AbortError')toast('シェアできませんでした。「画像を保存」をお使いください。');}finally{button.disabled=false;}
};
// Effects never lock the player out of retry, sharing, sound, or the title button.
$('result-screen').addEventListener('pointerdown',e=>{if(e.target.closest('button')){celebration.stop();audio.stopReward();}});
// Read-only diagnostics, enabled explicitly. No ability to modify runs or mint records.
if(debug)Object.defineProperty(window,'endrollDebug',{get:()=>({state,courseGoal:COURSE.goal,time:run?.time,distance:run?.distance,speed:run?.speed,goal:run?.goal,mode:run?.mode,cuts:run?.used.size,activeGate:run?.activeGate()?.id,skipBounds:renderer&&run?renderer.gateBounds(run):null,audio:audio.diagnostics()})});
