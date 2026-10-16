/**
 * 離線校驗腳本：驗證全站口味標籤色彩系統一致性 (verify_taste_colors.js)
 * 驗收範圍：寶可夢圖鑑標籤 (.fav-pill, .pref-pill)、喜好百科抽屜 (.pref-pill-taste, .pref-card)、詳情彈窗 (.taste-pill)
 */

const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'index.css');
const appJsPath = path.join(__dirname, 'app.js');

const cssContent = fs.readFileSync(cssPath, 'utf8');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

const TASTES = ['辣辣的', '甜甜的', '酸酸的', '苦苦的', '澀澀的', '平淡無奇的'];

console.log('=== [開始離線驗證：全站口味色彩統一性] ===\n');
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. 驗證圖鑑 .fav-pill 亮色模式
console.log('1. 驗證圖鑑卡片標籤 (.fav-pill) 亮色配色：');
assert(cssContent.includes('.fav-pill[data-fav="甜甜的"]') && cssContent.includes('#be123c'), '甜甜的包含粉紅字色 (#be123c)');
assert(cssContent.includes('.fav-pill[data-fav="辣辣的"]') && cssContent.includes('#b91c1c'), '辣辣的包含烈焰紅字色 (#b91c1c)');
assert(cssContent.includes('.fav-pill[data-fav="酸酸的"]') && cssContent.includes('#854d0e') && cssContent.includes('#fefce8'), '酸酸的已正名為暖陽金黃色 (#854d0e, #fefce8，而非青草綠)');
assert(cssContent.includes('.fav-pill[data-fav="苦苦的"]') && cssContent.includes('#15803d') && cssContent.includes('#f0fdf4'), '苦苦的對齊翠綠色 (#15803d, #f0fdf4)');
assert(cssContent.includes('.fav-pill[data-fav="澀澀的"]') && cssContent.includes('#7e22ce') && cssContent.includes('#faf5ff'), '澀澀的已正名為典雅紫色 (#7e22ce, #faf5ff，而非水藍色)');
assert(cssContent.includes('.fav-pill[data-fav="平淡無奇的"]') && cssContent.includes('#57534e'), '平淡無奇的包含沉穩灰字色 (#57534e)');

// 2. 驗證圖鑑 .fav-pill 暗色模式
console.log('\n2. 驗證圖鑑卡片標籤 (.fav-pill) 暗色配色：');
TASTES.forEach(t => {
  const hasDark = cssContent.includes(`:root[data-theme="dark"] .fav-pill[data-fav="${t}"]`);
  assert(hasDark, `暗色模式下包含 .fav-pill[data-fav="${t}"] 定義`);
});

// 3. 驗證喜好百科抽屜與詳情彈窗口味標籤
console.log('\n3. 驗證喜好百科抽屜與全域口味標籤 (.pref-pill, .pref-pill-taste, .taste-pill)：');
TASTES.forEach(t => {
  const lightSelector = `.pref-pill[data-fav="${t}"]`;
  const darkSelector = `:root[data-theme="dark"] .pref-pill[data-fav="${t}"]`;
  assert(cssContent.includes(lightSelector), `亮色模式包含 ${lightSelector} 專屬配色`);
  assert(cssContent.includes(darkSelector), `暗色模式包含 ${darkSelector} 專屬配色`);
});

// 4. 驗證喜好百科抽屜大卡片左側識別色條
console.log('\n4. 驗證喜好百科抽屜口味大卡片 (.pref-card)：');
TASTES.forEach(t => {
  const cardSelector = `.pref-card[data-name="${t}"]`;
  assert(cssContent.includes(cardSelector), `口味大卡片包含專屬識別色條 ${cardSelector}`);
});

// 5. 驗證 app.js 中屬性注入
console.log('\n5. 驗證 app.js 中 DOM 標籤屬性注入：');
assert(
  appJsContent.includes('<span class="pref-pill pref-pill-taste" data-fav="${escapeHTML(t.name)}"'),
  '喜好百科抽屜標題標籤已綁定 data-fav 屬性'
);
assert(
  appJsContent.includes('const pillClass = isTaste ? \'pref-pill pref-pill-taste\' : \'pref-pill pref-pill-thing\';'),
  '列表卡片 renderPrefPill 正確區分口味與特徵'
);

console.log(`\n========================================`);
console.log(`離線色彩驗證結果：${passedCount} / ${totalCount} 項檢查通過！`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
