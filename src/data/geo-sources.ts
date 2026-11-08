import type {ToolId} from '../client/types';
export type GeoSource={title:string;publisher:string;url:string;scope:string};
export const geoSources:Record<ToolId,GeoSource[]> = {
hub:[
{publisher:'American Patchwork & Quilting Editors',title:'How to Choose Quilt Backing and Calculate the Yardage',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/plan-your-quilt-back-and-determine-yardage',scope:'Explains backing overage, selvedge trimming, seam allowances and alternative panel directions. Its example allowances are not substituted for the values entered in this planner.'},
{publisher:'American Patchwork & Quilting Editors',title:'How to Cut Binding: A Step-By-Step Guide',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-cut-binding-step-step-guide',scope:'Covers perimeter measurement, straight-grain versus bias choices and strip joining. Its finishing allowance differs from the sample input used here.'},
{publisher:'Missouri Star Blog',title:'How to Figure Yardage for Quilt Borders',url:'https://www.missouriquiltco.com/blogs/missouri-star-blog/how-to-figure-yardage-for-quilt-borders',scope:'Shows side-first border measuring, seam allowances, WOF strip counts and purchase rounding. Its example width and increment differ from user-entered planner settings.'},
{publisher:'American Patchwork & Quilting Editors',title:'How to Choose the Best Batting for Your Project',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-choose-best-batting-your-project',scope:'Discusses batting fibers, loft, grain, washability and shrinkage; actual product labels and quilting requirements remain controlling.'}
],
backing:[{publisher:'American Patchwork & Quilting Editors',title:'How to Choose Quilt Backing and Calculate the Yardage',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/plan-your-quilt-back-and-determine-yardage',scope:'Explains backing overage, selvedge removal, seam allowances and panel directions. Its examples use their own assumptions; compare them with the exact overage and join-loss inputs above.'}],
binding:[
{publisher:'American Patchwork & Quilting Editors',title:'How to Cut Binding: A Step-By-Step Guide',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-cut-binding-step-step-guide',scope:'Explains perimeter measurement, straight-grain and bias binding, strip width and joining. Its suggested finishing allowance differs from this calculator’s input.'},
{publisher:'American Patchwork & Quilting Editors',title:'Binding Your Project',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/binding-your-project',scope:'Shows double-fold binding preparation and diagonal strip joins. It is construction guidance, not validation of this calculator’s strip-yield model.'}
],
borders:[
{publisher:'Missouri Star Blog',title:'How to Figure Yardage for Quilt Borders',url:'https://www.missouriquiltco.com/blogs/missouri-star-blog/how-to-figure-yardage-for-quilt-borders',scope:'Explains measuring after side borders, seam allowances, WOF strip counts and purchase rounding. Its width and rounding assumptions differ from this tool’s inputs.'},
{publisher:'American Patchwork & Quilting Editors',title:'Border and Corner Blocks',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/border-and-corner-blocks',scope:'Discusses border-strip grain direction, stability and attachment. This calculator is limited to unpieced side-first butted borders.'}
],
yardage:[
{publisher:'American Patchwork & Quilting Editors',title:'How Much Fabric Should I Buy?',url:'https://www.allpeoplequilt.com/how-to-quilt/quilting-basics/how-much-fabric-should-i-buy',scope:'Provides general quilt-fabric purchasing considerations. It is background guidance rather than a rectangular cut-layout formula; this calculator uses actual piece dimensions and usable width.'},
{publisher:'Robert Kaufman / Missouri Star pattern archive',title:'Pumpkin Fiesta Quilt Pattern (PDF)',url:'https://blog.missouriquiltco.com/wp-content/uploads/2021/07/Pumpkin-Fiesta-Pattern.pdf',scope:'A pattern example specifying WOF strip cuts and sub-cuts. Its quantities are design-specific, not universal yardage recommendations.'}
],
fabric:[
{publisher:'American Patchwork & Quilting Editors',title:'How Much Fabric Should I Buy?',url:'https://www.allpeoplequilt.com/how-to-quilt/quilting-basics/how-much-fabric-should-i-buy',scope:'Discusses choosing and purchasing fabric for quilting projects; it does not replace a per-colour cut list.'},
{publisher:'Robert Kaufman / Missouri Star pattern archive',title:'Pumpkin Fiesta Quilt Pattern (PDF)',url:'https://blog.missouriquiltco.com/wp-content/uploads/2021/07/Pumpkin-Fiesta-Pattern.pdf',scope:'Shows separate fabric instructions, WOF strip cuts and sub-cuts. It is a reference example, not validation of this calculator’s sample pattern.'}
],
inches:[{publisher:'National Institute of Standards and Technology (NIST)',title:'SI Units – Length',url:'https://www.nist.gov/pml/owm/si-units-length',scope:'Defines the international inch as exactly 25.4 mm and gives the exact yard-to-inch relationship used for linear length conversion.'}],
batting:[{publisher:'American Patchwork & Quilting Editors',title:'How to Choose the Best Batting for Your Project',url:'https://www.allpeoplequilt.com/how-to-quilt/finishing/how-to-choose-best-batting-your-project',scope:'Explains batting fibers, loft, grain, washability and shrinkage. Follow the product label; this calculator only tests a single rectangle against roll width.'}],
sashing:[
{publisher:'Missouri Star Blog',title:'Sashing in Quilting — What It Is, How to Calculate & Sew It',url:'https://www.missouriquiltco.com/blogs/missouri-star-blog/sashing-in-quilting-guide',scope:'Provides background on sashing, cornerstones, cut widths and construction variants. Its strip-count convention is not identical to this calculator’s individual-joint grid model.'},
{publisher:'AllPeopleQuilt',title:'Between the Lines Quilt Pattern',url:'https://www.allpeoplequilt.com/quilt-patterns/bed-quilts/between-lines',scope:'A worked pattern example listing separate sashing-strip dimensions and quantities; pattern-specific instructions are not a universal grid formula.'}
]
};
