const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🧪 啟動 Pokopia 3D/2D 雙向儲存按鈕同步與消除方塊徹底生效測試...');
console.log('========================================================\n');

// 1. 載入妙蛙草資料庫
const ivysaurCode = fs.readFileSync(path.join(__dirname, 'ivysaur_voxel_data.js'), 'utf8');
const fn = new Function(ivysaurCode + '; return IVYSAUR_VOXEL_DATA;');
global.IVYSAUR_VOXEL_DATA = fn();

// 2. 測試 3D 與 2D 儲存按鈕雙向完全同步
console.log('【測試 1: 3D 與 2D 儲存按鈕雙向完全同步】');

// 模擬 DOM 節點
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(cls) { this.classes.add(cls); }
  remove(cls) { this.classes.delete(cls); }
  contains(cls) { return this.classes.has(cls); }
}

function createMockButton(id, charKey) {
  const icon = { textContent: '✔' };
  const text = { textContent: '已是最新' };
  return {
    id: id,
    classList: new MockClassList(),
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    getAttribute(k) {
      if (k === 'data-char') return charKey;
      return this.attributes[k];
    },
    querySelector(sel) {
      if (sel === '.ve-save-icon') return icon;
      if (sel === '.ve-save-text') return text;
      return null;
    }
  };
}

const mockBtn3D = createMockButton('btnSaveCloud_ivysaur', 'ivysaur');
mockBtn3D.classList.add('ve-btn');
mockBtn3D.classList.add('ve-btn-save-cloud');

const mockBtn2D = createMockButton('btnSaveCloud2D_ivysaur', 'ivysaur');
mockBtn2D.classList.add('ve-btn');
mockBtn2D.classList.add('ve-btn-save-cloud');

const allButtons = [mockBtn3D, mockBtn2D];

global.document = {
  querySelectorAll: function (selector) {
    if (selector.includes('ve-btn-save-cloud') || selector.includes('btnSaveCloud')) {
      return allButtons;
    }
    return [];
  },
  getElementById: function (id) {
    if (id === 'btnSaveCloud_ivysaur') return mockBtn3D;
    if (id === 'btnSaveCloud2D_ivysaur') return mockBtn2D;
    return null;
  }
};

let cloudSavedPayload = null;
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  PokopiaFirebase: {
    saveVoxelOverrides: async function (charKey, overrides, updatedAt) {
      cloudSavedPayload = { charKey, overrides: { ...overrides }, updatedAt };
      return { success: true, cloud: true };
    }
  }
};

// 載入 VoxelDeltaStore
delete require.cache[require.resolve('./voxel_editor.js')];
const store = require('./voxel_editor.js');

// 初始狀態下，雙端按鈕皆不應有 is-dirty
assert.strictEqual(mockBtn3D.classList.contains('is-dirty'), false);
assert.strictEqual(mockBtn2D.classList.contains('is-dirty'), false);
console.log('  ✓ 初始狀態：3D 與 2D 按鈕皆平靜顯示「已是最新」');

// 執行 2D 操作（塗色）
store.executeVoxelAction('ivysaur', 40, 20, 50, 'paint', 3);

// 驗證 3D 與 2D 按鈕同時變色並顯示未儲存！
assert.strictEqual(mockBtn3D.classList.contains('is-dirty'), true, '3D 按鈕必須亮起 is-dirty');
assert.strictEqual(mockBtn2D.classList.contains('is-dirty'), true, '2D 按鈕必須亮起 is-dirty');
assert.strictEqual(mockBtn3D.querySelector('.ve-save-text').textContent, '儲存修改 (未儲存)');
assert.strictEqual(mockBtn2D.querySelector('.ve-save-text').textContent, '儲存修改 (未儲存)');
console.log('  ✓ PASS: 在 2D 進行編輯後，3D 與 2D 雙端儲存按鈕瞬間同步亮起「💾 儲存修改 (未儲存)」！');

// 點擊儲存按鈕（觸發手動儲存）
(async () => {
  const saveRes = await store.saveOverridesToCloud('ivysaur');
  assert.strictEqual(saveRes.success, true);
  assert.strictEqual(mockBtn3D.classList.contains('is-dirty'), false, '儲存後 3D 按鈕 is-dirty 必須被清除');
  assert.strictEqual(mockBtn2D.classList.contains('is-dirty'), false, '儲存後 2D 按鈕 is-dirty 必須被清除');
  assert.strictEqual(mockBtn3D.querySelector('.ve-save-text').textContent, '已儲存至雲端');
  assert.strictEqual(mockBtn2D.querySelector('.ve-save-text').textContent, '已儲存至雲端');
  console.log('  ✓ PASS: 點擊儲存後，3D 與 2D 雙端按鈕同步切換為「✔ 已儲存至雲端」，is-dirty 完全解除！');

  // 【測試 2: 消除方塊 Firebase 角色級原子覆蓋與資料庫清除】
  console.log('\n【測試 2: 消除方塊 Firebase 角色級原子覆蓋與資料庫清除】');

  // 測試消除一顆方塊（例如 sampleAddedKey: 69, 22, 56）
  const initialBid = store.getEffectiveBid('ivysaur', 69, 22, 56);
  assert.strictEqual(initialBid, 1, '69,22,56 初始應有方塊 (bid=1)');

  store.executeVoxelAction('ivysaur', 69, 22, 56, 'delete');
  const deletedBid = store.getEffectiveBid('ivysaur', 69, 22, 56);
  assert.strictEqual(deletedBid, -1, '消除後 69,22,56 的 effectiveBid 必須為 -1');

  // 驗證雙端按鈕再次同步亮起未儲存
  assert.strictEqual(mockBtn3D.classList.contains('is-dirty'), true);
  assert.strictEqual(mockBtn2D.classList.contains('is-dirty'), true);
  console.log('  ✓ PASS: 消除方塊後，3D 與 2D 按鈕再次同步亮起未儲存');

  // 執行儲存
  await store.saveOverridesToCloud('ivysaur');
  assert.ok(cloudSavedPayload, 'Firebase 雲端儲存被成功觸發');
  assert.strictEqual(cloudSavedPayload.charKey, 'ivysaur');
  assert.strictEqual(cloudSavedPayload.overrides['69,22,56'], undefined, '消除的新增方塊在雲端 overrides 中必須徹底被 delete 移除');
  console.log('  ✓ PASS: 消除之方塊在雲端上傳 payload 中已徹底被拔除 (undefined)');

  // 檢查 firebase.js 中是否使用 mergeFields 角色級原子鎖定
  const firebaseCode = fs.readFileSync(path.join(__dirname, 'firebase.js'), 'utf8');
  assert.ok(firebaseCode.includes('saveCloudProgress(uid, progressData, mergeFields = null)'), 'saveCloudProgress 必須支援 mergeFields 參數');
  assert.ok(firebaseCode.includes('setOptions = (Array.isArray(mergeFields) && mergeFields.length > 0)'), 'setDoc 必須依 mergeFields 配置');
  assert.ok(firebaseCode.includes("[`voxelOverrides.${charKey}`]"), 'saveVoxelOverrides 必須帶入角色級 mergeFields 參數');
  console.log('  ✓ PASS: firebase.js 100% 採用角色級 mergeFields 原子覆蓋，徹底根除 Firestore 舊方塊殘留！');

  // 【測試 3: 消除方塊重新整理防回彈測試】
  console.log('\n【測試 3: 消除方塊重新整理防回彈測試】');
  // 建立持久化 mock localStorage
  const mockStorage = {};
  global.localStorage = {
    getItem: k => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: k => { delete mockStorage[k]; }
  };

  // 將當前消除後的 overrides 存入 LocalStorage
  store.saveOverridesToStorage('ivysaur');

  // 模擬重新整理網頁（清空 require 快取重新載入）
  delete require.cache[require.resolve('./voxel_editor.js')];
  const refreshedStore = require('./voxel_editor.js');

  const bidAfterRefresh = refreshedStore.getEffectiveBid('ivysaur', 69, 22, 56);
  assert.strictEqual(bidAfterRefresh, -1, '重新整理後，消除之方塊必須維持 -1，絕不自動長回！');
  console.log('  ✓ PASS: 重新整理頁面後，消除的方塊 100% 保持消除狀態，零回彈！');

  console.log('\n========================================================');
  console.log('🎉 雙向儲存按鈕同步與消除方塊徹底生效測試 100% PASS！');
  console.log('========================================================\n');
})();
