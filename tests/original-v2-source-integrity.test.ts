import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
/** Ensure recovered original V2 workbook material cannot silently diverge from
 * the JSON consumed by the execution tests. Source historical NOT_RUN values
 * remain untouched; execution evidence is reported separately by current CI.
 */
function csvRows(file:string):string[][]{
 const s=readFileSync('docs/data/reference/'+file,'utf8');
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(quoted){
   if(c==='"'&&s[i+1]==='"'){field+='"';i++;}
   else if(c==='"')quoted=false;
   else field+=c;
  }else if(c==='"')quoted=true;
  else if(c===','){row.push(field);field='';}
  else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}
  else if(c!=='\r')field+=c;
 }
 if(quoted)throw Error('Unterminated original CSV quote: '+file);
 if(row.length||field){row.push(field);rows.push(row);}
 return rows;
}
describe('preserve full V2 original workbook provenance after reconstruction',()=>{
 const gold=csvRows('V2_Golden_Fixtures_39.csv');
 const props=csvRows('V2_Property_Test_Plan_24.csv');
 const gates=csvRows('V2_Release_Gates_47.csv');
 const json=JSON.parse(readFileSync('docs/data/reference/V2_Golden_Fixtures_39.json','utf8')) as
  {id:string;module:string;scenario:string;input:unknown;expected:unknown;
   source_reference_status:string;original_engine_status:string;notes:string}[];
 it('keeps all original worksheet row and column counts',()=>{
  expect(gold).toHaveLength(40);expect(props).toHaveLength(25);expect(gates).toHaveLength(48);
  expect(gold[0]).toHaveLength(8);expect(props[0]).toHaveLength(5);expect(gates[0]).toHaveLength(8);
  expect(gold[0][0]).toBe('用例ID');expect(props[0][0]).toBe('编号');expect(gates[0][1]).toBe('门禁');
 });
 it('matches all 39 parsed JSON fixtures to unmodified original CSV cells',()=>{
  expect(json).toHaveLength(39);
  for(const [i,row] of gold.slice(1).entries()){
   const j=json[i];
   expect(row).toHaveLength(8);
   expect([j.id,j.module,j.scenario,j.source_reference_status,j.original_engine_status,j.notes])
    .toEqual([row[0],row[1],row[2],row[5],row[6],row[7]]);
   expect(j.input).toEqual(JSON.parse(row[3]));
   expect(j.expected).toEqual(JSON.parse(row[4]));
   expect(j.original_engine_status).toBe('NOT_RUN');
  }
 });
 it('retains 24 original property requirements with historical NOT_RUN status',()=>{
  expect(props.slice(1).map(row=>Number(row[0]))).toEqual(Array.from({length:24},(_,i)=>i+1));
  for(const row of props.slice(1)){expect(row).toHaveLength(5);expect(row[4]).toBe('NOT_RUN');}
 });
 it('retains all 47 original G0-G4 release gates with historical NOT_RUN status',()=>{
  expect(gates.slice(1).map(row=>Number(row[0]))).toEqual(Array.from({length:47},(_,i)=>i+1));
  const groups=new Set(gates.slice(1).map(row=>row[1]));
  expect(groups).toEqual(new Set(['G0','G1','G2','G3','G4']));
  for(const row of gates.slice(1)){expect(row).toHaveLength(8);expect(row[5]).toBe('NOT_RUN');}
 });
});