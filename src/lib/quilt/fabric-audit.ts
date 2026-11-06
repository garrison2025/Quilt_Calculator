import {
 CUT_LIST_HEADERS, EXPORT_FINGERPRINT_HEADER, assertExportProjectFingerprint
} from './cutlist';
import {verifyLayout, MAX_PIECES, type Layout, type Rect} from './math';
import {evaluateJoinedSeams, type JoinedSeamPlan, type UserJoinedSeamReading, type JoinedSeamObservation, type JoinedSeamEvaluation} from './seam-audit';
import {evaluateFinishing, type FinishingAudit, type UserFinishingReading} from './finishing-audit';

/** The CSV reader is intentionally strict. Uploaded files remain in the browser:
 * nothing here can attest to physical fabric quality, ownership or provenance.
 */
export const SHOPPING_AUDIT_HEADERS=[
 'Material / SKU','Notes','Exact raw yards','Rounded purchase yards','Roll offcut sq in',
 'Purchase rounding excess in','Post-assembly trim sq in',
 'User entered price USD per yd','Estimated cost USD','Cut-fit / purchase status',
 'Physical roll ID (matches cut-list CSV)',EXPORT_FINGERPRINT_HEADER
] as const;
const CUT_AUDIT_HEADERS=[...CUT_LIST_HEADERS,EXPORT_FINGERPRINT_HEADER];
const MAX_BYTES=2_000_000;
const MAX_ROLLS=64;

export function readAuditCsv(content:string):string[][]{
 if(typeof content!=='string'||content.length===0||content.length>MAX_BYTES)
  throw Error('Choose a nonempty CSV smaller than 2 MB.');
 const csv=content.charCodeAt(0)===0xFEFF?content.slice(1):content;
 const rows:string[][]=[];
 let row:string[]=[],field='',state:'start'|'plain'|'quoted'|'closed'='start';
 const pushField=()=>{row.push(field);field='';state='start';};
 const pushRow=()=>{pushField();if(row.some(v=>v!==''))rows.push(row);row=[];if(rows.length>MAX_PIECES+MAX_ROLLS+2)throw Error('Too many CSV records.');};
 for(let i=0;i<csv.length;i++){
  const c=csv[i];
  if(state==='quoted'){
   if(c==='"'){
    if(csv[i+1]==='"'){field+='"';i++;}
    else state='closed';
   }else field+=c;
   continue;
  }
  if(c==='"'){
   if(state!=='start')throw Error('Malformed CSV quote.');
   state='quoted';continue;
  }
  if(c===','){pushField();continue;}
  if(c==='\n'){pushRow();continue;}
  if(c==='\r'){
   if(csv[i+1]!=='\n')throw Error('Malformed CSV line ending.');
   pushRow();i++;continue;
  }
  if(state==='closed')throw Error('Text follows a closed CSV quote.');
  field+=c;state='plain';
 }
 if(state==='quoted')throw Error('Unclosed CSV quote.');
 if(field||row.length||state==='closed')pushRow();
 if(!rows.length)throw Error('Empty CSV has no headers.');
 return rows;
}
function headerMatches(row:string[],reference:readonly string[],what:string):void{
 if(row.length!==reference.length||row.some((v,i)=>v!==reference[i]))
  throw Error('Unsupported '+what+' CSV headers. Download the current site CSV files.');
}
function positiveNumber(value:string,what:string,{zero=false,max=100000}:{zero?:boolean,max?:number}={}):number{
 if(!value.trim())throw Error('Missing '+what+'.');
 const n=Number(value);
 if(!Number.isFinite(n)||n>(max)|| (zero?n<0:n<=0))throw Error('Invalid '+what+'.');
 return n;
}
type AuditedPiece=Rect & {pieceNumber:number};
export type FabricAuditRoll={
 id:string;material:string;usableWofIn:number;requiredRunIn:number;
 /** The source shopping CSV's exact planned prewash length and rounded buying
  * amount. Derived planned shrinkage is never a measured physical rate. */
 plannedRawPurchaseYards?:number;
 plannedRoundedPurchaseYards?:number;
 plannedLengthShrinkagePct?:number;
 pieces:AuditedPiece[];
};
export type ImportedFabricAudit={
 sourceProjectHash:string;
 cutCount:number;
 rolls:FabricAuditRoll[];
 /** Optional validated same-revision assembly plan. */
 seamPlan?:JoinedSeamPlan;
};
/** Also validates row completeness, exact same project fingerprint, roll
 * identities, feasible non-overlapping geometry and purchase coverage.
 * A matching tag is NOT a cryptographic signature or physical proof.
 */
export function importFabricAudit(cutsCsv:string,purchasesCsv:string):ImportedFabricAudit{
 const cutRows=readAuditCsv(cutsCsv),shopRows=readAuditCsv(purchasesCsv);
 headerMatches(cutRows[0],CUT_AUDIT_HEADERS,'cut-list');
 headerMatches(shopRows[0],SHOPPING_AUDIT_HEADERS,'shopping');
 if(cutRows.length<2||shopRows.length<2)throw Error('Both CSV files must contain data rows.');
 const rolls=new Map<string,FabricAuditRoll>();
 let hash:string|undefined;
 if(cutRows.length-1>MAX_PIECES)throw Error('Cut list exceeds the supported 2,000 pieces.');
 for(const [i,row] of cutRows.slice(1).entries()){
  if(row.length!==12)throw Error('Malformed cut row '+(i+2)+'.');
  const tag=row[11];assertExportProjectFingerprint(tag);
  if(!tag)throw Error('Missing source project fingerprint in cut list.');
  if(hash===undefined)hash=tag;
  if(tag!==hash)throw Error('Cut list contains multiple project fingerprints.');
  const id=row[1];
  if(!id||!row[0]||!row[3])throw Error('Cut piece is missing its material, physical roll ID or label.');
  const pieceNumber=positiveNumber(row[2],'piece number',{max:MAX_PIECES});
  if(!Number.isInteger(pieceNumber))throw Error('Cut piece number must be an integer.');
  const xIn=positiveNumber(row[4],'cut X',{zero:true}),yIn=positiveNumber(row[5],'cut Y',{zero:true});
  const widthIn=positiveNumber(row[6],'cut width'),heightIn=positiveNumber(row[7],'cut height');
  const angle=positiveNumber(row[8],'grain rotation',{zero:true,max:90});
  if(angle!==0&&angle!==90)throw Error('Cut grain rotation must be 0 or 90 degrees.');
  const usableWofIn=positiveNumber(row[9],'usable fabric width');
  const requiredRunIn=positiveNumber(row[10],'fabric roll cut run');
  let roll=rolls.get(id);
  if(!roll){
   if(rolls.size>=MAX_ROLLS)throw Error('Too many physical material rolls.');
   roll={id,material:row[0],usableWofIn,requiredRunIn,pieces:[]};
   rolls.set(id,roll);
  }
  if(roll.material!==row[0]||roll.usableWofIn!==usableWofIn||roll.requiredRunIn!==requiredRunIn)
   throw Error('Conflicting fabric dimensions within roll '+id+'.');
  if(pieceNumber!==roll.pieces.length+1)throw Error('Cut numbers must be sequential within roll '+id+'.');
  roll.pieces.push({pieceNumber,xIn,yIn,widthIn,heightIn,grainRotationDeg:angle,label:row[3]});
 }
 const shoppingIds=new Set<string>();
 for(const [i,row] of shopRows.slice(1).entries()){
  if(row.length!==12)throw Error('Malformed shopping row '+(i+2)+'.');
  if(row[11]!==hash)throw Error('Shopping and physical cut CSV belong to different project snapshots.');
  const rollId=row[10],status=row[9];
  if(!rollId){
   if(status==='NOT_PLANNED_NO_CUT_PIECES')continue;
   throw Error('Shopping material is missing a physical roll ID.');
  }
  if(shoppingIds.has(rollId))throw Error('Duplicate shopping physical roll: '+rollId+'.');
  shoppingIds.add(rollId);
  const matched=rolls.get(rollId);
  if(!matched)throw Error('Shopping roll '+rollId+' has no matching physical cuts.');
  if(status!=='FEASIBLE_LAYOUT'&&status!=='TOP_CUT_LIST_NOT_REVIEWED')
   throw Error('Shopping roll '+rollId+' is not purchase-ready.');
  const amount=positiveNumber(row[3],'rounded purchased yardage');
  const raw=positiveNumber(row[2],'exact prewash yardage');
  if(amount+1e-8<raw)
   throw Error('Rounded purchased yardage for '+rollId+' is less than the exact prewash requirement.');
  if(raw*36+1e-7<matched.requiredRunIn)
   throw Error('Exact prewash yardage for '+rollId+' is shorter than the postwash cutting run.');
  if(amount*36+1e-7<matched.requiredRunIn)
   throw Error('Purchased yardage for '+rollId+' is shorter than the cutting run.');
  const plannedPct=100*(1-matched.requiredRunIn/(raw*36));
  if(!Number.isFinite(plannedPct)||plannedPct< -1e-7||plannedPct>=100)
   throw Error('Unreasonable shrinkage coverage in shopping roll '+rollId+'.');
  matched.plannedRawPurchaseYards=raw;
  matched.plannedRoundedPurchaseYards=amount;
  matched.plannedLengthShrinkagePct=Math.max(0,plannedPct);
 }
 for(const id of rolls.keys())
  if(!shoppingIds.has(id))throw Error('Physical cuts for '+id+' have no matching shopping line.');
 for(const roll of rolls.values()){
  const cutArea=roll.pieces.reduce((sum,p)=>sum+p.widthIn*p.heightIn,0);
  const layout:Layout={
   isCutFeasible:true,usableWofIn:roll.usableWofIn,
   exactFabricRunLengthIn:roll.requiredRunIn,
   cutPieces:roll.pieces,physicalOffcutAreaSqIn:Math.max(0,roll.usableWofIn*roll.requiredRunIn-cutArea),
   globallyOptimal:false
  };
  if(!verifyLayout(layout))throw Error('Invalid or overlapping cut coordinates for roll '+roll.id+'.');
 }
 return {sourceProjectHash:hash!,cutCount:cutRows.length-1,rolls:[...rolls.values()]};
}
export type ManualRollReading={
 id:string;actualUsableWofIn?:number;actualUsableRunIn?:number;
 /** Optional actual length before wash, from the same physical bolt segment
  * whose actualUsableRunIn is now measured after wash. */
 measuredPrewashRunIn?:number;
 sampledPieceNumber?:number;measuredPieceWidthIn?:number;measuredPieceHeightIn?:number;
};
export type ManualFabricAuditInput={
 project:ImportedFabricAudit;
 readings:ManualRollReading[];
 date:string;
 fabricCondition:'postwash'|'not-postwashed'|'';
 allowedPieceDeviationIn?:number;
 joinedSeamReadings?:UserJoinedSeamReading[];
 allowedSeamDeviationIn?:number;
 finishingReading?:UserFinishingReading;
 allowedFinishingDeviationIn?:number;
 reviewer:string;
 physicallyMeasured:boolean;
};
export type FabricAuditStatus=
 'INCOMPLETE_USER_MEASUREMENTS'|
 'INCONCLUSIVE_NOT_POSTWASHED'|
 'USER_REPORTED_SHORTAGE_OR_DEVIATION'|
 'USER_REPORTED_SHRINKAGE_EXCEEDS_PLAN'|
 'USER_REPORTED_SEAM_LOSS_EXCEEDS_PLAN'|
 'USER_REPORTED_SEAM_DIRECTION_MISMATCH'|
 'USER_REPORTED_SEAM_MEASUREMENTS_DISAGREE'|
 'USER_REPORTED_FINISH_MEASUREMENTS_DISAGREE'|
 'USER_REPORTED_BACKING_TRIM_SHORTFALL'|
 'USER_REPORTED_SEWN_TOP_SIZE_DEVIATION'|
 'USER_REPORTED_WITHIN_DECLARED_LIMITS';
export type RollAuditCheck={
 id:string;material:string;requiredWofIn:number;requiredRunIn:number;
 actualUsableWofIn?:number;actualUsableRunIn?:number;
 plannedRawPurchaseYards?:number;plannedRoundedPurchaseYards?:number;
 plannedLengthShrinkagePct?:number;
 measuredPrewashRunIn?:number;observedLengthShrinkagePct?:number;
 observedShrinkageExceedsPlan?:boolean;
 sampledPieceNumber?:number;expectedPieceWidthIn?:number;expectedPieceHeightIn?:number;
 measuredPieceWidthIn?:number;measuredPieceHeightIn?:number;
 widthDifferenceIn?:number;heightDifferenceIn?:number;
 hasShortage?:boolean;sampleOutsideAllowance?:boolean;
};
export type FabricAuditAssessment={
 status:FabricAuditStatus;missing:string[];canExport:boolean;checks:RollAuditCheck[];message:string;
 seamChecks:JoinedSeamObservation[];
 seamVerificationCoverage:JoinedSeamEvaluation['verificationCoverage'];
 finishingCheck:FinishingAudit;
};
function validDate(date:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const parsed=new Date(date);
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
}
const reading=(v:number|undefined)=>v!==undefined&&Number.isFinite(v)&&v>0&&v<=100000;
export function assessFabricAudit(input:ManualFabricAuditInput):FabricAuditAssessment{
 const missing:string[]=[];
 if(!validDate(input.date))missing.push('Physical measurement date');
 if(!input.fabricCondition)missing.push('Fabric prewash condition');
 if(!input.physicallyMeasured)missing.push('Real-ruler measurement confirmation');
 const tolerance=input.allowedPieceDeviationIn;
 if(tolerance===undefined||!Number.isFinite(tolerance)||tolerance<0||tolerance>0.25)
  missing.push('Declared cutting tolerance, 0 to 0.25 inch');
 const checks:RollAuditCheck[]=[];
 const given=new Map<string,ManualRollReading>();
 for(const r of input.readings){if(given.has(r.id))missing.push('Duplicate roll measurement: '+r.id);given.set(r.id,r);}
 for(const id of given.keys())if(!input.project.rolls.some(r=>r.id===id))missing.push('Unknown physical roll: '+id);
 for(const roll of input.project.rolls){
  const r=given.get(roll.id);
  const check:RollAuditCheck={
   id:roll.id,material:roll.material,requiredWofIn:roll.usableWofIn,requiredRunIn:roll.requiredRunIn,
   plannedRawPurchaseYards:roll.plannedRawPurchaseYards,
   plannedRoundedPurchaseYards:roll.plannedRoundedPurchaseYards,
   plannedLengthShrinkagePct:roll.plannedLengthShrinkagePct
  };
  if(!r||!reading(r.actualUsableWofIn)||!reading(r.actualUsableRunIn)){
   missing.push('Actual usable fabric width and length for '+roll.id);
  }else{
   check.actualUsableWofIn=r.actualUsableWofIn;
   check.actualUsableRunIn=r.actualUsableRunIn;
   check.hasShortage=r.actualUsableWofIn!+1e-8<roll.usableWofIn ||
    r.actualUsableRunIn!+1e-8<roll.requiredRunIn;
  }
  if(r?.measuredPrewashRunIn!==undefined){
   if(!reading(r.measuredPrewashRunIn)){
    missing.push('Valid real before-wash length for '+roll.id);
   }else if(reading(r.actualUsableRunIn)){
    const observed=100*(1-r.actualUsableRunIn!/r.measuredPrewashRunIn);
    check.measuredPrewashRunIn=r.measuredPrewashRunIn;
    check.observedLengthShrinkagePct=observed;
    // Compare signed rates without hiding material expansion. The purchase
    // model assumed one length-shrinkage rate, not a universal fabric standard.
    if(roll.plannedLengthShrinkagePct!==undefined)
     check.observedShrinkageExceedsPlan=observed>roll.plannedLengthShrinkagePct+1e-7;
   }
  }
  const piece=roll.pieces.find(p=>p.pieceNumber===r?.sampledPieceNumber);
  if(!piece||!reading(r?.measuredPieceWidthIn)||!reading(r?.measuredPieceHeightIn)){
   missing.push('Real measured sample piece for '+roll.id);
  }else{
   check.sampledPieceNumber=piece.pieceNumber;
   check.expectedPieceWidthIn=piece.widthIn;
   check.expectedPieceHeightIn=piece.heightIn;
   check.measuredPieceWidthIn=r!.measuredPieceWidthIn;
   check.measuredPieceHeightIn=r!.measuredPieceHeightIn;
   check.widthDifferenceIn=r!.measuredPieceWidthIn!-piece.widthIn;
   check.heightDifferenceIn=r!.measuredPieceHeightIn!-piece.heightIn;
   if(tolerance!==undefined&&Number.isFinite(tolerance)&&tolerance>=0&&tolerance<=.25)
    check.sampleOutsideAllowance=Math.abs(check.widthDifferenceIn)>tolerance+1e-8 ||
     Math.abs(check.heightDifferenceIn)>tolerance+1e-8;
  }
  checks.push(check);
 }
 const seams=evaluateJoinedSeams(input.project.seamPlan,input.readings,input.joinedSeamReadings??[],input.allowedSeamDeviationIn);
 const finishing=evaluateFinishing(input.project.seamPlan,input.finishingReading,input.joinedSeamReadings??[],input.allowedFinishingDeviationIn);
 missing.push(...seams.missing,...finishing.invalid);
 const seamDetails={
  seamChecks:seams.observations,seamVerificationCoverage:seams.verificationCoverage,
  finishingCheck:finishing
 };
 if(missing.length)return {...seamDetails,status:'INCOMPLETE_USER_MEASUREMENTS',canExport:false,checks,missing,
  message:'Missing real paper/fabric measurements or required metadata. No cutting pass or physical approval is available.'};
 if(input.fabricCondition!=='postwash')return {...seamDetails,status:'INCONCLUSIVE_NOT_POSTWASHED',canExport:true,checks,missing,
  message:'Inconclusive: fabric has not been measured in the intended postwash condition. Actual cutting can shrink below reported widths or lengths. Keep this as user-reported evidence only.'};
 if(checks.some(c=>c.hasShortage||c.sampleOutsideAllowance))return {
  ...seamDetails,status:'USER_REPORTED_SHORTAGE_OR_DEVIATION',canExport:true,checks,missing,
  message:'User-reported material shortage or sampled piece dimension exceeds the stated allowance. Do not treat this plan as approved for real cutting.'};
 if(seams.anyBackingDirectionMismatch)return {
  ...seamDetails,status:'USER_REPORTED_SEAM_DIRECTION_MISMATCH',canExport:true,checks,missing,
  message:'User-reported backing panel seam direction differs from the selected vertical/horizontal cutting plan. Stop and recheck grain/direction before cutting or sewing. This is NOT independent physical verification.'};
 if(seams.anyJoinReconciliationMismatch)return {
  ...seamDetails,status:'USER_REPORTED_SEAM_MEASUREMENTS_DISAGREE',canExport:true,checks,missing,
  message:'The sum of user-measured per-join take-up does NOT reconcile to the separately measured untrimmed joined span within the declared TOTAL deviation. Re-measure each join and the complete assembly; neither value is independently certified.'};
 if(seams.anyExcessOrShortfall)return {
  ...seamDetails,status:'USER_REPORTED_SEAM_LOSS_EXCEEDS_PLAN',canExport:true,checks,missing,
  message:'User-reported backing or straight-grain binding join loss exceeded the planned total allowance or left less than the required usable joined span. Recheck all seams before production. This does NOT certify physical material.'};
 if(finishing.backingIndependentMeasurementMismatch||finishing.joinedPretrimAxisMismatch)return {
  ...seamDetails,status:'USER_REPORTED_FINISH_MEASUREMENTS_DISAGREE',canExport:true,checks,missing,
  message:'User-reported backing before/after-trim dimensions disagree with four edge removals or separately measured joined seam width/height. Review real ruler measurements; do not rely on the trim result for production.'};
 if(finishing.backingWidthShortfall||finishing.backingHeightShortfall)return {
  ...seamDetails,status:'USER_REPORTED_BACKING_TRIM_SHORTFALL',canExport:true,checks,missing,
  message:'User-reported trimmed backing is smaller than the required backing target. Stop: quilt backing safety overage may be lost. This does not verify production readiness.'};
 if(finishing.sewnQuiltTopOutsideTolerance)return {
  ...seamDetails,status:'USER_REPORTED_SEWN_TOP_SIZE_DEVIATION',canExport:true,checks,missing,
  message:'User-reported sewn quilt TOP outside width/height is outside the planned finished top dimensions by more than the declared dimensional tolerance. Finished bound quilt dimensions remain unverified.'};
 if(checks.some(c=>c.observedShrinkageExceedsPlan))return {
  ...seamDetails,status:'USER_REPORTED_SHRINKAGE_EXCEEDS_PLAN',canExport:true,checks,missing,
  message:'The user-measured prewash/postwash length decrease exceeds the shrinkage percentage assumed by the shopping estimate. Recheck the source roll and purchasing buffer; enough actual postwash material may still remain. This is NOT a physical approval.'};
 const unmeasured=checks.filter(c=>c.measuredPrewashRunIn===undefined).length;
 const perJoinIncomplete=seams.observations.filter(o=>o.joinCount>0&&o.perJoinCoverage!=='ALL_USER_REPORTED').length;
 const backingUnconfirmed=seams.observations.some(o=>o.kind==='backing'&&o.joinCount>0&&!o.observedBackingJoinDirection);
 const seamNote=seams.verificationCoverage==='NOT_IMPORTED'
  ?'No matching cutting-plan JSON was supplied; seam take-up was NOT verified. '
  :seams.verificationCoverage==='NOT_MEASURED'
  ?'No physical joined-seam lengths were entered; seam take-up was NOT verified. '
  :seams.verificationCoverage==='PARTIAL_USER_REPORTED'
  ?'Only some sewn joins were user-measured; remaining seam take-up is NOT verified. '
  :'Backing/binding joined lengths are USER REPORTED only; independent seam verification is NOT complete. ';
 return {...seamDetails,status:'USER_REPORTED_WITHIN_DECLARED_LIMITS',canExport:true,checks,missing,
  message:'User-entered postwash roll dimensions and sampled cuts fit the declared limits. '+(unmeasured?unmeasured+' roll(s) have no measured before-wash length; actual shrinkage was NOT verified. ':'')+
   seamNote+
   (seams.verificationCoverage!=='NOT_IMPORTED'&&perJoinIncomplete?
     perJoinIncomplete+' assembly type(s) have incomplete individual seam take-up logs; cumulative per-join loss was NOT fully checked. ':'')+
   (backingUnconfirmed?'The real backing seam direction was NOT user-confirmed. ':'')+
   (finishing.backingCoverage==='FULL_USER_REPORTED'?'Backing edge trimming is USER REPORTED only. ':'Four backing edge trims and final dimensions are NOT fully verified. ')+
   (finishing.topCoverage==='FULL_USER_REPORTED'?'Sewn quilt TOP outside size is USER REPORTED only. ':'Sewn quilt TOP final outside size is NOT verified. ')+
   'Final quilt dimensions after batting, quilting and binding are NOT verified. This is NOT independent certification, and does NOT approve fabric purchase or production.'};
}
export function fabricAuditEvidence(input:ManualFabricAuditInput,recordedAtUtc:string){
 const result=assessFabricAudit(input);
 if(!result.canExport)throw Error('Complete every physical measurement and confirm it was performed before exporting.');
 return {
  schemaVersion:4,kind:'user-reported-fabric-cutting-check',
  recordedAtUtc,measuredOn:input.date,
  projectFingerprint:input.project.sourceProjectHash,
  sourceSnapshotIsCryptographicallyAuthenticated:false,
  importedCutCount:input.project.cutCount,importedRollCount:input.project.rolls.length,
  CSVsMatchedBySourceFingerprint:true,
  fabricCondition:input.fabricCondition,
  userSelectedPieceDeviationAllowanceIn:input.allowedPieceDeviationIn,
  reviewer:input.reviewer.trim(),
  userConfirmedPhysicalMeasurement:input.physicallyMeasured,
  checks:result.checks,
  cuttingPlanJsonMatchedByFingerprint:Boolean(input.project.seamPlan),
  seamChecks:result.seamChecks,seamVerificationCoverage:result.seamVerificationCoverage,
  userSelectedSeamDeviationAllowanceIn:input.allowedSeamDeviationIn,
  finishingCheck:result.finishingCheck,
  userSelectedFinishingDeviationAllowanceIn:input.allowedFinishingDeviationIn,
  selfReportedStatus:result.status,explanation:result.message,
  independentPhysicalVerification:false,quiltCuttingApproval:false,
  note:'Uploaded files and measurements are user supplied. Checking a sample cut is not verification of every physical cut.'
 };
}
