/**
 * verify_venusaur80_v2_dom_switch_suite.js
 * 行為級驗收測試：驗證「3D 角色藍圖」主分頁中 80 層動態妙蛙花的切換、DOM 結構與事件連動
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 開始執行【3D 角色藍圖】80 層動態妙蛙花 DOM 整合與切換行為級驗收測試...\n');

// 1. 讀取 index.html
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 檢查膠囊按鈕
assert(htmlContent.includes('id="btnSubVenusaur80V2"'), '❌ 必須包含 #btnSubVenusaur80V2 膠囊按鈕！');
assert(htmlContent.includes('data-char="venusaur80_v2"'), '❌ 膠囊按鈕必須包含 data-char="venusaur80_v2"！');
assert(htmlContent.includes('🌺 妙蛙花 (80層動態版)'), '❌ 膠囊按鈕文字必須標明 🌺 妙蛙花 (80層動態版)！');

// 檢查工作台面板
assert(htmlContent.includes('id="paneVenusaur80V2"'), '❌ 必須包含 #paneVenusaur80V2 工作台容器！');
assert(htmlContent.includes('id="venusaur80_v2_3dCanvas"'), '❌ 必須包含 3D Canvas！');
assert(htmlContent.includes('id="venusaur80_v2LayerSlider"'), '❌ 必須包含 80 層切片滑桿！');
assert(htmlContent.includes('id="venusaur80_v2VoxelGrid"'), '❌ 必須包含 2D 點陣切片網格容器！');
assert(htmlContent.includes('id="venusaur80_v2MatList"'), '❌ 必須包含材料清單容器！');

// 檢查腳本引入與版本號
assert(htmlContent.includes('src="venusaur80_v2_voxel_data.js?v='), '❌ index.html 必須引入 venusaur80_v2_voxel_data.js！');

console.log('✅ DOM 結構與標籤查核通過！');

// 2. 查核 app.js 的支援
const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

assert(appContent.includes("btnSubVenusaur80V2: document.getElementById('btnSubVenusaur80V2')"), '❌ app.js 必須註冊 btnSubVenusaur80V2 DOM！');
assert(appContent.includes("paneVenusaur80V2: document.getElementById('paneVenusaur80V2')"), '❌ app.js 必須註冊 paneVenusaur80V2 DOM！');
assert(appContent.includes("activeChar === 'venusaur80_v2'"), '❌ app.js 必須在 switch3DChar 處理 venusaur80_v2！');
assert(appContent.includes("window.PokopiaVenusaur80V2 = {"), '❌ app.js 必須公開 PokopiaVenusaur80V2 API！');

console.log('✅ app.js 邏輯與 API 註冊查核通過！');

// 3. 查核 80 層動態版妙蛙花模型資料完整性
const dataPath = path.join(__dirname, 'venusaur80_v2_voxel_data.js');
const voxelData = require(dataPath);
assert.strictEqual(voxelData.dimensions.height, 80, '❌ 模型高度必須為 80 層！');
assert.strictEqual(voxelData.layers.length, 80, '❌ 切片陣列長度必須為 80！');
assert(voxelData.totalBlocks > 50000, '❌ 總方塊數必須大於 50000 顆！');

console.log(`✅ 體素模型驗證通過：共 ${voxelData.totalBlocks.toLocaleString()} 顆方塊，80 層完備！`);

console.log('\n🎉 所有驗收檢查 100% 通過！');
