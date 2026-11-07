import {describe,it,expect} from 'vitest';
import {convertFabricLength,switchFabricLengthUnit} from '../src/lib/quilt/fabric-length-conversion';

describe('Yards, inches and centimeters — one linear quantity, three source units',()=>{
 it.each([
  ['1/4','yd',.25,9,22.86],
  ['⅔','yd',2/3,24,60.96],
  ['1½','yd',1.5,54,137.16],
  ['9','in',.25,9,22.86],
  ['36','in',1,36,91.44],
  ['22.86','cm',.25,9,22.86],
  ['91.44','cm',1,36,91.44],
  ['0','cm',0,0,0]
 ] as const)('%s %s yields the correct yard/inch/cm equivalents',
 (raw,unit,yards,inches,cm)=>{
  const result=convertFabricLength(raw,unit);
  expect(result.yards).toBeCloseTo(yards,10);
  expect(result.inches).toBeCloseTo(inches,10);
  expect(result.centimeters).toBeCloseTo(cm,10);
  expect(result.scope).toBe('LINEAR_LENGTH_ONLY_NOT_FABRIC_AREA_OR_PURCHASE');
 });
 it.each([
  ['1/4','yd','in','9'],['9','in','yd','0.25'],
  ['22.86','cm','yd','0.25'],['⅓','yd','in','12'],
  ['1 1/2','yd','cm','137.16'],['54','in','cm','137.16']
 ] as const)('switch from %s %s to %s preserves the physical length',
 (raw,from,to,want)=>{
  const before=convertFabricLength(raw,from);
  const switched=switchFabricLengthUnit(raw,from,to);
  expect(switched.raw).toBe(want);
  expect(switched.converted.inches).toBeCloseTo(before.inches,10);
 });
 it('cycles yd -> in -> cm -> yd without silently changing quantity',()=>{
  let raw='2 3/8',unit:'yd'|'in'|'cm'='yd';
  const source=convertFabricLength(raw,unit);
  for(const to of ['in','cm','yd'] as const){
   const next=switchFabricLengthUnit(raw,unit,to);
   raw=next.raw;unit=to;
   expect(next.converted.inches).toBeCloseTo(source.inches,9);
  }
  expect(raw).toBe('2.375');
 });
 it('preserves correctly grouped input but rejects ambiguous numeric fragments',()=>{
  expect(convertFabricLength('1,000','in').yards).toBeCloseTo(1000/36,10);
  for(const raw of ['1,2','1,2½','1e3','-1','Infinity','NaN','1,000,00','']){
   expect(()=>convertFabricLength(raw,'yd')).toThrow();
  }
 });
 it('rejects wrong units and a switch beyond original engine numeric limits',()=>{
  expect(()=>convertFabricLength('2','meter' as 'in')).toThrow(/unit/);
  expect(()=>switchFabricLengthUnit('1','yd','m' as 'in')).toThrow(/unit/);
  expect(()=>switchFabricLengthUnit('5000','yd','in')).toThrow(/limit/);
  expect(()=>switchFabricLengthUnit('1/100000000000','in','yd')).toThrow();
 });
 it('decimal conversions use exact factors but displayed values may round',()=>{
  const x=convertFabricLength('123.4567','cm');
  expect(x.inches*2.54).toBeCloseTo(123.4567,11);
  const y=switchFabricLengthUnit('123.4567','cm','yd');
  expect(y.converted.inches).toBeCloseTo(x.inches,9);
  expect(Number.isFinite(y.converted.yards)).toBe(true);
 });
});
