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
  finishedOuterIn:B,unfinishedOutsideIn:B+2*SEAM,seamIn:SEAM,rulerStepIn:GRID,
  centerCutIn,cornerSquareCutIn,
  intendedFinishedCenterIn:centerCutIn-2*SEAM,
  centerSquares:blocks,cornerParentSquares:2*blocks,resultingCornerTriangles:4*blocks,
  center:{layout:center,purchase:center.isCutFeasible?purchase(center.exactFabricRunLengthIn,step):undefined},
  corners:{layout:corners,purchase:corners.isCutFeasible?purchase(corners.exactFabricRunLengthIn,step):undefined}
 };
}
