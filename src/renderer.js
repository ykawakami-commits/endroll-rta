import { VISUAL } from './visual.js';
import { CONFIG, speedIntensity } from './config.js';
export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx=canvas.getContext('2d'); this.particles=[]; this.width=0;this.height=0;this.resize(); }
  resize() {
    const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;
    const dpr=Math.min(window.devicePixelRatio||1,2); this.canvas.width=Math.round(r.width*dpr);this.canvas.height=Math.round(r.height*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  burst(kind) { for(let i=0;i<35;i++) this.particles.push({x:this.width/2+(Math.random()-.5)*240,y:this.height*.48+(Math.random()-.5)*160,vx:(Math.random()-.5)*190,vy:-180-Math.random()*600,life:1,kind,text:['THANKS','CUT','✦','佐藤','NO.'][i%5]}); }
  gateBounds(run) {
    const gate=run.activeGate();if(!gate)return null;
    const row=run.rows.find(r=>r.skipId===gate.id);if(!row)return null;
    const s=Math.min(this.width/430,1.15);
    return {id:gate.id,x:this.width/2+(gate.column===0?-86:86)*s,y:(row.y-run.distance)*this.height/CONFIG.worldHeight+this.height*.29,width:Math.max(64,96*s),height:Math.max(52,44*s)};
  }
  gateHit(run,x,y) {
    const b=this.lastGateBounds;if(!b||run.activeGate()?.id!==b.id||Math.abs(x-b.x)>=b.width/2)return false;
    // A 50 ms swept target covers touch/display latency without enlarging its column.
    const recent=(this.gateHistory||[]).filter(p=>p.id===b.id&&performance.now()-p.at<=50);
    const ys=[b.y,...recent.map(p=>p.y)];return y>=Math.min(...ys)-b.height/2&&y<=Math.max(...ys)+b.height/2;
  }
  drawSkip(c,x,y,s,time,reduced) {
    const pulse=reduced?1:.82+.18*Math.sin(time*Math.PI*2);
    c.save();c.translate(x,y);c.scale(s,s);
    const halo=c.createRadialGradient(0,0,4,0,0,82);
    halo.addColorStop(0,`rgba(0,255,230,${.46*pulse})`);halo.addColorStop(.55,'rgba(0,224,255,.14)');halo.addColorStop(1,'rgba(0,224,255,0)');
    c.fillStyle=halo;c.fillRect(-82,-56,164,112);
    c.beginPath();c.moveTo(-42,-19);c.lineTo(48,-19);c.lineTo(42,19);c.lineTo(-48,19);c.closePath();
    c.fillStyle='#063e4c';c.fill();c.strokeStyle='#8cfff0';c.lineWidth=1.5;c.shadowColor='#00ffe5';c.shadowBlur=16*pulse;c.stroke();
    c.fillStyle='#edfffa';c.font=`700 23px ${VISUAL.displayFont}`;c.fillText('SKIP',0,1);
    c.shadowBlur=7;c.strokeStyle='#acfff5';c.lineWidth=1.5;
    for(const [sx,sy] of [[-56,-11],[56,12]]){c.beginPath();c.moveTo(sx-6,sy);c.lineTo(sx+6,sy);c.moveTo(sx,sy-6);c.lineTo(sx,sy+6);c.stroke();}
    c.restore();
  }
  draw(run,dt,reduced) {
    this.lastGateBounds=this.gateBounds(run);
    const now=performance.now();this.gateHistory=(this.gateHistory||[]).filter(b=>now-b.at<=50);if(this.lastGateBounds)this.gateHistory.push({...this.lastGateBounds,at:now});
    const {ctx:c,width:w,height:h}=this;if(!w||!h)return;
    c.clearRect(0,0,w,h); c.fillStyle='#020509';c.fillRect(0,0,w,h);
    const sy=h/CONFIG.worldHeight, s=Math.min(w/430,1.15), finishY=h*.29;
    const ratio=speedIntensity(run.speed);
    if(ratio>.5&&!reduced){c.lineWidth=.6;c.strokeStyle=`rgba(0,229,255,${(ratio-.5)*.17})`;for(let i=0;i<16;i++){const x=(i<8?w*.12:w*.82)+(i%8)*w*.008;const y=(i*163-run.time*run.speed*.43)%(h+200);c.beginPath();c.moveTo(x,y<0?y+h+200:y);c.lineTo(x,(y<0?y+h+200:y)+ratio*80);c.stroke();}}
    c.textAlign='center';c.textBaseline='middle';
    for(const r of run.rows){
      const y=(r.y-run.distance)*sy+finishY;if(y < -90||y>h+70)continue;
      let size=15,weight='400',family=VISUAL.creditFont,color='#dce8f0';
      if(r.kind==='heading'){size=18;weight='600';family=VISUAL.displayFont;color='#eef7ff';}
      if(r.kind==='eyebrow'){size=10;family='"IBM Plex Mono",monospace';color='#8da6ba';}
      if(r.kind==='subheading'){size=10;color='#899eb0';}
      if(r.kind==='film'){size=37;weight='700';family=VISUAL.displayFont;color='#eee';}
      if(r.kind==='legal'){size=8;color='#7e98ae';}
      if(r.kind==='end'){size=68;weight='700';family=VISUAL.displayFont;color='#eef7ff';}
      c.font=`${weight} ${size*s}px ${family}`; c.fillStyle=color;
      const paint=(text,x,atY)=>{
        c.save();c.direction=/[\u0590-\u08ff]/.test(text)?'rtl':'ltr';
        if(text==='SKIP'){this.drawSkip(c,x,atY,s,run.time,reduced);c.restore();return;}
        const maxWidth=(r.kind==='pair'?154:372)*s;let lines=[text];
        if(r.kind==='pair'&&c.measureText(text).width>maxWidth){
          const words=text.split(/\s+/);let balance=Infinity;
          for(let i=1;i<words.length;i++){const candidate=[words.slice(0,i).join(' '),words.slice(i).join(' ')];const delta=Math.abs(c.measureText(candidate[0]).width-c.measureText(candidate[1]).width);if(delta<balance){balance=delta;lines=candidate;}}
        }
        const fit=Math.min(1,maxWidth/Math.max(1,...lines.map(line=>c.measureText(line).width)));
        if(fit<1)c.font=`${weight} ${size*s*fit}px ${family}`;
        const leading=size*s*fit*1.2;
        lines.forEach((line,i)=>c.fillText(line,x,atY+(i-(lines.length-1)/2)*leading));c.restore();
      };
      if(r.kind==='pair'){paint(r.text,w/2-86*s,y);paint(r.second,w/2+86*s,y);}
      else paint(r.text,w/2,y);
      if(ratio>.78&&!reduced&&r.kind!=='end'&&!r.skipId){c.globalAlpha=.11*(ratio-.78)/.22; if(r.kind==='pair'){paint(r.text,w/2-86*s,y+4*ratio);paint(r.second,w/2+86*s,y+4*ratio);}else paint(r.text,w/2,y+4*ratio);c.globalAlpha=1;}
    }
    if(!reduced){for(const p of this.particles){if(p.kind==='compress'){p.x+=(w/2-p.x)*Math.min(1,dt*9);p.y+=(h*.48-p.y)*Math.min(1,dt*9);}else{p.x+=p.vx*dt;p.y+=p.vy*dt;}p.life-=dt*1.25;c.globalAlpha=Math.max(0,p.life);c.fillStyle='#00e5ff';c.font=`${9*s}px "IBM Plex Mono",monospace`;c.fillText(p.text,p.x,p.y);}this.particles=this.particles.filter(p=>p.life>0);c.globalAlpha=1;}
  }
}
