import {describe,it,expect} from 'vitest';
import {sampleProject,hasCurrentQuiltTopReview,quiltTopReviewFingerprint,validateProject} from '../src/lib/quilt/project';
import {parseBulkCutGroups,previewBulkCutAppend} from '../src/lib/quilt/bulk-cuts';
const fresh=()=>structuredClone(sampleProject);
describe('Paste multiple real cut groups into ONE physical fabric SKU',()=>{
 it('accepts Excel/Sheets tab-separated headers, mixed fractions and optional rotation',()=>{
  const paste='Label\tCut width\tCut height\tCount\tRotate\nBlue squares\t5\t5\t12\tNo\nCorner pieces\t3 1/2\t4\t8\tYes';
  expect(parseBulkCutGroups(paste,'in')).toEqual([
   {label:'Blue squares',widthIn:5,heightIn:5,count:12,allowRotate:false},
   {label:'Corner pieces',widthIn:3.5,heightIn:4,count:8,allowRotate:true}
  ]);
  const p=fresh();
  const before=structuredClone(p);
  const preview=previewBulkCutAppend(p,0,paste);
  expect(preview).toMatchObject({addedGroups:2,addedPieces:20,targetSku:'sky-blue'});
  expect(p).toEqual(before);
  expect(preview.project.fabrics[0].pieces).toHaveLength(3);
  expect(preview.project.fabrics[1]).toEqual(p.fabrics[1]);
  expect(preview.project.fabrics[0].pieces[2].count).toBe(8);
  expect(validateProject(preview.project).schemaVersion).toBe(2);
 });
 it('accepts RFC4180 quoted CSV with commas and escaped quotes in labels',()=>{
  const paste='Label,Cut width,Cut height,Count,Rotate\r\n"Blue, ""tiny"" blocks",1 3/8,2 1/4,6,Yes\r\n';
  expect(parseBulkCutGroups(paste,'in')).toEqual([
   {label:'Blue, "tiny" blocks',widthIn:1.375,heightIn:2.25,count:6,allowRotate:true}
  ]);
  expect(parseBulkCutGroups('"4,000 rectangles",5,4,2', 'in')[0].label).toBe('4,000 rectangles');
  expect(parseBulkCutGroups('A,5,6,2','in')[0].allowRotate).toBe(false);
  expect(parseBulkCutGroups('A,1/4,3/8,1,TRUE','in')[0].widthIn).toBe(.25);
 });
 it('converts current centimetre inputs to internal inches, never guesses unit',()=>{
  const p=fresh();p.units='cm';
  const result=previewBulkCutAppend(p,1,'Centimeter squares\t25.4\t12.7\t4\tNo');
  expect(result.project.fabrics[1].pieces.at(-1)).toMatchObject({
   label:'Centimeter squares',widthIn:10,heightIn:5,count:4,allowRotate:false
  });
  expect(p.fabrics[1].pieces).toHaveLength(1);
  expect(()=>parseBulkCutGroups('Test,5,5,2','mm' as 'in')).toThrow(/inches or centimeters/);
 });
 it('invalidates any old quilt-top review and cannot alter the original',()=>{
  const p=fresh();p.quilt.topCutsReviewed=true;
  p.quilt.topCutsReviewFingerprint=quiltTopReviewFingerprint(p);
  expect(hasCurrentQuiltTopReview(p)).toBe(true);
  const previous=JSON.stringify(p);
  const preview=previewBulkCutAppend(p,0,'New cut\t5\t5\t4\tno');
  expect(JSON.stringify(p)).toBe(previous);
  expect(preview.project.quilt.topCutsReviewed).toBe(false);
  expect(preview.project.quilt.topCutsReviewFingerprint).toBeUndefined();
  expect(hasCurrentQuiltTopReview(preview.project)).toBe(false);
 });
 it('rejects ambiguous/malformed rows with actionable line numbers and no partial writes',()=>{
  const invalid=[
   ['A\t5\t5',/Row 1: use 4 or 5 columns/],
   ['A,5,5,2,Maybe',/Row 1: Rotate/],
   ['A,0,5,2',/Row 1: physical cut/],
   ['A,-5,5,2',/Row 1: invalid cut width/],
   ['A,5,5,0',/Row 1: quantity/],
   ['A,5,5,2.5',/Row 1: quantity/],
   ['A,5,5,2001',/Row 1: quantity/],
   ['A,5,5,2,Yes,EXTRA',/Row 1: use 4 or 5 columns/],
   ['A,5,5,2\nBroken,5,5,oops',/Row 2: invalid cut quantity/],
   ['Label,Cut width,Cut height,Count,Rotate',/header alone/],
   ['"unfinished,5,5,2',/Unclosed quoted/],
   ['A,5,5,2\nB,5,5,2\nC,5,5,2\nOops',/Row 4: use 4 or 5 columns/]
  ] as const;
  const p=fresh(),original=JSON.stringify(p);
  for(const [input,message] of invalid){
   expect(()=>previewBulkCutAppend(p,0,input),input).toThrow(message);
   expect(JSON.stringify(p)).toBe(original);
  }
  expect(()=>previewBulkCutAppend(p,-1,'A,5,5,2')).toThrow(/existing fabric SKU/);
  expect(()=>previewBulkCutAppend(p,99,'A,5,5,2')).toThrow(/existing fabric SKU/);
 });
 it('honors 100 groups per fabric and 2,000 pieces across ALL SKUs atomically',()=>{
  const p=fresh();
  p.fabrics[0].pieces=Array.from({length:99},(_,i)=>({label:'Cut '+i,widthIn:2,heightIn:2,count:1}));
  const one=previewBulkCutAppend(p,0,'One,2,2,1');
  expect(one.project.fabrics[0].pieces).toHaveLength(100);
  expect(()=>previewBulkCutAppend(p,0,'A,2,2,1\nB,2,2,1')).toThrow(/at most 100/);
  const max=fresh();max.fabrics[0].pieces[0].count=1992;
  max.fabrics[1].pieces[0].count=8;
  expect(()=>validateProject(max)).not.toThrow();
  expect(()=>previewBulkCutAppend(max,0,'Beyond cap,1,1,1')).toThrow(/2,000/);
  expect(max.fabrics[0].pieces).toHaveLength(1);
  expect(max.fabrics[1].pieces[0].count).toBe(8);
  const rows=Array.from({length:101},(_,i)=>'Group '+i+',2,3,1').join('\n');
  expect(()=>parseBulkCutGroups(rows,'in')).toThrow(/100 cut groups/);
  expect(()=>parseBulkCutGroups('A,2,3,1\n'.repeat(8000),'in')).toThrow(/too long/);
 });
});
