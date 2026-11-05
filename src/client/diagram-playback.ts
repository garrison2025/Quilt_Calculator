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

 const progress=document.createElement('div');
 progress.className='cut-walkthrough-progress';
 const label=document.createElement('label');
 const id='cut-walkthrough-'+Math.random().toString(36).slice(2);
 label.htmlFor=id;label.textContent='Preview position';
 const range=document.createElement('input');
 range.type='range';range.id=id;range.min='0';range.max=String(count);range.step='1';
 range.value=String(count);range.className='cut-walkthrough-range';
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
 toolbar.append(intro,actions,progress);
 wrapper.append(toolbar);

 let current=count;
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
 function render(position:number):void{
  current=Math.max(0,Math.min(count,Math.round(position)));
  toolbar.dataset.playState=current===count?'all':playing?'playing':'paused';
  svg.dataset.previewPosition=String(current);
  // Never modify x/y/width/height or exported material coordinates.
  cuts.forEach((rect,i)=>{
   rect.dataset.previewPhase=current===count?'all':i<current-1?'past':i===current-1?'current':'future';
  });
  labels.forEach(text=>{
   const i=Number(text.dataset.previewStep)-1;
   text.dataset.previewPhase=current===count?'all':i<current-1?'past':i===current-1?'current':'future';
  });
  range.value=String(current);
  countText.textContent=current===count?'All '+count+' cuts':current+' of '+count+' cuts';
  next.disabled=playing;
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
    announce('Walkthrough complete. All '+count+' cuts are visible.');
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
  if(current===count)render(0);
  playing=true;
  play.textContent='Pause sequence';
  render(current);
  announce('Playing visual cut order; no plan data changes.');
  frame=requestAnimationFrame(tick);
 });
 next.addEventListener('click',()=>{
  cancel();
  render(current===count?1:current+1);
  announce('Showing cut '+current+' of '+count+'.');
 });
 reset.addEventListener('click',()=>{
  cancel();render(count);
  announce('All '+count+' cuts restored.');
 });
 range.addEventListener('input',()=>{
  cancel();render(Number(range.value));
  announce(current===count?'All cuts visible.':'Showing '+current+' of '+count+' cuts.');
 });
 render(count);
}
