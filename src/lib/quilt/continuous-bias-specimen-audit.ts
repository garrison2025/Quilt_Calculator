/**
 * Continuous bias tube: auditable PHYSICAL observation worksheet.
 *
 * No actual measurements are bundled, inferred, or fabricated. Published
 * third-party examples do not count as independent project specimens.
 * A complete user-entered record ONLY becomes READY_FOR_HUMAN_REVIEW;
 * it can NEVER automatically certify yield or authorize purchasing.
 */
import {calculateBiasTube2DDevelopment} from './continuous-bias-tube-development';

export type BiasSpecimenId='A'|'B'|'C';
export type BiasSpecimenConfig={
 id:BiasSpecimenId;sourceSquareSideIn:number;fullStripCutWidthIn:number;
 seamAllowanceIn:number;usableWofIn:number;
};
export const SPECIMEN_CONFIGS:readonly BiasSpecimenConfig[]=[
 {id:'A',sourceSquareSideIn:30,fullStripCutWidthIn:2.5,seamAllowanceIn:.25,usableWofIn:43},
 {id:'B',sourceSquareSideIn:24,fullStripCutWidthIn:2.25,seamAllowanceIn:.25,usableWofIn:43},
 {id:'C',sourceSquareSideIn:18,fullStripCutWidthIn:2,seamAllowanceIn:.25,usableWofIn:43}
];
export type BiasObservationTolerances={
 /** All limits must be recorded BEFORE cutting; never filled by defaults. */
 squareSideToleranceIn:number|null;
 seamAllowanceToleranceIn:number|null;
 tipOverhangToleranceIn:number|null;
 faceDimensionToleranceIn:number|null;
 markMismatchToleranceIn:number|null;
 stripWidthToleranceIn:number|null;
 lengthClosureToleranceIn:number|null;
 declaredBeforeCutting:boolean|null;
};
export type BiasSpecimenObservation={
 specimenId:BiasSpecimenId;
 operatorCode:string;
 fabricDescription:string;
 prewashStatus:''|'prewashed'|'not-prewashed';
 /** Written reference or path to ruler photos; NOT a verified upload. */
 evidenceReferences:string;
 tolerances:BiasObservationTolerances;
 measuredSquareWidthIn:number|null;
 measuredSquareHeightIn:number|null;
 measuredUsableWofIn:number|null;
 firstSeamSamplesIn:number[]|null;
 tipOverhangStartIn:number|null;
 tipOverhangEndIn:number|null;
 firstFaceLongEdgeIn:number|null;
 firstFaceHeightIn:number|null;
 observedFullBands:number|null;
 secondSeamSamplesIn:number[]|null;
 observedTubeCrossings:number|null;
 maxMarkMismatchIn:number|null;
 measuredBandRunIn:number|null;
 /** Start + end + TEN evenly spaced strip width positions. */
 stripWidthSamplesIn:number[]|null;
 /** Separately measured strip widths at EACH of the N-1 tube seam crossings. */
 seamCrossingWidthSamplesIn:number[]|null;
 untrimmedLengthIn:number|null;
 startTrimLengthEquivalentIn:number|null;
 endTrimLengthEquivalentIn:number|null;
 finishedCenterLengthIn:number|null;
 finishedLeftLengthIn:number|null;
 finishedRightLengthIn:number|null;
 pressedSeamsOpen:boolean|null;
 continuousSingleLayerCut:boolean|null;
};
export type BiasSpecimenAudit={
 method:'CONTINUOUS_BIAS_PHYSICAL_OBSERVATION_AUDIT';
 trust:'USER_ENTERED_UNVERIFIED_NOT_INDEPENDENT_EVIDENCE';
 specimenId:BiasSpecimenId;
 status:'NOT_RUN'|'INCOMPLETE'|'OBSERVATION_HOLD'|'READY_FOR_HUMAN_REVIEW';
 input:BiasSpecimenObservation;
 predicted:{
  firstFaceLongEdgeIn:number;firstFaceHeightIn:number;
  fullBands:number;crossings:number;bandRunIn:number;
  squaredEndLengthIn:number;
 };
 /** Positive means model exceeds the shortest measured final length. */
 modelOverstatementIn:number|null;
 shortestObservedFinishedLengthIn:number|null;
 missingFields:string[];
 observedDiscrepancies:string[];
 humanReviewCompleted:false;
 physicallyCertified:false;
 safeToPurchase:false;
 verifiedUsableLengthIn?:never;
 purchaseYards?:never;
};
const EPS=1e-8;
function finiteOrNull(v:number|null,name:string,max:number,min=0):void{
 if(v===null)return;
 if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)
  throw Error(name+' must be a finite measurement between '+min+' and '+max+'.');
}
function textCheck(value:string,name:string,maxLength=1000):void{
 if(typeof value!=='string'||value.length>maxLength)
  throw Error(name+' must be a text value no longer than '+maxLength+' characters.');
}
function boolOrNull(value:boolean|null,label:string):void{
 if(value!==null&&typeof value!=='boolean')throw Error(label+' must be yes/no or not recorded.');
}
function samples(
 v:number[]|null,expected:number,label:string,max:number
):void{
 if(v===null)return;
 if(!Array.isArray(v)||v.length!==expected)
  throw Error(label+' requires exactly '+expected+' measured values, or an empty observation.');
 v.forEach((n,i)=>{if(n===null)throw Error(label+' #'+(i+1)+' is missing.');finiteOrNull(n,label+' #'+(i+1),max);});
}
const addIf=(issues:string[],fail:boolean,message:string)=>{
 if(fail)issues.push(message);
};
export function emptyBiasSpecimenObservation(id:BiasSpecimenId):BiasSpecimenObservation{
 if(!SPECIMEN_CONFIGS.some(s=>s.id===id))throw Error('Unknown specimen.');
 return {
  specimenId:id,operatorCode:'',fabricDescription:'',prewashStatus:'',
  evidenceReferences:'',
  tolerances:{
   squareSideToleranceIn:null,seamAllowanceToleranceIn:null,
   tipOverhangToleranceIn:null,faceDimensionToleranceIn:null,
   markMismatchToleranceIn:null,stripWidthToleranceIn:null,
   lengthClosureToleranceIn:null,declaredBeforeCutting:null
  },
  measuredSquareWidthIn:null,measuredSquareHeightIn:null,
  measuredUsableWofIn:null,firstSeamSamplesIn:null,
  tipOverhangStartIn:null,tipOverhangEndIn:null,
  firstFaceLongEdgeIn:null,firstFaceHeightIn:null,
  observedFullBands:null,secondSeamSamplesIn:null,
  observedTubeCrossings:null,maxMarkMismatchIn:null,
  measuredBandRunIn:null,stripWidthSamplesIn:null,
  seamCrossingWidthSamplesIn:null,untrimmedLengthIn:null,startTrimLengthEquivalentIn:null,
  endTrimLengthEquivalentIn:null,finishedCenterLengthIn:null,
  finishedLeftLengthIn:null,finishedRightLengthIn:null,
  pressedSeamsOpen:null,continuousSingleLayerCut:null
 };
}
export function auditBiasSpecimenObservation(
 cfg:BiasSpecimenConfig,o:BiasSpecimenObservation
):BiasSpecimenAudit{
 if(!SPECIMEN_CONFIGS.some(s=>s.id===cfg.id&&s.sourceSquareSideIn===cfg.sourceSquareSideIn&&
    s.fullStripCutWidthIn===cfg.fullStripCutWidthIn&&s.seamAllowanceIn===cfg.seamAllowanceIn&&
    s.usableWofIn===cfg.usableWofIn))throw Error('Unsupported or altered specimen configuration.');
 if(!o||typeof o!=='object'||o.specimenId!==cfg.id)throw Error('Specimen identifier mismatch.');
 for(const [name,val] of [
  ['Operator code',o.operatorCode],
  ['Fabric description',o.fabricDescription],
  ['Evidence references',o.evidenceReferences]
 ] as const)textCheck(val,name);
 if(!['','prewashed','not-prewashed'].includes(o.prewashStatus))
  throw Error('Unknown prewash status.');
 const tol=o.tolerances;
 if(!tol||typeof tol!=='object')throw Error('Observation tolerances are required.');
 for(const [key,v] of Object.entries(tol)){
  if(key==='declaredBeforeCutting')boolOrNull(v as boolean|null,key);
  else finiteOrNull(v as number|null,'Tolerance '+key,2);
 }
 const scalars:[
  keyof BiasSpecimenObservation,number,number?
 ][]=[
  ['measuredSquareWidthIn',120,1],['measuredSquareHeightIn',120,1],
  ['measuredUsableWofIn',120,1],['tipOverhangStartIn',5],
  ['tipOverhangEndIn',5],['firstFaceLongEdgeIn',180,1],
  ['firstFaceHeightIn',120,1],['observedFullBands',32,0],
  ['observedTubeCrossings',32,0],['maxMarkMismatchIn',6],
  ['measuredBandRunIn',180,1],['untrimmedLengthIn',6000,1],
  ['startTrimLengthEquivalentIn',200],['endTrimLengthEquivalentIn',200],
  ['finishedCenterLengthIn',6000,1],['finishedLeftLengthIn',6000,1],
  ['finishedRightLengthIn',6000,1]
 ];
 for(const [key,max,min] of scalars)finiteOrNull(o[key] as number|null,key,max,min);
 if(o.observedFullBands!==null&&!Number.isInteger(o.observedFullBands))
  throw Error('Observed complete bands must be a whole number.');
 if(o.observedTubeCrossings!==null&&!Number.isInteger(o.observedTubeCrossings))
  throw Error('Observed stitch-line crossings must be a whole number.');
 samples(o.firstSeamSamplesIn,5,'First-seam five-position allowance',5);
 samples(o.secondSeamSamplesIn,5,'Tube-seam five-position allowance',5);
 samples(o.stripWidthSamplesIn,12,'Start/end + ten evenly spaced strip widths',6);
 boolOrNull(o.pressedSeamsOpen,'Seams pressed open');
 boolOrNull(o.continuousSingleLayerCut,'One-layer cut continuity');
 const N=Math.floor(((cfg.sourceSquareSideIn-cfg.seamAllowanceIn)/Math.SQRT2+1e-9)/
  cfg.fullStripCutWidthIn);
 samples(o.seamCrossingWidthSamplesIn,N-1,'Tube seam crossing strip widths',6);
 const m=calculateBiasTube2DDevelopment({
  sourceSquareSideIn:cfg.sourceSquareSideIn,usableWofIn:cfg.usableWofIn,
  fullStripCutWidthIn:cfg.fullStripCutWidthIn,seamAllowanceIn:cfg.seamAllowanceIn,
  markedBands:N,offsetBands:1
 });
 const predicted={
  firstFaceLongEdgeIn:m.postFirstSeamLongEdgeIn,
  firstFaceHeightIn:m.postFirstSeamFullHeightIn,
  fullBands:N,crossings:N-1,bandRunIn:m.postSecondSeamFullRunIn,
  squaredEndLengthIn:m.modeledSquareEndedLengthIn
 };
 const missing:string[]=[];
 const issues:string[]=[];
 for(const key of ['operatorCode','fabricDescription','evidenceReferences'] as const)
  if(!o[key].trim())missing.push(key);
 if(!o.prewashStatus)missing.push('prewashStatus');
 for(const [key,v] of Object.entries(tol))
  if(v===null)missing.push('tolerances.'+key);
 for(const [key] of scalars)
  if(o[key]===null)missing.push(key);
 for(const key of ['firstSeamSamplesIn','secondSeamSamplesIn','stripWidthSamplesIn','seamCrossingWidthSamplesIn'] as const)
  if(o[key]===null)missing.push(key);
 for(const key of ['pressedSeamsOpen','continuousSingleLayerCut'] as const)
  if(o[key]===null)missing.push(key);
 const T=tol;
 const checkDelta=(v:number|null,reference:number,limit:number|null,message:string)=>{
  if(v!==null&&limit!==null)addIf(issues,Math.abs(v-reference)>limit+EPS,message);
 };
 checkDelta(o.measuredSquareWidthIn,cfg.sourceSquareSideIn,
  T.squareSideToleranceIn,'Square width differs from nominal beyond declared tolerance.');
 checkDelta(o.measuredSquareHeightIn,cfg.sourceSquareSideIn,
  T.squareSideToleranceIn,'Square height differs from nominal beyond declared tolerance.');
 addIf(issues,o.measuredUsableWofIn!==null&&o.measuredUsableWofIn+EPS<cfg.sourceSquareSideIn,
  'Actual usable WOF does not fit the source square.');
 for(const [key,values] of [['first seam',o.firstSeamSamplesIn],
   ['tube seam',o.secondSeamSamplesIn]] as const)
  if(values&&T.seamAllowanceToleranceIn!==null)
   addIf(issues,values.some(v=>Math.abs(v-cfg.seamAllowanceIn)>T.seamAllowanceToleranceIn!+EPS),
    key+' allowance exceeds predeclared seam tolerance.');
 checkDelta(o.tipOverhangStartIn,cfg.seamAllowanceIn,
  T.tipOverhangToleranceIn,'First tip overhang differs from declared allowance.');
 checkDelta(o.tipOverhangEndIn,cfg.seamAllowanceIn,
  T.tipOverhangToleranceIn,'Second tip overhang differs from declared allowance.');
 checkDelta(o.firstFaceLongEdgeIn,predicted.firstFaceLongEdgeIn,
  T.faceDimensionToleranceIn,'First-seam face long edge differs from model.');
 checkDelta(o.firstFaceHeightIn,predicted.firstFaceHeightIn,
  T.faceDimensionToleranceIn,'First-seam face height differs from model.');
 addIf(issues,o.observedFullBands!==null&&o.observedFullBands!==N,
  'Observed complete marked band count differs from modeled N.');
 addIf(issues,o.observedTubeCrossings!==null&&o.observedTubeCrossings!==N-1,
  'Tube-seam crossing count does not match the one-lane chain.');
 addIf(issues,o.maxMarkMismatchIn!==null&&T.markMismatchToleranceIn!==null&&
  o.maxMarkMismatchIn>T.markMismatchToleranceIn+EPS,
  'Stitch-line mark mismatch exceeds predeclared tolerance.');
 checkDelta(o.measuredBandRunIn,predicted.bandRunIn,
  T.faceDimensionToleranceIn,'Measured full-band run differs from modeled tube run.');
 if(T.stripWidthToleranceIn!==null){
  for(const [label,values] of [
   ['Evenly spaced width samples',o.stripWidthSamplesIn],
   ['Tube seam crossing widths',o.seamCrossingWidthSamplesIn]
  ] as const){
   if(values)addIf(issues,values.some(v=>Math.abs(v-cfg.fullStripCutWidthIn)>
    T.stripWidthToleranceIn!+EPS),label+' exceed predeclared strip-width tolerance.');
  }
 }
 addIf(issues,o.pressedSeamsOpen===false,'Seams not pressed open as modeled.');
 addIf(issues,o.continuousSingleLayerCut===false,'Cut is not a continuous one-layer spiral.');
 addIf(issues,T.declaredBeforeCutting===false,
  'Tolerances were not declared before cutting; measurements need a new predeclared trial.');
 const observed=[o.finishedCenterLengthIn,o.finishedLeftLengthIn,o.finishedRightLengthIn];
 const shortest=observed.every(v=>v!==null)?Math.min(...observed as number[]):null;
 const overstatement=shortest===null?null:predicted.squaredEndLengthIn-shortest;
 // No statistical fudge: model overstatement is a safety blocker, regardless
 // of the declared measuring-tape tolerance.
 addIf(issues,overstatement!==null&&overstatement>EPS,
  'CRITICAL: model predicts more strip length than the shortest unstretched finished measurement.');
 if(o.untrimmedLengthIn!==null&&o.startTrimLengthEquivalentIn!==null&&
  o.endTrimLengthEquivalentIn!==null&&o.finishedCenterLengthIn!==null&&
  T.lengthClosureToleranceIn!==null)
  addIf(issues,Math.abs(
   o.untrimmedLengthIn-o.startTrimLengthEquivalentIn-
   o.endTrimLengthEquivalentIn-o.finishedCenterLengthIn
  )>T.lengthClosureToleranceIn+EPS,
  'Untrimmed length minus both measured end trims does not reconcile with finished center length.');
 const empty=missing.length===scalars.length+3+1+Object.keys(tol).length+4+2&&issues.length===0&&
  o.prewashStatus===''&&o.operatorCode===''&&o.fabricDescription===''&&o.evidenceReferences==='';
 const status:BiasSpecimenAudit['status']=empty?'NOT_RUN':issues.length>0
  ?'OBSERVATION_HOLD':missing.length>0?'INCOMPLETE':'READY_FOR_HUMAN_REVIEW';
 return {
  method:'CONTINUOUS_BIAS_PHYSICAL_OBSERVATION_AUDIT',
  trust:'USER_ENTERED_UNVERIFIED_NOT_INDEPENDENT_EVIDENCE',
  specimenId:cfg.id,status,input:o,predicted,
  modelOverstatementIn:overstatement,shortestObservedFinishedLengthIn:shortest,
  missingFields:missing,observedDiscrepancies:issues,
  humanReviewCompleted:false,physicallyCertified:false,safeToPurchase:false
 };
}
