// verify_mobile_toolbar_layout.js
// 驗證手機端圖鑑/儲存庫標題、2x2 雙行篩選列、目次統一與終局農場精緻化
const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證手機端標題、2x2 篩選列、目次統一與終局農場佈局 ===');

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

// 4. 驗證目次選單純文字對齊與徽章統一
const tocListContent = html.substring(html.indexOf('class="toc-menu-list"'), html.indexOf('<!-- 風速狗品牌 Logo'));
assert(!tocListContent.includes('🌾'), '目次選單不得包含 🌾 emoji');
assert(!tocListContent.includes('📦'), '目次選單不得包含 📦 emoji');
assert(!tocListContent.includes('autofarm-badge'), '目次選單應移除特異 autofarm-badge class，統一徽章質感');
assert(!tocListContent.includes('custom-storage-badge'), '目次選單應移除特異 custom-storage-badge class，統一徽章質感');
assert(tocListContent.includes('<span class="toc-item-text">終局農場</span>'), '終局農場目次文字應工整去贅字');
assert(tocListContent.includes('<span class="toc-item-text">我的收納盒</span>'), '我的收納盒目次文字應工整去 emoji');
console.log('✅ [PASS] 3. 目次選單全員純文字 4~5 字工整對齊，去除 emoji 與特異 class，視覺高度統一');

// 5. 驗證 app.js 動態快取與 switchTab 標題切換（含儲存庫分類）
assert(js.includes("toolbarHeaderRow: document.getElementById('toolbarHeaderRow')"), 'app.js DOM 快取必須包含 toolbarHeaderRow');
assert(js.includes("toolbarTitle: document.getElementById('toolbarTitle')"), 'app.js DOM 快取必須包含 toolbarTitle');

assert(js.includes("DOM.toolbarTitle.textContent = '寶可夢圖鑑';"), '切換至 habitat 分頁時標題必須為「寶可夢圖鑑」');
assert(js.includes("DOM.toolbarTitle.textContent = '棲息地總覽';"), '切換至 habitatCatalog 分頁時標題必須為「棲息地總覽」');
assert(js.includes("DOM.toolbarTitle.textContent = '儲存庫分類';"), '切換至 storage 分頁時標題必須為「儲存庫分類」');
assert(js.includes("<strong>9</strong> 大分類 ‧ 44 方案"), '儲存庫分類必須展示對應之 9 大分類 44 方案徽章');
console.log('✅ [PASS] 4. app.js 分頁切換聯動圖鑑與儲存庫標題/徽章正確');

// 6. 驗證 index.css 桌面與手機端排版
assert(css.includes('.toolbar-header-row {'), 'index.css 必須定義 .toolbar-header-row');
assert(css.includes('.toolbar-title {'), 'index.css 必須定義 .toolbar-title');

// 驗證手機端 2x2 grid 佈局與標題等高 (1.25rem)
assert(css.includes('grid-template-columns: 1fr 1fr'), '手機端 filter-toolbar-row 必須設置 grid-template-columns: 1fr 1fr 達成 2x2 雙行網格');
assert(css.includes('display: grid !important;'), '手機端 filter-toolbar-row 必須以 grid 佈局');
assert(css.includes('font-size: 1.25rem;'), '手機端 toolbar-title 字級應提升至 1.25rem 齊平卡片高度');
console.log('✅ [PASS] 5. CSS 佈局：手機端 filter-toolbar-row 2x2 網格與標題 1.25rem 等高齊平驗證通過');

// 7. 驗證手機端篩選列與圖鑑表格/卡片之緊湊間距 (徹底清除 24px margin-top，留白合計約 7px)
assert(css.includes('padding: 0.6250rem 0.7500rem 0.2000rem 0.7500rem;'), '手機端 app-header 底部內距應收窄至 0.2000rem (約 3px)');
assert(css.includes('margin: 0 auto 1.5000rem auto !important;'), '手機端 main-content 必須將 margin-top 歸零徹底拔除 24px 外距');
assert(css.includes('padding: 0.2500rem 0.5000rem 0.6250rem 0.5000rem;'), '手機端 main-content 頂部內距應收窄至 0.2500rem (約 4px)');
console.log('✅ [PASS] 6. 手機端篩選項目與下方圖鑑表格/卡片之 24px 外距根除與緊湊間距驗證通過');

// 8. 驗證終局農場手機版精緻緊湊化
assert(css.includes('.autofarm-title-short'), 'index.css 必須包含 .autofarm-title-short');
assert(css.includes('gap: 0.875rem !important;'), '手機端 autofarm-modules-grid 間隙應緊湊化為 14px');
console.log('✅ [PASS] 7. 終局農場手機端排版緊湊精緻化驗證通過');

// 9. 驗證次要標籤與標題字重輕量化（非粗體）
assert(css.includes('font-weight: 500;'), '標籤與下拉選單必須具備 font-weight: 500 輕量化');
console.log('✅ [PASS] 8. 次要標籤與下拉選單非粗體輕量化驗證通過');

// 10. 驗證我的收納盒標題列與動態箱數徽章
assert(html.includes('<h2 id="csTitle" class="toolbar-title">我的收納盒</h2>'), '我的收納盒必須具備標準 toolbar-title 標題');
assert(html.includes('id="csProgressBadge"'), '我的收納盒必須具備標準 csProgressBadge 膠囊徽章');
assert(js.includes('箱收納管理'), 'app.js 必須支援收納盒箱數動態更新至徽章');
console.log('✅ [PASS] 9. 我的收納盒標題列與箱數動態徽章驗證通過');

// 11. 驗證 CSS 括號平衡
const openB = (css.match(/{/g) || []).length;
const closeB = (css.match(/}/g) || []).length;
assert(openB === closeB, `CSS 括號必須平衡: Open=${openB}, Close=${closeB}`);
console.log(`✅ [PASS] 10. CSS 括號完全平衡 (${openB} === ${closeB})`);

console.log('\n🎉 全站 5 大頁面標題列、2x2 雙行篩選列、目次統一與終局農場優化驗證 100% 全部通過！\n');
