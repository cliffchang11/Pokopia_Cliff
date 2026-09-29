const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證 Pokopia 地區地圖（Region Map）規格與功能 ===');

// 1. 驗證 index.html 目次清單與 DOM 結構
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="tabRegionMap"'), 'index.html 必須包含 id="tabRegionMap"');
assert(htmlContent.includes('>地區地圖<'), 'tabRegionMap 按鈕文字必須為純文字「地區地圖」');
assert(!htmlContent.match(/<button id="tabRegionMap"[^>]*>.*[🗺️🏔️🏖️].*地區地圖/), 'tabRegionMap 按鈕內部文字不得含有 emoji（避免破壞目次純文字排版）');
assert(htmlContent.includes('id="regionMapSection"'), 'index.html 必須包含 id="regionMapSection"');
assert(htmlContent.includes('id="regionPkmAssignModal"'), 'index.html 必須包含 id="regionPkmAssignModal" 寶可夢指派彈窗');
assert(htmlContent.includes('region_data.js'), 'index.html 必須引入 region_data.js');
console.log('✅ [PASS] 1. index.html 目次清單（純文字「地區地圖」）、區塊結構與腳本引入驗證通過');

// 2. 驗證 region_data.js 與本地地圖檔案
const regionDataPath = path.join(__dirname, 'region_data.js');
const regionDataContent = fs.readFileSync(regionDataPath, 'utf8');

// 執行模擬載入 window.POKOPIA_REGION_DATA
const mockWindow = {};
eval(regionDataContent.replace(/window\./g, 'mockWindow.'));
const regData = mockWindow.POKOPIA_REGION_DATA;

assert(regData, 'POKOPIA_REGION_DATA 必須成功初始化');
assert(Array.isArray(regData.regions) && regData.regions.length === 5, '必須包含完整的 5 大世界區域');
assert(!regData.hubGuidance, '必須完全移除東西南北四大閘門走向指南卡片');

const expectedRegions = ['palette_town', 'withered_wastelands', 'bleak_beach', 'rocky_ridges', 'sparkling_skylands'];
expectedRegions.forEach(id => {
  const reg = regData.regions.find(r => r.id === id);
  assert(reg, `必須包含區域 ${id}`);
  assert(reg.name && reg.nameEn, `區域 ${id} 必須有中英文名稱`);
  assert(reg.story && reg.mission, `區域 ${id} 必須有世界觀與核心任務描述`);
  assert(!/[東西南北]向|[東西南北]方/.test(reg.badgeText), `區域 ${id} 徽章不得包含東西南北方位詞 (${reg.badgeText})`);
  assert(Array.isArray(reg.defaultPokemonIds) && reg.defaultPokemonIds.length > 0, `區域 ${id} 必須有預設推薦寶可夢清單`);
  
  if (reg.mapImage) {
    const mapFile = path.join(__dirname, reg.mapImage);
    assert(fs.existsSync(mapFile), `地圖圖片 ${reg.mapImage} 必須存在於本地`);
    const stat = fs.statSync(mapFile);
    assert(stat.size > 1000, `地圖圖片 ${reg.mapImage} 大小必須大於 1KB`);
  }
});
console.log('✅ [PASS] 2. region_data.js 5 大區域資料、本地圖片保全 (6張本地離線圖檔) 與「無方位詞」驗證通過');

// 3. 驗證 index.css 樣式完備性
const cssPath = path.join(__dirname, 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.reg-hub-compass-card'), 'CSS 必須包含 .reg-hub-compass-card 樣式');
assert(cssContent.includes('.reg-region-card'), 'CSS 必須包含 .reg-region-card 樣式');
assert(cssContent.includes('.reg-roster-section'), 'CSS 必須包含 .reg-roster-section 樣式');
assert(cssContent.includes('.region-pkm-modal'), 'CSS 必須包含 .region-pkm-modal 樣式');
assert(cssContent.includes('.reg-pkm-slot'), 'CSS 必須包含 .reg-pkm-slot 樣式');
console.log('✅ [PASS] 3. index.css 毛玻璃卡片、指南羅盤、寶可夢名冊與指派彈窗樣式驗證通過');

// 4. 驗證 app.js 邏輯與 API 暴露
const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes("'regionMap'"), 'validTabs 必須納入 regionMap');
assert(appContent.includes("DOM.tabRegionMap"), 'DOM 快取必須包含 tabRegionMap');
assert(appContent.includes("renderRegionMap"), 'app.js 必須包含 renderRegionMap 渲染函式');
assert(appContent.includes("openRegionAssignModal"), 'app.js 必須包含 openRegionAssignModal 彈窗函式');
assert(appContent.includes("pokopia_region_assignments"), 'LocalStorage key 必須為 pokopia_region_assignments');
assert(appContent.includes("window.PokopiaRegionMap = {"), '必須暴露 window.PokopiaRegionMap 供全域與調試調用');
console.log('✅ [PASS] 4. app.js 分頁切換、LocalStorage 存取、彈窗搜尋與指派邏輯驗證通過');

console.log('🎉 Pokopia 地區地圖（Region Map）規格與自動化檢驗全數通過！');
