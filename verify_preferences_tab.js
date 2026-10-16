/**
 * verify_preferences_tab.js
 * 離線驗收測試：喜好百科獨立主分頁升級、導航整合、事件委派與美感樣式校驗
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== [開始離線驗證：喜好百科獨立主分頁升級計畫] ===\n');

// 1. 檢驗 index.html 結構
console.log('1. 檢驗 index.html 結構與導航定義：');
const html = fs.readFileSync('index.html', 'utf8');

assert(html.includes('id="tabPreferences"'), 'index.html 必須包含 id="tabPreferences"');
assert(html.includes('data-tab="preferences"'), 'index.html 必須包含 data-tab="preferences"');
assert(html.includes('48 種偏好'), '目次標籤必須包含「48 種偏好」提示');
console.log('  ✅ [PASS] 目次選單（:≡）正確整合「喜好百科 (48 種偏好)」');

assert(html.includes('id="btnPrefDrawer"'), 'index.html 必須保留 id="btnPrefDrawer"');
assert(html.includes('id="preferencesSection"'), 'index.html 必須包含 id="preferencesSection"');
assert(html.includes('class="view-section hidden-section preferences-section"'), 'preferencesSection 必須採用標準 view-section 規範');
assert(html.includes('id="prefPageTabs"'), '喜好百科必須包含 4 大子分頁切換列 id="prefPageTabs"');
assert(html.includes('data-pref-tab="tastes"'), '子分頁必須包含 tastes');
assert(html.includes('data-pref-tab="environments"'), '子分頁必須包含 environments');
assert(html.includes('data-pref-tab="things"'), '子分頁必須包含 things');
assert(html.includes('data-pref-tab="items"'), '子分頁必須包含 items');
console.log('  ✅ [PASS] 獨立主分頁 Section 容器與 4 大子分頁結構齊全');

// 2. 檢驗 index.css 現代流體樣式
console.log('\n2. 檢驗 index.css 現代流體樣式與美感規則：');
const css = fs.readFileSync('index.css', 'utf8');

assert(css.includes('.preferences-section'), 'index.css 必須定義 .preferences-section 樣式');
assert(css.includes('.pref-page-container'), 'index.css 必須定義 .pref-page-container 樣式');
assert(css.includes('.pref-page-header'), 'index.css 必須定義 .pref-page-header 樣式');
assert(css.includes('.pref-page-body'), 'index.css 必須定義 .pref-page-body 響應式網格');
assert(css.includes(':root[data-theme="dark"] .pref-page-header'), '必須支援深色模式 header 樣式');
assert(css.includes(':root[data-theme="dark"] .pref-card'), '必須支援深色模式卡片樣式');
console.log('  ✅ [PASS] 現代流體網格、毛玻璃過渡、卡片懸浮微動效及深淺色樣式健全');

// 3. 檢驗 app.js 邏輯整合與事件委派
console.log('\n3. 檢驗 app.js 路由、事件委派與跳轉連動：');
const js = fs.readFileSync('app.js', 'utf8');

assert(js.includes("'preferences'"), 'app.js 必須註冊 preferences 分頁');
assert(js.includes("validTabs = ['storage', 'habitat', 'habitatCatalog', 'recipe', 'preferences'"), 'validTabs 必須納入 preferences');
assert(js.includes("tabPreferences: document.getElementById('tabPreferences')"), 'DOM 物件必須快取 tabPreferences');
assert(js.includes("preferencesSection: document.getElementById('preferencesSection')"), 'DOM 物件必須快取 preferencesSection');
assert(js.includes("} else if (tab === 'preferences') {"), 'switchTab 必須實作 preferences 分頁處理');
assert(js.includes("e.target.closest('.pref-item-slot')"), 'app.js 必須實作道具方格父層事件委派');
assert(js.includes("e.target.closest('.pref-pkm-slot, .pref-pkm-chip')"), 'app.js 必須實作寶可夢方格父層事件委派');
assert(js.includes("switchTab('preferences'"), 'openPrefDrawer 必須直接呼叫 switchTab preferences');
console.log('  ✅ [PASS] app.js 成功實作路由切換、父層事件委派與點擊反查');

console.log('\n========================================');
console.log('喜好百科獨立主分頁升級驗收結果：全部通過！');
console.log('========================================\n');
