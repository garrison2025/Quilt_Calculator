import {
 calculateBiasTubeTopology,type TubeTopology,type TubeTopologyInput
} from '../lib/quilt/continuous-bias-tube-topology';
import {parseMeasure} from '../lib/quilt/math';
import {csvDocument} from '../lib/quilt/cutlist';

const node=(tag:string,cls='',text=''):HTMLElement=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text)el.textContent=text;
 return el;
};
const fmt=(value:number,digits=3)=>
 value.toLocaleString('en-US',{maximumFractionDigits:digits});
const svgNS='http://www.w3.org/2000/svg';
const svgNode=(tag:string)=>document.createElementNS(svgNS,tag);
function diagram(parent:HTMLElement,model:TubeTopology):void{
 const container=node('div','tube-marking-diagram');
 const caption=node('h3','','Schematic seam-line alignment: cut marks on TWO edges');
 const detail=node('p','hint',
  'This is a topology schematic, NOT the shape or size of a sewn parallelogram. Right cut-line intersections connect to the left intersections shown below, measured at the actual sewing line. Do not cut from this diagram.');
 const svg=svgNode('svg');
 const N=model.input.markedBands,step=35,h=105+N*step;
 svg.setAttribute('viewBox',`0 0 720 ${h}`);
 svg.setAttribute('class','tube-seam-svg');
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label',
  `Two schematic seam-line edges with ${N} marked bands, offset ${model.input.offsetBands} bands, ${model.distinctPathCount} separate paths. This diagram does not represent usable fabric length.`);
 const text=(x:number,y:number,value:string,cssClass='')=>{
  const t=svgNode('text');
  t.setAttribute('x',String(x));t.setAttribute('y',String(y));
  t.setAttribute('class',cssClass);
  t.textContent=value;svg.appendChild(t);
 };
 const makeLine=(x1:number,y1:number,x2:number,y2:number,cssClass:string)=>{
  const line=svgNode('line');
  for(const [key,val] of [['x1',x1],['y1',y1],['x2',x2],['y2',y2]] as const){
   line.setAttribute(key,String(val));
  }
  line.setAttribute('class',cssClass);
  svg.appendChild(line);
 };
 text(98,27,'LEFT SEWING LINE','tube-diagram-heading');
 text(471,27,'RIGHT SEWING LINE','tube-diagram-heading');
 makeLine(155,42,155,65+N*step,'tube-seam-edge');
 makeLine(555,42,555,65+N*step,'tube-seam-edge');
 for(let i=0;i<=N;i++){
  const y=56+i*step;
  makeLine(144,y,165,y,'tube-seam-mark');
  makeLine(544,y,565,y,'tube-seam-mark');
  text(118,y+5,String(i),'tube-band-label');
  text(576,y+5,String(i),'tube-band-label');
 }
 for(const [i,link] of model.seamLinks.entries()){
  const path=svgNode('path');
  const fromY=56+link.fromBand*step,toY=56+link.toBand*step;
  path.setAttribute('d',`M555 ${fromY} L155 ${toY}`);
  path.setAttribute('class','tube-connection-path'+(i%2?' tube-connection-alt':''));
  svg.appendChild(path);
 }
 text(205,h-18,'Offset '+model.input.offsetBands+' lanes · connections at SEWING lines only','tube-diagram-footnote');
 container.append(caption,detail,svg);parent.appendChild(container);
}
function summary(parent:HTMLElement,m:TubeTopology):void{
 const stats=node('div','tube-stats');
 const metrics:[string,string][]=[
  ['Observed marked lanes',String(m.input.markedBands)],
  ['ONE-lane seam offset?',m.input.offsetBands===1?'YES':'NO'],
  ['Distinct paths',String(m.distinctPathCount)],
  ['Cross-lane connections',String(m.expectedCrossingCount)],
  ['Offset along marked lines',fmt(m.markedOffsetDistanceIn)+' in'],
  ['SEWING line from raw edge',fmt(m.seamLineMarkDistanceFromRawEdgeIn)+' in'],
  ['PRE-SEAM possible lane limit',String(m.theoreticalPreseamBandCapacity)],
  ['LOSSLESS area length ceiling',fmt(m.preSeamAreaLengthCeilingIn)+' in']
 ];
 for(const [label,value] of metrics){
  const item=node('div','tube-stat');
  item.append(node('span','',label),node('strong','',value));
  stats.appendChild(item);
 }
 parent.appendChild(stats);
 const verdict=node('p',m.hasSingleOpenSpiral?'footer-note':'warning-banner');
 verdict.dataset.tubeVerdict='';
 verdict.textContent=m.hasSingleOpenSpiral
  ?'TOPOLOGY VERIFIED: one-strip offset connects ALL '+m.input.markedBands+
   ' marked lanes into ONE open spiral graph. This does NOT establish tube cutting length or sewn-fabric yield.'
  :m.input.offsetBands===0
   ?'TOPOLOGY FAILED: zero offset connects each of the '+m.input.markedBands+
    ' lanes to itself, creating '+m.distinctPathCount+' separate CLOSED RINGS, not continuous bias.'
   :'TOPOLOGY FAILED: offset '+m.input.offsetBands+
    ' creates '+m.distinctPathCount+' disconnected OPEN PATHS, not one continuous bias strip.';
 parent.appendChild(verdict);
 const h=node('h3','','Band traversal order');
 parent.appendChild(h);
 const paths=node('ol','tube-paths');
 paths.dataset.tubePaths='';
 for(const chain of m.chains){
  const item=document.createElement('li');
  const kind=chain.kind==='closed-ring'?'CLOSED ring':'OPEN path';
  item.textContent=kind+': '+chain.bandOrder.join(' → ')+(chain.kind==='closed-ring'?' ↻':'');
  paths.appendChild(item);
 }
 parent.appendChild(paths);
}
function alignmentTable(parent:HTMLElement,m:TubeTopology):void{
 const wrapper=node('div','table-scroll tube-seam-table-scroll');
 wrapper.tabIndex=0;wrapper.setAttribute('role','region');
 wrapper.setAttribute('aria-label','Sewing-line cut-mark correspondence and strip offset connections');
 const t=document.createElement('table');t.className='breakdown-table tube-seam-table';
 const caption=document.createElement('caption');
 caption.textContent='Connection indices and cut-line mark distances are conceptual sewing-line alignment coordinates, NOT fabric cutting coordinates.';
 t.appendChild(caption);
 const thead=document.createElement('thead'),head=document.createElement('tr');
 for(const title of ['RIGHT cut-line #','LEFT cut-line #','Right sewing-line mark (in)','Left sewing-line mark (in)','Offset (in)']){
  const th=document.createElement('th');th.scope='col';th.textContent=title;head.appendChild(th);
 }
 thead.appendChild(head);t.appendChild(thead);
 const body=document.createElement('tbody');
 for(const link of m.seamLinks){
  const tr=document.createElement('tr');
  for(const [i,value] of [
   link.fromBand,link.toBand,fmt(link.rightMarkDistanceIn),
   fmt(link.leftMarkDistanceIn),fmt(link.offsetDistanceIn)
  ].entries()){
   const cell=i===0?document.createElement('th'):document.createElement('td');
   if(i===0)(cell as HTMLTableCellElement).scope='row';
   cell.textContent=String(value);tr.appendChild(cell);
  }
  body.appendChild(tr);
 }
 t.appendChild(body);wrapper.appendChild(t);parent.appendChild(wrapper);
}
function exportChecklist(m:TubeTopology):string{
 const rows:(string|number)[][]=[
  ['STATUS','TOPOLOGY_ONLY_NOT_PHYSICAL_NOT_PURCHASE_NOT_CUTTING'],
  ['METHOD','CONTINUOUS_BIAS_TUBE_TOPOLOGY_ONLY'],
  ['SEAM_ALIGNMENT','AT_SEWING_LINE_NOT_RAW_EDGE'],
  ['Sewn fabric length verified','NO'],
  ['Source cutting polygons computed','NO'],
  ['Square source side in',m.input.sourceSquareSideIn],
  ['Post-trim usable WOF in',m.input.usableWofIn],
  ['Strip cut width in',m.input.fullStripCutWidthIn],
  ['Tube seam allowance in',m.input.seamAllowanceIn],
  ['Physically observed marked bands',m.input.markedBands],
  ['Chosen offset bands',m.input.offsetBands],
  ['Distinct connected paths',m.distinctPathCount],
  ['Single open spiral TOPOLOGY ONLY',m.hasSingleOpenSpiral?'YES':'NO'],
  ['PRESEAM theoretical max marked lanes',m.theoreticalPreseamBandCapacity],
  ['IDEAL area-only length ceiling in - NOT YIELD',m.preSeamAreaLengthCeilingIn],
  ['RIGHT cut mark #','LEFT cut mark #','RIGHT position on SEWING line in','LEFT position on SEWING line in','Offset distance in']
 ];
 for(const l of m.seamLinks){
  rows.push([l.fromBand,l.toBand,l.rightMarkDistanceIn,l.leftMarkDistanceIn,l.offsetDistanceIn]);
 }
 rows.push(['WARNING','Tube two-seam takeup, fabric stretch, helical cut path and post-seam usable length are NOT modeled; no retail yardage advice.']);
 return csvDocument(rows);
}
export function initContinuousBiasTubeTopologyLab():void{
 const root=document.querySelector<HTMLElement>('[data-tube-topology-lab]');
 if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-tube-topology-form]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-tube-input]')];
 const status=root.querySelector<HTMLElement>('[data-tube-topology-status]')!;
 const output=root.querySelector<HTMLElement>('[data-tube-topology-output]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-tube-topology-download]')!;
 let latest:TubeTopology|null=null;
 const invalidate=()=>{
  latest=null;download.disabled=true;
  output.replaceChildren(node('p','hint','Recalculate to verify new seam-line connections.'));
  status.textContent='Inputs changed; previous connection checklist is STALE and cannot be downloaded.';
 };
 function recalc(){
  latest=null;download.disabled=true;
  fields.forEach(f=>f.setAttribute('aria-invalid','false'));
  try{
   const values:Record<string,number>={};
   for(const field of fields){
    try{values[field.dataset.tubeInput!]=parseMeasure(field.value.trim());}
    catch{
     field.setAttribute('aria-invalid','true');
     throw Error('Invalid measurement in '+(field.labels?.[0]?.textContent||'tube input'));
    }
   }
   const m=calculateBiasTubeTopology(values as TubeTopologyInput);
   output.replaceChildren();
   summary(output,m);
   diagram(output,m);
   alignmentTable(output,m);
   output.appendChild(node('p','warning-banner',
    'METHOD_NOT_VERIFIED_FOR_YIELD: The marked connections are NOT a physical cut list. Actual usable length, two tube seams, helical trim, stretching, source square consumption, buying yardage and printed-scale cutting instructions remain unverified.'));
   latest=m;download.disabled=false;
   status.textContent=m.hasSingleOpenSpiral
    ?'Single continuous tube SPIRAL TOPOLOGY verified; actual cut YIELD NOT VERIFIED.'
    :'Sewing-line offset does NOT create a single spiral; do not cut or purchase from this graph.';
  }catch(err){
   output.replaceChildren(node('p','warning-banner',
    err instanceof Error?err.message:'Invalid seam topology inputs.'));
   status.textContent='NO VALID seam topology or download with these inputs.';
  }
 }
 fields.forEach(field=>field.addEventListener(field instanceof HTMLSelectElement?'change':'input',invalidate));
 form.addEventListener('submit',event=>{event.preventDefault();recalc();});
 download.addEventListener('click',()=>{
  if(!latest||download.disabled)return;
  const csv=exportChecklist(latest);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;
  a.download='CONTINUOUS-BIAS-TUBE-SEAM-TOPOLOGY-NO-YIELD.csv';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 recalc();
}
