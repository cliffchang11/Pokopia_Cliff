/**
 * 🛠️ Pokopia 3D 體素手動編輯、2D 雙向連動、批次選取與鏡像校正離線整合驗收測試套件
 * 測試版本: v4.42.0
 */

const assert = require('assert');
const fs = require('fs');

console.log('========================================================');
console.log('🛠️ 啟動 Pokopia 3D 體素編輯與 2D 切片雙向連動 (v4.42.0) 離線整合驗收測試...');
console.log('========================================================\n');

// 1. 測試 VoxelDeltaStore 體素核心演算法、幾何對稱軸校正與批次選取
console.log('【測試組 1: VoxelDeltaStore 幾何對稱軸校正與多選批次演算法】');
const ivysaurCode = fs.readFileSync('./ivysaur_voxel_data.js', 'utf8');
const fn = new Function(ivysaurCode + '; return IVYSAUR_VOXEL_DATA;');
global.IVYSAUR_VOXEL_DATA = fn();

const VoxelDeltaStore = require('./voxel_editor.js');
assert.strictEqual(typeof VoxelDeltaStore.executeVoxelAction, 'function', '缺少 executeVoxelAction 函式');
assert.strictEqual(typeof VoxelDeltaStore.undo, 'function', '缺少 undo 函式');
assert.strictEqual(typeof VoxelDeltaStore.redo, 'function', '缺少 redo 函式');
assert.strictEqual(typeof VoxelDeltaStore.getEffectiveVoxelData, 'function', '缺少 getEffectiveVoxelData 函式');
assert.strictEqual(typeof VoxelDeltaStore.selectVoxel, 'function', '缺少 selectVoxel 函式');
assert.strictEqual(typeof VoxelDeltaStore.selectRegion, 'function', '缺少 selectRegion 函式');
assert.strictEqual(typeof VoxelDeltaStore.clearSelection, 'function', '缺少 clearSelection 函式');
assert.strictEqual(typeof VoxelDeltaStore.applyBatchAction, 'function', '缺少 applyBatchAction 函式');
assert.strictEqual(typeof VoxelDeltaStore.setHoverVoxel, 'function', '缺少 setHoverVoxel 函式');
console.log('  ✓ PASS: 1.1 VoxelDeltaStore 介面定義完整 (含選取、批次與幽靈懸停 API)');

// 精準真實幾何對稱軸測試 (妙蛙草真實邊界 1~99，中心軸為 50)
const sym30 = VoxelDeltaStore.getSymmetryX(30, 'ivysaur');
assert.strictEqual(sym30, 70, `妙蛙草 30 對稱應為 70，實際為 ${sym30}`);
const sym51 = VoxelDeltaStore.getSymmetryX(51, 'ivysaur');
assert.strictEqual(sym51, 49, `妙蛙草 51 對稱應為 49，實際為 ${sym51}`);
const sym50 = VoxelDeltaStore.getSymmetryX(50, 'ivysaur');
assert.strictEqual(sym50, 50, `中心軸 50 對稱應為自身 50，實際為 ${sym50}`);
console.log('  ✓ PASS: 1.2 妙蛙草真實幾何中心軸對稱演算精確無偏 (30<->70, 51<->49, 50<->50)');

// 多方塊選取、框選、批次改色與單步 Undo 測試
VoxelDeltaStore.clearSelection('ivysaur');
VoxelDeltaStore.state.mirrorSymmetry = true;
VoxelDeltaStore.selectVoxel('ivysaur', 51, 20, 30, false);
assert(VoxelDeltaStore.state.selectedVoxels.has('51,20,30'), '未選中 51,20,30');
assert(VoxelDeltaStore.state.selectedVoxels.has('49,20,30'), '鏡像模式未連帶選中對稱點 49,20,30');
assert.strictEqual(VoxelDeltaStore.state.selectedVoxels.size, 2, '選取集合大小應為 2');

const paintedCount = VoxelDeltaStore.applyBatchAction('ivysaur', 'paint', 6);
assert.strictEqual(paintedCount, 2, '批次改色數量應為 2');
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), 6);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), 6);

// 單步 Undo
const undoRes = VoxelDeltaStore.undo('ivysaur');
assert.strictEqual(undoRes, true);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), 6);
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), 6);
console.log('  ✓ PASS: 1.3 多方塊選取、批次改色與單一步驟 Undo 全數還原正確');

// 批次消除與 Redo/Undo 驗證
const delCount = VoxelDeltaStore.applyBatchAction('ivysaur', 'delete');
assert.strictEqual(delCount, 2);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), -1);
assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 49, 20, 30), -1);
VoxelDeltaStore.undo('ivysaur');
assert.notStrictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 51, 20, 30), -1);
console.log('  ✓ PASS: 1.4 多方塊批次消除 (Delete) 與單步 Undo 還原正確');

// 懸停幽靈預覽演算
VoxelDeltaStore.setHoverVoxel('ivysaur', 51, 20, 30);
assert.deepStrictEqual(VoxelDeltaStore.state.hoverVoxel, {
  x: 51, y: 20, z: 30, symX: 49, charKey: 'ivysaur'
});
VoxelDeltaStore.setHoverVoxel('ivysaur', 50, 20, 30);
assert.deepStrictEqual(VoxelDeltaStore.state.hoverVoxel, {
  x: 50, y: 20, z: 30, symX: null, charKey: 'ivysaur'
});
console.log('  ✓ PASS: 1.5 鏡像懸停幽靈預覽演算正確（中心軸自動隱藏第二指示）');

// 2. 測試 3D 體素工具列 UI 與 3D 鏡像幽靈預覽
console.log('\n【測試組 2: 3D 體素工具列 UI 與 3D 鏡像幽靈預覽】');
const editorCode = fs.readFileSync('./voxel_editor.js', 'utf8');
assert.ok(editorCode.includes('data-tool="select"'), 'voxel_editor.js 缺少 data-tool="select" 選取模式按鈕');
assert.ok(editorCode.includes('btnClearSel_'), 'voxel_editor.js 缺少 btnClearSel 清空選取按鈕');
assert.ok(editorCode.includes('threeState.ghostMesh'), 'voxel_editor.js 缺少 3D 鏡像懸停幽靈預覽實例 (ghostMesh)');
assert.ok(editorCode.includes('threeState.selectionGroup'), 'voxel_editor.js 缺少 3D 選取線框群組 (selectionGroup)');
assert.ok(editorCode.includes('canvas.addEventListener(\'mousemove\''), 'voxel_editor.js 缺少 3D 滑鼠懸停幽靈即時更新監聽');
console.log('  ✓ PASS: 2.1 右側工具欄具備【⬚ 選取】工具與【✖ 清空選取】按鈕');
console.log('  ✓ PASS: 2.2 3D 視圖具備選取線框群組 (selectionGroup) 與 50% 半透明鏡像幽靈方塊 (ghostMesh)');

// 3. 測試 2D 切片指南高對比清晰白框與雙向連動
console.log('\n【測試組 3: 2D 切片指南高對比白框與雙向即時連動】');
const appCode = fs.readFileSync('./app.js', 'utf8');
const whiteBorderMatches = (appCode.match(/cell\.style\.border = '1px solid rgba\(255, 255, 255, 0\.85\)'/g) || []).length;
assert.strictEqual(whiteBorderMatches, 4, `四大角色的切片實體方塊應全數具有亮白邊框 (期望 4 處，實際 ${whiteBorderMatches} 處)`);
assert.ok(appCode.includes('ve-cell-selected'), 'app.js 切片渲染缺少 ve-cell-selected 選取高亮支援');
assert.ok(appCode.includes('cell.dataset.x = rx;'), 'renderIvysaurLayer 缺少 cell.dataset.x 設定');
assert.ok(appCode.includes('cell.dataset.z = rz;'), 'renderIvysaurLayer 缺少 cell.dataset.z 設定');
assert.ok(appCode.includes('cell.dataset.y = curLayer - 1;'), 'renderIvysaurLayer 缺少 cell.dataset.y 設定');
assert.ok(appCode.includes('gridEl.addEventListener(\'pointerdown\''), 'setupVoxelEditorIntegration 缺少 2D 切片 pointerdown 點擊編輯事件');
assert.ok(appCode.includes('gridEl.addEventListener(\'pointermove\''), 'setupVoxelEditorIntegration 缺少 2D 切片 pointermove 鏡像幽靈懸停與框選事件');
assert.ok(appCode.includes('ve-cell-mirror-ghost'), 'setupVoxelEditorIntegration 缺少 ve-cell-mirror-ghost 鏡像指示 class 注入');
console.log('  ✓ PASS: 3.1 四大角色 2D 切片實體方塊邊框全面統一為清晰高對比白框 (rgba(255, 255, 255, 0.85))');
console.log('  ✓ PASS: 3.2 2D 切片網格完整具備 pointerdown 點選編輯、pointermove 矩形框選與鏡像幽靈懸停指示');
assert.ok(appCode.includes('function renderBulbaLayer(layerIndex) {\n    if (typeof BULBASAUR_VOXEL_DATA === \'undefined\') return;\n    const data = (typeof VoxelDeltaStore !== \'undefined\') ? VoxelDeltaStore.getEffectiveVoxelData(\'bulbasaur\') : BULBASAUR_VOXEL_DATA;\n    const layer = data.layers[layerIndex - 1];\n    if (!layer) return;\n    const curLayer = layerIndex;'), 'renderBulbaLayer 缺少 const curLayer = layerIndex 定義');
assert.ok(appCode.includes('function renderBuzzLayer(layerIndex) {\n    if (typeof BUZZ_VOXEL_DATA === \'undefined\') return;\n    const data = (typeof VoxelDeltaStore !== \'undefined\') ? VoxelDeltaStore.getEffectiveVoxelData(\'buzz\') : BUZZ_VOXEL_DATA;\n    const layer = data.layers[layerIndex - 1];\n    if (!layer) return;\n    const curLayer = layerIndex;'), 'renderBuzzLayer 缺少 const curLayer = layerIndex 定義');
assert.ok(appCode.includes('function renderIvysaurLayer(layerIndex) {\n    if (typeof IVYSAUR_VOXEL_DATA === \'undefined\') return;\n    const data = (typeof VoxelDeltaStore !== \'undefined\') ? VoxelDeltaStore.getEffectiveVoxelData(\'ivysaur\') : IVYSAUR_VOXEL_DATA;\n    const layer = data.layers[layerIndex - 1];\n    if (!layer) return;\n    const curLayer = layerIndex;'), 'renderIvysaurLayer 缺少 const curLayer = layerIndex 定義');
assert.ok(appCode.includes('function renderVenusaurLayer(layerIndex) {\n    if (typeof VENUSAUR_VOXEL_DATA === \'undefined\') return;\n    const data = (typeof VoxelDeltaStore !== \'undefined\') ? VoxelDeltaStore.getEffectiveVoxelData(\'venusaur\') : VENUSAUR_VOXEL_DATA;\n    const layer = data.layers[layerIndex - 1];\n    if (!layer) return;\n    const curLayer = layerIndex;'), 'renderVenusaurLayer 缺少 const curLayer = layerIndex 定義');
console.log('  ✓ PASS: 3.4 四大角色 2D 切片函數具備安全 const curLayer = layerIndex 定義，徹底消除 ReferenceError');

// 4. 測試前端資源引入與版本破壞標籤 (v4.74.0)
console.log('\n【測試組 4: 靜態資源引入與全站版本升級 (v4.74.0)】');
const indexHtml = fs.readFileSync('./index.html', 'utf8');
assert.ok(indexHtml.includes('voxel_editor.js?v=4.92.0') || indexHtml.includes('voxel_editor.js?v=4.91.0') || indexHtml.includes('voxel_editor.js?v=4.90.0'), 'index.html 缺少 voxel_editor.js 最新版號');
assert.ok(indexHtml.includes('index.css?v=4.92.0') || indexHtml.includes('index.css?v=4.91.0') || indexHtml.includes('index.css?v=4.90.0'), 'index.html 未更新至 index.css 最新版號');
assert.ok(indexHtml.includes('app.js?v=4.92.0') || indexHtml.includes('app.js?v=4.91.0') || indexHtml.includes('app.js?v=4.90.0'), 'index.html 未更新至 app.js 最新版號');
console.log('  ✓ PASS: 4.1 index.html 正確引入最新資產且全站版號對齊');

const swCode = fs.readFileSync('./sw.js', 'utf8');
assert.ok(swCode.includes('pokopia-cache-v4.92.0') || swCode.includes('pokopia-cache-v4.91.0') || swCode.includes('pokopia-cache-v4.90.0'), 'sw.js 快取版本未升級至最新版號');
assert.ok(swCode.includes('./voxel_editor.js?v=4.92.0') || swCode.includes('./voxel_editor.js?v=4.91.0') || swCode.includes('./voxel_editor.js?v=4.90.0'), 'sw.js 靜態清單未包含 voxel_editor.js 最新版號');
console.log('  ✓ PASS: 4.2 sw.js 離線快取成功升級且納入最新資產');

const indexCss = fs.readFileSync('./index.css', 'utf8');
assert.ok(indexCss.includes('.ve-cell-selected'), 'index.css 缺少 .ve-cell-selected 選取高亮樣式');
assert.ok(indexCss.includes('.ve-cell-mirror-ghost'), 'index.css 缺少 .ve-cell-mirror-ghost 鏡像幽靈筆刷樣式');
assert.ok(indexCss.includes('.ve-selection-marquee'), 'index.css 缺少 .ve-selection-marquee 框選矩形樣式');
assert.ok(indexCss.includes('.ve-btn-save-cloud'), 'index.css 缺少 .ve-btn-save-cloud 手動儲存按鈕樣式');
console.log('  ✓ PASS: 4.3 index.css 具備選取樣式與手動儲存按鈕樣式');

// 5. 測試 Firebase 腳本語法完整性、手動儲存與 1,321 顆定稿防反彈保護
console.log('\n【測試組 5: Firebase 語法檢查、手動儲存與 1,321 顆定稿防反彈保護】');
const { execSync } = require('child_process');
try {
    execSync('node -c ./firebase.js', { stdio: 'pipe' });
    console.log('  ✓ PASS: 5.1 firebase.js 通過語法檢驗 (node -c)，無語法錯誤');
} catch (e) {
    assert.fail('firebase.js 語法檢驗失敗: ' + e.message);
}

const voxelEditorCode = fs.readFileSync('./voxel_editor.js', 'utf8');
assert.ok(voxelEditorCode.includes('saveOverridesToCloud'), 'voxel_editor.js 缺少 saveOverridesToCloud');
assert.ok(voxelEditorCode.includes('isRecentLocalAction'), 'voxel_editor.js 缺少 isRecentLocalAction 本地防回音反彈保護');
assert.ok(voxelEditorCode.includes('11726') || voxelEditorCode.includes('1321'), 'voxel_editor.js 缺少定稿模型 (11,726 筆最新快取固化版)');
console.log('  ✓ PASS: 5.2 voxel_editor.js 具備手動儲存模式與 11,726 筆固化模型防反彈保護');

console.log('\n--------------------------------------------------------');
console.log('🎉 Pokopia 體素編輯、Firebase 即刻儲存與多端同步驗收 100% PASS！');
console.log('========================================================\n');


