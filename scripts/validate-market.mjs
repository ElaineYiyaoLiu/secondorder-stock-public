import {writeFile} from 'node:fs/promises';
import {makeEngine,tournament,mean,quantile} from '../public/engine.js';
import {marketEmbedding,MARKET_CONFIG,MARKET_MODEL} from '../public/market-state.js';
import {estimationFixture,forecastFixture,fromReturns,generator} from './relation-fixtures.mjs';
import {commonEvaluation} from './paired-evaluation.mjs';
const error=(a,b)=>a.flat().reduce((s,x,i)=>s+(x-b.flat()[i])**2,0)/b.flat().reduce((s,x)=>s+x*x,0);
function interval(delta){const rng=generator(19173),samples=[];for(let k=0;k<5000;k++)samples.push(mean(delta.map(()=>delta[Math.floor(rng.uniform()*delta.length)])));return {meanDelta:mean(delta),seedBootstrap95:[quantile(samples,.025),quantile(samples,.975)]};}
const estimation=[];
for(const kind of ['independent','factor','contaminated'])for(const n of [10,30,60,120]){
 const records=[];
 for(let k=0;k<100;k++){
  const seed=17011+k*997,{dataset,truth}=estimationFixture(seed,kind,n),basket=Object.values(dataset),symbols=Object.keys(dataset),scales=symbols.map((_,i)=>.015*(.65+.15*i));
  const scaled=fromReturns(basket.map((rows,j)=>rows.slice(1).map((r,i)=>(Math.log(r.close)-Math.log(rows[i].close))*(scales[j]/.015)))),target=truth.map((r,i)=>r.map((v,j)=>v*scales[i]*scales[j]));
  const full=marketEmbedding(Object.values(scaled),symbols),noWinsor=marketEmbedding(Object.values(scaled),symbols,{ablation:'no-winsor'}),fixed=marketEmbedding(Object.values(scaled),symbols,{ablation:'fixed-shrink'}),legacy=makeEngine(scaled,'S0',{marketModel:'legacy'}).get(0,n-1).riemannian;
  records.push({seed,legacyError:error(legacy,target),v2Error:error(full.covariance,target),noWinsorError:error(noWinsor.covariance,target),fixedError:error(fixed.covariance,target),shrinkage:full.shrinkage,riskRatio:full.averageVariance/mean(target.map((r,i)=>r[i]))});
 }
 const aggregate={kind,n,seeds:records.length,...Object.fromEntries(Object.keys(records[0]).filter(k=>k!=='seed').map(k=>[k,mean(records.map(r=>r[k]))])),paired:interval(records.map(r=>r.v2Error-r.legacyError)),records};estimation.push(aggregate);console.log('estimation '+JSON.stringify({...aggregate,records:undefined}));
}
const forecast=[];
for(const kind of ['null','switching','linked-drift']){
 const pairs=[];
 for(let k=0;k<9;k++){
  const seed=190001+k*997,dataset=forecastFixture(seed,kind,1000),methods={};
  for(const [id,options] of Object.entries({legacy:{marketModel:'legacy'},v2:{},'no-winsor':{marketAblation:'no-winsor'},'fixed-shrink':{marketAblation:'fixed-shrink'}}))methods[id]=(await tournament(makeEngine(dataset,'S0',options),['riemannian']))[0].records;
  const paired=commonEvaluation(methods);pairs.push({seed,n:paired.n,mae:paired.mae,unconditionalMAE:paired.unconditionalMAE,zeroMAE:paired.zeroMAE,coverage:paired.coverage});
 }
 const aggregate={kind,seeds:pairs.length,origins:pairs.reduce((s,p)=>s+p.n,0),mae:Object.fromEntries(Object.keys(pairs[0].mae).map(k=>[k,mean(pairs.map(p=>p.mae[k]))])),unconditionalMAE:mean(pairs.map(p=>p.unconditionalMAE)),zeroMAE:mean(pairs.map(p=>p.zeroMAE)),paired:interval(pairs.map(p=>p.mae.v2-p.mae.legacy)),pairs};forecast.push(aggregate);console.log('forecast '+JSON.stringify({...aggregate,pairs:undefined}));
}
const stress=[],dataset=forecastFixture(1117,'switching',3000,12);
for(const length of [10,30,120]){const start=3000-length,engine=makeEngine(dataset,'S0'),t=performance.now(),r=engine.find(start,2999,['riemannian']);if(!r.rankings.riemannian?.length||r.rankings.riemannian.some(c=>!Number.isFinite(c.scores.riemannian)))throw Error('Stress search failed');stress.push({length,milliseconds:performance.now()-t,candidates:r.candidateCount,eligible:r.methodCandidateCount.riemannian,neighbours:r.rankings.riemannian.length});}
const report={model:MARKET_MODEL,config:MARKET_CONFIG,estimation,forecast,stress,protocol:'Fixed constants before evaluation. 1200 six-asset Gaussian estimation windows with heterogeneous marginal variances; contaminated loss targets latent clean covariance. Forecast: 27 six-asset histories of 1000 sessions, four variants, 30-session query, 20-session horizon, stride 20, six nonoverlapping neighbours, fully mature candidates strictly before query start. All comparisons use shared date origins; exploratory 5000-resample seed-cluster bootstrap. Separate forecasting seeds share inherited generators and are not market validation.',limitations:['Winsorization and OAS spherical shrinkage are not affine-equivariant estimators.','OAS after clipping is a heuristic regularizer, not a Gaussian oracle guarantee.','A covariance state has no drift, time order or tail-distribution channel.','Spherical prior can erase heterogeneity or weak relationships; robust clipping can hide real crashes.','Synthetic results cannot establish market predictive advantage.','Minimum shrinkage and risk floors are fixed design choices, not fitted parameters.','Seed confidence intervals are exploratory and not multiple-comparison adjusted.']};
await writeFile('research/market-validation.json',JSON.stringify(report,null,2)+'\n');console.log('Saved research/market-validation.json');
