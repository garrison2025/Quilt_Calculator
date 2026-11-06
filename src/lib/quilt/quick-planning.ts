import {calculateBacking,selectBackingOption,type BackingDirectionPreference} from './math';
import {resolveQuiltDimensions} from './dimensions';
import {validateProject,type Project} from './project';

/** Illustrative FINISHED OUTSIDE quilts, not standardized mattress or quilt
 * dimensions. Local examples avoid an extra API and never change cut groups. */
export const FINISHED_SIZE_EXAMPLES=[
 {id:'baby',label:'Baby / crib',widthIn:36,heightIn:52},
 {id:'throw',label:'Throw',widthIn:60,heightIn:72},
 {id:'twin',label:'Twin',widthIn:68,heightIn:86},
 {id:'queen',label:'Queen',widthIn:90,heightIn:100},
 {id:'king',label:'King',widthIn:104,heightIn:100}
] as const;

function withDimensions(project:Project,widthIn:number,heightIn:number,
 sizeBasis:'before-borders'|'includes-borders'):Project{
 if(!Number.isFinite(widthIn)||!Number.isFinite(heightIn)||widthIn<=0||heightIn<=0)
  throw Error('Enter positive, finite quilt dimensions before applying.');
 const candidate:Project=structuredClone(project);
 candidate.quilt.finishedWidth=widthIn;
 candidate.quilt.finishedHeight=heightIn;
 candidate.quilt.sizeBasis=sizeBasis;
 // An existing quilt-top cut list was reviewed against the OLD measurements.
 candidate.quilt.topCutsReviewed=false;
 candidate.quilt.topCutsReviewFingerprint=undefined;
 validateProject(candidate);
 resolveQuiltDimensions(candidate);
 return candidate;
}
/** Apply only dimensions/size meaning; do not fabricate new quilt-top pieces. */
export function applyFinishedSizeExample(project:Project,id:string):Project{
 const example=FINISHED_SIZE_EXAMPLES.find(x=>x.id===id);
 if(!example)throw Error('Unknown finished quilt size example.');
 return withDimensions(project,example.widthIn,example.heightIn,'includes-borders');
}
/** Convert an ALREADY computed sashing grid into the quilt center. Borders
 * remain separate; no fabric SKU or sewing topology is synthesized. */
export function applyBlockGridAsCenter(project:Project,widthIn:number,heightIn:number):Project{
 return withDimensions(project,widthIn,heightIn,'before-borders');
}

/** Solve the SAME unframed, straight-set, internal-sashing grid used by
 * calculateSashing. Width/height are a quilt CENTER, never the outer quilt
 * including border layers, nor an unfinished cutting dimension. */
export function solveBlockSizeForCenter(input:{
 centerWidthIn:number;centerHeightIn:number;rows:number;columns:number;finishedSashIn:number
}):{finishedBlockWidthIn:number;finishedBlockHeightIn:number;totalBlocks:number;centerWidthIn:number;centerHeightIn:number}{
 const {centerWidthIn:W,centerHeightIn:H,rows:R,columns:C,finishedSashIn:S}=input;
 if(!Number.isFinite(W)||!Number.isFinite(H)||W<=0||H<=0||W>100000||H>100000)
  throw Error('Target quilt CENTER width and height must be finite positive inches.');
 if(!Number.isInteger(R)||!Number.isInteger(C)||R<1||C<1||R>100||C>100)
  throw Error('Sashing rows and columns must be whole numbers from 1 to 100.');
 if(!Number.isFinite(S)||S<=0||S>100000)
  throw Error('Finished internal sashing width must be positive and finite.');
 const freeW=W-(C-1)*S,freeH=H-(R-1)*S;
 if(freeW<=0||freeH<=0)
  throw Error('Target center is too small: internal sashing alone consumes the available width or height.');
 const blockW=freeW/C,blockH=freeH/R;
 if(blockW<=0||blockH<=0)
  throw Error('No positive finished block fits inside the target center.');
 return {finishedBlockWidthIn:blockW,finishedBlockHeightIn:blockH,totalBlocks:R*C,
  centerWidthIn:W,centerHeightIn:H};
}
/** Only edits the saved finished BLOCK measurements. It neither changes the
 * declared quilt center/outside, nor silently creates colored fabric cuts. */
export function applyTargetBlockSize(project:Project,targetCenterWidthIn:number,targetCenterHeightIn:number):Project{
 const s=project.sashing;
 const solved=solveBlockSizeForCenter({
  centerWidthIn:targetCenterWidthIn,centerHeightIn:targetCenterHeightIn,
  rows:s.rows,columns:s.columns,finishedSashIn:s.width
 });
 const candidate:Project=structuredClone(project);
 candidate.sashing.blockWidth=solved.finishedBlockWidthIn;
 candidate.sashing.blockHeight=solved.finishedBlockHeightIn;
 candidate.quilt.topCutsReviewed=false;
 candidate.quilt.topCutsReviewFingerprint=undefined;
 validateProject(candidate);
 return candidate;
}

export type WideBackingScenario={
 usableWofIn:number;
 selectedDirection:'vertical'|'horizontal';
 panelCount:number;
 joinedSeamCount:number;
 purchaseYards:number;
 rawYards:number;
 costUsd?:number;
};
export type WideBackingComparison={
 current:WideBackingScenario;
 alternate:WideBackingScenario;
 extraPurchaseYards:number;
 costDifferenceUsd?:number;
 /** Only a comparison; the currently selected WOF remains the real export. */
 hypotheticalOnly:true;
};
export function compareBackingPurchases(input:{
 widthIn:number;heightIn:number;overageIn:number;currentWofIn:number;alternateWofIn:number;
 joinTakeupIn:number;oneWayPrint:boolean;step:number;lengthShrinkagePct:number;
 backingDirection:BackingDirectionPreference;
 currentUnitPriceUsd?:number;alternateUnitPriceUsd?:number;
}):WideBackingComparison{
 const price=(v:number|undefined,key:string)=>{
  if(v!==undefined&&(!Number.isFinite(v)||v<0||v>100000))
   throw Error(key+' must be a nonnegative USD-per-yard price.');
 };
 price(input.currentUnitPriceUsd,'Current fabric price');
 price(input.alternateUnitPriceUsd,'Alternative fabric price');
 const base={
  widthIn:input.widthIn,heightIn:input.heightIn,overageIn:input.overageIn,
  joinTakeupIn:input.joinTakeupIn,oneWayPrint:input.oneWayPrint,
  step:input.step,shrinkageLengthPct:input.lengthShrinkagePct
 };
 const calc=(wofIn:number,unitPrice?:number):WideBackingScenario=>{
  const result=calculateBacking({...base,wofIn});
  const selected=selectBackingOption(result,input.backingDirection);
  return {usableWofIn:wofIn,selectedDirection:selected.direction,panelCount:selected.panelCount,
   joinedSeamCount:selected.panelCount-1,purchaseYards:selected.purchase.roundedPurchaseYards,
   rawYards:selected.purchase.rawPurchaseYards,
   costUsd:unitPrice===undefined?undefined:selected.purchase.roundedPurchaseYards*unitPrice};
 };
 const current=calc(input.currentWofIn,input.currentUnitPriceUsd);
 const alternate=calc(input.alternateWofIn,input.alternateUnitPriceUsd);
 return {current,alternate,extraPurchaseYards:alternate.purchaseYards-current.purchaseYards,
  costDifferenceUsd:current.costUsd!==undefined&&alternate.costUsd!==undefined
   ?alternate.costUsd-current.costUsd:undefined,hypotheticalOnly:true};
}
