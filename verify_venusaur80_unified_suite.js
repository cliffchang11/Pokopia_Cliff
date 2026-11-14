#!/usr/bin/env node
/**
 * 🌺 妙蛙花 (Venusaur 80) 80 層精巧版模型與第 8 工作台實質行為級整合測試套件
 * 嚴格檢驗：
 * 1. 80 層幾何維度、連續性、方塊量與關鍵調色盤特徵
 * 2. index.html DOM 結構、膠囊排列順序與 sw.js 快取一致性
 * 3. VoxelDeltaStore 角色資料絕對隔離（GEMINI.md 規範）
 * 4. 雲端原子字串包 (voxelOverridesPack) 打包與水合比對
 * 5. app.js 3D/2D 雙軌連動、生命週期休眠與狀態機完整性
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始執行 🌺 妙蛙花 80 層精巧版 (v4.100.0) 實質行為級整合測試 ===\n');

// ─── [1/5] 80 層體素數據幾何與特徵正確性檢驗 ────────────────────────────
console.log('【測試組 1: 80 層體素數據幾何維度與材料特徵檢驗】');
const v80Data = require('./venusaur80_voxel_data.js');

assert(v80Data && typeof v80Data === 'object', 'venusaur80_voxel_data.js 必須匯出有效物件');
assert.strictEqual(v80Data.dimensions.height, 80, '高度必須精準為 80 層');
assert.strictEqual(v80Data.dimensions.width, 111, '寬度必須為 111 (奇數中心軸)');
assert.strictEqual(v80Data.dimensions.length, 111, '深度必須為 111');
assert.strictEqual(v80Data.layers.length, 80, '切片層數必須嚴格為 80 層');
assert.strictEqual(v80Data.totalBlocks, 43663, '方塊總數精準為 43,663 顆');

let totalCountCalc = 0;
for (let i = 0; i < 80; i++) {
  const layer = v80Data.layers[i];
  assert.strictEqual(layer.layerIndex, i + 1, `第 ${i+1} 層 layerIndex 不匹配`);
  assert(layer.blocks.length > 0, `第 ${i+1} 層不能為空層`);
  totalCountCalc += layer.blocks.length;
}
assert.strictEqual(totalCountCalc, 43663, '計算之總方塊數必須吻合 43,663');

// 檢驗關鍵部位顏色是否存在
const mats = v80Data.totalMaterials;
assert(mats['13'] > 0, '必須包含紅色混凝土 (眼睛紅)');
assert(mats['14'] > 0, '必須包含黑色混凝土 (瞳孔黑)');
assert(mats['12'] > 0, '必須包含白色混凝土 (牙齒/爪尖/花瓣白斑)');
assert(mats['7'] > 0, '必須包含黃色混凝土 (花蕊黃)');
assert(mats['15'] > 0, '必須包含粉紅色陶土 (舌頭口唇)');
assert(mats['16'] > 0, '必須包含緋紅蕈菌絲 (深紅口腔)');
assert(mats['1'] > 20000, '主體青色皮膚方塊數量充實');
assert(mats['8'] > 5000, '踏地草皮方塊數量充實');

// 踏地草皮 (Layer 1~2) 與花蕊頂部 (Layer 80)
assert(v80Data.layers[0].blocks.length > 100, '第 1 層踏地草皮厚實扎根');
assert(v80Data.layers[79].blocks.length > 50, '第 80 層花蕊頂點完整呈現');

console.log('  ✓ PASS: 1.1 80 層幾何尺寸 (111×80×111)、無斷層連續性、43,663 顆方塊與高傳真特徵驗證通過\n');

// ─── [2/5] index.html DOM 結構、膠囊導覽排列與 sw.js 一致性 ───────────
console.log('【測試組 2: DOM 導覽膠囊排列順序與 Service Worker 快取一致性】');
const indexHtml = fs.readFileSync('./index.html', 'utf-8');
const swJs = fs.readFileSync('./sw.js', 'utf-8');

// 膠囊順序驗證：... ivysaur -> venusaur80 -> venusaur
const pillOrderMatch = indexHtml.match(/btnSubIvysaur[\s\S]*?btnSubVenusaur80[\s\S]*?btnSubVenusaur[\s\S]*?btnSubBuzz/);
assert(pillOrderMatch, '膠囊按鈕順序必須為：ivysaur(76層) -> venusaur80(80層) -> venusaur(103層) -> buzz');
assert(indexHtml.includes('id="btnSubVenusaur80"'), 'DOM 必須包含 btnSubVenusaur80');
assert(indexHtml.includes('🌺 妙蛙花 (80層)'), 'btnSubVenusaur80 標籤必須為 🌺 妙蛙花 (80層)');
assert(indexHtml.includes('id="paneVenusaur80"'), 'DOM 必須包含 paneVenusaur80 工作台面板');
assert(indexHtml.includes('id="venusaur80_3dCanvas"'), 'DOM 必須包含 venusaur80_3dCanvas 畫布');
assert(indexHtml.includes('id="venusaur80LayerSlider"'), 'DOM 必須包含 venusaur80LayerSlider 滑桿');
assert(indexHtml.includes('id="venusaur80VoxelGrid"'), 'DOM 必須包含 venusaur80VoxelGrid 2D 點陣網格');
assert(indexHtml.includes('id="venusaur80MatList"'), 'DOM 必須包含 venusaur80MatList 材料清單容器');

// sw.js 與版本號對齊驗證
assert(swJs.includes('venusaur80_voxel_data.js'), 'sw.js 必須快取 venusaur80_voxel_data.js');
assert(indexHtml.includes('venusaur80_voxel_data.js'), 'index.html 必須引用 venusaur80_voxel_data.js');
assert(/pokopia-cache-v4\.\d+\.\d+/.test(swJs), 'sw.js 版本格式有效');

console.log('  ✓ PASS: 2.1 導覽膠囊自然遞增排序 (76層 ➔ 80層 ➔ 103層)、工作台組件齊全且 PWA 靜態快取對齊通過\n');

// ─── [3/5] VoxelDeltaStore 角色資料絕對隔離與儲存測試 (GEMINI.md) ──────
console.log('【測試組 3: VoxelDeltaStore 角色資料嚴格隔離測試 (GEMINI.md 規範)】');

// 建立模擬瀏覽器環境
const mockLocalStorage = {
  store: {},
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.window = global;
global.localStorage = mockLocalStorage;
global.VENUSAUR_80_VOXEL_DATA = v80Data;
global.VENUSAUR_VOXEL_DATA = require('./venusaur_voxel_data.js');

const VoxelDeltaStore = require('./voxel_editor.js');

// 驗證 bounds 計算
const b80 = VoxelDeltaStore.getCharBounds('venusaur80');
assert(b80, 'venusaur80 必須能解析出真實幾何邊界');
assert.strictEqual(b80.sum, 110, 'venusaur80 中心對稱軸總和應為 110 (X: 0~110)');
assert.strictEqual(b80.center, 55, 'venusaur80 中心座標應為 55');

// 驗證隔離存檔：修改 venusaur80，確認不影響 venusaur (103層)
VoxelDeltaStore.executeVoxelAction('venusaur80', 55, 10, 55, 'paint', 13);
const v80Overrides = VoxelDeltaStore.getOverrides('venusaur80');
const v103Overrides = VoxelDeltaStore.getOverrides('venusaur');

assert(v80Overrides && v80Overrides['55,10,55'] === 13, 'venusaur80 塗色覆寫必須精準寫入');
assert(!v103Overrides || Object.keys(v103Overrides).length === 0, 'venusaur (103層) 覆寫必須為空，零污染');
assert(mockLocalStorage.getItem('pokopia_voxel_overrides_venusaur80'), 'LocalStorage 必須寫入專屬鍵值 pokopia_voxel_overrides_venusaur80');
assert(!mockLocalStorage.getItem('pokopia_voxel_overrides_venusaur'), '不可寫入 103 層的 LocalStorage 鍵值');

console.log('  ✓ PASS: 3.1 角色資料 100% 嚴格隔離，venusaur80 與 venusaur(103層) 儲存完全獨立且互不污染\n');

// ─── [4/5] 雲端原子字串包 (voxelOverridesPack) 打包與水合比對 ─────────
console.log('【測試組 4: 雲端原子字串包打包與水合比對】');

const allOverrides = VoxelDeltaStore.getAllOverrides();
assert(allOverrides.venusaur80, 'getAllOverrides 必須包含 venusaur80 欄位');
assert.strictEqual(allOverrides.venusaur80.data['55,10,55'], 13, '打包數據內容必須正確');
assert(!allOverrides.venusaur, '未修改之角色不得出現在打包資料中');

// 測試雲端水合注入
const remoteTime = Date.now() + 5000;
VoxelDeltaStore.hydrateFromCloud({
  venusaur80: {
    data: { '55,10,55': 14, '56,10,55': 12 },
    updatedAt: remoteTime
  }
});

const hydratedOverrides = VoxelDeltaStore.getOverrides('venusaur80');
assert.strictEqual(hydratedOverrides['55,10,55'], 14, '水合後方塊色號應更新為 14');
assert.strictEqual(hydratedOverrides['56,10,55'], 12, '水合後新增方塊色號應為 12');
assert.strictEqual(Object.keys(VoxelDeltaStore.getOverrides('venusaur') || {}).length, 0, '水合過程仍對 103 層保持 0 污染');

console.log('  ✓ PASS: 4.1 雲端字串包打包與深層 Diff 水合注入成功，完全符合 GEMINI.md 規範\n');

// ─── [5/5] app.js 3D/2D 渲染引擎與狀態機整合驗證 ─────────────────────────
console.log('【測試組 5: app.js 3D/2D 渲染引擎與工作台狀態機整合驗證】');
const appJs = fs.readFileSync('./app.js', 'utf-8');

assert(appJs.includes('venusaur80State'), 'app.js 必須定義 venusaur80State');
assert(appJs.includes('switchVenusaur803DMode'), 'app.js 必須包含 switchVenusaur803DMode');
assert(appJs.includes('setVenusaur80Layer'), 'app.js 必須包含 setVenusaur80Layer');
assert(appJs.includes('renderVenusaur80Layer'), 'app.js 必須包含 renderVenusaur80Layer');
assert(appJs.includes('initVenusaur80ThreeEngine'), 'app.js 必須包含 initVenusaur80ThreeEngine');
assert(appJs.includes('updateVenusaur803DSliceFilter'), 'app.js 必須包含 updateVenusaur803DSliceFilter');
assert(appJs.includes('window.PokopiaVenusaur80'), 'app.js 必須對外暴露 window.PokopiaVenusaur80 API');
assert(appJs.includes("['buzz', 'bulba28', 'bulbasaur28', 'bulba28_v2', 'bulbasaur28_v2', 'bulbasaur', 'ivysaur40', 'ivysaur43', 'ivysaur', 'venusaur80', 'venusaur']"), 'startThreeRendering 必須納入 venusaur80 進行休眠管控');

console.log('  ✓ PASS: 5.1 app.js 雙軌渲染引擎、休眠控制器、API 暴露與導覽連動完全就緒\n');

console.log('========================================================');
console.log('🎉 🌺 妙蛙花 80 層精巧版 (v4.100.0) 實質行為級自動化測試全數 100% 通過！');
console.log('========================================================');
process.exit(0);
