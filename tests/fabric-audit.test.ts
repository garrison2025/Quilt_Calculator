import {describe,expect,it} from 'vitest';
import {cutListCsv, type MaterialCutPlan} from '../src/lib/quilt/cutlist';
import {shoppingCsv, type ShoppingLine} from '../src/lib/quilt/shopping';
import {layoutRectangles} from '../src/lib/quilt/math';
import {
 readAuditCsv,importFabricAudit,assessFabricAudit,fabricAuditEvidence,
 type ImportedFabricAudit,type ManualFabricAuditInput
} from '../src/lib/quilt/fabric-audit';

const tag='a1b2c3d4';
const newerTag='a1b2c3d5';
const rolls:MaterialCutPlan[]=[
 {material:'Backing',sku:'backing',layout:layoutRectangles(43,[{widthIn:10,heightIn:8,count:2,label:'Panel, "Blue"'}])},
 {material:'Independent fabric',sku:'fabric:backing',layout:layoutRectangles(35,[{widthIn:5,heightIn:6,count:1,label:'Cut A'}])}
];
const shopping:ShoppingLine[]=[
 {label:'Backing',hint:'Cutting roll',rollId:'backing',rawYards:8/36,amount:.25},
 {label:'Fabric',hint:'Independent roll',rollId:'fabric:backing',rawYards:6/36,amount:.25}
];
function pair() {return importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(shopping,tag));}
function measured(project:ImportedFabricAudit):ManualFabricAuditInput{
 return {
  project,date:'2026-11-06',fabricCondition:'postwash',allowedPieceDeviationIn:1/16,
  reviewer:'Manual QA (user input)',physicallyMeasured:true,
  readings:project.rolls.map(r=>({
   id:r.id,actualUsableWofIn:r.usableWofIn,actualUsableRunIn:r.requiredRunIn,
   sampledPieceNumber:r.pieces[0].pieceNumber,
   measuredPieceWidthIn:r.pieces[0].widthIn,
   measuredPieceHeightIn:r.pieces[0].heightIn
  }))
 };
}
describe('manual physical fabric-check evidence is never independent physical certification',()=>{
 it('reads RFC4180 quoted commas, escaped quotes, multiline labels and BOM safely',()=>{
  const csv=cutListCsv([{...rolls[0],layout:layoutRectangles(43,[{widthIn:5,heightIn:6,count:1,label:'Fabric, "Blue"\nshade'}])}],tag);
  const data=readAuditCsv(csv);
  expect(data).toHaveLength(2);
  expect(data[1][3]).toBe('Fabric, "Blue"\nshade 1');
  expect(data[1][11]).toBe(tag);
  expect(()=>readAuditCsv('"unclosed')).toThrow(/Unclosed/);
  expect(()=>readAuditCsv('a"b,c')).toThrow(/Malformed/);
  expect(()=>readAuditCsv('"a"evil,b')).toThrow(/follows/);
  expect(()=>readAuditCsv('')).toThrow(/nonempty/);
  expect(()=>readAuditCsv('x'.repeat(2_000_001))).toThrow(/2 MB/);
 });
 it('validates every roll ID, input fingerprint and feasible nonoverlapping geometry',()=>{
  const p=pair();
  expect(p).toMatchObject({sourceProjectHash:tag,cutCount:3});
  expect(p.rolls).toHaveLength(2);
  expect(p.rolls.map(r=>r.id)).toEqual(['backing','fabric:backing']);
  expect(p.rolls[0].pieces).toHaveLength(2);
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(shopping,newerTag)))
   .toThrow(/different project snapshots/);
  expect(()=>importFabricAudit(cutListCsv(rolls),shoppingCsv(shopping,tag)))
   .toThrow(/Unsupported cut-list CSV headers/);
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv([{...shopping[0]}],tag)))
   .toThrow(/no matching shopping line/);
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(shopping.map(x=>({...x,rollId:'backing'})),tag)))
   .toThrow(/Duplicate physical roll ID|Duplicate shopping physical roll/);
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv([{...shopping[0],amount:.125},shopping[1]],tag)))
   .toThrow(/less than the exact prewash requirement/);
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv([{...shopping[0],status:'not-reviewed'},shopping[1]],tag)))
   .not.toThrow();
 });
 it('rejects raw prewash purchases without budgeted shrinkage even if fabric run could fit',()=>{
  const base=shopping.map(line=>({...line}));
  // The first physical cutting run needs 8 in. Raw prewash must be >=8 in,
  // and the rounded purchase can NEVER be shorter than that raw requirement.
  base[0].rawYards=.24;
  base[0].amount=.23;
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(base,tag)))
   .toThrow(/less than the exact prewash requirement/);
  base[0].rawYards=7.9/36;base[0].amount=.25;
  expect(()=>importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(base,tag)))
   .toThrow(/shorter than the postwash cutting run/);
  base[0].rawYards=8/(36*.9);base[0].amount=.25;
  const valid=importFabricAudit(cutListCsv(rolls,tag),shoppingCsv(base,tag));
  expect(valid.rolls[0].plannedRawPurchaseYards).toBeCloseTo(8/(36*.9));
  expect(valid.rolls[0].plannedRoundedPurchaseYards).toBe(.25);
  expect(valid.rolls[0].plannedLengthShrinkagePct).toBeCloseTo(10);
 });
 it('observed real prewash/postwash length can expose underestimated shrinkage without falsely certifying full cutting',()=>{
  const input=measured(pair());
  expect(input.project.rolls.every(roll=>roll.plannedLengthShrinkagePct===0)).toBe(true);
  // No before-wash evidence should never masquerade as a shrinkage check.
  let result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(result.message).toContain('actual shrinkage was NOT verified');
  expect(result.checks.every(c=>c.observedLengthShrinkagePct===undefined)).toBe(true);
  input.readings[0].measuredPrewashRunIn=8.5; // same roll segment: 5.88% shrink
  result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_SHRINKAGE_EXCEEDS_PLAN');
  expect(result.canExport).toBe(true);
  expect(result.checks[0].observedLengthShrinkagePct).toBeCloseTo(100*(1-8/8.5),8);
  expect(result.checks[0].observedShrinkageExceedsPlan).toBe(true);
  expect(result.checks[1].observedLengthShrinkagePct).toBeUndefined();
  const evidence=fabricAuditEvidence(input,'2026-11-06T10:00:00Z');
  expect(evidence.selfReportedStatus).toBe('USER_REPORTED_SHRINKAGE_EXCEEDS_PLAN');
  expect(evidence.independentPhysicalVerification).toBe(false);
  expect(evidence.quiltCuttingApproval).toBe(false);
  input.readings[0].measuredPrewashRunIn=8;
  result=assessFabricAudit(input);
  expect(result.status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(result.checks[0].observedLengthShrinkagePct).toBe(0);
  input.readings[0].measuredPrewashRunIn=7.9; // expansion is a negative shrinkage, not a failed shrink check
  expect(assessFabricAudit(input).checks[0].observedLengthShrinkagePct).toBeLessThan(0);
  expect(assessFabricAudit(input).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  input.readings[0].measuredPrewashRunIn=0;
  expect(assessFabricAudit(input).status).toBe('INCOMPLETE_USER_MEASUREMENTS');
  input.readings[0].measuredPrewashRunIn=Number.POSITIVE_INFINITY;
  expect(assessFabricAudit(input).canExport).toBe(false);
  input.readings[0].measuredPrewashRunIn=undefined;
  expect(assessFabricAudit(input).canExport).toBe(true);
 });
 it('rejects fraudulent overlapping coordinates and different source tags within one file',()=>{
  const original=cutListCsv(rolls,tag);
  const rows=readAuditCsv(original);
  const first=rows[1],second=rows[2];
  expect(first[1]).toBe(second[1]);
  // All cells are quoted in this repository's CSV files.
  const joined=(r:string[])=>r.map(v=>'"'+v.replaceAll('"','""')+'"').join(',');
  const overlapRows=rows.map(r=>[...r]);overlapRows[2][4]=first[4];overlapRows[2][5]=first[5];
  const csv='\uFEFF'+overlapRows.map(joined).join('\r\n')+'\r\n';
  expect(()=>importFabricAudit(csv,shoppingCsv(shopping,tag))).toThrow(/Invalid or overlapping/);
  const differentRows=rows.map(r=>[...r]);differentRows[2][11]=newerTag;
  const mixed='\uFEFF'+differentRows.map(joined).join('\r\n')+'\r\n';
  expect(()=>importFabricAudit(mixed,shoppingCsv(shopping,tag))).toThrow(/multiple project fingerprints/);
 });
 it('marks complete postwash measurements inside user-declared thresholds as self-report only',()=>{
  const input=measured(pair());
  const assessed=assessFabricAudit(input);
  expect(assessed.status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  expect(assessed.canExport).toBe(true);
  expect(assessed.checks.every(c=>!c.hasShortage&&!c.sampleOutsideAllowance)).toBe(true);
  expect(assessed.message).toContain('NOT independent certification');
  const evidence=fabricAuditEvidence(input,'2026-11-06T09:00:00Z');
  expect(evidence).toMatchObject({
   kind:'user-reported-fabric-cutting-check',
   projectFingerprint:tag,
   importedCutCount:3,
   importedRollCount:2,
   userSelectedPieceDeviationAllowanceIn:1/16,
   sourceSnapshotIsCryptographicallyAuthenticated:false,
   independentPhysicalVerification:false,
   quiltCuttingApproval:false
  });
  expect(evidence.checks).toHaveLength(2);
 });
 it('keeps material shortages and piece errors exportable as negative physical evidence',()=>{
  const input=measured(pair());
  input.readings[0].actualUsableWofIn=42.99;
  expect(assessFabricAudit(input).status).toBe('USER_REPORTED_SHORTAGE_OR_DEVIATION');
  expect(assessFabricAudit(input).canExport).toBe(true);
  input.readings[0].actualUsableWofIn=43;
  input.readings[0].measuredPieceWidthIn=10+(1/16);
  expect(assessFabricAudit(input).status).toBe('USER_REPORTED_WITHIN_DECLARED_LIMITS');
  input.readings[0].measuredPieceWidthIn=10+(1/16)+.0001;
  expect(assessFabricAudit(input).status).toBe('USER_REPORTED_SHORTAGE_OR_DEVIATION');
  const evidence=fabricAuditEvidence(input,'2026-11-06T09:00:00Z');
  expect(evidence.checks[0].sampleOutsideAllowance).toBe(true);
  expect(evidence.quiltCuttingApproval).toBe(false);
 });
 it('requires real measurement date, postwash status and confirmations; unwashed is inconclusive',()=>{
  const input=measured(pair());
  input.physicallyMeasured=false;
  expect(assessFabricAudit(input).status).toBe('INCOMPLETE_USER_MEASUREMENTS');
  expect(()=>fabricAuditEvidence(input,'2026-11-06T09:00:00Z')).toThrow(/Complete/);
  input.physicallyMeasured=true;
  input.fabricCondition='not-postwashed';
  expect(assessFabricAudit(input).status).toBe('INCONCLUSIVE_NOT_POSTWASHED');
  input.fabricCondition='postwash';
  input.date='2026-02-31';
  expect(assessFabricAudit(input).canExport).toBe(false);
  input.date='2026-11-06';input.readings[0].measuredPieceHeightIn=undefined;
  expect(assessFabricAudit(input).canExport).toBe(false);
  input.readings[0].measuredPieceHeightIn=8;input.allowedPieceDeviationIn=5;
  expect(assessFabricAudit(input).canExport).toBe(false);
  input.allowedPieceDeviationIn=.0625;input.readings[0].actualUsableRunIn=0;
  expect(assessFabricAudit(input).canExport).toBe(false);
  input.readings[0].actualUsableRunIn=8;
  expect(assessFabricAudit(input).canExport).toBe(true);
 });
});
