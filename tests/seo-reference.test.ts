import {describe,it,expect} from 'vitest';
import {backingReference,bindingReference,yardageReference,formatEighthYards} from '../src/data/seo-reference';
import {calculateBacking,calculateStraightBinding,calculateYardage} from '../src/lib/quilt/math';

describe('engine-derived SEO reference tables (not physical certification)',()=>{
 it('keeps backing example purchases in parity with actual feasible cutting layouts',()=>{
  expect(backingReference).toHaveLength(8);
  for(const row of backingReference){
   const [w,h]=row.quilt.split(' × ').map(Number);
   const result=calculateBacking({widthIn:w,heightIn:h,overageIn:4,wofIn:row.wofIn,joinTakeupIn:1,oneWayPrint:false,step:.125,shrinkageLengthPct:0});
   expect(row.panels).toBe(result.recommended.panelCount);
   expect(row.direction).toBe(result.recommended.direction);
   expect(row.runIn).toBe(result.recommended.layout.exactFabricRunLengthIn);
   expect(row.yards).toBe(result.recommended.purchase.roundedPurchaseYards);
   expect(row.yards*36+1e-10).toBeGreaterThanOrEqual(row.runIn);
   expect(result.recommended.layout.isCutFeasible).toBe(true);
  }
 });
 it('keeps straight-grain examples independent of bias binding',()=>{
  expect(bindingReference).toHaveLength(6);
  for(const row of bindingReference){
   const [w,h]=row.quilt.split(' × ').map(Number);
   const result=calculateStraightBinding({widthIn:w,heightIn:h,wofIn:43,stripWidthIn:row.stripWidthIn,
    tailAllowanceIn:12,joinLossIn:2.5,step:.125,shrinkageLengthPct:0});
   expect([row.strips,row.requiredIn,row.runIn,row.yards]).toEqual([
    result.stripCount,result.requiredLengthIn,result.layout.exactFabricRunLengthIn,result.purchase.roundedPurchaseYards]);
   expect(row.strips*43-(row.strips-1)*2.5).toBeGreaterThanOrEqual(row.requiredIn);
  }
 });
 it('compares separate physical rolls without area-only invented yardage',()=>{
  expect(yardageReference).toHaveLength(5);
  expect(yardageReference.find(x=>x.wofIn===43&&x.rotation)?.runIn).toBe(25);
  expect(yardageReference.find(x=>x.wofIn===43&&!x.rotation)?.runIn).toBe(30);
  for(const row of yardageReference){
   const parts=row.label.match(/^(\d+) pieces · (\d+) × (\d+) in$/);
   expect(parts).not.toBeNull();
   const count=Number(parts![1]),pieceWidthIn=Number(parts![2]),pieceHeightIn=Number(parts![3]);
   const result=calculateYardage({pieceWidthIn,pieceHeightIn,count,wofIn:row.wofIn,
    allowRotate:row.rotation,oneWayPrint:false,step:.125,shrinkageLengthPct:0});
   expect(result.layout.isCutFeasible).toBe(true);
   expect(row.across).toBe(result.across);
   expect(row.rows).toBe(result.rows);
   expect(row.runIn).toBe(result.layout.exactFabricRunLengthIn);
   expect(row.yards).toBe(result.purchase?.roundedPurchaseYards);
  }
 });
 it('formats only genuine eighth-yard increments as truthful US fabric fractions',()=>{
  expect(formatEighthYards(0)).toBe('0 yd');
  expect(formatEighthYards(.625)).toBe('⅝ yd');
  expect(formatEighthYards(1.125)).toBe('1 ⅛ yd');
  expect(formatEighthYards(5)).toBe('5 yd');
  expect(()=>formatEighthYards(.251)).toThrow();
 });
});
