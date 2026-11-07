/**
 * Audit-complete PRINTABLE FIELD RECORD schema for real cloth specimens.
 *
 * PRINTING IS NOT CERTIFICATION. These labels cover every user observation
 * field in continuous-bias-specimen-audit.ts. No observation is pre-populated
 * from the model. 12 distributed width readings AND all N-1 seam crossing
 * widths have dedicated handwritten checkpoints.
 */
import {
 SPECIMEN_CONFIGS,emptyBiasSpecimenObservation,auditBiasSpecimenObservation,
 type BiasSpecimenConfig,type BiasSpecimenId
} from './continuous-bias-specimen-audit';

export type BiasPrintField={
 id:string;
 sourceKey:string;
 label:string;
 rawValue:string;
 /** Original CSV series count mismatch is visible on paper, never hidden. */
 seriesCountMismatch:boolean;
};
export type BiasPrintSection={title:string;fields:BiasPrintField[]};
export type BiasSpecimenPrintSheet={
 specimenId:BiasSpecimenId;
 nominalSideIn:number;
 nominalCutWidthIn:number;
 nominalSeamIn:number;
 expectedBands:number;
 expectedTubeCrossings:number;
 modeledLengthIn:number;
 sections:BiasPrintSection[];
 enteredValueCount:number;
 knownFieldCount:number;
 hasInvalidSeriesCount:boolean;
 /** The printable sheet never promotes manually entered data to evidence. */
 status:'UNVERIFIED_USER_ENTRY_OR_BLANK_HANDWRITTEN_FIELD_RECORD';
 safeToPurchase:false;
 physicallyCertified:false;
};
type LabelPair=readonly [key:string,label:string];
const PREDECLARED:readonly LabelPair[]=[
 ['declaredBeforeCutting','Were ALL tolerances declared BEFORE cutting? (yes/no)'],
 ['squareSideToleranceIn','Max source square side deviation (in)'],
 ['seamAllowanceToleranceIn','Max allowance deviation on EACH seam (in)'],
 ['tipOverhangToleranceIn','Max first-seam tip overhang deviation (in)'],
 ['faceDimensionToleranceIn','Max sewn-face/run deviation (in)'],
 ['markMismatchToleranceIn','Max tube stitch-line mark mismatch (in)'],
 ['stripWidthToleranceIn','Max final strip width deviation (in)'],
 ['lengthClosureToleranceIn','Max trim/length ledger closure error (in)']
];
const FABRIC:readonly LabelPair[]=[
 ['operatorCode','Operator code (avoid personal data)'],
 ['fabricDescription','Weave, treatment, material description'],
 ['prewashStatus','Prewash state (prewashed / not prewashed)'],
 ['evidenceReferences','Ruler photos / reference filenames or URLs'],
 ['measuredSquareWidthIn','Actually cut square side X (in)'],
 ['measuredSquareHeightIn','Actually cut square side Y (in)'],
 ['measuredUsableWofIn','Actually measured usable WOF (in)']
];
const FIRST:readonly LabelPair[]=[
 ['tipOverhangStartIn','First tip overhang (in)'],
 ['tipOverhangEndIn','Second tip overhang (in)'],
 ['firstFaceLongEdgeIn','First-seam face long edge after pressing (in)'],
 ['firstFaceHeightIn','First-seam perpendicular height (in)']
];
const TUBE:readonly LabelPair[]=[
 ['observedFullBands','Actual COMPLETE full-width marked lanes (integer)'],
 ['observedTubeCrossings','Actual tube seam cut-line crossings (integer)'],
 ['maxMarkMismatchIn','Largest stitch-line mark mismatch (in)'],
 ['measuredBandRunIn','Actually measured tube full-band run Q (in)'],
 ['pressedSeamsOpen','BOTH seams pressed open? (yes/no)']
];
const FINISH:readonly LabelPair[]=[
 ['continuousSingleLayerCut','One continuous cut through ONE cloth layer? (yes/no)'],
 ['untrimmedLengthIn','Unstretched strip length BEFORE end trimming (in)'],
 ['startTrimLengthEquivalentIn','Length-equivalent start end trim (in)'],
 ['endTrimLengthEquivalentIn','Length-equivalent finish end trim (in)'],
 ['finishedCenterLengthIn','After-trim strip CENTER length, no tension (in)'],
 ['finishedLeftLengthIn','After-trim strip LEFT-edge length, no tension (in)'],
 ['finishedRightLengthIn','After-trim strip RIGHT-edge length, no tension (in)']
];
function rawField(raw:Record<string,string>,key:string,label:string):BiasPrintField{
 const value=raw[key]??'';
 if(typeof value!=='string'||value.length>1200)throw Error('Invalid printable observation '+key+'.');
 return {id:key,sourceKey:key,label,rawValue:value.trim(),seriesCountMismatch:false};
}
function series(
 raw:Record<string,string>,key:string,label:string,count:number
):BiasPrintField[]{
 const original=raw[key]??'';
 if(typeof original!=='string'||original.length>1200)
  throw Error('Invalid printable series '+key+'.');
 const parts=original.trim()?original.split(/[;,\n]/).map(v=>v.trim()):[];
 const mismatch=parts.length>0&&(parts.length!==count||parts.some(v=>v===''));
 const entries=Array.from({length:count},(_,i)=>({
  id:key+'-'+(i+1),sourceKey:key,
  label:label+' '+(i+1)+' / '+count,
  rawValue:parts[i]??'',
  seriesCountMismatch:mismatch
 }));
 // Preserve all original characters and surplus readings if an imported draft
 // has too many elements. A printed record must not silently drop evidence.
 if(mismatch)entries.push({
  id:key+'-series-warning',sourceKey:key,
  label:'WARNING: expected '+count+' values; original typed series (RECHECK)',
  rawValue:original,seriesCountMismatch:true
 });
 return entries;
}
export function createBiasSpecimenPrintSheet(
 id:BiasSpecimenId,raw:Record<string,string>
):BiasSpecimenPrintSheet{
 const cfg:BiasSpecimenConfig|undefined=SPECIMEN_CONFIGS.find(s=>s.id===id);
 if(!cfg)throw Error('Unknown printable specimen.');
 const model=auditBiasSpecimenObservation(cfg,emptyBiasSpecimenObservation(id)).predicted;
 const fields=(labels:readonly LabelPair[])=>labels.map(([key,label])=>rawField(raw,key,label));
 const sections:BiasPrintSection[]=[
  {title:'01 · Predeclare measurement tolerances BEFORE touching fabric',
   fields:fields(PREDECLARED)},
  {title:'02 · Source fabric, operator and ruler evidence',
   fields:fields(FABRIC)},
  {title:'03 · First triangle-assembly seam (actual measurements)',
   fields:[...series(raw,'firstSeamSamplesIn','First-seam allowance (in) at position',5),...fields(FIRST)]},
  {title:'04 · Second tube seam and continuity',
   fields:[...series(raw,'secondSeamSamplesIn','Tube-seam allowance (in) at position',5),...fields(TUBE)]},
  {title:'05 · Width at start/end + TEN evenly spaced positions',
   fields:series(raw,'stripWidthSamplesIn','Distributed full-cut strip width (in), position',12)},
  {title:'06 · Width at EVERY physical tube-seam crossing (N−1)',
   fields:series(raw,'seamCrossingWidthSamplesIn','Crossing full-cut width (in), position',
    model.crossings)},
  {title:'07 · Spiral cutting, both end trims and final unstretched yield',
   fields:fields(FINISH)}
 ];
 const observedKeys=new Set(sections.flatMap(s=>s.fields.map(f=>f.sourceKey)));
 const reference=emptyBiasSpecimenObservation(id);
 const expectedKeys=[
  ...Object.keys(reference).filter(k=>k!=='specimenId'&&k!=='tolerances'),
  ...Object.keys(reference.tolerances)
 ];
 const missing=expectedKeys.filter(k=>!observedKeys.has(k));
 const extra=[...observedKeys].filter(k=>!expectedKeys.includes(k));
 if(missing.length||extra.length)
  throw Error('Printed worksheet omits/overstates observation fields: '+missing.join(',')+'/'+extra.join(','));
 return {
  specimenId:id,
  nominalSideIn:cfg.sourceSquareSideIn,
  nominalCutWidthIn:cfg.fullStripCutWidthIn,
  nominalSeamIn:cfg.seamAllowanceIn,
  expectedBands:model.fullBands,
  expectedTubeCrossings:model.crossings,
  modeledLengthIn:model.squaredEndLengthIn,
  sections,
  enteredValueCount:expectedKeys.filter(k=>(raw[k]??'').trim().length>0).length,
  knownFieldCount:expectedKeys.length,
  hasInvalidSeriesCount:sections.some(s=>s.fields.some(f=>f.seriesCountMismatch)),
  status:'UNVERIFIED_USER_ENTRY_OR_BLANK_HANDWRITTEN_FIELD_RECORD',
  safeToPurchase:false,physicallyCertified:false
 };
}
