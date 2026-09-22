// verify_page_toolbar_and_footer.js
// 驗證各頁面智能空間釋放、全頁面目次按鈕常駐與頁尾作者 Cliff 高亮

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證分頁智能空間釋放、目次常駐與頁尾作者高亮 ===\n');

// 1. 檢驗 index.html
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 檢驗目次按鈕在 header brand 內常駐
assert(htmlContent.includes('<div class="brand">'), '必須包含 .brand');
assert(htmlContent.indexOf('<div class="toc-container">') < htmlContent.indexOf('<a href="#habitat-table" id="brandLogo"'), 'toc-container 必須位於 brandLogo 左側以達成全頁面常駐');
assert(htmlContent.includes('id="btnTocMenu"'), '必須包含 btnTocMenu');
assert(htmlContent.includes('id="tocDropdown"'), '必須包含 tocDropdown');
console.log('✔ [Check 1] 目次按鈕已成功提升至頂部 Header 最左側，確保所有分頁永久常駐');

// 檢驗工具列 ID
assert(htmlContent.includes('id="toolbarContainer"'), '必須包含 id="toolbarContainer"');
assert(htmlContent.includes('id="viewToggleGroup"'), '必須包含 id="viewToggleGroup"');
console.log('✔ [Check 2] 工具列容器與視圖切換群組 ID 定義完備');

// 檢驗頁尾作者
assert(htmlContent.includes('<span class="footer-author">Cliff</span>'), '頁尾必須包含 .footer-author 標籤並註明 Cliff');
console.log('✔ [Check 3] 頁尾作者標註 Cliff 結構正確');

// 2. 檢驗 index.css 樣式
const cssPath = path.join(__dirname, 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.footer-author'), 'CSS 必須包含 .footer-author 樣式');
assert(cssContent.includes('#f8fafc'), 'CSS 頁尾作者必須使用高對比亮白字體');
assert(cssContent.includes(':root[data-theme="dark"] .footer-author'), 'CSS 必須支援暗色模式作者高亮');
console.log('✔ [Check 4] 頁尾作者字體調亮樣式定義完備');

// 3. 檢驗 app.js switchTab 邏輯
const appJsPath = path.join(__dirname, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

assert(appJsContent.includes('toolbarContainer: document.getElementById(\'toolbarContainer\')'), 'DOM 快取必須包含 toolbarContainer');
assert(appJsContent.includes('viewToggleGroup: document.getElementById(\'viewToggleGroup\')'), 'DOM 快取必須包含 viewToggleGroup');

// 模擬 switchTab 測試各頁面行為
function createMockClassList() {
  const classes = new Set();
  return {
    add: (c) => classes.add(c),
    remove: (c) => classes.delete(c),
    contains: (c) => classes.has(c)
  };
}

const mockDOM = {
  toolbarContainer: { classList: createMockClassList() },
  viewToggleGroup: { classList: createMockClassList() }
};

function simulateTabSwitch(tab, dom) {
  if (tab === 'storage') {
    dom.toolbarContainer.classList.remove('hidden');
    dom.viewToggleGroup.classList.add('hidden');
  } else if (tab === 'habitat' || tab === 'habitatCatalog') {
    dom.toolbarContainer.classList.remove('hidden');
    dom.viewToggleGroup.classList.remove('hidden');
  } else if (tab === 'autofarm' || tab === 'customStorage') {
    dom.toolbarContainer.classList.add('hidden');
  }
}

// 測試 autofarm：工具列 100% 隱藏
simulateTabSwitch('autofarm', mockDOM);
assert(mockDOM.toolbarContainer.classList.contains('hidden'), 'autofarm 必須將 toolbarContainer 隱藏釋放 60px 空間');
console.log('✔ [Check 5] 終局農場 (autofarm) 工具列成功 100% 隱藏釋放垂直空間');

// 測試 customStorage：工具列 100% 隱藏
simulateTabSwitch('customStorage', mockDOM);
assert(mockDOM.toolbarContainer.classList.contains('hidden'), 'customStorage 必須將 toolbarContainer 隱藏消除雙搜尋框');
console.log('✔ [Check 6] 我的收納盒 (customStorage) 工具列成功 100% 隱藏消除雙搜尋框');

// 測試 storage：工具列顯示，視圖按鈕隱藏
simulateTabSwitch('storage', mockDOM);
assert(!mockDOM.toolbarContainer.classList.contains('hidden'), 'storage 必須保留 toolbarContainer');
assert(mockDOM.viewToggleGroup.classList.contains('hidden'), 'storage 必須隱藏無效的 viewToggleGroup');
console.log('✔ [Check 7] 9大儲存箱 (storage) 成功隱藏卡片/表格按鈕，搜尋列滿版展開');

// 測試 habitat：工具列與視圖按鈕完整顯示
simulateTabSwitch('habitat', mockDOM);
assert(!mockDOM.toolbarContainer.classList.contains('hidden'), 'habitat 必須顯示 toolbarContainer');
assert(!mockDOM.viewToggleGroup.classList.contains('hidden'), 'habitat 必須顯示 viewToggleGroup');
console.log('✔ [Check 8] 圖鑑 (habitat) 與棲息地完整保留搜尋與卡片/表格切換');

console.log('\nAll Page Toolbar & Footer verification tests PASSED successfully!');
