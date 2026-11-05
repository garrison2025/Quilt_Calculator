import { describe,expect,it } from 'vitest';
import { sampleProject,validateProject } from '../src/lib/quilt/project';
const fresh=()=>JSON.parse(JSON.stringify(sampleProject)) as Record<string,any>;
describe('Version 2 project import security and data invariants',()=>{
 it('accepts legacy yardage JSON without new directional fields and rejects bad booleans',()=>{
  const legacy=fresh();delete legacy.yardage.oneWayPrint;delete legacy.yardage.allowRotate;
  expect(validateProject(legacy).yardage.oneWayPrint).toBeUndefined();
  expect(validateProject(legacy).yardage.allowRotate).toBeUndefined();
  const modern=fresh();modern.yardage.allowRotate=true;modern.yardage.oneWayPrint=true;
  expect(validateProject(modern).yardage).toMatchObject({allowRotate:true,oneWayPrint:true});
  for(const field of ['oneWayPrint','allowRotate'])for(const invalid of ['true',1,null,{}]){
    const bad=fresh();bad.yardage[field]=invalid;
    expect(()=>validateProject(bad),field+': '+String(invalid)).toThrow();
  }
 });
 it('keeps legacy V2 project exports valid without an alternate WOF',()=>{
  const p=fresh();delete p.yardage.alternateWof;
  expect(validateProject(p).yardage.alternateWof).toBeUndefined();
 });
 it('validates an optional alternate WOF for physical-cut comparison',()=>{
  const p=fresh();p.yardage.alternateWof=50;
  expect(validateProject(p).yardage.alternateWof).toBe(50);
  for(const invalid of [0,-1,'forty',null,100001]){
   const bad=fresh();bad.yardage.alternateWof=invalid;
   expect(()=>validateProject(bad),'Reject alternate WOF '+String(invalid)).toThrow();
  }
 });
 it('rejects unknown V2 keys at every nested object level',()=>{
  const mutations: Array<[string,(p:Record<string,any>)=>void]>=[
   ['root',p=>{p.schemaVersion2=2;}],
   ['quilt',p=>{p.quilt.width=10;}],
   ['options',p=>{p.options.roundingStep=.125;}],
   ['yardage',p=>{p.yardage.pieceCount=15;}],
   ['sashing',p=>{p.sashing.rowCount=4;}],
   ['border',p=>{p.borders[0].count=4;}],
   ['fabric',p=>{p.fabrics[0].rollLength=100;}],
   ['piece',p=>{p.fabrics[0].pieces[0].w=10;}]
  ];
  for(const [scope,mutate] of mutations){
   const project=fresh();mutate(project);
   expect(()=>validateProject(project),scope).toThrow(/not a supported V2 project field/);
  }
 });
 it('rejects JSON null optional strings instead of accepting schema-invalid labels',()=>{
  const project=fresh();project.borders[0].label=null;
  expect(()=>validateProject(project)).toThrow(/valid label/);
  const fabric=fresh();fabric.fabrics[0].pieces[0].label=null;
  expect(()=>validateProject(fabric)).toThrow(/valid label/);
 });
 it('accepts the original sample and preserves version 2',()=>expect(validateProject(fresh()).schemaVersion).toBe(2));
 it('rejects a numeric field supplied as text',()=>{const p=fresh();p.options.usableWof='forty';expect(()=>validateProject(p)).toThrow();});
 it('rejects a missing Boolean grain flag',()=>{const p=fresh();delete p.options.oneWayPrint;expect(()=>validateProject(p)).toThrow();});
 it('rejects impossible negative sizes',()=>{const p=fresh();p.quilt.finishedWidth=-3;expect(()=>validateProject(p)).toThrow();});
 it('rejects noninteger piece counts',()=>{const p=fresh();p.fabrics[0].pieces[0].count=2.5;expect(()=>validateProject(p)).toThrow();});
 it('rejects shrinkage of 100%',()=>{const p=fresh();p.fabrics[0].shrinkageLengthPct=100;expect(()=>validateProject(p)).toThrow();});
 it('rejects duplicate fabric SKUs',()=>{const p=fresh();p.fabrics[1].id=p.fabrics[0].id;expect(()=>validateProject(p)).toThrow();});
 it('rejects duplicate border SKUs',()=>{const p=fresh();p.borders.push({...p.borders[0]});expect(()=>validateProject(p)).toThrow();});
 it('rejects unsupported project schema versions',()=>{const p=fresh();p.schemaVersion=1;expect(()=>validateProject(p)).toThrow();});
 it('supports valid centimeter display preferences while storing normalized measures',()=>{const p=fresh();p.units='cm';expect(validateProject(p).units).toBe('cm');});
});
