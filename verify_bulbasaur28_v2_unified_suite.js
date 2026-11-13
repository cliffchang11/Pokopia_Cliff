const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== 開始執行 🍃 妙蛙種子 28 層・超採樣版 雙眼重塑 (v4.98.2) 整合測試 ===');

// 1. 載入體素資料庫並驗證幾何、格式與五官色彩比例
const dataCode = fs.readFileSync(path.join(__dirname, 'bulbasaur28_v2_voxel_data.js'), 'utf8');
const BULBASAUR_28_V2_VOXEL_DATA = eval(dataCode + '; BULBASAUR_28_V2_VOXEL_DATA');

assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.layers.length, 28, '必須嚴格為 28 層');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.totalBlocks, 4256, '總方塊數應為 4,256');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.dimensions.width, 23, '寬度應為奇數 23');
assert.strictEqual(BULBASAUR_28_V2_VOXEL_DATA.bounds.centerX, 12, 'X 對稱中心應為 12');

let blockSum = 0;
const totalMatCounts = {};
BULBASAUR_28_V2_VOXEL_DATA.layers.forEach((layer, idx) => {
  assert.strictEqual(layer.layerIndex, idx + 1, `第 ${idx + 1} 層應具備標準 layerIndex`);
  assert(Array.isArray(layer.blocks), `第 ${idx + 1} 層應具備標準 blocks 陣列`);
  assert(layer.materials && typeof layer.materials === 'object', `第 ${idx + 1} 層必須具備 materials 字典`);
  assert(layer.blocks.length > 0, `第 ${idx + 1} 層不得為空`);
  blockSum += layer.blocks.length;

  layer.blocks.forEach(([x, z, bid]) => {
    totalMatCounts[bid] = (totalMatCounts[bid] || 0) + 1;
  });
});
assert.strictEqual(blockSum, 4256, '各層方塊加總必須等於 4,256');

// 驗證眼睛黑眼圈消除 (ID 12 曜石黑受到嚴格抑制，紅虹膜與白高光比例正常)
const blackCount = totalMatCounts[12] || 0;
const whiteEyeCount = totalMatCounts[10] || 0;
const redEyeCount = totalMatCounts[11] || 0;

assert(blackCount > 0 && blackCount <= 40, `黑色方塊 (ID 12) 應受到抑制（當前 ${blackCount} 顆，預期 <= 40），絕不可有巨型黑墨鏡`);
assert(whiteEyeCount >= 20, `白高光點 (ID 10) 應充足（當前 ${whiteEyeCount} 顆）`);
assert(redEyeCount >= 8, `緋紅虹膜 (ID 11) 應充足（當前 ${redEyeCount} 顆）`);

// 驗證雙眼關於 X=12 軸完美對稱
BULBASAUR_28_V2_VOXEL_DATA.layers.forEach(l => {
  const eyeBlocks = l.blocks.filter(b => [10, 11, 12].includes(b[2]));
  const map = new Map();
  eyeBlocks.forEach(([x, z, bid]) => map.set(`${x},${z}`, bid));

  eyeBlocks.forEach(([x, z, bid]) => {
    const mirrorX = 24 - x; // 12 - (x - 12) = 24 - x
    const mirrorBid = map.get(`${mirrorX},${z}`);
    assert.strictEqual(mirrorBid, bid, `第 ${l.layerIndex} 層五官在 X=${x} 與對稱點 X=${mirrorX} 顏色必須完全對稱一致`);
  });
});

console.log(`✅ [1/5] 體素幾何與雙眼五官比例驗證通過 (總方塊 4,256 顆，黑瞳 ${blackCount} 顆，白光 ${whiteEyeCount} 顆，紅瞳 ${redEyeCount} 顆，X=12 完美對稱)`);

// 2. 驗證 index.html 與 sw.js 版本推進
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
[
  'id="btnSubBulba28V2"',
  'id="paneBulba28V2"',
  'id="bulba28V2_3dCanvas"',
  'id="bulba28V2VoxelGrid"',
  'bulbasaur28_v2_voxel_data.js?v='
].forEach(token => {
  assert(indexHtml.includes(token), `index.html 缺少必要元素: ${token}`);
});

const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
assert(/pokopia-cache-v4\.\d+\.\d+/.test(swJs), 'sw.js 快取版本必須為最新版本');
assert(swJs.includes("./bulbasaur28_v2_voxel_data.js?v="), 'sw.js 必須快取 bulbasaur28_v2_voxel_data.js');
console.log('✅ [2/5] index.html DOM 結構與 sw.js 快取一致性驗證通過');

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
console.log('🎉 妙蛙種子 28 層・超採樣版 雙眼重塑 (v4.98.2) 全數測試 100% 通過！');
process.exit(0);
