"""SecondOrder Homology: deterministic, past-only research pipeline.
Run from project root. CSV input is date + 30–50 adjusted-close/total-return columns.
"""
from __future__ import annotations
import argparse, hashlib, json, platform
from pathlib import Path
import numpy as np
import pandas as pd
import scipy
from scipy.optimize import linear_sum_assignment
from ripser import ripser
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score, balanced_accuracy_score
import sklearn

WINDOWS = (20, 60, 120)
HORIZONS = {"direction": 5, "volatility": 20, "regime": 20}
MODEL_NAMES = ("baseline", "correlation", "homology")
SYMBOLS = ['NVDA','AMD','AVGO','TSM','ASML','MSFT','AAPL','GOOGL','META','AMZN','ORCL','CRM','ADBE','INTC','QCOM','MU','TXN','AMAT','LRCX','KLAC','JPM','BAC','GS','XOM','CVX','UNH','JNJ','PG','SPY','QQQ']


def demo_prices(n=1050, seed=20260930):
    rng = np.random.default_rng(seed)
    # No planted forecasting advantage: common and sector factors, independent innovations.
    common = rng.normal(0.0002, 0.006, n)
    sector = rng.normal(0, 0.007, (n, 4))
    noise = rng.normal(0, 0.01, (n, len(SYMBOLS)))
    returns = common[:, None] + sector[:, np.arange(len(SYMBOLS)) % 4] + noise
    return pd.DataFrame(100*np.exp(np.cumsum(returns, axis=0)),
                        index=pd.bdate_range(end='2025-06-30', periods=n), columns=SYMBOLS)


def validate_prices(frame, min_rows=600):
    frame = frame.copy()
    if not 30 <= frame.shape[1] <= 50:
        raise ValueError('Exactly 30–50 unique asset columns are required.')
    if frame.columns.duplicated().any() or any(not str(x).strip() or str(x) in ('__proto__','constructor','prototype') or len(str(x))>60 for x in frame.columns):
        raise ValueError('Asset names must be non-empty and unique.')
    frame.index = pd.to_datetime(frame.index, errors='raise')
    if frame.index.hasnans or frame.index.has_duplicates or not frame.index.is_monotonic_increasing:
        raise ValueError('Dates must be unique and strictly increasing; sorting silently is forbidden.')
    if (frame.index != frame.index.normalize()).any():
        raise ValueError('Use one completed daily observation per date.')
    today = pd.Timestamp.now(tz='America/New_York').date()
    if frame.index[-1].date() >= today:
        raise ValueError('Exclude the current New York session and future dates.')
    frame = frame.astype(float)
    if len(frame) < min_rows or len(frame) > 12000:
        raise ValueError(f'Provide {min_rows}–12000 aligned daily observations.')
    if not np.isfinite(frame.values).all() or (frame.values <= 0).any():
        raise ValueError('Prices must be positive and complete. No forward-fill or imputation is performed.')
    if (frame.pct_change().iloc[1:].abs() > 0.8).any().any():
        raise ValueError('Daily move exceeds 80%; check splits, adjustments and alignment.')
    if (frame.pct_change().iloc[1:].std() < 1e-10).any():
        raise ValueError('Constant assets cannot define correlation distance.')
    return frame


def metric(returns):
    r = np.asarray(returns, dtype=float)
    if r.ndim != 2 or r.shape[0] < 3 or not np.isfinite(r).all():
        raise ValueError('A finite observations × assets matrix is required.')
    if np.any(np.std(r, axis=0) < 1e-12):
        raise ValueError('A rolling window contains a constant asset.')
    corr = np.clip(np.corrcoef(r, rowvar=False), -1, 1)
    distances = np.sqrt(np.maximum(0, 2*(1-corr)))
    np.fill_diagonal(distances, 0)
    return corr, distances


def diagrams(distances):
    d = np.asarray(distances)
    if d.ndim != 2 or d.shape[0] != d.shape[1] or not np.isfinite(d).all() or np.min(d) < 0 or not np.allclose(d, d.T) or not np.allclose(np.diag(d), 0):
        raise ValueError('Invalid distance matrix.')
    raw = ripser(d, distance_matrix=True, maxdim=1, coeff=2)['dgms']
    # The one essential H0 class is excluded, never clipped to an arbitrary death.
    return [x[np.isfinite(x[:, 1]) & (x[:, 1] > x[:, 0]+1e-8)] for x in raw]


def wasserstein2(a, b):
    """W2 with Euclidean ground metric, exact diagonal-aware assignment."""
    a, b = np.asarray(a).reshape(-1, 2), np.asarray(b).reshape(-1, 2)
    n, m = len(a), len(b)
    if not n+m: return 0.0
    costs = np.full((n+m, n+m), np.inf)
    costs[:n, :m] = ((a[:, None, :]-b[None, :, :])**2).sum(axis=2)
    if n: costs[np.arange(n), m+np.arange(n)] = (a[:, 1]-a[:, 0])**2/2
    if m: costs[n+np.arange(m), np.arange(m)] = (b[:, 1]-b[:, 0])**2/2
    costs[n:, m:] = 0
    rows, cols = linear_sum_assignment(costs)
    return float(np.sqrt(costs[rows, cols].sum()))


def summaries(d):
    life = d[:, 1]-d[:, 0]
    total = float(life.sum())
    p = life/total if total else np.array([])
    return [float((life**2).sum()), total, float(life.max()) if len(life) else 0., float(-(p*np.log(p)).sum())]


def rolling_features(returns, progress=False):
    r = np.asarray(returns)
    topo, corr_features, snapshots, timeline = [], [], {}, []
    prev_d = {}; prev_v = {}; prev_energy = {}; prev_delta = {}; prev_corr = {}
    for t in range(max(WINDOWS)-1, len(r)):
        tf, cf, state = [], [], {}
        for w in WINDOWS:
            corr, distance = metric(r[t-w+1:t+1])
            dgms = diagrams(distance)
            off = corr[np.triu_indices(corr.shape[0], 1)]
            eig = np.linalg.eigvalsh(corr)
            cv = np.linalg.norm(corr-prev_corr[w])/len(corr) if w in prev_corr else 0.
            cf.extend([off.mean(), off.std(), eig[-1]/len(corr), (eig.sum()**2)/(eig@eig)/len(corr), cv])
            stats = []
            for k, d in enumerate(dgms):
                key = (w, k); summary = summaries(d)
                v = wasserstein2(d, prev_d[key]) if key in prev_d else 0.
                acceleration = v-prev_v.get(key, v)
                delta = summary[0]-prev_energy.get(key, summary[0])
                delta2 = delta-prev_delta.get(key, delta)
                tf.extend(summary+[v, acceleration, delta, delta2])
                stats.append(dict(energy=summary[0], total=summary[1], maximum=summary[2], entropy=summary[3], velocity=v, acceleration=acceleration, delta=delta, delta2=delta2, count=len(d)))
                prev_d[key] = d; prev_v[key] = v; prev_energy[key] = summary[0]; prev_delta[key] = delta
            state[str(w)] = {"h0":stats[0], "h1":stats[1], "meanCorrelation":float(off.mean())}
            snapshots[str(w)] = dict(distance=distance.tolist(), h0=dgms[0].tolist(), h1=dgms[1].tolist())
            prev_corr[w] = corr
        topo.append(tf); corr_features.append(cf); timeline.append(state)
        if progress and t % 200 == 0: print(f'PH {t}/{len(r)}', flush=True)
    # First two rows lack full derivative history. Exclude them from model inputs.
    return np.array(topo)[2:], np.array(corr_features)[2:], snapshots, timeline[2:]


def baseline_features(r, target):
    x = r[:, target]; result = []
    for t in range(max(WINDOWS)+1, len(r)):
        result.append([x[t], x[t-4:t+1].sum(), x[t-19:t+1].sum(), x[t-19:t+1].std(ddof=1)*np.sqrt(252), x[t-59:t+1].std(ddof=1)*np.sqrt(252), np.std(r[t])])
    return np.array(result)


def future_target(r, target, origins, task):
    h = HORIZONS[task]; x = r[:, target]
    y = np.full(len(origins), np.nan)
    for i, t in enumerate(origins):
        if t+h >= len(r): continue
        future = x[t+1:t+h+1]
        y[i] = float(future.sum() > 0) if task == 'direction' else float(np.sqrt(252*np.mean(future**2)))
    return y


def split_indices(origins, origin, h):
    # Strictly earlier availability than the first prediction's close.
    return np.flatnonzero(origins+h < origin)


def fit_model(x, y, task):
    if task == 'volatility':
        estimator = make_pipeline(StandardScaler(), Ridge(alpha=50.))
        estimator.fit(x, np.log(np.maximum(y, 1e-8)))
    elif len(np.unique(y)) < 2:
        return float((y.sum()+1)/(len(y)+2))
    else:
        estimator = make_pipeline(StandardScaler(), LogisticRegression(C=.05, max_iter=1000, random_state=0))
        estimator.fit(x, y)
    return estimator


def predict_model(model, x, task):
    if isinstance(model, float): return np.full(len(x), model)
    return np.exp(model.predict(x)) if task == 'volatility' else model.predict_proba(x)[:, 1]


def loss_vectors(y, p, task):
    if task == 'volatility':
        # QLIKE on annualized variance (constant rescaling leaves QLIKE unchanged).
        ratio = np.maximum(y**2, 1e-12)/np.maximum(p**2, 1e-12)
        return ratio-np.log(ratio)-1
    return (y-p)**2


def block_interval(delta, seed=42, block=20):
    rng = np.random.default_rng(seed); n=len(delta)
    if n < 40: return [None, None]
    sims=[]
    for _ in range(1000):
        starts=rng.integers(0,n,size=int(np.ceil(n/block)))
        idx=np.concatenate([(s+np.arange(block))%n for s in starts])[:n]
        sims.append(float(np.mean(delta[idx])))
    return [float(np.quantile(sims,.025)),float(np.quantile(sims,.975))]


def backtest(xs, y, origins, task, dates, min_train=252, step=20):
    horizon=HORIZONS[task]; rows=[]; folds=[]
    candidates=[i for i,t in enumerate(origins) if len(split_indices(origins,t,horizon))>=min_train and np.isfinite(y[i])]
    for start in range(candidates[0] if candidates else len(origins), len(origins)-horizon, step):
        train=split_indices(origins,origins[start],horizon)
        test=np.arange(start,min(start+step,len(origins)-horizon))
        if not len(test): continue
        threshold=float(np.quantile(y[train],.8)) if task=='regime' else None
        ytrain=(y[train]>threshold).astype(int) if task=='regime' else y[train]
        ytest=(y[test]>threshold).astype(int) if task=='regime' else y[test]
        ps=[predict_model(fit_model(x[train],ytrain,task),x[test],task) for x in xs]
        folds.append(dict(origin=str(dates[origins[start]]), trainEnd=str(dates[origins[train[-1]]]), labelEnd=str(dates[origins[train[-1]]+horizon]), trainCount=len(train), testCount=len(test), threshold=threshold))
        for j,i in enumerate(test):
            rows.append(dict(date=str(dates[origins[i]]), actual=float(ytest[j]), predictions=[float(p[j]) for p in ps], threshold=threshold))
    if not rows: raise ValueError('Not enough matured observations for walk-forward evaluation.')
    actual=np.array([x['actual'] for x in rows]); predictions=np.array([x['predictions'] for x in rows])
    metrics=[]
    for j in range(3):
        p=predictions[:,j]; loss=loss_vectors(actual,p,task)
        if task=='volatility':
            m=dict(qlike=float(loss.mean()),mae=float(np.mean(abs(actual-p))),rmse=float(np.sqrt(np.mean((actual-p)**2))))
        else:
            m=dict(brier=float(brier_score_loss(actual,p)),logLoss=float(log_loss(actual,p,labels=[0,1])),balancedAccuracy=float(balanced_accuracy_score(actual,p>=.5)),auc=float(roc_auc_score(actual,p)) if len(np.unique(actual))>1 else None)
        m['model']=MODEL_NAMES[j]; metrics.append(m)
    delta=loss_vectors(actual,predictions[:,1],task)-loss_vectors(actual,predictions[:,2],task)
    interval=block_interval(delta,block=max(20,horizon))
    improved=interval[0] is not None and interval[0]>0
    latest_train=split_indices(origins,origins[-1],horizon)
    threshold=float(np.quantile(y[latest_train],.8)) if task=='regime' else None
    labels=(y[latest_train]>threshold).astype(int) if task=='regime' else y[latest_train]
    latest=[float(predict_model(fit_model(x[latest_train],labels,task),x[-1:],task)[0]) for x in xs]
    bins=[]
    if task!='volatility':
        for j in range(3):
            group=[]
            for lo in np.arange(0,1,.1):
                mask=(predictions[:,j]>=lo)&(predictions[:,j]<lo+.1)
                group.append(dict(bin=round(float(lo+.05),2),count=int(mask.sum()),predicted=float(predictions[mask,j].mean()) if mask.any() else None,observed=float(actual[mask].mean()) if mask.any() else None))
            bins.append(group)
    return dict(horizon=horizon, metrics=metrics, lossImprovement=float(delta.mean()), interval95=interval, evidence='positive' if improved else 'inconclusive' if interval[1] is not None and interval[1]>=0 else 'negative', latest=latest, latestThreshold=threshold, latestTrainCount=len(latest_train), rows=rows, folds=folds, calibration=bins)


def shuffled_surrogate(r, seed=7, block=20):
    """Joint non-overlapping block shuffle retains each row's contemporaneous covariance.
    Window correlation topology may still change; not a nonlinear-information proof.
    """
    rng=np.random.default_rng(seed)
    chunks=[r[i:i+block] for i in range(0,len(r),block)]
    return np.concatenate([chunks[i] for i in rng.permutation(len(chunks))])


def run(frame, source, progress=False, targets=None):
    frame=validate_prices(frame)
    r=np.diff(np.log(frame.values),axis=0)
    dates=frame.index[1:].strftime('%Y-%m-%d').tolist()
    origins=np.arange(max(WINDOWS)+1,len(r))
    topo, cf, snapshots, timeline=rolling_features(r,progress)
    assert len(origins)==len(topo)
    output={"schemaVersion":1,"source":source,"asOf":dates[-1],"symbols":frame.columns.tolist(),"windows":list(WINDOWS),"snapshots":snapshots,"timeline":[dict(date=dates[t],scales=state) for t,state in zip(origins,timeline)],"targets":{},"method":{"minTrain":252,"refitEvery":20,"labelAvailability":"labelEnd < forecastOrigin","groundMetric":"Euclidean","w2Order":2,"features":[6,21,69],"seed":20260930,"bootstrapBlock":20,"bootstrapReplicates":1000,"versions":{"python":platform.python_version(),"numpy":np.__version__,"scipy":scipy.__version__,"sklearn":sklearn.__version__},"dataHash":hashlib.sha256(frame.to_csv().encode()).hexdigest(),"observations":len(frame)}}
    for target,name in enumerate(frame.columns):
        if targets and name not in targets: continue
        b=baseline_features(r,target)
        xs=[b,np.column_stack([b,cf]),np.column_stack([b,cf,topo])]
        output['targets'][name]={task:backtest(xs,future_target(r,target,origins,task),origins,task,dates) for task in HORIZONS}
        if progress: print('Models '+name,flush=True)
    null=shuffled_surrogate(r)
    # Verify invariant, export truthful diagnostic rather than claimed significance.
    output['surrogate']={"kind":"joint 20-session block shuffle","covarianceMaxError":float(np.max(abs(np.cov(r,rowvar=False)-np.cov(null,rowvar=False)))),"interpretation":"Preserves full-sample covariance, changes rolling correlations. Diagnostic only; no claim of nonlinear information or predictive significance."}
    return output


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--demo',action='store_true'); parser.add_argument('--csv'); parser.add_argument('--output',default='public/data/research.json'); parser.add_argument('--targets',nargs='+');parser.add_argument('--source',default='Imported adjusted-close CSV')
    args=parser.parse_args()
    if args.demo==bool(args.csv): parser.error('Choose exactly one of --demo or --csv.')
    frame=demo_prices() if args.demo else pd.read_csv(args.csv,index_col=0)
    source={"kind":"synthetic" if args.demo else "imported","label":"Synthetic fixture · invented prices" if args.demo else args.source,"adjustment":"Synthetic log returns" if args.demo else "User supplied adjusted close or total-return indices; verify vendor adjustments and universe construction","researchOnly":True}
    result=run(frame,source,progress=True,targets=args.targets)
    path=Path(args.output);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(result,separators=(',',':'),allow_nan=False))
    print(f'Saved {path} ({path.stat().st_size} bytes)',flush=True)

if __name__=='__main__': main()


