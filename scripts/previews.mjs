import fs from 'node:fs/promises';
import sharp from 'sharp';
const ids=['hub','backing','binding','borders','yardage','fabric','inches','batting','sashing'];
await fs.mkdir('public/images',{recursive:true});
for(const [i,id] of ids.entries()){
 const rect=[];
 const colors=['#d8b77d','#b3cbbd','#6d9c86','#8bb3aa','#d4d6bf','#d6a5a1'];
 for(let r=0;r<5;r++)for(let c=0;c<8;c++)rect.push('<rect x="'+(50+c*67)+'" y="'+(49+r*58)+'" width="63" height="54" rx="3" fill="'+colors[(r+c*2+i)%colors.length]+'" stroke="#f8f6f1" stroke-width="3"/>');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" rx="18" fill="#e9ebe1"/>'+rect.join('')+'<g fill="#315b50" font-family="sans-serif"><text x="48" y="30" font-size="11" font-weight="bold">USABLE FABRIC WIDTH · CUTTING PLAN</text><text x="50" y="381" font-size="17">'+id.toUpperCase()+' · QUILT STUDIO</text><text x="50" y="402" font-size="10">Illustration, not a full-size sewing template</text></g></svg>';
 await sharp(Buffer.from(svg)).webp({quality:82}).toFile('public/images/'+id+'.webp');
}
