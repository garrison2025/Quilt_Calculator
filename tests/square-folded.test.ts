import {describe,it,expect} from 'vitest';
import {calculateFoldedCornerSquareLab,calculateSquareLab} from '../src/lib/quilt/square-lab';
import {cutListRows,cutListCsv} from '../src/lib/quilt/cutlist';
import {verifyLayout} from '../src/lib/quilt/math';

describe('square-in-a-square folded-corner method is distinct from the on-point triangular method',()=>{
 const base={finishedOuterIn:8,blocks:4,centerWofIn:43,cornerWofIn:43,cornerExtraIn:0,stepYards:.125};
 it('matches independent quick-corner cut charts for six finished block sizes',()=>{
  const expected=[
   [4,4.5,2.5,4.5],[6,6.5,3.5,6.5],[8,8.5,4.5,8.5],
   [10,10.5,5.5,10.5],[12,12.5,6.5,12.5],[16,16.5,8.5,16.5]
  ] as const;
  for(const [finished,center,corner,unfinished] of expected){
   const r=calculateFoldedCornerSquareLab({...base,finishedOuterIn:finished,blocks:1});
   expect([r.centerCutIn,r.cornerSquareCutIn,r.unfinishedOutsideIn]).toEqual([center,corner,unfinished]);
   expect(r.method).toBe('stitch-and-flip');
   expect([r.centerSquares,r.cornerParentSquares,r.resultingCornerTriangles]).toEqual([1,4,0]);
  }
 });
 it('never reuses on-point geometry or its two parent squares and four PRE-cut triangles',()=>{
  const on=calculateSquareLab(base),folded=calculateFoldedCornerSquareLab(base);
  expect(on.method).toBe('on-point-triangles');
  expect(on.centerCutIn).toBe(6.25);
  expect(on.cornerSquareCutIn).toBe(4.875);
  expect(on.cornerParentSquares).toBe(8);
  expect(on.resultingCornerTriangles).toBe(16);
  expect(folded.centerCutIn).toBe(8.5);
  expect(folded.cornerSquareCutIn).toBe(4.5);
  expect(folded.cornerParentSquares).toBe(16);
  expect(folded.resultingCornerTriangles).toBe(0);
  expect(folded.center.layout.cutPieces).toHaveLength(4);
  expect(folded.corners.layout.cutPieces).toHaveLength(16);
  expect(folded.center.purchase?.roundedPurchaseYards).toBe(.25);
  expect(folded.corners.purchase?.roundedPurchaseYards).toBe(.25);
  expect(verifyLayout(folded.center.layout)).toBe(true);
  expect(verifyLayout(folded.corners.layout)).toBe(true);
 });
 it('labels distinct parents in source CSV and preserves independent fabric SKU rolls',()=>{
  const folded=calculateFoldedCornerSquareLab(base);
  const plans=[
   {material:'Stitch flip base - NOT diagonal',sku:'center-trial',layout:folded.center.layout},
   {material:'Four uncut corners - sew first',sku:'corner-trial',layout:folded.corners.layout}
  ];
  const rows=cutListRows(plans);
  expect(rows).toHaveLength(20);
  expect(rows.filter(x=>x[1]==='center-trial')).toHaveLength(4);
  expect(rows.filter(x=>x[1]==='corner-trial')).toHaveLength(16);
  const csv=cutListCsv(plans);
  expect(csv).toContain('Stitch flip base - NOT diagonal');
  expect(csv).toContain('Four uncut corners - sew first');
  expect(csv).toContain('not an on-point diamond');
  expect(csv).not.toContain('slice each once diagonally');
 });
 it('refuses on-point extra trim allowances instead of misusing them on stitch and flip',()=>{
  expect(()=>calculateFoldedCornerSquareLab({...base,cornerExtraIn:.125})).toThrow(/do not support/);
  expect(()=>calculateFoldedCornerSquareLab({...base,cornerExtraIn:NaN})).toThrow();
  const untouched=structuredClone(base);
  expect(()=>calculateFoldedCornerSquareLab({...untouched,cornerExtraIn:2})).toThrow();
  expect(untouched.cornerExtraIn).toBe(0);
 });
 it('blocks noninteger counts, impossible WOF and invalid dimensions without inventing yards',()=>{
  for(const blocks of [0,1.5,201,Infinity]){
   expect(()=>calculateFoldedCornerSquareLab({...base,blocks})).toThrow();
  }
  for(const finishedOuterIn of [0,Infinity,121,-1]){
   expect(()=>calculateFoldedCornerSquareLab({...base,finishedOuterIn})).toThrow();
  }
  const impossible=calculateFoldedCornerSquareLab({...base,centerWofIn:5,cornerWofIn:43});
  expect(impossible.center.layout.isCutFeasible).toBe(false);
  expect(impossible.center.purchase).toBeUndefined();
  expect(impossible.corners.purchase).toBeDefined();
 });
 it('supports 200 blocks with 800 independent corner-parent cuts; no made-up triangle pre-cuts',()=>{
  const r=calculateFoldedCornerSquareLab({...base,finishedOuterIn:4,blocks:200});
  expect(r.center.layout.cutPieces).toHaveLength(200);
  expect(r.corners.layout.cutPieces).toHaveLength(800);
  expect(verifyLayout(r.center.layout)).toBe(true);
  expect(verifyLayout(r.corners.layout)).toBe(true);
 });
});
