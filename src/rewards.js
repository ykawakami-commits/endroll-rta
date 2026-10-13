// Design targets for course 1.5, not measured population percentiles.
// Strong no-SKIP runs (roughly 14–16 s) earn 10%; finding SKIPs opens the 1% tier.
// Keep labels, celebration, reaction and shared images on the same classification.
export const REWARD_BASIS='称号はタイム基準で、実測順位ではありません。';
export const REWARDS=Object.freeze([
  Object.freeze({id:'singularity',level:4,percent:1,maxTime:12,grade:'SSS',label:'SSS',title:'余韻の特異点',hero:'余韻、消滅。',comment:'映画より先に、伝説になった。',asset:'front',color:'#c4faff',duration:5.2}),
  Object.freeze({id:'overdrive',level:3,percent:10,maxTime:16,grade:'SS',label:'SS',title:'エンドロールの破壊神',hero:'余韻を、破壊した。',comment:'その指、もはや早送りボタン。',asset:'front',color:'#00e5ff',duration:3.1}),
  Object.freeze({id:'hotcut',level:2,percent:30,maxTime:18,grade:'S',label:'S',title:'クレジットクラッシャー',hero:'いい飛ばしっぷり。',comment:'ポップコーンを食べる暇もないね。',asset:'side',color:'#4edeea',duration:1.8}),
  Object.freeze({id:'goodcut',level:1,percent:50,maxTime:22,grade:'A',label:'A',title:'余韻ブレイカー',hero:'ナイスカット。',comment:'うん、なかなかいい速さ。',asset:'rest',color:'#a4cbd4',duration:.85}),
]);
export const CLEAR_REWARD=Object.freeze({id:'clear',level:0,percent:null,maxTime:Infinity,grade:'CLEAR',label:'RUN COMPLETE',title:'シアターの最終退出者',hero:'おつかれさま。',comment:'次は、もっと勢いよくいこう。',asset:'rest',color:'#89a4b7',duration:0});
export function rewardFor(time){if(!Number.isFinite(time)||time<=0)return CLEAR_REWARD;return REWARDS.find(r=>Number(time.toFixed(3))<=r.maxTime)||CLEAR_REWARD;}
