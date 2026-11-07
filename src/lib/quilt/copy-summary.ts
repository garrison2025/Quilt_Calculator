/**
 * Plain-language copies of ACCEPTED calculation snapshots only.
 *
 * The snapshot is deliberately a concise communication aid, not a source for
 * cutting coordinates, an independent certification or a substitute for the
 * complete source-bound cutting-list CSV / JSON.
 */
export type CalculatorCopyStatus=
 'LISTED_CUTS_FEASIBLE'|'FIT_IMPOSSIBLE'|'TOP_CUT_LIST_NOT_REVIEWED'|
 'NO_PHYSICAL_CUTS'|'TOP_FABRIC_NOT_PLANNED'|'LENGTH_CONVERSION';
export type CopyFact={label:string;value:string};
export type CalculatorCopySnapshot={
 toolName:string;
 sourceProjectHash:string;
 calculationVersion:string;
 calculatedAt:string;
 status:CalculatorCopyStatus;
 isExample:boolean;
 context:string;
 figures:CopyFact[];
 materialRolls:CopyFact[];
 warnings:string[];
};
const singleLine=(input:string,max=260):string=>{
 if(typeof input!=='string')throw Error('Invalid summary text.');
 return input.replace(/[\x00-\x1f\x7f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
};
export function buildCalculatorCopySummary(s:CalculatorCopySnapshot):string{
 if(!/^[a-f0-9]{8}$/i.test(s.sourceProjectHash))throw Error('Invalid calculation source tag.');
 if(!/^v[0-9]+(?:\.[0-9]+)*$/.test(s.calculationVersion))
  throw Error('Invalid calculator version.');
 if(!Number.isFinite(Date.parse(s.calculatedAt))||!s.calculatedAt.endsWith('Z'))
  throw Error('Invalid calculation timestamp.');
 if(!(['LISTED_CUTS_FEASIBLE','FIT_IMPOSSIBLE','TOP_CUT_LIST_NOT_REVIEWED',
  'NO_PHYSICAL_CUTS','TOP_FABRIC_NOT_PLANNED','LENGTH_CONVERSION'] as string[]).includes(s.status))
  throw Error('Unknown copy-readiness state.');
 for(const v of [s.figures,s.materialRolls,s.warnings])
  if(!Array.isArray(v))throw Error('Missing calculated summary facts.');
 if(!s.figures.length)throw Error('Cannot copy a blank calculation.');
 const lines=[
  'QUILT STUDIO — '+singleLine(s.toolName,90),
  'Source project: '+s.sourceProjectHash+' (short change-detection tag, NOT a digital signature)',
  'Calculation: '+s.calculationVersion+' · '+s.calculatedAt,
  'Measurement context: '+singleLine(s.context),
  'Readiness: '+s.status,
  s.isExample?'SAMPLE PROJECT — replace all illustrative dimensions, fabrics and quantities.':
   'USER-ENTERED PROJECT — verify all measurements, grain, seam and fabric requirements.',
  s.status==='LENGTH_CONVERSION'
   ?'LENGTH CONVERSION ONLY — no fabric width, cutting layout, yardage purchase or price inferred.'
   :s.status==='LISTED_CUTS_FEASIBLE'
    ?'COMPUTED CUT LAYOUT FEASIBLE for entered values; NOT independently sewn or certified.'
    :'INCOMPLETE / UNFEASIBLE / UNREVIEWED — NOT A PURCHASE ORDER. Check the live calculator.',
  '',
  'CURRENT RESULTS'
 ];
 const facts=s.figures.slice(0,28);
 for(const item of facts)lines.push('- '+singleLine(item.label,110)+': '+singleLine(item.value));
 if(s.figures.length>28)
  lines.push('... More result metrics exist. See the original calculator and export JSON.');
 if(s.materialRolls.length){
  lines.push('','MATERIAL ROLLS (each SKU remains independent)');
  for(const item of s.materialRolls.slice(0,35))
   lines.push('- '+singleLine(item.label,110)+': '+singleLine(item.value));
  if(s.materialRolls.length>35)
   lines.push('... Additional material rolls are not shown; use the complete CSV.');
 }
 if(s.warnings.length){
  lines.push('','WARNINGS / LIMITS');
  for(const msg of s.warnings.slice(0,12))lines.push('- '+singleLine(msg,500));
  if(s.warnings.length>12)lines.push('... More warnings are visible on the calculator.');
 }
 lines.push('',
  'This is a brief, user-shareable calculation SUMMARY, not a 1:1 pattern,',
  'cutting instruction set, fabric test, verified shopping order or final quote.',
  'Use the source-matched downloaded cutting-list CSV and JSON for full details.',
  'Bias binding, mitered borders and unsupported constructions remain HOLD.'
 );
 return lines.join('\n');
}
