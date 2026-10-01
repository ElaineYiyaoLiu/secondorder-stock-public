import {writeFile} from 'node:fs/promises';
import {makeEngine,tournament,mean,quantile} from '../public/engine.js';
import {sampleDataset} from '../public/data.js';
import {commonEvaluation} from './paired-evaluation.mjs';
import {PATH_MODEL,PATH_CONFIG} from '../public/price-path.js';
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

function pairedCI(pairs){
 let seed=73127;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const delta=pairs.map(p=>p.v2MAE-p.legacyMAE),samples=[];
 for(let i=0;i<5000;i++)samples.push(mean(delta.map(()=>delta[Math.floor(rand()*delta.length)])));
 return {meanDelta:mean(delta),seedBootstrap95:[quantile(samples,.025),quantile(samples,.975)]};
}
const results=[];
for(const kind of ['null','switching','repeated'])for(const cohort of ['development','held-out-seeds']){
 const pairs=[];
 for(let i=0;i<12;i++){
  const seed=(cohort==='development'?1000:9000)+i*997,ds={TEST:generate(seed,kind)};
  const old=(await tournament(makeEngine(ds,'TEST',{pathModel:'legacy'}),['dtw']))[0];
  const next=(await tournament(makeEngine(ds,'TEST'),['dtw']))[0];
  const methods={legacy:old.records,v2:next.records};
  if(cohort==='held-out-seeds')for(const pathAblation of ['no-warp','no-slope','no-regime']){
   const [r]=await tournament(makeEngine(ds,'TEST',{pathAblation}),['dtw']);methods[pathAblation]=r.records;
  }
  const paired=commonEvaluation(methods),ablations=Object.fromEntries(Object.entries(paired.mae).filter(([id])=>id!=='legacy'&&id!=='v2'));
  pairs.push({seed,n:paired.n,legacyMAE:paired.mae.legacy,v2MAE:paired.mae.v2,unconditionalMAE:paired.unconditionalMAE,zeroMAE:paired.zeroMAE,ablations,coverage:paired.coverage});
 }
 const ablations=cohort==='held-out-seeds'?Object.fromEntries(['no-warp','no-slope','no-regime'].map(k=>[k,mean(pairs.map(p=>p.ablations[k]))])):{};
 results.push({kind,cohort,seeds:pairs.length,origins:pairs.reduce((s,p)=>s+p.n,0),legacyMAE:mean(pairs.map(p=>p.legacyMAE)),v2MAE:mean(pairs.map(p=>p.v2MAE)),unconditionalMAE:mean(pairs.map(p=>p.unconditionalMAE)),zeroMAE:mean(pairs.map(p=>p.zeroMAE)),v2Wins:pairs.filter(p=>p.v2MAE<p.legacyMAE).length,...pairedCI(pairs),ablations,pairs});
 console.log(JSON.stringify({...results.at(-1),pairs:undefined}));
}
const demo=[];for(const [symbol,rows] of Object.entries(sampleDataset())){
 const ds={[symbol]:rows},legacy=(await tournament(makeEngine(ds,symbol,{pathModel:'legacy'}),['dtw']))[0],v2=(await tournament(makeEngine(ds,symbol),['dtw']))[0];
 const paired=commonEvaluation({legacy:legacy.records,v2:v2.records});
 demo.push({symbol,n:paired.n,legacyMAE:paired.mae.legacy,v2MAE:paired.mae.v2,unconditionalMAE:paired.unconditionalMAE,coverage:paired.coverage});
}
const report={model:PATH_MODEL,config:PATH_CONFIG,protocol:'Fixed design before outcomes; 30-session query, 20-session outcome, stride 20, six spaced neighbours, mature outcomes before query start. Same generators and seeds as candle validation. Held-out seed cohort additionally tests three ablations. 5,000 paired seed-cluster bootstrap resamples per cohort; all origins of a seed remain together. Metrics use the intersection of scored dates across compared methods, with model-specific coverage reported. No outcome-based tuning.',results,demo,limitations:['Synthetic processes only, no real-market data or alpha evidence.','Seeds were used previously in candle validation; they are separate from path development checks, not a never-seen dataset.','Seed cohorts share generators, so they do not represent held-out market regimes.','Bootstrap intervals are exploratory with 12 independent seeds per group; no multiple-comparison adjustment.','Fixed constants are modeling assumptions; results must not be used to tune against this evaluation set.']};
await writeFile('research/path-validation.json',JSON.stringify(report,null,2)+'\n');
console.log('Saved research/path-validation.json');
