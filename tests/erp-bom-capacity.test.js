import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

/**
 * ERP Manufacturing & Bottleneck Engine for TOLAND Factory
 */
export function calculateProductionCapacity(bomItems, rawMaterialsMap) {
  let minCapacity = Infinity;
  let bottleneck = null;

  for (const item of bomItems) {
    const raw = rawMaterialsMap[item.raw_material_id];
    if (!raw) continue;

    const available = Number(raw.stock_qty || 0);
    const requiredPerPiece = Number(item.qty_per_piece || 0);

    if (requiredPerPiece <= 0) continue;

    const possiblePieces = Math.floor(available / requiredPerPiece);

    if (possiblePieces < minCapacity) {
      minCapacity = possiblePieces;
      bottleneck = {
        material: raw.name,
        available,
        requiredPerPiece,
        maxYield: possiblePieces,
      };
    }
  }

  return {
    capacity: minCapacity === Infinity ? 0 : minCapacity,
    bottleneck,
  };
}

export function simulate5StageYield(plannedQty, stagesData) {
  let currentIn = plannedQty;
  let totalWastage = 0;
  const stageResults = [];

  for (const stage of stagesData) {
    const scrap = stage.scrap || 0;
    const output = Math.max(0, currentIn - scrap);
    totalWastage += scrap;

    stageResults.push({
      stage: stage.name,
      qtyIn: currentIn,
      qtyOut: output,
      scrap,
    });

    currentIn = output;
  }

  return {
    finishedGarments: currentIn,
    totalWastage,
    yieldPercentage: Math.round((currentIn / plannedQty) * 100),
    stages: stageResults,
  };
}

describe('ERP BOM & 5-Stage Manufacturing Engine Suite', () => {
  test('Accurately identifies production bottleneck material', () => {
    // Recipe: 1.45m fabric, 1 button, 5 rivets, 1 zip
    const bomItems = [
      { raw_material_id: 'fabric-1', qty_per_piece: 1.45 },
      { raw_material_id: 'button-1', qty_per_piece: 1.0 },
      { raw_material_id: 'rivet-1', qty_per_piece: 5.0 },
      { raw_material_id: 'zip-1', qty_per_piece: 1.0 },
    ];

    const rawMaterials = {
      'fabric-1': { name: '13.5 oz Raw Denim', stock_qty: 1450 }, // 1450 / 1.45 = 1000 pcs
      'button-1': { name: 'Antique Shank Button', stock_qty: 350 }, // 350 / 1 = 350 pcs (BOTTLENECK)
      'rivet-1': { name: 'Copper Rivets', stock_qty: 10000 },     // 10000 / 5 = 2000 pcs
      'zip-1': { name: 'YKK Brass Zipper', stock_qty: 1200 },     // 1200 / 1 = 1200 pcs
    };

    const result = calculateProductionCapacity(bomItems, rawMaterials);

    assert.equal(result.capacity, 350);
    assert.equal(result.bottleneck.material, 'Antique Shank Button');
    assert.equal(result.bottleneck.maxYield, 350);
  });

  test('Simulates 5-stage manufacturing flow with scrap deduction', () => {
    const plannedQty = 500;
    const stages = [
      { name: 'cutting', scrap: 8 },    // 500 - 8 = 492
      { name: 'stitching', scrap: 7 },  // 492 - 7 = 485
      { name: 'washing', scrap: 0 },    // 485 - 0 = 485
      { name: 'finishing', scrap: 2 },  // 485 - 2 = 483
      { name: 'packing', scrap: 0 },    // 483 - 0 = 483
    ];

    const sim = simulate5StageYield(plannedQty, stages);

    assert.equal(sim.finishedGarments, 483);
    assert.equal(sim.totalWastage, 17);
    assert.equal(sim.yieldPercentage, 97); // 483/500 = 96.6% -> 97%
  });
});
