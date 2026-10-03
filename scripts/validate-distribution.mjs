import {writeFile} from 'node:fs/promises';
import {makeEngine,tournament,mean,quantile} from '../public/legacy-engine.js';
import {distributionEmbedding,distributionDistance,DISTRIBUTION_CONFIG,DISTRIBUTION_MODEL} from '../public/return-distribution.js';
import {generator,fromReturns,forecastFixture} from './relation-fixtures.mjs';
import {distributionFixture} from './distribution-fixtures.mjs';
import {commonEvaluation} from './paired-evaluation.mjs';
const embed=(r,ablation=null)=>distributionEmbedding(fromReturns([r]).S0,{ablation});
function interval(delta){const rng=generator(19731),values=[];for(let i=0;i<5000;i++)values.push(mean(delta.map(()=>delta[Math.floor(rng.uniform()*delta.length)])));return {meanDelta:mean(delta),seedBootstrap95:[quantile(values,.025),quantile(values,.975)]};}
const retrieval=[];
for(const n of [10,30,60,120]){
 const records=[];
 for(let k=0;k<300;k++){
  const rng=generator(170111+997*k),a=Array.from({length:n-1},()=>.012*rng.normal()),same=a.map(x=>x+.0015*rng.normal()),corrupted=[...same],changed=a.map(x=>1.5*x+.005);corrupted[Math.floor(rng.uniform()*corrupted.length)]+=.25*(rng.uniform()>.5?1:-1);
  const target=embed(a),bad=embed(corrupted),other=embed(changed),legacy=(x,y)=>mean([...x].sort((a,b)=>a-b).map((v,i)=>Math.abs(v-[...y].sort((a,b)=>a-b)[i]))),fullDistance=distributionDistance(target,bad),changedDistance=distributionDistance(target,other);
  records.push({seed:170111+997*k,v2CorruptedDistance:fullDistance,v2ChangedDistance:changedDistance,v2SelectedCorrupted:+(fullDistance<changedDistance),legacySelectedCorrupted:+(legacy(a,corrupted)<legacy(a,changed)),uniformSelectedCorrupted:+(distributionDistance(embed(a,'uniform'),embed(corrupted,'uniform'))<distributionDistance(embed(a,'uniform'),embed(changed,'uniform')))});
 }
 const aggregate={n,seeds:records.length,v2Accuracy:mean(records.map(r=>r.v2SelectedCorrupted)),legacyAccuracy:mean(records.map(r=>r.legacySelectedCorrupted)),uniformAccuracy:mean(records.map(r=>r.uniformSelectedCorrupted)),paired:interval(records.map(r=>r.v2SelectedCorrupted-r.legacySelectedCorrupted)),records};retrieval.push(aggregate);console.log('retrieval '+JSON.stringify({...aggregate,records:undefined}));
}
const forecast=[];
for(const kind of ['null','volatility','tail-linked']){
 const pairs=[];
 for(let k=0;k<12;k++){
  const seed=270011+997*k,dataset=distributionFixture(seed,kind),methods={};
  for(const [id,options] of Object.entries({legacy:{distributionModel:'legacy'},v2:{},uniform:{distributionAblation:'uniform'},'no-transform':{distributionAblation:'no-transform'}}))methods[id]=(await tournament(makeEngine(dataset,'S0',options),['wasserstein']))[0].records;
  const result=commonEvaluation(methods);pairs.push({seed,n:result.n,mae:result.mae,unconditionalMAE:result.unconditionalMAE,zeroMAE:result.zeroMAE,coverage:result.coverage});
 }
 const aggregate={kind,seeds:pairs.length,origins:pairs.reduce((s,p)=>s+p.n,0),mae:Object.fromEntries(Object.keys(pairs[0].mae).map(k=>[k,mean(pairs.map(p=>p.mae[k]))])),unconditionalMAE:mean(pairs.map(p=>p.unconditionalMAE)),zeroMAE:mean(pairs.map(p=>p.zeroMAE)),paired:interval(pairs.map(p=>p.mae.v2-p.mae.legacy)),pairs};forecast.push(aggregate);console.log('forecast '+JSON.stringify({...aggregate,pairs:undefined}));
}
const stress=[],dataset=forecastFixture(13117,'switching',3000,12);
for(const length of [10,30,120]){const t=performance.now(),r=makeEngine(dataset,'S0').find(3000-length,2999,['wasserstein']);if(!r.rankings.wasserstein?.length||r.rankings.wasserstein.some(x=>!Number.isFinite(x.scores.wasserstein)))throw Error('Stress failed');stress.push({length,milliseconds:performance.now()-t,candidates:r.candidateCount,eligible:r.methodCandidateCount.wasserstein,neighbours:r.rankings.wasserstein.length});}
const report={model:DISTRIBUTION_MODEL,config:DISTRIBUTION_CONFIG,retrieval,forecast,stress,protocol:'All constants fixed before testing. Retrieval: 1200 paired synthetic windows, query plus small independent noise and one 25% log-return corruption versus a genuinely shifted/higher-risk distribution. This target explicitly treats the isolated jump as nuisance. Forecast: 36 separate-seed single-asset 1200-session histories, four variants, length 30, horizon 20, stride 20, six neighbours spaced by 50, candidate outcomes mature strictly before query start, common date intersection retained. Exploratory 5000-resample seed-cluster bootstrap. All generators and seeds reproducible; separate seeds do not establish unseen market robustness.',limitations:['Smooth compression suppresses magnitude information from real extreme losses as well as bad ticks.','Tail weights increase sampling noise, especially 9-return windows with only 1.8 tail observations.','No time order, multivariate dependence, volume or predicted-outcome uncertainty is modeled.','A fixed return unit changes sensitivity across volatility scales; it is not learned or scale invariant.','Short-window empirical tail means are descriptive, not calibrated risk forecasts.','Synthetic retrieval targets and tail-linked drift were constructed; no market alpha evidence.','Paired confidence intervals are exploratory and not multiple-comparison adjusted.']};
await writeFile('research/distribution-validation.json',JSON.stringify(report,null,2)+'\n');console.log('Saved research/distribution-validation.json');

