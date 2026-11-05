import type {Project} from './project';

export type QuiltDimensions={
 sizeBasis:'before-borders'|'includes-borders';
 enteredWidthIn:number;enteredHeightIn:number;
 centerWidthIn:number;centerHeightIn:number;
 finalWidthIn:number;finalHeightIn:number;
 borderPerSideIn:number;
};

/** V2 compatibility contract.
 * New projects explicitly use center measurements BEFORE borders, while
 * older stored V2 projects with borders must choose their size meaning before
 * any purchase/print/cutting result can be presented as current.
 * The alternative "includes-borders" retains the entered external size
 * and subtracts border widths to obtain the center to cut.
 */
export function resolveQuiltDimensions(p:Pick<Project,'quilt'|'borders'>):QuiltDimensions{
 const enteredWidthIn=p.quilt.finishedWidth,enteredHeightIn=p.quilt.finishedHeight;
 const perSide=p.borders.reduce((total,b)=>total+b.widthIn,0);
 if(!Number.isFinite(enteredWidthIn)||!Number.isFinite(enteredHeightIn)||
    enteredWidthIn<=0||enteredHeightIn<=0||!Number.isFinite(perSide)||perSide<0)
  throw Error('Project and border dimensions must be positive, finite measurements.');
 const basis=p.quilt.sizeBasis;
 if(!basis&&p.borders.length>0)
  throw Error('SIZE BASIS NOT CONFIRMED: This saved V2 project has borders but does not say whether its entered measurements include them. Choose a dimension basis in Project measurements before calculating or exporting any purchasing amounts.');
 const effective=basis||'before-borders';
 if(effective!=='before-borders'&&effective!=='includes-borders')
  throw Error('Unsupported quilt dimension basis.');
 const centerWidthIn=effective==='before-borders'?enteredWidthIn:enteredWidthIn-2*perSide;
 const centerHeightIn=effective==='before-borders'?enteredHeightIn:enteredHeightIn-2*perSide;
 if(centerWidthIn<=0||centerHeightIn<=0)
  throw Error('BORDER FIT IMPOSSIBLE: The entered finished quilt must be wider and taller than twice the summed border widths. Change the measurements or size-basis choice before ordering.');
 const finalWidthIn=centerWidthIn+2*perSide,finalHeightIn=centerHeightIn+2*perSide;
 if(!Number.isFinite(finalWidthIn)||!Number.isFinite(finalHeightIn)||
    finalWidthIn>100000||finalHeightIn>100000)
  throw Error('Final quilt exterior exceeds the supported project dimensions.');
 return {
  sizeBasis:effective,enteredWidthIn,enteredHeightIn,
  centerWidthIn,centerHeightIn,finalWidthIn,finalHeightIn,
  borderPerSideIn:perSide
 };
}
