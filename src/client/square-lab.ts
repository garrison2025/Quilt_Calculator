import {calculateSquareLab, type SquareLabInput, type SquareLabResult} from '../lib/quilt/square-lab';
import {cutListCsv, type MaterialCutPlan} from '../lib/quilt/cutlist';
import type {Layout} from '../lib/quilt/math';

const make=(tag:string,cls='',value=''):HTMLElement=>{
 const el=document.createElement(tag);if(cls)el.className=cls;if(value)el.textContent=value;return el;
};
const n=(x:number,digits=4)=>x.toLocaleString('en-US',{maximumFractionDigits:digits});
function diagram(layout:Layout,desc:string):HTMLElement{
 const holder=make('div','square-roll-diagram');
 if(!layout.isCutFeasible){holder.appendChild(make('p','warning-banner error-banner',layout.error||'FIT_IMPOSSIBLE'));return holder;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 570 160');svg.setAttribute('role','img');
 svg.setAttribute('aria-label',desc+' — schematic showing up to 64 parent-square cuts on one continuous roll.');
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{
  const el=document.createElementNS('http://www.w3.org/2000/svg','rect');
  el.setAttribute('x',String(x));el.setAttribute('y',String(y));el.setAttribute('width',String(w));el.setAttribute('height',String(h));
  el.setAttribute('fill',color);el.setAttribute('stroke','#426f5e');el.setAttribute('stroke-width','.6');svg.appendChild(el);
 };
 rect(10,10,548,138,'#fffdf6');
 const len=Math.max(1e-9,layout.exactFabricRunLengthIn),width=layout.usableWofIn;
 for(const [i,p] of layout.cutPieces.slice(0,64).entries()){
  rect(12+p.yIn/len*544,12+p.xIn/width*134,
   Math.max(.1,p.heightIn/len*544-1),Math.max(.1,p.widthIn/width*134-1),
   i%2===0?'#99c9b5':'#ccdec3');
 }
 holder.appendChild(svg);
 holder.appendChild(make('p','diagram-note','Schematic only; numeric cutting dimensions are exact inches. '+(layout.cutPieces.length>64?'First 64 parent squares shown. Download CSV for all.':'All parent squares shown.')));
 return holder;
}
export function initSquareLab():void{
 const root=document.querySelector<HTMLElement>('[data-square-lab]');
 if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-square-form]')!;
 const output=root.querySelector<HTMLElement>('[data-square-output]')!;
 const status=root.querySelector<HTMLElement>('[data-square-status]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-square-download]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-square-input]')];
 let current:SquareLabResult|null=null;
 function render():void{
  download.disabled=true;current=null;
  for(const field of fields)field.setAttribute('aria-invalid','false');
  try{
   const values={} as Record<string,number>;
   for(const field of fields){
    const raw=field.value.trim();
    if(!/^\d+(?:\.\d+)?$/.test(raw))throw Error('Enter a nonnegative US-format decimal in '+(field.labels?.[0]?.textContent||field.dataset.squareInput)+'.');
    values[field.dataset.squareInput!]=Number(raw);
   }
   const result=calculateSquareLab(values as unknown as SquareLabInput);
   current=result;
   output.replaceChildren();
   const hero=make('div','result-hero');
   hero.append(make('div','result-kicker','ONE CENTER + TWO BACKGROUND SQUARES PER BLOCK'),
    make('div','result-big',n(result.centerCutIn)+' in'),
    make('p','result-sub','Center square CUT side. Finished outside block: '+n(result.finishedOuterIn)+' in; unfinished outside before joining: '+n(result.unfinishedOutsideIn)+' in.'));
   output.appendChild(hero);
   const metric=make('div','square-lab-metrics');
   for(const [label,value] of [
     ['Center cut side',n(result.centerCutIn)+' in'],
     ['Background square cut side',n(result.cornerSquareCutIn)+' in'],
     ['Centers to cut',String(result.centerSquares)],
     ['Background squares to cut',String(result.cornerParentSquares)],
     ['Triangles after diagonal split',String(result.resultingCornerTriangles)],
     ['Center finished side (from rounded cut)',n(result.intendedFinishedCenterIn)+' in']
   ]){
    const item=make('div','stat');item.append(make('span','',label),make('strong','',value));metric.appendChild(item);
   }
   output.appendChild(metric);
   const plans:[string,Layout,number|undefined][]=[
    ['CENTER fabric · separate roll',result.center.layout,result.center.purchase?.roundedPurchaseYards],
    ['CORNER fabric · separate roll',result.corners.layout,result.corners.purchase?.roundedPurchaseYards]
   ];
   for(const [label,layout,yards] of plans){
    const section=make('section','square-lab-roll');
    section.appendChild(make('h3','',label));
    if(yards===undefined)section.appendChild(make('p','warning-banner error-banner','FIT_IMPOSSIBLE: This parent square cannot be cut from the given usable fabric width. No purchasing estimate is provided.'));
    else section.appendChild(make('p','square-lab-buy',
      'Parent-square roll run: '+n(layout.exactFabricRunLengthIn)+' in · upward-rounded purchase: '+n(yards)+' yd · offcut on cutting roll: '+n(layout.physicalOffcutAreaSqIn)+' sq in.'));
    section.appendChild(diagram(layout,label));output.appendChild(section);
   }
   const note=make('p','warning-banner','Trial cutting method only: sew and square up a practice block before purchasing or cutting the full batch. The parent-square CSV does not list the four resulting triangles as separate roll cuts.');
   output.appendChild(note);
   const feasible=Boolean(result.center.purchase&&result.corners.purchase);
   download.disabled=!feasible;
   status.textContent=feasible?'Calculated preview · independent rolls verified, sewing NOT verified.':'Calculated preview · a fabric width is impossible; no complete purchase plan.';
  }catch(err){
   output.replaceChildren(make('p','warning-banner error-banner',err instanceof Error?err.message:'Invalid trial input.'));
   status.textContent='Trial values are not valid; no cutting list can be exported.';
  }
 }
 form.addEventListener('submit',event=>{event.preventDefault();render();});
 fields.forEach(field=>field.addEventListener('input',()=>{
  current=null;download.disabled=true;status.textContent='Values changed. Calculate again before exporting.';
  output.replaceChildren(make('p','warning-banner','Trial input changed. Recalculate; the previous results are no longer current.'));
 }));
 // The cut-size chart uses ZERO extra corner trim, unlike the default
 // oversize trial form. Update both inputs together so the table never
 // silently disagrees with the current calculation or stale CSV download.
 root.querySelectorAll<HTMLButtonElement>('[data-square-reference-size]').forEach(button=>{
  button.addEventListener('click',()=>{
   const finished=form.querySelector<HTMLInputElement>('[data-square-input="finishedOuterIn"]')!;
   const extra=form.querySelector<HTMLInputElement>('[data-square-input="cornerExtraIn"]')!;
   finished.value=button.dataset.squareReferenceSize||'';
   extra.value='0';
   finished.dispatchEvent(new Event('input',{bubbles:true}));
   extra.dispatchEvent(new Event('input',{bubbles:true}));
   form.requestSubmit();
  });
 });
 download.addEventListener('click',()=>{
  if(!current||download.disabled)return;
  const plans:MaterialCutPlan[]=[
   {material:'Center fabric (parent squares)',sku:'center-trial',layout:current.center.layout},
   {material:'Background fabric (parent squares; slice once diagonally)',sku:'corner-trial',layout:current.corners.layout}
  ];
  const csv=cutListCsv(plans);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='square-in-square-TRIAL-parent-squares.csv';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
 render();
}
