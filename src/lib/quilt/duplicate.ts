/**
 * Real user workflow: copy similar rolls/cut groups without retyping them.
 *
 * Copying does NOT consolidate two rolls, certify new physical cuts or retain
 * an earlier manual quilt-top review. Both operations are atomic: a rejected
 * clone (SKU cap, group cap or 2,000 pieces) leaves the original untouched.
 */
import {validateProject,type Project} from './project';

const limit=160;
function copiedLabel(original:string|undefined):string{
 const base=(original||'Cut pieces').trim();
 return base.slice(0,limit-' copy'.length)+' copy';
}
function copiedSku(source:string,existing:readonly string[]):string{
 const occupied=new Set(existing);
 for(let n=1;n<=100000;n++){
  const suffix=n===1?'-copy':'-copy-'+n;
  const candidate=source.slice(0,limit-suffix.length)+suffix;
  if(!occupied.has(candidate))return candidate;
 }
 throw Error('No unique duplicate fabric SKU ID can be generated.');
}
function checkedIndex(index:number,length:number,kind:string):void{
 if(!Number.isInteger(index)||index<0||index>=length)throw Error('Invalid '+kind+' index.');
}
function revokeReview(project:Project):void{
 project.quilt.topCutsReviewed=false;
 project.quilt.topCutsReviewFingerprint=undefined;
}

/** Duplicate one fabric roll into a new SKU immediately after the source. */
export function duplicateFabricSku(source:Project,index:number):{project:Project;index:number}{
 checkedIndex(index,source.fabrics.length,'fabric');
 const next=structuredClone(source);
 const original=next.fabrics[index];
 const copy=structuredClone(original);
 copy.id=copiedSku(original.id,next.fabrics.map(f=>f.id));
 copy.label=copiedLabel(original.label);
 next.fabrics.splice(index+1,0,copy);
 revokeReview(next);
 return {project:validateProject(next),index:index+1};
}

/** Duplicate a rectangle group within its own roll, preserving grain rules. */
export function duplicateFabricCutGroup(source:Project,fabricIndex:number,groupIndex:number):{project:Project;index:number}{
 checkedIndex(fabricIndex,source.fabrics.length,'fabric');
 checkedIndex(groupIndex,source.fabrics[fabricIndex].pieces.length,'cut group');
 const next=structuredClone(source);
 const groups=next.fabrics[fabricIndex].pieces;
 const copy=structuredClone(groups[groupIndex]);
 copy.label=copiedLabel(copy.label);
 groups.splice(groupIndex+1,0,copy);
 revokeReview(next);
 return {project:validateProject(next),index:groupIndex+1};
}
