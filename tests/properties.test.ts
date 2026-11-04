import { describe, expect, it } from 'vitest';
import {
 calculateBacking, calculateStraightBinding, calculateBatting, calculateBorders, calculateQuiltFabric,
 calculateYardage, calculateSashing, layoutRectangles, purchase, roundToStep, verifyLayout,
 parseMeasure, inchesToYards, yardsToInches, type PieceRequest
} from '../src/lib/quilt/math';

describe('V2 deterministic geometry property checks', () => {
 // Across a broad range of quantities, every generated roll rectangle must be count-preserving,
 // nonoverlapping, in bounds and an actual physical cutting arrangement.
 for (const count of [1, 2, 7, 19, 57, 333]) {
  it('returns a feasible nonoverlapping layout for ' + count + ' rectangles', () => {
   const r=layoutRectangles(43,[{widthIn:5,heightIn:7,count,label:'test'}]);
   expect(r.isCutFeasible).toBe(true);
   expect(r.cutPieces).toHaveLength(count);
   expect(verifyLayout(r)).toBe(true);
   expect(r.exactFabricRunLengthIn).toBe(Math.ceil(count/8)*7);
   expect(r.physicalOffcutAreaSqIn).toBeGreaterThanOrEqual(0);
  });
 }
 // One-way prints must never rotate grain; the report cannot silently choose shorter rotated rows.
 for (const wof of [13, 24, 37, 43]) {
  it('does not rotate pieces when grain rotation is disabled at WOF ' + wof, () => {
   const r=layoutRectangles(wof,[{widthIn:4,heightIn:9,count:27,allowRotate:false,label:'directional'}]);
   expect(r.isCutFeasible).toBe(true);
   expect(r.cutPieces.every(p=>p.grainRotationDeg===0)).toBe(true);
   expect(verifyLayout(r)).toBe(true);
  });
 }
 // Buy increments must be exact integer multiples and never understate required raw yardage.
 for (const step of [.125,.25,.5,1]) {
  it('rounds only upward to the selected purchase step '+step, () => {
   for (const runIn of [0,1,5,15,36,61,180]) {
    const p=purchase(runIn,step);
    expect(p.roundedPurchaseYards + 1e-8).toBeGreaterThanOrEqual(p.rawPurchaseYards);
    expect(Math.abs(p.roundedPurchaseYards/step-Math.round(p.roundedPurchaseYards/step))).toBeLessThan(1e-6);
    expect(p.purchaseRoundingExtraLengthIn).toBeGreaterThanOrEqual(0);
   }
   expect(Object.is(roundToStep(0,step),-0)).toBe(false);
  });
 }
 // Each declared sewn panel must cover the required target after total take-up.
 for (const [w,h,wof,overage] of [[40,40,43,4],[60,80,43,4],[80,100,44,5],[90,110,50,3]] as const) {
  it('backing panels cover the fabric span for '+w+' × '+h+' quilt', () => {
   const b=calculateBacking({widthIn:w,heightIn:h,wofIn:wof,overageIn:overage,joinTakeupIn:1});
   expect(b.options).toHaveLength(2);
   for (const choice of b.options) {
    const target=choice.direction==='vertical'?b.targetWidthIn:b.targetHeightIn;
    expect(choice.finishedJoinedSpanIn+1e-8).toBeGreaterThanOrEqual(target);
    if(choice.panelCount>1)expect((choice.panelCount-1)*wof-(choice.panelCount-2)).toBeLessThan(target);
    expect(choice.layout.cutPieces.length).toBe(choice.panelCount);
    expect(choice.joinedSeamPositionsIn).toHaveLength(choice.panelCount-1);
    for(let i=0;i<choice.joinedSeamPositionsIn.length;i++){
     const pos=choice.joinedSeamPositionsIn[i];
     expect(pos).toBeCloseTo((i+1)*wof-(i+.5)*1,8);
     expect(pos).toBeGreaterThan(0);
     expect(pos).toBeLessThan(choice.finishedJoinedSpanIn);
     if(i>0)expect(pos).toBeGreaterThan(choice.joinedSeamPositionsIn[i-1]);
    }
    expect(verifyLayout(choice.layout)).toBe(true);
   }
  });
 }
 // Strip count must actually cover perimeter and tail once, with no duplicate allowance.
 for (const [w,h,wof,join] of [[60,80,43,2.5],[100,100,43,2.5],[40,50,36,2]] as const) {
  it('binding total length and joins are internally consistent for '+w+' × '+h, () => {
   const b=calculateStraightBinding({widthIn:w,heightIn:h,wofIn:wof,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:join});
   expect(b.requiredLengthIn).toBe(2*(w+h)+12);
   expect(b.effectiveJoinedLengthIn+1e-8).toBeGreaterThanOrEqual(b.requiredLengthIn);
   expect(verifyLayout(b.layout)).toBe(true);
   expect(b.layout.cutPieces.length).toBe(b.stripCount);
  });
 }
 it('never promises a purchase when the piece cannot fit in WOF', () => {
  const r=calculateYardage({pieceWidthIn:80,pieceHeightIn:60,count:4,wofIn:43,allowRotate:true});
  expect(r.layout.isCutFeasible).toBe(false);
  expect(r.purchase).toBeUndefined();
 });
 it('increasing shrinkage never reduces exact purchase need', () => {
  const a=purchase(180,.125,0),b=purchase(180,.125,7);
  expect(b.rawPurchaseYards).toBeGreaterThan(a.rawPurchaseYards);
  expect(b.roundedPurchaseYards).toBeGreaterThanOrEqual(a.roundedPurchaseYards);
 });
 it('separate SKUs produce separate independent verified fabric lengths', () => {
  const fabrics=[
   {id:'a',label:'blue',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,pieces:[{widthIn:5,heightIn:10,count:10,label:'blue squares'}]},
   {id:'b',label:'red',usableWidth:40,oneWayPrint:true,shrinkageLengthPct:0,pieces:[{widthIn:5,heightIn:10,count:12,label:'red squares'}]}
  ];
  const r=calculateQuiltFabric(fabrics);
  expect(r).toHaveLength(2);
  expect(r[0].fabricSku).toBe('a');
  expect(r[1].fabricSku).toBe('b');
  expect(r.every(x=>verifyLayout(x.layout))).toBe(true);
 });
 it('batting is rejected rather than automatically spliced', () => {
  const r=calculateBatting({widthIn:60,heightIn:80,overageIn:4,rollWidthIn:40});
  expect(r.isCutFeasible).toBe(false);
  expect(r.purchase).toBeUndefined();
 });
 it('sashing strips and cornerstones match explicit grid counts', () => {
  const r=calculateSashing({rows:3,columns:4,blockWidthIn:12,blockHeightIn:11,finishedSashIn:2,seamIn:.25,wofIn:43});
  expect([r.vertical,r.horizontal,r.cornerstones]).toEqual([9,8,6]);
  expect(r.finishedWidthIn).toBe(54);
  expect(r.finishedHeightIn).toBe(37);
  expect(verifyLayout(r.layout)).toBe(true);
 });
 it('border dimensions expand by 2×finished layer width', () => {
  const r=calculateBorders({widthIn:40,heightIn:50,seamIn:.25,layers:[
   {widthIn:2,sku:'a',wofIn:43},{widthIn:3,sku:'b',wofIn:43}
  ]});
  expect([r.finishedWidthIn,r.finishedHeightIn]).toEqual([50,60]);
  expect(r.layers.every(x=>verifyLayout(x.layout))).toBe(true);
 });
 it('whole, decimal and common mixed fractions convert consistently', () => {
  for(const yards of ['1','1.5','3/8','1 3/8','7/8']){
   const parsed=parseMeasure(yards);
   expect(inchesToYards(yardsToInches(parsed))).toBeCloseTo(parsed,10);
  }
 });
 it('rejects nonphysical input before any yardage estimate', () => {
  expect(()=>purchase(-1,.125)).toThrow();
  expect(()=>purchase(100,.125,100)).toThrow();
  expect(()=>layoutRectangles(0,[{widthIn:3,heightIn:4,count:1}])).toThrow();
  expect(()=>parseMeasure('not a fraction')).toThrow();
 });
});
