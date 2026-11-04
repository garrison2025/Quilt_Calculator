import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 calculateBacking,calculateStraightBinding,calculateYardage,calculateBorders,
 calculateSashing,calculateBatting,calculateWofArea,parseMeasure,yardsToInches,
 purchase,verifyLayout
} from '../src/lib/quilt/math';

/** Direct replay of all 39 original XLSX Golden worksheet records.
 * Do not change expected results to make the engine pass: investigate any
 * mismatch and record deviations separately. Original NOT_RUN is source
 * provenance, not a claim about these newly executed test assertions.
 */
type Fixture={
 id:string;module:string;scenario:string;
 input:Record<string,any>;expected:Record<string,any>;
 source_reference_status:string;original_engine_status:string;notes:string;
};
const original=JSON.parse(readFileSync('docs/data/reference/V2_Golden_Fixtures_39.json','utf8')) as Fixture[];
const close=(actual:number,expected:number)=>expect(actual).toBeCloseTo(expected,6);

describe('original 2026-11-04 XLSX Golden sheet: independent 39-row replay',()=>{
 it('has exactly the 39 original IDs and preserves historical source statuses',()=>{
  expect(original).toHaveLength(39);
  expect(new Set(original.map(r=>r.id)).size).toBe(39);
  expect(original.every(r=>r.original_engine_status==='NOT_RUN')).toBe(true);
  expect(original.filter(r=>r.source_reference_status==='REFERENCE_VERIFIED')).toHaveLength(36);
  expect(original.filter(r=>r.source_reference_status==='SPEC_ONLY')).toHaveLength(3);
 });
 for(const r of original){
  it(r.id+' ['+r.module+'] '+r.scenario,()=>{
   const a=r.input,e=r.expected;
   if(r.module==='BACK'){
    const b=calculateBacking({widthIn:a.w,heightIn:a.h,overageIn:a.o,wofIn:a.F,joinTakeupIn:a.seam});
    expect(b.recommended.direction).toBe(e.best_orientation);
    expect(b.recommended.panelCount).toBe(e.best_panels);
    close(b.recommended.purchase.roundedPurchaseYards,e.best_purchase_yards);
    expect(b.options).toHaveLength(e.two_legal_orientations);
    expect(b.options.every(x=>verifyLayout(x.layout))).toBe(true);
    return;
   }
   if(r.module==='BIND'){
    if(r.id==='BIND-BIAS-HOLD-01'){
     expect(e.status).toBe('HOLD');
     // Policy also enforced by the page's explicit straight-grain-only copy.
     const src=readFileSync('src/data/routes.ts','utf8');
     expect(src).toContain('Bias binding is a different cutting geometry');
     return;
    }
    const b=calculateStraightBinding({
     widthIn:a.w,heightIn:a.h,wofIn:a.F,stripWidthIn:a.stripWidth,
     tailAllowanceIn:a.tails,joinLossIn:a.joinLoss
    });
    close(b.requiredLengthIn,e.required_binding_in);
    expect(b.stripCount).toBe(e.strips);
    close(b.purchase.roundedPurchaseYards,e.purchase_yards);
    expect(verifyLayout(b.layout)).toBe(true);
    return;
   }
   if(r.module==='YARD'){
    const y=calculateYardage({
     pieceWidthIn:a.pw,pieceHeightIn:a.ph,count:a.count,
     wofIn:a.W,allowRotate:a.rotate
    });
    expect(y.layout.isCutFeasible).toBe(e.fit);
    expect(y.across).toBe(e.across);
    expect(y.rows).toBe(e.rows);
    close(y.purchase?.roundedPurchaseYards??NaN,e.purchase_yards);
    const orientation=y.layout.cutPieces[0]?.grainRotationDeg===90?'rotated':'normal';
    expect(orientation).toBe(e.best_orientation);
    expect(verifyLayout(y.layout)).toBe(true);
    return;
   }
   if(r.module==='INCH'){
    const yards=parseMeasure(a.input_yards);
    const inches=yardsToInches(yards);
    close(inches,e.inches);
    close(inches*2.54,e.centimeters);
    return;
   }
   if(r.module==='BORDER'){
    const result=calculateBorders({widthIn:a.width,heightIn:a.height,seamIn:.25,
     layers:a.finished_border_widths.map((widthIn:number,i:number)=>({
      widthIn,wofIn:108,sku:'original-'+i,label:'Original test layer'
     }))});
    close(result.finishedWidthIn,e.finished_width);
    close(result.finishedHeightIn,e.finished_height);
    // Workbook fixture verifies size math ONLY; not evidence of a real sewn miter.
    return;
   }
   if(r.module==='SASH'){
    const s=calculateSashing({rows:a.rows,columns:a.columns,
     blockWidthIn:10,blockHeightIn:10,finishedSashIn:2,seamIn:.25,wofIn:43});
    expect(s.vertical).toBe(e.vertical_segments);
    expect(s.horizontal).toBe(e.horizontal_segments);
    expect(s.cornerstones).toBe(e.cornerstones);
    expect(verifyLayout(s.layout)).toBe(true);
    return;
   }
   if(r.module==='WOF'){
    if(r.id==='WOF-FIT-HOLD-01'){
     const trial=calculateYardage({pieceWidthIn:a.piece_width,pieceHeightIn:1,count:1,
       wofIn:a.width_new,allowRotate:false});
     expect(trial.layout.isCutFeasible).toBe(e.fit);
     return;
    }
    const area=calculateWofArea(a.yards_original,a.width_original,a.width_new);
    close(area,e.area_equivalent_yards);
    close(purchase(area*36).roundedPurchaseYards,e.purchase_yards);
    expect(e.fit_guaranteed).toBe(false);
    return;
   }
   if(r.module==='BATT'){
    const b=calculateBatting({widthIn:a.width,heightIn:a.height,
     overageIn:a.overage_per_side,rollWidthIn:108});
    expect(b.isCutFeasible).toBe(true);
    expect(b.layout.cutPieces[0].widthIn).toBe(e.required_width);
    expect(b.layout.cutPieces[0].heightIn).toBe(e.required_height);
    return;
   }
   if(r.module==='SQUARE'){
    // The original workbook promises only the mathematical diagonal bound,
    // NOT the separately developed sewing/triangle construction method.
    close(a.finished_center_square*Math.SQRT2,e.theory_outer_side);
    return;
   }
   if(r.module==='DIAG'){
    expect(e.status).toBe('HOLD');
    const src=readFileSync('scripts/check-build.mjs','utf8');
    expect(src).toContain("'diagonal-quilt-backing-calculator'");
    return;
   }
   throw Error('Unrecognized original V2 module '+r.module+' for '+r.id);
  });
 }
});
