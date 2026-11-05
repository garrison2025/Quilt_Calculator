import type {ToolId} from '../client/types';

/** Real user tasks, not new keyword landing pages. Each task points to one
 * unique approved calculation intent so the home page is a genuine directory.
 */
export type CalculatorTask={id:ToolId;question:string;detail:string;label:string};
export const calculatorTasks:CalculatorTask[]=[
 {id:'hub',label:'Complete project',question:'I need a complete quilt calculator.',detail:'Plan backing, batting, straight binding, borders and fabric purchases in one project.'},
 {id:'backing',label:'Backing fabric',question:'How much backing fabric do I need?',detail:'Compare panel directions, seam take-up and usable bolt widths before buying.'},
 {id:'binding',label:'Straight-grain binding',question:'How many quilt binding strips?',detail:'Use perimeter, strip width, join loss and a buying increment. Not for bias binding.'},
 {id:'borders',label:'Quilt borders',question:'What size should my quilt borders be?',detail:'Calculate side-first butted border cut lengths and multiple fabric layers.'},
 {id:'yardage',label:'Fabric yardage',question:'How many yards for these cut pieces?',detail:'Fit repeated rectangular pieces across the actual width of fabric.'},
 {id:'fabric',label:'Fabric by color',question:'How much fabric for each quilt color?',detail:'Keep piece sizes, cut plans and purchases separate for each fabric SKU.'},
 {id:'inches',label:'Yards to inches',question:'How many inches in a yard of fabric?',detail:'Convert whole yards, eighths, thirds and mixed fractions precisely.'},
 {id:'batting',label:'One-piece batting',question:'Will a quilt batting piece fit my roll?',detail:'Check the required batting overage and a single continuous roll cut.'},
 {id:'sashing',label:'Sashing & cornerstones',question:'How many sashing strips do I need?',detail:'Calculate independent strips and cornerstones between quilt blocks.'}
];