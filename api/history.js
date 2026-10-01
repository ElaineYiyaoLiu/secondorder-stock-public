import {stocks} from '../public/market.js';
import {validateDataset,BASKET} from '../public/data.js';
const cache=new Map();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 const symbol=String(req.query?.symbol||'NVDA').toUpperCase();
 if(!stocks.some(s=>s.symbol===symbol))return res.status(400).json({error:'Unsupported ticker.'});
 const symbols=req.query?.basket==='1'?[...new Set([symbol,...BASKET])]:[symbol];
 const key=process.env.TWELVE_DATA_API_KEY,cacheKey=symbols.join(',')+(key?'direct':'shared');
 const hit=cache.get(cacheKey);if(hit&&hit.until>Date.now())return res.json(hit.data);
 try{
  const dataset={};
  for(const ticker of symbols){
   let rows;
   if(key){
    const url=new URL('https://api.twelvedata.com/time_series');
    Object.entries({symbol:ticker,interval:'1day',outputsize:'1500',order:'ASC',adjust:'all',apikey:key}).forEach(([k,v])=>url.searchParams.set(k,v));
    const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();
    const data=await response.json();if(!Array.isArray(data.values))throw Error();
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    rows=data.values.map(r=>({date:r.datetime,open:+r.open,high:+r.high,low:+r.low,close:+r.close,volume:+r.volume})).filter(r=>r.date<today).sort((a,b)=>a.date.localeCompare(b.date));
   }else{
    const response=await fetch('https://markets.secondorder.tools/api/market?symbol='+encodeURIComponent(ticker),{signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw Error();const data=await response.json();
    if(data.source!=='twelve-data')return res.status(503).json({code:'provider-not-configured',error:'The shared Twelve Data connection is not configured or unavailable. Import an OHLCV CSV, or configure TWELVE_DATA_API_KEY on this project. No sample data was imported.'});
    if(data.symbol!==ticker)throw Error();rows=data.rows;
   }
   dataset[ticker]=rows;
  }
  validateDataset(dataset);
  if(symbols.length>1){const dates=dataset[symbol].map(r=>r.date);if(symbols.some(s=>dataset[s].length!==dates.length||dataset[s].some((r,i)=>r.date!==dates[i])))return res.status(422).json({code:'unaligned-basket',error:'Asset dates do not align. Import a CSV with identical trading dates for all assets.'});}
  const result={symbol,rows:dataset[symbol],dataset,source:'twelve-data',connection:key?'direct':'shared-markets',asOf:dataset[symbol].at(-1).date,adjustment:key?'all':'provider-default'};
  cache.set(cacheKey,{until:Date.now()+900000,data:result});return res.json(result);
 }catch{return res.status(502).json({code:'provider-unavailable',error:'Market history is unavailable or invalid. Your current dataset has been kept.'});}
}
