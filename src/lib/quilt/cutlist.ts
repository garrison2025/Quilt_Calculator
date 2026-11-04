import { verifyLayout, type Layout } from './math';

/** A physical cut list never merges independent rolls or claims an infeasible cut. */
export type MaterialCutPlan = { material:string; sku:string; layout:Layout };
export type CsvCell = string | number | undefined;
export const CUT_LIST_HEADERS=[
 'Material','Fabric SKU / roll','Piece number on this roll','Piece label',
 'Roll X (in)','Roll Y (in)','Cut width (in)','Cut height (in)',
 'Grain rotation (degrees)','Usable WOF (in)','Full roll cut run (in)'
] as const;

export function csvDocument(rows:readonly (readonly CsvCell[])[]):string{
 const cell=(value:CsvCell)=>{
  const str=value===undefined?'':String(value);
  // Only user-originated text can contain spreadsheet formulas; preserve true negative numbers.
  const safe=typeof value==='string' && /^\s*[=+@-]/.test(str) ? "'"+str : str;
  return '"'+safe.replace(/"/g,'""')+'"';
 };
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
export function cutListRows(plans:readonly MaterialCutPlan[]):CsvCell[][]{
 const rows:CsvCell[][]=[];
 for(const plan of plans){
  if(!plan.layout.isCutFeasible)throw Error('Cut-list export blocked: '+plan.material+' ('+plan.sku+') has no feasible cut layout.');
  if(!verifyLayout(plan.layout))throw Error('Cut-list export blocked: '+plan.material+' ('+plan.sku+') failed geometry verification.');
  plan.layout.cutPieces.forEach((piece,index)=>{
   rows.push([plan.material,plan.sku,index+1,piece.label,piece.xIn,piece.yIn,
    piece.widthIn,piece.heightIn,piece.grainRotationDeg,
    plan.layout.usableWofIn,plan.layout.exactFabricRunLengthIn]);
  });
 }
 return rows;
}
export function cutListCsv(plans:readonly MaterialCutPlan[]):string{
 const rows=cutListRows(plans);
 if(rows.length===0)throw Error('No physical cut pieces are available to export.');
 return csvDocument([CUT_LIST_HEADERS,...rows]);
}
