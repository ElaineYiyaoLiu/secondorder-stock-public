import json, math
from pathlib import Path
import numpy as np
src=json.loads(Path('research/signature-reference-input.json').read_text());pairs=[(i,j) for i in range(4) for j in range(i+1,4)];errors=dict(rawLogSignature=0.,windowBlocks=0.,vector=0.,anchors=0.)
def logsig(points):
    # Full tensor-signature Chen product; take tensor logarithm at degree 2.
    s1=np.zeros(4);s2=np.zeros((4,4))
    for dx in np.diff(np.asarray(points),axis=0):
        s2+=np.outer(s1,dx)+np.outer(dx,dx)/2;s1+=dx
    l2=s2-np.outer(s1,s1)/2
    return np.r_[s1,[l2[i,j] for i,j in pairs]]
for f in src['raw']:
    errors['rawLogSignature']=max(errors['rawLogSignature'],float(np.max(np.abs(logsig(f['points'])-f['expected']))))
for f in src['windows']:
    rows=f['rows'];n=len(rows);logs=np.log([r['close'] for r in rows]);positive=[math.log(r['volume']) for r in rows if r['volume']>0];center=np.median(positive) if positive else 0;t=np.linspace(0,1,n)
    pts=np.column_stack([t,np.arcsinh((logs-logs[0])/.01),[math.asinh(math.log(r['volume'])-center) if r['volume'] else 0 for r in rows],[int(r['volume']==0) for r in rows]])
    blocks=[]
    for count in [1,2,4]:
        for k in range(count):
            start,end=k/count,(k+1)/count;times=np.r_[start,t[(t>start)&(t<end)],end];path=np.column_stack([np.interp(times,t,pts[:,j]) for j in range(4)]);path[:,0]=0 if f['ablation']=='no-time' else (times-start)/(end-start);blocks.append(logsig(path))
    blocks=np.asarray(blocks);returns=np.diff(logs);realized=np.linalg.norm(returns)/math.sqrt(n-1);variation=np.linalg.norm(np.diff(pts[:,2]))/math.sqrt(n-1);anchors=np.array([math.log1p(realized/.01),math.log1p(variation),sum(r['volume']==0 for r in rows)/n]);vector=[]
    for i,block in enumerate(blocks):
        count=1 if i==0 else 2 if i<3 else 4;weight=(1 if i==0 else 0) if f['ablation']=='global-only' else {1:.4,2:.35,4:.25}[count]
        vector.extend(math.asinh(float(v))*math.sqrt(.85*weight/count*.5/(4 if j<4 else 6)) for j,v in enumerate(block))
    vector.extend(anchors*math.sqrt(.15/3));expected=f['expected'];errors['windowBlocks']=max(errors['windowBlocks'],float(np.max(np.abs(blocks-expected['blocks']))));errors['vector']=max(errors['vector'],float(np.max(np.abs(np.asarray(vector)-expected['vector']))));errors['anchors']=max(errors['anchors'],float(np.max(np.abs(anchors-expected['anchors']))))
assert max(errors.values())<1e-10,errors
report=dict(windowStates=len(src['windows']),rawPaths=len(src['raw']),maxErrors=errors,oracle='Full degree-2 tensor signature via Chen product; tensor logarithm, independent NumPy interpolation')
Path('research/signature-reference-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
