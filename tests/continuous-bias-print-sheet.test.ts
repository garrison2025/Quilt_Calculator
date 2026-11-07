import {describe,it,expect} from 'vitest';
import {
 createBiasSpecimenPrintSheet
} from '../src/lib/quilt/continuous-bias-print-sheet';
import {
 SPECIMEN_CONFIGS,emptyBiasSpecimenObservation,
 type BiasSpecimenId
} from '../src/lib/quilt/continuous-bias-specimen-audit';

function rawEmpty(id:BiasSpecimenId):Record<string,string>{
 const obs=emptyBiasSpecimenObservation(id);
 return Object.fromEntries([
  ...Object.entries(obs).filter(([k])=>k!=='specimenId'&&k!=='tolerances')
   .map(([k,v])=>[k,Array.isArray(v)?v.join(','):v===null?'':String(v)]),
  ...Object.entries(obs.tolerances).map(([k,v])=>[k,v===null?'':String(v)])
 ]);
}
describe('noncertifying print-ready field measurement records',()=>{
 it('starts A/B/C with truly BLANK measured fields, but clear numeric MODEL labels',()=>{
  for(const cfg of SPECIMEN_CONFIGS){
   const sheet=createBiasSpecimenPrintSheet(cfg.id,rawEmpty(cfg.id));
   expect(sheet.specimenId).toBe(cfg.id);
   expect(sheet.nominalSideIn).toBe(cfg.sourceSquareSideIn);
   expect(sheet.nominalCutWidthIn).toBe(cfg.fullStripCutWidthIn);
   expect(sheet.nominalSeamIn).toBe(cfg.seamAllowanceIn);
   expect(sheet.enteredValueCount).toBe(0);
   expect(sheet.sections.flatMap(s=>s.fields).every(f=>f.rawValue==='')).toBe(true);
   expect(sheet.hasInvalidSeriesCount).toBe(false);
   expect(sheet.safeToPurchase).toBe(false);
   expect(sheet.physicallyCertified).toBe(false);
   expect(sheet.status).toBe('UNVERIFIED_USER_ENTRY_OR_BLANK_HANDWRITTEN_FIELD_RECORD');
  }
 });
 it.each([['A',7,8],['B',6,7],['C',5,6]] as const)(
  'records all 12 distributed width checkpoints AND %s crossing widths', (id,crossings,bands)=>{
   const sheet=createBiasSpecimenPrintSheet(id,rawEmpty(id));
   expect(sheet.expectedBands).toBe(bands);
   expect(sheet.expectedTubeCrossings).toBe(crossings);
   const dist=sheet.sections.find(s=>s.title.startsWith('05'))!;
   const seam=sheet.sections.find(s=>s.title.startsWith('06'))!;
   expect(dist.fields.length).toBe(12);
   expect(seam.fields.length).toBe(crossings);
   expect(dist.fields.map(f=>f.id)).toEqual(
    Array.from({length:12},(_,i)=>'stripWidthSamplesIn-'+(i+1)));
   expect(seam.fields.map(f=>f.id)).toEqual(
    Array.from({length:crossings},(_,i)=>'seamCrossingWidthSamplesIn-'+(i+1)));
  }
 );
 it('includes EVERY existing audit field exactly once, including predeclared tolerances',()=>{
  for(const cfg of SPECIMEN_CONFIGS){
   const sheet=createBiasSpecimenPrintSheet(cfg.id,rawEmpty(cfg.id));
   expect(sheet.knownFieldCount).toBeGreaterThan(30);
   const all=new Set(sheet.sections.flatMap(s=>s.fields.map(f=>f.sourceKey)));
   expect(all.size).toBe(sheet.knownFieldCount);
   for(const key of [
    'declaredBeforeCutting','firstSeamSamplesIn','secondSeamSamplesIn',
    'stripWidthSamplesIn','seamCrossingWidthSamplesIn',
    'finishedCenterLengthIn','finishedLeftLengthIn','finishedRightLengthIn',
    'startTrimLengthEquivalentIn','endTrimLengthEquivalentIn',
    'continuousSingleLayerCut','evidenceReferences'
   ])expect(all.has(key)).toBe(true);
  }
 });
 it('prints entered raw measurements without inventing missing samples',()=>{
  const raw=rawEmpty('A');
  raw.operatorCode='operator-42';raw.finishedCenterLengthIn='319.875';
  raw.firstSeamSamplesIn='0.24,0.25,0.25,0.26,0.24';
  const sheet=createBiasSpecimenPrintSheet('A',raw);
  expect(sheet.enteredValueCount).toBe(3);
  const print=sheet.sections.flatMap(s=>s.fields);
  expect(print.find(f=>f.id==='operatorCode')?.rawValue).toBe('operator-42');
  expect(print.find(f=>f.id==='finishedCenterLengthIn')?.rawValue).toBe('319.875');
  expect(print.find(f=>f.id==='finishedLeftLengthIn')?.rawValue).toBe('');
  expect(print.filter(f=>f.sourceKey==='firstSeamSamplesIn').map(f=>f.rawValue))
   .toEqual(['0.24','0.25','0.25','0.26','0.24']);
  expect(sheet.safeToPurchase).toBe(false);
 });
 it('flags short or surplus width/allowance CSV instead of concealing raw values',()=>{
  const raw=rawEmpty('A');
  raw.seamCrossingWidthSamplesIn='2.5,2.5';
  let sheet=createBiasSpecimenPrintSheet('A',raw);
  expect(sheet.hasInvalidSeriesCount).toBe(true);
  let entries=sheet.sections.find(s=>s.title.startsWith('06'))!.fields;
  expect(entries).toHaveLength(8); // 7 slots + explicit mismatch full source row
  expect(entries[2].rawValue).toBe('');
  expect(entries[7].rawValue).toBe('2.5,2.5');
  raw.seamCrossingWidthSamplesIn=Array(8).fill('2.5').join(',');
  sheet=createBiasSpecimenPrintSheet('A',raw);
  expect(sheet.hasInvalidSeriesCount).toBe(true);
  entries=sheet.sections.find(s=>s.title.startsWith('06'))!.fields;
  expect(entries).toHaveLength(8);
  expect(entries[7].rawValue).toBe(raw.seamCrossingWidthSamplesIn);
 });
 it('cannot render unknown specimens or malformed imported raw field value types',()=>{
  expect(()=>createBiasSpecimenPrintSheet('D' as BiasSpecimenId,{})).toThrow(/Unknown/);
  const raw=rawEmpty('C');
  raw.finishedRightLengthIn=Infinity as unknown as string;
  expect(()=>createBiasSpecimenPrintSheet('C',raw)).toThrow(/Invalid/);
  raw.finishedRightLengthIn='x'.repeat(1201);
  expect(()=>createBiasSpecimenPrintSheet('C',raw)).toThrow(/Invalid/);
 });
});
