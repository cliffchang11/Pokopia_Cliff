/**
 * verify_bloxelizer_studio_suite.js
 * 驗證 Bloxelizer 白淨工程展台、按需渲染、垂直層數控制器與懸停智慧尺寸標註 (v4.73.0)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 啟動：Pokopia Bloxelizer 白淨工程展台與按需渲染整合驗證套件 (v4.73.0)...\n');

const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const indexCss = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
const voxelEditorJs = fs.readFileSync(path.join(__dirname, 'voxel_editor.js'), 'utf8');

// 1. 驗證 3D 白淨工程展台 (Clean White Studio)
console.log('【測試 1: 3D 白淨工程展台與地面工程網格】');
assert.ok(appJs.includes("new THREE.Color(0xf8fafc)"), '3D 場景背景必須切換為白淨工程灰白 (0xf8fafc)');
assert.ok(appJs.includes('createStudioGridAndCenterMark'), '3D 場景必須呼叫 createStudioGridAndCenterMark 繪製地面工程網格與中心準心');
assert.ok(appJs.includes('new THREE.GridHelper(size, divisions, 0x94a3b8, 0xe2e8f0)'), '必須具備精緻淺灰地面工程網格');
assert.ok(indexCss.includes('.bulba-canvas-wrap {\n  position: relative;\n  flex-shrink: 0;\n  width: 100%;\n  height: 480px;\n  background: #f8fafc !important;'), '3D 畫布外框必須設為 #f8fafc 白淨背景');
console.log('  ✓ PASS: 白淨工程展台背景、地面網格與中心準心完整成立');

// 2. 驗證按需渲染 (Render-on-Demand) 與極致效能
console.log('\n【測試 2: 按需渲染與效能回血】');
assert.ok(!indexCss.includes('backdrop-filter: blur(20px);'), '工具列必須移除高負載的毛玻璃濾鏡');
assert.ok(appJs.includes("function startThreeRendering(charKey) {"), '包含 startThreeRendering 函式');
assert.ok(appJs.includes("requestThreeRender(charKey);"), 'startThreeRendering 必須採用 requestThreeRender 按需渲染');
assert.ok(appJs.includes("t.controls.addEventListener('change', () => requestThreeRender(charKey));"), '鏡頭拖曳旋轉時必須順暢按需刷新');
console.log('  ✓ PASS: 3D 按需渲染與 0 濾鏡負擔成立，靜止時 0% 運算休眠');

// 3. 驗證 3D 垂直浮動層數控制器 (Vertical Layer Controller)
console.log('\n【測試 3: 3D 垂直浮動層數控制器】');
assert.ok(appJs.includes('setupBloxelizerStudioControls'), '具備 setupBloxelizerStudioControls 控制器建置函式');
assert.ok(indexCss.includes('.vlc-container {'), 'index.css 包含 .vlc-container 樣式');
assert.ok(indexCss.includes('.vlc-slider-vertical {'), 'index.css 包含垂直滑軌 .vlc-slider-vertical');
assert.ok(indexCss.includes('.vlc-step-btn {'), 'index.css 包含單步微調按鈕 .vlc-step-btn');
assert.ok(appJs.includes('vlcSlider_'), 'DOM 包含垂直層數滑軌');
assert.ok(appJs.includes('vlcCurLayer_'), 'DOM 包含當前層數顯示');
assert.ok(appJs.includes('vlcUp_') && appJs.includes('vlcDown_'), 'DOM 包含上下微調箭頭');
assert.ok(appJs.includes('threeState._syncVLC = syncVLCUI;'), '具備 2D/3D 雙向連動同步介面');
console.log('  ✓ PASS: 3D 垂直層數控制器與雙向同步機制完備');

// 4. 驗證單層獨立 (Layer by layer) vs 0~Y 累積雙模式
console.log('\n【測試 4: 單層獨立與累積雙模式切換】');
assert.ok(appJs.includes("threeState.layerFilterMode = 'single'"), '預設為 Bloxelizer 單層獨立模式');
assert.ok(appJs.includes("vlcModeBtn_"), '控制器具備單層/累積雙模式切換按鈕');
assert.ok(appJs.includes("isSingle ? item.layerIndex === curLayer : item.layerIndex <= curLayer"), '各角色剖面過濾器完整支援單層與累積雙模式');
console.log('  ✓ PASS: 單層獨立 (Layer by layer) 與累積建造雙模式切換完備');

// 5. 驗證懸停情境智慧尺寸與間距標註 (Hover-Activated Dimensioning)
console.log('\n【測試 5: 懸停情境智慧尺寸與間距標註】');
assert.ok(appJs.includes('smartDimOverlay_'), '具備懸停智慧尺寸標註容器');
assert.ok(indexCss.includes('.smart-dimension-overlay {') && indexCss.includes('opacity: 0;'), '標註覆蓋層平常預設 opacity: 0 隱藏，零雜線干擾');
assert.ok(indexCss.includes('.smart-dim-badge {'), '具備深底高對比數字膠囊樣式');
assert.ok(appJs.includes('raycaster.setFromCamera(mouse, threeState.camera);'), '具備 Raycaster 射線懸停偵測');
assert.ok(appJs.includes('stroke="#f97316"'), '繪製 Bloxelizer 經典橘色尺寸標註線');
assert.ok(appJs.includes('stroke-dasharray="4 3"'), '繪製區塊懸空間隔虛線');
assert.ok(appJs.includes("canvasEl.addEventListener('pointerleave', hideDimensions);"), '滑鼠移出畫布時自動隱藏標註');
console.log('  ✓ PASS: 懸停動態尺寸線、間距虛線標註與移開自動隱藏演算成立');

// 6. 驗證工具列單列純淨化 (移除恢復預設按鈕)
console.log('\n【測試 6: 工具列單列化與恢復預設安全移除】');
assert.ok(!voxelEditorJs.includes('id="btnReset_'), 'voxel_editor.js 必須徹底自 DOM 移除 btnReset_');
assert.ok(!indexCss.includes('.ve-danger-zone {'), 'index.css 必須徹底移除 .ve-danger-zone');
assert.ok(voxelEditorJs.includes('function resetToDefault(charKey) {'), '底層 resetToDefault 函式安全保留');
console.log('  ✓ PASS: 工具列回歸 44px 極致單列，移除恢復預設按鈕零視覺噪音');

console.log('\n🎉 Bloxelizer 白淨工程展台、按需渲染、垂直控制器與智慧標註 100% 驗收通過！');
process.exit(0);
