import {CONFIG} from './config.js';
import {COURSE} from './credits.js';
const CAST=COURSE.rows.filter(r=>r.kind==='pair').slice(0,5);

// A small perspective scene. It never advances or reads the competitive run clock.
export class Cinema {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.frame=0;this.started=0;}
  stop(){cancelAnimationFrame(this.frame);this.frame=0;}
  play(complete){
    this.stop();this.started=performance.now();
    const frame=now=>{const t=Math.min(1,(now-this.started)/CONFIG.introDuration);this.draw(t);if(t<1)this.frame=requestAnimationFrame(frame);else{this.frame=0;complete();}};
    this.frame=requestAnimationFrame(frame);
  }
  draw(t){
    const c=this.ctx,w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);}
    c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#020509';c.fillRect(0,0,w,h);
    const dolly=Math.max(0,(t-.24)/.76),ease=dolly*dolly*(3-2*dolly);
    const camera=17.93*ease,focal=w*1.2,vanish=h*.43,eye=1.8+ease*.3;
    const p=(x,y,z)=>{const scale=focal/Math.max(.035,z-camera);return {x:w/2+x*scale,y:vanish+(eye-y)*scale,scale};};
    const polygon=(points,fill)=>{c.beginPath();points.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.closePath();c.fillStyle=fill;c.fill();};
    const glow=c.createRadialGradient(w/2,vanish,0,w/2,vanish,Math.max(w,h)*.8);glow.addColorStop(0,'#19323d');glow.addColorStop(.5,'#08131c');glow.addColorStop(1,'#010207');c.fillStyle=glow;c.fillRect(0,0,w,h);
    // Side walls and acoustic panels recede toward the screen.
    for(const side of [-1,1]){
      for(let z=18;z>=3;z-=1.5){if(z-1.4<=camera)continue;polygon([p(side*6,-1,z),p(side*6,5,z),p(side*6,5,z-1.4),p(side*6,-1,z-1.4)],z%3===0?'#0e1720':'#080e17');}
    }
    if(camera<16){polygon([p(-6,-.25,18),p(6,-.25,18),{x:w*2,y:h*2},{x:-w,y:h*2}],'#080c13');}
    // Screen border, curtains and reflected light.
    const left=p(-4.8,4.45,18),right=p(4.8,.08,18),sw=right.x-left.x,sh=right.y-left.y;
    c.shadowColor='#b3dced';c.shadowBlur=Math.min(55,sw*.035);c.fillStyle='#202b34';c.fillRect(left.x-7,left.y-7,sw+14,sh+14);c.shadowBlur=0;
    c.fillStyle='#020509';c.fillRect(left.x,left.y,sw,sh);
    c.save();c.beginPath();c.rect(left.x,left.y,sw,sh);c.clip();
    const fade=1-Math.min(1,Math.max(0,(t-.68)/.18));c.globalAlpha=fade;c.textAlign='center';
    c.fillStyle='#dce8f0';c.font=`500 ${sw*.018}px "Chakra Petch",sans-serif`;c.fillText('THE MOVIE HAS ENDED.',w/2,left.y+sh*.2);
    c.font=`600 ${sw*.015}px "Chakra Petch",sans-serif`;c.fillText('CAST',w/2,left.y+sh*.38);
    const names=fade>0?CAST:[];c.font=`${sw*.012}px sans-serif`;
    names.forEach((row,i)=>{const y=left.y+sh*(.49+i*.082)-t*sh*.025;c.fillText(row.text,w/2-sw*.13,y);c.fillText(row.second,w/2+sw*.13,y);});
    c.restore();
    const curtain=Math.max(0,1-ease*2);if(curtain){c.globalAlpha=curtain;for(const side of [-1,1])for(let i=0;i<8;i++){const x=side<0?left.x-12-i*sw*.015:right.x+12+i*sw*.015;const g=c.createLinearGradient(x,0,x+sw*.015,0);g.addColorStop(0,'#061019');g.addColorStop(.5,'#182b35');g.addColorStop(1,'#07121c');c.fillStyle=g;c.fillRect(x,left.y-25,sw*.015,sh+65);}c.globalAlpha=1;}
    // A faint projector beam gives the dark room volume.
    c.globalAlpha=.035*(1-ease);polygon([{x:w*.2,y:-h*.2},{x:w*.8,y:-h*.2},{x:right.x,y:right.y},{x:left.x,y:right.y}],'#d7f7ff');c.globalAlpha=1;
    // Upholstered seat backs, far to near, with an open central aisle.
    for(let z=15;z>=1.8;z-=1.6){if(z-camera<.7)continue;
      for(let seat=-5;seat<=5;seat++){if(seat===0)continue;const x=seat*.9+(seat<0?-.2:.2),floor=-.28+(18-z)*.055,a=p(x-.35,floor+.82,z),b=p(x+.35,floor,z);
        const width=b.x-a.x,height=b.y-a.y;if(a.x>w+width||b.x<-width||a.y>h+height)continue;
        const g=c.createLinearGradient(0,a.y,0,b.y);g.addColorStop(0,'#263646');g.addColorStop(.12,'#111e2c');g.addColorStop(1,'#040710');c.fillStyle=g;
        c.beginPath();c.roundRect(a.x,a.y,width,height,[width*.17,width*.17,width*.05,width*.05]);c.fill();c.strokeStyle='#47647355';c.lineWidth=Math.min(2,width*.02);c.stroke();
        c.fillStyle='#02040a';c.fillRect(a.x-width*.08,b.y-height*.38,width*.08,height*.42);c.fillRect(b.x,b.y-height*.38,width*.08,height*.42);
      }
      if(camera<z-.8)for(const side of [-1,1]){const light=p(side*.62,-.18+(18-z)*.055,z);c.fillStyle='#527989';c.shadowColor='#74bbcf';c.shadowBlur=7;c.fillRect(light.x-light.scale*.07,light.y,light.scale*.14,Math.max(1,light.scale*.013));c.shadowBlur=0;}
    }
    const vignette=c.createRadialGradient(w/2,h*.4,Math.min(w,h)*.23,w/2,h*.4,Math.max(w,h)*.77);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#000b');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    // Arrive at the black credit field before the independent run begins.
    if(t>.93){c.fillStyle=`rgba(2,5,9,${(t-.93)/.07})`;c.fillRect(0,0,w,h);}
  }
}
