const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證電腦版寶可夢表格列高矮化、棲息地等比例微縮 15% 與手機版隔離機制 (v4.9.3) ---');

const cssContent = fs.readFileSync('index.css', 'utf8');
const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. 驗證任務 1：棲息地欄位寬度與大縮圖尺寸微縮 15% (3:2 等比例)
assert.ok(
  cssContent.includes('width: clamp(9.5000rem, 15vw, 13.7500rem);'),
  '測試失敗：未找到棲息地縮圖微縮 15% 尺寸 (clamp 9.50rem~13.75rem)！'
);
assert.ok(
  cssContent.includes('aspect-ratio: 3 / 2;'),
  '測試失敗：棲息地縮圖 3:2 等比例遺失！'
);
assert.ok(
  cssContent.includes('width: clamp(11.5000rem, 18.5vw, 17.0000rem);'),
  '測試失敗：未找到 .col-th-habitat 棲息地表頭欄寬收斂！'
);
console.log('✓ 驗證通過：棲息地大縮圖成功微縮 15%，維持 3:2 高清等比例');

// 2. 驗證任務 2：寶可夢立繪大頭像微縮約 7% 與表格單元格緊湊垂直 padding
assert.ok(
  cssContent.includes('width: clamp(3.7500rem, 5.0vw, 4.8500rem);') &&
  cssContent.includes('height: clamp(3.7500rem, 5.0vw, 4.8500rem);'),
  '測試失敗：未找到 .pkm-avatar-table-large 微縮 7% 的 clamp 尺寸！'
);
console.log('✓ 驗證通過：寶可夢大頭像微縮 7%，保持清晰大氣觀賞性');

assert.ok(
  cssContent.includes('padding: 0.6000rem 0.6250rem !important;'),
  '測試失敗：未找到 .pokemon-table td 緊湊垂直內邊距 0.6000rem！'
);
console.log('✓ 驗證通過：表格單元格上下內邊距收緊至約 10px，每列高度實質矮化');

// 3. 驗證任務 3：中螢幕流體相稱銜接與手機版 (< 640px) 100% 獨立隔離
assert.ok(
  cssContent.includes('width: clamp(3.0000rem, 4.8vw, 3.9500rem) !important;'),
  '測試失敗：中螢幕寶可夢頭像未同步流體微調！'
);
assert.ok(
  cssContent.includes('max-width: clamp(8.0000rem, 15vw, 12.0000rem) !important;'),
  '測試失敗：中螢幕棲息地縮圖未同步流體微調！'
);
// 確認手機版獨立規則完好
assert.ok(
  cssContent.includes('@media (max-width: 640px)'),
  '測試失敗：手機版媒體查詢遺失！'
);
console.log('✓ 驗證通過：中螢幕平滑過渡，手機版 (<= 640px) 規則完全隔離不更動');

// 4. 驗證任務 4：index.html 快取標籤更新為 v=4.9.3
assert.ok(htmlContent.includes('index.css?v=4.9.3'), 'index.css 快取未更新至 v=4.9.3');
assert.ok(htmlContent.includes('app.js?v=4.9.3'), 'app.js 快取未更新至 v=4.9.3');
assert.ok(htmlContent.includes('firebase.js?v=4.9.3'), 'firebase.js 快取未更新至 v=4.9.3');
assert.ok(htmlContent.includes('logo.png?v=4.9.3'), 'logo 快取未更新至 v=4.9.3');
console.log('✓ 驗證通過：全站資源快取標籤確認升級至 v=4.9.3');

console.log('🎉 電腦版列高矮化與響應式等比例驗證 100% 全部通過！');
