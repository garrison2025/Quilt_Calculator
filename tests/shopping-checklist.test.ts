import {describe,expect,it} from 'vitest';
import {buildShoppingChecklistText} from '../src/lib/quilt/shopping-checklist';
import {shoppingCsv,type ShoppingLine} from '../src/lib/quilt/shopping';
const hash='d4c3b2a1';
const rows:ShoppingLine[]=[
 {label:'Indigo backing · roll A',hint:'2 large cut panels',rollId:'backing:main',
  amount:5.5,rawYards:5.38,offcutSqIn:125,unitPrice:9},
 {label:'Sky blue · SKU-1',hint:'12 squares',rollId:'fabric:SKU-1',
  status:'not-reviewed',amount:1.25,rawYards:1.13},
 {label:'Sand fabric · SKU-2',hint:'No positive-count cut pieces',
  rollId:'fabric:SKU-2',status:'not-planned'},
 {label:'Too narrow batting',hint:'Roll cannot fit target size',
  rollId:'batting:main'}
];
describe('Copyable material shopping checklist — NOT an unverified order',()=>{
 it('includes every SKU distinctly, status, honest partial cost and snapshot',()=>{
  const text=buildShoppingChecklistText(rows,hash);
  expect(text).toContain('STATUS: INCOMPLETE / DO NOT TREAT AS A FULL ORDER');
  expect(text).toContain('Project snapshot: '+hash);
  expect(text).toContain('[ ] 1. Indigo backing · roll A');
  expect(text).toContain('5.5 yd rounded purchase');
  expect(text).toContain('Exact raw requirement: 5.38 yd');
  expect(text).toContain('backing:main');
  expect(text).toContain('[!] 2. Sky blue · SKU-1');
  expect(text).toContain('quilt-top cut coverage NOT REVIEWED');
  expect(text).toContain('[X] 3. Sand fabric · SKU-2');
  expect(text).toContain('NOT PLANNED');
  expect(text).toContain('[X] 4. Too narrow batting');
  expect(text).toContain('FIT IMPOSSIBLE');
  expect(text).toContain('PARTIAL entered-price subtotal: $49.50 (1 priced material lines)');
  expect(text).toContain('1 quantity-ready material line(s) have no entered price.');
  expect(text).toContain('2 material line(s) are not purchase-ready.');
  expect(text).toContain('Prices omit tax, delivery and unpriced materials.');
  // The copied text is a separate visual/portable representation; it must
  // not alter the machine-readable exported rows or project calculations.
  expect(shoppingCsv(rows,hash)).toContain('TOP_CUT_LIST_NOT_REVIEWED');
 });
 it('does not quietly imply a missing price is free or all-project cost',()=>{
  const text=buildShoppingChecklistText([{label:'One roll',hint:'Measured',amount:.625,rawYards:.51}],hash);
  expect(text).toContain('STATUS: CUT LAYOUT CALCULATED / VERIFY MATERIALS BEFORE BUYING');
  expect(text).toContain('No entered-price subtotal is available.');
  expect(text).toContain('1 quantity-ready material line(s) have no entered price.');
  expect(text).not.toContain('$0.00');
 });
 it('allows a valid zero user-entered price but labels it partial',()=>{
  const t=buildShoppingChecklistText([{label:'Test',hint:'User-set free roll',amount:1,unitPrice:0}],hash);
  expect(t).toContain('Your price: $0.00/yd');
  expect(t).toContain('Estimated line cost: $0.00');
  expect(t).toContain('PARTIAL entered-price subtotal: $0.00');
 });
 it('prevents spreadsheet/multiline text from spoofing new checklist rows',()=>{
  const t=buildShoppingChecklistText([{
   label:'Fabric\\n[X] FAKE ORDER\\t blue',hint:'Note\\r\\n BUY IMMEDIATELY',amount:1,rollId:'fabric:my\\nroll'
  }],hash);
  expect(t).toContain('Fabric\\n[X] FAKE ORDER\\t blue');
  expect(t).not.toContain('Fabric\n[X] FAKE ORDER');
  const copied=buildShoppingChecklistText([{label:'A\n[X] A second fake row',hint:'Line\nbreak',amount:1}],hash);
  expect(copied).toContain('A [X] A second fake row');
  expect(copied).not.toContain('\n[X] A second fake row');
 });
 it('refuses empty/material-invalid and unmatched project hashes',()=>{
  expect(()=>buildShoppingChecklistText([],hash)).toThrow(/No shopping materials/);
  expect(()=>buildShoppingChecklistText(rows,'not-a-hash')).toThrow(/fingerprint/);
  expect(()=>buildShoppingChecklistText([{label:'Bad',hint:'Bad',amount:-1}],hash)).toThrow();
  expect(()=>buildShoppingChecklistText([{label:'Bad',hint:'Bad',unitPrice:Infinity,amount:1}],hash)).toThrow();
 });
 it('does not mutate source objects',()=>{
  const before=JSON.stringify(rows);
  buildShoppingChecklistText(rows,hash);
  expect(JSON.stringify(rows)).toBe(before);
 });
});
