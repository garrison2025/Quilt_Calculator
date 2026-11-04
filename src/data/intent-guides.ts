import type {ToolId} from '../client/types';

/** Static, first-party explanations. One canonical search-intent page per calculator.
 * Worked numbers are derived from the V2 sample and the implemented formulas;
 * none are traffic forecasts, customer quotes, or physical sewing certification.
 */
export type Guide = {
  title: string; lead: string;
  sections: { heading:string; paragraphs:string[] }[];
  related: ToolId[];
};
export const guides:Record<ToolId,Guide>={
 hub:{
  title:'Build a complete quilt materials plan, not a single yardage guess',
  lead:'A quilt top, backing, batting, binding and each colored fabric are different purchases. The planner shares project dimensions, then calculates each material using its own usable width, cutting requirements and verified roll layout.',
  sections:[
   {heading:'What to measure before you start',paragraphs:[
    'Record the finished quilt-top width and height. Measure usable width of fabric (WOF) after excluding selvedges, and decide how much backing and batting overage is required for your quilting method. Enter cut dimensions—including the appropriate seam allowances—for individual top pieces.',
    'Enter separate fabrics as separate SKUs, even when colors look similar. A quantity from one fabric roll must not silently be added to a different SKU or to a batting roll.'
   ]},
   {heading:'How to read the purchasing totals',paragraphs:[
    'Exact cutting-run length is not the same as rounded purchase yardage. The planner computes a physical cutting run, adjusts length for the specified prewash shrinkage where applicable, and rounds the purchase upward once to the selected shop increment.',
    'Download the itemized shopping CSV or individual cut-list CSV to check each material. The PDF is a schematic showing measurements and coordinates—not a full-size sewing template. When the selected material cannot physically fit, no purchasing estimate should be treated as proven.'
   ]},
   {heading:'One project, several independent methods',paragraphs:[
    'Backing joins consume fabric along seams; straight-grain binding consumes length at strip joints; batting is limited to a single piece; butted borders use side strips before top and bottom strips. The specialized calculators expose their own assumptions and dimensions.',
    'The planner does not calculate diagonal backing, bias binding, mitered borders or a globally optimal mixed-shape nesting solution. These are different construction problems and require separate validated methods.'
   ]}
  ],related:['backing','fabric','binding','batting']
 },
 backing:{
  title:'How to calculate quilt backing fabric from your actual WOF',
  lead:'Backing yardage depends on finished quilt size, the allowance around it, usable bolt width, seam take-up and panel direction. An area-only estimate misses the number of panels that must be joined.',
  sections:[
   {heading:'A reproducible 60 × 80 inch backing example',paragraphs:[
    'With 4 inches of overage on each side, the backing must cover 68 × 88 inches. At 43 inches of usable WOF and 1 inch of total take-up per joined seam, two vertical panels can make a joined width of 85 inches. Cut two 88-inch lengths: 176 inches of roll length, or 4⅞ yards raw, rounded to 5 yards in eighth-yard increments.',
    'Turning the construction gives three panels, each 68 inches long: 204 inches total. That is 5⅔ yards raw, rounded to 5¾ yards. Select the shorter permitted plan; a one-way print may prohibit the alternative orientation.'
   ]},
   {heading:'What changes with 108-inch wide backing?',paragraphs:[
    'Extra-wide backing can sometimes cover the requested span with one unjoined piece. Set the measured usable width—not just the advertised bolt width—to 108 inches if that is truly available for cutting. For the 68 × 88 inch example, one panel can fit across 108 inches; check the chosen grain direction and required length.',
    'The calculator reports panel count, assembly seam positions before trimming, cutting coordinates and roll offcut separately. Extra width does not eliminate the need for quilting overage or prewash allowance.'
   ]},
   {heading:'When these numbers are not a cutting instruction',paragraphs:[
    'The built-in model handles full-width rectangular panels and straight joins. It does not model diagonal backing, pieced motifs, selvage-specific pattern matching, fabric defects, or mechanical longarm requirements. Confirm any special method before cutting.'
   ]}
  ],related:['batting','binding','hub','yardage']
 },
 binding:{
  title:'Straight-grain quilt binding: strip count and fabric yardage',
  lead:'Work from the quilt perimeter, add the intended finishing tail once, subtract the usable length consumed by diagonal strip joins, then count how many full WOF strips are required.',
  sections:[
   {heading:'Why 8 strips are needed in the worked example',paragraphs:[
    'For a 60 × 80 inch quilt the perimeter is 2 × (60 + 80) = 280 inches. Add a 12-inch finishing tail allowance for a required joined length of 292 inches. With 43-inch full-width strips and 2.5 inches lost at each join, 7 strips give only 283 inches; 8 strips give 326.5 inches.',
    'At a cut strip width of 2.5 inches, eight strips use 20 inches of fabric along the bolt. That is 20 ÷ 36 = 0.5556 yards before rounding, so an eighth-yard purchase increment gives ⅝ yard.'
   ]},
   {heading:'What the strip width does—and does not—control',paragraphs:[
    'Cut strip width controls the fabric run length across the roll. The diagonal join-loss input separately controls usable binding length. Changing strip width alone does not change the quilt perimeter or the number of joins. Enter the width you will actually cut, accounting for your preferred binding finish.',
    'These are straight-grain, full-WOF strips. Bias strips cut diagonally across fabric require a separate geometry model; do not use this calculator for bias tape or curved-edge binding.'
   ]},
   {heading:'Before you buy or cut',paragraphs:[
    'Measure the actual usable bolt width, ensure the fabric print is suitable for straight-grain strips, and check whether your join allowance differs from the sample. The result shows physical strip rectangles and rounded purchase length, rather than assuming area alone can produce the strips.'
   ]}
  ],related:['backing','yardage','hub']
 },
 borders:{
  title:'How to size side-first, butted quilt borders',
  lead:'Border strips have a finished visible width and a larger cut width that includes seam allowance. The order of sewing matters: this calculator models side borders first, then top and bottom borders.',
  sections:[
   {heading:'A 3-inch border on a 60 × 80 inch quilt',paragraphs:[
    'With a ¼-inch seam allowance, a 3-inch finished border needs a 3½-inch cut width. The two side pieces are each 80½ inches long. After the sides are attached, the quilt width grows from 60 to 66 inches; the top and bottom pieces must each be 66½ inches long.',
    'The final outside dimensions are 66 × 86 inches. For a second border layer, repeat the calculation using those new dimensions—not the original 60 × 80 inch center.'
   ]},
   {heading:'Why an impossible long strip is flagged',paragraphs:[
    'The model specifies continuous, unpieced, lengthwise-grain strips and a measured usable bolt width. Each layer gets its own physical layout and fabric SKU. A single piece that is too wide for the fabric roll is rejected rather than replaced by an invented pieced construction.',
    'Mitered corners, patterned border matching and WOF strip splicing require different cutting rules. Keep those methods outside this result unless you have validated instructions.'
   ]}
  ],related:['sashing','fabric','hub']
 },
 yardage:{
  title:'Calculate fabric yardage from cut rectangles—not only square inches',
  lead:'The fabric width is a hard geometric limit. To buy enough cloth, the calculator places the requested pieces into rows on a usable fabric roll and measures the resulting cutting run.',
  sections:[
   {heading:'20 rectangles measuring 5 × 10 inches',paragraphs:[
    'On 43-inch usable WOF, eight 5-inch-wide rectangles fit across a row. Twenty pieces therefore need three rows, each 10 inches long: 30 inches of total run, or 0.8333 yards raw, rounded to ⅞ yard with eighth-yard purchasing.',
    'If the print and grain permit a 90° turn, four 10-inch-wide pieces fit across each row, requiring five rows of 5 inches each. That is 25 inches of run, rounded to ¾ yard. Rotating is optional, never an assumption for one-way prints.'
   ]},
   {heading:'How to enter finished-size versus cut-size measurements',paragraphs:[
    'Enter the real sizes of the rectangles you intend to cut. If a finished patch is 4 × 4 inches and your construction uses ¼-inch seams on every side, the cut patch is typically 4½ × 4½ inches. A finished block size cannot be fed in unchanged as the cutting dimension.',
    'Total square inches alone do not prove a cut is feasible. Two rectangles with the same area can have very different widths and grain restrictions. The visual plan and CSV show the exact proposed placements.'
   ]}
  ],related:['fabric','inches','hub']
 },
 fabric:{
  title:'A separate cutting plan for every quilt fabric color',
  lead:'Piece dimensions, quantities, grain permissions and usable WOF belong to a specific fabric SKU. Keep those materials independent even when the pattern needs many colors.',
  sections:[
   {heading:'Example: two colors, two different fabric rolls',paragraphs:[
    'The sample blue fabric contains twelve 5 × 5 inch cut squares. On 43 inches of usable width, eight squares fit across a row, so two rows take 10 inches along that bolt. The sand fabric has eight 4½ × 8½ inch rectangles; nine could fit across 43 inches, so a single 8½-inch row covers all eight.',
    'Those runs are independent: 10 inches for blue and 8½ inches for sand. They must be rounded to shop purchasing increments separately and cannot be combined into a fictional 18½-inch roll because the colors are different.'
   ]},
   {heading:'One-way prints and prewash shrinkage',paragraphs:[
    'Disable 90° rotation for directional prints, visible fabric grain or motifs that cannot be turned. Only explicitly allowed orientations are considered. Prewash length shrinkage increases the required purchased length before shop-increment rounding.',
    'Use the cut sizes after accounting for seam allowance. If a rectangular piece cannot fit your chosen width in any permitted direction, that SKU displays an impossible-fit warning instead of an unsupported yardage suggestion.'
   ]},
   {heading:'Export a usable shop and cutting checklist',paragraphs:[
    'The shopping CSV separates rounded buying quantities, the cutting-run length and roll offcuts by SKU. The cut-list CSV shows each physical rectangle with its position on its own fabric roll. User-entered prices are estimates only, not a live retailer quote.'
   ]}
  ],related:['yardage','hub','inches']
 },
 inches:{
  title:'Fabric yard to inch chart, fractions and actual fabric size',
  lead:'A yard is a unit of length, not a universal size of cloth. One linear yard is exactly 36 inches or 91.44 centimeters along the bolt; its usable width depends on the fabric you buy.',
  sections:[
   {heading:'How big is a yard of fabric?',paragraphs:[
    'One yard of fabric measures 36 inches in the direction the bolt unwinds. If you have 43 inches of usable WOF, one linear yard is a 36 × 43 inch rectangle. Two yards have 72 inches of length, while the width remains 43 inches. Your particular bolt may be narrower or wider.',
    'A half yard is 18 inches long; a quarter yard is 9 inches long; a third of a yard is 12 inches long. A yard and a half is 54 inches long. “How much is one yard of fabric?” can also mean price, which varies by seller and material; length conversion alone cannot quote a price.'
   ]},
   {heading:'How to calculate a fraction or a mixed yard amount',paragraphs:[
    'Multiply the number of yards by 36 for inches, or by 91.44 for centimeters. For example, 5/8 × 36 = 22.5 inches; 2/3 × 36 = 24 inches; 1¼ × 36 = 45 inches. To convert inches back to yards, divide by 36. You can enter decimals, fractions or mixed fractions in the interactive converter above.',
    'Store-bought cuts are typically specified by a linear length. A “fat quarter” is cut from a different rectangle than a standard quarter-yard strip; the same linear-yard conversion does not describe the resulting shape. This table is for standard linear measurements, not fat quarters.'
   ]},
   {heading:'Can square inches be converted to fabric yards?',paragraphs:[
    'Not without a width assumption. At 43 inches of usable WOF, one linear yard contains 36 × 43 = 1,548 square inches. You could divide an area by 43 × 36 to get an area-equivalent linear-yard estimate—but that is not proof that a collection of pieces can physically fit, and it ignores grain and cutting waste.',
    'For actual quilt purchasing, use the Fabric Yardage Calculator with cut width, cut height, piece count and rotation permission. If you are calculating backing, use the separate quilt backing panel model so that seam joins and overage are included.'
   ]}
  ],related:['yardage','backing','fabric']
 },
 batting:{
  title:'Find a batting size that fits the roll in one piece',
  lead:'Batting is not automatically pieced like backing fabric. This calculator tests whether one continuous batting rectangle will fit the chosen roll width.',
  sections:[
   {heading:'Batting for a 60 × 80 inch quilt',paragraphs:[
    'If your method requires 4 inches of batting beyond every finished quilt edge, your batting must cover 68 × 88 inches. A roll with 96 inches of usable width can fit the 68-inch dimension across the roll, leaving an 88-inch run along the bolt.',
    'A 40-inch roll is too narrow in either orientation. The calculator reports FIT_IMPOSSIBLE instead of assuming that two batting pieces can be joined. A different roll width or an independently verified batting-join method is needed.'
   ]},
   {heading:'Why the backing answer may differ',paragraphs:[
    'Backing fabric can use joined rectangular panels, with seam take-up accounted for. This batting model assumes a single rectangle without joins. Batting package sizes, loft, manufacturer shrinkage and quilting-machine requirements are not inferred from fabric measurements.',
    'Enter the actual roll width or the package dimensions you plan to use, and confirm the overage with your quilting method before cutting.'
   ]}
  ],related:['backing','hub','yardage']
 },
 sashing:{
  title:'Calculate quilt sashing strips and cornerstones between blocks',
  lead:'Sashing adds finished width between blocks, while cut dimensions still need seam allowance. This tool models short independent strips between adjacent blocks, with cornerstones at grid intersections.',
  sections:[
   {heading:'Example: four rows and five columns',paragraphs:[
    'For a 4 × 5 arrangement of finished 10-inch blocks with 2-inch finished sashing, there are (5 − 1) × 4 = 16 vertical strips, (4 − 1) × 5 = 15 horizontal strips and (4 − 1) × (5 − 1) = 12 cornerstones.',
    'The finished grid measures 5 × 10 + 4 × 2 = 58 inches wide and 4 × 10 + 3 × 2 = 46 inches high. At ¼-inch seam allowance, the sashing cut width is 2½ inches; a strip next to a 10-inch block is 10½ inches long.'
   ]},
   {heading:'Which sashing construction this result represents',paragraphs:[
    'The calculator lays out the separate strips and cornerstones as actual rectangles on the usable fabric width. It does not add outer sashing around the entire grid, and it does not model long continuous rows of sashing without individual cornerstones.',
    'Count the intended blocks and joints before purchasing. If you need outer borders, send the finished grid width and height to the Border Calculator instead of counting them here twice.'
   ]}
  ],related:['borders','fabric','hub']
 }
};
export const fractionRows = [
 {label:'1/8',numerator:1,denominator:8},
 {label:'1/4',numerator:1,denominator:4},
 {label:'1/3',numerator:1,denominator:3},
 {label:'3/8',numerator:3,denominator:8},
 {label:'1/2',numerator:1,denominator:2},
 {label:'5/8',numerator:5,denominator:8},
 {label:'2/3',numerator:2,denominator:3},
 {label:'3/4',numerator:3,denominator:4},
 {label:'7/8',numerator:7,denominator:8},
 {label:'1',numerator:1,denominator:1},
 {label:'1 1/4',numerator:5,denominator:4},
 {label:'1 1/2',numerator:3,denominator:2},
 {label:'2',numerator:2,denominator:1},
 {label:'4',numerator:4,denominator:1},
] as const;
