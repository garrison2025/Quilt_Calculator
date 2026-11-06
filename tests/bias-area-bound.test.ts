import {describe,expect,it} from 'vitest';
import {calculateBiasAreaLowerBound} from '../src/lib/quilt/bias-area-bound';
import {calculateStraightBinding} from '../src/lib/quilt/math';

describe('true-bias theoretical area floor is NOT a verified cutting or purchasing method',()=>{
 it('reproduces published square-root area conservation, but never claims finished bias yield or buy yards',()=>{
  const r=calculateBiasAreaLowerBound({requiredLengthIn:267,fullCutStripWidthIn:2.5,usableWofIn:43});
  expect(r.method).toBe('BIAS_AREA_LOWER_BOUND_ONLY');
  expect(r.idealAreaSqIn).toBe(667.5);
  expect(r.idealSquareSideIn).toBeCloseTo(Math.sqrt(667.5),12);
  expect(r.roundedAreaLowerBoundSideIn).toBe(25.875);
  expect(r.idealSquareFitsUsableWof).toBe(true);
  expect('purchaseYards' in r).toBe(false);
  expect('verifiedYieldIn' in r).toBe(false);
  expect('cuttingPlan' in r).toBe(false);
 });
 it('cannot contaminate actual straight-grain calculation or source inputs',()=>{
  const args={widthIn:60,heightIn:80,wofIn:43,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:2.5,step:.125};
  const saved=JSON.stringify(args);
  const straight=calculateStraightBinding(args);
  expect(straight.requiredLengthIn).toBe(292);
  expect(straight.purchase.roundedPurchaseYards).toBe(.625);
  const bias=calculateBiasAreaLowerBound({
   requiredLengthIn:straight.requiredLengthIn,fullCutStripWidthIn:args.stripWidthIn,usableWofIn:args.wofIn
  });
  expect(bias.idealAreaSqIn).toBe(730);
  expect(bias.idealSquareSideIn).toBeCloseTo(Math.sqrt(730),12);
  expect(bias.roundedAreaLowerBoundSideIn).toBe(27.125);
  expect(bias.idealSquareFitsUsableWof).toBe(true);
  expect(JSON.stringify(args)).toBe(saved);
  expect(calculateStraightBinding(args).purchase.roundedPurchaseYards).toBe(.625);
 });
 it('warns when even a LOSSLESS area square cannot physically fit usable bolt width',()=>{
  const r=calculateBiasAreaLowerBound({requiredLengthIn:292,fullCutStripWidthIn:2.5,usableWofIn:20});
  expect(r.idealSquareFitsUsableWof).toBe(false);
  expect(r.roundedAreaLowerBoundSideIn).toBeGreaterThan(r.usableWofIn);
 });
 it('ruler roundup never understates an ideal square at fractions near the grid boundary',()=>{
  for(const side of [10,10.125,10.125001,25.875,27.0000000001,35.625]){
   const r=calculateBiasAreaLowerBound({requiredLengthIn:side*side/2.5,fullCutStripWidthIn:2.5,usableWofIn:100});
   expect(r.roundedAreaLowerBoundSideIn+1e-9).toBeGreaterThanOrEqual(r.idealSquareSideIn);
   expect(Number.isInteger(r.roundedAreaLowerBoundSideIn*8)).toBe(true);
  }
 });
 it('rejects nonpositive or nonfinite measurements instead of quoting a pretend bias cutting plan',()=>{
  const input={requiredLengthIn:267,fullCutStripWidthIn:2.5,usableWofIn:43};
  for(const n of [0,-1,Infinity,NaN,1e8]){
   expect(()=>calculateBiasAreaLowerBound({...input,requiredLengthIn:n})).toThrow();
  }
  for(const n of [0,-2,Infinity,NaN]){
   expect(()=>calculateBiasAreaLowerBound({...input,fullCutStripWidthIn:n})).toThrow();
   expect(()=>calculateBiasAreaLowerBound({...input,usableWofIn:n})).toThrow();
  }
 });
});
