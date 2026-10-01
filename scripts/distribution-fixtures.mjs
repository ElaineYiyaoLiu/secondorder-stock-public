import {generator,fromReturns} from './relation-fixtures.mjs';
export function distributionFixture(seed,kind,n=1200){
 const rng=generator(seed),returns=[];
 for(let i=0;i<n-1;i++){
  const high=Math.floor(i/120)%2===0,noise=rng.normal();
  let r=kind==='null'?.012*noise:kind==='volatility'?(high?.026:.008)*noise:.012*noise;
  if(kind==='tail-linked'){
   // An intentionally constructed state-dependent drift, not market evidence.
   const jump=rng.uniform()<.08?(high?-.07:.07):0;
   r+=(high?.003:-.003)+jump;
  }
  returns.push(r);
 }
 return fromReturns([returns]);
}
