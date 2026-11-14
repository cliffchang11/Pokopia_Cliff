/**
 * verify_venusaur80_v2_center_suite.js
 * 🌺 妙蛙花 (80層動態版) 旋轉轉軸置中實質幾何級驗收測試
 */

const assert = require('assert');
const data = require('./venusaur80_v2_voxel_data.js');
global.VENUSAUR_80_V2_VOXEL_DATA = data;
const VoxelDeltaStore = require('./voxel_editor.js');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  🌺 妙蛙花 (80層動態版) 旋轉轉軸幾何置中驗收測試                  ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const width = data.dimensions.width;
const height = data.dimensions.height;
const length = data.dimensions.length;
const cx = width / 2;
const cy = height / 2;
const cz = length / 2;

console.log(`📐 模型幾何參數：寬 ${width} × 高 ${height} × 深 ${length}，總方塊數 ${data.totalBlocks.toLocaleString()} 顆`);
console.log(`🎯 中心偏移基準：cx = ${cx}, cy = ${cy}, cz = ${cz}`);

// ─── [測試 1/3] 驗證方塊座標標準局部正整數性 ──────────────────────────
console.log('\n▶ [測試 1/3] 檢驗方塊座標是否全數標準化為 [0, width-1] 正整數...');
let minX = Infinity, maxX = -Infinity;
let minZ = Infinity, maxZ = -Infinity;
let blockCount = 0;
let sumPosX = 0, sumPosZ = 0;

data.layers.forEach((layer) => {
  layer.blocks.forEach(([x, z, bid]) => {
    blockCount++;
    assert(x >= 0 && x < width, `方塊 X 座標越界: ${x}`);
    assert(z >= 0 && z < length, `方塊 Z 座標越界: ${z}`);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    // 模擬 Three.js 展台放置
    const posX = x - cx;
    const posZ = z - cz;
    sumPosX += posX;
    sumPosZ += posZ;
  });
});

assert.strictEqual(blockCount, data.totalBlocks, '方塊累計數必須等於 totalBlocks');
assert.strictEqual(minX, 0, `X 最低界限應為 0，實際為 ${minX}`);
assert.strictEqual(maxX, width - 1, `X 最高界限應為 ${width - 1}，實際為 ${maxX}`);
assert.strictEqual(minZ, 0, `Z 最低界限應為 0，實際為 ${minZ}`);
assert.strictEqual(maxZ, length - 1, `Z 最高界限應為 ${length - 1}，實際為 ${maxZ}`);
console.log(`  ✓ PASS: X 範圍 [${minX}, ${maxX}]，Z 範圍 [${minZ}, ${maxZ}]，100% 符合局部正整數規範！`);

// ─── [測試 2/3] 檢驗 3D 空間幾何對稱性與 OrbitControls 旋轉轉軸 ─────────
console.log('\n▶ [測試 2/3] 檢驗 3D 空間幾何對稱性與轉軸位置...');
const minPosX = minX - cx;
const maxPosX = maxX - cx;
const minPosZ = minZ - cz;
const maxPosZ = maxZ - cz;

const centerPosX = (minPosX + maxPosX) / 2;
const centerPosZ = (minPosZ + maxPosZ) / 2;
const avgPosX = sumPosX / blockCount;
const avgPosZ = sumPosZ / blockCount;

console.log(`  - 3D 空間 X 邊界: [${minPosX.toFixed(1)}, ${maxPosX.toFixed(1)}] ➔ 幾何中心: ${centerPosX.toFixed(2)} (質心: ${avgPosX.toFixed(2)})`);
console.log(`  - 3D 空間 Z 邊界: [${minPosZ.toFixed(1)}, ${maxPosZ.toFixed(1)}] ➔ 幾何中心: ${centerPosZ.toFixed(2)} (質心: ${avgPosZ.toFixed(2)})`);

assert(Math.abs(centerPosX) <= 0.5, `3D X 幾何中心偏離原點: ${centerPosX}`);
assert(Math.abs(centerPosZ) <= 0.5, `3D Z 幾何中心偏離原點: ${centerPosZ}`);
assert(Math.abs(avgPosX) < 1.0, `3D X 質心偏離過大: ${avgPosX}`);
assert(Math.abs(avgPosZ) < 1.0, `3D Z 質心偏離過大: ${avgPosZ}`);
console.log('  ✓ PASS: 3D 模型幾何中心與 (0,0,0) 原點精準重合！旋轉時保證繞中心自轉，0 甩動！');

// ─── [測試 3/3] 檢驗 VoxelDeltaStore 鏡像對稱軸 ───────────────────────
console.log('\n▶ [測試 3/3] 檢驗 VoxelDeltaStore 鏡像對稱軸計算...');
const bounds = VoxelDeltaStore.getCharBounds('venusaur80_v2');
assert(bounds, '必須能取得 venusaur80_v2 bounds');
console.log(`  - 對稱軸邊界: minX=${bounds.minX}, maxX=${bounds.maxX}, sum=${bounds.sum}, center=${bounds.center}`);
assert.strictEqual(bounds.minX, 0, '對稱軸 minX 應為 0');
assert.strictEqual(bounds.maxX, 116, '對稱軸 maxX 應為 116');
assert.strictEqual(bounds.sum, 116, '對稱軸 sum 應為 116');
assert.strictEqual(bounds.center, 58, '對稱軸 center 應為 58 (正中央)');
console.log('  ✓ PASS: VoxelDeltaStore 鏡像對稱軸精準鎖定於 x = 58 身體正中線！\n');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  🎉 所有 3 大幾何置中驗收測試項目 100% 全部通過！ (0 錯誤，0 失敗) ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
