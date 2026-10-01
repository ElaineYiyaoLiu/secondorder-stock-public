import json, math
import numpy as np
from pathlib import Path
src=json.loads(Path('research/hierarchy-reference-input.json').read_text())
squash=lambda x:(1+math.tanh(x))/2
cuts=[[0]+[(lambda y:y/(1+y))(math.log1p(v/.01)) for v in [.005,.015,.04]]+[1],[0,squash(-.5),squash(.5),1],[0,.45,.55,1],[0,squash(-math.log(1.2)),squash(math.log(1.2)),1]]
paths=[];maxerr=0
for fixture in src['windows']:
    rows=fixture['rows'];n=len(rows);r=np.diff(np.log([v['close'] for v in rows]));center=np.median(r);limit=3*max(.001,1.4826*np.median(np.abs(r-center)),(np.quantile(r,.75)-np.quantile(r,.25))/1.349);robust=np.clip(r,center-limit,center+limit);drift=np.mean(robust);vol=np.std(robust);trend=drift*math.sqrt(n-1)/max(.001,vol)
    balance=np.median([(v['close']/v['high']-v['open']/v['high'])/(1-v['low']/v['high']) if v['high']!=v['low'] else 0 for v in rows]);positive=[math.log(v['volume']) for v in rows if v['volume']>0];vc=np.median(positive) if positive else 0;logs=[float(np.logaddexp(0,math.log(v['volume'])-vc)) if v['volume'] else 0 for v in rows];change=np.median(logs[n//2:])-np.median(logs[:n//2]);cover=0 if not positive else 2 if len(positive)==n else 1
    level=math.log1p(vol/.01);values=[level/(1+level),squash(trend),(1+balance)/2,squash(change)];coarse=[];bins=[]
    for x,c in zip(values,cuts):
        category=min(len(c)-2,int(np.searchsorted(c,x,side='right'))-1);coarse.append(category);bins.append(min(63,math.floor(64*max(0,min(1,(x-c[category])/(c[category+1]-c[category]))))))
    path=coarse[:];path[3]=3*coarse[3]+cover
    for bit in range(5,-1,-1):path.extend((b>>bit)&1 for b in bins)
    assert path==fixture['expected']['prefix'],(path,fixture['expected']['prefix'])
    for key,v in dict(volatility=vol,drift=drift,trend=trend,balance=balance,volumeChange=change).items():maxerr=max(maxerr,abs(float(v)-fixture['expected']['summary'][key]))
    paths.append(path)
for pair in src['pairs']:
    a,b=paths[pair['i']],paths[pair['j']];# Independent LCA: sets of all ancestor nodes.
    ancestors_a={tuple(a[:k]) for k in range(29)};ancestors_b={tuple(b[:k]) for k in range(29)};depth=max(map(len,ancestors_a & ancestors_b));distance=0 if depth==28 else math.exp2(-depth/4)
    assert abs(distance-pair['distance'])<1e-15
report=dict(windows=len(paths),pairs=len(src['pairs']),prefixMismatches=0,maxFeatureError=maxerr,distanceOracle='intersection of ancestor-node sets',implementation='Python NumPy independent embedding')
Path('research/hierarchy-reference-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
