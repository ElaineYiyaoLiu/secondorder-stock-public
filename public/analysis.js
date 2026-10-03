import {relationEmbedding,relationHasEvidence} from './relationships.js';
import {marketEmbedding,marketComparison} from './market-state.js';
import {distributionEmbedding,distributionComparison} from './return-distribution.js';
import {signatureEmbedding} from './path-signature.js';
export const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
export const quantile=(a,p)=>{if(!a.length)return null;const s=[...a].sort((x,y)=>x-y),k=(s.length-1)*p,i=Math.floor(k);return s[i]+(s[Math.ceil(k)]-s[i])*(k-i);};
export const deviation=a=>{const m=mean(a);return Math.hypot(...a.map(x=>x-m))/Math.sqrt(a.length||1);};
export const logReturns=rows=>rows.slice(1).map((r,i)=>Math.log(r.close)-Math.log(rows[i].close));
export const status=(code,en,zh)=>({code,en,zh});
const limited=(en,zh)=>status('limited',en,zh);
const measured=()=>status('observed','Observed','已观察');
const unavailable=(en,zh)=>status('insufficient',en,zh);
const wrap=(id,summary,metrics,plot,evidence=measured(),extra={})=>({id,computed:true,summary,metrics,plot,evidence,...extra});
const metric=(en,zh,value,unit='number')=>({en,zh,value,unit});
const tr=r=>Math.log(r.high)-Math.log(r.low);
export function pathStats(rows){
 const r=logReturns(rows),logs=rows.map(x=>Math.log(x.close)),net=logs.at(-1)-logs[0],travel=r.reduce((s,x)=>s+Math.abs(x),0);
 let peak=logs[0],peakIndex=0,maxDrop=0,trough=0,dropPeak=0;
 for(let i=1;i<logs.length;i++){if(logs[i]>peak){peak=logs[i];peakIndex=i;}const drop=peak-logs[i];if(drop>maxDrop){maxDrop=drop;trough=i;dropPeak=peakIndex;}}
 const split=Math.floor(rows.length/2),slope=values=>{const xbar=(values.length-1)/2,ym=mean(values);return values.reduce((s,y,i)=>s+(i-xbar)*(y-ym),0)/values.reduce((s,_,i)=>s+(i-xbar)**2,0);};
 return {net,efficiency:travel?Math.abs(net)/travel:0,maxDrawdown:1-Math.exp(-maxDrop),dropPeak,trough,recovery:maxDrop?(logs.at(-1)-logs[trough])/maxDrop:null,earlySlope:slope(logs.slice(0,split)),lateSlope:slope(logs.slice(split)),volatility:deviation(r),returns:r,path:logs.map(x=>100*Math.expm1(x-logs[0]))};
}
function candles(rows){
 const body=rows.map(r=>(r.close-r.open)/Math.max(r.high-r.low,Number.MIN_VALUE)),upper=rows.map(r=>(r.high-Math.max(r.open,r.close))/Math.max(r.high-r.low,Number.MIN_VALUE)),lower=rows.map(r=>(Math.min(r.open,r.close)-r.low)/Math.max(r.high-r.low,Number.MIN_VALUE));
 const gaps=rows.slice(1).map((r,i)=>Math.log(r.open)-Math.log(rows[i].close)),scale=quantile(rows.map(tr),.5),largeGap=gaps.filter(x=>Math.abs(x)>scale).length;
 const u=mean(upper),l=mean(lower),b=mean(body),summary=u>l+.1?['Upper wicks occupy more of the daily range.','上影线占日内振幅的比例较大。']:l>u+.1?['Lower wicks occupy more of the daily range.','下影线占日内振幅的比例较大。']:Math.abs(b)>.15?[b>0?'Bodies lean upward within the session.':'Bodies lean downward within the session.',b>0?'日内实体整体偏向上涨。':'日内实体整体偏向下跌。']:['Bodies and wicks show mixed daily structure.','日内实体和影线结构较混合。'];
 return wrap('euclidean',summary,[metric('Median signed body / range','实体 / 振幅中位数',quantile(body,.5)*100,'percent'),metric('Large gaps / transitions','较大跳空 / 相邻日数',`${largeGap} / ${gaps.length}`,'text'),metric('Up bodies / sessions','阳线 / 日数',`${body.filter(x=>x>0).length} / ${rows.length}`,'text')],{kind:'candles',body,upper,lower,dates:rows.map(r=>r.date)},rows.length<20?limited('Few candles; structure is descriptive.','K 线较少，结构仅作描述。'):measured());
}
function pricePath(rows){
 const s=pathStats(rows),summary=s.efficiency>.55?[s.net>=0?'Most movement contributed to a net rise.':'Most movement contributed to a net fall.',s.net>=0?'大部分价格变化形成了净上涨。':'大部分价格变化形成了净下跌。']:['Much of the movement reversed within the period.','区间内较多价格变化发生了往返。'];
 return wrap('dtw',summary,[metric('Net change','区间涨跌',100*Math.expm1(s.net),'percent'),metric('Path efficiency','路径效率',s.efficiency*100,'percent'),metric('Maximum drawdown','最大回撤',s.maxDrawdown*100,'percent')],{kind:'line',values:s.path,dates:rows.map(r=>r.date)},rows.length<20?limited('Short period; segment slopes are unstable.','区间较短，分段斜率不稳定。'):measured(),{stats:s});
}
// Joint circular-block resampling preserves cross-asset observations. Fixed seeds
// are diagnostics, never fitted thresholds or statistical confidence guarantees.
export function resampleBasket(basket,seed=1){
 const n=basket[0].length,m=n-1,block=Math.max(2,Math.round(Math.sqrt(m))),indices=[];let x=seed>>>0;
 const next=()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296;};
 while(indices.length<m){const start=Math.floor(next()*m);for(let j=0;j<block&&indices.length<m;j++)indices.push((start+j)%m);}
 return basket.map(rows=>{const r=logReturns(rows);let log=Math.log(rows[0].close);return rows.map((row,i)=>{if(i)log+=r[indices[i-1]];const close=Math.exp(log);if(!Number.isFinite(close)||close<=0)throw Error('Resampled path exceeds numeric range.');return {date:row.date,open:close,high:close,low:close,close,volume:row.volume};});});
}
export function relationshipAnalysis(basket,symbols){
 const r=relationEmbedding(basket,symbols);if(!r.available)return wrap('correlation',['Relationships are undefined for these data.','当前数据无法估计资产关系。'],[],null,unavailable('Too little return variation in '+r.invalidAssets.join(', '),'资产收益变化不足：'+r.invalidAssets.join('、')),{representation:r});
 const edges=[];for(let i=0;i<r.symbols.length;i++)for(let j=i+1;j<r.symbols.length;j++)edges.push({a:r.symbols[i],b:r.symbols[j],linear:r.linear[i][j],rank:r.rank[i][j]});
 edges.sort((a,b)=>Math.abs(b.linear)-Math.abs(a.linear));
 const spreads=[];for(let k=0;k<12;k++){try{const v=relationEmbedding(resampleBasket(basket,101+k),symbols);if(v.available)spreads.push(mean(v.linear.flatMap((row,i)=>row.slice(i+1).map((x,j)=>Math.abs(x-r.linear[i][i+j+1])))));}catch{}}
 const spread=quantile(spreads,.9),informative=relationHasEvidence(r),evidence=!informative?unavailable('Relationships collapse to the prior; specific links are unsupported.','资产关系完全收缩，具体关联证据不足。'):r.n<30||spread===null||spread>.15?limited('Links vary under block resampling; interpret cautiously.','分块重采样下关系不稳定，请谨慎解释。'):measured();
 return wrap('correlation',informative?['The strongest estimated pair is '+edges[0].a+' / '+edges[0].b+'.','估计关联最强的资产对为 '+edges[0].a+' / '+edges[0].b+'。']:['The data do not resolve specific asset links.','当前数据不足以区分具体资产关联。'],[metric('Strongest pair correlation','最强资产对相关',informative?edges[0].linear:null),metric('Linear / rank shrinkage','线性 / 排名收缩',`${r.shrinkage.linear.toFixed(2)} / ${r.shrinkage.rank.toFixed(2)}`,'text'),metric('Resampling sensitivity','重采样敏感度',spread)],{kind:'matrix',matrix:r.linear,symbols:r.symbols},evidence,{representation:r,edges,stability:{replicates:spreads.length,meanEdgeDifferenceP90:spread}});
}
export function riskAnalysis(basket,symbols,previous=null){
 const r=marketEmbedding(basket,symbols);if(!r.available)return wrap('riemannian',['Risk allocation cannot be estimated.','无法估计风险分配。'],[],null,unavailable('Too little return variation in '+r.invalidAssets.join(', '),'资产收益变化不足：'+r.invalidAssets.join('、')),{representation:r});
 const p=r.symbols.length,weights=Array(p).fill(1/p),marginal=r.covariance.map(row=>row.reduce((s,x,j)=>s+x*weights[j],0)),variance=mean(marginal),daily=Math.sqrt(Math.max(0,variance)),contributions=marginal.map((x,i)=>variance?weights[i]*x/variance:0),raw=basket.map(logReturns),rawReturns=raw[0].map((_,i)=>mean(raw.map(s=>s[i]))),rawRisk=deviation(rawReturns),fully=r.shrinkage===1;
 let change=null;if(previous){const before=marketEmbedding(previous,symbols);if(before.available)change=marketComparison(before,r);}
 const top=contributions.indexOf(Math.max(...contributions));
 return wrap('riemannian',fully?['Overall movement is observable; risk allocation is dominated by the prior.','可观察整体波动，风险分配主要由先验决定。']:['In the equal-weight basket, '+r.symbols[top]+' has the largest estimated risk contribution.','等权资产组中，'+r.symbols[top]+' 的估计风险贡献最大。'],[metric('Raw equal-weight daily volatility','原始等权日波动',rawRisk*100,'percent'),metric('Regularized daily volatility','收缩估计日波动',daily*100,'percent'),metric('Adjacent-window SPD distance','相邻窗口黎曼距离',change?.normalized??null)],{kind:'bars',labels:r.symbols,values:contributions.map(x=>x*100)},fully?limited('Covariance fully shrunk; asset risk contributions lack evidence.','协方差完全收缩，资产风险贡献证据不足。'):r.n<30?limited('Short covariance window; risk allocation is uncertain.','协方差窗口较短，风险分配不确定。'):measured(),{representation:r,weights,contributions,rawDailyVolatility:rawRisk,regularizedDailyVolatility:daily,change,comparisonAvailable:!!change});
}
function distribution(rows,previous){
 const d=distributionEmbedding(rows),s=d.summary,change=previous?distributionComparison(distributionEmbedding(previous),d):null;
 const ordered=d.logReturns.map(x=>100*Math.expm1(x)),evidence=s.tailObservations<10?limited('Few tail observations; tail values describe this sample only.','尾部观测较少，仅描述当前样本。'):measured();
 return wrap('wasserstein',['The distribution shows the size and asymmetry of observed daily moves.','分布展示已发生的日收益幅度与不对称性。'],[metric('Daily volatility','日波动',s.dailyRisk*100,'percent'),metric('Worst 20% mean log return','最差 20% 平均对数收益',s.lowerTailMean*100,'percent'),metric('Best 20% mean log return','最好 20% 平均对数收益',s.upperTailMean*100,'percent')],{kind:'distribution',values:ordered},evidence,{representation:d,tailMass:s.tailObservations,change,comparisonAvailable:!!previous});
}
export function multiscaleAnalysis(history){
 const scales=[20,60,120].map(n=>{if(history.length<n)return {n,available:false};const s=pathStats(history.slice(-n)),signal=mean(s.returns)*Math.sqrt(n-1)/Math.max(.001,s.volatility),direction=signal>.5?'up':signal<-.5?'down':'mixed',boundary=Math.min(Math.abs(signal-.5),Math.abs(signal+.5));return {n,available:true,net:100*Math.expm1(s.net),risk:100*s.volatility,direction,boundary,signal};});
 const available=scales.filter(s=>s.available),directions=new Set(available.map(s=>s.direction)),boundary=available.some(s=>s.boundary<.15);
 return wrap('ultrametric',available.length<2?['More history is needed to compare time scales.','需要更多历史才能比较时间尺度。']:directions.size===1?['Available time scales share the same descriptive direction.','可用时间尺度的描述方向一致。']:['Shorter and longer time scales describe different states.','较短与较长时间尺度呈现不同状态。'],available.map(s=>metric(s.n+'D net change',s.n+' 日涨跌',s.net,'percent')),{kind:'scales',scales},available.length<2?unavailable('Fewer than two complete scales.','完整时间尺度不足两个。'):boundary?limited('A state is near a classification boundary.','某个状态接近分类边界。'):measured(),{scales,derived:true,contextBars:history.length});
}
function pathOrder(rows){
 const s=signatureEmbedding(rows),segments=Array.from({length:4},(_,i)=>{const a=Math.floor(i*(rows.length-1)/4),b=Math.floor((i+1)*(rows.length-1)/4),part=rows.slice(a,b+1);return {from:part[0].date,to:part.at(-1).date,change:100*Math.expm1(Math.log(part.at(-1).close)-Math.log(part[0].close)),medianVolume:quantile(part.map(r=>r.volume),.5),area:s.blocks[i+3][7]};});
 const usable=rows.filter(r=>r.volume>0).length,constantVolume=rows.every(r=>r.volume===rows[0].volume),constantPrice=rows.every(r=>r.close===rows[0].close),peakVolume=rows.reduce((best,r,i)=>r.volume>rows[best].volume?i:best,0),peakPrice=rows.reduce((best,r,i)=>r.close>rows[best].close?i:best,0),summary=constantVolume&&usable===rows.length?['Volume is constant; no distinct volume event can be identified.','成交量恒定，无法识别独立的成交量事件。']:constantPrice?['Closing prices are constant; price event order is unresolved.','收盘价恒定，无法区分价格事件顺序。']:usable<rows.length?['Volume coverage is incomplete; order features need caution.','成交量覆盖不完整，顺序特征需谨慎解释。']:peakVolume===peakPrice?['The largest volume and highest close occur on the same day.','最大成交量与最高收盘价发生在同一天。']:peakVolume<peakPrice?['The largest volume occurs before the highest close in this period.','区间内最大成交量发生在最高收盘价之前。']:['The largest volume occurs after the highest close in this period.','区间内最大成交量发生在最高收盘价之后。'];
 return wrap('signature',summary,[metric('First maximum volume date','首个成交量最大值日',usable&&!constantVolume?rows[peakVolume].date:null,'text'),metric('First highest close date','首个最高收盘价日',rows[peakPrice].date,'text'),metric('Usable volume / sessions','有效成交量 / 日数',`${usable} / ${rows.length}`,'text')],{kind:'segments',segments,price:rows.map(r=>100*Math.expm1(Math.log(r.close)-Math.log(rows[0].close))),volume:rows.map(r=>r.volume)},constantVolume||constantPrice?limited('Too little price or volume variation to interpret event order.','价格或成交量变化不足，无法解释事件顺序。'):usable<rows.length?limited('Incomplete volume; price-volume order evidence is limited.','成交量不完整，价量顺序证据有限。'):limited('Exploratory order description; signed areas do not establish causality.','探索性顺序描述；有向面积不证明因果关系。'),{signature:s,segments});
}
export function analyzePeriod(rows,history,basket,symbols,previousRows,previousBasket,ids){
 return ids.map(id=>{
  if(['correlation','riemannian'].includes(id)&&!basket)return wrap(id,['Aligned basket data are unavailable.','缺少对齐的资产组数据。'],[],null,unavailable('Load 3–12 assets covering every selected date.','请载入覆盖全部选中日期的 3–12 个资产。'));
  if(id==='euclidean')return candles(rows);
  if(id==='dtw')return pricePath(rows);
  if(id==='correlation')return relationshipAnalysis(basket,symbols);
  if(id==='riemannian')return riskAnalysis(basket,symbols,previousBasket);
  if(id==='wasserstein')return distribution(rows,previousRows);
  if(id==='ultrametric')return multiscaleAnalysis(history);
  if(id==='signature')return pathOrder(rows);
  throw Error('Unknown analysis model.');
 });
}
