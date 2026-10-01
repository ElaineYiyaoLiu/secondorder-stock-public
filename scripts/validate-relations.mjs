import {writeFile} from 'node:fs/promises';
import {makeEngine,tournament,mean,quantile} from '../public/engine.js';
import {relationEmbedding,RELATION_CONFIG,RELATION_MODEL} from '../public/relationships.js';
import {estimationFixture,forecastFixture} from './relation-fixtures.mjs';
import {commonEvaluation} from './paired-evaluation.mjs';
import {sampleDataset} from '../public/data.js';
const edges=(a,b)=>{const values=[];for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)values.push((a[i][j]-b[i][j])**2);return mean(values);};
function interval(delta){let seed=73123;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;},samples=[];for(let k=0;k<5000;k++)samples.push(mean(delta.map(()=>delta[Math.floor(rng()*delta.length)])));return {meanDelta:mean(delta),seedBootstrap95:[quantile(samples,.025),quantile(samples,.975)]};}
const estimation=[];
for(const kind of ['independent','factor','contaminated'])for(const n of [10,30,60,120]){
 const records=[];
 for(let k=0;k<100;k++){
  const seed=71000+997*k,{dataset,truth}=estimationFixture(seed,kind,n),names=Object.keys(dataset).sort(),basket=names.map(s=>dataset[s]);
  const full=relationEmbedding(basket,names),noShrink=relationEmbedding(basket,names,{ablation:'no-shrink'}),noWinsor=relationEmbedding(basket,names,{ablation:'no-winsor'}),old=makeEngine(dataset,'S0',{relationModel:'legacy'}).get(0,n-1).correlation;
  const matrix=Array.from({length:names.length},(_,i)=>old.slice(i*names.length,(i+1)*names.length)),rankTruth=truth.map(row=>row.map(x=>6/Math.PI*Math.asin(x/2)));
  records.push({seed,legacyMSE:edges(matrix,truth),v2LinearMSE:edges(full.linear,truth),rankMSE:edges(full.rank,rankTruth),noShrinkLinearMSE:edges(noShrink.linear,truth),noWinsorLinearMSE:edges(noWinsor.linear,truth),linearShrinkage:full.shrinkage.linear,rankShrinkage:full.shrinkage.rank,collapsed:+(full.shrinkage.linear===1&&full.shrinkage.rank===1)});
 }
 const aggregate={kind,n,seeds:records.length,...Object.fromEntries(Object.keys(records[0]).filter(k=>k!=='seed').map(k=>[k,mean(records.map(r=>r[k]))])),paired:interval(records.map(r=>r.v2LinearMSE-r.legacyMSE)),records};estimation.push(aggregate);console.log('estimation '+JSON.stringify({...aggregate,records:undefined}));
}
const forecast=[];
for(const kind of ['null','switching','linked-drift'])for(const cohort of ['development','separate-seeds']){
 const pairs=[];
 for(let k=0;k<12;k++){
  const seed=(cohort==='development'?21000:91000)+997*k,dataset=forecastFixture(seed,kind),methods={};
  for(const [id,options] of Object.entries({legacy:{relationModel:'legacy'},v2:{},...(cohort==='separate-seeds'?{'no-shrink':{relationAblation:'no-shrink'},'no-winsor':{relationAblation:'no-winsor'},'linear-only':{relationAblation:'linear-only'}}:{})}))methods[id]=(await tournament(makeEngine(dataset,'S0',options),['correlation']))[0].records;
  const paired=commonEvaluation(methods);pairs.push({seed,n:paired.n,mae:paired.mae,unconditionalMAE:paired.unconditionalMAE,zeroMAE:paired.zeroMAE,coverage:paired.coverage});
 }
 const aggregate={kind,cohort,seeds:pairs.length,origins:pairs.reduce((s,p)=>s+p.n,0),mae:Object.fromEntries(Object.keys(pairs[0].mae).map(k=>[k,mean(pairs.map(p=>p.mae[k]))])),unconditionalMAE:mean(pairs.map(p=>p.unconditionalMAE)),zeroMAE:mean(pairs.map(p=>p.zeroMAE)),paired:interval(pairs.map(p=>p.mae.v2-p.mae.legacy)),pairs};forecast.push(aggregate);console.log('forecast '+JSON.stringify({...aggregate,pairs:undefined}));
}
const demo=[],dataset=sampleDataset();
for(const symbol of Object.keys(dataset)){
 const legacy=(await tournament(makeEngine(dataset,symbol,{relationModel:'legacy'}),['correlation']))[0],v2=(await tournament(makeEngine(dataset,symbol),['correlation']))[0],paired=commonEvaluation({legacy:legacy.records,v2:v2.records});demo.push({symbol,n:paired.n,mae:paired.mae,unconditionalMAE:paired.unconditionalMAE});
}
const report={model:RELATION_MODEL,config:RELATION_CONFIG,estimation,forecast,demo,protocol:'Constants fixed before evaluation. Estimation: 100 seeds per generator/window, six assets, known Gaussian factor structure; contamination estimates the latent clean correlation, not the contaminated population. Forecast: 72 six-asset histories, 1200 sessions, 30-session query, 20-session horizon, stride 20, six spaced neighbours, mature outcomes before query start. Separate-seed cohort includes three ablations; common date intersection and coverage are retained. Paired intervals use 5000 seed-cluster bootstrap resamples.',limitations:['Synthetic estimation and prediction only; no market alpha evidence.','OAS is applied after winsorization and ranking; no Gaussian oracle guarantee is claimed.','Full shrinkage expresses a prior under weak evidence, not proof of independence.','The linked-drift process deliberately embeds predictable relationship states.','Separate seeds share the same generators; they are not unseen market regimes.','Bootstrap intervals are exploratory, not adjusted for multiple comparisons.','Outlier suppression may hide genuine systemic shocks; latent-state loss is only one target.']};
await writeFile('research/relationship-validation.json',JSON.stringify(report,null,2)+'\n');console.log('Saved research/relationship-validation.json');
