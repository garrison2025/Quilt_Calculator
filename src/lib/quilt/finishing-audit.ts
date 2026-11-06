import type {JoinedSeamPlan, UserJoinedSeamReading} from './seam-audit';

/** All dimensions are physical, user-entered inches. No sample values or
 * expected model values can fill missing measurements in this module. */
export type FinishingPlan={
 requiredBackingWidthIn:number;requiredBackingHeightIn:number;
 plannedPretrimBackingWidthIn:number;plannedPretrimBackingHeightIn:number;
 plannedQuiltTopWidthIn:number;plannedQuiltTopHeightIn:number;
};
export type UserFinishingReading={
 /** Physically measured joined backing BEFORE trimming any of its four edges. */
 pretrimBackingWidthIn?:number;pretrimBackingHeightIn?:number;
 /** Actual amount removed at each backing edge. ZERO is a valid observation. */
 trimLeftIn?:number;trimRightIn?:number;trimTopIn?:number;trimBottomIn?:number;
 /** Independent physical dimensions AFTER trimming all four backing edges. */
 trimmedBackingWidthIn?:number;trimmedBackingHeightIn?:number;
 /** Sewn quilt TOP outside, before quilting/batting and binding. */
 sewnQuiltTopWidthIn?:number;sewnQuiltTopHeightIn?:number;
};
export type FinishingAudit={
 source:'NOT_IMPORTED'|'MATCHING_CUTTING_PLAN';
 backingCoverage:'NOT_MEASURED'|'PARTIAL_USER_REPORTED'|'FULL_USER_REPORTED';
 topCoverage:'NOT_MEASURED'|'PARTIAL_USER_REPORTED'|'FULL_USER_REPORTED';
 planned?:FinishingPlan;
 reading?:UserFinishingReading;
 impliedTrimmedBackingWidthIn?:number;
 impliedTrimmedBackingHeightIn?:number;
 observedTrimAreaSqIn?:number;
 trimmedWidthDifferenceIn?:number;trimmedHeightDifferenceIn?:number;
 backingWidthShortfall?:boolean;backingHeightShortfall?:boolean;
 backingIndependentMeasurementMismatch?:boolean;
 sewnTopWidthDifferenceIn?:number;sewnTopHeightDifferenceIn?:number;
 sewnQuiltTopOutsideTolerance?:boolean;
 joinedPretrimAxisDifferenceIn?:number;
 joinedPretrimAxisMismatch?:boolean;
 warnings:string[];
 invalid:string[];
};
const FIELDS=[
 'pretrimBackingWidthIn','pretrimBackingHeightIn','trimLeftIn','trimRightIn',
 'trimTopIn','trimBottomIn','trimmedBackingWidthIn','trimmedBackingHeightIn',
 'sewnQuiltTopWidthIn','sewnQuiltTopHeightIn'
] as const;
type Field=(typeof FIELDS)[number];
function entered(x:number|undefined):boolean{return x!==undefined;}
const finite=(x:number)=>Number.isFinite(x)&&x<=100000;
const trimName:Field[]=['trimLeftIn','trimRightIn','trimTopIn','trimBottomIn'];
const backingName:Field[]=[...FIELDS.slice(0,8)];
const topName:Field[]=['sewnQuiltTopWidthIn','sewnQuiltTopHeightIn'];
function coverage(inputs:UserFinishingReading|undefined,keys:readonly Field[]){
 const count=keys.filter(k=>entered(inputs?.[k])).length;
 return (count===0?'NOT_MEASURED':count===keys.length?'FULL_USER_REPORTED':'PARTIAL_USER_REPORTED') as
  FinishingAudit['backingCoverage'];
}
function complete(inputs:UserFinishingReading|undefined,keys:readonly Field[]){
 return keys.every(k=>inputs?.[k]!==undefined);
}
/** Comparison allowance is the USER-DECLARED ABSOLUTE tolerance per width /
 * height measurement. It is not a construction standard or per-join allowance.
 */
export function evaluateFinishing(
 seamPlan:JoinedSeamPlan|undefined,
 readings:UserFinishingReading|undefined,
 sewnJoins:readonly UserJoinedSeamReading[],
 toleranceIn:number|undefined
):FinishingAudit{
 if(!seamPlan)return {
  source:'NOT_IMPORTED',backingCoverage:'NOT_MEASURED',topCoverage:'NOT_MEASURED',
  invalid:readings&&FIELDS.some(k=>entered(readings[k]))?['Matching cutting-plan JSON required for finishing measurements']:[],
  warnings:['No matching cutting-plan JSON. Backing edge trims and sewn quilt-top outside dimensions are NOT VERIFIED.']
 };
 const plan=seamPlan.finishing;
 const result:FinishingAudit={
  source:'MATCHING_CUTTING_PLAN',planned:plan,reading:readings?{...readings}:undefined,
  backingCoverage:coverage(readings,backingName),topCoverage:coverage(readings,topName),
  invalid:[],warnings:[]
 };
 if(!readings||!FIELDS.some(k=>entered(readings[k]))){
  result.warnings.push('No finishing ruler measurements entered. All backing edge trims and sewn top dimensions are NOT VERIFIED.');
  return result;
 }
 for(const field of FIELDS){
  const value=readings[field];if(value===undefined)continue;
  if(typeof value!=='number'||!finite(value)||
    (trimName.includes(field)?value<0:value<=0))
   result.invalid.push('Invalid physically measured '+field+'.');
 }
 if(toleranceIn===undefined||!Number.isFinite(toleranceIn)||toleranceIn<0||toleranceIn>1)
  result.invalid.push('Finishing dimensional tolerance must be between 0 and 1 inch.');
 if(result.invalid.length)return result;
 const allowed=toleranceIn!;
 if(complete(readings,['pretrimBackingWidthIn','pretrimBackingHeightIn'])){
  const observedCross=sewnJoins.find(x=>x.kind==='backing')?.measuredPretrimJoinedLengthIn;
  if(observedCross!==undefined&&Number.isFinite(observedCross)&&observedCross>0){
   const cross=seamPlan.checks.find(x=>x.kind==='backing');
   if(cross){
    const sourceCross=cross.direction==='vertical'?readings.pretrimBackingWidthIn!:readings.pretrimBackingHeightIn!;
    result.joinedPretrimAxisDifferenceIn=sourceCross-observedCross;
    result.joinedPretrimAxisMismatch=Math.abs(result.joinedPretrimAxisDifferenceIn)>allowed+1e-8;
    if(result.joinedPretrimAxisMismatch)
     result.warnings.push('The measured pretrim backing dimension disagrees with the separately recorded whole joined seam span.');
   }
  }
 }
 if(complete(readings,backingName)){
  const w=readings.pretrimBackingWidthIn!,h=readings.pretrimBackingHeightIn!;
  const left=readings.trimLeftIn!,right=readings.trimRightIn!;
  const top=readings.trimTopIn!,bottom=readings.trimBottomIn!;
  result.impliedTrimmedBackingWidthIn=w-left-right;
  result.impliedTrimmedBackingHeightIn=h-top-bottom;
  if(result.impliedTrimmedBackingWidthIn<=0||result.impliedTrimmedBackingHeightIn<=0){
   result.invalid.push('Four edge trims cannot remove the entire measured backing width or height.');
   return result;
  }
  result.observedTrimAreaSqIn=w*h-result.impliedTrimmedBackingWidthIn*result.impliedTrimmedBackingHeightIn;
  result.trimmedWidthDifferenceIn=readings.trimmedBackingWidthIn!-result.impliedTrimmedBackingWidthIn;
  result.trimmedHeightDifferenceIn=readings.trimmedBackingHeightIn!-result.impliedTrimmedBackingHeightIn;
  result.backingIndependentMeasurementMismatch=
    Math.abs(result.trimmedWidthDifferenceIn)>allowed+1e-8||
    Math.abs(result.trimmedHeightDifferenceIn)>allowed+1e-8;
  result.backingWidthShortfall=readings.trimmedBackingWidthIn!+1e-8<plan.requiredBackingWidthIn;
  result.backingHeightShortfall=readings.trimmedBackingHeightIn!+1e-8<plan.requiredBackingHeightIn;
  if(result.backingIndependentMeasurementMismatch)
   result.warnings.push('Independent trimmed backing width/height disagrees with pretrim minus four reported edge trims.');
  if(result.backingWidthShortfall||result.backingHeightShortfall)
   result.warnings.push('Actually measured trimmed backing is smaller than the required backing target; extra batting/quilting overage is no longer assured.');
 }else{
  result.warnings.push('Backing pretrim/edge removal/posttrim width and height are only partly measured; full four-edge reconciliation is NOT VERIFIED.');
 }
 if(complete(readings,topName)){
  result.sewnTopWidthDifferenceIn=readings.sewnQuiltTopWidthIn!-plan.plannedQuiltTopWidthIn;
  result.sewnTopHeightDifferenceIn=readings.sewnQuiltTopHeightIn!-plan.plannedQuiltTopHeightIn;
  result.sewnQuiltTopOutsideTolerance=
   Math.abs(result.sewnTopWidthDifferenceIn)>allowed+1e-8||
   Math.abs(result.sewnTopHeightDifferenceIn)>allowed+1e-8;
  if(result.sewnQuiltTopOutsideTolerance)
   result.warnings.push('Sewn quilt TOP outside measurements differ from the planned finished quilt-top outside dimensions beyond the user-declared tolerance.');
 }else result.warnings.push('Sewn quilt TOP outside width/height are NOT both measured; this does not verify the finished quilt size after batting, quilting or binding.');
 return result;
}
