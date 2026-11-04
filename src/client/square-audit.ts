import {auditSquareTrial,type SquareTrialAudit,type SquareTrialMeasurements} from '../lib/quilt/square-audit';
import {parseMeasure} from '../lib/quilt/math';
import {csvDocument} from '../lib/quilt/cutlist';
const el=(tag:string,txt='')=>{const x=document.createElement(tag);x.textContent=txt;return x;};
const fmt=(x:number)=>x.toLocaleString('en-US',{maximumFractionDigits:4});
export function initSquareAudit():void{
 const root=document.querySelector<HTMLElement>('[data-square-test-audit]');if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-square-audit-form]')!;
 const output=root.querySelector<HTMLElement>('[data-square-audit-results]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-square-audit-download]')!;
 const trialStatus=document.querySelector<HTMLElement>('[data-square-status]')!;
 const finishedInput=document.querySelector<HTMLInputElement>('[data-square-input="finishedOuterIn"]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement>('[data-square-audit-field]')];
 let result:SquareTrialAudit|null=null;
 const reset=(message='Not evaluated — measurements need to be entered and checked.')=>{
  result=null;download.disabled=true;output.replaceChildren(el('p',message));
 };
 function paint(a:SquareTrialAudit):void{
  output.replaceChildren();
  const headline=el('p',a.reportedWithinTolerance
   ?'Your entered measurements meet this worksheet screening criterion. This is NOT independent verification.'
   :'One or more entered measurements are outside the chosen tolerance. Adjust, sew and measure another test block.');
  headline.className=a.reportedWithinTolerance?'square-audit-selfpass':'warning-banner error-banner';
  output.appendChild(headline);
  const wrap=el('div');wrap.className='table-scroll';
  const table=document.createElement('table');table.className='breakdown-table square-audit-table';
  table.setAttribute('aria-label','User-entered sewn block measurements and deviations');
  const caption=el('caption','Target unfinished: '+fmt(a.targetUnfinishedIn)+' in · target point margin: 0.25 in · screening ±'+fmt(a.toleranceIn)+' in');
  table.appendChild(caption);
  const head=document.createElement('thead'),tr=document.createElement('tr');
  for(const t of ['Measurement','Entered','Target','Difference','Screening'])tr.appendChild(el('th',t));
  head.appendChild(tr);table.appendChild(head);
  const tbody=document.createElement('tbody');
  for(const c of a.checks){
   const row=document.createElement('tr');
   for(const t of [c.label,fmt(c.measuredIn)+' in',fmt(c.targetIn)+' in',
    (c.deviationIn>=0?'+':'')+fmt(c.deviationIn)+' in',c.withinTolerance?'Within tolerance':'Needs adjustment'])
     row.appendChild(el('td',t));
   tbody.appendChild(row);
  }
  table.appendChild(tbody);wrap.appendChild(table);output.appendChild(wrap);
  const warning=el('p',a.disclaimer);warning.className='footer-note';output.appendChild(warning);
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();reset('Evaluating entered measurements…');
  fields.forEach(field=>field.setAttribute('aria-invalid','false'));
  try{
   if(!trialStatus.textContent?.includes('Calculated preview · independent rolls verified'))
    throw Error('First calculate a physically feasible trial parent-square plan. Measurements from a different design cannot be checked here.');
   const values={} as Record<string,number>;
   for(const field of fields){
    if(!field.value.trim()){field.setAttribute('aria-invalid','true');throw Error('Enter all six actually measured values; blank fields do not pass.');}
    try{values[field.dataset.squareAuditField!]=parseMeasure(field.value.trim());}
    catch{field.setAttribute('aria-invalid','true');throw Error('Invalid measurement: '+field.labels?.[0]?.textContent);}
   }
   const measured={targetFinishedIn:parseMeasure(finishedInput.value),...values} as SquareTrialMeasurements;
   result=auditSquareTrial(measured);
   paint(result);download.disabled=false;
  }catch(e){const item=el('p',e instanceof Error?e.message:'Could not check these measurements.');item.className='warning-banner error-banner';output.replaceChildren(item);}
 });
 for(const field of fields)field.addEventListener('input',()=>{
  field.setAttribute('aria-invalid','false');
  reset('Measurements changed. Recheck the block before downloading a record.');
 });
 document.querySelectorAll('[data-square-input]').forEach(field=>field.addEventListener('input',()=>{
  form.reset();reset('Trial cutting settings changed. Enter measurements from a new practice block.');
 }));
 download.addEventListener('click',()=>{
  if(!result||download.disabled)return;
  const rows:(string|number)[][]=[
   ['Record','USER-REPORTED ONE-BLOCK MEASUREMENT · NOT INDEPENDENTLY CERTIFIED'],
   ['Screening',result.reportedWithinTolerance?'REPORTED_VALUES_WITHIN_TOLERANCE':'REPORTED_VALUES_OUTSIDE_TOLERANCE'],
   ['Finished block target (in)',result.measurements.targetFinishedIn],
   ['Target unfinished (in)',result.targetUnfinishedIn],
   ['Target point-to-raw-edge margin (in)',result.pointMarginIn],
   ['Screening tolerance (in)',result.toleranceIn],
   ['Check','Entered inches','Target inches','Deviation inches','Status']
  ];
  result.checks.forEach(c=>rows.push([c.label,c.measuredIn,c.targetIn,c.deviationIn,c.withinTolerance?'within tolerance':'adjust']));
  rows.push(['Important',result.disclaimer]);
  const url=URL.createObjectURL(new Blob([csvDocument(rows)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='square-in-square-USER-REPORTED-audit.csv';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
}
