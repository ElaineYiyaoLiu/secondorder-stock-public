import json,itertools
from pathlib import Path
import numpy as np
from scipy.optimize import linear_sum_assignment
from scipy.stats import rankdata
data=json.loads(Path('research/topology-reference-input.json').read_text())
def rank(columns):
    pivot={}
    for x in columns:
        while x:
            k=x.bit_length()-1
            if k not in pivot:pivot[k]=x;break
            x^=pivot[k]
    return len(pivot)
def cycles(edge_ids,edges):
    pivot={};basis=[]
    for e in edge_ids:
        i,j=edges[e];x=(1<<i)|(1<<j);combo=1<<e
        while x:
            k=x.bit_length()-1
            if k not in pivot:pivot[k]=(x,combo);break
            y,c=pivot[k];x^=y;combo^=c
        if not x:basis.append(combo)
    return basis
# Independent persistent-rank oracle using Z_1(s) and B_1(t), rather than
# pairing birth/death columns. rank(im H(s)->H(t))=rank([Z(s),B(t)])-rank(B(t)).
persistent_checks=0
for case in data['complexes']:
    d=case['d'];p=len(d);edges=list(itertools.combinations(range(p),2));edge_index={e:i for i,e in enumerate(edges)}
    levels=sorted({0.,*[d[i][j] for i,j in edges]})
    boundaries={};cycle_basis={};components={}
    for t in levels:
        active=[e for e,(i,j) in enumerate(edges) if d[i][j]<=t]
        components[t]=p-rank([(1<<edges[e][0])|(1<<edges[e][1]) for e in active])
        cycle_basis[t]=cycles(active,edges)
        boundaries[t]=[(1<<edge_index[(i,j)])|(1<<edge_index[(i,k)])|(1<<edge_index[(j,k)]) for i,j,k in itertools.combinations(range(p),3) if max(d[i][j],d[i][k],d[j][k])<=t]
    for s in levels:
        for t in levels:
            if t<s:continue
            expected=[components[t],rank(cycle_basis[s]+boundaries[t])-rank(boundaries[t])]
            actual=[1+sum(b<=s and death>t for b,death in case['diagrams'][0]),sum(b<=s and death>t for b,death in case['diagrams'][1])]
            assert actual==expected,(p,s,t,actual,expected)
            persistent_checks+=2
assignment_error=distance_error=0.
for case in data['assignments']:
    a,b=case['a'],case['b'];n,m=len(a),len(b);size=n+m
    if not size:expected=0.
    else:
        c=np.full((size,size),np.inf);c[n:,m:]=0
        for i,x in enumerate(a):
            c[i,m+i]=((x[1]-x[0])/2)**2
            for j,y in enumerate(b):c[i,j]=max(abs(x[0]-y[0]),abs(x[1]-y[1]))**2
        for j,y in enumerate(b):c[n+j,j]=((y[1]-y[0])/2)**2
        rows,cols=linear_sum_assignment(c);expected=float(np.sqrt(c[rows,cols].sum()))
    assignment_error=max(assignment_error,abs(expected-case['distance']))
for case in data['windows']:
    order=sorted(range(len(case['symbols'])),key=lambda i:case['symbols'][i]);r=np.diff(np.log([[x['close'] for x in case['basket'][i]] for i in order]),axis=1)
    med=np.median(r,axis=1,keepdims=True);scale=np.maximum(1e-6,1.482602218505602*np.median(abs(r-med),axis=1,keepdims=True))
    for name,x in [('linear',np.clip(r,med-4*scale,med+4*scale)),('rank',np.array([rankdata(row,method='average') for row in r]))]:
        corr=np.corrcoef(x);expected=np.sqrt(np.maximum(0,2*(1-corr)));np.fill_diagonal(expected,0)
        distance_error=max(distance_error,float(abs(expected-np.array(case['result'][name+'Distances'])).max()))
assert assignment_error<1e-10 and distance_error<1e-6
report=dict(complexes=len(data['complexes']),persistentRankChecks=persistent_checks,assignments=len(data['assignments']),assignmentMaxError=assignment_error,correlationDistanceMaxError=distance_error,oracle='GF2 persistent ranks via cycle/boundary intersections; SciPy assignment; NumPy robust and tied-rank correlations',ripserValidated=False)
Path('research/topology-reference-check.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
