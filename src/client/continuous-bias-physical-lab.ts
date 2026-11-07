import {createBiasSpecimenPrintSheet} from '../lib/quilt/continuous-bias-print-sheet';
import {
 SPECIMEN_CONFIGS,emptyBiasSpecimenObservation,auditBiasSpecimenObservation,
 type BiasSpecimenAudit,type BiasSpecimenId,type BiasSpecimenObservation
} from '../lib/quilt/continuous-bias-specimen-audit';
import {parseMeasure} from '../lib/quilt/math';

const make=(tag:string,content='',cls='')=>{
 const el=document.createElement(tag);
 if(content)el.textContent=content;
 if(cls)el.className=cls;
 return el;
};
const fmt=(value:number,digits=3)=>
 value.toLocaleString('en-US',{maximumFractionDigits:digits});
type RawDraft=Record<string,string>;
const NUMERIC_KEYS=[
 'measuredSquareWidthIn','measuredSquareHeightIn','measuredUsableWofIn',
 'tipOverhangStartIn','tipOverhangEndIn','firstFaceLongEdgeIn',
 'firstFaceHeightIn','observedFullBands','observedTubeCrossings',
 'maxMarkMismatchIn','measuredBandRunIn','untrimmedLengthIn',
 'startTrimLengthEquivalentIn','endTrimLengthEquivalentIn',
 'finishedCenterLengthIn','finishedLeftLengthIn','finishedRightLengthIn'
] as const;
const TEXT_KEYS=[
 'operatorCode','fabricDescription','prewashStatus','evidenceReferences'
] as const;
const BOOL_KEYS=['pressedSeamsOpen','continuousSingleLayerCut'] as const;
const SERIES_KEYS=['firstSeamSamplesIn','secondSeamSamplesIn','stripWidthSamplesIn','seamCrossingWidthSamplesIn'] as const;
const TOL_NUMERIC_KEYS=[
 'squareSideToleranceIn','seamAllowanceToleranceIn','tipOverhangToleranceIn',
 'faceDimensionToleranceIn','markMismatchToleranceIn','stripWidthToleranceIn',
 'lengthClosureToleranceIn'
] as const;
const bool=(raw:string):boolean|null=>{
 if(raw==='')return null;
 if(raw==='true')return true;
 if(raw==='false')return false;
 throw Error('Invalid yes/no observation token.');
};
function measure(value:string):number|null{
 return value.trim()===''?null:parseMeasure(value.trim());
}
function list(value:string):number[]|null{
 if(value.trim()==='')return null;
 const parts=value.split(/[;,\n]/).map(x=>x.trim());
 if(parts.some(p=>p===''))throw Error('Measurements separated by commas contain a missing value.');
 return parts.map(part=>parseMeasure(part));
}
function fromRaw(id:BiasSpecimenId,raw:RawDraft):BiasSpecimenObservation{
 const o=emptyBiasSpecimenObservation(id);
 const values=o as unknown as Record<string,unknown>;
 for(const key of NUMERIC_KEYS)values[key]=measure(raw[key]??'');
 for(const key of TEXT_KEYS)values[key]=raw[key]??'';
 for(const key of BOOL_KEYS)values[key]=bool(raw[key]??'');
 for(const key of SERIES_KEYS)values[key]=list(raw[key]??'');
 const tol=o.tolerances as unknown as Record<string,unknown>;
 for(const key of TOL_NUMERIC_KEYS)tol[key]=measure(raw[key]??'');
 tol.declaredBeforeCutting=bool(raw.declaredBeforeCutting??'');
 return o;
}
function toRaw(o:BiasSpecimenObservation):RawDraft{
 const raw:RawDraft={};
 const values=o as unknown as Record<string,unknown>;
 for(const key of NUMERIC_KEYS)raw[key]=values[key]===null?'':String(values[key]);
 for(const key of TEXT_KEYS)raw[key]=String(values[key]??'');
 for(const key of BOOL_KEYS)raw[key]=values[key]===null?'':String(values[key]);
 for(const key of SERIES_KEYS)raw[key]=Array.isArray(values[key])
  ?(values[key] as number[]).join(', '):'';
 const tol=o.tolerances as unknown as Record<string,unknown>;
 for(const key of TOL_NUMERIC_KEYS)raw[key]=tol[key]===null?'':String(tol[key]);
 raw.declaredBeforeCutting=tol.declaredBeforeCutting===null
  ?'':String(tol.declaredBeforeCutting);
 return raw;
}
function auditById(id:BiasSpecimenId,raw:RawDraft):BiasSpecimenAudit{
 const cfg=SPECIMEN_CONFIGS.find(s=>s.id===id)!;
 return auditBiasSpecimenObservation(cfg,fromRaw(id,raw));
}
function statusLine(output:HTMLElement,audit:BiasSpecimenAudit):void{
 output.replaceChildren();
 const p=make('p','','bias-physical-verdict');
 p.dataset.biasPhysicalVerdict=audit.status;
 const message:Record<BiasSpecimenAudit['status'],string>={
  NOT_RUN:'NOT_RUN — no actual cloth measurements or predeclared tolerances exist for this specimen.',
  INCOMPLETE:'INCOMPLETE — missing required observations, tolerances or evidence references.',
  OBSERVATION_HOLD:'OBSERVATION_HOLD — one or more recorded dimensions or process checks conflict with the model/protocol.',
  READY_FOR_HUMAN_REVIEW:'READY_FOR_HUMAN_REVIEW — input consistency ONLY. Physical evidence remains unverified; NOT approved for fabric purchasing.'
 };
 p.textContent=message[audit.status];output.appendChild(p);
 const metrics=make('div','','bias-plan-stats');
 for(const [label,value] of [
  ['Model full bands / tube crossings',
   audit.predicted.fullBands+' bands / '+audit.predicted.crossings+' crossings'],
  ['Model first-seam long edge / face height',
   fmt(audit.predicted.firstFaceLongEdgeIn)+' / '+fmt(audit.predicted.firstFaceHeightIn)+' in'],
  ['Model tube band run Q',fmt(audit.predicted.bandRunIn)+' in'],
  ['Modeled squared-end length — NOT actual yield',fmt(audit.predicted.squaredEndLengthIn)+' in'],
  ['Shortest of three actual finished lengths',
   audit.shortestObservedFinishedLengthIn===null?'NOT MEASURED':fmt(audit.shortestObservedFinishedLengthIn)+' in'],
  ['Model overstatement (positive means unsafe)',
   audit.modelOverstatementIn===null?'NOT MEASURED':fmt(audit.modelOverstatementIn)+' in']
 ] as const){
  const cell=make('div','','bias-plan-stat');
  cell.append(make('span',label),make('strong',value));metrics.appendChild(cell);
 }
 output.appendChild(metrics);
 if(audit.observedDiscrepancies.length){
  const heading=make('h3','Observed discrepancies — STOP & investigate');
  output.appendChild(heading);
  const ul=make('ul','','bias-physical-findings');
  for(const issue of audit.observedDiscrepancies)ul.append(make('li',issue));
  output.appendChild(ul);
 }
 if(audit.missingFields.length){
  const heading=make('h3','Missing actual measurements ('+audit.missingFields.length+')');
  output.appendChild(heading);
  const ul=make('ul','','bias-physical-missing');
  for(const field of audit.missingFields.slice(0,15))ul.append(make('li',field));
  if(audit.missingFields.length>15)
   ul.append(make('li','...and '+(audit.missingFields.length-15)+' additional fields.'));
  output.appendChild(ul);
 }
 output.appendChild(make('p',
  'Release gate: independent verification NOT RUN; human review NOT DONE; physical production yield NOT CERTIFIED; no safe-to-purchase yardage is issued. User-typed evidence references are NOT checked.',
  'warning-banner'));
}
export function initBiasPhysicalObservationLab():void{
 const root=document.querySelector<HTMLElement>('[data-bias-physical]');
 if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-bias-physical-form]')!;
 const select=root.querySelector<HTMLSelectElement>('[data-bias-physical-select]')!;
 const result=root.querySelector<HTMLElement>('[data-bias-physical-output]')!;
 const status=root.querySelector<HTMLElement>('[data-bias-physical-status]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-bias-physical-export]')!;
 const upload=root.querySelector<HTMLInputElement>('[data-bias-physical-import]')!;
 const printButton=root.querySelector<HTMLButtonElement>('[data-bias-physical-print]')!;
 const paper=root.querySelector<HTMLElement>('[data-bias-physical-paper]')!;
 const printError=root.querySelector<HTMLElement>('[data-bias-physical-print-error]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>(
  '[data-bias-obs], [data-bias-tolerance]')];
 const getKey=(field:HTMLElement)=>
  field.dataset.biasObs??field.dataset.biasTolerance??'';
 const keys=new Set(fields.map(getKey));
 const raws:Record<BiasSpecimenId,RawDraft>={
  A:toRaw(emptyBiasSpecimenObservation('A')),
  B:toRaw(emptyBiasSpecimenObservation('B')),
  C:toRaw(emptyBiasSpecimenObservation('C'))
 };
 let active:BiasSpecimenId='A';
 const readUI=():RawDraft=>{
  const draft:RawDraft={};
  for(const field of fields)draft[getKey(field)]=field.value;
  return draft;
 };
 const writeUI=(raw:RawDraft)=>{
  for(const field of fields)field.value=raw[getKey(field)]??'';
 };
 const saveCurrent=()=>{raws[active]=readUI();};
 // Print-sheet content is derived from the CURRENT raw form draft, not
 // from an implicitly trusted audit or synthetic model observation.
 const renderPrintSheet=():boolean=>{
  saveCurrent();
  // Fail closed BEFORE parsing. A stale printed record must NEVER survive an
  // invalid input or malformed imported draft.
  paper.replaceChildren();
  printButton.disabled=true;
  printError.textContent='';
  let sheet;
  try{
   sheet=createBiasSpecimenPrintSheet(active,raws[active]);
  }catch(error){
   const message=error instanceof Error?error.message:'Invalid observation';
   const warning=make('p',
    'PRINT BLOCKED — CURRENT FIELD RECORD INVALID. '+message+
    ' Correct the original form before printing. No earlier specimen sheet is retained.',
    'bias-print-error');
   warning.dataset.biasPrintBlocked='true';
   paper.replaceChildren(warning);
   printError.textContent='Print blocked: '+message+'. Correct the field before printing.';
   return false;
  }
  const headline=make('div','','bias-print-headline');
  headline.append(make('span','QUILT STUDIO · REAL FABRIC MEASUREMENT WORKSHEET'),
   make('strong','SPECIMEN '+active+' · UNVERIFIED FIELD RECORD'));
  paper.appendChild(headline);
  paper.appendChild(make('h2','Continuous bias tube · cloth specimen '+active));
  paper.appendChild(make('p',
   'For real fabric ONLY. Write measurements by hand or review typed values. '+
   'The sample configuration below is a numerical model, NOT an observed yield. '+
   'Printed, submitted or consistent numbers do NOT certify buying.',
   'bias-print-disclaimer'));
  const params=make('div','','bias-print-config');
  for(const [label,value] of [
   ['Nominal source square',fmt(sheet.nominalSideIn)+' × '+fmt(sheet.nominalSideIn)+' in'],
   ['Full cut strip width',fmt(sheet.nominalCutWidthIn)+' in'],
   ['Each edge seam allowance',fmt(sheet.nominalSeamIn)+' in'],
   ['Expected bands',String(sheet.expectedBands)+' (MODEL)'],
   ['Tube seam crossings',String(sheet.expectedTubeCrossings)+' (MODEL)'],
   ['Predicted squared-end length',fmt(sheet.modeledLengthIn)+' in (MODEL ONLY)']
  ] as const){
   const cell=make('div','','bias-print-config-cell');
   cell.append(make('span',label),make('strong',value));params.append(cell);
  }
  paper.appendChild(params);
  const stamp=make('p','','bias-print-record-status');
  stamp.dataset.biasPrintRecordStatus=sheet.enteredValueCount===0?'NOT_RUN':'UNVERIFIED_DRAFT';
  stamp.textContent=sheet.enteredValueCount===0
   ?'ACTUAL FABRIC MEASUREMENTS: NOT RUN — ALL OBSERVATION LINES ARE BLANK.'
   :'USER-ENTERED OBSERVATIONS: '+sheet.enteredValueCount+'/'+sheet.knownFieldCount+
    ' field groups started — NOT VERIFIED. Confirm all entries against physical ruler evidence.';
  paper.appendChild(stamp);
  if(sheet.hasInvalidSeriesCount)
   paper.appendChild(make('p',
    'INVALID SERIES COUNT — some pasted seam/width readings do not match the required checkpoint count. '+
    'Original typed series retained below. STOP and reconcile before auditing.',
    'bias-print-error'));
  const instruction=make('p',
   'FIELD PROCEDURE: declare all tolerances BEFORE cutting; measure all 5 points on EACH seam; '+
   'record width at the start/end + 10 equally spaced positions AND each N−1 tube crossing; '+
   'square both ends and measure all three final unstretched edge lengths. '+
   'Add photo/ruler references and repeat all failed trials.',
   'bias-print-guide');
  paper.appendChild(instruction);
  for(const section of sheet.sections){
   const group=make('section','','bias-print-section');
   group.dataset.biasPrintSection=section.title.slice(0,2);
   group.append(make('h3',section.title));
   const grid=make('div','','bias-print-field-grid');
   for(const field of section.fields){
    const item=make('div','','bias-print-field');
    item.dataset.biasPrintField=field.id;
    item.dataset.biasPrintSource=field.sourceKey;
    const label=make('span',field.label,'bias-print-label');
    const answer=make('span',field.rawValue||String.fromCharCode(160),'bias-print-answer');
    answer.dataset.biasPrintHasValue=field.rawValue?'true':'false';
    if(field.seriesCountMismatch)item.classList.add('bias-print-field--invalid');
    item.append(label,answer);grid.appendChild(item);
   }
   group.append(grid);paper.appendChild(group);
  }
  const signature=make('div','','bias-print-signature');
  for(const label of [
   'Physical test date/time (handwritten):',
   'Ruler-photo evidence verified by reviewer (handwritten):',
   'Operator / independent reviewer sign-off (handwritten):',
   'Investigation / rework notes (handwritten):'
  ])signature.append(make('p',label,'bias-print-sign-line'));
  paper.appendChild(signature);
  paper.appendChild(make('p',
   'RELEASE: NOT VERIFIED · HUMAN REVIEW REQUIRED · MODEL NOT SAFE TO PURCHASE · '+
   'NO APPROVED BIAS SEO. Printed records are user-authored notes, not independently authenticated evidence.',
   'bias-print-footer'));
  printButton.disabled=false;
  return true;
 };
 const matrix=()=>{
  for(const cfg of SPECIMEN_CONFIGS){
   const label=root.querySelector<HTMLElement>(
    '[data-bias-sample-status="'+cfg.id+'"]')!;
   try{label.textContent=auditById(cfg.id,raws[cfg.id]).status;}
   catch{label.textContent='INVALID_DRAFT';}
  }
 };
 const evaluate=()=>{
  saveCurrent();
  try{
   const report=auditById(active,raws[active]);
   status.textContent='Sample '+active+' / '+report.status+' · DATA IS USER-ENTERED, NOT INDEPENDENTLY VERIFIED.';
   statusLine(result,report);
  }catch(error){
   status.textContent='INVALID_DRAFT · enter a valid series or measurement.';
   result.replaceChildren(make('p',
    'Record rejected: '+(error instanceof Error?error.message:'Malformed observation')+
    ' No verification or purchasing result exists. You can export the raw draft to repair it later.',
    'warning-banner'));
  }
  matrix();renderPrintSheet();
 };
 const markStale=()=>{
  status.textContent='UNREVIEWED CHANGES · press Audit recorded measurements.';
  result.replaceChildren(make('p','Changed inputs are no longer audited. Run the audit before relying on the discrepancy display.','hint'));
  saveCurrent();matrix();renderPrintSheet();
 };
 fields.forEach(field=>field.addEventListener(
  field instanceof HTMLSelectElement?'change':'input',markStale));
 select.addEventListener('change',()=>{
  saveCurrent();
  active=select.value as BiasSpecimenId;
  writeUI(raws[active]);
  evaluate();
 });
 form.addEventListener('submit',event=>{event.preventDefault();evaluate();});
 printButton.addEventListener('click',()=>{
  if(renderPrintSheet())window.print();
 });
 window.addEventListener('beforeprint',renderPrintSheet);

 download.addEventListener('click',()=>{
  saveCurrent();
  const records=SPECIMEN_CONFIGS.map(cfg=>{
   try{
    const a=auditById(cfg.id,raws[cfg.id]);
    return {specimenId:cfg.id,auditStatus:a.status,prediction:a.predicted,
     missingFields:a.missingFields,discrepancies:a.observedDiscrepancies,
     overstatementIn:a.modelOverstatementIn,humanReviewCompleted:false,
     physicallyCertified:false,safeToPurchase:false};
   }catch{
    return {specimenId:cfg.id,auditStatus:'INVALID_DRAFT',humanReviewCompleted:false,
     physicallyCertified:false,safeToPurchase:false};
   }
  });
  const payload={
   format:'CONTINUOUS_BIAS_USER_OBSERVATION_DRAFT_V1',
   source:'UNVERIFIED_USER_TYPED_NOT_PHYSICAL_CERTIFICATION',
   humanReviewCompleted:false,physicallyCertified:false,safeToPurchase:false,
   note:'Ruler photos referenced by name are NOT uploaded or authenticated. Import re-audits only rawDrafts; derived report is never trusted.',
   rawDrafts:raws,auditsForReferenceOnly:records
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');anchor.href=url;
  anchor.download='BIAS-PHYSICAL-OBSERVATIONS-UNVERIFIED-DRAFT.json';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 upload.addEventListener('change',async()=>{
  const file=upload.files?.[0];
  if(!file)return;
  try{
   if(file.size>250_000)throw Error('JSON draft must be 250 KB or less.');
   const parsed:unknown=JSON.parse(await file.text());
   if(!parsed||typeof parsed!=='object')throw Error('Not a JSON observation draft.');
   const object=parsed as Record<string,unknown>;
   if(object.format!=='CONTINUOUS_BIAS_USER_OBSERVATION_DRAFT_V1')
    throw Error('Wrong JSON draft format.');
   if(!object.rawDrafts||typeof object.rawDrafts!=='object')
    throw Error('Missing raw specimen drafts.');
   const incoming=object.rawDrafts as Record<string,unknown>;
   const safe={} as Record<BiasSpecimenId,RawDraft>;
   for(const cfg of SPECIMEN_CONFIGS){
    const record=incoming[cfg.id];
    if(!record||typeof record!=='object')throw Error('Missing sample '+cfg.id);
    const values=record as Record<string,unknown>;
    const draft:RawDraft={};
    for(const key of keys){
     const value=values[key];
     if(typeof value!=='string'||value.length>1200)
      throw Error('Invalid draft field '+cfg.id+'.'+key);
     draft[key]=value;
    }
    // Prevent a malicious JSON from injecting a claimed PASS/verification
    // status. Only these typed raw fields are used; audit is recomputed.
    auditById(cfg.id,draft);
    safe[cfg.id]=draft;
   }
   for(const cfg of SPECIMEN_CONFIGS)raws[cfg.id]=safe[cfg.id];
   writeUI(raws[active]);evaluate();
   status.textContent+=' Previous report/approval fields in the JSON were ignored.';
  }catch(error){
   status.textContent='IMPORT REJECTED: '+(error instanceof Error?error.message:'Bad file');
  }finally{upload.value='';}
 });
 writeUI(raws.A);
 evaluate();
}
