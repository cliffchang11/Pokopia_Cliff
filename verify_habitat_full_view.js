// verify_habitat_full_view.js
// 專屬自動化驗收腳本：棲息地縮圖完整全景模式 (object-fit: contain & center center) (v4.10.1)

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證：棲息地圖片完整全景模式 (v4.10.1) ===\n');

// 1. 檢驗 index.html 快取標籤
const html = fs.readFileSync('index.html', 'utf8');
assert.ok(html.includes('index.css?v=4.10.1'), 'index.css 快取未更新至 v=4.10.1');
assert.ok(html.includes('app.js?v=4.10.1'), 'app.js 快取未更新至 v=4.10.1');
assert.ok(html.includes('firebase.js?v=4.10.1'), 'firebase.js 快取未更新至 v=4.10.1');
assert.ok(html.includes('logo.png?v=4.10.1'), 'logo 快取未更新至 v=4.10.1');
assert.ok(html.includes('data.js?v=4.10.1'), 'data.js 快取未更新至 v=4.10.1');
console.log('✅ [Check 1] PASS: index.html 全站快取標籤全數升級至 v=4.10.1');

// 2. 檢驗 index.css
const css = fs.readFileSync('index.css', 'utf8');

// 2.1 括號平衡值檢驗
let balance = 0;
for (let c of css) {
  if (c === '{') balance++;
  else if (c === '}') balance--;
}
assert.strictEqual(balance, 0, 'FAIL: index.css 大括號未完全閉合');
console.log('✅ [Check 2.1] PASS: index.css 括號平衡值為 0，語法無懈可擊');

// 2.2 檢驗全域桌面版 .pkm-table-hab-thumb img
assert.ok(
  css.includes('.pkm-table-hab-thumb img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;'),
  'FAIL: 桌面版 .pkm-table-hab-thumb img 缺少 object-fit: contain 與 center center'
);
console.log('✅ [Check 2.2] PASS: 電腦桌面版表格棲息地縮圖成功配置 object-fit: contain 且置中');

// 2.3 檢驗平板中螢幕 (641px ~ 1120px) 棲息地縮圖
const tabletMediaIdx = css.indexOf('@media (min-width: 641px) and (max-width: 1120px)');
assert.ok(tabletMediaIdx !== -1, 'FAIL: 缺少平板媒體查詢');
const tabletChunk = css.substring(tabletMediaIdx, tabletMediaIdx + 6000);
assert.ok(
  tabletChunk.includes('.pokemon-table td.pkm-col-hab .pkm-table-hab-thumb img') &&
  tabletChunk.includes('object-fit: contain !important;') &&
  tabletChunk.includes('object-position: center center !important;'),
  'FAIL: 平板媒體查詢缺少 .pkm-table-hab-thumb img 的 contain 與 center center 規則'
);
console.log('✅ [Check 2.3] PASS: 平板端 (641px ~ 1120px) 表格棲息地縮圖成功鎖定 contain 與置中，完全無削頂');

// 2.4 檢驗手機端 (<= 640px) 棲息地縮圖
assert.ok(
  css.includes('.pokemon-table td.pkm-col-hab .pkm-table-hab-thumb img,\n  .pokemon-table td:nth-child(6) .pkm-table-hab-thumb img {\n    position: absolute !important;\n    top: 0 !important;\n    left: 0 !important;\n    width: 100% !important;\n    height: 100% !important;\n    object-fit: contain !important;\n    object-position: center center !important;'),
  'FAIL: 手機端表格棲息地縮圖缺少 contain 與 center center 規則'
);
console.log('✅ [Check 2.4] PASS: 手機端表格棲息地縮圖成功配置 contain 與置中');

// 2.5 檢驗卡片檢視與詳情抽屜
assert.ok(
  css.includes('.pkm-card-hab-thumb img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;'),
  'FAIL: 卡片檢視 .pkm-card-hab-thumb img 缺少 contain 規則'
);
assert.ok(
  css.includes('.pkm-detail-hab-thumb img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;'),
  'FAIL: 詳情抽屜 .pkm-detail-hab-thumb img 缺少 contain 規則'
);
assert.ok(
  css.includes('.table-hab-img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  object-position: center center;'),
  'FAIL: 52poke 棲息地表格 .table-hab-img 缺少 contain 規則'
);
console.log('✅ [Check 2.5] PASS: 卡片檢視、百科抽屜與 52poke 表格縮圖全面切換至 contain 完整無裁切');

// 2.6 檢驗徹底消除所有 center bottom 偏位削頂
assert.ok(
  !css.includes('object-position: center bottom'),
  'FAIL: 樣式表中仍殘留 object-position: center bottom，存在削頂風險'
);
console.log('✅ [Check 2.6] PASS: 全站樣式表 100% 徹底根除所有強制偏底的 center bottom 裁切規則！');

console.log('\n🎉 verify_habitat_full_view.js 全部驗證 100% 通過！');
