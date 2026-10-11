// All distances are world units, all times are seconds. Course changes require a version bump.
export const CONFIG = Object.freeze({
  version: '1.5', step: 1 / 120, worldHeight: 800,
  baseSpeed: 36, friction: 0.14,
  coastDelay: 0.18, touchCoastDelay: 0.24, coastFriction: 14, // Briefly bridge input events, then brake quickly.
  courseLength: 210000, // Keep the sprint course and its shortcuts fixed.
  // About half the strongest touch speed measured in v1.2; gains below it are unchanged.
  maxSpeed: 16000,
  inputSensitivity: .65, highSpeedResistance: .6,
  rewindMaxSpeed: 3200, rewindGain: .55, rewindCoastDelay: .04,
  effectSpeed: 4200,
  pointerGain: 5.2, pointerVelocityReference: 1200, pointerVelocityWeight: 0.38,
  wheelGain: 5, keyboardImpulse: 600, keyboardInterval: 0.08, keyboardTapImpulse: 320,
  introDuration: 3000, introCutDuration: 120, maxFrameGap: 1,
});
// Integrate gain analytically so splitting one gesture into more events cannot add power.
export function forwardVelocity(speed, amount) {
  const scale=CONFIG.maxSpeed/Math.sqrt(CONFIG.highSpeedResistance);
  return Math.min(CONFIG.maxSpeed,scale*Math.tanh(Math.atanh(Math.max(CONFIG.baseSpeed,speed)/scale)+amount*CONFIG.inputSensitivity/scale));
}
export const speedIntensity = speed => 1 - Math.exp(-Math.max(0,speed) / CONFIG.effectSpeed);
export function swipeImpulse(distance, seconds) {
  if(!Number.isFinite(distance)||distance===0||!Number.isFinite(seconds)||seconds<=0)return 0;
  const velocity=Math.abs(distance)/Math.max(.001,seconds);
  return distance*CONFIG.pointerGain*(1+Math.log1p(velocity/CONFIG.pointerVelocityReference)*CONFIG.pointerVelocityWeight);
}
export const MODES = { touch: 'タッチ', drag: 'ドラッグ', wheel: 'ホイール / パッド', keyboard: 'キーボード', mixed: 'ミックス', auto: '自動送り' };

// Positive wheel delta sends credits upward; negative delta rewinds them.
export function wheelImpulse(deltaY, deltaMode = 0, deltaX = 0) {
  if (!Number.isFinite(deltaY) || !Number.isFinite(deltaX) || deltaY === 0 || Math.abs(deltaY) < Math.abs(deltaX)) return 0;
  return deltaY * (deltaMode === 1 ? 18 : deltaMode === 2 ? 240 : 1) * CONFIG.wheelGain;
}
