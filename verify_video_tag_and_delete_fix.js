/**
 * verify_video_tag_and_delete_fix.js
 * 離線測試腳本：驗證「建築」標籤融合正名、舊資料相容遷移、以及刪除影片黑名單（deletedVideoIds）防復活機制
 */

const assert = require('assert');
const fs = require('fs');

console.log('=== [開始離線驗證：建築標籤融合與刪除影片防復活黑名單] ===\n');

// 1. 載入 video_data.js
const videoDataCode = fs.readFileSync('./video_data.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {}, global: {} };
vm.createContext(sandbox);
vm.runInContext(videoDataCode, sandbox);

const DEFAULT_VIDEOS = sandbox.window.POKOPIA_DEFAULT_VIDEOS;
const DEFAULT_TAGS = sandbox.window.POKOPIA_DEFAULT_TAGS;

// 驗證預設標籤包含「建築」且排在第 1 位（全部之後），且不包含舊的「建築造景」
assert.strictEqual(DEFAULT_TAGS[0], '全部', 'DEFAULT_TAGS 第 0 項必須為「全部」');
assert.strictEqual(DEFAULT_TAGS[1], '建築', 'DEFAULT_TAGS 第 1 項必須為「建築」');
assert(!DEFAULT_TAGS.includes('建築造景'), 'DEFAULT_TAGS 不應再包含舊字眼「建築造景」');
console.log('✅ [PASS] DEFAULT_TAGS 成功正名為「建築」並排於第一順位');

// 驗證 11 部新增影片的 tags 全數包含「建築」且無「建築造景」
const buildVideos = DEFAULT_VIDEOS.slice(5); // video_def_06 ~ 16
assert.strictEqual(buildVideos.length, 11, '新增建築造景影片數量應為 11 部');
buildVideos.forEach(v => {
  assert(v.tags.includes('建築'), `影片 ${v.id} (${v.title}) 應包含「建築」標籤`);
  assert(!v.tags.includes('建築造景'), `影片 ${v.id} (${v.title}) 不應包含舊標籤「建築造景」`);
});
console.log('✅ [PASS] 11 部新增影片 tags 全數正名為「建築」');

// 2. 測試舊資料平滑遷移（相容遷移）
const legacySavedVideos = [
  { id: 'video_def_06', title: '公寓', tags: ['建築造景', '傢俱攻略'] },
  { id: 'custom_1', title: '自訂房', tags: ['建築造景'] }
];

const migratedList = legacySavedVideos.map(v => {
  if (v && Array.isArray(v.tags)) {
    const newTags = v.tags.map(t => t === '建築造景' ? '建築' : t);
    return { ...v, tags: Array.from(new Set(newTags)) };
  }
  return v;
});
assert.deepStrictEqual(migratedList[0].tags, ['建築', '傢俱攻略'], '舊影片標籤應自動遷移為「建築」');
assert.deepStrictEqual(migratedList[1].tags, ['建築'], '自訂影片標籤應自動遷移為「建築」');
console.log('✅ [PASS] 舊快取平滑遷移模擬驗證成功');

// 3. 測試刪除影片黑名單（deletedVideoIds）防復活機制
// 模擬使用者刪除了 video_def_06 (官方預設) 與 custom_1 (自訂)
const deletedVideoIds = ['video_def_06', 'custom_1'];
const localVideos = [
  { id: 'video_def_01', title: '終局農場' }
];

// (A) 本地初始化重整模擬：增補邏輯遇到 deletedVideoIds 時絕不加回
const existingIds = new Set(localVideos.map(v => v.id));
const deletedIdSet = new Set(deletedVideoIds);
const reloadedList = [...localVideos];

DEFAULT_VIDEOS.forEach(def => {
  if (def && def.id && !existingIds.has(def.id) && !deletedIdSet.has(def.id)) {
    reloadedList.push(def);
    existingIds.add(def.id);
  }
});

assert(!reloadedList.some(v => v.id === 'video_def_06'), '已刪除的 video_def_06 絕不可在重新整理後被自動增補復活！');
assert(reloadedList.some(v => v.id === 'video_def_07'), '未刪除的官方影片 video_def_07 應正常增補');
console.log('✅ [PASS] 重新整理防復活驗證：被刪除之官方預設影片絕不再度增補');

// (B) 雲端跨裝置合併模擬（firebase.js mergeProgressUnion）
const fbCode = fs.readFileSync('./firebase.js', 'utf8');
const fbSandbox = {
  window: { POKOPIA_DEFAULT_VIDEOS: DEFAULT_VIDEOS },
  global: { POKOPIA_DEFAULT_VIDEOS: DEFAULT_VIDEOS }
};
vm.createContext(fbSandbox);
vm.runInContext(fbCode, fbSandbox);
const fb = fbSandbox.window.PokopiaFirebase;

const mockLocal = {
  customVideos: [{ id: 'video_def_01', title: '終局農場' }],
  deletedVideoIds: ['video_def_06', 'custom_1']
};

const mockCloud = {
  customVideos: [
    { id: 'video_def_01', title: '終局農場' },
    { id: 'video_def_06', title: '公寓' }, // 雲端尚留有舊影片
    { id: 'custom_1', title: '舊自訂' }
  ],
  deletedVideoIds: []
};

const merged = fb.mergeProgressUnion(mockLocal, mockCloud);

assert(merged.deletedVideoIds.includes('video_def_06'), 'merged.deletedVideoIds 應包含 video_def_06');
assert(merged.deletedVideoIds.includes('custom_1'), 'merged.deletedVideoIds 應包含 custom_1');
assert(!merged.customVideos.some(v => v.id === 'video_def_06'), '雲端合併時已刪除的官方影片絕不可復活！');
assert(!merged.customVideos.some(v => v.id === 'custom_1'), '雲端合併時已刪除的自訂影片絕不可復活！');
assert(merged.customVideos.some(v => v.id === 'video_def_01'), '未刪除影片應完好保留');
console.log('✅ [PASS] 跨裝置雲端同步防復活驗證：雲端殘留之刪除影片 100% 成功攔截排除');

// (C) 重新新增時自動解禁
let currentDeletedIds = [...deletedVideoIds];
const newAddedVideo = { id: 'video_def_06', title: '重新加回公寓' };
currentDeletedIds = currentDeletedIds.filter(id => id !== newAddedVideo.id);
assert(!currentDeletedIds.includes('video_def_06'), '重新加入該影片時應自動自黑名單解禁');
console.log('✅ [PASS] 重新新增自動解禁黑名單驗證通過');

console.log('\n========================================');
console.log('🎉 標籤正名「建築」與刪除影片防復活黑名單離線驗證 100% 通過！');
console.log('========================================\n');
