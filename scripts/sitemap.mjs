import fs from 'node:fs';
// Cloudflare supplies these built-in variables automatically. No manual
// production SEO toggle is needed; PR previews and CI remain nonindexable.
const site='https://quiltcutplanner.com';
const okay=process.env.CF_PAGES==='1'&&process.env.CF_PAGES_BRANCH==='main';
const file='dist/sitemap.xml';
if(!okay){
 if(fs.existsSync(file))fs.unlinkSync(file);
 console.log('PREVIEW MODE: no production sitemap.');
}else{
 const slugs=['','calculators','quilt-backing-calculator','quilt-binding-calculator','quilt-border-calculator','fabric-yardage-calculator','quilt-fabric-calculator','fabric-yards-to-inches','quilt-batting-calculator','quilt-sashing-calculator'];
 for(const slug of slugs){const html='dist/'+(slug?slug+'/':'')+'index.html';if(!fs.existsSync(html))throw Error('Refusing sitemap: missing '+html);}
 const entries=slugs.map(slug=>'  <url><loc>'+site+'/'+(slug?slug+'/':'')+'</loc></url>').join('\n');
 fs.writeFileSync(file,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+entries+'\n</urlset>\n');
 fs.appendFileSync('dist/robots.txt','\nSitemap: '+site+'/sitemap.xml\n');
 console.log('Production-only sitemap: '+slugs.length+' approved URLs.');
}
