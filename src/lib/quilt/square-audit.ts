/** User-reported measurements of ONE actual trial block; never a certification. */
export type SquareTrialMeasurements={
 targetFinishedIn:number; measuredUnfinishedWidthIn:number; measuredUnfinishedHeightIn:number;
 topPointClearanceIn:number; rightPointClearanceIn:number; bottomPointClearanceIn:number; leftPointClearanceIn:number;
 toleranceIn?:number;
};
export type SquareTrialAudit={
 targetUnfinishedIn:number; pointMarginIn:number; toleranceIn:number;
 checks:{label:string;measuredIn:number;targetIn:number;deviationIn:number;withinTolerance:boolean}[];
 reportedWithinTolerance:boolean;measurements:SquareTrialMeasurements;disclaimer:string;
};
function finite(x:number,label:string,lo:number,hi:number):number{
 if(!Number.isFinite(x)||x<lo||x>hi)throw Error(label+' is outside the supported measured range.');
 return x;
}
export function auditSquareTrial(m:SquareTrialMeasurements):SquareTrialAudit{
 const finished=finite(m.targetFinishedIn,'Finished block target',2,120);
 const unfinished=finished+.5,point=.25;
 const tol=finite(m.toleranceIn??1/16,'Measurement screening tolerance',Number.EPSILON,.125);
 const values=[
  ['Unfinished width',finite(m.measuredUnfinishedWidthIn,'Unfinished width',Number.EPSILON,200),unfinished],
  ['Unfinished height',finite(m.measuredUnfinishedHeightIn,'Unfinished height',Number.EPSILON,200),unfinished],
  ['Top point to raw edge',finite(m.topPointClearanceIn,'Top point clearance',0,10),point],
  ['Right point to raw edge',finite(m.rightPointClearanceIn,'Right point clearance',0,10),point],
  ['Bottom point to raw edge',finite(m.bottomPointClearanceIn,'Bottom point clearance',0,10),point],
  ['Left point to raw edge',finite(m.leftPointClearanceIn,'Left point clearance',0,10),point]
 ] as const;
 const checks=values.map(([label,measuredIn,targetIn])=>{
  const deviationIn=measuredIn-targetIn;
  return {label,measuredIn,targetIn,deviationIn,
   withinTolerance:Math.abs(deviationIn)<=tol+4*Number.EPSILON*Math.max(1,measuredIn,targetIn)};
 });
 return {targetUnfinishedIn:unfinished,pointMarginIn:point,toleranceIn:tol,checks,
  reportedWithinTolerance:checks.every(c=>c.withinTolerance),measurements:{...m,toleranceIn:tol},
  disclaimer:'USER-REPORTED SINGLE-BLOCK SCREENING ONLY; not independently verified, not a sewing certification, and not authority to publish the Square SEO page.'};
}
