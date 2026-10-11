// Original, fixed fictional credits. No random course generation or external content.
import { CONFIG } from './config.js';
import { creditName } from './names.js';
let nameIndex = 0;
const name = () => creditName(nameIndex++);
const rows = [];
let y = 430;
function row(text, kind = 'name', gap = 48, second = '') { rows.push({ id: rows.length, y, text, kind, second }); y += gap; }
function section(label, subtitle, count, layout = 'pairs') {
  y += 110; row(label, 'heading', 60); row(subtitle, 'subheading', 80);
  // Long departments retain cinematic density instead of introducing empty space.
  const total = layout === 'pairs' ? count * 12 : count;
  for (let i = 0; i < total; i++) {
    if (i > 0 && i % 66 === 0) { y += 42; row(label, 'eyebrow', 64); }
    row(name(), layout === 'pairs' ? 'pair' : 'name', 48, layout === 'pairs' ? name() : '');
  }
  y += 120;
}
row('A KOSU.KUMA PICTURE', 'eyebrow', 100);
row('THE LAST LIGHT', 'film', 76); row('最後の光が消えるまで', 'subheading', 200);
section('CAST', '出演', 15);
section('STARRING', '主演', 4, 'single');
section('DIRECTED BY', '監督', 1, 'single');
section('WRITTEN BY', '脚本', 2, 'single');
section('PRODUCED BY', '製作', 5, 'single');
const gimmicks = [];
function gate(id, heading, subtitle, cutLength, column) {
  y += 90;
  const gateY = y;
  row(heading, 'heading', 65); row(subtitle, 'subheading', 140);
  // These names are the actual removable course interval, not a visual-only effect.
  const start = gateY + 1100;
  let marker;
  for(let i=0;y<start;i++) {
    row(name(), 'pair', 48, name());
    if(i===4) {
      marker=rows.at(-1);marker.skipId=id;marker.skipColumn=column;
      const field=column===0?'text':'second';marker.originalName=marker[field];marker[field]='SKIP';
    }
  }
  const end = start + cutLength;
  while (y < end) row(name(), 'pair', 42, name());
  gimmicks.push({ id, y: marker.y, rowId:marker.id, column, start, end, type:'tap', heading });
  y = end + 150;
}
gate('thanks', 'SPECIAL THANKS', '協力', 42000, 1);
section('CINEMATOGRAPHY', '撮影', 18);
section('LIGHTING DEPARTMENT', '照明', 14);
section('EDITED BY', '編集', 3, 'single');
section('VISUAL EFFECTS', '視覚効果', 8);
section('ART DEPARTMENT', '美術・装飾', 24);
section('COSTUME & MAKEUP', '衣裳・ヘアメイク', 16);
section('MUSIC BY', '音楽', 3, 'single');
section('ORCHESTRA', '演奏', 22);
gate('secret', 'POST PRODUCTION', 'ポストプロダクション', 42000, 0);
section('SOUND DESIGN', '音響', 16);
section('LOCATION SUPPORT', 'ロケーション協力', 18);
section('TRANSPORTATION', '車輌', 12);
section('SPECIAL THANKS', 'この物語を見届けたすべての人へ', 25);
// A fixed-length final ensemble makes course length explicit and reproducible.
const closingLength = 914;
if (y > CONFIG.courseLength - closingLength) throw new Error('Credits exceed sprint course length');
while (y + 48 <= CONFIG.courseLength - closingLength) row(name(), 'pair', 48, name());
y = CONFIG.courseLength - closingLength;
y += 180; row('制作著作', 'subheading', 64); row('株式会社こす.くま', 'heading', 100);
row('A FLIP ORIGINAL', 'eyebrow', 70); row('All characters and staff names are fictional.', 'legal', 200);
row('見届けてくれて、ありがとう。', 'subheading', 300);
const goal = y; row('THE END', 'end', 0);
export const COURSE = Object.freeze({ rows, gimmicks, goal, nameCount: nameIndex });
export function offsetAt(value, cuts) { return value - cuts.reduce((sum, c) => sum + Math.max(0, Math.min(value, c.end) - c.start), 0); }
export function layoutCourse(cuts) {
  const used=new Set(COURSE.gimmicks.filter(g=>cuts.some(c=>c.start===g.start)).map(g=>g.id));
  const result = COURSE.rows.filter(r => !cuts.some(c => r.y >= c.start && r.y < c.end)).map(r => {
    const copy={...r,y:offsetAt(r.y,cuts)};
    if(used.has(r.skipId)){copy[r.skipColumn===0?'text':'second']=r.originalName;delete copy.skipId;}
    return copy;
  });
  return result.sort((a,b)=>a.y-b.y);
}
