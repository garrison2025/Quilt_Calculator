import {expect, it} from 'vitest';
import {loadProject, sampleProject, validateProject} from '../src/lib/quilt/project';

it('migrates the previous shared fabric settings and preserves explicit zero shrinkage', () => {
 const legacy=structuredClone(sampleProject);
 delete legacy.yardage.usableWof;
 delete legacy.yardage.lengthShrinkage;
 delete legacy.sashing.usableWof;
 Object.assign(legacy.options,{usableWof:48,lengthShrinkage:5});
 const project=loadProject(legacy);
 Object.assign(project.options,{usableWof:108,lengthShrinkage:20});
 expect(project.yardage.usableWof).toBe(48);
 expect(project.yardage.lengthShrinkage).toBe(5);
 expect(project.sashing.usableWof).toBe(48);
 project.yardage.lengthShrinkage=0;
 expect(loadProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
});

it('rejects unusable material widths and shrinkage', () => {
 const project=structuredClone(sampleProject);
 expect(() => validateProject({...project,yardage:{...project.yardage,usableWof:0}})).toThrow('yardage.usableWof');
 expect(() => validateProject({...project,yardage:{...project.yardage,lengthShrinkage:100}})).toThrow('yardage.lengthShrinkage');
 expect(() => validateProject({...project,sashing:{...project.sashing,usableWof:0}})).toThrow('sashing.usableWof');
});
