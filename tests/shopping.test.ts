import {describe,expect,it} from 'vitest';
import {shoppingCsv,shoppingPriceSummary,hasIncompleteShopping,needsTopFabricPlan,shoppingLineStatus, type ShoppingLine} from '../src/lib/quilt/shopping';
import {calculateQuiltFabric,verifyLayout, type FabricSku} from '../src/lib/quilt/math';
import {cutListCsv} from '../src/lib/quilt/cutlist';

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
 it('reconciles only entered-price feasible SKU costs, without calling unpriced materials free',()=>{
  const reviewed:ShoppingLine={...good,status:'not-reviewed'};
  const other:ShoppingLine={label:'Linen',hint:'50-in roll',amount:1.375,rawYards:1.31,unitPrice:12};
  const unpriced:ShoppingLine={label:'Backing',hint:'42-in roll',amount:5.5,rawYards:5.42};
  const unfitPriced:ShoppingLine={...impossible,unitPrice:100};
  const missing:ShoppingLine={label:'Unused color',hint:'not entered',status:'not-planned'};
  const rows=[reviewed,other,unpriced,unfitPriced,missing];
  const total=shoppingPriceSummary(rows);
  expect(total).toEqual({
   enteredPriceSubtotalUsd:.875*8+1.375*12,
   pricedCount:2,unpricedCount:1,unreadyCount:2
  });
  expect(hasIncompleteShopping(rows)).toBe(true);
  const csv=shoppingCsv(rows);
  expect(csv).toContain('"7"');
  expect(csv).toContain('"16.5"');
  expect(csv).toContain('"TOP_CUT_LIST_NOT_REVIEWED"');
  expect(csv).toContain('"FIT_IMPOSSIBLE_NOT_PURCHASE_READY"');
  expect(shoppingPriceSummary([unpriced])).toEqual({
   enteredPriceSubtotalUsd:undefined,pricedCount:0,unpricedCount:1,unreadyCount:0
  });
  expect(shoppingPriceSummary([])).toEqual({
   enteredPriceSubtotalUsd:undefined,pricedCount:0,unpricedCount:0,unreadyCount:0
  });
 });
 it('rejects malformed money, hidden negative estimates and non-finite numeric CSV fields',()=>{
  for(const value of [NaN,Infinity,-Infinity,-.01]){
   for(const key of ['amount','unitPrice','rawYards','offcutSqIn','roundingExtraIn','assemblyTrimSqIn'] as const){
    const broken={...good,[key]:value};
    expect(()=>shoppingPriceSummary([broken]),'Bad '+key+' '+value).toThrow();
    expect(()=>shoppingCsv([broken]),'Bad CSV '+key+' '+value).toThrow();
   }
  }
  expect(()=>shoppingCsv([{...good,amount:1e308,unitPrice:1e308}])).toThrow(/Estimated cost/);
  expect(()=>shoppingPriceSummary([{...good,amount:1e308,unitPrice:1e308}])).toThrow(/Estimated cost/);
  expect(()=>shoppingCsv([{...good,status:'not-planned'}])).toThrow(/not-planned material/);
 });
 it('preserves 2,000 physical cuts across 30 separate SKUs without mixing roll coordinates',()=>{
  const fabrics:FabricSku[]=Array.from({length:30},(_,i)=>({
   id:'sku-'+i,label:'Fabric '+i,usableWidth:43,oneWayPrint:i%2===0,shrinkageLengthPct:5,
   pieces:[{widthIn:5,heightIn:5,count:i===29?86:66,label:'Cut '+i,allowRotate:true}]
  }));
  const start=Date.now();
  const result=calculateQuiltFabric(fabrics,.125);
  expect(result).toHaveLength(30);
  expect(result.reduce((total,roll)=>total+roll.layout.cutPieces.length,0)).toBe(2000);
  for(const [i,roll] of result.entries()){
   expect(roll.fabricSku).toBe('sku-'+i);
   expect(roll.purchase!.roundedPurchaseYards).toBeGreaterThanOrEqual(roll.purchase!.rawPurchaseYards);
   expect(verifyLayout(roll.layout)).toBe(true);
   expect(roll.layout.cutPieces[0].xIn).toBe(0);
   expect(roll.layout.cutPieces[0].yIn).toBe(0);
   expect(roll.layout.cutPieces.every(piece=>piece.grainRotationDeg===0)).toBe(true);
  }
  const csv=cutListCsv(result.map((roll,i)=>({material:roll.label,sku:fabrics[i].id,layout:roll.layout})));
  expect(csv.split(String.fromCharCode(13,10)).filter(Boolean)).toHaveLength(2001);
  expect(csv).toContain('"sku-29"');
  // This is a functional capacity test, NOT a brittle machine-specific
  // performance SLA. The browser smoke separately exercises real UI.
  expect(Date.now()-start).toBeLessThan(15000);
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
