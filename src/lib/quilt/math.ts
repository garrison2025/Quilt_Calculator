/* Shared, side-effect-free cutting and purchasing mathematics. Measurements are inches. */
export const VERSION = 'v2.0';
export const LIMIT = 100000;
export const MAX_PIECES = 2000;
const EPS = 1e-8;
export type Rect = { xIn: number; yIn: number; widthIn: number; heightIn: number; grainRotationDeg: 0 | 90; label: string };
export type PieceRequest = { widthIn: number; heightIn: number; count: number; label?: string; allowRotate?: boolean };
export type Layout = { isCutFeasible: boolean; error?: string; usableWofIn: number; exactFabricRunLengthIn: number; cutPieces: Rect[]; physicalOffcutAreaSqIn: number; globallyOptimal: false };
export type Purchase = { exactFabricRunLengthIn: number; rawPurchaseYards: number; roundedPurchaseYards: number; purchaseRoundingExtraLengthIn: number; shrinkageLengthPct: number };
export type BackingOption = { direction: 'vertical' | 'horizontal'; targetWidthIn: number; targetHeightIn: number; panelCount: number; panelLengthIn: number; finishedJoinedSpanIn: number; joinedSeamPositionsIn: number[]; postAssemblyTrimAreaSqIn: number; layout: Layout; purchase: Purchase };
const valid = (x: number, label: string, zero = false) => {
  if (!Number.isFinite(x) || x < (zero ? 0 : EPS) || x > LIMIT) throw Error(label + ' must be a valid ' + (zero ? 'nonnegative' : 'positive') + ' number.');
  return x;
};
export function parseMeasure(value: string | number): number {
  if (typeof value === 'number') return valid(value, 'Measurement', true);
  const s = value.trim().replace(/,/g, '');
  let v: number;
  if (/^\d+(?:\.\d+)?$/.test(s)) v = Number(s);
  else {
    const m = s.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/);
    if (!m || Number(m[3]) === 0) throw Error('Use inches as 12, 12.5, 1/4 or 1 3/8.');
    v = Number(m[1] || 0) + Number(m[2]) / Number(m[3]);
  }
  return valid(v, 'Measurement', true);
}
export function toInches(value: number, units: 'in' | 'cm' = 'in'): number { return value * (units === 'cm' ? 1 / 2.54 : 1); }
export function fromInches(value: number, units: 'in' | 'cm' = 'in'): number { return value * (units === 'cm' ? 2.54 : 1); }
export function roundToStep(yards: number, step = .125): number {
  valid(yards, 'Yardage', true); valid(step, 'Purchase increment');
  return yards === 0 ? 0 : Math.ceil(yards / step - EPS) * step;
}
export function purchase(runLengthIn: number, step = .125, shrinkageLengthPct = 0): Purchase {
  valid(runLengthIn, 'Cut run length', true);
  valid(shrinkageLengthPct, 'Length shrinkage', true);
  if (shrinkageLengthPct >= 100) throw Error('Length shrinkage must be below 100%.');
  const beforePrewash = runLengthIn / (1 - shrinkageLengthPct / 100);
  const raw = beforePrewash / 36;
  const rounded = roundToStep(raw, step);
  return { exactFabricRunLengthIn: runLengthIn, rawPurchaseYards: raw, roundedPurchaseYards: rounded,
    purchaseRoundingExtraLengthIn: Math.max(0, rounded * 36 - beforePrewash), shrinkageLengthPct };
}
export function impossible(wof: number, msg: string): Layout {
  return { isCutFeasible: false, error: msg, usableWofIn: wof, exactFabricRunLengthIn: 0, cutPieces: [], physicalOffcutAreaSqIn: 0, globallyOptimal: false };
}
/** Verify physical roll rectangles without a quadratic full-pair scan.
 * Sorting by roll-length position lets us skip disjoint rows; only pieces
 * whose y intervals overlap can possibly collide. This remains an exact
 * geometry check (not a heuristic or a claim of optimal packing).
 */
export function verifyLayout(layout: Layout): boolean {
  if (!Array.isArray(layout.cutPieces)) return false;
  if (!layout.isCutFeasible) return layout.cutPieces.length === 0;
  if (!Number.isFinite(layout.usableWofIn) || layout.usableWofIn <= 0 ||
      !Number.isFinite(layout.exactFabricRunLengthIn) || layout.exactFabricRunLengthIn < 0 ||
      !Number.isFinite(layout.physicalOffcutAreaSqIn) || layout.physicalOffcutAreaSqIn < -EPS) return false;
  const pieces = layout.cutPieces;
  for (const r of pieces) {
    if (![r.xIn, r.yIn, r.widthIn, r.heightIn].every(Number.isFinite) ||
      (r.grainRotationDeg !== 0 && r.grainRotationDeg !== 90) ||
      r.xIn < -EPS || r.yIn < -EPS || r.widthIn <= 0 || r.heightIn <= 0 ||
      r.xIn + r.widthIn > layout.usableWofIn + EPS ||
      r.yIn + r.heightIn > layout.exactFabricRunLengthIn + EPS) return false;
  }
  // Never reorder the cutting plan itself; deterministic export coordinates stay intact.
  const ordered = [...pieces].sort((a, b) => a.yIn - b.yIn || a.xIn - b.xIn);
  for (let i = 0; i < ordered.length; i++) {
    const a = ordered[i];
    const endY = a.yIn + a.heightIn;
    for (let j = i + 1; j < ordered.length; j++) {
      const b = ordered[j];
      // Every later startY is >= the current startY, so remaining pieces
      // cannot overlap this piece once the first disjoint row is reached.
      if (b.yIn >= endY - EPS) break;
      if (Math.min(a.xIn + a.widthIn, b.xIn + b.widthIn) - Math.max(a.xIn, b.xIn) > EPS &&
          Math.min(endY, b.yIn + b.heightIn) - Math.max(a.yIn, b.yIn) > EPS) return false;
    }
  }
  return true;
}
function finish(wof: number, cutPieces: Rect[], runLengthIn: number): Layout {
  const used = cutPieces.reduce((sum, p) => sum + p.widthIn * p.heightIn, 0);
  const value: Layout = { isCutFeasible: true, usableWofIn: wof, exactFabricRunLengthIn: runLengthIn,
    cutPieces, physicalOffcutAreaSqIn: Math.max(0, wof * runLengthIn - used), globallyOptimal: false };
  if (!verifyLayout(value)) throw Error('Internal geometry validation failed.');
  return value;
}
/** Safe deterministic shelf layout. Does NOT claim global optimality. */
export function layoutRectangles(usableWofIn: number, requests: PieceRequest[]): Layout {
  const F = valid(usableWofIn, 'Usable fabric width');
  if (requests.length > 100) throw Error('Maximum 100 cutting groups.');
  const cutPieces: Rect[] = [];
  let offset = 0, total = 0;
  for (const request of requests) {
    const w = valid(request.widthIn, 'Piece width'), h = valid(request.heightIn, 'Piece height');
    const count = valid(request.count, 'Piece count', true);
    if (!Number.isInteger(count)) throw Error('Piece count must be a whole number.');
    total += count;
    if (total > MAX_PIECES) throw Error('Maximum 2,000 physical pieces per cutting plan. Reduce the number of pieces or split into separate projects.');
    if (count === 0) continue;
    const options: { w: number; h: number; rotation: 0 | 90; across: number; rows: number; run: number }[] = [];
    const add = (width: number, height: number, rotation: 0 | 90) => {
      const across = Math.floor((F + EPS) / width);
      if (across >= 1) {
        const rows = Math.ceil(count / across);
        options.push({ w: width, h: height, rotation, across, rows, run: rows * height });
      }
    };
    add(w, h, 0);
    if (request.allowRotate && Math.abs(w - h) > EPS) add(h, w, 90);
    if (!options.length) return impossible(F, 'FIT_IMPOSSIBLE: a requested piece is wider than the usable fabric in every permitted grain direction.');
    options.sort((a, b) => a.run - b.run || a.rotation - b.rotation);
    const chosen = options[0];
    for (let i = 0; i < count; i++) cutPieces.push({
      xIn: (i % chosen.across) * chosen.w, yIn: offset + Math.floor(i / chosen.across) * chosen.h,
      widthIn: chosen.w, heightIn: chosen.h, grainRotationDeg: chosen.rotation,
      label: (request.label || 'Piece') + ' ' + (i + 1)
    });
    offset += chosen.run;
  }
  return finish(F, cutPieces, offset);
}
function minimumCount(span: number, wof: number, seamTakeup: number): number {
  if (seamTakeup >= wof) throw Error('Join loss must be smaller than usable WOF.');
  return Math.max(1, Math.ceil((span - seamTakeup) / (wof - seamTakeup) - EPS));
}
export function calculateBacking(input: { widthIn: number; heightIn: number; overageIn: number; wofIn: number; joinTakeupIn: number; oneWayPrint?: boolean; step?: number; shrinkageLengthPct?: number }): { targetWidthIn: number; targetHeightIn: number; options: BackingOption[]; recommended: BackingOption } {
  const W = valid(input.widthIn, 'Quilt width'), H = valid(input.heightIn, 'Quilt height');
  const O = valid(input.overageIn, 'Backing overage', true);
  const F = valid(input.wofIn, 'Usable WOF'), S = valid(input.joinTakeupIn, 'Join take-up', true);
  if (S >= F) throw Error('Join take-up must be smaller than usable fabric width.');
  const targetWidthIn = W + 2 * O, targetHeightIn = H + 2 * O;
  const directions: ('vertical' | 'horizontal')[] = input.oneWayPrint ? ['vertical'] : ['vertical', 'horizontal'];
  const options = directions.map(direction => {
    const span = direction === 'vertical' ? targetWidthIn : targetHeightIn;
    const panelLengthIn = direction === 'vertical' ? targetHeightIn : targetWidthIn;
    const panelCount = minimumCount(span, F, S);
    if(panelCount>MAX_PIECES)throw Error('Backing requires more than 2,000 panels with this usable fabric width. Choose wider fabric or smaller quilt dimensions.');
    const layout = layoutRectangles(F, [{ widthIn: F, heightIn: panelLengthIn, count: panelCount, label: 'Backing panel' }]);
    const finishedJoinedSpanIn = panelCount * F - (panelCount - 1) * S;
    // One explicit construction convention: split total join take-up equally
    // across the adjacent panel edges. Coordinates are BEFORE final trimming.
    const joinedSeamPositionsIn = Array.from({length:panelCount-1},(_,i)=>(i+1)*F-(i+0.5)*S);
    const postAssemblyTrimAreaSqIn = Math.max(0, finishedJoinedSpanIn - span) * panelLengthIn;
    return { direction, targetWidthIn, targetHeightIn, panelCount, panelLengthIn, finishedJoinedSpanIn,
      joinedSeamPositionsIn, postAssemblyTrimAreaSqIn, layout, purchase: purchase(layout.exactFabricRunLengthIn, input.step, input.shrinkageLengthPct) };
  });
  const recommended = [...options].sort((a, b) => a.purchase.roundedPurchaseYards - b.purchase.roundedPurchaseYards || a.purchase.rawPurchaseYards - b.purchase.rawPurchaseYards)[0];
  return { targetWidthIn, targetHeightIn, options, recommended };
}
export function calculateStraightBinding(input: { widthIn: number; heightIn: number; wofIn: number; stripWidthIn: number; tailAllowanceIn: number; joinLossIn: number; step?: number; shrinkageLengthPct?: number }): { requiredLengthIn: number; stripCount: number; effectiveJoinedLengthIn: number; layout: Layout; purchase: Purchase } {
  const W = valid(input.widthIn, 'Quilt width'), H = valid(input.heightIn, 'Quilt height');
  const F = valid(input.wofIn, 'Usable WOF'), strip = valid(input.stripWidthIn, 'Strip width');
  const tail = valid(input.tailAllowanceIn, 'Tail allowance', true);
  const join = valid(input.joinLossIn, 'Strip join loss', true);
  if (join >= F) throw Error('Strip join loss must be smaller than usable fabric width.');
  const requiredLengthIn = 2 * (W + H) + tail;
  const stripCount = minimumCount(requiredLengthIn, F, join);
  if(stripCount>MAX_PIECES)throw Error('Binding requires more than 2,000 strips. Choose wider fabric or smaller quilt dimensions.');
  const layout = layoutRectangles(F, [{ widthIn: F, heightIn: strip, count: stripCount, label: 'Straight-grain strip' }]);
  return { requiredLengthIn, stripCount, effectiveJoinedLengthIn: stripCount * F - (stripCount - 1) * join,
    layout, purchase: purchase(layout.exactFabricRunLengthIn, input.step, input.shrinkageLengthPct) };
}
export function calculateYardage(input: { pieceWidthIn: number; pieceHeightIn: number; count: number; wofIn: number; allowRotate?: boolean; step?: number; shrinkageLengthPct?: number }): { layout: Layout; purchase?: Purchase; across: number; rows: number } {
  const layout = layoutRectangles(input.wofIn, [{ widthIn: input.pieceWidthIn, heightIn: input.pieceHeightIn, count: input.count, allowRotate: input.allowRotate, label: 'Rectangle' }]);
  if (!layout.isCutFeasible) return { layout, across: 0, rows: 0 };
  const first = layout.cutPieces[0];
  const across = first ? Math.floor((input.wofIn + EPS) / first.widthIn) : 0;
  return { layout, purchase: purchase(layout.exactFabricRunLengthIn, input.step, input.shrinkageLengthPct),
    across, rows: first ? Math.ceil(input.count / across) : 0 };
}
export type FabricSku = { id: string; label: string; usableWidth: number; oneWayPrint: boolean; shrinkageLengthPct: number; pricePerYard?: number; pieces: PieceRequest[] };
export function calculateQuiltFabric(fabrics: FabricSku[], step = .125) {
  const seen = new Set<string>();
  const pieces = fabrics.reduce((sum,f)=>sum+f.pieces.reduce((n,p)=>n+p.count,0),0);
  if(!Number.isSafeInteger(pieces)||pieces>MAX_PIECES)throw Error('Maximum 2,000 physical fabric pieces across this project. Split large projects before calculating.');
  return fabrics.map(f => {
    if (!f.id || seen.has(f.id)) throw Error('Fabric SKUs must have unique non-empty IDs.');
    seen.add(f.id);
    const requests = f.pieces.map(p => ({ ...p, allowRotate: !f.oneWayPrint && Boolean(p.allowRotate) }));
    const layout = layoutRectangles(f.usableWidth, requests);
    const buy = layout.isCutFeasible ? purchase(layout.exactFabricRunLengthIn, step, f.shrinkageLengthPct) : undefined;
    return { fabricSku: f.id, label: f.label, layout, purchase: buy,
      priceEstimate: buy && Number.isFinite(f.pricePerYard) && (f.pricePerYard || 0) >= 0 ? buy.roundedPurchaseYards * Number(f.pricePerYard) : undefined };
  });
}
export function calculateBatting(input: { widthIn: number; heightIn: number; overageIn: number; rollWidthIn: number; rotate?: boolean; step?: number }): { isCutFeasible: boolean; message: string; layout: Layout; purchase?: Purchase } {
  const W = valid(input.widthIn, 'Quilt width') + 2 * valid(input.overageIn, 'Batting overage', true);
  const H = valid(input.heightIn, 'Quilt height') + 2 * input.overageIn;
  const layout = layoutRectangles(input.rollWidthIn, [{ widthIn: W, heightIn: H, count: 1, allowRotate: input.rotate, label: 'One-piece batting' }]);
  return { isCutFeasible: layout.isCutFeasible,
    message: layout.isCutFeasible ? 'Single-piece cut fits the supplied roll width. Batting joins are not assumed.' : 'FIT_IMPOSSIBLE: no single-piece batting cut fits this roll width; joining is not calculated.',
    layout, purchase: layout.isCutFeasible ? purchase(layout.exactFabricRunLengthIn, input.step) : undefined };
}
export type BorderLayer = { widthIn: number; sku: string; label?: string; wofIn: number; shrinkageLengthPct?: number; pricePerYard?: number };
export function calculateBorders(input: { widthIn: number; heightIn: number; seamIn: number; layers: BorderLayer[]; step?: number }) {
  let W = valid(input.widthIn, 'Quilt width'), H = valid(input.heightIn, 'Quilt height');
  const S = valid(input.seamIn, 'Seam allowance', true);
  if (input.layers.length > 5) throw Error('Maximum five border layers.');
  const layers = input.layers.map((layer, i) => {
    const b = valid(layer.widthIn, 'Border width');
    const cutWidthIn = b + 2 * S;
    const sideCutLengthIn = H + 2 * S;
    const topCutLengthIn = W + 2 * b + 2 * S;
    const layout = layoutRectangles(layer.wofIn, [
      { widthIn: cutWidthIn, heightIn: sideCutLengthIn, count: 2, label: 'Side border' },
      { widthIn: cutWidthIn, heightIn: topCutLengthIn, count: 2, label: 'Top/bottom border' }
    ]);
    W += 2 * b; H += 2 * b;
    return { layer: i + 1, sku: layer.sku, label: layer.label || 'Border ' + (i + 1),
      cutWidthIn, sideCutLengthIn, topCutLengthIn, finishedWidthIn: W, finishedHeightIn: H, layout,
      purchase: layout.isCutFeasible ? purchase(layout.exactFabricRunLengthIn, input.step, layer.shrinkageLengthPct) : undefined };
  });
  return { finishedWidthIn: W, finishedHeightIn: H, layers, method: 'Butted borders, side pieces first, using unpieced lengthwise-grain strips' };
}
export function calculateSashing(input: { rows: number; columns: number; blockWidthIn: number; blockHeightIn: number; finishedSashIn: number; seamIn: number; wofIn: number; step?: number }) {
  const R = valid(input.rows, 'Rows'), C = valid(input.columns, 'Columns');
  if (!Number.isInteger(R) || !Number.isInteger(C) || R > 100 || C > 100) throw Error('Grid counts must be whole numbers up to 100.');
  const bW = valid(input.blockWidthIn, 'Block width'), bH = valid(input.blockHeightIn, 'Block height'), sash = valid(input.finishedSashIn, 'Sashing width'), seam = valid(input.seamIn, 'Seam', true);
  const vertical = (C - 1) * R, horizontal = (R - 1) * C, cornerstones = (R - 1) * (C - 1);
  if(vertical+horizontal+cornerstones>MAX_PIECES)throw Error('This block grid needs more than 2,000 sashing and cornerstone cuts. Reduce rows or columns.');
  const stripWidth = sash + 2 * seam;
  const requests: PieceRequest[] = [
    { widthIn: stripWidth, heightIn: bH + 2 * seam, count: vertical, label: 'Vertical sashing' },
    { widthIn: stripWidth, heightIn: bW + 2 * seam, count: horizontal, label: 'Horizontal sashing' },
    { widthIn: stripWidth, heightIn: stripWidth, count: cornerstones, label: 'Cornerstone' }
  ];
  const layout = layoutRectangles(input.wofIn, requests);
  return { vertical, horizontal, cornerstones,
    finishedWidthIn: C * bW + (C - 1) * sash, finishedHeightIn: R * bH + (R - 1) * sash,
    layout, purchase: layout.isCutFeasible ? purchase(layout.exactFabricRunLengthIn, input.step) : undefined,
    construction: 'Independent sashing between adjacent blocks, with cornerstones; no outer sashing.' };
}
export function calculateWofArea(yards: number, oldWofIn: number, newWofIn: number): number {
  return valid(yards, 'Yards', true) * valid(oldWofIn, 'Original WOF') / valid(newWofIn, 'New WOF');
}
export function inchesToYards(inches: number): number { return valid(inches, 'Inches', true) / 36; }
export function yardsToInches(yards: number): number { return valid(yards, 'Yards', true) * 36; }
export function hashProject(project: unknown): string {
  const s = JSON.stringify(project);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}
