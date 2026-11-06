import { VERSION, calculateBacking, calculateStraightBinding, calculateYardage, compareYardageWidths, calculateQuiltFabric, calculateBatting, calculateBorders, calculateSashing, layoutRectangles, verifyLayout, selectBackingOption, parseMeasure, fromInches, toInches, yardsToInches, purchase, hashProject, type Layout, type PieceRequest } from '../lib/quilt/math';
import { sampleProject, validateProject, quiltTopReviewFingerprint, hasCurrentQuiltTopReview, type Project } from '../lib/quilt/project';
import { resolveQuiltDimensions, type QuiltDimensions } from '../lib/quilt/dimensions';
import { cutListCsv, physicalRollId, type MaterialCutPlan } from '../lib/quilt/cutlist';
import { shoppingCsv, shoppingPriceSummary, hasIncompleteShopping, shoppingLineStatus, needsTopFabricPlan, type ShoppingLine } from '../lib/quilt/shopping';
import type { ToolId } from './types';
import {attachCutWalkthrough} from './diagram-playback';
type Kind = 'length' | 'whole' | 'number' | 'pct' | 'check' | 'text';
type Field = { label: string; path: string; kind?: Kind; note?: string };
const num = (n: number, digits = 3): string => Number(n.toFixed(digits)).toLocaleString('en-US', {maximumFractionDigits: digits});
const money = (n: number) => '$' + Number(n.toFixed(2)).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const frac = ['','⅛','¼','⅜','½','⅝','¾','⅞'];
function yd(n:number):string {
 const eighths = Math.round(n * 8), rounded = eighths / 8;
 if (Math.abs(n - rounded) > 0.000001) return num(n,3);
 const whole = Math.floor(eighths / 8), remainder = eighths % 8;
 return (whole > 0 ? String(whole) : '') + (remainder ? (whole ? ' ' : '') + frac[remainder] : whole ? '' : '0');
}
function node<K extends keyof HTMLElementTagNameMap>(tag:K, cls='', content=''):HTMLElementTagNameMap[K] {
 const n=document.createElement(tag); if(cls)n.className=cls;if(content)n.textContent=content;return n;
}
function append(parent:Element,...kids:(Node|undefined)[]){for(const child of kids)if(child)parent.appendChild(child);}
function text(t:string):Text{return document.createTextNode(t);}
const fieldsBase:Field[]=[
 {label:'Quilt width',path:'quilt.finishedWidth',kind:'length'},
 {label:'Quilt height',path:'quilt.finishedHeight',kind:'length'}
];
const groups: Record<ToolId, {title:string;fields:Field[]}[]> = {
 hub:[
  {title:'Your quilt',fields:fieldsBase},
  {title:'Backing & fabric roll',fields:[{label:'Backing extra per side',path:'options.overage',kind:'length'},{label:'Usable width of fabric (WOF)',path:'options.usableWof',kind:'length'},{label:'Seam join total take-up',path:'options.joinTakeup',kind:'length'},{label:'One-way fabric print',path:'options.oneWayPrint',kind:'check'}]},
  {title:'Binding & batting',fields:[{label:'Binding strip cut width',path:'options.stripWidth',kind:'length'},{label:'Batting roll width',path:'options.battingWof',kind:'length'},{label:'May rotate batting 90°',path:'options.allowRotate',kind:'check',note:'For one-piece batting only. Fabric-yardage and backing have separate grain settings.'}]},
  {title:'Buying settings',fields:[{label:'Purchase step (yd)',path:'options.step',kind:'number'},{label:'Length shrinkage (%)',path:'options.lengthShrinkage',kind:'pct'},{label:'Backing price (USD/yd, optional)',path:'options.backingPricePerYard',kind:'number'},{label:'Batting price (USD/yd, optional)',path:'options.battingPricePerYard',kind:'number'},{label:'Binding price (USD/yd, optional)',path:'options.bindingPricePerYard',kind:'number'}]}
 ],
 backing:[
  {title:'Quilt top',fields:fieldsBase},
  {title:'Backing construction',fields:[{label:'Backing extra per edge',path:'options.overage',kind:'length'},{label:'Usable fabric WOF',path:'options.usableWof',kind:'length'},{label:'Total loss at one panel join',path:'options.joinTakeup',kind:'length'},{label:'Directional / one-way print',path:'options.oneWayPrint',kind:'check',note:'If checked, rotated assembly is excluded.'}]},
  {title:'Shopping',fields:[{label:'Purchase step (yd)',path:'options.step',kind:'number'},{label:'Prewash length shrinkage (%)',path:'options.lengthShrinkage',kind:'pct'},{label:'Backing price (USD/yd, optional)',path:'options.backingPricePerYard',kind:'number'}]}
 ],
 binding:[
  {title:'Quilt top',fields:fieldsBase},
  {title:'Straight-grain strips',fields:[{label:'Cut strip width',path:'options.stripWidth',kind:'length'},{label:'Usable fabric WOF',path:'options.usableWof',kind:'length'},{label:'Extra tail / corners (total)',path:'options.tailAllowance',kind:'length'},{label:'Effective length lost per strip join',path:'options.stripJoinLoss',kind:'length'}]},
  {title:'Shopping',fields:[{label:'Purchase step (yd)',path:'options.step',kind:'number'},{label:'Length shrinkage (%)',path:'options.lengthShrinkage',kind:'pct'},{label:'Binding price (USD/yd, optional)',path:'options.bindingPricePerYard',kind:'number'}]}
 ],
 borders:[
  {title:'Quilt top',fields:[...fieldsBase,{label:'Seam allowance per edge',path:'options.seam',kind:'length'}]},
  {title:'Buying',fields:[{label:'Purchase step (yd)',path:'options.step',kind:'number'}]}
 ],
 yardage:[
  {title:'Fabric pieces',fields:[{label:'Piece cut width',path:'yardage.pieceWidth',kind:'length'},{label:'Piece cut height',path:'yardage.pieceHeight',kind:'length'},{label:'Piece quantity',path:'yardage.count',kind:'whole'},{label:'Usable fabric WOF',path:'options.usableWof',kind:'length'}]},
  {title:'Compare a second fabric width',fields:[{label:'Alternate usable WOF',path:'yardage.alternateWof',kind:'length',note:'Optional comparison scenario; current WOF alone determines your cut-list and shopping purchase.'}]},
  {title:'Fabric constraints',fields:[{label:'Allow 90° grain rotation',path:'yardage.allowRotate',kind:'check',note:'Applies to this rectangle fabric only, not batting or backing.'},{label:'One-way / directional print',path:'yardage.oneWayPrint',kind:'check',note:'Disables 90° rotation even when Allow rotation is checked.'},{label:'Prewash length shrinkage (%)',path:'options.lengthShrinkage',kind:'pct'},{label:'Purchase step (yd)',path:'options.step',kind:'number'}]}
 ],
 fabric:[
  {title:'Quilt top (shared)',fields:fieldsBase},
  {title:'Shopping',fields:[{label:'Purchase step (yd)',path:'options.step',kind:'number'}]}
 ],
 inches:[],
 batting:[
  {title:'Quilt top',fields:fieldsBase},
  {title:'One-piece batting',fields:[{label:'Batting extra per edge',path:'options.battingOverage',kind:'length'},{label:'Actual roll width',path:'options.battingWof',kind:'length'},{label:'May rotate 90°',path:'options.allowRotate',kind:'check'},{label:'Purchase step (yd)',path:'options.step',kind:'number'},{label:'Batting price (USD/yd, optional)',path:'options.battingPricePerYard',kind:'number'}]}
 ],
 sashing:[
  {title:'Block grid',fields:[{label:'Rows',path:'sashing.rows',kind:'whole'},{label:'Columns',path:'sashing.columns',kind:'whole'},{label:'Finished block width',path:'sashing.blockWidth',kind:'length'},{label:'Finished block height',path:'sashing.blockHeight',kind:'length'}]},
  {title:'Joining settings',fields:[{label:'Finished sashing width',path:'sashing.width',kind:'length'},{label:'Seam allowance per side',path:'options.seam',kind:'length'},{label:'Usable WOF',path:'options.usableWof',kind:'length'},{label:'Purchase step (yd)',path:'options.step',kind:'number'}]}
 ]
};
function get(obj:unknown,path:string):unknown{return path.split('.').reduce<unknown>((value,key)=>value && typeof value==='object' ? (value as Record<string,unknown>)[key] : undefined,obj);}
function set(obj:unknown,path:string,val:unknown):void{
 const parts=path.split('.');let o=obj as Record<string,unknown>;
 for(const part of parts.slice(0,-1))o=o[part] as Record<string,unknown>;
 o[parts[parts.length-1]]=val;
}
function download(filename:string,payload:unknown):void{
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
/** Preserve the exact browser-stored project text, including malformed JSON,
 * rather than JSON.stringify-ing it into a different, misleading file. */
function downloadRawBackup(filename:string,contents:string):void{
 const blob=new Blob([contents],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function section(parent:Element,heading:string,helper=''):HTMLElement{
 const h=node('div','results-section-title');
 append(h,node('h3','',heading),node('span','',helper));
 parent.appendChild(h);return h;
}
function stats(parent:Element,values:[string,string][]):void{
 const grid=node('div','stat-grid');
 for(const [label,value] of values){const card=node('div','stat');append(card,node('span','',label),node('strong','',value));grid.appendChild(card);}
 parent.appendChild(grid);
}
function hero(parent:Element,value:string,label:string,description:string,unit='yd'):void{
 const h=node('div','result-hero');append(h,node('div','result-kicker',label),node('div','result-big',value+' '+unit),node('p','result-sub',description));parent.appendChild(h);
}
function warning(parent:Element,message:string,error=false):void{parent.appendChild(node('div',error?'warning-banner error-banner':'warning-banner',message));}
function table(parent:Element,headers:string[],rows:string[][]):HTMLElement{
 const shell=node('div','table-scroll'),t=node('table','breakdown-table'),head=node('thead'),tr=node('tr');
 for(const x of headers)tr.appendChild(node('th','',x));head.appendChild(tr);t.appendChild(head);
 const body=node('tbody');
 for(const row of rows){const r=node('tr');for(const cell of row)r.appendChild(node('td','',cell));body.appendChild(r);}
 t.appendChild(body);shell.appendChild(t);parent.appendChild(shell);
 return shell;
}
function diagram(parent:Element,layout:Layout,title:string,sku?:string,scope:'current'|'comparison'='current'):void{
 section(parent,title,'Roll coordinates');
 if(!layout.isCutFeasible){warning(parent,layout.error||'FIT_IMPOSSIBLE',true);return;}
 const wrapper=node('div','diagram-wrap');
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 780 320');svg.setAttribute('role','img');
 const totalCutCount=layout.cutPieces.length;
 const previewCutCount=Math.min(totalCutCount,180);
 svg.setAttribute('aria-label',totalCutCount>180
  ?'Schematic fabric roll preview showing the first '+previewCutCount+' of '+totalCutCount+' cuts. The complete physical coordinate list is in the downloadable cut-list CSV.'
  :'Schematic fabric roll layout showing '+totalCutCount+' nonoverlapping rectangles. Numeric coordinates are below.');
 // Exact structured source dimensions, not rounded screen labels. Browser QA
 // compares these to the separately exported physical cutting CSV, and also
 // independently recomputes every displayed SVG rectangle's drawn position.
 svg.dataset.rollSku=sku||'';
 svg.dataset.exportScope=scope;
 svg.dataset.rollWofIn=String(layout.usableWofIn);
 svg.dataset.rollRunIn=String(layout.exactFabricRunLengthIn);
 svg.dataset.cutCount=String(totalCutCount);
 svg.dataset.renderedCutCount=String(previewCutCount);
 const make=(tag:string,attrs:Record<string,string>,parentNode:SVGElement)=>{
  const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));parentNode.appendChild(e);return e;
 };
 make('rect',{x:'38',y:'30',width:'713',height:'244',rx:'8',fill:'#fffdf6',stroke:'#b9d0c2'},svg);
 const usable=Math.max(layout.usableWofIn,0.00001),len=Math.max(layout.exactFabricRunLengthIn,0.00001);
 const colors=['#8ec1b0','#c8d9bb','#dbbd88','#aabbb3','#d1b1b0','#b8d3c5'];
 layout.cutPieces.slice(0,previewCutCount).forEach((p,i)=>{
  const x=40+(p.yIn/len)*709,y=32+(p.xIn/usable)*240,w=Math.max(.5,p.heightIn/len*709-1),h=Math.max(.5,p.widthIn/usable*240-1);
  const rect=make('rect',{x:String(x),y:String(y),width:String(w),height:String(h),rx:'2',fill:colors[i%colors.length],stroke:'#426f5e','stroke-width':'.7',
   'data-cut-index':String(i+1),'data-roll-x-in':String(p.xIn),'data-roll-y-in':String(p.yIn),
   'data-cut-width-in':String(p.widthIn),'data-cut-height-in':String(p.heightIn),
   'data-grain-rotation':String(p.grainRotationDeg),'data-cut-label':p.label},svg);
  const tooltip=make('title',{},rect as SVGElement);tooltip.textContent=p.label+': roll (x '+num(p.xIn)+', y '+num(p.yIn)+') cut '+num(p.widthIn)+' × '+num(p.heightIn)+' in';
  if(w>38&&h>19){const txt=make('text',{x:String(x+6),y:String(y+Math.min(18,h-3)),'font-size':'12',fill:'#264a3c','data-preview-step':String(i+1)},svg);txt.textContent=String(i+1);}
 });
 const tx=make('text',{x:'40',y:'300','font-size':'12',fill:'#47695a'},svg);
 tx.textContent='Fabric roll length: '+num(layout.exactFabricRunLengthIn)+' in  →';
 const ty=make('text',{x:'44',y:'20','font-size':'11',fill:'#47695a'},svg);ty.textContent='Usable WOF: '+num(layout.usableWofIn)+' in';
 const stage=node('div','cut-diagram-stage');
 stage.dataset.cutStage='';
 stage.appendChild(svg);
 wrapper.appendChild(stage);
 attachCutWalkthrough(wrapper,svg);
 wrapper.appendChild(node('p','diagram-note','Schematic, not to scale or a 1:1 pattern. Coordinates and dimensions are actual INCHES on the fabric roll. '+(totalCutCount>180?'First '+previewCutCount+' of '+totalCutCount+' cuts shown; the complete physical cut-list CSV includes every cut.':'')));
 parent.appendChild(wrapper);
 section(parent,'Cut coordinates','First '+Math.min(layout.cutPieces.length,45)+' of '+layout.cutPieces.length);
 const cutTable=table(parent,['# / piece','x in','y in','width × height in','grain'],layout.cutPieces.slice(0,45).map((p,i)=>[String(i+1)+' · '+p.label,num(p.xIn),num(p.yIn),num(p.widthIn)+' × '+num(p.heightIn),String(p.grainRotationDeg)+'°']));
 // The first 45 rows form a keyboard-accessible counterpart to the SVG.
 // Row clicks only select a preview index; they never alter physical cuts.
 const cutRows=[...cutTable.querySelectorAll<HTMLTableRowElement>('tbody tr')];
 cutRows.forEach((row,i)=>{
  const first=row.querySelector('td');
  if(!first)return;
  const button=node('button','cut-coordinate-link',first.textContent||String(i+1));
  button.type='button';button.dataset.cutRow=String(i+1);
  // Visible piece text must remain the accessible name (WCAG 2.5.3).
  button.title='Highlight this piece on the fabric roll diagram';
  first.replaceChildren(button);
  button.addEventListener('click',()=>{
   svg.dispatchEvent(new CustomEvent<number>('quilt-select-cut',{detail:i+1}));
  });
 });
 svg.addEventListener('quilt-cut-selected',event=>{
  const detail=(event as CustomEvent<{position:number;all:boolean}>).detail;
  cutRows.forEach((row,i)=>{
   const selected=!detail.all&&detail.position===i+1;
   row.classList.toggle('cut-coordinate-selected',selected);
   const button=row.querySelector<HTMLButtonElement>('button[data-cut-row]');
   if(button){
    if(selected)button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
   }
  });
 });
}
function details(parent:Element,items:[string,string][]):void{stats(parent,items);}
function downloadShoppingCsv(lines:ShoppingLine[],sourceProjectHash:string):void{
 const payload=shoppingCsv(lines,sourceProjectHash);
 const blob=new Blob([payload],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;
 a.download=hasIncompleteShopping(lines)?'quilt-studio-INCOMPLETE-shopping-list-'+sourceProjectHash+'.csv':'quilt-studio-shopping-list-'+sourceProjectHash+'.csv';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function shopping(parent:Element,lines:ShoppingLine[],{centralReadiness=false,sourceProjectHash}:{centralReadiness?:boolean;sourceProjectHash:string}):void{
 section(parent,'Material shopping list','Each material is purchased independently');
 // Optional border layers can all be deleted. An empty bill of materials is
 // not an exportable zero-dollar order: never show a CSV button which throws.
 if(!lines.length){
  parent.appendChild(node('p','footer-note','No materials configured for this calculator. Add a border layer to produce a shopping estimate; nothing is ready to purchase or export.'));
  return;
 }
 const prices=shoppingPriceSummary(lines);
 const unfit=lines.filter(line=>shoppingLineStatus(line)==='FIT_IMPOSSIBLE_NOT_PURCHASE_READY').length;
 const notPlanned=lines.filter(line=>shoppingLineStatus(line)==='NOT_PLANNED_NO_CUT_PIECES').length;
 const notReviewed=lines.filter(line=>shoppingLineStatus(line)==='TOP_CUT_LIST_NOT_REVIEWED').length;
 if(!centralReadiness && (unfit || notPlanned || notReviewed))warning(parent,'INCOMPLETE SHOPPING LIST: '+
  (notPlanned?notPlanned+' fabric/material entry or SKU(s) have no cut pieces. Add the missing quilt-top pieces in Quilt Fabric Calculator. ':'')+
  (unfit?unfit+' material roll(s) cannot fit the specified usable width. ':'')+
  (notReviewed?'Quilt-top cutting coverage is NOT REVIEWED. Check all actual blocks, colors and quantities, then confirm on Project Planner. ':'')+
  'The CSV identifies each reason. This is a partial material estimate, not a complete project purchase order.',true);
 const tools=node('div','shopping-toolbar'),button=node('button','action-secondary',(unfit||notPlanned||notReviewed)?'Download INCOMPLETE shopping CSV':'Download shopping CSV');
 button.type='button';button.dataset.action='export-shopping';
 button.addEventListener('click',()=>downloadShoppingCsv(lines,sourceProjectHash));
 tools.dataset.projectFingerprint=sourceProjectHash;
 append(tools,node('p','footer-note','Exact raw amount, rounded purchase, fabric-roll offcut and shop rounding differ. Project snapshot: '+sourceProjectHash+'. Match it to the cut-list CSV and project calculation JSON before using either file; this short tag is not a digital signature.'),button);
 parent.appendChild(tools);
 const priceNote=prices.enteredPriceSubtotalUsd===undefined
  ?'No entered-price subtotal: add prices to feasible material lines to calculate a partial cost estimate.'
  :'Entered-price subtotal (only '+prices.pricedCount+' priced material line(s)): '+money(prices.enteredPriceSubtotalUsd)+'.';
 const excluded=' '+prices.unpricedCount+' feasible material line(s) have no price; '+prices.unreadyCount+' material line(s) are not purchase-ready. Never treat this as a complete project quote, including taxes or shipping.';
 const sum=node('p','shopping-price-summary',priceNote+excluded);
 sum.dataset.shoppingPriceSummary='';
 parent.appendChild(sum);
 const list=node('div','shopping-list');
 for(const line of lines){
  const item=node('div','shopping-item'),left=node('div','shopping-info'),metrics=node('div','shopping-metrics');
  append(left,node('b','',line.label),node('small','',line.hint));
   if(line.rollId)left.appendChild(node('small','roll-id','Physical roll ID: '+line.rollId));
  if(line.rawYards!==undefined)metrics.appendChild(node('span','','Raw: '+num(line.rawYards,4)+' yd'));
  if(line.offcutSqIn!==undefined)metrics.appendChild(node('span','','Roll offcut: '+num(line.offcutSqIn,1)+' in²'));
  if(line.roundingExtraIn!==undefined)metrics.appendChild(node('span','','Purchase rounding excess: '+num(line.roundingExtraIn,2)+' in'));
  if(line.assemblyTrimSqIn!==undefined)metrics.appendChild(node('span','','Post-join trim: '+num(line.assemblyTrimSqIn,1)+' in² (separate)'));
  if(line.unitPrice!==undefined&&line.amount!==undefined){
   metrics.appendChild(node('span','','Your unit price: '+money(line.unitPrice)+'/yd'));
   metrics.appendChild(node('span','shopping-cost','Est. '+money(line.amount*line.unitPrice)));
  }
  left.appendChild(metrics);
  append(item,left,node('strong','shopping-amount',
   shoppingLineStatus(line)==='NOT_PLANNED_NO_CUT_PIECES'?'NOT PLANNED':
   line.amount===undefined?'FIT IMPOSSIBLE':
   shoppingLineStatus(line)==='TOP_CUT_LIST_NOT_REVIEWED'?yd(line.amount)+' yd · ESTIMATE':yd(line.amount)+' yd'));
  list.appendChild(item);
 }
 parent.appendChild(list);
}
/** One truthful, actionable project-level explanation replaces multiple
 * duplicate red banners. Does not affect the underlying purchase/export gates,
 * per-SKU readiness statuses, original evidence or physical assumptions.
 */
function projectReadinessPanel(missingTop:boolean,topReviewed:boolean,unfitRolls:number,ready:boolean):HTMLElement{
 const panel=node('section','project-readiness'+(unfitRolls?' project-readiness--blocked':ready?' project-readiness--ready':''));
 panel.dataset.planReadiness=ready?'ready':unfitRolls?'blocked':'partial';
 panel.setAttribute('aria-labelledby','project-readiness-title');
 const header=node('div','project-readiness-header');
 const headerText=node('div');
 const eyebrow=node('span','project-readiness-eyebrow',ready?'LISTED CUTS READY':'PROJECT COMPLETENESS');
 const title=node('h3','',ready?'Entered materials ready for cut-list export':'Finish your whole-quilt plan');
 title.id='project-readiness-title';
 const description=node('p','',ready
  ?'The listed cuts are feasible and you have confirmed quilt-top coverage. This is not independent fabric or sewing certification.'
  :'The backing amount shown above is a separate estimate, not a total for every material. Finish these checks before a full-project cut list or print.');
 append(headerText,eyebrow,title,description);
 const pill=node('span','project-readiness-pill',ready?'Ready for listed cuts':unfitRolls?'Fit needs correction':'Partial estimate');
 append(header,headerText,pill);panel.appendChild(header);
 const steps=node('ol','project-readiness-steps');
 function addStep(titleText:string,descriptionText:string,done:boolean,href?:string,actionText?:string):void{
  const item=node('li','project-readiness-step'+(done?' is-complete':''));
  const glyph=node('span','project-readiness-step-indicator',done?'✓':'!');
  glyph.setAttribute('aria-hidden','true');
  const main=node('div','project-readiness-step-body');
  append(main,node('strong','',titleText),node('p','',descriptionText));
  if(href&&actionText){
   const action=node('a','project-readiness-link',actionText);
   action.href=href;main.appendChild(action);
  }
  item.append(glyph,main);steps.appendChild(item);
 }
 addStep(missingTop?'QUILT TOP NOT PLANNED':'Quilt-top cut pieces entered',
  missingTop?'At least one fabric SKU has no positive-count cut pieces. Enter real fabric colors, dimensions and quantities.':'All entered quilt-top SKUs have cut pieces. Confirm the actual colors and quantities match your pattern.',
  !missingTop,'/quilt-fabric-calculator/',missingTop?'Add quilt-top cut pieces':'Review fabric cuts');
 addStep(unfitRolls?'FIT IMPOSSIBLE · review '+unfitRolls+' roll(s)':'Material widths and cuts are feasible',
  unfitRolls?'At least one material roll cannot fit its calculated pieces at the usable fabric width. Correct it before export.':'The engine verified fit for all listed rolls, using your supplied usable widths. Real-world fabric must still be checked.',
  unfitRolls===0,'#project-material-diagrams','Inspect cut diagrams');
 addStep(topReviewed?'Quilt-top coverage manually reviewed':missingTop?'Review available after planning':'QUILT TOP NOT REVIEWED',
  topReviewed?'You checked the supplied quilt-top cut list for all blocks, colors and quantities. Editing the relevant cuts revokes review.':
  missingTop?'First add positive-count pieces for each top fabric.':'Check the real quilt-top pattern and manually confirm all fabric cuts in the project workspace.',
  topReviewed,!missingTop?'#quilt-top-review':undefined,!missingTop&&!topReviewed?'Go to review checkbox':undefined);
 panel.appendChild(steps);
 const footer=node('p','project-readiness-footnote');
 footer.dataset.planExportNote='';
 footer.textContent=ready?'Full cut-list CSV and print are enabled for the entered material plan. Check real fabric, seam allowance and print scale before cutting.':
  'INCOMPLETE SHOPPING LIST · Partial shopping CSV remains available with per-material reasons. Full cut-list CSV and print stay disabled until the checklist is complete.';
 panel.appendChild(footer);
 if(ready){
  const printQa=node('a','project-readiness-link','Check physical print scale before cutting');
  printQa.href='/qa/print-calibration/';
  printQa.dataset.printCalibrationLink='';
  panel.appendChild(printQa);
 }
 return panel;
}

const root=document.querySelector<HTMLElement>('[data-tool]');
if(root){
 const tool=root.dataset.tool as ToolId;
 const fieldsRoot=root.querySelector<HTMLElement>('[data-fields]')!;
 const resultRoot=root.querySelector<HTMLElement>('[data-results]')!;
 const status=root.querySelector<HTMLElement>('[data-status]')!;
 const stateLabel=root.querySelector<HTMLElement>('[data-project-state]')!;
 const storageState=root.querySelector<HTMLElement>('[data-persist-state]')!;
 const syncWarning=root.querySelector<HTMLElement>('[data-sync-warning]')!;
 const unitsSelect=root.querySelector<HTMLSelectElement>('[data-units]')!;
 const exportButton=root.querySelector<HTMLButtonElement>('[data-action="export-cut"]')!;
 const cutCsvButton=root.querySelector<HTMLButtonElement>('[data-action="export-cut-csv"]')!;
 const printButton=root.querySelector<HTMLButtonElement>('[data-action="print"]')!;
 const saveButton=root.querySelector<HTMLButtonElement>('[data-action="save"]')!;
 const undoResetButton=root.querySelector<HTMLButtonElement>('[data-action="undo-reset"]')!;
 type ResetSnapshot={project:Project; sample:boolean; conv:string; savedJson:string|null};
 let resetSnapshot:ResetSnapshot|null=null;
 function clearResetSnapshot():void{
  resetSnapshot=null;
  undoResetButton.disabled=true;
 }
 let project:Project=structuredClone(sampleProject);
 let sample=true,conv='1/4';
 let cutExport:unknown=null;
 let materialCuts:MaterialCutPlan[]=[];
 // Keep the last accepted headline across an in-progress input draft, so a
 // committed edit can show an accurate before/after without treating stale
 // DOM output as an approved purchase estimate.
 let lastAcceptedFigure:{label:string;value:string}|null=null;
 const STORAGE_KEY='quilt-studio-v2';
 let lastStoredJson:string|null=null;
 let startupStorageError=false;
 // An unreadable existing autosave must NEVER be silently replaced by the
 // sample on the first keystroke. It could contain recoverable user data.
 let unreadableSavedJson:string|null=null;
 try{
  lastStoredJson=localStorage.getItem(STORAGE_KEY);
  if(lastStoredJson){try{project=validateProject(JSON.parse(lastStoredJson));sample=false;}
   catch{startupStorageError=true;unreadableSavedJson=lastStoredJson;}}
 }catch{startupStorageError=true;}
 function note(msg:string,err=false){status.textContent=msg;status.classList.toggle('status-error',err);}
 function storageUnavailable():void{
  storageState.textContent='Browser storage unavailable. Use Save project to download a JSON backup.';
  stateLabel.textContent='● Unsaved in browser';
 }
 function blockConflictedOutputs():void{
  // An older tab may keep a project as a downloadable JSON backup, but must
  // never present its superseded cut sheets as current purchasing instructions.
  root!.dataset.printReady='false';
  cutExport=null;materialCuts=[];
  exportButton.disabled=true;cutCsvButton.disabled=true;printButton.disabled=true;
  resultRoot.querySelectorAll<HTMLButtonElement>('[data-action="export-shopping"]')
   .forEach(button=>button.disabled=true);
 }
 function showStorageConflict():void{
  lastAcceptedFigure=null;
  syncWarning.hidden=false;
  storageState.textContent='Another tab saved a different project. Cutting and shopping exports are blocked. Save this tab as a JSON backup, then load the newest project.';
  stateLabel.textContent='● Unsaved · another tab changed';
  blockConflictedOutputs();
 }
 function requireCurrentOutput(action:string):boolean{
  if(unreadableSavedJson!==null){
   blockConflictedOutputs();
   note('Cannot '+action+': an unreadable original autosave is protected. Download its raw backup and explicitly start a new project first.',true);
   return false;
  }
  // Storage events are asynchronous: recheck source state at export time.
  try{
   if(localStorage.getItem(STORAGE_KEY)!==lastStoredJson)showStorageConflict();
  }catch{/* Blocked browser storage: local calculations still function. */}
  if(syncWarning.hidden)return true;
  blockConflictedOutputs();
  note('Cannot '+action+': another tab saved a different project. Download this tab\'s JSON backup, then load the newest saved project before exporting or printing.',true);
  return false;
 }
 function persist():void{
  // Any successfully accepted edit, import, SKU operation or unit change
  // supersedes the undo point. A later Undo must never erase newer work.
  clearResetSnapshot();
  sample=false;
  if(unreadableSavedJson!==null){
   blockConflictedOutputs();
   storageState.textContent='UNSAVED: unreadable original autosave is protected. Download its raw backup before explicitly starting fresh.';
   stateLabel.textContent='● Protected unreadable autosave';
   note('Your changes remain in this tab only. No damaged or incompatible saved project was overwritten.',true);
   return;
  }
  try{
   const actual=localStorage.getItem(STORAGE_KEY);
   if(actual!==lastStoredJson){showStorageConflict();return;}
   const next=JSON.stringify(project);
   localStorage.setItem(STORAGE_KEY,next);
   lastStoredJson=next;
   syncWarning.hidden=true;
   storageState.textContent='Autosaved in this browser. Save project downloads a separate JSON backup.';
   stateLabel.textContent='● My local project';
  }catch{storageUnavailable();}
 }
 window.addEventListener('storage',event=>{
  if(event.key===STORAGE_KEY && event.newValue!==lastStoredJson)showStorageConflict();
 });
 // Background tabs, mobile tab suspension and back/forward cache restoration
 // are not guaranteed to deliver the storage event while this document is
 // active. Reconcile BEFORE a user sees an apparently ready old cut plan.
 // The click/print guards still check storage independently as a final gate.
 function reconcileResumedProject():void{
  if(!syncWarning.hidden)return; // Never silently dismiss an existing conflict.
  try{
   if(localStorage.getItem(STORAGE_KEY)!==lastStoredJson)showStorageConflict();
  }catch{/* Storage blocked: keep the browser-only in-memory workflow. */}
 }
 window.addEventListener('pageshow',reconcileResumedProject);
 window.addEventListener('focus',reconcileResumedProject);
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)reconcileResumedProject();
 });
 // Shopping buttons are regenerated on each calculation: one capture-phase
 // gate runs before any individual shopping download click handler.
 resultRoot.addEventListener('click',event=>{
  if((event.target as Element|null)?.closest('[data-action="export-shopping"]') &&
     !requireCurrentOutput('download a shopping list')){
   event.preventDefault();event.stopImmediatePropagation();
  }
 },true);
 root.querySelector('[data-action="load-latest"]')?.addEventListener('click',()=>{
  if(unreadableSavedJson!==null){
   note('The original saved project is unreadable. Download the raw backup, then explicitly start fresh before loading.',true);
   return;
  }
  if(!requireCommittedDraft('load another saved project'))return;
  try{
   const latest=localStorage.getItem(STORAGE_KEY);
   const loaded=latest?validateProject(JSON.parse(latest)):structuredClone(sampleProject);
   clearResetSnapshot();
   project=loaded;sample=!latest;lastStoredJson=latest;conv='1/4';
   syncWarning.hidden=true;
   storageState.textContent=latest?'Loaded the newest saved project from this browser.':'The saved project was reset in another tab; sample restored.';
   stateLabel.textContent=latest?'● My local project':'● Sample project';
   renderEditor();update();
  }catch(e){note('Cannot load another tab\'s project: '+(e instanceof Error?e.message:'Invalid stored data'),true);}
 });
 if(unreadableSavedJson!==null){
  syncWarning.hidden=false;
  const savedWarning=syncWarning.querySelector('p');
  if(savedWarning)savedWarning.textContent='Your browser contains an unreadable saved project. We have NOT deleted or overwritten it. A sample is displayed only for reference. Download the original raw data first, then explicitly choose to replace it. Your ordinary Save project button saves only the displayed sample or edits.';
  const latestButton=syncWarning.querySelector<HTMLButtonElement>('[data-action="load-latest"]');
  if(latestButton)latestButton.hidden=true;
  const rawDownload=node('button','action-secondary','Download original raw backup');
  rawDownload.type='button';rawDownload.dataset.downloadUnreadableBackup='';
  const discard=node('button','action-secondary','Replace unreadable autosave with current project');
  discard.type='button';discard.dataset.replaceUnreadableBackup='';
  discard.disabled=true;
  rawDownload.addEventListener('click',()=>{
   if(unreadableSavedJson===null)return;
   downloadRawBackup('quilt-unreadable-original-autosave.txt',unreadableSavedJson);
   discard.disabled=false;
   storageState.textContent='Raw backup download started. The original remains protected until you explicitly replace it.';
  });
  discard.addEventListener('click',()=>{
   if(unreadableSavedJson===null || discard.disabled || !requireCommittedDraft('replace the unreadable autosave'))return;
   try{
    const current=localStorage.getItem(STORAGE_KEY);
    if(current!==unreadableSavedJson){
     note('Replacement canceled: another tab changed the saved data. Reload this page to review the newest project.',true);
     return;
    }
    const next=JSON.stringify(project);
    // Only one explicit replacement write. If it fails, keep the original
    // protected and let users download their current sample-project backup.
    localStorage.setItem(STORAGE_KEY,next);
    lastStoredJson=next;
    unreadableSavedJson=null;
    syncWarning.hidden=true;
    if(latestButton)latestButton.hidden=false;
    storageState.textContent='Original raw backup downloaded; current project explicitly saved as the new autosave.';
    stateLabel.textContent='● My local project';
    renderEditor();update();
   }catch(e){
    note('Could not replace saved project. The old data is still protected: '+(e instanceof Error?e.message:'Storage error'),true);
   }
  });
  append(syncWarning,rawDownload,discard);
  storageState.textContent='UNREADABLE AUTOSAVE PROTECTED — original data has not been overwritten. Download its raw text before choosing to replace it.';
  stateLabel.textContent='● Protected unreadable autosave';
 }else if(startupStorageError)storageState.textContent='Browser storage could not be read. Work in this tab and download your project JSON backup.';
 else storageState.textContent=sample?'Showing the example project. Edits are autosaved locally.':'Loaded your saved project from this browser.';
 function read(field:Field,value:string|boolean):unknown{
  if(field.kind==='check')return Boolean(value);
  if(field.path.toLowerCase().endsWith('priceperyard') && String(value).trim()==='')return undefined;
  if(field.kind==='text')return String(value);
  const n=parseMeasure(String(value));
  if(field.kind==='whole' && (!Number.isInteger(n)||n>2000))throw Error(field.label+' must be a whole number between 0 and 2000.');
  if(field.kind==='pct'&&n>=100)throw Error('Shrinkage must be less than 100%.');
  return field.kind==='length'?toInches(n,project.units):n;
 }
 function markResultsStale(message:string):void{
  root!.dataset.printReady='false';
  cutExport=null;materialCuts=[];
  saveButton.disabled=true;
  exportButton.disabled=true;cutCsvButton.disabled=true;printButton.disabled=true;
  resultRoot.querySelectorAll<HTMLButtonElement>('[data-action="export-shopping"]').forEach(button=>button.disabled=true);
  resultRoot.querySelector('[data-stale-warning]')?.remove();
  const stale=node('div','warning-banner error-banner',message);
  stale.setAttribute('data-stale-warning','');
  resultRoot.prepend(stale);
 }
 // An uncommitted field is visible user work, not yet accepted Project V2.
 // Never discard it from a secondary action that re-renders the form.
 function requireCommittedDraft(action:string):boolean{
  const draft=fieldsRoot.querySelector<HTMLInputElement>('[aria-invalid="true"],[data-pending-edit="true"]');
  if(!draft)return true;
  note('Cannot '+action+' while an input is unfinished. Correct or commit the highlighted field first.',true);
  draft.focus();
  return false;
 }
 function inputField(field:Field,current:unknown,onValue:(v:unknown)=>void):HTMLElement{
  let lastAccepted=current;
  const wrap=node('div','field-wrap'),id='field-'+Math.random().toString(36).slice(2);
  const label=node('label','',field.label+(field.kind==='length'?' ('+project.units+')':''));label.htmlFor=id;
  const input=node('input','field-control');
  const fieldError=node('span','field-error');
  fieldError.id=id+'-error';fieldError.hidden=true;
  fieldError.setAttribute('role','alert');
  input.setAttribute('aria-describedby',fieldError.id);
  input.id=id;input.type=field.kind==='check'?'checkbox':'text';
  if(field.kind==='check'){input.checked=Boolean(current);wrap.classList.add('check-field');append(wrap,input,label);}
  else{
   input.inputMode=field.kind==='text'?'text':'decimal';
   input.value=field.kind==='length'?num(fromInches(Number(current)||0,project.units),4):String(current??'');
   append(wrap,label,input);
  }
  // WOF must already reflect any planned prewash. Compensating purchasing
  // length alone cannot guarantee the cut still fits the fabric width.
  const widthField=['options.usableWof','yardage.alternateWof','usableWidth','wofIn'].includes(field.path);
  const wofHint='Use the actual usable WOF AFTER planned prewash and removing selvedges. Length shrinkage % adjusts bolt length only; this calculator cannot infer fabric width shrinkage.';
  const fieldNote=widthField?(field.note?field.note+' '+wofHint:wofHint):field.note;
  if(fieldNote){
   const hint=node('span','hint',fieldNote);hint.id=id+'-hint';
   wrap.appendChild(hint);
   input.setAttribute('aria-describedby',hint.id+' '+fieldError.id);
  }
  wrap.appendChild(fieldError);
  // Keep the previous accepted project intact while typing. A draft cannot be
  // exported or printed as though it were already in the cutting plan.
  if(input.type!=='checkbox')input.addEventListener('input',()=>{
   input.dataset.pendingEdit='true';
   let message='';
   try{read(field,input.value);}catch(e){message=e instanceof Error?e.message:'Invalid measurement.';}
   input.setAttribute('aria-invalid',String(Boolean(message)));
   fieldError.hidden=!message;fieldError.textContent=message;
   markResultsStale('This field has uncommitted changes. Leave the field to validate and recalculate before exporting or printing.');
   note('Editing '+field.label+' · current cutting result is not ready for export.',true);
  });
  input.addEventListener('change',()=>{
   input.dataset.pendingEdit='false';
   try{
    const value=read(field,input.type==='checkbox'?input.checked:input.value);
    onValue(value);
    try{validateProject(project);}catch(e){onValue(lastAccepted);throw e;}
    lastAccepted=value;
    if(tool==='fabric' || tool==='borders' || field.path==='options.seam' || field.path==='quilt.finishedWidth' || field.path==='quilt.finishedHeight'){
     project.quilt.topCutsReviewed=false;
     project.quilt.topCutsReviewFingerprint=undefined;
     // Reconcile the visible manual-attestation control without rebuilding the
     // editor and discarding a separate in-progress measurement draft.
     const review=fieldsRoot.querySelector<HTMLInputElement>('#quilt-top-review');
     if(review)review.checked=false;
    }
    input.setAttribute('aria-invalid','false');fieldError.hidden=true;fieldError.textContent='';persist();update();
   }catch(e){
    const message=e instanceof Error?e.message:'This input is not valid.';
    input.setAttribute('aria-invalid','true');fieldError.hidden=false;fieldError.textContent=message;
    markResultsStale('The value was not saved. Results below are from the last valid measurements. Correct the highlighted field to recalculate.');
    note('Input rejected: '+message,true);
   }
  });
  return wrap;
 }
 function makeGroup(title:string,fields:Field[],source:unknown=project,onChange?:(field:Field,value:unknown)=>void):HTMLElement{
  const frag=node('div');frag.appendChild(node('h3','group-title',title));
  const grp=node('div','field-group');
  for(const f of fields){
   const current=f.path==='yardage.alternateWof'?(get(source,f.path)??project.options.usableWof):f.path==='yardage.allowRotate'?(get(source,f.path)??project.options.allowRotate):get(source,f.path);grp.appendChild(inputField(f,current,v=>{if(onChange)onChange(f,v);else set(project,f.path,v);}));
  }frag.appendChild(grp);return frag;
 }
 // When a dynamic input collection is replaced, the clicked control is
 // detached. Restore keyboard focus to the new/adjacent control after both
 // form and result updates. Do not rerender a rejected in-progress draft.
 function rebuildDynamicEditor(focusSelector:string,selectText=false):void{
  renderEditor();update();
  const target=fieldsRoot.querySelector<HTMLInputElement|HTMLButtonElement>(focusSelector);
  if(!target)throw Error('Dynamic material editor lost its expected keyboard focus target.');
  target.focus();
  if(selectText && target instanceof HTMLInputElement && target.type==='text')target.select();
 }
 function renderFabricEditor():void{
  const shell=node('div');shell.appendChild(node('h3','group-title','Fabric colors / SKUs'));
  project.fabrics.forEach((fabric,i)=>{
   const card=node('div','dynamic-entry'),head=node('div','dynamic-head');
   card.dataset.fabricIndex=String(i);
   const fabricTitle=node('strong','',fabric.label||'Fabric '+(i+1));
   fabricTitle.id='fabric-editor-label-'+i;
   const del=node('button','','Remove SKU');del.type='button';del.dataset.removeSku='';
   del.setAttribute('aria-describedby',fabricTitle.id);
   del.addEventListener('click',()=>{
    if(!requireCommittedDraft('remove a fabric SKU'))return;
    project.fabrics.splice(i,1);
    project.quilt.topCutsReviewed=false;project.quilt.topCutsReviewFingerprint=undefined;
    persist();
    const neighbor=Math.min(i,project.fabrics.length-1);
    rebuildDynamicEditor(neighbor<0?'[data-add-sku]':`[data-fabric-index="${neighbor}"] [data-remove-sku]`);
   });
   append(head,fabricTitle,del);card.appendChild(head);
   card.appendChild(makeGroup('Fabric roll',[
    {label:'SKU (unique)',path:'id',kind:'text'},{label:'Fabric / color label',path:'label',kind:'text'},
    {label:'Usable WOF',path:'usableWidth',kind:'length'},{label:'Length shrinkage (%)',path:'shrinkageLengthPct',kind:'pct'},
    {label:'Price per yard (optional)',path:'pricePerYard',kind:'number'},
    {label:'One-way print',path:'oneWayPrint',kind:'check'}
   ],fabric,(f,v)=>{
    if(f.path==='id'&&project.fabrics.some((g,j)=>j!==i&&g.id===v))throw Error('SKU IDs must be unique.');
    (fabric as unknown as Record<string,unknown>)[f.path]=v;
    if(f.path==='label')fabricTitle.textContent=String(v)||'Fabric '+(i+1);
   }));
   fabric.pieces.forEach((piece,j)=>{
    const group=node('div','dynamic-entry'),h=node('div','dynamic-head');
    group.dataset.cutIndex=String(j);
    const cutTitle=node('strong','','Cut group '+(j+1));
    cutTitle.id='fabric-cut-label-'+i+'-'+j;
    const remove=node('button','','Remove cut group');remove.type='button';remove.dataset.removeCut='';
    remove.setAttribute('aria-describedby',fabricTitle.id+' '+cutTitle.id);
    remove.addEventListener('click',()=>{
     if(!requireCommittedDraft('remove a cut group'))return;
     fabric.pieces.splice(j,1);
     project.quilt.topCutsReviewed=false;project.quilt.topCutsReviewFingerprint=undefined;
     persist();
     const neighbor=Math.min(j,fabric.pieces.length-1);
     rebuildDynamicEditor(neighbor<0
      ?`[data-fabric-index="${i}"] [data-add-cut]`
      :`[data-fabric-index="${i}"] [data-cut-index="${neighbor}"] [data-remove-cut]`);
    });
    append(h,cutTitle,remove);group.appendChild(h);
    group.appendChild(makeGroup('Rectangle CUT sizes',[
     {label:'Piece label',path:'label',kind:'text'},{label:'Cut width',path:'widthIn',kind:'length'},
     {label:'Cut height',path:'heightIn',kind:'length'},{label:'Count',path:'count',kind:'whole'},
     {label:'Allow 90° rotation',path:'allowRotate',kind:'check'}
    ],piece,(f,v)=>{(piece as unknown as Record<string,unknown>)[f.path]=v;}));
    card.appendChild(group);
   });
   const addPiece=node('button','dynamic-add','+ Add rectangle cut group');addPiece.type='button';addPiece.dataset.addCut='';
   addPiece.setAttribute('aria-describedby',fabricTitle.id);
   addPiece.addEventListener('click',()=>{
    if(!requireCommittedDraft('add a cut group'))return;
    if(fabric.pieces.length>=100){note('Maximum 100 piece groups per SKU.',true);return;}
    const newPiece={widthIn:5,heightIn:5,count:4,label:'New cut',allowRotate:false};
    fabric.pieces.push(newPiece);
    try{validateProject(project);}catch(e){fabric.pieces.pop();note((e as Error).message,true);return;}
    project.quilt.topCutsReviewed=false;project.quilt.topCutsReviewFingerprint=undefined;persist();
    rebuildDynamicEditor(`[data-fabric-index="${i}"] [data-cut-index="${fabric.pieces.length-1}"] .field-control`,true);
   });card.appendChild(addPiece);shell.appendChild(card);
  });
  const add=node('button','dynamic-add','+ Add fabric SKU');add.type='button';add.addEventListener('click',()=>{
   if(!requireCommittedDraft('add a fabric SKU'))return;
   if(project.fabrics.length>=30){note('Maximum 30 fabric SKUs.',true);return;}
   const id='fabric-'+(project.fabrics.length+1)+'-'+Date.now().toString(36);
   project.fabrics.push({id,label:'New fabric',usableWidth:43,oneWayPrint:false,shrinkageLengthPct:0,pieces:[{widthIn:5,heightIn:5,count:4,label:'Cut square'}]});
   try{validateProject(project);}catch(e){project.fabrics.pop();note((e as Error).message,true);return;}
   project.quilt.topCutsReviewed=false;project.quilt.topCutsReviewFingerprint=undefined;persist();
   rebuildDynamicEditor(`[data-fabric-index="${project.fabrics.length-1}"] .field-control`,true);
  });add.dataset.addSku='';shell.appendChild(add);fieldsRoot.appendChild(shell);
 }
 function renderBorderEditor():void{
  const shell=node('div');shell.appendChild(node('h3','group-title','Butted border layers (maximum 5)'));
  project.borders.forEach((layer,i)=>{
   const card=node('div','dynamic-entry'),h=node('div','dynamic-head'),remove=node('button','','Remove layer');
   card.dataset.borderIndex=String(i);
   const borderTitle=node('strong','','Layer '+(i+1)+' · '+(layer.label||'Unnamed border'));
   borderTitle.id='border-editor-label-'+i;
   remove.type='button';remove.dataset.removeBorder='';
   remove.setAttribute('aria-describedby',borderTitle.id);
   remove.addEventListener('click',()=>{
    if(!requireCommittedDraft('remove a border layer'))return;
    project.borders.splice(i,1);persist();
    const neighbor=Math.min(i,project.borders.length-1);
    rebuildDynamicEditor(neighbor<0?'[data-add-border]':`[data-border-index="${neighbor}"] [data-remove-border]`);
   });
   append(h,borderTitle,remove);card.appendChild(h);
   card.appendChild(makeGroup('Border fabric',[
    {label:'SKU',path:'sku',kind:'text'},{label:'Label / color',path:'label',kind:'text'},
    {label:'Finished border width',path:'widthIn',kind:'length'},{label:'Usable WOF',path:'wofIn',kind:'length'},
    {label:'Length shrinkage (%)',path:'shrinkageLengthPct',kind:'pct'},{label:'Price per yard (optional)',path:'pricePerYard',kind:'number'}
   ],layer,(f,v)=>{
    (layer as unknown as Record<string,unknown>)[f.path]=v;
    if(f.path==='label')borderTitle.textContent='Layer '+(i+1)+' · '+(String(v)||'Unnamed border');
   }));shell.appendChild(card);
  });
  const add=node('button','dynamic-add','+ Add border layer');add.type='button';add.addEventListener('click',()=>{
   if(!requireCommittedDraft('add a border layer'))return;
   if(project.borders.length>=5){note('Maximum 5 border layers.',true);return;}
   project.borders.push({sku:'border-'+Date.now().toString(36),label:'New border',widthIn:2,wofIn:43,shrinkageLengthPct:0});persist();
   rebuildDynamicEditor(`[data-border-index="${project.borders.length-1}"] .field-control`,true);
  });add.dataset.addBorder='';shell.appendChild(add);fieldsRoot.appendChild(shell);
 }
 function changeBackingDirection(mode:'auto'|'vertical'|'horizontal'):void{
  if(!requireCommittedDraft('change backing seam orientation'))return;
  if(mode==='horizontal' && project.options.oneWayPrint){
   note('Horizontal backing seams are unavailable for one-way fabric print. Turn off the directional print constraint first or choose Auto / Vertical.',true);
   return;
  }
  project.options.backingDirection=mode;
  persist();
  renderEditor();
  update();
 }
 function renderEditor():void{
  fieldsRoot.replaceChildren();
  unitsSelect.value=project.units;
  if(['hub','backing','binding','batting','borders','fabric'].includes(tool)){
   // Existing V2 JSON has ambiguous entered dimensions when borders exist.
   // A real user selection is mandatory: never silently migrate saved data.
   const box=node('section','dimension-basis-choice');
   box.dataset.dimensionBasisChoice='';
   const label=node('label','dimension-basis-label','What do your quilt measurements include?');
   const select=node('select','field-control');
   select.id='quilt-dimension-basis';label.htmlFor=select.id;
   for(const [value,title] of [
    ['','Choose for this saved project'],
    ['before-borders','Center size BEFORE adding borders'],
    ['includes-borders','Final size INCLUDING all borders']
   ]){
    const option=node('option','',title);option.value=value;select.appendChild(option);
   }
   select.value=project.quilt.sizeBasis??(project.borders.length===0?'before-borders':'');
   const help=node('p','dimension-basis-help',project.quilt.sizeBasis==='before-borders'
    ?'Enter the center width and height in the quilt fields below. Each border layer adds twice its finished width to the outside. Backing, batting and binding use that final outside size.'
    :project.quilt.sizeBasis==='includes-borders'
    ?'Enter the already-finished outside width and height below. Border widths are subtracted to derive the center; backing, batting and binding use the entered outside size.'
    :'Older projects did not record whether dimensions included borders. No purchase-ready cutting or shopping estimate can be shown until you choose. Your original JSON and measurements are preserved.');
   box.append(label,select,help);fieldsRoot.appendChild(box);
   select.addEventListener('change',()=>{
    if(!requireCommittedDraft('confirm size basis')){select.value=project.quilt.sizeBasis||'';return;}
    const chosen=select.value;
    if(chosen!=='before-borders'&&chosen!=='includes-borders')return;
    const previous=project.quilt.sizeBasis;
    project.quilt.sizeBasis=chosen;
    try{resolveQuiltDimensions(project);}catch(err){
     project.quilt.sizeBasis=previous;
     select.value=previous||'';
     note(err instanceof Error?err.message:'Invalid finished quilt dimensions.',true);
     return;
    }
    project.quilt.topCutsReviewed=false;
    project.quilt.topCutsReviewFingerprint=undefined;
    persist();renderEditor();update();
   });
  }
  if(tool==='hub'||tool==='backing'){
   const wrap=node('div','field-wrap');
   wrap.dataset.backingDirectionSetting='';
   const label=node('label','','Backing seam direction (saved with project)');
   const select=node('select','field-control');
   label.htmlFor='backing-direction-setting';
   select.id='backing-direction-setting';
   for(const [value,title] of [
    ['auto','Auto · use least purchased yardage'],
    ['vertical','Vertical seams · save this exact orientation'],
    ['horizontal','Horizontal seams · save this exact orientation']
   ]){
    const option=node('option','',title);
    option.value=value;
    if(value==='horizontal'&&project.options.oneWayPrint)option.disabled=true;
    select.appendChild(option);
   }
   select.value=project.options.backingDirection??'auto';
   const help=node('p','hint','This choice is shared with the whole-quilt shopping list, physical cut CSV and saved JSON. Auto recalculates the least-yardage orientation when dimensions change; a manual direction is never silently replaced. Horizontal seams are not allowed for one-way print.');
   select.addEventListener('change',()=>changeBackingDirection(select.value as 'auto'|'vertical'|'horizontal'));
   wrap.append(label,select,help);
   fieldsRoot.appendChild(wrap);
  }
  for(const group of groups[tool])fieldsRoot.appendChild(makeGroup(group.title,group.fields));
  if(tool==='fabric')renderFabricEditor();
  if(tool==='borders')renderBorderEditor();
  if(tool==='inches'){
   const group=node('div');group.appendChild(node('h3','group-title','Exact conversion'));
   const wrap=node('div','field-wrap'),lbl=node('label','','Fabric yards (decimals or fractions)'),inp=node('input','field-control');
   lbl.htmlFor='yard-input';inp.id='yard-input';inp.value=conv;inp.inputMode='decimal';
   const hint=node('small','hint','Use decimals (1.5), fractions (3/8 or ¾), mixed fractions (1 1/2 or 1½), or correctly grouped thousands (1,000).');
   hint.id='yard-input-hint';
   const fieldError=node('span','field-error');fieldError.id='yard-input-error';fieldError.hidden=true;
   inp.setAttribute('aria-describedby',hint.id+' '+fieldError.id);
   inp.setAttribute('aria-invalid','false');
   inp.addEventListener('input',()=>{
    conv=inp.value;
    let message='';
    try{parseMeasure(conv);}catch(e){message=e instanceof Error?e.message:'Enter a valid number of yards.';}
    inp.setAttribute('aria-invalid',String(Boolean(message)));
    fieldError.textContent=message;fieldError.hidden=!message;
    update();
   });
   append(wrap,lbl,inp,hint,fieldError);group.appendChild(wrap);fieldsRoot.appendChild(group);
  }
  if(tool==='hub'){
   const review=node('section','top-cut-review'),heading=node('h3','','Confirm quilt-top cutting coverage');
   const label=node('label','top-cut-review-label'),control=node('input');
   control.type='checkbox';control.id='quilt-top-review';control.checked=hasCurrentQuiltTopReview(project);
   control.disabled=needsTopFabricPlan(project.fabrics)||(!project.quilt.sizeBasis&&project.borders.length>0);
   const words=node('span','','I reviewed every quilt-top color, cut size and piece quantity.');
   label.htmlFor=control.id;append(label,control,words);
   review.appendChild(heading);review.appendChild(label);
   review.appendChild(node('p','footer-note','Manual acknowledgement only: the calculator cannot prove all blocks are included. Replace the sample fabric data with your real quilt-top cutting list first. Changes to the quilt dimensions or any fabric SKU/cut group automatically revoke this confirmation.'));
   if(control.disabled)review.appendChild(node('p','footer-note','Enter positive-count cut pieces for every fabric SKU before reviewing.'));
   control.addEventListener('change',()=>{
    if(!requireCommittedDraft('confirm quilt-top cutting coverage')){control.checked=hasCurrentQuiltTopReview(project);return;}
    if(needsTopFabricPlan(project.fabrics)){control.checked=false;note('Quilt-top cutting coverage cannot be confirmed without cuts for each fabric SKU.',true);return;}
    project.quilt.topCutsReviewed=control.checked;
    project.quilt.topCutsReviewFingerprint=control.checked?quiltTopReviewFingerprint(project):undefined;
    persist();update();
   });
   fieldsRoot.appendChild(review);
   fieldsRoot.appendChild(node('p','footer-note','Need fabric colors or additional borders? Edit them on the dedicated Quilt Fabric and Borders pages; your local project is shared across all tools.'));
  }
 }
 function purchasesTitle(result:HTMLElement,buy:{rawPurchaseYards:number;roundedPurchaseYards:number;purchaseRoundingExtraLengthIn:number},name:string,unitPrice?:number){
  hero(result,yd(buy.roundedPurchaseYards),'ROUNDED PURCHASE · '+name,'Exact raw requirement: '+num(buy.rawPurchaseYards,4)+' yd. Purchase rounded upward to the chosen shop increment.');
  if(unitPrice!==undefined)result.appendChild(node('p','shopping-price-summary','Your entered price: '+money(unitPrice)+'/yd · Estimated material cost: '+money(buy.roundedPurchaseYards*unitPrice)+'. Taxes, shipping and other materials excluded.'));
 }
 function layoutSummary(result:HTMLElement,layout:Layout){
  if(!layout.isCutFeasible){warning(result,layout.error||'FIT_IMPOSSIBLE',true);return;}
  if(!verifyLayout(layout))throw Error('Internal geometry check failed. No purchase result can be shown.');
  stats(result,[['Cut run',num(layout.exactFabricRunLengthIn)+' in'],['Pieces',String(layout.cutPieces.length)],['True roll offcut',num(layout.physicalOffcutAreaSqIn,1)+' in²']]);
 }
 function materialPlan(parent:HTMLElement,sku:string,label:string,layout:Layout,index:number,purchaseYards?:number,exportSku=sku):void{
  const item=node('details','sku-plan');item.open=index===0;item.dataset.sku=sku;
  const noPieces=layout.isCutFeasible && layout.cutPieces.length===0;
  const summary=node('summary','sku-plan-summary');
  append(summary,node('span','sku-plan-label',label+' · '+sku),
   node('strong','',noPieces?'NOT PLANNED':purchaseYards===undefined?'FIT IMPOSSIBLE':yd(purchaseYards)+' yd'));
  item.appendChild(summary);
  // Only the first (open) roll is rendered at startup. Up to 30 rolls and
  // 2,000 pieces may be imported: allocating every closed SVG/table on each
  // calculator edit wastes DOM work and can cause long input latency.
  // CSV/export still operates exclusively on the complete verified Layouts.
  item.dataset.previewState='pending';
  const ensurePreview=()=>{
   if(item.dataset.previewState==='rendered')return;
   item.dataset.previewState='rendered';
   if(noPieces)warning(item,'No positive-count cut pieces are entered for this fabric SKU. This is not a zero-yard purchasing recommendation.');
   else if(layout.isCutFeasible){layoutSummary(item,layout);diagram(item,layout,'Cut plan · '+label,exportSku);}
   else warning(item,layout.error||'FIT_IMPOSSIBLE: no valid cut layout for this fabric.',true);
  };
  item.addEventListener('toggle',()=>{if(item.open)ensurePreview();});
  // beforeprint fires before the browser snapshots print styles. It must
  // synchronously materialize ALL roll previews: the async toggle event alone
  // can be too late and would leave printed materials blank.
  item.addEventListener('quilt-preview-for-print',ensurePreview);
  if(item.open)ensurePreview();
  parent.appendChild(item);
 }
 function topFabricShoppingLine(x:ReturnType<typeof calculateQuiltFabric>[number],unitPrice?:number,reviewed=true):ShoppingLine {
  const noPieces=x.layout.isCutFeasible && x.layout.cutPieces.length===0;
  return {
   label:x.label+' · '+x.fabricSku,
   rollId:physicalRollId('fabric',x.fabricSku),
   hint:noPieces?'No positive-count cut pieces: add cut groups or remove this unused SKU.':x.layout.cutPieces.length+' cut pieces (independent fabric SKU)',
   status:noPieces?'not-planned':(!reviewed && x.layout.isCutFeasible)?'not-reviewed':undefined,
   amount:noPieces?undefined:x.purchase?.roundedPurchaseYards,
   rawYards:noPieces?undefined:x.purchase?.rawPurchaseYards,
   offcutSqIn:noPieces?undefined:(x.layout.isCutFeasible?x.layout.physicalOffcutAreaSqIn:undefined),
   roundingExtraIn:noPieces?undefined:x.purchase?.purchaseRoundingExtraLengthIn,
   unitPrice
  };
 }
 function missingTopFabricShoppingLine():ShoppingLine {
  return {label:'Quilt-top fabric · no SKUs entered',
   hint:'Top fabric has not been planned. Add fabric colors and actual cut-piece quantities in Quilt Fabric Calculator.',
   status:'not-planned'};
 }
 function update():void{
  root!.dataset.printReady='false';
  if(fieldsRoot.querySelector('[aria-invalid="true"],[data-pending-edit="true"]')){
   markResultsStale('Commit or correct every highlighted input before updating or exporting the cutting plan. The previously accepted project is still safe.');
   note('Correct invalid input before updating the plan.',true);
   return;
  }
  const priorAcceptedFigure=lastAcceptedFigure;
  resultRoot.replaceChildren();cutExport=null;materialCuts=[];
  saveButton.disabled=false;
  exportButton.disabled=true;cutCsvButton.disabled=true;printButton.disabled=true;
  try{
   const p=project,o=p.options,w=p.quilt.finishedWidth,h=p.quilt.finishedHeight;
   const needsDimensions=['hub','backing','binding','batting','borders'].includes(tool);
   const dimensions:QuiltDimensions|undefined=needsDimensions?resolveQuiltDimensions(p):undefined;
   const outerW=dimensions?.finalWidthIn??w,outerH=dimensions?.finalHeightIn??h;
   if(dimensions){
    const summary=node('p','dimension-result-context',
      'Center before borders: '+num(dimensions.centerWidthIn)+' × '+num(dimensions.centerHeightIn)+
      ' in · Final outside: '+num(outerW)+' × '+num(outerH)+' in · Finished border width per side: '+
      num(dimensions.borderPerSideIn)+' in.');
    summary.dataset.finalQuiltDimensions='';
    resultRoot.appendChild(summary);
   }
   const buyArgs={step:o.step,shrinkageLengthPct:o.lengthShrinkage};
   let plan:unknown={};
   let layout:Layout|undefined,alternateLayout:Layout|undefined;
   let topFabricMissing=false;
   if(tool==='backing'){
    const b=calculateBacking({widthIn:outerW,heightIn:outerH,overageIn:o.overage,wofIn:o.usableWof,joinTakeupIn:o.joinTakeup,oneWayPrint:o.oneWayPrint,...buyArgs});
    const selected=selectBackingOption(b,o.backingDirection);
    purchasesTitle(resultRoot,selected.purchase,'BACKING',o.backingPricePerYard);
    stats(resultRoot,[['Backing size',num(b.targetWidthIn)+' × '+num(b.targetHeightIn)+' in'],['Panels',String(selected.panelCount)],['Joined span before trim',num(selected.finishedJoinedSpanIn)+' in']]);
    section(resultRoot,'Joined seam positions',selected.direction==='vertical'?'Along joined width · before trimming':'Along joined height · before trimming');
    if(selected.joinedSeamPositionsIn.length){
     table(resultRoot,['Seam number','Position in assembled backing','Construction assumption'],
      selected.joinedSeamPositionsIn.map((pos,i)=>[String(i+1),num(pos)+' in','Equal half of '+num(o.joinTakeup)+' in total loss per join']));
    }else resultRoot.appendChild(node('p','footer-note','One panel covers the requested span. No joined seam is required.'));
    resultRoot.appendChild(node('p','footer-note','Seam coordinates assume half of the total join take-up on each adjoining panel edge. They refer to the joined assembly before its final trim; trimming shifts the seam locations relative to the final edges.'));
    section(resultRoot,'Compare seam orientations','Choose Auto or lock a direction for every calculator using this saved project.');
    const options=node('div','option-buttons');
    const autoButton=node('button','','Auto · '+yd(b.recommended.purchase.roundedPurchaseYards)+' yd · least purchased');
    autoButton.type='button';autoButton.dataset.backingOption='auto';
    autoButton.setAttribute('aria-pressed',String((o.backingDirection??'auto')==='auto'));
    autoButton.addEventListener('click',()=>changeBackingDirection('auto'));
    options.appendChild(autoButton);
    for(const direction of b.options){
     const button=node('button','',direction.direction+' · '+yd(direction.purchase.roundedPurchaseYards)+' yd'+(direction.direction===b.recommended.direction?' · Best use':''));
     button.type='button';button.dataset.backingOption=direction.direction;
     button.setAttribute('aria-pressed',String((o.backingDirection??'auto')===direction.direction));
     button.addEventListener('click',()=>changeBackingDirection(direction.direction));
     options.appendChild(button);
    }
    resultRoot.appendChild(options);layout=selected.layout;materialCuts=[{material:'Backing · '+selected.direction+' seams',sku:'backing',layout:selected.layout}];
    warning(resultRoot,'The fabric-roll offcut shown does not include trimming the panel assembly after sewing. Assembly trim: '+num(selected.postAssemblyTrimAreaSqIn)+' in². Do not add it to roll offcuts.');
    plan={options:b.options,selected:selected.direction,backingDirectionMode:o.backingDirection??'auto'};
   }else if(tool==='binding'){
    const b=calculateStraightBinding({widthIn:outerW,heightIn:outerH,wofIn:o.usableWof,stripWidthIn:o.stripWidth,tailAllowanceIn:o.tailAllowance,joinLossIn:o.stripJoinLoss,...buyArgs});
    purchasesTitle(resultRoot,b.purchase,'STRAIGHT BINDING',o.bindingPricePerYard);
    stats(resultRoot,[['Required binding',num(b.requiredLengthIn)+' in'],['Strips',String(b.stripCount)],['Length after joins',num(b.effectiveJoinedLengthIn)+' in']]);
    warning(resultRoot,'Straight-grain binding only. Bias binding is NOT calculated.');layout=b.layout;materialCuts=[{material:'Straight-grain binding',sku:'binding',layout:b.layout}];plan=b;
   }else if(tool==='yardage'){
    const y=p.yardage;
    const comparison=compareYardageWidths({
      pieceWidthIn:y.pieceWidth,pieceHeightIn:y.pieceHeight,count:y.count,
      wofIn:o.usableWof,allowRotate:y.allowRotate??o.allowRotate,oneWayPrint:y.oneWayPrint??false,...buyArgs
    },y.alternateWof??o.usableWof);
    const r=comparison.current,alternative=comparison.alternate;
    if(y.oneWayPrint && (y.allowRotate??o.allowRotate))warning(resultRoot,'One-way print is selected: 90° rotation is disabled on both fabric widths to preserve print direction.');
    if(!r.purchase){warning(resultRoot,r.layout.error||'FIT_IMPOSSIBLE',true);}
    else{purchasesTitle(resultRoot,r.purchase,'RECTANGLE FABRIC');stats(resultRoot,[['Across fabric',String(r.across)],['Rows',String(r.rows)],['Pieces',String(y.count)]]);}
    const panel=node('section','width-comparison');panel.dataset.widthComparison='';
    section(panel,'Compare usable widths with actual cut layouts','Side-by-side purchase scenarios');
    stats(panel,[
      ['Current WOF',num(comparison.currentWofIn)+' in'],
      ['Current cut run',r.purchase?num(r.layout.exactFabricRunLengthIn)+' in':'Cannot fit'],
      ['Current purchase',r.purchase?num(r.purchase.roundedPurchaseYards)+' yd':'Cannot fit'],
      ['Alternate WOF',num(comparison.alternateWofIn)+' in'],
      ['Alternate cut run',alternative.purchase?num(alternative.layout.exactFabricRunLengthIn)+' in':'Cannot fit'],
      ['Alternate purchase',alternative.purchase?num(alternative.purchase.roundedPurchaseYards)+' yd':'Cannot fit']
    ]);
    if(comparison.roundedPurchaseDifferenceYards!==undefined)panel.appendChild(node('p','footer-note',
      'Rounded purchase difference (current minus alternate): '+num(comparison.roundedPurchaseDifferenceYards,4)+' yd. Positive means the alternate WOF requires fewer purchased yards; negative means it requires more.'));
    else warning(panel,'At least one WOF is not physically feasible. No purchase difference is claimed.',true);
    panel.appendChild(node('p','footer-note','Both widths use the same cut dimensions, piece count, rotation permission and prewash length shrinkage. The alternate is a comparison only: change Current usable WOF before exporting or buying that roll. An area-equivalent fabric conversion is not a cutting guarantee.'));
    resultRoot.appendChild(panel);
    alternateLayout=alternative.layout;
    layout=r.layout;materialCuts=[{material:'Rectangle fabric — CURRENT WOF only',sku:'yardage',layout:r.layout}];
    plan={...r,comparison};
   }else if(tool==='batting'){
    const b=calculateBatting({widthIn:outerW,heightIn:outerH,overageIn:o.battingOverage,rollWidthIn:o.battingWof,rotate:o.allowRotate,step:o.step});
    if(b.purchase){purchasesTitle(resultRoot,b.purchase,'ONE-PIECE BATTING',o.battingPricePerYard);stats(resultRoot,[['Required width',num(outerW+2*o.battingOverage)+' in'],['Required height',num(outerH+2*o.battingOverage)+' in'],['Roll WOF',num(o.battingWof)+' in']]);}
    else warning(resultRoot,b.message,true);
    layout=b.layout;materialCuts=[{material:'One-piece batting',sku:'batting',layout:b.layout}];plan=b;
   }else if(tool==='sashing'){
    const s=p.sashing,r=calculateSashing({rows:s.rows,columns:s.columns,blockWidthIn:s.blockWidth,blockHeightIn:s.blockHeight,finishedSashIn:s.width,seamIn:o.seam,wofIn:o.usableWof,step:o.step});
    if(r.purchase)purchasesTitle(resultRoot,r.purchase,'SASHING FABRIC');else warning(resultRoot,r.layout.error||'FIT_IMPOSSIBLE',true);
    stats(resultRoot,[['Vertical strips',String(r.vertical)],['Horizontal strips',String(r.horizontal)],['Cornerstones',String(r.cornerstones)],['Finished grid',num(r.finishedWidthIn)+' × '+num(r.finishedHeightIn)+' in']]);layout=r.layout;materialCuts=[{material:'Sashing and cornerstones',sku:'sashing',layout:r.layout}];plan=r;
   }else if(tool==='borders'){
    const b=calculateBorders({widthIn:dimensions!.centerWidthIn,heightIn:dimensions!.centerHeightIn,seamIn:o.seam,layers:p.borders,step:o.step});
    hero(resultRoot,String(b.layers.length),'BUTTED BORDER LAYERS','Final quilt '+num(b.finishedWidthIn)+' × '+num(b.finishedHeightIn)+' in. Side strips are attached before top and bottom strips.',b.layers.length===1?'layer':'layers');
    shopping(resultRoot,b.layers.map((x,i)=>({
     label:x.label+' · '+x.sku,rollId:physicalRollId('border',x.sku),hint:'Sides '+num(x.sideCutLengthIn)+' in; top/bottom '+num(x.topCutLengthIn)+' in',
     amount:x.purchase?.roundedPurchaseYards,rawYards:x.purchase?.rawPurchaseYards,
     offcutSqIn:x.layout.isCutFeasible?x.layout.physicalOffcutAreaSqIn:undefined,
     roundingExtraIn:x.purchase?.purchaseRoundingExtraLengthIn,
     unitPrice:p.borders[i].pricePerYard
    })),{sourceProjectHash:hashProject(p)});
    if(b.layers.some(x=>!x.purchase))warning(resultRoot,'At least one layer is FIT_IMPOSSIBLE at its specified WOF. No yardage is offered for that layer.',true);
    section(resultRoot,'Cutting diagrams by border layer','Open each layer to inspect its physical coordinates');
    b.layers.forEach((x,i)=>materialPlan(resultRoot,x.sku,x.label,x.layout,i,x.purchase?.roundedPurchaseYards,physicalRollId('border',x.sku)));
    materialCuts=b.layers.map(x=>({material:x.label,sku:physicalRollId('border',x.sku),layout:x.layout}));
    plan=b;
    warning(resultRoot,'Continuous, lengthwise-grain butted strips only. Do not use this result for mitered or separately pieced borders.');
   }else if(tool==='fabric'){
    const f=calculateQuiltFabric(p.fabrics,o.step);
    plan=f;
    topFabricMissing=needsTopFabricPlan(p.fabrics);
    if(!f.length){
     warning(resultRoot,'Quilt-top fabric is NOT PLANNED. Add a fabric SKU and positive-count cut pieces to generate a purchase plan.');
     shopping(resultRoot,[missingTopFabricShoppingLine()],{sourceProjectHash:hashProject(p)});
    }else{
     hero(resultRoot,String(f.length),'SEPARATE FABRIC SKUS','Only cut pieces you entered are counted. Each fabric color is an independent WOF, shrinkage and purchase scenario.',f.length===1?'SKU':'SKUs');
     shopping(resultRoot,f.map(x=>topFabricShoppingLine(x,p.fabrics.find(sku=>sku.id===x.fabricSku)?.pricePerYard)),{sourceProjectHash:hashProject(p)});
     if(f.some(x=>!x.purchase))warning(resultRoot,'One or more fabric SKUs contain a piece that cannot fit in the specified WOF.',true);
     section(resultRoot,'Cutting diagrams by fabric SKU','Each roll has independent coordinates and yardage');
     f.forEach((x,i)=>materialPlan(resultRoot,x.fabricSku,x.label,x.layout,i,x.purchase?.roundedPurchaseYards,physicalRollId('fabric',x.fabricSku)));
     materialCuts=f.map(x=>({material:x.label,sku:physicalRollId('fabric',x.fabricSku),layout:x.layout}));
     plan=f;
    }
   }else if(tool==='hub'){
    const border=calculateBorders({widthIn:dimensions!.centerWidthIn,heightIn:dimensions!.centerHeightIn,seamIn:o.seam,layers:p.borders,step:o.step});
    if(Math.abs(border.finishedWidthIn-outerW)>1e-7||Math.abs(border.finishedHeightIn-outerH)>1e-7)
     throw Error('Internal project dimensions disagree with finished border geometry; no purchase can be reported.');
    const backing=calculateBacking({widthIn:outerW,heightIn:outerH,overageIn:o.overage,wofIn:o.usableWof,joinTakeupIn:o.joinTakeup,oneWayPrint:o.oneWayPrint,...buyArgs});
    const selectedBacking=selectBackingOption(backing,o.backingDirection);
    const binding=calculateStraightBinding({widthIn:outerW,heightIn:outerH,wofIn:o.usableWof,stripWidthIn:o.stripWidth,tailAllowanceIn:o.tailAllowance,joinLossIn:o.stripJoinLoss,...buyArgs});
    const batting=calculateBatting({widthIn:outerW,heightIn:outerH,overageIn:o.battingOverage,rollWidthIn:o.battingWof,rotate:o.allowRotate,step:o.step});
    const fabric=calculateQuiltFabric(p.fabrics,o.step);
    topFabricMissing=needsTopFabricPlan(p.fabrics);
    hero(resultRoot,yd(selectedBacking.purchase.roundedPurchaseYards),'BACKING FABRIC ('+((o.backingDirection??'auto')==='auto'?'AUTO RECOMMENDED':'MANUALLY SELECTED')+')','Outside quilt: '+num(outerW)+' × '+num(outerH)+' in (center '+num(dimensions!.centerWidthIn)+' × '+num(dimensions!.centerHeightIn)+' in). '+selectedBacking.direction+' backing seams; this is one material, not the full shopping total.');
    const reviewedTop=hasCurrentQuiltTopReview(p);
    // A single readiness checklist is placed directly after the result hero
    // after all material roll feasibility checks have run, rather than
    // stacking warnings here, in shopping, and again after the SVG.
    shopping(resultRoot,[
     {label:'Backing · '+selectedBacking.direction+' seams',rollId:'backing',hint:selectedBacking.panelCount+' full WOF panels',
      amount:selectedBacking.purchase.roundedPurchaseYards,rawYards:selectedBacking.purchase.rawPurchaseYards,
      offcutSqIn:selectedBacking.layout.physicalOffcutAreaSqIn,roundingExtraIn:selectedBacking.purchase.purchaseRoundingExtraLengthIn,
      assemblyTrimSqIn:selectedBacking.postAssemblyTrimAreaSqIn,unitPrice:o.backingPricePerYard},
     {label:'Batting · single piece only',rollId:'batting',hint:batting.message,amount:batting.purchase?.roundedPurchaseYards,
      rawYards:batting.purchase?.rawPurchaseYards,offcutSqIn:batting.isCutFeasible?batting.layout.physicalOffcutAreaSqIn:undefined,
      roundingExtraIn:batting.purchase?.purchaseRoundingExtraLengthIn,unitPrice:o.battingPricePerYard},
     {label:'Straight-grain binding',rollId:'binding',hint:binding.stripCount+' full WOF strips',amount:binding.purchase.roundedPurchaseYards,
      rawYards:binding.purchase.rawPurchaseYards,offcutSqIn:binding.layout.physicalOffcutAreaSqIn,
      roundingExtraIn:binding.purchase.purchaseRoundingExtraLengthIn,unitPrice:o.bindingPricePerYard},
     ...border.layers.map((x,i)=>({label:x.label+' · '+x.sku,rollId:physicalRollId('border',x.sku),hint:'Butted borders',amount:x.purchase?.roundedPurchaseYards,
      rawYards:x.purchase?.rawPurchaseYards,offcutSqIn:x.layout.isCutFeasible?x.layout.physicalOffcutAreaSqIn:undefined,
      roundingExtraIn:x.purchase?.purchaseRoundingExtraLengthIn,unitPrice:p.borders[i].pricePerYard})),
     ...(fabric.length?fabric.map(x=>topFabricShoppingLine(x,p.fabrics.find(sku=>sku.id===x.fabricSku)?.pricePerYard,reviewedTop)):[missingTopFabricShoppingLine()])
    ],{centralReadiness:true,sourceProjectHash:hashProject(p)});
    section(resultRoot,'Cutting diagrams for every material','Individual fabric rolls · open each plan to inspect coordinates').id='project-material-diagrams';
    materialPlan(resultRoot,'backing','Backing · '+selectedBacking.direction+' seams',selectedBacking.layout,0,selectedBacking.purchase.roundedPurchaseYards);
    materialPlan(resultRoot,'binding','Straight-grain binding',binding.layout,1,binding.purchase.roundedPurchaseYards);
    materialPlan(resultRoot,'batting','One-piece batting',batting.layout,2,batting.purchase?.roundedPurchaseYards);
    border.layers.forEach((item,i)=>materialPlan(resultRoot,'border-'+item.sku,item.label+' · border',item.layout,3+i,item.purchase?.roundedPurchaseYards,physicalRollId('border',item.sku)));
    fabric.forEach((item,i)=>materialPlan(resultRoot,'fabric-'+item.fabricSku,item.label+' · '+item.fabricSku,item.layout,3+border.layers.length+i,item.purchase?.roundedPurchaseYards,physicalRollId('fabric',item.fabricSku)));
    materialCuts=[
     {material:'Backing · '+selectedBacking.direction+' seams',sku:'backing',layout:selectedBacking.layout},
     {material:'Straight-grain binding',sku:'binding',layout:binding.layout},
     {material:'One-piece batting',sku:'batting',layout:batting.layout},
     ...border.layers.map(x=>({material:x.label+' · border',sku:physicalRollId('border',x.sku),layout:x.layout})),
     ...fabric.map(x=>({material:x.label,sku:physicalRollId('fabric',x.fabricSku),layout:x.layout}))
    ];
    plan={dimensions,backing,selectedBacking,backingDirectionMode:o.backingDirection??'auto',binding,batting,border,fabric};
    if(sample)resultRoot.appendChild(node('p','footer-note','Sample project: fabric and border colors are examples. Replace all sample values before purchasing. Material quantities remain separate by roll and SKU.'));
   }else if(tool==='inches'){
    const value=parseMeasure(conv),inches=yardsToInches(value),cm=inches*2.54;
    const h1=node('div','result-hero');append(h1,node('span','result-kicker','EXACT LENGTH CONVERSION'),node('div','result-big',num(inches)+' in'),node('p','result-sub',num(value)+' yards = '+num(inches)+' inches = '+num(cm,4)+' centimeters'));resultRoot.appendChild(h1);
    section(resultRoot,'Fabric fraction quick chart','Exact conversion');
    const grid=node('div','fraction-grid');
    for(let e=1;e<=8;e++){const c=node('div');append(c,node('b','',e===8?'1':frac[e]),node('small','',num(e*36/8)+' in'),node('small','',num(e*36/8*2.54)+' cm'));grid.appendChild(c);}
    resultRoot.appendChild(grid);warning(resultRoot,'Fabric yards describe length along a bolt. They do not specify usable fabric width.');plan={yards:value,inches,centimeters:cm};
   }
   if(layout){layoutSummary(resultRoot,layout);diagram(resultRoot,layout,'Cut plan / CURRENT fabric roll',materialCuts[0]?.sku);}
   if(alternateLayout){
    const alternatePanel=node('section','alternate-compare-plan');
    alternatePanel.dataset.alternateComparePlan='';
    section(alternatePanel,'Alternate WOF cutting schematic','Comparison only · not in current cut-list CSV or printed cut plan');
    layoutSummary(alternatePanel,alternateLayout);
    diagram(alternatePanel,alternateLayout,'Alternate roll / not the selected purchase',undefined,'comparison');
    resultRoot.appendChild(alternatePanel);
   }
   const anyInfeasible=materialCuts.some(x=>!x.layout.isCutFeasible);
   const physicalCutPieceCount=materialCuts.reduce((total,x)=>total+x.layout.cutPieces.length,0);
   const hasPhysicalCuts=physicalCutPieceCount>0;
   const topCutListNotReviewed=tool==='hub' && !hasCurrentQuiltTopReview(project) && !topFabricMissing;
   const readyPhysicalPlan=materialCuts.length>0 && !anyInfeasible && hasPhysicalCuts && !topFabricMissing && !topCutListNotReviewed;
   const printable=tool==='inches' || readyPhysicalPlan;
   const readiness={
    scope:tool==='hub'?'entered-project-materials':tool==='fabric'?'entered-top-fabric-skus':tool==='inches'?'length-conversion':'single-material',
    status:tool==='inches'?'LENGTH_CONVERSION':topFabricMissing?'TOP_FABRIC_NOT_PLANNED':anyInfeasible?'FIT_IMPOSSIBLE':topCutListNotReviewed?'TOP_CUT_LIST_NOT_REVIEWED':readyPhysicalPlan?'LISTED_CUTS_FEASIBLE':'NO_PHYSICAL_CUTS',
    topFabricMissing,topCutsReviewed:hasCurrentQuiltTopReview(project),topCutListNotReviewed,
    hasInfeasibleMaterial:anyInfeasible,physicalCutPieceCount,
    cutCsvReady:readyPhysicalPlan,printReady:printable
   };
   const record={tool,sourceProjectHash:hashProject(project),calculationVersion:VERSION,calculatedAt:new Date().toISOString(),projectUnits:project.units,dimensions,readiness,result:plan};
   cutExport=record;
   exportButton.disabled=false;
   printButton.disabled=!printable;
   cutCsvButton.disabled=!readyPhysicalPlan;
   root!.dataset.printReady=printButton.disabled?'false':'true';
   if(tool==='hub'){
    const unfitRolls=materialCuts.filter(x=>!x.layout.isCutFeasible).length;
    const panel=projectReadinessPanel(topFabricMissing,hasCurrentQuiltTopReview(p),unfitRolls,readyPhysicalPlan);
    const headline=resultRoot.querySelector('.result-hero');
    if(headline)headline.after(panel);
    else resultRoot.prepend(panel);
   }else{
    if(anyInfeasible)warning(resultRoot,'PRINT BLOCKED: at least one current material roll cannot fit its required cut. The JSON calculation export remains available for diagnosis, but this is not a complete cut-ready plan.',true);
    if(topFabricMissing)warning(resultRoot,'COMPLETE PLAN EXPORT BLOCKED: quilt-top fabric is NOT PLANNED for at least one SKU. Add real cut-piece quantities or remove unused SKUs. JSON diagnostics remain available.',true);
    if(topCutListNotReviewed)warning(resultRoot,'WHOLE-PROJECT EXPORT BLOCKED: your entered quilt-top cuts have not been manually checked for coverage. Confirm the cutting list before printing or exporting a complete project CSV.',true);
    else if(tool!=='inches' && !hasPhysicalCuts)warning(resultRoot,'There are no physical cut pieces in this plan. Print and cut-list CSV are disabled until a material has real cuts.');
   }
   resultRoot.prepend(node('p','calculation-context','Project · '+(dimensions?'final '+num(outerW)+' × '+num(outerH)+' in':'entered '+num(w)+' × '+num(h)+' in')+' · '+(project.units==='cm'?'cm display':'inch display')));
   // Visual feedback announces an actual primary-value change without
   // interpolating, re-rounding or altering the real calculated number.
   // It is suppressed for incomplete and conflicted plans.
   const currentHero=resultRoot.querySelector('.result-hero');
   const currentKicker=currentHero?.querySelector('.result-kicker')?.textContent||'';
   const currentFigure=currentHero?.querySelector('.result-big')?.textContent||'';
   const estimateSafe=!anyInfeasible&&!topFabricMissing&&!topCutListNotReviewed&&syncWarning.hidden;
   if(estimateSafe&&priorAcceptedFigure?.value&&currentFigure&&
      priorAcceptedFigure.label===currentKicker&&priorAcceptedFigure.value!==currentFigure){
    const changed=node('p','result-change','Updated estimate: '+priorAcceptedFigure.value+' → '+currentFigure+'. Recheck layout, rounding and fabric assumptions before purchasing.');
    changed.dataset.resultChange='';
    currentHero?.after(changed);
   }
   if(estimateSafe&&currentFigure&&currentKicker)
    lastAcceptedFigure={label:currentKicker,value:currentFigure};
   resultRoot.appendChild(node('p','footer-note','Cut lengths and coordinates use inches. Purchase rounding is applied once. Print diagrams are schematic, not actual-size templates.'));
   const audit=node('details','calculation-audit');
   audit.dataset.calculationAudit='';
   audit.appendChild(node('summary','','Calculation source and version'));
   audit.appendChild(node('p','', 'Source project hash: '+record.sourceProjectHash+' · Calculator '+VERSION+' · Calculated at '+record.calculatedAt+'. Export JSON for full machine-readable values.'));
   resultRoot.appendChild(audit);
   const incompleteProject=anyInfeasible || topFabricMissing || topCutListNotReviewed;
   const time=new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
   note(tool==='hub'
    ?(incompleteProject?'Incomplete material plan · backing estimate available · see 3-step checklist · ':'✓ Updated from the current project · listed cuts reviewed · ')+time
    :(incompleteProject?'⚠ Incomplete material plan · check review, missing cuts or infeasible rolls · ':'✓ Updated from the current project · ')+time,
    tool!=='hub'&&incompleteProject);
   // Recalculating a valid local edit must not re-enable outputs while
   // another tab holds a newer saved project. Save project remains enabled.
   if(!syncWarning.hidden){
    blockConflictedOutputs();
    note(unreadableSavedJson!==null
     ?'Unreadable original autosave remains protected. Download its raw backup before explicitly replacing it. The displayed project is not saved.'
     :'This tab has unsaved edits and another tab saved a different project. Save a JSON backup, then load the newest project before exporting.',true);
   }
  }catch(err){root!.dataset.printReady='false';cutExport=null;materialCuts=[];exportButton.disabled=true;cutCsvButton.disabled=true;printButton.disabled=true;warning(resultRoot,(err instanceof Error ? err.message : 'Unknown calculation error'),true);
    const detail=err instanceof Error?err.message:'';
    note(detail.includes('SIZE BASIS NOT CONFIRMED')?'Choose how the saved quilt measurements relate to the border layers before estimating materials.':detail.includes('BORDER FIT IMPOSSIBLE')?'The border widths cannot fit inside the entered finished size; correct the dimensions before exporting.':'Cannot prove this cut is feasible. Review your measurements.',true);}
 }
 unitsSelect.addEventListener('change',()=>{if(!requireCommittedDraft('change units')){unitsSelect.value=project.units;return;}project.units=unitsSelect.value==='cm'?'cm':'in';persist();renderEditor();update();});
 root.querySelector('[data-action="recalculate"]')?.addEventListener('click',()=>{
  update();
  // A keyboard or switch-control user must remain next to the exact field
  // that blocks recalculation, not be scrolled to stale shopping results.
  const blocked=fieldsRoot.querySelector<HTMLInputElement>('[aria-invalid="true"],[data-pending-edit="true"]');
  if(blocked){blocked.focus();return;}
  if(window.matchMedia('(max-width:760px)').matches){
   const results=root.querySelector<HTMLElement>('#results');
   results?.scrollIntoView({
    behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
    block:'start'
   });
   // Transferring programmatic focus after a successful explicitly requested
   // update makes the fresh results discoverable to assistive technology.
   results?.focus({preventScroll:true});
  }
 });
 root.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{
  if(unreadableSavedJson!==null){
   note('Reset blocked: download the original raw autosave and explicitly replace it before resetting a project.',true);
   return;
  }
  if(!requireCommittedDraft('reset the project'))return;
  // Refuse to discard even this tab's unsaved edits when the shared storage
  // has changed in another tab. A user can first download a JSON backup or
  // deliberately load the newer saved project.
  let storageReadable=true;
  try{
   if(localStorage.getItem(STORAGE_KEY)!==lastStoredJson){
    showStorageConflict();
    note('Reset canceled: another tab saved a newer project. Download your JSON backup or load the latest project first.',true);
    return;
   }
  }catch{storageReadable=false;}
  if(!resetSnapshot){
   resetSnapshot={
    project:structuredClone(project),sample,conv,
    savedJson:lastStoredJson
   };
  }
  project=structuredClone(sampleProject);sample=true;conv='1/4';
  undoResetButton.disabled=false;
  if(storageReadable){
   try{
    localStorage.removeItem(STORAGE_KEY);lastStoredJson=null;syncWarning.hidden=true;
    stateLabel.textContent='● Sample project';
    storageState.textContent='Sample restored. Undo reset restores your previous project in this tab.';
   }catch{storageUnavailable();}
  }else storageUnavailable();
  renderEditor();update();
 });
 undoResetButton.addEventListener('click',()=>{
  if(!requireCommittedDraft('undo a reset'))return;
  const previous=resetSnapshot;
  if(!previous)return;
  clearResetSnapshot();
  project=structuredClone(previous.project);sample=previous.sample;
  conv=previous.conv;
  let conflicted=false;
  try{
   const current=localStorage.getItem(STORAGE_KEY);
   if(current!==lastStoredJson){
    conflicted=true;
    showStorageConflict();
   }else{
    if(previous.savedJson!==null)localStorage.setItem(STORAGE_KEY,previous.savedJson);
    else localStorage.removeItem(STORAGE_KEY);
    lastStoredJson=previous.savedJson;
    syncWarning.hidden=true;
    stateLabel.textContent=sample?'● Sample project':'● My local project';
    storageState.textContent=sample?'Sample project restored.':'Previous project and browser autosave restored.';
   }
  }catch{storageUnavailable();}
  renderEditor();update();
  if(conflicted)note('Previous local project restored without changing the newer project in another tab. Save a JSON backup of this version.',true);
 });
 saveButton.addEventListener('click',()=>{
  if(fieldsRoot.querySelector('[aria-invalid="true"],[data-pending-edit="true"]')){
   note('Commit or correct the current input before downloading a project backup.',true);return;
  }
  download('quilt-studio-project-v2.json',project);
 });
 exportButton.addEventListener('click',()=>{
  if(cutExport && requireCurrentOutput('download cutting-plan JSON'))
   download('quilt-studio-cut-plan-v2.json',cutExport);
 });
 cutCsvButton.addEventListener('click',()=>{
  if(!cutExport || cutCsvButton.disabled || !requireCurrentOutput('download a cut list'))return;
  try{
   const sourceProjectHash=hashProject(project);
    const blob=new Blob([cutListCsv(materialCuts,sourceProjectHash)],{type:'text/csv;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='quilt-studio-cut-list-'+sourceProjectHash+'.csv';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(error){note(error instanceof Error?error.message:'Could not export cutting list.',true);}
 });
 let printingExpanded=false;
 let collapsedForPrint:HTMLDetailsElement[]=[];
 window.addEventListener('beforeprint',()=>{
  if(printingExpanded)return;
  // The browser menu/Ctrl+P bypasses the disabled Print button entirely.
  if(!requireCurrentOutput('print a cutting plan'))return;
  if(root!.dataset.printReady!=='true')return;
  printingExpanded=true;
  const plans=[...resultRoot.querySelectorAll<HTMLDetailsElement>('details.sku-plan')];
  // Never accidentally populate incomplete/stale print content. When valid,
  // create the hidden preview tables synchronously before the print snapshot.
  if(root!.dataset.printReady==='true')
   plans.forEach(el=>el.dispatchEvent(new Event('quilt-preview-for-print')));
  collapsedForPrint=plans.filter(el=>!el.open);
  collapsedForPrint.forEach(el=>el.open=true);
 });
 window.addEventListener('afterprint',()=>{
  if(!printingExpanded)return;
  collapsedForPrint.forEach(el=>el.open=false);
  collapsedForPrint=[];printingExpanded=false;
 });
 printButton.addEventListener('click',()=>{
  if(cutExport && requireCurrentOutput('print a cutting plan'))window.print();
 });
 const picker=root.querySelector<HTMLInputElement>('[data-file]')!;
 root.querySelector('[data-action="import"]')?.addEventListener('click',()=>{
  if(requireCommittedDraft('import a project'))picker.click();
 });
 picker.addEventListener('change',async()=>{
  const file=picker.files?.[0];if(!file)return;
  try{
   if(!requireCommittedDraft('import a project'))return;
   if(file.size>1024*1024)throw Error('Project JSON must be below 1 MB.');
   // Reading a file yields control to the browser. Both an accepted local edit
   // and a different tab's autosave can happen while the file is loading.
   // Check exact source state after the await: a valid but stale JSON import
   // must NEVER silently erase those newer measurements or acknowledgments.
   const startProjectJson=JSON.stringify(project);
   const startStoredJson=lastStoredJson;
   const imported=validateProject(JSON.parse(await file.text()));
   if(!requireCommittedDraft('import a project'))return;
   let changedInOtherTab=false;
   try{changedInOtherTab=localStorage.getItem(STORAGE_KEY)!==startStoredJson;}
   catch{/* Private/blocked localStorage: protect in-memory edits instead. */}
   if(JSON.stringify(project)!==startProjectJson || lastStoredJson!==startStoredJson || changedInOtherTab){
    if(changedInOtherTab)showStorageConflict();
    note('Import canceled: the project changed while the file was loading. Your newer edits are preserved. Select the JSON file again if you still want to replace this project.',true);
    return;
   }
   project=imported;persist();renderEditor();update();
  }catch(e){note('Could not import project: '+(e instanceof Error?e.message:'Invalid project file'),true);}
  finally{picker.value='';}
 });
 if(unreadableSavedJson===null)stateLabel.textContent=sample?'● Sample project':'● My local project';
 renderEditor();update();
}
