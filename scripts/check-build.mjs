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
console.log('PASS: '+slugs.length+' approved routes, SEO metadata, '+(production?'production canonical/sitemap':'preview noindex')+', original preview images and HOLD exclusions.');
