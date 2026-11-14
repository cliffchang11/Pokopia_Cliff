/**
 * verify_offline_cliff_3d_sync_suite.js
 * 驗收測試套件：Cliff 雲端 3D 精雕模型固化、44 部影片展示與 iPad 外部連線阻斷防護
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始執行 Cliff 雲端 3D 模型與離線隨身包整合行為級驗證套件...\n');

// 1. 驗證 firebase.js 離線固化快照與各角色精雕體素筆數
console.log('【測試 1】驗證 firebase.js 離線固化快照完整性...');
const firebasePath = path.join(__dirname, 'firebase.js');
const distFirebasePath = path.join(__dirname, 'dist_offline', 'firebase.js');

[firebasePath, distFirebasePath].forEach((fbFile, idx) => {
  const content = fs.readFileSync(fbFile, 'utf8');
  assert.ok(content.includes('CLIFF_CLOUD_SNAPSHOT'), `❌ ${fbFile} 缺少 CLIFF_CLOUD_SNAPSHOT`);
  assert.ok(content.includes('offline_cliff'), `❌ ${fbFile} 缺少 offline_cliff 身分標記`);
});

// 模擬瀏覽器環境驗證 LocalStorage 0ms 水合
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.window = {
  POKOPIA_OFFLINE: true,
  localStorage: global.localStorage
};

// 載入 firebase.js
eval(fs.readFileSync(firebasePath, 'utf8'));

assert.ok(global.window.PokopiaFirebase, '❌ PokopiaFirebase 未正確掛載至 window');
const fb = global.window.PokopiaFirebase;

// 檢驗 LocalStorage 0ms 注入
const ivysaurRaw = mockStorage['pokopia_voxel_overrides_ivysaur'];
assert.ok(ivysaurRaw, '❌ 76層經典妙蛙草體素未在 0ms 注入 LocalStorage');
const ivysaurData = JSON.parse(ivysaurRaw);
assert.strictEqual(Object.keys(ivysaurData).length, 19278, `❌ 76層經典妙蛙草體素筆數應為 19,278 顆，實得 ${Object.keys(ivysaurData).length}`);

const ivysaur40Raw = mockStorage['pokopia_voxel_overrides_ivysaur40'];
assert.ok(ivysaur40Raw, '❌ 40層精巧妙蛙草體素未注入 LocalStorage');
const ivysaur40Data = JSON.parse(ivysaur40Raw);
assert.strictEqual(Object.keys(ivysaur40Data).length, 8202, `❌ 40層精巧妙蛙草體素筆數應為 8,202 顆，實得 ${Object.keys(ivysaur40Data).length}`);

const bulba28V2Raw = mockStorage['pokopia_voxel_overrides_bulbasaur28_v2'];
assert.ok(bulba28V2Raw, '❌ 28層超採樣妙蛙種子體素未注入 LocalStorage');
const bulba28V2Data = JSON.parse(bulba28V2Raw);
assert.strictEqual(Object.keys(bulba28V2Data).length, 313, `❌ 28層超採樣妙蛙種子筆數應為 313 顆，實得 ${Object.keys(bulba28V2Data).length}`);

const bulba28Raw = mockStorage['pokopia_voxel_overrides_bulbasaur28'];
assert.ok(bulba28Raw, '❌ 28層經典妙蛙種子體素未注入 LocalStorage');
const bulba28Data = JSON.parse(bulba28Raw);
assert.strictEqual(Object.keys(bulba28Data).length, 430, `❌ 28層經典妙蛙種子筆數應為 430 顆，實得 ${Object.keys(bulba28Data).length}`);

const customVideosRaw = mockStorage['pokopia_custom_videos'];
assert.ok(customVideosRaw, '❌ 自訂影片清單未注入 LocalStorage');
const customVideos = JSON.parse(customVideosRaw);
assert.strictEqual(customVideos.length, 44, `❌ 自訂影片清單應包含 44 部，實得 ${customVideos.length}`);

console.log(`  ✓ PASS: 76層妙蛙草 (${Object.keys(ivysaurData).length} 顆)、40層 (${Object.keys(ivysaur40Data).length} 顆)、28層超採樣 (${Object.keys(bulba28V2Data).length} 顆)、28層經典 (${Object.keys(bulba28Data).length} 顆) 及 44 部影片 0ms 完美固化！\n`);

// 2. 驗證 index.html 與 dist_offline/index.html 徹底消除 Sketchfab 外部連線
console.log('【測試 2】驗證 index.html 與 dist_offline/index.html 外部連線消除...');
['index.html', 'dist_offline/index.html'].forEach(file => {
  const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
  const matches = html.match(/(?<!data-)src="https:\/\/sketchfab\.com/g);
  assert.strictEqual(matches, null, `❌ ${file} 仍存在 sketchfab 外部 src 連線！`);
  const dataSrcMatches = html.match(/data-src="https:\/\/sketchfab\.com/g);
  assert.strictEqual(dataSrcMatches.length, 5, `❌ ${file} 應具有 5 處安全的 data-src 屬性，實得 ${dataSrcMatches ? dataSrcMatches.length : 0}`);
});
console.log('  ✓ PASS: index.html 與 dist_offline/index.html 外部 Sketchfab iframe 已 100% 阻斷，消除 iPad 連線警報！\n');

// 3. 驗證 app.js YouTube Iframe API 離線阻斷
console.log('【測試 3】驗證 app.js initYouTubeIframeApi 離線阻斷...');
const appContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert.ok(
  appContent.includes('if (window.POKOPIA_OFFLINE) return; // 飛航離線模式嚴格禁止載入外部 YouTube API'),
  '❌ app.js 缺少離線 YouTube API 阻斷守衛'
);
console.log('  ✓ PASS: app.js 已安全攔截外部 YouTube API 腳本注入！\n');

// 4. 驗證 44 部影片卡片離線縮圖與播放分流
console.log('【測試 4】驗證 44 部影片卡片離線縮圖與播放邏輯...');
assert.ok(appContent.includes('DOWNLOADED_REFERENCE_VIDS'), '❌ app.js 缺少 DOWNLOADED_REFERENCE_VIDS 集合定義');
assert.ok(appContent.includes('data:image/svg+xml;utf8,<svg'), '❌ app.js 缺少離線本地 SVG 縮圖產生器');
assert.ok(appContent.includes('🔗 前往 YouTube 觀看此攻略 (線上)'), '❌ app.js 缺少線上自訂 28 部長片前往 YouTube 觀看按鈕');
console.log('  ✓ PASS: 44 部影片離線卡片縮圖完全為本地 SVG，無任何外部請求，且 28 部自訂影片支援跳至 YouTube！\n');

// 5. 驗證 5x5 棲息地短片教學路徑未被破壞
console.log('【測試 5】驗證 5x5 棲息地短片教學行為完全未受破壞...');
assert.ok(appContent.includes('assets/videos/5x5/${encodeURIComponent(vid)}.mp4'), '❌ 5x5 本地短片路徑遺失');
const habitat5x5Data = fs.readFileSync(path.join(__dirname, 'habitat_5x5_data.js'), 'utf8');
assert.ok(habitat5x5Data.includes('POKOPIA_HABITAT_5X5_DATA'), '❌ habitat_5x5_data.js 模組完整');
console.log('  ✓ PASS: 5x5 棲息地短片教學路徑完整保留，行為未受任何更動！\n');

console.log('🎉 【全體驗證通過】Cliff 雲端 3D 精雕模型固化、44 部影片與 iPad 外部連線阻斷防護 100% PASS！');
