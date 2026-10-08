import {stocks} from '../public/market.js';
import {validateDataset,BASKET,validCandle} from '../public/data.js';
export const config={maxDuration:60};
const cache=new Map(),pending=new Map();
const failure=(code,status=502,detail=null)=>Object.assign(Error(code),{code,status,detail});
const errors={
 'provider-not-configured':'Configure MARKETSTACK_API_KEY in the Production environment, then redeploy.',
 'provider-auth':'Marketstack rejected the API key. Check the saved Production key and redeploy.',
 'provider-plan':'Your Marketstack plan does not permit this HTTPS history request. Check account permissions or import CSV.',
 'provider-quota':'Marketstack request quota or rate limit reached. Try later or import CSV.',
 'provider-history':'Marketstack returned fewer than 10 aligned completed daily bars. Import an aligned CSV.',
 'provider-invalid-data':'Marketstack returned incomplete or invalid adjusted OHLCV. Your current data was kept.',
 'provider-timeout':'History request took too long. Choose a shorter range or import CSV.',
 'provider-unavailable':'Marketstack history is temporarily unavailable. Your current data was kept.'
};
async function load(symbols,key,years){
 const deadline=Date.now()+48000;
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const from=new Date(today+'T12:00:00Z');from.setUTCFullYear(from.getUTCFullYear()-years);
 const to=new Date(today+'T12:00:00Z');to.setUTCDate(to.getUTCDate()-1);
 const records=[],maps=Object.fromEntries(symbols.map(s=>[s,new Map()]));let offset=0,done=false;
 for(let page=0;page<40;page++){
  if(Date.now()>=deadline)throw failure('provider-timeout',504);
  const url=new URL('https://api.marketstack.com/v2/eod');
  Object.entries({access_key:key,symbols:symbols.join(','),date_from:from.toISOString().slice(0,10),date_to:to.toISOString().slice(0,10),sort:'DESC',limit:'1000',offset:String(offset)}).forEach(([k,v])=>url.searchParams.set(k,v));
  let response,data;try{response=await fetch(url,{signal:AbortSignal.timeout(Math.max(1,Math.min(12000,deadline-Date.now())))});data=await response.json();}catch(e){if(e.name==='TimeoutError'||Date.now()>=deadline)throw failure('provider-timeout',504);throw failure('provider-unavailable');}
  if(!response.ok||data.error){
   const code=String(data.error?.code||'');
   if(response.status===401||/access_key|authentication/.test(code))throw failure('provider-auth',401);
   if(response.status===429||/limit|quota/.test(code))throw failure('provider-quota',429);
   if(response.status===403||/restricted|https|function_access/.test(code))throw failure('provider-plan',403);
   throw failure('provider-unavailable');
  }
  if(!Array.isArray(data.data)||!data.pagination||data.pagination.offset!==offset||data.pagination.count!==data.data.length||!Number.isSafeInteger(data.pagination.total)||data.pagination.total<offset+data.data.length)throw failure('provider-invalid-data',502,{stage:'pagination',offset:Number(data.pagination?.offset),expectedOffset:offset,count:Number(data.pagination?.count),records:data.data?.length,total:Number(data.pagination?.total)});
  records.push(...data.data);offset+=data.data.length;
  if(offset>=data.pagination.total){done=true;break;}
  if(!data.data.length)throw failure('provider-invalid-data');
 }
 if(!done)throw failure('provider-invalid-data',502,{stage:'pagination-bound'});
 const fields=['open','high','low','close','volume'];
 const excludedRows=Object.fromEntries(symbols.map(s=>[s,0]));
 const usable=records.filter(r=>{if(!symbols.includes(r.symbol))throw failure('provider-invalid-data',502,{stage:'unexpected-symbol'});const ok=fields.every(f=>r[f]!==null&&r[f]!==undefined&&r[f]!==''&&Number.isFinite(Number(r[f])))&&typeof r.date==='string'&&validCandle({date:r.date.slice(0,10),...Object.fromEntries(fields.map(f=>[f,Number(r[f])]))});if(!ok)excludedRows[r.symbol]++;return ok;});
 const adjusted=usable.length>0&&usable.every(r=>fields.every(f=>r['adj_'+f]!==null&&r['adj_'+f]!==undefined&&r['adj_'+f]!==''&&Number.isFinite(Number(r['adj_'+f])))&&validCandle({date:r.date.slice(0,10),...Object.fromEntries(fields.map(f=>[f,Number(r['adj_'+f])]))}));
 for(const record of usable){
  if(!symbols.includes(record.symbol)||typeof record.date!=='string')throw failure('provider-invalid-data',502,{stage:'unexpected-symbol-or-date'});
  const date=record.date.slice(0,10);if(date>=today)continue;
  const prefix=adjusted?'adj_':'';
  if(fields.some(f=>record[prefix+f]===null||record[prefix+f]===undefined||record[prefix+f]===''))throw failure('provider-invalid-data',502,{stage:'missing-OHLCV-fields'});
  const row={date,...Object.fromEntries(fields.map(f=>[f,Number(record[prefix+f])]))};
  if(!validCandle(row))throw failure('provider-invalid-data',502,{stage:'invalid-adjusted-bar',open:row.open,high:row.high,low:row.low,close:row.close,volume:row.volume});
  if(maps[record.symbol].has(date))throw failure('provider-invalid-data',502,{stage:'duplicate-date'});
  maps[record.symbol].set(date,row);
 }
 const dates=[...maps[symbols[0]].keys()].filter(d=>symbols.every(s=>maps[s].has(d))).sort();
 if(dates.length<10)throw failure('provider-history',422,{usableBars:Object.fromEntries(symbols.map(s=>[s,maps[s].size])),excludedRows,alignedBars:dates.length});
 const dataset=Object.fromEntries(symbols.map(s=>[s,dates.map(d=>maps[s].get(d))]));validateDataset(dataset);
 return {dataset,source:'marketstack',connection:'direct',asOf:dates.at(-1),adjustment:adjusted?'all':'unadjusted',aligned:true,historyDays:365*years,requestedYears:years,actualStart:dates[0],actualEnd:dates.at(-1),actualBars:dates.length,historyCoverage:dates[0]>new Date(from.getTime()+60*86400000).toISOString().slice(0,10)?'limited':'requested-range',excludedRows,droppedRows:Object.fromEntries(symbols.map(s=>[s,maps[s].size-dates.length]))};
}
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
 const symbol=String(req.query?.symbol||'NVDA').toUpperCase();
 if(!stocks.some(s=>s.symbol===symbol))return res.status(400).json({error:'Unsupported ticker.'});
 const years=Number(req.query?.years??3);if(![1,3,5,10].includes(years))return res.status(400).json({error:'Choose a history range of 1, 3, 5 or 10 years.'});
 const key=process.env.MARKETSTACK_API_KEY;
 if(!key)return res.status(503).json({code:'provider-not-configured',error:errors['provider-not-configured']});
 const symbols=req.query?.basket==='1'?[...new Set([...BASKET,symbol])].sort():[symbol],cacheKey=years+':'+symbols.join(',');
 try{
  let data=cache.get(cacheKey);if(!data||data.until<Date.now()){
   let request=pending.get(cacheKey);
   if(!request){request=load(symbols,key,years);pending.set(cacheKey,request);}
   try{const result=await request;data={until:Date.now()+21600000,result};cache.set(cacheKey,data);}finally{if(pending.get(cacheKey)===request)pending.delete(cacheKey);}
  }
  res.setHeader('Vercel-CDN-Cache-Control','public, s-maxage=21600');
  return res.json({...data.result,symbol,rows:data.result.dataset[symbol]});
 }catch(e){return res.status(e.status||502).json({code:errors[e.code]?e.code:'provider-unavailable',error:errors[e.code]||errors['provider-unavailable'],...(e.detail?{detail:e.detail}:{})});}
}

