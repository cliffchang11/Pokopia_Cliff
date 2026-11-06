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
// 8. 測試 10 步 Undo / Redo 上限控制
console.log('🧪 測試 10 步 Undo / Redo 上限控制...');
VoxelDeltaStore.resetToDefault('ivysaur');
VoxelDeltaStore.state.mirrorSymmetry = false;

// 連續執行 15 次獨立修改動作
for (let i = 1; i <= 15; i++) {
  VoxelDeltaStore.executeVoxelAction('ivysaur', i, 20, 30, 'paint', i);
}

const ivysaurChar = VoxelDeltaStore.state.characters.ivysaur;
assert.strictEqual(ivysaurChar.history.length, 10, `歷史記錄應被嚴格限制在 10 步，目前為 ${ivysaurChar.history.length}`);
console.log('  ✓ 連續執行 15 次動作，歷史步驟精準截斷保留最新 10 步');

// 連續 Undo 10 次，驗證每一步皆成功
for (let i = 0; i < 10; i++) {
  const success = VoxelDeltaStore.undo('ivysaur');
  assert.strictEqual(success, true, `第 ${i + 1} 次 Undo 應成功`);
}
// 第 11 次 Undo 應失敗
assert.strictEqual(VoxelDeltaStore.undo('ivysaur'), false, '第 11 次 Undo 應無法再撤銷');
assert.strictEqual(ivysaurChar.redoStack.length, 10, `Redo 堆疊應累積 10 步，目前為 ${ivysaurChar.redoStack.length}`);
console.log('  ✓ 連續 Undo 10 次成功復原，第 11 次安全終止');

// 連續 Redo 10 次，驗證每一步皆成功
for (let i = 0; i < 10; i++) {
  const success = VoxelDeltaStore.redo('ivysaur');
  assert.strictEqual(success, true, `第 ${i + 1} 次 Redo 應成功`);
}
assert.strictEqual(VoxelDeltaStore.redo('ivysaur'), false, '第 11 次 Redo 應無法再重做');
console.log('  ✓ 連續 Redo 10 次成功重做，第 11 次安全終止');

// 9. 測試消除方塊與雲端防回彈
console.log('🧪 測試消除方塊與雲端防回彈 (Anti-Bounce)...');
VoxelDeltaStore.resetToDefault('ivysaur');
// 新增方塊 (10, 10, 10)
VoxelDeltaStore.executeVoxelAction('ivysaur', 10, 10, 10, 'add', 3);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 10, 10, 10), 3);

// 消除方塊
VoxelDeltaStore.executeVoxelAction('ivysaur', 10, 10, 10, 'delete');
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 10, 10, 10), -1);

// 模擬雲端舊資料回傳 (舊資料帶有 10,10,10 方塊，時間戳早於本地)
const oldCloudOverrides = {
  ivysaur: {
    data: { '10,10,10': 3 },
    updatedAt: Date.now() - 5000 // 5 秒前的舊資料
  }
};
VoxelDeltaStore.hydrateFromCloud(oldCloudOverrides);

// 驗證方塊絕對沒有長回來！
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 10, 10, 10), -1, '消除之方塊絕不可被舊雲端資料回彈長出');
console.log('  ✓ 消除方塊後，舊雲端資料回彈被時間戳與抑制機制成功攔截，方塊未長回！');

// 10. 測試 updateToolbarUI 即時解鎖重做按鈕與計數
console.log('🧪 測試 updateToolbarUI 重做按鈕即時解鎖與步數...');
// 模擬 DOM 環境
const mockBar = {
  querySelectorAll: function (selector) {
    if (selector.includes('btnUndo')) return [mockBtnUndo];
    if (selector.includes('btnRedo')) return [mockBtnRedo];
    return [];
  }
};
const mockBtnUndo = { disabled: true, style: {}, innerHTML: '' };
const mockBtnRedo = { disabled: true, style: {}, innerHTML: '' };

global.document = {
  querySelectorAll: function () {
    return [mockBar];
  }
};

VoxelDeltaStore.resetToDefault('ivysaur');
// 一開始 undo 與 redo 皆應禁用
VoxelDeltaStore.updateToolbarUI('ivysaur');
assert.strictEqual(mockBtnUndo.disabled, true);
assert.strictEqual(mockBtnRedo.disabled, true);

// 進行一次操作
VoxelDeltaStore.executeVoxelAction('ivysaur', 20, 20, 20, 'paint', 4);
assert.strictEqual(mockBtnUndo.disabled, false);
assert.strictEqual(mockBtnRedo.disabled, true);
assert.strictEqual(mockBtnUndo.innerHTML, '↩️ 復原 (1)');

// 執行 Undo
const undoOk = VoxelDeltaStore.undo('ivysaur');
assert.strictEqual(undoOk, true);
// Undo 後，Redo 按鈕必須瞬間解鎖！
assert.strictEqual(mockBtnRedo.disabled, false, 'Undo 後 Redo 按鈕必須解除禁用 (disabled = false)');
assert.strictEqual(mockBtnRedo.innerHTML, '↪️ 重做 (1)', 'Redo 按鈕步數應顯示為 (1)');
assert.strictEqual(mockBtnUndo.disabled, true, 'Undo 堆疊清空後應禁用');
console.log('  ✓ Undo 後 Redo 按鈕瞬間解鎖，disabled 正確解除且步數顯示為 (1)');

// 執行 Redo
const redoOk = VoxelDeltaStore.redo('ivysaur');
assert.strictEqual(redoOk, true);
assert.strictEqual(mockBtnRedo.disabled, true, 'Redo 執行完畢後應重新禁用');
assert.strictEqual(mockBtnUndo.disabled, false, 'Redo 後 Undo 按鈕應重新解鎖');
console.log('  ✓ Redo 執行後按鈕狀態即時切換，無任何殘留鎖死');

// 11. 測試定向局部更新效能 (受影響方塊 vs 9 萬方塊)
console.log('🧪 測試 3D 定向局部更新效能...');
const mockMesh = {
  setMatrixAt: () => {},
  setColorAt: () => {},
  instanceMatrix: {},
  instanceColor: {}
};
const dummyBlockList = [];
for (let i = 0; i < 90923; i++) {
  dummyBlockList.push({ posX: i % 100, posY: 20, posZ: Math.floor(i / 100), index: i, layerIndex: 21 });
}
const mockThreeState = {
  instancedMesh: mockMesh,
  blockDataList: dummyBlockList
};

// 首次冷啟動 (包含索引 Map 建置)
VoxelDeltaStore.syncThreeMeshFromOverrides('ivysaur', mockThreeState, IVYSAUR_VOXEL_DATA, [
  { x: 30, y: 20, z: 30 }
]);

// 定向熱更新 (復用索引 Map 進行極速定向同步)
const startTime = Date.now();
VoxelDeltaStore.syncThreeMeshFromOverrides('ivysaur', mockThreeState, IVYSAUR_VOXEL_DATA, [
  { x: 30, y: 20, z: 30 },
  { x: 70, y: 20, z: 30 }
]);
const elapsed = Date.now() - startTime;
assert(elapsed < 5, `定向熱更新耗時應極短 (<5ms)，實際為 ${elapsed}ms`);
console.log(`  ✓ 9 萬方塊模型中定向局部更新 2 顆方塊耗時僅 ${elapsed}ms (真正 0ms 瞬間響應)`);

// 12. 測試昨天舊版「純座標格式 (無 updatedAt)」的優先搶救與無損還原
console.log('🧪 測試昨天舊版純座標存檔的優先搶救還原...');
VoxelDeltaStore.resetToDefault('ivysaur');
assert.strictEqual(Object.keys(VoxelDeltaStore.getOverrides('ivysaur')).length, 0);

// 模擬昨天存入雲端的純座標字典 (無 updatedAt 欄位)
const yesterdayLegacyCloud = {
  ivysaur: {
    '40,20,40': 7,
    '41,20,40': 7
  }
};

// 執行水合
VoxelDeltaStore.hydrateFromCloud(yesterdayLegacyCloud);

// 驗證昨天的方塊資料被 100% 成功還原！
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 40, 20, 40), 7, '昨天的方塊 1 必須成功還原');
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 41, 20, 40), 7, '昨天的方塊 2 必須成功還原');
console.log('  ✓ 昨天純座標舊格式存檔 100% 優先還原成功，完全不受無時間戳影響！');

console.log('🎉 所有離線整合單元測試 100% 全數通過 (PASS)！');

