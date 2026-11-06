/**
 * Continuous-bias offset-TUBE topology, deliberately NOT a yield or cut model.
 *
 * Published methods: join diagonal halves into a parallelogram, mark parallel
 * lines at a RAW cut width, stitch the short edges with a ONE-LANE offset
 * aligning intersections ON THE SEAM LINE, cut one layer as a spiral.
 *
 * The graph below verifies line-to-line seam connectivity ONLY. A band is a
 * labelled *hypothetical* full-width lane after marking; its physical usable
 * length, helical tube cutting path in source coordinates, both seam take-ups
 * and offcuts are NOT derived. There is no physical or purchasing claim.
 *
 * A zero-lane offset creates N separate closed loops. Offset k>0 creates k
 * separate open chains for N marked bands (indices 1..N). Only k=1 creates
 * one connected open path crossing the seam N-1 times.
 */

export type TubeTopologyInput = {
  sourceSquareSideIn:number;
  usableWofIn:number;
  fullStripCutWidthIn:number;
  seamAllowanceIn:number;
  markedBands:number;
  offsetBands:number;
};
export type TubeSeamLink = {
  fromBand:number;
  toBand:number;
  rightMarkDistanceIn:number;
  leftMarkDistanceIn:number;
  offsetDistanceIn:number;
  /** Position of a MARKED CUT-LINE intersection on the sewing line, not a band midpoint. */
  alignment:'ON_SEAM_LINE_NOT_RAW_EDGE';
};
export type TubeChain = {
  kind:'open-path'|'closed-ring';
  bandOrder:number[];
};
export type TubeTopology = {
  method:'CONTINUOUS_BIAS_TUBE_TOPOLOGY_ONLY';
  input:TubeTopologyInput;
  /** Unsewn geometric upper limit, NOT an attainable sewn-band count. */
  theoreticalPreseamBandCapacity:number;
  preSeamAreaLengthCeilingIn:number;
  seamLineMarkDistanceFromRawEdgeIn:number;
  markedOffsetDistanceIn:number;
  seamLinks:TubeSeamLink[];
  chains:TubeChain[];
  distinctPathCount:number;
  hasSingleOpenSpiral:boolean;
  expectedCrossingCount:number;
  verifiedTubeYieldIn?:never;
  purchaseYards?:never;
  sourceCuttingPolygons?:never;
};
const valid=(n:number,label:string,min:number,max:number)=>{
 if(!Number.isFinite(n)||n<min||n>max)
  throw Error(label+' must be finite and within '+min+'–'+max+'.');
 return n;
};
const close=(a:number,b:number):boolean=>
 Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8;
export function calculateBiasTubeTopology(data:TubeTopologyInput):TubeTopology{
 const S=valid(data.sourceSquareSideIn,'Source square side',6,96);
 const F=valid(data.usableWofIn,'Post-trim usable WOF',6,120);
 const W=valid(data.fullStripCutWidthIn,'Full unfurled strip cut width',.75,6);
 const a=valid(data.seamAllowanceIn,'Tube sewing seam allowance',.125,.5);
 const N=valid(data.markedBands,'Observed number of marked lanes',2,32);
 const k=valid(data.offsetBands,'Offset in marked lanes',0,31);
 if(!Number.isInteger(N)||!Number.isInteger(k))
  throw Error('Marked bands and seam offset must be whole numbers.');
 if(k>=N)throw Error('Offset must be smaller than the observed marked lane count.');
 if(S>F+1e-9)
  throw Error('A straight-grain source square this wide cannot fit the usable fabric WOF.');
 // After ideal diagonal reassembly, long parallelogram bias edge is S*sqrt(2)
 // and its transverse height is S/sqrt(2), area S^2. Subsequent sewn seams
 // only REDUCE available material; this is a necessary upper bound only.
 const nominalCapacity=Math.floor((S/Math.SQRT2+1e-10)/W);
 if(N>nominalCapacity)
  throw Error('Reported full-width lanes exceed the PRE-SEAM geometric capacity of the source square. Recheck the source square, strip width and marks.');
 const seamLinks:TubeSeamLink[]=[];
 const chains:TubeChain[]=[];
 const seamOffsetIn=k*W;
 if(k===0){
  for(let i=1;i<=N;i++){
   seamLinks.push({
    fromBand:i,toBand:i,
    rightMarkDistanceIn:i*W,leftMarkDistanceIn:i*W,
    offsetDistanceIn:0,alignment:'ON_SEAM_LINE_NOT_RAW_EDGE'
   });
   chains.push({kind:'closed-ring',bandOrder:[i]});
  }
 }else{
  for(let i=1;i<=N-k;i++){
   seamLinks.push({
    fromBand:i,toBand:i+k,
    rightMarkDistanceIn:i*W,
    leftMarkDistanceIn:(i+k)*W,
    offsetDistanceIn:seamOffsetIn,alignment:'ON_SEAM_LINE_NOT_RAW_EDGE'
   });
  }
  for(let start=1;start<=k;start++){
   const bandOrder:number[]=[];
   for(let j=start;j<=N;j+=k)bandOrder.push(j);
   chains.push({kind:'open-path',bandOrder});
  }
 }
 const result:TubeTopology={
  method:'CONTINUOUS_BIAS_TUBE_TOPOLOGY_ONLY',
  input:{sourceSquareSideIn:S,usableWofIn:F,fullStripCutWidthIn:W,
   seamAllowanceIn:a,markedBands:N,offsetBands:k},
  theoreticalPreseamBandCapacity:nominalCapacity,
  preSeamAreaLengthCeilingIn:S*S/W,
  seamLineMarkDistanceFromRawEdgeIn:a,
  markedOffsetDistanceIn:seamOffsetIn,
  seamLinks,chains,distinctPathCount:chains.length,
  hasSingleOpenSpiral:k===1&&chains.length===1,
  expectedCrossingCount:k===0?0:N-k
 };
 if(!verifyBiasTubeTopology(result))
  throw Error('Tube seam line correspondence graph failed independent verification.');
 return result;
}
/** Independent graph audit: each marked band appears in exactly one path,
 * all links match offset and seamline-mark spacing, and no false single
 * spiral is reported when offset differs from one. This does NOT assert
 * that an actual sewn tube yields these physical dimensions.
 */
export function verifyBiasTubeTopology(result:TubeTopology):boolean{
 const {markedBands:N,offsetBands:k,fullStripCutWidthIn:W,
  sourceSquareSideIn:S,usableWofIn:F,seamAllowanceIn:a}=result.input;
 if(!Number.isInteger(N)||N<2||N>32||!Number.isInteger(k)||k<0||k>=N||
  !Number.isFinite(W)||W<=0||!Number.isFinite(a)||a<=0||
  !Number.isFinite(S)||S<=0||!Number.isFinite(F)||F<S||
  result.method!=='CONTINUOUS_BIAS_TUBE_TOPOLOGY_ONLY')return false;
 if(!close(result.markedOffsetDistanceIn,k*W)||
    !close(result.seamLineMarkDistanceFromRawEdgeIn,a)||
    result.theoreticalPreseamBandCapacity!==Math.floor((S/Math.SQRT2+1e-10)/W)||
    N>result.theoreticalPreseamBandCapacity||
    !close(result.preSeamAreaLengthCeilingIn,S*S/W))return false;
 const links=result.seamLinks;
 const seenLinks=new Set<string>();
 if(links.length!==(k===0?N:N-k))return false;
 for(const link of links){
  if(link.alignment!=='ON_SEAM_LINE_NOT_RAW_EDGE'||
     !Number.isInteger(link.fromBand)||!Number.isInteger(link.toBand)||
     link.fromBand<1||link.fromBand>N||link.toBand<1||link.toBand>N||
     link.toBand-link.fromBand!==k||
     !close(link.rightMarkDistanceIn,link.fromBand*W)||
     !close(link.leftMarkDistanceIn,link.toBand*W)||
     !close(link.offsetDistanceIn,k*W))return false;
  const key=link.fromBand+':'+link.toBand;
  if(seenLinks.has(key))return false;
  seenLinks.add(key);
 }
 const visited:number[]=[];
 if(result.chains.length!==(k===0?N:k))return false;
 for(let path=0;path<result.chains.length;path++){
  const chain=result.chains[path];
  if(chain.kind!==(k===0?'closed-ring':'open-path')||chain.bandOrder.length===0)return false;
  if(chain.bandOrder[0]!==path+1)return false;
  for(let i=0;i<chain.bandOrder.length;i++){
   const b=chain.bandOrder[i];
   if(!Number.isInteger(b)||b<1||b>N)return false;
   visited.push(b);
   if(i+1<chain.bandOrder.length){
    if(!seenLinks.has(b+':'+chain.bandOrder[i+1]))return false;
   }else if(k===0&&!seenLinks.has(b+':'+b))return false;
  }
 }
 visited.sort((a,b)=>a-b);
 if(visited.length!==N||visited.some((value,i)=>value!==i+1))return false;
 return result.distinctPathCount===result.chains.length &&
  result.hasSingleOpenSpiral===(k===1) &&
  result.expectedCrossingCount===(k===0?0:N-k);
}
