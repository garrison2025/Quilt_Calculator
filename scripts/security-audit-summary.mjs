// Read-only CI summary of two separate npm audit inventories. This script
// does not automatically upgrade or assume browser-exploitable server issues.
// Upgrading Astro major versions requires independent build and runtime QA.
import fs from 'node:fs';
function report(path,label){
 const raw=JSON.parse(fs.readFileSync(path,'utf8'));
 const rows=Object.entries(raw.vulnerabilities||{}).map(([name,v])=>({
  name,severity:v.severity,direct:v.isDirect,fix:v.fixAvailable,
  via:(v.via||[]).map(x=>typeof x==='string'?x:x.url||x.title||'advisory')
 }));
 rows.sort((a,b)=>(['critical','high','moderate','low'].indexOf(a.severity)-
  ['critical','high','moderate','low'].indexOf(b.severity)));
 const counts=raw.metadata?.vulnerabilities||{};
 console.log('DEPENDENCY AUDIT · '+label);
 console.log('Registry report counts: '+JSON.stringify(counts));
 for(const item of rows)console.log(JSON.stringify(item));
 if(raw.error)console.log('AUDIT ERROR: '+JSON.stringify(raw.error));
 console.log('STATUS: '+(rows.length?'UNRESOLVED_ADVISORIES_REQUIRING_MANUAL_REVIEW':'NO_REPORTED_ADVISORIES'));
}
report('artifacts/security/audit-all.json','full dev + production tree');
report('artifacts/security/audit-production.json','npm --omit=dev tree');
