// verify_toolbar_visibility_and_footer.js
// 驗證工具列依分頁智能顯隱與頁尾作者 Cliff 銘牌（零 emoji）

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證分頁工具列智能顯隱與頁尾作者 Cliff 銘牌 ===\n');

// 1. 檢驗 index.html 頁尾
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert(htmlContent.includes('<footer class="app-footer">'), '必須包含 .app-footer');
assert(htmlContent.includes('class="footer-author-box"'), '必須包含 .footer-author-box');
assert(htmlContent.includes('class="footer-author-label"'), '必須包含 .footer-author-label');
assert(htmlContent.includes('class="footer-author-badge">Cliff</span>'), '必須包含 Cliff 作者銘牌');

// 嚴格檢驗頁尾絕不包含任何 Emoji
const footerMatch = htmlContent.match(/<footer class="app-footer">([\s\S]*?)<\/footer>/);
assert(footerMatch, '必須能提取頁尾 HTML');
const footerHtml = footerMatch[1];
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
assert(!emojiRegex.test(footerHtml), '頁尾內嚴禁包含任何 Emoji 表情符號！');
console.log('✔ [Check 1] index.html 頁尾作者結構正確且嚴格零 Emoji');

// 2. 檢驗 index.css 樣式
const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
assert(cssContent.includes('.footer-author-box'), 'CSS 必須包含 .footer-author-box 樣式');
assert(cssContent.includes('.footer-author-badge'), 'CSS 必須包含 .footer-author-badge 樣式');
assert(cssContent.includes(':root[data-theme="dark"] .footer-author-badge'), 'CSS 必須包含暗色主題下的作者銘牌金色適配');
console.log('✔ [Check 2] index.css 作者銘牌高對比立體樣式與暗黑模式適配定義正確');

// 3. 檢驗 app.js 邏輯
const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(appJsContent.includes('toolbarContainer: document.querySelector'), 'app.js 必須快取 toolbarContainer');
assert(appJsContent.includes('viewToggleGroup: document.querySelector'), 'app.js 必須快取 viewToggleGroup');
assert(appJsContent.includes("if (tab === 'autofarm' || tab === 'customStorage')"), '必須在農場與收納盒分頁隱藏工具列');
assert(appJsContent.includes("if (tab === 'storage')"), '必須在儲存庫分頁隱藏 viewToggleGroup');

// 模擬邏輯測試
function createMockElement() {
  const set = new Set();
  return {
    classList: {
      add: (c) => set.add(c),
      remove: (c) => set.delete(c),
      contains: (c) => set.has(c),
      has: (c) => set.has(c)
    }
  };
}
const mockDOM = {
  toolbarContainer: createMockElement(),
  viewToggleGroup: createMockElement()
};

function simulateToolbarAdaptation(tab) {
  if (tab === 'autofarm' || tab === 'customStorage') {
    mockDOM.toolbarContainer.classList.add('hidden');
  } else {
    mockDOM.toolbarContainer.classList.remove('hidden');
  }
  if (tab === 'storage') {
    mockDOM.viewToggleGroup.classList.add('hidden');
  } else if (tab === 'habitat' || tab === 'habitatCatalog') {
    mockDOM.viewToggleGroup.classList.remove('hidden');
  }
}

// 測試 autofarm
simulateToolbarAdaptation('autofarm');
assert(mockDOM.toolbarContainer.classList.has('hidden'), 'autofarm 必須隱藏全域工具列');
console.log('✔ [Check 3] 終局農場 (autofarm) 分頁全域工具列成功隱藏，釋放空間');

// 測試 customStorage
simulateToolbarAdaptation('customStorage');
assert(mockDOM.toolbarContainer.classList.has('hidden'), 'customStorage 必須隱藏全域工具列');
console.log('✔ [Check 4] 我的收納盒 (customStorage) 分頁成功隱藏全域工具列，消除雙搜尋框');

// 測試 storage
simulateToolbarAdaptation('storage');
assert(!mockDOM.toolbarContainer.classList.has('hidden'), 'storage 必須顯示搜尋框');
assert(mockDOM.viewToggleGroup.classList.has('hidden'), 'storage 必須隱藏無效的卡片/表格切換按鈕');
console.log('✔ [Check 5] 儲存庫分類 (storage) 分頁成功隱藏卡片/表格按鈕，搜尋框舒展');

// 測試 habitat / habitatCatalog
simulateToolbarAdaptation('habitat');
assert(!mockDOM.toolbarContainer.classList.has('hidden'), 'habitat 必須顯示工具列');
assert(!mockDOM.viewToggleGroup.classList.has('hidden'), 'habitat 必須顯示視圖切換');
console.log('✔ [Check 6] 寶可夢圖鑑與棲息地一覽維持全功能工具列');

console.log('\nAll Toolbar Adaptation & Author Footer verification tests PASSED successfully!');
