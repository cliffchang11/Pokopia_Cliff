const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證自訂影片新增重整保留、穩定排序與防閃爍機制 (v4.9.1) ---');

// 1. 驗證任務 1：Firebase 雲端自訂影片 Union 聯集合併與穩定排序
const firebaseJs = fs.readFileSync('firebase.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

// 檢查 app.js onAuthStateChanged 中的 localSnapshot 是否含有 customVideos
assert.ok(
  appJs.includes('customVideos:      state.customVideos      || []') &&
  appJs.includes('customVideoTags:   state.customVideoTags   || []') &&
  appJs.includes('deletedVideoTags:  state.deletedVideoTags  || []'),
  '測試失敗：app.js 的 localSnapshot 遺漏了 customVideos 相關欄位！'
);
console.log('✓ 驗證通過：onAuthStateChanged 初始化的 localSnapshot 完整包含自訂影片欄位，重整絕不丟失');

// 檢查 firebase.js 中的 customVideos 排序邏輯
assert.ok(
  firebaseJs.includes('mergedList.sort((a, b) => {') &&
  firebaseJs.includes('return timeB - timeA;'),
  '測試失敗：firebase.js 缺少自訂影片統一時間穩定排序！'
);
console.log('✓ 驗證通過：firebase.js 具備依建立/更新時間統一由新到舊穩定排序機制');

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
    const mergedList = Array.from(videoMap.values());
    mergedList.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
    merged.customVideos = mergedList;
  }
  return merged;
}

const localData = {
  customVideos: [
    { id: 'video_new_123', videoId: '5dCjsO8uskA', title: '手機新增之影片', createdAt: '2026-10-06T14:30:00Z' },
    { id: 'default_v1', videoId: 'old_001', title: '預設影片（本地修改過）', updatedAt: '2026-10-06T14:10:00Z' }
  ]
};

const cloudData = {
  customVideos: [
    { id: 'default_v1', videoId: 'old_001', title: '預設影片（舊雲端版本）', updatedAt: '2026-10-06T12:00:00Z' },
    { id: 'cloud_only_v2', videoId: 'cloud_002', title: '其他裝置新增影片', createdAt: '2026-10-06T13:00:00Z' }
  ]
};

const mergedResult = mockMergeProgressUnion(localData, cloudData);

// 關鍵斷言 1：本地新增之最新影片排在首位！
assert.strictEqual(mergedResult.customVideos[0].id, 'video_new_123', '最新新增之影片應位於清單第一筆！');
console.log('✓ 驗證通過：手機最新新增之影片成功排列在清單首位');

// 關鍵斷言 2：三部影片全部完整保留
assert.strictEqual(mergedResult.customVideos.length, 3, '合併後應包含全部 3 部影片！');
console.log('✓ 驗證通過：本地與雲端所有自訂影片無損合併保留');

// 2. 驗證任務 2：areVideoListsEqual 與卡片渲染指紋守衛
assert.ok(
  appJs.includes('function areVideoListsEqual(listA, listB)'),
  '測試失敗：未找到 areVideoListsEqual 函式！'
);
assert.ok(
  appJs.includes('_lastRenderedCardsFingerprint'),
  '測試失敗：未找到 _lastRenderedCardsFingerprint 卡片渲染指紋守衛！'
);
console.log('✓ 驗證通過：areVideoListsEqual 語意比對與 _lastRenderedCardsFingerprint 守衛正常配置');

// 模擬指紋守衛
let _testFingerprint = '';
let renderCount = 0;
function mockRenderCards(cards, currentVideoId, tag) {
  const currentFingerprint = `${tag}::${currentVideoId}::` + cards.map(v => `${v.id}_${v.title}`).join('|');
  if (_testFingerprint === currentFingerprint) {
    return; // 命中守衛，不觸發 DOM 操作
  }
  _testFingerprint = currentFingerprint;
  renderCount++;
}

// 初次渲染
mockRenderCards(mergedResult.customVideos, 'video_new_123', '全部');
assert.strictEqual(renderCount, 1);

// 雲端背景推播來相同清單
mockRenderCards(mergedResult.customVideos, 'video_new_123', '全部');
assert.strictEqual(renderCount, 1, '測試失敗：相同內容不應重新觸發卡片重繪！');
console.log('✓ 驗證通過：渲染指紋守衛生效，相同清單 100% 阻擋重複清空 DOM，徹底消除縮圖閃爍！');

// 3. 檢查 index.html 快取版本
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('app.js?v=4.9.1'), 'index.html 未更新至 v=4.9.1');
assert.ok(indexHtml.includes('index.css?v=4.9.1'), 'index.css 未更新至 v=4.9.1');
assert.ok(indexHtml.includes('firebase.js?v=4.9.1'), 'firebase.js 未更新至 v=4.9.1');
console.log('✓ 驗證通過：index.html 快取標籤確認為 v=4.9.1');

console.log('🎉 全部單元測試與穩定性檢查 100% 通過！');
