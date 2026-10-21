const fs = require('fs');
const assert = require('assert');

console.log('=== [開始離線驗證：自訂影片儲存、立即直寫雲端與官方預設增補 (v4.13.2)] ===\n');

const appJs = fs.readFileSync('app.js', 'utf8');
const firebaseJs = fs.readFileSync('firebase.js', 'utf8');

// 1. 驗證全域 saveProgress 快照是否完整包含自訂影片相關欄位
console.log('1. 驗證全域 saveProgress 快照完整性：');
assert.ok(
  appJs.includes('customVideos:      state.customVideos      || [],') &&
  appJs.includes('customVideoTags:   state.customVideoTags   || [],') &&
  appJs.includes('deletedVideoTags:  state.deletedVideoTags  || [],'),
  '❌ 測試失敗：app.js 中的 saveProgress snapshot 遺漏了 customVideos 相關欄位！'
);
console.log('  ✅ [PASS] saveProgress snapshot 完整收錄 customVideos、customVideoTags 與 deletedVideoTags');

// 2. 驗證 saveCustomVideosAndSync 是否改為立即直寫雲端 (fb.saveCloudProgress) 且不受 isAutoFarmAuthorized 阻擋
console.log('\n2. 驗證 saveCustomVideosAndSync 立即直寫與無阻擋同步：');
assert.ok(
  appJs.includes('function saveCustomVideosAndSync()') &&
  appJs.includes('fb.saveCloudProgress(user.uid, {') &&
  appJs.includes('customVideos: state.customVideos,'),
  '❌ 測試失敗：saveCustomVideosAndSync 未採用 fb.saveCloudProgress 立即直寫雲端！'
);
assert.ok(
  !appJs.includes('if (user && user.uid && isAutoFarmAuthorized(user)) {\n        fb.debouncedSave'),
  '❌ 測試失敗：saveCustomVideosAndSync 仍殘留 isAutoFarmAuthorized 阻擋或 debouncedSave！'
);
console.log('  ✅ [PASS] saveCustomVideosAndSync 成功採用 fb.saveCloudProgress 立即直寫，徹底杜絕防抖競態覆蓋');

// 3. 驗證 app.js customVideos 初始化是否支援「官方新預設影片自動無痛增補」
console.log('\n3. 驗證 customVideos 初始化時的預設影片自動增補邏輯：');
assert.ok(
  appJs.includes('const existingIds = new Set(list.map(v => v.id));') &&
  appJs.includes('!existingIds.has(def.id)'),
  '❌ 測試失敗：app.js 初始化 customVideos 缺少官方新預設影片自動增補邏輯！'
);
console.log('  ✅ [PASS] app.js 初始化已配置官方新影片自動增補，且優先保留既有自訂內容');

// 4. 驗證 firebase.js 中的 mergeProgressUnion 是否支援官方預設影片補齊
console.log('\n4. 驗證 firebase.js mergeProgressUnion 邏輯：');
assert.ok(
  firebaseJs.includes('defaultVideos.forEach(def => {') &&
  firebaseJs.includes('!videoMap.has(def.id)'),
  '❌ 測試失敗：firebase.js mergeProgressUnion 缺少 defaultVideos 自動增補邏輯！'
);
console.log('  ✅ [PASS] firebase.js 具備跨裝置同步時自動增補官方新發布影片之防護');

// 5. 離線資料流模擬測試
console.log('\n5. 離線資料流模擬測試（本地新增影片 + 雲端合併 + 官方增量）：');
global.POKOPIA_DEFAULT_VIDEOS = [
  { id: 'def_01', videoId: 'yt_01', title: '預設攻略 1', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'def_02', videoId: 'yt_02', title: '預設攻略 2', createdAt: '2026-01-02T00:00:00Z' },
  { id: 'def_new_03', videoId: 'yt_03', title: '未來官方新增攻略 3', createdAt: '2026-01-03T00:00:00Z' }
];

// 提取 firebase.js 中的 mergeProgressUnion 函式進行實測
const mergeFnMatch = firebaseJs.match(/function mergeProgressUnion\(local, cloud\) \{([\s\S]*?)\n  \}/);
assert.ok(mergeFnMatch, '無法提取 mergeProgressUnion');
const simulatedMerge = new Function('local', 'cloud', mergeFnMatch[1]);

const mockLocal = {
  customVideos: [
    { id: 'user_video_999', videoId: 'my_yt', title: '玩家手機自訂新增影片', createdAt: '2026-10-21T10:00:00Z' },
    { id: 'def_01', videoId: 'yt_01', title: '預設攻略 1 (玩家已看過)', createdAt: '2026-01-01T00:00:00Z' }
  ]
};

const mockCloud = {
  customVideos: [
    { id: 'def_01', videoId: 'yt_01', title: '預設攻略 1', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'def_02', videoId: 'yt_02', title: '預設攻略 2', createdAt: '2026-01-02T00:00:00Z' }
  ]
};

const merged = simulatedMerge(mockLocal, mockCloud);
assert.ok(Array.isArray(merged.customVideos), '合併結果必須為陣列');
// 驗證最新自訂影片排在首位
assert.strictEqual(merged.customVideos[0].id, 'user_video_999', '最新自訂影片應排在最前面');
// 驗證包含了未來官方新增的 def_new_03
const hasDef3 = merged.customVideos.some(v => v.id === 'def_new_03');
assert.ok(hasDef3, '合併結果應自動增補官方新增影片 def_new_03');
// 驗證總共有 4 部影片 (user_video_999, def_01, def_02, def_new_03)
assert.strictEqual(merged.customVideos.length, 4, '合併後應精確包含 4 部影片');
console.log('  ✅ [PASS] 模擬測試成功：玩家自訂影片穩居首位，且官方新增預設影片 100% 自動無縫補齊！');

console.log('\n========================================');
console.log('🎉 自訂影片儲存與雲端立即直寫單元測試 100% 通過！');
console.log('========================================\n');
process.exit(0);
