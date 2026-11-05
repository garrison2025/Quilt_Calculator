import fs from 'node:fs/promises';
import sharp from 'sharp';
import ts from 'typescript';

/** Every social illustration is generated from the same independently tested
 * numeric calculator functions used by the actual cutting UI. No invented
 * layouts or identical placeholder mosaics are presented as worked examples.
 * These are SCHEMATIC previews, NOT 1:1 cutting templates.
 * Use DIRECT TypeScript dependency, not Astro's private esbuild dependency.
 * This also lets the build run against future Astro major versions. */
async function compileDataModule(file,imports={}){
 const source=await fs.readFile(file,'utf8');
 const compiled=ts.transpileModule(source,{
  fileName:file,
  compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}
 });
 let js=compiled.outputText;
 for(const [relative,url] of Object.entries(imports)){
  const a="from '"+relative+"'",b="from '"+url+"'";
  if(js.includes(a))js=js.replaceAll(a,b);
  else{
   const double='from "'+relative+'"';
   if(!js.includes(double))throw Error('Expected engine dependency missing: '+relative);
   js=js.replaceAll(double,b);
  }
 }
 return 'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
}
const mathUrl=await compileDataModule('src/lib/quilt/math.ts');
const projectUrl=await compileDataModule('src/lib/quilt/project.ts',{'./math':mathUrl});
const [math,projectModule]=await Promise.all([import(mathUrl),import(projectUrl)]);
const p=projectModule.sampleProject,o=p.options;
const border=math.calculateBorders({
 widthIn:p.quilt.finishedWidth,heightIn:p.quilt.finishedHeight,
 seamIn:o.seam,layers:p.borders,step:o.step
});
const width=border.finishedWidthIn,height=border.finishedHeightIn;
const args={step:o.step,shrinkageLengthPct:o.lengthShrinkage};
const backing=math.calculateBacking({
 widthIn:width,heightIn:height,overageIn:o.overage,wofIn:o.usableWof,
 joinTakeupIn:o.joinTakeup,oneWayPrint:o.oneWayPrint,...args
});
const binding=math.calculateStraightBinding({
 widthIn:width,heightIn:height,wofIn:o.usableWof,stripWidthIn:o.stripWidth,
 tailAllowanceIn:o.tailAllowance,joinLossIn:o.stripJoinLoss,...args
});
const batting=math.calculateBatting({
 widthIn:width,heightIn:height,overageIn:o.battingOverage,
 rollWidthIn:o.battingWof,rotate:o.allowRotate,step:o.step
});
const yardage=math.calculateYardage({
 pieceWidthIn:p.yardage.pieceWidth,pieceHeightIn:p.yardage.pieceHeight,
 count:p.yardage.count,wofIn:o.usableWof,
 allowRotate:p.yardage.allowRotate??o.allowRotate,
 oneWayPrint:p.yardage.oneWayPrint??false,...args
});
const fabrics=math.calculateQuiltFabric(p.fabrics,o.step);
const sash=math.calculateSashing({
 rows:p.sashing.rows,columns:p.sashing.columns,
 blockWidthIn:p.sashing.blockWidth,blockHeightIn:p.sashing.blockHeight,
 finishedSashIn:p.sashing.width,seamIn:o.seam,wofIn:o.usableWof,step:o.step
});
const cases=[
 ['hub','WHOLE-QUILT PLAN','66 × 86 in finished top',backing.recommended.layout],
 ['backing','BACKING FABRIC','74 × 94 in coverage',backing.recommended.layout],
 ['binding','STRAIGHT-GRAIN BINDING',binding.stripCount+' full-WOF strips',binding.layout],
 ['borders','BORDER STRIPS','3 in finished width',border.layers[0].layout],
 ['yardage','RECTANGLE YARDAGE',p.yardage.count+' entered pieces',yardage.layout],
 ['fabric','FABRIC SKU · SKY BLUE','12 cut squares',fabrics[0].layout],
 ['inches','FABRIC LENGTH CONVERSION','1 yard = 36 inches',null],
 ['batting','ONE-PIECE BATTING','74 × 94 in coverage',batting.layout],
 ['sashing','SASHING & CORNERSTONES',p.sashing.rows+' × '+p.sashing.columns+' block grid',sash.layout]
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const format=n=>Number(n.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2});
function drawLayout(layout){
 if(!layout?.isCutFeasible)throw Error('No feasible preview layout for example: '+layout?.error);
 const rx=layout.exactFabricRunLengthIn,rw=layout.usableWofIn;
 if(rx<=0||rw<=0||layout.cutPieces.length===0)throw Error('Preview has no actual pieces');
 const x0=59,y0=106,w=522,h=220;
 const colors=['#b6d6c5','#d7c59b','#91b7ab','#d8aaa3','#a8c7bb','#e4d2b0'];
 const pieces=layout.cutPieces.slice(0,110).map((cut,i)=>{
  const x=x0+cut.yIn/rx*w,y=y0+cut.xIn/rw*h;
  const width=cut.heightIn/rx*w,height=cut.widthIn/rw*h;
  if(![x,y,width,height].every(Number.isFinite))throw Error('Invalid preview cut coordinates');
  const label=width>25&&height>15?'<text x="'+format(x+5)+'" y="'+format(y+Math.min(18,height-4))+'" fill="#264b3e" font-size="11" font-weight="bold">'+(i+1)+'</text>':'';
  return '<rect x="'+format(x)+'" y="'+format(y)+'" width="'+format(width)+'" height="'+format(height)+'" fill="'+colors[i%colors.length]+'" stroke="#446d59" stroke-width=".85"/>'+label;
 }).join('');
 return '<rect x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+h+'" rx="4" fill="#fffef9" stroke="#7a9d87" stroke-width="2"/>'+
  pieces+
  '<text x="'+x0+'" y="345" fill="#4b6757" font-size="13">Usable fabric width: '+format(rw)+' in · Roll run: '+format(rx)+' in · '+layout.cutPieces.length+' cuts</text>';
}
function drawInches(){
 const entries=[['⅛ yd','4.5 in'],['¼ yd','9 in'],['½ yd','18 in'],['¾ yd','27 in'],['1 yd','36 in']];
 return entries.map(([left,right],i)=>{
  const x=50+i*110;return '<rect x="'+x+'" y="120" width="100" height="160" rx="6" fill="'+(i%2?'#d8e9da':'#f4e6ce')+'" stroke="#91ad9a"/>'+
   '<text x="'+(x+50)+'" y="188" text-anchor="middle" fill="#285443" font-size="17" font-weight="bold">'+left+'</text>'+
   '<text x="'+(x+50)+'" y="219" text-anchor="middle" fill="#285443" font-size="15">'+right+'</text>';
 }).join('');
}
await fs.mkdir('public/images',{recursive:true});
for(const [id,title,detail,layout] of cases){
 const geometry=layout?drawLayout(layout):drawInches();
 const img='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">'+
 '<rect width="640" height="420" rx="17" fill="#eef3e8"/>'+
 '<rect x="26" y="22" width="588" height="374" rx="12" fill="#fffdf9" stroke="#d3dfd3"/>'+
 '<text x="50" y="54" fill="#245541" font-size="21" font-family="Georgia,serif">'+esc(title)+'</text>'+
 '<text x="50" y="80" fill="#50705b" font-size="13" font-family="sans-serif">'+esc(detail)+'</text>'+
 geometry+
 '<text x="50" y="382" fill="#65806c" font-size="11" font-family="sans-serif">'+
 'CALCULATED FROM SITE EXAMPLE · SCHEMATIC, NOT 1:1</text></svg>';
 await sharp(Buffer.from(img)).webp({quality:83}).toFile('public/images/'+id+'.webp');
 console.log('Verified calculated illustration: '+id+(layout?' · '+layout.cutPieces.length+' physical rectangles':' · exact length conversion'));
}
