import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const BASE=(process.env.QUILT_PREVIEW_URL||'https://quilt-calculator-566.pages.dev').replace(/\/+$/,'');
const sha=(process.env.GITHUB_SHA||'').toLowerCase();
if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Expected a full GITHUB_SHA for independently verifiable public Pages testing.');
const assertThat=(v,message)=>assert.ok(v,message);
const hasNoindexToken=(header)=>typeof header==='string'&&
 header.toLowerCase().split(/[\s,;]+/).includes('noindex');
// Regression for an old escaped-regex bug: /\\\\bnoindex\\\\b/ silently looked for
// literal backslashes rather than recognizing the real X-Robots-Tag token.
for(const [header,expected] of [
 ['noindex, follow',true],['NoInDeX',true],
 ['nofollow, NOINDEX',true],['noindex\tfollow',true],['follow',false],['noindexing',false],
 ['prefixnoindex',false],[null,false],['',false]
]){
 assert.equal(hasNoindexToken(header),expected,'X-Robots-Tag token parser regression');
}

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const routes=[
 '/', '/calculators/', '/quilt-backing-calculator/', '/quilt-binding-calculator/',
 '/quilt-border-calculator/', '/fabric-yardage-calculator/', '/quilt-fabric-calculator/',
 '/fabric-yards-to-inches/', '/quilt-batting-calculator/', '/quilt-sashing-calculator/'
];
const stamp=html=>html.match(/<meta\b[^>]*name="quilt-build-commit"[^>]*content="([0-9a-f]{40})"/i)?.[1]?.toLowerCase();
async function get(path){
 const response=await fetch(BASE+path,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
 return {response,html:await response.text()};
}
// Pages can serve mixed deployment generations from different edge caches
// briefly after the planner route becomes current. Every URL must still reach
// the EXACT expected source stamp within a bounded retry window; never pass
// tests simply because one URL has the new stamp.
async function currentRoute(path){
 let last='unavailable';
 for(let attempt=0;attempt<12;attempt++){
  try{
   const got=await get(path);
   last='HTTP '+got.response.status+'; SHA '+(stamp(got.html)||'absent');
   if(got.response.status===200&&stamp(got.html)===sha)return got;
  }catch(e){last=e instanceof Error?e.message:String(e);}
  if(attempt<11)await sleep(3000);
 }
 throw Error('Stale or missing publicly deployed page '+path+' after 12 checks: '+last+'; expected '+sha);
}
async function waitForThisCommit(){
 let last='not checked';
 // A Pages push and a GitHub workflow are independent. Never claim the old
 // public deployment is this commit just because the current repo built.
 for(let attempt=1;attempt<=30;attempt++){
  try{
   const {response,html}=await get('/calculators/');
   last='HTTP '+response.status+'; public SHA '+(stamp(html)||'missing');
   if(response.status===200&&stamp(html)===sha){
    console.log('PASS public Cloudflare deployment at exact git commit '+sha);
    return;
   }
  }catch(e){last=e instanceof Error?e.message:String(e);}
  console.log('WAIT Pages commit sync '+attempt+'/30: '+last);
  if(attempt<30)await sleep(10000);
 }
 throw Error('Cloudflare Pages did not publish the exact tested commit '+sha+'. Last evidence: '+last);
}
async function downloadText(page,selector){
 const pending=page.waitForEvent('download',{timeout:20000});
 await page.locator(selector).click();
 const file=await pending;
 return {name:file.suggestedFilename(),content:await fs.readFile(await file.path(),'utf8')};
}
let browser;
try{
 await waitForThisCommit();
 for(const path of routes){
  const {response,html}=await currentRoute(path);
  assertThat(hasNoindexToken(response.headers.get('x-robots-tag')),
    'Cloudflare preview must apply an X-Robots-Tag noindex header even if future public HTML is indexable: '+path);
  assertThat(html.includes('name="robots" content="noindex,follow"'),'Live preview must be noindex: '+path);
  assertThat(!/<link\b[^>]*rel="canonical"/i.test(html),'Preview cannot publish a canonical '+path);
  assertThat(/<h1[\s>]/.test(html),'No unique H1 on public page: '+path);
 }
 console.log('PASS all ten deployed HTML routes, exact build SHA, noindex, no premature canonicals.');
 const {response:robots,html:robotsText}=await get('/robots.txt');
 assert.equal(robots.status,200);
 assertThat(robotsText.includes('User-agent:')&&robotsText.includes('Allow: /'),'Preview robots file not readable.');
 const {response:sitemap}=await get('/sitemap.xml');
 assert.equal(sitemap.status,404,'No production sitemap should be emitted on preview.');
 const {response:qa,html:qaHtml}=await currentRoute('/qa/print-calibration/');
 assert.equal(qa.status,200,'Public preview must serve its physical print-calibration worksheet.');
 assert.equal(stamp(qaHtml),sha,'Public physical QA worksheet must identify the exact Cloudflare commit.');
 assertThat(qaHtml.includes('noindex,follow')&&!qaHtml.includes('rel="canonical"')&&!qaHtml.includes('application/ld+json'),
  'Public manual worksheet must remain unindexed and cannot claim an approved SEO route.');
 assertThat(qaHtml.includes('data-qa-inch-square')&&qaHtml.includes('data-qa-mm-line')&&
    qaHtml.includes('data-qa-six-inch')&&qaHtml.includes('MANUAL_NOT_RUN'),
  'Public physical worksheet must declare all three references and pending human verification.');
 const {response:lab,html:labHtml}=await get('/lab/square-in-square/');
 assert.equal(lab.status,200);
 assertThat(labHtml.includes('noindex,follow')&&!labHtml.includes('rel="canonical"'),'Lab must remain noindex with no canonical.');
 // This is the PUBLIC commit, not a local fixture. Prevent stale lab
 // routes, premature indexing and any implication of real-fabric validation.
 const researchHeaderProblems=[];
 for(const [path,marker] of [
  ['/lab/continuous-bias-tube/','data-tube-topology-lab'],
  ['/lab/continuous-bias-planner/','data-bias-plan'],
  ['/lab/continuous-bias-physical/','data-bias-physical']
 ]){
  const {response,html}=await currentRoute(path);
  assertThat(response.status===200&&stamp(html)===sha,
   'Unverified research lab does not match exactly deployed main commit: '+path);
  assertThat(html.includes('name="robots" content="noindex,follow"') &&
    !/<link\\b[^>]*rel="canonical"/i.test(html) &&
    !html.includes('application/ld+json') &&
    html.includes(marker),
    'Unverified continuous-bias research must remain noindexed with correct real DOM: '+path);
  const xRobots=response.headers.get('x-robots-tag');
  const hasHeaderNoindex=hasNoindexToken(xRobots);
  if(!hasHeaderNoindex){
   researchHeaderProblems.push({
    path,requestedUrl:BASE+path,finalUrl:response.url,
    redirected:response.redirected,httpStatus:response.status,
    xRobotsTag:xRobots,contentType:response.headers.get('content-type'),
    server:response.headers.get('server'),cfRay:response.headers.get('cf-ray'),
    headerNames:[...response.headers.keys()].sort()
   });
  }

 }
 assertThat(researchHeaderProblems.length===0,
  'Public experimental lab HTTP noindex mismatch: '+JSON.stringify(researchHeaderProblems));
 const {html:physicalStatic}=await currentRoute('/lab/continuous-bias-physical/');
 assertThat(physicalStatic.includes('NO SAMPLE HAS BEEN PHYSICALLY TESTED') &&
  physicalStatic.includes('NOT_RUN') &&
  physicalStatic.includes('data-bias-physical-export'),
  'Public physical lab must show unmeasured real fabric, not fabricated evidence.');
 console.log('PASS three real Cloudflare bias research routes, exact main SHA, noindex and blank physical record.');
 const {response:aboutResponse,html:aboutHtml}=await currentRoute('/about/');
 assert.equal(aboutResponse.status,200,'Live About and source-method page must be accessible.');
 assert.equal(stamp(aboutHtml),sha,'Live About page must match exactly deployed code.');
 assertThat(aboutHtml.includes('name="robots" content="noindex,follow"')&&!aboutHtml.includes('rel="canonical"')&&
    !aboutHtml.includes('application/ld+json')&&
    aboutHtml.includes('https://github.com/garrison2025/Quilt_Calculator/issues'),
  'Public source and contact policy must be transparent and not a premature SEO route.');
 const {html:homeHtml}=await get('/');
 for(const id of ['hub','backing','binding','borders','yardage','fabric','inches','batting','sashing'])
  assertThat(homeHtml.includes('data-task="'+id+'"'),'Missing public task-first calculator navigation '+id);
 for(const path of routes){
  const {html}=await get(path);
  const scripts=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(m=>JSON.parse(m[1]));
  const app=scripts.find(x=>x['@type']==='WebApplication');
  assertThat(app?.offers?.price===0&&app?.isAccessibleForFree===true&&
    app?.inLanguage==='en-US'&&!app?.aggregateRating&&!app?.review,
   'Public software markup should advertise free service truthfully, with no fake reviews: '+path);
 }
 console.log('PASS robots, suppressed sitemap, task directory, honest About page and truthful free-app schema.');

 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:850},acceptDownloads:true});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Exercise the real deployed JavaScript on the nonindexed physical
 // specimen worksheet. The same synthetic 320in below MUST be rejected
 // against the 328.426in numerical reference; no actual cloth was sewn.
 const physical=await context.newPage();
 physical.on('pageerror',e=>errors.push('Physical lab: '+e.message));
 const physicalResponse=await physical.goto(BASE+'/lab/continuous-bias-physical/',
  {waitUntil:'domcontentloaded',timeout:25000});
 assert.equal(physicalResponse.status(),200);
 await physical.waitForFunction(()=>
  document.querySelector('[data-bias-physical-status]')?.textContent?.includes('NOT_RUN'),
  null,{timeout:30000});
 const initial=await physical.locator('[data-bias-sample-status]').allTextContents();
 assertThat(initial.length===3&&initial.every(x=>x==='NOT_RUN'),
  'PUBLIC physical worksheet cannot invent any real A/B/C sample data.');
 for(const [key,value] of [
  ['measuredSquareWidthIn','30'],['finishedCenterLengthIn','320'],
  ['finishedLeftLengthIn','321'],['finishedRightLengthIn','322']
 ]){
  await physical.locator('[data-bias-obs="'+key+'"]').fill(value);
 }
 await physical.locator('[data-bias-physical-form] button[type="submit"]').click();
 assertThat((await physical.locator('[data-bias-physical-status]').innerText())
   .includes('OBSERVATION_HOLD') &&
  (await physical.locator('[data-bias-physical-output]').innerText())
   .includes('CRITICAL: model predicts more'),
  'Deployed JS must flag an overstated fabric yield as HOLD, not output yards.');
 const exported=await downloadText(physical,'[data-bias-physical-export]');
 const report=JSON.parse(exported.content);
 assertThat(report.safeToPurchase===false&&report.physicallyCertified===false&&
  report.rawDrafts.A.finishedCenterLengthIn==='320'&&
  report.auditsForReferenceOnly[0].auditStatus==='OBSERVATION_HOLD'&&
  !('purchaseYards' in report),
  'Public exported physical sample must never impersonate certified yield.');
 await physical.close();
 console.log('PASS LIVE Cloudflare real-sample blank state, modeled-overestimate HOLD and unverified JSON export.');
 const response=await page.goto(BASE+'/calculators/',{waitUntil:'domcontentloaded',timeout:25000});
 assert.equal(response.status(),200);
 await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Incomplete material plan'),null,{timeout:30000});
 const review=page.getByLabel('I reviewed every quilt-top color, cut size and piece quantity.',{exact:true});
 assertThat(await review.count()===1,'Latest public JS is missing the quilt-top review confirmation.');
 assertThat(!(await review.isChecked()),'Default sample cannot be pre-reviewed.');
 assertThat(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'Unreviewed sample offered full cut CSV.');
 assertThat(!(await page.locator('[data-action="print"]').isEnabled()),'Unreviewed sample offered complete print.');
 const before=await downloadText(page,'[data-action="export-shopping"]');
 assertThat(before.name.includes('INCOMPLETE')&&before.content.includes('TOP_CUT_LIST_NOT_REVIEWED'),
  'Public partial shopping CSV fails review-safety gate.');
 console.log('PASS public JS hydration, unchecked sample, blocked print/cut export and incomplete shopping CSV.');

 await review.check();
 await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 assertThat(await page.locator('[data-action="export-cut-csv"]').isEnabled(),'Review did not enable public cutting CSV.');
 assertThat(await page.locator('[data-action="print"]').isEnabled(),'Review did not enable public cut print.');
 const fullCsv=await downloadText(page,'[data-action="export-cut-csv"]');
 assertThat(fullCsv.content.includes('"fabric:sky-blue"')&&fullCsv.content.includes('"fabric:sand"') &&
  fullCsv.content.includes('"batting"'),'Public verified CSV excludes actual sample material rolls.');
 assert.equal(fullCsv.content.split('\r\n').filter(Boolean).length,36,
  'Physical public cut CSV should have 35 sample cuts + header.');
 const backup=await downloadText(page,'[data-action="save"]');
 const saved=JSON.parse(backup.content);
 assert.equal(saved.quilt.topCutsReviewed,true);
 assertThat(/^[a-f0-9]{8}$/.test(saved.quilt.topCutsReviewFingerprint||''),
  'Public source-bound manual review fingerprint was not persisted to V2 JSON.');
 console.log('PASS public review approval, 35 real cuts, print gate and saved V2 fingerprint.');

 const width=page.getByLabel('Quilt width (in)',{exact:true});
 await width.fill('61');await width.press('Tab');
 assertThat(!(await review.isChecked()),'Public review checkbox not revoked after size change.');
 assertThat(!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),'Stale top review incorrectly allows full cut export.');
 await page.emulateMedia({media:'print'});
 assert.equal(await page.locator('[data-results]').evaluate(el=>getComputedStyle(el).display),'none',
  'Browser Ctrl+P must hide unreviewed full project quantities.');
 await page.emulateMedia({media:'screen'});
 console.log('PASS public review revoked on geometry edit and browser print suppressed.');

 const changed=structuredClone(saved);
 changed.fabrics[0].pieces[0].count+=1;
 await page.locator('[data-file]').setInputFiles({name:'stale-reviewed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(changed))});
 await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Incomplete material plan'),null,{timeout:15000});
 assertThat(!(await review.isChecked())&&!(await page.locator('[data-action="export-cut-csv"]').isEnabled()),
  'Public import accepted changed top cuts with a stale review fingerprint.');
 await page.locator('[data-file]').setInputFiles({name:'original-reviewed.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
 await page.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 assertThat(await review.isChecked()&&await page.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Exact matching V2 review fingerprint failed to restore public cut-plan status.');
 assert.equal(errors.length,0,'Public browser JS exceptions: '+errors.join('; '));
 console.log('PASS public import rejects stale reviewed JSON and accepts exact matching reviewed backup.');

 // Real public Cloudflare cross-tab ownership: stale materials cannot be
 // downloaded as a complete purchase/cut plan after a newer shared save.
 const conflictContext=await browser.newContext({viewport:{width:1150,height:820},acceptDownloads:true});
 const oldBacking=await conflictContext.newPage(),newBacking=await conflictContext.newPage();
 const conflicts=[];
 oldBacking.on('pageerror',e=>conflicts.push(e.message));
 newBacking.on('pageerror',e=>conflicts.push(e.message));
 for(const p of [oldBacking,newBacking]){
  await p.goto(BASE+'/quilt-backing-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
  await p.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:20000});
 }
 assertThat(await oldBacking.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Live backing cut CSV must initially be enabled before conflict.');
 const liveWidth=newBacking.getByLabel('Quilt width (in)',{exact:true});
 await liveWidth.fill('75');await liveWidth.press('Tab');
 await oldBacking.locator('[data-sync-warning]').waitFor({state:'visible',timeout:15000});
 assertThat(!(await oldBacking.locator('[data-action="export-cut-csv"]').isEnabled()) &&
            !(await oldBacking.locator('[data-action="export-cut"]').isEnabled()) &&
            !(await oldBacking.locator('[data-action="print"]').isEnabled()),
  'Live outdated tab must disable all cutting and print exports.');
 assert.equal(await oldBacking.locator('[data-tool]').getAttribute('data-print-ready'),'false');
 await oldBacking.emulateMedia({media:'print'});
 assert.equal(await oldBacking.locator('[data-results]').evaluate(el=>getComputedStyle(el).display),'none',
  'Public browser Ctrl+P must conceal out-of-sync cutting dimensions.');
 await oldBacking.emulateMedia({media:'screen'});
 const retained=await downloadText(oldBacking,'[data-action="save"]');
 assert.equal(JSON.parse(retained.content).quilt.finishedWidth,60,
  'A conflicting old tab should still allow downloading its in-memory JSON backup.');
 await oldBacking.locator('[data-action="load-latest"]').click();
 assert.equal(await oldBacking.getByLabel('Quilt width (in)',{exact:true}).inputValue(),'75');
 assertThat(await oldBacking.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Loading the latest public project must restore correct cutting export.');
 await conflictContext.close();

 const shoppingContext=await browser.newContext({viewport:{width:1150,height:820}});
 const oldShopping=await shoppingContext.newPage(),newShopping=await shoppingContext.newPage();
 await oldShopping.goto(BASE+'/calculators/',{waitUntil:'domcontentloaded',timeout:20000});
 await oldShopping.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Incomplete material plan'),null,{timeout:20000});
 await newShopping.goto(BASE+'/quilt-backing-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
 await newShopping.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:20000});
 const shopButton=oldShopping.locator('[data-results] [data-action="export-shopping"]');
 assertThat(await shopButton.isEnabled(),'Live combined shopping list should be downloadable before a conflict.');
 const newWidth=newShopping.getByLabel('Quilt width (in)',{exact:true});
 await newWidth.fill('79');await newWidth.press('Tab');
 await oldShopping.locator('[data-sync-warning]').waitFor({state:'visible',timeout:15000});
 assertThat(!(await shopButton.isEnabled())&&await oldShopping.locator('[data-action="save"]').isEnabled(),
  'Live cross-tab conflict must block stale shopping but allow a project backup.');
 await oldShopping.locator('[data-action="load-latest"]').click();
 assertThat(await oldShopping.locator('[data-results] [data-action="export-shopping"]').isEnabled(),
  'Latest public shopping plan should become exportable after loading.');
 await shoppingContext.close();
 assert.equal(conflicts.length,0,'Public conflicting browser JS errors: '+conflicts.join('; '));
 console.log('PASS public Cloudflare two-tab stale-cut/shopping/print lock, safe project backup and latest reload.');

 // A BFCache-restored tab can miss its StorageEvent. Prove the *deployed*
 // app catches a changed shared project as soon as pageshow fires, even
 // before the user attempts a new cutting export.
 const resumedContext=await browser.newContext({viewport:{width:1100,height:800}});
 const restoredTab=await resumedContext.newPage();
 const restoreErrors=[];
 restoredTab.on('pageerror',e=>restoreErrors.push(e.message));
 await restoredTab.goto(BASE+'/quilt-backing-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
 await restoredTab.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:20000});
 const restoreWidth=restoredTab.getByLabel('Quilt width (in)',{exact:true});
 await restoreWidth.fill('83');await restoreWidth.press('Tab');
 await restoredTab.evaluate(()=>{
  const latest=JSON.parse(localStorage.getItem('quilt-studio-v2'));
  latest.quilt.finishedWidth=84;
  // Same-document localStorage changes never deliver a StorageEvent.
  localStorage.setItem('quilt-studio-v2',JSON.stringify(latest));
 });
 assertThat(await restoredTab.locator('[data-sync-warning]').isHidden() &&
     await restoredTab.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Live missing-event fixture must start with visually ready older project.');
 await restoredTab.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 assertThat(!(await restoredTab.locator('[data-sync-warning]').isHidden()) &&
     !(await restoredTab.locator('[data-action="export-cut-csv"]').isEnabled()) &&
     !(await restoredTab.locator('[data-action="print"]').isEnabled()) &&
     await restoredTab.locator('[data-action="save"]').isEnabled(),
  'Live restored page must proactively prevent stale exports and retain JSON backup.');
 assert.equal(await restoredTab.locator('[data-tool]').getAttribute('data-print-ready'),'false');
 await restoredTab.locator('[data-action="load-latest"]').click();
 assert.equal(await restoreWidth.inputValue(),'84');
 assertThat(await restoredTab.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Live load-latest must restore current cut exports after a resumed-page conflict.');
 assert.equal(restoreErrors.length,0,'Public resumed-page JS errors: '+restoreErrors.join('; '));
 await resumedContext.close();
 console.log('PASS public Cloudflare pageshow catches missing storage events before cut export and restores latest project.');

 // On the actual deployed Cloudflare bundle, an unreadable browser autosave
 // must be protected against a normal edit. Download the exact raw string
 // before the user is allowed to explicitly replace it with a valid project.
 const corruptContext=await browser.newContext({viewport:{width:1150,height:820},acceptDownloads:true});
 const corruptPage=await corruptContext.newPage();
 const corruptErrors=[];
 corruptPage.on('pageerror',e=>corruptErrors.push(e.message));
 await corruptPage.goto(BASE+'/quilt-backing-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
 await corruptPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 const originalRaw='{"schemaVersion":400,"recover":"future project data must be preserved verbatim"}';
 await corruptPage.evaluate(raw=>localStorage.setItem('quilt-studio-v2',raw),originalRaw);
 await corruptPage.reload({waitUntil:'domcontentloaded'});
 await corruptPage.locator('[data-download-unreadable-backup]').waitFor({state:'visible',timeout:15000});
 assertThat((await corruptPage.locator('[data-persist-state]').innerText()).includes('UNREADABLE AUTOSAVE PROTECTED') &&
   !(await corruptPage.locator('[data-action="export-cut-csv"]').isEnabled()) &&
   !(await corruptPage.locator('[data-action="print"]').isEnabled()),
  'Live unreadable autosave must be protected before edits or print.');
 const corruptWidth=corruptPage.getByLabel('Quilt width (in)',{exact:true});
 await corruptWidth.fill('86');await corruptWidth.press('Tab');
 assert.equal(await corruptPage.evaluate(()=>localStorage.getItem('quilt-studio-v2')),originalRaw,
  'Live first edit must not erase incompatible saved project data.');
 assertThat(!(await corruptPage.locator('[data-replace-unreadable-backup]').isEnabled()),
  'Live explicit replacement must require a prior raw text download.');
 const originalBackup=await downloadText(corruptPage,'[data-download-unreadable-backup]');
 assert.equal(originalBackup.content,originalRaw,'Live raw download must preserve the exact unreadable text.');
 assert.equal(originalBackup.name,'quilt-unreadable-original-autosave.txt');
 assertThat(await corruptPage.locator('[data-replace-unreadable-backup]').isEnabled(),
  'Raw download must enable the explicit replacement action.');
 await corruptPage.locator('[data-replace-unreadable-backup]').click();
 assertThat(await corruptPage.locator('[data-sync-warning]').isHidden() &&
   await corruptPage.locator('[data-action="export-cut-csv"]').isEnabled(),
  'Live backed-up explicit replacement must restore safe cutting exports.');
 assert.equal(await corruptPage.evaluate(()=>JSON.parse(localStorage.getItem('quilt-studio-v2')).quilt.finishedWidth),86);
 await corruptPage.reload({waitUntil:'domcontentloaded'});
 await corruptPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 assert.equal(await corruptPage.getByLabel('Quilt width (in)',{exact:true}).inputValue(),'86');
 assert.equal(corruptErrors.length,0,'Public unreadable-autosave JS errors: '+corruptErrors.join('; '));
 await corruptContext.close();
 console.log('PASS public Cloudflare unreadable autosave protects raw data, blocks accidental replacement and restores on explicit backup recovery.');

 // Verify that the live Cloudflare bundle (not only the local CI preview)
 // preserves keyboard focus after replacing dynamic material controls.
 const focusContext=await browser.newContext({viewport:{width:1100,height:820}});
 const focusPage=await focusContext.newPage();
 const focusErrors=[];
 focusPage.on('pageerror',e=>focusErrors.push(e.message));
 await focusPage.goto(BASE+'/quilt-fabric-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
 await focusPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 const liveAddCut=focusPage.locator('[data-fabric-index="0"] [data-add-cut]');
 await liveAddCut.focus();await liveAddCut.press('Enter');
 assertThat(await focusPage.locator('[data-fabric-index="0"] [data-cut-index="1"] .field-control').first()
  .evaluate(el=>document.activeElement===el),
  'Live add-cut keyboard action lost focus instead of opening the new piece-label field.');
 await focusPage.locator('[data-fabric-index="0"] [data-cut-index="1"] [data-remove-cut]').press('Enter');
 assertThat(await focusPage.locator('[data-fabric-index="0"] [data-cut-index="0"] [data-remove-cut]')
  .evaluate(el=>document.activeElement===el),
  'Live delete-cut keyboard action lost focus instead of selecting a surviving cut.');
 await focusPage.locator('[data-add-sku]').press('Enter');
 assertThat(await focusPage.locator('[data-fabric-index="2"] .field-control').first()
  .evaluate(el=>document.activeElement===el),
  'Live new SKU keyboard action lost focus instead of selecting its editable SKU field.');
 await focusPage.goto(BASE+'/quilt-border-calculator/',{waitUntil:'domcontentloaded',timeout:20000});
 await focusPage.waitForFunction(()=>document.querySelector('[data-status]')?.textContent?.includes('Updated from the current project'),null,{timeout:15000});
 await focusPage.locator('[data-add-border]').press('Enter');
 assertThat(await focusPage.locator('[data-border-index="1"] .field-control').first()
  .evaluate(el=>document.activeElement===el),
  'Live new border layer keyboard action did not focus its first editable field.');
 assert.equal(focusErrors.length,0,'Dynamic live keyboard interaction threw: '+focusErrors.join('; '));
 await focusContext.close();
 console.log('PASS public Cloudflare dynamic material keyboard focus after Enter add/remove cut, SKU and border actions.');
 await page.goto(BASE+'/qa/print-calibration/',{waitUntil:'domcontentloaded',timeout:20000});
 await page.emulateMedia({media:'print'});
 const measuredCss=await page.evaluate(()=>{
  const a=document.querySelector('[data-qa-inch-square]').getBoundingClientRect();
  const b=document.querySelector('[data-qa-mm-line]').getBoundingClientRect();
  const c=document.querySelector('[data-qa-six-inch]').getBoundingClientRect();
  return {squareX:a.width,squareY:a.height,mm:b.width,six:c.width};
 });
 assertThat(Math.abs(measuredCss.squareX-96)<.25&&Math.abs(measuredCss.squareY-96)<.25,
  'Public physical print worksheet has incorrect 1-inch CSS square.');
 assertThat(Math.abs(measuredCss.mm-100/25.4*96)<.35&&Math.abs(measuredCss.six-576)<.25,
  'Public physical print worksheet 100mm or six-inch CSS reference has incorrect dimensions.');
 await page.emulateMedia({media:'screen'});
 console.log('PASS public noindex physical-scale QA sheet and nominal CSS reference lengths; real ruler MANUAL_NOT_RUN.');
 console.log('LIVE DEPLOYMENT SMOKE PASS — '+sha+' · '+BASE+' · 10 routes · SEO gates · actual Chromium interactions.');
}finally{if(browser)await browser.close();}
