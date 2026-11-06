/**
 * Two-dimensional ideal-fabric development of the continuous-bias offset tube.
 *
 * ENGINEERING GEOMETRY, NOT PHYSICAL YIELD / RETAIL PURCHASE VALIDATION.
 *
 * Coordinate convention (all in inches):
 * - Raw square [0,S]^2, split on y=x into two equal right triangles.
 * - Rotate each triangle 45 degrees; join their short sides at seam allowance a.
 * - After seam 1, identify the two stitch-line faces (not the folded seam
 *   allowances). Use chart x=u+v, y=v. Before seam 2, 0<=u<=S*sqrt(2).
 * - Reserve a measured perpendicular allowance a at BOTH tube edges:
 *   d=a*sqrt(2), d<=u<=S*sqrt(2)-d.
 * - Trim the misaligned assembly ends: 0<=v<=S/sqrt(2)-d.
 * - A ONE-band offset glues (u=right,v=jW) to (u=left,v=(j+1)W).
 *   These are distinct chart points representing the same sewn point, NOT
 *   a literal drawn diagonal across the unsewn parallelogram.
 * - The fully squared-up width-W ribbon uses N complete bands. Its terminal
 *   bias triangles are removed, costing W^2/2 at EACH end. No fractional band
 *   or stretch/squaring salvage is assumed.
 *
 * Seam-1 and seam-2 are consumed as distinct disjoint accounting regions.
 * They may not be replaced by a blanket flat 10% or a 3-inch square increment.
 *
 * This mathematical convention must be checked against real sewn measurements
 * (including bias stretching, seam offset, dog ears and actual fabric) before
 * exposing yield or buying yardage in the public Binding calculator.
 */
import {
 calculateBiasTubeTopology,verifyBiasTubeTopology,
 type TubeTopology,type TubeTopologyInput
} from './continuous-bias-tube-topology';

export type BiasPoint={xIn:number;yIn:number};
export type BiasPolygon=BiasPoint[];
export type BiasSourceRegion={
 triangle:'LOWER_RIGHT'|'UPPER_LEFT';
 /** Coordinates on the original straight-grain S-by-S source square. */
 polygon:BiasPolygon;
 areaSqIn:number;
};
export type BiasDevelopedBand={
 number:number;
 /** Physical sewn-face chart, NOT raw pre-seam fabric. */
 sewnFacePolygon:BiasPolygon;
 /** 2D long strip after ONE-band seam identification, before end squaring. */
 unfoldedPolygon:BiasPolygon;
 sourceRegions:BiasSourceRegion[];
 firstAssemblySeamMidpoint:BiasPoint;
};
export type BiasCutBoundary={
 line:number;
 /** Each cut-line is divided at the FIRST (triangle-joining) stitch line. */
 sewnFacePolyline:[BiasPoint,BiasPoint,BiasPoint];
 /** One-lane sewing identification, when the destination line exists. */
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
 firstAssemblyStitchLine:{start:BiasPoint;end:BiasPoint};
 tubeStitchLines:{left:[BiasPoint,BiasPoint];right:[BiasPoint,BiasPoint]};
 postFirstSeamFullHeightIn:number;
 postSecondSeamFullRunIn:number;
 stripPitchIn:number;
 actualFullBands:number;
 unusedTransverseWidthIn:number;
 bands:BiasDevelopedBand[];
 cutBoundaries:BiasCutBoundary[];
 unfoldedTerminalSquares:{startCutXIn:number;endCutXIn:number};
 sourceSeamOneAreaSqIn:number;
 sourceSeamTwoAreaSqIn:number;
 unusedFullBandAreaSqIn:number;
 squaredEndTrimAreaSqIn:number;
 usableWidthFullStripAreaSqIn:number;
 /** Model estimate only, not measured usable production length. */
 modeledSquareEndedLengthIn:number;
 areaClosureErrorSqIn:number;
 sourceCuttingReady:false;
 productionYieldVerified:false;
 purchaseYards?:never;
};
const EPS=1e-7;
const point=(xIn:number,yIn:number):BiasPoint=>({xIn,yIn});
const area=(p:BiasPolygon):number=>Math.abs(p.reduce((s,v,i)=>{
 const n=p[(i+1)%p.length];return s+v.xIn*n.yIn-n.xIn*v.yIn;
},0)/2);
const nearly=(a:number,b:number,tolerance=EPS)=>Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b));
const segment=(a:BiasPoint,b:BiasPoint,t:number)=>point(
 a.xIn+(b.xIn-a.xIn)*t,a.yIn+(b.yIn-a.yIn)*t
);
function clipAtFirstSeam(polygon:BiasPolygon,c:number,lower:boolean):BiasPolygon{
 const result:BiasPolygon=[];
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length];
  const da=(a.xIn+a.yIn-c)*(lower?1:-1);
  const db=(b.xIn+b.yIn-c)*(lower?1:-1);
  const insideA=da<=EPS,insideB=db<=EPS;
  if(insideA)result.push(a);
  if(insideA!==insideB){
   const t=da/(da-db);
   result.push(segment(a,b,Math.max(0,Math.min(1,t))));
  }
 }
 // Consecutive duplicate vertices are not real material.
 return result.filter((v,i)=>i===0||!nearly(v.xIn,result[i-1].xIn)||!nearly(v.yIn,result[i-1].yIn));
}
function toSourceSquare(p:BiasPoint,triangle:BiasSourceRegion['triangle'],shift:number):BiasPoint{
 const x=p.xIn-(triangle==='UPPER_LEFT'?shift:0);
 const y=p.yIn-(triangle==='UPPER_LEFT'?shift:0);
 return point((x+y)/Math.SQRT2,(x-y)/Math.SQRT2);
}
export function calculateBiasTube2DDevelopment(input:TubeTopologyInput):BiasTubeDevelopment{
 const topology=calculateBiasTubeTopology(input);
 if(!topology.hasSingleOpenSpiral||input.offsetBands!==1)
  throw Error('2D continuous ribbon requires exactly ONE marked-lane offset; other offsets are topology diagnostics only.');
 const {sourceSquareSideIn:S,fullStripCutWidthIn:W,seamAllowanceIn:a,markedBands:N}=topology.input;
 const d=a*Math.SQRT2,H=S/Math.SQRT2,L=S*Math.SQRT2;
 const V=H-d,Q=L-2*d;
 const slack=V-N*W;
 if(slack< -EPS)throw Error(
  'The marked lanes fit the IDEAL pre-seam sheet but NOT the post-first-seam full-width sewn face. Reduce the physically observed full-lane count or change square/width; no partial bands are counted.'
 );
 if(Q<=W+EPS)throw Error('No full-width strip remains after tube seam and end squaring.');
 const lineC=L-d;
 const left=(v:number)=>point(v+d,v);
 const right=(v:number)=>point(v+L-d,v);
 const seamCross=(v:number)=>point(lineC-v,v);
 const bands:BiasDevelopedBand[]=[];
 const cutBoundaries:BiasCutBoundary[]=[];
 const shiftedUpper=H-d;
 for(let i=0;i<N;i++){
  const low=i*W,top=(i+1)*W;
  const sewnFacePolygon=[left(low),right(low),right(top),left(top)];
  const base=i*Q;
  // Identifying the tube seam on its stitch lines develops the ribbon into
  // adjacent non-overlapping diagonal-ended parallelogram panels.
  const unfoldedPolygon=[
   point(base,0),point(base+Q,0),point(base+Q+W,W),point(base+W,W)
  ];
  const sourceRegions:BiasSourceRegion[]=[];
  for(const [triangle,lower] of [
   ['LOWER_RIGHT',true],['UPPER_LEFT',false]
  ] as const){
   const section=clipAtFirstSeam(sewnFacePolygon,lineC,lower);
   if(section.length>=3&&area(section)>EPS){
    const polygon=section.map(p=>toSourceSquare(p,triangle,shiftedUpper));
    sourceRegions.push({triangle,polygon,areaSqIn:area(polygon)});
   }
  }
  bands.push({
   number:i+1,sewnFacePolygon,unfoldedPolygon,sourceRegions,
   firstAssemblySeamMidpoint:seamCross((low+top)/2)
  });
 }
 for(let j=0;j<=N;j++){
  const v=j*W;
  cutBoundaries.push({
   line:j,
   sewnFacePolyline:[left(v),seamCross(v),right(v)],
   tubeCrossing:j>=1&&j<N?{
    right:right(v),nextLeft:left(v+W)
   }:null
  });
 }
 const sourceSeamOneAreaSqIn=L*d;
 const sourceSeamTwoAreaSqIn=2*d*V;
 const unusedFullBandAreaSqIn=Math.max(0,slack)*Q;
 const squaredEndTrimAreaSqIn=W*W;
 const usableWidthFullStripAreaSqIn=N*Q*W-W*W;
 const rawSquareAreaSqIn=S*S;
 const areaClosureErrorSqIn=rawSquareAreaSqIn-(
  sourceSeamOneAreaSqIn+sourceSeamTwoAreaSqIn+
  unusedFullBandAreaSqIn+squaredEndTrimAreaSqIn+
  usableWidthFullStripAreaSqIn
 );
 const result:BiasTubeDevelopment={
  method:'CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY',
  verdict:'NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED',
  topology,rawSquareSideIn:S,rawSquareAreaSqIn,
  rawParallelogramLongEdgeIn:L,rawParallelogramHeightIn:H,
  firstAssemblyStitchLine:{start:seamCross(0),end:seamCross(V)},
  tubeStitchLines:{left:[left(0),left(V)],right:[right(0),right(V)]},
  postFirstSeamFullHeightIn:V,
  postSecondSeamFullRunIn:Q,
  stripPitchIn:W,actualFullBands:N,
  unusedTransverseWidthIn:Math.max(0,slack),
  bands,cutBoundaries,
  unfoldedTerminalSquares:{startCutXIn:W,endCutXIn:N*Q},
  sourceSeamOneAreaSqIn,sourceSeamTwoAreaSqIn,
  unusedFullBandAreaSqIn,squaredEndTrimAreaSqIn,
  usableWidthFullStripAreaSqIn,
  modeledSquareEndedLengthIn:N*Q-W,
  areaClosureErrorSqIn,
  sourceCuttingReady:false,productionYieldVerified:false
 };
 if(!verifyBiasTube2DDevelopment(result))
  throw Error('2D band coordinates, original-triangle provenance or two-seam material area accounting failed validation.');
 return result;
}
/** Rechecks exact coordinates, square provenance, seam crossings and area
 * identities. Passing proves THIS 2D convention, not equivalence to a sewn
 * sample; physical cutting remains gated separately.
 */
export function verifyBiasTube2DDevelopment(m:BiasTubeDevelopment):boolean{
 const t=m.topology;
 if(!verifyBiasTubeTopology(t)||!t.hasSingleOpenSpiral||
  m.method!=='CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY'||
  m.verdict!=='NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED'||
  m.sourceCuttingReady!==false||m.productionYieldVerified!==false||
  'purchaseYards' in m)return false;
 const {sourceSquareSideIn:S,fullStripCutWidthIn:W,seamAllowanceIn:a,markedBands:N}=t.input;
 const L=S*Math.SQRT2,H=S/Math.SQRT2,d=a*Math.SQRT2,V=H-d,Q=L-2*d;
 if(V+EPS<N*W||N<2||Q<=W)return false;
 for(const [got,want] of [
  [m.rawSquareSideIn,S],[m.rawSquareAreaSqIn,S*S],
  [m.rawParallelogramLongEdgeIn,L],[m.rawParallelogramHeightIn,H],
  [m.postFirstSeamFullHeightIn,V],[m.postSecondSeamFullRunIn,Q],
  [m.unusedTransverseWidthIn,V-N*W],
  [m.sourceSeamOneAreaSqIn,L*d],
  [m.sourceSeamTwoAreaSqIn,2*d*V],
  [m.unusedFullBandAreaSqIn,(V-N*W)*Q],
  [m.squaredEndTrimAreaSqIn,W*W],
  [m.usableWidthFullStripAreaSqIn,(N*Q-W)*W],
  [m.modeledSquareEndedLengthIn,N*Q-W],
  [m.unfoldedTerminalSquares.startCutXIn,W],
  [m.unfoldedTerminalSquares.endCutXIn,N*Q]
 ] as [number,number][])if(!nearly(got,want))return false;
 const P=(got:BiasPoint,want:BiasPoint)=>nearly(got?.xIn,want.xIn)&&nearly(got?.yIn,want.yIn);
 const lineC=L-d,from=(v:number,leftSide:boolean)=>point(v+(leftSide?d:L-d),v);
 const crossing=(v:number)=>point(lineC-v,v);
 if(!P(m.firstAssemblyStitchLine.start,crossing(0))||
   !P(m.firstAssemblyStitchLine.end,crossing(V))||
   !P(m.tubeStitchLines.left[0],from(0,true))||
   !P(m.tubeStitchLines.left[1],from(V,true))||
   !P(m.tubeStitchLines.right[0],from(0,false))||
   !P(m.tubeStitchLines.right[1],from(V,false)))return false;
 if(m.bands.length!==N||m.cutBoundaries.length!==N+1)return false;
 let summedArea=0;
 for(let i=0;i<N;i++){
  const b=m.bands[i],low=i*W,top=(i+1)*W;
  if(b.number!==i+1||b.sewnFacePolygon.length!==4||b.unfoldedPolygon.length!==4||
   !P(b.firstAssemblySeamMidpoint,crossing((low+top)/2)))return false;
  const expectedFace=[from(low,true),from(low,false),from(top,false),from(top,true)];
  const expectedUnfold=[
   point(i*Q,0),point((i+1)*Q,0),
   point((i+1)*Q+W,W),point(i*Q+W,W)
  ];
  for(let j=0;j<4;j++){
   if(!P(b.sewnFacePolygon[j],expectedFace[j])||!P(b.unfoldedPolygon[j],expectedUnfold[j]))
    return false;
  }
  if(!nearly(area(b.sewnFacePolygon),Q*W)||!nearly(area(b.unfoldedPolygon),Q*W)||
    b.sourceRegions.length!==2)return false;
  let sourceArea=0;
  for(const source of b.sourceRegions){
   if(source.polygon.length<3||
     !nearly(area(source.polygon),source.areaSqIn))return false;
   for(const v of source.polygon){
    if(!Number.isFinite(v.xIn)||!Number.isFinite(v.yIn)||
     v.xIn< -EPS||v.xIn>S+EPS||v.yIn< -EPS||v.yIn>S+EPS||
     (source.triangle==='LOWER_RIGHT'&&v.yIn>v.xIn+EPS)||
     (source.triangle==='UPPER_LEFT'&&v.xIn>v.yIn+EPS))return false;
   }
   sourceArea+=source.areaSqIn;
  }
  if(!nearly(sourceArea,Q*W))return false;
  summedArea+=area(b.sewnFacePolygon);
 }
 for(let j=0;j<=N;j++){
  const c=m.cutBoundaries[j],v=j*W;
  if(c.line!==j||c.sewnFacePolyline.length!==3||
   !P(c.sewnFacePolyline[0],from(v,true))||
   !P(c.sewnFacePolyline[1],crossing(v))||
   !P(c.sewnFacePolyline[2],from(v,false)))return false;
  if(j>=1&&j<N){
   if(!c.tubeCrossing||!P(c.tubeCrossing.right,from(v,false))||
      !P(c.tubeCrossing.nextLeft,from(v+W,true)))return false;
  }else if(c.tubeCrossing!==null)return false;
 }
 const accounted=m.sourceSeamOneAreaSqIn+m.sourceSeamTwoAreaSqIn+
  m.unusedFullBandAreaSqIn+m.squaredEndTrimAreaSqIn+
  m.usableWidthFullStripAreaSqIn;
 return nearly(summedArea,N*W*Q)&&
  nearly(accounted,m.rawSquareAreaSqIn)&&
  nearly(m.areaClosureErrorSqIn,0);
}
