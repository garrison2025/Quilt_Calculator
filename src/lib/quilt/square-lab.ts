import {layoutRectangles, purchase, verifyLayout, type Layout, type Purchase} from './math';

/**
 * One-round square-in-a-square / on-point center: engineering PREVIEW ONLY.
 * These are conservative square-parent cuts and separately verified fabric-roll
 * rectangles. They are NOT proof of sewn corner accuracy, seam geometry or
 * successful trimming. A physical test block is required before release.
 *
 * Construction assumptions: quarter-inch seam, 1/8-inch ruler cut increments,
 * two background squares each cut ONCE diagonally to yield four HSTs.
 * This is not the two-round economy block or a foundation-paper-piecing pattern.
 */
export type SquareLabInput = {
 finishedOuterIn: number;
 blocks: number;
 centerWofIn: number;
 cornerWofIn: number;
 cornerExtraIn: number;
 stepYards?: number;
};
export type SquareLabResult = {
 method:'on-point-triangles'|'stitch-and-flip';
 finishedOuterIn: number;
 unfinishedOutsideIn: number;
 seamIn: number;
 rulerStepIn: number;
 centerCutIn: number;
 cornerSquareCutIn: number;
 intendedFinishedCenterIn: number;
 centerSquares: number;
 cornerParentSquares: number;
 resultingCornerTriangles: number;
 center: {layout: Layout; purchase?: Purchase};
 corners: {layout: Layout; purchase?: Purchase};
};
const SEAM = 0.25;
const GRID = 0.125;
const safeNumber = (value: number, name: string, min: number, max: number): number => {
 if (!Number.isFinite(value) || value < min || value > max)
  throw Error(name + ' must be between ' + min + ' and ' + max + '.');
 return value;
};
function cutCeilInches(value: number): number {
 const increments = Math.ceil(value / GRID);
 const result = increments * GRID;
 if (!Number.isFinite(result) || result < value) throw Error('Could not round the required cut size safely.');
 return result;
}
export function calculateSquareLab(input: SquareLabInput): SquareLabResult {
 const B=safeNumber(input.finishedOuterIn,'Finished outer block',2,120);
 const blocks=safeNumber(input.blocks,'Block quantity',1,200);
 if (!Number.isInteger(blocks)) throw Error('Block quantity must be a whole number.');
 const centerWof=safeNumber(input.centerWofIn,'Center usable WOF',2,120);
 const cornerWof=safeNumber(input.cornerWofIn,'Corner usable WOF',2,120);
 const extra=safeNumber(input.cornerExtraIn,'Extra corner-square cut size',0,2);
 const step=safeNumber(input.stepYards ?? .125,'Shop increment',.0625,1);
 // Cut center on the diagonal; the central visible diamond side is outer / sqrt(2).
 // Never round the center down: overcut and trim one physical test block.
 const centerCutIn=cutCeilInches(B/Math.SQRT2+2*SEAM);
 // Deliberately use an oversize HST-parent method: outside/2 + 7/8
 // at a fixed 1/4 seam, plus chosen extra length added to the SIDE of
 // each background parent square. This is a trial trim-to-size recipe.
 const cornerSquareCutIn=cutCeilInches(B/2+.875+extra);
 const center=layoutRectangles(centerWof,[{widthIn:centerCutIn,heightIn:centerCutIn,count:blocks,label:'Center parent square',allowRotate:false}]);
 const corners=layoutRectangles(cornerWof,[{widthIn:cornerSquareCutIn,heightIn:cornerSquareCutIn,count:2*blocks,label:'Background parent square (cut diagonally once)',allowRotate:false}]);
 if(center.isCutFeasible&&!verifyLayout(center))throw Error('Center cutting-roll verification failed.');
 if(corners.isCutFeasible&&!verifyLayout(corners))throw Error('Corner cutting-roll verification failed.');
 return {
  method:'on-point-triangles',
  finishedOuterIn:B,unfinishedOutsideIn:B+2*SEAM,seamIn:SEAM,rulerStepIn:GRID,
  centerCutIn,cornerSquareCutIn,
  intendedFinishedCenterIn:centerCutIn-2*SEAM,
  centerSquares:blocks,cornerParentSquares:2*blocks,resultingCornerTriangles:4*blocks,
  center:{layout:center,purchase:center.isCutFeasible?purchase(center.exactFabricRunLengthIn,step):undefined},
  corners:{layout:corners,purchase:corners.isCutFeasible?purchase(corners.exactFabricRunLengthIn,step):undefined}
 };
}

/**
 * Distinct STITCH-AND-FLIP / folded-corners construction.
 * Source: Generations Quilt Patterns and Scissortail Quilting "quick corner":
 *  - 1 BASE square (finished B + 2 * seam allowance)
 *  - 4 smaller CORNER squares (finished B / 2 + 2 * seam allowance)
 * Corner squares are sewn to the base along their marked diagonals and then
 * folded; they are NOT pre-split into the two-parent/four-triangle method.
 *
 * The optional on-point corner oversize does NOT have a corresponding
 * stitch-and-flip geometry: reject rather than silently consuming it.
 * This calculates ONLY separate parent-square roll placements, not seam
 * accuracy, sewing waste, pattern matching, or actual bulk project yield.
 */
export function calculateFoldedCornerSquareLab(input:SquareLabInput):SquareLabResult{
 const B=safeNumber(input.finishedOuterIn,'Finished outer block',2,120);
 const blocks=safeNumber(input.blocks,'Block quantity',1,200);
 if(!Number.isInteger(blocks))throw Error('Block quantity must be a whole number.');
 const centerWof=safeNumber(input.centerWofIn,'Center usable WOF',2,120);
 const cornerWof=safeNumber(input.cornerWofIn,'Corner usable WOF',2,120);
 const extra=safeNumber(input.cornerExtraIn,'Extra corner-square cut size',0,2);
 if(extra!==0)throw Error('Stitch-and-flip corners do not support the on-point oversized-triangle margin. Set extra to zero.');
 const step=safeNumber(input.stepYards??.125,'Shop increment',.0625,1);
 const centerCutIn=cutCeilInches(B+2*SEAM);
 const cornerSquareCutIn=cutCeilInches(B/2+2*SEAM);
 const center=layoutRectangles(centerWof,[{
  widthIn:centerCutIn,heightIn:centerCutIn,count:blocks,
  label:'Stitch-and-flip base square (not an on-point diamond)',allowRotate:false
 }]);
 const corners=layoutRectangles(cornerWof,[{
  widthIn:cornerSquareCutIn,heightIn:cornerSquareCutIn,count:4*blocks,
  label:'Stitch-and-flip corner square (SEW before trimming; do NOT pre-split)',allowRotate:false
 }]);
 if(center.isCutFeasible&&!verifyLayout(center))throw Error('Stitch-and-flip base roll verification failed.');
 if(corners.isCutFeasible&&!verifyLayout(corners))throw Error('Stitch-and-flip corner roll verification failed.');
 return {
  method:'stitch-and-flip',
  finishedOuterIn:B,unfinishedOutsideIn:B+2*SEAM,seamIn:SEAM,rulerStepIn:GRID,
  centerCutIn,cornerSquareCutIn,
  // The finished base side is a different measurement from the exposed
  // on-point diamond side; never present this number as the diamond size.
  intendedFinishedCenterIn:B,
  centerSquares:blocks,cornerParentSquares:4*blocks,resultingCornerTriangles:0,
  center:{layout:center,purchase:center.isCutFeasible?purchase(center.exactFabricRunLengthIn,step):undefined},
  corners:{layout:corners,purchase:corners.isCutFeasible?purchase(corners.exactFabricRunLengthIn,step):undefined}
 };
}
