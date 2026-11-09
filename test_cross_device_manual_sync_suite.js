/**
 * test_cross_device_manual_sync_suite.js
 * 跨裝置手動儲存權威與開機防覆寫極限離線驗證套件
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('🚀 開始執行：跨裝置手動儲存權威與開機防覆寫驗證套件\n');

// ─── 模擬瀏覽器環境 ───────────────────────────────────────────────
const mockLocalStorageData = {};
global.localStorage = {
  getItem: (key) => mockLocalStorageData[key] || null,
  setItem: (key, val) => { mockLocalStorageData[key] = String(val); },
  removeItem: (key) => { delete mockLocalStorageData[key]; },
  clear: () => {
    Object.keys(mockLocalStorageData).forEach(k => delete mockLocalStorageData[k]);
  }
};

global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    appendChild: () => {},
    style: {}
  })
};
global.window = global;
global.showToast = () => {};

// 載入體素資料
require('./buzz_voxel_data.js');
require('./bulbasaur_voxel_data.js');
require('./ivysaur_voxel_data.js');
require('./venusaur_voxel_data.js');

// ─── 測試 1：開機與塗色時間戳防污染驗證 ─────────────────────────────
console.log('【測試 1：開機與塗色時間戳防污染驗證】');
global.localStorage.clear();

// 模擬 Firebase save 監聽
let cloudSaveTriggeredOnBoot = false;
global.PokopiaFirebase = {
  saveVoxelOverrides: () => {
    cloudSaveTriggeredOnBoot = true;
    return { success: true };
  }
};

// 載入 VoxelDeltaStore
delete require.cache[require.resolve('./voxel_editor.js')];
const VoxelDeltaStore = require('./voxel_editor.js');

// 1. 開機後不應自動調用 Firebase save
assert.strictEqual(cloudSaveTriggeredOnBoot, false, '開機時嚴格禁止自動上傳覆蓋雲端！');
console.log('  ✓ PASS: 開機時無未經授權的自動雲端上傳');

// 2. 開機後時間戳不應被設為 Date.now()
const bootTime = global.localStorage.getItem('pokopia_voxel_time_ivysaur');
assert.strictEqual(bootTime, null, '開機時本地時間戳必須為 null，不應被偽造為 Date.now()');
console.log('  ✓ PASS: 開機時本地時間戳保持乾淨 (null)');

// 3. 在畫布塗色或消除，時間戳依然保持為 null (不污染)
VoxelDeltaStore.executeVoxelAction('ivysaur', 50, 10, 50, 'paint', 2);
assert.strictEqual(VoxelDeltaStore.state.characters.ivysaur.isDirty, true, '塗色後必須標記為 isDirty: true');
const paintTime = global.localStorage.getItem('pokopia_voxel_time_ivysaur');
assert.strictEqual(paintTime, null, '塗色期間手動儲存時間戳絕不更新，防止污染');
console.log('  ✓ PASS: 塗色期間草稿妥善保存，且時間戳未被污染');

// 4. 僅在手動點擊儲存按鈕時，才打上手動時間戳
let cloudSavedChar = null;
let cloudSavedTime = null;
global.PokopiaFirebase.saveVoxelOverrides = (charKey, overrides, now) => {
  cloudSavedChar = charKey;
  cloudSavedTime = now;
  return { success: true, cloud: true };
};

(async function runSuite() {
  const preSaveTime = Date.now();
  await VoxelDeltaStore.saveOverridesToCloud('ivysaur');
  assert.strictEqual(cloudSavedChar, 'ivysaur', '手動儲存觸發正確角色');
  assert.ok(cloudSavedTime >= preSaveTime, '手動儲存帶有合法的當前時間戳');
  const savedLocalTime = Number(global.localStorage.getItem('pokopia_voxel_time_ivysaur'));
  assert.strictEqual(savedLocalTime, cloudSavedTime, 'LocalStorage 時間戳與手動儲存時間戳精確同步');
  assert.strictEqual(VoxelDeltaStore.state.characters.ivysaur.isDirty, false, '手動儲存完成後 isDirty 恢復為 false');
  console.log('  ✓ PASS: 唯有手動儲存時才產生合法時間戳與上傳雲端');


  // ─── 測試 2：跨裝置開機與重新整理防覆寫驗證 (公司電腦 vs 家裡手機) ─────
  console.log('\n【測試 2：跨裝置開機與重新整理防覆寫驗證 (公司電腦 vs 家裡手機)】');
  // 載入 Firebase 模組
  delete require.cache[require.resolve('./firebase.js')];
  require('./firebase.js');
  const fb = global.PokopiaFirebase;

  // 模擬公司電腦在下午 17:00 儲存了妙蛙草自訂模型 (包含新增與消除)
  const OFFICE_SAVE_TIME = 1700000000000;
  const officeOverrides = {
    '60,36,53': -1, // 消除方塊
    '50,20,50': 5   // 新增方塊
  };
  const mockCloudDoc = {
    voxelOverrides: {
      ivysaur: {
        data: officeOverrides,
        updatedAt: OFFICE_SAVE_TIME
      }
    }
  };

  // 模擬使用者回到家，手機剛開啟網頁 (手機本地為乾淨或舊快取，時間戳為 0)
  VoxelDeltaStore.resetLocalActionTime('ivysaur');
  const phoneLocalSnapshot = {
    voxelOverrides: {
      ivysaur: {
        data: { '60,36,53': 1 }, // 手機本地可能是舊資料
        updatedAt: 0 // 手機未手動儲存過
      }
    }
  };

  // 執行登入合併
  const mergedOnPhone = fb.mergeProgressUnion(phoneLocalSnapshot, mockCloudDoc);

  // 驗證：合併成果必須完全等於公司電腦的存檔
  assert.deepStrictEqual(mergedOnPhone.voxelOverrides.ivysaur.data, officeOverrides, '手機開機合併時，雲端手動存檔必須 100% 覆蓋手機本地資料！');
  assert.strictEqual(mergedOnPhone.voxelOverrides.ivysaur.updatedAt, OFFICE_SAVE_TIME, '雲端時間戳必須完整保留');
  console.log('  ✓ PASS: 手機開機合併時，公司存檔具備最高權威，未被手機舊資料污染');

  // 手機端執行雲端水合
  let sliceRerendered = false;
  VoxelDeltaStore.addChangeListener((charKey) => {
    if (charKey === 'ivysaur') sliceRerendered = true;
  });

  VoxelDeltaStore.hydrateFromCloud(mergedOnPhone.voxelOverrides);
  assert.strictEqual(sliceRerendered, true, '水合完成後必須即時通知監聽器重繪視圖');
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 60, 36, 53), -1, '消除方塊在手機上正確呈現消除 (-1)');
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 50, 20, 50), 5, '新增方塊在手機上正確呈現材質 5');
  console.log('  ✓ PASS: 手機本地體素資料庫與視圖重繪 100% 成功水合');


  // ─── 測試 3：登入切換邊界與舊版格式相容性驗證 ─────────────────────────
  console.log('\n【測試 3：登入切換邊界與舊版格式相容性驗證】');

  // 模擬雲端文件存有舊版未包裹 data 的扁平結構
  const legacyCloudDoc = {
    'voxelOverrides.ivysaur': {
      '40,10,40': 8
    }
  };
  const normalized = fb.normalizeCloudData(legacyCloudDoc);
  assert.ok(normalized.voxelOverrides.ivysaur, 'normalizeCloudData 正確將 dotKey 轉為巢狀結構');
  assert.strictEqual(normalized.voxelOverrides.ivysaur.data['40,10,40'], 8, '舊版扁平資料正確被包裝進 data 欄位');
  assert.ok(normalized.voxelOverrides.ivysaur.updatedAt > 0, '自動補全有效時間戳防止被判定為過期');
  console.log('  ✓ PASS: 舊版與各版本 Firestore 結構相容性 100% 穩健');

  console.log('\n🎉 所有跨裝置手動儲存與開機防覆寫測試全部 PASS！');
  process.exit(0);
})().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
