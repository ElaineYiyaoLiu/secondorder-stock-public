import {writeFile} from 'node:fs/promises';
import {makeEngine,tournament,mean} from '../public/engine.js';
import {sampleDataset} from '../public/data.js';
import {CANDLE_MODEL,CANDLE_WEIGHTS} from '../public/candlestick.js';
function generate(seed,kind,n=1200){
 let state=seed,p=100;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return (state+.5)/2**32;};
 const normal=()=>Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());
 return Array.from({length:n},(_,i)=>{
  const phase=i%120,vol=kind==='switching'?(Math.floor(i/150)%2?.035:.006):.015;
  const drift=kind==='repeated'?(phase<40?.002:phase<80?-.002:.0005):0;
  const open=p*Math.exp(normal()*vol*.25),close=open*Math.exp(normal()*vol+drift);p=close;
  return {date:new Date(Date.UTC(2010,0,1+i)).toISOString().slice(0,10),open,close,high:Math.max(open,close)*Math.exp(rand()*vol),low:Math.min(open,close)*Math.exp(-rand()*vol),volume:rand()<.02?0:Math.exp(15+normal()*.4)};
 });
}
const results=[];
for(const kind of ['null','switching','repeated'])for(const cohort of ['development','held-out-seeds']){
 const pairs=[];
 for(let i=0;i<12;i++){
  const seed=(cohort==='development'?1000:9000)+i*997,ds={TEST:generate(seed,kind)};
  const old=(await tournament(makeEngine(ds,'TEST',{candleModel:'legacy'}),['euclidean']))[0];
  const next=(await tournament(makeEngine(ds,'TEST'),['euclidean']))[0];
  if(old.n!==next.n||old.records.some((r,j)=>r.date!==next.records[j].date))throw Error('Mismatched scored origins.');
  pairs.push({seed,n:next.n,legacyMAE:old.mae,v2MAE:next.mae,unconditionalMAE:next.baseline,zeroMAE:mean(next.records.map(r=>Math.abs(r.actual)))});
 }
 results.push({kind,cohort,seeds:pairs.length,origins:pairs.reduce((s,p)=>s+p.n,0),legacyMAE:mean(pairs.map(p=>p.legacyMAE)),v2MAE:mean(pairs.map(p=>p.v2MAE)),unconditionalMAE:mean(pairs.map(p=>p.unconditionalMAE)),zeroMAE:mean(pairs.map(p=>p.zeroMAE)),v2Wins:pairs.filter(p=>p.v2MAE<p.legacyMAE).length,pairs});
 console.log(JSON.stringify({...results.at(-1),pairs:undefined}));
}
const demo=[];for(const [symbol,rows] of Object.entries(sampleDataset())){
 const ds={[symbol]:rows},legacy=(await tournament(makeEngine(ds,symbol,{candleModel:'legacy'}),['euclidean']))[0],v2=(await tournament(makeEngine(ds,symbol),['euclidean']))[0];
 demo.push({symbol,n:v2.n,legacyMAE:legacy.mae,v2MAE:v2.mae,unconditionalMAE:v2.baseline});
}
const report={model:CANDLE_MODEL,weights:CANDLE_WEIGHTS,protocol:'Fixed weights, 30-session query, 20-session outcome, stride 20, six spaced neighbours, mature outcomes before query start. Development seeds and separate seed cohort, no tuning. Cohort averages are per-seed MAE; origins within each seed are dependent.',results,demo,limitations:['Synthetic processes only; no real market data or alpha evidence.','Held-out seeds share the same generators; this is not a held-out market regime.','No confidence intervals or claim of statistical significance.','Fixed weights and scale floor remain modeling assumptions.']};
await writeFile('research/candle-validation.json',JSON.stringify(report,null,2)+'\n');
console.log('Saved research/candle-validation.json');
