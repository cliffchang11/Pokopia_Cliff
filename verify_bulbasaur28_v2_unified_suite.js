const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== 開始執行 🍃 妙蛙種子 28 層・超採樣版 (v4.98.0) 整合測試 ===');

// 1. 載入體素資料庫並驗證幾何與格式
const dataCode = fs.readFileSync(path.join(__dirname, 'bulbasaur28_v2_voxel_data.js'), 'utf8');
const BULBASAUR_28_V2_VOXEL_DATA = eval(dataCode + '; BULBASAUR_28_V2_VOXEL_DATA');

assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.layers.length, 28, '必須嚴格為 28 層');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.totalBlocks, 4260, '總方塊數應為 4,260');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.dimensions.width, 23, '寬度應為奇數 23');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.bounds.centerX, 12, 'X 對稱中心應為 12');

let blockSum = 0;
BULBASAUR_28_V2_VOXEL_DATA.layers.forEach((layer, idx) => {
  assert.strictEqual(layer.layerIndex, idx + 1, `第 ${idx + 1} 層應具備標準 layerIndex`);
  assert(Array.isArray(layer.blocks), `第 ${idx + 1} 層應具備標準 blocks 陣列`);
  assert(layer.blocks.length > 0, `第 ${idx + 1} 層不得為空`);
  blockSum += layer.blocks.length;
});
assert.strictEqual(blockSum, 4260, '各層方塊加總必須等於 4,260');
console.log('✅ [1/5] 體素資料庫幾何、層數與標準格式驗證通過 (28層, 4,260顆)');

// 2. 驗證 index.html 與 sw.js 版本與 DOM 結構
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
[
  'id="btnSubBulba28V2"',
  'id="paneBulba28V2"',
  'id="bulba28V2_3dCanvas"',
  'id="bulba28V2VoxelGrid"',
  'bulbasaur28_v2_voxel_data.js?v=4.98.0',
  'app.js?v=4.98.0'
].forEach(token => {
  assert(indexHtml.includes(token), `index.html 缺少必要元素: ${token}`);
});

const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
assert(swJs.includes("pokopia-cache-v4.98.0"), 'sw.js 快取版本必須為 v4.98.0');
assert(swJs.includes("./bulbasaur28_v2_voxel_data.js?v=4.98.0"), 'sw.js 必須快取 bulbasaur28_v2_voxel_data.js?v=4.98.0');
console.log('✅ [2/5] index.html DOM 結構與 sw.js (v4.98.0) 快取驗證通過');

// 3. 模擬瀏覽器環境測試 VoxelDeltaStore 隔離性與雲端水合
const mockStorage = {};
global.localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};
global.window = global;
global.BULBASAUR_28_V2_VOXEL_DATA = BULBASAUR_28_V2_VOXEL_DATA;

global.VoxelDeltaStore = require(path.join(__dirname, 'voxel_editor.js'));

assert(typeof global.VoxelDeltaStore !== 'undefined', 'VoxelDeltaStore 必須成功掛載');
const bounds = global.VoxelDeltaStore.getCharBounds('bulbasaur28_v2');
assert.strictEqual(bounds.center, 12, 'VoxelDeltaStore 對稱中心必須為 12');

// 寫入一筆 v2 修改，確認不污染 bulbasaur28
global.VoxelDeltaStore.executeVoxelAction('bulbasaur28_v2', 12, 0, 10, 'paint', 5);
assert.strictEqual(global.VoxelDeltaStore.getEffectiveBid('bulbasaur28_v2', 12, 0, 10), 5, 'v2 修改應即時生效');
assert(mockStorage['pokopia_voxel_overrides_bulbasaur28_v2'], '應寫入專屬 localStorage 鍵值');
assert(!mockStorage['pokopia_voxel_overrides_bulbasaur28'], '不得污染經典版 bulbasaur28 的 localStorage');

const allOverrides = global.VoxelDeltaStore.getAllOverrides();
assert(allOverrides.bulbasaur28_v2, 'getAllOverrides() 必須包含 bulbasaur28_v2');
assert(!allOverrides.bulbasaur28, 'getAllOverrides() 不應無故包含 bulbasaur28');
console.log('✅ [3/5] VoxelDeltaStore 角色資料絕對隔離與儲存測試通過');

// 4. 雲端水合測試
global.VoxelDeltaStore.hydrateFromCloud({
  bulbasaur28_v2: {
    data: { '12,1,10': 7 },
    updatedAt: Date.now() + 5000
  }
});
assert.strictEqual(global.VoxelDeltaStore.getEffectiveBid('bulbasaur28_v2', 12, 1, 10), 7, '雲端水合應正確注入 v2 修改');
assert(!mockStorage['pokopia_voxel_overrides_bulbasaur28'], '雲端水合不得污染 bulbasaur28');
console.log('✅ [4/5] VoxelDeltaStore 雲端水合測試通過');

// 5. app.js 關鍵函式與整合點驗證
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
[
  'const bulba28V2State =',
  'function switchBulba28V23DMode(',
  'function setBulba28V2Layer(',
  'function renderBulba28V2Layer(',
  'function initBulba28V2ThreeEngine(',
  'function updateBulba28V23DSliceFilter(',
  "switchCharacterBlueprint('bulba28_v2')"
].forEach(fn => {
  assert(appJs.includes(fn), `app.js 缺少關鍵整合點: ${fn}`);
});
console.log('✅ [5/5] app.js 2D/3D 雙引擎與工作台整合點驗證通過');
console.log('🎉 妙蛙種子 28 層・超採樣版 (v4.98.0) 全數測試 100% 通過！');
