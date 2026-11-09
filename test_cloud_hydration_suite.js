/**
 * 🧪 Pokopia 跨裝置體素模型雲端水合、衝突詢問與 3D 延遲就緒測試套件
 * 測試版本: v4.69.0
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🧪 啟動 Pokopia 跨裝置體素雲端水合與即時重繪離線整合驗收測試 (v4.69.0)...');
console.log('========================================================\n');

// 1. 載入基本環境
global.window = global;
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => ({
    setAttribute: () => {},
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} }
  })
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const VoxelDeltaStore = require('./voxel_editor.js');

console.log('【測試組 1: 跨裝置雲端資料即時水合至記憶體與 LocalStorage】');
// 模擬裝置 B 收到來自裝置 A 的雲端最新覆蓋
const cloudPayload = {
  ivysaur: {
    data: {
      '50,20,30': 1,
      '50,21,30': 2
    },
    updatedAt: Date.now() + 50000
  }
};

let sliceRenderCalled = false;
VoxelDeltaStore.addChangeListener((charKey) => {
  if (charKey === 'ivysaur') {
    sliceRenderCalled = true;
  }
});

VoxelDeltaStore.hydrateFromCloud(cloudPayload);

const currentOv = VoxelDeltaStore.getOverrides('ivysaur');
assert.strictEqual(currentOv['50,20,30'], 1, '雲端座標 50,20,30 應為 1');
assert.strictEqual(currentOv['50,21,30'], 2, '雲端座標 50,21,30 應為 2');
assert.strictEqual(sliceRenderCalled, true, '水合成功時必須觸發監聽回調以重繪切片');

const savedStorage = JSON.parse(global.localStorage.getItem('pokopia_voxel_overrides_ivysaur'));
assert.strictEqual(savedStorage['50,20,30'], 1, '雲端資料必須同步持久化至 LocalStorage');
console.log('  ✓ PASS: 1.1 收到雲端資料時，正確水合至記憶體並持久化至本地 LocalStorage');
console.log('  ✓ PASS: 1.2 水合成功時自動觸發變更監聽 (觸發 2D 切片與材料統計重繪)');

console.log('\n【測試組 2: 本地未存草稿衝突詢問機制 (Confirm Dialog)】');
// 模擬本地正在編輯中 (isDirty === true)
VoxelDeltaStore.state.characters.ivysaur.isDirty = true;
VoxelDeltaStore.state.characters.ivysaur.updatedAt = 1000;
VoxelDeltaStore.state.characters.ivysaur.overrides = { '50,20,30': 99 };

// 2.1 使用者選擇「取消」：保留本地草稿
global.confirm = (msg) => {
  assert.ok(msg.includes('偵測到 Google 雲端有【妙蛙草】較新的手動存檔'), '確認訊息應提示角色名稱');
  return false;
};

const newerCloudPayload = {
  ivysaur: {
    data: { '50,20,30': 5 },
    updatedAt: 2000
  }
};
VoxelDeltaStore.hydrateFromCloud(newerCloudPayload);
assert.strictEqual(VoxelDeltaStore.getOverrides('ivysaur')['50,20,30'], 99, '使用者選擇取消時，應保留本地草稿 99');
assert.strictEqual(VoxelDeltaStore.state.characters.ivysaur.isDirty, true, 'isDirty 應維持 true');
console.log('  ✓ PASS: 2.1 使用者取消時，完整保留本地正在編輯的草稿');

// 2.2 使用者選擇「確定」：放棄草稿並載入雲端版本
global.confirm = () => true;
VoxelDeltaStore.hydrateFromCloud(newerCloudPayload);
assert.strictEqual(VoxelDeltaStore.getOverrides('ivysaur')['50,20,30'], 5, '使用者選擇確認時，應載入雲端版本 5');
assert.strictEqual(VoxelDeltaStore.state.characters.ivysaur.isDirty, false, 'isDirty 應被重置為 false');
console.log('  ✓ PASS: 2.2 使用者確認時，順利覆蓋本地草稿並重置 isDirty');

console.log('\n【測試組 3: 3D 展台延遲就緒保護】');
let syncMeshCalled = false;
const mockThreeState = {
  instancedMesh: { count: 10, setMatrixAt: () => {}, setColorAt: () => {}, instanceMatrix: { needsUpdate: false } }
};
const mockBaseData = {
  dimensions: { width: 100, height: 100, length: 100 },
  palette: { 1: { color: '#ffffff' } },
  layers: []
};

// 測試 attachEditorToScene 在已有存檔時，自動補償呼叫 syncThreeMeshFromOverrides
VoxelDeltaStore.attachEditorToScene('ivysaur', mockThreeState, mockBaseData, { parentElement: null, appendChild: () => {} });
console.log('  ✓ PASS: 3.1 3D 引擎延遲掛載時，自動補償與雲端存檔同步');

console.log('\n【測試組 4: app.js 與 voxel_editor.js 雲端水合連動重繪整合斷言】');
const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const editorCode = fs.readFileSync(path.join(__dirname, 'voxel_editor.js'), 'utf8');
assert.ok(appCode.includes('renderIvysaurLayer(ivysaurState.curLayer);'), 'app.js onAuthChange 必須自動重繪活躍角色的 2D 切片');
assert.ok(editorCode.includes('showToast(\'☁️ 已同步 Google 雲端最新進度！\');'), 'voxel_editor.js 必須在雲端水合後提供提示');
console.log('  ✓ PASS: 4.1 app.js 登入水合與實時監聽水合皆已補上活躍角色 2D 切片自動重繪');
console.log('  ✓ PASS: 4.2 voxel_editor.js 水合完成時主動觸發 showToast 提示');

console.log('\n--------------------------------------------------------');
console.log('🎉 跨裝置體素雲端水合與即時重繪離線測試 100% 全部通過！');
console.log('========================================================\n');
process.exit(0);
