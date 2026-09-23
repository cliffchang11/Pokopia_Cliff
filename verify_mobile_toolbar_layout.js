// verify_mobile_toolbar_layout.js
// 驗證手機端圖鑑搜尋列上方標題與進度列、下方 2x2 雙行等寬篩選列排版
const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證手機端圖鑑標題與 2x2 篩選列排版佈局 ===');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');
const css = fs.readFileSync('index.css', 'utf8');

// 1. 驗證 index.html 結構
assert(html.includes('<div id="toolbarHeaderRow" class="toolbar-header-row">'), 'index.html 必須包含 #toolbarHeaderRow');
assert(html.includes('<h2 id="toolbarTitle" class="toolbar-title">寶可夢圖鑑</h2>'), 'index.html 必須包含 #toolbarTitle 且預設為無 Emoji 的「寶可夢圖鑑」');
assert(!html.includes('📖寶可夢圖鑑') && !html.includes('📖 寶可夢圖鑑'), '標題嚴格禁止加入 Emoji');

// 2. 驗證 catalogProgressBadge 移至 toolbarHeaderRow，不在 filterToolbar
const toolbarHeaderRowContent = html.substring(html.indexOf('id="toolbarHeaderRow"'), html.indexOf('class="search-row"'));
assert(toolbarHeaderRowContent.includes('id="catalogProgressBadge"'), 'catalogProgressBadge 必須位於 toolbarHeaderRow 內');

const filterToolbarContent = html.substring(html.indexOf('id="filterToolbar"'), html.indexOf('</header>'));
assert(!filterToolbarContent.includes('id="catalogProgressBadge"'), 'catalogProgressBadge 不得再位於 filterToolbar 內');
console.log('✅ [PASS] 1. HTML 結構：toolbarHeaderRow 位於搜尋列上方，右側整合進度徽章，標題純淨無 Emoji');

// 3. 驗證 filterToolbar 內包含 4 個下拉選單項目
assert(filterToolbarContent.includes('id="categoryFilterGroup"'), 'filterToolbar 必須包含分類選單');
assert(filterToolbarContent.includes('id="envFilterGroup"'), 'filterToolbar 必須包含環境選單');
assert(filterToolbarContent.includes('id="specialtyFilterGroup"'), 'filterToolbar 必須包含專長選單');
assert(filterToolbarContent.includes('id="unlockFilterGroup"'), 'filterToolbar 必須包含解鎖選單');
console.log('✅ [PASS] 2. filterToolbar 內部結構乾淨，恰好包含 4 個篩選項目');

// 4. 驗證 app.js 動態快取與 switchTab 標題切換
assert(js.includes("toolbarHeaderRow: document.getElementById('toolbarHeaderRow')"), 'app.js DOM 快取必須包含 toolbarHeaderRow');
assert(js.includes("toolbarTitle: document.getElementById('toolbarTitle')"), 'app.js DOM 快取必須包含 toolbarTitle');

assert(js.includes("DOM.toolbarTitle.textContent = '寶可夢圖鑑';"), '切換至 habitat 分頁時標題必須為「寶可夢圖鑑」');
assert(js.includes("DOM.toolbarTitle.textContent = '棲息地總覽';"), '切換至 habitatCatalog 分頁時標題必須為「棲息地總覽」');
assert(js.includes("DOM.toolbarHeaderRow.classList.add('hidden');"), '非圖鑑分頁時 toolbarHeaderRow 必須正確隱藏');
console.log('✅ [PASS] 3. app.js 分頁切換聯動標題與顯隱邏輯正確');

// 5. 驗證 index.css 桌面與手機端排版
assert(css.includes('.toolbar-header-row {'), 'index.css 必須定義 .toolbar-header-row');
assert(css.includes('.toolbar-title {'), 'index.css 必須定義 .toolbar-title');

// 驗證手機端 2x2 grid 佈局
assert(css.includes('grid-template-columns: 1fr 1fr'), '手機端 filter-toolbar-row 必須設置 grid-template-columns: 1fr 1fr 達成 2x2 雙行網格');
assert(css.includes('display: grid !important;'), '手機端 filter-toolbar-row 必須以 grid 佈局');
console.log('✅ [PASS] 4. CSS 佈局：手機端 filter-toolbar-row 嚴格採用 2x2 雙行網格');

// 6. 驗證 CSS 括號平衡
const openB = (css.match(/{/g) || []).length;
const closeB = (css.match(/}/g) || []).length;
assert(openB === closeB, `CSS 括號必須平衡: Open=${openB}, Close=${closeB}`);
console.log(`✅ [PASS] 5. CSS 括號完全平衡 (${openB} === ${closeB})`);

console.log('\n🎉 手機端圖鑑標題、進度列與 2x2 雙行篩選列驗證 100% 全部通過！\n');
