import fs from 'node:fs';
const slugs=['','calculators','quilt-backing-calculator','quilt-binding-calculator','quilt-border-calculator','fabric-yardage-calculator','quilt-fabric-calculator','fabric-yards-to-inches','quilt-batting-calculator','quilt-sashing-calculator'];
const site=process.env.PUBLIC_SITE_URL||'';
const production=process.env.PUBLIC_INDEXABLE==='1'&&/^https:\/\/[a-z0-9.-]+$/i.test(site)&&!/\.pages\.dev$|localhost$|127\.0\.0\.1$/.test(site.toLowerCase());
for(const slug of slugs){
 const file='dist/'+(slug?slug+'/':'')+'index.html';
 if(!fs.existsSync(file))throw Error('Missing route '+file);
 const html=fs.readFileSync(file,'utf8');
 for(const pattern of ['<h1','name="description"',production?'index,follow':'noindex,follow','.webp','application/ld+json']){
  if(!html.includes(pattern))throw Error('Missing '+pattern+' on '+file);
 }
 if(production && !html.includes('rel="canonical"'))throw Error('Missing canonical: '+file);
}
for(const slug of ['diagonal-quilt-backing-calculator','rag-quilt-calculator','quilt-block-calculator','square-in-a-square-calculator','fabric-width-yardage-converter']){
 if(fs.existsSync('dist/'+slug+'/index.html'))throw Error('HOLD route published: '+slug);
}
if(!fs.existsSync('dist/privacy/index.html'))throw Error('Missing privacy page');
const privacy=fs.readFileSync('dist/privacy/index.html','utf8');
if(production && !privacy.includes('href="'+site+'/privacy/"'))throw Error('Privacy canonical must not point to undefined.');
if(!fs.existsSync('dist/404.html'))throw Error('Missing Cloudflare Pages 404.html: unknown URLs would silently fall back to homepage.');
const page404=fs.readFileSync('dist/404.html','utf8');
if(!page404.includes('noindex,follow')||page404.includes('rel="canonical"'))throw Error('404 route must be noindex with no canonical.');
if(production){
 const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
 if((sitemap.match(/<url>/g)||[]).length!==slugs.length)throw Error('Production sitemap does not match approved routes.');
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
const internalRoutes=new Set([...slugs.map(slug=>'/'+(slug?slug+'/':'')),'/privacy/']);
for(const slug of [...slugs,'privacy']){
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
console.log('PASS: 11 uniquely titled static pages, one H1 each, internal link destinations verified.');


console.log('PASS: '+slugs.length+' approved routes, SEO metadata, '+(production?'production canonical/sitemap':'preview noindex')+', original preview images and HOLD exclusions.');
