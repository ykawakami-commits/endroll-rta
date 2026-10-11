// Original sound effects and two synchronized stems from scripts/music-score.mjs.
export class Sound {
  constructor(enabled) { this.enabled = enabled; this.ctx = null; this.lastFlick = 0; this.musicWanted=false;this.musicSources=[];this.musicLoad=null;this.musicBuffers=null;this.musicError=false; }
  async unlock() {
    try {
      if (!this.ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return;
        this.ctx = new Audio(); this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? .22 : 0; this.master.connect(this.ctx.destination);
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate); const data = buffer.getChannelData(0);
        for(let i=0;i<data.length;i++) data[i] = Math.random()*2-1;
        this.noise = this.ctx.createBufferSource(); this.noise.buffer = buffer; this.noise.loop = true;
        this.filter = this.ctx.createBiquadFilter(); this.filter.type = 'bandpass'; this.filter.Q.value = .7;
        this.wind = this.ctx.createGain(); this.wind.gain.value = 0; this.noise.connect(this.filter); this.filter.connect(this.wind); this.wind.connect(this.master); this.noise.start();
        this.musicBus=this.ctx.createGain();this.musicBus.gain.value=0;this.musicBus.connect(this.master);
        this.themeGain=this.ctx.createGain();this.themeGain.gain.value=1.25;this.themeGain.connect(this.musicBus);
        this.driveGain=this.ctx.createGain();this.driveGain.gain.value=0;this.driveGain.connect(this.musicBus);
        this.ctx.addEventListener('statechange',()=>this.playMusic());
      }
      // Decode while autoplay is blocked; the first gesture can then start promptly.
      if(this.enabled)this.prepareMusic();
      if(this.ctx.state === 'suspended'||this.ctx.state === 'interrupted') await this.ctx.resume();
      this.playMusic();
    } catch { /* Audio is optional; gameplay remains available. */ }
  }
  set(enabled) { this.enabled=enabled; if(!enabled)this.stopReward();if(this.ctx)this.master.gain.setTargetAtTime(enabled ? .22 : 0, this.ctx.currentTime, .05);if(enabled&&this.musicWanted)this.unlock(); }
  title() { this.musicWanted=true;if(this.enabled)this.unlock(); }
  prepareMusic() {
    if(this.musicLoad||this.musicBuffers||!this.ctx)return;
    this.musicError=false;
    this.musicLoad=Promise.all(['theme','drive'].map(async stem=>{
      const response=await fetch(new URL(`../assets/last-light-${stem}.m4a`,import.meta.url));if(!response.ok)throw new Error('Music unavailable');
      return this.ctx.decodeAudioData(await response.arrayBuffer());
    })).then(buffers=>{this.musicBuffers=buffers;if(this.musicWanted&&!document.hidden)this.playMusic();})
      .catch(()=>{this.musicError=true;}).finally(()=>{this.musicLoad=null;});
  }
  playMusic() {
    if(!this.ctx||this.ctx.state!=='running'||!this.enabled||!this.musicBuffers||this.musicSources.length||!this.musicWanted||document.hidden)return;
    const at=this.ctx.currentTime+.025;
    this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);this.musicBus.gain.setValueAtTime(0,this.ctx.currentTime);this.musicBus.gain.linearRampToValueAtTime(1,at+.18);
    this.musicSources=this.musicBuffers.map((buffer,i)=>{
      const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.loopEnd=Math.min(64*60/132,buffer.duration);source.connect(i?this.driveGain:this.themeGain);source.start(at);return source;
    });
  }
  stopMusic(fade=.14) {
    this.musicWanted=false;if(!this.ctx)return;
    const t=this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);this.musicBus.gain.setTargetAtTime(0,t,.025);
    for(const source of this.musicSources){try{source.stop(t+fade);}catch{}source.onended=()=>source.disconnect();}
    this.musicSources=[];
  }
  diagnostics() { return {context:this.ctx?.state||'locked',enabled:this.enabled,loaded:!!this.musicBuffers,sources:this.musicSources.length,rewardVoices:this.rewardNodes?.size||0,error:this.musicError,masterGain:this.master?.gain.value,driveGain:this.driveGain?.gain.value}; }
  stopReward(){for(const node of this.rewardNodes||[]){try{node.stop();}catch{}node.disconnect();}this.rewardNodes?.clear();this.rewardBus?.disconnect();this.rewardBus=null;}
  reward(level){
    this.stopReward();if(!this.ctx||!this.enabled||!level)return;
    const ctx=this.ctx,t=ctx.currentTime+.02,bus=ctx.createGain();bus.gain.value=.7;bus.connect(this.master);this.rewardBus=bus;this.rewardNodes=new Set();
    const track=node=>{this.rewardNodes.add(node);node.onended=()=>{node.disconnect();this.rewardNodes.delete(node);if(this.rewardNodes.size===0&&this.rewardBus===bus){bus.disconnect();this.rewardBus=null;}};};
    const note=(freq,offset,len,volume,type='triangle',end=freq)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t+offset);o.frequency.exponentialRampToValueAtTime(end,t+offset+len);g.gain.setValueAtTime(.0001,t+offset);g.gain.linearRampToValueAtTime(volume,t+offset+.015);g.gain.exponentialRampToValueAtTime(.0001,t+offset+len);o.connect(g);g.connect(bus);track(o);o.start(t+offset);o.stop(t+offset+len+.03);};
    if(level===1){note(587.33,0,.17,.13);note(739.99,.12,.2,.1);return;}
    const melody=level===2?[293.66,369.99,440,587.33]:level===3?[293.66,440,587.33,739.99,880]:[293.66,329.63,369.99,440,587.33,739.99,880,1174.66];
    melody.forEach((freq,i)=>note(freq,(level===4?.3:0)+i*.105,level>=3?.65:.35,level===2?.15:.2));
    if(level>=3){note(95,.1,1,.6,'sine',32);[293.66,369.99,440].forEach(f=>note(f,level===4?1.35:.65,1.1,.13));}
    if(level===4){
      note(140,0,.28,.2,'sine',1400);[587.33,739.99,880,1174.66].forEach(f=>note(f,2.45,1.35,.12));note(73.42,2.45,1.2,.45,'sine',36.71);
      const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();noise.buffer=this.noise.buffer;filter.type='lowpass';filter.frequency.setValueAtTime(6000,t+.28);filter.frequency.exponentialRampToValueAtTime(100,t+1.15);g.gain.setValueAtTime(0,t+.28);g.gain.linearRampToValueAtTime(.24,t+.3);g.gain.exponentialRampToValueAtTime(.0001,t+1.2);noise.connect(filter);filter.connect(g);g.connect(bus);track(noise);noise.start(t+.28);noise.stop(t+1.25);
    }
  }
  tone(freq, duration = .12, volume = .3, type = 'sine', end = freq) {
    if(!this.ctx || !this.enabled) return; const t=this.ctx.currentTime; const o=this.ctx.createOscillator(); const g=this.ctx.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
    g.gain.setValueAtTime(.001,t); g.gain.linearRampToValueAtTime(volume,t+.008); g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  flick(speed) { if(!this.ctx || this.ctx.currentTime-this.lastFlick < .055) return; this.lastFlick=this.ctx.currentTime;const intensity=1-Math.exp(-speed/4200);this.tone(180+intensity*1000,.1,.13,'triangle',550+intensity*3100); }
  update(ratio, playing) { if(!this.ctx) return; this.filter.frequency.setTargetAtTime(350+ratio*2200,this.ctx.currentTime,.1); this.wind.gain.setTargetAtTime(playing ? ratio*ratio*.12 : 0,this.ctx.currentTime,.08);this.driveGain.gain.setTargetAtTime(playing?Math.max(0,(ratio-.2)/.8)*.85:0,this.ctx.currentTime,.35); }
  start() { this.musicWanted=true;if(this.ctx)this.driveGain.gain.setValueAtTime(0,this.ctx.currentTime);if(this.enabled)this.prepareMusic();this.playMusic();this.tone(110,.45,.4,'sine',55); }
  cut() { this.tone(950,.19,.4,'sawtooth',60); setTimeout(()=>this.tone(1400,.09,.12,'triangle',2600),65); }
  finish() { this.stopMusic(.25);this.tone(587.33,.24,.12,'triangle'); }
}
