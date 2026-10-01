import {writeFile} from 'node:fs/promises';
import {distributionEmbedding,distributionComparison,empiricalW1} from '../public/return-distribution.js';
import {generator,fromReturns} from './relation-fixtures.mjs';
const rng=generator(991901),cases=[];
for(let k=0;k<300;k++){
 const make=n=>distributionEmbedding(fromReturns([Array.from({length:n},()=>rng.uniform()<.2?0:.02*rng.normal())]).S0,{ablation:k%3===0?'uniform':k%3===1?'no-transform':null}),a=make(9+k%111),b=make(9+(k*7)%111);
 cases.push({a,b,result:distributionComparison(a,b)});
}
const unequal=[];
for(let k=0;k<100;k++){const a=Array.from({length:1+k%31},()=>rng.normal()),b=Array.from({length:1+(k*7)%29},()=>rng.normal());unequal.push({a,b,w1:empiricalW1(a,b),lower:empiricalW1(a,b,{lower:0,upper:.2}),upper:empiricalW1(a,b,{lower:.8,upper:1})});}
await writeFile('research/distribution-reference-input.json',JSON.stringify({cases,unequal})+'\n');
