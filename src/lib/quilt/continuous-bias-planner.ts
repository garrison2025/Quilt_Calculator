/**
 * Continuous bias planning RESEARCH ONLY — NOT a verified buying calculator.
 *
 * Inverts the accepted numerical 2D tube convention to find the FIRST 1/8in
 * straight-grain square whose MODELED squared-end strip length reaches the
 * requested binding target. This does not promote a predicted sewing length
 * to a measured fabric yield or certified purchase quantity.
 *
 * WOF is measured AFTER any width shrink/selvage trimming. A separate optional
 * length-prewash factor applies ONLY to the hypothetical roll run before
 * prewashing, never a second time to WOF.
 */
import {
 calculateBiasTube2DDevelopment,type BiasTubeDevelopment
} from './continuous-bias-tube-development';

export type ContinuousBiasPlanInput={
 quiltWidthIn:number;
 quiltHeightIn:number;
 tailAllowanceIn:number;
 extraMarginPct:number;
 fullStripCutWidthIn:number;
 seamAllowanceIn:number;
 /** Already-trimmed usable width, AFTER prewashing if prewashed. */
 usableWofIn:number;
 /** Prewash length shrinkage; 0 if working from prewashed fabric. */
 lengthShrinkPct:number;
 /** Hypothetical retail increment; not a purchase instruction. */
 retailIncrementYd:0.125|0.25|0.5|1;
 /** Optional manually entered pricing, for scenario illustration only. */
 pricePerYardUsd:number;
};
export type BiasPlanSquareScenario={
 sourceSquareSideIn:number;
 modelFullBands:number;
 modelStripLengthIn:number;
 gapToTargetIn:number;
 unusedWofAcrossSquareIn:number;
 /** BEFORE prewashing, hypothetical rectangular bolt-run for one square. */
 unwashedRollRunIn:number;
 /** Numerical yard conversion, NOT certified purchasing. */
 indicativeRawRollRunYd:number;
 indicativeRoundedRollRunYd:number;
 indicativePriceUsd:number;
 rollRoundingExtraIn:number;
};
export type ContinuousBiasPlan={
 method:'CONTINUOUS_BIAS_PLANNER_NUMERICAL_SCENARIO_ONLY';
 verdict:'NOT_VERIFIED_FOR_PHYSICAL_YIELD_OR_PURCHASE';
 input:ContinuousBiasPlanInput;
 quiltPerimeterIn:number;
 targetWithTailIn:number;
 /** User-selected model-only extra length; cannot substitute real measurement. */
 modeledTargetIn:number;
 areaOnlyAbsoluteFloorSqIn:number;
 areaOnlySquareSideFloorIn:number;
 searchStepIn:0.125;
 mathematicalSquareLimitIn:number;
 checkedCandidateCount:number;
 status:'MODEL_FIT'|'NO_MODEL_FIT_WITHIN_WOF';
 /** First grid square meeting the ideal formula: never called physically sufficient. */
 scenario:BiasPlanSquareScenario|null;
 /** Largest evaluated grid square; useful in NO_FIT case. */
 largestEvaluatedScenario:BiasPlanSquareScenario|null;
 /** Detailed 2D coordinates only for the selected numerical scenario. */
 development:BiasTubeDevelopment|null;
 physicalSpecimenVerified:false;
 safeToPurchase:false;
 verifiedUsableLengthIn?:never;
 purchaseYards?:never;
};
const close=(a:number,b:number)=>Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b));
function valid(v:number,label:string,min:number,max:number):number{
 if(!Number.isFinite(v)||v<min||v>max)
  throw Error(label+' must be between '+min+' and '+max+'.');
 return v;
}
function toSquareScenario(
 S:number,W:number,a:number,wof:number,target:number,shrink:number,
 step:number,price:number
):BiasPlanSquareScenario|null{
 // Cap at 32 FULL bands because the separately checked 2D topology engine
 // currently supports at most 32. Beyond that the discarded width is NOT
 // claimed to be a fractional lane.
 const bands=Math.min(32,Math.floor(((S-a)/Math.SQRT2+1e-9)/W));
 if(bands<2)return null;
 const run=Math.SQRT2*(S-3*a),length=bands*run-W;
 if(run<=0||length<=0)return null;
 const unwashed=S/(1-shrink/100);
 const rawYd=unwashed/36;
 const roundedYd=Math.ceil(rawYd/step-1e-10)*step;
 return {
  sourceSquareSideIn:S,modelFullBands:bands,modelStripLengthIn:length,
  gapToTargetIn:length-target,
  unusedWofAcrossSquareIn:wof-S,
  unwashedRollRunIn:unwashed,indicativeRawRollRunYd:rawYd,
  indicativeRoundedRollRunYd:roundedYd,
  indicativePriceUsd:roundedYd*price,
  rollRoundingExtraIn:roundedYd*36-unwashed
 };
}
export function calculateContinuousBiasPlan(input:ContinuousBiasPlanInput):ContinuousBiasPlan{
 const width=valid(input.quiltWidthIn,'Finished quilt width',1,180);
 const height=valid(input.quiltHeightIn,'Finished quilt height',1,180);
 const tail=valid(input.tailAllowanceIn,'Binding tail allowance',0,120);
 const margin=valid(input.extraMarginPct,'Optional planning margin',0,35);
 const W=valid(input.fullStripCutWidthIn,'Full unfolded cut strip width',.75,6);
 const a=valid(input.seamAllowanceIn,'Allowance per raw edge on BOTH seams',.125,.5);
 const wof=valid(input.usableWofIn,'Already-trimmed usable fabric WOF',6,120);
 const shrink=valid(input.lengthShrinkPct,'Prewash LENGTH shrinkage',0,25);
 const price=valid(input.pricePerYardUsd,'Illustrative unit price',0,1000);
 const increment=input.retailIncrementYd;
 if(![.125,.25,.5,1].includes(increment))
  throw Error('Hypothetical retail step must be 1/8, 1/4, 1/2 or 1 yard.');
 const perimeter=2*(width+height);
 const targetWithTail=perimeter+tail;
 const target=targetWithTail*(1+margin/100);
 const minSquare=6,maxSquare=Math.min(96,wof);
 const floor=Math.sqrt(target*W);
 let selected:BiasPlanSquareScenario|null=null;
 let largest:BiasPlanSquareScenario|null=null;
 let count=0;
 // Fixed 1/8-in grid: first matching square minimizes modeled square side
 // and hypothetical raw bolt run among the enumerated candidates.
 for(let ticks=Math.ceil(minSquare*8);ticks<=Math.floor(maxSquare*8+1e-9);ticks++){
  const S=ticks/8;
  const candidate=toSquareScenario(S,W,a,wof,target,shrink,increment,price);
  if(!candidate)continue;
  count++;largest=candidate;
  if(candidate.modelStripLengthIn+1e-8>=target){
   selected=candidate;break;
  }
 }
 const development=selected?calculateBiasTube2DDevelopment({
  sourceSquareSideIn:selected.sourceSquareSideIn,
  usableWofIn:wof,fullStripCutWidthIn:W,seamAllowanceIn:a,
  markedBands:selected.modelFullBands,offsetBands:1
 }):null;
 if(selected&&development){
  if(!close(development.modeledSquareEndedLengthIn,selected.modelStripLengthIn)||
   development.actualFullBands!==selected.modelFullBands||
   development.rawSquareSideIn>wof+1e-8||
   development.areaClosureErrorSqIn>1e-6)
   throw Error('The inverse search disagrees with the independently audited 2D model.');
 }
 return {
  method:'CONTINUOUS_BIAS_PLANNER_NUMERICAL_SCENARIO_ONLY',
  verdict:'NOT_VERIFIED_FOR_PHYSICAL_YIELD_OR_PURCHASE',
  input:{...input},quiltPerimeterIn:perimeter,targetWithTailIn:targetWithTail,
  modeledTargetIn:target,areaOnlyAbsoluteFloorSqIn:target*W,
  areaOnlySquareSideFloorIn:floor,searchStepIn:.125,
  mathematicalSquareLimitIn:maxSquare,checkedCandidateCount:count,
  status:selected?'MODEL_FIT':'NO_MODEL_FIT_WITHIN_WOF',
  scenario:selected,largestEvaluatedScenario:largest,development,
  physicalSpecimenVerified:false,safeToPurchase:false
 };
}
