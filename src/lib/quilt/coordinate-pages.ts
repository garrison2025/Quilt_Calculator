/**
 * Read-only pagination/search over ALL real, verified cut coordinates.
 * This never recomputes or changes a Layout; cut indices stay 1-based and
 * consistent with the immutable cut-list CSV, even when results are filtered.
 */
export type CutCoordinatePage={
 indices:number[];
 matching:number;
 total:number;
 page:number;
 pages:number;
 first:number;
 last:number;
};
export const COORDINATE_PAGE_SIZE=45;
export function getCutCoordinatePage(
 cuts:readonly {label:string}[],
 query:string,
 requestedPage:number,
 pageSize=COORDINATE_PAGE_SIZE
):CutCoordinatePage{
 if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)
  throw Error('Coordinate table page size must be 1–100.');
 if(typeof query!=='string'||query.length>120)
  throw Error('Cut name/number search must be 120 characters or fewer.');
 const q=query.trim().normalize('NFKC').toLocaleLowerCase('en-US');
 const numberSearch=/^#([1-9][0-9]*)$/.exec(q);
 const exactIndex=numberSearch?Number(numberSearch[1]):undefined;
 // A lone # does not mean all rows. This avoids accidentally returning 2,000
 // results while someone is typing an index such as #184.
 const indices:number[]=[];
 for(let i=0;i<cuts.length;i++){
  const label=cuts[i].label;
  if(q==='' || (exactIndex!==undefined && exactIndex===i+1) ||
     (exactIndex===undefined && q!=='#' && label.normalize('NFKC').toLocaleLowerCase('en-US').includes(q))){
   indices.push(i);
  }
 }
 const matching=indices.length;
 const pages=Math.max(1,Math.ceil(matching/pageSize));
 const page=Math.min(pages-1,Math.max(0,Number.isFinite(requestedPage)?Math.trunc(requestedPage):0));
 const sliced=indices.slice(page*pageSize,(page+1)*pageSize);
 return {
  indices:sliced, matching,total:cuts.length,page,pages,
  first:matching?page*pageSize+1:0,
  last:matching?Math.min((page+1)*pageSize,matching):0
 };
}
