import {describe,it,expect} from 'vitest';
import {buildCalculatorCopySummary,type CalculatorCopySnapshot} from '../src/lib/quilt/copy-summary';

const sample:CalculatorCopySnapshot={
 toolName:'Quilt Backing Calculator',sourceProjectHash:'a0f91c21',
 calculationVersion:'v2.0',calculatedAt:'2026-11-07T09:00:00.000Z',
 status:'LISTED_CUTS_FEASIBLE',isExample:false,
 context:'Final 60 × 80 in · inch display',
 figures:[
  {label:'Rounded purchase',value:'5 yd'},
  {label:'Backing size',value:'68 × 88 in'},
  {label:'Panels',value:'2'}
 ],
 materialRolls:[{label:'Backing 43in WOF',value:'5 yd'}],
 warnings:['One-way fabric needs matching grain; no cutting pattern is printed.']
};
describe('safe shareable calculation snapshots',()=>{
 it('clearly separates computed fit from physical certification and complete cut list',()=>{
  const text=buildCalculatorCopySummary(sample);
  for(const x of ['a0f91c21','v2.0','60 × 80','5 yd',
   'COMPUTED CUT LAYOUT FEASIBLE','NOT independently sewn or certified',
   'cutting-list CSV','not a 1:1 pattern','HOLD'])
   expect(text).toContain(x);
  expect(text).not.toContain('safeToPurchase:true');
 });
 it('incomplete project can be shared for troubleshooting but NEVER as a buying order',()=>{
  for(const status of ['FIT_IMPOSSIBLE','TOP_CUT_LIST_NOT_REVIEWED','NO_PHYSICAL_CUTS','TOP_FABRIC_NOT_PLANNED'] as const){
   const text=buildCalculatorCopySummary({...sample,status});
   expect(text).toContain('NOT A PURCHASE ORDER');
   expect(text).not.toContain('COMPUTED CUT LAYOUT FEASIBLE');
  }
 });
 it('length conversion can be copied without claiming a fabric width or purchase',()=>{
  const text=buildCalculatorCopySummary({...sample,
   toolName:'Fabric Yards to Inches',status:'LENGTH_CONVERSION',isExample:true,
   figures:[{label:'9 in',value:'0.25 yards = 22.86 cm'}],
   materialRolls:[],warnings:[]});
  expect(text).toContain('LENGTH CONVERSION ONLY');
  expect(text).toContain('SAMPLE PROJECT');
  expect(text).toContain('no fabric width, cutting layout, yardage purchase');
 });
 it('quotes user-generated fabric names as bounded single-line plain text',()=>{
  const text=buildCalculatorCopySummary({...sample,
   figures:[{label:'WOF\n formula',value:'  44\n\t  in'}],
   materialRolls:[{label:'A\r\nB',value:'=HYPERLINK("bad")\t 1 yd'}]});
  expect(text).toContain('WOF formula: 44 in');
  expect(text).toContain('A B: =HYPERLINK');
  expect(text).not.toContain('\r');
  expect(text.split('\n').length).toBeGreaterThan(10);
 });
 it('fails closed for missing or forged source, revision, date or readiness',()=>{
  for(const patch of [
   {sourceProjectHash:'foobar'},
   {calculationVersion:'version2'},
   {calculatedAt:'unknown'},
   {status:'CERTIFIED_SAFE_TO_BUY' as any},
   {figures:[]},
   {warnings:null as any}
  ])expect(()=>buildCalculatorCopySummary({...sample,...patch})).toThrow();
 });
 it('limits large project card counts without silently implying a complete cutting schedule',()=>{
  const text=buildCalculatorCopySummary({...sample,
   figures:Array.from({length:100},(_,i)=>({label:'Quantity '+i,value:'100'})),
   materialRolls:Array.from({length:90},(_,i)=>({label:'SKU '+i,value:'5 yd'})),
   warnings:Array.from({length:17},(_,i)=>'Risk '+i)});
  expect(text).toContain('More result metrics exist');
  expect(text).toContain('Additional material rolls are not shown');
  expect(text).toContain('More warnings are visible');
  expect(text).not.toContain('Quantity 99');
 });
});
