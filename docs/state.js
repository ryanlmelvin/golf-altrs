import { OUTINGS, JOURNEY_EVIDENCE as EVIDENCE, JOURNEY_DEDUCTIONS as DEDUCTIONS } from './journey.js';
import { restoreRound } from './golf.js';
import { DESTINATIONS } from './alabama.js';
export const SAVE_VERSION = 2;
export function newGame() {
  return {version:2,started:false,current:0,totalRounds:0,counts:{},completed:[],wins:[],evidence:[],solved:[],responses:[],trust:0,chorus:0,rounds:{},roundMeta:{},loreSeen:[],ending:null,finalWin:false,settings:{sound:false,assisted:false},updated:Date.now()};
}
export function unlockedLocations(s) { return s.totalRounds>0 ? Array.from({length:11},(_,i)=>i) : [0]; }
export function nextOuting(s) { return OUTINGS.find(o=>!s.completed.includes(o.id) || (o.kind!=='finale' && o.find && !s.evidence.includes(o.find.clue))) || null; }
export function availableOuting(s,index=s.current) {
  const o=nextOuting(s);
  if(!o || o.location!==index) return null;
  if(o.kind==='finale' && !DEDUCTIONS.every(d=>s.solved.includes(d.id))) return null;
  if(o.requiresDeduction && !s.solved.includes(o.requiresDeduction)) return null;
  return o;
}
export function roundContext(s,index=s.current) {
  if(s.roundMeta[index]) return s.roundMeta[index];
  const o=availableOuting(s,index);
  const missed=OUTINGS.find(x=>x.location===index && s.completed.includes(x.id) && x.find && !s.evidence.includes(x.find.clue));
  return {outingId:o?.id||null,variant:s.counts[index]||0,settled:false,won:false,findId:missed?.id || (o?.find?o.id:null)};
}
export function roundOuting(s,index=s.current) { const id=roundContext(s,index).outingId; return OUTINGS.find(o=>o.id===id)||null; }
export function roundFind(s,index=s.current) {
  const id=roundContext(s,index).findId;const o=OUTINGS.find(o=>o.id===id);
  if(!o?.find || s.evidence.includes(o.find.clue))return null;
  return {...o.find,afterFlags:s.completed.includes(o.id)?0:o.find.afterFlags};
}
export function startRound(s,index=s.current) { s.roundMeta[index]={...roundContext(s,index)};s.started=true; }
export function clearRound(s,index=s.current) { delete s.rounds[index];delete s.roundMeta[index]; }
export function travel(s,index) { if(!unlockedLocations(s).includes(index))return false;if(index!==s.current)s.chorus=s.solved.length;s.current=index;return true; }
export function collect(s,id) {if(!id||!EVIDENCE.some(e=>e.id===id)||s.evidence.includes(id))return false;s.evidence.push(id);return true;}
export function respond(s,index,id) {
  const o=roundOuting(s,index);const r=o?.person?.choices.find(d=>d.id===id);if(!r)return null;
  const key=`${o.id}:${id}`;if(!s.responses.includes(key)){s.responses.push(key);s.trust+=r.trust||0;collect(s,r.evidence);}return r;
}
export function solve(s,id,answer) {const d=DEDUCTIONS.find(d=>d.id===id);if(!d||!d.required.every(e=>s.evidence.includes(e))||d.answer!==answer)return false;if(!s.solved.includes(id))s.solved.push(id);return true;}
export function finishRound(s,index,r) {
  if(!unlockedLocations(s).includes(index)||!r||r.finished!==true||!Number.isInteger(r.strokes)||r.strokes<5||!Array.isArray(r.holes)||r.holes.length!==5||!r.holes.every(n=>Number.isInteger(n)&&n>0)||r.holes.reduce((a,b)=>a+b,0)!==r.strokes)return false;
  const meta=s.roundMeta[index];if(!meta||meta.settled)return false;
  const o=roundOuting(s,index);const won=!o?.target||r.strokes<o.target;
  meta.settled=true;meta.won=won;meta.strokes=r.strokes;s.counts[index]=(s.counts[index]||0)+1;s.totalRounds++;
  if(won){if(!s.wins.includes(index))s.wins.push(index);if(o&&!s.completed.includes(o.id)){s.completed.push(o.id);collect(s,o.reward);}}
  if(won&&o?.kind==='finale')s.finalWin=true;
  return won;
}
export function chooseEnding(s,ending) {if(!s.finalWin||!['seal','expose','accept'].includes(ending)||(ending==='expose'&&s.trust<2))return false;s.ending=ending;return true;}
const unique=(a,allowed)=>[...new Set(Array.isArray(a)?a.filter(x=>allowed.includes(x)):[])];
export function validateSave(input) {
  if(!input||typeof input!=='object'||input.version!==2)throw new Error('That is not a Pension Plan save.');
  const s=newGame();s.started=input.started===true;
  s.completed=unique(input.completed,OUTINGS.map(o=>o.id));
  s.evidence=unique(input.evidence,EVIDENCE.map(e=>e.id));
  s.solved=unique(input.solved,DEDUCTIONS.filter(d=>d.required.every(id=>s.evidence.includes(id))).map(d=>d.id));
  s.responses=unique(input.responses,OUTINGS.flatMap(o=>(o.person?.choices||[]).map(d=>`${o.id}:${d.id}`)));
  s.trust=s.responses.reduce((n,key)=>{const [oid,id]=key.split(':');return n+(OUTINGS.find(o=>o.id===oid)?.person?.choices.find(d=>d.id===id)?.trust||0);},0);
  for(let i=0;i<11;i++)if(Number.isInteger(input.counts?.[i])&&input.counts[i]>0)s.counts[i]=Math.min(input.counts[i],100000);
  s.totalRounds=Object.values(s.counts).reduce((a,b)=>a+b,0);
  s.wins=unique(input.wins,Object.keys(s.counts).map(Number));s.chorus=Math.min(s.solved.length,Math.max(0,Number.isInteger(input.chorus)?input.chorus:0));
  s.current=unlockedLocations(s).includes(input.current)?input.current:0;
  s.settings={sound:input.settings?.sound===true,assisted:input.settings?.assisted===true};
  s.finalWin=input.finalWin===true&&OUTINGS.some(o=>o.kind==='finale'&&s.completed.includes(o.id));
  s.ending=s.finalWin&&['seal','accept','expose'].includes(input.ending)&&(input.ending!=='expose'||s.trust>=2)?input.ending:null;
  s.loreSeen=Array.isArray(input.loreSeen)?[...new Set(input.loreSeen.filter(x=>typeof x==='string'&&/^[a-z0-9-]{1,80}$/.test(x)))].slice(0,200):[];
  for(let i=0;i<11;i++) {
    const m=input.roundMeta?.[i], r=input.rounds?.[i];
    if(!m||!r||typeof m!=='object'||typeof r!=='object'||Array.isArray(r)||JSON.stringify(r).length>30000)continue;
    const outing=OUTINGS.find(o=>o.id===m.outingId&&o.location===i);
    const find=OUTINGS.find(o=>o.id===m.findId&&o.location===i&&o.find);
    const variant=Number.isInteger(m.variant)&&m.variant>=0?Math.min(m.variant,100000):0;
    const restored=restoreRound(r,DESTINATIONS[i].baseCourse,variant);
    s.rounds[i]=restored;s.roundMeta[i]={outingId:outing?.id||null,findId:find?.id||null,variant,settled:m.settled===true&&restored.finished,won:m.won===true&&restored.finished,strokes:restored.strokes};
  }
  s.updated=Number.isFinite(input.updated)?input.updated:Date.now();return s;
}
export function storageKey(pathname) {const scope=pathname.endsWith('/')?pathname:pathname.slice(0,pathname.lastIndexOf('/')+1);return `pension-plan:${scope}:save-v2`;}
export function parseBackup(text) {if(typeof text!=='string'||text.length>500000)throw new Error('This save file is too large.');return validateSave(JSON.parse(text));}
