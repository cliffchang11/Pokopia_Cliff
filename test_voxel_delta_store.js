const assert = require('assert');
const fs = require('fs');

// 載入妙蛙草資料庫到全域
const ivysaurCode = fs.readFileSync('./ivysaur_voxel_data.js', 'utf8');
const fn = new Function(ivysaurCode + '; return IVYSAUR_VOXEL_DATA;');
global.IVYSAUR_VOXEL_DATA = fn();

// 載入 VoxelDeltaStore
const VoxelDeltaStore = require('./voxel_editor.js');

console.log('🧪 啟動 任務 1: VoxelDeltaStore 單元測試...');

// 1. 基礎屬性與初始狀態
assert.strictEqual(typeof VoxelDeltaStore.executeVoxelAction, 'function');
assert.strictEqual(typeof VoxelDeltaStore.undo, 'function');
assert.strictEqual(typeof VoxelDeltaStore.redo, 'function');
assert.strictEqual(typeof VoxelDeltaStore.getEffectiveVoxelData, 'function');

const origTotal = IVYSAUR_VOXEL_DATA.totalBlocks;
console.log(`  原版總方塊數: ${origTotal}`);

// 2. 測試左右鏡像對稱塗色 (paint)
// 妙蛙草真實座標為 1~99，真實幾何中軸為 50。x=30 對稱點為 100-30 = 70，x=51 對稱點為 49
const symX = VoxelDeltaStore.getSymmetryX(30, 'ivysaur');
assert.strictEqual(symX, 70, `鏡像計算錯誤: 30 對稱應為 70，實際為 ${symX}`);
assert.strictEqual(VoxelDeltaStore.getSymmetryX(51, 'ivysaur'), 49, '51 對稱應為 49');
assert.strictEqual(VoxelDeltaStore.getSymmetryX(50, 'ivysaur'), 50, '中心軸 50 對稱應為 50');
console.log('  ✓ 左右鏡像對稱座標計算正確 (30 <-> 70, 51 <-> 49, 50 <-> 50)');

// 開啟鏡像模式
VoxelDeltaStore.state.mirrorSymmetry = true;
// 將 (30, 20, 30) 與其對稱點 (70, 20, 30) 塗色為 bid 5
VoxelDeltaStore.executeVoxelAction('ivysaur', 30, 20, 30, 'paint', 5);

assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 70, 20, 30), 5);
console.log('  ✓ 鏡像塗色成功同步套用於雙側');

// 3. 測試 Undo
const undoRes = VoxelDeltaStore.undo('ivysaur');
assert.strictEqual(undoRes, true);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 70, 20, 30), 5);
console.log('  ✓ 撤銷 (Undo) 成功還原雙側方塊');

// 4. 測試 Redo
const redoRes = VoxelDeltaStore.redo('ivysaur');
assert.strictEqual(redoRes, true);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 70, 20, 30), 5);
console.log('  ✓ 重做 (Redo) 成功復原塗色');

// 5. 測試新增與消除對 getEffectiveVoxelData 的連動影響
VoxelDeltaStore.resetToDefault('ivysaur');
assert.strictEqual(Object.keys(VoxelDeltaStore.getOverrides('ivysaur')).length, 0);

// 在空白處新增 1 顆方塊 (關閉鏡像)
VoxelDeltaStore.state.mirrorSymmetry = false;
VoxelDeltaStore.executeVoxelAction('ivysaur', 10, 10, 10, 'add', 1);
let effData = VoxelDeltaStore.getEffectiveVoxelData('ivysaur');
assert.strictEqual(effData.totalBlocks, origTotal + 1, `新增方塊後總數應增加 1，實際為 ${effData.totalBlocks}`);
console.log('  ✓ 新增方塊 (Add) 成功使總方塊數 +1');

// 消除方塊 (Delete)
VoxelDeltaStore.executeVoxelAction('ivysaur', 10, 10, 10, 'delete');
effData = VoxelDeltaStore.getEffectiveVoxelData('ivysaur');
assert.strictEqual(effData.totalBlocks, origTotal, `消除方塊後總數應恢復，實際為 ${effData.totalBlocks}`);
console.log('  ✓ 消除方塊 (Delete) 成功還原總方塊數');

// 6. 測試多方塊選取與批次上色/消除
VoxelDeltaStore.clearSelection('ivysaur');
assert.strictEqual(VoxelDeltaStore.state.selectedVoxels.size, 0);

// 單擊選取
VoxelDeltaStore.state.mirrorSymmetry = true;
VoxelDeltaStore.selectVoxel('ivysaur', 51, 20, 30, false);
// 51 與對稱點 49 都應被選取
assert(VoxelDeltaStore.state.selectedVoxels.has('51,20,30'));
assert(VoxelDeltaStore.state.selectedVoxels.has('49,20,30'));
assert.strictEqual(VoxelDeltaStore.state.selectedVoxels.size, 2);
console.log('  ✓ 鏡像多選成功同時加入對稱方塊 (51 & 49)');

// 批次改色為 bid 7
const paintedCount = VoxelDeltaStore.applyBatchAction('ivysaur', 'paint', 7);
assert.strictEqual(paintedCount, 2);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), 7);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), 7);
console.log('  ✓ 多方塊批次改色成功一秒套用');

// 批次操作單步 Undo 復原
const undoBatch = VoxelDeltaStore.undo('ivysaur');
assert.strictEqual(undoBatch, true);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), 7);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), 7);
console.log('  ✓ 批次改色單步 Undo 成功一次性還原所有選取方塊');

// 批次消除
const deletedCount = VoxelDeltaStore.applyBatchAction('ivysaur', 'delete');
assert.strictEqual(deletedCount, 2);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), -1);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), -1);
console.log('  ✓ 多方塊批次消除成功一鍵整批清除');

// 再次單步 Undo 復原消除
VoxelDeltaStore.undo('ivysaur');
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), -1);
console.log('  ✓ 批次消除單步 Undo 成功全數還原');

// 7. 測試懸停幽靈預覽
VoxelDeltaStore.setHoverVoxel('ivysaur', 51, 20, 30);
assert.deepStrictEqual(VoxelDeltaStore.state.hoverVoxel, {
  x: 51, y: 20, z: 30, symX: 49, charKey: 'ivysaur'
});
// 當在中心軸上時，不產生第二個對稱預覽
VoxelDeltaStore.setHoverVoxel('ivysaur', 50, 20, 30);
assert.deepStrictEqual(VoxelDeltaStore.state.hoverVoxel, {
  x: 50, y: 20, z: 30, symX: null, charKey: 'ivysaur'
});
console.log('  ✓ 懸停幽靈預覽演算正確（中心軸自動不重疊）');

console.log('🎉 任務 2 與 任務 3 單元測試 100% 通過！');

