import { describe, expect, it } from 'vitest';
import { calculateBacking, calculateStraightBinding, calculateYardage, calculateBatting, calculateQuiltFabric,
 calculateBorders, calculateSashing, compareYardageWidths, parseMeasure, purchase, roundToStep, verifyLayout, layoutRectangles, calculateWofArea } from '../src/lib/quilt/math';
import { sampleProject, validateProject } from '../src/lib/quilt/project';
describe('V2 independent arithmetic fixtures', () => {
 it('compares two fabric widths by verified cutting runs instead of area-only ratios',()=>{
  const c=compareYardageWidths({pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:43,step:.125,allowRotate:false},50);
  expect([c.current.across,c.current.rows,c.current.layout.exactFabricRunLengthIn,c.current.purchase?.roundedPurchaseYards]).toEqual([8,3,30,.875]);
  expect([c.alternate.across,c.alternate.rows,c.alternate.layout.exactFabricRunLengthIn,c.alternate.purchase?.roundedPurchaseYards]).toEqual([10,2,20,.625]);
  expect(c.roundedPurchaseDifferenceYards).toBe(.25);
  expect(verifyLayout(c.current.layout)&&verifyLayout(c.alternate.layout)).toBe(true);
  const impossible=compareYardageWidths({pieceWidthIn:5,pieceHeightIn:10,count:20,wofIn:43},4);
  expect(impossible.current.purchase).toBeDefined();
  expect(impossible.alternate.layout.isCutFeasible).toBe(false);
  expect(impossible.alternate.purchase).toBeUndefined();
  expect(impossible.roundedPurchaseDifferenceYards).toBeUndefined();
 });
 it('keeps 90-degree rotation available for nearly square pieces at a WOF boundary',()=>{
  const piece=43+5e-9;
  const locked=calculateYardage({pieceWidthIn:piece,pieceHeightIn:43,count:2,wofIn:43,allowRotate:false});
  expect(locked.layout.isCutFeasible).toBe(false);
  const rotated=calculateYardage({pieceWidthIn:piece,pieceHeightIn:43,count:2,wofIn:43,allowRotate:true});
  expect(rotated.layout.isCutFeasible).toBe(true);
  expect(rotated.layout.cutPieces.every(p=>p.grainRotationDeg===90)).toBe(true);
  expect(verifyLayout(rotated.layout)).toBe(true);
 });
 it('rejects a cut slightly wider than the real WOF rather than applying a fixed 1e-8 inch waiver',()=>{
  const r=calculateYardage({pieceWidthIn:43+5e-9,pieceHeightIn:9,count:2,wofIn:43,allowRotate:false});
  expect(r.layout.isCutFeasible).toBe(false);
  expect(r.purchase).toBeUndefined();
  const permitted=calculateYardage({pieceWidthIn:43+5e-9,pieceHeightIn:9,count:2,wofIn:43,allowRotate:true});
  expect(permitted.layout.isCutFeasible).toBe(true);
  expect(permitted.layout.cutPieces.every(p=>p.grainRotationDeg===90)).toBe(true);
 });
 it('does not fit four almost-quarter-WOF rectangles into only three available slots',()=>{
  const r=calculateYardage({pieceWidthIn:10.750000002,pieceHeightIn:5,count:4,wofIn:43,allowRotate:false});
  expect(r.layout.isCutFeasible).toBe(true);
  expect(r.across).toBe(3);
  expect(r.rows).toBe(2);
  expect(r.layout.exactFabricRunLengthIn).toBe(10);
  expect(verifyLayout(r.layout)).toBe(true);
 });
 it('never undercounts backing panels just above one full WOF at a threshold', () => {
  const delta=1e-9;
  const b=calculateBacking({widthIn:43+delta,heightIn:70,overageIn:0,wofIn:43,joinTakeupIn:0,step:.125});
  const vertical=b.options.find(o=>o.direction==='vertical')!;
  expect(vertical.panelCount).toBe(2);
  expect(vertical.finishedJoinedSpanIn).toBeGreaterThanOrEqual(b.targetWidthIn);
  const exact=calculateBacking({widthIn:43,heightIn:70,overageIn:0,wofIn:43,joinTakeupIn:0,step:.125});
  expect(exact.options.find(o=>o.direction==='vertical')?.panelCount).toBe(1);
 });
 it('never undercounts straight-grain binding strips by fixed EPS near a joint threshold', () => {
  const b=calculateStraightBinding({widthIn:10,heightIn:11.5,tailAllowanceIn:1e-9,wofIn:43,stripWidthIn:2.5,joinLossIn:0,step:.125});
  expect(b.requiredLengthIn).toBeGreaterThan(43);
  expect(b.stripCount).toBe(2);
  expect(b.effectiveJoinedLengthIn).toBeGreaterThanOrEqual(b.requiredLengthIn);
  const exact=calculateStraightBinding({widthIn:10,heightIn:11.5,tailAllowanceIn:0,wofIn:43,stripWidthIn:2.5,joinLossIn:0});
  expect(exact.stripCount).toBe(1);
 });
 it('never underbuys when raw yardage sits just above a purchase increment',()=>{
  const over=0.25+1e-9;
  expect(roundToStep(over,0.25)).toBe(0.5);
  const p=purchase(over*36,0.25);
  expect(p.rawPurchaseYards).toBeGreaterThan(0.25);
  expect(p.roundedPurchaseYards).toBe(0.5);
  expect(roundToStep(0.3,0.1)).toBeCloseTo(0.3,12);
  expect(roundToStep(0,0.125)).toBe(0);
 });
 it('accepts displayed Unicode fabric fractions without accepting malformed mixed text',()=>{
  expect(parseMeasure('¼')).toBe(.25);
  expect(parseMeasure('1½')).toBe(1.5);
  expect(parseMeasure('1 ½')).toBe(1.5);
  expect(parseMeasure('⅜')).toBe(.375);
  expect(parseMeasure('⅓')*36).toBe(12);
  expect(parseMeasure('⅔')*36).toBe(24);
  expect(parseMeasure('1,000¼')).toBe(1000.25);
  for(const invalid of ['1,2½','1½3','½½','1,00¼','¾ yard','1 ½ ½']){
    expect(()=>parseMeasure(invalid),'Reject malformed glyph fraction: '+invalid).toThrow();
  }
 });
 it('parses only valid US comma grouping to prevent mistaken fabric amounts', () => {
  expect(parseMeasure('1000')).toBe(1000);
  expect(parseMeasure('1,000')).toBe(1000);
  expect(parseMeasure('1,000.5')).toBe(1000.5);
  expect(parseMeasure('1,000 1/2')).toBe(1000.5);
  expect(parseMeasure('1 3/8')).toBe(1.375);
  for (const invalid of ['1,2','1,23','1,,000','12,34,567','1,000,','1,000/2','1.2,3','1 1/0']) {
   expect(()=>parseMeasure(invalid),'Reject ambiguous number: '+invalid).toThrow();
  }
 });
 it('backing longitudinal and crosswise cut plan', () => {
  const v = calculateBacking({ widthIn: 60, heightIn: 80, overageIn: 4, wofIn: 43, joinTakeupIn: 1 });
  expect(v.options.map(o => o.panelCount)).toEqual([2, 3]);
  expect(v.options.map(o => o.layout.exactFabricRunLengthIn)).toEqual([176, 204]);
  expect(v.options.map(o => o.purchase.roundedPurchaseYards)).toEqual([5, 5.75]);
  expect(v.recommended.direction).toBe('vertical');
  expect(v.options[0].joinedSeamPositionsIn).toEqual([42.5]);
  expect(v.options[1].joinedSeamPositionsIn).toEqual([42.5,84.5]);
  for (const o of v.options) expect(verifyLayout(o.layout)).toBe(true);
 });
 it('recommends horizontal seams when a rotated backing needs less fabric', () => {
  const b=calculateBacking({widthIn:80,heightIn:60,overageIn:4,wofIn:43,joinTakeupIn:1,step:.125});
  expect(b.recommended.direction).toBe('horizontal');
  expect(b.options.map(v=>v.purchase.roundedPurchaseYards)).toEqual([5.75,5]);
  expect(b.recommended.layout.cutPieces).toHaveLength(2);
  expect(verifyLayout(b.recommended.layout)).toBe(true);
 });
 it('explicitly limits oversized backing and binding construction',()=>{
  expect(()=>calculateBacking({widthIn:100000,heightIn:60,overageIn:4,wofIn:40,joinTakeupIn:1,oneWayPrint:true})).toThrow(/more than 2,000 panels/);
  expect(()=>calculateStraightBinding({widthIn:100000,heightIn:60,wofIn:43,stripWidthIn:2.5,tailAllowanceIn:12,joinLossIn:2.5})).toThrow(/more than 2,000 strips/);
 });
 it('limits combined fabric SKU quantities before constructing tens of thousands of rectangles',()=>{
  const a={id:'a',label:'A',usableWidth:43,shrinkageLengthPct:0,oneWayPrint:false,pieces:[{widthIn:5,heightIn:5,count:1100}]};
  const b={...a,id:'b',pieces:[{widthIn:5,heightIn:5,count:1000}]};
  expect(()=>calculateQuiltFabric([a,b])).toThrow(/Maximum 2,000/);
  const p=structuredClone(sampleProject);
  p.fabrics[0].pieces[0].count=1990;
  p.fabrics[1].pieces[0].count=20;
  expect(()=>validateProject(p)).toThrow(/Maximum 2,000/);
 });
 it('limits the total cuts for large sashing grids before trying to pack them',()=>{
  expect(()=>calculateSashing({rows:40,columns:40,blockWidthIn:10,blockHeightIn:10,finishedSashIn:2,seamIn:.25,wofIn:43})).toThrow(/more than 2,000/);
 });
 it('rejects inconsistent join losses and oversized grids before project import',()=>{
  const backing=structuredClone(sampleProject);backing.options.joinTakeup=backing.options.usableWof;
  expect(()=>validateProject(backing)).toThrow(/Backing join take-up/);
  const binding=structuredClone(sampleProject);binding.options.stripJoinLoss=binding.options.usableWof;
  expect(()=>validateProject(binding)).toThrow(/Binding strip join loss/);
  const grid=structuredClone(sampleProject);grid.sashing.rows=40;grid.sashing.columns=40;
  expect(()=>validateProject(grid)).toThrow(/Sashing block grid exceeds 2,000/);
 });
 it('one-panel backing has no fabricated seam positions', () => {
  const r=calculateBacking({widthIn:32,heightIn:32,overageIn:2,wofIn:43,joinTakeupIn:1,oneWayPrint:true});
  expect(r.options[0].panelCount).toBe(1);
  expect(r.options[0].joinedSeamPositionsIn).toEqual([]);
  expect(r.options[0].finishedJoinedSpanIn).toBe(43);
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
