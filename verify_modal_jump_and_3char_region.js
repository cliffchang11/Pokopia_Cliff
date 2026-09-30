const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始驗證 百科彈窗頭像點擊跳轉圖鑑 與 全站地區 3 字標準化');
console.log('================================================================\n');

// 1. 驗證 region_data.js
const regPath = path.join(__dirname, 'region_data.js');
const regContent = fs.readFileSync(regPath, 'utf8');
const mockWindow = {};
eval(regContent.replace(/window\./g, 'mockWindow.'));
const regions = mockWindow.POKOPIA_REGION_DATA.regions;

assert(regions && regions.length === 5, '必須包含 5 大地區');
const expectedNames = ['空空鎮', '乾巴巴', '暗沉沉', '凸隆隆', '亮晶晶'];
regions.forEach((r, idx) => {
  assert.strictEqual(r.name, expectedNames[idx], `地區 ${r.id} 名稱必須為「${expectedNames[idx]}」`);
  assert.strictEqual(r.name.length, 3, `地區 ${r.name} 必須嚴格為 3 個字`);
});
console.log('✅ [Check 1] PASS: region_data.js 5 大地區名稱全部嚴格為 3 個字（空空鎮、乾巴巴、暗沉沉、凸隆隆、亮晶晶）');

// 2. 驗證 index.html
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('<option value="palette_town">空空鎮</option>'), '篩選器必須包含「空空鎮」');
assert(htmlContent.includes('<option value="withered_wastelands">乾巴巴</option>'), '篩選器必須包含「乾巴巴」');
assert(htmlContent.includes('<option value="bleak_beach">暗沉沉</option>'), '篩選器必須包含「暗沉沉」');
assert(htmlContent.includes('<option value="rocky_ridges">凸隆隆</option>'), '篩選器必須包含「凸隆隆」');
assert(htmlContent.includes('<option value="sparkling_skylands">亮晶晶</option>'), '篩選器必須包含「亮晶晶」');
console.log('✅ [Check 2] PASS: index.html 頂部篩選下拉選單全面更新為 3 字選項');

// 3. 驗證 index.css
const cssPath = path.join(__dirname, 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.pkm-detail-avatar-wrap {') && cssContent.includes('cursor: pointer;'), 'index.css 必須包含 .pkm-detail-avatar-wrap 的 cursor: pointer');
assert(cssContent.includes('.pkm-detail-avatar-wrap:hover {') && cssContent.includes('transform: scale('), 'index.css 必須包含 .pkm-detail-avatar-wrap:hover 動態效果');
console.log('✅ [Check 3] PASS: index.css 彈窗頭像具備手型游標與 hover 微動效');

// 4. 驗證 app.js
const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes('detailAvatarWrap.addEventListener(\'click\''), 'app.js 必須綁定 detailAvatarWrap 點擊事件');
assert(appContent.includes('jumpToPokemon(pkmId, true)'), 'app.js 點擊頭像必須調用 jumpToPokemon 跳轉圖鑑');
assert(appContent.includes('closePkmDetailModal()'), 'app.js 跳轉前必須關閉詳情彈窗');
assert(appContent.includes('DOM.pkmDetailAvatar.dataset.pkmId = pkm.id'), 'app.js 打開彈窗時必須設定頭像 dataset.pkmId');
console.log('✅ [Check 4] PASS: app.js 點擊頭像關閉彈窗並無縫跳轉圖鑑邏輯驗證通過');

console.log('\n🎉 百科彈窗頭像點擊跳轉圖鑑 與 全站地區 3 字標準化驗證 100% PASS！');
