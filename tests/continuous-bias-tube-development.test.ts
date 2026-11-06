import {describe,it,expect} from 'vitest';
import {
 calculateBiasTube2DDevelopment,verifyBiasTube2DDevelopment
} from '../src/lib/quilt/continuous-bias-tube-development';

const sample={sourceSquareSideIn:30,usableWofIn:43,
 fullStripCutWidthIn:2.5,seamAllowanceIn:.25,markedBands:8,offsetBands:1};
const approx=(actual:number,expected:number)=>expect(actual).toBeCloseTo(expected,8);
describe('continuous bias tube: 2D mathematical development, two physical seam allowances, two square-ended trims',()=>{
 it('generates 8 true coordinate polygons, 9 stitch/cut boundaries and 7 tube crossings',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  expect(m.method).toBe('CONTINUOUS_BIAS_TUBE_2D_ENGINEERING_MODEL_ONLY');
  expect(m.verdict).toBe('NUMERICAL_GEOMETRY_ONLY_PHYSICAL_VALIDATION_REQUIRED');
  expect(m.bands).toHaveLength(8);
  expect(m.cutBoundaries).toHaveLength(9);
  expect(m.cutBoundaries.filter(x=>x.tubeCrossing)).toHaveLength(7);
  const d=.25*Math.SQRT2,L=30*Math.SQRT2,W=2.5,Q=L-2*d;
  expect(m.bands[0].sewnFacePolygon).toEqual([
   {xIn:d,yIn:0},{xIn:L-d,yIn:0},
   {xIn:L-d+W,yIn:W},{xIn:d+W,yIn:W}
  ]);
  expect(m.bands[0].unfoldedPolygon).toEqual([
   {xIn:0,yIn:0},{xIn:Q,yIn:0},
   {xIn:Q+W,yIn:W},{xIn:W,yIn:W}
  ]);
  expect(m.cutBoundaries[1].tubeCrossing?.right).toEqual({xIn:L-d+W,yIn:W});
  expect(m.cutBoundaries[1].tubeCrossing?.nextLeft).toEqual({xIn:d+2*W,yIn:2*W});
  approx(m.cutBoundaries[3].sewnFacePolyline[1].xIn, L-d-3*W);
  expect(m.bands.every(b=>b.sourceRegions.length===2)).toBe(true);
  expect(verifyBiasTube2DDevelopment(m)).toBe(true);
 });
 it('uses independent seam-1 area, seam-2 area, unused lane and two terminal dog-ear losses',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  const S=30,a=.25,W=2.5,N=8;
  const d=a*Math.SQRT2,L=S*Math.SQRT2,V=S/Math.SQRT2-d,Q=L-2*d;
  approx(m.sourceSeamOneAreaSqIn,L*d);
  approx(m.sourceSeamTwoAreaSqIn,2*d*V);
  approx(m.unusedFullBandAreaSqIn,(V-N*W)*Q);
  approx(m.squaredEndTrimAreaSqIn,W*W);
  approx(m.usableWidthFullStripAreaSqIn,W*(N*Q-W));
  approx(m.modeledSquareEndedLengthIn,N*Q-W);
  approx(m.areaClosureErrorSqIn,0);
  approx(m.sourceSeamOneAreaSqIn+m.sourceSeamTwoAreaSqIn+
   m.unusedFullBandAreaSqIn+m.squaredEndTrimAreaSqIn+
   m.usableWidthFullStripAreaSqIn,S*S);
  expect(m.sourceCuttingReady).toBe(false);
  expect(m.productionYieldVerified).toBe(false);
  expect('purchaseYards' in m).toBe(false);
 });
 it('maps every sewn band back into non-overlapping right/left raw-square triangles',()=>{
  const m=calculateBiasTube2DDevelopment(sample);
  for(const b of m.bands){
   const sum=b.sourceRegions.reduce((s,r)=>s+r.areaSqIn,0);
   approx(sum,m.stripPitchIn*m.postSecondSeamFullRunIn);
   for(const r of b.sourceRegions)for(const v of r.polygon){
    expect(v.xIn).toBeGreaterThanOrEqual(-1e-7);
    expect(v.yIn).toBeGreaterThanOrEqual(-1e-7);
    expect(v.xIn).toBeLessThanOrEqual(sample.sourceSquareSideIn+1e-7);
    expect(v.yIn).toBeLessThanOrEqual(sample.sourceSquareSideIn+1e-7);
    expect(r.triangle==='LOWER_RIGHT'?v.xIn>=v.yIn-1e-7:v.yIn>=v.xIn-1e-7).toBe(true);
   }
  }
 });
 it('does not treat PRE-seam capacity as proof that the sewn lane fits',()=>{
  const marginal={...sample,sourceSquareSideIn:8,
   usableWofIn:43,fullStripCutWidthIn:2.5,markedBands:2};
  // PRE-seam height 5.656 permits two lanes; post-seam 5.303 still permits.
  expect(calculateBiasTube2DDevelopment(marginal).actualFullBands).toBe(2);
  const noFit={...marginal,sourceSquareSideIn:7.1};
  // PRE-seam height 5.020 permits 2; post-seam height 4.667 does not.
  expect(()=>calculateBiasTube2DDevelopment(noFit)).toThrow(/NOT the post-first-seam/);
 });
 it('fails closed for zero/two-band offset; never calls disconnected ribbons a purchase-ready strip',()=>{
  for(const k of [0,2,3]){
   expect(()=>calculateBiasTube2DDevelopment({...sample,offsetBands:k}))
    .toThrow(/exactly ONE/);
  }
 });
 it('covers different viable band counts and seam allowances without losing/minting area',()=>{
  for(const S of [12,18,24,30,36,44,60]){
   for(const W of [1.25,2,2.5,3]){
    for(const a of [.125,.25,.375]){
     const fit=Math.floor((S/Math.SQRT2-a*Math.SQRT2)/W+1e-9);
     const N=Math.min(32,fit);
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
 it('rejects forged polygons, seam identities, area loss, endpoints and fake verified retail status',()=>{
  const tamper=(alter:(m:ReturnType<typeof calculateBiasTube2DDevelopment>)=>void)=>{
   const m=structuredClone(calculateBiasTube2DDevelopment(sample));
   alter(m);expect(verifyBiasTube2DDevelopment(m)).toBe(false);
  };
  tamper(m=>{m.bands[0].sewnFacePolygon[0].xIn+=.125;});
  tamper(m=>{m.bands[3].unfoldedPolygon[2].yIn+=.1;});
  tamper(m=>{m.bands[2].sourceRegions[0].polygon[0].xIn=-3;});
  tamper(m=>{m.cutBoundaries[2].tubeCrossing!.nextLeft.yIn+=.25;});
  tamper(m=>{m.sourceSeamTwoAreaSqIn-=2;});
  tamper(m=>{m.modeledSquareEndedLengthIn+=1;});
  tamper(m=>{m.productionYieldVerified=true;});
  tamper(m=>{(m as unknown as Record<string,unknown>).purchaseYards=2;});
 });
});
