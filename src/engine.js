import { CONFIG, forwardVelocity } from './config.js';
import { COURSE, offsetAt, layoutCourse } from './credits.js';
export class Run {
  constructor(captureReplay = false) {
    this.tick=0;this.replay=captureReplay?[]:null;this.replayOverflow=false;
    this.distance = 0; this.speed = CONFIG.baseSpeed; this.time = 0; this.rewinding = false;
    this.cuts = []; this.used = new Set(); this.modes = new Set(); this.finished = false;
    this.goal = COURSE.goal; this.rows = layoutCourse([]); this.maxSpeed = 0;
    this.inputs = 0;this.pressedGate=null;this.inputAge=Infinity;this.coastDelay=CONFIG.coastDelay;
    this.events = []; this.keyboardDown = false; this.keyboardReverse = false; this.keyCooldown = 0;
  }
  record(...event){if(!this.replay||this.finished)return;if(this.replay.length>=12000){this.replayOverflow=true;return;}this.replay.push([this.tick,...event]);}
  get mode() { return this.modes.size > 1 ? 'mixed' : [...this.modes][0] || 'auto'; }
  get cutDistance() { return this.cuts.reduce((n, c) => n + c.end - c.start, 0); }
  impulse(amount, mode) {
    if (this.finished || !Number.isFinite(amount) || amount === 0) return 0;
    const reverse=amount<0;
    // Direction changes respond immediately, so forward momentum cannot swallow a rewind.
    const from=reverse?Math.min(0,this.speed):Math.max(CONFIG.baseSpeed,this.speed);
    const delta=reverse?amount*CONFIG.rewindGain:amount;
    if(!Number.isFinite(from+delta))return 0;
    this.record('i',amount,mode);
    this.rewinding=reverse;
    this.speed=reverse?Math.max(-CONFIG.rewindMaxSpeed,from+delta):forwardVelocity(from,amount);
    const applied=this.speed-from;this.maxSpeed=Math.max(this.maxSpeed,this.speed);
    this.modes.add(mode); this.inputs++; this.inputAge=0;
    this.coastDelay=reverse?CONFIG.rewindCoastDelay:mode==='touch'?CONFIG.touchCoastDelay:CONFIG.coastDelay;return applied;
  }
  activeGate() {
    return COURSE.gimmicks.find(g => {
      const p = offsetAt(g.y, this.cuts);
      // Same visible interaction strip on every viewport: 18%–75% of its height.
      return !this.used.has(g.id) && this.distance >= p - CONFIG.worldHeight * .46 && this.distance <= p + CONFIG.worldHeight * .11;
    }) || null;
  }
  activate(id) {
    const gate = this.activeGate();
    if (this.finished || !gate || gate.id !== id || this.used.has(id)) return false;
    return this.cutGate(gate);
  }
  pressGate(id){this.record('p',id);const gate=this.activeGate();this.pressedGate=gate?.id===id?{gate,time:this.time}:null;}
  cancelGate(){if(this.pressedGate)this.record('c');this.pressedGate=null;}
  releaseGate(){this.record('r');const pressed=this.pressedGate;this.pressedGate=null;if(!pressed||this.time-pressed.time>.4)return false;return this.cutGate(pressed.gate);}
  cutGate(gate){
    if(this.finished||this.used.has(gate.id))return false;
    const start=offsetAt(gate.start,this.cuts),end=offsetAt(gate.end,this.cuts);
    if(this.distance>=end)return false;
    // Preserve the camera's original world position if a fast tap crosses into the cut.
    this.distance-=Math.max(0,this.distance-start);
    const id=gate.id;
    this.used.add(id); this.cuts.push({ start: gate.start, end: gate.end });
    this.cuts.sort((a,b) => a.start - b.start); this.goal = offsetAt(COURSE.goal, this.cuts);
    this.rows = layoutCourse(this.cuts);
    this.events.push({ type: 'cut', id, amount: gate.end - gate.start }); return true;
  }
  gateDown() { this.record('g');const g=this.activeGate(); if(g) return this.activate(g.id); return false; }
  step(dt = CONFIG.step) {
    if (this.finished) return;
    this.keyCooldown -= dt;
    if ((this.keyboardDown||this.keyboardReverse) && this.keyCooldown <= 0) { this.impulse((this.keyboardReverse?-1:1)*CONFIG.keyboardImpulse, 'keyboard'); this.keyCooldown = CONFIG.keyboardInterval; }
    const v = this.speed,base=this.rewinding?0:CONFIG.baseSpeed;
    // Split exactly at the idle boundary; normal acceleration and release braking
    // remain independent of frame rate and of the finish-line interpolation.
    const motion = elapsed => {
      const active = Math.min(elapsed,Math.max(0,this.coastDelay-this.inputAge));
      const idle = elapsed-active, excess = v-base;
      const activeDecay = Math.exp(-CONFIG.friction*active);
      const idleDecay = Math.exp(-CONFIG.coastFriction*idle);
      return {
        travel: base*elapsed + excess*(1-activeDecay)/CONFIG.friction + excess*activeDecay*(1-idleDecay)/CONFIG.coastFriction,
        speed: base+excess*activeDecay*idleDecay,
      };
    };
    const movement=motion(dt),travel=movement.travel;
    this.tick++;
    const remaining = this.goal - this.distance;
    if (travel >= remaining) {
      let lo = 0, hi = dt;
      for (let i = 0; i < 32; i++) { const t = (lo + hi) / 2; const d = motion(t).travel; if (d < remaining) lo = t; else hi = t; }
      this.time += (lo + hi) / 2; this.distance = this.goal; this.finished = true; return;
    }
    this.distance = Math.max(0,this.distance+travel); this.time += dt;
    this.speed = this.distance===0&&movement.speed<0?0:movement.speed;this.inputAge+=dt;
    this.maxSpeed = Math.max(this.maxSpeed, this.speed);
  }
}
export function formatTime(seconds) { return Number(seconds || 0).toFixed(3); }
