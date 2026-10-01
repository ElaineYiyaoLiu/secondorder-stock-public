import {writeFile} from 'node:fs/promises';
import {marketEmbedding,spdComparison} from '../public/market-state.js';
import {estimationFixture,generator} from './relation-fixtures.mjs';
const cases=[];
for(const p of [3,6,12])for(const n of [10,30,120]){
 const dataset=estimationFixture(431+p+n,'contaminated',n,p).dataset,symbols=Object.keys(dataset),basket=Object.values(dataset);
 cases.push({symbols,basket,result:marketEmbedding(basket,symbols)});
}
const rng=generator(1919),matrices=[],mul=(a,b)=>a.map(r=>b[0].map((_,j)=>r.reduce((s,x,k)=>s+x*b[k][j],0))),tr=a=>a[0].map((_,j)=>a.map(r=>r[j]));
for(let k=0;k<100;k++){const p=1+k%12,make=()=>{const t=Array.from({length:p},()=>Array.from({length:p},()=>rng.normal()));return mul(t,tr(t)).map((r,i)=>r.map((x,j)=>x+(i===j?.05:0)));},a=make(),b=make();matrices.push({a,b,result:spdComparison(a,b)});}
await writeFile('research/market-reference-input.json',JSON.stringify({cases,matrices},null,2)+'\n');
