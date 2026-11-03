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
// 妙蛙草寬度為 99 (0~98)，中軸為 49。x=30 對稱點為 98-30 = 68
const symX = VoxelDeltaStore.getSymmetryX(30, 'ivysaur');
assert.strictEqual(symX, 68, `鏡像計算錯誤: 30 對稱應為 68，實際為 ${symX}`);
console.log('  ✓ 左右鏡像對稱座標計算正確 (30 <-> 68)');

// 開啟鏡像模式
VoxelDeltaStore.state.mirrorSymmetry = true;
// 將 (30, 20, 30) 與其對稱點 (68, 20, 30) 塗色為 bid 5
VoxelDeltaStore.executeVoxelAction('ivysaur', 30, 20, 30, 'paint', 5);

assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 5);
console.log('  ✓ 鏡像塗色成功同步套用於雙側');

// 3. 測試 Undo
const undoRes = VoxelDeltaStore.undo('ivysaur');
assert.strictEqual(undoRes, true);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 5);
console.log('  ✓ 撤銷 (Undo) 成功還原雙側方塊');

// 4. 測試 Redo
const redoRes = VoxelDeltaStore.redo('ivysaur');
assert.strictEqual(redoRes, true);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 5);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 5);
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

console.log('🎉 任務 1 單元測試 100% 通過！');
