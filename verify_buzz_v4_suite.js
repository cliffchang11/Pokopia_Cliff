const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- 正在執行巴斯光年 3D 展台與切片容器防溢出檢驗套件 ---');

const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');

// 1. 檢驗 index.css 切片容器固定視窗與溢出隱藏
assert.ok(cssContent.includes('.bulba-grid-container'), '需包含 .bulba-grid-container 樣式定義');
assert.ok(cssContent.includes('overflow: hidden !important;'), '需包含 overflow: hidden !important 防溢出裁切');
assert.ok(cssContent.includes('height: 400px;'), '桌面端切片容器需為固定高度 400px');
assert.ok(cssContent.includes('height: 320px !important;'), '手機端切片容器需為固定高度 320px');
assert.ok(cssContent.includes('.buzz-iframe-wrap'), '需包含 .buzz-iframe-wrap 樣式定義');
console.log('✅ 任務 1 通過：切片容器固定視野高度與強制裁切 overflow: hidden 規則無誤。');

// 2. 檢驗 3D 展台材質無金屬感 (粗糙度 0.88, 金屬度 0.0)
const roughnessMatches = jsContent.match(/roughness:\s*0\.88/g);
const metalnessMatches = jsContent.match(/metalness:\s*0\.0/g);
assert.ok(roughnessMatches && roughnessMatches.length >= 2, '巴斯光年與妙蛙種子皆需設置 roughness: 0.88');
assert.ok(metalnessMatches && metalnessMatches.length >= 2, '巴斯光年與妙蛙種子皆需設置 metalness: 0.0');
console.log('✅ 任務 2 通過：3D 展台方塊材質全面改為啞光無金屬光澤 (roughness: 0.88, metalness: 0.0)。');

// 3. 檢驗 HTML 3 態模式按鈕與 iframe 結構
assert.ok(htmlContent.includes('id="btnBuzzModeSketchfab"'), '需包含 btnBuzzModeSketchfab 按鈕');
assert.ok(htmlContent.includes('id="buzz3dCanvasWrap"'), '需包含 buzz3dCanvasWrap 畫布外層');
assert.ok(htmlContent.includes('id="buzz3dIframeWrap"'), '需包含 buzz3dIframeWrap 原作嵌入外層');
assert.ok(htmlContent.includes('id="buzzSliceCard"'), '需包含 buzzSliceCard 切片卡片標記');
console.log('✅ 任務 3 HTML 結構通過：3 態切換按鈕、iframe 視窗與切片聯動 ID 齊備。');

// 4. 檢驗 JavaScript 3 態切換邏輯與切片指南聯動收合
assert.ok(jsContent.includes('switchBuzz3DMode'), '需實作 switchBuzz3DMode 函式');
assert.ok(jsContent.includes("DOM.buzzSliceCard.style.display = 'none'"), '切換至 Sketchfab 原作時需自動收合切片卡片');
assert.ok(jsContent.includes("DOM.buzzSliceCard.style.display = 'block'"), '切回原生 3D 時需自動恢復顯現切片卡片');
console.log('✅ 任務 3 JS 邏輯通過：Sketchfab 模式與切片指南自動收展聯動無誤。');

console.log('🎉 所有驗收項目 100% 通過！');
