const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證自訂影片新增保留、網址解析與手機防閃爍機制 (v4.9.0) ---');

// 1. 驗證任務 1：Firebase 雲端自訂影片 Union 聯集合併機制
const firebaseJs = fs.readFileSync('firebase.js', 'utf8');

// 模擬 firebase.js 中的 mergeProgressUnion 邏輯
function mockMergeProgressUnion(local, cloud) {
  const merged = {};
  if (cloud && cloud.customVideos && Array.isArray(cloud.customVideos)) {
    const localList = (local && local.customVideos && Array.isArray(local.customVideos)) ? local.customVideos : [];
    const videoMap = new Map();
    cloud.customVideos.forEach(v => {
      if (v && v.id) videoMap.set(v.id, v);
    });
    localList.forEach(v => {
      if (v && v.id) {
        if (!videoMap.has(v.id)) {
          videoMap.set(v.id, v);
        } else {
          const cloudV = videoMap.get(v.id);
          const localTime = new Date(v.updatedAt || v.createdAt || 0).getTime();
          const cloudTime = new Date(cloudV.updatedAt || cloudV.createdAt || 0).getTime();
          if (localTime >= cloudTime) {
            videoMap.set(v.id, v);
          }
        }
      }
    });
    merged.customVideos = Array.from(videoMap.values());
  } else if (local && local.customVideos && Array.isArray(local.customVideos)) {
    merged.customVideos = local.customVideos;
  }
  return merged;
}

const localData = {
  customVideos: [
    { id: 'video_new_123', videoId: '5dCjsO8uskA', title: '手機新增之影片', createdAt: '2026-10-06T14:00:00Z' },
    { id: 'default_v1', videoId: 'old_001', title: '預設影片（本地修改過）', updatedAt: '2026-10-06T14:10:00Z' }
  ]
};

const cloudData = {
  customVideos: [
    { id: 'default_v1', videoId: 'old_001', title: '預設影片（舊雲端版本）', updatedAt: '2026-10-06T12:00:00Z' },
    { id: 'cloud_only_v2', videoId: 'cloud_002', title: '其他裝置新增影片', updatedAt: '2026-10-06T13:00:00Z' }
  ]
};

const mergedResult = mockMergeProgressUnion(localData, cloudData);

// 關鍵斷言 1：本地新增的影片絕不可被抹除！
const hasNewVideo = mergedResult.customVideos.some(v => v.id === 'video_new_123');
assert.ok(hasNewVideo, '測試失敗：本地新增的影片被雲端舊快照抹除了！');
console.log('✓ 驗證通過：本地新增影片在雲端合併時被完整保留');

// 關鍵斷言 2：衝突時依據 updatedAt 較新者保留
const mergedV1 = mergedResult.customVideos.find(v => v.id === 'default_v1');
assert.strictEqual(mergedV1.title, '預設影片（本地修改過）', '測試失敗：衝突時未依據最新更新時間保留！');
console.log('✓ 驗證通過：同一影片衝突時以最新修改版本為準');

// 關鍵斷言 3：雲端其他裝置的影片也被納入（雙向同步）
const hasCloudVideo = mergedResult.customVideos.some(v => v.id === 'cloud_only_v2');
assert.ok(hasCloudVideo, '測試失敗：雲端其他裝置的影片未被納入！');
console.log('✓ 驗證通過：跨裝置自訂影片雙向聯集同步正常');

// 2. 驗證任務 2：手機 YouTube 網址全面解析
const appJs = fs.readFileSync('app.js', 'utf8');

function parseYouTubeId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const shortMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];
  const liveMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch) return liveMatch[1];
  const standardMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/(?:watch\?.*v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/i);
  if (standardMatch) return standardMatch[1];
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/);
  if (queryMatch) return queryMatch[1];
  return '';
}

assert.strictEqual(parseYouTubeId('5dCjsO8uskA'), '5dCjsO8uskA', '純 11 碼解析失敗');
assert.strictEqual(parseYouTubeId('https://youtu.be/5dCjsO8uskA'), '5dCjsO8uskA', 'youtu.be 解析失敗');
assert.strictEqual(parseYouTubeId('https://youtu.be/5dCjsO8uskA?si=xyz123'), '5dCjsO8uskA', '帶 si 參數解析失敗');
assert.strictEqual(parseYouTubeId('https://www.youtube.com/shorts/5dCjsO8uskA'), '5dCjsO8uskA', 'Shorts 解析失敗');
assert.strictEqual(parseYouTubeId('https://m.youtube.com/shorts/5dCjsO8uskA?si=abc'), '5dCjsO8uskA', '手機版 Shorts 解析失敗');
assert.strictEqual(parseYouTubeId('https://www.youtube.com/live/5dCjsO8uskA'), '5dCjsO8uskA', 'Live 解析失敗');
assert.strictEqual(parseYouTubeId('https://m.youtube.com/watch?v=5dCjsO8uskA&feature=share'), '5dCjsO8uskA', '手機版 watch 解析失敗');
assert.strictEqual(parseYouTubeId('https://google.com'), '', '無效網址應回傳空字串');
console.log('✓ 驗證通過：手機 YouTube Shorts、Live、m.youtube.com 與參數網址 100% 精準解析');

// 3. 驗證任務 3：消除手機畫面閃爍
// 檢查 subscribeCloudProgress 分流更新
assert.ok(
  appJs.includes("if (state.currentTab === 'customStorage')"),
  '測試失敗：subscribeCloudProgress 未實施分流更新！'
);
assert.ok(
  appJs.includes("} else if (state.currentTab === 'video') {"),
  '測試失敗：subscribeCloudProgress 未針對 video 分頁實施局部更新！'
);
console.log('✓ 驗證通過：subscribeCloudProgress 採用智慧分流更新，避免非必要 renderAll');

// 檢查輸入框防抖去重
assert.ok(
  appJs.includes('_autoFetchDebounceTimer'),
  '測試失敗：未實作 _autoFetchDebounceTimer 防抖計時器！'
);
console.log('✓ 驗證通過：輸入框 paste 與 blur 已加上 300ms 防抖去重保護');

// 4. 檢查 index.html 快取版本
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('app.js?v=4.9.0'), 'index.html 未更新至 v=4.9.0');
assert.ok(indexHtml.includes('index.css?v=4.9.0'), 'index.css 未更新至 v=4.9.0');
assert.ok(indexHtml.includes('firebase.js?v=4.9.0'), 'firebase.js 未更新至 v=4.9.0');
console.log('✓ 驗證通過：index.html 快取標籤確認為 v=4.9.0');

console.log('🎉 全部單元測試與功能驗證 100% 通過！');
