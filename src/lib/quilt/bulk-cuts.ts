/**
 * Bulk entry of actual rectangle cut groups into ONE existing fabric roll.
 * CSV or Excel/Sheets TSV; no network, SKU creation, unit guessing, or
 * optimistic mutation of a user's saved project. Preview and commit rerun
 * the exact same validation against the latest accepted Project V2 state.
 */
import {MAX_PIECES,parseMeasure,toInches,type PieceRequest} from './math';
import {validateProject,type Project} from './project';

const MAX_INPUT_LENGTH=24000;

function cellsFromDelimited(input:string):string[][]{
 if(typeof input!=='string'||!input.trim())throw Error('Paste at least one cut row.');
 if(input.length>MAX_INPUT_LENGTH)throw Error('Pasted table is too long; split it into smaller batches.');
 const raw=input.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 // Spreadsheet clipboard data is tab-separated; CSV uses commas. A comma
 // inside a TSV label is not a column separator.
 const firstLine=raw.slice(0,raw.indexOf('\n')===-1?raw.length:raw.indexOf('\n'));
 const delimiter=firstLine.includes('\t')?'\t':',';
 const rows:string[][]=[];
 let cols:string[]=[],cell='',quoted=false,afterQuote=false;
 const pushCell=()=>{cols.push(cell.trim());cell='';afterQuote=false;};
 const pushRow=()=>{
  if(cols.some(value=>value!==''))rows.push(cols);
  cols=[];
  if(rows.length>102)throw Error('Maximum 100 pasted cut groups per batch (plus a header row).');
 };
 for(let i=0;i<raw.length;i++){
  const char=raw[i];
  if(quoted){
   if(char==='"'){
    if(raw[i+1]==='"'){cell+='"';i++;}
    else{quoted=false;afterQuote=true;}
   }else cell+=char;
   continue;
  }
  if(char===delimiter){pushCell();continue;}
  if(char==='\n'){pushCell();pushRow();continue;}
  if(char==='"'){
   if(cell.trim()!=='')throw Error('Unexpected quote inside an unquoted cell. Quote the entire CSV field.');
   cell='';quoted=true;continue;
  }
  if(afterQuote && char!==' ' && char!=='\t')
   throw Error('Unexpected content after a closing quote.');
  if(!afterQuote)cell+=char;
 }
 if(quoted)throw Error('Unclosed quoted CSV or spreadsheet cell.');
 if(cell!==''||cols.length){pushCell();pushRow();}
 return rows;
}
function cleanHeading(x:string):string{
 return x.toLowerCase().trim().replace(/[\s_\-()]+/g,' ');
}
function isHeader(row:string[]):boolean{
 if(row.length!==4&&row.length!==5)return false;
 const cols=row.map(cleanHeading);
 return ['label','piece label','cut label'].includes(cols[0])
  && ['cut width','width','width in','width cm'].includes(cols[1])
  && ['cut height','height','height in','height cm'].includes(cols[2])
  && ['count','quantity','qty'].includes(cols[3])
  && (cols.length===4||['rotate','allow rotation','allow rotate','rotation','allow 90 rotation'].includes(cols[4]));
}
function parseRotation(value:string,rowNumber:number):boolean{
 const s=value.trim().toLowerCase();
 if(['','no','n','false','0'].includes(s))return false;
 if(['yes','y','true','1'].includes(s))return true;
 throw Error('Row '+rowNumber+': Rotate must be Yes or No (or true/false, 1/0).');
}
export function parseBulkCutGroups(input:string,units:'in'|'cm'):PieceRequest[]{
 if(units!=='in'&&units!=='cm')throw Error('Choose inches or centimeters before pasting rows.');
 const rows=cellsFromDelimited(input);
 if(!rows.length)throw Error('Paste at least one nonempty cut row.');
 const body=isHeader(rows[0])?rows.slice(1):rows;
 if(!body.length)throw Error('A header alone cannot add any cut groups.');
 if(body.length>100)throw Error('Maximum 100 cut groups in one pasted batch.');
 let total=0;
 return body.map((cells,index)=>{
  const at=index+1+(rows.length!==body.length?1:0);
  if(cells.length!==4&&cells.length!==5)
   throw Error('Row '+at+': use 4 or 5 columns — label, cut width, cut height, count, optional rotate.');
  const [label,widthText,heightText,countText,rotate='No']=cells;
  if(!label||label.length>160||/[\n\r\t]/.test(label))
   throw Error('Row '+at+': piece label must be 1–160 characters on one line.');
  let widthIn:number,heightIn:number,count:number;
  try{widthIn=toInches(parseMeasure(widthText),units);}
  catch{throw Error('Row '+at+': invalid cut width "'+widthText.slice(0,35)+'".');}
  try{heightIn=toInches(parseMeasure(heightText),units);}
  catch{throw Error('Row '+at+': invalid cut height "'+heightText.slice(0,35)+'".');}
  if(!(widthIn>0&&widthIn<=100000&&heightIn>0&&heightIn<=100000))
   throw Error('Row '+at+': physical cut width and height must be positive and within 100,000 inches.');
  try{count=parseMeasure(countText);}
  catch{throw Error('Row '+at+': invalid cut quantity "'+countText.slice(0,35)+'".');}
  if(!Number.isInteger(count)||count<=0||count>MAX_PIECES)
   throw Error('Row '+at+': quantity must be a whole number from 1 to 2,000.');
  total+=count;
  if(total>MAX_PIECES)throw Error('Pasted cut groups exceed the 2,000 physical-piece cap.');
  return {label,widthIn,heightIn,count,allowRotate:parseRotation(rotate,at)};
 });
}
export type BulkPreview={
 project:Project;
 addedGroups:number;
 addedPieces:number;
 targetSku:string;
};
/** Add only to the selected fabric; all checks happen before the caller can
 * assign project or persist. A rejected batch never changes the input object.
 */
export function previewBulkCutAppend(source:Project,fabricIndex:number,input:string):BulkPreview{
 if(!Number.isInteger(fabricIndex)||fabricIndex<0||fabricIndex>=source.fabrics.length)
  throw Error('Choose an existing fabric SKU to receive the pasted groups.');
 const parsed=parseBulkCutGroups(input,source.units);
 const next=structuredClone(source);
 const target=next.fabrics[fabricIndex];
 target.pieces.push(...parsed);
 next.quilt.topCutsReviewed=false;
 next.quilt.topCutsReviewFingerprint=undefined;
 return {
  project:validateProject(next),
  addedGroups:parsed.length,
  addedPieces:parsed.reduce((n,p)=>n+p.count,0),
  targetSku:target.id
 };
}
