/**
 * Plain-text, human-readable shopping checklist for one exact Project V2
 * snapshot. This is NOT an order confirmation, verified physical pattern,
 * or an all-project quotation. Copying text never changes project/roll state.
 */
import {assertExportProjectFingerprint} from './cutlist';
import {hasIncompleteShopping,shoppingLineStatus,shoppingPriceSummary,type ShoppingLine} from './shopping';

function oneLine(input:string):string {
 return input.replace(/[\r\n\t\u2028\u2029]+/g,' ').replace(/\s+/g,' ').trim();
}
function numeric(value:number,precision=4):string {
 if(!Number.isFinite(value)||value<0)throw Error('Invalid shopping quantity.');
 return Number(value.toFixed(precision)).toLocaleString('en-US',{maximumFractionDigits:precision});
}
function dollars(value:number):string{
 if(!Number.isFinite(value)||value<0)throw Error('Invalid shopping cost.');
 return '$'+value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}
const caution='PLANNING ESTIMATES ONLY. Check actual roll width, grain, seam allowances and piece counts before purchasing. Schematic cut diagrams are NOT 1:1 patterns. Prices omit tax, delivery and unpriced materials.';
export function buildShoppingChecklistText(lines:readonly ShoppingLine[],projectHash:string):string {
 assertExportProjectFingerprint(projectHash);
 if(!lines.length)throw Error('No shopping materials to copy.');
 const prices=shoppingPriceSummary(lines);
 const incomplete=hasIncompleteShopping(lines);
 const out=[
  'QUILT STUDIO — MATERIAL SHOPPING CHECKLIST',
  'STATUS: '+(incomplete?'INCOMPLETE / DO NOT TREAT AS A FULL ORDER':'CUT LAYOUT CALCULATED / VERIFY MATERIALS BEFORE BUYING'),
  'Project snapshot: '+projectHash+' (comparison tag, NOT a digital signature)',
  '',
  'Material quantities are independent for each physical roll or SKU:',
 ];
 for(const [index,line] of lines.entries()){
  const status=shoppingLineStatus(line);
  const label=oneLine(line.label);
  const notes=oneLine(line.hint);
  const roll=line.rollId===undefined?'Roll ID not specified':oneLine(line.rollId);
  const quantity=line.amount===undefined?'NO PURCHASE QUANTITY':numeric(line.amount)+' yd rounded purchase';
  let prefix:string,warning:string;
  switch(status){
   case 'FEASIBLE_LAYOUT':
    prefix='[ ]';warning='CUT LAYOUT CALCULATED — verify physical material';
    break;
   case 'TOP_CUT_LIST_NOT_REVIEWED':
    prefix='[!]';warning='ESTIMATE ONLY — quilt-top cut coverage NOT REVIEWED';
    break;
   case 'NOT_PLANNED_NO_CUT_PIECES':
    prefix='[X]';warning='NOT PLANNED — no positive-count cut pieces; DO NOT ORDER';
    break;
   default:
    prefix='[X]';warning='FIT IMPOSSIBLE — correct dimensions; DO NOT ORDER';
  }
  out.push(
   '',
   prefix+' '+(index+1)+'. '+label,
   '  '+warning,
   '  '+quantity,
   '  '+roll,
   '  Notes: '+notes
  );
  if(line.rawYards!==undefined && status!=='NOT_PLANNED_NO_CUT_PIECES' && status!=='FIT_IMPOSSIBLE_NOT_PURCHASE_READY')
   out.push('  Exact raw requirement: '+numeric(line.rawYards)+' yd');
  if(line.unitPrice!==undefined)
   out.push('  Your price: '+dollars(line.unitPrice)+'/yd'+
    (line.amount!==undefined&&status!=='NOT_PLANNED_NO_CUT_PIECES'?
     ' · Estimated line cost: '+dollars(line.amount*line.unitPrice):' · no verified purchase quantity'));
 }
 out.push('','COST CHECK:');
 if(prices.enteredPriceSubtotalUsd===undefined)
  out.push('No entered-price subtotal is available.');
 else
  out.push('PARTIAL entered-price subtotal: '+dollars(prices.enteredPriceSubtotalUsd)+
   ' ('+prices.pricedCount+' priced material lines).');
 out.push(
  prices.unpricedCount+' quantity-ready material line(s) have no entered price.',
  prices.unreadyCount+' material line(s) are not purchase-ready.',
  '',
  caution
 );
 return out.join('\n');
}
