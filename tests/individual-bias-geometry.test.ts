import {describe,it,expect} from 'vitest';
import {
 calculateIndividualBiasSquare,verifyIndividualBiasLayout,
 findSmallestIndividualBiasSquare
} from '../src/lib/quilt/individual-bias-geometry';
import {calculateBiasAreaLowerBound} from '../src/lib/quilt/bias-area-bound';

const defaultSource={
 squareSideIn:30,fullCutStripWidthIn:2.5,usableWofIn:43,crosswiseJoinSeamIn:.25
};

describe('exact individual 45-degree bias strips: NOT a continuous tube',()=>{
 it('reproduces analytically derived full-width rectangular bands on a 30-inch square',()=>{
  const r=calculateIndividualBiasSquare(defaultSource);
  expect(r.method).toBe('INDIVIDUAL_45DEG_CROSSWISE_JOIN');
  expect(r.sourceRunLengthIn).toBe(30);
  expect(r.stripCount).toBe(15);
  expect(r.crosswiseJoinCount).toBe(14);
  expect(r.geometricUnjoinedLengthIn).toBeCloseTo(318.8961030678928,10);
  expect(r.modeledJoinedLengthIn).toBeCloseTo(311.8961030678928,10);
  expect(r.retainedFullWidthAreaSqIn).toBeCloseTo(797.240257669732,8);
  expect(r.idealAreaUpperBoundLengthIn).toBe(360);
  expect(r.geometricUnjoinedLengthIn).toBeLessThan(r.idealAreaUpperBoundLengthIn);
  expect(r.offcutAreaSqIn).toBeGreaterThan(100);
  expect(r.strips.map(x=>x.index)).toEqual(
   [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7]);
  const center=r.strips.find(x=>x.index===0)!;
  expect(center.rawLengthIn).toBeCloseTo(30*Math.SQRT2-2.5);
  expect(center.vMinIn).toBe(-1.25);
  expect(center.vMaxIn).toBe(1.25);
  expect(verifyIndividualBiasLayout(r)).toBe(true);
  expect('purchaseYards' in r).toBe(false);
  expect('continuousTubeYieldIn' in r).toBe(false);
 });
 it('returns the first 1/8-inch candidate that passes the EXACT modeled crosswise-join requirement',()=>{
  const target=316;
  const s=findSmallestIndividualBiasSquare({
   requiredJoinedLengthIn:target,fullCutStripWidthIn:2.5,
   usableWofIn:43,crosswiseJoinSeamIn:.25
  });
  expect(s.idealAreaSquareLowerBoundIn).toBeCloseTo(Math.sqrt(790),10);
  expect(s.matched?.sourceSquareSideIn).toBe(30.25);
  expect(s.matched?.stripCount).toBe(15);
  expect(s.matched?.modeledJoinedLengthIn).toBeCloseTo(317.19940392679194,10);
  expect(s.matched!.modeledJoinedLengthIn).toBeGreaterThanOrEqual(target);
  expect(calculateIndividualBiasSquare({...defaultSource,squareSideIn:30.125})
   .modeledJoinedLengthIn).toBeLessThan(target);
  expect(s.matched!.sourceSquareSideIn).toBeLessThan(s.matched!.usableWofIn);
  expect(s.examinedCandidateCount).toBeGreaterThan(1);
 });
 it('never identifies a feasible purchase from area conservation alone',()=>{
  const ideal=calculateBiasAreaLowerBound({
   requiredLengthIn:316,fullCutStripWidthIn:2.5,usableWofIn:29
  });
  expect(ideal.idealSquareFitsUsableWof).toBe(true);
  const conservative=findSmallestIndividualBiasSquare({
   requiredJoinedLengthIn:316,fullCutStripWidthIn:2.5,usableWofIn:29,
   crosswiseJoinSeamIn:.25
  });
  expect(conservative.matched).toBeNull();
  expect(conservative.examinedCandidateCount).toBeGreaterThan(0);
  expect(calculateIndividualBiasSquare({...defaultSource,squareSideIn:29.25,usableWofIn:29})).toThrow();
 });
 it('proves every rectangle vertex is inside the same source square, and v-bands cannot overlap',()=>{
  for(const square of [8,12,18,24,30,36,43,72,96]){
   for(const cutWidth of [1,1.5,2,2.5,3.75,5.5]){
    const r=calculateIndividualBiasSquare({
     squareSideIn:square,fullCutStripWidthIn:cutWidth,
     usableWofIn:Math.max(43,square),crosswiseJoinSeamIn:.25
    });
    expect(verifyIndividualBiasLayout(r)).toBe(true);
    for(const strip of r.strips){
     expect(strip.vertices).toHaveLength(4);
     expect(strip.vertices.every(v=>v.xIn>=-1e-8&&v.yIn>=-1e-8&&
      v.xIn<=square+1e-8&&v.yIn<=square+1e-8)).toBe(true);
     expect(strip.uMaxIn-strip.uMinIn).toBeCloseTo(strip.rawLengthIn,10);
    }
    expect(r.offcutAreaSqIn).toBeGreaterThanOrEqual(-1e-8);
    expect(r.retainedFullWidthAreaSqIn).toBeLessThanOrEqual(square*square+1e-8);
    expect(r.modeledJoinedLengthIn).toBeLessThanOrEqual(r.geometricUnjoinedLengthIn+1e-10);
   }
  }
 });
 it('rejects falsified geometrical coordinates or fabricated effective length',()=>{
  const r=calculateIndividualBiasSquare(defaultSource);
  const altered=structuredClone(r);
  altered.strips[0].vertices[0].xIn+=1;
  expect(verifyIndividualBiasLayout(altered)).toBe(false);
  const fake=structuredClone(r);
  fake.modeledJoinedLengthIn+=2;
  expect(verifyIndividualBiasLayout(fake)).toBe(false);
  const fakeArea=structuredClone(r);
  fakeArea.offcutAreaSqIn=-42;
  expect(verifyIndividualBiasLayout(fakeArea)).toBe(false);
 });
 it('can guarantee a stand-alone single strip after no joins without borrowing tube assumptions',()=>{
  const r=calculateIndividualBiasSquare({
   squareSideIn:6,fullCutStripWidthIn:6,usableWofIn:6,crosswiseJoinSeamIn:.25
  });
  expect(r.stripCount).toBe(1);
  expect(r.crosswiseJoinCount).toBe(0);
  expect(r.modeledJoinedLengthIn).toBeCloseTo(r.geometricUnjoinedLengthIn);
  expect(verifyIndividualBiasLayout(r)).toBe(true);
 });
 it('stays deterministic and monotone in square side and seam reduction for this fixed layout',()=>{
  let prev=0;
  for(let side=12;side<=35;side+=.125){
   const r=calculateIndividualBiasSquare({
    ...defaultSource,squareSideIn:side
   });
   expect(r.modeledJoinedLengthIn+1e-8).toBeGreaterThanOrEqual(prev);
   prev=r.modeledJoinedLengthIn;
  }
  const low=calculateIndividualBiasSquare({...defaultSource,crosswiseJoinSeamIn:.125});
  const high=calculateIndividualBiasSquare({...defaultSource,crosswiseJoinSeamIn:.5});
  expect(low.modeledJoinedLengthIn).toBeGreaterThan(high.modeledJoinedLengthIn);
 });
 it('rejects nonfinite, off-roll or out-of-scope values; no fabric quotes on invalid source',()=>{
  for(const bad of [0,5.999,-1,Infinity,NaN,97]){
   expect(()=>calculateIndividualBiasSquare({...defaultSource,squareSideIn:bad})).toThrow();
  }
  for(const bad of [0,.5,-1,Infinity,NaN,7]){
   expect(()=>calculateIndividualBiasSquare({...defaultSource,fullCutStripWidthIn:bad})).toThrow();
  }
  expect(()=>calculateIndividualBiasSquare({...defaultSource,usableWofIn:25})).toThrow(/does not fit/);
  for(const bad of [0,.01,.6,-2,NaN]){
   expect(()=>calculateIndividualBiasSquare({...defaultSource,crosswiseJoinSeamIn:bad})).toThrow();
  }
  expect(()=>findSmallestIndividualBiasSquare({
   requiredJoinedLengthIn:10001,fullCutStripWidthIn:2.5,
   usableWofIn:43,crosswiseJoinSeamIn:.25
  })).toThrow();
 });
});
