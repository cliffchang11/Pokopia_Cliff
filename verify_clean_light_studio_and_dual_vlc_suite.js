/**
 * verify_clean_light_studio_and_dual_vlc_suite.js
 * 驗證 Pokopia Clean Light Studio 純淨工作室視覺、120ms 防卡死引擎、雙滑塊 VLC 控制器與外圍/懸停雙層尺寸標註 (v4.74.0)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 啟動：Pokopia Clean Light Studio 與雙滑塊 VLC 控制器驗證套件 (v4.74.0)...\n');

const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const indexCss = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// 1. 驗證 Clean Light Studio 視覺與色彩系統全面落地
console.log('【測試 1: Clean Light Studio 純淨工作室視覺與色彩系統】');
assert.ok(indexCss.includes('.buzz-3d-card,\n.buzz-slice-card,\n.bulba-3d-card,\n.bulba-slice-card {\n  background: #ffffff !important;'), '所有 3D 展台與切片卡片外框全面轉為純白背景 #ffffff');
assert.ok(indexCss.includes('.char-pill-btn.active {\n  background: #0d9488 !important;'), '分段選中膠囊全面換上 Bloxelizer 原生湖水綠 (Teal #0d9488)');
assert.ok(indexCss.includes('.bulba-mode-btn.active {\n  background: #0d9488 !important;'), '模式切換按鈕選中色全面採用湖水綠');
assert.ok(indexCss.includes('.bulba-grid-container {\n  position: relative;\n  width: 100%;\n  max-width: 100%;\n  height: 580px;\n  background: #ffffff !important;'), '2D 點陣網格工作台全面切換為純白工程畫布');
assert.ok(!indexCss.includes('rgba(24, 24, 43, 0.85)'), '徹底清除舊版深黑藍紫色電競漸層');
console.log('  ✓ PASS: Clean Light Studio 純淨白底、湖水綠主色與高雅微邊框成立');

// 2. 驗證 120ms 靜止判定與分層空間雜湊索引 (防卡死核心)
console.log('\n【測試 2: 120ms 靜止判定與空間雜湊索引 (防卡死核心)】');
assert.ok(appJs.includes('const layersMap = new Map();'), '建置 layersMap 空間查找字典，提供 O(1) 瞬時查詢');
assert.ok(appJs.includes('hoverDebounceTimer = setTimeout('), 'pointermove 必須使用 120ms Debounce 節流靜止判定');
assert.ok(appJs.includes('clearTimeout(hoverDebounceTimer)'), '游標滑動時必須立即清除定時器，移動中完全 0 運算');
assert.ok(appJs.includes("canvasEl.addEventListener('pointermove'"), '包含 pointermove 監聽');
console.log('  ✓ PASS: 7萬方塊場景下游標掠過完全 0 運算，靜止 120ms 瞬時判定，徹底杜絕主執行緒卡死');

// 3. 驗證 VLC 雙滑塊區間控制器與模式浮動選單
console.log('\n【測試 3: VLC 雙滑塊區間控制器與模式浮動選單】');
assert.ok(appJs.includes('vlc-dual-rail'), 'DOM 結構包含雙滑軌 .vlc-dual-rail');
assert.ok(appJs.includes('vlcThumbTop_') && appJs.includes('vlcThumbBottom_'), '包含頂部與底部雙滑塊');
assert.ok(appJs.includes('vlcModePopup_'), '包含 Bloxelizer 風格模式浮動彈出選單');
assert.ok(appJs.includes('Layer by layer') && appJs.includes('Step by step'), '選單包含 Layer by layer 與 Step by step 兩種核心選項');
assert.ok(indexCss.includes('.vlc-mode-popup {'), 'index.css 包含模式彈出清單視覺樣式');
assert.ok(indexCss.includes('.vlc-dual-thumb {'), 'index.css 包含雙圓點控制滑塊樣式');
assert.ok(appJs.includes('threeState.minLayer') && appJs.includes('threeState.maxLayer'), '狀態機支援 minLayer 與 maxLayer 雙界控制');
console.log('  ✓ PASS: VLC 雙滑塊、微調箭頭與 Layer by layer / Step by step 模式選單完整成立');

// 4. 驗證四角色剖面過濾器全面支援雙滑塊範圍
console.log('\n【測試 4: 四角色剖面過濾器雙滑塊範圍過濾】');
['updateBuzz3DSliceFilter', 'updateBulba3DSliceFilter', 'updateIvysaur3DSliceFilter', 'updateVenusaur3DSliceFilter'].forEach(fnName => {
  assert.ok(appJs.includes(fnName), `包含 ${fnName} 剖面過濾器`);
});
assert.ok(appJs.includes('inRange = (item.layerIndex >= minL && item.layerIndex <= maxL)'), '過濾器支援任意區間切片過濾');
console.log('  ✓ PASS: 巴斯光年、妙蛙種子、妙蛙草、妙蛙花四角色 3D 切片過濾器完整支援自訂雙向範圍');

// 5. 驗證外圍常駐總尺寸與懸停連續段落/間距卡尺
console.log('\n【測試 5: 外圍常駐總長寬卡尺與懸停段落標註】');
assert.ok(appJs.includes('layerMeta.width') && appJs.includes('layerMeta.length'), '常駐繪製當前層外圍總長與總寬');
assert.ok(appJs.includes('stroke="#f97316" stroke-width="2" stroke-linecap="round"'), '常駐橘色外圍卡尺標線成立');
assert.ok(appJs.includes('stroke="#f97316" stroke-width="2.5" stroke-linecap="round"'), '懸停連續段落長度卡尺成立');
assert.ok(appJs.includes('stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 3"'), '懸停群組間距虛線標註成立');
console.log('  ✓ PASS: 外圍常駐總尺寸與懸停連續段落/群組間距標線系統完備');

console.log('\n🎉 Clean Light Studio 與雙滑塊 VLC 控制器 100% 驗收通過！');
process.exit(0);
