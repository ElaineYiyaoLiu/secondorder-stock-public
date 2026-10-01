import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/history.js';
import {sampleDataset} from '../public/data.js';
function response(){return {headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;}};}
test('Absent provider key returns 503 with no simulated provider bars',async()=>{
 const previous=process.env.TWELVE_DATA_API_KEY;delete process.env.TWELVE_DATA_API_KEY;
 try{const res=response();await handler({query:{symbol:'NVDA'}},res);assert.equal(res.code,503);assert.ok(res.data.error);assert.equal(res.data.rows,undefined);}finally{if(previous!==undefined)process.env.TWELVE_DATA_API_KEY=previous;}
});
test('Provider mapping validates history and never exposes its server-side key',async()=>{
 const previous=process.env.TWELVE_DATA_API_KEY,fetch=globalThis.fetch;process.env.TWELVE_DATA_API_KEY='test-only-provider-key';
 globalThis.fetch=async()=>({ok:true,json:async()=>({values:sampleDataset().NVDA.map(r=>({datetime:r.date,...Object.fromEntries(['open','high','low','close','volume'].map(k=>[k,String(r[k])]))}))})});
 try{const res=response();await handler({query:{symbol:'NVDA'}},res);assert.equal(res.code,200);assert.equal(res.data.rows.length,500);assert.equal(res.data.source,'twelve-data');assert.ok(!JSON.stringify(res.data).includes('test-only-provider-key'));}finally{globalThis.fetch=fetch;if(previous===undefined)delete process.env.TWELVE_DATA_API_KEY;else process.env.TWELVE_DATA_API_KEY=previous;}
});

