import {describe,it,expect} from 'vitest';
import {
 SPECIMEN_CONFIGS,emptyBiasSpecimenObservation,auditBiasSpecimenObservation,
 type BiasSpecimenConfig,type BiasSpecimenObservation
} from '../src/lib/quilt/continuous-bias-specimen-audit';

function mockComplete(cfg:BiasSpecimenConfig):BiasSpecimenObservation{
 // SYNTHETIC UNIT TEST DATA. NEVER a physically observed specimen.
 const prediction=auditBiasSpecimenObservation(cfg,emptyBiasSpecimenObservation(cfg.id)).predicted;
 const o=emptyBiasSpecimenObservation(cfg.id);
 o.operatorCode='UNIT-TEST-NOT-A-REAL-OPERATOR';
 o.fabricDescription='SYNTHETIC TEST ONLY — no fabric was sewn';
 o.prewashStatus='prewashed';
 o.evidenceReferences='synthetic: NOT A REAL PHOTO; independent verification absent';
 o.tolerances={
  squareSideToleranceIn:.0625,
  seamAllowanceToleranceIn:.02,tipOverhangToleranceIn:.03,
  faceDimensionToleranceIn:.125,markMismatchToleranceIn:.0625,
  stripWidthToleranceIn:.0625,lengthClosureToleranceIn:.125,
  declaredBeforeCutting:true
 };
 o.measuredSquareWidthIn=cfg.sourceSquareSideIn;
 o.measuredSquareHeightIn=cfg.sourceSquareSideIn;
 o.measuredUsableWofIn=cfg.usableWofIn;
 o.firstSeamSamplesIn=Array(5).fill(cfg.seamAllowanceIn);
 o.secondSeamSamplesIn=Array(5).fill(cfg.seamAllowanceIn);
 o.tipOverhangStartIn=cfg.seamAllowanceIn;
 o.tipOverhangEndIn=cfg.seamAllowanceIn;
 o.firstFaceLongEdgeIn=prediction.firstFaceLongEdgeIn;
 o.firstFaceHeightIn=prediction.firstFaceHeightIn;
 o.observedFullBands=prediction.fullBands;
 o.observedTubeCrossings=prediction.crossings;
 o.maxMarkMismatchIn=0;
 o.measuredBandRunIn=prediction.bandRunIn;
 o.stripWidthSamplesIn=Array(12).fill(cfg.fullStripCutWidthIn);
 o.finishedCenterLengthIn=prediction.squaredEndLengthIn+1;
 o.finishedLeftLengthIn=prediction.squaredEndLengthIn+1;
 o.finishedRightLengthIn=prediction.squaredEndLengthIn+1;
 o.startTrimLengthEquivalentIn=cfg.fullStripCutWidthIn/2;
 o.endTrimLengthEquivalentIn=cfg.fullStripCutWidthIn/2;
 o.untrimmedLengthIn=o.finishedCenterLengthIn+cfg.fullStripCutWidthIn;
 o.pressedSeamsOpen=true;o.continuousSingleLayerCut=true;
 return o;
}
describe('physical specimen observation ledger MUST NOT self-certify fabric yield',()=>{
 it('keeps all three protocol specimens entirely unmeasured by default',()=>{
  for(const cfg of SPECIMEN_CONFIGS){
   const r=auditBiasSpecimenObservation(cfg,emptyBiasSpecimenObservation(cfg.id));
   expect(r.status).toBe('NOT_RUN');
   expect(r.missingFields.length).toBeGreaterThan(30);
   expect(r.modelOverstatementIn).toBeNull();
   expect(r.physicallyCertified).toBe(false);
   expect(r.humanReviewCompleted).toBe(false);
   expect(r.safeToPurchase).toBe(false);
   expect('purchaseYards' in r).toBe(false);
   expect('verifiedUsableLengthIn' in r).toBe(false);
   expect(r.trust).toBe('USER_ENTERED_UNVERIFIED_NOT_INDEPENDENT_EVIDENCE');
  }
 });
 it('produces documented numerical geometry A/B/C without mislabelling it measured',()=>{
  const lengths=[328.425974,227.91326,144.371];
  for(const [i,cfg] of SPECIMEN_CONFIGS.entries()){
   const r=auditBiasSpecimenObservation(cfg,emptyBiasSpecimenObservation(cfg.id));
   expect(r.predicted.squaredEndLengthIn).toBeCloseTo(lengths[i],2);
   expect(r.predicted.fullBands).toBe([8,7,6][i]);
   expect(r.predicted.crossings).toBe([7,6,5][i]);
   expect(r.status).toBe('NOT_RUN');
  }
 });
 it('reports synthetic complete observations as HUMAN_REVIEW, never passed procurement',()=>{
  for(const cfg of SPECIMEN_CONFIGS){
   const r=auditBiasSpecimenObservation(cfg,mockComplete(cfg));
   expect(r.status).toBe('READY_FOR_HUMAN_REVIEW');
   expect(r.missingFields).toEqual([]);
   expect(r.observedDiscrepancies).toEqual([]);
   expect(r.modelOverstatementIn).toBeCloseTo(-1,8);
   expect(r.safeToPurchase).toBe(false);
   expect(r.physicallyCertified).toBe(false);
   expect(r.humanReviewCompleted).toBe(false);
  }
 });
 it('reports missing width-series and incomplete data, even with a length measurement',()=>{
  const cfg=SPECIMEN_CONFIGS[0];
  const o=mockComplete(cfg);o.stripWidthSamplesIn=null;
  const r=auditBiasSpecimenObservation(cfg,o);
  expect(r.status).toBe('INCOMPLETE');
  expect(r.missingFields).toContain('stripWidthSamplesIn');
 });
 it('blocks modeled length OVERstatement against the shortest of three measured edges',()=>{
  const cfg=SPECIMEN_CONFIGS[0];const o=mockComplete(cfg);
  const model=auditBiasSpecimenObservation(cfg,o).predicted.squaredEndLengthIn;
  o.finishedLeftLengthIn=model-.1;
  const r=auditBiasSpecimenObservation(cfg,o);
  expect(r.status).toBe('OBSERVATION_HOLD');
  expect(r.observedDiscrepancies.join(' ')).toMatch(/CRITICAL.*model predicts more/i);
  expect(r.modelOverstatementIn).toBeCloseTo(.1,6);
  expect(r.safeToPurchase).toBe(false);
 });
 it('flags a failed seam continuity, band count, WOF and tolerance history',()=>{
  const cfg=SPECIMEN_CONFIGS[1];const o=mockComplete(cfg);
  o.observedTubeCrossings=1;o.observedFullBands=5;
  o.continuousSingleLayerCut=false;o.measuredUsableWofIn=cfg.sourceSquareSideIn-1;
  o.tolerances.declaredBeforeCutting=false;
  const r=auditBiasSpecimenObservation(cfg,o);
  expect(r.status).toBe('OBSERVATION_HOLD');
  const messages=r.observedDiscrepancies.join(' | ');
  for(const term of ['crossing count','band count','one-layer','WOF','Tolerances were not declared'])
   expect(messages).toContain(term);
 });
 it('rejects impossible or malformed series and nonfinite measurements',()=>{
  const cfg=SPECIMEN_CONFIGS[0];
  const o=mockComplete(cfg);o.firstSeamSamplesIn=[.25,.25];
  expect(()=>auditBiasSpecimenObservation(cfg,o)).toThrow(/exactly 5/);
  o.firstSeamSamplesIn=[.25,.25,null as unknown as number,.25,.25];
  expect(()=>auditBiasSpecimenObservation(cfg,o)).toThrow(/missing/);
  o.firstSeamSamplesIn=Array(5).fill(.25);
  o.finishedCenterLengthIn=Infinity;
  expect(()=>auditBiasSpecimenObservation(cfg,o)).toThrow(/finite/);
  o.finishedCenterLengthIn=100;
  o.observedFullBands=7.5;
  expect(()=>auditBiasSpecimenObservation(cfg,o)).toThrow(/whole number/);
 });
 it('never accepts altered specimen presets or invented evidence status',()=>{
  const cfg=SPECIMEN_CONFIGS[0];
  const o=mockComplete(cfg);
  expect(()=>auditBiasSpecimenObservation({...cfg,sourceSquareSideIn:31},o)).toThrow(/Unsupported/);
  expect(()=>auditBiasSpecimenObservation(cfg,{...o,specimenId:'B'})).toThrow(/mismatch/);
  const r=auditBiasSpecimenObservation(cfg,o);
  expect(r.method).toBe('CONTINUOUS_BIAS_PHYSICAL_OBSERVATION_AUDIT');
  expect(r.trust).toBe('USER_ENTERED_UNVERIFIED_NOT_INDEPENDENT_EVIDENCE');
 });
});
