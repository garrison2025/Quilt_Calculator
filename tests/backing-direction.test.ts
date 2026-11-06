import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sampleProject, validateProject } from '../src/lib/quilt/project';
import { resolveQuiltDimensions } from '../src/lib/quilt/dimensions';
import { calculateBacking, selectBackingOption } from '../src/lib/quilt/math';

const project = () => structuredClone(sampleProject);
const source = JSON.parse(readFileSync(new URL('../docs/schemas/Project_V2.schema.json', import.meta.url), 'utf8'));

function backingFor(p:ReturnType<typeof project>){
 const d=resolveQuiltDimensions(p),o=p.options;
 return calculateBacking({
  widthIn:d.finalWidthIn,heightIn:d.finalHeightIn,
  overageIn:o.overage,wofIn:o.usableWof,joinTakeupIn:o.joinTakeup,
  oneWayPrint:o.oneWayPrint,step:o.step,shrinkageLengthPct:o.lengthShrinkage
 });
}

describe('persistent whole-project backing seam selection',()=>{
 it('keeps manual horizontal seams even when they require more yardage than auto',()=>{
  const p=project(),b=backingFor(p);
  expect(b.recommended.direction).toBe('vertical');
  expect(selectBackingOption(b,'auto').purchase.roundedPurchaseYards).toBe(5.25);
  p.options.backingDirection='horizontal';
  const selected=selectBackingOption(backingFor(p),p.options.backingDirection);
  expect(selected.direction).toBe('horizontal');
  expect(selected.panelCount).toBe(3);
  expect(selected.layout.exactFabricRunLengthIn).toBe(222);
  expect(selected.purchase.roundedPurchaseYards).toBe(6.25);
  const restored=validateProject(JSON.parse(JSON.stringify(p)));
  expect(restored.options.backingDirection).toBe('horizontal');
  expect(selectBackingOption(backingFor(restored),restored.options.backingDirection).layout.exactFabricRunLengthIn).toBe(222);
 });
 it('legacy V2 projects without saved orientation retain auto recommendation',()=>{
  const p=project(); delete p.options.backingDirection;
  const restored=validateProject(JSON.parse(JSON.stringify(p)));
  expect(restored.options.backingDirection).toBeUndefined();
  expect(selectBackingOption(backingFor(restored),restored.options.backingDirection)).toEqual(backingFor(restored).recommended);
 });
 it('explicit vertical seams can be chosen even when auto has a different optimum',()=>{
  const p=project();
  p.options.backingDirection='vertical';
  const selection=selectBackingOption(backingFor(p),p.options.backingDirection);
  expect(selection.direction).toBe('vertical');
  expect(selection.purchase.roundedPurchaseYards).toBe(5.25);
 });
 it('blocks horizontal directional-print cuts, never silently returns vertical',()=>{
  const p=project();p.options.oneWayPrint=true;p.options.backingDirection='horizontal';
  expect(validateProject(JSON.parse(JSON.stringify(p))).options.backingDirection).toBe('horizontal');
  const possible=backingFor(p);
  expect(possible.options.map(x=>x.direction)).toEqual(['vertical']);
  expect(()=>selectBackingOption(possible,p.options.backingDirection)).toThrow(/BACKING DIRECTION CONFLICT/);
  p.options.backingDirection='auto';
  expect(selectBackingOption(backingFor(p),p.options.backingDirection).direction).toBe('vertical');
 });
 it('rejects unsupported V2 backing-direction values and aligns JSON Schema',()=>{
  expect(source.properties.options.additionalProperties).toBe(false);
  expect(source.properties.options.properties.backingDirection.enum).toEqual(['auto','vertical','horizontal']);
  expect(source.properties.options.required).not.toContain('backingDirection');
  for(const invalid of ['diagonal','VERTICAL',null,3,{},[]]){
   const p=project();
   (p.options as unknown as Record<string,unknown>).backingDirection=invalid;
   expect(()=>validateProject(p),String(invalid)).toThrow(/backingDirection/);
  }
 });
});
