import json
from pathlib import Path
import numpy as np
from scipy.stats import wasserstein_distance
data=json.loads(Path('research/distribution-reference-input.json').read_text())
def conditional(a,b,lo,hi):
    def tail(x):
        s=np.sort(x);n=len(s)
        mass=np.maximum(0,np.minimum(np.arange(1,n+1)/n,hi)-np.maximum(np.arange(n)/n,lo))
        return s[mass>0],mass[mass>0]
    a,wa=tail(a);b,wb=tail(b)
    return float(wasserstein_distance(a,b,wa,wb))
distance_error=channel_error=raw_error=summary_error=0.
for case in data['cases']:
    a,b=case['a'],case['b'];ra,rb=np.array(a['logReturns']),np.array(b['logReturns'])
    ta,tb=(ra/.01,rb/.01) if a['ablation']=='no-transform' else (np.arcsinh(ra/.01),np.arcsinh(rb/.01))
    channels=dict(bulk=float(wasserstein_distance(ta,tb)),lower=conditional(ta,tb,0,.2),upper=conditional(ta,tb,.8,1))
    weights=dict(bulk=1,lower=0,upper=0) if a['ablation']=='uniform' else dict(bulk=.6,lower=.2,upper=.2)
    expected=sum(channels[k]*weights[k] for k in channels)
    actual=case['result']
    distance_error=max(distance_error,abs(expected-actual['distance']))
    channel_error=max(channel_error,*[abs(channels[k]-actual['channels'][k]) for k in channels])
    raw_error=max(raw_error,abs(float(wasserstein_distance(ra,rb))-actual['rawW1']))
    # Signed tail means use independently derived empirical mass weights.
    for x in [a,b]:
        r=np.array(x['logReturns']);n=len(r)
        for key,lo,hi in [('lowerTailMean',0,.2),('upperTailMean',.8,1)]:
            w=np.maximum(0,np.minimum(np.arange(1,n+1)/n,hi)-np.maximum(np.arange(n)/n,lo))
            summary_error=max(summary_error,abs(float(np.dot(r,w)/sum(w))-x['summary'][key]))
for case in data['unequal']:
    a,b=case['a'],case['b']
    raw_error=max(raw_error,abs(float(wasserstein_distance(a,b))-case['w1']))
    channel_error=max(channel_error,abs(conditional(a,b,0,.2)-case['lower']),abs(conditional(a,b,.8,1)-case['upper']))
assert max(distance_error,channel_error,raw_error,summary_error)<1e-11
report=dict(modelCases=len(data['cases']),unequalSampleCases=len(data['unequal']),distanceMaxError=distance_error,channelMaxError=channel_error,rawW1MaxError=raw_error,tailSummaryMaxError=summary_error,oracle='SciPy weighted CDF transport, independently mass-truncated empirical tails')
Path('research/distribution-reference-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
