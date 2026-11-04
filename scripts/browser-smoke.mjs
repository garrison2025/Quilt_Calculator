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
    if(path!=='/'){
      const guide=page.locator('[data-content-guide]');
      assert.equal(await guide.count(),1,'Every tool needs one static explanatory guide: '+path);
      const related=guide.locator('nav[aria-label="Related fabric calculations"] a');
      const hrefs=await related.evaluateAll(links=>links.map(el=>el.getAttribute('href')));
      check(hrefs.length>=2&&new Set(hrefs).size===hrefs.length&&!hrefs.includes(path),
       'Contextual guide links must be unique and point to other calculators: '+path);
    }
    if(path==='/fabric-yards-to-inches/'){
      const table=page.getByRole('table',{name:'Linear fabric yard fractions and the corresponding length'});
      assert.equal(await table.count(),1,'Fraction conversion requires one accessible labeled table.');
      assert.equal(await table.locator('tbody tr').count(),14,'Missing exact fraction reference rows.');
      const third=await table.locator('tbody tr',{hasText:'1/3 yard'}).innerText();
      const twoThirds=await table.locator('tbody tr',{hasText:'2/3 yard'}).innerText();
      check(third.includes('12 in')&&twoThirds.includes('24 in'),'Exact thirds conversion is wrong.');
      check((await page.locator('[data-content-guide="inches"] h3',{hasText:'How big is a yard of fabric?'}).count())===1,'Missing yard size explanation.');
      await page.screenshot({path:'artifacts/qa/yards-conversion-guide-desktop.png',fullPage:true,animations:'disabled'});
      console.log('PASS static 14-row fraction chart, yard-size intent, exact thirds and contextual links.');
      const converter=page.getByLabel('Fabric yards (decimals or fractions)');
      await converter.fill('1,2');
      check(await converter.getAttribute('aria-invalid')==='true','Ambiguous comma number must be rejected on screen.');
      check(await page.locator('#yard-input-error').isVisible(),'Converter invalid input needs inline accessible error.');
      check(!(await page.locator('[data-action="export-cut"]').isEnabled()),'Cannot export invalid ambiguous yardage.');
      await converter.fill('1,000');
      check(await converter.getAttribute('aria-invalid')==='false','Valid US thousand grouping must restore the converter.');
      check((await page.locator('[data-results] .result-big').innerText()).includes('36,000'),'1,000 yards must convert to 36,000 inches.');
      await converter.fill('1 1/2');
      check((await page.locator('[data-results] .result-big').innerText()).includes('54'),'Mixed fractions must still work.');
      check(await page.locator('[data-action="export-cut"]').isEnabled(),'Corrected converter must re-enable valid export.');
      console.log('PASS strict US numeric syntax, inline errors, recovery and exact yard conversions.');
    }
    if(path!=='/fabric-yards-to-inches/'){
      check(await page.locator('[data-results] svg[role="img"]').count()>0,'Missing schematic SVG: '+path);
    }
    check(await page.locator('[data-action="export-cut"]').isEnabled(),'Export disabled: '+path);
    if(path==='/fabric-yards-to-inches/'){
      check(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'A units converter must not promise physical fabric cuts.');
    }else{
      check(await page.locator('[data-action="export-cut-csv"]').isEnabled(),'Valid material must allow a cut CSV: '+path);
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    check(overflow<=2,'Desktop horizontal overflow '+overflow+'px: '+path);
    if(path==='/calculators/'){
      const rows=page.locator('.shopping-item');
      check(await rows.count()>=5,'Project shopping list must include separately purchasable materials.');
      const allMaterials=page.locator('details.sku-plan');
      assert.equal(await allMaterials.count(),6,'Project hub must expose each of the six independently purchased sample materials.');
      const cutFilePromise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download cut list CSV'}).click();
      const cutFile=await cutFilePromise;
      const cutCsv=await fs.readFile(await cutFile.path(),'utf8');
      check(cutCsv.charCodeAt(0)===0xFEFF,'Cut CSV must include UTF-8 BOM.');
      check(cutCsv.includes('Roll X (in)')&&cutCsv.includes('Grain rotation (degrees)'),'Cut CSV must include exact coordinates and grain orientation.');
      for(const material of ['backing','binding','batting','border-indigo','sky-blue','sand']){
        check(cutCsv.includes('"'+material+'"'),'Cut CSV missing fabric roll / SKU: '+material);
      }
      check(cutCsv.split('\r\n').filter(Boolean).length===36,'Sample project should yield 35 exact cut pieces plus one header row.');
      console.log('PASS full 35-piece cut CSV across all 6 independent material rolls.');
      assert.equal(await allMaterials.filter({hasText:'FIT IMPOSSIBLE'}).count(),0,'Example material roll should be feasible.');
      check(await allMaterials.first().getAttribute('open')!==null,'First material should show its real cut diagram.');
      await allMaterials.nth(4).locator('summary').click();
      check(await allMaterials.nth(4).locator('svg[role="img"]').isVisible(),'Hub must provide separate first fabric SKU geometry.');
      await allMaterials.nth(5).locator('summary').click();
      check(await allMaterials.nth(5).locator('svg[role="img"]').isVisible(),'Hub must provide separate second fabric SKU geometry.');
      check((await rows.first().innerText()).includes('Raw:'),'Shopping list missing exact raw purchase requirement.');
      check((await rows.first().innerText()).includes('Purchase rounding excess:'),'Shopping list missing purchase increment waste.');
      const downloadPromise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download shopping CSV'}).click();
      const csvFile=await downloadPromise;
      const csv=await fs.readFile(await csvFile.path(),'utf8');
      check(csv.includes('Exact raw yards')&&csv.includes('Rounded purchase yards')&&csv.includes('Post-assembly trim sq in'),'Shopping CSV lacks source-backed fields.');
      check(csv.includes('Backing')&&csv.includes('Straight-grain binding'),'Shopping CSV omits key materials.');
      console.log('PASS auditable shopping breakdown and CSV download.');
    }
    if(path==='/quilt-backing-calculator/'){
      check(await page.getByText('Joined seam positions',{exact:true}).count()===1,'Backing seam table is missing.');
      check(await page.getByText('42.5 in',{exact:true}).count()>=1,'Backing seam coordinates do not match symmetric construction.');
    }
    if(path==='/quilt-fabric-calculator/'){
      assert.equal(await page.locator('details.sku-plan').count(),2,'Every fabric SKU needs its own cut diagram.');
      const price=page.getByLabel('Price per yard (optional)').first();
      await price.fill('8.5');await price.press('Tab');
      check((await page.locator('.shopping-item').first().innerText()).includes('Est. $'),'User price must create estimated purchase cost.');
      const skuCsvPromise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download shopping CSV'}).click();
      const skuCsv=await skuCsvPromise;
      const csvContent=await fs.readFile(await skuCsv.path(),'utf8');
      check(csvContent.includes('8.5')&&csvContent.includes('Sky blue')&&csvContent.includes('Sand'),'SKU CSV misses prices or fabric colors.');
      check(csvContent.charCodeAt(0)===0xFEFF&&csvContent.includes('\r\n'),'CSV requires UTF-8 BOM and actual CRLF rows for Excel.');
      const maliciousLabel=page.getByLabel('Fabric / color label').first();
      await maliciousLabel.fill('=SUM(1,2)');await maliciousLabel.press('Tab');
      const safeCsvPromise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download shopping CSV'}).click();
      const safeFile=await safeCsvPromise;
      const safeContent=await fs.readFile(await safeFile.path(),'utf8');
      check(safeContent.includes("'=SUM(1,2)"),'CSV spreadsheet-formula injection was not escaped.');
      const safeCutPromise=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download cut list CSV'}).click();
      const safeCut=await safeCutPromise;
      const safeCutContent=await fs.readFile(await safeCut.path(),'utf8');
      check(safeCutContent.includes("'=SUM(1,2)"),'Cut-list export must escape a formula-bearing material label.');
      await page.locator('details.sku-plan').nth(1).locator('summary').click();
      check(await page.locator('details.sku-plan').nth(1).locator('svg[role="img"]').isVisible(),'Second fabric SKU diagram is not visible.');
    }
    if(path==='/quilt-batting-calculator/'){
      const rollWidth=page.getByLabel('Actual roll width (in)',{exact:true});
      await rollWidth.fill('40');await rollWidth.press('Tab');
      check(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'Do not offer a physical cut CSV for an impossible batting roll.');
      await page.locator('[data-action="reset"]').click();
      check(await page.locator('[data-action="export-cut-csv"]').isEnabled(),'Valid sample batting should restore cut export after reset.');
      console.log('PASS infeasible batting disables cut-list export without disabling valid projects.');
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
  // Keyboard accessibility gate: the bypass link, FAQ disclosure and editable
  // converter must work with focus/Enter instead of requiring pointer input.
  await hydrated(page,'/fabric-yards-to-inches/');
  const skip=page.locator('.skip-link');
  await skip.focus();
  check(await skip.evaluate(el=>document.activeElement===el),'Skip-to-main link must receive keyboard focus.');
  await page.keyboard.press('Enter');
  check(await page.evaluate(()=>location.hash)==='#main','Skip-to-main link must navigate to the main landmark.');
  const firstFaq=page.locator('.faq-list details').first(),faqToggle=firstFaq.locator('summary');
  await faqToggle.focus();
  await page.keyboard.press('Enter');
  check(await firstFaq.getAttribute('open')!==null,'FAQ must open with keyboard Enter.');
  await page.keyboard.press('Enter');
  check(await firstFaq.getAttribute('open')===null,'FAQ must close with keyboard Enter.');
  const inputAudit=await page.evaluate(()=>{
    const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
    const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
    const unnamed=[...document.querySelectorAll('input:not([type="hidden"]),select')]
      .filter(el=>!el.getAttribute('aria-label')&&!el.closest('label')&&!(el.id&&document.querySelector('label[for="'+el.id+'"]')))
      .map(el=>el.outerHTML.slice(0,100));
    return {duplicates,unnamed,main:document.querySelectorAll('main').length};
  });
  check(inputAudit.main===1&&inputAudit.duplicates.length===0&&inputAudit.unnamed.length===0,
    'Form accessibility metadata problem: '+JSON.stringify(inputAudit));
  console.log('PASS keyboard skip-link and FAQ interaction, unique IDs and labeled form controls.');
  await hydrated(page,'/quilt-backing-calculator/');
  const changeWidth=page.getByLabel('Finished quilt width (in)',{exact:true});
  const changeHeight=page.getByLabel('Finished quilt height (in)',{exact:true});
  await changeWidth.fill('80');await changeWidth.press('Tab');
  await changeHeight.fill('60');await changeHeight.press('Tab');
  const directions=page.locator('.option-buttons button');
  check((await directions.nth(1).getAttribute('aria-pressed'))==='true','Backing UI must initially select the mathematically cheapest horizontal seams.');
  check((await directions.nth(1).innerText()).includes('Best use'),'Recommended direction should be labeled.');
  await directions.nth(0).click();
  check((await directions.nth(0).getAttribute('aria-pressed'))==='true','Users must be able to override recommended seam direction.');
  await page.locator('[data-action="reset"]').click();
  const width=page.getByLabel('Finished quilt width (in)',{exact:true});
  const initial=await page.locator('[data-results] .result-big').innerText();
  await width.fill('90');
  check(!(await page.locator('[data-action="export-cut"]').isEnabled()),'Editing a field before blur must immediately invalidate the previous plan export.');
  check(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'Cut CSV must be disabled during a pending edit.');
  check(!(await page.locator('[data-action="print"]').isEnabled()),'Print must be disabled during a pending edit.');
  check(await page.locator('[data-stale-warning]').isVisible(),'Pending edit needs an explicit stale-plan warning.');
  const pendingSaved=await page.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth);
  assert.notEqual(pendingSaved,90,'Uncommitted typing must not silently persist a new measurement.');
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
  await hydrated(page,'/calculators/');
  check(await page.locator('details.sku-plan').count()===6,'Project print must contain all six material plans.');
  await page.evaluate(()=>{window.__prePrintPlanCount=0;window.addEventListener('beforeprint',()=>{
    window.__prePrintPlanCount=document.querySelectorAll('details.sku-plan[open]').length;
  });});
  await page.pdf({path:'artifacts/qa/all-materials-print.pdf',printBackground:true,format:'A4'});
  check(await page.evaluate(()=>window.__prePrintPlanCount)===6,'Printing must expand every material plan, not just backing.');
  await page.waitForFunction(()=>document.querySelectorAll('details.sku-plan[open]').length===1);
  console.log('PASS all-materials print includes every fabric roll and restores collapsed plan state.');
  await hydrated(page,'/quilt-backing-calculator/');
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
  const excessProject=structuredClone(validProject);
  excessProject.fabrics[0].pieces[0].count=1990;
  excessProject.fabrics[1].pieces[0].count=20;
  await page.locator('[data-file]').setInputFiles({name:'oversized-quilt-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(excessProject))});
  await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Maximum 2,000'));
  assert.equal(await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'74','Too-large imported project must leave existing valid project unchanged.');
  const invalidJoin=structuredClone(validProject);
  invalidJoin.options.joinTakeup=invalidJoin.options.usableWof;
  await page.locator('[data-file]').setInputFiles({name:'invalid-join.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalidJoin))});
  await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Backing join take-up'));
  assert.equal(await page.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'74','Invalid join input must preserve current project.');
  console.log('PASS valid JSON import and rejections of schema, quantity and join-width errors.');
  // Independent tabs must not silently overwrite each other's saved projects.
  const tabA=await desktop.newPage(),tabB=await desktop.newPage();
  tabA.on('pageerror',e=>problems.push('Multi-tab A: '+e.message));
  tabB.on('pageerror',e=>problems.push('Multi-tab B: '+e.message));
  await hydrated(tabA,'/quilt-backing-calculator/');
  await hydrated(tabB,'/quilt-backing-calculator/');
  const aWidth=tabA.getByLabel('Finished quilt width (in)',{exact:true});
  const bWidth=tabB.getByLabel('Finished quilt width (in)',{exact:true});
  await aWidth.fill('72');await aWidth.press('Tab');
  await tabB.locator('[data-sync-warning]').waitFor({state:'visible'});
  await tabB.screenshot({path:'artifacts/qa/project-multitab-conflict.png',fullPage:true,animations:'disabled'});
  await bWidth.fill('76');await bWidth.press('Tab');
  assert.equal(await tabB.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),72,
   'Outdated browser tab silently overwrote another tab\'s latest project.');
  check((await tabB.locator('[data-project-state]').innerText()).includes('Unsaved'),
   'Overwriting conflict must be clearly labeled unsaved.');
  const backupDownload=tabB.waitForEvent('download');
  await tabB.locator('[data-action="save"]').click();
  const backup=await backupDownload;
  assert.equal(JSON.parse(await fs.readFile(await backup.path(),'utf8')).quilt.finishedWidth,76,
   'The current tab must still allow downloading its unsaved edits as JSON.');
  await tabB.locator('[data-action="load-latest"]').click();
  assert.equal(await tabB.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'72',
   'Load latest must retrieve the other tab\'s saved measurements.');
  await tabB.getByLabel('Finished quilt width (in)',{exact:true}).fill('75');
  await tabB.getByLabel('Finished quilt width (in)',{exact:true}).press('Tab');
  await tabA.locator('[data-sync-warning]').waitFor({state:'visible'});
  await tabA.locator('[data-action="reset"]').click();
  assert.equal(await tabA.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),75,
   'Reset from stale tab must not delete newer saved data.');
  await tabA.locator('[data-action="load-latest"]').click();
  assert.equal(await tabA.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'75',
   'Stale tab failed to recover the saved project after reset.');
  await tabA.close();await tabB.close();
  console.log('PASS two-tab conflict warning, safe JSON backup, reload and reset protection.');

  // Browser privacy settings and quota failures must never masquerade as autosave.
  const noStorage=await browser.newContext({viewport:{width:1180,height:800},acceptDownloads:true});
  await noStorage.addInitScript(()=>{
   Storage.prototype.setItem=function(){throw new DOMException('Storage blocked','QuotaExceededError');};
  });
  const privatePage=await noStorage.newPage();
  privatePage.on('pageerror',e=>problems.push('Storage blocked: '+e.message));
  await hydrated(privatePage,'/quilt-backing-calculator/');
  const unsavedWidth=privatePage.getByLabel('Finished quilt width (in)',{exact:true});
  await unsavedWidth.fill('69');await unsavedWidth.press('Tab');
  check((await privatePage.locator('[data-persist-state]').innerText()).includes('unavailable'),
   'Unavailable localStorage must show an explicit unsaved warning.');
  await privatePage.screenshot({path:'artifacts/qa/project-storage-disabled.png',fullPage:true,animations:'disabled'});
  const unsavedDownload=privatePage.waitForEvent('download');
  await privatePage.locator('[data-action="save"]').click();
  const unsavedFile=await unsavedDownload;
  assert.equal(JSON.parse(await fs.readFile(await unsavedFile.path(),'utf8')).quilt.finishedWidth,69,
   'Local JSON backup must work even when browser autosave is blocked.');
  await noStorage.close();
  console.log('PASS localStorage failure warning and offline JSON backup.');
  const mobile=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const small=await mobile.newPage();
  small.on('pageerror',err=>problems.push('Mobile JS exception: '+err.message));
  for(const path of ['/','/calculators/','/quilt-backing-calculator/','/quilt-fabric-calculator/','/fabric-yards-to-inches/']){
    await hydrated(small,path);
    const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    check(overflow<=2,'Mobile horizontal overflow '+overflow+'px: '+path);
    if(path==='/quilt-backing-calculator/')await small.screenshot({path:'artifacts/qa/backing-mobile.png',fullPage:true,animations:'disabled'});
    if(path==='/fabric-yards-to-inches/')await small.screenshot({path:'artifacts/qa/yards-conversion-guide-mobile.png',fullPage:true,animations:'disabled'});
    console.log('PASS narrow phone viewport '+path);
  }
  for(const width of [360,390,768,1024,1440]){
    await small.setViewportSize({width,height:812});
    for(const path of ['/','/quilt-backing-calculator/','/quilt-fabric-calculator/','/fabric-yards-to-inches/']){
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
  const dark=await browser.newContext({viewport:{width:1280,height:800},colorScheme:'dark'});
  const darkPage=await dark.newPage();
  darkPage.on('pageerror',err=>problems.push('Dark UI JS exception: '+err.message));
  await hydrated(darkPage,'/quilt-backing-calculator/');
  const darkColors=await darkPage.evaluate(()=>{
    const rgb=value=>value.match(/\d+/g).slice(0,3).map(Number);
    const light=v=>{const a=v/255;return a<=.04045?a/12.92:Math.pow((a+.055)/1.055,2.4);};
    const makeLum=v=>{const [r,g,b]=rgb(v).map(light);return r*.2126+g*.7152+b*.0722;};
    const ratio=(a,b)=>{const aL=makeLum(a),bL=makeLum(b);return (Math.max(aL,bL)+.05)/(Math.min(aL,bL)+.05);};
    const surface=document.querySelector('.input-card');
    const label=document.querySelector('.field-wrap label');
    return {
      page:getComputedStyle(document.documentElement).backgroundColor,
      card:getComputedStyle(surface).backgroundColor,
      textRatio:ratio(getComputedStyle(surface).color,getComputedStyle(surface).backgroundColor),
      labelRatio:ratio(getComputedStyle(label).color,getComputedStyle(surface).backgroundColor)
    };
  });
  check(darkColors.page!=='rgb(248, 246, 241)','System dark color scheme was not applied.');
  check(darkColors.textRatio>=4.5&&darkColors.labelRatio>=4.5,'Dark mode body/label text contrast is insufficient: '+JSON.stringify(darkColors));
  await darkPage.screenshot({path:'artifacts/qa/backing-dark-mode.png',fullPage:true,animations:'disabled'});
  await darkPage.emulateMedia({media:'print'});
  check(await darkPage.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(255, 255, 255)','Dark mode must never force dark print paper.');
  console.log('PASS dark color scheme, basic text contrast, and white print output.');
  await dark.close();
  const reduced=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const reducedPage=await reduced.newPage();
  await hydrated(reducedPage,'/quilt-backing-calculator/');
  const motion=await reducedPage.locator('[data-results] .result-hero').evaluate(el=>getComputedStyle(el).animationName);
  check(motion==='none','Reduced motion preference must disable result animation.');
  console.log('PASS reduced-motion accessibility preference.');
  await reduced.close();
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
