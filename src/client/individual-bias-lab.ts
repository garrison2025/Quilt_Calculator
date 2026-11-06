import {
 calculateIndividualBiasSquare,findSmallestIndividualBiasSquare,
 type IndividualBiasInput,type IndividualBiasLayout
} from '../lib/quilt/individual-bias-geometry';
import {parseMeasure} from '../lib/quilt/math';
import {csvDocument} from '../lib/quilt/cutlist';

const node=(tag:string,cls='',text=''):HTMLElement=>{
 const el=document.createElement(tag);
 if(cls)el.className=cls;
 if(text)el.textContent=text;
 return el;
};
const fmt=(n:number,digits=3):string=>
 n.toLocaleString('en-US',{maximumFractionDigits:digits});
const svgNS='http://www.w3.org/2000/svg';
function svgElement(tag:string):SVGElement{return document.createElementNS(svgNS,tag);}
function drawBiasSquare(layout:IndividualBiasLayout):HTMLElement{
 const wrapper=node('div','bias-geometry-preview');
 const heading=node('h3','','Source fabric square and the exact full-width 45° cut rectangles');
 const explanatory=node('p','hint',
  'Source-square x/y coordinates follow straight grain. Color bands are full-width rectangles with clipped, square-ended bias strips; blank triangles are intentionally NOT counted as usable strips. Schematic SVG, not print-scale cutting artwork.');
 const svg=svgElement('svg');
 const S=layout.sourceSquareSideIn;
 svg.setAttribute('viewBox',`-1 -1 ${S+2} ${S+2}`);
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label',`Source fabric ${fmt(S)} inch square, ${layout.stripCount} disjoint inscribed 45-degree full-width strip rectangles, not a continuous bias tube or actual-size template.`);
 svg.setAttribute('class','bias-geometry-svg');
 const square=svgElement('rect');
 square.setAttribute('x','0');square.setAttribute('y','0');
 square.setAttribute('width',String(S));square.setAttribute('height',String(S));
 square.setAttribute('class','bias-geometry-square');
 svg.appendChild(square);
 for(const [i,strip] of layout.strips.entries()){
  const poly=svgElement('polygon');
  poly.setAttribute('points',strip.vertices.map(p=>`${p.xIn},${p.yIn}`).join(' '));
  poly.setAttribute('class','bias-geometry-band '+(i%2?'bias-geometry-band-alt':''));
  svg.appendChild(poly);
 }
 const line=svgElement('path');
 line.setAttribute('d',`M 0 0 L ${S} ${S}`);
 line.setAttribute('class','bias-grain-axis');
 svg.appendChild(line);
 wrapper.append(heading,explanatory,svg);
 return wrapper;
}
function metrics(parent:HTMLElement,items:[string,string][]):void{
 const grid=node('div','bias-geometry-stats');
 for(const [label,value] of items){
  const item=node('div','bias-geometry-stat');
  item.append(node('span','',label),node('strong','',value));
  grid.appendChild(item);
 }
 parent.appendChild(grid);
}
function table(parent:HTMLElement,layout:IndividualBiasLayout):void{
 const wrap=node('div','table-scroll bias-strip-scroll');
 wrap.tabIndex=0;wrap.setAttribute('role','region');
 wrap.setAttribute('aria-label','First 24 exact 45 degree source strip rectangles and modeled unjoined lengths');
 const t=document.createElement('table');t.className='breakdown-table bias-strip-table';
 const caption=document.createElement('caption');
 caption.textContent='First '+Math.min(24,layout.stripCount)+' of '+layout.stripCount+
  ' separate full-width strips. Download CSV for ALL exact model coordinates.';
 t.appendChild(caption);
 const head=document.createElement('thead'),tr=document.createElement('tr');
 for(const h of ['Band index','Width (in)','Raw strip length (in)','v start (in)','v end (in)']){
  const th=document.createElement('th');th.scope='col';th.textContent=h;tr.appendChild(th);
 }
 head.appendChild(tr);t.appendChild(head);
 const body=document.createElement('tbody');
 for(const strip of layout.strips.slice(0,24)){
  const row=document.createElement('tr');
  for(const [n,value] of [
   ['Band',String(strip.index)],['Width',fmt(strip.stripWidthIn)],
   ['Length',fmt(strip.rawLengthIn,4)],['v start',fmt(strip.vMinIn,4)],
   ['v end',fmt(strip.vMaxIn,4)]
  ]){
   const cell=n==='Band'?document.createElement('th'):document.createElement('td');
   if(n==='Band')(cell as HTMLTableCellElement).scope='row';
   cell.textContent=value;row.appendChild(cell);
  }
  body.appendChild(row);
 }
 t.appendChild(body);wrap.appendChild(t);parent.appendChild(wrap);
}
function sourceCsv(layout:IndividualBiasLayout,requiredIn:number):string{
 const rows:(string|number)[][]=[
  ['Record','45DEG_INDIVIDUAL_BIAS_GEOMETRY_ONLY_NOT_CONTINUOUS_TUBE'],
  ['Status','MODELED_SOURCE_RECTANGLES_AND_EXPLICIT_CROSSWISE_JOIN_LOSS_NOT_PHYSICAL_VERIFICATION'],
  ['Source square cut side (in)',layout.sourceSquareSideIn],
  ['Post-trim usable fabric WOF (in)',layout.usableWofIn],
  ['Unfolded strip width (in)',layout.fullCutStripWidthIn],
  ['Crosswise seam allowance per end (in)',layout.crosswiseJoinSeamIn],
  ['Required joined binding length (in)',requiredIn],
  ['Raw total full-width length (in)',layout.geometricUnjoinedLengthIn],
  ['Plain crosswise join count',layout.crosswiseJoinCount],
  ['Modeled joined length (in)',layout.modeledJoinedLengthIn],
  ['Actual physical construction tested','NO'],
  ['Method','SQUARE-ENDED 45-DEG RECTANGLES, plain CROSSWISE seams; NOT 45-DEG DIAGONAL JOINS, NOT TUBE'],
  ['Band','Raw length (in)','Width (in)','vMin (in)','vMax (in)',
   'P1 x','P1 y','P2 x','P2 y','P3 x','P3 y','P4 x','P4 y']
 ];
 const rounded=(v:number)=>Number(v.toFixed(6));
 for(const strip of layout.strips){
  rows.push([
   strip.index,rounded(strip.rawLengthIn),strip.stripWidthIn,rounded(strip.vMinIn),rounded(strip.vMaxIn),
   ...strip.vertices.flatMap(v=>[rounded(v.xIn),rounded(v.yIn)])
  ]);
 }
 rows.push(['WARNING','SVG/CSV values are mathematical source geometry, not actual-size printing or guaranteed usable sewn binding. No continuous-tube yield or purchase quote.']);
 return csvDocument(rows);
}
export function initIndividualBiasGeometryLab():void{
 const root=document.querySelector<HTMLElement>('[data-individual-bias-lab]');
 if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-bias-geometry-form]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement>('[data-bias-geometry-input]')];
 const status=root.querySelector<HTMLElement>('[data-bias-geometry-status]')!;
 const output=root.querySelector<HTMLElement>('[data-bias-geometry-output]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-bias-geometry-download]')!;
 let current:IndividualBiasLayout|null=null,required=0;
 const invalidate=():void=>{
  current=null;download.disabled=true;
  status.textContent='Inputs changed. Calculate again; any prior source polygon export is stale.';
  output.replaceChildren(node('p','hint','Recalculate to verify the new 45° rectangles.'));
 };
 function render():void{
  current=null;download.disabled=true;
  fields.forEach(f=>f.setAttribute('aria-invalid','false'));
  try{
   const input={} as Record<string,number>;
   for(const field of fields){
    const raw=field.value.trim();
    if(!raw)throw Error('Enter all five source and target measurements before calculating.');
    try{input[field.dataset.biasGeometryInput!]=parseMeasure(raw);}
    catch{
     field.setAttribute('aria-invalid','true');
     throw Error('Invalid number in '+(field.labels?.[0]?.textContent||field.dataset.biasGeometryInput));
    }
   }
   const data:IndividualBiasInput={
    squareSideIn:input.squareSideIn,fullCutStripWidthIn:input.fullCutStripWidthIn,
    usableWofIn:input.usableWofIn,crosswiseJoinSeamIn:input.crosswiseJoinSeamIn
   };
   const computed=calculateIndividualBiasSquare(data);
   const requiredJoinedLengthIn=input.requiredJoinedLengthIn;
   const searched=findSmallestIndividualBiasSquare({
    requiredJoinedLengthIn,fullCutStripWidthIn:data.fullCutStripWidthIn,
    usableWofIn:data.usableWofIn,crosswiseJoinSeamIn:data.crosswiseJoinSeamIn
   });
   const enough=computed.modeledJoinedLengthIn+1e-8>=requiredJoinedLengthIn;
   output.replaceChildren();
   metrics(output,[
    ['Source square',fmt(computed.sourceSquareSideIn)+' × '+fmt(computed.sourceSquareSideIn)+' in'],
    ['Full-width strips',String(computed.stripCount)],
    ['Exact raw strip length',fmt(computed.geometricUnjoinedLengthIn)+' in'],
    ['Explicit crosswise joins',String(computed.crosswiseJoinCount)],
    ['Modelled joined length',fmt(computed.modeledJoinedLengthIn)+' in'],
    ['Ideal-area upper bound',fmt(computed.idealAreaUpperBoundLengthIn)+' in'],
    ['Source offcut area',fmt(computed.offcutAreaSqIn)+' in²']
   ]);
   const feasibility=node('p',enough?'footer-note':'warning-banner');
   feasibility.dataset.biasGeometryTarget='';
   feasibility.textContent=enough
    ?'GEOMETRY TARGET MET: This square supplies at least '+fmt(requiredJoinedLengthIn)+
     ' inches under the particular centered-strip CROSSWISE-join model, NOT a certified sewn-fabric yield.'
    :'GEOMETRY TARGET NOT MET: This source square falls short of '+fmt(requiredJoinedLengthIn)+
     ' inches after the explicitly assumed crosswise joins. Do not infer sufficiency from the smaller area-only square.';
   output.appendChild(feasibility);
   const suggestion=node('p','footer-note');
   suggestion.dataset.biasGeometryMinimum='';
   suggestion.textContent=searched.matched
    ?'For this exact centered-band, ⅛-inch-grid, crosswise-join method, the FIRST source square meeting '+fmt(requiredJoinedLengthIn)+
     ' inches is '+fmt(searched.matched.sourceSquareSideIn)+
     ' in on each side, with '+fmt(searched.matched.modeledJoinedLengthIn)+
     ' inches of modeled joined length. This is not a globally optimal square, a continuous-tube result or a real-fabric purchase guarantee.'
    :'No eligible source square up to the selected usable WOF (and the 96-inch software limit) meets the requested joined length with this model. No purchase quantity is quoted.';
   output.appendChild(suggestion);
   output.appendChild(drawBiasSquare(computed));
   table(output,computed);
   output.appendChild(node('p','warning-banner',
    'METHOD RESTRICTION: crosswise ends only (not diagonal joins), source square not prewash-adjusted, edge stretching/pattern matching not measured. No actual physical sample was tested. This page cannot set the primary Binding calculator shopping/cut CSV.'));
   current=computed;required=requiredJoinedLengthIn;
   download.disabled=false;
   status.textContent=enough
    ?'Geometric rectangles verified, with target reached under declared crosswise joins; sewing NOT verified.'
    :'Geometric rectangles verified, but current square does not meet the joined-length target.';
  }catch(e){
   output.replaceChildren(node('p','warning-banner error-banner',
    e instanceof Error?e.message:'Invalid individual bias geometry inputs.'));
   status.textContent='No valid 45-degree geometry or export for these inputs.';
  }
 }
 for(const field of fields)field.addEventListener('input',invalidate);
 form.addEventListener('submit',event=>{event.preventDefault();render();});
 download.addEventListener('click',()=>{
  if(!current||download.disabled)return;
  const csv=sourceCsv(current,required);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;
  a.download='INDIVIDUAL-BIAS-45DEG-MODELED-RECTANGLES-NOT-TUBE.csv';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
 render();
}
