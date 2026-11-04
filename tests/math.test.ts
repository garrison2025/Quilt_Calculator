import { describe, expect, it } from 'vitest';
import { calculateBacking, calculateStraightBinding, calculateYardage, calculateBatting, calculateQuiltFabric,
 calculateBorders, calculateSashing, parseMeasure, purchase, roundToStep, verifyLayout, layoutRectangles, calculateWofArea } from '../src/lib/quilt/math';
import { sampleProject, validateProject } from '../src/lib/quilt/project';
describe('V2 independent arithmetic fixtures', () => {
 it('backing longitudinal and crosswise cut plan', () => {
  const v = calculateBacking({ widthIn: 60, heightIn: 80, overageIn: 4, wofIn: 43, joinTakeupIn: 1 });
  expect(v.options.map(o => o.panelCount)).toEqual([2, 3]);
  expect(v.options.map(o => o.layout.exactFabricRunLengthIn)).toEqual([176, 204]);
  expect(v.options.map(o => o.purchase.roundedPurchaseYards)).toEqual([5, 5.75]);
  expect(v.recommended.direction).toBe('vertical');
  for (const o of v.options) expect(verifyLayout(o.layout)).toBe(true);
 });
 it('one-way backing forbids rotating the panel layout', () => {
  expect(calculateBacking({ widthIn: 60, heightIn: 80, overageIn: 4, wofIn: 43, joinTakeupIn: 1, oneWayPrint: true }).options).toHaveLength(1);
 });
 it('straight binding golden', () => {
  const b = calculateStraightBinding({ widthIn: 60, heightIn: 80, wofIn: 43, stripWidthIn: 2.5, tailAllowanceIn: 12, joinLossIn: 2.5 });
  expect([b.requiredLengthIn, b.stripCount, b.layout.exactFabricRunLengthIn, b.purchase.roundedPurchaseYards]).toEqual([292, 8, 20, .625]);
 });
 it('repeated rectangle orientation and no rotation', () => {
  const base = { pieceWidthIn: 5, pieceHeightIn: 10, count: 20, wofIn: 43 };
  expect(calculateYardage(base).purchase?.roundedPurchaseYards).toBe(.875);
  const r = calculateYardage({ ...base, allowRotate: true });
  expect(r.purchase?.roundedPurchaseYards).toBe(.75);
  expect(r.layout.cutPieces.every(p => p.grainRotationDeg === 90)).toBe(true);
  expect(verifyLayout(r.layout)).toBe(true);
 });
 it('cannot cut physically impossible rectangles', () => {
  expect(calculateYardage({ pieceWidthIn: 44, pieceHeightIn: 45, count: 3, wofIn: 43 }).layout.error).toContain('FIT_IMPOSSIBLE');
 });
 it('zero count means zero yardage', () => {
  expect(calculateYardage({ pieceWidthIn: 5, pieceHeightIn: 10, count: 0, wofIn: 43 }).purchase?.roundedPurchaseYards).toBe(0);
 });
 it('fractions in yard conversion', () => {
  expect([parseMeasure('1/4') * 36, parseMeasure('3/8') * 36, parseMeasure('7/8') * 36]).toEqual([9, 13.5, 31.5]);
  expect(parseMeasure('1 3/8')).toBe(1.375);
  expect(() => parseMeasure('1/0')).toThrow();
  expect(() => parseMeasure('2 + 3')).toThrow();
 });
 it('round only after prewash adjustment', () => {
  expect(purchase(36, .125, 10).roundedPurchaseYards).toBe(1.125);
  expect(roundToStep(5, .125)).toBe(5);
 });
 it('no fabric mixing between SKUs', () => {
  const results = calculateQuiltFabric(sampleProject.fabrics);
  expect(results).toHaveLength(2);
  expect(results.every(r => verifyLayout(r.layout))).toBe(true);
  expect(() => calculateQuiltFabric([sampleProject.fabrics[0], sampleProject.fabrics[0]])).toThrow();
 });
 it('border strip geometry and finished dimensions', () => {
  const b = calculateBorders({ widthIn: 60, heightIn: 80, seamIn: .25, layers: sampleProject.borders });
  expect([b.finishedWidthIn, b.finishedHeightIn]).toEqual([66, 86]);
  expect(b.layers[0].layout.cutPieces.length).toBe(4);
  expect(verifyLayout(b.layers[0].layout)).toBe(true);
 });
 it('batting must physically fit one-piece roll', () => {
  expect(calculateBatting({ widthIn: 60, heightIn: 80, overageIn: 4, rollWidthIn: 96 }).isCutFeasible).toBe(true);
  expect(calculateBatting({ widthIn: 60, heightIn: 80, overageIn: 4, rollWidthIn: 40 }).isCutFeasible).toBe(false);
 });
 it('sashing counts use correct independent strips', () => {
  const s = calculateSashing({ rows: 4, columns: 5, blockWidthIn: 10, blockHeightIn: 10, finishedSashIn: 2, seamIn: .25, wofIn: 43 });
  expect([s.vertical, s.horizontal, s.cornerstones]).toEqual([16, 15, 12]);
  expect([s.finishedWidthIn, s.finishedHeightIn]).toEqual([58, 46]);
  expect(verifyLayout(s.layout)).toBe(true);
 });
 it('area equivalence is not a guaranteed fit', () => expect(calculateWofArea(2, 44, 36)).toBeCloseTo(2.4444444));
 it('reject overlapping rectangles even if they fit bounds', () => {
  const l = layoutRectangles(43, [{ widthIn: 10, heightIn: 10, count: 2 }]);
  l.cutPieces[1].xIn = 0;
  expect(verifyLayout(l)).toBe(false);
 });
 it('validates local schema version', () => {
  expect(validateProject(sampleProject).schemaVersion).toBe(2);
  expect(() => validateProject({ ...sampleProject, schemaVersion: 1 })).toThrow();
 });
});
