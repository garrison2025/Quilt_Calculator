import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const axeSource=require.resolve('axe-core/axe.min.js');

const ROOT='http://127.0.0.1:4321';
const routes=[
  '/','/calculators/','/quilt-backing-calculator/','/quilt-binding-calculator/',
  '/quilt-border-calculator/','/fabric-yardage-calculator/','/quilt-fabric-calculator/',
  '/fabric-yards-to-inches/','/quilt-batting-calculator/','/quilt-sashing-calculator/'
];
const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
const wcagReport=[];
async function auditWcag(page,path){
  // The axe script is loaded from the local CI dependency, not a remote CDN.
  await page.addScriptTag({path:axeSource});
  const findings=await page.evaluate(async()=>{
    const result=await window.axe.run(document,{
      runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}
    });
    return {
      violations:result.violations.map(v=>({
        id:v.id,impact:v.impact,help:v.help,
        nodes:v.nodes.slice(0,10).map(n=>({selector:n.target.join(' '),summary:n.failureSummary}))
      })),
      incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),
      passes:result.passes.length
    };
  });
  wcagReport.push({path,...findings});
  const problems=findings.violations.map(v=>v.id+' ('+v.impact+'): '+
    v.nodes.map(n=>n.selector+' '+n.summary).join(' | ')).join('\n');
  if(findings.violations.length)
    console.error('WCAG AXE FAIL '+path+'\n'+problems.slice(0,11000));
  else console.log('PASS WCAG axe-core '+path+' ('+findings.passes+' rules passed; '+
    findings.incomplete.length+' require manual review).');
  return findings.violations.length;
}
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
 // Browser must exercise a real expand/collapse: lazy closed rolls should
 // materialize on demand without changing the full physical export.
 const plans=page.locator('details.sku-plan');
 for(let i=0;i<await plans.count();i++){
  const plan=plans.nth(i);
  if(await plan.getAttribute('data-preview-state')==='pending'){
   await plan.locator('summary').click();
   await plan.locator('svg[data-export-scope="current"]').waitFor({state:'attached'});
   await plan.locator('summary').click();
   check(await plan.getAttribute('data-preview-state')==='rendered',
    'Opened roll must cache its complete preview while collapsed.');
  }
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
async function hydrated(page,path,{incomplete=false,noHero=false}={}){
  const response=await page.goto(ROOT+path,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(response.status(),200,'Page HTTP status: '+path);
  const expected=incomplete?'Incomplete material plan':'Updated from the current project';
  await page.waitForFunction(expectedStatus=>document.querySelector('[data-status]')?.textContent?.includes(expectedStatus),expected,{timeout:20000});
  const status=(await page.locator('[data-status]').innerText()).trim();
  check(status.includes(expected),path+' failed to hydrate: '+status);
  const hero=page.locator('[data-results] .result-big');
  if(!noHero){
    await hero.waitFor({state:'visible'});
    check((await hero.innerText()).length>0,'Empty headline: '+path);
  }
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
    await hydrated(page,path,{incomplete:path==='/'||path==='/calculators/'});
    // The user must supply post-prewash *usable WOF* for valid cross-grain
    // fit. Length shrinkage percentage never reduces input roll width.
    if(['/', '/calculators/', '/quilt-backing-calculator/', '/quilt-binding-calculator/',
        '/fabric-yardage-calculator/', '/quilt-fabric-calculator/',
        '/quilt-border-calculator/', '/quilt-sashing-calculator/'].includes(path)){
      const hints=page.locator('.field-wrap .hint',{hasText:'Use the actual usable WOF AFTER planned prewash'});
      check(await hints.count()>0,'Usable WOF postwash assumption not disclosed on '+path);
    }
    if(path==='/'||path==='/calculators/'){
      const review=page.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.');
      check(!(await review.isChecked()),'Sample quilt-top cutting list must never be auto-verified.');
      check(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()) &&
            !(await page.locator('[data-action="print"]').isEnabled()),
        'An unreviewed whole-project cutting plan must never claim full export readiness.');
      check((await page.locator('[data-results]').innerText()).includes('QUILT TOP NOT REVIEWED'),
        'Project sample needs an explicit manual review warning.');
      const pending=page.waitForEvent('download');
      await page.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
      const partial=await fs.readFile(await (await pending).path(),'utf8');
      check(partial.includes('TOP_CUT_LIST_NOT_REVIEWED') && partial.includes('Sky blue'),
        'Unreviewed sample CSV must carry a review-pending flag alongside real estimated quantities.');
      await review.check();
      await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'));
      check(await page.locator('[data-action="export-cut-csv"]').isEnabled(),
        'Manual quilt-top confirmation must restore the complete-project cutting CSV.');
    }
    await auditWcag(page,path);
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
      await page.emulateMedia({media:'print'});
      check(await page.locator('[data-tool]').getAttribute('data-print-ready')==='true',
        'Pure yards conversion may still print its valid length chart without physical cuts.');
      await page.emulateMedia({media:'screen'});

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
      // Browser print shortcuts are not blocked by a disabled page button.
      // Print CSS must hide unfinished plans even when a user presses Ctrl+P.
      await page.emulateMedia({media:'print'});
      check(await page.locator('[data-tool]').getAttribute('data-print-ready')==='true',
        'Fully calculated example should remain printable.');
      check(await page.locator('[data-results]').evaluate(el=>getComputedStyle(el).display)!=='none',
        'Verified physical cuts should remain visible in a valid printout.');
      await page.emulateMedia({media:'screen'});
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
      for(const material of ['backing','binding','batting','border:indigo','fabric:sky-blue','fabric:sand']){
        check(cutCsv.includes('"'+material+'"'),'Cut CSV missing fabric roll / SKU: '+material);
      }
      check(cutCsv.split('\r\n').filter(Boolean).length===36,'Sample project should yield 35 exact cut pieces plus one header row.');
      console.log('PASS full 35-piece cut CSV across all 6 independent material rolls.');
      assert.equal(await allMaterials.filter({hasText:'FIT IMPOSSIBLE'}).count(),0,'Example material roll should be feasible.');
      check(await allMaterials.first().getAttribute('open')!==null,'First material should show its real cut diagram.');
      await allMaterials.nth(4).locator('summary').click();
      await allMaterials.nth(4).locator('svg[role="img"]').waitFor({state:'visible'});
      await allMaterials.nth(5).locator('summary').click();
      await allMaterials.nth(5).locator('svg[role="img"]').waitFor({state:'visible'});
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
      await page.locator('details.sku-plan').nth(1).locator('svg[role="img"]').waitFor({state:'visible'});
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
      // Shared batting rotation must no longer toggle this fabric roll.
      const rot=page.getByLabel('Allow 90° grain rotation',{exact:true});
      const oneWay=page.getByLabel('One-way / directional print',{exact:true});
      check(!(await rot.isChecked())&&!(await oneWay.isChecked()),'New sample should start with grain rotation disabled.');
      await rot.check();
      check((await panel.innerText()).includes('25 in'),'Permitted 90-degree rotation should reduce current roll run to 25 in.');
      const rotatedDownload=page.waitForEvent('download');
      await page.locator('[data-action="export-cut-csv"]').click();
      const rotatedFile=await rotatedDownload;
      const rotatedRows=csvRecords(await fs.readFile(await rotatedFile.path(),'utf8'));
      check(rotatedRows.slice(1).every(row=>row[8]==='90'),'Current rotated cut list must preserve actual 90-degree grain setting.');
      await oneWay.check();
      check((await panel.innerText()).includes('30 in'),'Directional print must enforce unrotated 30-in current run.');
      check((await page.locator('[data-results]').innerText()).includes('rotation is disabled'),'Explain when one-way print overrides rotation setting.');
      const directionalDownload=page.waitForEvent('download');
      await page.locator('[data-action="export-cut-csv"]').click();
      const directionalFile=await directionalDownload;
      const directionalRows=csvRecords(await fs.readFile(await directionalFile.path(),'utf8'));
      check(directionalRows.slice(1).every(row=>row[8]==='0'),'Directional print must never export a 90-degree cut.');
      check(await page.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).yardage.oneWayPrint)===true,
        'Directional print preference must persist in Project V2.');
      await hydrated(page,'/quilt-batting-calculator/');
      check(!(await page.getByLabel('May rotate 90°',{exact:true}).isChecked()),
        'Fabric-only rotation must not silently change the shared batting setting.');
      await hydrated(page,'/fabric-yardage-calculator/');
      check(await page.getByLabel('One-way / directional print',{exact:true}).isChecked(),
        'Directional yardage constraint must persist after navigation.');
      check(await page.getByLabel('Allow 90° grain rotation',{exact:true}).isChecked(),
        'Unrestricted rotation preference must remain saved but overridden while directional print is on.');
      console.log('PASS independently scoped yardage rotation, one-way print safety and current cut CSV grain metadata.');

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
      await page.locator('details.sku-plan').nth(1).locator('svg[role="img"]').waitFor({state:'visible'});
    }
    console.log('PASS hydrated calculator '+path);
    if(path==='/quilt-backing-calculator/'){
      await page.screenshot({path:'artifacts/qa/backing-desktop.png',fullPage:true,animations:'disabled'});
    }
  }
  // Verify that an empty optional border list has no invalid shopping export.
  // Reconcile priced roll subtotals against the actual CSV, not hidden 0 prices.
  const priceContext=await browser.newContext({viewport:{width:1200,height:840},acceptDownloads:true});
  instrumentNetwork(priceContext,'shopping-price-reconciliation');
  const pricePage=await priceContext.newPage();
  pricePage.on('pageerror',e=>problems.push('Shopping pricing: '+e.message));
  await hydrated(pricePage,'/quilt-fabric-calculator/');
  const fabricPrices=pricePage.getByLabel('Price per yard (optional)',{exact:true});
  check(await fabricPrices.count()===2,'Fixture needs two independent top-fabric prices.');
  await fabricPrices.nth(0).fill('8');await fabricPrices.nth(0).press('Tab');
  await fabricPrices.nth(1).fill('12');await fabricPrices.nth(1).press('Tab');
  await hydrated(pricePage,'/quilt-border-calculator/');
  const borderPrice=pricePage.getByLabel('Price per yard (optional)',{exact:true}).first();
  await borderPrice.fill('5');await borderPrice.press('Tab');
  await hydrated(pricePage,'/calculators/',{incomplete:true});
  check(await pricePage.locator('.shopping-item .shopping-cost').count()===3,
   'Exactly three material lines should display entered-price amounts.');
  const priceNote=await pricePage.locator('[data-shopping-price-summary]').innerText();
  check(priceNote.includes('3 priced material line(s)')&&priceNote.includes('3 feasible material line(s) have no price'),
   'Subtotal must count unpriced backing, batting and binding separately.');
  check(priceNote.includes('Never treat this as a complete project quote'),
   'Partial subtotal must not claim to include unpriced or blocked materials.');
  const pendingPriceCsv=pricePage.waitForEvent('download');
  await pricePage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const exportedPricing=csvRecords(await fs.readFile(await (await pendingPriceCsv).path(),'utf8'));
  const knownCost=exportedPricing.slice(1).reduce((sum,row)=>sum+(row[8]?Number(row[8]):0),0);
  check(priceNote.includes(knownCost.toFixed(2)),
   'Displayed entered-price subtotal must reconcile to exported per-material CSV prices.');
  const missingPrices=exportedPricing.slice(1).filter(row=>row[7]==='');
  check(missingPrices.length===3&&missingPrices.every(row=>row[8]===''),
   'Unpriced SKU costs must remain blank, not invented as free.');
  await hydrated(pricePage,'/quilt-border-calculator/');
  await pricePage.getByRole('button',{name:'Remove layer',exact:true}).first().click();
  check(await pricePage.locator('details.sku-plan').count()===0,
   'Removing the last border must remove all border cuts.');
  check(await pricePage.locator('[data-action="export-shopping"]').count()===0,
   'No border layers must not expose an empty shopping CSV download.');
  check((await pricePage.locator('[data-results]').innerText()).includes('No materials configured'),
   'Zero-border state must be explained to the user.');
  check(!(await pricePage.locator('[data-action="export-cut-csv"]').isEnabled()),
   'Zero-border state cannot export a physical cutting list.');
  await pricePage.getByRole('button',{name:'+ Add border layer'}).click();
  check(await pricePage.locator('[data-action="export-shopping"]').count()===1,
   'Adding a border layer should restore a valid shopping CSV.');
  await priceContext.close();
  console.log('PASS shopping subtotal/CSV reconciliation and empty border material guard.');
  // Independent one-piece batting roll must have the same fit and grain
  // orientation on the project hub and on the dedicated batting calculator.
  const crossBatting=await browser.newContext({viewport:{width:1200,height:900},acceptDownloads:true});
  instrumentNetwork(crossBatting,'hub-batting-fit');
  const batPage=await crossBatting.newPage();
  batPage.on('pageerror',err=>problems.push('Hub/batting parity: '+err.message));
  await hydrated(batPage,'/calculators/',{incomplete:true});
  const hubWidth=batPage.getByLabel('Finished quilt width (in)',{exact:true});
  const hubHeight=batPage.getByLabel('Finished quilt height (in)',{exact:true});
  await hubWidth.fill('100');await hubWidth.press('Tab');
  await hubHeight.fill('50');await hubHeight.press('Tab');
  const battingRoll=batPage.getByLabel('Batting roll width (in)',{exact:true});
  await battingRoll.fill('65');await battingRoll.press('Tab');
  const battingRow=batPage.locator('.shopping-item').filter({hasText:'Batting · single piece only'});
  check((await battingRow.innerText()).includes('FIT IMPOSSIBLE'),'Unrotated 108 × 58 batting cannot fit a 65-inch roll.');
  check((await batPage.locator('[data-results]').innerText()).includes('INCOMPLETE SHOPPING LIST'),
    'Incomplete project must warn users before buying materials.');
  check(!(await batPage.locator('[data-action="print"]').isEnabled()),
    'Do not offer a complete cut-plan print for an impossible batting roll.');
  check(!(await batPage.locator('[data-action="export-cut-csv"]').isEnabled()),
    'Incomplete material plans must block a purchase-ready physical cut CSV.');
  check(await batPage.locator('[data-action="export-cut"]').isEnabled(),
    'Keep detailed JSON diagnostics available even when the cut list is impossible.');
  await batPage.emulateMedia({media:'print'});
  check(await batPage.locator('[data-tool]').getAttribute('data-print-ready')==='false',
    'Impossible project must set its print-safety state to false.');
  check(await batPage.locator('[data-results]').evaluate(el=>getComputedStyle(el).display)==='none',
    'Ctrl+P must not reveal cutting coordinates or shopping quantities for infeasible project.');
  check((await batPage.locator('.result-card').evaluate(el=>getComputedStyle(el,'::before').content)).includes('NOT A CUT-READY PLAN'),
    'Print-only safety message must replace the misleading purchase plan heading.');
  await batPage.pdf({path:'artifacts/qa/infeasible-browser-print-blocked.pdf',printBackground:true,format:'A4'});
  await batPage.emulateMedia({media:'screen'});

  const partialPromise=batPage.waitForEvent('download');
  await batPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const partialFile=await partialPromise;
  check(partialFile.suggestedFilename().includes('INCOMPLETE'),'A partial shopping sheet needs an unmistakable filename.');
  const partialCsv=await fs.readFile(await partialFile.path(),'utf8');
  check(partialCsv.includes('"FIT_IMPOSSIBLE_NOT_PURCHASE_READY"')&&partialCsv.includes('Batting'),
    'Partial shopping sheet must explicitly flag the impossible batting purchase.');
  const rotateBatting=batPage.getByLabel('May rotate batting 90°',{exact:true});
  check(!(await rotateBatting.isChecked()),'Sample project must start with unrotated batting.');
  await rotateBatting.check();
  check((await battingRow.innerText()).includes('3 yd'),'Rotated 58-in-wide × 108-in-long batting must fit for 3 yd.');
  check(!(await batPage.locator('[data-action="print"]').isEnabled()),
    'Correct batting fit alone does not confirm every quilt-top cutting piece.');
  await batPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').check();
  check(await batPage.locator('[data-action="print"]').isEnabled(),
    'A fully feasible cross-tool plan should restore print.');
  check(await batPage.locator('[data-tool]').getAttribute('data-print-ready')==='true',
    'Corrected fabric-fit project must remove print blocking state.');
  check(await batPage.locator('[data-action="export-cut-csv"]').isEnabled(),
    'A fully feasible cross-tool plan should restore current-roll cut CSV.');
  const hubCutPromise=batPage.waitForEvent('download');
  await batPage.getByRole('button',{name:'Download cut list CSV'}).click();
  const hubCut=csvRecords(await fs.readFile(await (await hubCutPromise).path(),'utf8'));
  const hubBatting=hubCut.slice(1).filter(row=>row[1]==='batting');
  check(hubBatting.length===1&&hubBatting[0][8]==='90'&&hubBatting[0][6]==='58'&&hubBatting[0][7]==='108',
    'Hub cut list must physically represent one permitted 90° batting rotation.');
  await hydrated(batPage,'/quilt-batting-calculator/');
  check(await batPage.getByLabel('May rotate 90°',{exact:true}).isChecked(),
    'Standalone batting page must use the same saved rotation setting.');
  check((await batPage.locator('[data-results] .result-big').innerText()).includes('3'),
    'Standalone batting must agree with 3-yard hub purchasing estimate.');
  const battingCutPromise=batPage.waitForEvent('download');
  await batPage.getByRole('button',{name:'Download cut list CSV'}).click();
  const battingCut=csvRecords(await fs.readFile(await (await battingCutPromise).path(),'utf8'));
  check(battingCut.length===2&&battingCut[1][8]==='90'&&battingCut[1][6]==='58'&&battingCut[1][7]==='108',
    'Standalone batting physical cut must match the project planner CSV.');
  await hydrated(batPage,'/quilt-fabric-calculator/');
  const firstFabricWof=batPage.getByLabel('Usable WOF (in)',{exact:true}).first();
  await firstFabricWof.fill('3');await firstFabricWof.press('Tab');
  check((await batPage.locator('[data-results]').innerText()).includes('INCOMPLETE SHOPPING LIST'),
    'Unfit fabric color must label shopping results as incomplete.');
  check(!(await batPage.locator('[data-action="print"]').isEnabled()),
    'Unfit fabric SKU must disable complete-plan print.');
  const fabricPartialPromise=batPage.waitForEvent('download');
  await batPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const fabricPartialFile=await fabricPartialPromise;
  check(fabricPartialFile.suggestedFilename().includes('INCOMPLETE'),'Unfit fabric CSV filename must be explicit.');
  const fabricPartial=await fs.readFile(await fabricPartialFile.path(),'utf8');
  check(fabricPartial.includes('Sky blue')&&fabricPartial.includes('FIT_IMPOSSIBLE_NOT_PURCHASE_READY'),
    'Unfit color must retain its own material line in the incomplete CSV.');
  await firstFabricWof.fill('43');await firstFabricWof.press('Tab');
  check(await batPage.locator('[data-action="print"]').isEnabled(),'Corrected fabric roll must restore print.');
  await batPage.screenshot({path:'artifacts/qa/hub-batting-fit-parity.png',fullPage:true,animations:'disabled'});
  await crossBatting.close();
  console.log('PASS hub/batting 90° parity, impossible roll purchase warnings, print gating and partial CSV safety.');


  // Full project shopping cannot be complete without actual quilt-top pieces,
  // even if backing, batting, binding and borders all have feasible cuts.
  const topContext=await browser.newContext({viewport:{width:1200,height:860},acceptDownloads:true});
  instrumentNetwork(topContext,'unplanned-top-fabric');
  const topPage=await topContext.newPage();
  topPage.on('pageerror',err=>problems.push('Unplanned quilt top: '+err.message));
  await hydrated(topPage,'/quilt-fabric-calculator/');
  check((await topPage.locator('details.sku-plan').count())===2,'Start with the two sample fabric SKU cutting plans.');
  await topPage.getByRole('button',{name:'Remove SKU'}).first().click();
  await topPage.getByRole('button',{name:'Remove SKU'}).first().click();
  check((await topPage.locator('[data-results]').innerText()).includes('Quilt-top fabric is NOT PLANNED'),
    'Deleting the last fabric SKU must not claim a finished top-material purchase.');
  check(!(await topPage.locator('[data-action="print"]').isEnabled()),
    'A fabric tool without SKUs must not print a complete cut plan.');
  check(await topPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).count()===1,
    'No-SKU top should still provide a clearly labeled partial diagnostic shopping CSV.');
  await hydrated(topPage,'/calculators/',{incomplete:true});
  const missingSummary=await topPage.locator('[data-results]').innerText();
  check(missingSummary.includes('QUILT TOP NOT PLANNED')&&missingSummary.includes('INCOMPLETE SHOPPING LIST'),
    'Project planner must disclose missing top fabric separately from its valid backing estimate.');
  check(missingSummary.includes('NOT PLANNED')&&!missingSummary.includes('FIT IMPOSSIBLE'),
    'No top-fabric SKU is missing data, not physically impossible.');
  check(!(await topPage.locator('[data-action="print"]').isEnabled()),
    'Project hub must refuse a complete printout when top fabric is absent.');
  check(!(await topPage.locator('[data-action="export-cut-csv"]').isEnabled()),
    'Project hub must not export a misleading full-material cutting CSV without top fabric.');
  check(await topPage.locator('[data-action="export-cut"]').isEnabled(),
    'Incomplete hub should retain JSON diagnostics.');
  const missingJsonPending=topPage.waitForEvent('download');
  await topPage.locator('[data-action="export-cut"]').click();
  const missingJson=JSON.parse(await fs.readFile(await (await missingJsonPending).path(),'utf8'));
  check(missingJson.readiness.scope==='entered-project-materials'&&missingJson.readiness.status==='TOP_FABRIC_NOT_PLANNED',
    'Hub JSON should identify missing top fabric and distinguish the overall project scope.');
  check(missingJson.readiness.topFabricMissing===true&&missingJson.readiness.cutCsvReady===false&&missingJson.readiness.printReady===false,
    'Incomplete JSON diagnostics must reflect disabled complete cut-list and print actions.');
  check(Array.isArray(missingJson.result.fabric)&&missingJson.result.fabric.length===0,
    'Empty quilt-top fabric must be explicitly represented as an empty material list, not silently omitted.');
  await topPage.emulateMedia({media:'print'});
  check(await topPage.locator('[data-tool]').getAttribute('data-print-ready')==='false',
    'Ctrl+P must hide the incomplete full project when top fabric is missing.');
  check(await topPage.locator('[data-results]').evaluate(el=>getComputedStyle(el).display)==='none',
    'Print stylesheet must suppress partial shopping values for a missing quilt top.');
  await topPage.emulateMedia({media:'screen'});
  const emptyTopCsvPending=topPage.waitForEvent('download');
  await topPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const emptyTopFile=await emptyTopCsvPending;
  check(emptyTopFile.suggestedFilename().includes('INCOMPLETE'),'Missing top cut CSV cannot be named as a complete purchase list.');
  const emptyTopCsv=await fs.readFile(await emptyTopFile.path(),'utf8');
  check(emptyTopCsv.includes('NOT_PLANNED_NO_CUT_PIECES')&&emptyTopCsv.includes('Quilt-top fabric'),
    'Incomplete CSV must include an explicit zero-SKU top-fabric row, not omit it or suggest zero-yard purchase.');
  await hydrated(topPage,'/quilt-fabric-calculator/',{incomplete:true,noHero:true});
  const noSkuJsonPending=topPage.waitForEvent('download');
  await topPage.locator('[data-action="export-cut"]').click();
  const noSkuJson=JSON.parse(await fs.readFile(await (await noSkuJsonPending).path(),'utf8'));
  check(noSkuJson.readiness.scope==='entered-top-fabric-skus'&&noSkuJson.readiness.topFabricMissing===true,
    'Fabric calculator JSON must explicitly name its incomplete top-only scope.');
  check(Array.isArray(noSkuJson.result)&&noSkuJson.result.length===0,
    'Zero-SKU standalone fabric JSON must export an empty SKU array, not an unexplained empty object.');
  await topPage.getByRole('button',{name:'+ Add fabric SKU'}).click();
  const quantity=topPage.getByLabel('Count',{exact:true}).first();
  await quantity.fill('0');await quantity.press('Tab');
  const zeroQuantityResult=await topPage.locator('[data-results]').innerText();
  check(zeroQuantityResult.includes('NOT PLANNED')&&!zeroQuantityResult.includes('FIT IMPOSSIBLE'),
    'A defined SKU with only zero-count pieces is not a physically impossible layout or a 0-yard order.');
  check((await topPage.locator('details.sku-plan').first().locator('summary').innerText()).includes('NOT PLANNED'),
    'A zero-piece SKU cutting accordion must not display 0 yd or FIT IMPOSSIBLE.');
  const zeroCsvPending=topPage.waitForEvent('download');
  await topPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const zeroCsv=await fs.readFile(await (await zeroCsvPending).path(),'utf8');
  check(zeroCsv.includes('NOT_PLANNED_NO_CUT_PIECES'),
    'Positive SKU count with zero real cuts must remain NOT PLANNED in the shopping CSV.');
  await hydrated(topPage,'/calculators/',{incomplete:true});
  check(!(await topPage.locator('[data-action="export-cut-csv"]').isEnabled()),
    'Hub must persist missing piece-count readiness across calculator navigation.');
  await hydrated(topPage,'/quilt-fabric-calculator/',{incomplete:true});
  const restoredQuantity=topPage.getByLabel('Count',{exact:true}).first();
  await restoredQuantity.fill('4');await restoredQuantity.press('Tab');
  check(await topPage.locator('[data-action="print"]').isEnabled(),
    'Adding positive-count physical cut pieces should make the fabric tool printable again.');
  await hydrated(topPage,'/calculators/',{incomplete:true});
  const topReview=topPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.');
  check(!(await topReview.isChecked()),'Entering cuts must not automatically confirm a complete quilt-top design.');
  check(!(await topPage.locator('[data-action="print"]').isEnabled()),
    'Entered cuts without user review must remain a partial project.');
  const reviewPendingDownload=topPage.waitForEvent('download');
  await topPage.getByRole('button',{name:'Download INCOMPLETE shopping CSV'}).click();
  const pendingCsv=await fs.readFile(await (await reviewPendingDownload).path(),'utf8');
  check(pendingCsv.includes('TOP_CUT_LIST_NOT_REVIEWED')&&pendingCsv.includes('New fabric'),
    'Unreviewed top fabric must retain provisional computed yardage but not claim a complete purchase order.');
  await topReview.check();
  check(await topPage.locator('[data-action="print"]').isEnabled(),
    'Restored quilt-top cut data should re-enable project hub print.');
  check(await topPage.locator('[data-action="export-cut-csv"]').isEnabled(),
    'Restored top-fabric cuts should re-enable full-project cutting CSV.');
  check(!(await topPage.locator('[data-results]').innerText()).includes('INCOMPLETE SHOPPING LIST'),
    'The missing-top warning must clear after positive-count cuts are entered.');
  const readyJsonPending=topPage.waitForEvent('download');
  await topPage.locator('[data-action="export-cut"]').click();
  const readyJson=JSON.parse(await fs.readFile(await (await readyJsonPending).path(),'utf8'));
  check(readyJson.readiness.status==='LISTED_CUTS_FEASIBLE'&&readyJson.readiness.topCutsReviewed===true&&
        readyJson.readiness.topFabricMissing===false&&
        readyJson.readiness.cutCsvReady===true&&readyJson.readiness.printReady===true,
    'Restoring real top fabric cuts must make the JSON readiness match the user-facing controls.');
  const reviewedBackupPromise=topPage.waitForEvent('download');
  await topPage.locator('[data-action="save"]').click();
  const reviewedBackup=JSON.parse(await fs.readFile(await (await reviewedBackupPromise).path(),'utf8'));
  check(reviewedBackup.quilt.topCutsReviewed===true &&
    /^[0-9a-f]{8}$/.test(reviewedBackup.quilt.topCutsReviewFingerprint),
    'Reviewed V2 project must record an eight-digit source-cut fingerprint.');
  await topPage.screenshot({path:'artifacts/qa/quilt-top-material-completeness.png',fullPage:true,animations:'disabled'});
  // Any accepted finished-size or quilt-top cut edit invalidates the user's
  // previous completeness review; other material buying settings do not.
  const reviewedWidth=topPage.getByLabel('Finished quilt width (in)',{exact:true});
  await reviewedWidth.fill('61');await reviewedWidth.press('Tab');
  check(!(await topReview.isChecked()),'Changing quilt top dimensions must revoke any old review acknowledgement.');
  check(!(await topPage.locator('[data-action="export-cut-csv"]').isEnabled()),
    'Changing top dimensions must revoke the full-project cutting CSV.');
  const reviewRevoked=topPage.waitForEvent('download');
  await topPage.locator('[data-action="export-cut"]').click();
  const revokedJson=JSON.parse(await fs.readFile(await (await reviewRevoked).path(),'utf8'));
  check(revokedJson.readiness.status==='TOP_CUT_LIST_NOT_REVIEWED'&&revokedJson.readiness.topCutsReviewed===false,
    'JSON readiness must record review invalidation after quilt-size edits.');
  await topReview.check();
  await hydrated(topPage,'/quilt-fabric-calculator/');
  const editedCount=topPage.getByLabel('Count',{exact:true}).first();
  await editedCount.fill('7');await editedCount.press('Tab');
  await hydrated(topPage,'/calculators/',{incomplete:true});
  check(!(await topPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').isChecked()),
    'Editing top-fabric piece counts must revoke the previously checked whole-project completeness claim.');
  check(!(await topPage.locator('[data-action="print"]').isEnabled()),
    'An edited fabric SKU must not inherit stale whole-project print authorisation.');
  // A stale manually-reviewed flag in an imported project is not a valid
  // acknowledgment of newly edited physical cuts.
  const editedReviewed=structuredClone(reviewedBackup);
  editedReviewed.fabrics[0].pieces[0].count+=1;
  await topPage.locator('[data-file]').setInputFiles({
    name:'stale-reviewed-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(editedReviewed))
  });
  await topPage.waitForFunction(()=>document.querySelector('[data-results]')?.textContent?.includes('QUILT TOP NOT REVIEWED'));
  check(!(await topPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').isChecked()),
    'Imported old confirmation must be unchecked after the top cut-list changed.');
  check(!(await topPage.locator('[data-action="export-cut-csv"]').isEnabled()),
    'Stale reviewed import cannot grant a complete cut CSV.');
  const legacyFlag=structuredClone(reviewedBackup);
  delete legacyFlag.quilt.topCutsReviewFingerprint;
  await topPage.locator('[data-file]').setInputFiles({
    name:'legacy-reviewed-flag-only.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacyFlag))
  });
  await topPage.waitForFunction(()=>document.querySelector('[data-results]')?.textContent?.includes('QUILT TOP NOT REVIEWED'));
  check(!(await topPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').isChecked()),
    'Imported V2 review without a bound fingerprint must require new confirmation.');
  await topPage.locator('[data-file]').setInputFiles({
    name:'matching-reviewed-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(reviewedBackup))
  });
  await topPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'));
  check(await topPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').isChecked() &&
     await topPage.locator('[data-action="export-cut-csv"]').isEnabled(),
    'A matching saved V2 review fingerprint should restore the confirmed project.');
  await topContext.close();
  console.log('PASS empty/zero-quantity top-fabric planning, incomplete CSV reasons, no-print safety and restored complete project.');
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
  await auditWcag(page,'/lab/square-in-square/');
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
  // Error reporting must be bound to the actual field, not only to a distant
  // result status. Recalculate should focus the invalid field, never stale PDF.
  await hydrated(page,'/quilt-backing-calculator/');
  const a11yField=page.getByLabel('Finished quilt width (in)',{exact:true});
  await a11yField.fill('not a number');
  await page.getByRole('button',{name:'Update cutting plan'}).click();
  check(await a11yField.evaluate(el=>document.activeElement===el),
    'Recalculate with an invalid input must return keyboard focus to that field.');
  check((await a11yField.getAttribute('aria-invalid'))==='true',
    'Invalid width must expose aria-invalid=true.');
  const errorIds=(await a11yField.getAttribute('aria-describedby'))?.trim().split(/\s+/)||[];
  check(errorIds.length>0,'Invalid input must reference an accessible error description.');
  check(await page.locator('#'+errorIds.at(-1)+'[role="alert"]:not([hidden])').count()===1,
    'Error text should be programmatically associated with the invalid field and announced.');
  await a11yField.fill('60');await a11yField.press('Tab');
  check((await a11yField.getAttribute('aria-invalid'))==='false'&&
    await page.locator('[data-stale-warning]').count()===0,
    'Correcting the error must clear both aria-invalid and stale warnings.');
  const describedHint=await page.locator('.field-wrap:has(.hint) input[aria-describedby]').first().evaluate(el=>{
    const ids=el.getAttribute('aria-describedby').trim().split(/\s+/);
    return {hint:ids.some(id=>document.getElementById(id)?.classList.contains('hint')),
            error:ids.some(id=>document.getElementById(id)?.classList.contains('field-error'))};
  });
  check(describedHint.hint&&describedHint.error,
    'Field-specific help and errors must both be discoverable via aria-describedby.');
  console.log('PASS input error focus, live error description and associated help; recovery restores exports.');
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
  // The dedicated print-check page has three distinct physical-unit references.
  // CSS/PDF are only engineering checks; physical paper remains MANUAL_NOT_RUN.
  const qaResponse=await page.goto(ROOT+'/qa/print-calibration/',{waitUntil:'domcontentloaded'});
  check(qaResponse.status()===200,'QA print calibration page must respond HTTP 200.');
  check(await page.locator('meta[name="robots"]').getAttribute('content')==='noindex,follow',
   'Manual paper-test QA page must never be indexed.');
  check(await page.locator('link[rel="canonical"]').count()===0,'QA page must not have SEO canonical.');
  await page.emulateMedia({media:'print'});
  const qaDimensions=await page.evaluate(()=>{
   const square=document.querySelector('[data-qa-inch-square]').getBoundingClientRect();
   const mm=document.querySelector('[data-qa-mm-line]').getBoundingClientRect();
   const six=document.querySelector('[data-qa-six-inch]').getBoundingClientRect();
   return {squareX:square.width,squareY:square.height,mmWidth:mm.width,sixWidth:six.width,
    paperText:document.querySelector('[data-qa-paper]')?.textContent||''};
  });
  check(Math.abs(qaDimensions.squareX-96)<.25&&Math.abs(qaDimensions.squareY-96)<.25,
   'Real-paper worksheet 1in square must render at CSS 1in × 1in: '+JSON.stringify(qaDimensions));
  check(Math.abs(qaDimensions.mmWidth-100/25.4*96)<.35&&Math.abs(qaDimensions.sixWidth-576)<.25,
   'Physical worksheet 100mm and 6in guides must use correct CSS physical units: '+JSON.stringify(qaDimensions));
  check(qaDimensions.paperText.includes('25.4 mm')&&qaDimensions.paperText.includes('152.4 mm')&&
    qaDimensions.paperText.includes('NOT AUTO-CERTIFIED'),
   'Physical worksheet must state targets and visibly disallow automatic sign-off.');
  await page.pdf({path:'artifacts/qa/physical-print-calibration-worksheet.pdf',format:'A4',printBackground:true});
  await page.emulateMedia({media:'screen'});
  check(await page.locator('[data-qa-print]').isVisible(),'Worksheet print action must be visible on screen.');
  console.log('PASS independent noindex 1in / 100mm / 6in print worksheet and browser PDF; real ruler MANUAL_NOT_RUN.');
  await hydrated(page,'/calculators/',{incomplete:true});
  await page.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').check();
  check(await page.locator('details.sku-plan').count()===6,'Project print must contain all six material plans.');
  check(await page.locator('details.sku-plan[data-preview-state="pending"]').count()===5,
    'Project print test must begin with 5 unrendered closed materials to prove print-time materialization.');
  await page.evaluate(()=>{window.__prePrintPlanCount=0;window.addEventListener('beforeprint',()=>{
    window.__prePrintPlanCount=document.querySelectorAll('details.sku-plan[open]').length;
  });});
  await page.pdf({path:'artifacts/qa/all-materials-print.pdf',printBackground:true,format:'A4'});
  check(await page.evaluate(()=>window.__prePrintPlanCount)===6,'Printing must expand every material plan, not just backing.');
  check(await page.locator('details.sku-plan[data-preview-state="pending"]').count()===0,
    'Print must materialize all 6 previously hidden roll previews before the PDF snapshot.');
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

  // Asynchronous File.text() must not overwrite edits accepted after the import
  // started. Delay ONLY the browser's file-reading promise: no test mocks for
  // app internals, geometry, storage, form validation, or persistence.
  const raceContext=await browser.newContext({viewport:{width:1150,height:800},acceptDownloads:true});
  instrumentNetwork(raceContext,'delayed-import-race');
  const race=await raceContext.newPage();
  race.on('pageerror',e=>problems.push('Delayed import: '+e.message));
  await hydrated(race,'/quilt-backing-calculator/');
  const raceInitialDownload=race.waitForEvent('download');
  await race.locator('[data-action="save"]').click();
  const raceProject=JSON.parse(await fs.readFile(await (await raceInitialDownload).path(),'utf8'));
  await race.evaluate(()=>{
    const original=File.prototype.text;
    File.prototype.text=function(){
      window.__raceFileReading=true;
      return new Promise(resolve=>{
        const file=this;
        window.__raceResumeImport=async()=>resolve(await original.call(file));
      });
    };
  });
  const raceWidth=race.getByLabel('Finished quilt width (in)',{exact:true});
  raceProject.quilt.finishedWidth=89;
  const importedRaceBuffer=()=>Buffer.from(JSON.stringify(raceProject));
  await race.locator('[data-file]').setInputFiles({
    name:'delayed-import.json',mimeType:'application/json',buffer:importedRaceBuffer()
  });
  await race.waitForFunction(()=>window.__raceFileReading===true);
  await raceWidth.fill('77');await raceWidth.press('Tab');
  check((await race.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth))===77,
    'Newer accepted measurement should autosave even while import read is pending.');
  await race.evaluate(()=>window.__raceResumeImport());
  await race.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Import canceled'));
  check(await raceWidth.inputValue()==='77',
    'Delayed import must not silently overwrite a later accepted user edit.');
  check((await race.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth))===77,
    'Delayed import must preserve the newer localStorage project too.');

  // Import without an overlapping edit should still work normally.
  await race.evaluate(()=>{window.__raceFileReading=false;});
  await race.locator('[data-file]').setInputFiles({
    name:'delayed-import-clean.json',mimeType:'application/json',buffer:importedRaceBuffer()
  });
  await race.waitForFunction(()=>window.__raceFileReading===true);
  await race.evaluate(()=>window.__raceResumeImport());
  await race.waitForFunction(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')||'{}').quilt?.finishedWidth===89);
  check(await raceWidth.inputValue()==='89','Uncontested delayed import should restore its intended project.');
  check((await race.locator('[data-status]').innerText()).includes('Updated from the current project'),
    'Successful import must recalculate and clear the prior cancellation warning.');

  // Also protect against an independent tab updating shared storage while
  // the user's current tab is reading the selected JSON file.
  const raceOther=await raceContext.newPage();
  await hydrated(raceOther,'/quilt-backing-calculator/');
  raceProject.quilt.finishedWidth=94;
  await race.evaluate(()=>{window.__raceFileReading=false;});
  await race.locator('[data-file]').setInputFiles({
    name:'delayed-import-cross-tab.json',mimeType:'application/json',buffer:importedRaceBuffer()
  });
  await race.waitForFunction(()=>window.__raceFileReading===true);
  const otherWidth=raceOther.getByLabel('Finished quilt width (in)',{exact:true});
  await otherWidth.fill('92');await otherWidth.press('Tab');
  await race.locator('[data-sync-warning]').waitFor({state:'visible'});
  await race.evaluate(()=>window.__raceResumeImport());
  await race.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Import canceled'));
  check((await race.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth))===92,
    'Delayed import must not overwrite a different tab\'s later autosave.');
  check(await raceWidth.inputValue()==='89',
    'Delayed import must preserve this tab\'s last accepted in-memory project.');
  check(!(await race.locator('[data-sync-warning]').isHidden()),
    'Cross-tab import collision must warn that newer shared storage exists.');
  await race.screenshot({path:'artifacts/qa/delayed-json-import-conflict.png',fullPage:true,animations:'disabled'});
  await raceContext.close();
  console.log('PASS delayed JSON import cannot overwrite later local edits or newer cross-tab autosaves; clean delayed import still works.');

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
  check(!(await tabB.locator('[data-action="export-cut-csv"]').isEnabled()) &&
        !(await tabB.locator('[data-action="export-cut"]').isEnabled()) &&
        !(await tabB.locator('[data-action="print"]').isEnabled()),
   'A superseded tab must disable complete cutting CSV, JSON and print.');
  // Backing-only calculator deliberately has no composite shopping control;
  // the actual material shopping gate is tested on Project Planner below.
  check(await tabB.locator('[data-action="save"]').isEnabled(),
   'Conflict must preserve the ability to back up the superseded local project as JSON.');
  check(await tabB.locator('[data-tool]').getAttribute('data-print-ready')==='false',
   'A stale tab must disable print-ready CSS even for browser menu/Ctrl+P.');
  await tabB.emulateMedia({media:'print'});
  check(await tabB.locator('[data-results]').evaluate(el=>getComputedStyle(el).display)==='none',
   'Ctrl+P must hide obsolete coordinates after a cross-tab conflict.');
  await tabB.emulateMedia({media:'screen'});
  await tabB.screenshot({path:'artifacts/qa/project-multitab-conflict.png',fullPage:true,animations:'disabled'});
  await bWidth.fill('76');await bWidth.press('Tab');
  check(!(await tabB.locator('[data-action="export-cut-csv"]').isEnabled()) &&
        !(await tabB.locator('[data-action="print"]').isEnabled()),
   'Recalculation of local unsaved edits must not enable out-of-sync cut exports.');
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
  check(await tabB.locator('[data-action="export-cut-csv"]').isEnabled() &&
        await tabB.locator('[data-action="print"]').isEnabled(),
   'Loading the newest saved project must restore legitimate cutting and printing exports.');
  assert.equal(await tabB.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'72',
   'Load latest must retrieve the other tab\'s saved measurements.');
  await tabB.getByLabel('Finished quilt width (in)',{exact:true}).fill('75');
  await tabB.getByLabel('Finished quilt width (in)',{exact:true}).press('Tab');
  await tabA.locator('[data-sync-warning]').waitFor({state:'visible'});
  const staleBeforeReset=await tabA.getByLabel('Finished quilt width (in)',{exact:true}).inputValue();
  await tabA.locator('[data-action="reset"]').click();
  assert.equal(await tabA.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),staleBeforeReset,
    'Reset on stale tab must not discard unsaved local project edits.');
  check((await tabA.locator('[data-status]').innerText()).includes('Reset canceled'),
    'Stale tab must clearly explain why reset was blocked.');
  assert.equal(await tabA.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),75,
   'Reset from stale tab must not delete newer saved data.');
  await tabA.locator('[data-action="load-latest"]').click();
  assert.equal(await tabA.getByLabel('Finished quilt width (in)',{exact:true}).inputValue(),'75',
   'Stale tab failed to recover the saved project after reset.');
  await tabA.close();await tabB.close();
  console.log('PASS two-tab conflict warning, safe JSON backup, reload and reset protection.');

  // Project Planner is the source of combined shopping CSV. Test that a newer
  // save elsewhere disables the *real* purchase download, without erasing
  // a user's ability to back up this tab's older version as project JSON.
  const shopCtx=await browser.newContext({viewport:{width:1150,height:840},acceptDownloads:true});
  instrumentNetwork(shopCtx,'two-tab-shopping-conflict');
  const shoppingTab=await shopCtx.newPage();
  const editingTab=await shopCtx.newPage();
  shoppingTab.on('pageerror',e=>problems.push('Shopping tab: '+e.message));
  editingTab.on('pageerror',e=>problems.push('Shopping edit tab: '+e.message));
  await hydrated(shoppingTab,'/calculators/',{incomplete:true});
  await hydrated(editingTab,'/quilt-backing-calculator/');
  const shopButton=shoppingTab.locator('[data-results] [data-action="export-shopping"]');
  check(await shopButton.count()===1 && await shopButton.isEnabled(),
    'Combined shopping CSV must be available before a shared-storage conflict.');
  const newestWidth=editingTab.getByLabel('Finished quilt width (in)',{exact:true});
  await newestWidth.fill('74');await newestWidth.press('Tab');
  await shoppingTab.locator('[data-sync-warning]').waitFor({state:'visible'});
  check(!(await shopButton.isEnabled()),
    'Project Planner must disable its combined shopping download when another tab commits.');
  check(await shoppingTab.locator('[data-action="save"]').isEnabled(),
    'Out-of-sync shopping tab should still permit local project JSON backup.');
  await shoppingTab.locator('[data-action="load-latest"]').click();
  check(await shoppingTab.locator('[data-results] [data-action="export-shopping"]').isEnabled(),
    'Loading the latest project must restore its shopping download.');
  check((await shoppingTab.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='74',
    'Recovered shopping planner must use the newest saved quilt measurements.');
  await shopCtx.close();
  console.log('PASS two-tab project shopping CSV blocked on conflict, JSON backup preserved and latest data recovery works.');

  // A suspended/back-forward-cache tab may resume without a delivered
  // StorageEvent. Set shared storage in the SAME document (which cannot
  // generate a browser storage event) to simulate that lost notification.
  // Each genuine return-to-page signal must proactively invalidate cut
  // exports and Ctrl+P; load-latest then restores the new project.
  const resumeCtx=await browser.newContext({viewport:{width:1130,height:790},acceptDownloads:true});
  instrumentNetwork(resumeCtx,'resume-without-storage-event');
  const resumed=await resumeCtx.newPage();
  resumed.on('pageerror',e=>problems.push('Resumed project: '+e.message));
  await hydrated(resumed,'/quilt-backing-calculator/');
  const widthOnResume=resumed.getByLabel('Finished quilt width (in)',{exact:true});
  await widthOnResume.fill('78');await widthOnResume.press('Tab');
  for(const trigger of ['pageshow','focus','visibilitychange']){
   const expected=await resumed.evaluate(()=>{
    const stored=JSON.parse(localStorage.getItem('quilt-studio-v2'));
    stored.quilt.finishedWidth+=1;
    localStorage.setItem('quilt-studio-v2',JSON.stringify(stored));
    return stored.quilt.finishedWidth;
   });
   // Same-document storage modifications do NOT fire window StorageEvent;
   // until resumed, controls remain visually ready despite stale state.
   check(await resumed.locator('[data-sync-warning]').isHidden() &&
     await resumed.locator('[data-action="export-cut-csv"]').isEnabled(),
     'Missing-event fixture must start with a superficially ready stale tab.');
   await resumed.evaluate(eventName=>{
    if(eventName==='visibilitychange')document.dispatchEvent(new Event('visibilitychange'));
    else window.dispatchEvent(new Event(eventName));
   },trigger);
   check(!(await resumed.locator('[data-sync-warning]').isHidden()),
     'Resumed '+trigger+' must show a project conflict without a StorageEvent.');
   check(!(await resumed.locator('[data-action="export-cut-csv"]').isEnabled()) &&
     !(await resumed.locator('[data-action="export-cut"]').isEnabled()) &&
     !(await resumed.locator('[data-action="print"]').isEnabled()),
     'Resumed '+trigger+' must proactively disable all outdated cut/print controls.');
   check(await resumed.locator('[data-action="save"]').isEnabled() &&
      await resumed.locator('[data-tool]').getAttribute('data-print-ready')==='false',
     'Resumed '+trigger+' must preserve backup but prevent native Ctrl+P.');
   await resumed.locator('[data-action="load-latest"]').click();
   check(Number(await widthOnResume.inputValue())===expected &&
     await resumed.locator('[data-sync-warning]').isHidden() &&
     await resumed.locator('[data-action="export-cut-csv"]').isEnabled(),
     'Loading latest after '+trigger+' must restore the new project and valid exports.');
  }
  await resumeCtx.close();
  console.log('PASS restored BFCache/pageshow, focus and tab visibility detect missed storage events and block stale exports.');

  // Reset safety: one-step recovery preserves the last accepted project and
  // its local-storage backup. Any new accepted change invalidates Undo.
  const resetCtx=await browser.newContext({viewport:{width:1150,height:800},acceptDownloads:true});
  instrumentNetwork(resetCtx,'reset-undo');
  const resetPage=await resetCtx.newPage();
  resetPage.on('pageerror',err=>problems.push('Undo reset: '+err.message));
  await hydrated(resetPage,'/quilt-backing-calculator/');
  const undo=resetPage.locator('[data-action="undo-reset"]');
  check(!(await undo.isEnabled()),'Undo reset must initially be disabled.');
  const resetWidth=resetPage.getByLabel('Finished quilt width (in)',{exact:true});
  await resetWidth.fill('87');await resetWidth.press('Tab');
  assert.equal(await resetPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),87,
    'Undo fixture must start from a persisted, user-edited project.');
  await resetPage.locator('[data-action="reset"]').click();
  check(await undo.isEnabled(),'Reset should enable one-step restoration.');
  check((await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='60',
    'Reset must show the sample project.');
  check(await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'))===null,
    'Normal Reset should clear only this tab’s current autosaved project.');
  await undo.click();
  check((await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='87',
    'Undo reset must restore the previous native-inch project.');
  assert.equal(await resetPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),87,
    'Undo reset must restore the previous valid browser backup.');
  check(!(await undo.isEnabled()),'Undo reset must be one-time only.');
  await resetPage.locator('[data-action="reset"]').click();
  check(await undo.isEnabled(),'Second reset must expose a new recovery point.');
  await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).fill('82');
  await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).press('Tab');
  check(!(await undo.isEnabled()),'A committed edit after reset must invalidate the older Undo.');
  check((await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='82',
    'Newly committed work must remain after invalidating Undo.');
  // A rejected measurement remains visible until corrected; project actions
  // must not wipe it or replace the accepted autosave behind the user's back.
  const draftWidth=resetPage.getByLabel('Finished quilt width (in)',{exact:true});
  await draftWidth.fill('not-a-measurement');
  await draftWidth.press('Tab');
  check(await draftWidth.getAttribute('aria-invalid')==='true','Rejected input should be visibly invalid.');
  const beforeGuard=await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'));
  await resetPage.locator('[data-units]').selectOption('cm');
  check((await resetPage.locator('[data-units]').inputValue())==='in','Unit switch must revert while a draft is invalid.');
  await resetPage.locator('[data-action="reset"]').click();
  check((await draftWidth.inputValue())==='not-a-measurement','Reset must not erase a rejected visible draft.');
  check(await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'))===beforeGuard,
   'Blocked reset must not mutate the stored project.');
  await resetPage.emulateMedia({media:'print'});
  check(await resetPage.locator('[data-tool]').getAttribute('data-print-ready')==='false',
    'Uncommitted invalid input must block browser-level print.');
  check(await resetPage.locator('[data-results]').evaluate(el=>getComputedStyle(el).display)==='none',
    'Ctrl+P must hide stale cutting figures while a draft is invalid.');
  await resetPage.emulateMedia({media:'screen'});

  await resetPage.locator('[data-action="import"]').click();
  check((await draftWidth.inputValue())==='not-a-measurement','Import must not erase a rejected draft.');
  await draftWidth.fill('90');
  await draftWidth.press('Tab');
  assert.equal(await resetPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),90,
   'Correcting a rejected draft must restore normal autosave.');
  await resetPage.locator('[data-action="reset"]').click();
  check(await undo.isEnabled(),'Reset should be permitted after all fields validate.');
  await undo.click();
  check((await resetPage.getByLabel('Finished quilt width (in)',{exact:true}).inputValue())==='90',
   'Undo after a valid reset must preserve the latest committed value.');
  await resetPage.screenshot({path:'artifacts/qa/safe-reset-undo.png',fullPage:true,animations:'disabled'});
  // Material editors must preserve invalid drafts before add/remove actions.
  await hydrated(resetPage,'/quilt-fabric-calculator/');
  const fabricLabel=resetPage.getByLabel('Fabric / color label',{exact:true}).first();
  await fabricLabel.fill('');
  await fabricLabel.press('Tab');
  check(await fabricLabel.getAttribute('aria-invalid')==='true','Blank required fabric label must be invalid.');
  const fabricBefore=await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'));
  await resetPage.getByRole('button',{name:'+ Add fabric SKU'}).click();
  await resetPage.getByRole('button',{name:'Remove SKU'}).first().click();
  check((await fabricLabel.inputValue())==='','Fabric add/remove must not clear an invalid draft.');
  check(await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'))===fabricBefore,
   'Fabric material actions cannot mutate autosave when a draft is rejected.');
  await fabricLabel.fill('Sky blue checked');
  await fabricLabel.press('Tab');
  check(await resetPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).fabrics[0].label)==='Sky blue checked',
   'Corrected SKU label must persist after rejected material actions.');

  await hydrated(resetPage,'/quilt-border-calculator/');
  const borderWidth=resetPage.getByLabel('Finished border width (in)',{exact:true}).first();
  await borderWidth.fill('0');
  await borderWidth.press('Tab');
  check(await borderWidth.getAttribute('aria-invalid')==='true','Zero-width border draft must be invalid.');
  const borderBefore=await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'));
  await resetPage.getByRole('button',{name:'+ Add border layer'}).click();
  await resetPage.getByRole('button',{name:'Remove layer'}).first().click();
  check((await borderWidth.inputValue())==='0','Border add/remove must preserve rejected widths.');
  check(await resetPage.evaluate(()=>localStorage.getItem('quilt-studio-v2'))===borderBefore,
   'Border material actions cannot overwrite accepted project with a rejected draft.');
  await borderWidth.fill('2.75');
  await borderWidth.press('Tab');
  check(await resetPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).borders[0].widthIn)===2.75,
   'Valid repaired border must autosave normally.');
  await resetPage.screenshot({path:'artifacts/qa/draft-material-guard.png',fullPage:true,animations:'disabled'});
  await resetCtx.close();
  console.log('PASS reset undo restores autosaved project; stale-tab reset is blocked and new edits invalidate old undo.');

  // Dynamic material editors previously rebuilt their own clicked buttons and
  // sent keyboard focus to the document body. Exercise actual Enter presses
  // and confirm focus lands on a nearby meaningful new/remaining control.
  const keyboardCtx=await browser.newContext({viewport:{width:1080,height:850},acceptDownloads:true});
  instrumentNetwork(keyboardCtx,'keyboard-dynamic-materials');
  const keyboard=await keyboardCtx.newPage();
  keyboard.on('pageerror',err=>problems.push('Dynamic material keyboard: '+err.message));
  await hydrated(keyboard,'/quilt-fabric-calculator/');
  const renamedFabric=keyboard.getByLabel('Fabric / color label',{exact:true}).first();
  await renamedFabric.fill('Updated sky blue');
  await renamedFabric.press('Tab');
  check((await keyboard.locator('[data-fabric-index="0"] > .dynamic-head strong').innerText())==='Updated sky blue',
   'Fabric card heading must reflect a committed label edit without requiring a page reload.');
  const fabricDelete=keyboard.locator('[data-fabric-index="0"] [data-remove-sku]');
  check((await fabricDelete.getAttribute('aria-describedby'))==='fabric-editor-label-0',
   'Screen readers need SKU-specific context for otherwise identical Remove SKU buttons.');
  const fabricDesc=await fabricDelete.evaluate(el=>document.getElementById(el.getAttribute('aria-describedby'))?.textContent);
  check(fabricDesc==='Updated sky blue','Remove SKU accessible description must track the edited label.');
  const firstCutDelete=keyboard.locator('[data-fabric-index="0"] [data-cut-index="0"] [data-remove-cut]');
  const cutDesc=await firstCutDelete.evaluate(el=>el.getAttribute('aria-describedby')?.split(' ')
    .map(id=>document.getElementById(id)?.textContent).join(' | '));
  check(cutDesc==='Updated sky blue | Cut group 1',
   'Same-label Remove cut group buttons must identify the parent SKU and group number.');
  const activeIs=async selector=>keyboard.locator(selector).first().evaluate(el=>document.activeElement===el);
  const selectedAll=async selector=>keyboard.locator(selector).first().evaluate(el=>el instanceof HTMLInputElement &&
    el.selectionStart===0&&el.selectionEnd===el.value.length);
  const addCut0=keyboard.locator('[data-fabric-index="0"] [data-add-cut]');
  await addCut0.focus();await addCut0.press('Enter');
  const newCutName='[data-fabric-index="0"] [data-cut-index="1"] .field-control';
  check(await activeIs(newCutName)&&await selectedAll(newCutName),
    'Adding a cut group with Enter must focus/select its editable piece label.');
  const newCutRemove=keyboard.locator('[data-fabric-index="0"] [data-cut-index="1"] [data-remove-cut]');
  await newCutRemove.focus();await newCutRemove.press('Enter');
  check(await activeIs('[data-fabric-index="0"] [data-cut-index="0"] [data-remove-cut]'),
    'Removing a cut group must leave focus on the nearest remaining group.');
  const lastCutRemove=keyboard.locator('[data-fabric-index="0"] [data-cut-index="0"] [data-remove-cut]');
  await lastCutRemove.focus();await lastCutRemove.press('Enter');
  check(await activeIs('[data-fabric-index="0"] [data-add-cut]'),
    'Removing the last cut group must focus Add cut group instead of losing keyboard focus.');
  await addCut0.press('Enter');
  check(await activeIs('[data-fabric-index="0"] [data-cut-index="0"] .field-control'),
    'Adding a replacement physical cut must restore input focus.');
  const addSku=keyboard.locator('[data-add-sku]');
  await addSku.focus();await addSku.press('Enter');
  const newSkuName='[data-fabric-index="2"] .field-control';
  check(await activeIs(newSkuName)&&await selectedAll(newSkuName),
    'Add SKU with Enter must focus/select the unique SKU field.');
  const sku2=keyboard.locator('[data-fabric-index="2"] [data-remove-sku]');
  await sku2.focus();await sku2.press('Enter');
  check(await activeIs('[data-fabric-index="1"] [data-remove-sku]'),
    'Removing the final SKU should focus the previous remaining SKU.');
  await keyboard.locator('[data-fabric-index="0"] [data-remove-sku]').press('Enter');
  check(await activeIs('[data-fabric-index="0"] [data-remove-sku]'),
    'Removing the first of two SKUs should focus the next remaining SKU.');
  await keyboard.locator('[data-fabric-index="0"] [data-remove-sku]').press('Enter');
  check(await activeIs('[data-add-sku]'),
    'Removing every SKU should focus the action needed to add a new one.');
  check((await keyboard.locator('[data-results]').innerText()).includes('NOT PLANNED'),
    'Removing all SKUs must retain its incomplete shopping safeguard.');

  await hydrated(keyboard,'/quilt-border-calculator/');
  const borderLabel=keyboard.getByLabel('Label / color',{exact:true}).first();
  await borderLabel.fill('Indigo edge');
  await borderLabel.press('Tab');
  check((await keyboard.locator('[data-border-index="0"] > .dynamic-head strong').innerText())==='Layer 1 · Indigo edge',
   'Border card heading must track a committed label edit immediately.');
  const borderDelete=keyboard.locator('[data-border-index="0"] [data-remove-border]');
  const borderDesc=await borderDelete.evaluate(el=>document.getElementById(el.getAttribute('aria-describedby'))?.textContent);
  check(borderDesc==='Layer 1 · Indigo edge','Remove border control must have context from the current border label.');
  const addBorder=keyboard.locator('[data-add-border]');
  await addBorder.focus();await addBorder.press('Enter');
  check(await activeIs('[data-border-index="1"] .field-control')&&
        await selectedAll('[data-border-index="1"] .field-control'),
    'New border layer must place keyboard focus in its editable SKU field.');
  await keyboard.locator('[data-border-index="1"] [data-remove-border]').press('Enter');
  check(await activeIs('[data-border-index="0"] [data-remove-border]'),
    'Removing a border must restore focus to the next remaining border.');
  await keyboard.locator('[data-border-index="0"] [data-remove-border]').press('Enter');
  check(await activeIs('[data-add-border]'),
    'Removing the last border layer must focus Add border layer.');
  await addBorder.press('Enter');
  check(await activeIs('[data-border-index="0"] .field-control'),
    'Border creation must remain keyboard-operable after an empty configuration.');
  console.log('PASS keyboard focus and text selection for adding/removing fabric SKUs, cut groups and borders.');

  // Import a real upper-capacity material fixture. The UI may show only the
  // first 45 coordinate rows per SKU, but the downloadable cut CSV must hold
  // exactly 2,000 physical pieces on 30 independent fabric rolls.
  await hydrated(keyboard,'/quilt-fabric-calculator/',{incomplete:true,noHero:true});
  const stressProject=await keyboard.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  stressProject.quilt.topCutsReviewed=false;
  delete stressProject.quilt.topCutsReviewFingerprint;
  stressProject.fabrics=Array.from({length:30},(_,i)=>({
    id:'stress-'+i,label:'Roll '+i,usableWidth:43,shrinkageLengthPct:5,oneWayPrint:i%2===0,
    pieces:[{widthIn:5,heightIn:5,count:i===29?86:66,label:'Square '+i,allowRotate:true}]
  }));
  await keyboard.locator('[data-file]').setInputFiles({
    name:'quilt-2000-cuts-30-rolls.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(stressProject))
  });
  await keyboard.waitForFunction(()=>document.querySelectorAll('details.sku-plan').length===30,null,{timeout:30000});
  check(await keyboard.locator('[data-fabric-index]').count()===30,
    'Upper-capacity project must display 30 editable fabric SKU groups.');
  check(await keyboard.locator('details.sku-plan[data-preview-state="pending"]').count()===29 &&
    await keyboard.locator('details.sku-plan svg[data-export-scope="current"]').count()===1,
    '30-roll initial render must generate only the first visible SVG, not 29 hidden roll previews.');
  check((await keyboard.locator('details.sku-plan .breakdown-table tbody tr').count())===45,
    'Initial 30-roll screen must render only 45 visible preview-coordinate rows.');
  // Print must synchronously build every hidden preview before capturing the
  // page, even when all 29 remaining rolls have never been opened.
  await keyboard.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  const svgCounts=await keyboard.locator('details.sku-plan svg[data-export-scope="current"]').evaluateAll(
    svgs=>svgs.map(svg=>Number(svg.dataset.cutCount))
  );
  check(svgCounts.length===30&&svgCounts.reduce((a,b)=>a+b,0)===2000,
    'Print preparation must synchronously render every roll and preserve all 2,000 cut counts.');
  check((await keyboard.locator('details.sku-plan .breakdown-table tbody tr').count())===30*45,
    'Printed roll coordinate previews should stay bounded to 45 rows per roll.');
  await keyboard.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  check(await keyboard.locator('details.sku-plan[open]').count()===1,
    'After printing, all initially collapsed material rolls must return to their prior state.');
  check(await keyboard.locator('[data-action="export-cut-csv"]').isEnabled(),
    'All 2,000 feasible cuts should remain exportable independently of preview limits.');
  const stressDownload=keyboard.waitForEvent('download');
  await keyboard.locator('[data-action="export-cut-csv"]').click();
  const stressCsv=csvRecords(await fs.readFile(await (await stressDownload).path(),'utf8'));
  check(stressCsv.length===2001,'All 2,000 cuts plus the header must be present in the CSV.');
  check(stressCsv.slice(1).every(row=>row[1].startsWith('fabric:')),
    'All editable fabric SKU roll identifiers must be namespaced for physical export.');
  check(new Set(stressCsv.slice(1).map(row=>row[1])).size===30,
    'Upper-capacity CSV must keep all 30 separate fabric SKU roll identifiers.');
  await keyboard.setViewportSize({width:375,height:820});
  const stressOverflow=await keyboard.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  check(stressOverflow<=2,'2,000-cut large-project preview must not introduce mobile horizontal overflow.');
  await keyboard.screenshot({path:'artifacts/qa/keyboard-and-2000-cut-stress.png',fullPage:false,animations:'disabled'});

  // The other 2,000-cut extreme is one very dense fabric roll: the app
  // must keep all 2,000 export coordinates but expose that only 180 are
  // actually drawn. Verify in Chromium, not just isolated math tests.
  stressProject.fabrics=[{
   id:'single-dense',label:'Single dense prewashed roll',usableWidth:43,
   shrinkageLengthPct:5,oneWayPrint:true,
   pieces:[{widthIn:.05,heightIn:5,count:2000,label:'Dense cut',allowRotate:false}]
  }];
  await keyboard.locator('[data-file]').setInputFiles({
   name:'quilt-single-roll-2000-cuts.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(stressProject))
  });
  await keyboard.waitForFunction(()=>document.querySelector('details.sku-plan svg[data-cut-count="2000"]'),null,{timeout:30000});
  const denseSvg=keyboard.locator('details.sku-plan svg[data-cut-count="2000"]');
  check(await denseSvg.getAttribute('data-rendered-cut-count')==='180',
   'A single-SKU 2,000-piece plan must cap the SVG preview at 180 drawn cuts.');
  check((await denseSvg.getAttribute('aria-label')).includes('first 180 of 2000 cuts'),
   'Assistive technology must distinguish the 180 shown cut rectangles from the complete 2,000-cut plan.');
  check(await denseSvg.locator('rect[data-cut-index]').count()===180,
   'Dense single roll must render exactly 180 schematic rectangles.');
  check((await keyboard.locator('details.sku-plan .diagram-note').innerText()).includes('complete physical cut-list CSV includes every cut'),
   'Dense cut preview must direct users to the full CSV, not imply missing pieces.');
  const denseDownload=keyboard.waitForEvent('download');
  await keyboard.locator('[data-action="export-cut-csv"]').click();
  const denseCsv=csvRecords(await fs.readFile(await (await denseDownload).path(),'utf8'));
  check(denseCsv.length===2001 && denseCsv.slice(1).every(row=>row[1]==='fabric:single-dense'),
   'Single dense roll must still export all 2,000 actual cuts under the one correct roll ID.');
  await keyboardCtx.close();
  console.log('PASS 30-SKU 2,000-cut and one-dense-SKU 2,000-cut browser exports, truthful SVG limits and live editor labels; no hardware speed SLA.');

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

  // An existing browser autosave may be corrupt or from an unsupported
  // future schema. It must never be automatically replaced with the sample
  // by the first accepted edit, reset, import, or user navigation.
  const unreadableCtx=await browser.newContext({viewport:{width:1180,height:820},acceptDownloads:true});
  instrumentNetwork(unreadableCtx,'unreadable-autosave-recovery');
  const brokenPage=await unreadableCtx.newPage();
  brokenPage.on('pageerror',err=>problems.push('Unreadable autosave: '+err.message));
  await hydrated(brokenPage,'/quilt-backing-calculator/');
  const rawInvalid='{"schemaVersion":300,"fabrics":[{"id":"future-color"}],"recover":"do not lose this literal data"}';
  await brokenPage.evaluate(raw=>localStorage.setItem('quilt-studio-v2',raw),rawInvalid);
  await brokenPage.reload({waitUntil:'domcontentloaded'});
  await brokenPage.locator('[data-download-unreadable-backup]').waitFor({state:'visible'});
  check((await brokenPage.locator('[data-persist-state]').innerText()).includes('UNREADABLE AUTOSAVE PROTECTED'),
   'An unsupported autosave must show a highly visible data preservation warning.');
  check(!(await brokenPage.locator('[data-sync-warning]').isHidden()) &&
    !(await brokenPage.locator('[data-action="export-cut-csv"]').isEnabled()) &&
    !(await brokenPage.locator('[data-action="print"]').isEnabled()),
   'Unreadable startup autosave must block cutting and PDF outputs before any edit.');
  check(!(await brokenPage.locator('[data-replace-unreadable-backup]').isEnabled()),
   'Replacing original unreadable data must require first downloading its raw backup.');
  const brokenWidth=brokenPage.getByLabel('Finished quilt width (in)',{exact:true});
  await brokenWidth.fill('88');await brokenWidth.press('Tab');
  check((await brokenWidth.inputValue())==='88' &&
    (await brokenPage.evaluate(()=>localStorage.getItem('quilt-studio-v2')))===rawInvalid,
   'Editing the example must NEVER silently overwrite unreadable original saved data.');
  check(!(await brokenPage.locator('[data-action="export-cut-csv"]').isEnabled()) &&
    !(await brokenPage.locator('[data-action="print"]').isEnabled()),
   'Unsaved example edits cannot appear ready to cut while an original autosave is protected.');
  await brokenPage.locator('[data-action="reset"]').click();
  check((await brokenWidth.inputValue())==='88' &&
    (await brokenPage.evaluate(()=>localStorage.getItem('quilt-studio-v2')))===rawInvalid,
   'Normal Reset must not delete the unreadable original without explicit backed-up replacement.');
  const sampleBackup=brokenPage.waitForEvent('download');
  await brokenPage.locator('[data-action="save"]').click();
  const sampleBackupFile=await sampleBackup;
  check(JSON.parse(await fs.readFile(await sampleBackupFile.path(),'utf8')).quilt.finishedWidth===88,
   'Current example edits must remain separately downloadable as a valid project JSON backup.');
  const rawBackup=brokenPage.waitForEvent('download');
  await brokenPage.locator('[data-download-unreadable-backup]').click();
  const rawBackupFile=await rawBackup;
  check((await fs.readFile(await rawBackupFile.path(),'utf8'))===rawInvalid &&
    rawBackupFile.suggestedFilename()==='quilt-unreadable-original-autosave.txt',
   'Downloaded unreadable autosave must exactly preserve the original raw text, not stringify it.');
  check(await brokenPage.locator('[data-replace-unreadable-backup]').isEnabled(),
   'Downloading the raw original should enable explicit replacement of the unreadable autosave.');
  check((await brokenPage.evaluate(()=>localStorage.getItem('quilt-studio-v2')))===rawInvalid,
   'Downloading a raw backup must not mutate the existing stored text.');
  await brokenPage.locator('[data-replace-unreadable-backup]').click();
  check(await brokenPage.locator('[data-sync-warning]').isHidden() &&
    await brokenPage.locator('[data-action="export-cut-csv"]').isEnabled(),
   'Explicit replacement after raw backup should recover normally calculated cutting outputs.');
  check((await brokenPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth))===88,
   'Explicit replacement must save the accepted current project and not the invalid original.');
  await brokenPage.reload({waitUntil:'domcontentloaded'});
  await brokenPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'));
  check(await brokenPage.getByLabel('Finished quilt width (in)',{exact:true}).inputValue()==='88',
   'A recovered original project must survive a full page reload.');

  // Even with a raw backup in hand, a different tab's new stored version
  // should win over an attempted explicit reset of previously corrupt data.
  await brokenPage.evaluate(raw=>localStorage.setItem('quilt-studio-v2',raw),rawInvalid);
  await brokenPage.reload({waitUntil:'domcontentloaded'});
  await brokenPage.locator('[data-download-unreadable-backup]').waitFor({state:'visible'});
  const rawBackupAgain=brokenPage.waitForEvent('download');
  await brokenPage.locator('[data-download-unreadable-backup]').click();
  await rawBackupAgain;
  await brokenPage.evaluate(()=>{
   // Use a valid newer project captured as fixture in this same browser turn.
   localStorage.setItem('quilt-studio-v2',JSON.stringify({
    schemaVersion:2,units:'in',quilt:{finishedWidth:91,finishedHeight:80},
    options:{overage:4,usableWof:43,battingWof:96,joinTakeup:1,stripWidth:2.5,
     tailAllowance:12,stripJoinLoss:2.5,step:.125,lengthShrinkage:0,
     oneWayPrint:false,seam:.25,battingOverage:4,allowRotate:false},
    yardage:{pieceWidth:5,pieceHeight:10,count:20,alternateWof:50,allowRotate:false,oneWayPrint:false},
    sashing:{rows:4,columns:5,blockWidth:10,blockHeight:10,width:2},
    borders:[],fabrics:[]
   }));
  });
  await brokenPage.locator('[data-replace-unreadable-backup]').click();
  check((await brokenPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth))===91,
   'A changed saved project must not be destroyed by an outdated explicit corrupt-autosave replacement.');
  await unreadableCtx.close();
  console.log('PASS malformed or incompatible browser autosave raw backup, explicit replacement and raced version safety.');

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
  await hydrated(cross,'/calculators/',{incomplete:true});
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
  await hydrated(cross,'/calculators/',{incomplete:true});
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

  // Collision previously merged physically different roll rows when a user
  // called their top fabric 'backing', or a border 'batting'. Verify real
  // Project Planner and dedicated tools use stable distinct CSV/SVG roll IDs,
  // without changing the user's original SKU labels in Project V2 JSON.
  const idsCtx=await browser.newContext({viewport:{width:1220,height:900},acceptDownloads:true});
  instrumentNetwork(idsCtx,'physical-roll-id-namespaces');
  const idsPage=await idsCtx.newPage();
  idsPage.on('pageerror',err=>problems.push('Physical roll IDs: '+err.message));
  await hydrated(idsPage,'/quilt-fabric-calculator/');
  const makeSavedProject=idsPage.getByLabel('Fabric / color label',{exact:true}).first();
  await makeSavedProject.fill('Collision test fabric');
  await makeSavedProject.press('Tab');
  const idFixture=await idsPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  idFixture.fabrics[0].id='backing';
  idFixture.borders[0].sku='batting';
  idFixture.quilt.topCutsReviewed=false;
  delete idFixture.quilt.topCutsReviewFingerprint;
  await idsPage.locator('[data-file]').setInputFiles({
   name:'quilt-collision-valid-skus.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(idFixture))
  });
  await hydrated(idsPage,'/calculators/',{incomplete:true});
  await idsPage.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.').check();
  const namedRolls=await assertSvgCorrespondsToCutCsv(idsPage,'/calculators/ [user roll IDs collide with system names]');
  check(namedRolls.rolls===6,'A collision fixture should retain every one of the six physical rolls.');
  const collisionDownload=idsPage.waitForEvent('download');
  await idsPage.locator('[data-action="export-cut-csv"]').click();
  const collidingRows=csvRecords(await fs.readFile(await (await collisionDownload).path(),'utf8'));
  const exportIds=new Set(collidingRows.slice(1).map(row=>row[1]));
  for(const sku of ['backing','binding','batting','border:batting','fabric:backing','fabric:sand'])
   check(exportIds.has(sku),'Every system and user roll needs its distinct physical identity: '+sku);
  check(exportIds.size===6,
   'Six separate real material rolls must never collapse into one CSV SKU group.');
  await hydrated(idsPage,'/quilt-fabric-calculator/');
  check(await idsPage.locator('details.sku-plan svg[data-roll-sku="fabric:backing"]').count()===1,
   'Fabric calculator must use the same scoped physical roll ID as Project Planner.');
  await hydrated(idsPage,'/quilt-border-calculator/');
  check(await idsPage.locator('details.sku-plan svg[data-roll-sku="border:batting"]').count()===1,
   'Border calculator must use the same scoped physical roll ID as Project Planner.');
  const retainedIds=await idsPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')));
  check(retainedIds.fabrics[0].id==='backing'&&retainedIds.borders[0].sku==='batting',
   'Physical export namespaces must not rename or mutate user-defined Project V2 SKU fields.');
  await idsCtx.close();
  console.log('PASS physical roll ID collisions across top fabric/backing and border/batting, CSV/SVG and shared project.');

  const mobile=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  instrumentNetwork(mobile,'mobile');
  const small=await mobile.newPage();
  small.on('pageerror',err=>problems.push('Mobile JS exception: '+err.message));
  for(const path of ['/','/calculators/','/quilt-backing-calculator/','/quilt-fabric-calculator/','/fabric-yards-to-inches/']){
    await hydrated(small,path,{incomplete:path==='/'||path==='/calculators/'});
    if(path==='/quilt-backing-calculator/'||path==='/quilt-fabric-calculator/')
      await auditWcag(small,path+' [mobile 375px]');
    const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    check(overflow<=2,'Mobile horizontal overflow '+overflow+'px: '+path);
    if(path==='/quilt-backing-calculator/')await small.screenshot({path:'artifacts/qa/backing-mobile.png',fullPage:true,animations:'disabled'});
    if(path==='/fabric-yards-to-inches/')await small.screenshot({path:'artifacts/qa/yards-conversion-guide-mobile.png',fullPage:true,animations:'disabled'});
    console.log('PASS narrow phone viewport '+path);
  }
  await small.goto(ROOT+'/lab/square-in-square/',{waitUntil:'domcontentloaded'});
  await small.waitForFunction(()=>document.querySelector('[data-square-status]')?.textContent?.includes('Calculated preview'));
  await auditWcag(small,'/lab/square-in-square/ [mobile 375px]');
  check(await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)<=2,
    'Square lab mobile width must not overflow the phone viewport.');
  console.log('PASS mobile Square laboratory viewport and a11y scan.');
  for(const width of [360,390,768,1024,1440]){
    await small.setViewportSize({width,height:812});
    for(const path of ['/','/quilt-backing-calculator/','/quilt-fabric-calculator/','/fabric-yards-to-inches/']){
      await hydrated(small,path,{incomplete:path==='/'||path==='/calculators/'});
      const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      check(overflow<=2,'Horizontal overflow '+overflow+'px at '+width+'px: '+path);
      if(path==='/quilt-backing-calculator/')await small.screenshot({path:'artifacts/qa/backing-'+width+'px.png',fullPage:true,animations:'disabled'});
    }
    console.log('PASS responsive layouts at '+width+'px');
  }
  // A 320 CSS-pixel viewport is the WCAG 1.4.10 reflow proxy for
  // a 1280 CSS-pixel browser viewport at 400% text/browser zoom.
  // It is NOT a substitute for manual real-zoom and screen-reader testing.
  await small.setViewportSize({width:320,height:720});
  for(const path of ['/','/calculators/','/quilt-backing-calculator/',
    '/quilt-fabric-calculator/','/fabric-yards-to-inches/']){
    await hydrated(small,path,{incomplete:path==='/'||path==='/calculators/'});
    const overflow=await small.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    check(overflow<=2,'WCAG 1.4.10 reflow overflow at 320 CSS px: '+path+' ('+overflow+'px)');
    check(await small.locator('[data-action="recalculate"]').isVisible(),
      'Primary calculator action must be visible at 320 CSS px: '+path);
  }
  await small.screenshot({path:'artifacts/qa/320px-reflow-proxy.png',fullPage:true,animations:'disabled'});
  console.log('PASS narrow 320 CSS-pixel reflow proxy across 5 routes.');
  await small.setViewportSize({width:375,height:812});
  await hydrated(small,'/quilt-backing-calculator/');
  await small.getByRole('button',{name:'Update cutting plan'}).click();
  check(await small.locator('#results').evaluate(el=>el===document.activeElement),
    'On narrow mobile, successful manual recalculation should focus the results landmark.');
  await hydrated(small,'/',{incomplete:true});
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
  await auditWcag(darkPage,'/quilt-backing-calculator/ [dark mode]');
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
  await fs.writeFile('artifacts/qa/axe-wcag2a-aa-audit.json',JSON.stringify(wcagReport,null,2));
  const axeFailures=wcagReport.filter(x=>x.violations.length);
  assert.equal(axeFailures.length,0,'Automated WCAG 2/2.1/2.2 A/AA violations: '+
    JSON.stringify(axeFailures.map(x=>({path:x.path,ids:x.violations.map(y=>y.id)}))));
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
