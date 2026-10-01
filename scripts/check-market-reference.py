import json
from pathlib import Path
import numpy as np
data=json.loads(Path('research/market-reference-input.json').read_text())
cov_error=oas_error=distance_error=decomposition_error=0.
for case in data['cases']:
    order=sorted(range(len(case['symbols'])),key=lambda i:case['symbols'][i])
    r=np.diff(np.log([[row['close'] for row in case['basket'][i]] for i in order]),axis=1)
    center=np.median(r,axis=1,keepdims=True)
    scale=np.maximum(1e-6,1.482602218505602*np.median(np.abs(r-center),axis=1,keepdims=True))
    r=np.clip(r,center-4*scale,center+4*scale)
    r-=r.mean(axis=1,keepdims=True)
    p,m=r.shape
    empirical=r@r.T/m
    mu=np.trace(empirical)/p
    s=empirical/mu
    tr2=np.sum(s*s)
    den=(m+1-2/p)*(tr2-p)
    oas=1 if den<=1e-12 else min(1,max(0,((1-2/p)*tr2+p*p)/den))
    lam=max(.02,oas)
    cov=(1-lam)*empirical+lam*mu*np.eye(p)
    actual=case['result']
    cov_error=max(cov_error,float(np.max(np.abs(cov-np.array(actual['covariance'])))))
    oas_error=max(oas_error,abs(lam-actual['shrinkage']))
    assert np.linalg.eigvalsh(cov).min()>0
for case in data['matrices']:
    a,b=np.array(case['a']),np.array(case['b'])
    # Symmetric inverse square root oracle differs from JS Cholesky whitening.
    vals,vec=np.linalg.eigh(a)
    inv=(vec*vals**(-.5))@vec.T
    logs=np.log(np.linalg.eigvalsh(inv@b@inv))
    distance=float(np.linalg.norm(logs))
    volume=float((np.linalg.slogdet(b)[1]-np.linalg.slogdet(a)[1])/len(a))
    shape=float(np.std(logs))
    distance_error=max(distance_error,abs(distance-case['result']['distance']))
    decomposition_error=max(decomposition_error,abs(volume-case['result']['logVolumeRatio']),abs(shape-case['result']['shapeDistance']))
assert cov_error<1e-12 and oas_error<1e-10 and distance_error<1e-8 and decomposition_error<1e-8
report=dict(covarianceMaxAbsoluteError=cov_error,shrinkageMaxError=oas_error,distanceMaxError=distance_error,decompositionMaxError=decomposition_error,covarianceCases=len(data['cases']),matrixCases=len(data['matrices']))
Path('research/market-reference-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
