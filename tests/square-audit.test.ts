import {describe,it,expect} from 'vitest';
import {auditSquareTrial,type SquareTrialMeasurements} from '../src/lib/quilt/square-audit';
const source:SquareTrialMeasurements={
 targetFinishedIn:12,measuredUnfinishedWidthIn:12.5,measuredUnfinishedHeightIn:12.5,
 topPointClearanceIn:.25,rightPointClearanceIn:.25,bottomPointClearanceIn:.25,leftPointClearanceIn:.25
};
describe('user-reported Square trial sewing measurements (not independently certified)',()=>{
 it('requires exact entered measurements for 12.5 inch unfinished and 1/4 inch point margins',()=>{
  const r=auditSquareTrial(source);
  expect(r.reportedWithinTolerance).toBe(true);
  expect(r.checks).toHaveLength(6);
  expect(r.targetUnfinishedIn).toBe(12.5);
  expect(r.pointMarginIn).toBe(.25);
  expect(r.disclaimer).toContain('not independently verified');
 });
 it('rejects a physically small trial block and clipped center point',()=>{
  const r=auditSquareTrial({...source,measuredUnfinishedWidthIn:12.375,topPointClearanceIn:.125});
  expect(r.reportedWithinTolerance).toBe(false);
  expect(r.checks.filter(c=>!c.withinTolerance).map(c=>c.label)).toEqual(['Unfinished width','Top point to raw edge']);
 });
 it('also flags deeply buried points even when the unfinished width matches',()=>{
  const r=auditSquareTrial({...source,rightPointClearanceIn:.4});
  expect(r.reportedWithinTolerance).toBe(false);
 });
 it('allows exact 1/16 tolerance boundaries but not missing/nonfinite measurements',()=>{
  expect(auditSquareTrial({...source,topPointClearanceIn:.1875,leftPointClearanceIn:.3125}).reportedWithinTolerance).toBe(true);
  for(const bad of [
   {...source,measuredUnfinishedWidthIn:0},{...source,measuredUnfinishedHeightIn:Infinity},
   {...source,topPointClearanceIn:-1},{...source,bottomPointClearanceIn:NaN},
   {...source,targetFinishedIn:1},{...source,toleranceIn:0},{...source,toleranceIn:.2}
  ])expect(()=>auditSquareTrial(bad)).toThrow();
 });
 it('never changes the original user measurement values',()=>{
  const x={...source};auditSquareTrial(x);expect(x).toEqual(source);
 });
});