import {describe,expect,it} from 'vitest';
import {
 PRINT_REFERENCES, evaluatePrintCalibration, printCalibrationEvidence,
 type PrintCalibrationInput
} from '../src/lib/quilt/print-calibration';

function record():PrintCalibrationInput{
 return {
  readingsMm:{squareWidth:25.4,squareHeight:25.4,metricLine:100,imperialLine:152.4},
  printer:'Sample printer entered by user',paper:'A4',scaleMode:'actual-size',
  measuredOn:'2026-11-06',reviewer:'',physicallyMeasured:true
 };
}

describe('local, user-reported physical print-scale record',()=>{
 it('keeps all four physical references and requested suggested tolerances',()=>{
  expect(Object.entries(PRINT_REFERENCES).map(([key,r])=>[key,r.expectedMm,r.toleranceMm])).toEqual([
   ['squareWidth',25.4,0.5],['squareHeight',25.4,0.5],
   ['metricLine',100,1],['imperialLine',152.4,1]
  ]);
 });
 it('classifies a complete self-report within tolerance without claiming independent certification',()=>{
  const result=evaluatePrintCalibration(record());
  expect(result.status).toBe('USER_REPORTED_WITHIN_TOLERANCE');
  expect(result.canExport).toBe(true);
  expect(result.checks.every(x=>x.withinTolerance===true && x.differenceMm===0)).toBe(true);
  expect(result.message).toMatch(/NOT independently certified/);
  const evidence=printCalibrationEvidence(record(),'2026-11-06T08:00:00.000Z');
  expect(evidence.kind).toBe('user-reported-physical-print-scale-check');
  expect(evidence.recordedAtUtc).toBe('2026-11-06T08:00:00.000Z');
  expect(evidence.selfReportedStatus).toBe('USER_REPORTED_WITHIN_TOLERANCE');
  expect(evidence.independentPhysicalVerification).toBe(false);
  expect(evidence.quiltCuttingApproval).toBe(false);
 });
 it('accepts exact tolerance boundaries but reports a just-outside measurement',()=>{
  const r=record();
  r.readingsMm={squareWidth:25.9,squareHeight:24.9,metricLine:101,imperialLine:151.4};
  expect(evaluatePrintCalibration(r).status).toBe('USER_REPORTED_WITHIN_TOLERANCE');
  r.readingsMm.squareHeight=24.89;
  const failed=evaluatePrintCalibration(r);
  expect(failed.status).toBe('USER_REPORTED_OUTSIDE_TOLERANCE');
  expect(failed.checks.find(x=>x.key==='squareHeight')?.withinTolerance).toBe(false);
  expect(failed.canExport).toBe(true); // Retain negative findings as evidence.
 });
 it('blocks incomplete input, unconfirmed physical measurements and printer metadata',()=>{
  const r=record();r.physicallyMeasured=false;
  expect(evaluatePrintCalibration(r).status).toBe('INCOMPLETE_MANUAL_RECORD');
  expect(evaluatePrintCalibration(r).missing).toContain('Physical ruler measurement confirmation');
  expect(()=>printCalibrationEvidence(r,'2026-11-06T08:00:00Z')).toThrow(/Complete and confirm/);
  r.physicallyMeasured=true;r.printer='';
  expect(evaluatePrintCalibration(r).canExport).toBe(false);
  r.printer='test';r.measuredOn='2026-02-31';
  expect(evaluatePrintCalibration(r).missing).toContain('Actual measurement date');
  r.measuredOn='2026-11-06';r.readingsMm.metricLine=undefined;
  expect(evaluatePrintCalibration(r).missing.join(' ')).toMatch(/100-mm reference/);
  for(const invalid of [Number.NaN,Infinity,0,-1,501]){
   r.readingsMm.metricLine=invalid;
   expect(evaluatePrintCalibration(r).canExport, String(invalid)).toBe(false);
  }
 });
 it('other or unknown print scale cannot be declared within tolerance even if readings look perfect',()=>{
  const r=record();r.scaleMode='other';
  const result=evaluatePrintCalibration(r);
  expect(result.status).toBe('INCONCLUSIVE_NON_ACTUAL_SIZE');
  expect(result.canExport).toBe(true);
  expect(result.message).toMatch(/Reprint/);
  const evidence=printCalibrationEvidence(r,'2026-11-06T08:00:00Z');
  expect(evidence.selfReportedStatus).toBe('INCONCLUSIVE_NON_ACTUAL_SIZE');
  expect(evidence.independentPhysicalVerification).toBe(false);
 });
 it('does not send data to a server or generate a signed physical pass result',()=>{
  const r=record();r.reviewer='Manual quality reviewer';
  const result=printCalibrationEvidence(r,'2026-11-06T08:00:00Z');
  const text=JSON.stringify(result);
  expect(text).toContain('Manual quality reviewer');
  expect(text).not.toContain('INDEPENDENTLY_VERIFIED');
  expect(result.userConfirmedPhysicalRulerMeasurement).toBe(true);
  expect(result.explanation).toMatch(/self-report/);
 });
});
