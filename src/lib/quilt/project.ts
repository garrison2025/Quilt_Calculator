import type { FabricSku, BorderLayer } from './math';
export type Project = { schemaVersion: 2; units: 'in' | 'cm'; quilt: { finishedWidth: number; finishedHeight: number };
  options: { overage: number; usableWof: number; battingWof: number; joinTakeup: number; stripWidth: number; tailAllowance: number; stripJoinLoss: number; step: number; lengthShrinkage: number; oneWayPrint: boolean; seam: number; battingOverage: number; allowRotate: boolean };
  yardage: { pieceWidth: number; pieceHeight: number; count: number };
  sashing: { rows: number; columns: number; blockWidth: number; blockHeight: number; width: number };
  borders: BorderLayer[]; fabrics: FabricSku[] };
export const sampleProject: Project = {
  schemaVersion: 2, units: 'in', quilt: { finishedWidth: 60, finishedHeight: 80 },
  options: { overage: 4, usableWof: 43, battingWof: 96, joinTakeup: 1, stripWidth: 2.5,
    tailAllowance: 12, stripJoinLoss: 2.5, step: .125, lengthShrinkage: 0, oneWayPrint: false,
    seam: .25, battingOverage: 4, allowRotate: false },
  yardage: { pieceWidth: 5, pieceHeight: 10, count: 20 },
  sashing: { rows: 4, columns: 5, blockWidth: 10, blockHeight: 10, width: 2 },
  borders: [{ sku: 'border-indigo', label: 'Indigo border', widthIn: 3, wofIn: 43, shrinkageLengthPct: 0 }],
  fabrics: [{ id: 'sky-blue', label: 'Sky blue', usableWidth: 43, oneWayPrint: false, shrinkageLengthPct: 0,
    pieces: [{ widthIn: 5, heightIn: 5, count: 12, label: 'Blue squares', allowRotate: false }] },
    { id: 'sand', label: 'Sand', usableWidth: 43, oneWayPrint: false, shrinkageLengthPct: 0,
    pieces: [{ widthIn: 4.5, heightIn: 8.5, count: 8, label: 'Sand blocks', allowRotate: false }] }]
};
export function validateProject(data: unknown): Project {
  if (!data || typeof data !== 'object') throw Error('Project must be a JSON object.');
  const p = data as Project;
  if (p.schemaVersion !== 2 || (p.units !== 'in' && p.units !== 'cm')) throw Error('Expected schemaVersion 2 and units in/cm.');
  if (!p.quilt || !p.options || !p.yardage || !p.sashing || !Array.isArray(p.borders) || !Array.isArray(p.fabrics)) throw Error('Missing required project fields.');
  if (p.fabrics.length > 30 || p.borders.length > 5) throw Error('Too many fabrics or borders.');
  const all = [p.quilt.finishedWidth, p.quilt.finishedHeight, ...Object.entries(p.options).filter(([, v]) => typeof v === 'number').map(([, v]) => v as number),
    p.yardage.pieceWidth, p.yardage.pieceHeight, p.yardage.count, ...p.fabrics.flatMap(f => [f.usableWidth, f.shrinkageLengthPct, ...f.pieces.flatMap(x => [x.widthIn, x.heightIn, x.count])]),
    ...p.borders.flatMap(b => [b.widthIn, b.wofIn])];
  if (all.some(v => typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100000)) throw Error('All dimensions must be finite, nonnegative numbers.');
  if (p.fabrics.some(f => !f.id || typeof f.id !== 'string' || !Array.isArray(f.pieces)) || new Set(p.fabrics.map(f => f.id)).size !== p.fabrics.length) throw Error('Invalid or duplicate fabric SKUs.');
  if (p.fabrics.some(f => f.pieces.length > 100 || f.pieces.some(piece => !Number.isInteger(piece.count))) || !Number.isInteger(p.yardage.count)) throw Error('Invalid piece quantities.');
  return structuredClone(p);
}
