import {describe,expect,it} from 'vitest';
import {sampleProject,validateProject,quiltTopReviewFingerprint,hasCurrentQuiltTopReview} from '../src/lib/quilt/project';
import {duplicateFabricSku,duplicateFabricCutGroup} from '../src/lib/quilt/duplicate';

const source=()=>structuredClone(sampleProject);

describe('Duplicate real fabric rolls and rectangle cut groups',()=>{
 it('creates a separate new roll with the same cutting settings and a unique SKU, without changing the original',()=>{
  const p=source();
  p.fabrics[0].pricePerYard=12.5;
  p.fabrics[0].oneWayPrint=true;
  p.fabrics[0].shrinkageLengthPct=3;
  const before=structuredClone(p);
  const {project:result,index}=duplicateFabricSku(p,0);
  expect(p).toEqual(before);
  expect(index).toBe(1);
  expect(result.fabrics).toHaveLength(3);
  expect(result.fabrics[0]).toEqual(p.fabrics[0]);
  const copy=result.fabrics[1];
  expect(copy.id).toBe('sky-blue-copy');
  expect(copy.label).toBe('Sky blue copy');
  expect(copy).toMatchObject({pricePerYard:12.5,oneWayPrint:true,shrinkageLengthPct:3,usableWidth:43});
  expect(copy.pieces).toEqual(p.fabrics[0].pieces);
  copy.pieces[0].widthIn=6;
  expect(p.fabrics[0].pieces[0].widthIn).toBe(5);
  expect(result.fabrics[0].pieces[0].widthIn).toBe(5);
  expect(validateProject(result).fabrics).toHaveLength(3);
 });
 it('never reuses an existing SKU, even after multiple copies or long identifiers',()=>{
  let p=source();
  p=duplicateFabricSku(p,0).project;
  p=duplicateFabricSku(p,0).project;
  expect(p.fabrics.map(f=>f.id)).toEqual(['sky-blue','sky-blue-copy-2','sky-blue-copy','sand']);
  const long=source();long.fabrics[0].id='q'.repeat(160);
  const first=duplicateFabricSku(long,0).project;
  expect(first.fabrics[1].id.length).toBe(160);
  expect(new Set(first.fabrics.map(f=>f.id)).size).toBe(first.fabrics.length);
  expect(validateProject(first).schemaVersion).toBe(2);
 });
 it('copies just the selected cut group within the SAME fabric, preserving grain and counts',()=>{
  const p=source();p.fabrics[0].pieces[0].allowRotate=true;
  const before=structuredClone(p);
  const {project:result,index}=duplicateFabricCutGroup(p,0,0);
  expect(index).toBe(1);
  expect(p).toEqual(before);
  expect(result.fabrics).toHaveLength(2);
  expect(result.fabrics[0].pieces).toHaveLength(2);
  expect(result.fabrics[0].pieces[1]).toMatchObject({
   label:'Blue squares copy',widthIn:5,heightIn:5,count:12,allowRotate:true
  });
  expect(result.fabrics[1]).toEqual(p.fabrics[1]);
  result.fabrics[0].pieces[1].count=4;
  expect(result.fabrics[0].pieces[0].count).toBe(12);
  expect(p.fabrics[0].pieces[0].count).toBe(12);
 });
 it('revokes previous quilt-top approval immediately rather than inheriting old buying safety',()=>{
  const p=source();
  p.quilt.topCutsReviewed=true;
  p.quilt.topCutsReviewFingerprint=quiltTopReviewFingerprint(p);
  expect(hasCurrentQuiltTopReview(p)).toBe(true);
  for(const change of [()=>duplicateFabricSku(p,0),()=>duplicateFabricCutGroup(p,0,0)]){
   const {project:next}=change();
   expect(next.quilt.topCutsReviewed).toBe(false);
   expect(next.quilt.topCutsReviewFingerprint).toBeUndefined();
   expect(hasCurrentQuiltTopReview(next)).toBe(false);
  }
  expect(hasCurrentQuiltTopReview(p)).toBe(true);
 });
 it('blocks an invalid index and all hard limits without mutating any project',()=>{
  const p=source(),json=JSON.stringify(p);
  for(const bad of [-1,2,1.5,NaN])expect(()=>duplicateFabricSku(p,bad)).toThrow(/index/);
  for(const bad of [-1,99,1.2])expect(()=>duplicateFabricCutGroup(p,0,bad)).toThrow(/index/);
  expect(()=>duplicateFabricCutGroup(p,99,0)).toThrow(/index/);
  expect(JSON.stringify(p)).toBe(json);

  const full=source();
  full.fabrics=Array.from({length:30},(_,i)=>({...structuredClone(p.fabrics[0]),id:'roll-'+i}));
  expect(()=>duplicateFabricSku(full,0)).toThrow(/at most 30/);
  expect(full.fabrics).toHaveLength(30);
  const groups=source();
  groups.fabrics[0].pieces=Array.from({length:100},(_,i)=>({...p.fabrics[0].pieces[0],count:1,label:'Piece '+i}));
  expect(()=>duplicateFabricCutGroup(groups,0,0)).toThrow(/at most 100/);
  expect(groups.fabrics[0].pieces).toHaveLength(100);
  const max=source();
  max.fabrics[0].pieces[0].count=2000;
  max.fabrics[1].pieces[0].count=0;
  expect(()=>validateProject(max)).not.toThrow();
  expect(()=>duplicateFabricSku(max,0)).toThrow(/2,000/);
  expect(()=>duplicateFabricCutGroup(max,0,0)).toThrow(/2,000/);
  expect(max.fabrics[0].pieces[0].count).toBe(2000);
 });
});
