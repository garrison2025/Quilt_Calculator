import {
 calculateBiasTube2DDevelopment,type BiasTubeDevelopment,type BiasPoint
} from '../lib/quilt/continuous-bias-tube-development';
import {parseMeasure} from '../lib/quilt/math';
import type {TubeTopologyInput} from '../lib/quilt/continuous-bias-tube-topology';

const ns='http://www.w3.org/2000/svg';
const svgEl=(tag:string)=>document.createElementNS(ns,tag);
const make=(tag:string,text='',css='')=>{
 const el=document.createElement(tag);
 if(text)el.textContent=text;
 if(css)el.className=css;
 return el;
};
const fmt=(n:number)=>n.toLocaleString('en-US',{maximumFractionDigits:4});
const pt=(p:BiasPoint)=>'('+fmt(p.xIn)+', '+fmt(p.yIn)+')';
function drawChart(parent:HTMLElement,m:BiasTubeDevelopment):void{
 const svg=svgEl('svg');svg.setAttribute('viewBox','0 0 760 375');
 svg.setAttribute('role','img');
 svg.classList.add('tube-seam-svg','tube-development-svg');
 svg.setAttribute('aria-label',
  'Scaled stitched-fabric 2D chart with individual band polygons, first triangle-assembly seam, second tube-seam stitch edges and cut lines. Not a physical-scale cutting template.');
 const L=m.rawParallelogramLongEdgeIn,V=m.postFirstSeamFullHeightIn;
 const scale=Math.min(680/(L+V+4),260/(V+1));
 const x=(v:number)=>36+v*scale,y=(v:number)=>315-v*scale;
 const points=(p:BiasPoint[])=>p.map(v=>x(v.xIn)+','+y(v.yIn)).join(' ');
 const polyline=(p:BiasPoint[],color:string,thickness:number,dash='')=>{
  const el=svgEl('polyline');el.setAttribute('points',points(p));
  el.setAttribute('fill','none');el.setAttribute('stroke',color);
  el.setAttribute('stroke-width',String(thickness));
  if(dash)el.setAttribute('stroke-dasharray',dash);
  svg.appendChild(el);
 };
 const label=(x:number,y:number,value:string)=>{
  const el=svgEl('text');el.setAttribute('x',String(x));el.setAttribute('y',String(y));
  el.setAttribute('font-size','12');el.setAttribute('fill','#214536');
  el.textContent=value;svg.appendChild(el);
 };
 for(const [i,b] of m.bands.entries()){
  const el=svgEl('polygon');el.setAttribute('points',points(b.sewnFacePolygon));
  el.setAttribute('fill',i%2===0?'#e5eee5':'#cfe5d8');
  el.setAttribute('stroke','#7ca790');el.setAttribute('stroke-width','1.1');
  svg.appendChild(el);
  const mid=b.firstAssemblySeamMidpoint;
  label(x(mid.xIn)+5,y(mid.yIn)+4,'B'+b.number);
 }
 for(const boundary of m.cutBoundaries){
  if(boundary.line!==0&&boundary.line!==m.actualFullBands)
   polyline(boundary.sewnFacePolyline,'#557484',1.3,'4 3');
 }
 polyline([m.firstAssemblyStitchLine.start,m.firstAssemblyStitchLine.end],'#bb713f',2.7,'6 3');
 polyline(m.tubeStitchLines.left,'#246a50',3);
 polyline(m.tubeStitchLines.right,'#246a50',3);
 label(24,28,'2D SEWN-FACE CHART · plotted inch coordinates, NOT actual-print scale');
 label(24,340,'Green: tube stitch lines · Orange: first seam · Dashes: strip cut lines');
 parent.appendChild(svg);
}
function show(parent:HTMLElement,m:BiasTubeDevelopment):void{
 parent.replaceChildren();
 parent.appendChild(make('p',
  'This is a coordinate/area-conserving ideal-fabric MODEL, not a measured sewing result. It models the first triangle seam with equal tip overhang and the second offset tube seam separately. Real seam rolling, bias stretch and end cut quality are not certified.',
  'warning-banner'));
 const stats=make('div','','tube-stats');
 const values:[string,string][]=[
  ['First triangle-assembly seam take-up',fmt(m.firstSeamTakeupSqIn)+' sq in'],
  ['Second tube-closing seam take-up',fmt(m.secondTubeSeamTakeupSqIn)+' sq in'],
  ['Post-first-seam face height',fmt(m.postFirstSeamFullHeightIn)+' in'],
  ['Post-second-seam run per full band',fmt(m.postSecondSeamFullRunIn)+' in'],
  ['Unused partial-width remainder',fmt(m.unusedTransverseWidthIn)+' in / '+fmt(m.unusedPartialBandAreaSqIn)+' sq in'],
  ['Two terminal triangles removed',fmt(m.terminalEndTrimAreaSqIn)+' sq in'],
  ['Full-band geometric length before end trims',fmt(m.actualFullBands*m.postSecondSeamFullRunIn)+' in'],
  ['MODELED square-ended length — NOT verified fabric yield',fmt(m.modeledSquareEndedLengthIn)+' in'],
  ['Area ledger residual',fmt(m.areaClosureErrorSqIn)+' sq in']
 ];
 for(const [name,value] of values){
  const cell=make('div','','tube-stat');
  cell.append(make('span',name),make('strong',value));stats.appendChild(cell);
 }
 parent.appendChild(stats);
 drawChart(parent,m);
 parent.appendChild(make('p',
  'Each polygon is indexed in exact inch coordinates and split at seam 1 into two raw-square triangle provenance regions. The 2D unfolded band polygons join at seam 2 using the single-lane offset. Download the JSON for every vertex, sewing-line intersection and terminal trimming coordinate.',
  'hint'));
 const wrapper=make('div','','table-scroll tube-seam-table-scroll');
 wrapper.setAttribute('tabindex','0');wrapper.setAttribute('role','region');
 wrapper.setAttribute('aria-label','Two-dimensional cut line coordinates');
 const table=document.createElement('table');table.className='breakdown-table tube-seam-table';
 const thead=document.createElement('thead'),tr=document.createElement('tr');
 for(const head of ['Cut line','Left (x,y) in','Seam 1 (x,y) in','Right (x,y) in','Tube crossing destination (x,y) in']){
  const th=document.createElement('th');th.scope='col';th.textContent=head;tr.appendChild(th);
 }
 thead.appendChild(tr);table.appendChild(thead);
 const tbody=document.createElement('tbody');
 for(const boundary of m.cutBoundaries){
  const row=document.createElement('tr');
  for(const value of [
   String(boundary.line),pt(boundary.sewnFacePolyline[0]),
   boundary.assemblySeamIntersection?pt(boundary.assemblySeamIntersection):'No interior crossing',
   pt(boundary.sewnFacePolyline[boundary.sewnFacePolyline.length-1]),
   boundary.tubeCrossing?pt(boundary.tubeCrossing.nextLeft):'OPEN END'
  ]){
   const td=document.createElement('td');td.textContent=value;row.appendChild(td);
  }
  tbody.appendChild(row);
 }
 table.appendChild(tbody);wrapper.appendChild(table);parent.appendChild(wrapper);
 parent.appendChild(make('p',
  'Unfolded full-strip terminal perpendicular cuts: x = '+
  fmt(m.unfoldedTerminalSquares.startCutXIn)+' in and '+
  fmt(m.unfoldedTerminalSquares.endCutXIn)+
  ' in. These remove one W²/2 triangular end at EACH end; the displayed length counts only the remaining full-width rectangle.',
  'hint'));
}
export function initContinuousBiasTubeDevelopmentLab():void{
 const root=document.querySelector<HTMLElement>('[data-tube-topology-lab]');
 const panel=document.querySelector<HTMLElement>('[data-tube-development-lab]');
 if(!root||!panel)return;
 const form=root.querySelector<HTMLFormElement>('[data-tube-topology-form]')!;
 const output=panel.querySelector<HTMLElement>('[data-tube-development-output]')!;
 const status=panel.querySelector<HTMLElement>('[data-tube-development-status]')!;
 const download=panel.querySelector<HTMLButtonElement>('[data-tube-development-download]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-tube-input]')];
 let latest:BiasTubeDevelopment|null=null;
 function invalidate(){
  latest=null;download.disabled=true;
  output.replaceChildren(make('p','Inputs changed. Calculate to regenerate the 2D stitched-fabric coordinate model.','hint'));
  status.textContent='2D model is STALE; no coordinate download.';
 }
 function calculate(){
  latest=null;download.disabled=true;
  try{
   const values:Record<string,number>={};
   for(const field of fields)values[field.dataset.tubeInput!]=parseMeasure(field.value.trim());
   const m=calculateBiasTube2DDevelopment(values as TubeTopologyInput);
   show(output,m);latest=m;download.disabled=false;
   status.textContent='Software 2D coordinates and two-seam/end-trim area ledger PASS. PHYSICAL YIELD AND PURCHASING NOT VALIDATED.';
  }catch(error){
   output.replaceChildren(make('p',
    '2D MODEL REJECTED: '+(error instanceof Error?error.message:'Invalid physical geometry')+
    ' The topology-only result above is separate and may still pass.',
    'warning-banner'));
   status.textContent='No usable 2D output or geometry download for these inputs.';
  }
 }
 fields.forEach(field=>field.addEventListener(field instanceof HTMLSelectElement?'change':'input',invalidate));
 form.addEventListener('submit',event=>{event.preventDefault();calculate();});
 download.addEventListener('click',()=>{
  if(!latest||download.disabled)return;
  const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;
  a.download='BIAS-TUBE-2D-ENGINEERING-NOT-PHYSICAL-YIELD.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 calculate();
}
