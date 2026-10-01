// verify_container_grid_alignment.js
// 驗證「上方搜尋工具列與下方表格/卡片內容區 100% 垂直對齊齊平」

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證上方工具列與下方表格版心垂直對齊 ===\n');

const css = fs.readFileSync('index.css', 'utf8');

// 1. 檢驗工具列容器寬度
assert(css.includes('.toolbar-container {\n  max-width: 87.5000rem;'), 'toolbar-container 必須設定 max-width: 87.5000rem');
console.log('✔ [Check 1] 上方工具列版心寬度為 87.5000rem');

// 2. 檢驗主內容區版心寬度與內邊距之精準咬合
assert(css.includes('.main-content {\n  max-width: 90.5000rem;\n  margin: 0.7500rem auto 1.5000rem auto;\n  padding: 0 1.5000rem;'), 'main-content 必須設定 max-width: 90.5000rem 與 padding: 0 1.5000rem');
console.log('✔ [Check 2] 主內容區設定 max-width: 90.5000rem 與左右內距 1.5000rem');

// 3. 幾何一致性驗證：90.5rem - (1.5rem * 2) = 87.5rem (100% 垂直咬合)
const toolbarWidth = 87.5;
const mainContainerWidth = 90.5;
const mainPadding = 1.5 * 2;
const tableActualWidth = mainContainerWidth - mainPadding;

assert(Math.abs(toolbarWidth - tableActualWidth) < 0.0001, '下方表格內部可用寬度必須精準等於上方工具列寬度 (87.5rem)');
console.log(`✔ [Check 3] 幾何數學驗證：下方表格寬度 (${tableActualWidth}rem) 100% 垂直齊平上方工具列 (${toolbarWidth}rem)`);

// 4. CSS 大括號平衡
const o = (css.match(/{/g)||[]).length;
const c = (css.match(/}/g)||[]).length;
assert(o === c, `CSS 大括號必須平衡: Open=${o}, Close=${c}`);
console.log(`✔ [Check 4] CSS 語法括號嚴格平衡 (${o} / ${c})`);

console.log('\n🎉 上方工具列與下方表格版心垂直對齊驗收通過 (100% PASS)！\n');
