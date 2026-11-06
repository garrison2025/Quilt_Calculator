import {describe,expect,it} from 'vitest';
import {calculateBacking,calculateStraightBinding} from '../src/lib/quilt/math';
import {cutListCsv} from '../src/lib/quilt/cutlist';
import {shoppingCsv,type ShoppingLine} from '../src/lib/quilt/shopping';
import {importFabricAudit,assessFabricAudit,fabricAuditEvidence,type ManualFabricAuditInput} from '../src/lib/quilt/fabric-audit';
import {readJoinedSeamPlan,evaluateJoinedSeams} from '../src/lib/quilt/seam-audit';
const fingerprint='beef2134';
const backing=calculateBacking({
 widthIn:66,heightIn:86,overageIn:4,wofIn:43,joinTakeupIn:1,step:.125
}).recommended;
const binding=calculateStraightBinding({
 widthIn:66,heightIn:86,wofIn:43,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:2.5,step:.125
});
const materialPlans=[
 {sku:'backing',material:'Backing',layout:backing.layout},
 {sku:'binding',material:'Straight-grain binding',layout:binding.layout}
];
const lines:ShoppingLine[]=[
 {rollId:'backing',label:'Backing',hint:'2 full panels',amount:backing.purchase.roundedPurchaseYards,rawYards:backing.purchase.rawPurchaseYards},
 {rollId:'binding',label:'Binding',hint:'8 strips',amount:binding.purchase.roundedPurchaseYards,rawYards:binding.purchase.rawPurchaseYards}
];
function source(){return importFabricAudit(cutListCsv(materialPlans,fingerprint),shoppingCsv(lines,fingerprint));}
function plan(overrides:Record<string,unknown>={}){
 return JSON.stringify({
  tool:'hub',sourceProjectHash:fingerprint,calculationVersion:'test-V2',
  readiness:{status:'LISTED_CUTS_FEASIBLE',cutCsvReady:true},
  result:{selectedBacking:backing,binding},...overrides
 });
}
function setup(){
 const project=source();project.seamPlan=readJoinedSeamPlan(project,plan());
 const input:ManualFabricAuditInput={
  project,physicallyMeasured:true,date:'2026-11-06',reviewer:'',
  fabricCondition:'postwash',allowedPieceDeviationIn:.0625,
  readings:project.rolls.map(roll=>({
   id:roll.id,actualUsableWofIn:roll.usableWofIn,actualUsableRunIn:roll.requiredRunIn,
   sampledPieceNumber:1,measuredPieceWidthIn:roll.pieces[0].widthIn,
   measuredPieceHeightIn:roll.pieces[0].heightIn
  }))
 };
 return input;
}
describe('sewn backing/binding checks require exactly the matching project-calculation export',()=>{
 it('reads orientation/panels and joined binding lengths from current engine, not a guessed CSV rule',()=>{
  const doc=readJoinedSeamPlan(source(),plan());
  expect(doc.checks.map(c=>c.kind)).toEqual(['backing','binding']);
  const [b,strip]=doc.checks;
  expect([b.sectionCount,b.joinCount,b.direction,b.plannedPretrimJoinedLengthIn,b.requiredMinimumLengthIn,
    b.modeledTotalJoinLossIn]).toEqual([
    backing.panelCount,backing.panelCount-1,backing.direction,
    backing.finishedJoinedSpanIn,backing.targetWidthIn,
    backing.panelCount*43-backing.finishedJoinedSpanIn
   ]);
  expect([strip.sectionCount,strip.joinCount,strip.plannedPretrimJoinedLengthIn,
    strip.requiredMinimumLengthIn,strip.modeledTotalJoinLossIn]).toEqual([
    binding.stripCount,binding.stripCount-1,binding.effectiveJoinedLengthIn,
    binding.requiredLengthIn,binding.stripCount*43-binding.effectiveJoinedLengthIn
   ]);
 });
 it('rejects a different project hash, individual tool, incomplete readiness or altered geometry',()=>{
  const project=source();
  expect(()=>readJoinedSeamPlan(project,plan({sourceProjectHash:'f00dbabe'}))).toThrow(/fingerprint/);
  expect(()=>readJoinedSeamPlan(project,plan({tool:'backing'}))).toThrow(/whole-quilt/);
  expect(()=>readJoinedSeamPlan(project,plan({readiness:{cutCsvReady:false,status:'FIT_IMPOSSIBLE'}}))).toThrow(/complete/);
  expect(()=>readJoinedSeamPlan(project,'{')).toThrow(/Malformed/);
  expect(()=>readJoinedSeamPlan(project,' ')).toThrow(/nonempty/);
  expect(()=>readJoinedSeamPlan(project,'x'.repeat(2_000_001))).toThrow(/below 2 MB/);
  const changed={...backing,panelCount:backing.panelCount+1};
  expect(()=>readJoinedSeamPlan(project,plan({result:{selectedBacking:changed,binding}}))).toThrow(/section count/);
  const wrongBinding={...binding,effectiveJoinedLengthIn:binding.stripCount*43+3};
  expect(()=>readJoinedSeamPlan(project,plan({result:{selectedBacking:backing,binding:wrongBinding}}))).toThrow(/assembled length/);
  const wrongBacking={...backing,direction:'horizontal',targetHeightIn:backing.finishedJoinedSpanIn+10};
  expect(()=>readJoinedSeamPlan(project,plan({result:{selectedBacking:wrongBacking,binding}}))).toThrow(/assembly geometry/);
 });
 it('omitted seam measurements always stay explicitly unverified; zero/invalid inputs block export',()=>{
  const input=setup();
  const first=assessFabricAudit(input);
  expect(first.status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(first.seamVerificationCoverage).toBe('NOT_MEASURED');
  expect(first.message).toContain('seam take-up was NOT verified');
  input.joinedSeamReadings=[{kind:'backing',measuredPretrimJoinedLengthIn:0}];
  expect(assessFabricAudit(input).status).toBe('INCOMPLETE_USER_MEASUREMENTS');
  input.joinedSeamReadings=[{kind:'backing',measuredPretrimJoinedLengthIn:backing.finishedJoinedSpanIn}];
  expect(assessFabricAudit(input).canExport).toBe(false); // tolerance mandatory if measured
  input.allowedSeamDeviationIn=0;
  expect(assessFabricAudit(input).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(assessFabricAudit(input).seamVerificationCoverage).toBe('PARTIAL_USER_REPORTED');
  const evidence=fabricAuditEvidence(input,'2026-11-06T11:00:00Z');
  expect(evidence).toMatchObject({
   schemaVersion:2,cuttingPlanJsonMatchedByFingerprint:true,
   seamVerificationCoverage:'PARTIAL_USER_REPORTED',
   sourceSnapshotIsCryptographicallyAuthenticated:false,
   independentPhysicalVerification:false,quiltCuttingApproval:false
  });
  expect(evidence.seamChecks.find(c=>c.kind==='binding')?.measurementState).toBe('NOT_MEASURED');
 });
 it('reported seam excess or required-span shortage is a distinct exportable failure',()=>{
  const input=setup();
  input.joinedSeamReadings=[
   {kind:'backing',measuredPretrimJoinedLengthIn:backing.finishedJoinedSpanIn},
   {kind:'binding',measuredPretrimJoinedLengthIn:binding.effectiveJoinedLengthIn}
  ];
  input.allowedSeamDeviationIn=1/16;
  let result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(result.seamVerificationCoverage).toBe('ALL_USER_REPORTED');
  const bindingMeasure=input.joinedSeamReadings[1];
  bindingMeasure.measuredPretrimJoinedLengthIn=binding.effectiveJoinedLengthIn-.125;
  result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_SEAM_LOSS_EXCEEDS_PLAN');
  expect(result.canExport).toBe(true);
  expect(result.seamChecks.find(c=>c.kind==='binding')?.observedLossExceedsModel).toBe(true);
  bindingMeasure.measuredPretrimJoinedLengthIn=binding.requiredLengthIn-.01;
  result=assessFabricAudit(input);
  expect(result.seamChecks.find(c=>c.kind==='binding')?.assembledSpanShortfall).toBe(true);
  const evidence=fabricAuditEvidence(input,'2026-11-06T11:00:00Z');
  expect(evidence.selfReportedStatus).toBe('USER_REPORTED_SEAM_LOSS_EXCEEDS_PLAN');
  expect(evidence.quiltCuttingApproval).toBe(false);
  bindingMeasure.measuredPretrimJoinedLengthIn=binding.effectiveJoinedLengthIn;
  input.allowedSeamDeviationIn=2;
  expect(assessFabricAudit(input).canExport).toBe(false);
 });
 it('the absence of cutting-plan JSON never implies that sewing was physically verified',()=>{
  const input=setup();
  delete input.project.seamPlan;
  const result=assessFabricAudit(input);
  expect(result.seamVerificationCoverage).toBe('NOT_IMPORTED');
  expect(result.message).toContain('No matching cutting-plan JSON');
  expect(result.seamChecks).toHaveLength(0);
  expect(fabricAuditEvidence(input,'2026-11-06T11:00:00Z').cuttingPlanJsonMatchedByFingerprint).toBe(false);
 });
});
