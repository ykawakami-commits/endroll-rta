import { VISUAL } from './visual.js';
import { formatTime } from './engine.js';
import { CONFIG, MODES } from './config.js';
import {rewardFor} from './rewards.js';
export function reaction(time,cuts) {
  const tier=rewardFor(time);return {rank:tier.title,comment:tier.comment,asset:tier.asset};
}
export async function makeShareImage(record) {
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=630;const c=canvas.getContext('2d');
  const r=reaction(record.time,record.cuts),tier=rewardFor(record.time);c.fillStyle='#05070b';c.fillRect(0,0,1200,630);
  c.strokeStyle='#0b1c2b';c.lineWidth=1;for(let x=28;x<1200;x+=48){c.beginPath();c.moveTo(x,28);c.lineTo(x,602);c.stroke();}for(let y=28;y<630;y+=48){c.beginPath();c.moveTo(28,y);c.lineTo(1172,y);c.stroke();}c.strokeStyle='#23445c';c.strokeRect(28,28,1144,574);c.fillStyle='#00e5ff';c.fillRect(28,28,90,3);c.fillRect(1082,599,90,3);
  c.fillStyle=tier.color;c.font='500 17px "IBM Plex Mono",monospace';c.fillText('ENDROLL RTA / TIME ATTACK',64,79);
  if(tier.level>=3){const glow=c.createRadialGradient(975,310,10,975,310,330);glow.addColorStop(0,tier.level===4?'#7b6dff45':'#00e5ff28');glow.addColorStop(1,'transparent');c.fillStyle=glow;c.fillRect(805,90,360,455);c.strokeStyle=tier.color;for(let i=0;i<tier.level;i++){c.beginPath();c.arc(977,277,120+i*20,-1.2,.8);c.stroke();}}
  c.fillStyle='#eee';c.font=`700 82px ${VISUAL.displayFont}`;c.fillText('ENDROLL RTA',61,191);
  c.font=`700 23px ${VISUAL.uiFont}`;c.fillText('映画の余韻をぶっ壊せ。',66,241);
  c.fillStyle='#00e5ff';c.font='500 146px "IBM Plex Mono",monospace';c.fillText(formatTime(record.time),57,429);
  c.font='400 28px "IBM Plex Mono",monospace';c.fillText('sec',640,428);
  c.fillStyle='#a2c0d7';c.font=`400 19px ${VISUAL.uiFont}`;c.fillText(`${MODES[record.mode]}  /  COURSE v${CONFIG.version}`,66,492);
  c.strokeStyle='#00e5ff';c.beginPath();c.moveTo(802,140);c.lineTo(802,514);c.stroke();
  const img=new Image();img.src=new URL(`../assets/kosukuma-${r.asset}.png`,import.meta.url).href;
  await img.decode(); c.save();c.beginPath();c.arc(976,220,105,0,Math.PI*2);c.clip();c.fillStyle='#fff';c.fillRect(866,110,220,220);const scale=Math.min(195/img.width,195/img.height);c.drawImage(img,976-img.width*scale/2,220-img.height*scale/2,img.width*scale,img.height*scale);c.restore();
  c.textAlign='center';c.fillStyle='#eee';c.font=`700 20px ${VISUAL.uiFont}`;c.fillText(r.rank,978,350);
  c.fillStyle=tier.color;c.font=`700 27px ${VISUAL.displayFont}`;c.fillText(record.online?`${record.online.rank}位 / ${record.online.total}人`:`称号 ${tier.grade}`,978,401);
  c.fillStyle='#8aacc5';c.font=`400 13px ${VISUAL.uiFont}`;c.fillText(record.online?'オンライン順位 / 記録登録時点':'タイム称号 / 同じ基準で挑戦',978,431);
  c.textAlign='left';c.fillStyle='#789ab6';c.font='400 13px "IBM Plex Mono",monospace';c.fillText('THE END IS YOUR START.',66,563);
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image unavailable')),'image/png'));
}
