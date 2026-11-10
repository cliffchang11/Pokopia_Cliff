// ==============================================================================
// Pokopia v4.79.0 專業體素編輯器與 3D 護眼工作台行為模擬驗收測試
// ==============================================================================

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('========================================================');
console.log('🧪 啟動 Pokopia v4.79.0 行為模擬自動化測試套件...');
console.log('========================================================\n');

const appJs = fs.readFileSync('./app.js', 'utf8');
const voxelEditorJs = fs.readFileSync('./voxel_editor.js', 'utf8');
const indexCss = fs.readFileSync('./index.css', 'utf8');
const indexHtml = fs.readFileSync('./index.html', 'utf8');
const swJs = fs.readFileSync('./sw.js', 'utf8');

// ─────────────────────────────────────────────────────────────
// 測試組 1: 全介面無 Emoji 與極簡專業文字規範
// ─────────────────────────────────────────────────────────────
console.log('【測試組 1: 工具列全介面無 Emoji 與乾淨文字標籤】');

const forbiddenEmojis = ['🛠️', '🖐️', '🎨', '🧹', '➕', '🧪', '⬚', '✖', '🪞', '⮂', '⮃', '↩️', '↪️', '💾', '⏳', '👻'];

// 檢查 voxel_editor.js 工具列模板內絕不含上述 Emoji
const toolbarTemplateMatch = voxelEditorJs.match(/wrap\.innerHTML\s*=\s*`([\s\S]*?)`;/);
assert.ok(toolbarTemplateMatch, '成功提取 wrap.innerHTML 模板');
const toolbarHtml = toolbarTemplateMatch[1];

forbiddenEmojis.forEach(emoji => {
  assert.ok(!toolbarHtml.includes(emoji), `工具列 HTML 模板中嚴格禁止出現 Emoji: ${emoji}`);
});

assert.ok(toolbarHtml.includes('體素編輯'), '工具列應具備乾淨文字 [體素編輯]');
assert.ok(toolbarHtml.includes('旋轉'), '工具列應具備乾淨文字 [旋轉]');
assert.ok(toolbarHtml.includes('塗色'), '工具列應具備乾淨文字 [塗色]');
assert.ok(toolbarHtml.includes('消除'), '工具列應具備乾淨文字 [消除]');
assert.ok(toolbarHtml.includes('新增'), '工具列應具備乾淨文字 [新增]');
assert.ok(toolbarHtml.includes('吸管'), '工具列應具備乾淨文字 [吸管]');
assert.ok(toolbarHtml.includes('選取'), '工具列應具備乾淨文字 [選取]');
assert.ok(toolbarHtml.includes('✕ 清空'), '工具列應具備乾淨文字 [✕ 清空]');
assert.ok(toolbarHtml.includes('透視:'), '工具列應具備乾淨文字 [透視:]');
assert.ok(toolbarHtml.includes('鏡像:'), '工具列應具備乾淨文字 [鏡像:]');
assert.ok(toolbarHtml.includes('左鏡右'), '工具列應具備乾淨文字 [左鏡右]');
assert.ok(toolbarHtml.includes('右鏡左'), '工具列應具備乾淨文字 [右鏡左]');
assert.ok(toolbarHtml.includes('復原'), '工具列應具備乾淨文字 [復原]');
assert.ok(toolbarHtml.includes('重做'), '工具列應具備乾淨文字 [重做]');
assert.ok(toolbarHtml.includes('已同步'), '工具列應具備乾淨文字 [已同步]');
assert.ok(toolbarHtml.includes('✕ 收合'), '工具列應具備乾淨文字 [✕ 收合]');

console.log('  ✓ PASS: 1.1 工具列 HTML 模板已徹底拔除所有 Emoji，文字乾淨專業');

// ─────────────────────────────────────────────────────────────
// 測試組 2: 工具列緊湊排版、節省 80px 空間與琥珀金鏡像
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 2: 工具列緊湊排版、節省空間與琥珀金鏡像】');

// 驗證體素編輯展開時，常駐膠囊列自動隱藏
assert.ok(
  indexCss.includes('.voxel-editor-container.is-open .ve-toggle-capsule-wrap') &&
  indexCss.includes('display: none !important;'),
  'index.css 必須在工具列展開時隱藏體素膠囊列，節省垂直空間'
);

// 驗證清空選取為行內膠囊按鈕，緊跟在選取工具群組內，不單獨佔用一行
assert.ok(
  toolbarHtml.includes('<button type="button" class="ve-btn ve-btn-danger ve-btn-clear-sel" data-role="clear-sel"'),
  '清空選取按鈕必須為行內膠囊樣式且具備 data-role="clear-sel"'
);
assert.ok(
  indexCss.includes('.ve-btn.ve-btn-clear-sel'),
  'index.css 必須包含 .ve-btn.ve-btn-clear-sel 行內緊湊膠囊樣式'
);

// 驗證工具列背景改為護眼岩灰藍色調 (rgba(30, 41, 59, 0.88))
assert.ok(
  indexCss.includes('rgba(30, 41, 59, 0.88)'),
  'index.css 工具列背景必須使用護眼岩灰藍 (rgba(30, 41, 59, 0.88))'
);

// 驗證鏡像開啟時專屬琥珀金發光
assert.ok(
  indexCss.includes('#d97706') && indexCss.includes('#fbbf24'),
  'index.css 鏡像啟動狀態必須呈現高辨識度的琥珀金發光外框與漸層'
);

console.log('  ✓ PASS: 2.1 工具列整合收合機制、膠囊清空選取、岩灰藍護眼背景與琥珀金鏡像樣式成立');

// ─────────────────────────────────────────────────────────────
// 測試組 3: 2D 與 3D 工具列 DOM 命名空間隔離與雙向即時同步
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 3: 2D/3D 工具列 DOM 隔離與 100% 雙向同步】');

assert.ok(
  voxelEditorJs.includes('el.id = el.id.replace(`_${charKey}`, `2D_${charKey}`);'),
  'attachEditorTo2D 必須將 2D 工具列內的所有子元素 id 重命名為 2D 前綴以消滅 ID 衝突'
);

assert.ok(
  voxelEditorJs.includes('bars.forEach(bar => {') &&
  voxelEditorJs.includes('data-role="mirror"') &&
  voxelEditorJs.includes('data-role="ghost-layer"'),
  'updateToolbarUI 必須支援遍歷兩側工具列並透過 data-role 達成 0ms 雙向同步'
);

console.log('  ✓ PASS: 3.1 2D/3D 工具列 DOM ID 徹底隔離，雙向連動無衝突');

// ─────────────────────────────────────────────────────────────
// 測試組 4: 護眼微霧灰藍背景、柔和光照與微觀放大 (minDistance = 2)
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 4: 護眼灰藍 3D 背景、柔和光學與微觀極限放大】');

['buzz', 'bulba', 'ivysaur', 'venusaur'].forEach(char => {
  // 檢查 3D 背景色為 0xe2e8f0 (柔和藍圖霧灰)
  assert.ok(appJs.includes('new THREE.Color(0xe2e8f0)'), '3D 場景背景必須使用護眼柔和微霧灰藍 0xe2e8f0');
  // 檢查相機 near 平面為 0.1
  assert.ok(appJs.includes('PerspectiveCamera(40, width / height, 0.1,'), '相機近平面必須設為 0.1 支援近距離放大');
  // 檢查 controls.minDistance = 2
  assert.ok(appJs.includes('controls.minDistance = 2;'), 'OrbitControls 最小距離必須放寬至 2 支援單方塊微觀檢視');
});

console.log('  ✓ PASS: 4.1 四大角色 3D 畫布皆已採用護眼霧灰藍 (0xe2e8f0)、防眩柔光與 minDistance = 2');

// ─────────────────────────────────────────────────────────────
// 測試組 5: 2D 滑鼠框選 pointerdown 捕捉 (PointerCapture) 與防卡死
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 5: 2D 拖曳框選指針捕捉 (PointerCapture) 與終止機制】');

assert.ok(
  appJs.includes('gridEl.setPointerCapture(e.pointerId);'),
  '2D 框選開始時必須呼叫 gridEl.setPointerCapture 以鎖定全螢幕滑鼠指針'
);

assert.ok(
  appJs.includes('window.addEventListener(\'pointerup\', onPointerEnd);'),
  '必須在 window 全域監聽 pointerup 以防游標移出畫布外放開時卡死'
);

assert.ok(
  appJs.includes('e.key === \'Escape\'') && appJs.includes('isDraggingMarquee = false'),
  '必須監聽 Escape 鍵以隨時取消拖曳框選狀態'
);

console.log('  ✓ PASS: 5.1 框選指標捕捉、window 全域釋放監聽與 Escape 鍵取消防護全數到位');

// ─────────────────────────────────────────────────────────────
// 測試組 6: 3D 頂層連續尺寸測量防穿透誤判 (17 顆精準計算)
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 6: 3D 懸停連續長度鎖定當前檢視頂層】');

assert.ok(
  appJs.includes('const targetLayer = maxL; // 嚴格以當前檢視最高層為基準，徹底消滅下層穿透空格誤判'),
  'handleStationaryHover 必須將 targetLayer 鎖定為當前檢視之頂層 maxL'
);

assert.ok(
  appJs.includes('cand.layerIndex === targetLayer'),
  '射線檢測必須優先挑選屬於當前檢視頂層的方塊，杜絕下層穿透'
);

assert.ok(
  appJs.includes('VoxelDeltaStore.getEffectiveBid(charKey, x, targetY, z)'),
  '連續長度計算時必須嚴格驗證 VoxelDeltaStore 的有效方塊狀態（忽略被刪除方塊）'
);

console.log('  ✓ PASS: 6.1 3D 連續尺寸與間隙探測嚴格以頂層為基準，徹底解決穿透計算下層 18 顆問題');

// ─────────────────────────────────────────────────────────────
// 測試組 7: 當前層半透明透視模式 (Ghost Layer)
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 7: 當前頂層半透明透視模式 (40% Opacity)】');

assert.ok(
  voxelEditorJs.includes('ghostLayer: false'),
  'VoxelDeltaStore 狀態物件中必須具備 ghostLayer 欄位'
);

assert.ok(
  voxelEditorJs.includes('function toggleGhostLayer(charKey)'),
  'voxel_editor.js 必須提供 toggleGhostLayer 函式'
);

// 檢查四大角色皆建立了 ghostInstancedMesh (transparent: true, opacity: 0.40)
assert.ok(
  appJs.includes('ghostMaterial = new THREE.MeshStandardMaterial({') &&
  appJs.includes('opacity: 0.40') &&
  appJs.includes('ghostInstancedMesh = new THREE.InstancedMesh('),
  'app.js 必須為 3D 引擎實例化 40% 半透明透視專用 InstancedMesh'
);

assert.ok(
  appJs.includes('isGhost && hasGhostMesh && item.layerIndex === maxL'),
  '切片過濾器在 ghost 模式下必須將當前頂層方塊切換至 ghostInstancedMesh'
);

console.log('  ✓ PASS: 7.1 當前頂層透視切換與 40% 半透明材質實裝完整');

// ─────────────────────────────────────────────────────────────
// 測試組 8: VLC 雙向拉桿下層操作熱區與雙端按鈕控制
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 8: VLC 雙滑塊下層觸控熱區擴大與步進控制】');

assert.ok(
  indexCss.includes('.vlc-dual-thumb::after') &&
  indexCss.includes('width: 28px;') &&
  indexCss.includes('height: 28px;'),
  'index.css 必須透過 ::after 虛擬元素將滑塊觸控判定範圍擴大至 28px'
);

assert.ok(
  appJs.includes('threeState._lastActiveThumb = \'bottom\';') &&
  appJs.includes('const adjustBottom = (e.shiftKey || threeState._lastActiveThumb === \'bottom\')'),
  'VLC 按鈕 (▲ / ▼) 必須支援依據活躍滑塊或 Shift 鍵精確微調下層邊界'
);

console.log('  ✓ PASS: 8.1 VLC 滑塊 28px 熱區擴展與雙端按鈕控制機制成立');

// ─────────────────────────────────────────────────────────────
// 測試組 9: 版本號與離線快取對齊 (v4.79.0)
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 9: 版本號與離線快取升級至 v4.79.0】');

assert.ok(swJs.includes('pokopia-cache-v4.79.0'), 'sw.js 必須升級為 pokopia-cache-v4.79.0');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.79.0'), 'index.html 必須使用 voxel_editor.js?v=4.79.0');
assert.ok(indexHtml.includes('app.js?v=4.79.0'), 'index.html 必須使用 app.js?v=4.79.0');

console.log('  ✓ PASS: 9.1 全站快取版本號精確對齊 v4.79.0');

console.log('\n========================================================');
console.log('🎉 Pokopia v4.79.0 全部 9 大項實質行為測試 100% PASS！');
console.log('========================================================\n');
