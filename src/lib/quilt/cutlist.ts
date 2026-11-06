import { verifyLayout, type Layout } from './math';

/** A physical cut list never merges independent rolls or claims an infeasible cut. */
export type MaterialCutPlan = { material:string; sku:string; layout:Layout };
/** Namespace editable material IDs without changing project JSON or the
 * displayed user SKU. Never combine a user 'backing' fabric with the actual
 * backing roll (or a user border SKU with another fabric category).
 * encodeURIComponent is injective for valid Unicode strings, so even colons
 * and slashes in user IDs cannot create cross-category roll collisions.
 */
export function physicalRollId(category:'fabric'|'border',userSku:string):string{
 if(typeof userSku!=='string'||!userSku.trim())throw Error('Physical roll requires a nonempty user SKU.');
 return category+':'+encodeURIComponent(userSku);
}
/** A quick correspondence tag, NOT a cryptographic signature or proof of
 * physical correctness. The snapshot tag must be identical for shopping and
 * cutting exports derived from the same committed Project V2 state.
 */
export function assertExportProjectFingerprint(value:string|undefined):void{
 if(value!==undefined && !/^[0-9a-f]{8}$/.test(value))
  throw Error('Source project fingerprint must be eight lowercase hexadecimal characters.');
}
export const EXPORT_FINGERPRINT_HEADER='Source project fingerprint (8-hex; not a digital signature)' as const;
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
 const seen=new Set<string>();
 for(const plan of plans){
  if(!plan.sku || seen.has(plan.sku))
   throw Error('Duplicate or empty physical roll ID: '+plan.sku+'. Separate fabric, border and built-in roll IDs are required.');
  seen.add(plan.sku);
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
export function cutListCsv(plans:readonly MaterialCutPlan[],sourceProjectHash?:string):string{
 assertExportProjectFingerprint(sourceProjectHash);
 const rows=cutListRows(plans);
 if(rows.length===0)throw Error('No physical cut pieces are available to export.');
 // Older standalone API consumers can continue reading the historical 11
 // columns; production project exports add a 12th snapshot marker.
 return sourceProjectHash===undefined
  ? csvDocument([CUT_LIST_HEADERS,...rows])
  : csvDocument([[...CUT_LIST_HEADERS,EXPORT_FINGERPRINT_HEADER],
     ...rows.map(row=>[...row,sourceProjectHash])]);
}
