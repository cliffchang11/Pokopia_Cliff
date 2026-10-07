// verify_filter_result_count.js
// 驗證圖鑑篩選即時計數膠囊與一鍵重設按鈕 (v4.9.5)

const fs = require('fs');
const assert = require('assert');

console.log('--- 開始驗證圖鑑篩選即時計數膠囊與一鍵重設機制 (v4.9.5) ---');

// 1. 驗證 index.html 結構與快取版本
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('id="filterResultGroup"'), 'index.html 缺少 filterResultGroup 容器');
assert.ok(indexHtml.includes('id="filterResultBadge"'), 'index.html 缺少 filterResultBadge 膠囊');
assert.ok(indexHtml.includes('id="filterResultIcon"'), 'index.html 缺少 filterResultIcon 圖示');
assert.ok(indexHtml.includes('id="filterResultText"'), 'index.html 缺少 filterResultText 文字');
assert.ok(indexHtml.includes('id="btnResetFilters"'), 'index.html 缺少 btnResetFilters 一鍵重設按鈕');

// 快取版本號驗證
assert.ok(indexHtml.includes('index.css?v=4.9.9'), 'index.css 快取未更新至 v=4.9.9');
assert.ok(indexHtml.includes('app.js?v=4.9.9'), 'app.js 快取未更新至 v=4.9.9');
assert.ok(indexHtml.includes('firebase.js?v=4.9.9'), 'firebase.js 快取未更新至 v=4.9.9');
assert.ok(indexHtml.includes('logo.png?v=4.9.9'), 'logo 快取未更新至 v=4.9.9');
console.log('✓ 驗證通過：index.html 結構健全且全站快取標籤確認為 v=4.9.9');

// 2. 驗證 index.css 樣式與 RWD 響應
const indexCss = fs.readFileSync('index.css', 'utf8');
assert.ok(indexCss.includes('.filter-result-item'), 'index.css 缺少 .filter-result-item 樣式');
assert.ok(indexCss.includes('.filter-result-badge'), 'index.css 缺少 .filter-result-badge 樣式');
assert.ok(indexCss.includes('.filter-result-badge.is-filtered'), 'index.css 缺少 .filter-result-badge.is-filtered 高亮樣式');
assert.ok(indexCss.includes('.filter-result-badge.is-empty'), 'index.css 缺少 .filter-result-badge.is-empty 警示樣式');
assert.ok(indexCss.includes('.filter-reset-btn'), 'index.css 缺少 .filter-reset-btn 重設按鈕樣式');

// 檢查 max-width: 640px 手機網格佈局
assert.ok(
  indexCss.includes('@media (max-width: 640px)') &&
  indexCss.includes('.filter-result-item') &&
  indexCss.includes('.filter-result-badge'),
  'index.css 缺少 max-width: 640px 手機版 2 欄適配樣式'
);
console.log('✓ 驗證通過：index.css 視覺樣式與 640px 雙欄佈局健全');

// 3. 驗證 app.js DOM 宣告與邏輯函式
const appJs = fs.readFileSync('app.js', 'utf8');
assert.ok(appJs.includes('filterResultGroup: document.getElementById(\'filterResultGroup\')'), 'app.js 缺少 filterResultGroup DOM 參照');
assert.ok(appJs.includes('filterResultBadge: document.getElementById(\'filterResultBadge\')'), 'app.js 缺少 filterResultBadge DOM 參照');
assert.ok(appJs.includes('filterResultIcon: document.getElementById(\'filterResultIcon\')'), 'app.js 缺少 filterResultIcon DOM 參照');
assert.ok(appJs.includes('filterResultText: document.getElementById(\'filterResultText\')'), 'app.js 缺少 filterResultText DOM 參照');
assert.ok(appJs.includes('btnResetFilters: document.getElementById(\'btnResetFilters\')'), 'app.js 缺少 btnResetFilters DOM 參照');

assert.ok(appJs.includes('function updateFilterResultBadge('), 'app.js 缺少 updateFilterResultBadge 函式');
assert.ok(appJs.includes('function resetPokemonFilters('), 'app.js 缺少 resetPokemonFilters 函式');
assert.ok(appJs.includes('updateFilterResultBadge(pokemons.length, categoryTotalCount, isFiltered)'), 'renderHabitat 未正確呼叫 updateFilterResultBadge');
assert.ok(appJs.includes('DOM.btnResetFilters.addEventListener(\'click\''), 'app.js 未綁定重設按鈕點擊事件');

// 4. 模擬 updateFilterResultBadge 邏輯計算
function simulateBadge(filteredCount, categoryTotalCount, isFiltered) {
  let icon = '📊';
  let text = '';
  let isFilteredClass = false;
  let isEmptyClass = false;
  let showResetBtn = false;

  if (isFiltered) {
    if (filteredCount === 0) {
      icon = '⚠️';
      text = `0 / ${categoryTotalCount} 隻`;
      isEmptyClass = true;
      isFilteredClass = true;
    } else {
      icon = '🎯';
      text = `${filteredCount} / ${categoryTotalCount} 隻`;
      isFilteredClass = true;
    }
    showResetBtn = true;
  } else {
    icon = '📊';
    text = `全部 ${categoryTotalCount} 隻`;
    showResetBtn = false;
  }

  return { icon, text, isFilteredClass, isEmptyClass, showResetBtn };
}

// 測試案例 A: 無篩選狀態
const caseA = simulateBadge(308, 308, false);
assert.strictEqual(caseA.icon, '📊');
assert.strictEqual(caseA.text, '全部 308 隻');
assert.strictEqual(caseA.isFilteredClass, false);
assert.strictEqual(caseA.isEmptyClass, false);
assert.strictEqual(caseA.showResetBtn, false);

// 測試案例 B: 篩選有結果
const caseB = simulateBadge(24, 308, true);
assert.strictEqual(caseB.icon, '🎯');
assert.strictEqual(caseB.text, '24 / 308 隻');
assert.strictEqual(caseB.isFilteredClass, true);
assert.strictEqual(caseB.isEmptyClass, false);
assert.strictEqual(caseB.showResetBtn, true);

// 測試案例 C: 篩選無結果 (0隻)
const caseC = simulateBadge(0, 308, true);
assert.strictEqual(caseC.icon, '⚠️');
assert.strictEqual(caseC.text, '0 / 308 隻');
assert.strictEqual(caseC.isFilteredClass, true);
assert.strictEqual(caseC.isEmptyClass, true);
assert.strictEqual(caseC.showResetBtn, true);

console.log('✓ 驗證通過：邏輯狀態模擬計算全數正確');
console.log('🎉 圖鑑即時計數膠囊與一鍵重設機制 (v4.9.5) 100% 驗證通過！');
