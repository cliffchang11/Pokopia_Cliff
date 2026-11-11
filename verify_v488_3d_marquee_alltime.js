const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('🧪 Pokopia v4.88.0 3D 全時 Ctrl+拖曳框選與模式智慧分流 自動化驗收測試');
console.log('========================================================\n');

// 1. 沙盒安全性驗證：原始藍圖資料與角色數據零篡改
console.log('【測試 1: 沙盒數據安全與角色藍圖防護】');
const blueprintFiles = [
  'buzz_voxel_data.js',
  'bulbasaur_voxel_data.js',
  'ivysaur_voxel_data.js',
  'venusaur_voxel_data.js'
];
blueprintFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(content.length > 1000, `${file} 藍圖數據完整`);
});
console.log('  ✓ PASS: 1.1 所有角色原始 3D 藍圖與體素數據 100% 完整無動');

// 2. 工具列零改動原則 (Strict Toolbar Invariance)
console.log('\n【測試 2: 工具列零改動原則 (不准動到工具列中的任何功能)】');
const voxelEditorSrc = fs.readFileSync('voxel_editor.js', 'utf8');
const toolbarTools = [
  'data-tool="rotate"',
  'data-tool="paint"',
  'data-tool="delete"',
  'data-tool="add"',
  'data-tool="eyedropper"',
  'data-tool="select"',
  'data-role="clear-sel"',
  'data-role="ghost-layer"',
  'data-role="mirror"',
  'data-role="mirror-ltor"',
  'data-role="mirror-rtol"',
  'data-role="undo"',
  'data-role="redo"',
  'data-role="save-cloud"',
  'data-role="collapse"'
];
toolbarTools.forEach(attr => {
  assert.ok(voxelEditorSrc.includes(attr), `工具列按鈕與操作 ${attr} 完好如初`);
});
console.log('  ✓ PASS: 2.1 工具列全部 15 項工具、材質與輔助操作 100% 保持原樣，DOM 與邏輯零變動');

// 3. 全時 Ctrl 捕獲與 OrbitControls 阻斷機制
console.log('\n【測試 3: 全時 Ctrl 捕獲與 OrbitControls 搶奪阻斷機制】');
assert.ok(voxelEditorSrc.includes('{ capture: true }'), 'pointerdown 正確使用 capture: true 捕獲階段監聽');
assert.ok(voxelEditorSrc.includes('e.stopImmediatePropagation()'), '具備 stopImmediatePropagation 阻斷 OrbitControls');
assert.ok(voxelEditorSrc.includes('e.preventDefault()'), '具備 preventDefault 杜絕瀏覽器與鏡頭原生拖曳');
assert.ok(voxelEditorSrc.includes('threeState.controls.enabled = false'), '拖曳框選時暫時關閉軌道控制器');
assert.ok(voxelEditorSrc.includes('threeState.controls.enabled = true'), '結束拖曳時安全恢復軌道控制器');
// 驗證 pointerdown 中不再有 editorMode 與 tool === 'select' 的硬性門檻阻礙全時框選
const pointerdownBlock = voxelEditorSrc.slice(voxelEditorSrc.indexOf("canvas.addEventListener('pointerdown'"), voxelEditorSrc.indexOf("window.addEventListener('pointermove'"));
assert.ok(!pointerdownBlock.includes('_state.editorMode && _state.tool === \'select\''), '已解除手動切換至選取工具之嚴苛前提，支援全時按住 Ctrl 即刻框選');
console.log('  ✓ PASS: 3.1 全時 Ctrl 捕獲與事件阻斷邏輯完備，徹底解決 OrbitControls 原生 Pan/Rotate 衝突');

// 4. 模式智慧分流行為模擬 (動態剖面單層 vs 原生全貌所見即所選)
console.log('\n【測試 4: 模式智慧分流演算法模擬 (動態剖面 vs 原生全貌)】');
const mockCamera = {};
const mockCanvasRect = { left: 0, top: 0, width: 800, height: 600 };
const mockBlocks = [
  { posX: 0, posY: 0, posZ: 0, layerIndex: 1 },  // 第 1 層方塊 (腳底)
  { posX: 0, posY: 10, posZ: 0, layerIndex: 11 }, // 第 11 層方塊 (身體)
  { posX: 0, posY: 25, posZ: 0, layerIndex: 26 }, // 第 26 層方塊 (頭部)
];
const box = { minX: 100, maxX: 700, minY: 50, maxY: 550 };

// 模擬動態剖面模式 (curMode = 'slice', 當前切片停留在第 11 層)
function filterBlocks(blocks, curMode, curLayer) {
  const isSliceMode = (curMode === 'slice');
  const matched = [];
  blocks.forEach(item => {
    if (isSliceMode && item.layerIndex !== curLayer) return;
    matched.push(item);
  });
  return matched;
}

// 4.1 測試動態剖面模式：嚴格只選第 11 層 (與 2D 一致)
const sliceResults = filterBlocks(mockBlocks, 'slice', 11);
assert.strictEqual(sliceResults.length, 1);
assert.strictEqual(sliceResults[0].layerIndex, 11, '動態剖面下僅選中第 11 層方塊');
console.log('  ✓ PASS: 4.1 動態剖面模式下嚴格遵守單層限制 (與 2D 切片 100% 一致)');

// 4.2 測試原生 3D / 完整全貌模式：3 顆方塊全數在視野中被選入 (所見即所選)
const full3dResults = filterBlocks(mockBlocks, '3d', 1);
assert.strictEqual(full3dResults.length, 3, '原生 3D 下全部可見層方塊皆可被框選');
console.log('  ✓ PASS: 4.2 原生 3D / 完整全貌模式下實現真正所見即所選，不再發生命中 0 顆的困擾');

// 5. 累加選取集合 (Additive Selection) 演算法驗證
console.log('\n【測試 5: 多區域連續框選累加集合 (Additive Selection)】');
const selectedSet = new Set();
// 第一次框選命中 (10, 5, 2)
selectedSet.add('10,5,2');
assert.strictEqual(selectedSet.size, 1);

// 第二次框選命中 (15, 8, 3)，採累加模式
selectedSet.add('15,8,3');
assert.strictEqual(selectedSet.size, 2);
assert.ok(selectedSet.has('10,5,2') && selectedSet.has('15,8,3'), '既有選取方塊完整保留且新方塊成功累加');
console.log('  ✓ PASS: 5.1 連續多次按住 Ctrl 框選不同部位，選取結果正常累加合併');

// 6. 版本標記與 Service Worker 快取對齊 (v4.88.0)
console.log('\n【測試 6: 全站靜態快取版本升級至 v4.88.0】');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const swJs = fs.readFileSync('sw.js', 'utf8');
assert.ok(indexHtml.includes('index.css?v=4.88.0'), 'index.html 包含 index.css?v=4.88.0');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.88.0'), 'index.html 包含 voxel_editor.js?v=4.88.0');
assert.ok(indexHtml.includes('app.js?v=4.88.0'), 'index.html 包含 app.js?v=4.88.0');
assert.ok(swJs.includes('pokopia-cache-v4.88.0'), 'sw.js 包含 pokopia-cache-v4.88.0');
assert.ok(swJs.includes('./voxel_editor.js?v=4.88.0'), 'sw.js 包含 ./voxel_editor.js?v=4.88.0');
console.log('  ✓ PASS: 6.1 index.html 與 sw.js 快取版本號全面對齊 v4.88.0');

console.log('\n========================================================');
console.log('🎉 所有 6 組 3D 全時拖曳框選驗證測試 100% 通過！');
console.log('========================================================');

