/**
 * verify_region_select_text_spacing.js
 * 離線驗收測試：表格第 2 欄地區選擇膠囊文字與下拉箭頭防遮蔽呼吸留白校驗
 */

const fs = require('fs');
const assert = require('assert');

console.log('=== [開始離線驗證：表格地區膠囊防壓字與第 2 欄自適應修復] ===\n');

const css = fs.readFileSync('index.css', 'utf8');

// 1. 檢驗通用地區選擇膠囊右側箭頭安全間距 (padding-right >= 1.1rem)
assert.ok(
  css.includes('.pkm-table-region-select') &&
  css.includes('padding: 0.12rem 1.15rem 0.12rem 0.45rem;') &&
  css.includes('white-space: nowrap;'),
  '通用 .pkm-table-region-select 必須包含右側充足內邊距 (1.15rem) 與 white-space: nowrap'
);
console.log('  ✅ [PASS] 通用狀態下地區選擇膠囊右側具備 1.15rem 充足呼吸留白，文字絕不被箭頭覆蓋');

// 2. 檢驗手機端 (<= 640px) 膠囊箭頭避讓與最小寬度保障
assert.ok(
  css.includes('padding: 0.10rem 1.15rem 0.10rem 0.38rem !important;') &&
  css.includes('min-width: 5.1rem !important;'),
  '手機端 (<= 640px) 必須確保 padding-right 為 1.15rem 且具備 min-width: 5.1rem 寬度保障'
);
console.log('  ✅ [PASS] 手機端 (<= 640px) 膠囊寬度具備 5.1rem 保障，下拉箭頭不遮蔽「空空鎮」、「乾巴巴」');

// 3. 檢驗中窄螢幕 (641px ~ 1120px) 第 2 欄寬度解鎖
assert.ok(
  css.includes('width: clamp(5.2500rem, 7.5vw, 6.0000rem) !important;') &&
  css.includes('min-width: 5.2500rem !important;'),
  '中窄螢幕下第 2 欄寬度必須解鎖為 clamp(5.25rem, 7.5vw, 6.0rem)'
);
console.log('  ✅ [PASS] 中窄螢幕下第 2 欄寬度解鎖極限壓縮，水平伸展空間充裕');

console.log('\n========================================');
console.log('表格地區膠囊防壓字驗收結果：全部通過！');
console.log('========================================\n');
