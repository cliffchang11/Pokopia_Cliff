const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== 開始執行雙模型比對頁面離線自動化驗證 ===\n');

// 1. 檢驗 compare_data.js
console.log('1. 檢驗 compare_data.js 資料完整性...');
const compareDataPath = path.join(__dirname, 'compare_data.js');
assert.ok(fs.existsSync(compareDataPath), 'compare_data.js 檔案必須存在');
const { IVYSAUR_OVERRIDES_1800, IVYSAUR_OVERRIDES_LATEST } = require(compareDataPath);

const count1800 = Object.keys(IVYSAUR_OVERRIDES_1800).length;
const countLatest = Object.keys(IVYSAUR_OVERRIDES_LATEST).length;

console.log(`   - 18:00 版本方塊數: ${count1800}`);
console.log(`   - 最新版本方塊數: ${countLatest}`);
assert.strictEqual(count1800, 1321, '18:00 版本必須精確包含 1,321 顆方塊');
assert.strictEqual(countLatest, 1384, '最新版本必須精確包含 1,384 顆方塊');
console.log('   ✓ 資料完整性檢驗通過！\n');

// 2. 檢驗 compare.html
console.log('2. 檢驗 compare.html 頁面結構與資源引入...');
const compareHtmlPath = path.join(__dirname, 'compare.html');
assert.ok(fs.existsSync(compareHtmlPath), 'compare.html 必須存在');
const htmlContent = fs.readFileSync(compareHtmlPath, 'utf8');

assert.ok(htmlContent.includes('id="canvas1800"'), '必須包含左側 18:00 專用畫布 canvas1800');
assert.ok(htmlContent.includes('id="canvasLatest"'), '必須包含右側最新版專用畫布 canvasLatest');
assert.ok(htmlContent.includes('id="btnReset1800"'), '必須包含左側重設視角按鈕 btnReset1800');
assert.ok(htmlContent.includes('id="btnResetLatest"'), '必須包含右側重設視角按鈕 btnResetLatest');

assert.ok(htmlContent.includes('three.min.js'), '必須正確引入 Three.js 核心庫');
assert.ok(htmlContent.includes('OrbitControls.js'), '必須正確引入 OrbitControls 控制器');
assert.ok(htmlContent.includes('ivysaur_voxel_data.js'), '必須引入官方妙蛙草體素資料庫');
assert.ok(htmlContent.includes('compare_data.js'), '必須引入雙模型比對資料檔');

assert.ok(htmlContent.includes('1,321 顆自訂方塊'), 'UI 需清楚標記 1,321 顆');
assert.ok(htmlContent.includes('1,384 顆自訂方塊'), 'UI 需清楚標記 1,384 顆');
console.log('   ✓ 頁面結構與資源引入檢驗通過！\n');

// 3. 檢驗現有專案核心檔案未受污染
console.log('3. 檢驗主專案核心檔案未受破壞...');
const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert.ok(indexContent.includes('Pokopia'), '主頁面 index.html 完好無損');
console.log('   ✓ 主專案檔案檢驗通過！\n');

console.log('🎉 全部雙模型比對頁面離線測試 100% 通過！');
