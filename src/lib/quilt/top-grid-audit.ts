import type {ImportedFabricAudit} from './fabric-audit';

/** Optional RECTANGULAR topology. Source CSV has physical cutting geometry,
 * not sewing adjacency, so every row/column position is explicitly user-set.
 * Only straight butt joins of rectangular pieces are within this scope.
 */
export type TopGridCell={
 rollId:string;pieceNumber:number;
 measuredCutWidthIn?:number;measuredCutHeightIn?:number;
 /** Measured net fabric consumed at this cell's four INTERNAL joining edges.
  * Outside perimeter edges have no internal join and are NOT auto-measurements.
  */
 seamLeftIn?:number;seamRightIn?:number;seamTopIn?:number;seamBottomIn?:number;
};
export type UserTopGrid={
 rows:number;columns:number;cells:TopGridCell[];
 declaredTotalToleranceIn?:number;
 /** Independent ruler values, AFTER internal joins, BEFORE sewn borders. */
 measuredAssembledWidthIn?:number;measuredAssembledHeightIn?:number;
 /** Explicit USER claim that the selected grid is the entire quilt center. */
 spansEntireCenter:boolean;
};
export type TopGridCoverage='NOT_STARTED'|'PARTIAL_USER_REPORTED'|'ALL_USER_REPORTED';
export type TopGridAudit={
 source:'NOT_IMPORTED'|'MATCHING_CUTTING_PLAN';
 coverage:TopGridCoverage;
 rows?:number;columns?:number;
 expectedCellCount:number;
 knownSourceCells:number;measuredCells:number;measuredInternalEdges:number;expectedInternalEdges:number;
 reading?:UserTopGrid;
 cutSizeDeviationCount:number;
 /** Derived ONLY from complete actual-ruler measurements. */
 rowAssembledWidthsIn?:number[];
 columnAssembledHeightsIn?:number[];
 rowWidthSpreadIn?:number;columnHeightSpreadIn?:number;
 columnCellWidthSpreadIn?:number[];rowCellHeightSpreadIn?:number[];
 predictedAssembledWidthIn?:number;predictedAssembledHeightIn?:number;
 independentWidthDifferenceIn?:number;independentHeightDifferenceIn?:number;
 shapeMismatch?:boolean;independentRulerMismatch?:boolean;
 actualCenterWidthDifferenceIn?:number;actualCenterHeightDifferenceIn?:number;
 centerSizeMismatch?:boolean;
 invalid:string[];warnings:string[];
};
const pos=(value:unknown):value is number=>
 typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=100000;
const nonneg=(value:unknown):value is number=>
 typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100000;
const spread=(numbers:readonly number[])=>Math.max(...numbers)-Math.min(...numbers);
const mean=(numbers:readonly number[])=>numbers.reduce((a,b)=>a+b,0)/numbers.length;
const EPS=1e-8;
const fields=['measuredCutWidthIn','measuredCutHeightIn'] as const;
type EdgeKey='seamLeftIn'|'seamRightIn'|'seamTopIn'|'seamBottomIn';
function edgeKeys(r:number,c:number,rows:number,cols:number):EdgeKey[]{
 const result:EdgeKey[]=[];
 if(c>0)result.push('seamLeftIn');
 if(c<cols-1)result.push('seamRightIn');
 if(r>0)result.push('seamTopIn');
 if(r<rows-1)result.push('seamBottomIn');
 return result;
}
export function evaluateTopGrid(project:ImportedFabricAudit,reading:UserTopGrid|undefined):TopGridAudit{
 const result:TopGridAudit={
  source:project.seamPlan?'MATCHING_CUTTING_PLAN':'NOT_IMPORTED',
  coverage:'NOT_STARTED',expectedCellCount:0,knownSourceCells:0,measuredCells:0,
  measuredInternalEdges:0,expectedInternalEdges:0,cutSizeDeviationCount:0,
  invalid:[],warnings:[]
 };
 if(!reading){
  result.warnings.push('No user-specified rectangular quilt-top arrangement. Cut-list CSV does not supply sewing positions.');
  return result;
 }
 const {rows,columns,cells}=reading;
 result.rows=rows;result.columns=columns;
 result.reading={
  ...reading,cells:Array.isArray(cells)?cells.map(cell=>({...cell})):[]
 };
 if(!project.seamPlan){
  result.invalid.push('Matching reviewed whole-project cutting-plan JSON required for quilt-top grid QA.');
  return result;
 }
 if(!Number.isSafeInteger(rows)||!Number.isSafeInteger(columns)||
   rows<2||rows>4||columns<2||columns>4){
  result.invalid.push('Rectangular grid must have 2–4 rows and 2–4 columns.');
  return result;
 }
 const n=rows*columns;
 result.expectedCellCount=n;
 result.expectedInternalEdges=2*(rows*(columns-1)+(rows-1)*columns);
 if(!Array.isArray(cells)||cells.length!==n){
  result.invalid.push('Provide precisely one physically labeled quilt-TOP cell per rectangular grid position.');
  return result;
 }
 if(!nonneg(reading.declaredTotalToleranceIn)||reading.declaredTotalToleranceIn>1)
  result.invalid.push('Declare a total rectangular-grid measurement tolerance from 0 to 1 inch.');
 if(typeof reading.spansEntireCenter!=='boolean')
  result.invalid.push('Confirm whether the manually assembled grid covers the entire quilt TOP center.');
 for(const name of ['measuredAssembledWidthIn','measuredAssembledHeightIn'] as const){
  const v=reading[name];
  if(v!==undefined&&!pos(v))
   result.invalid.push('Invalid independently measured assembled grid '+name+'.');
 }
 let measuredAll=true;
 const refs=new Set<string>();
 const widths:number[]=[],heights:number[]=[];
 const perCellEdges:Record<EdgeKey,number>[]=[];
 for(let i=0;i<n;i++){
  const cell=cells[i],r=Math.floor(i/columns),c=i%columns;
  const tag='row '+(r+1)+', column '+(c+1);
  if(!cell||typeof cell.rollId!=='string'||!cell.rollId.startsWith('fabric:')||
    !Number.isSafeInteger(cell.pieceNumber)||cell.pieceNumber<1){
   measuredAll=false;
   if(cell?.rollId||cell?.pieceNumber)
    result.invalid.push('Invalid physical top-fabric source piece at '+tag+'.');
   else result.warnings.push('No source piece chosen at '+tag+'.');
  }else{
   const key=cell.rollId+'#'+cell.pieceNumber;
   if(refs.has(key))result.invalid.push('Duplicate quilt-top physical source piece: '+key+'.');
   refs.add(key);
   const source=project.rolls.find(x=>x.id===cell.rollId)?.pieces.find(x=>x.pieceNumber===cell.pieceNumber);
   if(!source){result.invalid.push('Unknown quilt-top physical source cut at '+tag+': '+key+'.');measuredAll=false;}
   else{
    result.knownSourceCells++;
    if(fields.every(name=>pos(cell[name]))){
     result.measuredCells++;
     if(Math.abs(cell.measuredCutWidthIn!-source.widthIn)>(reading.declaredTotalToleranceIn??0)+EPS||
        Math.abs(cell.measuredCutHeightIn!-source.heightIn)>(reading.declaredTotalToleranceIn??0)+EPS)
      result.cutSizeDeviationCount++;
    }
   }
  }
  for(const dim of fields){
   const value=cell?.[dim];
   if(value===undefined){measuredAll=false;continue;}
   if(!pos(value)){
    result.invalid.push('Invalid real pre-sew '+dim+' at '+tag+'.');
    measuredAll=false;
   }
  }
  const keys=edgeKeys(r,c,rows,columns);
  const measuredEdges:Record<EdgeKey,number>={seamLeftIn:0,seamRightIn:0,seamTopIn:0,seamBottomIn:0};
  for(const side of keys){
   const v=cell?.[side];
   if(v===undefined){measuredAll=false;continue;}
   if(!nonneg(v)){
    result.invalid.push('Invalid physical net seam take-up '+side+' at '+tag+'.');
    measuredAll=false;
   }else{
    result.measuredInternalEdges++;
    measuredEdges[side]=v;
   }
  }
  for(const side of ['seamLeftIn','seamRightIn','seamTopIn','seamBottomIn'] as EdgeKey[]){
   if(!keys.includes(side)&&cell?.[side]!==undefined)
    result.invalid.push('Perimeter '+side+' at '+tag+' has no INTERNAL seam; do not invent outer-edge losses.');
  }
  // Fail closed as soon as a known measured edge loss exhausts the physical
  // cut dimension. Do not wait for unrelated cells, the opposite seam side,
  // or the assembled-grid ruler: partial evidence can already be impossible.
  // Missing edges remain missing; zeros below mean only KNOWN valid losses.
  const knownWidthLoss=
   (nonneg(cell?.seamLeftIn)?cell.seamLeftIn:0)+
   (nonneg(cell?.seamRightIn)?cell.seamRightIn:0);
  const knownHeightLoss=
   (nonneg(cell?.seamTopIn)?cell.seamTopIn:0)+
   (nonneg(cell?.seamBottomIn)?cell.seamBottomIn:0);
  if(pos(cell?.measuredCutWidthIn)&&knownWidthLoss>=cell.measuredCutWidthIn-EPS)
   result.invalid.push('Measured internal seam take-up consumes the entire physical width of cell '+tag+'.');
  if(pos(cell?.measuredCutHeightIn)&&knownHeightLoss>=cell.measuredCutHeightIn-EPS)
   result.invalid.push('Measured internal seam take-up consumes the entire physical height of cell '+tag+'.');
  perCellEdges.push(measuredEdges);
  widths.push(cell?.measuredCutWidthIn??NaN);
  heights.push(cell?.measuredCutHeightIn??NaN);
 }
 if(result.cutSizeDeviationCount)
  result.warnings.push(result.cutSizeDeviationCount+' user-measured top-piece width/height pair(s) differ from their physical CSV cut sizes.');
 const independentlyMeasured=reading.measuredAssembledWidthIn!==undefined&&reading.measuredAssembledHeightIn!==undefined;
 const inputReady=measuredAll&&result.invalid.length===0;
 result.coverage=inputReady&&independentlyMeasured?'ALL_USER_REPORTED':'PARTIAL_USER_REPORTED';
 if(!inputReady){
  result.warnings.push('Not all real top-piece dimensions and both sides of each internal seam are entered. Derived assembled rectangle dimensions are NOT VERIFIED.');
  return result;
 }
 const netWidths:number[]=[],netHeights:number[]=[];
 for(let i=0;i<n;i++){
  const edges=perCellEdges[i];
  const netW=widths[i]-edges.seamLeftIn-edges.seamRightIn;
  const netH=heights[i]-edges.seamTopIn-edges.seamBottomIn;
  netWidths.push(netW);netHeights.push(netH);
 }
 const rowWidths=Array.from({length:rows},(_,r)=>netWidths.slice(r*columns,(r+1)*columns).reduce((a,b)=>a+b,0));
 const colHeights=Array.from({length:columns},(_,c)=>
  Array.from({length:rows},(_,r)=>netHeights[r*columns+c]).reduce((a,b)=>a+b,0));
 const cellColSpreads=Array.from({length:columns},(_,c)=>
  spread(Array.from({length:rows},(_,r)=>netWidths[r*columns+c])));
 const cellRowSpreads=Array.from({length:rows},(_,r)=>
  spread(netHeights.slice(r*columns,(r+1)*columns)));
 result.rowAssembledWidthsIn=rowWidths;
 result.columnAssembledHeightsIn=colHeights;
 result.rowWidthSpreadIn=spread(rowWidths);
 result.columnHeightSpreadIn=spread(colHeights);
 result.columnCellWidthSpreadIn=cellColSpreads;
 result.rowCellHeightSpreadIn=cellRowSpreads;
 result.predictedAssembledWidthIn=mean(rowWidths);
 result.predictedAssembledHeightIn=mean(colHeights);
 const t=reading.declaredTotalToleranceIn!;
 result.shapeMismatch=[result.rowWidthSpreadIn,result.columnHeightSpreadIn,...cellColSpreads,...cellRowSpreads]
  .some(x=>x>t+EPS);
 if(result.shapeMismatch)result.warnings.push(
  'USER-REPORTED GRID SHAPE MISMATCH: assembled row widths, column heights, or the effective dimensions of aligned column/row cells disagree beyond the declared TOTAL tolerance. This is not a proven rectangle.'
 );
 if(independentlyMeasured){
  result.independentWidthDifferenceIn=reading.measuredAssembledWidthIn!-result.predictedAssembledWidthIn;
  result.independentHeightDifferenceIn=reading.measuredAssembledHeightIn!-result.predictedAssembledHeightIn;
  result.independentRulerMismatch=
   Math.abs(result.independentWidthDifferenceIn)>t+EPS||
   Math.abs(result.independentHeightDifferenceIn)>t+EPS;
  if(result.independentRulerMismatch)
   result.warnings.push('Independently user-measured sewn grid width/height disagrees with the sum of measured cut pieces minus all measured internal seam edge take-up.');
 }else result.warnings.push('Independent assembled width AND height were not both entered; the complete top-grid ruler check is NOT VERIFIED.');
 if(reading.spansEntireCenter){
  if(independentlyMeasured){
   const plan=project.seamPlan.finishing;
   result.actualCenterWidthDifferenceIn=reading.measuredAssembledWidthIn!-plan.plannedCenterWidthIn;
   result.actualCenterHeightDifferenceIn=reading.measuredAssembledHeightIn!-plan.plannedCenterHeightIn;
   result.centerSizeMismatch=Math.abs(result.actualCenterWidthDifferenceIn)>t+EPS||
    Math.abs(result.actualCenterHeightDifferenceIn)>t+EPS;
   if(result.centerSizeMismatch)
    result.warnings.push('Actual sewn grid CLAIMED as the entire CENTER differs from the planned pre-border quilt center width/height.');
  }else result.warnings.push('Entire-center grid was claimed but both real center dimensions were not independently measured.');
 }else result.warnings.push('A sampled rectangular grid is NOT the complete quilt center: no center-size comparison was inferred.');
 if(result.coverage!=='ALL_USER_REPORTED')
  result.warnings.push('Physical assembled grid ruler coverage remains PARTIAL_USER_REPORTED.');
 result.warnings.push('This verifies only internal arithmetic for a USER-DESCRIBED rectangular patch grid. It does not certify 2D placement, orientation, stitch technique, borders or the bound quilt.');
 return result;
}
