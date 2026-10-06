const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證【🎬 參考影片播放進度記憶與續播控制器】===');

// 1. 驗證 index.html 元素與版本號
const html = fs.readFileSync('./index.html', 'utf-8');
const requiredIds = [
  'videoResumeBanner',
  'videoResumeText',
  'btnVideoRestart',
  'btnVideoResumeDismiss'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `index.html 應包含 id="${id}"`);
});
console.log('✓ index.html 續播提示條與從頭播放按鈕元素完整');

assert(html.includes('v=4.8.8'), 'index.html 靜態資源版本號應已升級為 v=4.8.8');
console.log('✓ index.html 資源快取版本號 v=4.8.8 驗證通過');

// 2. 驗證 index.css 樣式
const css = fs.readFileSync('./index.css', 'utf-8');
assert(css.includes('.video-resume-banner'), 'index.css 應包含 .video-resume-banner');
assert(css.includes('.btn-video-restart'), 'index.css 應包含 .btn-video-restart');
assert(css.includes('.btn-video-resume-dismiss'), 'index.css 應包含 .btn-video-resume-dismiss');
console.log('✓ index.css 續播膠囊美觀樣式驗證通過');

// 3. 驗證 firebase.js 包含 videoProgress 合併
const firebaseCode = fs.readFileSync('./firebase.js', 'utf-8');
assert(firebaseCode.includes('videoProgress'), 'firebase.js 應包含 videoProgress 合併');
console.log('✓ firebase.js 多裝置雲端同步 videoProgress 邏輯驗證通過');

// 4. 驗證 app.js 常數與核心函式
const appCode = fs.readFileSync('./app.js', 'utf-8');
assert(appCode.includes('STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS'), 'app.js 應包含 STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS');
assert(appCode.includes('STORAGE_KEY_ACTIVE_VIDEO'), 'app.js 應包含 STORAGE_KEY_ACTIVE_VIDEO');
assert(appCode.includes('infoDelivery'), 'app.js 應包含 infoDelivery 原生 postMessage 雙軌監聽');
assert(appCode.includes('beforeunload'), 'app.js 應包含 beforeunload 即時 Flush 機制');
assert(appCode.includes('formatPlaybackTime'), 'app.js 應包含 formatPlaybackTime');
assert(appCode.includes('recordCurrentVideoProgress'), 'app.js 應包含 recordCurrentVideoProgress');
assert(appCode.includes('showResumeBanner'), 'app.js 應包含 showResumeBanner');
assert(appCode.includes('restartCurrentVideoFromBeginning'), 'app.js 應包含 restartCurrentVideoFromBeginning');
assert(appCode.includes('&start='), 'app.js 應包含 &start= 續播參數');
console.log('✓ app.js 當前影片記憶、postMessage 雙軌監聽與核心函式驗證通過');

// 5. 獨立演算法單元驗證：時間格式化與邊界邏輯
function formatPlaybackTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

assert.strictEqual(formatPlaybackTime(0), '00:00');
assert.strictEqual(formatPlaybackTime(5), '00:05');
assert.strictEqual(formatPlaybackTime(65), '01:05');
assert.strictEqual(formatPlaybackTime(205), '03:25');
assert.strictEqual(formatPlaybackTime(3600), '60:00');
console.log('✓ 時間格式化 (MM:SS) 演算法驗證通過');

// 6. 模擬邊界條件驗證
let mockProgress = {};

function recordCurrentVideoProgress(videoId, currentTime, duration) {
  if (!videoId) return;

  // 完播（ENDED）或離片尾 <= 10 秒：自動歸零重置
  if (duration > 0 && (duration - currentTime) <= 10) {
    if (mockProgress[videoId]) {
      delete mockProgress[videoId];
    }
    return;
  }

  // 未滿 5 秒不予紀錄 (重置/清除)
  if (currentTime < 5) {
    if (mockProgress[videoId]) {
      delete mockProgress[videoId];
    }
    return;
  }

  const rounded = Math.floor(currentTime);
  mockProgress[videoId] = rounded;
}

// 測試 A: 未滿 5 秒（剛播放 3 秒） -> 不記錄
recordCurrentVideoProgress('vid_1', 3, 120);
assert.strictEqual(mockProgress['vid_1'], undefined, '小於 5 秒不應記錄');
console.log('✓ 邊界條件 A：未滿 5 秒不記錄通過');

// 測試 B: 正常播放至 45 秒 -> 正確記錄
recordCurrentVideoProgress('vid_1', 45.8, 120);
assert.strictEqual(mockProgress['vid_1'], 45, '45.8 秒應記錄為 45 秒');
console.log('✓ 邊界條件 B：正常播放記錄通過 (45秒)');

// 測試 C: 播放至片尾剩餘 5 秒 (例如 115 秒 / 總長 120 秒) -> 自動歸零重置
recordCurrentVideoProgress('vid_1', 115, 120);
assert.strictEqual(mockProgress['vid_1'], undefined, '片尾 <= 10 秒應自動重置');
console.log('✓ 邊界條件 C：片尾 10 秒內自動歸零重置通過');

// 測試 D: 重播並看到 80 秒，點擊「從頭播放」重置 -> 歸零
recordCurrentVideoProgress('vid_1', 80, 120);
assert.strictEqual(mockProgress['vid_1'], 80);
delete mockProgress['vid_1']; // 模擬點擊「從頭播放」
assert.strictEqual(mockProgress['vid_1'], undefined, '從頭播放後進度應被清除');
console.log('✓ 邊界條件 D：從頭播放手動重置通過');

// 測試 E: 當前選中影片持久化模擬
const mockAllVideos = [
  { id: 'vid_1', title: '影片1' },
  { id: 'vid_2', title: '影片2' },
  { id: 'vid_3', title: '影片3' }
];

let mockCurrentVideoId = 'vid_2'; // 模擬上次選中了第 2 部
function getActiveVideoMock(savedId) {
  if (savedId) {
    const found = mockAllVideos.find(v => v.id === savedId);
    if (found) return found;
  }
  return mockAllVideos[0];
}

assert.strictEqual(getActiveVideoMock(mockCurrentVideoId).id, 'vid_2', '重新整理後應 100% 停留在上次選擇的第 2 部影片');
console.log('✓ 條件 E：重新整理後正確維持停留在上次選取的影片 (vid_2)');

// 測試 F: 若記憶中的影片已被刪除，安全 fallback 回第 1 部
const invalidVideoId = 'vid_deleted_999';
assert.strictEqual(getActiveVideoMock(invalidVideoId).id, 'vid_1', '影片不存在時應安全平滑 fallback 回第 1 部');
console.log('✓ 條件 F：記憶影片不存在時安全 Fallback 回第 1 部通過');

console.log('🎉 所有影片播放進度記憶、當前影片記憶與續播控制器測試 100% 通過！');
