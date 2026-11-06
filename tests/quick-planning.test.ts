import {describe,it,expect} from 'vitest';
import {calculateSashing} from '../src/lib/quilt/math';
import {resolveQuiltDimensions} from '../src/lib/quilt/dimensions';
import {sampleProject,quiltTopReviewFingerprint,validateProject} from '../src/lib/quilt/project';
import {
 FINISHED_SIZE_EXAMPLES,applyFinishedSizeExample,applyBlockGridAsCenter,compareBackingPurchases
} from '../src/lib/quilt/quick-planning';

describe('noncertifying quick quilt planning',()=>{
 it('uses named, editable finished-outside examples and never silently changes fabric pieces',()=>{
  expect(FINISHED_SIZE_EXAMPLES.map(x=>x.id)).toEqual(['baby','throw','twin','queen','king']);
  const source=structuredClone(sampleProject);
  source.quilt.topCutsReviewed=true;
  source.quilt.topCutsReviewFingerprint=quiltTopReviewFingerprint(source);
  const savedSnapshot=JSON.stringify(source);
  const next=applyFinishedSizeExample(source,'queen');
  expect(next.quilt).toMatchObject({finishedWidth:90,finishedHeight:100,sizeBasis:'includes-borders',
   topCutsReviewed:false});
  expect(next.quilt.topCutsReviewFingerprint).toBeUndefined();
  expect(resolveQuiltDimensions(next)).toMatchObject({
   centerWidthIn:84,centerHeightIn:94,finalWidthIn:90,finalHeightIn:100
  });
  expect(next.fabrics).toEqual(source.fabrics);
  expect(next.borders).toEqual(source.borders);
  expect(next.options).toEqual(source.options);
  expect(JSON.stringify(source)).toBe(savedSnapshot);
  expect(validateProject(next).quilt.finishedWidth).toBe(90);
 });
 it('blocks unknown and physically incompatible preset sizes without mutating existing project',()=>{
  const source=structuredClone(sampleProject),snapshot=JSON.stringify(source);
  expect(()=>applyFinishedSizeExample(source,'not-a-size')).toThrow(/Unknown/);
  source.borders[0].widthIn=20; // Baby 36x52 can no longer enclose 40in of borders.
  expect(()=>applyFinishedSizeExample(source,'baby')).toThrow();
  expect(JSON.stringify(sampleProject)).toBe(snapshot);
 });
 it('uses existing sashing formula to transfer ONLY computed center dimensions',()=>{
  const original=structuredClone(sampleProject);
  original.quilt.topCutsReviewed=true;
  original.quilt.topCutsReviewFingerprint=quiltTopReviewFingerprint(original);
  const s=original.sashing;
  const model=calculateSashing({rows:s.rows,columns:s.columns,blockWidthIn:s.blockWidth,
   blockHeightIn:s.blockHeight,finishedSashIn:s.width,seamIn:original.options.seam,
   wofIn:original.options.usableWof,step:original.options.step});
  expect([model.finishedWidthIn,model.finishedHeightIn]).toEqual([58,46]);
  const next=applyBlockGridAsCenter(original,model.finishedWidthIn,model.finishedHeightIn);
  expect(next.quilt).toMatchObject({finishedWidth:58,finishedHeight:46,sizeBasis:'before-borders',
   topCutsReviewed:false});
  expect(resolveQuiltDimensions(next)).toMatchObject({
   centerWidthIn:58,centerHeightIn:46,finalWidthIn:64,finalHeightIn:52
  });
  expect(next.sashing).toEqual(original.sashing);
  expect(next.fabrics).toEqual(original.fabrics);
  expect(next.borders).toEqual(original.borders);
  expect(original.quilt.finishedWidth).toBe(60);
  expect(()=>applyBlockGridAsCenter(original,Infinity,46)).toThrow();
  expect(()=>applyBlockGridAsCenter(original,-1,46)).toThrow();
 });
 it('compares alternate wide backing with the SAME model, overage, direction and shopping step without altering current exports',()=>{
  const project=structuredClone(sampleProject);
  const d=resolveQuiltDimensions(project);
  const options=project.options;
  const args={
   widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,overageIn:options.overage,
   currentWofIn:options.usableWof,alternateWofIn:108,
   joinTakeupIn:options.joinTakeup,oneWayPrint:options.oneWayPrint,
   step:options.step,lengthShrinkagePct:options.lengthShrinkage,
   backingDirection:'auto' as const,currentUnitPriceUsd:12,alternateUnitPriceUsd:25
  };
  const original=JSON.stringify(project);
  const comparison=compareBackingPurchases(args);
  expect(comparison.hypotheticalOnly).toBe(true);
  expect(comparison.current).toMatchObject({usableWofIn:43,panelCount:2,joinedSeamCount:1,
   selectedDirection:'vertical',purchaseYards:5.25,costUsd:63});
  expect(comparison.alternate).toMatchObject({usableWofIn:108,panelCount:1,joinedSeamCount:0,
   selectedDirection:'horizontal',purchaseYards:2.125,costUsd:53.125});
  expect(comparison.extraPurchaseYards).toBeCloseTo(-3.125);
  expect(comparison.costDifferenceUsd).toBeCloseTo(-9.875);
  expect(JSON.stringify(project)).toBe(original);
  expect(compareBackingPurchases({...args,alternateUnitPriceUsd:undefined}).costDifferenceUsd).toBeUndefined();
 });
 it('preserves one-way grain and manual orientation; impossible or invalid what-if values cannot create current plans',()=>{
  const d=resolveQuiltDimensions(sampleProject);
  const base={
   widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,overageIn:4,
   currentWofIn:43,alternateWofIn:108,joinTakeupIn:1,
   oneWayPrint:true,step:.125,lengthShrinkagePct:0,backingDirection:'auto' as const
  };
  const r=compareBackingPurchases(base);
  expect(r.alternate.selectedDirection).toBe('vertical');
  expect(r.alternate.purchaseYards).toBe(2.625);
  expect(()=>compareBackingPurchases({...base,backingDirection:'horizontal'})).toThrow(/BACKING DIRECTION CONFLICT/);
  expect(()=>compareBackingPurchases({...base,alternateWofIn:0})).toThrow();
  expect(()=>compareBackingPurchases({...base,alternateWofIn:1})).toThrow(/Join take-up/);
  expect(()=>compareBackingPurchases({...base,alternateUnitPriceUsd:-1})).toThrow(/price/);
  expect(()=>compareBackingPurchases({...base,alternateUnitPriceUsd:NaN})).toThrow(/price/);
 });
});
