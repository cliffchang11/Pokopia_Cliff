const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 中型螢幕 (641px ~ 1120px) 流體響應式幾何檢驗');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// 1. 驗證媒體查詢宣告
assert(css.includes('@media (min-width: 641px) and (max-width: 1120px)'), '缺少中型螢幕媒體查詢 (min-width: 641px) and (max-width: 1120px)');
console.log('✅ [Check 1] PASS: 成功宣告中型視窗 (641px ~ 1120px) 媒體查詢');

// 2. 驗證中型螢幕下各欄位的流體收縮設定
assert(css.includes('.pokemon-table th.col-th-habitat,') && css.includes('clamp(10.5000rem, 20vw, 15.5000rem)'), '棲息地欄位缺少 clamp(10.5000rem, 20vw, 15.5000rem) 流體縮放');
assert(css.includes('.pokemon-table th.col-th-favorites,') && css.includes('clamp(9.2500rem, 16vw, 13.0000rem)'), '喜好欄位缺少 clamp(9.2500rem, 16vw, 13.0000rem) 流體收緊');
assert(css.includes('.pokemon-table td.col-favorites .fav-pill') && css.includes('font-size: 0.70rem'), '喜好標籤缺少中型螢幕 0.70rem 字級微調與防裁切');
console.log('✅ [Check 2] PASS: 棲息地、喜好與標籤組皆具備流體收縮與字級防裁切');

// 3. 幾何寬度模擬計算函數 (以 rem=16px 為基準，vw 依視窗寬度動態計算)
function clamp(minPx, vwVal, maxPx, viewportWidth) {
  const currentVal = (vwVal / 100) * viewportWidth;
  return Math.min(Math.max(currentVal, minPx), maxPx);
}

function calculateTableTotalWidth(viewportWidth) {
  // 欄位 1: 解鎖 2.25rem = 36px
  const col1 = 36;
  // 欄位 2: 寶可夢 4.25rem = 68px
  const col2 = 68;
  // 欄位 3: 外觀 clamp(4.375rem, 8vw, 5.625rem) = clamp(70px, 8vw, 90px)
  const col3 = clamp(70, 8, 90, viewportWidth);
  // 欄位 4: 環境 clamp(3.75rem, 6.5vw, 4.75rem) = clamp(60px, 6.5vw, 76px)
  const col4 = clamp(60, 6.5, 76, viewportWidth);
  // 欄位 5: 專長 clamp(4.0rem, 7vw, 5.0rem) = clamp(64px, 7vw, 80px)
  const col5 = clamp(64, 7, 80, viewportWidth);
  // 欄位 6: 棲息地 clamp(10.5rem, 20vw, 15.5rem) = clamp(168px, 20vw, 248px)
  const col6 = clamp(168, 20, 248, viewportWidth);
  // 欄位 7: 喜好 clamp(9.25rem, 16vw, 13.0rem) = clamp(148px, 16vw, 208px)
  const col7 = clamp(148, 16, 208, viewportWidth);

  // main-content padding: 0.75rem * 2 = 24px
  const padding = 24;

  const totalTableWidth = col1 + col2 + col3 + col4 + col5 + col6 + col7;
  const totalOccupied = totalTableWidth + padding;
  return { totalTableWidth, totalOccupied };
}

// 測試典型中型解析度：768px (iPad 垂直), 900px (分屏視窗), 1024px (iPad 橫向/小筆電), 1100px (普通筆電)
const testResolutions = [768, 850, 900, 960, 1024, 1100];

testResolutions.forEach(w => {
  const { totalTableWidth, totalOccupied } = calculateTableTotalWidth(w);
  const remainingMargin = w - totalOccupied;
  assert(remainingMargin >= 0, `寬度 ${w}px 下表格總寬 (${totalOccupied}px) 超出視窗！`);
  console.log(`✅ [幾何驗算 ${w}px] 總佔用: ${totalOccupied.toFixed(1)}px (表格 ${totalTableWidth.toFixed(1)}px + 邊距 24px) 剩餘餘裕: ${remainingMargin.toFixed(1)}px -> 零溢出 PASS`);
});

// 4. 驗證手機端 (<= 640px) 規則依然完好
assert(css.includes('.pokemon-table th:nth-child(7),') && css.includes('display: none !important;'), '手機端隱藏第 7 欄喜好規則必須完好存在');
assert(css.includes('.pokemon-table th:nth-child(6),') && css.includes('width: 28% !important;'), '手機端第 6 欄棲息地 28% 規則必須完好存在');
console.log('✅ [Check 4] PASS: 手機端 (<= 640px) 既有前 6 欄滿版規則保全無損');

console.log('\n🎉 中型螢幕 (641px ~ 1120px) 流體響應式幾何檢驗 100% PASS！');
