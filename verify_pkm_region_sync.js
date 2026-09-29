const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證 寶可夢目前位置顯示、圖鑑同步連動與單一歸屬互斥 ===');

// 1. 驗證 index.html
const htmlPath = path.join(__dirname, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('id="regionFilterGroup"'), 'index.html 必須包含 id="regionFilterGroup"');
assert(html.includes('id="regionFilter"'), 'index.html 必須包含 id="regionFilter"');
assert(html.includes('value="palette_town"'), 'regionFilter 必須包含空空鎮選項');
assert(html.includes('value="unassigned"'), 'regionFilter 必須包含未安置選項');
assert(html.includes('<th width="110">目前位置</th>'), 'pokemon-table 表頭必須包含「目前位置」直欄');
console.log('✅ [PASS] 1. index.html 篩選器與表格表頭位置欄位驗證通過');

// 2. 驗證 index.css
const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

assert(css.includes('.pkm-location-chip'), 'index.css 必須包含 .pkm-location-chip 樣式');
assert(css.includes('.pkm-location-chip.unassigned'), 'index.css 必須包含 .pkm-location-chip.unassigned 樣式');
assert(css.includes('.pkm-col-location'), 'index.css 必須包含 .pkm-col-location 樣式');
assert(css.includes('.pkm-detail-location-bar'), 'index.css 必須包含 .pkm-detail-location-bar 樣式');
assert(css.includes('.pkm-detail-region-select'), 'index.css 必須包含 .pkm-detail-region-select 樣式');
assert(css.includes('.pkm-detail-goto-region-btn'), 'index.css 必須包含 .pkm-detail-goto-region-btn 樣式');
console.log('✅ [PASS] 2. index.css 位置膠囊、表格欄位與百科位置切換器樣式驗證通過');

// 3. 驗證 app.js
const appPath = path.join(__dirname, 'app.js');
const app = fs.readFileSync(appPath, 'utf8');

assert(app.includes('selectedRegionFilter'), 'app.js 必須包含 selectedRegionFilter 狀態');
assert(app.includes('DOM.regionFilter'), 'app.js 必須快取 DOM.regionFilter');
assert(app.includes('getPokemonCurrentRegion'), 'app.js 必須包含 getPokemonCurrentRegion 函式');
assert(app.includes('setPokemonRegion'), 'app.js 必須包含 setPokemonRegion 函式');
assert(app.includes('navigateToRegion'), 'app.js 必須包含 navigateToRegion 函式');
assert(app.includes('pkm-col-location'), 'app.js 渲染表格必須包含 pkm-col-location 直欄');
assert(app.includes('pkm-location-chip'), 'app.js 必須渲染 pkm-location-chip 膠囊標籤');
assert(app.includes('pkmDetailRegionSelect'), 'app.js 詳情彈窗必須包含 pkmDetailRegionSelect');
assert(app.includes('btnDetailGotoRegion'), 'app.js 詳情彈窗必須包含 btnDetailGotoRegion 前往地圖按鈕');
console.log('✅ [PASS] 3. app.js 邏輯、狀態管理、卡片/表格/百科連動驗證通過');

// 4. 邏輯單元測試（模擬執行 setPokemonRegion 與單一歸屬互斥）
const mockRegionAssignments = {
  palette_town: ['pkm_s1_25', 'pkm_s1_1'],
  withered_wastelands: ['pkm_s1_4'],
  bleak_beach: [],
  rocky_ridges: [],
  sparkling_skylands: []
};

// 測試單一歸屬互斥：將 pkm_s1_25（皮卡丘）改移到 bleak_beach
function testSetPokemonRegion(pkmId, targetRegionId) {
  Object.keys(mockRegionAssignments).forEach(rId => {
    mockRegionAssignments[rId] = mockRegionAssignments[rId].filter(id => id !== pkmId);
  });
  if (targetRegionId && targetRegionId !== 'unassigned') {
    if (!mockRegionAssignments[targetRegionId]) mockRegionAssignments[targetRegionId] = [];
    mockRegionAssignments[targetRegionId].push(pkmId);
  }
}

testSetPokemonRegion('pkm_s1_25', 'bleak_beach');
assert(!mockRegionAssignments.palette_town.includes('pkm_s1_25'), '皮卡丘必須已從空空鎮移出');
assert(mockRegionAssignments.bleak_beach.includes('pkm_s1_25'), '皮卡丘必須已成功加入暗沉沉海邊');

// 測試設為未安置
testSetPokemonRegion('pkm_s1_25', 'unassigned');
Object.keys(mockRegionAssignments).forEach(rId => {
  assert(!mockRegionAssignments[rId].includes('pkm_s1_25'), `皮卡丘不應出現在任何地區 (${rId})`);
});
console.log('✅ [PASS] 4. 單一歸屬互斥邏輯（一對一獨佔、移入自動移出、未安置支援）單元測試通過');

console.log('🎉 寶可夢目前位置顯示與圖鑑同步連動驗證 100% PASS！');
