import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sampleProject, validateProject, quiltTopReviewFingerprint, hasCurrentQuiltTopReview } from '../src/lib/quilt/project';
import { resolveQuiltDimensions } from '../src/lib/quilt/dimensions';
import { calculateBacking, calculateBatting, calculateStraightBinding } from '../src/lib/quilt/math';
import { shoppingCsv, shoppingPriceSummary, type ShoppingLine } from '../src/lib/quilt/shopping';

const copy = () => structuredClone(sampleProject);
const schema = JSON.parse(readFileSync(new URL('../docs/schemas/Project_V2.schema.json', import.meta.url), 'utf8'));

describe('V2 project price inputs and published JSON Schema contract', () => {
  it('declares the existing sizeBasis field on exported projects (additionalProperties is false)', () => {
    const quilt = schema.properties.quilt;
    expect(quilt.additionalProperties).toBe(false);
    expect(quilt.properties.sizeBasis.enum).toEqual(['before-borders', 'includes-borders']);
    expect(quilt.required).not.toContain('sizeBasis');
    expect(validateProject(JSON.parse(JSON.stringify(sampleProject))).quilt.sizeBasis).toBe('before-borders');
  });

  it('documents all optional unit prices and keeps older saved JSON importable', () => {
    const options = schema.properties.options;
    expect(options.additionalProperties).toBe(false);
    for (const field of ['backingPricePerYard', 'battingPricePerYard', 'bindingPricePerYard'] as const) {
      expect(options.properties[field]).toMatchObject({type: 'number', minimum: 0, maximum: 100000});
      expect(options.required).not.toContain(field);
      expect(validateProject(copy()).options[field]).toBeUndefined();
      const withPrice = copy();
      withPrice.options[field] = 0;
      expect(validateProject(JSON.parse(JSON.stringify(withPrice))).options[field]).toBe(0);
      for (const invalid of [-0.01, 100001, null, '12', Number.NaN, Number.POSITIVE_INFINITY]) {
        const bad: Record<string, unknown> = copy().options;
        bad[field] = invalid;
        expect(() => validateProject({...copy(), options: bad}), String(field) + ': ' + String(invalid)).toThrow();
      }
    }
  });

  it('uses separate rounded purchases for backing, batting and binding, without inventing missing prices', () => {
    const p = copy();
    const dims = resolveQuiltDimensions(p);
    const o = p.options;
    const backing = calculateBacking({widthIn:dims.finalWidthIn,heightIn:dims.finalHeightIn,
      overageIn:o.overage,wofIn:o.usableWof,joinTakeupIn:o.joinTakeup,
      oneWayPrint:o.oneWayPrint,step:o.step,shrinkageLengthPct:o.lengthShrinkage}).recommended;
    const batting = calculateBatting({widthIn:dims.finalWidthIn,heightIn:dims.finalHeightIn,
      overageIn:o.battingOverage,rollWidthIn:o.battingWof,rotate:o.allowRotate,step:o.step});
    const binding = calculateStraightBinding({widthIn:dims.finalWidthIn,heightIn:dims.finalHeightIn,
      wofIn:o.usableWof,stripWidthIn:o.stripWidth,tailAllowanceIn:o.tailAllowance,
      joinLossIn:o.stripJoinLoss,step:o.step,shrinkageLengthPct:o.lengthShrinkage});
    expect([backing.purchase.roundedPurchaseYards,batting.purchase?.roundedPurchaseYards,
      binding.purchase.roundedPurchaseYards]).toEqual([5.25,2.625,0.625]);
    const rows: ShoppingLine[] = [
      {label:'Backing',amount:backing.purchase.roundedPurchaseYards,unitPrice:10},
      {label:'Batting',amount:batting.purchase?.roundedPurchaseYards,unitPrice:8},
      {label:'Straight binding',amount:binding.purchase.roundedPurchaseYards,unitPrice:6},
      {label:'Unpriced border',amount:1.25}
    ];
    const prices = shoppingPriceSummary(rows);
    expect(prices.enteredPriceSubtotalUsd).toBeCloseTo(77.25,8);
    expect(prices.pricedCount).toBe(3);
    expect(prices.unpricedCount).toBe(1);
    const csv = shoppingCsv(rows);
    expect(csv).toContain('"52.5"');
    expect(csv).toContain('"21"');
    expect(csv).toContain('"3.75"');
    expect(csv).toContain('"Unpriced border"');
  });

  it('price edits do not revoke independent manual review of quilt-top cut coverage', () => {
    const p = copy();
    p.quilt.topCutsReviewed = true;
    p.quilt.topCutsReviewFingerprint = quiltTopReviewFingerprint(p);
    expect(hasCurrentQuiltTopReview(p)).toBe(true);
    p.options.backingPricePerYard = 15;
    p.options.battingPricePerYard = 9;
    p.options.bindingPricePerYard = 7;
    expect(hasCurrentQuiltTopReview(validateProject(p))).toBe(true);
  });
});
