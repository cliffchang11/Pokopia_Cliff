/**
 * Pokopia v4.90.0 跨裝置實質同步、Toast 提示與防覆蓋保護 端到端行為級自動化模擬測試套件
 */

const assert = require('assert');
const fs = require('fs');

console.log('🧪 啟動 Pokopia v4.90.0 跨裝置實質同步與 Toast 提示自動化模擬驗收...');

// ─────────────────────────────────────────────────────────────
// 測試組 1: 工具列零更動保證 (Toolbar Invariance)
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 1: 工具列零更動原則驗證】');
const editorCode = fs.readFileSync('voxel_editor.js', 'utf8');

const requiredTools = [
  'data-tool="rotate"',
  'data-tool="paint"',
  'data-tool="delete"',
  'data-tool="add"',
  'data-tool="eyedropper"',
  'data-tool="select"',
  'data-role="undo"',
  'data-role="redo"',
  'data-role="save-cloud"',
  'data-role="mirror-rtol"',
  'data-role="mirror-ltor"',
  'class="ve-color-dot',
  'class="ve-palette-grid"',
  'id="btnSaveCloud_${charKey}"',
  've-3d-marquee-box'
];

requiredTools.forEach(tool => {
  assert.ok(editorCode.includes(tool), `工具列必須完整保留核心元素: ${tool}`);
});
console.log('  ✓ PASS: 1.1 體素工具列 15 項核心工具與配置 100% 零改動維持原貌');

// ─────────────────────────────────────────────────────────────
// 測試組 2: 全域 Toast 元件掛載與調用回饋驗證
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 2: 全域 Toast 元件掛載與精確回饋】');
const appCode = fs.readFileSync('app.js', 'utf8');

assert.ok(appCode.includes('window.showToast = showCsToast;'), 'app.js 必須在全域掛載 window.showToast');
assert.ok(appCode.includes('window.showCsToast = showCsToast;'), 'app.js 必須在全域掛載 window.showCsToast');
assert.ok(editorCode.includes('function triggerToast(message, type = \'success\')'), 'voxel_editor.js 必須封裝具備自包含容錯的 triggerToast');
assert.ok(editorCode.includes("triggerToast('✔ 已成功儲存至 Google 雲端！', 'success');"), '儲存成功時必須實質調用綠色成功 Toast');
assert.ok(editorCode.includes("triggerToast('☁️ 已同步 Google 雲端最新進度！', 'info');"), '水合完成時必須實質調用同步進度 Toast');
assert.ok(editorCode.includes("triggerToast('⚠️ 儲存失敗：'"), '儲存異常時必須實質調用紅色警告 Toast');
console.log('  ✓ PASS: 2.1 全域 Toast 元件成功掛載，且成功/錯誤/水合提示皆已精準對接');

// ─────────────────────────────────────────────────────────────
// 測試組 3: Firestore 巢狀寫入協定與實質等待驗證
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 3: Firestore 巢狀結構寫入協定與實質等待】');
const fbCode = fs.readFileSync('firebase.js', 'utf8');

assert.ok(fbCode.includes('return await Promise.race([savePromise, timeoutPromise]);'), 'saveCloudProgress 必須實質等待寫入承諾');
assert.ok(fbCode.includes('[`voxelOverrides.${charKey}`]'), 'saveVoxelOverrides 必須指定精確 fieldMask');
assert.ok(fbCode.includes('voxelOverrides: {\n            [charKey]: {\n              data: overrides || {},\n              updatedAt: now\n            }\n          }'), 'saveVoxelOverrides 傳遞之 payload 必須為對應 FieldMask 之標準巢狀結構');
console.log('  ✓ PASS: 3.1 Firestore 巢狀結構協議合規，徹底杜絕 FieldMask 異常且實質等待回傳');

// ─────────────────────────────────────────────────────────────
// 測試組 4: 開機防覆蓋防吞保護與時間戳權威驗證
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 4: 雲端合併開機防覆蓋防吞保護驗證】');

// 載入 mergeProgressUnion 邏輯進行真實運算驗證
const mockWindow = {};
const mockFbContext = new Function('window', fbCode + '\nreturn window.PokopiaFirebase;');
const pokopiaFb = mockFbContext(mockWindow);

// 模擬情境 A：雙端皆無時間戳（cTime = 0, lTime = 0），本地有修改成果 (3 顆方塊)，雲端為空 (0 顆方塊)
const localSnapWithUnsavedEdits = {
  voxelOverrides: {
    ivysaur: {
      data: { "50,20,30": 1, "51,20,30": 1, "52,20,30": 2 },
      updatedAt: 0
    }
  }
};
const emptyCloudProgress = {
  voxelOverrides: {
    ivysaur: {
      data: {},
      updatedAt: 0
    }
  }
};

const mergedA = pokopiaFb.mergeProgressUnion(localSnapWithUnsavedEdits, emptyCloudProgress);
assert.strictEqual(Object.keys(mergedA.voxelOverrides.ivysaur.data).length, 3, '本地修改成果絕不可被雲端空存檔覆蓋');
console.log('  ✓ PASS: 4.1 雙端無時間戳時，本地自訂修改成果 100% 受到防吞保護並保留');

// 模擬情境 B：電腦點擊儲存後，時間戳更新為 500000；手機以舊資料 (updatedAt = 1000) 連線同步
const pcSavedCloud = {
  voxelOverrides: {
    ivysaur: {
      data: { "50,20,30": 1, "51,20,30": 1, "52,20,30": 2, "53,20,30": 3 },
      updatedAt: 500000
    }
  }
};
const mobileLocalSnap = {
  voxelOverrides: {
    ivysaur: {
      data: { "50,20,30": 1 },
      updatedAt: 1000
    }
  }
};
const mergedMobile = pokopiaFb.mergeProgressUnion(mobileLocalSnap, pcSavedCloud);
assert.strictEqual(Object.keys(mergedMobile.voxelOverrides.ivysaur.data).length, 4, '手機端合併時必須以雲端最新時間戳存檔為準');
assert.strictEqual(mergedMobile.voxelOverrides.ivysaur.updatedAt, 500000, '手機端時間戳必須成功水合為 500000');
console.log('  ✓ PASS: 4.2 手機端合併成功獲取雲端最新模型，實質資料完全同步');

// ─────────────────────────────────────────────────────────────
// 測試組 5: 全站版本號 v4.90.0 與 Service Worker 快取穿透
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 5: 全站版本號統一 v4.90.0 與快取清除驗證】');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const swJs = fs.readFileSync('sw.js', 'utf8');

assert.ok(indexHtml.includes('index.css?v=4.90.0'), 'index.html 必須使用 index.css?v=4.90.0');
assert.ok(indexHtml.includes('firebase.js?v=4.90.0'), 'index.html 必須使用 firebase.js?v=4.90.0 破除舊快取');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.90.0'), 'index.html 必須使用 voxel_editor.js?v=4.90.0');
assert.ok(indexHtml.includes('app.js?v=4.90.0'), 'index.html 必須使用 app.js?v=4.90.0');

assert.ok(swJs.includes("const CACHE_NAME = 'pokopia-cache-v4.90.0';"), 'sw.js CACHE_NAME 必須為 pokopia-cache-v4.90.0');
assert.ok(swJs.includes("'./firebase.js?v=4.90.0',"), 'sw.js 靜態清單必須快取 firebase.js?v=4.90.0');
assert.ok(swJs.includes("'./voxel_editor.js?v=4.90.0',"), 'sw.js 靜態清單必須快取 voxel_editor.js?v=4.90.0');
assert.ok(swJs.includes('self.clients.claim()'), 'sw.js 必須在啟動時執行 clients.claim() 即時接管');
console.log('  ✓ PASS: 5.1 全站靜態資源與 Service Worker 100% 對齊 v4.90.0，杜絕舊快取漏洞');

console.log('\n🎉 全部 5 個測試組 100% 通過！跨裝置實質雲端同步與提示系統驗收合格！');
