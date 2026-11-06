/**
 * Individual 45° BIAS RECTANGLES cut from a single square of cloth.
 *
 * This is NOT the traditional continuous/offset bias TUBE, nor the usual
 * diagonally-seamed strip join. It is a distinct conservative construction:
 * trim square-ended bias rectangles from a source square, sew their ends
 * together CROSSWISE with the explicitly entered seam allowance.
 *
 * Source x,y follow straight grain. Bias axes:
 *   u=(x+y)/sqrt(2)   [45° strip length]
 *   v=(y-x)/sqrt(2)   [perpendicular strip width]
 * Fabric 0<=x,y<=S imposes |v|<=u<=sqrt(2)*S-|v|.
 * For every constant-width band v0..v1 of width W, the full rectangle
 *     u=[M,sqrt(2)*S-M] with M=max(|v0|,|v1|)
 * lies entirely inside the source square. Its exact full-width usable
 * cut length is sqrt(2)*S-2*M.
 *
 * The bands start with one centered on v=0, then k=±1,±2,...; no packing
 * optimality is claimed. Bands are disjoint except for shared boundaries.
 * We deliberately DISCARD triangular/tapered band ends, not pretend their
 * area creates extra full-width bias tape. Each strip is square-ended,
 * sewn end-to-end with a plain CROSSWISE join (2*seam allowance lost per
 * join). Physical sewing and shrinkage have NOT been measured. All outputs
 * are geometric/model-conditional, not certified fabric yields.
 */

export type BiasXY = {xIn:number;yIn:number};
export type BiasRectStrip = {
 index:number;
 stripWidthIn:number;
 rawLengthIn:number;
 vMinIn:number;vMaxIn:number;
 uMinIn:number;uMaxIn:number;
 /** Four actual source-square corners, arranged along increasing u then v. */
 vertices:[BiasXY,BiasXY,BiasXY,BiasXY];
};
export type IndividualBiasInput={
 squareSideIn:number;
 fullCutStripWidthIn:number;
 usableWofIn:number;
 crosswiseJoinSeamIn:number;
};
export type IndividualBiasLayout={
 method:'INDIVIDUAL_45DEG_CROSSWISE_JOIN';
 sourceSquareSideIn:number;
 usableWofIn:number;
 fullCutStripWidthIn:number;
 crosswiseJoinSeamIn:number;
 sourceRunLengthIn:number;
 strips:BiasRectStrip[];
 stripCount:number;
 geometricUnjoinedLengthIn:number;
 crosswiseJoinCount:number;
 modeledJoinedLengthIn:number;
 retainedFullWidthAreaSqIn:number;
 offcutAreaSqIn:number;
 /** A comparison bound, never a claimed continuous-bias tube yield. */
 idealAreaUpperBoundLengthIn:number;
};
export type BiasSquareSearch={
 method:'INDIVIDUAL_45DEG_CROSSWISE_JOIN';
 requiredJoinedLengthIn:number;
 idealAreaSquareLowerBoundIn:number;
 stepIn:0.125;
 matched:IndividualBiasLayout|null;
 examinedCandidateCount:number;
};
const SQRT2=Math.SQRT2;
const EPS=1e-8;
const valid=(n:number,label:string,min:number,max:number):number=>{
 if(!Number.isFinite(n)||n<min||n>max)
  throw Error(label+' must be finite and between '+min+' and '+max+' inches.');
 return n;
};
const xy=(u:number,v:number):BiasXY=>({
 xIn:(u-v)/SQRT2,yIn:(u+v)/SQRT2
});
function sourceParams(input:IndividualBiasInput):IndividualBiasInput{
 const squareSideIn=valid(input.squareSideIn,'Source square side',6,96);
 const fullCutStripWidthIn=valid(input.fullCutStripWidthIn,'Full bias strip cut width',.75,6);
 const usableWofIn=valid(input.usableWofIn,'Post-trim usable fabric WOF',6,120);
 const crosswiseJoinSeamIn=valid(input.crosswiseJoinSeamIn,'Crosswise join seam allowance',.125,.5);
 if(squareSideIn>usableWofIn+EPS)
  throw Error('The source square does not fit the post-trim usable fabric WOF.');
 return {squareSideIn,fullCutStripWidthIn,usableWofIn,crosswiseJoinSeamIn};
}
export function calculateIndividualBiasSquare(source:IndividualBiasInput):IndividualBiasLayout{
 const {squareSideIn:S,fullCutStripWidthIn:W,usableWofIn:F,crosswiseJoinSeamIn:a}=sourceParams(source);
 const diagonal=S*SQRT2,perpendicularHalf=S/SQRT2;
 const strips:BiasRectStrip[]=[];
 const maxIndex=Math.ceil(perpendicularHalf/W)+1;
 for(let k=-maxIndex;k<=maxIndex;k++){
  const vMin=(k-.5)*W,vMax=(k+.5)*W;
  const M=Math.max(Math.abs(vMin),Math.abs(vMax));
  const raw=diagonal-2*M;
  // A strip shorter than both end seam allowances is discarded: it cannot
  // contribute usefully to a multi-piece crosswise-sewn chain.
  if(M>=perpendicularHalf-EPS||raw<=2*a+EPS)continue;
  const uMin=M,uMax=diagonal-M;
  strips.push({
   index:k,stripWidthIn:W,rawLengthIn:raw,
   vMinIn:vMin,vMaxIn:vMax,uMinIn:uMin,uMaxIn:uMax,
   vertices:[xy(uMin,vMin),xy(uMax,vMin),xy(uMax,vMax),xy(uMin,vMax)]
  });
 }
 if(strips.length>200)throw Error('Too many 45-degree strips for the safe SVG/CSV preview (limit 200).');
 const unjoined=strips.reduce((sum,r)=>sum+r.rawLengthIn,0);
 const area=unjoined*W;
 const joins=Math.max(0,strips.length-1);
 const modeledJoined=Math.max(0,unjoined-joins*2*a);
 const layout:IndividualBiasLayout={
  method:'INDIVIDUAL_45DEG_CROSSWISE_JOIN',
  sourceSquareSideIn:S,usableWofIn:F,fullCutStripWidthIn:W,crosswiseJoinSeamIn:a,
  sourceRunLengthIn:S,strips,stripCount:strips.length,
  geometricUnjoinedLengthIn:unjoined,crosswiseJoinCount:joins,
  modeledJoinedLengthIn:modeledJoined,
  retainedFullWidthAreaSqIn:area,offcutAreaSqIn:S*S-area,
  idealAreaUpperBoundLengthIn:S*S/W
 };
 if(!verifyIndividualBiasLayout(layout))
  throw Error('The 45-degree source-square geometry failed its independent containment/area verification.');
 return layout;
}
/** Independent output verifier, including original square, transform, width,
 * positive length, area, and disjoint v-bands. Mutating a returned polygon
 * or length must make verification fail.
 */
export function verifyIndividualBiasLayout(layout:IndividualBiasLayout):boolean{
 const {sourceSquareSideIn:S,fullCutStripWidthIn:W,crosswiseJoinSeamIn:a,strips}=layout;
 if(!Number.isFinite(S)||S<=0||!Number.isFinite(W)||W<=0||!Number.isFinite(a)||
    strips.length!==layout.stripCount||layout.sourceRunLengthIn!==S||
    S>layout.usableWofIn+EPS)return false;
 let area=0,length=0,previousVMax=-Infinity;
 const close=(x:number,y:number)=>Number.isFinite(x)&&Math.abs(x-y)<1e-7;
 for(const item of strips){
  if(!close(item.stripWidthIn,W)||!close(item.vMaxIn-item.vMinIn,W)||
     item.vMinIn<previousVMax-EPS||item.rawLengthIn<=2*a ||
     !close(item.rawLengthIn,item.uMaxIn-item.uMinIn))return false;
  const expected=[xy(item.uMinIn,item.vMinIn),xy(item.uMaxIn,item.vMinIn),
                  xy(item.uMaxIn,item.vMaxIn),xy(item.uMinIn,item.vMaxIn)];
  if(item.vertices.length!==4)return false;
  for(let n=0;n<4;n++){
   const p=item.vertices[n],q=expected[n];
   if(!Number.isFinite(p.xIn)||!Number.isFinite(p.yIn)||
      p.xIn < -EPS||p.yIn < -EPS||p.xIn>S+EPS||p.yIn>S+EPS||
      !close(p.xIn,q.xIn)||!close(p.yIn,q.yIn))return false;
  }
  previousVMax=item.vMaxIn;
  length+=item.rawLengthIn;
  area+=item.rawLengthIn*W;
 }
 const joins=Math.max(0,strips.length-1);
 return area>=-EPS&&area<=S*S+EPS&&
  close(layout.geometricUnjoinedLengthIn,length)&&
  close(layout.retainedFullWidthAreaSqIn,area)&&
  close(layout.offcutAreaSqIn,S*S-area)&&
  close(layout.crosswiseJoinCount,joins)&&
  close(layout.modeledJoinedLengthIn,Math.max(0,length-2*a*joins))&&
  close(layout.idealAreaUpperBoundLengthIn,S*S/W);
}
/** At an exact 1/8-in ruler increment, find the FIRST square that reaches
 * target length for THIS fixed centered-band and crosswise-join method.
 * Not a global minimum across other layouts or the continuous-bias tube.
 * No result if the requested finished WOF is too narrow.
 */
export function findSmallestIndividualBiasSquare(input:{
 requiredJoinedLengthIn:number;
 fullCutStripWidthIn:number;
 usableWofIn:number;
 crosswiseJoinSeamIn:number;
}):BiasSquareSearch{
 const target=valid(input.requiredJoinedLengthIn,'Required joined length',1,10000);
 const width=valid(input.fullCutStripWidthIn,'Full bias strip cut width',.75,6);
 const wof=valid(input.usableWofIn,'Post-trim usable fabric WOF',6,120);
 const seam=valid(input.crosswiseJoinSeamIn,'Crosswise join seam allowance',.125,.5);
 const idealSquare=Math.sqrt(target*width);
 const step=.125 as const;
 const start=Math.max(6,Math.ceil((idealSquare-1e-11)/step)*step);
 const limit=Math.min(96,wof);
 let count=0;
 for(let tick=Math.round(start/step);tick<=Math.floor((limit+1e-10)/step);tick++){
  const square=tick*step;
  const layout=calculateIndividualBiasSquare({
   squareSideIn:square,fullCutStripWidthIn:width,usableWofIn:wof,crosswiseJoinSeamIn:seam
  });
  count++;
  if(layout.modeledJoinedLengthIn+EPS>=target)return {
   method:'INDIVIDUAL_45DEG_CROSSWISE_JOIN',requiredJoinedLengthIn:target,
   idealAreaSquareLowerBoundIn:idealSquare,stepIn:step,
   matched:layout,examinedCandidateCount:count
  };
 }
 return {method:'INDIVIDUAL_45DEG_CROSSWISE_JOIN',
  requiredJoinedLengthIn:target,idealAreaSquareLowerBoundIn:idealSquare,stepIn:step,
  matched:null,examinedCandidateCount:count};
}
