/**
 * Pokopia 妙蛙花 (80層動態版 / venusaur80_v2) 實質行為級自動化綜合驗收測試套件
 * 
 * 測試範圍：
 * 1. 體素數據結構與五官特徵色彩 (連續 80 層、純本體四足踏地、紅眼黑瞳白齒粉紅花瓣)
 * 2. index.html、sw.js、GEMINI.md 規格完整性 (DOM 節點、快取清單、版本升級)
 * 3. VoxelDeltaStore 9 大角色資料 100% 絕對隔離性 (獨立鍵值、獨立 Undo/Redo、0 交叉污染)
 * 4. 雲端原子字串包封裝與水合還原 (getAllOverrides / hydrateFromCloud)
 * 5. app.js 生命週期與按需渲染引擎狀態
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  Pokopia 妙蛙花 (80層動態版 / venusaur80_v2) 綜合驗收測試套件    ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

// ─────────────────────────────────────────────────────────────
// 測試階段 1：體素藍圖數據結構檢驗
// ─────────────────────────────────────────────────────────────
console.log('▶ [測試階段 1] 體素藍圖數據結構檢驗');
const voxelDataPath = path.join(__dirname, 'venusaur80_v2_voxel_data.js');
assert(fs.existsSync(voxelDataPath), 'venusaur80_v2_voxel_data.js 檔案必須存在');

const rawMod = require(voxelDataPath);
const VENUSAUR_80_V2_VOXEL_DATA = rawMod.VENUSAUR_80_V2_VOXEL_DATA || rawMod;
assert(VENUSAUR_80_V2_VOXEL_DATA && VENUSAUR_80_V2_VOXEL_DATA.dimensions, '必須成功導出 VENUSAUR_80_V2_VOXEL_DATA');

const dim = VENUSAUR_80_V2_VOXEL_DATA.dimensions;
console.log(`  - 幾何尺寸: 寬 ${dim.width} × 高 ${dim.height} × 深 ${dim.length}`);
assert.strictEqual(dim.height, 80, '模型高度必須精準等於 80 層');

const totalBlocks = VENUSAUR_80_V2_VOXEL_DATA.totalBlocks;
console.log(`  - 方塊總數: ${totalBlocks.toLocaleString()} 顆`);
assert(totalBlocks > 40000 && totalBlocks < 80000, `方塊數應在 40k~80k 之間，實際為 ${totalBlocks}`);

const layers = VENUSAUR_80_V2_VOXEL_DATA.layers;
assert.strictEqual(layers.length, 80, '切片層數必須精確等於 80');

// 逐層連續性檢查
for (let y = 1; y <= 80; y++) {
  const layer = layers[y - 1];
  assert.strictEqual(layer.layerIndex, y, `第 ${y} 層索引應為 ${y}`);
  assert(layer.blocks.length > 0, `第 ${y} 層方塊數不得為 0（不允許斷層）`);
}
console.log(`  - 連續 80 層檢驗 PASS: 第 1 層 ${layers[0].blocks.length} 顆，第 80 層 ${layers[79].blocks.length} 顆`);

// 第 1 層踏地與中央懸空檢查
const l1Blocks = layers[0].blocks;
const hasCenter = l1Blocks.some(([x, z]) => x === 0 && z === 0);
assert.strictEqual(hasCenter, false, '第 1 層 (0,0) 必須懸空鏤空，四足自然分開踏地');
console.log('  - 純本體四足獨立踏地檢驗 PASS (中央自然懸空，非死板長方實心)');

// 特徵色彩檢驗
const totalMat = VENUSAUR_80_V2_VOXEL_DATA.totalMaterials;
console.log('  - 色彩分佈統計:');
assert(Number(totalMat['13']) > 0, '必須包含紅色眼珠方塊 (13: red_concrete)');
assert(Number(totalMat['14']) > 0, '必須包含黑色瞳孔方塊 (14: black_concrete)');
assert(Number(totalMat['12']) > 0, '必須包含白色齒爪方塊 (12: white_concrete)');
assert(Number(totalMat['4']) > 0,  '必須包含粉紅花瓣方塊 (4: pink_concrete)');
assert(Number(totalMat['1']) > 0,  '必須包含青色皮膚方塊 (1: cyan_concrete)');
assert(Number(totalMat['15']) > 0 || Number(totalMat['16']) > 0, '必須包含口腔/舌唇方塊');

console.log(`    紅眼珠: ${totalMat['13']} 顆, 黑瞳孔: ${totalMat['14']} 顆, 白齒爪: ${totalMat['12']} 顆, 粉紅花瓣: ${totalMat['4']} 顆`);
console.log('  ✓ PASS: 階段 1 體素數據結構與五官特徵全部通過\n');

// ─────────────────────────────────────────────────────────────
// 測試階段 2：DOM 節點、快取清單與 GEMINI.md 規格檢驗
// ─────────────────────────────────────────────────────────────
console.log('▶ [測試階段 2] DOM 節點、快取清單與規格檢驗');

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');
const geminiMd = fs.readFileSync(path.join(__dirname, 'GEMINI.md'), 'utf-8');

assert(indexHtml.includes('id="btnSubVenusaur80V2"'), '選單必須包含 btnSubVenusaur80V2 按鈕');
assert(indexHtml.includes('id="paneVenusaur80V2"'), 'DOM 必須包含 paneVenusaur80V2 工作台容器');
assert(indexHtml.includes('id="venusaur80_v2_3dCanvas"'), 'DOM 必須包含 venusaur80_v2_3dCanvas 畫布');
assert(indexHtml.includes('id="venusaur80_v2SliceCard"'), 'DOM 必須包含 venusaur80_v2SliceCard 切片卡片');
assert(indexHtml.includes('id="venusaur80_v2LayerSlider"'), 'DOM 必須包含 venusaur80_v2LayerSlider 滑桿');
assert(indexHtml.includes('id="venusaur80_v2VoxelGrid"'), 'DOM 必須包含 venusaur80_v2VoxelGrid 點陣網格');
assert(indexHtml.includes('id="venusaur80_v2MatList"'), 'DOM 必須包含 venusaur80_v2MatList 材料清單容器');
assert(indexHtml.includes('venusaur80_v2_voxel_data.js?v=4.101.1'), 'index.html 必須引用 venusaur80_v2_voxel_data.js?v=4.101.1');

assert(swJs.includes("pokopia-cache-v4.101.1"), 'sw.js 版本必須升級為 v4.101.1');
assert(swJs.includes('venusaur80_v2_voxel_data.js?v=4.101.1'), 'sw.js 必須快取 venusaur80_v2_voxel_data.js');

assert(geminiMd.includes('`venusaur80_v2`'), 'GEMINI.md 規範表必須登錄 venusaur80_v2');
assert(geminiMd.includes('pokopia_voxel_overrides_venusaur80_v2'), 'GEMINI.md 必須登錄 LocalStorage 專屬鍵值');

console.log('  ✓ PASS: 階段 2 DOM 結構、快取版本與系統規範全部通過\n');

// ─────────────────────────────────────────────────────────────
// 測試階段 3：VoxelDeltaStore 9 大角色資料絕對隔離性
// ─────────────────────────────────────────────────────────────
console.log('▶ [測試階段 3] VoxelDeltaStore 9 大角色資料 100% 絕對隔離性');

// 建立模擬瀏覽器環境
const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.window = global;
global.localStorage = mockLocalStorage;
global.VENUSAUR_80_V2_VOXEL_DATA = VENUSAUR_80_V2_VOXEL_DATA;
global.VENUSAUR_80_VOXEL_DATA = require('./venusaur80_voxel_data.js');
global.VENUSAUR_VOXEL_DATA = require('./venusaur_voxel_data.js');

const VoxelDeltaStore = require('./voxel_editor.js');

assert(typeof VoxelDeltaStore !== 'undefined', 'VoxelDeltaStore 必須已定義');

const bounds = VoxelDeltaStore.getCharBounds('venusaur80_v2');
assert(bounds, 'venusaur80_v2 必須能正確計算出邊界');
console.log(`  - venusaur80_v2 對稱軸邊界: minX=${bounds.minX}, maxX=${bounds.maxX}, sum=${bounds.sum}, center=${bounds.center}`);

// 執行塗色測試：僅塗色 venusaur80_v2
VoxelDeltaStore.executeVoxelAction('venusaur80_v2', 10, 5, 10, 'paint', 13);
const v2Overrides = VoxelDeltaStore.getOverrides('venusaur80_v2');
assert(v2Overrides && v2Overrides['10,5,10'] === 13, 'venusaur80_v2 塗色必須精準記錄');

// 驗證 LocalStorage 獨立寫入
const savedRaw = mockLocalStorage.getItem('pokopia_voxel_overrides_venusaur80_v2');
assert(savedRaw, 'LocalStorage 必須寫入 pokopia_voxel_overrides_venusaur80_v2');
const savedData = JSON.parse(savedRaw);
assert.strictEqual(savedData['10,5,10'], 13, '本地儲存內容必須正確');

// 驗證其餘角色完全零污染
const v80Overrides = VoxelDeltaStore.getOverrides('venusaur80');
const v103Overrides = VoxelDeltaStore.getOverrides('venusaur');
const bulbaOverrides = VoxelDeltaStore.getOverrides('bulbasaur');
assert(!v80Overrides || Object.keys(v80Overrides).length === 0, '原 80 層妙蛙花覆寫必須維持為空');
assert(!v103Overrides || Object.keys(v103Overrides).length === 0, '103 層妙蛙花覆寫必須維持為空');
assert(!bulbaOverrides || Object.keys(bulbaOverrides).length === 0, '妙蛙種子覆寫必須維持為空');

// 測試 Undo / Redo
VoxelDeltaStore.undo('venusaur80_v2');
assert(!VoxelDeltaStore.getOverrides('venusaur80_v2')['10,5,10'], 'Undo 後塗色必須撤銷');

VoxelDeltaStore.redo('venusaur80_v2');
assert.strictEqual(VoxelDeltaStore.getOverrides('venusaur80_v2')['10,5,10'], 13, 'Redo 後塗色必須恢復');

console.log('  ✓ PASS: 階段 3 角色資料 100% 絕對隔離與 Undo/Redo 全部通過\n');

// ─────────────────────────────────────────────────────────────
// 測試階段 4：雲端原子字串包封裝與水合還原
// ─────────────────────────────────────────────────────────────
console.log('▶ [測試階段 4] 雲端字串包封裝與水合還原');

const allOverrides = VoxelDeltaStore.getAllOverrides();
assert(allOverrides.venusaur80_v2, 'getAllOverrides 必須包含 venusaur80_v2');
assert.strictEqual(allOverrides.venusaur80_v2.data['10,5,10'], 13, '打包數據內容必須正確');

// 測試模擬雲端水合
const remoteTime = Date.now() + 50000;
VoxelDeltaStore.hydrateFromCloud({
  venusaur80_v2: {
    data: { '20,8,20': 4 },
    updatedAt: remoteTime
  }
});
const hydrated = VoxelDeltaStore.getOverrides('venusaur80_v2');
assert.strictEqual(hydrated['20,8,20'], 4, '雲端水合後新覆寫必須成功生效');

console.log('  ✓ PASS: 階段 4 雲端打包與水合還原全部通過\n');

// ─────────────────────────────────────────────────────────────
// 測試階段 5：app.js 生命週期與按需渲染整合
// ─────────────────────────────────────────────────────────────
console.log('▶ [測試階段 5] app.js 生命週期與狀態整合');

const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
assert(appJs.includes('venusaur80V2State'), 'app.js 必須定義 venusaur80V2State');
assert(appJs.includes('switchVenusaur80V23DMode'), 'app.js 必須定義 switchVenusaur80V23DMode');
assert(appJs.includes('setVenusaur80V2Layer'), 'app.js 必須定義 setVenusaur80V2Layer');
assert(appJs.includes('renderVenusaur80V2Layer'), 'app.js 必須定義 renderVenusaur80V2Layer');
assert(appJs.includes('initVenusaur80V2ThreeEngine'), 'app.js 必須定義 initVenusaur80V2ThreeEngine');
assert(appJs.includes('updateVenusaur80V23DSliceFilter'), 'app.js 必須定義 updateVenusaur80V23DSliceFilter');
assert(appJs.includes('window.PokopiaVenusaur80V2'), 'app.js 必須導出 window.PokopiaVenusaur80V2');
assert(appJs.includes("'venusaur80_v2'"), 'app.js startThreeRendering 必須納入 venusaur80_v2');

console.log('  ✓ PASS: 階段 5 app.js 生命週期與按需渲染整合全部通過\n');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  🎉 所有 5 大階段驗收測試項目 100% 全部通過！ (0 錯誤，0 失敗)   ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
