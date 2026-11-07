/**
 * A standalone, offline, complete printable coordinate workbook.
 *
 * Unlike the interactive/fast SVG preview (first 180 rectangles) and paged
 * coordinate table (45 rows per roll), this contains EVERY physical cut from
 * the SAME independently verified layout source as cut-list CSV. Users open
 * the downloaded .html locally and use their browser's Print / Save as PDF.
 * No third-party resources, scripts, account, service or network required.
 */
import {assertExportProjectFingerprint,cutListRows,type MaterialCutPlan} from './cutlist';

const escapeHtml=(raw:string):string=>raw
 .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
 .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const safeText=(value:unknown):string=>escapeHtml(String(value).replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g,' ').trim());
const exact=(value:unknown):string=>{
 if(typeof value!=='number'||!Number.isFinite(value))throw Error('Non-finite physical cut coordinate cannot be printed.');
 return String(value);
};

/** All rows are validated by cutListRows exactly as for cut-list CSV. Never
 * accept arbitrary HTML as a material label, and never silently omit a roll.
 */
export function fullPrintableCutSheets(plans:readonly MaterialCutPlan[],sourceProjectHash:string):string{
 assertExportProjectFingerprint(sourceProjectHash);
 if(!sourceProjectHash)throw Error('Full printable cutting sheets require the current Project V2 fingerprint.');
 const rows=cutListRows(plans);
 if(!rows.length)throw Error('No physical cutting coordinates available for a printable workbook.');
 let cursor=0;
 const sections:string[]=[];
 for(const [rollIndex,plan] of plans.entries()){
  const count=plan.layout.cutPieces.length;
  const ownRows=rows.slice(cursor,cursor+count);
  cursor+=count;
  if(ownRows.length!==count || ownRows.some((row,i)=>row[1]!==plan.sku||row[2]!==i+1))
   throw Error('Printable cut workbook does not match validated CSV roll order.');
  const lines=ownRows.map(row=>{const index=row[2] as number;return [
   '<tr data-cut-number="'+exact(index)+'">',
   '<td class="tick">□</td>',
   '<th scope="row">'+exact(index)+'</th>',
   '<td class="name">'+safeText(row[3])+'</td>',
   '<td>'+exact(row[4])+'</td>',
   '<td>'+exact(row[5])+'</td>',
   '<td>'+exact(row[6])+'</td>',
   '<td>'+exact(row[7])+'</td>',
   '<td>'+exact(row[8])+'°</td>',
   '</tr>'
  ].join('');}).join('\n');
  sections.push([
   '<section class="roll" data-roll="'+(rollIndex+1)+'">',
   '<h2>Roll '+(rollIndex+1)+': '+safeText(plan.material)+'</h2>',
   '<p class="roll-meta">Physical roll ID: <strong>'+safeText(plan.sku)+'</strong>',
   ' · '+count+' actual cut'+(count===1?'':'s')+
   ' · Usable WOF: '+exact(plan.layout.usableWofIn)+' in',
   ' · Full cut run: '+exact(plan.layout.exactFabricRunLengthIn)+' in</p>',
   count?'<table><thead><tr><th scope="col">Done</th><th scope="col">#</th><th scope="col">Piece label</th><th scope="col">Roll X (in)</th><th scope="col">Roll Y (in)</th><th scope="col">Cut width (in)</th><th scope="col">Cut height (in)</th><th scope="col">Rotation</th></tr></thead><tbody>'+lines+'</tbody></table>'
    :'<p class="warning">NO PHYSICAL CUTS FOR THIS ROLL. Verify that the material is intentionally unused; do not treat zero cuts as a purchase recommendation.</p>',
   '</section>'
  ].join('\n'));
 }
 if(cursor!==rows.length)throw Error('Printable workbook dropped one or more validated physical cut rows.');
 const warning='These are numerical cutting coordinates in INCHES, NOT actual-size templates. Roll X runs across usable WOF; Roll Y runs along bolt length. Grain rotation is relative to the entered rectangle. Check your fabric, seam allowance, cut counts, print setup and physical pattern before cutting. Layout feasibility is not fabric certification.';
 return [
  '<!doctype html>',
  '<html lang="en"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">',
  '<title>Complete quilt cutting checklist · '+sourceProjectHash+'</title>',
  '<style>',
  '@page{size:letter landscape;margin:.48in}',
  'html{color:#1b3024;background:#f4f6f2;font:13px/1.48 system-ui,-apple-system,Segoe UI,Arial,sans-serif}',
  'body{max-width:1250px;margin:0 auto;padding:24px}',
  'h1{font-size:24px;margin:0 0 10px}h2{font-size:18px;line-height:1.3;margin:0 0 8px}',
  'p{margin:7px 0}.intro{padding:16px 20px;background:#fff;border:1px solid #bfd2c4;border-radius:10px}',
  '.tag{font-weight:700}.warning{background:#fff0cf;border:1px solid #d8b66e;padding:10px 13px;border-radius:6px}',
  '.roll{margin:21px 0;padding:15px;background:#fff;border:1px solid #b9cdbb;border-radius:8px}',
  '.roll-meta{font-size:12px;overflow-wrap:anywhere}.roll-meta strong{overflow-wrap:anywhere}',
  'table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;margin-top:12px}',
  'th,td{border:1px solid #bac6bc;padding:6px 5px;vertical-align:top;text-align:left;overflow-wrap:anywhere}',
  'thead{background:#e9f1e9}th[scope=row]{font-weight:700}.tick{width:31px;font-size:17px}',
  'th:nth-child(1){width:34px}th:nth-child(2){width:40px}',
  'th:nth-child(3){width:26%}th:nth-child(8){width:60px}',
  '.name{font-weight:600} .footer{font-size:11px;color:#425947;padding:8px 0}',
  '@media print{html{background:#fff;color:#000}body{padding:0;max-width:none}',
  '.intro,.roll{border-color:#777;background:#fff;border-radius:0}',
  '.roll{padding:8px 0;break-inside:auto}.roll h2,.roll-meta{break-after:avoid}',
  'thead{display:table-header-group;background:#eee!important}tr{break-inside:avoid}',
  'th,td{border-color:#777;padding:4px 5px}.warning{background:#fff!important;color:#000;border-color:#333}',
  '.footer{color:#000}}',
  '</style></head><body>',
  '<header class="intro"><h1>Complete physical cutting checklist</h1>',
  '<p class="tag">Source Project V2: '+sourceProjectHash+' (8-character comparison fingerprint, NOT a digital signature)</p>',
  '<p>'+rows.length+' actual cuts across '+plans.length+' independent physical roll'+(plans.length===1?'':'s')+'. Each roll has its own numbering; never merge scrap or yardage across SKU IDs.</p>',
  '<p class="warning">'+safeText(warning)+'</p>',
  '<p>Open this downloaded HTML in a browser and choose <strong>Print → Save as PDF</strong>, or print on paper. This document is the full coordinate table. The main calculator’s Print plan shows summary diagrams and paged coordinate previews only.</p></header>',
  '<main>'+sections.join('\n')+'</main>',
  '<footer class="footer">Quilt Studio · Local offline cutting reference · Project '+sourceProjectHash+' · Full exact numeric values from the same verified physical layouts as the cutting CSV. No website connections or external resources.</footer>',
  '</body></html>'
 ].join('\n');
}
