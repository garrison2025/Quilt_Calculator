import {describe,it,expect} from 'vitest';
import {sampleProject,validateProject,quiltTopReviewFingerprint,hasCurrentQuiltTopReview} from '../src/lib/quilt/project';
import {resolveQuiltDimensions} from '../src/lib/quilt/dimensions';
import {calculateBacking,calculateBatting,calculateStraightBinding,calculateBorders} from '../src/lib/quilt/math';

const copy=()=>structuredClone(sampleProject);
function fullPlan(p:ReturnType<typeof copy>){
 const d=resolveQuiltDimensions(p),o=p.options;
 const border=calculateBorders({widthIn:d.centerWidthIn,heightIn:d.centerHeightIn,seamIn:o.seam,layers:p.borders,step:o.step});
 expect(border.finishedWidthIn).toBeCloseTo(d.finalWidthIn,8);
 expect(border.finishedHeightIn).toBeCloseTo(d.finalHeightIn,8);
 const backing=calculateBacking({
  widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,overageIn:o.overage,wofIn:o.usableWof,
  joinTakeupIn:o.joinTakeup,oneWayPrint:o.oneWayPrint,step:o.step,shrinkageLengthPct:o.lengthShrinkage
 });
 const batting=calculateBatting({
  widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,overageIn:o.battingOverage,rollWidthIn:o.battingWof,
  rotate:o.allowRotate,step:o.step
 });
 const binding=calculateStraightBinding({
  widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,wofIn:o.usableWof,stripWidthIn:o.stripWidth,
  tailAllowanceIn:o.tailAllowance,joinLossIn:o.stripJoinLoss,step:o.step,shrinkageLengthPct:o.lengthShrinkage
 });
 return {d,border,backing,batting,binding};
}
describe('whole-quilt border-inclusive dimension contract: independent cross-material QA',()=>{
 it('reconciles 60×80 center + 3-in each-side border with all purchases and seams',()=>{
  const p=copy();const {d,border,backing,batting,binding}=fullPlan(p);
  expect([d.centerWidthIn,d.centerHeightIn,d.finalWidthIn,d.finalHeightIn]).toEqual([60,80,66,86]);
  expect(border.layers).toHaveLength(1);
  expect([backing.targetWidthIn,backing.targetHeightIn]).toEqual([74,94]);
  expect(backing.recommended.purchase.roundedPurchaseYards).toBe(5.25);
  expect(batting.purchase?.roundedPurchaseYards).toBe(2.625);
  expect(binding.requiredLengthIn).toBe(316);
 });
 it('without borders the entered and finished dimensions are identical',()=>{
  const p=copy();p.borders=[];
  const {d,backing,binding}=fullPlan(p);
  expect([d.centerWidthIn,d.centerHeightIn,d.finalWidthIn,d.finalHeightIn]).toEqual([60,80,60,80]);
  expect([backing.targetWidthIn,backing.targetHeightIn]).toEqual([68,88]);
  expect(backing.recommended.purchase.roundedPurchaseYards).toBe(5);
  expect(binding.requiredLengthIn).toBe(292);
 });
 it('a second layer adds twice the finished width; individual border results match the consolidated dimensions',()=>{
  const p=copy();
  p.borders.push({sku:'second',label:'Second',widthIn:2,wofIn:43,shrinkageLengthPct:0});
  const {d,border,backing,binding}=fullPlan(p);
  expect([d.centerWidthIn,d.centerHeightIn,d.finalWidthIn,d.finalHeightIn]).toEqual([60,80,70,90]);
  expect(border.layers[0].finishedWidthIn).toBe(66);
  expect(border.layers[1].finishedWidthIn).toBe(70);
  expect([backing.targetWidthIn,backing.targetHeightIn]).toEqual([78,98]);
  expect(binding.requiredLengthIn).toBe(332);
 });
 it('pre-border and all-in finished-size semantics produce identical cut plans when the outer size agrees',()=>{
  const a=copy(),b=copy();
  b.quilt.sizeBasis='includes-borders';b.quilt.finishedWidth=66;b.quilt.finishedHeight=86;
  const A=fullPlan(a),B=fullPlan(b);
  expect(B.d.centerWidthIn).toBe(60);
  expect(B.d.centerHeightIn).toBe(80);
  expect(B.d.finalWidthIn).toBe(66);
  expect(B.backing.recommended.purchase.roundedPurchaseYards).toBe(A.backing.recommended.purchase.roundedPurchaseYards);
  expect(B.batting.purchase?.roundedPurchaseYards).toBe(A.batting.purchase?.roundedPurchaseYards);
  expect(B.binding.requiredLengthIn).toBe(A.binding.requiredLengthIn);
 });
 it('a border change revokes the existing coverage acknowledgment, unlike a shop rounding change',()=>{
  const p=copy();
  p.quilt.topCutsReviewed=true;p.quilt.topCutsReviewFingerprint=quiltTopReviewFingerprint(p);
  expect(hasCurrentQuiltTopReview(p)).toBe(true);
  const changed=copy();changed.quilt.topCutsReviewed=true;changed.quilt.topCutsReviewFingerprint=p.quilt.topCutsReviewFingerprint;
  changed.borders[0].widthIn=4;
  expect(hasCurrentQuiltTopReview(changed)).toBe(false);
  p.options.step=.25;expect(hasCurrentQuiltTopReview(p)).toBe(true);
 });
 it('old V2 project files with borders require explicit size confirmation, without dropping the original dimensions',()=>{
  const p=copy();delete p.quilt.sizeBasis;
  const legacy=validateProject(p);
  expect(legacy.quilt.finishedWidth).toBe(60);
  expect(legacy.quilt.finishedHeight).toBe(80);
  expect(()=>resolveQuiltDimensions(legacy)).toThrow(/SIZE BASIS NOT CONFIRMED/);
  legacy.quilt.sizeBasis='includes-borders';
  const d=resolveQuiltDimensions(legacy);
  expect([d.finalWidthIn,d.finalHeightIn]).toEqual([60,80]);
  expect([d.centerWidthIn,d.centerHeightIn]).toEqual([54,74]);
  const without=copy();without.borders=[];delete without.quilt.sizeBasis;
  expect(resolveQuiltDimensions(without).finalWidthIn).toBe(60);
 });
 it('rejects a finished size consumed completely by border layers instead of outputting negative geometry',()=>{
  const p=copy();p.quilt.sizeBasis='includes-borders';p.quilt.finishedWidth=6;
  expect(()=>resolveQuiltDimensions(p)).toThrow(/BORDER FIT IMPOSSIBLE/);
 });
});
