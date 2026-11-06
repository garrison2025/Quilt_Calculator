import {describe,expect,it} from 'vitest';
import {cutListCsv,EXPORT_FINGERPRINT_HEADER} from '../src/lib/quilt/cutlist';
import {shoppingCsv, type ShoppingLine} from '../src/lib/quilt/shopping';
import {hashProject,layoutRectangles} from '../src/lib/quilt/math';
import {sampleProject} from '../src/lib/quilt/project';

const first=()=>structuredClone(sampleProject);
const rolls=[
 {material:'Backing',sku:'backing',layout:layoutRectangles(43,[{widthIn:43,heightIn:94,count:2,label:'Backing panel'}])},
 {material:'Color literally named backing',sku:'fabric:backing',layout:layoutRectangles(43,[{widthIn:5,heightIn:8,count:2,label:'Color A'}])}
];
const shop:ShoppingLine[]=[
 {label:'Backing · vertical seams',hint:'Panels',amount:5.25,rawYards:5.23,rollId:'backing'},
 {label:'Color literally named backing',hint:'Pieces',amount:.25,rawYards:.23,rollId:'fabric:backing'}
];
function rows(csv:string):string[][]{
 return csv.replace(/^\uFEFF/,'').trimEnd().split('\r\n').map(r=>r.slice(1,-1).split('","'));
}

describe('matching current project snapshot across independent material exports',()=>{
 it('uses the same eight-digit source fingerprint on every shopping/cut row and in file audit',()=>{
  const p=first(),tag=hashProject(p);
  expect(tag).toMatch(/^[a-f0-9]{8}$/);
  const physical=rows(cutListCsv(rolls,tag));
  const purchases=rows(shoppingCsv(shop,tag));
  expect(physical[0]).toHaveLength(12);
  expect(purchases[0]).toHaveLength(12);
  expect(physical[0][11]).toBe(EXPORT_FINGERPRINT_HEADER);
  expect(purchases[0][11]).toBe(EXPORT_FINGERPRINT_HEADER);
  expect(physical.slice(1).every(row=>row[11]===tag)).toBe(true);
  expect(purchases.slice(1).every(row=>row[11]===tag)).toBe(true);
  expect(purchases[0][10]).toBe('Physical roll ID (matches cut-list CSV)');
  expect(new Set(physical.slice(1).map(r=>r[1]))).toEqual(new Set(['backing','fabric:backing']));
  expect(new Set(purchases.slice(1).map(r=>r[10]))).toEqual(new Set(['backing','fabric:backing']));
 });
 it('changing quantities, dimensions, backing direction or price changes both tags',()=>{
  const base=first(),tag=hashProject(base);
  const variants=[
   (p:typeof base)=>{p.quilt.finishedHeight+=1;},
   (p:typeof base)=>{p.options.backingDirection='horizontal';},
   (p:typeof base)=>{p.options.backingPricePerYard=7;},
   (p:typeof base)=>{p.fabrics[0].pieces[0].count+=1;}
  ];
  for(const change of variants){
   const p=first();change(p);
   const revised=hashProject(p);
   expect(revised,JSON.stringify(p)).not.toBe(tag);
   expect(rows(cutListCsv(rolls,revised))[1][11]).toBe(revised);
   expect(rows(shoppingCsv(shop,revised))[1][11]).toBe(revised);
   expect(rows(cutListCsv(rolls,tag))[1][11]).not.toBe(revised);
  }
 });
 it('maintains original CSV contract for legacy standalone API users without tag',()=>{
  expect(rows(cutListCsv(rolls))[0]).toHaveLength(11);
  expect(rows(shoppingCsv(shop))[0]).toHaveLength(11);
 });
 it('rejects invalid / injection-like fingerprint values before a download',()=>{
  for(const invalid of ['', 'AABBCCDD','1234567','123456789','x".csv','aabbccdd\r\n=HYPERLINK']){
   expect(()=>cutListCsv(rolls,invalid)).toThrow(/fingerprint/);
   expect(()=>shoppingCsv(shop,invalid)).toThrow(/fingerprint/);
  }
 });
 it('incomplete shopping rows keep the snapshot tag and remain incomplete',()=>{
  const tag=hashProject(first());
  const incomplete=shoppingCsv([...shop,{label:'Unused SKU',hint:'No top cuts',status:'not-planned'}],tag);
  const parsed=rows(incomplete);
  expect(parsed[3][9]).toBe('NOT_PLANNED_NO_CUT_PIECES');
  expect(parsed[3][11]).toBe(tag);
  expect(parsed[3][3]).toBe('');
 });
});
