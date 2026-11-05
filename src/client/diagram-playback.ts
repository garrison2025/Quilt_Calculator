/**
 * View-only, opt-in cut-order walkthrough for physical layout SVGs.
 * Never alters the verified Layout, SVG dimensions/coordinates, shopping math,
 * CSV source rows or print geometry. At rest every cut is fully visible.
 */
export function attachCutWalkthrough(wrapper:HTMLElement,svg:SVGSVGElement):void{
 const cuts=[...svg.querySelectorAll<SVGRectElement>('rect[data-cut-index]')];
 if(cuts.length===0)return;
 const labels=[...svg.querySelectorAll<SVGTextElement>('text[data-preview-step]')];
 const count=cuts.length;
 const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const toolbar=document.createElement('div');
 toolbar.className='cut-walkthrough';
 toolbar.dataset.cutWalkthrough='';
 toolbar.dataset.playState='all';
 toolbar.setAttribute('aria-label','Cut-order diagram walkthrough');

 const intro=document.createElement('div');
 intro.className='cut-walkthrough-intro';
 const heading=document.createElement('strong');
 heading.textContent='Explore the cut order';
 const helper=document.createElement('span');
 helper.textContent='Visual walkthrough only · measurements and exported cuts never change';
 intro.append(heading,helper);

 const actions=document.createElement('div');
 actions.className='cut-walkthrough-actions';
 const button=(action:string,label:string)=>{
  const el=document.createElement('button');
  el.type='button';el.className='action-secondary walkthrough-button';
  el.dataset.action=action;el.textContent=label;
  return el;
 };
 const play=button('diagram-play',reduceMotion?'Auto-play unavailable':'Play sequence');
 const next=button('diagram-next','Next cut');
 const reset=button('diagram-reset','Show all cuts');
 if(reduceMotion){
  play.disabled=true;
  play.title='Your device requests reduced motion. Use Next cut or the position slider.';
 }
 actions.append(play,next,reset);

 // Zoom is display-only. Width scales the identical viewBox within a
 // horizontally scrollable viewport; exact SVG coordinates remain immutable.
 const stage=svg.parentElement;
 if(!(stage instanceof HTMLElement)||!stage.classList.contains('cut-diagram-stage'))
  throw Error('Cut walkthrough requires a dedicated SVG scroll viewport.');
 const zoom=document.createElement('div');
 zoom.className='cut-zoom-controls';
 zoom.dataset.cutZoomControls='';
 const zoomLabel=document.createElement('span');
 zoomLabel.className='cut-zoom-label';zoomLabel.textContent='Diagram view';
 const zoomOut=button('diagram-zoom-out','Zoom out');
 const zoomIn=button('diagram-zoom-in','Zoom in');
 const zoomReset=button('diagram-zoom-reset','Reset zoom');
 const zoomValue=document.createElement('output');zoomValue.className='cut-zoom-value';
 zoomValue.setAttribute('aria-label','Current diagram zoom');
 zoom.append(zoomLabel,zoomOut,zoomValue,zoomIn,zoomReset);
 const zoomSteps=[1,1.5,2,3];
 let zoomIndex=0;
 function applyZoom():void{
  const factor=zoomSteps[zoomIndex];
  svg.style.width=String(factor*100)+'%';
  svg.style.maxWidth='none';
  svg.dataset.previewZoom=String(factor);
  zoomValue.textContent=String(Math.round(factor*100))+'%';
  zoomOut.disabled=zoomIndex===0;
  zoomIn.disabled=zoomIndex===zoomSteps.length-1;
  zoomReset.disabled=zoomIndex===0;
  if(zoomIndex===0)stage.scrollLeft=0;
 }
 zoomOut.addEventListener('click',()=>{zoomIndex=Math.max(0,zoomIndex-1);applyZoom();});
 zoomIn.addEventListener('click',()=>{zoomIndex=Math.min(zoomSteps.length-1,zoomIndex+1);applyZoom();});
 zoomReset.addEventListener('click',()=>{zoomIndex=0;applyZoom();});
 applyZoom();

 const progress=document.createElement('div');
 progress.className='cut-walkthrough-progress';
 const label=document.createElement('label');
 const id='cut-walkthrough-'+Math.random().toString(36).slice(2);
 label.htmlFor=id;label.textContent='Preview position';
 const range=document.createElement('input');
 range.type='range';range.id=id;range.min='0';range.max=String(count+1);range.step='1';
 // 0 = no cuts highlighted; 1..N = one selected cut; N+1 = all visible.
 // Distinct final states keep the last real cut accessible on touch/keyboard.
 range.value=String(count+1);range.className='cut-walkthrough-range';
 range.setAttribute('aria-label','Cut-order preview position');
 const countText=document.createElement('output');
 countText.className='cut-walkthrough-count';
 countText.htmlFor=id;
 countText.textContent='All '+count+' cuts';
 countText.setAttribute('aria-live','off');
 const status=document.createElement('span');
 status.className='cut-walkthrough-status';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 status.textContent=reduceMotion?'Manual cut-by-cut inspection is available.':'All planned cuts are visible.';
 progress.append(label,range,countText,status);
 toolbar.append(intro,actions,zoom,progress);
 // Selectable geometric inspection reads existing SVG attributes, never
 // re-runs or rewrites the independently verified layout.
 const inspector=document.createElement('div');
 inspector.className='cut-piece-inspector';
 inspector.dataset.cutInspector='';
 const inspectTitle=document.createElement('strong');
 inspectTitle.className='cut-inspector-title';
 const inspectDetail=document.createElement('div');
 inspectDetail.className='cut-inspector-grid';
 inspector.append(inspectTitle,inspectDetail);
 toolbar.append(inspector);
 wrapper.append(toolbar);
 function formatInches(raw:string|undefined):string{
  if(raw===undefined||!Number.isFinite(Number(raw)))return '—';
  return Number(raw).toLocaleString('en-US',{maximumFractionDigits:4})+' in';
 }
 function inspectorFields(rect:SVGRectElement):void{
  inspectDetail.replaceChildren();
  const rows=[
   ['Roll X',formatInches(rect.dataset.rollXIn)],
   ['Roll Y',formatInches(rect.dataset.rollYIn)],
   ['Cut width',formatInches(rect.dataset.cutWidthIn)],
   ['Cut height',formatInches(rect.dataset.cutHeightIn)],
   ['Grain rotation',(rect.dataset.grainRotation||'0')+'°']
  ];
  for(const [name,value] of rows){
   const item=document.createElement('div');
   const dt=document.createElement('span');dt.textContent=name;
   const dd=document.createElement('b');dd.textContent=value;
   item.append(dt,dd);inspectDetail.append(item);
  }
 }

 let current=count;
 let showAll=true;
 let playing=false;
 let frame=0;
 let lastTick=0;
 const interval=Math.max(90,Math.min(600,Math.round(8500/count)));
 function cancel():void{
  playing=false;
  if(frame){cancelAnimationFrame(frame);frame=0;}
  lastTick=0;
  play.textContent=reduceMotion?'Auto-play unavailable':'Play sequence';
 }
 function render(position:number,all=false):void{
  current=Math.max(0,Math.min(count,Math.round(position)));
  showAll=all;
  toolbar.dataset.playState=showAll?'all':playing?'playing':'paused';
  svg.dataset.previewPosition=String(current);
  // Never modify x/y/width/height or exported material coordinates.
  cuts.forEach((rect,i)=>{
   rect.dataset.previewPhase=showAll?'all':i<current-1?'past':i===current-1?'current':'future';
  });
  labels.forEach(text=>{
   const i=Number(text.dataset.previewStep)-1;
   text.dataset.previewPhase=showAll?'all':i<current-1?'past':i===current-1?'current':'future';
  });
  range.value=String(showAll?count+1:current);
  countText.textContent=showAll?'All '+count+' cuts':current+' of '+count+' cuts';
  if(showAll){
   inspectTitle.textContent='Full cut layout · '+count+' displayed';
   inspectDetail.textContent='Select a cut on the diagram, use Next cut, or move the slider to inspect its measured position. Full-precision values remain available in the cut-list CSV.';
  }else if(current===0){
   inspectTitle.textContent='Start of cut order';
   inspectDetail.textContent='No cuts highlighted yet. Move to step 1 to see the first piece.';
  }else{
   const cut=cuts[current-1];
   inspectTitle.textContent='Cut '+current+' / '+count+' · '+(cut.dataset.cutLabel||'unnamed piece');
   inspectorFields(cut);
  }
  next.disabled=playing;
  // Coordinate table rows subscribe to this local SVG event. There is no
  // global document handler, so separate fabric SKUs remain isolated.
  svg.dispatchEvent(new CustomEvent('quilt-cut-selected',{
   detail:{position:current,all:showAll}
  }));
 }
 function announce(message:string):void{status.textContent=message;}
 function tick(now:number):void{
  if(!playing)return;
  if(!wrapper.isConnected||document.hidden){cancel();return;}
  if(lastTick===0)lastTick=now;
  if(now-lastTick>=interval){
   lastTick=now;
   render(current+1);
   if(current>=count){
    cancel();render(count);
    announce('Cut '+count+' of '+count+' highlighted. Choose Show all cuts to restore the entire layout.');
    return;
   }
  }
  frame=requestAnimationFrame(tick);
 }
 play.addEventListener('click',()=>{
  if(reduceMotion)return;
  if(playing){
   cancel();render(current);
   announce('Cut order paused at '+current+' of '+count+'.');
   return;
  }
  if(showAll||current===count)render(0);
  playing=true;
  play.textContent='Pause sequence';
  render(current);
  announce('Playing visual cut order; no plan data changes.');
  frame=requestAnimationFrame(tick);
 });
 next.addEventListener('click',()=>{
  cancel();
  render(showAll||current===count?1:current+1);
  announce('Showing cut '+current+' of '+count+'.');
 });
 reset.addEventListener('click',()=>{
  cancel();render(count,true);
  announce('All '+count+' cuts restored.');
 });
 range.addEventListener('input',()=>{
  cancel();
  const raw=Number(range.value);
  render(raw>count?count:raw,raw>count);
  announce(showAll?'All '+count+' cuts visible.':'Showing '+current+' of '+count+' cuts.');
 });
 // Pointer shortcut uses the same semantic state as the keyboard-accessible
 // range and Next button; SVG geometry remains untouched.
 svg.addEventListener('quilt-select-cut',event=>{
  const index=Number((event as CustomEvent<number>).detail);
  if(!Number.isInteger(index)||index<1||index>count)return;
  cancel();render(index);
  announce('Showing cut '+index+' of '+count+' cuts, selected from the coordinate table.');
 });
 svg.addEventListener('click',event=>{
  const target=event.target;
  if(!(target instanceof SVGRectElement))return;
  const index=Number(target.dataset.cutIndex);
  if(!Number.isInteger(index)||index<1||index>count)return;
  cancel();render(index);
  announce('Showing cut '+index+' of '+count+' cuts.');
 });
 render(count,true);
}
