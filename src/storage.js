import { CONFIG, MODES } from './config.js';
const KEY = `endroll-rta:${CONFIG.version}`;
export function load() {
  try {
    const current=localStorage.getItem(KEY);
    const legacy=current?{}:JSON.parse(['1.4','1.3','1.2','1.1','1.0'].map(v=>localStorage.getItem(`endroll-rta:${v}`)).find(Boolean)||'{}');
    const raw=current?JSON.parse(current):{sound:legacy.sound,reduced:legacy.reduced,cinema:legacy.cinema};
    return {sound:raw.sound!==false,reduced:raw.reduced===true,cinema:raw.cinema!==false,records:Array.isArray(raw.records)?raw.records.filter(r=>Number.isFinite(r.time)&&r.time>0&&MODES[r.mode]).slice(0,60):[]};
  } catch { return {sound:true,reduced:false,cinema:true,records:[]}; }
}
export function save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; } }
export function best(records, mode) { return records.filter(r => !mode || r.mode === mode).reduce((min, r) => Math.min(min, r.time), Infinity); }
