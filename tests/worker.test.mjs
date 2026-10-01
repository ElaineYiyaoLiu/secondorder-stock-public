import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleDataset} from '../public/data.js';
test('worker search and Lab return serializable v2 results; invalid requests report errors',async()=>{
 const messages=[];globalThis.self={postMessage:m=>messages.push(structuredClone(m))};
 try{
  await import('../public/worker.js');const dataset=sampleDataset();
  await self.onmessage({data:{dataset,symbol:'NVDA',ids:['euclidean','dtw','correlation','riemannian','wasserstein','topology','ultrametric','signature'],start:470,end:499}});
  assert.equal(messages.at(-1).type,'result');assert.equal(messages.at(-1).result.target.candle.model,'candle-euclidean-v2');
  assert.ok(messages.at(-1).result.rankings.euclidean.length>0);
  assert.equal(messages.at(-1).result.target.dtw.model,'price-path-dtw-v2');
  assert.ok(messages.at(-1).result.rankings.dtw.length>0);
  assert.equal(messages.at(-1).result.target.correlation.model,'asset-relationships-v2');
  assert.ok(messages.at(-1).result.rankings.correlation.length>0);
  assert.equal(messages.at(-1).result.target.riemannian.model,'market-state-spd-v2');
  assert.ok(messages.at(-1).result.rankings.riemannian.length>0);
  assert.equal(messages.at(-1).result.target.wasserstein.model,'return-distribution-v2');
  assert.ok(messages.at(-1).result.rankings.wasserstein.length>0);
  assert.equal(messages.at(-1).result.target.topology.model,'market-topology-v2');
  assert.ok(messages.at(-1).result.rankings.topology.length>0);
  assert.equal(messages.at(-1).result.target.ultrametric.model,'hierarchical-state-v2');
  assert.ok(messages.at(-1).result.rankings.ultrametric.length>0);
  assert.equal(messages.at(-1).result.target.signature.model,'path-order-signature-v2');
  assert.ok(messages.at(-1).result.rankings.signature.length>0);
  await self.onmessage({data:{task:'lab',dataset,symbol:'NVDA',ids:['euclidean','dtw','correlation','riemannian','wasserstein','topology','ultrametric','signature']}});
  assert.equal(messages.at(-1).type,'lab');assert.equal(messages.at(-1).result[0].n,11);assert.equal(messages.at(-1).result[1].n,11);assert.equal(messages.at(-1).result[2].n,11);
  await self.onmessage({data:{dataset,symbol:'NVDA',ids:['euclidean','dtw','correlation','riemannian','wasserstein','topology','ultrametric','signature'],start:470,end:499,k:0}});
  assert.equal(messages.at(-1).type,'error');
 }finally{delete globalThis.self;}
});
