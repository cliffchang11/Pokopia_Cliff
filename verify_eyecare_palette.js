// verify_eyecare_palette.js
// 驗證「亮色模式溫潤護眼低眩光底色、表格立體微陰影與斑馬紋微交錯」

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證亮色模式溫潤護眼調與表格層次優化 ===\n');

const css = fs.readFileSync('index.css', 'utf8');

// 1. 檢驗全域護眼底色
assert(css.includes('--bg-dark: #eef2f6;'), '亮色模式底色必須採用溫潤護眼灰調 #eef2f6');
console.log('✔ [Check 1] 亮色模式底色成功調降眩光強度，採用 #eef2f6 溫潤護眼色調');

// 2. 檢驗表格斑馬紋交替變數與懸停變數
assert(css.includes('--table-tr-alt: #f8fafc;'), '亮色模式必須定義 --table-tr-alt');
assert(css.includes('--table-tr-hover: #edf2f7;'), '亮色模式必須定義 --table-tr-hover 懸停淡藍灰');
assert(css.includes('--table-tr-alt: rgba(255, 255, 255, 0.02);'), '暗色模式必須定義相容之 --table-tr-alt');
assert(css.includes('--table-tr-hover: rgba(255, 255, 255, 0.06);'), '暗色模式必須定義相容之 --table-tr-hover');
console.log('✔ [Check 2] 亮色與暗色模式表格交替與懸停高亮變數完備');

// 3. 檢驗表格斑馬紋與懸停 CSS 規則
assert(css.includes('.data-table tbody tr:nth-child(even) {'), '必須包含偶數行斑馬紋規則');
assert(css.includes('.data-table tbody tr:hover {'), '必須包含滑鼠懸停高亮規則');
assert(css.includes('background-color: var(--table-tr-hover) !important;'), '懸停高亮必須具備足夠優先權');
console.log('✔ [Check 3] 表格偶數行斑馬紋與懸停高亮規則驗證通過');

// 4. 檢驗表格立體微陰影
assert(css.includes('box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06)'), '表格容器必須具備細膩漫射立體微陰影');
console.log('✔ [Check 4] 表格紙張立體感與邊界層次陰影驗證通過');

console.log('\n🎉 亮色模式護眼調與表格層次全量驗收通過 (100% PASS)！\n');
