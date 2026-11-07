import { describe, expect, it } from 'vitest';
import { calculateProjectBinding, loadProject, sampleProject, validateProject } from '../src/lib/quilt/project';

describe('independent binding fabric', () => {
 it('uses binding width and shrinkage even when the backing settings differ', () => {
  const project=structuredClone(sampleProject);
  Object.assign(project.options,{usableWof:108,lengthShrinkage:20,bindingUsableWof:43,bindingLengthShrinkage:0});
  const { options }=validateProject(project);

  const binding=calculateProjectBinding(options,60,80);
  expect(binding.stripCount).toBe(8);
  expect(binding.layout.usableWofIn).toBe(43);
  expect(binding.purchase.roundedPurchaseYards).toBe(0.625);
  expect(calculateProjectBinding({...options,bindingLengthShrinkage:20},60,80).purchase.roundedPurchaseYards).toBe(0.75);
 });

 it('copies old shared settings once, so a later backing edit does not change binding', () => {
  const legacy=structuredClone(sampleProject);
  delete legacy.options.bindingUsableWof;
  delete legacy.options.bindingLengthShrinkage;
  legacy.options.lengthShrinkage=5;

  const { options }=loadProject(JSON.parse(JSON.stringify(legacy)));
  options.usableWof=108;
  options.lengthShrinkage=0;

  expect(options.bindingUsableWof).toBe(43);
  expect(options.bindingLengthShrinkage).toBe(5);
  expect(calculateProjectBinding(options,60,80).purchase.shrinkageLengthPct).toBe(5);
 });

 it('checks binding join loss against binding width', () => {
  const project=structuredClone(sampleProject);
  Object.assign(project.options,{usableWof:108,bindingUsableWof:2.5});
  expect(() => validateProject(project)).toThrow('Binding strip join loss');
 });
});
