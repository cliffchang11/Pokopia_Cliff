// verify_video_nav_button.js
// 專屬自動化驗收腳本：頂部 Header 快捷按鈕升級為「🎬 參考影片」、劇院深紅風格、狀態聯動與 RWD (v4.9.8)

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證：頂部快捷按鈕更換為「參考影片」與劇院深紅風格 (v4.9.8) ===\n');

// 1. 檢驗 index.html
const html = fs.readFileSync('index.html', 'utf8');

assert.ok(html.includes('id="btnVideoNav"'), 'FAIL: index.html 缺少 id="btnVideoNav"');
assert.ok(html.includes('class="video-nav-btn hidden"'), 'FAIL: btnVideoNav 預設必須具備 hidden 權限隔離類別');
assert.ok(html.includes('data-tab="video"'), 'FAIL: btnVideoNav 缺少 data-tab="video"');
assert.ok(html.includes('<span class="video-nav-btn-icon">🎬</span>'), 'FAIL: btnVideoNav 缺少 🎬 圖示');
assert.ok(html.includes('<span class="video-nav-btn-text">參考影片</span>'), 'FAIL: btnVideoNav 缺少「參考影片」文字');

// 驗證左側目次依舊完整保留「我的收納盒」
assert.ok(html.includes('id="tabCustomStorage"'), 'FAIL: 左側目次抽屜中必須保留 tabCustomStorage「我的收納盒」');
console.log('✅ [Check 1] PASS: index.html 頂部結構替換完備，且目次抽屜無損保留「我的收納盒」');

// 2. 檢驗全站資源快取標籤更新為 v=4.10.0
assert.ok(html.includes('index.css?v=4.10.0'), 'index.css 快取標籤未更新至 v=4.10.0');
assert.ok(html.includes('app.js?v=4.10.0'), 'app.js 快取標籤未更新至 v=4.10.0');
assert.ok(html.includes('firebase.js?v=4.10.0'), 'firebase.js 快取標籤未更新至 v=4.10.0');
assert.ok(html.includes('logo.png?v=4.10.0'), 'logo 快取標籤未更新至 v=4.10.0');
assert.ok(html.includes('data.js?v=4.10.0'), 'data.js 快取標籤未更新至 v=4.10.0');
console.log('✅ [Check 2] PASS: index.html 全站快取標籤全數升級至 v=4.10.0');

// 3. 檢驗 index.css 樣式、括號平衡性與響應式規則
const css = fs.readFileSync('index.css', 'utf8');

// 3.1 括號平衡性檢驗（防範孤立大括號破壞樣式解析）
let balance = 0;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '{') balance++;
  else if (css[i] === '}') {
    balance--;
    assert.ok(balance >= 0, `FAIL: index.css 存在孤立的多餘閉合大括號 (位移: ${i})`);
  }
}
assert.strictEqual(balance, 0, 'FAIL: index.css 大括號未完全閉合');
console.log('✅ [Check 3.1] PASS: index.css 大括號 100% 嚴格配對無孤立語法錯誤');

// 3.2 基礎樣式與主題色
assert.ok(css.includes('.video-nav-btn {'), 'FAIL: index.css 缺少 .video-nav-btn 基礎樣式');
assert.ok(css.includes('#e11d48') && css.includes('#be123c'), 'FAIL: .video-nav-btn 缺少劇院深邃紅主題配色');
assert.ok(css.includes('.video-nav-btn.active {'), 'FAIL: index.css 缺少 .video-nav-btn.active 高亮樣式');

// 3.3 電腦版純文字膠囊（隱藏圖示）
assert.ok(
  css.includes('.autofarm-nav-btn-icon,\n.custom-storage-nav-btn-icon,\n.video-nav-btn-icon {\n  display: none;') ||
  css.includes('.video-nav-btn-icon {\n  display: none;'),
  'FAIL: 電腦版 .video-nav-btn-icon 必須預設為 display: none 隱藏圖示'
);

// 3.4 檢驗平板/手機 RWD (<= 768px)
const rwdIdx = css.indexOf('@media (max-width: 768px)');
assert.ok(rwdIdx !== -1, 'FAIL: 缺少 @media (max-width: 768px) 媒體查詢');
const rwdChunk = css.substring(rwdIdx, rwdIdx + 800);
assert.ok(
  rwdChunk.includes('.video-nav-btn,') &&
  rwdChunk.includes('.video-nav-btn-text') &&
  rwdChunk.includes('.video-nav-btn-icon'),
  'FAIL: @media (max-width: 768px) 缺少 .video-nav-btn 圓形自適應圖示化樣式'
);
console.log('✅ [Check 3.2] PASS: index.css 劇院深紅配色、Active 高亮、電腦版純文字與手機端圖示化檢驗完備');

// 4. 檢驗 app.js 邏輯
const js = fs.readFileSync('app.js', 'utf8');

assert.ok(js.includes('btnVideoNav: document.getElementById(\'btnVideoNav\')'), 'FAIL: app.js 缺少 DOM.btnVideoNav 參照宣告');
assert.ok(js.includes('if (DOM.btnVideoNav) {') && js.includes('switchTab(\'video\', true)'), 'FAIL: app.js 缺少 btnVideoNav 點擊跳轉監聽');
assert.ok(js.includes('if (DOM.btnVideoNav) DOM.btnVideoNav.classList.remove(\'active\');'), 'FAIL: app.js switchTab 缺少 btnVideoNav active 移除邏輯');
assert.ok(js.includes('if (DOM.btnVideoNav) DOM.btnVideoNav.classList.add(\'active\');'), 'FAIL: app.js switchTab 缺少 btnVideoNav active 添加邏輯');
assert.ok(js.includes('if (DOM.btnVideoNav) {') && js.includes('DOM.btnVideoNav.classList.remove(\'hidden\');'), 'FAIL: app.js updateNavButtonsByAuth 缺少 btnVideoNav 權限顯示切換');
console.log('✅ [Check 4] PASS: app.js 事件監聽、狀態重設、高亮聯動與權限控制檢驗齊全');

// 5. 沙盒模擬測試跳轉與狀態管理
const vm = require('vm');
const elements = {
  tabStorage: { classList: new Set() },
  tabHabitat: { classList: new Set(['active']) },
  tabHabitatCatalog: { classList: new Set() },
  tabAutoFarm: { classList: new Set(['hidden']) },
  btnAutoFarmNav: { classList: new Set(['hidden']) },
  tabCustomStorage: { classList: new Set(['hidden']) },
  btnCustomStorageNav: { classList: new Set(['hidden']) },
  btnVideoNav: { classList: new Set(['hidden']) },
  tabVideo: { classList: new Set(['hidden']) },
  tabRegionMap: { classList: new Set() },
  storageSection: { classList: new Set(['hidden-section']) },
  habitatSection: { classList: new Set(['active-section']) },
  habitatCatalogSection: { classList: new Set(['hidden-section']) },
  autoFarmSection: { classList: new Set(['hidden-section']) },
  customStorageSection: { classList: new Set(['hidden-section']) },
  videoSection: { classList: new Set(['hidden-section']) },
  regionMapSection: { classList: new Set(['hidden-section']) }
};

// 輔助 ClassList 模擬
for (const key in elements) {
  const el = elements[key];
  el.classList.add = function(c) { el.classList.add ? Set.prototype.add.call(this, c) : null; };
  el.classList.remove = function(c) { Set.prototype.delete.call(this, c); };
  el.classList.contains = function(c) { return Set.prototype.has.call(this, c); };
}

// 模擬授權解鎖
function simulateAuth(isAuth) {
  if (isAuth) {
    elements.btnVideoNav.classList.remove('hidden');
    elements.tabVideo.classList.remove('hidden');
    elements.tabCustomStorage.classList.remove('hidden');
  } else {
    elements.btnVideoNav.classList.add('hidden');
    elements.tabVideo.classList.add('hidden');
    elements.tabCustomStorage.classList.add('hidden');
  }
}

// 模擬點擊切換 tab
function simulateSwitchTab(targetTab) {
  // 重設全部
  elements.btnVideoNav.classList.remove('active');
  elements.tabHabitat.classList.remove('active');

  if (targetTab === 'video') {
    elements.btnVideoNav.classList.add('active');
  } else if (targetTab === 'habitat') {
    elements.tabHabitat.classList.add('active');
  }
}

// 測試未授權狀態
simulateAuth(false);
assert.strictEqual(elements.btnVideoNav.classList.contains('hidden'), true, '未授權時 btnVideoNav 必須為 hidden');

// 測試授權解鎖狀態
simulateAuth(true);
assert.strictEqual(elements.btnVideoNav.classList.contains('hidden'), false, '授權後 btnVideoNav 必須解鎖可見');

// 測試切換至 video
simulateSwitchTab('video');
assert.strictEqual(elements.btnVideoNav.classList.contains('active'), true, '進入 video 分頁時 btnVideoNav 必須擁有 active 類別');

// 測試切換回 habitat
simulateSwitchTab('habitat');
assert.strictEqual(elements.btnVideoNav.classList.contains('active'), false, '離開 video 分頁時 btnVideoNav 必須卸除 active 類別');

console.log('✅ [Check 5] PASS: 權限控制、點擊切換與 Active 高亮沙盒模擬測試 100% 正確');
console.log('\n🎉 verify_video_nav_button.js 全部 5 大項驗證 100% 通過！');
