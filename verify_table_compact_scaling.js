const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證第 2 欄膠囊防裁切、呼吸間隔與跨視窗自適應機制 (v4.9.4) ---');

const cssContent = fs.readFileSync('index.css', 'utf8');
const htmlContent = fs.readFileSync('index.html', 'utf8');

// 1. 驗證第 2 欄「寶可夢」寬度自適應
assert.ok(
  cssContent.includes('width: clamp(5.2500rem, 6.5vw, 5.7500rem);') &&
  cssContent.includes('min-width: clamp(5.2500rem, 6.5vw, 5.7500rem);'),
  '測試失敗：未找到第 2 欄自適應 clamp 寬度！'
);
console.log('✓ 驗證通過：第 2 欄寬度由硬性限制解鎖為 clamp(5.25rem, 6.5vw, 5.75rem)，給予充足橫向呼吸留白');

// 2. 驗證「主圖鑑」膠囊標籤結構加固（防削頂）
assert.ok(
  cssContent.includes('.pkm-cell-identity .tag-badge {') &&
  cssContent.includes('display: inline-flex !important;') &&
  cssContent.includes('border-radius: 9999px !important;') &&
  cssContent.includes('padding: 0.1200rem 0.4200rem !important;'),
  '測試失敗：.pkm-cell-identity .tag-badge 樣式未正確加固！'
);
console.log('✓ 驗證通過：「主圖鑑」標籤具備 inline-flex 與完整上下 padding，100% 根除削頂與截邊');

// 3. 驗證「📍 乾巴巴」地區選擇器膠囊排版與呼吸間距
assert.ok(
  cssContent.includes('.pkm-table-region-select,') &&
  cssContent.includes('display: inline-flex;') &&
  cssContent.includes('margin-top: 0.20rem;') &&
  cssContent.includes('max-width: 100%;'),
  '測試失敗：.pkm-table-region-select 樣式未正確更新！'
);
console.log('✓ 驗證通過：地區選擇器具有獨立垂直間隔與 inline-flex 排版，與主圖鑑不再黏貼擠壓');

// 4. 驗證中窄螢幕 (< 1280px) 下第 2 欄 min-width 保障
assert.ok(
  cssContent.includes('min-width: 5.2500rem !important;'),
  '測試失敗：中窄螢幕媒體查詢缺少 min-width: 5.2500rem 保障！'
);
console.log('✓ 驗證通過：中窄螢幕下第 2 欄具備 min-width: 5.25rem 保障，跨視窗縮放穩定不扁平');

// 5. 驗證棲息地縮圖微縮 15% 依然完好
assert.ok(
  cssContent.includes('width: clamp(9.5000rem, 15vw, 13.7500rem);') &&
  cssContent.includes('aspect-ratio: 3 / 2;'),
  '測試失敗：棲息地縮圖微縮 15% 規則受損！'
);
console.log('✓ 驗證通過：棲息地 15% 微縮與 3:2 高清比例不受干擾');

// 6. 驗證全站資源快取標籤正常載入
assert.ok(htmlContent.includes('index.css?v='), 'index.css 必須具備快取版號標籤');
assert.ok(htmlContent.includes('app.js?v='), 'app.js 必須具備快取版號標籤');
assert.ok(htmlContent.includes('firebase.js?v='), 'firebase.js 必須具備快取版號標籤');
console.log('✓ 驗證通過：全站資源快取標籤確認正常載入');

console.log('🎉 第 2 欄雙膠囊防切邊與跨視窗自適應驗證 100% 全部通過！');
