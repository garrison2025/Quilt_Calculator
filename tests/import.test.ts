import { describe,expect,it } from 'vitest';
import { sampleProject,validateProject } from '../src/lib/quilt/project';
const fresh=()=>JSON.parse(JSON.stringify(sampleProject)) as Record<string,any>;
describe('Version 2 project import security and data invariants',()=>{
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
