/**
 * The ONLY bias calculation allowed in the accepted straight-grain workflow:
 * an area-conservation LOWER BOUND, not a yield, cut plan or yardage quote.
 *
 * For desired usable bias length L and FULL strip cut width W, at least L*W
 * square inches of cloth is needed in the absence of any losses. Real 45°
 * bias construction loses some material in corners, joining, sewing, trimming
 * and the helical tube; an area-equivalent square is NEVER sufficient proof.
 *
 * These calculations do not modify any Project V2 source fields, shopping
 * estimates, cutting CSV or saved cross-tool state.
 */
export type BiasAreaLowerBound = {
 method:'BIAS_AREA_LOWER_BOUND_ONLY';
 requiredLengthIn:number;
 fullCutStripWidthIn:number;
 idealAreaSqIn:number;
 idealSquareSideIn:number;
 roundedAreaLowerBoundSideIn:number;
 rulerGridIn:0.125;
 usableWofIn:number;
 idealSquareFitsUsableWof:boolean;
 purchaseYards?:never;
 verifiedYieldIn?:never;
 cuttingPlan?:never;
};
const finite=(x:number,label:string,min:number,max:number)=>{
 if(!Number.isFinite(x)||x<min||x>max)throw Error(label+' must be finite and within '+min+'–'+max+' inches.');
 return x;
};
export function calculateBiasAreaLowerBound(input:{
 requiredLengthIn:number; fullCutStripWidthIn:number; usableWofIn:number;
}):BiasAreaLowerBound{
 const L=finite(input.requiredLengthIn,'Required binding length',1e-9,1e6);
 const W=finite(input.fullCutStripWidthIn,'Full strip cut width',1e-9,1e4);
 const F=finite(input.usableWofIn,'Usable fabric WOF',1e-9,1e4);
 const area=L*W;
 if(!Number.isFinite(area)||area<=0)throw Error('Bias area lower bound exceeds numerical range.');
 const idealSide=Math.sqrt(area);
 // Display-only ideal area equivalent, rounded UP to a common 1/8-in ruler
 // increment. This rounded side remains a LOWER BOUND, not cutting guidance.
 const grid=0.125 as const;
 const minSide=Math.ceil((idealSide-1e-12)/grid)*grid;
 if(minSide+1e-10<idealSide)throw Error('Ruler rounding would understate theoretical area.');
 return {
  method:'BIAS_AREA_LOWER_BOUND_ONLY',requiredLengthIn:L,fullCutStripWidthIn:W,
  idealAreaSqIn:area,idealSquareSideIn:idealSide,roundedAreaLowerBoundSideIn:minSide,
  rulerGridIn:grid,usableWofIn:F,
  idealSquareFitsUsableWof:minSide<=F+1e-10
 };
}
