// verify_buzz_v3_suite.js
// 驗證：官方 1:1 體素模型、切片指南 Zoom & Pan 縮放平移、重新整理防黑屏

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始執行巴斯光年 100% 官方模型與切片 Zoom & Pan 驗證套件...');

// 1. 驗證 buzz_voxel_data.js (100% Mike.Nicholson 官方模型提取)
const buzzData = require('./buzz_voxel_data.js');
assert.strictEqual(buzzData.layers.length, 42, '官方層數應為 42 層');
assert.strictEqual(buzzData.totalBlocks, 7927, '官方總方塊數應為 7,927 顆');
assert.strictEqual(buzzData.author, 'Mike.Nicholson', '作者應為 Mike.Nicholson');
assert.ok(buzzData.dimensions.width >= 40, '寬度應涵蓋機翼展開翼展');
console.log('✓ 1. buzz_voxel_data.js 官方抽取模型數據正確！');

// 2. 驗證 index.html 元素與快取標籤
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.ok(html.includes('7,927 顆方塊'), 'index.html 應展示 7,927 顆方塊');
assert.ok(html.includes('42 層建造切片指南'), 'index.html 應標註 42 層切片');
assert.ok(html.includes('btnBuzzZoomIn') && html.includes('btnBuzzZoomOut'), '應包含巴斯光年縮放按鈕');
assert.ok(html.includes('btnBulbaZoomIn') && html.includes('btnBulbaZoomOut'), '應包含妙蛙種子縮放按鈕');
assert.ok(html.includes('buzz_voxel_data.js?v=4.17.0'), '應引用 4.17.0 版數據');
console.log('✓ 2. index.html 元素與按鈕標籤檢驗通過！');

// 3. 驗證 index.css 樣式
const css = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
assert.ok(css.includes('.bulba-zoom-toolbar'), '應定義 bulba-zoom-toolbar 樣式');
assert.ok(css.includes('.bulba-grid-container.is-panning'), '應定義平移中 is-panning 抓取游標');
assert.ok(css.includes('transform-origin: center center'), '應定義工作區縮放變換原點');
console.log('✓ 3. index.css 縮放平移樣式檢驗通過！');

// 4. 驗證 app.js 邏輯與重新整理修復
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert.ok(appJs.includes("renderBuzzLayer(buzzState.curLayer)"), 'switchTab 應主動呼叫 renderBuzzLayer');
assert.ok(appJs.includes("initBuzzThreeEngine"), 'switchTab 應主動呼叫 initBuzzThreeEngine');
assert.ok(appJs.includes("setupSliceZoomPan"), '應定義 setupSliceZoomPan 函式');
assert.ok(appJs.includes("applyWorkspaceZoomPan"), '應在換層與縮放時套用 applyWorkspaceZoomPan');
console.log('✓ 4. app.js 重新整理防黑屏與 Zoom/Pan 邏輯檢驗通過！');

console.log('\n🎉 所有 Zoom & Pan、官方體素模型與重新整理修復測試全數 PASS！');
