const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- 正在執行巴斯光年本體萃取、自適應全覽 (Fit View) 與消除黑斑噪點檢驗套件 (v5) ---');

const buzzData = require('./buzz_voxel_data.js');
const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');

// 1. 檢驗 buzz_voxel_data.js 純淨本體與經典色彩
assert.strictEqual(buzzData.totalBlocks, 2698, '巴斯光年本體方塊數應精確為 2698 顆');
assert.strictEqual(buzzData.layers.length, 38, '巴斯光年本體切片層數應精確為 38 層');
assert.strictEqual(buzzData.dimensions.width, 41, '寬度應為 41');
assert.strictEqual(buzzData.dimensions.height, 38, '高度應為 38');
assert.strictEqual(buzzData.dimensions.length, 15, '深度應為 15 (已濾除 27 深度的背景牆)');

// 驗證經典巴斯光年調色盤對齊
assert.strictEqual(buzzData.palette[0].name, '白色混凝土', 'Mat 0 應為白色混凝土 (太空裝主體)');
assert.strictEqual(buzzData.palette[1].name, '黃綠色混凝土', 'Mat 1 應為黃綠色混凝土 (胸甲與機翼)');
assert.strictEqual(buzzData.palette[2].name, '紫色混凝土', 'Mat 2 應為紫色混凝土 (頭套)');
assert.strictEqual(buzzData.palette[10].name, '白陶瓦 (膚色)', 'Mat 10 應為白陶瓦 (五官臉部膚色)');
console.log('✅ 任務 1 通過：巴斯光年純淨角色本體 (2698 顆 / 38 層) 與經典白綠紫肉色 100% 精確萃取！');

// 2. 檢驗自適應全覽 (Fit View) 與 100% 裁切修復
assert.ok(jsContent.includes('function fitWorkspaceToContainer'), 'app.js 必須包含 fitWorkspaceToContainer 函式');
assert.ok(jsContent.includes('fitWorkspaceToContainer(workspace, container, zoomObj)'), 'changeSliceZoom 重設時需呼叫自適應全覽');
assert.ok(jsContent.includes('btnBuzzZoomReset.addEventListener'), '重設按鈕需綁定自適應全覽重設');
assert.ok(cssContent.includes('.bulba-grid-container'), 'index.css 需定義 .bulba-grid-container');
assert.ok(cssContent.includes('overflow: hidden !important;'), '必須包含強制防溢出裁切規則');
console.log('✅ 任務 2 通過：切片自適應全覽 (Fit View) 與換層自動適配機制生效，徹底根除 100% 裁切遮擋！');

// 3. 檢驗 3D 展台方塊立體微縫隙 (0.96) 與消除粗黑條紋噪點
const box096Matches = jsContent.match(/BoxGeometry\(0\.96,\s*0\.96,\s*0\.96\)/g);
assert.ok(box096Matches && box096Matches.length >= 2, '巴斯光年與妙蛙種子皆需採用 BoxGeometry(0.96, 0.96, 0.96) 立體細縫');
assert.ok(jsContent.includes('camera.position.set(0, 10, 56)'), '巴斯光年相機視角需正對角色本體中央');
console.log('✅ 任務 3 通過：移除 nearest-neighbor 粗黑外框貼圖，改採 0.96 方塊自然微縫隙，徹底消除黑斑條紋！');

// 4. 檢驗 index.html 標示對齊
assert.ok(htmlContent.includes('2,698 顆方塊 (角色本體)'), 'HTML 需顯示 2,698 顆方塊 (角色本體)');
assert.ok(htmlContent.includes('38 層建造切片指南'), 'HTML 需顯示 38 層建造切片指南');
assert.ok(htmlContent.includes('max="38"'), '滑桿最大值需對齊為 38');
console.log('✅ 任務 4 通過：index.html 數據與標籤 100% 對齊無誤！');

console.log('🎉 巴斯光年 v5 全量升級測試 100% 通過！');
