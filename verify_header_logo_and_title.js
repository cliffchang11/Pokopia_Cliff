// verify_header_logo_and_title.js
// 驗證頂部風速狗 Logo 3D 徽章工藝與 Pokopia 旗艦字體漸層

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證 Header Logo 3D 徽章工藝與標題字體優化 ===\n');

// 1. 檢驗 index.html 結構
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(htmlContent.includes('<span class="brand-title-accent">Pokopia</span>'), 'index.html 必須包含 .brand-title-accent 標籤');
assert(htmlContent.includes('儲存庫與棲息地助手'), 'index.html 必須保留中文標題');
console.log('✔ [Check 1] index.html 標題結構更新正確');

// 2. 檢驗 index.css 樣式
const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');

// Logo 尺寸與 3D 陰影
assert(cssContent.includes('width: 3.25rem;'), 'Logo 寬度必須升級為 3.25rem');
assert(cssContent.includes('height: 3.25rem;'), 'Logo 高度必須升級為 3.25rem');
assert(cssContent.includes('border: 0.1250rem solid rgba(255, 255, 255, 0.90);'), 'Logo 必須具有立體白邊');
assert(cssContent.includes('rgba(15, 23, 42, 0.40)'), 'Logo 必須包含底層接觸深色陰影');
assert(cssContent.includes('rgba(245, 158, 11, 0.45)'), 'Logo 必須包含外層暖橙色柔和漫射輝光');
console.log('✔ [Check 2] Logo 3.25rem 尺寸、立體白邊與雙層 3D 物理投影定義正確');

// 字體與漸層
assert(cssContent.includes(".brand-title-accent"), '必須包含 .brand-title-accent 樣式');
assert(cssContent.includes("'Outfit', sans-serif"), 'Pokopia 標題必須指定 Outfit 字體');
assert(cssContent.includes('-webkit-background-clip: text;'), 'Pokopia 標題必須使用文字漸層裁切');
assert(cssContent.includes(':root[data-theme="dark"] .brand-title-accent'), '必須包含深色模式下的漸層色適配');
console.log('✔ [Check 3] Pokopia 旗艦字體 Outfit 與日夜金橙漸層定義正確');

// 手機端尺寸
assert(cssContent.includes('width: 2.35rem;'), '手機版 Logo 尺寸必須自適應縮放為 2.35rem');
console.log('✔ [Check 4] 手機端響應式自適應縮放定義正確');

console.log('\nAll Header Logo & Title verification tests PASSED successfully!');
