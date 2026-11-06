import {csvDocument, assertExportProjectFingerprint, EXPORT_FINGERPRINT_HEADER} from './cutlist';

export type ShoppingLine = {
 label:string; hint:string; rollId?:string; amount?:number; rawYards?:number; offcutSqIn?:number;
 roundingExtraIn?:number; unitPrice?:number; assemblyTrimSqIn?:number;
 status?: 'not-planned' | 'not-reviewed';
};

export type ShoppingStatus = 'FEASIBLE_LAYOUT' | 'FIT_IMPOSSIBLE_NOT_PURCHASE_READY' | 'NOT_PLANNED_NO_CUT_PIECES' | 'TOP_CUT_LIST_NOT_REVIEWED';

export function shoppingLineStatus(line:ShoppingLine):ShoppingStatus {
 if(line.status==='not-planned')return 'NOT_PLANNED_NO_CUT_PIECES';
 if(line.amount===undefined)return 'FIT_IMPOSSIBLE_NOT_PURCHASE_READY';
 return line.status==='not-reviewed'?'TOP_CUT_LIST_NOT_REVIEWED':'FEASIBLE_LAYOUT';
}

/** Only user-supplied prices on cut-feasible lines contribute to this partial
 * subtotal. The value must never be described as an all-project quotation:
 * backing, batting, binding or a different fabric SKU can still be unpriced.
 */
export function shoppingPriceSummary(lines:readonly ShoppingLine[]):{
 enteredPriceSubtotalUsd?:number;pricedCount:number;unpricedCount:number;unreadyCount:number;
}{
 let subtotal=0,pricedCount=0,unpricedCount=0,unreadyCount=0;
 for(const line of lines){
  const status=shoppingLineStatus(line);
  for(const [name,value] of [
   ['raw yardage',line.rawYards],['offcut area',line.offcutSqIn],
   ['purchase rounding extra',line.roundingExtraIn],['assembly trim area',line.assemblyTrimSqIn],
   ['entered unit price',line.unitPrice]
  ] as const){
   if(value!==undefined && (!Number.isFinite(value)||value<0))
    throw Error('Invalid '+name+' for '+line.label+'.');
  }
  if(line.status==='not-planned' && line.amount!==undefined)
   throw Error('A not-planned material cannot have a purchasing quantity: '+line.label);
  if(line.amount!==undefined && (!Number.isFinite(line.amount)||line.amount<0))
   throw Error('Invalid purchased yardage for '+line.label);
  if(status!=='FEASIBLE_LAYOUT' && status!=='TOP_CUT_LIST_NOT_REVIEWED'){
   unreadyCount++;continue;
  }
  if(line.amount===undefined)throw Error('Missing purchased yardage for '+line.label);
  if(line.unitPrice===undefined){unpricedCount++;continue;}
  const cost=line.amount*line.unitPrice;
  if(!Number.isFinite(cost))throw Error('Estimated cost is outside the supported range for '+line.label+'.');
  subtotal+=cost;
  if(!Number.isFinite(subtotal))throw Error('Entered-price subtotal is outside the supported range.');
  pricedCount++;
 }
 return {enteredPriceSubtotalUsd:pricedCount?subtotal:undefined,pricedCount,unpricedCount,unreadyCount};
}

export function hasIncompleteShopping(lines:readonly ShoppingLine[]):boolean {
 return lines.some(line=>shoppingLineStatus(line)!=='FEASIBLE_LAYOUT');
}

/** An empty SKU list or a SKU with no positive-count cut pieces means the
 * quilt top is not planned. Other fabric colors do not fill that missing SKU.
 */
export function needsTopFabricPlan(fabrics:readonly {pieces:readonly {count:number}[]}[]):boolean {
 return fabrics.length===0 || fabrics.some(f=>!f.pieces.some(p=>p.count>0));
}

/** Retain all material rows while clearly marking those with no verified fit.
 * An incomplete shopping CSV is a diagnostic, never an implied purchase order.
 */
export function shoppingCsv(lines:readonly ShoppingLine[],sourceProjectHash?:string):string {
 assertExportProjectFingerprint(sourceProjectHash);
 if(!lines.length)throw Error('No materials in shopping list.');
 // CSV rows and screen subtotal share the same finite-number validation.
 shoppingPriceSummary(lines);
 // Category-scoped IDs allow manual and machine reconciliation with physical
 // cut-list CSV. A reused roll ID must never silently merge purchases.
 const seenRollIds=new Set<string>();
 for(const line of lines){
  if(line.rollId===undefined)continue;
  if(typeof line.rollId!=='string'||!line.rollId.trim())throw Error('Invalid physical roll ID for '+line.label+'.');
  if(seenRollIds.has(line.rollId))throw Error('Duplicate physical roll ID in shopping CSV: '+line.rollId+'.');
  seenRollIds.add(line.rollId);
 }
 const headers=[
  'Material / SKU','Notes','Exact raw yards','Rounded purchase yards','Roll offcut sq in',
  'Purchase rounding excess in','Post-assembly trim sq in',
  'User entered price USD per yd','Estimated cost USD','Cut-fit / purchase status',
  'Physical roll ID (matches cut-list CSV)',
  ...(sourceProjectHash===undefined?[]:[EXPORT_FINGERPRINT_HEADER])
 ];
 const rows=lines.map(line=>{
  const status=shoppingLineStatus(line);
  const feasible=status==='FEASIBLE_LAYOUT' || status==='TOP_CUT_LIST_NOT_REVIEWED';
  const estimated=feasible && line.unitPrice!==undefined ? line.amount!*line.unitPrice : undefined;
  return [
   line.label,line.hint,feasible?line.rawYards:undefined,feasible?line.amount:undefined,
   feasible?line.offcutSqIn:undefined,feasible?line.roundingExtraIn:undefined,
   feasible?line.assemblyTrimSqIn:undefined,line.unitPrice,estimated,status,line.rollId,
   ...(sourceProjectHash===undefined?[]:[sourceProjectHash])
  ];
 });
 return csvDocument([headers,...rows]);
}
