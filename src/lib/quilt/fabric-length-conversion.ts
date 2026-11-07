/** Pure LENGTH-only fabric conversion.
 *
 * The source unit is always explicit. Width, area, grain direction, shop
 * yard increments and physical WOF are NOT inferred from linear dimensions.
 * Decimal display may be rounded; computation uses the unrounded input.
 */
import {LIMIT,parseMeasure} from './math';
export type FabricLengthUnit='yd'|'in'|'cm';
export type FabricLengthEquivalence={
 inputUnit:FabricLengthUnit;
 inputAmount:number;
 yards:number;
 inches:number;
 centimeters:number;
 scope:'LINEAR_LENGTH_ONLY_NOT_FABRIC_AREA_OR_PURCHASE';
};
const toInchesFactor:Record<FabricLengthUnit,number>={
 yd:36,in:1,cm:1/2.54
};
export function convertFabricLength(raw:string,unit:FabricLengthUnit):FabricLengthEquivalence{
 if(!Object.hasOwn(toInchesFactor,unit))throw Error('Unsupported fabric length unit.');
 const amount=parseMeasure(raw);
 const inches=amount*toInchesFactor[unit];
 const yards=inches/36;
 const centimeters=inches*2.54;
 if([inches,yards,centimeters].some(v=>!Number.isFinite(v)||v<0))
  throw Error('Converted length is outside the supported numeric range.');
 return {
  inputUnit:unit,inputAmount:amount,yards,inches,centimeters,
  scope:'LINEAR_LENGTH_ONLY_NOT_FABRIC_AREA_OR_PURCHASE'
 };
}
export function switchFabricLengthUnit(
 raw:string,from:FabricLengthUnit,to:FabricLengthUnit
):{raw:string;converted:FabricLengthEquivalence}{
 const before=convertFabricLength(raw,from);
 if(!Object.hasOwn(toInchesFactor,to))throw Error('Unsupported fabric length unit.');
 const exact=to==='yd'?before.yards:to==='in'?before.inches:before.centimeters;
 // parseMeasure intentionally rejects scientific notation and numbers larger
 // than LIMIT. Refuse an unrepresentable unit change instead of turning a
 // positive measurement into 0 or inventing an invalid input.
 if(exact>LIMIT)throw Error('Converted input would exceed the supported measurement limit.');
 const rounded=Number(exact.toFixed(12));
 if(exact>0&&rounded===0)
  throw Error('Converted input is too small to preserve in decimal input.');
 const newRaw=rounded.toFixed(12).replace(/\.?0+$/,'');
 const safeRaw=rounded===0?'0':newRaw;
 const after=convertFabricLength(safeRaw,to);
 const changeIn=Math.abs(after.inches-before.inches);
 const tolerance=3e-11*Math.max(1,before.inches);
 if(changeIn>tolerance)
  throw Error('Unit switch cannot preserve the measurement within numeric precision.');
 return {raw:safeRaw,converted:after};
}
