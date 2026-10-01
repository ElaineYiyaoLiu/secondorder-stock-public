import {stocks} from '../public/market.js';
import {validCandle} from '../public/data.js';
const cache=new Map();
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json');
 const symbol=String(req.query?.symbol||'NVDA').toUpperCase();
 if(!stocks.some(s=>s.symbol===symbol))return res.status(400).json({error:'Unsupported ticker.'});
 const key=process.env.TWELVE_DATA_API_KEY;
 if(!key)return res.status(503).json({error:'Market provider is not configured. Import an adjusted OHLCV CSV or use the labeled synthetic sample.'});
 const hit=cache.get(symbol);if(hit&&hit.until>Date.now())return res.json(hit.data);
 try{
  const url=new URL('https://api.twelvedata.com/time_series');
  Object.entries({symbol,interval:'1day',outputsize:'1500',order:'ASC',apikey:key}).forEach(([k,v])=>url.searchParams.set(k,v));
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error();
  const data=await response.json();if(!Array.isArray(data.values))throw Error();
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const rows=data.values.map(r=>({date:r.datetime,open:+r.open,high:+r.high,low:+r.low,close:+r.close,volume:+r.volume})).filter(r=>r.date<today).sort((a,b)=>a.date.localeCompare(b.date));
  if(rows.length<180||rows.some(r=>!validCandle(r))||new Set(rows.map(r=>r.date)).size!==rows.length)throw Error();
  const result={symbol,rows,source:'twelve-data',asOf:rows.at(-1).date,adjustment:'provider-default'};cache.set(symbol,{until:Date.now()+900000,data:result});return res.json(result);
 }catch{return res.status(502).json({error:'Market history is unavailable. Your current dataset has been kept.'});}
}

