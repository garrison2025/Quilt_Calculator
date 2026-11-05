import fs from 'node:fs';
const slugs=['','calculators','quilt-backing-calculator','quilt-binding-calculator','quilt-border-calculator','fabric-yardage-calculator','quilt-fabric-calculator','fabric-yards-to-inches','quilt-batting-calculator','quilt-sashing-calculator'];
const site=process.env.PUBLIC_SITE_URL||'';
const githubSha=process.env.GITHUB_SHA?.toLowerCase();
if(githubSha && !/^[0-9a-f]{40}$/.test(githubSha))throw Error('Invalid GITHUB_SHA used for provenance verification.');
const production=process.env.PUBLIC_INDEXABLE==='1'&&/^https:\/\/[a-z0-9.-]+$/i.test(site)&&!/\.pages\.dev$|localhost$|127\.0\.0\.1$/.test(site.toLowerCase());
for(const slug of slugs){
 const file='dist/'+(slug?slug+'/':'')+'index.html';
 if(!fs.existsSync(file))throw Error('Missing route '+file);
 const html=fs.readFileSync(file,'utf8');
 for(const pattern of ['<h1','name="description"',production?'index,follow':'noindex,follow','.webp','application/ld+json']){
  if(!html.includes(pattern))throw Error('Missing '+pattern+' on '+file);
 }
 if(production && !html.includes('rel="canonical"'))throw Error('Missing canonical: '+file);
 if(githubSha && !html.includes('name="quilt-build-commit" content="'+githubSha+'"'))
  throw Error('Static build does not identify its exact source commit: '+file);
}
// Social images are verifiable first-party assets; preview canonical stays absent.
const imageIds=['hub','hub','backing','binding','borders','yardage','fabric','inches','batting','sashing'];
const socialOrigin=production?site:'https://quilt-calculator-566.pages.dev';
for(let i=0;i<slugs.length;i++){
 const slug=slugs[i],id=imageIds[i],html=fs.readFileSync('dist/'+(slug?slug+'/':'')+'index.html','utf8');
 const img=socialOrigin+'/images/'+id+'.webp';
 if(!html.includes('property="og:image" content="'+img+'"')||
    !html.includes('name="twitter:image" content="'+img+'"')||
    !html.includes('property="og:image:alt"'))
  throw Error('Tool needs working first-party OG/Twitter image and alt: '+slug);
 if(!fs.existsSync('dist/images/'+id+'.webp'))throw Error('Missing social preview image: '+id);
 if(!production&&html.includes('rel="canonical"'))throw Error('Preview canonical must remain absent: '+slug);
}
for(const slug of ['diagonal-quilt-backing-calculator','rag-quilt-calculator','quilt-block-calculator','square-in-a-square-calculator','fabric-width-yardage-converter']){
 if(fs.existsSync('dist/'+slug+'/index.html'))throw Error('HOLD route published: '+slug);
}
// Deliberately non-indexed experimental lab: never part of original approved SEO routes.
const squareLabHtml=fs.readFileSync('dist/lab/square-in-square/index.html','utf8');
if(!squareLabHtml.includes('noindex,follow')||squareLabHtml.includes('rel="canonical"')||
   squareLabHtml.includes('application/ld+json')||!squareLabHtml.includes('Unverified construction method.')||
   !squareLabHtml.includes('Square-in-a-Square Cutting Lab'))
 throw Error('Square trial must remain unindexed and clearly provisional.');
if(fs.existsSync('dist/square-in-a-square-calculator/index.html'))throw Error('Premature public SQUARE keyword route.');
if(!fs.existsSync('dist/privacy/index.html'))throw Error('Missing privacy page');
const qaPath='dist/qa/print-calibration/index.html';
if(!fs.existsSync(qaPath))throw Error('Missing manual physical print-calibration worksheet.');
const qaHtml=fs.readFileSync(qaPath,'utf8');
if(!qaHtml.includes('noindex,follow')||qaHtml.includes('rel="canonical"')||
   qaHtml.includes('application/ld+json')||!qaHtml.includes('data-qa-inch-square')||
   !qaHtml.includes('data-qa-mm-line')||!qaHtml.includes('data-qa-six-inch')||
   !qaHtml.includes('MANUAL_NOT_RUN')||!qaHtml.includes('100% / Actual size'))
 throw Error('Print calibration worksheet must remain noindex, physically dimensioned and unsigned.');
const privacy=fs.readFileSync('dist/privacy/index.html','utf8');
if(production && !privacy.includes('href="'+site+'/privacy/"'))throw Error('Privacy canonical must not point to undefined.');
if(!fs.existsSync('dist/404.html'))throw Error('Missing Cloudflare Pages 404.html: unknown URLs would silently fall back to homepage.');
const page404=fs.readFileSync('dist/404.html','utf8');
if(!page404.includes('noindex,follow')||page404.includes('rel="canonical"'))throw Error('404 route must be noindex with no canonical.');
if(production){
 const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
 if((sitemap.match(/<url>/g)||[]).length!==slugs.length)throw Error('Production sitemap does not match approved routes.');
 if(sitemap.includes('square-in-square')||sitemap.includes('square-in-a-square'))throw Error('Square trial must not appear in sitemap.');
 for(const slug of slugs)if(!sitemap.includes(site+'/'+(slug?slug+'/':'')))throw Error('Missing sitemap URL '+slug);
}else if(fs.existsSync('dist/sitemap.xml'))throw Error('Preview build must not emit sitemap.');

/** Original V2 keyword mapping is planning evidence, not a claim of organic ranking.
 * Preserve one page per coherent intent; reject accidental unmapped published targets.
 */
const keywordSource=fs.readFileSync('docs/data/V2_Keyword_Appendix_218.csv','utf8');
const lines=keywordSource.trim().split(/\r?\n/);
if(lines.length!==219)throw Error('Expected header and 218 source keyword records.');
let mapped=0,hold=0,support=0;
const known=new Set(slugs.filter(Boolean).map(x=>'/'+x+'/'));
for(const row of lines.slice(1)){
 const values=[...row.matchAll(/"((?:[^"]|"")*)"/g)].map(m=>m[1].replace(/""/g,'"'));
 if(values.length!==8)throw Error('Invalid V2 keyword data row: '+row.slice(0,90));
 const [keyword,volume,kd,,group,decision,path,status]=values;
 if(!keyword||!Number.isFinite(Number(volume))||!Number.isFinite(Number(kd))||Number(kd)>29)throw Error('Invalid or out-of-scope keyword evidence: '+keyword);
 if(path){
  if(!known.has(path)||status!=='CONDITIONAL_QA')throw Error('Keyword maps to missing or nonapproved route: '+keyword+' => '+path);
  mapped++;
 }else{
  if(status!=='HOLD_NO_INDEX')throw Error('Unmapped keyword must stay HOLD: '+keyword);
  hold++;
 }
 if(decision==='SUPPORT-ONE-PAGE'){
  support++;
  if(path!=='/fabric-yards-to-inches/')throw Error('Conversion keyword cannibalization risk: '+keyword);
 }
 if(['WOF','SQUARE'].includes(group)&&path)throw Error('Unvalidated WOF or square intent cannot be published: '+keyword);
}
if(mapped!==202||hold!==16||support!==107)throw Error('V2 keyword allocation changed without updated evidence and intentional review.');
// Independent operational keyword decisions; source Semrush CSV is never modified.
const operationRows=fs.readFileSync('docs/data/V2_SEO_Operational_Keywords_218.csv','utf8').trim().split(/\r?\n/);
if(operationRows.length!==lines.length)throw Error('Operational keyword sheet needs all original 218 rows.');
const parseRow=row=>[...row.matchAll(/"((?:[^"]|"")*)"/g)].map(m=>m[1].replace(/""/g,'"'));
let activeCount=0,reviewCount=0,brandCount=0,holdCount=0;
for(let i=1;i<lines.length;i++){
 const original=parseRow(lines[i]),operational=parseRow(operationRows[i]);
 if(operational.length!==7||operational[0]!==original[0]||
    operational[1]!==original[1]||operational[2]!==original[2]||
    operational[3]!==original[5]||operational[4]!==original[6])
  throw Error('Operational SEO source mismatch or fabricated metric at row '+i);
 const [keyword,,,,path,status]=operational;
 if(keyword==='robert kaufman calculator'){
  if(status!=='EXCLUDE_OTHER_BRAND')throw Error('Competitor brand cannot be active keyword');
  brandCount++;
 }else if(['how much is 1 yard','quilting calculator app'].includes(keyword)){
  if(status!=='REVIEW_US_SERP_INTENT')throw Error('Ambiguous search intent must retain review gate');
  reviewCount++;
 }else if(!path){
  if(status!=='HOLD_UNVALIDATED_METHOD')throw Error('HOLD keyword must remain unindexed');
  holdCount++;
 }else{
  if(status!=='ACTIVE_NONBRAND_INTENT')throw Error('Approved mapped keyword missing operational target: '+keyword);
  activeCount++;
 }
}
if(activeCount!==199||reviewCount!==2||brandCount!==1||holdCount!==16)
 throw Error('Operational keyword decision counts are inconsistent.');
console.log('PASS: 199 active mapped intent terms, 2 US-SERP reviews, 1 other-brand exclusion, 16 original HOLD; source 218 unchanged.');
// Important static content must be genuinely inspectable without JavaScript.
const seoTables=[['quilt-backing-calculator','backing',8],
 ['quilt-binding-calculator','binding',6],['fabric-yardage-calculator','yardage',5]];
for(const [slug,id,expectedRows] of seoTables){
 const html=fs.readFileSync('dist/'+slug+'/index.html','utf8');
 const part=html.split('data-engine-reference="'+id+'"')[1]?.split('</table>')[0]||'';
 if(!part.includes('<caption>Illustrative cutting')||
    (part.match(/<tr>/g)||[]).length!==expectedRows+1)
  throw Error('Engine-derived static SEO examples missing or incomplete: '+slug);
 if(!part.includes('scope="row"')||!html.includes('Reference cases, not certified sewing'))
  throw Error('Example assumptions or row semantics missing: '+slug);
}
const direct=fs.readFileSync('dist/fabric-yards-to-inches/index.html','utf8');
if(!direct.includes('data-seo-direct-answer')||
   !direct.includes('One linear yard of fabric is exactly 36 inches (91.44 centimeters) long.')||
   !direct.includes('four yards is')||
   !direct.includes('href="#fraction-reference"')||
   !direct.includes('id="fraction-reference"'))
 throw Error('Converter must give high-intent yard conversion answer in raw HTML.');

for(const slug of slugs.filter(Boolean)){
 const html=fs.readFileSync('dist/'+slug+'/index.html','utf8');
 if(!html.includes('data-content-guide=')||!html.includes('PRACTICAL MEASUREMENT GUIDE')||!html.includes('What to calculate next')){
  throw Error('Missing static unique educational guide: '+slug);
 }
 if((html.match(/class="intent-guide-section"/g)||[]).length<2)throw Error('Insufficient unique guide sections: '+slug);
}
const conversion=fs.readFileSync('dist/fabric-yards-to-inches/index.html','utf8');
for(const key of ['How big is a yard of fabric?', '1/3', '2/3', '1 1/2','Can square inches be converted to fabric yards?', '1,548 square inches']){
 if(!conversion.includes(key))throw Error('Conversion page misses verified user intent '+key);
}
console.log('PASS: 218 source keyword records, 202 mapped to 9 unique tool intents, 16 HOLD, 107 conversion terms consolidated without thin pages.');

/** Fail fast on broken internal routes or duplicate page titles.
 * Asset hrefs are intentionally excluded; internal navigation URLs must be valid.
 */
const seenTitles=new Set();
const internalRoutes=new Set([...slugs.map(slug=>'/'+(slug?slug+'/':'')),'/privacy/','/qa/print-calibration/']);
for(const slug of [...slugs,'privacy','qa/print-calibration']){
 const html=fs.readFileSync('dist/'+(slug?slug+'/':'')+'index.html','utf8');
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];
 if(!title||seenTitles.has(title))throw Error('Missing/duplicate page title: '+slug);
 seenTitles.add(title);
 const h1Count=(html.match(/<h1(?:\s|>)/g)||[]).length;
 if(h1Count!==1)throw Error('Every static page must have exactly one H1: '+slug+' ('+h1Count+')');
 for(const hit of html.matchAll(/href="(\/[^"#?]+)"/g)){
  const href=hit[1];
  if(/\.[a-z0-9]+$/i.test(href)||href.startsWith('/_astro/'))continue;
  if(!internalRoutes.has(href))throw Error('Broken internal page link '+href+' from '+slug);
 }
}
console.log('PASS: 12 uniquely titled static pages including noindex manual calibration worksheet, one H1 each, internal link destinations verified.');

const primaryHeadings=new Map([
 ['calculators','Quilt calculator'],
 ['quilt-backing-calculator','Quilt backing calculator'],
 ['quilt-binding-calculator','Quilt binding calculator'],
 ['quilt-border-calculator','Quilt border calculator'],
 ['fabric-yardage-calculator','Fabric yardage calculator'],
 ['quilt-fabric-calculator','Quilt fabric calculator'],
 ['fabric-yards-to-inches','Fabric yards to inches'],
 ['quilt-batting-calculator','Quilt batting calculator'],
 ['quilt-sashing-calculator','Quilt sashing calculator']
]);
for(const [slug,keyword] of primaryHeadings){
 const html=fs.readFileSync('dist/'+slug+'/index.html','utf8');
 const h1=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]||'';
 if(!h1.toLowerCase().includes(keyword.toLowerCase()))throw Error('Page H1 must clearly answer original primary intent '+slug+': '+keyword);
}
console.log('PASS: all 9 unique tool H1 headings state their respective primary calculator intent.');



console.log('PASS: '+slugs.length+' approved routes, SEO metadata, '+(production?'production canonical/sitemap':'preview noindex')+', original preview images and HOLD exclusions.');
