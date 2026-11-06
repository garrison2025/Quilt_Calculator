import {
 calculateContinuousBiasPlan,
 type ContinuousBiasPlan,type ContinuousBiasPlanInput
} from '../lib/quilt/continuous-bias-planner';
import {parseMeasure} from '../lib/quilt/math';

const ns='http://www.w3.org/2000/svg';
const svgEl=(name:string)=>document.createElementNS(ns,name);
const node=(tag:string,text='',cls='')=>{
 const el=document.createElement(tag);
 if(text)el.textContent=text;
 if(cls)el.className=cls;
 return el;
};
const fmt=(value:number,digits=3)=>
 value.toLocaleString('en-US',{maximumFractionDigits:digits});
function metric(parent:HTMLElement,label:string,value:string):void{
 const cell=node('div','','bias-plan-stat');
 cell.append(node('span',label),node('strong',value));
 parent.appendChild(cell);
}
function drawSquareFit(parent:HTMLElement,plan:ContinuousBiasPlan):void{
 const s=plan.scenario;
 if(!s)return;
 parent.appendChild(node('h3','Source square across measured usable width · modeled placement'));
 const F=plan.input.usableWofIn,S=s.sourceSquareSideIn;
 const scale=Math.min(590/F,225/S);
 const x0=45,y0=53,rollW=F*scale,square=S*scale;
 const svg=svgEl('svg');
 svg.setAttribute('viewBox','0 0 720 355');svg.classList.add('bias-plan-svg');
 svg.setAttribute('role','img');svg.dataset.biasPlanSquare='true';
 svg.setAttribute('aria-label',
  'Schematic with uniform inch scale: an '+fmt(S,3)+
  '-inch source square lies within '+fmt(F,3)+
  '-inch post-trim usable fabric width, leaving '+fmt(F-S,3)+
  ' inches unused across the width. One diagonal splits the source square into its two equal triangles. This is not an actual-size cut template.');
 const rect=(x:number,y:number,w:number,h:number,fill:string,stroke:string)=>{
  const el=svgEl('rect');el.setAttribute('x',String(x));el.setAttribute('y',String(y));
  el.setAttribute('width',String(w));el.setAttribute('height',String(h));
  el.setAttribute('fill',fill);el.setAttribute('stroke',stroke);
  el.setAttribute('stroke-width','1.6');svg.appendChild(el);
 };
 const label=(x:number,y:number,text:string,size=13)=>{
  const el=svgEl('text');el.setAttribute('x',String(x));el.setAttribute('y',String(y));
  el.setAttribute('fill','#1b4833');el.setAttribute('font-size',String(size));
  el.textContent=text;svg.appendChild(el);
 };
 const ln=(x1:number,y1:number,x2:number,y2:number,stroke:string,width=2,dash='')=>{
  const el=svgEl('line');for(const [key,v] of [
   ['x1',x1],['y1',y1],['x2',x2],['y2',y2]
  ] as const)el.setAttribute(key,String(v));
  el.setAttribute('stroke',stroke);el.setAttribute('stroke-width',String(width));
  if(dash)el.setAttribute('stroke-dasharray',dash);svg.appendChild(el);
 };
 rect(x0,y0,rollW,square,'#f4efe5','#668676');
 rect(x0,y0,square,square,'#d6ead8','#28664b');
 const seam=svgEl('polygon');
 seam.dataset.biasPlanTriangle='true';
 seam.setAttribute('points',[
  x0+','+y0,(x0+square)+','+y0,(x0+square)+','+(y0+square)
 ].join(' '));
 seam.setAttribute('fill','#b9d9cd');svg.appendChild(seam);
 ln(x0,y0,x0+square,y0+square,'#b36e39',2.5,'5 4');
 label(x0,30,'POST-TRIM / POSTWASH USABLE WOF '+fmt(F)+' in');
 label(x0+4,y0+square/2,'S = '+fmt(S)+' in');
 label(x0+4,y0+square/2+17,'TWO TRIANGLES',11);
 if(F-S>1.5&&((F-S)*scale)>68)
  label(x0+square+6,y0+square/2,'EXCESS',11);
 ln(x0,y0+square+11,x0+square,y0+square+11,'#28664b',1.7);
 label(x0,y0+square+31,'ONE square length = '+fmt(S)+' in after prewash',12);
 label(42,325,'Illustration uses uniform inch scale. No prewash length allowance is shown here.',12);
 parent.appendChild(svg);
 parent.appendChild(node('p',
  'The square fits the measured width only. The diagonal is the FIRST source-square split, not the final continuous spiral cutting line. See the separate 2D lab for all seam-line and unfolded-strip vertices.',
  'hint'));
}
function show(parent:HTMLElement,plan:ContinuousBiasPlan):void{
 parent.replaceChildren();
 const stats=node('div','','bias-plan-stats');
 metric(stats,'Quilt edge perimeter',fmt(plan.quiltPerimeterIn)+' in');
 metric(stats,'Perimeter + tails',fmt(plan.targetWithTailIn)+' in');
 metric(stats,'MODEL target including requested margin',fmt(plan.modeledTargetIn)+' in');
 metric(stats,'Loss-free area-only square floor · NOT sufficient',fmt(plan.areaOnlySquareSideFloorIn)+' in');
 parent.appendChild(stats);
 const s=plan.scenario;
 if(!s){
  const warning=node('p',
   'NO NUMERICAL FIT within the supplied usable width and supported model envelope. Do not infer any purchasing amount.',
   'warning-banner');
  warning.dataset.biasPlanNoFit='true';parent.appendChild(warning);
  if(plan.largestEvaluatedScenario){
   const max=plan.largestEvaluatedScenario;
   const metrics=node('div','','bias-plan-stats');
   metric(metrics,'Largest evaluated source square',fmt(max.sourceSquareSideIn)+' in');
   metric(metrics,'Its MODEL strip length',fmt(max.modelStripLengthIn)+' in');
   metric(metrics,'Numerical shortfall',fmt(Math.max(0,-max.gapToTargetIn))+' in');
   metric(metrics,'Complete MODEL bands',String(max.modelFullBands));
   parent.appendChild(metrics);
  }else parent.appendChild(node('p',
   'Even two full marked lanes cannot fit inside this usable WOF with the selected cut width and seam allowance.',
   'hint'));
  return;
 }
 parent.appendChild(node('p',
  'MODEL FIT ONLY: one mathematically feasible square was found. Physical construction and final usable strip length have NOT been verified.',
  'warning-banner'));
 const grid=node('div','','bias-plan-stats');
 metric(grid,'First ⅛-in MODEL square that meets target',fmt(s.sourceSquareSideIn)+' × '+fmt(s.sourceSquareSideIn)+' in');
 metric(grid,'Computed complete marked bands · NOT observed',String(s.modelFullBands));
 metric(grid,'MODELED square-ended strip length',fmt(s.modelStripLengthIn)+' in');
 metric(grid,'MODEL length over requested target',fmt(s.gapToTargetIn)+' in');
 metric(grid,'Unused width across one modeled square',fmt(s.unusedWofAcrossSquareIn)+' in');
 metric(grid,'Unwashed bolt run after LENGTH shrinkage only',fmt(s.unwashedRollRunIn)+' in');
 metric(grid,'Hypothetical raw bolt run conversion',fmt(s.indicativeRawRollRunYd,4)+' yd');
 metric(grid,'Hypothetical retail-step rounding · NOT TO BUY',fmt(s.indicativeRoundedRollRunYd,4)+' yd');
 metric(grid,'Rounding-only leftover (not production margin)',fmt(s.rollRoundingExtraIn)+' in');
 metric(grid,'Illustrative fabric subtotal · NOT A QUOTE','$'+fmt(s.indicativePriceUsd,2));
 parent.appendChild(grid);
 parent.appendChild(node('p',
  'The software evaluated '+plan.checkedCandidateCount+
  ' eligible ⅛-inch square candidates in ascending order. Only the final candidate was passed into the independent 2D stitched-face polygon, seam and area-closure verifier. Neither the rounded yards nor the difference between modeled output and target is a validated margin for real fabric.',
  'hint'));
 drawSquareFit(parent,plan);
 const ledger=plan.development;
 if(ledger){
  parent.appendChild(node('h3','Audited mathematical face and trim ledger'));
  const row=node('div','','bias-plan-ledger');
  for(const [name,value] of [
   ['First triangle-assembly seam',ledger.firstSeamTakeupSqIn],
   ['Second tube-closing seam',ledger.secondTubeSeamTakeupSqIn],
   ['Unused transverse remainder',ledger.unusedPartialBandAreaSqIn],
   ['Both terminal trim triangles',ledger.terminalEndTrimAreaSqIn],
   ['Full-width unfolded MODEL strip',ledger.usableWidthFullStripAreaSqIn],
   ['Original source square area',ledger.rawSquareAreaSqIn]
  ] as const){
   const item=node('div','','bias-plan-ledger-line');
   item.append(node('span',name),node('strong',fmt(value)+' in²'));row.appendChild(item);
  }
  parent.appendChild(row);
  parent.appendChild(node('p',
   'Numerical area closure residual: '+fmt(ledger.areaClosureErrorSqIn,7)+
   ' in². Source polygons, first/second stitch-line coordinates, N endpoint matches and N−1 complete tube seam segments are included in the JSON evidence.',
   'hint'));
 }
}
export function initContinuousBiasPlannerLab():void{
 const root=document.querySelector<HTMLElement>('[data-bias-plan]');
 if(!root)return;
 const form=root.querySelector<HTMLFormElement>('[data-bias-plan-form]')!;
 const status=root.querySelector<HTMLElement>('[data-bias-plan-status]')!;
 const output=root.querySelector<HTMLElement>('[data-bias-plan-output]')!;
 const download=root.querySelector<HTMLButtonElement>('[data-bias-plan-download]')!;
 const fields=[...form.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-bias-plan-input]')];
 let latest:ContinuousBiasPlan|null=null;
 const invalidate=()=>{
  latest=null;download.disabled=true;
  output.replaceChildren(node('p','Inputs changed. Recalculate before using any numerical scenario.','hint'));
  status.textContent='STALE · previous numerical scenario revoked.';
 };
 const calculate=()=>{
  latest=null;download.disabled=true;
  fields.forEach(f=>f.setAttribute('aria-invalid','false'));
  try{
   const entries:Record<string,number>={};
   for(const field of fields){
    try{entries[field.dataset.biasPlanInput!]=parseMeasure(field.value.trim());}
    catch{
     field.setAttribute('aria-invalid','true');field.focus();
     throw Error('Enter a valid value for '+(field.labels?.[0]?.textContent||'this field')+'.');
    }
   }
   const result=calculateContinuousBiasPlan(entries as ContinuousBiasPlanInput);
   show(output,result);latest=result;
   download.disabled=result.scenario===null;
   status.textContent=result.scenario
    ?'NUMERICAL MODEL FIT · not a physical yield or safe purchasing quantity.'
    :'NO NUMERICAL FIT · no source size or buying guidance for these inputs.';
  }catch(error){
   output.replaceChildren(node('p',
    'PLANNING MODEL REJECTED: '+(error instanceof Error?error.message:'Invalid input')+
    ' No hypothetical buying or geometry output was retained.',
    'warning-banner'));
   status.textContent='INVALID / NO USABLE SCENARIO · export disabled.';
  }
 };
 fields.forEach(f=>f.addEventListener(f instanceof HTMLSelectElement?'change':'input',invalidate));
 form.addEventListener('submit',event=>{event.preventDefault();calculate();});
 download.addEventListener('click',()=>{
  if(download.disabled||!latest||!latest.scenario)return;
  const blob=new Blob([JSON.stringify(latest,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');anchor.href=url;
  anchor.download='CONTINUOUS-BIAS-MODEL-SCENARIO-NOT-FOR-PURCHASE.json';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
 });
 calculate();
}
