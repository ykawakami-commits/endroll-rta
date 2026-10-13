// Result-only effects: no connection to simulation time or the finish line.
export class Celebration {
  constructor(layer){this.layer=layer;this.canvas=layer.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.frame=0;this.resize=()=>{this.w=innerWidth;this.h=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);this.ctx.setTransform(dpr,0,0,dpr,0,0);};}
  stop(){cancelAnimationFrame(this.frame);this.frame=0;this.layer.hidden=true;this.layer.classList.remove('is-running');this.particles=[];window.removeEventListener('resize',this.resize);}
  play(tier,reduced=false){
    this.stop();if(!tier.level||reduced)return;
    this.tier=tier;this.resize();window.addEventListener('resize',this.resize);this.layer.dataset.level=String(tier.level);
    this.layer.querySelector('.reward-hero-number').textContent=tier.grade;
    this.layer.querySelector('.reward-hero-title').textContent=tier.hero;
    this.layer.querySelector('.reward-hero-kicker').textContent=tier.level===4?'SINGULARITY ACHIEVED':'OVERDRIVE';
    const count=[0,8,34,120,330][tier.level];let seed=28933;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    this.particles=Array.from({length:count},(_,i)=>({angle:random()*Math.PI*2,speed:80+random()*(tier.level===4?720:260),delay:tier.level===4?(i<count*.6?.28:i<count*.85?1.35:2.45):.05,life:1+random()*1.65,size:1+random()*3,rotation:random()*Math.PI,color:tier.level===4&&i%4===0?'#a89bff':i%3===0?'#fff':tier.color}));
    this.layer.hidden=false;void this.layer.offsetWidth;this.layer.classList.add('is-running');this.started=performance.now();
    const animate=now=>{const t=(now-this.started)/1000;if(t>tier.duration){this.stop();return;}this.draw(t);this.frame=requestAnimationFrame(animate);};
    this.frame=requestAnimationFrame(animate);
  }
  draw(t){
    const c=this.ctx,w=this.w,h=this.h,level=this.tier.level,cx=w/2,cy=h*(level>=3?.43:.39),extent=Math.hypot(w,h)*.65;
    c.clearRect(0,0,w,h);
    if(level===4){
      const envelope=Math.min(1,t*4)*Math.max(0,1-(t-2.6)/1.2);
      c.fillStyle=`rgba(2,5,12,${.87*envelope})`;c.fillRect(0,0,w,h);
      const glow=c.createRadialGradient(cx,cy,0,cx,cy,extent*.7);glow.addColorStop(0,`rgba(93,236,255,${.28*envelope})`);glow.addColorStop(.3,`rgba(84,77,228,${.16*envelope})`);glow.addColorStop(1,'transparent');c.fillStyle=glow;c.fillRect(0,0,w,h);
      c.save();c.translate(cx,cy);c.globalAlpha=envelope*.42;
      for(let i=0;i<54;i++){const angle=i*Math.PI*2/54+.025*t,inner=90+(i%5)*14+60*t,outer=extent*(.65+(i%4)*.12);c.strokeStyle=i%4===0?'#a795ff':'#50e6ff';c.lineWidth=i%6===0?2:.65;c.beginPath();c.moveTo(Math.cos(angle)*inner,Math.sin(angle)*inner);c.lineTo(Math.cos(angle)*outer,Math.sin(angle)*outer);c.stroke();}
      for(let i=0;i<3;i++){c.rotate((i%2?-.13:.1)*t);c.strokeStyle=i===1?'#a89bff':'#83edff';c.lineWidth=i===0?2:1;c.setLineDash(i===1?[3,13]:[60,20,5,20]);c.beginPath();c.arc(0,0,Math.min(w*.37,h*.25)+i*27,0,Math.PI*2);c.stroke();}
      c.restore();
    }
    if(level>=2){
      const starts=level===4?[.28,1.35,2.45]:level===3?[.05,.55]:[0];
      for(const start of starts){const age=t-start;if(age<0||age>1.25)continue;const p=age/1.25,radius=20+extent*(1-(1-p)**3)*(level===2?.35:1);c.globalAlpha=(1-p)*.6;c.strokeStyle=this.tier.color;c.lineWidth=level===4?3:1;c.beginPath();c.ellipse(cx,cy,radius,radius*(level===4?.66:1),-.2,0,Math.PI*2);c.stroke();}
    }
    for(const p of this.particles){const age=t-p.delay;if(age<0||age>p.life)continue;const progress=age/p.life,travel=p.speed*age*(1-age*.12),x=cx+Math.cos(p.angle)*travel,y=cy+Math.sin(p.angle)*travel+age*age*32;c.globalAlpha=(1-progress)*.9;c.fillStyle=p.color;c.strokeStyle=p.color;c.save();c.translate(x,y);c.rotate(p.rotation+age*2);if(level>=3){c.fillRect(-p.size/2,-p.size*2,p.size,p.size*(level===4?9:4));}else c.fillRect(-p.size/2,-p.size/2,p.size,p.size);c.restore();}
    c.globalAlpha=1;
  }
}
