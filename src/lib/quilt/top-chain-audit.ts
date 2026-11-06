import type {ImportedFabricAudit} from './fabric-audit';
import type {JoinedSeamPlan} from './seam-audit';

/** Optional manual straight, end-to-end chain of quilt-TOP pieces. This is not
 * a spatial assembly map: a cut-list CSV has no positions or join order.
 * Every selection and physical measurement comes from the reviewer.
 */
export type TopChainAxis='width'|'height';
export type TopChainPiece={
 rollId:string;
 pieceNumber:number;
 /** Actual physical cut span ALONG the selected chain axis, before sewing. */
 observedCutSpanIn?:number;
};
export type TopChainJoin={
 /** Actual net consumed length on the trailing edge of the previous piece. */
 previousEdgeTakeupIn?:number;
 /** Actual net consumed length on the leading edge of the next piece. */
 nextEdgeTakeupIn?:number;
};
export type UserTopChain={
 axis:TopChainAxis;
 /** User claims that this particular single row/column crosses the complete
  * quilt TOP CENTER (not the border-inclusive outer quilt). Never inferred. */
 spansEntireCenter:boolean;
 pieces:TopChainPiece[];
 joins:TopChainJoin[];
 /** Independently measured sewn chain span AFTER joins, BEFORE borders. */
 observedJoinedSpanIn?:number;
 declaredTotalToleranceIn?:number;
};
export type TopChainCoverage='NOT_STARTED'|'PARTIAL_USER_REPORTED'|'ALL_USER_REPORTED';
export type TopChainAudit={
 source:'NOT_IMPORTED'|'MATCHING_CUTTING_PLAN';
 coverage:TopChainCoverage;
 axis?:TopChainAxis;
 userClaimsFullCenter?:boolean;
 expectedCenterSpanIn?:number;
 cutPieceCount:number;
 recordedPieceCount:number;
 recordedJoinEdgeCount:number;
 joinCount:number;
 /** Never silently fill with an algorithm estimate. */
 measuredCutSpanSumIn?:number;
 summedNetSeamTakeupIn?:number;
 predictedJoinedSpanFromMeasuredPartsIn?:number;
 measuredJoinedSpanIn?:number;
 joinedSpanDifferenceIn?:number;
 independentJoinMismatch?:boolean;
 cutSizeDeviationCount:number;
 centerSpanDifferenceIn?:number;
 centerSpanMismatch?:boolean;
 invalid:string[];
 warnings:string[];
 /** Serializable full user readings. No cryptographic or physical certification. */
 reading?:UserTopChain;
};
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100000;
export function evaluateTopChain(project:ImportedFabricAudit,entered:UserTopChain|undefined):TopChainAudit{
 const root:TopChainAudit={
  source:project.seamPlan?'MATCHING_CUTTING_PLAN':'NOT_IMPORTED',
  coverage:'NOT_STARTED',cutPieceCount:0,recordedPieceCount:0,
  recordedJoinEdgeCount:0,joinCount:0,cutSizeDeviationCount:0,
  invalid:[],warnings:[]
 };
 if(!entered){root.warnings.push('No manually ordered quilt-top chain. Cut files cannot establish quilt-top sewing order.');return root;}
 root.reading={
  axis:entered.axis,spansEntireCenter:entered.spansEntireCenter,
  pieces:Array.isArray(entered.pieces)?entered.pieces.map(x=>({...x})):[],
  joins:Array.isArray(entered.joins)?entered.joins.map(x=>({...x})):[],
  observedJoinedSpanIn:entered.observedJoinedSpanIn,
  declaredTotalToleranceIn:entered.declaredTotalToleranceIn
 };
 root.axis=entered.axis;root.userClaimsFullCenter=entered.spansEntireCenter;
 if(!project.seamPlan){
  root.invalid.push('A matching, reviewed whole-project Cutting-plan JSON is required for top-chain QA.');
  return root;
 }
 if(entered.axis!=='width'&&entered.axis!=='height')
  root.invalid.push('Select width or height for the physical top chain.');
 if(typeof entered.spansEntireCenter!=='boolean')
  root.invalid.push('Specify whether the chain spans the complete quilt center.');
 if(!Array.isArray(entered.pieces)||entered.pieces.length<2||entered.pieces.length>12){
  root.invalid.push('Choose between 2 and 12 separately numbered quilt-top pieces in sewing order.');
  return root;
 }
 const n=entered.pieces.length;
 root.cutPieceCount=n;root.joinCount=n-1;
 if(!Array.isArray(entered.joins)||entered.joins.length!==n-1)
  root.invalid.push('Each neighboring quilt-top piece pair must have one two-edge seam entry.');
 if(!finite(entered.declaredTotalToleranceIn)||entered.declaredTotalToleranceIn>1)
  root.invalid.push('Declare a TOTAL chain measurement tolerance from 0 to 1 inch.');
 if(entered.observedJoinedSpanIn!==undefined&&
  (!finite(entered.observedJoinedSpanIn)||entered.observedJoinedSpanIn===0))
  root.invalid.push('Measured full sewn top-chain span must be positive and finite.');
 const refs=new Set<string>();
 let allCuts=true,allJoins=true;
 let cutSum=0,seamLoss=0;
 for(const [i,piece] of entered.pieces.entries()){
  const id=piece?.rollId,number=piece?.pieceNumber;
  if(typeof id!=='string'||!id.startsWith('fabric:')||
   !Number.isSafeInteger(number)||number<1){
   allCuts=false;
   if(id||number)root.invalid.push('Chain piece #'+(i+1)+' is not a top-fabric cut-list piece.');
   continue;
  }
  const key=id+'#'+number;
  if(refs.has(key))root.invalid.push('The same physical quilt-top cut piece was selected twice: '+key);
  refs.add(key);
  const source=project.rolls.find(roll=>roll.id===id)?.pieces.find(p=>p.pieceNumber===number);
  if(!source){
   root.invalid.push('Unknown quilt-top cut-list piece: '+key);allCuts=false;continue;
  }
  root.recordedPieceCount++;
  const measured=piece.observedCutSpanIn;
  if(measured===undefined){allCuts=false;continue;}
  if(!finite(measured)||measured===0){
   root.invalid.push('Invalid measured pre-sew cut span for piece #'+(i+1));allCuts=false;continue;
  }
  cutSum+=measured;
  const target=entered.axis==='width'?source.widthIn:source.heightIn;
  if(Math.abs(measured-target)>(entered.declaredTotalToleranceIn??0)+1e-8)
   root.cutSizeDeviationCount++;
 }
 if(entered.joins?.length===n-1){
  for(const [i,j] of entered.joins.entries()){
   const edges=[j?.previousEdgeTakeupIn,j?.nextEdgeTakeupIn];
   for(const [side,value] of edges.entries()){
    if(value===undefined){allJoins=false;continue;}
    if(!finite(value)){
     root.invalid.push('Invalid net seam take-up for join #'+(i+1)+', edge #'+(side+1));allJoins=false;continue;
    }
    root.recordedJoinEdgeCount++;
    seamLoss+=value;
   }
  }
 }else allJoins=false;
 if(allCuts)root.measuredCutSpanSumIn=cutSum;
 if(allJoins)root.summedNetSeamTakeupIn=seamLoss;
 root.measuredJoinedSpanIn=entered.observedJoinedSpanIn;
 const complete=allCuts&&allJoins&&entered.observedJoinedSpanIn!==undefined&&root.invalid.length===0;
 root.coverage=complete?'ALL_USER_REPORTED':'PARTIAL_USER_REPORTED';
 if(root.cutSizeDeviationCount)
  root.warnings.push(root.cutSizeDeviationCount+' user-measured cut span(s) differ from their selected native CSV cut sizes beyond the declared tolerance.');
 if(allCuts&&allJoins){
  const predicted=cutSum-seamLoss;
  if(predicted<=0){
   root.invalid.push('Measured seam edge take-up consumes the entire physical chain; check each entry.');
   return root;
  }
  root.predictedJoinedSpanFromMeasuredPartsIn=predicted;
  if(entered.observedJoinedSpanIn!==undefined&&finite(entered.observedJoinedSpanIn)){
   root.joinedSpanDifferenceIn=entered.observedJoinedSpanIn-predicted;
   root.independentJoinMismatch=Math.abs(root.joinedSpanDifferenceIn)>entered.declaredTotalToleranceIn!+1e-8;
   if(root.independentJoinMismatch)
    root.warnings.push('Independently measured sewn chain disagrees with cut spans minus the two measured edge losses at every join.');
  }
 }
 if(entered.spansEntireCenter){
  const finishing=project.seamPlan.finishing;
  root.expectedCenterSpanIn=entered.axis==='width'?finishing.plannedCenterWidthIn:finishing.plannedCenterHeightIn;
  if(entered.observedJoinedSpanIn!==undefined&&finite(entered.observedJoinedSpanIn)){
   root.centerSpanDifferenceIn=entered.observedJoinedSpanIn-root.expectedCenterSpanIn;
   root.centerSpanMismatch=Math.abs(root.centerSpanDifferenceIn)>entered.declaredTotalToleranceIn!+1e-8;
   if(root.centerSpanMismatch)
    root.warnings.push('User-claimed full-center top chain does not match the planned center width/height within the declared tolerance.');
  }else root.warnings.push('Full-center chain was claimed but its real assembled length was NOT measured.');
 }else root.warnings.push('This is a sampled chain, not a full-center width or height certification; center dimensions are NOT VERIFIED by it.');
 if(root.coverage!=='ALL_USER_REPORTED')root.warnings.push('One or more individual cuts, seam edges or independent joined spans are NOT MEASURED; chain is incomplete.');
 root.warnings.push('A chain is only a user-declared straight, end-to-end seam sequence; this is NOT a verified top placement plan, overall top construction or finished bound quilt.');
 return root;
}
