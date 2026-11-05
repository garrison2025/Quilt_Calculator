import { describe, it, expect } from 'vitest';
import { cutListCsv, cutListRows, csvDocument, physicalRollId } from '../src/lib/quilt/cutlist';
import { layoutRectangles, impossible } from '../src/lib/quilt/math';

describe('Cut-list CSV covers every physical piece with safe data boundaries',()=>{
 const a=layoutRectangles(43,[{widthIn:5,heightIn:10,count:3,label:'Blue'}]);
 const b=layoutRectangles(42,[{widthIn:4,heightIn:8,count:2,label:'Red',allowRotate:true}]);
 it('namespaces user fabric and border IDs so reserved rolls and even delimiters cannot collide',()=>{
  const ids=[
   'backing','binding','batting',physicalRollId('fabric','backing'),
   physicalRollId('border','batting'),
   physicalRollId('fabric','border:batting'),
   physicalRollId('border','fabric:backing'),
   physicalRollId('fabric','x/y'),physicalRollId('fabric','x%2Fy'),
   physicalRollId('border','x/y')
  ];
  expect(new Set(ids).size).toBe(ids.length);
  expect(physicalRollId('fabric','backing')).toBe('fabric:backing');
  expect(physicalRollId('border','batting')).toBe('border:batting');
  expect(physicalRollId('fabric','x/y')).toBe('fabric:x%2Fy');
  expect(()=>physicalRollId('fabric','  ')).toThrow(/nonempty/);
 });
 it('rejects duplicate IDs for two separate physical rolls instead of merging their cut rows',()=>{
  const plans=[
   {material:'Actual backing',sku:'backing',layout:a},
   {material:'Color named backing',sku:'backing',layout:b}
  ];
  expect(()=>cutListRows(plans)).toThrow(/Duplicate or empty physical roll ID/);
  const distinct=plans.map((p,i)=>i?{...p,sku:physicalRollId('fabric','backing')}:p);
  expect(cutListRows(distinct)).toHaveLength(5);
  expect(new Set(cutListRows(distinct).map(x=>x[1])).size).toBe(2);
 });
 it('separates SKU rolls and preserves coordinates and grain degrees',()=>{
  const rows=cutListRows([{material:'Blue fabric',sku:'blue',layout:a},{material:'Red fabric',sku:'red',layout:b}]);
  expect(rows).toHaveLength(5);
  expect(rows.map(x=>x[1])).toEqual(['blue','blue','blue','red','red']);
  expect(rows[0]).toEqual(['Blue fabric','blue',1,'Blue 1',0,0,5,10,0,43,10]);
  expect(rows[3][8]).toBe(90);
  expect(rows[3][9]).toBe(42);
 });
 it('writes UTF-8 BOM, CRLF, full headers and the final physical piece',()=>{
  const csv=cutListCsv([{material:'Blue fabric',sku:'blue',layout:a}]);
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  expect(csv.split('\r\n')).toHaveLength(5);
  expect(csv).toContain('"Roll X (in)"');
  expect(csv).toContain('"Blue 3"');
 });
 it('escapes CSV delimiters and formula-bearing labels but preserves negative numbers',()=>{
  const csv=csvDocument([['=SUM(1,2)',' @foo','Alice, "Blue"',-1,0]]);
  expect(csv).toContain("\"'=SUM(1,2)\"");
  expect(csv).toContain("\"' @foo\"");
  expect(csv).toContain('"Alice, ""Blue"""');
  expect(csv).toContain('"-1"');
  expect(csv).toContain('"0"');
 });
 it('does not silently drop physically impossible rolls',()=>{
  expect(()=>cutListCsv([{material:'Blue fabric',sku:'blue',layout:a},{material:'Missing',sku:'bad',layout:impossible(30,'FIT_IMPOSSIBLE')}])).toThrow(/Missing/);
 });
 it('rejects corrupted/overlapping layouts instead of exporting them',()=>{
  const broken=layoutRectangles(43,[{widthIn:10,heightIn:10,count:2}]);
  broken.cutPieces[1].xIn=0;
  expect(()=>cutListCsv([{material:'Corrupted',sku:'c',layout:broken}])).toThrow(/geometry/);
 });
 it('returns no misleading CSV when there are zero physical cuts',()=>{
  expect(()=>cutListCsv([{material:'Empty',sku:'e',layout:layoutRectangles(43,[])}])).toThrow(/No physical cut/);
 });
});
