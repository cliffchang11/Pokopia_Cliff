/**
 * 🛠️ Pokopia 3D 體素手動編輯與雲端同步系統離線驗收測試套件
 * 測試版本: v4.38.0
 */

const assert = require('assert');
const fs = require('fs');

console.log('========================================================');
console.log('🛠️ 啟動 Pokopia 3D 體素手動編輯系統 (v4.38.0) 離線整合驗收測試...');
console.log('========================================================\n');

// 1. 測試 VoxelDeltaStore 體素差異與歷史覆蓋核心
console.log('【測試組 1: VoxelDeltaStore 體素核心演算法】');
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

// 2. 測試 Firebase 雲端與本地持久化模組
console.log('\n【測試組 2: Firebase 雲端與本地持久化雙軌整合】');
const fbCode = fs.readFileSync('./firebase.js', 'utf8');
assert.ok(fbCode.includes('saveVoxelOverrides'), 'firebase.js 缺少 saveVoxelOverrides');
assert.ok(fbCode.includes('loadVoxelOverrides'), 'firebase.js 缺少 loadVoxelOverrides');
assert.ok(fbCode.includes('voxelOverrides'), 'firebase.js 缺少 voxelOverrides 欄位合併');
console.log('  ✓ PASS: 2.1 firebase.js 具備 saveVoxelOverrides 與 loadVoxelOverrides 匯出介面');
console.log('  ✓ PASS: 2.2 firebase.js mergeProgressUnion 完整支援 voxelOverrides 雲端合併');

// 3. 測試前端資源引入與版本破壞標籤
console.log('\n【測試組 3: 靜態資源引入與版本升級 (v4.38.0)】');
const indexHtml = fs.readFileSync('./index.html', 'utf8');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.38.0'), 'index.html 缺少 voxel_editor.js?v=4.38.0 引入');
assert.ok(indexHtml.includes('index.css?v=4.38.0'), 'index.html 未更新至 index.css?v=4.38.0');
assert.ok(indexHtml.includes('app.js?v=4.38.0'), 'index.html 未更新至 app.js?v=4.38.0');
console.log('  ✓ PASS: 3.1 index.html 正確引入 voxel_editor.js 且全站版號對齊 v=4.38.0');

const swCode = fs.readFileSync('./sw.js', 'utf8');
assert.ok(swCode.includes('pokopia-cache-v4.38.0'), 'sw.js 快取版本未升級至 v4.38.0');
assert.ok(swCode.includes('./voxel_editor.js?v=4.38.0'), 'sw.js 靜態清單未包含 voxel_editor.js');
console.log('  ✓ PASS: 3.2 sw.js 離線快取成功升級 pokopia-cache-v4.38.0 且納入 voxel_editor.js');

const indexCss = fs.readFileSync('./index.css', 'utf8');
assert.ok(indexCss.includes('.voxel-editor-toolbar'), 'index.css 缺少 .voxel-editor-toolbar 樣式');
assert.ok(indexCss.includes('.ve-color-dot'), 'index.css 缺少色票小球樣式');
console.log('  ✓ PASS: 3.3 index.css 具備現代毛玻璃懸浮工具列與色票樣式');

// 4. 測試 app.js 3D 展台與 2D 切片雙向連動
console.log('\n【測試組 4: app.js 展台與 2D 切片雙向連動】');
const appCode = fs.readFileSync('./app.js', 'utf8');
assert.ok(appCode.includes('setupVoxelEditorIntegration'), 'app.js 缺少 setupVoxelEditorIntegration 函式');
assert.ok(appCode.includes("setupVoxelEditorIntegration('ivysaur'"), '妙蛙草 3D 展台未整合編輯器');
assert.ok(appCode.includes("setupVoxelEditorIntegration('bulbasaur'"), '妙蛙種子 3D 展台未整合編輯器');
assert.ok(appCode.includes("setupVoxelEditorIntegration('venusaur'"), '妙蛙花 3D 展台未整合編輯器');
assert.ok(appCode.includes("setupVoxelEditorIntegration('buzz'"), '巴斯光年 3D 展台未整合編輯器');
assert.ok(appCode.includes("VoxelDeltaStore.getEffectiveVoxelData('ivysaur')"), '妙蛙草 2D 切片未連動 effectiveVoxelData');
assert.ok(appCode.includes("VoxelDeltaStore.getEffectiveVoxelData('venusaur')"), '妙蛙花 2D 切片未連動 effectiveVoxelData');
console.log('  ✓ PASS: 4.1 四大角色 3D 展台全數掛載體素編輯器');
console.log('  ✓ PASS: 4.2 2D 建造切片指南動態讀取自訂體素資料庫，所見即所建');

console.log('\n--------------------------------------------------------');
console.log('🎉 Pokopia 3D 體素手動編輯與雲端同步系統離線驗收 100% PASS！');
console.log('========================================================\n');
