import {describe,expect,it} from 'vitest';
import {evaluateFinishing,type UserFinishingReading} from '../src/lib/quilt/finishing-audit';
import type {JoinedSeamPlan,UserJoinedSeamReading} from '../src/lib/quilt/seam-audit';
const seamPlan:JoinedSeamPlan={
 sourceProjectHash:'e7a62b91',calculationVersion:'v2.0',
 finishing:{
  requiredBackingWidthIn:74,requiredBackingHeightIn:94,
  plannedPretrimBackingWidthIn:85,plannedPretrimBackingHeightIn:94,
  plannedQuiltTopWidthIn:66,plannedQuiltTopHeightIn:86
 },
 checks:[{
  kind:'backing',rollId:'backing',direction:'vertical',sectionCount:2,joinCount:1,
  plannedFullWidthIn:43,plannedPretrimJoinedLengthIn:85,
  requiredMinimumLengthIn:74,modeledTotalJoinLossIn:1
 }]
};
const sewn:UserJoinedSeamReading[]=[{kind:'backing',measuredPretrimJoinedLengthIn:85}];
function full():UserFinishingReading{
 return {
  pretrimBackingWidthIn:85,pretrimBackingHeightIn:94,
  trimLeftIn:5,trimRightIn:6,trimTopIn:0,trimBottomIn:0,
  trimmedBackingWidthIn:74,trimmedBackingHeightIn:94,
  sewnQuiltTopWidthIn:66,sewnQuiltTopHeightIn:86
 };
}
describe('noncertifying real backing edge trim and sewn quilt-top size audit',()=>{
 it('never uses model values to fill missing before/after physical ruler measurements',()=>{
  let r=evaluateFinishing(seamPlan,undefined,sewn,undefined);
  expect(r.backingCoverage).toBe('NOT_MEASURED');
  expect(r.topCoverage).toBe('NOT_MEASURED');
  expect(r.impliedTrimmedBackingWidthIn).toBeUndefined();
  expect(r.invalid).toHaveLength(0);
  r=evaluateFinishing(undefined,full(),sewn,.0625);
  expect(r.source).toBe('NOT_IMPORTED');
  expect(r.invalid[0]).toMatch(/Matching cutting-plan JSON required/);
  r=evaluateFinishing(seamPlan,{pretrimBackingWidthIn:85,sewnQuiltTopWidthIn:66},sewn,.0625);
  expect(r.backingCoverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.topCoverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.impliedTrimmedBackingWidthIn).toBeUndefined();
  expect(r.sewnQuiltTopOutsideTolerance).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('NOT VERIFIED');
 });
 it('reconciles four real edge removals with independent posttrim measurement and TOP outside size',()=>{
  const r=evaluateFinishing(seamPlan,full(),sewn,.0625);
  expect(r.invalid).toHaveLength(0);
  expect(r.backingCoverage).toBe('FULL_USER_REPORTED');
  expect(r.topCoverage).toBe('FULL_USER_REPORTED');
  expect(r.impliedTrimmedBackingWidthIn).toBe(74);
  expect(r.impliedTrimmedBackingHeightIn).toBe(94);
  expect(r.observedTrimAreaSqIn).toBe(11*94);
  expect(r.trimmedWidthDifferenceIn).toBe(0);
  expect(r.trimmedHeightDifferenceIn).toBe(0);
  expect(r.backingIndependentMeasurementMismatch).toBe(false);
  expect(r.joinedPretrimAxisMismatch).toBe(false);
  expect(r.backingWidthShortfall).toBe(false);
  expect(r.backingHeightShortfall).toBe(false);
  expect(r.sewnQuiltTopOutsideTolerance).toBe(false);
 });
 it('flags an independent measured posttrim discrepancy while retaining the input',()=>{
  const m=full();m.trimmedBackingWidthIn=74.25;
  const r=evaluateFinishing(seamPlan,m,sewn,.0625);
  expect(r.backingIndependentMeasurementMismatch).toBe(true);
  expect(r.trimmedWidthDifferenceIn).toBeCloseTo(.25);
  expect(r.warnings.join(' ')).toContain('disagrees');
  m.trimmedBackingWidthIn=74+.0625;
  expect(evaluateFinishing(seamPlan,m,sewn,.0625).backingIndependentMeasurementMismatch).toBe(false);
 });
 it('marks a cut backing smaller than target even when the four-edge math itself reconciles',()=>{
  const m=full();
  m.trimLeftIn=5.125;m.trimmedBackingWidthIn=73.875;
  const r=evaluateFinishing(seamPlan,m,sewn,.0625);
  expect(r.backingIndependentMeasurementMismatch).toBe(false);
  expect(r.backingWidthShortfall).toBe(true);
  expect(r.sewnQuiltTopOutsideTolerance).toBe(false);
 });
 it('separate pretrim backing ruler and joined-seam ruler disagree at the joined axis',()=>{
  const m=full();m.pretrimBackingWidthIn=84.75;
  m.trimmedBackingWidthIn=73.75;
  const r=evaluateFinishing(seamPlan,m,sewn,.0625);
  expect(r.backingIndependentMeasurementMismatch).toBe(false);
  expect(r.joinedPretrimAxisMismatch).toBe(true);
  expect(r.joinedPretrimAxisDifferenceIn).toBeCloseTo(-.25);
 });
 it('flags a sewn quilt top width/height deviation but never asserts bound quilt size',()=>{
  const m=full();m.sewnQuiltTopWidthIn=66.25;
  const r=evaluateFinishing(seamPlan,m,sewn,.125);
  expect(r.sewnQuiltTopOutsideTolerance).toBe(true);
  expect(r.sewnTopWidthDifferenceIn).toBeCloseTo(.25);
  expect(r.backingWidthShortfall).toBe(false);
 });
 it('validates negative trims, impossible removals, nonfinite numbers and declared tolerance',()=>{
  let m=full();m.trimLeftIn=-1;
  expect(evaluateFinishing(seamPlan,m,sewn,.0625).invalid.length).toBeGreaterThan(0);
  m=full();m.trimLeftIn=85;
  expect(evaluateFinishing(seamPlan,m,sewn,.0625).invalid.join(' ')).toContain('entire measured backing width');
  m=full();m.trimLeftIn=Infinity;
  expect(evaluateFinishing(seamPlan,m,sewn,.0625).invalid).toHaveLength(1);
  m=full();m.trimTopIn=undefined;
  const partial=evaluateFinishing(seamPlan,m,sewn,.0625);
  expect(partial.backingCoverage).toBe('PARTIAL_USER_REPORTED');
  expect(partial.impliedTrimmedBackingWidthIn).toBeUndefined();
  m=full();m.trimLeftIn=0;m.trimRightIn=11;
  expect(evaluateFinishing(seamPlan,m,sewn,.0625).invalid).toHaveLength(0);
  expect(evaluateFinishing(seamPlan,full(),sewn,1.5).invalid).toHaveLength(1);
 });
 it('checks horizontal backing assembled dimension against independent height ruler',()=>{
  const horizontal:JoinedSeamPlan={
   ...seamPlan,checks:[{...seamPlan.checks[0],direction:'horizontal',plannedPretrimJoinedLengthIn:94}]
  };
  const m=full();m.pretrimBackingHeightIn=93.5;
  m.trimmedBackingHeightIn=93.5;
  const r=evaluateFinishing(horizontal,m,[{kind:'backing',measuredPretrimJoinedLengthIn:94}],.0625);
  expect(r.joinedPretrimAxisMismatch).toBe(true);
  expect(r.joinedPretrimAxisDifferenceIn).toBe(-.5);
 });
});
