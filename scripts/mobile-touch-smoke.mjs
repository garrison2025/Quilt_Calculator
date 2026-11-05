// Two separate browser engines, both in Playwright device emulation.
// WebKit on Linux is NOT an actual iPhone, and chromium Pixel emulation is
// NOT an Android handset. Hardware-specific gestures remain a manual gate.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit,devices} from 'playwright';

const origin='http://127.0.0.1:4321';
const preview=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{
 stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'
});
let log='';
preview.stdout.on('data',chunk=>{log+=chunk.toString();});
preview.stderr.on('data',chunk=>{log+=chunk.toString();});
let activeBrowser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const runId='mobile-touch-'+Date.now();
try{
 let ready=false;
 for(let n=0;n<85;n++){
  if(preview.exitCode!==null)throw Error('Preview failed: '+log.slice(-1600));
  try{const res=await fetch(origin+'/quilt-backing-calculator/');if(res.ok){ready=true;break;}}catch{}
  await sleep(300);
 }
 assert.ok(ready,'Astro preview not ready');
 for(const [engine,descriptor,name] of [
  [webkit,devices['iPhone 13'],'WebKit iPhone 13 emulation'],
  [chromium,devices['Pixel 7'],'Chromium Pixel 7 emulation']
 ]){
  activeBrowser=await engine.launch({headless:true});
  const ctx=await activeBrowser.newContext({...descriptor,reducedMotion:'reduce',acceptDownloads:true});
  const errors=[];
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/quilt-backing-calculator/','/fabric-yardage-calculator/']){
   await page.goto(origin+route,{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:20000});
   const walk=page.locator('[data-results] [data-cut-walkthrough]').first();
   const stage=page.locator('[data-results] [data-cut-stage]').first();
   assert.ok(await stage.count(),'Missing cut diagram viewport: '+route);
   const zoom=walk.getByRole('button',{name:'Zoom in'});
   await zoom.tap();await zoom.tap();await zoom.tap();
   const sizes=await stage.evaluate(el=>({
    w:el.scrollWidth,cw:el.clientWidth,h:el.scrollHeight,ch:el.clientHeight,
    display:getComputedStyle(el).overflowY,
    focusable:el.getAttribute('tabindex'),
    viewport:document.documentElement.scrollWidth-innerWidth
   }));
   assert.ok(sizes.w>sizes.cw,'Zoomed mobile diagram must scroll horizontally: '+JSON.stringify(sizes));
   assert.ok(sizes.h>sizes.ch,'Zoomed mobile diagram must be vertically pannable: '+JSON.stringify(sizes));
   assert.equal(sizes.display,'auto','Vertical overflow must remain within the diagram');
   assert.equal(sizes.focusable,'0','Zoomed viewport must be keyboard reachable');
   assert.ok(sizes.viewport<=2,'Zoom must not overflow entire mobile page: '+JSON.stringify(sizes));
   const count=await stage.locator('svg rect[data-cut-index]').count();
   assert.ok(count>0,'No cut rectangles');
   // Simulates a full 2-axis pan without artificially changing geometry.
   await stage.evaluate(el=>{el.scrollLeft=el.scrollWidth;el.scrollTop=el.scrollHeight;});
   const scroll=await stage.evaluate(el=>({x:el.scrollLeft,y:el.scrollTop}));
   assert.ok(scroll.x>0&&scroll.y>0,'Native viewport must support 2D pan: '+JSON.stringify(scroll));
   const row=page.locator('[data-results] button[data-cut-row="1"]').first();
   await row.tap();
   const state=await stage.evaluate(el=>{
    const r=el.querySelector('svg rect[data-preview-phase="current"]');
    if(!r)return {visible:false};
    const a=el.getBoundingClientRect(),b=r.getBoundingClientRect();
    return {visible:b.right>a.left+2&&b.left<a.right-2&&b.bottom>a.top+2&&b.top<a.bottom-2,
      x:el.scrollLeft,y:el.scrollTop};
   });
   assert.ok(state.visible,'Tapped cut row must recenter the highlighted rectangle in both axes: '+JSON.stringify(state));
   const locate=walk.getByRole('button',{name:'Center selected cut'});
   assert.ok(await locate.isEnabled());
   await stage.evaluate(el=>{el.scrollLeft=el.scrollWidth;el.scrollTop=el.scrollHeight;});
   await locate.tap();
   assert.ok(await stage.evaluate(el=>{
    const r=el.querySelector('svg rect[data-preview-phase="current"]');
    if(!r)return false;const a=el.getBoundingClientRect(),b=r.getBoundingClientRect();
    return b.right>a.left+2&&b.left<a.right-2&&b.bottom>a.top+2&&b.top<a.bottom-2;
   }),'Touch recenter control did not reveal selected piece');
   await walk.getByRole('button',{name:'Reset zoom'}).tap();
   const reset=await stage.evaluate(el=>({
    zoom:el.querySelector('svg')?.getAttribute('data-preview-zoom'),
    tab:el.hasAttribute('tabindex'),x:el.scrollLeft,y:el.scrollTop
   }));
   assert.equal(reset.zoom,'1');assert.equal(reset.tab,false);
   assert.equal(reset.x,0);assert.equal(reset.y,0);
   assert.ok(!errors.length,'Client exception on '+name+': '+errors.join('; '));
   console.log('PASS '+name+' '+route+' 2-axis zoom and panning, tap-to-select, recenter, reset.');
  }
  await ctx.close();await activeBrowser.close();activeBrowser=null;
 }
 console.log('PASS mobile touch emulation for WebKit and Chromium; physical iPhone/Android hardware NOT TESTED.');
}finally{
 if(activeBrowser)await activeBrowser.close().catch(()=>{});
 if(preview.pid){
  if(process.platform==='win32')preview.kill();
  else try{process.kill(-preview.pid,'SIGTERM');}catch{preview.kill();}
 }
}
