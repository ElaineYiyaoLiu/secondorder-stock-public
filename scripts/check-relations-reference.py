"""Independent NumPy correlation/OAS check against the browser implementation.
Run: node scripts/relation-reference-fixture.mjs && python scripts/check-relations-reference.py
"""
import json
from pathlib import Path
import numpy as np
fixture = json.loads(Path('research/relationship-reference-input.json').read_text())
returns = np.diff(np.log(np.array(fixture['closes'])), axis=1)
center = np.median(returns, axis=1, keepdims=True)
scale = np.maximum(1e-6, 1.482602218505602 * np.median(np.abs(returns-center), axis=1, keepdims=True))
bounded = np.clip(returns, center-4*scale, center+4*scale)
ranks = np.empty_like(returns)
for row, values in enumerate(returns):
    for k, value in enumerate(values):
        ranks[row, k] = np.count_nonzero(values < value) + (np.count_nonzero(values == value)-1)/2
errors = {}
for channel, values in [('linear', bounded), ('rank', ranks)]:
    empirical = np.corrcoef(values)
    p, m = values.shape
    trace2 = np.trace(empirical @ empirical)
    denom = (m+1-2/p)*(trace2-p)
    shrinkage = 1 if denom <= 1e-12 else min(1, max(0, ((1-2/p)*trace2+p*p)/denom))
    expected = (1-shrinkage)*empirical + shrinkage*np.eye(p)
    actual = np.array(fixture['representation'][channel])
    errors[channel] = float(np.max(np.abs(expected-actual)))
    assert errors[channel] < 1e-10
    assert abs(shrinkage-fixture['representation']['shrinkage'][channel]) < 1e-10
report = {'oracle':'NumPy corrcoef, independent average ranks and original finite-p OAS', 'maximumMatrixErrors':errors, 'passed':True}
Path('research/relationship-reference-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
