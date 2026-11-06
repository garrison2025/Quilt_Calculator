import {describe,it,expect} from 'vitest';
import {calculateSquareLab} from '../src/lib/quilt/square-lab';
import {verifyLayout} from '../src/lib/quilt/math';
import {cutListRows,cutListCsv} from '../src/lib/quilt/cutlist';

describe('isolated square-in-square engineering preview (not real-sewn certified)',()=>{
 it('computes conservative 12-inch center and corner parents on two independent rolls',()=>{
  const r=calculateSquareLab({finishedOuterIn:12,blocks:4,centerWofIn:43,cornerWofIn:43,cornerExtraIn:.25});
  expect(r.unfinishedOutsideIn).toBe(12.5);
  expect(r.centerCutIn).toBe(9);
  expect(r.intendedFinishedCenterIn).toBe(8.5);
  expect(r.cornerSquareCutIn).toBe(7.125);
  expect([r.centerSquares,r.cornerParentSquares,r.resultingCornerTriangles]).toEqual([4,8,16]);
  expect(r.center.layout.exactFabricRunLengthIn).toBe(9);
  expect(r.corners.layout.exactFabricRunLengthIn).toBe(14.25);
  expect(r.center.purchase?.roundedPurchaseYards).toBe(.25);
  expect(r.corners.purchase?.roundedPurchaseYards).toBe(.5);
  expect(verifyLayout(r.center.layout)&&verifyLayout(r.corners.layout)).toBe(true);
 });
 it('matches 4- and 8-inch published dimensional charts under the explicit trial rule',()=>{
  const params={blocks:1,centerWofIn:43,cornerWofIn:43,cornerExtraIn:0};
  const four=calculateSquareLab({...params,finishedOuterIn:4});
  expect(four.centerCutIn).toBe(3.375);
  expect(four.cornerSquareCutIn).toBe(2.875);
  const eight=calculateSquareLab({...params,finishedOuterIn:8});
  expect(eight.centerCutIn).toBe(6.25);
  expect(eight.cornerSquareCutIn).toBe(4.875);
 });
 it('matches independently published 4, 8, 12 and 16in one-round square charts, not stitch-and-flip',()=>{
  // Published charts for one-center plus TWO once-diagonally cut corners:
  // center = finished / sqrt(2) + 1/2; corners = finished / 2 + 7/8.
  const expected=[
   [4,3.375,2.875,4.5],
   [6,4.75,3.875,6.5],
   [8,6.25,4.875,8.5],
   [10,7.625,5.875,10.5],
   [12,9,6.875,12.5],
   [16,11.875,8.875,16.5]
  ] as const;
  for(const [finished,center,corner,unfinished] of expected){
   const r=calculateSquareLab({finishedOuterIn:finished,blocks:1,centerWofIn:43,cornerWofIn:43,cornerExtraIn:0});
   expect([r.centerCutIn,r.cornerSquareCutIn,r.unfinishedOutsideIn],
    'Finished one-round block '+finished).toEqual([center,corner,unfinished]);
   expect(r.centerSquares).toBe(1);
   expect(r.cornerParentSquares).toBe(2);
   expect(r.resultingCornerTriangles).toBe(4);
   expect(r.centerCutIn+1e-10).toBeGreaterThanOrEqual(finished/Math.SQRT2+.5);
   expect(r.cornerSquareCutIn+1e-10).toBeGreaterThanOrEqual(finished/2+.875);
  }
 });
 it('does not provide a purchasing estimate for a physically impossible WOF',()=>{
  const r=calculateSquareLab({finishedOuterIn:12,blocks:2,centerWofIn:5,cornerWofIn:43,cornerExtraIn:.25});
  expect(r.center.layout.isCutFeasible).toBe(false);
  expect(r.center.purchase).toBeUndefined();
  expect(r.corners.purchase).toBeDefined();
 });
 it('keeps cutting-list SKUs separate with one center and two parent squares per block',()=>{
  const r=calculateSquareLab({finishedOuterIn:12,blocks:4,centerWofIn:43,cornerWofIn:43,cornerExtraIn:.25});
  const plans=[
    {material:'Center',sku:'center',layout:r.center.layout},
    {material:'Corners',sku:'corners',layout:r.corners.layout}
  ];
  const rows=cutListRows(plans);
  expect(rows).toHaveLength(12);
  expect(rows.filter(x=>x[1]==='center')).toHaveLength(4);
  expect(rows.filter(x=>x[1]==='corners')).toHaveLength(8);
  const csv=cutListCsv(plans);
  expect(csv.includes('"center"')&&csv.includes('"corners"')).toBe(true);
 });
 it('verifies the 200-block upper boundary without fabric mixing',()=>{
  const r=calculateSquareLab({finishedOuterIn:8,blocks:200,centerWofIn:43,cornerWofIn:43,cornerExtraIn:.25});
  expect(r.center.layout.cutPieces).toHaveLength(200);
  expect(r.corners.layout.cutPieces).toHaveLength(400);
  expect(verifyLayout(r.center.layout)).toBe(true);
  expect(verifyLayout(r.corners.layout)).toBe(true);
 });
 it('refuses unsupported finished sizes, WOF, trim and purchase steps',()=>{
  const input={finishedOuterIn:12,blocks:4,centerWofIn:43,cornerWofIn:43,cornerExtraIn:.25,stepYards:.125};
  const cases=[
   {finishedOuterIn:1},{finishedOuterIn:121},{finishedOuterIn:Infinity},
   {blocks:0},{blocks:201},{blocks:1.5},{centerWofIn:0},
   {cornerWofIn:121},{cornerExtraIn:-1},{cornerExtraIn:3},
   {stepYards:0},{stepYards:2}
  ];
  for(const change of cases)expect(()=>calculateSquareLab({...input,...change}),JSON.stringify(change)).toThrow();
 });
});