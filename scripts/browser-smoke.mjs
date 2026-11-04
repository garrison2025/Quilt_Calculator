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
/** Parse the actual downloaded RFC4180-style cut-list CSV (including BOM).
 * Do NOT rely on commas split: a user-supplied piece name can contain quotes.
 */
function csvRecords(csv){
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<csv.length;i++){
  const c=csv[i];
  if(i===0&&c==='\uFEFF')continue;
  if(quoted){
   if(c==='"'&&csv[i+1]==='"'){field+='"';i++;}
   else if(c==='"')quoted=false;
   else field+=c;
  }else if(c==='"')quoted=true;
  else if(c===','){row.push(field);field='';}
  else if(c==='\n'){row.push(field.replace(/\r$/,''));if(row.some(x=>x!==''))rows.push(row);row=[];field='';}
  else field+=c;
 }
 if(quoted)throw Error('Unclosed cutting CSV quote');
 if(field||row.length){row.push(field);rows.push(row);}
 return rows;
}
const nearly=(a,b,tolerance=1e-8)=>Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(a),Math.abs(b));
async function assertSvgCorrespondsToCutCsv(page,route){
 const pending=page.waitForEvent('download');
 await page.locator('[data-action="export-cut-csv"]').click();
 const file=await pending, csv=await fs.readFile(await file.path(),'utf8');
 const rows=csvRecords(csv);
 check(rows.length>1,'Missing real cutting rows at '+route);
 check(rows[0].length===11,'Unexpected cutting CSV columns at '+route);
 const bySku=new Map();
 for(const row of rows.slice(1)){
  check(row.length===11,'Malformed real cutting row '+row.join('|'));
  const sku=row[1];
  if(!bySku.has(sku))bySku.set(sku,[]);
  bySku.get(sku).push(row);
 }
 const diagramData=await page.locator('[data-results] .diagram-wrap svg[data-export-scope="current"]').evaluateAll(svgs=>svgs.map(svg=>({
   sku:svg.dataset.rollSku,
   count:Number(svg.dataset.cutCount),
   wof:Number(svg.dataset.rollWofIn),
   run:Number(svg.dataset.rollRunIn),
   label:svg.getAttribute('aria-label'),
   rectangles:[...svg.querySelectorAll('rect[data-cut-index]')].map(rect=>({
    index:Number(rect.dataset.cutIndex),
    xIn:Number(rect.dataset.rollXIn),yIn:Number(rect.dataset.rollYIn),
    widthIn:Number(rect.dataset.cutWidthIn),heightIn:Number(rect.dataset.cutHeightIn),
    rotation:Number(rect.dataset.grainRotation),pieceLabel:rect.dataset.cutLabel,
    x:Number(rect.getAttribute('x')),y:Number(rect.getAttribute('y')),
    w:Number(rect.getAttribute('width')),h:Number(rect.getAttribute('height')),
    tooltip:rect.querySelector('title')?.textContent
   }))
 })));
 check(diagramData.length===bySku.size,'Every exported fabric roll must have one matching diagram at '+route+
  ': '+diagramData.map(x=>x.sku)+' vs '+[...bySku.keys()]);
 const matched=new Set();
 for(const diagram of diagramData){
  check(!matched.has(diagram.sku),'Duplicate fabric roll SVG: '+diagram.sku);
  matched.add(diagram.sku);
  const cuts=bySku.get(diagram.sku);
  check(Boolean(cuts),'Missing exported SKU for SVG '+diagram.sku+' at '+route);
  check(diagram.count===cuts.length,'SVG total piece count does not match exported CSV: '+diagram.sku);
  check(diagram.rectangles.length===Math.min(cuts.length,180),'SVG truncation/piece count is wrong for '+diagram.sku);
  check(diagram.label.includes(String(cuts.length)+' nonoverlapping'),'SVG description count mismatch');
  for(const rect of diagram.rectangles){
   const row=cuts[rect.index-1];
   check(Boolean(row),'SVG cut index has no matching CSV row');
   const [material,sku,serial,pieceLabel,rollX,rollY,cutW,cutH,grain,wof,run]=row;
   check(rect.index===Number(serial),'SVG item index differs from CSV index: '+route);
   check(rect.pieceLabel===pieceLabel,'SVG label differs from CSV cut label: '+route);
   for(const [what,actual,expected] of [
     ['roll X',rect.xIn,Number(rollX)],['roll Y',rect.yIn,Number(rollY)],
     ['cut width',rect.widthIn,Number(cutW)],['cut height',rect.heightIn,Number(cutH)],
     ['rotation',rect.rotation,Number(grain)],['WOF',diagram.wof,Number(wof)],
     ['roll run length',diagram.run,Number(run)]
   ])check(nearly(actual,expected),'SVG '+what+' differs from exported CSV on '+route+' SKU '+sku+' cut '+serial);
   // SVG uses screen-horizontal axis for the roll-length Y coordinate and
   // vertical axis for WOF X. Verify drawn pixels independently.
   const expectedX=40+rect.yIn/Math.max(diagram.run,.00001)*709;
   const expectedY=32+rect.xIn/Math.max(diagram.wof,.00001)*240;
   const expectedW=Math.max(.5,rect.heightIn/Math.max(diagram.run,.00001)*709-1);
   const expectedH=Math.max(.5,rect.widthIn/Math.max(diagram.wof,.00001)*240-1);
   for(const [what,actual,expected] of [
     ['draw x',rect.x,expectedX],['draw y',rect.y,expectedY],
     ['draw width',rect.w,expectedW],['draw height',rect.h,expectedH]
   ])check(nearly(actual,expected),'SVG '+what+' not drawn from physical coordinates on '+route+' SKU '+sku);
   check(rect.tooltip?.startsWith(pieceLabel+': roll '),'SVG tooltip does not match piece label on '+route);
  }
 }
 check(matched.size===bySku.size,'Unmatched exported fabric roll at '+route);
 return {rolls:matched.size,rectangles:diagramData.reduce((n,r)=>n+r.rectangles.length,0),totalCuts:rows.length-1};
}
const networkEvidence=[];
function instrumentNetwork(context,contextName){
 // Observe all HTTP(S) requests: the static preview should neither contact
 // external origins nor POST/PUT/PATCH project data even to its own origin.
 context.on('request',request=>{
  const url=request.url();
  if(!/^https?:\/\//.test(url))return;
  let origin;try{origin=new URL(url).origin;}catch{networkEvidence.push(contextName+': bad URL '+url);return;}
  if(origin!==new URL(ROOT).origin||!['GET','HEAD'].includes(request.method())){
   networkEvidence.push(contextName+': '+request.method()+' '+url);
  }
 });
}

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
  instrumentNetwork(desktop,'desktop/interactive');
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
      await converter.fill('1½');
      check((await page.locator('[data-results] .result-big').innerText()).includes('54'),'Pasted Unicode mixed fractions must work.');
      await converter.fill('¾');
      check((await page.locator('[data-results] .result-big').innerText()).includes('27'),'Pasted Unicode fraction must convert to 27 inches.');
      await converter.fill('1,2½');
      check(await converter.getAttribute('aria-invalid')==='true','Malformed Unicode fraction must not evade numeric validation.');
      await converter.fill('⅔');
      check((await page.locator('[data-results] .result-big').innerText()).includes('24'),'Pasted two-thirds must convert to 24 inches.');
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
      const audit=await assertSvgCorrespondsToCutCsv(page,path);
      console.log('PASS P23 SVG-to-CSV coordinate fidelity '+path+' ('+audit.rolls+' independent roll(s), '+audit.rectangles+' drawn cuts / '+audit.totalCuts+' exported cuts).');
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
    if(path==='/fabric-yardage-calculator/'){
      const panel=page.locator('[data-width-comparison]');
      check(await panel.count()===1,'Fabric width comparison panel must be visible.');
      const summary=await panel.innerText();
      for(const fragment of ['43 in','30 in','0.875 yd','50 in','20 in','0.625 yd','0.25 yd'])
       check(summary.includes(fragment),'Physical width comparison missing '+fragment);
      check(await page.locator('[data-results] svg[role="img"]').count()===2,'Both measured widths need independent cutting diagrams.');
      const csvPending=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download cut list CSV'}).click();
      const csvFile=await csvPending;
      const csv=await fs.readFile(await csvFile.path(),'utf8');
      check(csv.includes('"43","30"'),'Cut CSV must contain only the currently selected 43-inch fabric roll.');
      check(!csv.includes('"50","20"'),'Alternate 50-inch comparison must not be exported as a real purchase.');
      const altWof=page.getByLabel('Alternate usable WOF (in)',{exact:true});
      await altWof.fill('4');await altWof.press('Tab');
      check((await panel.innerText()).includes('Cannot fit'),'Impossible alternate WOF must show a blocked fit, not fake yardage.');
      check(await page.locator('[data-action="export-cut-csv"]').isEnabled(),'Infeasible alternate must not block a valid current cut list.');
      await altWof.fill('50');await altWof.press('Tab');
      check(await page.locator('[data-width-comparison]').isVisible(),'Comparison must remain visible on screen.');
      check(await page.locator('[data-alternate-compare-plan] svg[role="img"]').count()===1,'Comparison needs an independent screen-only diagram.');
      await page.emulateMedia({media:'print'});
      check(await panel.evaluate(el=>getComputedStyle(el).display)==='none','Hypothetical width comparison must not appear in the real cutting printout.');
      check(await page.locator('[data-alternate-compare-plan]').evaluate(el=>getComputedStyle(el).display)==='none','Do not print alternate physical cutting diagram in the current-roll cutting plan.');
      check(await page.locator('[data-results] svg[role="img"]').first().isVisible(),'Current fabric cut plan must remain in the print layout.');
      await page.pdf({path:'artifacts/qa/yardage-current-width-only-print.pdf',printBackground:true,format:'A4'});
      await page.emulateMedia({media:'screen'});
      console.log('PASS physical dual-WOF comparison, CURRENT-only CSV and print/PDF exports.');
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
  // Isolated Square-in-a-Square lab must stay off approved SEO routes.
  const labReply=await page.goto(ROOT+'/lab/square-in-square/',{waitUntil:'domcontentloaded'});
  assert.equal(labReply.status(),200,'Square laboratory route missing.');
  check(await page.locator('meta[name="robots"]').getAttribute('content')==='noindex,follow',
    'Square trial must remain noindex.');
  check(await page.locator('link[rel="canonical"]').count()===0,
    'Trial calculator must not publish a production canonical.');
  await page.waitForFunction(()=>document.querySelector('[data-square-status]')?.textContent?.includes('Calculated preview'));
  const labResults=await page.locator('[data-square-output]').innerText();
  for(const expected of ['9 in','7.125 in','16','0.25 yd','0.5 yd']){
   check(labResults.includes(expected),'Square trial calculation missing '+expected);
  }
  assert.equal(await page.locator('.square-lab-roll svg[role="img"]').count(),2,
    'Square lab must show physically separate center and corner roll diagrams.');
  const sqExportPromise=page.waitForEvent('download');
  await page.locator('[data-square-download]').click();
  const sqExport=await sqExportPromise;
  const sqCsv=await fs.readFile(await sqExport.path(),'utf8');
  check(sqCsv.includes('center-trial')&&sqCsv.includes('corner-trial'),
    'Cut CSV must preserve center and corner as separate fabric SKUs.');
  assert.equal(sqCsv.trim().split(/\r?\n/).length,13,
    'Trial CSV must contain exactly twelve parent-square cuts plus one header row.');
  const sqCornerWof=page.getByLabel('Corner fabric usable WOF (in)');
  await sqCornerWof.fill('5');
  check(!(await page.locator('[data-square-download]').isEnabled()),
    'Editing a trial field must immediately disable exporting stale cutting results.');
  await page.locator('[data-square-form] button[type="submit"]').click();
  check((await page.locator('[data-square-status]').innerText()).includes('a fabric width is impossible'),
    'An impossible background WOF must not generate fictitious purchase yardage.');
  check(!(await page.locator('[data-square-download]').isEnabled()),
    'Cannot export parent-square CSV with an impossible background roll.');
  await sqCornerWof.fill('43');
  await page.locator('[data-square-form] button[type="submit"]').click();
  check(await page.locator('[data-square-download]').isEnabled(),
    'Restoring usable width must restore a geometrically verifiable trial plan.');
  await page.screenshot({path:'artifacts/qa/square-in-square-unindexed-lab.png',fullPage:true,animations:'disabled'});
  console.log('PASS square laboratory noindex, reference cuts, separate 12-piece parent CSV and impossible-fit guard.');
  // A trial block cannot self-certify from computed cut sizes. The user must
  // enter six actual measured values to receive a labeled self-reported result.
  const auditForm=page.locator('[data-square-audit-form]');
  check(await auditForm.count()===1,'Missing sewn-block measurement worksheet.');
  check(!(await page.locator('[data-square-audit-download]').isEnabled()),
   'Do not pre-approve a block before actual sewn measurements are entered.');
  await auditForm.locator('button[type="submit"]').click();
  check((await page.locator('[data-square-audit-results]').innerText()).includes('Enter all six'),
   'Blank actual measurements must never be silently approved.');
  const values=[
   ['measuredUnfinishedWidthIn','12 1/2'],
   ['measuredUnfinishedHeightIn','12.5'],
   ['topPointClearanceIn','1/4'],
   ['rightPointClearanceIn','¼'],
   ['bottomPointClearanceIn','.25'],
   ['leftPointClearanceIn','0.25']
  ];
  for(const [id,value] of values)await auditForm.locator('[data-square-audit-field="'+id+'"]').fill(value);
  await auditForm.locator('button[type="submit"]').click();
  const resultText=await page.locator('[data-square-audit-results]').innerText();
  check(resultText.includes('NOT independent verification')&&resultText.includes('Within tolerance'),
   'A self-reported pass must carry an explicit no-certification warning.');
  const auditDownloadEvent=page.waitForEvent('download');
  await page.locator('[data-square-audit-download]').click();
  const auditFile=await auditDownloadEvent;
  const auditCsv=await fs.readFile(await auditFile.path(),'utf8');
  check(auditCsv.includes('USER-REPORTED')&&auditCsv.includes('NOT INDEPENDENTLY CERTIFIED'),
   'Audit CSV must never misrepresent reported measurements as independently verified.');
  await auditForm.locator('[data-square-audit-field="topPointClearanceIn"]').fill('0.1');
  check(!(await page.locator('[data-square-audit-download]').isEnabled()),
   'Editing a recorded measurement must invalidate the old audit CSV.');
  await auditForm.locator('button[type="submit"]').click();
  check((await page.locator('[data-square-audit-results]').innerText()).includes('outside the chosen tolerance'),
   'Clipped point must fail user-reported screening.');
  await page.locator('[data-square-input="finishedOuterIn"]').fill('8');
  check(!(await page.locator('[data-square-audit-download]').isEnabled()),
   'Changing the calculation design must invalidate the previous trial audit.');
  await page.screenshot({path:'artifacts/qa/square-test-user-reported-audit.png',fullPage:true,animations:'disabled'});
  console.log('PASS practice-block audit: six required measurements, labeled self-report CSV, point failure and stale-input invalidation.');
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
  const storedBeforeDraft=await page.evaluate(()=>localStorage.getItem('quilt-studio-v2'));
  await width.fill('90');
  check(!(await page.locator('[data-action="export-cut"]').isEnabled()),'Editing a field before blur must immediately invalidate the previous plan export.');
  check(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'Cut CSV must be disabled during a pending edit.');
  check(!(await page.locator('[data-action="print"]').isEnabled()),'Print must be disabled during a pending edit.');
  check(!(await page.locator('[data-action="save"]').isEnabled()),'Project backup must not pretend to include an uncommitted measurement.');
  check(await page.locator('[data-stale-warning]').isVisible(),'Pending edit needs an explicit stale-plan warning.');
  const storedDuringDraft=await page.evaluate(()=>localStorage.getItem('quilt-studio-v2'));
  assert.equal(storedDuringDraft,storedBeforeDraft,'Draft editing must not change localStorage, including on a first-time sample project.');
  await width.press('Tab');
  check(await page.locator('[data-action="save"]').isEnabled(),'Committed measurement must re-enable the project backup.');
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
  const printScale=page.locator('[data-print-scale-audit]');
  check(await printScale.isVisible(),'Approved print plan needs a real-sized, ruler-measurable calibration reference.');
  const physicalCss=await page.evaluate(()=>{
   const inch=document.querySelector('[data-print-inch-gauge]');
   const mm=document.querySelector('[data-print-mm-gauge]');
   const inRect=inch.getBoundingClientRect(),mmRect=mm.getBoundingClientRect();
   return {inchW:inRect.width,inchH:inRect.height,mmW:mmRect.width,
    inchStyle:getComputedStyle(inch).boxSizing,mmStyle:getComputedStyle(mm).width,
    content:document.querySelector('[data-print-scale-audit]')?.innerText||''};
  });
  check(Math.abs(physicalCss.inchW-96)<.25&&Math.abs(physicalCss.inchH-96)<.25,
   '1-inch print box must use exactly one physical CSS inch in both axes: '+JSON.stringify(physicalCss));
  check(Math.abs(physicalCss.mmW-100/25.4*96)<.35,
   '100-mm print reference must be physically dimensioned in CSS: '+JSON.stringify(physicalCss));
  check(physicalCss.inchStyle==='border-box'&&physicalCss.content.includes('100% / Actual size')&&
    physicalCss.content.includes('not full-size templates'),
   'Print calibration must include both real-unit dimensions and an honest schematic warning.');
  console.log('PASS P24 in-browser CSS physical-unit calibration (1in square, 100mm line); real printed ruler check remains NOT_RUN.');
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
  instrumentNetwork(noStorage,'storage-blocked');
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
  // Original P21: verify an actual browser journey across all project tools.
  // Screens must share ONE native-inch V2 project, not recompute or overwrite
  // measurements when the UI units change, and non-committed drafts must not
  // silently persist on navigation.
  const crossCtx=await browser.newContext({viewport:{width:1260,height:900},acceptDownloads:true});
  instrumentNetwork(crossCtx,'cross-tool-v2');
  const cross=await crossCtx.newPage();
  cross.on('pageerror',e=>problems.push('Cross-tool project: '+e.message));
  await hydrated(cross,'/quilt-backing-calculator/');
  await cross.getByLabel('Finished quilt width (in)',{exact:true}).fill('72');
  await cross.getByLabel('Finished quilt width (in)',{exact:true}).press('Tab');
  await cross.getByLabel('Finished quilt height (in)',{exact:true}).fill('84');
  await cross.getByLabel('Finished quilt height (in)',{exact:true}).press('Tab');
  let crossStored=await cross.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  check(crossStored.quilt.finishedWidth===72&&crossStored.quilt.finishedHeight===84,
    'P21 current backing dimensions must enter the shared native-inch project.');
  await hydrated(cross,'/quilt-binding-calculator/');
  check((await cross.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='72',
    'P21 binding must restore backing width rather than revert to sample.');
  check((await cross.getByLabel('Finished quilt height (in)',{exact:true}).inputValue())==='84',
    'P21 binding must restore backing height.');
  await cross.locator('[data-units]').selectOption('cm');
  const actualCM=Number(await cross.getByLabel('Finished quilt width (cm)',{exact:true}).inputValue());
  check(Math.abs(actualCM-182.88)<.01,'P21 native 72 inches must display 182.88 cm in binding.');
  crossStored=await cross.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  check(crossStored.quilt.finishedWidth===72&&crossStored.quilt.finishedHeight===84&&crossStored.units==='cm',
    'P21 changing display units must not convert stored native-inch geometry twice.');
  await hydrated(cross,'/quilt-batting-calculator/');
  check(Math.abs(Number(await cross.getByLabel('Finished quilt width (cm)',{exact:true}).inputValue())-182.88)<.01,
    'P21 batting must share cm display without changing stored inches.');
  await hydrated(cross,'/calculators/');
  check(Math.abs(Number(await cross.getByLabel('Finished quilt width (cm)',{exact:true}).inputValue())-182.88)<.01,
    'P21 main project hub must retain same native geometry and chosen display units.');
  await cross.locator('[data-units]').selectOption('in');
  check((await cross.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='72',
    'P21 switching back to inches must not introduce measurement drift.');
  await hydrated(cross,'/quilt-fabric-calculator/');
  const firstColor=cross.getByLabel('Fabric / color label',{exact:true}).first();
  await firstColor.fill('P21 Verified Indigo');
  await firstColor.press('Tab');
  check((await cross.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).fabrics[0].label))==='P21 Verified Indigo',
    'P21 fabric label must persist as part of the same project.');
  await hydrated(cross,'/fabric-yardage-calculator/');
  const qty=cross.getByLabel('Piece quantity',{exact:true});
  await qty.fill('37');
  await qty.press('Tab');
  await hydrated(cross,'/quilt-backing-calculator/');
  check((await cross.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='72',
    'P21 editing another tool must not overwrite the original backing measurements.');
  // Typing an unfinished draft and navigating away must keep the last valid project.
  await cross.getByLabel('Finished quilt width (in)',{exact:true}).fill('999');
  check(!(await cross.locator('[data-action="export-cut"]').isEnabled()),
    'P21 a draft input must immediately disable export before commitment.');
  await hydrated(cross,'/calculators/');
  crossStored=await cross.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  check(crossStored.quilt.finishedWidth===72&&crossStored.quilt.finishedHeight===84&&
    crossStored.yardage.count===37&&crossStored.fabrics[0].label==='P21 Verified Indigo'&&
    crossStored.units==='in','P21 multi-tool navigation must preserve all committed data and reject the abandoned draft.');
  check((await cross.locator('.shopping-item').allInnerTexts()).some(x=>x.includes('P21 Verified Indigo')),
    'P21 project shopping list must show the SKU label saved in the dedicated fabric tool.');
  const crossExportPromise=cross.waitForEvent('download');
  await cross.locator('[data-action="save"]').click();
  const crossDownloaded=await crossExportPromise;
  const crossJson=JSON.parse(await fs.readFile(await crossDownloaded.path(),'utf8'));
  check(crossJson.quilt.finishedWidth===72&&crossJson.quilt.finishedHeight===84&&
    crossJson.yardage.count===37&&crossJson.fabrics[0].label==='P21 Verified Indigo',
    'P21 project JSON download must reflect cross-tool committed measurements exactly.');
  await cross.screenshot({path:'artifacts/qa/p21-cross-tool-project-retention.png',fullPage:true,animations:'disabled'});
  await crossCtx.close();
  console.log('PASS P21 cross-tool native-inch geometry, reversible unit display, SKU persistence and unsaved-draft protection.');
  const mobile=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  instrumentNetwork(mobile,'mobile');
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
  instrumentNetwork(dark,'dark');
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
  instrumentNetwork(reduced,'reduced-motion');
  const reducedPage=await reduced.newPage();
  await hydrated(reducedPage,'/quilt-backing-calculator/');
  const motion=await reducedPage.locator('[data-results] .result-hero').evaluate(el=>getComputedStyle(el).animationName);
  check(motion==='none','Reduced motion preference must disable result animation.');
  console.log('PASS reduced-motion accessibility preference.');
  await reduced.close();
  assert.deepEqual(networkEvidence,[],'G42 private project must never be uploaded or sent to third-party origins.');
  console.log('PASS G42 no third-party HTTP(S) requests and no write/upload methods across browser projects, imports, exports, mobile and print.');
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
