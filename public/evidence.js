// Evidence belongs to the model's task. Only Homology requires past references.
export function geometryEvidence(g,analysis){
 const model=analysis?.models?.find(m=>m.id===g.id);
 if(!model)return {code:'not-run',en:'Not run',zh:'尚未运行',detailEn:'',detailZh:''};
 const e=model.evidence;
 return {code:e.code,en:e.code==='observed'?'Observed':e.code==='limited'?'Limited evidence':'Insufficient evidence',zh:e.code==='observed'?'已观察':e.code==='limited'?'证据有限':'证据不足',detailEn:e.code==='observed'?'':e.en,detailZh:e.code==='observed'?'':e.zh};
}
