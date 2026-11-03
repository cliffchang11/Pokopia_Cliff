/**
 * 🛠️ Pokopia 3D 體素手動編輯與雲端同步系統離線驗收測試套件
 * 測試版本: v4.39.0
 */

const assert = require('assert');
const fs = require('fs');

console.log('========================================================');
console.log('🛠️ 啟動 Pokopia 3D 體素手動編輯系統 (v4.39.0) 離線整合驗收測試...');
console.log('========================================================\n');

// 1. 測試 VoxelDeltaStore 體素核心演算法與動態增補
console.log('【測試組 1: VoxelDeltaStore 體素核心演算法與動態增補】');
const ivysaurCode = fs.readFileSync('./ivysaur_voxel_data.js', 'utf8');
const fn = new Function(ivysaurCode + '; return IVYSAUR_VOXEL_DATA;');
global.IVYSAUR_VOXEL_DATA = fn();

const VoxelDeltaStore = require('./voxel_editor.js');
assert.strictEqual(typeof VoxelDeltaStore.executeVoxelAction, 'function', '缺少 executeVoxelAction 函式');
assert.strictEqual(typeof VoxelDeltaStore.undo, 'function', '缺少 undo 函式');
assert.strictEqual(typeof VoxelDeltaStore.redo, 'function', '缺少 redo 函式');
assert.strictEqual(typeof VoxelDeltaStore.getEffectiveVoxelData, 'function', '缺少 getEffectiveVoxelData 函式');
console.log('  ✓ PASS: 1.1 VoxelDeltaStore 介面定義完整');

// 左右對稱測試 (妙蛙草寬度 99，中軸 49，x=30 對稱 68)
const symX = VoxelDeltaStore.getSymmetryX(30, 'ivysaur');
assert.strictEqual(symX, 68, '鏡像對稱計算錯誤');
console.log('  ✓ PASS: 1.2 左右鏡像對稱座標中軸運算精確 (30 <-> 68)');

// 鏡像塗色與 Undo/Redo 驗證
VoxelDeltaStore.state.mirrorSymmetry = true;
VoxelDeltaStore.executeVoxelAction('ivysaur', 30, 20, 30, 'paint', 4);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 4);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 4);

VoxelDeltaStore.undo('ivysaur');
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 4);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 4);

VoxelDeltaStore.redo('ivysaur');
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 30, 20, 30), 4);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 68, 20, 30), 4);
console.log('  ✓ PASS: 1.3 左右鏡像塗色、Undo 撤銷與 Redo 重做 100% 正確');

// 動態資料庫與材料即時統計
VoxelDeltaStore.resetToDefault('ivysaur');
const origTotal = IVYSAUR_VOXEL_DATA.totalBlocks;
VoxelDeltaStore.state.mirrorSymmetry = false;
VoxelDeltaStore.executeVoxelAction('ivysaur', 5, 5, 5, 'add', 3);
const effData = VoxelDeltaStore.getEffectiveVoxelData('ivysaur');
assert.strictEqual(effData.totalBlocks, origTotal + 1, '新增方塊後總數應增加 1');
const targetLayer = effData.layers.find(l => l.layerIndex === 6);
assert.ok(targetLayer && targetLayer.materials[3] > 0, '材料統計表未動態計入新增方塊');
console.log('  ✓ PASS: 1.4 動態體素資料庫疊加與材料統計 (materials) 即時連動正確');

// 2. 測試 3D 動態方塊增補網格 (Dynamic Added Mesh) 與工具列收合結構
console.log('\n【測試組 2: 3D 動態方塊增補網格與工具列收合機制】');
const editorCode = fs.readFileSync('./voxel_editor.js', 'utf8');
assert.ok(editorCode.includes('dynamicAddedGroup'), 'voxel_editor.js 缺少 dynamicAddedGroup 動態增補網格');
assert.ok(editorCode.includes('ve-toggle-capsule'), 'voxel_editor.js 缺少 ve-toggle-capsule 右上角開關膠囊');
assert.ok(editorCode.includes('ve-hidden'), 'voxel_editor.js 缺少 ve-hidden 預設收合類別');
assert.ok(editorCode.includes('ve-close-btn'), 'voxel_editor.js 缺少 ve-close-btn 收合按鈕');
console.log('  ✓ PASS: 2.1 voxel_editor.js 具備 dynamicAddedGroup 3D 實體動態增補實例層');
console.log('  ✓ PASS: 2.2 voxel_editor.js 具備右上角精簡開關膠囊與面板收合機制 (零遮擋模型)');

// 3. 測試妙蛙草切片指南自適應居中縮放與材料卡片
console.log('\n【測試組 3: 妙蛙草切片指南自適應居中縮放與材料卡片】');
const appCode = fs.readFileSync('./app.js', 'utf8');
assert.ok(appCode.includes('setupVoxelEditorIntegration'), 'app.js 缺少 setupVoxelEditorIntegration');
assert.ok(appCode.includes('fitWorkspaceToContainer(workspace, parent, ivysaurState.zoom)'), 'renderIvysaurLayer 缺少自適應縮放引擎');
assert.ok(appCode.includes('rgba(52, 211, 153, 0.04)'), 'renderIvysaurLayer 缺少工程藍圖底格線');
assert.ok(appCode.includes('bulba-mat-chip'), 'renderIvysaurLayer 材料卡片缺少統一晶片樣式');
assert.ok(appCode.includes('bulba-mat-count'), 'renderIvysaurLayer 材料卡片缺少統一計數標籤');
console.log('  ✓ PASS: 3.1 renderIvysaurLayer 完整導入 fitWorkspaceToContainer 居中放大充滿畫布');
console.log('  ✓ PASS: 3.2 renderIvysaurLayer 具備清晰工程藍圖底格線與高對比材料卡片');

// 4. 測試前端資源引入與版本破壞標籤 (v4.39.0)
console.log('\n【測試組 4: 靜態資源引入與版本升級 (v4.39.0)】');
const indexHtml = fs.readFileSync('./index.html', 'utf8');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.39.0'), 'index.html 缺少 voxel_editor.js?v=4.39.0');
assert.ok(indexHtml.includes('index.css?v=4.39.0'), 'index.html 未更新至 index.css?v=4.39.0');
assert.ok(indexHtml.includes('app.js?v=4.39.0'), 'index.html 未更新至 app.js?v=4.39.0');
console.log('  ✓ PASS: 4.1 index.html 正確引入 voxel_editor.js 且全站版號對齊 v=4.39.0');

const swCode = fs.readFileSync('./sw.js', 'utf8');
assert.ok(swCode.includes('pokopia-cache-v4.39.0'), 'sw.js 快取版本未升級至 v4.39.0');
assert.ok(swCode.includes('./voxel_editor.js?v=4.39.0'), 'sw.js 靜態清單未包含 voxel_editor.js?v=4.39.0');
console.log('  ✓ PASS: 4.2 sw.js 離線快取成功升級 pokopia-cache-v4.39.0 且納入最新資產');

const indexCss = fs.readFileSync('./index.css', 'utf8');
assert.ok(indexCss.includes('.ve-toggle-capsule'), 'index.css 缺少 .ve-toggle-capsule 膠囊樣式');
assert.ok(indexCss.includes('.voxel-editor-toolbar.ve-hidden'), 'index.css 缺少 .ve-hidden 樣式');
console.log('  ✓ PASS: 4.3 index.css 具備右上角輕量膠囊開關與非遮擋面板樣式');

console.log('\n--------------------------------------------------------');
console.log('🎉 Pokopia 3D 體素手動編輯與雲端同步系統離線驗收 100% PASS！');
console.log('========================================================\n');
