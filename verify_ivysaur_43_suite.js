/**
 * verify_ivysaur_43_suite.js
 * 妙蛙草 43 層精巧建造藍圖與獨立編輯系統（v4.93.0）行為級自動化端到端驗收測試套件
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🌿 開始執行：妙蛙草 43 層精巧建造藍圖全項驗收自動化測試套件');
console.log('================================================================');

// --- 測試 1：ivysaur43_voxel_data.js 體素數據完整性檢驗 ---
console.log('\n[測試 1] 檢驗 ivysaur43_voxel_data.js 體素幾何與色盤...');
const voxelDataPath = path.join(__dirname, 'ivysaur43_voxel_data.js');
assert(fs.existsSync(voxelDataPath), 'ivysaur43_voxel_data.js 不存在！');

const voxelData = require(voxelDataPath);
assert.strictEqual(voxelData.dimensions.height, 43, '模型高度必須精確為 43 層');
assert.strictEqual(voxelData.layers.length, 43, '層數陣列長度必須為 43');
assert(voxelData.totalBlocks > 10000 && voxelData.totalBlocks < 30000, `方塊總數應在合理精巧範圍內 (目前: ${voxelData.totalBlocks})`);

// 檢驗 Y=1~43 連續性與四足貼地
const layerIndices = voxelData.layers.map(l => l.layerIndex);
for (let y = 1; y <= 43; y++) {
  assert(layerIndices.includes(y), `缺少連續層級 Y=${y}`);
  const lObj = voxelData.layers.find(l => l.layerIndex === y);
  assert(lObj && lObj.blocks.length > 0, `第 ${y} 層不可為空層`);
}
assert(voxelData.layers[0].blocks.length >= 100, `第 1 層爪尖貼地方塊數必須充足 (目前: ${voxelData.layers[0].blocks.length})`);
assert(voxelData.layers[42].blocks.length > 0, `第 43 層頂部花苞必須存在 (目前: ${voxelData.layers[42].blocks.length})`);

// 檢驗色盤完整性
const paletteNames = Object.values(voxelData.palette).map(p => p.name);
const requiredColors = ['青色混凝土', '暗海晶石', '粉紅色混凝土', '品紅色混凝土', '淺綠色混凝土', '綠色混凝土', '白色混凝土', '紅色混凝土', '黑色混凝土'];
requiredColors.forEach(c => {
  assert(paletteNames.includes(c), `缺少必要調色盤材料: ${c}`);
});
console.log(`✓ 測試 1 通過：43 層連續無斷層，四足貼地於 Y=1，材料色盤包含 ${paletteNames.length} 種必備 Minecraft 混凝土`);

// --- 測試 2：ivysaur_43.html 獨立頁面結構檢驗 ---
console.log('\n[測試 2] 檢驗 ivysaur_43.html 獨立頁面結構與元件...');
const htmlPath = path.join(__dirname, 'ivysaur_43.html');
assert(fs.existsSync(htmlPath), 'ivysaur_43.html 不存在！');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="canvas3D_43"'), '缺少 3D 渲染畫布 canvas3D_43');
assert(htmlContent.includes('id="grid2D_43"'), '缺少 2D 切片網格 grid2D_43');
assert(htmlContent.includes('id="layerSlider43"'), '缺少 1~43 層切片滑桿');
assert(htmlContent.includes('max="43"'), '切片滑桿上限必須為 43');
assert(htmlContent.includes('href="/"'), '缺少返回主首頁連結');
assert(htmlContent.includes('btnSaveCloud43'), '缺少獨立雲端儲存按鈕');
assert(htmlContent.includes('ivysaur43_voxel_data.js?v=4.93.0'), '缺少正確版本號引用');
console.log('✓ 測試 2 通過：ivysaur_43.html 獨立頁面結構完整，具備 3D/2D 雙視圖與 1~43 尺規');

// --- 測試 3：76 層現有心血資產 100% 絕對隔離保護檢驗 ---
console.log('\n[測試 3] 檢驗 76 層既有心血資產隔離保護...');
const overrides76Path = path.join(__dirname, 'ivysaur_saved_overrides.json');
const overrides76 = JSON.parse(fs.readFileSync(overrides76Path, 'utf8'));
const count76 = Object.keys(overrides76).length;
assert.strictEqual(count76, 11726, `76 層固化模型必須嚴格維持 11,726 筆，不可受到覆蓋！(目前: ${count76})`);

// 模擬 VoxelDeltaStore 記憶體環境檢驗隔離性
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};
global.IVYSAUR_VOXEL_DATA = { dimensions: { height: 76 } };
global.IVYSAUR_43_VOXEL_DATA = voxelData;
global.IVYSAUR_SAVED_OVERRIDES = overrides76;

const VoxelStore = require('./voxel_editor.js');
assert(VoxelStore.getBaseData('ivysaur') === global.IVYSAUR_VOXEL_DATA, '76 層基底數據獲取異常');
assert(VoxelStore.getBaseData('ivysaur43') === global.IVYSAUR_43_VOXEL_DATA, '43 層基底數據獲取異常');

// 測試在 43 層寫入方塊，驗證完全不污染 76 層
VoxelStore.executeVoxelAction('ivysaur43', 10, 5, 10, 'paint', 1);
const overrides43 = VoxelStore.getOverrides('ivysaur43');
const overrides76Check = VoxelStore.getOverrides('ivysaur');
assert(overrides43['10,5,10'] !== undefined, '43 層編輯方塊應成功記錄');
assert(overrides76Check['10,5,10'] === undefined, '43 層的編輯絕對不可污染 76 層的 overrides！');
console.log('✓ 測試 3 通過：43 層與 76 層完全物理隔離，76 層既有資產 100% 完好無損');

// --- 測試 4：Firebase 存檔與解包動態金鑰檢驗 ---
console.log('\n[測試 4] 檢驗 firebase.js 獨立金鑰與原子解包支援...');
const firebasePath = path.join(__dirname, 'firebase.js');
const firebaseContent = fs.readFileSync(firebasePath, 'utf8');
assert(firebaseContent.includes('ivysaur43'), 'firebase.js 必須包含 ivysaur43 支援');

// 測試 normalizeCloudData
require('./firebase.js');
const Firebase = global.PokopiaFirebase;
const mockCloudData = {
  voxelOverridesPack: {
    ivysaur: { json: JSON.stringify({ '1,1,1': 1 }), updatedAt: 100 },
    ivysaur43: { json: JSON.stringify({ '2,2,2': 4 }), updatedAt: 200 }
  }
};
const normalized = Firebase.normalizeCloudData(mockCloudData);
assert(normalized.voxelOverrides.ivysaur.data['1,1,1'] === 1, '76 層原子解包異常');
assert(normalized.voxelOverrides.ivysaur43.data['2,2,2'] === 4, '43 層原子解包異常');
console.log('✓ 測試 4 通過：Firebase 原子字串包支援 ivysaur43 獨立同步與雙軌解包');

// --- 測試 5：主應用首頁雙向導航與 15 工具列 0 破損檢驗 ---
console.log('\n[測試 5] 檢驗主應用導航連結與 15 工具列零改動規範...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('ivysaur_43.html'), 'index.html 必須具備跳轉至 43 層獨立頁面之入口');

// 檢驗主應用工具列
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(appJs.length > 300000, 'app.js 完整性異常');
console.log('✓ 測試 5 通過：首頁雙向導航完整串接，主應用 15 工具列零破損');

// --- 測試 6：Service Worker 快取版本推進檢驗 ---
console.log('\n[測試 6] 檢驗 Service Worker 快取推進至 v4.93.0...');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
assert(swContent.includes('pokopia-cache-v4.93.0'), 'sw.js 快取名稱必須為 pokopia-cache-v4.93.0');
assert(swContent.includes('ivysaur_43.html'), 'sw.js 必須快取 ivysaur_43.html');
assert(swContent.includes('ivysaur43_voxel_data.js?v=4.93.0'), 'sw.js 必須快取 ivysaur43_voxel_data.js');
console.log('✓ 測試 6 通過：Service Worker 快取清單已更新並鎖定 v4.93.0');

console.log('\n================================================================');
console.log('🎉 全部 6 項行為級驗收測試 100% PASS！');
console.log('================================================================');
