import fs from 'node:fs';
import path from 'node:path';

/** Evidence only. These are simulated mobile laboratory results, not CrUX,
 * Search Console rankings, field INP, or a production Core Web Vitals pass.
 */
const paths=process.argv.slice(2);
if(!paths.length)throw Error('Provide Lighthouse JSON file paths.');
const lines=[
 '# Quilt Studio — Lighthouse mobile lab (CI)',
 '',
 'Simulated mobile Lighthouse diagnostics from a local static Astro preview build. No field-data or production performance claim.',
 '',
 '| Route | Performance score | Lighthouse SEO score | LCP lab (ms) | CLS lab | TBT lab (ms) | Field INP |',
 '|---|---:|---:|---:|---:|---:|---|'
];
for(const file of paths){
 const report=JSON.parse(fs.readFileSync(file,'utf8'));
 const audits=report.audits||{},categories=report.categories||{};
 const route=new URL(report.finalDisplayedUrl||report.finalUrl||report.requestedUrl).pathname;
 const score=name=>typeof categories[name]?.score==='number'?Math.round(categories[name].score*100):'NOT_RUN';
 const metric=id=>{
  const n=audits[id]?.numericValue;
  return Number.isFinite(n)?n.toFixed(id==='cumulative-layout-shift'?3:0):'NOT_RUN';
 };
 if(score('performance')==='NOT_RUN'||score('seo')==='NOT_RUN')
  throw Error('Incomplete Lighthouse category report: '+file);
 lines.push(`| ${route} | ${score('performance')} | ${score('seo')} | ${metric('largest-contentful-paint')} | ${metric('cumulative-layout-shift')} | ${metric('total-blocking-time')} | NOT_MEASURED |`);
 console.log('LIGHTHOUSE LAB '+path.basename(file)+' performance='+score('performance')+' SEO='+score('seo')+
  ' LCP(ms)='+metric('largest-contentful-paint')+' CLS='+metric('cumulative-layout-shift')+
  ' TBT(ms)='+metric('total-blocking-time')+' (NOT field INP)');
}
lines.push('', 'Scores, LCP, CLS and TBT may vary between runs. TBT is not INP. No full-size physical printer or real fabric was tested.', '');
fs.writeFileSync('artifacts/lighthouse/README.md',lines.join('\n'));
