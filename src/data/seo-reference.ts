import {calculateBacking, calculateStraightBinding, calculateYardage} from '../lib/quilt/math';

/** Verified-engine illustrative examples. These are NOT industry-standard quilt
 * dimensions, actual-sewn validation, or a substitute for the user's measured WOF.
 * No new cutting method and no extra public SEO route.
 */
const common={step:.125,shrinkageLengthPct:0};
export const backingReference=[
 {label:'Baby-sized example',width:36,height:45},
 {label:'Throw-sized example',width:50,height:60},
 {label:'Twin-sized example',width:68,height:86},
 {label:'Queen-sized example',width:90,height:90}
].flatMap(c=>[43,108].map(wofIn=>{
 const r=calculateBacking({widthIn:c.width,heightIn:c.height,overageIn:4,
  wofIn,joinTakeupIn:1,oneWayPrint:false,...common});
 return {label:c.label,quilt:`${c.width} × ${c.height}`,wofIn,
  backing:`${r.targetWidthIn} × ${r.targetHeightIn}`,
  direction:r.recommended.direction,panels:r.recommended.panelCount,
  runIn:r.recommended.layout.exactFabricRunLengthIn,
  yards:r.recommended.purchase.roundedPurchaseYards};
}));
export const bindingReference=[
 {label:'Throw-sized example',width:50,height:60},
 {label:'60 × 80 example',width:60,height:80},
 {label:'Queen-sized example',width:90,height:90}
].flatMap(c=>[2.25,2.5].map(stripWidthIn=>{
 const r=calculateStraightBinding({widthIn:c.width,heightIn:c.height,wofIn:43,
  stripWidthIn,tailAllowanceIn:12,joinLossIn:2.5,...common});
 return {label:c.label,quilt:`${c.width} × ${c.height}`,stripWidthIn,
  requiredIn:r.requiredLengthIn,strips:r.stripCount,
  runIn:r.layout.exactFabricRunLengthIn,yards:r.purchase.roundedPurchaseYards};
}));
const yardageCases=[
 {label:'20 pieces · 5 × 10 in',pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:43,allowRotate:false},
 {label:'20 pieces · 5 × 10 in',pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:50,allowRotate:false},
 {label:'20 pieces · 5 × 10 in',pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:43,allowRotate:true},
 {label:'12 pieces · 6 × 9 in',pieceWidthIn:6,pieceHeightIn:9,count:12,wofIn:43,allowRotate:false},
 {label:'12 pieces · 6 × 9 in',pieceWidthIn:6,pieceHeightIn:9,count:12,wofIn:50,allowRotate:false}
] as const;
export const yardageReference=yardageCases.map(c=>{
 const r=calculateYardage({...c,...common,oneWayPrint:false});
 if(!r.layout.isCutFeasible||!r.purchase)
  throw Error('Reference yardage scenario unexpectedly infeasible: '+c.label);
 return {label:c.label,wofIn:c.wofIn,rotation:c.allowRotate,
  across:r.across,rows:r.rows,runIn:r.layout.exactFabricRunLengthIn,
  yards:r.purchase.roundedPurchaseYards};
});
const glyphs=['','⅛','¼','⅜','½','⅝','¾','⅞'];
export function formatEighthYards(yards:number):string{
 if(!Number.isFinite(yards)||yards<0||Math.abs(yards*8-Math.round(yards*8))>1e-8)
  throw Error('Expected a nonnegative eighth-yard purchase quantity.');
 const eights=Math.round(yards*8),whole=Math.floor(eights/8),remainder=eights%8;
 const n=(whole?String(whole):'')+(whole&&remainder?' ':'')+
  (remainder?glyphs[remainder]:'')+(eights===0?'0':'');
 return n+' yd';
}
