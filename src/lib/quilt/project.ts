import { MAX_PIECES, type FabricSku, type BorderLayer } from './math';
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
function object(value: unknown, name: string): Record<string, unknown> {
 if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(name + ' must be a JSON object.');
 return value as Record<string, unknown>;
}
function numeric(o: Record<string, unknown>, key: string, name: string, min = 0, max = 100000, integer = false, exclusiveMin = false): number {
 const v = o[key];
 if (typeof v !== 'number' || !Number.isFinite(v) || (exclusiveMin ? v <= min : v < min) || v > max || (integer && !Number.isInteger(v)))
  throw Error(name + '.' + key + ' must be a valid ' + (integer ? 'whole number' : 'number') + '.');
 return v;
}
function bool(o: Record<string, unknown>, key: string, name: string): void {
 if (typeof o[key] !== 'boolean') throw Error(name + '.' + key + ' must be true or false.');
}
function str(o: Record<string, unknown>, key: string, name: string, required = true): void {
 const v = o[key];
 if ((v === undefined || v === null) && !required) return;
 if (typeof v !== 'string' || (required && v.trim().length === 0) || v.length > 160) throw Error(name + '.' + key + ' must be a valid label.');
}
function array(value: unknown, name: string, max: number): unknown[] {
 if (!Array.isArray(value) || value.length > max) throw Error(name + ' must be an array with at most ' + max + ' items.');
 return value;
}
function shrink(o: Record<string, unknown>, key: string, name: string, optional = false): void {
 if (optional && o[key] === undefined) return;
 const n = numeric(o, key, name);
 if (n >= 100) throw Error(name + '.' + key + ' must be less than 100 percent.');
}
/** Strict JSON-import boundary; physics and WOF constraints remain separately enforced by each calculator. */
export function validateProject(data: unknown): Project {
 const root = object(data, 'Project');
 if (root.schemaVersion !== 2 || (root.units !== 'in' && root.units !== 'cm'))
  throw Error('Expected schemaVersion 2 and units "in" or "cm".');
 const quilt = object(root.quilt, 'quilt');
 numeric(quilt, 'finishedWidth', 'quilt', 0, 100000, false, true);
 numeric(quilt, 'finishedHeight', 'quilt', 0, 100000, false, true);
 const opts = object(root.options, 'options');
 for (const name of ['overage','joinTakeup','tailAllowance','stripJoinLoss','seam','battingOverage'])
  numeric(opts,name,'options');
 for (const name of ['usableWof','battingWof','stripWidth','step'])
  numeric(opts,name,'options',0,100000,false,true);
 shrink(opts,'lengthShrinkage','options');
 bool(opts,'oneWayPrint','options');bool(opts,'allowRotate','options');
 const yardage = object(root.yardage, 'yardage');
 numeric(yardage,'pieceWidth','yardage',0,100000,false,true);
 numeric(yardage,'pieceHeight','yardage',0,100000,false,true);
 numeric(yardage,'count','yardage',0,2000,true);
 const sash = object(root.sashing, 'sashing');
 for (const name of ['rows','columns']) numeric(sash,name,'sashing',1,100,true);
 for (const name of ['blockWidth','blockHeight','width']) numeric(sash,name,'sashing',0,100000,false,true);
 const borders = array(root.borders,'borders',5);
 const borderIds = new Set<string>();
 for (const [i,v] of borders.entries()){
  const b=object(v,'borders['+i+']'),tag='borders['+i+']';
  str(b,'sku',tag);str(b,'label',tag,false);
  const id=b.sku as string;
  if (borderIds.has(id)) throw Error('Border SKU IDs must be unique for independent purchasing.');
  borderIds.add(id);
  numeric(b,'widthIn',tag,0,100000,false,true);
  numeric(b,'wofIn',tag,0,100000,false,true);
  shrink(b,'shrinkageLengthPct',tag,true);
  if (b.pricePerYard!==undefined) numeric(b,'pricePerYard',tag);
 }
 const fabrics = array(root.fabrics,'fabrics',30);
 const ids = new Set<string>();
 let totalFabricPieces=0;
 for (const [i,v] of fabrics.entries()){
  const f=object(v,'fabrics['+i+']'),tag='fabrics['+i+']';
  str(f,'id',tag);str(f,'label',tag);
  const id=f.id as string;
  if(ids.has(id))throw Error('Duplicate fabric SKU ID: '+id);
  ids.add(id);
  numeric(f,'usableWidth',tag,0,100000,false,true);
  bool(f,'oneWayPrint',tag);
  shrink(f,'shrinkageLengthPct',tag);
  if(f.pricePerYard!==undefined)numeric(f,'pricePerYard',tag);
  for(const [j,vp] of array(f.pieces,tag+'.pieces',100).entries()){
   const piece=object(vp,tag+'.pieces['+j+']'),part=tag+'.pieces['+j+']';
   numeric(piece,'widthIn',part,0,100000,false,true);
   numeric(piece,'heightIn',part,0,100000,false,true);
   totalFabricPieces+=numeric(piece,'count',part,0,MAX_PIECES,true);
   if(totalFabricPieces>MAX_PIECES)throw Error('Maximum 2,000 physical fabric pieces across all SKUs. Reduce quantities or split into multiple projects.');
   str(piece,'label',part,false);
   if(piece.allowRotate!==undefined)bool(piece,'allowRotate',part);
  }
 }
 return structuredClone(data as Project);
}
