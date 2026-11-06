/** User-entered *physical* measurements; none are inferred from screen or PDF pixels.
 * These are suggested engineering tolerances, not a third-party certification.
 */
export const PRINT_REFERENCES = {
  squareWidth: { label:'One-inch square — width', expectedMm:25.4, toleranceMm:0.5 },
  squareHeight: { label:'One-inch square — height', expectedMm:25.4, toleranceMm:0.5 },
  metricLine: { label:'100-mm reference line', expectedMm:100, toleranceMm:1 },
  imperialLine: { label:'Six-inch reference line', expectedMm:152.4, toleranceMm:1 }
} as const;
export type PrintReferenceKey = keyof typeof PRINT_REFERENCES;
export type PrintScaleMode = 'actual-size' | 'other' | '';
export type PrintCalibrationInput = {
  readingsMm: Record<PrintReferenceKey, number|undefined>;
  printer: string;
  paper: string;
  scaleMode: PrintScaleMode;
  measuredOn: string;
  reviewer: string;
  physicallyMeasured: boolean;
};
export type PrintCalibrationStatus =
  | 'INCOMPLETE_MANUAL_RECORD'
  | 'INCONCLUSIVE_NON_ACTUAL_SIZE'
  | 'USER_REPORTED_WITHIN_TOLERANCE'
  | 'USER_REPORTED_OUTSIDE_TOLERANCE';
export type PrintCalibrationResult = {
  status: PrintCalibrationStatus;
  canExport: boolean;
  message: string;
  checks: {key:PrintReferenceKey;label:string;expectedMm:number;toleranceMm:number;actualMm?:number;differenceMm?:number;withinTolerance?:boolean}[];
  missing: string[];
};
const referenceKeys = Object.keys(PRINT_REFERENCES) as PrintReferenceKey[];
export function evaluatePrintCalibration(input:PrintCalibrationInput):PrintCalibrationResult {
 const missing:string[]=[];
 if(!input.printer.trim())missing.push('Printer / driver');
 if(!input.paper.trim())missing.push('Paper size');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.measuredOn) ||
  Number.isNaN(Date.parse(input.measuredOn)) ||
  new Date(input.measuredOn).toISOString().slice(0,10)!==input.measuredOn)
  missing.push('Actual measurement date');
 if(input.scaleMode!=='actual-size' && input.scaleMode!=='other')missing.push('Print scaling');
 if(!input.physicallyMeasured)missing.push('Physical ruler measurement confirmation');
 const checks:PrintCalibrationResult['checks']=referenceKeys.map(key=>{
  const ref=PRINT_REFERENCES[key];
  const value=input.readingsMm[key];
  if(value===undefined || !Number.isFinite(value) || value<=0 || value>500){
   missing.push(ref.label+' (valid millimeters, 0–500)');
   return {key,label:ref.label,expectedMm:ref.expectedMm,toleranceMm:ref.toleranceMm};
  }
  const differenceMm=Math.abs(value-ref.expectedMm);
  return {key,label:ref.label,expectedMm:ref.expectedMm,toleranceMm:ref.toleranceMm,
   actualMm:value,differenceMm,withinTolerance:differenceMm<=ref.toleranceMm+1e-9};
 });
 if(missing.length)return {
  status:'INCOMPLETE_MANUAL_RECORD',canExport:false,
  message:'Incomplete: supply real-paper ruler readings and the printer, paper, date, print scale and physical-measurement confirmation. No physical sign-off is inferred.',
  checks,missing
 };
 if(input.scaleMode==='other')return {
  status:'INCONCLUSIVE_NON_ACTUAL_SIZE',canExport:true,
  message:'Inconclusive: the printer was not set to 100% / Actual size, or its setting is unknown. Reprint at Actual size and remeasure. This record is only user supplied.',
  checks,missing
 };
 if(checks.some(check=>check.withinTolerance===false))return {
  status:'USER_REPORTED_OUTSIDE_TOLERANCE',canExport:true,
  message:'User-reported measurements exceed at least one suggested tolerance. Change print settings and repeat; this is NOT a physical sign-off.',
  checks,missing
 };
 return {
  status:'USER_REPORTED_WITHIN_TOLERANCE',canExport:true,
  message:'All four user-reported measurements fall within suggested tolerances. This is a manual self-report, NOT independently certified printer calibration or quilt cutting approval.',
  checks,missing
 };
}
/** Records can be downloaded locally; nothing is transmitted to the site. */
export function printCalibrationEvidence(input:PrintCalibrationInput,recordedAtUtc:string){
 const result=evaluatePrintCalibration(input);
 if(!result.canExport)throw Error('Complete and confirm the physical ruler measurement record before exporting.');
 return {
  schemaVersion:1,
  kind:'user-reported-physical-print-scale-check',
  recordedAtUtc,
  measuredOn:input.measuredOn,
  printer:input.printer.trim(),
  paper:input.paper.trim(),
  printScale:input.scaleMode==='actual-size'?'100% / Actual size':'Other / unknown',
  reviewer:input.reviewer.trim(),
  userConfirmedPhysicalRulerMeasurement:input.physicallyMeasured,
  measurements:result.checks,
  selfReportedStatus:result.status,
  explanation:result.message,
  independentPhysicalVerification:false,
  quiltCuttingApproval:false,
  note:'User-entered measurements only. A downloaded record does not establish independent physical sign-off.'
 };
}
