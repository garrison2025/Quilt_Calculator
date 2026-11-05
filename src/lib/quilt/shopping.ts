import {csvDocument} from './cutlist';

export type ShoppingLine = {
 label:string; hint:string; amount?:number; rawYards?:number; offcutSqIn?:number;
 roundingExtraIn?:number; unitPrice?:number; assemblyTrimSqIn?:number;
 status?: 'not-planned' | 'not-reviewed';
};

export type ShoppingStatus = 'FEASIBLE_LAYOUT' | 'FIT_IMPOSSIBLE_NOT_PURCHASE_READY' | 'NOT_PLANNED_NO_CUT_PIECES' | 'TOP_CUT_LIST_NOT_REVIEWED';

export function shoppingLineStatus(line:ShoppingLine):ShoppingStatus {
 if(line.status==='not-planned')return 'NOT_PLANNED_NO_CUT_PIECES';
 if(line.amount===undefined)return 'FIT_IMPOSSIBLE_NOT_PURCHASE_READY';
 return line.status==='not-reviewed'?'TOP_CUT_LIST_NOT_REVIEWED':'FEASIBLE_LAYOUT';
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
export function shoppingCsv(lines:readonly ShoppingLine[]):string {
 if(!lines.length)throw Error('No materials in shopping list.');
 const headers=[
  'Material / SKU','Notes','Exact raw yards','Rounded purchase yards','Roll offcut sq in',
  'Purchase rounding excess in','Post-assembly trim sq in',
  'User entered price USD per yd','Estimated cost USD','Cut-fit / purchase status'
 ];
 const rows=lines.map(line=>{
  const status=shoppingLineStatus(line);
  const feasible=status==='FEASIBLE_LAYOUT' || status==='TOP_CUT_LIST_NOT_REVIEWED';
  if(line.status==='not-planned' && line.amount!==undefined)
   throw Error('A not-planned material cannot have a purchasing quantity: '+line.label);
  if(feasible && (!Number.isFinite(line.amount)||line.amount!<0))throw Error('Invalid purchased yardage for '+line.label);
  const estimated=feasible && line.unitPrice!==undefined ? line.amount!*line.unitPrice : undefined;
  return [
   line.label,line.hint,feasible?line.rawYards:undefined,feasible?line.amount:undefined,
   feasible?line.offcutSqIn:undefined,feasible?line.roundingExtraIn:undefined,
   feasible?line.assemblyTrimSqIn:undefined,line.unitPrice,estimated,status
  ];
 });
 return csvDocument([headers,...rows]);
}
