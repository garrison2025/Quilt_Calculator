import {describe,it,expect} from 'vitest';
import {layoutRectangles} from '../src/lib/quilt/math';
import {cutListCsv} from '../src/lib/quilt/cutlist';
import {shoppingCsv} from '../src/lib/quilt/shopping';
import {importFabricAudit,assessFabricAudit,fabricAuditEvidence,type ImportedFabricAudit,type ManualFabricAuditInput} from '../src/lib/quilt/fabric-audit';
import {evaluateTopChain,type UserTopChain} from '../src/lib/quilt/top-chain-audit';
import type {JoinedSeamPlan} from '../src/lib/quilt/seam-audit';

const tag='e7a62b91';
const layout=layoutRectangles(43,[{widthIn:10,heightIn:8,count:3,label:'Top patches'}]);
const plan:JoinedSeamPlan={
 sourceProjectHash:tag,calculationVersion:'v2.0',checks:[],
 finishing:{
  requiredBackingWidthIn:30,requiredBackingHeightIn:18,
  plannedPretrimBackingWidthIn:40,plannedPretrimBackingHeightIn:20,
  plannedQuiltTopWidthIn:22,plannedQuiltTopHeightIn:10,
  plannedCenterWidthIn:19.5,plannedCenterHeightIn:8
 }
};
function setup():ImportedFabricAudit{
 const proj=importFabricAudit(cutListCsv([{material:'Quilt-top fabric',sku:'fabric:blue',layout}],tag),
  shoppingCsv([{rollId:'fabric:blue',label:'Top blue',hint:'sample',rawYards:8/36,amount:.25}],tag));
 proj.seamPlan=plan;return proj;
}
function complete():UserTopChain{
 return {
  axis:'width',spansEntireCenter:false,declaredTotalToleranceIn:.0625,
  pieces:[
   {rollId:'fabric:blue',pieceNumber:1,observedCutSpanIn:10},
   {rollId:'fabric:blue',pieceNumber:2,observedCutSpanIn:10}
  ],
  joins:[{previousEdgeTakeupIn:.25,nextEdgeTakeupIn:.25}],
  observedJoinedSpanIn:19.5
 };
}
function input(project:ImportedFabricAudit,topChain:UserTopChain):ManualFabricAuditInput{
 return {
  project,topChain,date:'2026-11-06',fabricCondition:'postwash',allowedPieceDeviationIn:.0625,
  reviewer:'Synthetic test only',physicallyMeasured:true,
  readings:project.rolls.map(r=>({
   id:r.id,actualUsableWofIn:r.usableWofIn,actualUsableRunIn:r.requiredRunIn,
   sampledPieceNumber:r.pieces[0].pieceNumber,measuredPieceWidthIn:r.pieces[0].widthIn,
   measuredPieceHeightIn:r.pieces[0].heightIn
  }))
 };
}
describe('optional user-ordered quilt-top straight seam chain',()=>{
 it('never infers placement/order/measurements from source cut-list CSV alone',()=>{
  const project=setup();
  let r=evaluateTopChain(project,undefined);
  expect(r.coverage).toBe('NOT_STARTED');
  expect(r.predictedJoinedSpanFromMeasuredPartsIn).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('cannot establish quilt-top sewing order');
  r=evaluateTopChain({...project,seamPlan:undefined},complete());
  expect(r.source).toBe('NOT_IMPORTED');
  expect(r.invalid[0]).toContain('matching, reviewed');
 });
 it('uses distinct source piece IDs, actual piece measurements and both consumed seam edges',()=>{
  const r=evaluateTopChain(setup(),complete());
  expect(r.invalid).toHaveLength(0);
  expect(r.coverage).toBe('ALL_USER_REPORTED');
  expect(r.cutPieceCount).toBe(2);
  expect(r.recordedPieceCount).toBe(2);
  expect(r.recordedJoinEdgeCount).toBe(2);
  expect(r.measuredCutSpanSumIn).toBe(20);
  expect(r.summedNetSeamTakeupIn).toBe(.5);
  expect(r.predictedJoinedSpanFromMeasuredPartsIn).toBe(19.5);
  expect(r.joinedSpanDifferenceIn).toBe(0);
  expect(r.independentJoinMismatch).toBe(false);
  expect(r.expectedCenterSpanIn).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('not a full-center');
 });
 it('flags independently measured joined-span discrepancy without inventing length',()=>{
  const m=complete();m.observedJoinedSpanIn=19.75;
  let r=evaluateTopChain(setup(),m);
  expect(r.independentJoinMismatch).toBe(true);
  expect(r.joinedSpanDifferenceIn).toBe(.25);
  expect(r.coverage).toBe('ALL_USER_REPORTED');
  expect(assessFabricAudit(input(setup(),m)).status).toBe('USER_REPORTED_TOP_CHAIN_MEASUREMENTS_DISAGREE');
  expect(fabricAuditEvidence(input(setup(),m),'2026-11-06T12:00:00Z')).toMatchObject({
   schemaVersion:6,selfReportedStatus:'USER_REPORTED_TOP_CHAIN_MEASUREMENTS_DISAGREE',
   independentPhysicalVerification:false,quiltCuttingApproval:false
  });
  m.observedJoinedSpanIn=19.5625;
  r=evaluateTopChain(setup(),m);
  expect(r.independentJoinMismatch).toBe(false);
 });
 it('only compares to planned CENTER when the reviewer explicitly claims full-center coverage',()=>{
  const m=complete();m.observedJoinedSpanIn=19.75;
  expect(evaluateTopChain(setup(),m).centerSpanMismatch).toBeUndefined();
  m.observedJoinedSpanIn=19.5;m.spansEntireCenter=true;
  expect(evaluateTopChain(setup(),m).centerSpanMismatch).toBe(false);
  m.observedJoinedSpanIn=19.75;
  const r=evaluateTopChain(setup(),m);
  expect(r.expectedCenterSpanIn).toBe(19.5);
  expect(r.centerSpanMismatch).toBe(true);
  expect(r.centerSpanDifferenceIn).toBe(.25);
  expect(assessFabricAudit(input(setup(),m)).status).toBe('USER_REPORTED_TOP_CHAIN_MEASUREMENTS_DISAGREE');
  // Independently measured chain agrees with the physical cut-piece total,
  // but neither matches the nominal center. Flag a different cause.
  m.pieces[0].observedCutSpanIn=10.25;
  expect(assessFabricAudit(input(setup(),m)).status).toBe('USER_REPORTED_TOP_CHAIN_CENTER_SIZE_DEVIATION');
 });
 it('detects an actual source-cut size mismatch rather than silently using nominal CSV dimension',()=>{
  const m=complete();m.pieces[0].observedCutSpanIn=10.25;
  m.observedJoinedSpanIn=19.75;
  const r=evaluateTopChain(setup(),m);
  expect(r.cutSizeDeviationCount).toBe(1);
  expect(r.independentJoinMismatch).toBe(false);
  expect(assessFabricAudit(input(setup(),m)).status).toBe('USER_REPORTED_TOP_CHAIN_CUT_SIZE_DEVIATION');
 });
 it('does not let a large total chain tolerance mask a miscut physical piece',()=>{
  const g=complete();g.declaredTotalToleranceIn=.5;
  g.pieces[0].observedCutSpanIn=10.125;
  g.observedJoinedSpanIn=19.625;
  const r=evaluateTopChain(setup(),g,.0625);
  expect(r.independentJoinMismatch).toBe(false);
  expect(r.cutSizeDeviationCount).toBe(1);
  expect(r.cutPieceToleranceIn).toBe(.0625);
  expect(r.cutComparisons[0].differenceIn).toBeCloseTo(.125);
  expect(r.cutComparisons[0].exceedsPieceTolerance).toBe(true);
  expect(assessFabricAudit(input(setup(),g)).status).toBe('USER_REPORTED_TOP_CHAIN_CUT_SIZE_DEVIATION');
  const evidence=fabricAuditEvidence(input(setup(),g),'2026-11-06T13:01:00Z');
  expect(evidence.topChainCheck.cutComparisons[0].expectedCutSpanIn).toBe(10);
  expect(evidence.quiltCuttingApproval).toBe(false);
  const wider=input(setup(),g);wider.allowedPieceDeviationIn=.25;
  expect(assessFabricAudit(wider).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(evaluateTopChain(setup(),g,.26).invalid.join(' ')).toContain('cut-piece tolerance');
 });
 it('keeps incomplete seam edges partial instead of filling them from a model',()=>{
  const m=complete();m.joins[0].nextEdgeTakeupIn=undefined;
  const r=evaluateTopChain(setup(),m);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.recordedJoinEdgeCount).toBe(1);
  expect(r.summedNetSeamTakeupIn).toBeUndefined();
  expect(r.predictedJoinedSpanFromMeasuredPartsIn).toBeUndefined();
  expect(assessFabricAudit(input(setup(),m)).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(assessFabricAudit(input(setup(),m)).message).toContain('NOT fully verified');
 });
 it('rejects duplicated, unknown, non-top and malformed physical source references',()=>{
  const project=setup();let m=complete();m.pieces[1].pieceNumber=1;
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('same physical quilt-top');
  m=complete();m.pieces[1].pieceNumber=999;
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('Unknown quilt-top');
  m=complete();m.pieces[1].rollId='backing';
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('not a top-fabric');
  m=complete();m.pieces[0].observedCutSpanIn=NaN;
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('Invalid measured');
  m=complete();m.joins[0].nextEdgeTakeupIn=-1;
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('Invalid net seam');
  m=complete();m.declaredTotalToleranceIn=2;
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('TOTAL chain');
  m=complete();m.pieces.push({rollId:'fabric:blue',pieceNumber:3,observedCutSpanIn:10});
  expect(evaluateTopChain(project,m).invalid.join(' ')).toContain('neighboring');
 });
 it('refuses a physically impossible sum of seam take-up and preserves zero allowed seam edge',()=>{
  const m=complete();m.joins[0]={previousEdgeTakeupIn:10,nextEdgeTakeupIn:10};
  expect(evaluateTopChain(setup(),m).invalid.join(' ')).toContain('consumes the entire');
  m.joins[0]={previousEdgeTakeupIn:0,nextEdgeTakeupIn:.5};
  expect(evaluateTopChain(setup(),m).invalid).toHaveLength(0);
  expect(evaluateTopChain(setup(),m).summedNetSeamTakeupIn).toBe(.5);
 });
 it('independent height axis uses physical cut height and planned center HEIGHT, not quilt outside or WOF',()=>{
  const m=complete();m.axis='height';m.pieces[0].observedCutSpanIn=8;m.pieces[1].observedCutSpanIn=8;
  m.observedJoinedSpanIn=15.5;m.spansEntireCenter=true;
  const r=evaluateTopChain(setup(),m);
  expect(r.predictedJoinedSpanFromMeasuredPartsIn).toBe(15.5);
  expect(r.expectedCenterSpanIn).toBe(8);
  expect(r.centerSpanMismatch).toBe(true);
 });
});
