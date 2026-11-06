import type {ImportedFabricAudit, ManualRollReading} from './fabric-audit';
import type {FinishingPlan} from './finishing-audit';

/**
 * Independent physical-measurement worksheet support. This module reads the
 * site's native whole-quilt cutting-plan JSON in addition to the paired CSVs.
 * These three user-supplied files share only a SHORT NONCRYPTOGRAPHIC project
 * fingerprint; no file identity or ruler measurement is independently proven.
 */
export type JoinedMaterialKind='backing'|'binding';
export type PlannedSeamCheck={
 kind:JoinedMaterialKind;
 rollId:JoinedMaterialKind;
 direction?:'vertical'|'horizontal';
 sectionCount:number;
 joinCount:number;
 plannedFullWidthIn:number;
 plannedPretrimJoinedLengthIn:number;
 requiredMinimumLengthIn:number;
 modeledTotalJoinLossIn:number;
};
export type JoinedSeamPlan={
 sourceProjectHash:string;
 calculationVersion:string;
 checks:PlannedSeamCheck[];
 finishing:FinishingPlan;
};
export type UserJoinedSeamReading={
 kind:JoinedMaterialKind;
 /** Measured after sewing all joins, BEFORE trimming either end/side. */
 measuredPretrimJoinedLengthIn?:number;
 /** The observed line of backing seam joins, not the orientation of the cut bolt. */
 observedBackingJoinDirection?:'vertical'|'horizontal';
 /** Individually user-measured NET length lost at each join. This is NOT
  * automatically twice a seam allowance: diagonal binding joins can differ.
  * Each index is join #1, #2 etc in physical assembly order. */
 perJoinObservedLossesIn?:Array<number|undefined>;
};
export type JoinedSeamObservation=PlannedSeamCheck & {
 measuredPretrimJoinedLengthIn?:number;
 actualFullWidthIn?:number;
 observedTotalJoinLossIn?:number;
 observedLossExceedsModel?:boolean;
 assembledSpanShortfall?:boolean;
 observedBackingJoinDirection?:'vertical'|'horizontal';
 backingDirectionMismatch?:boolean;
 perJoinObservedLossesIn?:Array<number|undefined>;
 perJoinMeasuredCount:number;
 perJoinCoverage:'NO_JOINS'|'NOT_MEASURED'|'PARTIAL_USER_REPORTED'|'ALL_USER_REPORTED';
 perJoinTotalLossIn?:number;
 predictedJoinedSpanFromPerJoinIn?:number;
 perJoinLossExceedsModel?:boolean;
 perJoinVsAssembledSpanDifferenceIn?:number;
 perJoinVsAssembledSpanMismatch?:boolean;
 measurementState:'NOT_MEASURED'|'USER_REPORTED_WITHIN_ASSUMPTION'|'USER_REPORTED_EXCESS_LOSS_OR_SHORTFALL';
};
export type JoinedSeamEvaluation={
 observations:JoinedSeamObservation[];
 missing:string[];
 anyExcessOrShortfall:boolean;
 anyBackingDirectionMismatch:boolean;
 anyJoinReconciliationMismatch:boolean;
 verificationCoverage:'NOT_IMPORTED'|'NOT_MEASURED'|'PARTIAL_USER_REPORTED'|'ALL_USER_REPORTED';
};
const MAX_BYTES=2_000_000;
const close=(a:number,b:number)=>Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(a),Math.abs(b));
function obj(value:unknown,label:string):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))
  throw Error('Invalid '+label+' in cutting-plan JSON.');
 return value as Record<string,unknown>;
}
function num(value:unknown,label:string,{zero=false,max=100000}:{zero?:boolean,max?:number}={}):number{
 if(typeof value!=='number'||!Number.isFinite(value) || value>max ||
   (zero?value<0:value<=0))
  throw Error('Invalid '+label+' in cutting-plan JSON.');
 return value;
}
function count(value:unknown,label:string):number{
 const n=num(value,label,{max:2000});
 if(!Number.isSafeInteger(n))throw Error('Invalid whole-number '+label+' in cutting-plan JSON.');
 return n;
}
function sourceObject(json:string):Record<string,unknown>{
 if(!json.trim()||json.length>MAX_BYTES)throw Error('Cutting-plan JSON must be nonempty and below 2 MB.');
 let data:unknown;
 try{data=JSON.parse(json);}catch{throw Error('Malformed cutting-plan JSON.');}
 return obj(data,'root');
}
function comparableRoll(project:ImportedFabricAudit,kind:JoinedMaterialKind,sections:number,width:number,length:number){
 const roll=project.rolls.find(r=>r.id===kind);
 if(!roll)throw Error('Cutting CSV is missing the '+kind+' physical roll.');
 if(roll.pieces.length!==sections)
  throw Error('Cutting-plan JSON '+kind+' section count disagrees with cut CSV.');
 if(!close(roll.usableWofIn,width))
  throw Error('Cutting-plan JSON '+kind+' usable width disagrees with cut CSV.');
 if(!close(roll.requiredRunIn,sections*length))
  throw Error('Cutting-plan JSON '+kind+' cut run disagrees with cut CSV.');
 if(roll.pieces.some(p=>!close(p.widthIn,width)||!close(p.heightIn,length)))
  throw Error('Cutting-plan JSON '+kind+' piece dimensions disagree with cut CSV.');
}
/** Import only a physically consistent *whole-project* plan. The JSON alone
 * is not authenticated: compare the same exported revision, actual fabric
 * measurements, stitch margins and seam type manually before cutting.
 */
export function readJoinedSeamPlan(project:ImportedFabricAudit,json:string):JoinedSeamPlan{
 const root=sourceObject(json);
 if(root.tool!=='hub')throw Error('Assembly seam checks require the whole-quilt Project Planner JSON, not an individual calculator.');
 if(root.sourceProjectHash!==project.sourceProjectHash)
  throw Error('Cutting-plan JSON fingerprint does not match the two CSV project revisions.');
 const readiness=obj(root.readiness,'readiness');
 if(readiness.cutCsvReady!==true||readiness.status!=='LISTED_CUTS_FEASIBLE')
  throw Error('Cutting-plan JSON is not a complete, reviewed physical cut-list calculation.');
 const result=obj(root.result,'result');
 const backing=obj(result.selectedBacking,'selected backing');
 const binding=obj(result.binding,'straight-grain binding');
 const direction=backing.direction;
 if(direction!=='vertical'&&direction!=='horizontal')
  throw Error('Invalid selected backing join orientation.');
 const backingCount=count(backing.panelCount,'backing panel count');
 const backingWof=num(obj(backing.layout,'backing layout').usableWofIn,'backing WOF');
 const backingPanelLength=num(backing.panelLengthIn,'backing panel length');
 const joinedSpan=num(backing.finishedJoinedSpanIn,'joined backing span');
 const backingWidth=num(backing.targetWidthIn,'backing target width');
 const backingHeight=num(backing.targetHeightIn,'backing target height');
 const targetSpan=direction==='vertical'?backingWidth:backingHeight;
 const dimensions=obj(root.dimensions,'resolved quilt-top dimensions');
 const quiltTopW=num(dimensions.finalWidthIn,'sewn quilt-top planned outside width');
 const quiltTopH=num(dimensions.finalHeightIn,'sewn quilt-top planned outside height');
 if(backingWidth+1e-7<quiltTopW||backingHeight+1e-7<quiltTopH||
   !close(backingWidth-quiltTopW,backingHeight-quiltTopH))
  throw Error('Selected backing target does not reconcile to the quilt-top outside dimensions and equal edge overage.');
 comparableRoll(project,'backing',backingCount,backingWof,backingPanelLength);
 const modeledBackingLoss=backingCount*backingWof-joinedSpan;
 if(modeledBackingLoss< -1e-6 || joinedSpan+1e-6<targetSpan ||
  (backingCount===1&&!close(joinedSpan,backingWof)) ||
  (backingCount>1&&modeledBackingLoss>=(backingCount-1)*backingWof))
  throw Error('Backing assembly geometry does not reconcile with the selected direction and cut pieces.');
 const stripCount=count(binding.stripCount,'binding strip count');
 const bindingWof=num(obj(binding.layout,'binding layout').usableWofIn,'binding WOF');
 const bindingPieces=project.rolls.find(r=>r.id==='binding')?.pieces;
 if(!bindingPieces||bindingPieces.length!==stripCount)
  throw Error('Cutting-plan JSON binding strips disagree with cut CSV.');
 const stripLength=bindingPieces[0].heightIn;
 comparableRoll(project,'binding',stripCount,bindingWof,stripLength);
 const bindingJoined=num(binding.effectiveJoinedLengthIn,'joined binding length');
 const bindingRequired=num(binding.requiredLengthIn,'required binding length');
 const modeledBindingLoss=stripCount*bindingWof-bindingJoined;
 if(modeledBindingLoss< -1e-6 || bindingJoined+1e-6<bindingRequired ||
  (stripCount===1&&!close(bindingJoined,bindingWof)) ||
  (stripCount>1&&modeledBindingLoss>=(stripCount-1)*bindingWof))
  throw Error('Binding assembled length does not reconcile with the cut list.');
 const pretrimW=direction==='vertical'?joinedSpan:backingPanelLength;
 const pretrimH=direction==='vertical'?backingPanelLength:joinedSpan;
 if(pretrimW+1e-7<backingWidth||pretrimH+1e-7<backingHeight)
  throw Error('Backing pretrim model is smaller than its required target.');
 const finishing:FinishingPlan={
  requiredBackingWidthIn:backingWidth,requiredBackingHeightIn:backingHeight,
  plannedPretrimBackingWidthIn:pretrimW,plannedPretrimBackingHeightIn:pretrimH,
  plannedQuiltTopWidthIn:quiltTopW,plannedQuiltTopHeightIn:quiltTopH
 };
 // An internal plan can still be manipulated by a user; validate the entire
 // numeric model and mark the result NONCRYPTOGRAPHIC in every export.
 const checks:PlannedSeamCheck[]=[
  {kind:'backing',rollId:'backing',direction,sectionCount:backingCount,joinCount:backingCount-1,
   plannedFullWidthIn:backingWof,plannedPretrimJoinedLengthIn:joinedSpan,
   requiredMinimumLengthIn:targetSpan,modeledTotalJoinLossIn:Math.max(0,modeledBackingLoss)},
  {kind:'binding',rollId:'binding',sectionCount:stripCount,joinCount:stripCount-1,
   plannedFullWidthIn:bindingWof,plannedPretrimJoinedLengthIn:bindingJoined,
   requiredMinimumLengthIn:bindingRequired,modeledTotalJoinLossIn:Math.max(0,modeledBindingLoss)}
 ];
 return {sourceProjectHash:project.sourceProjectHash,calculationVersion:String(root.calculationVersion??'unknown'),checks,finishing};
}
/**
 * Evaluate actual physical seam observations. The overall pretrim joined span
 * and per-join net losses are INDEPENDENT USER INPUTS; neither is filled from
 * the model. They can disagree, which is a valuable error signal.
 *
 * A complete per-join log predicts span = n × measured postwash WOF − Σ join
 * take-up. This does not measure individual fabric pieces or validate stitch
 * technique. The selected tolerance is for the entire assembly, not per seam.
 */
export function evaluateJoinedSeams(
 plan:JoinedSeamPlan|undefined,
 readings:readonly ManualRollReading[],
 entered:readonly UserJoinedSeamReading[],
 allowanceIn:number|undefined
):JoinedSeamEvaluation{
 if(!plan)return {
  observations:[],missing:[],anyExcessOrShortfall:false,
  anyBackingDirectionMismatch:false,anyJoinReconciliationMismatch:false,
  verificationCoverage:'NOT_IMPORTED'
 };
 const missing:string[]=[];
 const map=new Map<JoinedMaterialKind,UserJoinedSeamReading>();
 for(const r of entered){
  if(r.kind!=='backing'&&r.kind!=='binding'){missing.push('Unknown assembly seam type');continue;}
  if(map.has(r.kind))missing.push('Duplicate assembly measurement: '+r.kind);
  map.set(r.kind,r);
 }
 const actualRolls=new Map(readings.map(r=>[r.id,r]));
 let anyReported=0,expectedReports=0,anyExcessOrShortfall=false;
 let anyBackingDirectionMismatch=false,anyJoinReconciliationMismatch=false;
 const observations=plan.checks.map(spec=>{
  const observation:JoinedSeamObservation={
   ...spec,measurementState:'NOT_MEASURED',
   perJoinCoverage:spec.joinCount===0?'NO_JOINS':'NOT_MEASURED',
   perJoinMeasuredCount:0
  };
  if(spec.joinCount===0)return observation;
  expectedReports++;
  const current=map.get(spec.kind);
  if(spec.kind==='backing'&&current?.observedBackingJoinDirection!==undefined){
   const direction=current.observedBackingJoinDirection;
   if(direction!=='vertical'&&direction!=='horizontal')
    missing.push('Valid observed backing seam direction');
   else{
    observation.observedBackingJoinDirection=direction;
    observation.backingDirectionMismatch=direction!==spec.direction;
    if(observation.backingDirectionMismatch)anyBackingDirectionMismatch=true;
   }
  }else if(spec.kind==='binding'&&current?.observedBackingJoinDirection!==undefined){
   missing.push('Binding does not support a backing panel direction');
  }
  const joined=current?.measuredPretrimJoinedLengthIn;
  const entries=current?.perJoinObservedLossesIn;
  const hasPerJoin=entries!==undefined;
  if(hasPerJoin&&(!Array.isArray(entries)||entries.length!==spec.joinCount))
   missing.push('Individual '+spec.kind+' seam count does not match the current project plan.');
  const validEntries=hasPerJoin&&Array.isArray(entries)&&entries.length===spec.joinCount;
  const values=validEntries?entries:undefined;
  const nMeasured=values?.filter(v=>v!==undefined).length??0;
  observation.perJoinMeasuredCount=nMeasured;
  if(values)observation.perJoinObservedLossesIn=[...values];
  if(nMeasured>0)
   observation.perJoinCoverage=nMeasured===spec.joinCount?'ALL_USER_REPORTED':'PARTIAL_USER_REPORTED';
  const wof=actualRolls.get(spec.rollId)?.actualUsableWofIn;
  const needsWof=joined!==undefined||nMeasured>0;
  const validWof=typeof wof==='number'&&Number.isFinite(wof)&&wof>0&&wof<=100000;
  if(needsWof&&!validWof)
   missing.push('Valid measured postwash usable WOF for '+spec.rollId+' before evaluating joins');
  const validTolerance=allowanceIn!==undefined&&Number.isFinite(allowanceIn)&&allowanceIn>=0&&allowanceIn<=1;
  if(needsWof&&!validTolerance)
   missing.push('Declared joined-length deviation allowance, 0 to 1 inch');
  if(values){
   for(let i=0;i<values.length;i++){
    const v=values[i];
    if(v===undefined)continue;
    if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100000||
      (validWof&&v>=wof!))
     missing.push('Invalid net length loss for '+spec.kind+' join #'+(i+1));
   }
   if(nMeasured===spec.joinCount&&validWof&&validTolerance&&
     values.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<wof!)){
    const sum=values.reduce<number>((a,b)=>a+(b??0),0);
    observation.perJoinTotalLossIn=sum;
    observation.predictedJoinedSpanFromPerJoinIn=spec.sectionCount*wof!-sum;
    observation.perJoinLossExceedsModel=sum>spec.modeledTotalJoinLossIn+allowanceIn!+1e-8;
    if(observation.perJoinLossExceedsModel)anyExcessOrShortfall=true;
   }
  }
  if(joined===undefined)return observation;
  if(typeof joined!=='number'||!Number.isFinite(joined)||joined<=0||joined>100000){
   missing.push('Valid physical assembled '+spec.kind+' length before trimming');return observation;
  }
  if(!validWof||!validTolerance)return observation;
  observation.measuredPretrimJoinedLengthIn=joined;
  observation.actualFullWidthIn=wof;
  observation.observedTotalJoinLossIn=spec.sectionCount*wof!-joined;
  observation.observedLossExceedsModel=observation.observedTotalJoinLossIn>spec.modeledTotalJoinLossIn+allowanceIn!+1e-8;
  observation.assembledSpanShortfall=joined+1e-8<spec.requiredMinimumLengthIn;
  if(observation.predictedJoinedSpanFromPerJoinIn!==undefined){
   observation.perJoinVsAssembledSpanDifferenceIn=
    joined-observation.predictedJoinedSpanFromPerJoinIn;
   observation.perJoinVsAssembledSpanMismatch=
    Math.abs(observation.perJoinVsAssembledSpanDifferenceIn)>allowanceIn!+1e-8;
   if(observation.perJoinVsAssembledSpanMismatch)anyJoinReconciliationMismatch=true;
  }
  const issue=observation.observedLossExceedsModel||observation.assembledSpanShortfall||
   observation.perJoinLossExceedsModel===true;
  if(issue)anyExcessOrShortfall=true;
  observation.measurementState=issue?'USER_REPORTED_EXCESS_LOSS_OR_SHORTFALL':'USER_REPORTED_WITHIN_ASSUMPTION';
  anyReported++;
  return observation;
 });
 return {
  observations,missing,anyExcessOrShortfall,
  anyBackingDirectionMismatch,anyJoinReconciliationMismatch,
  verificationCoverage:expectedReports===0?'ALL_USER_REPORTED':
   anyReported===0?'NOT_MEASURED':
   anyReported===expectedReports?'ALL_USER_REPORTED':'PARTIAL_USER_REPORTED'
 };
}
