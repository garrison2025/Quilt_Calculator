/**
 * Continuous-bias tube: auditable 2D sewn-face / unfolded-strip model.
 *
 * This is a NUMERICAL CONSTRUCTION MODEL, not physical yield certification.
 * It explicitly models the two different sewing operations:
 *  1. Join the two diagonal-cut triangles along their short straight-grain
 *     edges. The stitch-line endpoint overhang is a on each end (the standard
 *     tutorial's equal tip overhang); after pressing open the usable face is
 *     a parallelogram with long edge sqrt(2)*(S-a), height (S-a)/sqrt(2).
 *  2. Bring the parallelogram's two short straight-grain edges together.
 *     Offset by one full marked band. A perpendicular allowance a on both
 *     raw edges moves each sewing line by d=sqrt(2)*a in the u=x-y chart.
 *
 * The chart coordinates are in inches. The first triangle-joining seam is
 * internal; its two source-triangle faces are mapped separately back to the
 * original square. The second seam identifies the right stitch-line point
 * on mark j with the left stitch-line point on mark j+1.
 *
 * The unfolded strip panels are exact parallelograms. Squaring the two
 * one-band-offset terminal ends removes two triangles of area W^2/2 each.
 * No stretch, easing, presser-foot distortion, fabric thickness, prewash
 * shrinkage, selvage or operator trimming error is included. Thus the length
 * remains a model result until sewn-sample validation.
 */
import {
 calculateBiasTubeTopology,verifyBiasTubeTopology,
 type TubeTopology,type TubeTopologyInput
} from './continuous-bias-tube-topology';

export type BiasPoint={xIn:number;yIn:number};
export type BiasPolygon=BiasPoint[];
export type BiasSourceRegion={
 triangle:'LOWER_RIGHT'|'UPPER_LEFT';
 /** Polygon mapped into the original S-by-S source square. */
 polygon:BiasPolygon;
 areaSqIn:number;
};
export type BiasDevelopedBand={
 number:number;
 /** Full band on the stitched face, split by the first assembly seam. */
 sewnFacePolygon:BiasPolygon;
 /** Band developed after the one-lane tube-seam identification. */
 unfoldedPolygon:BiasPolygon;
 sourceRegions:BiasSourceRegion[];
 firstAssemblySeamMidpoint:BiasPoint;
};
export type BiasCutBoundary={
 line:number;
 /** Left edge -> first seam if crossed -> right edge. */
 sewnFacePolyline:BiasPoint[];
 assemblySeamIntersection:BiasPoint|null;
 /** Right mark j is sewn to left mark j+1, at the stitching lines. */
 tubeCrossing:null|{right:BiasPoint;nextLeft:BiasPoint};
};
export type BiasTubeDevelopment={
 method:'CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY';
 verdict:'NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED';
 topology:TubeTopology;
 rawSquareSideIn:number;
 rawSquareAreaSqIn:number;
 rawParallelogramLongEdgeIn:number;
 rawParallelogramHeightIn:number;
 /** First seam, after its allowance and equal tip-overhang alignment. */
 firstAssemblyStitchLineBeforeTubeSeam:{start:BiasPoint;end:BiasPoint};
 /** Visible segment remaining after the two tube-edge allowances. */
 firstAssemblyStitchLine:{start:BiasPoint;end:BiasPoint};
 tubeStitchLines:{left:[BiasPoint,BiasPoint];right:[BiasPoint,BiasPoint]};
 postFirstSeamLongEdgeIn:number;
 postFirstSeamFullHeightIn:number;
 postSecondSeamFullRunIn:number;
 stripPitchIn:number;
 actualFullBands:number;
 unusedTransverseWidthIn:number;
 bands:BiasDevelopedBand[];
 cutBoundaries:BiasCutBoundary[];
 unfoldedTerminalSquares:{startCutXIn:number;endCutXIn:number};
 terminalOffcutPolygons:{start:BiasPolygon;end:BiasPolygon};
 firstSeamTakeupSqIn:number;
 secondTubeSeamTakeupSqIn:number;
 unusedPartialBandAreaSqIn:number;
 terminalEndTrimAreaSqIn:number;
 usableWidthFullStripAreaSqIn:number;
 /** Mathematical result only; not a verified fabric yield or buying quantity. */
 modeledSquareEndedLengthIn:number;
 areaClosureErrorSqIn:number;
 sourceCuttingReady:false;
 productionYieldVerified:false;
 purchaseYards?:never;
};
const EPS=1e-7;
const point=(xIn:number,yIn:number):BiasPoint=>({xIn,yIn});
const area=(p:BiasPolygon):number=>p.length<3?0:Math.abs(p.reduce((s,v,i)=>{
 const n=p[(i+1)%p.length];return s+v.xIn*n.yIn-n.xIn*v.yIn;
},0)/2);
const nearly=(a:number,b:number,tolerance=EPS)=>
 Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b));
const samePoint=(a:BiasPoint,b:BiasPoint)=>nearly(a.xIn,b.xIn)&&nearly(a.yIn,b.yIn);
function cleanPolygon(p:BiasPolygon):BiasPolygon{
 const out:BiasPolygon=[];
 for(const v of p){
  if(!out.length||!samePoint(out[out.length-1],v))out.push(v);
 }
 if(out.length>1&&samePoint(out[0],out[out.length-1]))out.pop();
 return out;
}
function clipAtFirstSeam(polygon:BiasPolygon,lineSum:number,lower:boolean):BiasPolygon{
 const result:BiasPolygon=[];
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];
  const da=(a.xIn+a.yIn-lineSum)*(lower?1:-1);
  const db=(b.xIn+b.yIn-lineSum)*(lower?1:-1);
  const insideA=da<=EPS,insideB=db<=EPS;
  if(insideA)result.push(a);
  if(insideA!==insideB){
   const t=da/(da-db);
   result.push(point(a.xIn+(b.xIn-a.xIn)*t,a.yIn+(b.yIn-a.yIn)*t));
  }
 }
 return cleanPolygon(result);
}
function toSourceSquare(
 p:BiasPoint,triangle:BiasSourceRegion['triangle'],L:number,d:number
):BiasPoint{
 if(triangle==='LOWER_RIGHT'){
  return point((p.xIn+p.yIn)/Math.SQRT2,(p.xIn-p.yIn)/Math.SQRT2);
 }
 // The upper triangle is shifted by the first seam's equal tip-overhang
 // alignment before sewing; this is the exact inverse placement.
 return point(
  (p.xIn+p.yIn+2*d-L)/Math.SQRT2,
  (p.xIn-p.yIn+d)/Math.SQRT2
 );
}
function expectedSourceRegions(
 polygon:BiasPolygon,L:number,d:number
):BiasSourceRegion[]{
 const lineSum=L-d;
 const lower=clipAtFirstSeam(polygon,lineSum,true);
 const upper=clipAtFirstSeam(polygon,lineSum,false);
 const regions:BiasSourceRegion[]=[];
 for(const [triangle,vertices] of [
  ['LOWER_RIGHT',lower],['UPPER_LEFT',upper]
 ] as const){
  if(vertices.length>=3&&area(vertices)>EPS){
   const mapped=vertices.map(v=>toSourceSquare(v,triangle,L,d));
   regions.push({triangle,polygon:mapped,areaSqIn:area(mapped)});
  }
 }
 return regions;
}
const expectedBandPolygon=(low:number,high:number,d:number,L:number):BiasPolygon=>[
 point(d+low,low),point(L-2*d+low,low),
 point(L-2*d+high,high),point(d+high,high)
];
const expectedUnfoldedPolygon=(i:number,Q:number,W:number):BiasPolygon=>{
 const base=i*Q;
 return [
  point(base,0),point(base+Q,0),
  point(base+Q+W,W),point(base+W,W)
 ];
};
const seamPoint=(v:number,L:number,d:number)=>point(L-d-v,v);
const leftPoint=(v:number,d:number)=>point(d+v,v);
const rightPoint=(v:number,L:number,d:number)=>point(L-2*d+v,v);
function samePolygon(a:BiasPolygon,b:BiasPolygon):boolean{
 return a.length===b.length&&a.every((v,i)=>samePoint(v,b[i]));
}
export function calculateBiasTube2DDevelopment(input:TubeTopologyInput):BiasTubeDevelopment{
 const topology=calculateBiasTubeTopology(input);
 if(!topology.hasSingleOpenSpiral||input.offsetBands!==1)
  throw Error('2D continuous ribbon requires exactly ONE marked-lane offset; other offsets remain topology diagnostics only.');
 const {sourceSquareSideIn:S,fullStripCutWidthIn:W,seamAllowanceIn:a,markedBands:N}=topology.input;
 const d=a*Math.SQRT2,L=S*Math.SQRT2,H=S/Math.SQRT2;
 // First diagonal-triangle assembly seam. Equal a tip overhang at both ends
 // aligns the two sewing lines; the face parallelogram scales to side S-a.
 const L1=L-d,H1=H-d/2;
 // Second seam joins the two short edges. Each edge loses perpendicular a.
 const Q=L1-2*d;
 if(Q<=EPS||H1<=EPS)throw Error('The two seam allowances leave no positive stitched-face dimensions.');
 const unused=H1-N*W;
 if(unused< -EPS)throw Error(
  'The marked lanes fit the PRE-SEAM sheet but NOT the post-first-seam full-width face. Reduce the observed full-lane count or strip width; partial bands are not promoted to full-width binding.'
 );
 const lineSum=L-d;
 const firstFull={start:point(L-d,0),end:point(H-d/2,H-d/2)};
 // Clip the first seam where it meets the two tube stitch lines.
 const firstVisible={
  start:point(L-1.5*d,d/2),
  end:point(H,H-d)
 };
 const left:[BiasPoint,BiasPoint]=[leftPoint(0,d),leftPoint(H1,d)];
 const right:[BiasPoint,BiasPoint]=[rightPoint(0,L,d),rightPoint(H1,L,d)];
 const bands:BiasDevelopedBand[]=[];
 for(let i=0;i<N;i++){
  const low=i*W,high=(i+1)*W;
  const sewnFacePolygon=expectedBandPolygon(low,high,d,L);
  const sourceRegions=expectedSourceRegions(sewnFacePolygon,L,d);
  const mid=(low+high)/2;
  bands.push({
   number:i+1,sewnFacePolygon,
   unfoldedPolygon:expectedUnfoldedPolygon(i,Q,W),
   sourceRegions,firstAssemblySeamMidpoint:seamPoint(mid,L,d)
  });
 }
 const cutBoundaries:BiasCutBoundary[]=[];
 for(let j=0;j<=N;j++){
  const v=j*W,leftEdge=leftPoint(v,d),rightEdge=rightPoint(v,L,d);
  const uAtSeam=L-d-2*v;
  const intersection=uAtSeam>=d-EPS&&uAtSeam<=L-2*d+EPS
   ?seamPoint(v,L,d):null;
  const sewnFacePolyline=intersection
   ?[leftEdge,intersection,rightEdge]:[leftEdge,rightEdge];
  cutBoundaries.push({
   line:j,sewnFacePolyline,assemblySeamIntersection:intersection,
   tubeCrossing:j>=1&&j<N?{
    right:rightEdge,nextLeft:leftPoint(v+W,d)
   }:null
  });
 }
 const firstSeamTakeupSqIn=S*S-(S-a)*(S-a);
 const secondTubeSeamTakeupSqIn=2*a*(S-a);
 const unusedPartialBandAreaSqIn=Math.max(0,unused)*Q;
 const terminalEndTrimAreaSqIn=W*W;
 const usableWidthFullStripAreaSqIn=W*(N*Q-W);
 const rawSquareAreaSqIn=S*S;
 const areaClosureErrorSqIn=rawSquareAreaSqIn-(
  firstSeamTakeupSqIn+secondTubeSeamTakeupSqIn+
  unusedPartialBandAreaSqIn+terminalEndTrimAreaSqIn+
  usableWidthFullStripAreaSqIn
 );
 const result:BiasTubeDevelopment={
  method:'CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY',
  verdict:'NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED',
  topology,rawSquareSideIn:S,rawSquareAreaSqIn,
  rawParallelogramLongEdgeIn:L,rawParallelogramHeightIn:H,
  firstAssemblyStitchLineBeforeTubeSeam:firstFull,
  firstAssemblyStitchLine:firstVisible,
  tubeStitchLines:{left,right},
  postFirstSeamLongEdgeIn:L1,
  postFirstSeamFullHeightIn:H1,
  postSecondSeamFullRunIn:Q,
  stripPitchIn:W,actualFullBands:N,
  unusedTransverseWidthIn:Math.max(0,unused),
  bands,cutBoundaries,
  unfoldedTerminalSquares:{startCutXIn:W,endCutXIn:N*Q},
  terminalOffcutPolygons:{
   start:[point(0,0),point(W,0),point(W,W)],
   end:[point(N*Q,0),point(N*Q,W),point(N*Q+W,W)]
  },
  firstSeamTakeupSqIn,secondTubeSeamTakeupSqIn,
  unusedPartialBandAreaSqIn,terminalEndTrimAreaSqIn,
  usableWidthFullStripAreaSqIn,
  modeledSquareEndedLengthIn:N*Q-W,
  areaClosureErrorSqIn,
  sourceCuttingReady:false,productionYieldVerified:false
 };
 if(!verifyBiasTube2DDevelopment(result))
  throw Error('2D source-triangle coordinates, two-seam geometry, one-lane path or area ledger failed independent verification.');
 return result;
}
/** Independent coordinate, source-square, seam-join, offcut and area audit.
 * Passing validates the declared mathematical convention only. */
export function verifyBiasTube2DDevelopment(m:BiasTubeDevelopment):boolean{
 const t=m.topology;
 if(!verifyBiasTubeTopology(t)||!t.hasSingleOpenSpiral||
  m.method!=='CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY'||
  m.verdict!=='NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED'||
  m.sourceCuttingReady!==false||m.productionYieldVerified!==false||
  'purchaseYards' in m)return false;
 const {sourceSquareSideIn:S,fullStripCutWidthIn:W,seamAllowanceIn:a,markedBands:N}=t.input;
 const d=a*Math.SQRT2,L=S*Math.SQRT2,H=S/Math.SQRT2,L1=L-d,H1=H-d/2,Q=L-3*d;
 if(Q<=EPS||H1+EPS<N*W||N<2)return false;
 const expected=[
  [m.rawSquareSideIn,S],[m.rawSquareAreaSqIn,S*S],
  [m.rawParallelogramLongEdgeIn,L],[m.rawParallelogramHeightIn,H],
  [m.postFirstSeamLongEdgeIn,L1],[m.postFirstSeamFullHeightIn,H1],
  [m.postSecondSeamFullRunIn,Q],[m.unusedTransverseWidthIn,H1-N*W],
  [m.firstSeamTakeupSqIn,S*S-(S-a)*(S-a)],
  [m.secondTubeSeamTakeupSqIn,2*a*(S-a)],
  [m.unusedPartialBandAreaSqIn,(H1-N*W)*Q],
  [m.terminalEndTrimAreaSqIn,W*W],
  [m.usableWidthFullStripAreaSqIn,W*(N*Q-W)],
  [m.modeledSquareEndedLengthIn,N*Q-W],
  [m.unfoldedTerminalSquares.startCutXIn,W],
  [m.unfoldedTerminalSquares.endCutXIn,N*Q]
 ];
 if(expected.some(([got,want])=>!nearly(got,want)))return false;
 const P=(got:BiasPoint,want:BiasPoint)=>got&&samePoint(got,want);
 const fullStart=point(L-d,0),fullEnd=point(H-d/2,H-d/2);
 const visibleStart=point(L-1.5*d,d/2),visibleEnd=point(H,H-d);
 if(!P(m.firstAssemblyStitchLineBeforeTubeSeam.start,fullStart)||
  !P(m.firstAssemblyStitchLineBeforeTubeSeam.end,fullEnd)||
  !P(m.firstAssemblyStitchLine.start,visibleStart)||
  !P(m.firstAssemblyStitchLine.end,visibleEnd))return false;
 const leftExpected:[BiasPoint,BiasPoint]=[leftPoint(0,d),leftPoint(H1,d)];
 const rightExpected:[BiasPoint,BiasPoint]=[rightPoint(0,L,d),rightPoint(H1,L,d)];
 if(!P(m.tubeStitchLines.left[0],leftExpected[0])||
  !P(m.tubeStitchLines.left[1],leftExpected[1])||
  !P(m.tubeStitchLines.right[0],rightExpected[0])||
  !P(m.tubeStitchLines.right[1],rightExpected[1]))return false;
 const expectedStart=[point(0,0),point(W,0),point(W,W)];
 const expectedEnd=[point(N*Q,0),point(N*Q,W),point(N*Q+W,W)];
 if(!samePolygon(m.terminalOffcutPolygons.start,expectedStart)||
  !samePolygon(m.terminalOffcutPolygons.end,expectedEnd)||
  !nearly(area(m.terminalOffcutPolygons.start),W*W/2)||
  !nearly(area(m.terminalOffcutPolygons.end),W*W/2))return false;
 if(m.bands.length!==N||m.cutBoundaries.length!==N+1)return false;
 for(let i=0;i<N;i++){
  const b=m.bands[i],low=i*W,high=(i+1)*W,mid=(low+high)/2;
  const face=expectedBandPolygon(low,high,d,L);
  const unfolded=expectedUnfoldedPolygon(i,Q,W);
  if(b.number!==i+1||!samePolygon(b.sewnFacePolygon,face)||
   !samePolygon(b.unfoldedPolygon,unfolded)||
   !P(b.firstAssemblySeamMidpoint,seamPoint(mid,L,d)))return false;
  if(!nearly(area(face),Q*W)||!nearly(area(unfolded),Q*W))return false;
  const source=expectedSourceRegions(face,L,d);
  if(source.length!==2||b.sourceRegions.length!==2)return false;
  for(let r=0;r<2;r++){
   const actual=b.sourceRegions[r],want=source[r];
   if(actual.triangle!==want.triangle||
    !samePolygon(actual.polygon,want.polygon)||
    !nearly(actual.areaSqIn,want.areaSqIn)||
    !nearly(area(actual.polygon),actual.areaSqIn))return false;
   for(const v of actual.polygon){
    if(!Number.isFinite(v.xIn)||!Number.isFinite(v.yIn)||
     v.xIn< -EPS||v.xIn>S+EPS||v.yIn< -EPS||v.yIn>S+EPS||
     (actual.triangle==='LOWER_RIGHT'&&v.yIn>v.xIn+EPS)||
     (actual.triangle==='UPPER_LEFT'&&v.xIn>v.yIn+EPS))return false;
   }
  }
  if(!nearly(source.reduce((sum,r)=>sum+r.areaSqIn,0),Q*W))return false;
 }
 for(let j=0;j<=N;j++){
  const c=m.cutBoundaries[j],v=j*W;
  const left=leftPoint(v,d),right=rightPoint(v,L,d);
  const u=L-d-2*v;
  const crossing=u>=d-EPS&&u<=L-2*d+EPS?seamPoint(v,L,d):null;
  const line=crossing?[left,crossing,right]:[left,right];
  if(c.line!==j||!samePolygon(c.sewnFacePolyline,line)||
   (crossing===null?c.assemblySeamIntersection!==null:
    !P(c.assemblySeamIntersection,crossing)))return false;
  if(j>=1&&j<N){
   if(!c.tubeCrossing||!P(c.tubeCrossing.right,right)||
    !P(c.tubeCrossing.nextLeft,leftPoint(v+W,d)))return false;
  }else if(c.tubeCrossing!==null)return false;
 }
 const accounted=m.firstSeamTakeupSqIn+m.secondTubeSeamTakeupSqIn+
  m.unusedPartialBandAreaSqIn+m.terminalEndTrimAreaSqIn+
  m.usableWidthFullStripAreaSqIn;
 return nearly(m.areaClosureErrorSqIn,0)&&nearly(accounted,m.rawSquareAreaSqIn);
}
