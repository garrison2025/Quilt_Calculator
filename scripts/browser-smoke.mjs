import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const ROOT='http://127.0.0.1:4321';
const routes=[
  '/','/calculators/','/quilt-backing-calculator/','/quilt-binding-calculator/',
  '/quilt-border-calculator/','/fabric-yardage-calculator/','/quilt-fabric-calculator/',
  '/fabric-yards-to-inches/','/quilt-batting-calculator/','/quilt-sashing-calculator/'
];
const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
await fs.mkdir('artifacts/qa',{recursive:true});
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{
  env:process.env,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32'
});
let serverLog='';
server.stdout.on('data',chunk=>{serverLog+=chunk.toString();});
server.stderr.on('data',chunk=>{serverLog+=chunk.toString();});
let browser;
const problems=[];
async function ready(){
  for(let i=0;i<90;i++){
    if(server.exitCode!==null)throw Error('Astro preview exited: '+serverLog);
    try{const response=await fetch(ROOT+'/');if(response.ok)return;}catch{}
    await delay(300);
  }
  throw Error('Astro preview never became ready: '+serverLog);
}
function check(condition,msg){assert.ok(condition,msg);}
async function hydrated(page,path){
  const response=await page.goto(ROOT+path,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200,'Page HTTP status: '+path);
  await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:20000});
  const status=(await page.locator('[data-status]').innerText()).trim();
  check(status.includes('Updated'),path+' failed to hydrate: '+status);
  const hero=page.locator('[data-results] .result-big');
  await hero.waitFor({state:'visible'});
  check((await hero.innerText()).length>0,'Empty headline: '+path);
  return hero;
}
try{
  await ready();
  browser=await chromium.launch({headless:true});
  const desktop=await browser.newContext({viewport:{width:1365,height:900},acceptDownloads:true});
  const page=await desktop.newPage();
  page.on('pageerror',err=>problems.push('JS exception: '+err.message));
  for(const path of routes){
    await page.evaluate(()=>localStorage.removeItem('quilt-studio-v2')).catch(()=>{});
    await hydrated(page,path);
    if(path!=='/fabric-yards-to-inches/'){
      check(await page.locator('[data-results] svg[role="img"]').count()>0,'Missing schematic SVG: '+path);
    }
    check(await page.locator('[data-action="export-cut"]').isEnabled(),'Export disabled: '+path);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    check(overflow<=2,'Desktop horizontal overflow '+overflow+'px: '+path);
    if(path==='/quilt-fabric-calculator/'){
      assert.equal(await page.locator('details.sku-plan').count(),2,'Every fabric SKU needs its own cut diagram.');
      await page.locator('details.sku-plan').nth(1).locator('summary').click();
      check(await page.locator('details.sku-plan').nth(1).locator('svg[role="img"]').isVisible(),'Second fabric SKU diagram is not visible.');
    }
    if(path==='/quilt-border-calculator/'){
      assert.equal(await page.locator('details.sku-plan').count(),1,'Border layer cut diagram is missing.');
      await page.getByRole('button',{name:'+ Add border layer'}).click();
      assert.equal(await page.locator('details.sku-plan').count(),2,'New border layer needs its own cut diagram.');
      await page.locator('details.sku-plan').nth(1).locator('summary').click();
      check(await page.locator('details.sku-plan').nth(1).locator('svg[role="img"]').isVisible(),'Second border layer diagram is not visible.');
    }
    console.log('PASS hydrated calculator '+path);
    if(path==='/quilt-backing-calculator/'){
      await page.screenshot({path:'artifacts/qa/backing-desktop.png',fullPage:true,animations:'disabled'});
    }
  }
  await hydrated(page,'/quilt-backing-calculator/');
  const width=page.getByLabel('Finished quilt width (in)',{exact:true});
  const initial=await page.locator('[data-results] .result-big').innerText();
  await width.fill('90');
  await width.press('Tab');
  const modified=await page.locator('[data-results] .result-big').innerText();
  check(modified!==initial,'Changed quilt width did not update backing yardage.');
  let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth);
  assert.equal(saved,90,'Changes must persist in browser localStorage.');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated'));
  check((await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='90','Persisted width not restored after reload.');
  await page.locator('[data-units]').selectOption('cm');
  const cmField=page.getByLabel('Finished quilt width (cm)',{exact:true});
  check(Math.abs(Number(await cmField.inputValue())-228.6)<.01,'Inch-to-cm display conversion is incorrect.');
  await cmField.fill('0');
  await cmField.press('Tab');
  check(await cmField.getAttribute('aria-invalid')==='true','Invalid zero width not rejected.');
  check(await cmField.getAttribute('aria-describedby')!==null && await page.locator('.field-error:not([hidden])').count()===1,'Accessible field error message missing.');
  check(await page.locator('[data-stale-warning]').isVisible(),'Stale results require a warning.');
  check(!(await page.locator('[data-action="export-cut"]').isEnabled()),'Cannot export stale calculation after invalid input.');
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth);
  assert.equal(saved,90,'Rejected input silently overwrote valid project.');
  await cmField.fill('233.68');
  await cmField.press('Tab');
  check(await page.locator('[data-stale-warning]').count()===0,'Error banner persists after valid input.');
  check(await cmField.getAttribute('aria-invalid')==='false','Corrected input must clear invalid state.');
  const received=page.waitForEvent('download');
  await page.locator('[data-action="export-cut"]').click();
  const download=await received;
  const payload=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  check(payload.tool==='backing' && payload.calculationVersion && payload.result,'Downloaded cutting-plan JSON has missing data.');
  console.log('PASS editing, units, validation, persistence and JSON export.');
  await page.locator('[data-action="reset"]').click();
  check((await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='60','Reset must restore original sample.');
  await page.emulateMedia({media:'print'});
  check(await page.locator('.input-card').evaluate(el=>getComputedStyle(el).display)==='none','Print view still includes editable form.');
  await page.pdf({path:'artifacts/qa/backing-print.pdf',printBackground:true,format:'A4'});
  await page.emulateMedia({media:'screen'});
  console.log('PASS print stylesheet and PDF rendering.');
  const projectDownload=page.waitForEvent('download');
  await page.locator('[data-action="save"]').click();
  const projectFile=await projectDownload;
  const validProject=JSON.parse(await fs.readFile(await projectFile.path(),'utf8'));
  assert.equal(validProject.schemaVersion,2,'Project export must remain V2 JSON.');
  validProject.quilt.finishedWidth=74;
  await page.locator('[data-file]').setInputFiles({name:'valid-quilt-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(validProject))});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')||'{}').quilt?.finishedWidth===74);
  assert.equal(await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'74','Valid JSON import must restore measurements.');
  const rejectedProject={...validProject,schemaVersion:1};
  await page.locator('[data-file]').setInputFiles({name:'invalid-quilt-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(rejectedProject))});
  await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Could not import project'));
  assert.equal(await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'74','Bad JSON import must preserve current project.');
  console.log('PASS valid project export/import and rejected invalid-schema JSON.');
  const mobile=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const small=await mobile.newPage();
  small.on('pageerror',err=>problems.push('Mobile JS exception: '+err.message));
  for(const path of ['/','/calculators/','/quilt-backing-calculator/','/quilt-fabric-calculator/']){
    await hydrated(small,path);
    const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    check(overflow<=2,'Mobile horizontal overflow '+overflow+'px: '+path);
    if(path==='/quilt-backing-calculator/')await small.screenshot({path:'artifacts/qa/backing-mobile.png',fullPage:true,animations:'disabled'});
    console.log('PASS narrow phone viewport '+path);
  }
  for(const width of [360,390,768,1024,1440]){
    await small.setViewportSize({width,height:812});
    for(const path of ['/','/quilt-backing-calculator/','/quilt-fabric-calculator/']){
      await hydrated(small,path);
      const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      check(overflow<=2,'Horizontal overflow '+overflow+'px at '+width+'px: '+path);
      if(path==='/quilt-backing-calculator/')await small.screenshot({path:'artifacts/qa/backing-'+width+'px.png',fullPage:true,animations:'disabled'});
    }
    console.log('PASS responsive layouts at '+width+'px');
  }
  await small.setViewportSize({width:375,height:812});
  await hydrated(small,'/');
  await small.locator('.mobile-tools summary').click();
  check(await small.locator('nav[aria-label="Mobile calculators"] a').count()===9,'Mobile tool navigation missing links.');
  const missing=await small.goto(ROOT+'/this-route-definitely-does-not-exist/',{waitUntil:'domcontentloaded'});
  assert.equal(missing.status(),404,'Unknown routes must return HTTP 404.');
  check(await small.locator('h1').innerText()==='Lost a stitch?','Custom 404 page is missing.');
  assert.deepEqual(problems,[],'Unexpected JavaScript errors in browsers.');
  console.log('PASS 404, mobile navigation, no uncaught JavaScript errors.');
  console.log('BROWSER SMOKE TESTS PASS: '+routes.length+' calculators, unit conversion, real edits, import-state guard, downloads, mobile, print.');
}catch(error){
  console.error('BROWSER SMOKE FAILURE:',error);
  console.error('SERVER LOG:',serverLog.slice(-4000));
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  try{
    if(process.platform!=='win32'&&server.pid)process.kill(-server.pid,'SIGTERM');
    else server.kill('SIGTERM');
  }catch{server.kill('SIGTERM');}
  server.stdout.destroy();
  server.stderr.destroy();
}
