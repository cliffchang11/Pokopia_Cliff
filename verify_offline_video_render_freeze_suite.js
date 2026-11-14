/**
 * verify_offline_video_render_freeze_suite.js
 * 驗收測試套件：驗證 firebase.js 離線樁完整度、app.js 安全守衛與 44 部影片卡片秒速正常渲染
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始執行參考影片「載入中...」與卡片空白修復驗證套件...\n');

// 1. 驗證 firebase.js 與 dist_offline/firebase.js 離線模組完整定義
console.log('【測試 1】驗證 firebase.js 離線樁方法完整性...');
['firebase.js', 'dist_offline/firebase.js'].forEach(fbFile => {
  const content = fs.readFileSync(path.join(__dirname, fbFile), 'utf8');
  assert.ok(content.includes('debouncedSave: () => {}'), `❌ ${fbFile} 缺少 debouncedSave`);
  assert.ok(content.includes('init: () => {}'), `❌ ${fbFile} 缺少 init 方法`);
  assert.ok(content.includes('subscribeCloudProgress: () => (() => {})'), `❌ ${fbFile} 缺少 subscribeCloudProgress`);
  assert.ok(content.includes('unsubscribeCloudProgress: () => {}'), `❌ ${fbFile} 缺少 unsubscribeCloudProgress`);
  assert.ok(content.includes('loadVoxelOverrides: () => Promise.resolve'), `❌ ${fbFile} 缺少 loadVoxelOverrides`);
  assert.ok(content.includes('saveVoxelOverrides: () => Promise.resolve'), `❌ ${fbFile} 缺少 saveVoxelOverrides`);
});
console.log('  ✓ PASS: firebase.js 離線樁方法完備，絕無 undefined 調用！\n');

// 2. 驗證 app.js 與 dist_offline/app.js 型別守衛
console.log('【測試 2】驗證 app.js 型別守衛強化...');
['app.js', 'dist_offline/app.js'].forEach(appFile => {
  const content = fs.readFileSync(path.join(__dirname, appFile), 'utf8');
  assert.ok(content.includes('if (typeof fb.debouncedSave === \'function\')'), `❌ ${appFile} saveProgress 缺少 debouncedSave 型別守衛`);
  assert.ok(content.includes('if (typeof fb.init === \'function\')'), `❌ ${appFile} init 缺少 fb.init 型別守衛`);
  assert.ok(content.includes('if (typeof fb.subscribeCloudProgress === \'function\')'), `❌ ${appFile} 缺少 subscribeCloudProgress 型別守衛`);
});
console.log('  ✓ PASS: app.js 關鍵 Firebase 呼叫處型別守衛全面就緒！\n');

// 3. 模擬離線執行環境，驗證 renderVideoSection 執行到底零錯誤
console.log('【測試 3】模擬離線環境，驗證 renderVideoSection 執行到底...');

const mockStorage = {};
const createdElements = {};

function createMockElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    textContent: (id === 'videoCurrentTitle') ? '載入中...' : '',
    innerHTML: '',
    children: [],
    classList: {
      _classes: new Set(),
      add: (c) => el.classList._classes.add(c),
      remove: (c) => el.classList._classes.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (el.classList._classes.has(c)) el.classList._classes.delete(c);
          else el.classList._classes.add(c);
        } else if (force) el.classList._classes.add(c);
        else el.classList._classes.delete(c);
      },
      contains: (c) => el.classList._classes.has(c)
    },
    style: {},
    setAttribute: () => {},
    removeAttribute: () => {},
    getAttribute: () => null,
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    closest: () => null,
    scrollIntoView: () => {}
  };
  createdElements[id] = el;
  return el;
}

// 預先註冊影片頁面所需 DOM 節點
[
  'videoSection', 'videoCurrentTitle', 'videoCurrentNote', 'videoCurrentAuthor',
  'videoCurrentDate', 'videoExternalLink', 'btnEditCurrentVideo',
  'videoCurrentCloudCodeWrap', 'videoCurrentCloudCode', 'btnCopyCloudCode',
  'videoCurrentTags', 'videoTagsContainer', 'btnAddVideoBtn', 'videoCardsGrid',
  'videoPlayerIframe', 'videoPlayerNative', 'resumeBanner', 'resumeBannerText',
  'btnResumePlay', 'btnResumeRestart', 'btnResumeClose', 'videoModal',
  'videoModalBackdrop', 'videoModalCloseBtn', 'btnVideoCancel', 'btnVideoDelete',
  'videoForm', 'videoFormUrl', 'videoFormTitle', 'videoFormAuthor', 'videoFormNote',
  'videoFormCloudCode', 'videoFormTagsPool', 'videoFormCustomTagsInput',
  'catalogBadgeText', 'toolbarTitle'
].forEach(id => createMockElement(id));

global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

global.window = {
  POKOPIA_OFFLINE: true,
  localStorage: global.localStorage,
  addEventListener: () => {},
  document: {
    documentElement: createMockElement('html'),
    body: createMockElement('body'),
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: (id) => createdElements[id] || createMockElement(id),
    querySelector: () => null,
    querySelectorAll: () => []
  }
};
global.document = global.window.document;

// 載入 firebase.js 離線模組
eval(fs.readFileSync(path.join(__dirname, 'firebase.js'), 'utf8'));

// 驗證離線 PokopiaFirebase API
const fb = global.window.PokopiaFirebase;
assert.strictEqual(typeof fb.debouncedSave, 'function', '❌ fb.debouncedSave 必須為 function');
assert.strictEqual(typeof fb.init, 'function', '❌ fb.init 必須為 function');
assert.strictEqual(typeof fb.subscribeCloudProgress, 'function', '❌ fb.subscribeCloudProgress 必須為 function');

// 載入 44 部影片快照至 localStorage
const snap = JSON.parse(fs.readFileSync(path.join(__dirname, 'cliff_cloud_snapshot_normalized.json'), 'utf8'));
mockStorage['pokopia_custom_videos'] = JSON.stringify(snap.customVideos);
mockStorage['pokopia_custom_video_tags'] = JSON.stringify(snap.customVideoTags);

// 載入 data.js 與 video_data.js
eval(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'video_data.js'), 'utf8'));

// 載入 app.js
eval(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'));

// 模擬使用者進入參考影片主分頁執行渲染
assert.ok(global.window.PokopiaVideoManager, '❌ PokopiaVideoManager 未掛載至 window');
global.window.PokopiaVideoManager.renderVideoSection();

// 檢驗 DOM.videoCurrentTitle 是否已被換成第一部影片的真實標題
const titleEl = createdElements['videoCurrentTitle'];
assert.notStrictEqual(titleEl.textContent, '載入中...', '❌ videoCurrentTitle 不應停留在「載入中...」');
console.log(`  ✓ 當前影廳首播影片標題: 「${titleEl.textContent}」`);

// 檢驗 videoCardsGrid 是否已注入 44 部卡片
const cardsGridEl = createdElements['videoCardsGrid'];
assert.ok(cardsGridEl.innerHTML.includes('video-card'), '❌ videoCardsGrid 必須包含 video-card');
const cardCount = (cardsGridEl.innerHTML.match(/class="video-card[\s"]/g) || []).length;
assert.strictEqual(cardCount, 44, `❌ videoCardsGrid 必須精準包含 44 張卡片，實得 ${cardCount}`);
console.log(`  ✓ 影片卡片渲染總數: ${cardCount} 部卡片完整呈現！`);

// 檢驗 videoTagsContainer 是否已生成標籤
const tagsContainerEl = createdElements['videoTagsContainer'];
assert.ok(tagsContainerEl.innerHTML.includes('video-tag-pill'), '❌ videoTagsContainer 必須包含標籤膠囊');
console.log('  ✓ 影片分類標籤生成完備！');

console.log('\n🎉 【全體驗證通過】參考影片卡死問題已徹底修復，44 部影片秒速流暢呈現！');
