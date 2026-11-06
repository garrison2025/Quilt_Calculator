import {describe,it,expect} from 'vitest';
import {calculateContinuousBiasPlan,type ContinuousBiasPlanInput} from '../src/lib/quilt/continuous-bias-planner';
import {verifyBiasTube2DDevelopment} from '../src/lib/quilt/continuous-bias-tube-development';

const base:ContinuousBiasPlanInput={
 quiltWidthIn:60,quiltHeightIn:80,tailAllowanceIn:12,
 extraMarginPct:0,fullStripCutWidthIn:2.5,seamAllowanceIn:.25,
 usableWofIn:43,lengthShrinkPct:0,retailIncrementYd:.125,
 pricePerYardUsd:12
};
const approx=(got:number,want:number)=>expect(got).toBeCloseTo(want,7);
describe('non-purchasing continuous bias inverse square scenarios',()=>{
 it('finds the FIRST 1/8-inch square that meets the numerical 292in target',()=>{
  const result=calculateContinuousBiasPlan(base);
  expect(result.method).toBe('CONTINUOUS_BIAS_PLANNER_NUMERICAL_SCENARIO_ONLY');
  expect(result.verdict).toBe('NOT_VERIFIED_FOR_PHYSICAL_YIELD_OR_PURCHASE');
  expect(result.status).toBe('MODEL_FIT');
  expect(result.quiltPerimeterIn).toBe(280);
  expect(result.targetWithTailIn).toBe(292);
  expect(result.modeledTargetIn).toBe(292);
  expect(result.scenario?.sourceSquareSideIn).toBe(28.625);
  expect(result.scenario?.modelFullBands).toBe(8);
  approx(result.scenario!.modelStripLengthIn,312.86962440920024);
  expect(result.development).not.toBeNull();
  expect(verifyBiasTube2DDevelopment(result.development!)).toBe(true);
  approx(result.areaOnlySquareSideFloorIn,Math.sqrt(292*2.5));
  approx(result.scenario!.unusedWofAcrossSquareIn,43-28.625);
  approx(result.scenario!.indicativeRawRollRunYd,28.625/36);
  expect(result.scenario!.indicativeRoundedRollRunYd).toBe(.875);
  expect(result.scenario!.indicativePriceUsd).toBe(10.5);
  expect(result.safeToPurchase).toBe(false);
  expect(result.physicalSpecimenVerified).toBe(false);
  expect('purchaseYards' in result).toBe(false);
  expect('verifiedUsableLengthIn' in result).toBe(false);
 });
 it('applies the user margin to the target, never to an alleged physical yield',()=>{
  const without=calculateContinuousBiasPlan(base);
  const withMargin=calculateContinuousBiasPlan({...base,extraMarginPct:10});
  expect(withMargin.modeledTargetIn).toBeCloseTo(321.2,8);
  expect(withMargin.scenario!.sourceSquareSideIn).toBeGreaterThan(without.scenario!.sourceSquareSideIn);
  expect(withMargin.scenario!.sourceSquareSideIn).toBe(29.375);
  expect(withMargin.verdict).toBe('NOT_VERIFIED_FOR_PHYSICAL_YIELD_OR_PURCHASE');
 });
 it('prewash length loss changes only hypothetical bolt-run, not finished square, WOF or binding length',()=>{
  const noWash=calculateContinuousBiasPlan(base);
  const prewash=calculateContinuousBiasPlan({...base,lengthShrinkPct:10});
  expect(prewash.scenario!.sourceSquareSideIn).toBe(noWash.scenario!.sourceSquareSideIn);
  expect(prewash.scenario!.modelStripLengthIn).toBe(noWash.scenario!.modelStripLengthIn);
  approx(prewash.scenario!.unwashedRollRunIn,28.625/.9);
  expect(noWash.scenario!.indicativeRoundedRollRunYd).toBe(.875);
  expect(prewash.scenario!.indicativeRoundedRollRunYd).toBe(1);
  expect(prewash.scenario!.unusedWofAcrossSquareIn).toBe(noWash.scenario!.unusedWofAcrossSquareIn);
 });
 it('never silently invents an oversize square when measured WOF is too narrow',()=>{
  const noFit=calculateContinuousBiasPlan({...base,usableWofIn:27});
  expect(noFit.status).toBe('NO_MODEL_FIT_WITHIN_WOF');
  expect(noFit.scenario).toBeNull();
  expect(noFit.development).toBeNull();
  expect(noFit.largestEvaluatedScenario!.modelStripLengthIn).toBeLessThan(noFit.modeledTargetIn);
  expect(noFit.mathematicalSquareLimitIn).toBe(27);
  expect('purchaseYards' in noFit).toBe(false);
 });
 it('fails closed for an input too narrow to generate even two complete marked bands',()=>{
  const noFit=calculateContinuousBiasPlan({...base,usableWofIn:6,fullStripCutWidthIn:6});
  expect(noFit.status).toBe('NO_MODEL_FIT_WITHIN_WOF');
  expect(noFit.largestEvaluatedScenario).toBeNull();
  expect(noFit.checkedCandidateCount).toBe(0);
 });
 it('rejects nonfinite, outside-scope and unsupported retail increments',()=>{
  for(const change of [
   {quiltWidthIn:NaN},{quiltHeightIn:0},{tailAllowanceIn:-1},
   {extraMarginPct:101},{fullStripCutWidthIn:0},{seamAllowanceIn:.01},
   {usableWofIn:121},{lengthShrinkPct:100},{pricePerYardUsd:Infinity},
   {retailIncrementYd:.2}
  ]){
   expect(()=>calculateContinuousBiasPlan({...base,...change} as ContinuousBiasPlanInput)).toThrow();
  }
 });
 it('maintains nondecreasing modeled square side for greater required lengths and fabric-width increases',()=>{
  for(const W of [1.25,2,2.5,3,4]){
   for(const wof of [30,40,50]){
    const shorter=calculateContinuousBiasPlan({...base,fullStripCutWidthIn:W,usableWofIn:wof,quiltHeightIn:45});
    const longer=calculateContinuousBiasPlan({...base,fullStripCutWidthIn:W,usableWofIn:wof,quiltHeightIn:65});
    if(shorter.scenario&&longer.scenario)
     expect(shorter.scenario.sourceSquareSideIn).toBeLessThanOrEqual(longer.scenario.sourceSquareSideIn);
    for(const r of [shorter,longer]){
     expect(r.safeToPurchase).toBe(false);
     if(r.scenario){
      expect(r.scenario.modelStripLengthIn+1e-8).toBeGreaterThanOrEqual(r.modeledTargetIn);
      expect(r.scenario.sourceSquareSideIn).toBeLessThanOrEqual(wof);
      expect(r.development?.productionYieldVerified).toBe(false);
     }
    }
   }
  }
 });
 it('does not accidentally use source-square area or premature rounding as verified strip yield',()=>{
  const r=calculateContinuousBiasPlan(base);
  expect(r.scenario!.modelStripLengthIn).toBeLessThan(r.scenario!.sourceSquareSideIn**2/base.fullStripCutWidthIn);
  expect(r.scenario!.indicativeRoundedRollRunYd).toBeGreaterThanOrEqual(r.scenario!.indicativeRawRollRunYd);
  expect(r.scenario!.rollRoundingExtraIn).toBeGreaterThanOrEqual(-1e-8);
  expect(r.development!.areaClosureErrorSqIn).toBeCloseTo(0,7);
 });
});
