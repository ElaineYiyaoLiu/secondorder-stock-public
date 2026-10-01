import {writeFile} from 'node:fs/promises';import {ripsPersistence,diagramW2,topologyEmbedding} from '../public/topology.js';import {generator,estimationFixture} from './relation-fixtures.mjs';
const rng=generator(931791),complexes=[],assignments=[],windows=[];
for(let k=0;k<60;k++){const p=3+k%10,points=Array.from({length:p},()=>{const a=Array.from({length:5},()=>rng.normal()),norm=Math.hypot(...a);return a.map(x=>x/norm);}),d=points.map((a,i)=>points.map((b,j)=>i===j?0:Math.hypot(...a.map((x,l)=>x-b[l]))));complexes.push({d,diagrams:ripsPersistence(d)});}
for(let k=0;k<200;k++){const make=n=>Array.from({length:n},()=>{const birth=rng.uniform();return [birth,birth+rng.uniform()];}),a=make(k%9),b=make(k*7%9);assignments.push({a,b,distance:diagramW2(a,b)});}
for(const p of [3,6,12])for(const n of [10,30,120]){const dataset=estimationFixture(9181+p+n,'contaminated',n,p).dataset,symbols=Object.keys(dataset),basket=Object.values(dataset);windows.push({symbols,basket,result:topologyEmbedding(basket,symbols)});}
await writeFile('research/topology-reference-input.json',JSON.stringify({complexes,assignments,windows})+'\n');
