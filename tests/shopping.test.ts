import {describe,expect,it} from 'vitest';
import {shoppingCsv,hasIncompleteShopping, type ShoppingLine} from '../src/lib/quilt/shopping';

describe('Shopping CSV is explicit about cut-fit safety and incomplete purchase lists',()=>{
 const good:ShoppingLine={label:'Indigo fabric',hint:'43 in usable WOF',amount:.875,rawYards:5/6,offcutSqIn:125,roundingExtraIn:1.5,unitPrice:8};
 const impossible:ShoppingLine={label:'Directional background',hint:'FIT_IMPOSSIBLE: WOF too narrow'};
 it('retains auditable purchasing fields and a per-roll feasibility flag',()=>{
  const csv=shoppingCsv([good]);
  expect(hasIncompleteShopping([good])).toBe(false);
  expect(csv).toContain('"Cut-fit / purchase status"');
  expect(csv).toContain('"FEASIBLE_LAYOUT"');
  expect(csv).toContain('"0.875"');
  expect(csv).toContain('"7"');
  expect(csv).not.toContain('FIT_IMPOSSIBLE_NOT_PURCHASE_READY');
 });
 it('marks an impossible roll without inventing a purchase price or quantity',()=>{
  const csv=shoppingCsv([good,impossible]);
  const lines=csv.slice(1).trim().split('\r\n');
  expect(hasIncompleteShopping([good,impossible])).toBe(true);
  expect(lines).toHaveLength(3);
  expect(lines[2]).toContain('"FIT_IMPOSSIBLE_NOT_PURCHASE_READY"');
  expect(lines[2]).not.toContain('"0"');
  expect(lines[2]).toContain('"Directional background"');
 });
 it('escapes potentially executable spreadsheet labels',()=>{
  const csv=shoppingCsv([{...good,label:'=1+2'}]);
  expect(csv).toContain('"\'=1+2"');
 });
 it('rejects empty or forged purchase amounts',()=>{
  expect(()=>shoppingCsv([])).toThrow(/No materials/);
  expect(()=>shoppingCsv([{...good,amount:-1}])).toThrow(/Invalid purchased/);
  expect(()=>shoppingCsv([{...good,amount:Number.NaN}])).toThrow(/Invalid purchased/);
 });
});
