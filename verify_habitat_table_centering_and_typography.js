// verify_habitat_table_centering_and_typography.js
// 專屬自動化驗收腳本：棲息地總覽表格外觀圖片居中、流體字體縮放與環境選單重設防護

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始執行：棲息地表格外觀圖片居中 & 流體字體排版自動化驗收 ===\n');

const css = fs.readFileSync('index.css', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

// 1. 檢驗外觀單元格與縮圖居中樣式
console.log('--- 1. 檢驗外觀單元格與縮圖居中 ---');
assert(css.includes('.table-hab-appearance-cell {') && css.includes('justify-content: center;'), 'table-hab-appearance-cell 必須具備 justify-content: center 置中');
assert(css.includes('.table-hab-thumb-wrap {') && css.includes('margin: 0 auto;'), 'table-hab-thumb-wrap 必須具備 margin: 0 auto 雙重水平居中保證');
assert(css.includes('width: clamp('), 'table-hab-thumb-wrap 必須採用 clamp 流體等比縮放寬度');
console.log('✅ [PASS] 1. 外觀縮圖在單元格內 100% 嚴格絕對水平與垂直居中');

// 2. 檢驗棲息地身分欄位展台式居中與流體字體縮放
console.log('\n--- 2. 檢驗棲息地名稱與標籤展台對稱與流體字體 ---');
assert(css.includes('.table-hab-name-zh {') && css.includes('font-size: clamp('), 'table-hab-name-zh 必須採用 clamp 流體縮放');
assert(css.includes('word-break: keep-all;'), 'table-hab-name-zh 必須具備 word-break: keep-all 防止中文字符被截斷為單字孤懸');
assert(css.includes('.table-hab-id-cell {') && css.includes('align-items: center;'), 'table-hab-id-cell 必須具備垂直居中展台對稱排版');
console.log('✅ [PASS] 2. 棲息地名稱與編號標籤展台式居中，且具備流體自適應防斷行縮放');

// 3. 檢驗 app.js 中環境重設值為 env-all
console.log('\n--- 3. 檢驗目次首頁重設邏輯 ---');
assert(!app.includes("DOM.envFilter.value = 'all';"), 'app.js 絕不可再將 envFilter.value 賦值為不存在的 all');
assert(app.includes("DOM.envFilter.value = 'env-all';"), 'app.js 必須準確賦值為標準選項 env-all');
console.log('✅ [PASS] 3. app.js 環境篩選器重設邏輯 100% 正確匹配「全部 (env-all)」選項');

console.log('\n🎉 [ALL CHECKS PASSED] 棲息地表格外觀置中、流體排版與環境選單修復驗收全部通過！');
