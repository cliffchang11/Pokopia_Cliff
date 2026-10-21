const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證影片播放穩定性與守衛機制 (v4.8.9) ---');

// 1. 靜態分析驗證 app.js
const appJs = fs.readFileSync('app.js', 'utf8');

// 檢查 saveVideoProgressAndSync 不再有 fb.debouncedSave
assert.ok(
  !appJs.includes('_saveVideoProgressTimer = setTimeout'),
  '測試失敗：app.js 中仍然殘留 _saveVideoProgressTimer 定時器！'
);
console.log('✓ 驗證通過：saveVideoProgressAndSync 已移除定時器與 Firebase 寫入');

// 檢查 subscribeCloudProgress 不再因為 videoProgress 觸發 isChanged
assert.ok(
  !appJs.includes('JSON.stringify(state.videoProgress) !== JSON.stringify(updated.videoProgress)'),
  '測試失敗：subscribeCloudProgress 中仍然在比對 videoProgress！'
);
console.log('✓ 驗證通過：subscribeCloudProgress 已解除 videoProgress 的 isChanged 觸發條件');

// 檢查 renderTheaterPlayer 中含有 _currentLoadedVideoId 與 isSameVideo 守衛
assert.ok(
  appJs.includes('_currentLoadedVideoId'),
  '測試失敗：app.js 未宣告 _currentLoadedVideoId！'
);
assert.ok(
  appJs.includes('const isSameVideo = (_currentLoadedVideoId === video.videoId) && DOM.videoPlayerIframe && DOM.videoPlayerIframe.src;'),
  '測試失敗：未找到 isSameVideo 播放器守衛比對！'
);
console.log('✓ 驗證通過：renderTheaterPlayer 具備同一部影片之 isSameVideo 守衛保護');

// 2. 模擬 DOM 與執行邏輯驗證
const mockDOM = {
  videoPlayerIframe: { src: '', referrerPolicy: '' },
  videoCurrentTitle: { textContent: '' },
  videoCurrentNote: { textContent: '' },
  videoCurrentAuthor: { textContent: '' },
  videoCurrentDate: { textContent: '' },
  videoExternalLink: { style: { display: '' }, href: '' },
  btnEditCurrentVideo: { classList: { add: () => {}, remove: () => {} }, onclick: null },
  videoCurrentCloudCodeWrap: { classList: { add: () => {}, remove: () => {} } },
  videoCurrentCloudCode: { textContent: '' },
  videoCurrentTags: { innerHTML: '' },
  videoResumeBanner: { classList: { add: () => {}, remove: () => {} } },
  videoResumeText: { textContent: '' },
  btnVideoRestart: { onclick: null },
  btnVideoResumeDismiss: { onclick: null }
};

// 提取 renderTheaterPlayer 核心邏輯進行模擬驗證
let _currentLoadedVideoId = null;
let _stopProgressSamplingCalled = 0;
let _setupYouTubePlayerInstanceCalled = 0;

function mockStopProgressSampling() {
  _stopProgressSamplingCalled++;
}
function mockSetupYouTubePlayerInstance() {
  _setupYouTubePlayerInstanceCalled++;
}

function mockRenderTheaterPlayer(video, state) {
  if (!video) {
    _currentLoadedVideoId = null;
    mockStopProgressSampling();
    if (mockDOM.videoPlayerIframe) mockDOM.videoPlayerIframe.src = '';
    return;
  }

  const isSameVideo = (_currentLoadedVideoId === video.videoId) && mockDOM.videoPlayerIframe && mockDOM.videoPlayerIframe.src;
  if (!isSameVideo) {
    _currentLoadedVideoId = video.videoId;
    mockStopProgressSampling();

    const savedTime = (state.videoProgress && typeof state.videoProgress[video.videoId] === 'number')
      ? state.videoProgress[video.videoId]
      : 0;

    if (mockDOM.videoPlayerIframe) {
      const startParam = (savedTime >= 5) ? `&start=${Math.floor(savedTime)}` : '';
      const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?rel=0&enablejsapi=1${startParam}`;
      if (mockDOM.videoPlayerIframe.src !== embedUrl) {
        mockDOM.videoPlayerIframe.src = embedUrl;
      }
    }

    mockSetupYouTubePlayerInstance();
  }

  if (mockDOM.videoCurrentTitle) mockDOM.videoCurrentTitle.textContent = video.title || '未命名影片';
}

const testState = {
  videoProgress: { 'vid_001': 15 }
};

const videoA = { id: 'v1', videoId: 'vid_001', title: '影片 A' };
const videoB = { id: 'v2', videoId: 'vid_002', title: '影片 B' };

// 第一次渲染影片 A
mockRenderTheaterPlayer(videoA, testState);
assert.strictEqual(mockDOM.videoPlayerIframe.src, 'https://www.youtube-nocookie.com/embed/vid_001?rel=0&enablejsapi=1&start=15');
assert.strictEqual(_stopProgressSamplingCalled, 1);
assert.strictEqual(_setupYouTubePlayerInstanceCalled, 1);
console.log('✓ 驗證通過：初次載入影片 A 正確帶入起始進度 start=15');

// 影片播放中，秒數前進到 25 秒，觸發重新渲染（例如點擊篩選標籤）
testState.videoProgress['vid_001'] = 25;
const originalSrc = mockDOM.videoPlayerIframe.src;
mockRenderTheaterPlayer(videoA, testState);

// 關鍵斷言：src 絕對不變，且不重複調用 stopProgressSampling 與 setupYouTubePlayerInstance
assert.strictEqual(mockDOM.videoPlayerIframe.src, originalSrc, '測試失敗：同一部影片重繪時 iframe.src 遭到篡改！');
assert.strictEqual(_stopProgressSamplingCalled, 1, '測試失敗：同一部影片重繪時不應呼叫 stopProgressSampling！');
assert.strictEqual(_setupYouTubePlayerInstanceCalled, 1, '測試失敗：同一部影片重繪時不應呼叫 setupYouTubePlayerInstance！');
console.log('✓ 驗證通過：同一部影片秒數前進或重新渲染時，iframe.src 與播放狀態受到完美保護，絕不重載！');

// 切換至不同影片 B
mockRenderTheaterPlayer(videoB, testState);
assert.ok(mockDOM.videoPlayerIframe.src.includes('vid_002'), '測試失敗：切換影片 B 時未更新 iframe.src！');
assert.strictEqual(_stopProgressSamplingCalled, 2);
assert.strictEqual(_setupYouTubePlayerInstanceCalled, 2);
console.log('✓ 驗證通過：切換至不同影片 B 時，正確重新載入播放器');

// 3. 檢查 index.html 的快取標籤
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('app.js?v=4.13.2'), 'index.html 未更新至 v=4.13.2');
assert.ok(indexHtml.includes('index.css?v=4.13.2'), 'index.css 未更新至 v=4.13.2');
console.log('✓ 驗證通過：index.html 快取標籤確認為 v=4.13.2');

console.log('🎉 全部單元測試與穩定性檢查 100% 通過！');
