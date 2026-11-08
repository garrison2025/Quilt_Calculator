import {describe,it,expect} from 'vitest';
import {backingReference,bindingReference,borderReference,yardageReference,queenFabricReference,queenFabricTotalYards,formatEighthYards,currentPlannerSample,plannerSampleReference} from '../src/data/seo-reference';
import {sampleProject} from '../src/lib/quilt/project';
import {resolveQuiltDimensions} from '../src/lib/quilt/dimensions';
import {byId,routes} from '../src/data/routes';
import {calculateBacking,calculateStraightBinding,calculateBorders,calculateYardage,calculateQuiltFabric} from '../src/lib/quilt/math';

describe('engine-derived SEO reference tables (not physical certification)',()=>{
 it('keeps butted-border cut lengths and purchases in parity with the real border engine',()=>{
  expect(borderReference).toHaveLength(5);
  expect(borderReference.map(x=>[
   x.startingQuilt,x.borderWidthIn,x.cutWidthIn,x.sideCutLengthIn,
   x.topCutLengthIn,x.runIn,x.yards,x.finishedQuilt
  ])).toEqual([
   ['40 × 50 in',2,2.5,50.5,44.5,95,2.75,'44 × 54 in'],
   ['60 × 80 in',3,3.5,80.5,66.5,147,4.125,'66 × 86 in'],
   ['60 × 80 in',3,3.5,80.5,66.5,147,4.125,'66 × 86 in'],
   ['66 × 86 in',2,2.5,86.5,70.5,157,4.375,'70 × 90 in'],
   ['90 × 90 in',2,2.5,90.5,94.5,185,5.25,'94 × 94 in']
  ]);
  for(const row of borderReference){
   const result=calculateBorders({
    widthIn:row.startWidthIn,heightIn:row.startHeightIn,seamIn:.25,
    layers:[{widthIn:row.borderWidthIn,sku:'reference-layer',label:row.layerLabel,wofIn:row.wofIn,shrinkageLengthPct:0}],
    step:.125
   });
   const layer=result.layers[0];
   expect(layer.layout.isCutFeasible).toBe(true);
   expect(layer.layout.cutPieces).toHaveLength(4);
   expect(layer.cutWidthIn).toBe(row.cutWidthIn);
   expect(layer.sideCutLengthIn).toBe(row.sideCutLengthIn);
   expect(layer.topCutLengthIn).toBe(row.topCutLengthIn);
   expect(layer.layout.exactFabricRunLengthIn).toBe(row.runIn);
   expect(layer.purchase?.roundedPurchaseYards).toBe(row.yards);
   expect(layer.finishedWidthIn+' × '+layer.finishedHeightIn+' in').toBe(row.finishedQuilt);
  }
 });
 it('keeps every calculator title distinct and within the 60-character editorial target',()=>{
  expect(new Set(routes.map(route=>route.title)).size).toBe(routes.length);
  for(const route of routes) expect(route.title.length).toBeLessThanOrEqual(60);
 });
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
  expect(bindingReference).toHaveLength(8);
  const twin=bindingReference.filter(row=>row.quilt==='68 × 86');
  expect(twin.map(row=>[row.stripWidthIn,row.strips,row.runIn,row.yards])).toEqual([[2.25,8,18,.5],[2.5,8,20,.625]]);
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
 it('keeps the queen-size quilt-top example exact and separates both fabric SKUs',()=>{
  expect(queenFabricReference).toHaveLength(2);
  expect(queenFabricReference.map(x=>[x.label,x.pieces,x.cutSize,x.wofIn,x.across,x.rows,x.runIn,x.yards])).toEqual([
   ['Light fabric',72,'8 × 8 in',43,5,15,120,3.375],
   ['Dark fabric',72,'8 × 8 in',43,5,15,120,3.375]
  ]);
  expect(queenFabricTotalYards).toBe(6.75);
  const independent=calculateQuiltFabric([
   {id:'queen-light',label:'Light fabric',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,
    pieces:[{widthIn:8,heightIn:8,count:72,label:'Light squares',allowRotate:false}]},
   {id:'queen-dark',label:'Dark fabric',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,
    pieces:[{widthIn:8,heightIn:8,count:72,label:'Dark squares',allowRotate:false}]}
  ],.125);
  expect(independent.map(x=>[x.layout.isCutFeasible,x.layout.cutPieces.length,x.layout.exactFabricRunLengthIn,x.purchase?.roundedPurchaseYards]))
   .toEqual([[true,72,120,3.375],[true,72,120,3.375]]);
  expect(formatEighthYards(queenFabricTotalYards)).toBe('6 ¾ yd');
 });
 it('keeps live HUB worked-example yardage aligned with border-inclusive source project',()=>{
  const d=resolveQuiltDimensions(sampleProject),o=sampleProject.options;
  const actual=currentPlannerSample();
  expect(actual).toEqual(plannerSampleReference);
  expect([d.centerWidthIn,d.centerHeightIn,d.borderPerSideIn,d.finalWidthIn,d.finalHeightIn])
   .toEqual([60,80,3,66,86]);
  expect([actual.centerWidthIn,actual.centerHeightIn,actual.borderPerSideIn,actual.finalWidthIn,actual.finalHeightIn,
    actual.backingWidthIn,actual.backingHeightIn,actual.usableWofIn,actual.direction,actual.panels,
    actual.backingYards,actual.bindingLengthIn,actual.bindingStrips,actual.bindingYards])
   .toEqual([60,80,3,66,86,74,94,43,'vertical',2,5.25,316,8,0.625]);
  const backing=calculateBacking({widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,overageIn:o.overage,
   wofIn:o.usableWof,joinTakeupIn:o.joinTakeup,oneWayPrint:o.oneWayPrint,
   step:o.step,shrinkageLengthPct:o.lengthShrinkage});
  expect(backing.recommended.direction).toBe(actual.direction);
  expect(backing.recommended.purchase.roundedPurchaseYards).toBe(actual.backingYards);
  const htmlSample=byId('hub').sample;
  expect(htmlSample).toContain('60 × 80 in CENTER');
  expect(htmlSample).toContain('66 × 86 in OUTSIDE');
  expect(htmlSample).toContain('74 × 94 in backing');
  expect(htmlSample).toContain('vertical-seam backing uses 2 panels and 5 ¼ yd');
  expect(htmlSample).toContain('316 in of joined strip, 8 strips and ⅝ yd');
  expect(htmlSample).not.toContain('Vertical backing needs 5 yd');
  expect(byId('hub').faqs.some(([q,a])=>q.includes('iOS or Android app')&&a.includes('not a native App Store'))).toBe(true);
  for(const id of ['backing','binding','batting'] as const)
   expect(byId(id).sample).toContain('Separate unbordered worked example');
 });
 it('formats only genuine eighth-yard increments as truthful US fabric fractions',()=>{
  expect(formatEighthYards(0)).toBe('0 yd');
  expect(formatEighthYards(.625)).toBe('⅝ yd');
  expect(formatEighthYards(1.125)).toBe('1 ⅛ yd');
  expect(formatEighthYards(5)).toBe('5 yd');
  expect(()=>formatEighthYards(.251)).toThrow();
 });
});
