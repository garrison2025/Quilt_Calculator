import {describe,it,expect} from 'vitest';
import {
 calculateBiasTube2DDevelopment,verifyBiasTube2DDevelopment
} from '../src/lib/quilt/continuous-bias-tube-development';

const sample={sourceSquareSideIn:30,usableWofIn:43,
 fullStripCutWidthIn:2.5,seamAllowanceIn:.25,markedBands:8,offsetBands:1};
const approx=(actual:number,expected:number)=>expect(actual).toBeCloseTo(expected,8);

describe('continuous bias tube: exact 2D sewn face, two seam take-ups, offset joins and squared ends',()=>{
 it('builds the correct 30in source-square parallelogram, 8 band polygons and 7 tube joins',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  const S=30,a=.25,W=2.5,d=a*Math.SQRT2,L=S*Math.SQRT2,H=S/Math.SQRT2;
  const Q=L-3*d,H1=H-d/2;
  expect(m.method).toBe('CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY');
  expect(m.verdict).toBe('NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED');
  expect(m.bands).toHaveLength(8);
  expect(m.cutBoundaries).toHaveLength(9);
  expect(m.cutBoundaries.filter(x=>x.tubeCrossing)).toHaveLength(8);
  expect(m.tubeSeamSegments).toHaveLength(7);
  approx(m.postFirstSeamLongEdgeIn,L-d);
  approx(m.postFirstSeamFullHeightIn,H1);
  approx(m.postSecondSeamFullRunIn,Q);
  expect(m.bands[0].sewnFacePolygon).toEqual([
   {xIn:d,yIn:0},{xIn:L-2*d,yIn:0},
   {xIn:L-2*d+W,yIn:W},{xIn:d+W,yIn:W}
  ]);
  expect(m.bands[0].unfoldedPolygon).toEqual([
   {xIn:0,yIn:0},{xIn:Q,yIn:0},
   {xIn:Q+W,yIn:W},{xIn:W,yIn:W}
  ]);
  expect(m.firstAssemblyStitchLineBeforeTubeSeam.start).toEqual({xIn:L-d,yIn:0});
  expect(m.firstAssemblyStitchLineBeforeTubeSeam.end).toEqual({
   xIn:H-d/2,yIn:H-d/2
  });
  expect(m.firstAssemblyStitchLine.start).toEqual({
   xIn:L-1.5*d,yIn:d/2
  });
  expect(m.firstAssemblyStitchLine.end).toEqual({xIn:H,yIn:H-d});
  expect(m.cutBoundaries[0].assemblySeamIntersection).toBeNull();
  expect(m.cutBoundaries[1].assemblySeamIntersection).toEqual({
   xIn:L-d-W,yIn:W
  });
  expect(m.cutBoundaries[0].tubeCrossing?.right).toEqual({xIn:L-2*d,yIn:0});
  expect(m.cutBoundaries[0].tubeCrossing?.nextLeft).toEqual({xIn:d+W,yIn:W});
  expect(m.tubeSeamSegments[0].unfoldedSharedEdge).toEqual([
   {xIn:Q,yIn:0},{xIn:Q+W,yIn:W}
  ]);
  expect(m.cutBoundaries[1].tubeCrossing?.right).toEqual({
   xIn:L-2*d+W,yIn:W
  });
  expect(m.cutBoundaries[1].tubeCrossing?.nextLeft).toEqual({
   xIn:d+2*W,yIn:2*W
  });
  expect(m.bands.every(b=>b.sourceRegions.length===2)).toBe(true);
  expect(verifyBiasTube2DDevelopment(m)).toBe(true);
 });
 it('accounts separately for the first triangle seam, second tube seam, remainder and both terminal wedges',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  const S=30,a=.25,W=2.5,N=8;
  const H=(S-a)/Math.SQRT2;
  const Q=Math.SQRT2*(S-3*a);
  const remainder=H-N*W;
  approx(m.firstSeamTakeupSqIn,S*S-(S-a)**2);
  approx(m.secondTubeSeamTakeupSqIn,2*a*(S-a));
  approx(m.unusedPartialBandAreaSqIn,remainder*Q);
  approx(m.terminalEndTrimAreaSqIn,W*W);
  approx(m.usableWidthFullStripAreaSqIn,W*(N*Q-W));
  approx(m.modeledSquareEndedLengthIn,N*Q-W);
  approx(m.areaClosureErrorSqIn,0);
  approx(m.firstSeamTakeupSqIn+m.secondTubeSeamTakeupSqIn+
   m.unusedPartialBandAreaSqIn+m.terminalEndTrimAreaSqIn+
   m.usableWidthFullStripAreaSqIn,S*S);
  approx(m.terminalOffcutPolygons.start.reduce((sum,p,i,a)=>{
   const n=a[(i+1)%a.length];return sum+p.xIn*n.yIn-n.xIn*p.yIn;
  },0)/2,W*W/2);
  expect(m.sourceCuttingReady).toBe(false);
  expect(m.productionYieldVerified).toBe(false);
  expect('purchaseYards' in m).toBe(false);
 });
 it('maps both clipped sides of the first assembly seam back into their correct source-square triangles',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  for(const b of m.bands){
   const sum=b.sourceRegions.reduce((s,r)=>s+r.areaSqIn,0);
   approx(sum,m.stripPitchIn*m.postSecondSeamFullRunIn);
   for(const r of b.sourceRegions)for(const v of r.polygon){
    expect(v.xIn).toBeGreaterThanOrEqual(-1e-7);
    expect(v.yIn).toBeGreaterThanOrEqual(-1e-7);
    expect(v.xIn).toBeLessThanOrEqual(sample.sourceSquareSideIn+1e-7);
    expect(v.yIn).toBeLessThanOrEqual(sample.sourceSquareSideIn+1e-7);
    expect(r.triangle==='LOWER_RIGHT'?v.yIn<=v.xIn+1e-7:v.xIn<=v.yIn+1e-7).toBe(true);
   }
  }
 });
 it('matches the published 18in-square / 2.5in-strip physical reference within 1in',()=>{
  // Geta's Quilting Studio reports measuring 120in of 2.5in bias from an
  // 18in x 18in square using the two-seam continuous-bias method.
  // This is a single external reference point, not universal fabric proof.
  const m=calculateBiasTube2DDevelopment({
   ...sample,sourceSquareSideIn:18,usableWofIn:43,
   fullStripCutWidthIn:2.5,seamAllowanceIn:.25,markedBands:5
  });
  expect(m.actualFullBands).toBe(5);
  approx(m.modeledSquareEndedLengthIn,119.47591975467945);
  expect(Math.abs(m.modeledSquareEndedLengthIn-120)).toBeLessThan(1);
  expect(verifyBiasTube2DDevelopment(m)).toBe(true);
 });
 it('rejects a band count that only fits the pre-seam sheet but not the sewn face',()=>{
  const marginal={...sample,sourceSquareSideIn:8,usableWofIn:43,
   fullStripCutWidthIn:2.5,markedBands:2};
  expect(calculateBiasTube2DDevelopment(marginal).actualFullBands).toBe(2);
  const noFit={...marginal,sourceSquareSideIn:7.1};
  expect(()=>calculateBiasTube2DDevelopment(noFit)).toThrow(/post-first-seam/);
 });
 it('fails closed for zero/two/three-band offsets',()=>{
  for(const k of [0,2,3]){
   expect(()=>calculateBiasTube2DDevelopment({...sample,offsetBands:k}))
    .toThrow(/exactly ONE/);
  }
 });
 it('conserves square area across a range of square sizes, strip widths and seam allowances',()=>{
  for(const S of [12,18,24,30,36,44,60]){
   for(const W of [1.25,2,2.5,3]){
    for(const a of [.125,.25,.375]){
     const H1=(S-a)/Math.SQRT2;
     const N=Math.min(32,Math.floor(H1/W+1e-9));
     if(N<2)continue;
     const m=calculateBiasTube2DDevelopment({
      ...sample,sourceSquareSideIn:S,usableWofIn:120,
      fullStripCutWidthIn:W,seamAllowanceIn:a,markedBands:N
     });
     expect(verifyBiasTube2DDevelopment(m)).toBe(true);
     approx(m.areaClosureErrorSqIn,0);
     expect(m.modeledSquareEndedLengthIn).toBeGreaterThan(0);
    }
   }
  }
 });
 it('rejects forged source polygons, seam joins, trim cuts, area loss and fake physical certification',()=>{
  const tamper=(alter:(m:ReturnType<typeof calculateBiasTube2DDevelopment>)=>void)=>{
   const m=structuredClone(calculateBiasTube2DDevelopment(sample));
   alter(m);expect(verifyBiasTube2DDevelopment(m)).toBe(false);
  };
  tamper(m=>{m.bands[0].sewnFacePolygon[0].xIn+=.125;});
  tamper(m=>{m.bands[3].unfoldedPolygon[2].yIn+=.1;});
  tamper(m=>{m.bands[2].sourceRegions[0].polygon[0].xIn=-3;});
  tamper(m=>{m.bands[1].sourceRegions=structuredClone(m.bands[0].sourceRegions);});
  tamper(m=>{m.cutBoundaries[2].tubeCrossing!.nextLeft.yIn+=.25;});
  tamper(m=>{m.terminalOffcutPolygons.start[0].xIn+=.5;});
  tamper(m=>{m.secondTubeSeamTakeupSqIn-=2;});
  tamper(m=>{m.modeledSquareEndedLengthIn+=1;});
  tamper(m=>{(m as unknown as {productionYieldVerified:boolean}).productionYieldVerified=true;});
  tamper(m=>{(m as unknown as Record<string,unknown>).purchaseYards=2;});
 });
});
