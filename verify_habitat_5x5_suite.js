const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== 開始執行 FancyCharmander 專屬 5x5 Shorts 圖鑑整合 (v4.99.0) 驗收測試 ===');

// 1. 驗證 habitat_5x5_data.js 資料模組與家族繼承覆蓋率
const h5 = require(path.join(__dirname, 'habitat_5x5_data.js'));
assert(Array.isArray(h5.catalog), '必須匯出 catalog 陣列');
assert(h5.catalog.length >= 45, `catalog 數量需涵蓋至少 45 組 (當前 ${h5.catalog.length})`);
assert(typeof h5.getHabitat5x5 === 'function', '必須匯出 getHabitat5x5 查詢函式');

global.window = {};
require(path.join(__dirname, 'data.js'));
const pokemons = window.POKOPIA_DATA.pokemons;

let hitCount = 0;
pokemons.forEach(p => {
  const shortInfo = h5.getHabitat5x5(p);
  if (shortInfo && shortInfo.url && shortInfo.url.startsWith('https://www.youtube.com/shorts/')) {
    hitCount++;
  }
});

console.log(`- 檢測寶可夢總數: ${pokemons.length} 隻，成功命中 5x5 造景 Shorts 數: ${hitCount} 隻`);
assert(hitCount >= 100, `進化家族繼承命中數應 >= 100 隻 (當前 ${hitCount} 隻)`);

// 抽查核心家族
const mudkipInfo = h5.getHabitat5x5(pokemons.find(p => p.name === '水躍魚'));
const swampertInfo = h5.getHabitat5x5(pokemons.find(p => p.name === '巨沼怪'));
assert(mudkipInfo && swampertInfo && mudkipInfo.vid === swampertInfo.vid, '水躍魚與巨沼怪必須共享繼承同一部 5x5 Short');

const gastlyInfo = h5.getHabitat5x5(pokemons.find(p => p.name === '鬼斯'));
const gengarInfo = h5.getHabitat5x5(pokemons.find(p => p.name === '耿鬼'));
assert(gastlyInfo && gengarInfo && gastlyInfo.vid === gengarInfo.vid, '鬼斯與耿鬼必須共享繼承同一部 5x5 Short');

console.log('✅ [1/5] habitat_5x5_data.js 資料模組與進化家族繼承覆蓋率驗證通過');

// 2. 驗證 index.html 表頭結構
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(indexHtml.includes('<th width="75" class="col-th-habitat-5x5" title="FancyCharmander 專屬 5x5 棲息地造景教學 Shorts">專屬5x5</th>'), 'index.html 表頭必須包含「專屬5x5」');
assert(indexHtml.includes('habitat_5x5_data.js?v=4.99.0'), 'index.html 必須載入 habitat_5x5_data.js?v=4.99.0');
console.log('✅ [2/5] index.html 表頭欄位與腳本載入驗證通過');

// 3. 驗證 index.css 按鈕樣式 (小巧紅色膠囊、無文字干擾)
const indexCss = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
assert(indexCss.includes('.pkm-btn-habitat-5x5'), 'index.css 必須定義 .pkm-btn-habitat-5x5 樣式');
assert(indexCss.includes('border-radius: 9999px'), '按鈕必須為膠囊圓角 (border-radius: 9999px)');
assert(indexCss.includes('#ef4444') || indexCss.includes('#dc2626'), '按鈕必須具備 YouTube 紅色漸層');
assert(indexCss.includes('.pkm-habitat-5x5-empty'), '必須定義無影片時的淡灰橫線樣式');
console.log('✅ [3/5] index.css 紅色播放膠囊與空值橫線樣式驗證通過');

// 4. 驗證 app.js 表格單元格渲染與防冒泡機制
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(appJs.includes('col-td-habitat-5x5'), 'app.js 表格渲染必須注入 col-td-habitat-5x5 單元格');
assert(appJs.includes('pkm-btn-habitat-5x5'), 'app.js 必須渲染 pkm-btn-habitat-5x5 標籤');
assert(appJs.includes('event.stopPropagation()'), '點擊按鈕必須具備 event.stopPropagation() 防止冒泡彈出百科卡片');
assert(appJs.includes('target="_blank"'), '按鈕必須以新分頁開啟 (target="_blank")');
console.log('✅ [4/5] app.js 表格渲染、單元格注入與防冒泡機制驗證通過');

// 5. 驗證 sw.js 快取版本推進 (v4.99.0)
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
assert(swJs.includes("pokopia-cache-v4.99.0"), 'sw.js 快取名稱必須推進為 pokopia-cache-v4.99.0');
assert(swJs.includes("./habitat_5x5_data.js?v=4.99.0"), 'sw.js 必須快取 habitat_5x5_data.js?v=4.99.0');
console.log('✅ [5/5] sw.js 快取推進 (v4.99.0) 與靜態資產驗證通過');

console.log('🎉 FancyCharmander 專屬 5x5 Shorts 圖鑑整合功能全數驗收 100% 通過！');
process.exit(0);

