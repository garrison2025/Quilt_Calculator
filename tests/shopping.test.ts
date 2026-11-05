import {describe,expect,it} from 'vitest';
import {shoppingCsv,hasIncompleteShopping,needsTopFabricPlan,shoppingLineStatus, type ShoppingLine} from '../src/lib/quilt/shopping';

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
 it('distinguishes missing quilt-top cuts from physically impossible fabric widths',()=>{
  const missing:ShoppingLine={label:'Quilt-top fabric',hint:'No cuts entered',status:'not-planned'};
  const csv=shoppingCsv([good,missing,impossible]);
  const rows=csv.slice(1).trim().split('\r\n');
  expect(shoppingLineStatus(missing)).toBe('NOT_PLANNED_NO_CUT_PIECES');
  expect(shoppingLineStatus(impossible)).toBe('FIT_IMPOSSIBLE_NOT_PURCHASE_READY');
  expect(hasIncompleteShopping([good,missing])).toBe(true);
  expect(rows[2]).toContain('"NOT_PLANNED_NO_CUT_PIECES"');
  expect(rows[2]).not.toContain('"0"');
  expect(rows[3]).toContain('"FIT_IMPOSSIBLE_NOT_PURCHASE_READY"');
  expect(()=>shoppingCsv([{...missing,amount:0}])).toThrow(/not-planned material/);
 });
 it('requires top-fabric SKU entries with positive-count cut pieces',()=>{
  expect(needsTopFabricPlan([])).toBe(true);
  expect(needsTopFabricPlan([{pieces:[]}])).toBe(true);
  expect(needsTopFabricPlan([{pieces:[{count:0}]}])).toBe(true);
  expect(needsTopFabricPlan([{pieces:[{count:5},{count:0}]}])).toBe(false);
  expect(needsTopFabricPlan([{pieces:[{count:5}]},{pieces:[{count:0}]}])).toBe(true);
  expect(needsTopFabricPlan([{pieces:[{count:5}]},{pieces:[{count:2}]}])).toBe(false);
 });
 it('keeps numeric estimates but marks unreconciled quilt-top cutting coverage as incomplete',()=>{
  const reviewPending:ShoppingLine={...good,status:'not-reviewed'};
  expect(shoppingLineStatus(reviewPending)).toBe('TOP_CUT_LIST_NOT_REVIEWED');
  expect(hasIncompleteShopping([reviewPending])).toBe(true);
  const csv=shoppingCsv([reviewPending]);
  expect(csv).toContain('"TOP_CUT_LIST_NOT_REVIEWED"');
  expect(csv).toContain('"0.875"');
  expect(csv).toContain('"7"');
  expect(csv).not.toContain('FIT_IMPOSSIBLE_NOT_PURCHASE_READY');
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
