import {describe,expect,it} from 'vitest';
import {layoutRectangles} from '../src/lib/quilt/math';
import {cutListCsv} from '../src/lib/quilt/cutlist';
import {shoppingCsv} from '../src/lib/quilt/shopping';
import {
 importFabricAudit,assessFabricAudit,fabricAuditEvidence,
 type ImportedFabricAudit,type ManualFabricAuditInput
} from '../src/lib/quilt/fabric-audit';
import {evaluateTopGrid,type UserTopGrid} from '../src/lib/quilt/top-grid-audit';

const tag='deaf2140';
function project(pieceCount=9):ImportedFabricAudit{
 const layout=layoutRectangles(43,[{widthIn:5,heightIn:5,count:pieceCount,label:'Real test squares'}]);
 const p=importFabricAudit(
  cutListCsv([{material:'Quilt TOP',sku:'fabric:blue',layout}],tag),
  shoppingCsv([{rollId:'fabric:blue',label:'Top blue',hint:'9 squares',rawYards:15/36,amount:.5}],tag)
 );
 p.seamPlan={
  sourceProjectHash:tag,calculationVersion:'v2',checks:[],
  finishing:{
   plannedCenterWidthIn:9.5,plannedCenterHeightIn:9.5,
   plannedQuiltTopWidthIn:15.5,plannedQuiltTopHeightIn:15.5,
   plannedPretrimBackingWidthIn:24,plannedPretrimBackingHeightIn:24,
   requiredBackingWidthIn:23.5,requiredBackingHeightIn:23.5
  }
 };
 return p;
}
function grid():UserTopGrid{
 return {
  rows:2,columns:2,spansEntireCenter:false,declaredTotalToleranceIn:.0625,
  measuredAssembledWidthIn:9.5,measuredAssembledHeightIn:9.5,
  cells:[
   {rollId:'fabric:blue',pieceNumber:1,measuredCutWidthIn:5,measuredCutHeightIn:5,seamRightIn:.25,seamBottomIn:.25},
   {rollId:'fabric:blue',pieceNumber:2,measuredCutWidthIn:5,measuredCutHeightIn:5,seamLeftIn:.25,seamBottomIn:.25},
   {rollId:'fabric:blue',pieceNumber:3,measuredCutWidthIn:5,measuredCutHeightIn:5,seamRightIn:.25,seamTopIn:.25},
   {rollId:'fabric:blue',pieceNumber:4,measuredCutWidthIn:5,measuredCutHeightIn:5,seamLeftIn:.25,seamTopIn:.25}
  ]
 };
}
function audit(g:UserTopGrid,projectInput=project()):ManualFabricAuditInput{
 return {
  project:projectInput,topGrid:g,date:'2026-11-06',fabricCondition:'postwash',
  allowedPieceDeviationIn:.0625,reviewer:'Test synthetic',physicallyMeasured:true,
  readings:projectInput.rolls.map(r=>({
   id:r.id,actualUsableWofIn:r.usableWofIn,actualUsableRunIn:r.requiredRunIn,
   sampledPieceNumber:r.pieces[0].pieceNumber,measuredPieceWidthIn:r.pieces[0].widthIn,
   measuredPieceHeightIn:r.pieces[0].heightIn
  }))
 };
}
describe('manual rectangular grid from actual quilt-TOP numbered cuts',()=>{
 it('never infers a two-dimensional assembly from the physical roll cutting coordinates',()=>{
  const r=evaluateTopGrid(project(),undefined);
  expect(r.coverage).toBe('NOT_STARTED');
  expect(r.predictedAssembledWidthIn).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('does not supply sewing positions');
  const missing=project();delete missing.seamPlan;
  expect(evaluateTopGrid(missing,grid()).invalid[0]).toContain('Matching reviewed');
 });
 it('reconciles a true 2×2 rectangle from 4 unique source piece IDs and 8 independently measured internal seam edges',()=>{
  const result=evaluateTopGrid(project(),grid());
  expect(result.invalid).toHaveLength(0);
  expect(result.coverage).toBe('ALL_USER_REPORTED');
  expect(result.expectedCellCount).toBe(4);
  expect(result.knownSourceCells).toBe(4);
  expect(result.measuredCells).toBe(4);
  expect(result.measuredInternalEdges).toBe(8);
  expect(result.expectedInternalEdges).toBe(8);
  expect(result.rowAssembledWidthsIn).toEqual([9.5,9.5]);
  expect(result.columnAssembledHeightsIn).toEqual([9.5,9.5]);
  expect(result.predictedAssembledWidthIn).toBe(9.5);
  expect(result.predictedAssembledHeightIn).toBe(9.5);
  expect(result.shapeMismatch).toBe(false);
  expect(result.independentRulerMismatch).toBe(false);
  expect(result.actualCenterWidthDifferenceIn).toBeUndefined();
  expect(assessFabricAudit(audit(grid())).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  const v6=fabricAuditEvidence(audit(grid()),'2026-11-06T12:03:00Z');
  expect(v6).toMatchObject({
   schemaVersion:6,quiltCuttingApproval:false,independentPhysicalVerification:false,
   sourceSnapshotIsCryptographicallyAuthenticated:false
  });
  expect(v6.topGridCheck.coverage).toBe('ALL_USER_REPORTED');
  expect(v6.topGridCheck.reading?.cells[1].pieceNumber).toBe(2);
 });
 it('a missing seam edge or separate assembled ruler dimension is partial, never prefilled from the source',()=>{
  const g=grid();g.cells[2].seamRightIn=undefined;
  let r=evaluateTopGrid(project(),g);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.measuredInternalEdges).toBe(7);
  expect(r.predictedAssembledWidthIn).toBeUndefined();
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_OPTIONAL_TOP_QA_PARTIAL');
  expect(assessFabricAudit(audit(g)).message).toContain('NO verdict');
  const partialEvidence=fabricAuditEvidence(audit(g),'2026-11-06T16:21:00Z');
  expect(partialEvidence.selfReportedStatus).toBe('USER_REPORTED_OPTIONAL_TOP_QA_PARTIAL');
  expect(partialEvidence.topGridCheck.measuredInternalEdges).toBe(7);
  expect(partialEvidence.topGridCheck.predictedAssembledWidthIn).toBeUndefined();
  expect(partialEvidence.independentPhysicalVerification).toBe(false);
  g.cells[2].seamRightIn=.25;g.measuredAssembledWidthIn=undefined;
  r=evaluateTopGrid(project(),g);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.predictedAssembledWidthIn).toBe(9.5);
  expect(r.independentRulerMismatch).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('NOT VERIFIED');
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_OPTIONAL_TOP_QA_PARTIAL');
 });
 it('rejects a duplicate or non-top/missing physical source cut and outer-edge take-up masquerading as a join',()=>{
  const g=grid();g.cells[3].pieceNumber=1;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('Duplicate');
  g.cells[3].pieceNumber=999;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('Unknown quilt-top');
  g.cells[3].rollId='backing';
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('Invalid physical top-fabric');
  const q=grid();q.cells[0].seamLeftIn=0;
  expect(evaluateTopGrid(project(),q).invalid.join(' ')).toContain('Perimeter');
  expect(assessFabricAudit(audit(q)).canExport).toBe(false);
 });
 it('flags a misaligned rectangular grid even when total row and column spans happen to match',()=>{
  const g=grid();
  // Shift seam take-up on first vertical row only while preserving this row's
  // summed loss: left patch loses 0.375 and right patch 0.125 instead of 0.25 each.
  g.cells[0].seamRightIn=.375;g.cells[1].seamLeftIn=.125;
  const r=evaluateTopGrid(project(),g);
  expect(r.rowWidthSpreadIn).toBe(0);
  expect(r.columnCellWidthSpreadIn?.[0]).toBeCloseTo(.125);
  expect(r.shapeMismatch).toBe(true);
  expect(r.independentRulerMismatch).toBe(false);
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_TOP_GRID_SHAPE_MISMATCH');
 });
 it('detects independent full assembled ruler disagreement without a geometry mismatch',()=>{
  const g=grid();g.measuredAssembledWidthIn=9.75;
  const r=evaluateTopGrid(project(),g);
  expect(r.shapeMismatch).toBe(false);
  expect(r.independentRulerMismatch).toBe(true);
  expect(r.independentWidthDifferenceIn).toBeCloseTo(.25);
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_TOP_GRID_RULER_MISMATCH');
 });
 it('rejects a partial sample falsely claimed as complete center, preserving a negative evidence record',()=>{
  const g=grid();const p=project();
  expect(evaluateTopGrid(p,g).actualCenterWidthDifferenceIn).toBeUndefined();
  g.spansEntireCenter=true;
  const r=evaluateTopGrid(p,g);
  expect(r.coverage).toBe('ALL_USER_REPORTED');
  expect(r.sourceTopCutCount).toBe(9);
  expect(r.mappedSourceTopCutCount).toBe(4);
  expect(r.unmappedSourceTopCutCount).toBe(5);
  expect(r.fullCenterSourceCoverageMismatch).toBe(true);
  expect(r.actualCenterWidthDifferenceIn).toBeUndefined();
  expect(r.centerSizeMismatch).toBeUndefined();
  expect(r.warnings.join(' ')).toContain('SUPPRESSED');
  const input=audit(g,p);
  const result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_TOP_GRID_SOURCE_COVERAGE_MISMATCH');
  expect(result.canExport).toBe(true);
  const evidence=fabricAuditEvidence(input,'2026-11-06T13:35:00Z');
  expect(evidence.selfReportedStatus).toBe('USER_REPORTED_TOP_GRID_SOURCE_COVERAGE_MISMATCH');
  expect(evidence.topGridCheck.unmappedSourceTopCutCount).toBe(5);
  expect(evidence.quiltCuttingApproval).toBe(false);
  expect(evidence.independentPhysicalVerification).toBe(false);
 });
 it('compares to planned CENTER only when reviewer claims whole center AND all source patch IDs are present',()=>{
  const g=grid();const p=project(4);p.seamPlan!.finishing.plannedCenterWidthIn=10;
  let r=evaluateTopGrid(p,g);
  expect(r.sourceTopCutCount).toBe(4);
  expect(r.mappedSourceTopCutCount).toBe(4);
  expect(r.actualCenterWidthDifferenceIn).toBeUndefined();
  g.spansEntireCenter=true;r=evaluateTopGrid(p,g);
  expect(r.fullCenterSourceCoverageMismatch).toBeUndefined();
  expect(r.centerSizeMismatch).toBe(true);
  expect(r.actualCenterWidthDifferenceIn).toBe(-.5);
  expect(assessFabricAudit(audit(g,p)).status).toBe('USER_REPORTED_TOP_GRID_CENTER_SIZE_DEVIATION');
  p.seamPlan!.finishing.plannedCenterWidthIn=9.5;
  r=evaluateTopGrid(p,g);
  expect(r.centerSizeMismatch).toBe(false);
  expect(assessFabricAudit(audit(g,p)).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  // Even this source-ID and ruler match never asserts observed sewing topology.
  expect(fabricAuditEvidence(audit(g,p),'2026-11-06T13:36:00Z').quiltCuttingApproval).toBe(false);
 });
 it('flags sampled individual cut width or height inconsistent with original physical CSV',()=>{
  const g=grid();
  for(const c of g.cells){c.measuredCutWidthIn=5.25;c.measuredCutHeightIn=5.25;}
  g.measuredAssembledWidthIn=10;g.measuredAssembledHeightIn=10;
  const r=evaluateTopGrid(project(),g);
  expect(r.cutSizeDeviationCount).toBe(4);
  expect(r.shapeMismatch).toBe(false);
  expect(r.independentRulerMismatch).toBe(false);
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_TOP_GRID_CUT_SIZE_DEVIATION');
 });
 it('uses the separate physical cut tolerance even when the assembled-grid tolerance is large',()=>{
  const g=grid();g.declaredTotalToleranceIn=.5;
  for(const c of g.cells)c.measuredCutWidthIn=5.125;
  g.measuredAssembledWidthIn=9.75;
  const r=evaluateTopGrid(project(),g,.0625);
  expect(r.coverage).toBe('ALL_USER_REPORTED');
  expect(r.shapeMismatch).toBe(false);
  expect(r.independentRulerMismatch).toBe(false);
  expect(r.cutPieceToleranceIn).toBe(.0625);
  expect(r.cutSizeDeviationCount).toBe(4);
  expect(r.cutComparisons).toHaveLength(4);
  expect(r.cutComparisons[0]).toMatchObject({
   row:1,column:1,expectedCutWidthIn:5,measuredCutWidthIn:5.125,
   widthDifferenceIn:.125,heightDifferenceIn:0,exceedsPieceTolerance:true
  });
  const selfReported=assessFabricAudit(audit(g));
  expect(selfReported.status).toBe('USER_REPORTED_TOP_GRID_CUT_SIZE_DEVIATION');
  const evidence=fabricAuditEvidence(audit(g),'2026-11-06T13:00:00Z');
  expect(evidence.topGridCheck.cutComparisons[3].widthDifferenceIn).toBeCloseTo(.125);
  expect(evidence.independentPhysicalVerification).toBe(false);
  const accepted=evaluateTopGrid(project(),g,.25);
  expect(accepted.cutSizeDeviationCount).toBe(0);
  const widened=audit(g);widened.allowedPieceDeviationIn=.25;
  expect(assessFabricAudit(widened).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
 });
 it('flags a single physically measured wrong axis on a still-partial grid',()=>{
  const g=grid();g.cells[0].measuredCutWidthIn=5.125;
  g.cells[0].measuredCutHeightIn=undefined;
  const r=evaluateTopGrid(project(),g,.0625);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.measuredCells).toBe(3);
  expect(r.cutSizeDeviationCount).toBe(1);
  expect(r.cutComparisons[0].widthDifferenceIn).toBeCloseTo(.125);
  expect(r.cutComparisons[0].heightDifferenceIn).toBeUndefined();
  expect(r.predictedAssembledWidthIn).toBeUndefined();
  expect(assessFabricAudit(audit(g)).status).toBe('USER_REPORTED_TOP_GRID_CUT_SIZE_DEVIATION');
 });
 it('rejects invalid standalone cut tolerances without confusing them with assembly tolerance',()=>{
  const g=grid();g.declaredTotalToleranceIn=1;
  expect(evaluateTopGrid(project(),g,.26).invalid.join(' ')).toContain('cut-piece tolerance');
  expect(evaluateTopGrid(project(),g,-1).invalid.join(' ')).toContain('cut-piece tolerance');
 });
 it('blocks physically impossible partial grid readings without treating blank edges as measured zero',()=>{
  let g=grid();
  g.cells[2].seamRightIn=undefined; // another cell is still incomplete
  g.cells[0].seamRightIn=5; // one known loss already consumes full measured width
  let r=evaluateTopGrid(project(),g);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.predictedAssembledWidthIn).toBeUndefined();
  expect(r.invalid.join(' ')).toContain('consumes the entire physical width');
  expect(assessFabricAudit(audit(g)).canExport).toBe(false);
  g=grid();
  g.cells[0].seamRightIn=undefined; // even the second side of this join is unknown
  g.cells[1].seamLeftIn=5;
  r=evaluateTopGrid(project(),g);
  expect(r.invalid.join(' ')).toContain('entire physical width');
  expect(assessFabricAudit(audit(g)).status).toBe('INCOMPLETE_USER_MEASUREMENTS');
  g=grid();
  g.cells[3].measuredCutWidthIn=undefined;
  g.cells[0].seamBottomIn=5; // vertical height must also be checked in partial grids
  r=evaluateTopGrid(project(),g);
  expect(r.invalid.join(' ')).toContain('entire physical height');
  g=grid();
  g.cells[0].measuredCutWidthIn=undefined; // no ruler width: cannot assume native CSV size
  g.cells[0].seamRightIn=5;
  r=evaluateTopGrid(project(),g);
  expect(r.invalid).toHaveLength(0);
  expect(r.coverage).toBe('PARTIAL_USER_REPORTED');
  expect(r.predictedAssembledWidthIn).toBeUndefined();
 });
 it('enforces invalid seam sum, negative/oversized dimensions and grid bounds without an automatic approval',()=>{
  let g=grid();g.cells[0].seamRightIn=5;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('consumes the entire');
  g=grid();g.cells[0].seamBottomIn=-.01;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('Invalid physical net seam');
  g=grid();g.cells[2].measuredCutWidthIn=Infinity;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('Invalid real');
  g=grid();g.rows=5;
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('2–4 rows');
  g=grid();g.cells.pop();
  expect(evaluateTopGrid(project(),g).invalid.join(' ')).toContain('precisely one');
  g=grid();g.cells[0].seamRightIn=0;g.cells[1].seamLeftIn=.5;
  expect(evaluateTopGrid(project(),g).invalid).toHaveLength(0);
 });
});
