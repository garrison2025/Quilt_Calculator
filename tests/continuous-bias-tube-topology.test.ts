import {describe,it,expect} from 'vitest';
import {calculateBiasTubeTopology,verifyBiasTubeTopology} from '../src/lib/quilt/continuous-bias-tube-topology';

const sample={sourceSquareSideIn:30,usableWofIn:43,fullStripCutWidthIn:2.5,
 seamAllowanceIn:.25,markedBands:8,offsetBands:1};

describe('continuous bias tube: ONLY seamline topology, never strip yield or purchasing',()=>{
 it('one-lane seam offset gives exactly one 8-band spiral graph with seven joins',()=>{
  const t=calculateBiasTubeTopology(sample);
  expect(t.method).toBe('CONTINUOUS_BIAS_TUBE_TOPOLOGY_ONLY');
  expect(t.theoreticalPreseamBandCapacity).toBe(8);
  expect(t.preSeamAreaLengthCeilingIn).toBe(360);
  expect(t.markedOffsetDistanceIn).toBe(2.5);
  expect(t.seamLineMarkDistanceFromRawEdgeIn).toBe(.25);
  expect(t.distinctPathCount).toBe(1);
  expect(t.hasSingleOpenSpiral).toBe(true);
  expect(t.expectedCrossingCount).toBe(7);
  expect(t.seamLinks).toHaveLength(7);
  expect(t.chains).toEqual([{kind:'open-path',bandOrder:[1,2,3,4,5,6,7,8]}]);
  expect(t.seamLinks[0]).toMatchObject({
   fromBand:1,toBand:2,rightMarkDistanceIn:2.5,leftMarkDistanceIn:5,
   offsetDistanceIn:2.5,alignment:'ON_SEAM_LINE_NOT_RAW_EDGE'
  });
  expect(t.seamLinks[6]).toMatchObject({fromBand:7,toBand:8});
  expect(verifyBiasTubeTopology(t)).toBe(true);
  for(const field of ['verifiedTubeYieldIn','purchaseYards','sourceCuttingPolygons'])
   expect(field in t).toBe(false);
 });
 it('zero offset forms eight DISCONNECTED rings rather than falsely claiming continuous bias',()=>{
  const t=calculateBiasTubeTopology({...sample,offsetBands:0});
  expect(t.hasSingleOpenSpiral).toBe(false);
  expect(t.distinctPathCount).toBe(8);
  expect(t.expectedCrossingCount).toBe(0);
  expect(t.chains).toEqual(Array.from({length:8},(_,i)=>({
   kind:'closed-ring',bandOrder:[i+1]
  })));
  expect(t.seamLinks.every(x=>x.toBand===x.fromBand)).toBe(true);
  expect(verifyBiasTubeTopology(t)).toBe(true);
 });
 it('offset of two creates two disconnected open chains, not a one-piece spiral',()=>{
  const t=calculateBiasTubeTopology({...sample,offsetBands:2});
  expect(t.hasSingleOpenSpiral).toBe(false);
  expect(t.distinctPathCount).toBe(2);
  expect(t.expectedCrossingCount).toBe(6);
  expect(t.chains).toEqual([
   {kind:'open-path',bandOrder:[1,3,5,7]},
   {kind:'open-path',bandOrder:[2,4,6,8]}
  ]);
  expect(verifyBiasTubeTopology(t)).toBe(true);
 });
 it('each allowed N and step has exactly the algebraic number of paths and all N bands once',()=>{
  for(let n=2;n<=20;n++){
   for(let k=0;k<n;k++){
    const sq=Math.min(96,Math.ceil((n*2.5*Math.SQRT2+1)*8)/8);
    const t=calculateBiasTubeTopology({
     ...sample,sourceSquareSideIn:sq,usableWofIn:120,
     markedBands:n,offsetBands:k
    });
    expect(t.distinctPathCount).toBe(k||n);
    expect(t.hasSingleOpenSpiral).toBe(k===1);
    expect(t.seamLinks).toHaveLength(k===0?n:n-k);
    expect(verifyBiasTubeTopology(t)).toBe(true);
    const all=t.chains.flatMap(c=>c.bandOrder).sort((a,b)=>a-b);
    expect(all).toEqual(Array.from({length:n},(_,i)=>i+1));
   }
  }
 });
 it('source WOF/ideal capacity are NECESSARY constraints, not sufficient sewn width claims',()=>{
  expect(()=>calculateBiasTubeTopology({...sample,usableWofIn:29})).toThrow(/cannot fit/);
  expect(()=>calculateBiasTubeTopology({...sample,markedBands:9})).toThrow(/PRE-SEAM/);
  expect(()=>calculateBiasTubeTopology({...sample,fullStripCutWidthIn:3,markedBands:8})).toThrow(/PRE-SEAM/);
  const smaller=calculateBiasTubeTopology({...sample,fullStripCutWidthIn:3,markedBands:7});
  expect(smaller.theoreticalPreseamBandCapacity).toBe(7);
  expect(smaller.hasSingleOpenSpiral).toBe(true);
  expect(smaller.preSeamAreaLengthCeilingIn).toBe(300);
 });
 it('rejects fractional, impossible, unrepresentable or zero band offsets',()=>{
  for(const bad of [NaN,Infinity,0,1,1.5,33]){
   expect(()=>calculateBiasTubeTopology({...sample,markedBands:bad})).toThrow();
  }
  for(const bad of [NaN,Infinity,-1,.5,8,10]){
   expect(()=>calculateBiasTubeTopology({...sample,offsetBands:bad})).toThrow();
  }
  for(const bad of [0,NaN,Infinity,-1,8]){
   expect(()=>calculateBiasTubeTopology({...sample,fullStripCutWidthIn:bad})).toThrow();
  }
  for(const bad of [-1,0,NaN,Infinity,1]){
   expect(()=>calculateBiasTubeTopology({...sample,seamAllowanceIn:bad})).toThrow();
  }
 });
 it('detects falsified seamline marks, incorrect band ordering or fake spiral certification',()=>{
  const original=calculateBiasTubeTopology(sample);
  const fakeMark=structuredClone(original);
  fakeMark.seamLinks[0].leftMarkDistanceIn+=.125;
  expect(verifyBiasTubeTopology(fakeMark)).toBe(false);
  const fakeBand=structuredClone(original);
  fakeBand.chains[0].bandOrder[2]=2;
  expect(verifyBiasTubeTopology(fakeBand)).toBe(false);
  const fakeOffset=structuredClone(original);
  fakeOffset.markedOffsetDistanceIn=0;
  expect(verifyBiasTubeTopology(fakeOffset)).toBe(false);
  const fakeYield=structuredClone(original);
  fakeYield.expectedCrossingCount=8;
  expect(verifyBiasTubeTopology(fakeYield)).toBe(false);
 });
});
