import {describe,it,expect} from 'vitest';
import {COORDINATE_PAGE_SIZE,getCutCoordinatePage} from '../src/lib/quilt/coordinate-pages';
const cuts=Array.from({length:2000},(_,i)=>({label:i===1999?'LAST PURPLE BLOCK':i%2?'Dark blue square':'Red fabric square'}));
describe('Browse all verified physical cut coordinates without hiding >45',()=>{
 it('keeps the original first 45 exactly in CSV coordinate order',()=>{
  const p=getCutCoordinatePage(cuts,'',0);
  expect(COORDINATE_PAGE_SIZE).toBe(45);
  expect(p).toMatchObject({total:2000,matching:2000,page:0,pages:45,first:1,last:45});
  expect(p.indices).toEqual(Array.from({length:45},(_,i)=>i));
 });
 it('paginates 2,000 cuts without duplicates, gaps, or reordering',()=>{
  const all:number[]=[];
  for(let n=0;n<45;n++){
   const p=getCutCoordinatePage(cuts,'',n);
   expect(p.page).toBe(n);
   expect(p.indices.length).toBeLessThanOrEqual(45);
   all.push(...p.indices);
  }
  expect(all).toHaveLength(2000);
  expect(all).toEqual(Array.from({length:2000},(_,i)=>i));
  expect(getCutCoordinatePage(cuts,'',44)).toMatchObject({first:1981,last:2000});
  expect(getCutCoordinatePage(cuts,'',9999).page).toBe(44);
  expect(getCutCoordinatePage(cuts,'',-1).page).toBe(0);
 });
 it('filters case-insensitive labels without changing global cut numbers',()=>{
  const p=getCutCoordinatePage(cuts,'PuRpLe',0);
  expect(p).toMatchObject({matching:1,total:2000,pages:1,first:1,last:1});
  expect(p.indices).toEqual([1999]);
  const many=getCutCoordinatePage(cuts,'BLUE',22);
  expect(many.matching).toBe(999);
  expect(many.page).toBe(22);
  expect(many.pages).toBe(23);
  expect(many.indices.at(-1)).toBe(1997);
  const no=getCutCoordinatePage(cuts,'not an actual cut',0);
  expect(no).toMatchObject({matching:0,page:0,pages:1,first:0,last:0,indices:[]});
 });
 it('selects global 1-based # index, not a filtered row or page-local index',()=>{
  expect(getCutCoordinatePage(cuts,'#1',0).indices).toEqual([0]);
  expect(getCutCoordinatePage(cuts,'#180',0).indices).toEqual([179]);
  expect(getCutCoordinatePage(cuts,'#181',0).indices).toEqual([180]);
  expect(getCutCoordinatePage(cuts,'#2000',0).indices).toEqual([1999]);
  expect(getCutCoordinatePage(cuts,'#2001',0).indices).toEqual([]);
  expect(getCutCoordinatePage(cuts,'#',0).indices).toEqual([]);
 });
 it('handles empty, one-element, and non-finite page values',()=>{
  expect(getCutCoordinatePage([],'',0)).toMatchObject({matching:0,pages:1,first:0,last:0});
  expect(getCutCoordinatePage([{label:'One'}],'',Infinity).indices).toEqual([0]);
  expect(getCutCoordinatePage([{label:'One'}],'',NaN).indices).toEqual([0]);
  expect(getCutCoordinatePage([{label:'One'}],'',0).pages).toBe(1);
 });
 it('rejects malformed query/size and never edits source labels',()=>{
  const before=JSON.stringify(cuts);
  expect(()=>getCutCoordinatePage(cuts,'a'.repeat(121),0)).toThrow(/120/);
  for(const size of [0,101,-1,1.5])expect(()=>getCutCoordinatePage(cuts,'',0,size)).toThrow(/page size/);
  expect(JSON.stringify(cuts)).toBe(before);
 });
});
