import {describe,expect,it} from 'vitest';
import {cutListCsv,type MaterialCutPlan} from '../src/lib/quilt/cutlist';
import {fullPrintableCutSheets} from '../src/lib/quilt/full-printable-cuts';
import {layoutRectangles,impossible} from '../src/lib/quilt/math';

const hash='a12f0b9c';
const make=(sku:string,count:number,label='Square'):MaterialCutPlan=>({
 material:'Fabric '+sku,sku,
 layout:layoutRectangles(43,[{widthIn:5,heightIn:5,count,label}])
});

describe('Complete printable coordinate workbook (offline HTML, no 45-row cutoff)',()=>{
 it('provides every physical coordinate and roll identity, matching the source CSV',()=>{
  const plans=[make('fabric:blue',50,'Blue'),make('fabric:red',6,'Red')];
  const html=fullPrintableCutSheets(plans,hash);
  const csv=cutListCsv(plans,hash);
  expect(html).toContain('<!doctype html>');
  expect(html).toContain('Complete physical cutting checklist');
  expect(html).toContain('Source Project V2: '+hash);
  expect(html).toContain('56 actual cuts across 2 independent physical rolls');
  expect(html).toContain('Physical roll ID: <strong>fabric:blue</strong>');
  expect(html).toContain('Physical roll ID: <strong>fabric:red</strong>');
  expect((html.match(/<tr data-cut-number="/g)||[]).length).toBe(56);
  expect((html.match(/<section class="roll"/g)||[]).length).toBe(2);
  expect(html).toContain('<tr data-cut-number="50">');
  expect(html).toContain('<tr data-cut-number="6">');
  expect(html).toContain('Grain rotation');
  expect(html).toContain('Roll X runs across usable WOF');
  expect(html).toContain('NOT actual-size templates');
  expect(csv).toContain('"Blue 50"');
  expect(html).toContain('Blue 50');
  expect(html).toContain('Red 6');
 });
 it('scales to a 30-roll 2,000-piece project without skipping any piece',()=>{
  const plans=Array.from({length:30},(_,i)=>make('fabric:stress-'+i,i===0?181:i===29?83:62,'Cut '+i));
  const html=fullPrintableCutSheets(plans,hash);
  expect((html.match(/<tr data-cut-number="/g)||[])).toHaveLength(2000);
  expect((html.match(/<section class="roll"/g)||[])).toHaveLength(30);
  expect(html).toContain('2,000 actual cuts across 30 independent physical rolls');
  expect(html).toContain('<tr data-cut-number="181">');
  expect(html).toContain('Cut 0 181');
  expect(html).toContain('Cut 29 83');
  expect(html).toContain('Roll 30: Fabric fabric:stress-29');
  expect(html.length).toBeLessThan(800_000);
 });
 it('escapes user-provided labels, roll IDs and material names without scripts or remote dependencies',()=>{
  const material='<script>alert("x")</script> & <img src=x onerror=alert(1)>';
  const sku='roll"><iframe src="https://evil.test">';
  const plan=make(sku,1,material);
  plan.material=material;
  const html=fullPrintableCutSheets([plan],hash);
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('<iframe');
  expect(html).not.toContain('<img ');
  expect(html).not.toContain('src="https://');
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('&lt;iframe');
  expect(html).toContain('&amp;');
  expect(html).toContain('default-src &#39;none&#39;');
  expect(html).toContain('Print → Save as PDF');
 });
 it('preserves numeric coordinates and grain rotation',()=>{
  const plan=make('single',2,'Rotated');
  const cut=plan.layout.cutPieces[0];
  const html=fullPrintableCutSheets([plan],hash);
  expect(html).toContain('<td>'+String(cut.xIn)+'</td><td>'+String(cut.yIn)+'</td>');
  expect(html).toContain('<td>'+String(cut.widthIn)+'</td><td>'+String(cut.heightIn)+'</td>');
  expect(html).toContain('<td>'+String(cut.grainRotationDeg)+'°</td>');
  expect(html).toContain('@page{size:letter landscape');
  expect(html).toContain('thead{display:table-header-group');
 });
 it('does not silently discard a zero-cut SKU when another roll has cuts',()=>{
  const plans=[make('actual',3),{material:'Unused fabric',sku:'unused',layout:layoutRectangles(43,[])}];
  const html=fullPrintableCutSheets(plans,hash);
  expect(html).toContain('2 independent physical rolls');
  expect(html).toContain('NO PHYSICAL CUTS FOR THIS ROLL');
  expect(html).toContain('Unused fabric');
  expect((html.match(/<tr data-cut-number="/g)||[])).toHaveLength(3);
 });
 it('rejects unverified cuts, duplicate roll IDs, empty projects or missing hash',()=>{
  const valid=make('a',2);
  expect(()=>fullPrintableCutSheets([],hash)).toThrow(/No physical cutting coordinates/);
  expect(()=>fullPrintableCutSheets([make('empty',0)],hash)).toThrow(/No physical cutting coordinates/);
  expect(()=>fullPrintableCutSheets([valid],'bad-hash')).toThrow(/fingerprint/);
  expect(()=>fullPrintableCutSheets([valid],'')).toThrow(/fingerprint/);
  expect(()=>fullPrintableCutSheets([valid,make('a',1)],hash)).toThrow(/Duplicate/);
  expect(()=>fullPrintableCutSheets([valid,{material:'Bad',sku:'bad',layout:impossible(30,'FIT_IMPOSSIBLE')}],hash)).toThrow(/blocked/);
  const broken=make('broken',2);
  broken.layout.cutPieces[1].xIn=broken.layout.cutPieces[0].xIn;
  broken.layout.cutPieces[1].yIn=broken.layout.cutPieces[0].yIn;
  expect(()=>fullPrintableCutSheets([broken],hash)).toThrow(/geometry/);
 });
 it('never mutates source plans or their independently verified pieces',()=>{
  const plans=[make('a',3),make('b',4)];
  const before=JSON.stringify(plans);
  fullPrintableCutSheets(plans,hash);
  expect(JSON.stringify(plans)).toBe(before);
 });
});
