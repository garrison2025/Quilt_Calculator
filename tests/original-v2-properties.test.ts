import {describe,it,expect} from 'vitest';
import {
 calculateBacking,calculateStraightBinding,calculateYardage,calculateQuiltFabric,
 calculateBatting,calculateSashing,calculateBorders,calculateWofArea,
 layoutRectangles,parseMeasure,yardsToInches,purchase,verifyLayout
} from '../src/lib/quilt/math';
import {sampleProject,validateProject} from '../src/lib/quilt/project';

/** Tests mapped to the ORIGINAL 24-row "性质测试24" worksheet, rather
 * than equating an arbitrary new test count with original acceptance.
 * P19: mitered-border sewn construction unimplemented; cannot fully prove.
 * P21: shared state and invalidation also require browser evidence.
 * P23: end-to-end drawn SVG coordinate-label audit still partial.
 * P24: physical printed 1-in/25.4-mm line needs measured paper, NOT_RUN.
 */
describe('original V2 property-matrix IDs: reproducible automated portion',()=>{
 it('P01 fraction conversion exact fabric lengths',()=>{
  expect(yardsToInches(parseMeasure('1/4'))).toBe(9);
  expect(yardsToInches(parseMeasure('3/8'))).toBe(13.5);
  expect(yardsToInches(parseMeasure('1 3/8'))).toBe(49.5);
 });
 it('P02 increasing backing overage never decreases raw minimum purchase',()=>{
  let previous=-1;
  for(const overage of [0,.5,1,2,4,8]){
   const b=calculateBacking({widthIn:60,heightIn:80,overageIn:overage,wofIn:43,joinTakeupIn:1});
   expect(b.recommended.purchase.rawPurchaseYards).toBeGreaterThanOrEqual(previous);
   previous=b.recommended.purchase.rawPurchaseYards;
  }
 });
 it('P03 decreasing WOF never lowers minimum panel count',()=>{
  let previous=0;
  for(const width of [108,70,43,40,30,20]){
   const b=calculateBacking({widthIn:60,heightIn:80,overageIn:4,wofIn:width,joinTakeupIn:1});
   expect(Math.min(...b.options.map(x=>x.panelCount))).toBeGreaterThanOrEqual(previous);
   previous=Math.min(...b.options.map(x=>x.panelCount));
  }
 });
 it('P04 independent panel span minus seam losses covers backing target',()=>{
  for(const wof of [36,43,108]){
   const b=calculateBacking({widthIn:60,heightIn:80,overageIn:4,wofIn:wof,joinTakeupIn:1});
   for(const option of b.options){
    const required=option.direction==='vertical'?b.targetWidthIn:b.targetHeightIn;
    expect(option.panelCount*wof-(option.panelCount-1)).toBeGreaterThanOrEqual(required);
    expect(verifyLayout(option.layout)).toBe(true);
   }
  }
 });
 it('P05 one-way print restricts backing to unrotated legal direction',()=>{
  const b=calculateBacking({widthIn:60,heightIn:80,overageIn:4,wofIn:43,joinTakeupIn:1,oneWayPrint:true});
  expect(b.options.map(x=>x.direction)).toEqual(['vertical']);
 });
 it('P06 prewash correction affects purchase once, not cut geometry twice',()=>{
  const input={widthIn:60,heightIn:80,overageIn:4,wofIn:43,joinTakeupIn:1};
  const a=calculateBacking({...input,shrinkageLengthPct:0});
  const b=calculateBacking({...input,shrinkageLengthPct:5});
  expect(b.recommended.layout.exactFabricRunLengthIn).toBe(a.recommended.layout.exactFabricRunLengthIn);
  expect(b.recommended.purchase.rawPurchaseYards).toBeCloseTo(a.recommended.purchase.rawPurchaseYards/.95,10);
 });
 it('P07 increased binding join loss cannot decrease whole strip count',()=>{
  let count=0;
  for(const loss of [0,.5,1,2.5,4,8]){
   const r=calculateStraightBinding({widthIn:60,heightIn:80,wofIn:43,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:loss});
   expect(r.stripCount).toBeGreaterThanOrEqual(count);
   count=r.stripCount;
  }
 });
 it('P08 larger quilt perimeter cannot lower required binding length',()=>{
  let previous=0;
  for(const s of [20,30,40,60,80]){
   const r=calculateStraightBinding({widthIn:s,heightIn:s,wofIn:43,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:2.5});
   expect(r.requiredLengthIn).toBeGreaterThanOrEqual(previous);
   previous=r.requiredLengthIn;
  }
 });
 it('P09 emitted fabric rectangles are mutually non-overlapping',()=>{
  const l=layoutRectangles(43,[{widthIn:5,heightIn:10,count:20},{widthIn:4,heightIn:4,count:13}]);
  expect(verifyLayout(l)).toBe(true);
  for(let i=0;i<l.cutPieces.length;i++)for(let j=i+1;j<l.cutPieces.length;j++){
   const a=l.cutPieces[i],b=l.cutPieces[j];
   const overlapX=Math.min(a.xIn+a.widthIn,b.xIn+b.widthIn)-Math.max(a.xIn,b.xIn);
   const overlapY=Math.min(a.yIn+a.heightIn,b.yIn+b.heightIn)-Math.max(a.yIn,b.yIn);
   expect(overlapX<=0||overlapY<=0).toBe(true);
  }
 });
 it('P10 every cut lies within WOF and raw purchased roll length',()=>{
  const r=calculateYardage({pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:43});
  const maxLen=(r.purchase?.rawPurchaseYards||0)*36;
  for(const p of r.layout.cutPieces){
   expect(p.xIn).toBeGreaterThanOrEqual(0);
   expect(p.yIn).toBeGreaterThanOrEqual(0);
   expect(p.xIn+p.widthIn).toBeLessThanOrEqual(43);
   expect(p.yIn+p.heightIn).toBeLessThanOrEqual(maxLen);
  }
 });
 it('P11 directional grain forbids 90-degree rectangle rotations',()=>{
  const r=calculateYardage({pieceWidthIn:8,pieceHeightIn:5,count:21,wofIn:43,allowRotate:false});
  expect(r.layout.cutPieces.every(x=>x.grainRotationDeg===0)).toBe(true);
 });
 it('P12 every piece group is exported exactly once per requested count',()=>{
  const l=layoutRectangles(43,[{widthIn:5,heightIn:5,count:12,label:'Blue'},
   {widthIn:4,heightIn:8,count:8,label:'Sand'}]);
  expect(l.cutPieces).toHaveLength(20);
  expect(l.cutPieces.filter(p=>p.label.startsWith('Blue'))).toHaveLength(12);
  expect(l.cutPieces.filter(p=>p.label.startsWith('Sand'))).toHaveLength(8);
 });
 it('P13 purchased linear length covers all pieces and never underbuys exact run',()=>{
  for(const r of [{w:43,pw:5,ph:10,c:20},{w:50,pw:8,ph:7,c:43}]){
   const y=calculateYardage({pieceWidthIn:r.pw,pieceHeightIn:r.ph,count:r.c,wofIn:r.w});
   expect(y.purchase!.roundedPurchaseYards).toBeGreaterThanOrEqual(y.purchase!.rawPurchaseYards);
   expect(y.purchase!.roundedPurchaseYards*36).toBeGreaterThanOrEqual(y.layout.exactFabricRunLengthIn);
  }
 });
 it('P14 fabric SKU color isolation uses two independent roll plans',()=>{
  const fabrics=[
   {id:'blue',label:'Blue',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,pieces:[{widthIn:5,heightIn:5,count:12}]},
   {id:'sand',label:'Sand',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,pieces:[{widthIn:4,heightIn:8,count:8}]}
  ];
  const p=calculateQuiltFabric(fabrics);
  expect(p).toHaveLength(2);
  expect(p.map(x=>x.fabricSku)).toEqual(['blue','sand']);
  expect(p.map(x=>x.layout.cutPieces.length)).toEqual([12,8]);
  expect(p.every(x=>verifyLayout(x.layout))).toBe(true);
 });
 it('P15 shelf packing is never labelled a global optimal cut layout',()=>{
  const l=layoutRectangles(43,[{widthIn:7,heightIn:13,count:9},{widthIn:5,heightIn:8,count:7}]);
  expect(l.globallyOptimal).toBe(false);
 });
 it('P16 batting one-piece fit requires a roll wide enough in a legal orientation',()=>{
  const bad=calculateBatting({widthIn:60,heightIn:80,overageIn:4,rollWidthIn:40,rotate:false});
  expect(bad.isCutFeasible).toBe(false);expect(bad.purchase).toBeUndefined();
  const good=calculateBatting({widthIn:60,heightIn:80,overageIn:4,rollWidthIn:96,rotate:false});
  expect(good.isCutFeasible).toBe(true);expect(good.layout.cutPieces).toHaveLength(1);
 });
 it('P17 internal sashing strips and cornerstones match grid formula',()=>{
  const s=calculateSashing({rows:4,columns:5,blockWidthIn:10,blockHeightIn:10,finishedSashIn:2,seamIn:.25,wofIn:43});
  expect([s.vertical,s.horizontal,s.cornerstones]).toEqual([16,15,12]);
 });
 it('P18 each consecutive butted border increases final dimensions by 2x finished width',()=>{
  const widths=[2,3,4],baseW=60,baseH=80;
  const r=calculateBorders({widthIn:baseW,heightIn:baseH,seamIn:.25,
   layers:widths.map((widthIn,i)=>({widthIn,wofIn:108,sku:'b'+i}))});
  expect(r.finishedWidthIn).toBe(baseW+2*widths.reduce((a,b)=>a+b,0));
  expect(r.finishedHeightIn).toBe(baseH+2*widths.reduce((a,b)=>a+b,0));
 });
 it('P20 equivalent area alone does not certify the actual cut fits in a narrower WOF',()=>{
  expect(calculateWofArea(1.5,44,108)).toBeCloseTo(0.611111111,8);
  const fit=calculateYardage({pieceWidthIn:50,pieceHeightIn:10,count:1,wofIn:44,allowRotate:false});
  expect(fit.layout.isCutFeasible).toBe(false);
  expect(fit.purchase).toBeUndefined();
 });
 it('P22 invalid schema versions, NaN, negative and extreme project input fail',()=>{
  const variants=[
   (p:any)=>p.schemaVersion=7,
   (p:any)=>p.quilt.finishedWidth=NaN,
   (p:any)=>p.quilt.finishedHeight=-1,
   (p:any)=>p.options.usableWof=1000000,
   (p:any)=>p.yardage.count=2001
  ];
  for(const mutate of variants){
   const p=structuredClone(sampleProject);mutate(p);
   expect(()=>validateProject(p)).toThrow();
  }
 });
});