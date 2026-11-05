import {csvDocument} from './cutlist';

export type ShoppingLine = {
 label:string; hint:string; amount?:number; rawYards?:number; offcutSqIn?:number;
 roundingExtraIn?:number; unitPrice?:number; assemblyTrimSqIn?:number;
};

export function hasIncompleteShopping(lines:readonly ShoppingLine[]):boolean {
 return lines.some(line=>line.amount===undefined);
}

/** Retain all material rows while clearly marking those with no verified fit.
 * An incomplete shopping CSV is a diagnostic, never an implied purchase order.
 */
export function shoppingCsv(lines:readonly ShoppingLine[]):string {
 if(!lines.length)throw Error('No materials in shopping list.');
 const headers=[
  'Material / SKU','Notes','Exact raw yards','Rounded purchase yards','Roll offcut sq in',
  'Purchase rounding excess in','Post-assembly trim sq in',
  'User entered price USD per yd','Estimated cost USD','Cut-fit / purchase status'
 ];
 const rows=lines.map(line=>{
  const feasible=line.amount!==undefined;
  if(feasible && (!Number.isFinite(line.amount)||line.amount!<0))throw Error('Invalid purchased yardage for '+line.label);
  const estimated=feasible && line.unitPrice!==undefined ? line.amount!*line.unitPrice : undefined;
  return [
   line.label,line.hint,line.rawYards,line.amount,line.offcutSqIn,
   line.roundingExtraIn,line.assemblyTrimSqIn,line.unitPrice,estimated,
   feasible?'FEASIBLE_LAYOUT':'FIT_IMPOSSIBLE_NOT_PURCHASE_READY'
  ];
 });
 return csvDocument([headers,...rows]);
}
