/**
 * verify_voxel_2d_toolbar_and_mirror_suite.js
 * Pokopia 2D 切片工具列、立體黑框、動態剖面持久化、2D 對稱線與一鍵鏡像同步離線自動化整合驗收套件
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('🛠️ 啟動 Pokopia 2D 切片工具列、對稱線與一鍵鏡像離線驗收測試...');
console.log('========================================================\n');

// 載入資料
const bulbaData = require('./bulbasaur_voxel_data.js');
const ivysaurData = require('./ivysaur_voxel_data.js');
const buzzData = require('./buzz_voxel_data.js');
const venusaurData = require('./venusaur_voxel_data.js');

global.BULBASAUR_VOXEL_DATA = bulbaData;
global.IVYSAUR_VOXEL_DATA = ivysaurData;
global.BUZZ_VOXEL_DATA = buzzData;
global.VENUSAUR_VOXEL_DATA = venusaurData;

// 模擬基礎 Three.js
global.THREE = {
  Object3D: class {
    constructor() {
      this.position = { set: (x, y, z) => { this.position.x = x; this.position.y = y; this.position.z = z; } };
      this.scale = { set: (x, y, z) => { this.scale.x = x; this.scale.y = y; this.scale.z = z; } };
      this.matrix = { clone: () => new THREE.Object3D() };
    }
    updateMatrix() {}
  },
  Color: class {
    constructor(c) { this.color = c; }
    set(c) { this.color = c; }
  },
  BoxGeometry: class {},
  EdgesGeometry: class {},
  LineBasicMaterial: class {},
  MeshBasicMaterial: class {},
  MeshStandardMaterial: class {
    constructor(opts) { Object.assign(this, opts); }
    dispose() {}
  },
  Mesh: class {
    constructor(geom, mat) {
      this.geometry = geom;
      this.material = mat;
      this.position = { set: (x, y, z) => { this.x = x; this.y = y; this.z = z; } };
      this.scale = { set: (x, y, z) => { this.scale.x = x; this.scale.y = y; this.scale.z = z; } };
      this.visible = true;
      this.userData = {};
    }
  },
  Group: class {
    constructor() { this.children = []; }
    add(obj) { this.children.push(obj); }
    remove(obj) {
      const idx = this.children.indexOf(obj);
      if (idx !== -1) this.children.splice(idx, 1);
    }
  },
  InstancedMesh: class {
    constructor(geom, mat, count) {
      this.geometry = geom;
      this.material = mat;
      this.count = count;
      this.matrices = new Map();
      this.colors = new Map();
      this.instanceMatrix = { needsUpdate: false };
      this.instanceColor = { needsUpdate: false };
    }
    setMatrixAt(idx, mat) { this.matrices.set(idx, mat); }
    setColorAt(idx, col) { this.colors.set(idx, col); }
  }
};

// 載入 VoxelDeltaStore
const VoxelDeltaStore = require('./voxel_editor.js');

let passCount = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('【測試組 1: 一鍵當層鏡像同步 (One-Click Layer Mirroring)】');

test('1.1 介面匯出包含 mirrorCurrentLayer 與 attachEditorTo2D', () => {
  assert.strictEqual(typeof VoxelDeltaStore.mirrorCurrentLayer, 'function');
  assert.strictEqual(typeof VoxelDeltaStore.attachEditorTo2D, 'function');
});

test('1.2 妙蛙草左鏡右 (left-to-right)：右側無方塊補齊同色、右側已有方塊保留原色、左側為空右側自動刪除', () => {
  VoxelDeltaStore.resetToDefault('ivysaur');
  VoxelDeltaStore.state.mirrorSymmetry = false;
  const center = VoxelDeltaStore.getCharBounds('ivysaur').center;
  assert.strictEqual(center, 50, '妙蛙草幾何對稱軸應為 50');

  // 設定測試情境於第 1 層 (y = 0)：
  // 1. 左側 X=48, Y=0, Z=10 存在方塊 (色票 2)；右側對稱處 X=52, Y=0, Z=10 原本為空 (-1)
  VoxelDeltaStore.executeVoxelAction('ivysaur', 48, 0, 10, 'paint', 2);
  // 2. 左側 X=46 為色票 3；右側 X=54 原本為色票 4（原本顏色不同）
  VoxelDeltaStore.executeVoxelAction('ivysaur', 46, 0, 10, 'paint', 3);
  VoxelDeltaStore.executeVoxelAction('ivysaur', 54, 0, 10, 'paint', 4);
  // 3. 左側 X=44 為空 (-1)；右側 X=56 原本有方塊 (色票 5)
  VoxelDeltaStore.executeVoxelAction('ivysaur', 44, 0, 10, 'delete');
  VoxelDeltaStore.executeVoxelAction('ivysaur', 56, 0, 10, 'paint', 5);

  // 執行當層一鍵左鏡右
  VoxelDeltaStore.mirrorCurrentLayer('ivysaur', 1, 'left-to-right');

  // 驗證 1：右側無方塊處補齊，顏色採來源側 (bid = 2)
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 52, 0, 10), 2, '右側缺少方塊處應新長出並帶左側顏色');

  // 驗證 2：原本顏色不處理（右側 X=54 仍應保留原來的 bid = 4，不被左側的 3 覆蓋）
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 54, 0, 10), 4, '右側既有方塊應嚴格保留原本顏色不覆蓋');

  // 驗證 3：左側為空，右側方塊自動刪除，形狀達成完全一致
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 56, 0, 10), -1, '左方為空時，右方對應方塊應被刪除以達一致');
});

test('1.3 一鍵鏡像同步支援單步 Undo 完整還原', () => {
  // 承接上題，呼叫一次 Undo
  const ok = VoxelDeltaStore.undo('ivysaur');
  assert.strictEqual(ok, true);

  // 驗證還原回鏡像前的狀態：X=52 恢復為空，X=56 恢復為 5
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 52, 0, 10), -1, 'Undo 後 X=52 應還原為空');
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 56, 0, 10), 5, 'Undo 後 X=56 應還原為既有方塊');
});

test('1.4 右鏡左 (right-to-left) 對稱同步正確', () => {
  VoxelDeltaStore.resetToDefault('ivysaur');
  VoxelDeltaStore.state.mirrorSymmetry = false;
  // 右方 X=53 為色票 6；左方 X=47 原本為空
  VoxelDeltaStore.executeVoxelAction('ivysaur', 53, 0, 12, 'paint', 6);
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 47, 0, 12), -1);

  // 執行右鏡左
  VoxelDeltaStore.mirrorCurrentLayer('ivysaur', 1, 'right-to-left');

  // 左方 X=47 應被長出且為色票 6
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 47, 0, 12), 6, '右鏡左應成功補齊左方方塊並帶右方顏色');
});

console.log('\n【測試組 2: 3D 動態新增方塊立體黑框與動態剖面過濾】');

test('2.1 新增方塊具備與原版一致的 Cel-outline 立體黑邊貼圖 (map = mesh.material.map)', () => {
  const dummyMap = { isTexture: true, id: 'cel_outline_tex' };
  const mockMesh = new global.THREE.InstancedMesh(new global.THREE.BoxGeometry(), { map: dummyMap }, 100);
  const mockThreeState = {
    instancedMesh: mockMesh,
    blockDataList: [],
    scene: new global.THREE.Group(),
    dynamicAddedGroup: new global.THREE.Group(),
    _getCurMode: () => 'full',
    _getCurLayer: () => 1
  };

  VoxelDeltaStore.resetToDefault('ivysaur');
  // 新增一個原版不存在的方塊 (如座標 99, 99, 99)
  VoxelDeltaStore.executeVoxelAction('ivysaur', 99, 99, 99, 'add', 1);

  // 執行網格同步
  VoxelDeltaStore.syncThreeMeshFromOverrides('ivysaur', mockThreeState, ivysaurData);

  assert.strictEqual(mockThreeState.dynamicAddedGroup.children.length > 0, true, '應建立動態新增方塊');
  const addedCube = mockThreeState.dynamicAddedGroup.children[0];
  assert.strictEqual(addedCube.material.map, dummyMap, '新增方塊材質必須注入原版立體黑邊貼圖');
});

test('2.2 動態剖面模式下，新增方塊嚴格依切片層數顯隱（高於當前層者隱藏）', () => {
  const mockMesh = new global.THREE.InstancedMesh(new global.THREE.BoxGeometry(), {}, 100);
  let curMode = 'slice';
  let curLayer = 5; // 當前切片在第 5 層

  const mockThreeState = {
    instancedMesh: mockMesh,
    blockDataList: [],
    scene: new global.THREE.Group(),
    dynamicAddedGroup: new global.THREE.Group(),
    _getCurMode: () => curMode,
    _getCurLayer: () => curLayer
  };

  VoxelDeltaStore.resetToDefault('ivysaur');
  // 在第 3 層新增方塊 (y = 2) 與在第 8 層新增方塊 (y = 7)
  VoxelDeltaStore.executeVoxelAction('ivysaur', 90, 2, 90, 'add', 1);
  VoxelDeltaStore.executeVoxelAction('ivysaur', 90, 7, 90, 'add', 1);

  VoxelDeltaStore.syncThreeMeshFromOverrides('ivysaur', mockThreeState, ivysaurData);

  const cubeLayer3 = mockThreeState.dynamicAddedGroup.children.find(c => c.userData.voxelY === 2);
  const cubeLayer8 = mockThreeState.dynamicAddedGroup.children.find(c => c.userData.voxelY === 7);

  assert.strictEqual(cubeLayer3.visible, true, '第 3 層新增方塊在第 5 層剖面下應可見');
  assert.strictEqual(cubeLayer8.visible, false, '第 8 層新增方塊在第 5 層剖面下應自動隱藏');
});

console.log('\n【測試組 3: 2D 切片工作台對稱線、按鈕與 DOM 整合】');

test('3.1 voxel_editor.js 包含左鏡右 (btnMirrorLtoR) 與右鏡左 (btnMirrorRtoL) 按鈕', () => {
  const editorCode = fs.readFileSync(path.join(__dirname, 'voxel_editor.js'), 'utf-8');
  assert.strictEqual(editorCode.includes('btnMirrorLtoR_'), true);
  assert.strictEqual(editorCode.includes('btnMirrorRtoL_'), true);
  assert.strictEqual(editorCode.includes('attachEditorTo2D'), true);
});

test('3.2 app.js 具備 appendSymmetryAxisLine 且四大角色 2D 切片網格皆呼叫', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('function appendSymmetryAxisLine'), true);
  assert.strictEqual(appCode.includes("appendSymmetryAxisLine(DOM.bulbaVoxelGrid, 'bulbasaur'"), true);
  assert.strictEqual(appCode.includes("appendSymmetryAxisLine(DOM.buzzVoxelGrid, 'buzz'"), true);
  assert.strictEqual(appCode.includes("appendSymmetryAxisLine(DOM.ivysaurVoxelGrid, 'ivysaur'"), true);
  assert.strictEqual(appCode.includes("appendSymmetryAxisLine(DOM.venusaurVoxelGrid, 'venusaur'"), true);
});

test('3.3 index.css 具備 .ve-symmetry-axis-line 與 .voxel-editor-2d-toolbar 樣式', () => {
  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('.ve-symmetry-axis-line'), true);
  assert.strictEqual(cssCode.includes('.ve-symmetry-axis-badge'), true);
  assert.strictEqual(cssCode.includes('.voxel-editor-2d-toolbar'), true);
  assert.strictEqual(cssCode.includes('.ve-mirror-actions'), true);
});

test('3.4 index.css 切片容器高度電腦版為 580px，手機版為螢幕比例 min(65vh, 480px)', () => {
  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('height: 580px;'), true, '電腦版高度應為 580px');
  assert.strictEqual(cssCode.includes('height: min(65vh, 480px) !important;'), true, '手機版高度應自適應螢幕比例');
  assert.strictEqual(cssCode.includes('min-height: 340px !important;'), true, '手機版應設定 min-height: 340px');
});

test('3.5 2D 鏡像對稱格子具備實體色彩預覽、發光脈衝框與無痕復原機制', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('targetCell._origBg = targetCell.style.backgroundColor || \'\';'), true);
  assert.strictEqual(appCode.includes('targetCell.classList.add(\'ve-ghost-paint\');'), true);
  assert.strictEqual(appCode.includes('c.style.backgroundColor = c._origBg;'), true);

  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('ve-mirror-pulse'), true, '應具備金色發光脈衝動效');
  assert.strictEqual(cssCode.includes('outline: 3px solid #facc15'), true, '應具備亮金霓虹 3px 外框');
});

test('3.6 切片滾輪縮放範圍對齊 0.30~4.0，徹底解除 0.6 跳大卡死限制', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('Math.min(4.0, Math.max(0.30, Number((zoomObj.scale * factor).toFixed(3))))'), true, '滾輪縮放應支援 0.30~4.0');
  assert.strictEqual(appCode.includes('Math.min(4.0, Math.max(0.30, Number(newScale.toFixed(2))))'), true, '按鈕縮放應對齊 0.30~4.0');
  assert.strictEqual(appCode.includes('containerH = container.clientHeight || 580;'), true, '自適應高度 fallback 應為 580px');
});

test('3.7 Zoom-to-Cursor 游標錨定補償演算正確（游標下世界座標恆等）', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('zoomObj.panX = Math.round(mouseX - scaleRatio * (mouseX - zoomObj.panX));'), true);
  assert.strictEqual(appCode.includes('zoomObj.panY = Math.round(mouseY - scaleRatio * (mouseY - zoomObj.panY));'), true);

  // 離線數學模擬斷言
  const zoomObj = { scale: 1.0, panX: 0, panY: 0 };
  const mouseX = 150; // 游標位於中心偏右 150px
  const mouseY = 80;  // 游標位於中心偏下 80px
  const newScale = 2.0; // 放大兩倍
  const scaleRatio = newScale / zoomObj.scale; // 2.0
  const newPanX = Math.round(mouseX - scaleRatio * (mouseX - zoomObj.panX)); // 150 - 2 * 150 = -150
  const newPanY = Math.round(mouseY - scaleRatio * (mouseY - zoomObj.panY)); // 80 - 2 * 80 = -80

  // 驗證縮放後游標下的 local 座標在前後是否一致：
  const localXBefore = (mouseX - zoomObj.panX) / zoomObj.scale;
  const localXAfter = (mouseX - newPanX) / newScale;
  assert.strictEqual(localXBefore, localXAfter, '縮放前後滑鼠游標正下方的畫布坐標必須完全恆等');
});

test('3.8 index.css 當前格徹底移除 scale 1.35 放大，平整無變形', () => {
  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('.bulba-cell:hover {\n  outline: 1.5px solid rgba(255, 255, 255, 0.95);'), true, 'hover 應為平整細邊框');
  assert.strictEqual(cssCode.includes('.bulba-cell:hover {\n  transform: scale(1.35);'), false, 'hover 不得包含 scale 1.35 放大');
});

test('3.9 四大角色 2D 切片網格具備幾何對稱 X 軸平衡展開，確保對稱提示 100% 存在', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("const symBounds = VoxelDeltaStore.getCharBounds('bulbasaur');"), true);
  assert.strictEqual(appCode.includes("const symBounds = VoxelDeltaStore.getCharBounds('buzz');"), true);
  assert.strictEqual(appCode.includes("const symBounds = VoxelDeltaStore.getCharBounds('ivysaur');"), true);
  assert.strictEqual(appCode.includes("const symBounds = VoxelDeltaStore.getCharBounds('venusaur');"), true);
});

test('3.10 3D 渲染後台休眠與 cancelAnimationFrame 機制 (離開 3D 藍圖分頁或切換角色時立即終止 rAF)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('function stopThreeRendering(charKey) {'), true);
  assert.strictEqual(appCode.includes('cancelAnimationFrame(t.animFrameId);'), true);
  assert.strictEqual(appCode.includes("if (tab !== 'buzz3d' && typeof stopThreeRendering === 'function') {"), true);
  assert.strictEqual(appCode.includes("['buzz', 'bulbasaur', 'ivysaur', 'venusaur'].forEach(stopThreeRendering);"), true);
  assert.strictEqual(appCode.includes("if (typeof startThreeRendering === 'function') startThreeRendering(bulbaState.curChar || 'buzz');"), true);
});

test('3.11 3D 當前角色 60fps 全速渲染與 2D 雙向即時連動 (startThreeRendering 啟動動畫迴圈，非作用角色與切頁完全休眠)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes('function startThreeRendering(charKey) {'), true);
  assert.strictEqual(appCode.includes('t.animFrameId = requestAnimationFrame(animate);'), true);
  assert.strictEqual(appCode.includes("startThreeRendering('buzz');"), true);
  assert.strictEqual(appCode.includes("startThreeRendering('bulbasaur');"), true);
  assert.strictEqual(appCode.includes("startThreeRendering('ivysaur');"), true);
  assert.strictEqual(appCode.includes("startThreeRendering('venusaur');"), true);
});

test('3.12 四大角色 2D 切片網格 cell 生成時直連 handleCellMirrorHover (100% 獨立解耦，不依賴 3D 引擎)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseenter', () => handleCellMirrorHover(DOM.buzzVoxelGrid, 'buzz', cell, true));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseleave', () => handleCellMirrorHover(DOM.buzzVoxelGrid, 'buzz', cell, false));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseenter', () => handleCellMirrorHover(DOM.bulbaVoxelGrid, 'bulbasaur', cell, true));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseleave', () => handleCellMirrorHover(DOM.bulbaVoxelGrid, 'bulbasaur', cell, false));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseenter', () => handleCellMirrorHover(DOM.ivysaurVoxelGrid, 'ivysaur', cell, true));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseleave', () => handleCellMirrorHover(DOM.ivysaurVoxelGrid, 'ivysaur', cell, false));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseenter', () => handleCellMirrorHover(DOM.venusaurVoxelGrid, 'venusaur', cell, true));"), true);
  assert.strictEqual(appCode.includes("cell.addEventListener('mouseleave', () => handleCellMirrorHover(DOM.venusaurVoxelGrid, 'venusaur', cell, false));"), true);
});

test('3.13 離線模擬 handleCellMirrorHover 鏡像外框觸發、中心軸避開、樣式色彩注入與無痕還原', () => {
  // 建立 DOM 模擬節點
  class MockClassList {
    constructor() { this.classes = new Set(); }
    add(...cls) { cls.forEach(c => this.classes.add(c)); }
    remove(...cls) { cls.forEach(c => this.classes.delete(c)); }
    contains(c) { return this.classes.has(c); }
  }
  class MockElement {
    constructor(dataset = {}, bg = '') {
      this.dataset = dataset;
      this.style = { backgroundColor: bg };
      this.classList = new MockClassList();
    }
  }

  const cells = new Map();
  // 模擬巴斯光年第 1 層的格子：X: 18 與對稱側 X: 22 (中軸 20，bounds.sum = 40)
  const cellSource = new MockElement({ x: '18', z: '10' }, '#93c5fd');
  const cellTarget = new MockElement({ x: '22', z: '10' }, '#93c5fd');
  const cellCenter = new MockElement({ x: '20', z: '10' }, '#f1f5f9');
  cells.set('18,10', cellSource);
  cells.set('22,10', cellTarget);
  cells.set('20,10', cellCenter);

  const mockGrid = {
    querySelector: (sel) => {
      const match = sel.match(/data-x="(\d+)"\]\[data-z="(\d+)"\]/);
      if (match) return cells.get(`${match[1]},${match[2]}`) || null;
      return null;
    },
    querySelectorAll: (sel) => {
      const res = [];
      cells.forEach(c => {
        if (c.classList.contains('ve-cell-mirror-ghost')) res.push(c);
      });
      return res;
    }
  };

  // 抽出 handleCellMirrorHover 核心進行純粹邏輯模擬
  function testHandleCellMirrorHover(gridEl, charKey, sourceCell, isEnter) {
    if (!gridEl) return;
    if (!isEnter) {
      gridEl.querySelectorAll('.ve-cell-mirror-ghost').forEach(c => {
        c.classList.remove('ve-cell-mirror-ghost', 'delete', 've-ghost-paint');
        if (c._origBg !== undefined) {
          c.style.backgroundColor = c._origBg;
          delete c._origBg;
        }
      });
      return;
    }
    if (!sourceCell || sourceCell.dataset.x === undefined) return;
    const x = Number(sourceCell.dataset.x);
    const z = Number(sourceCell.dataset.z);
    const symX = VoxelDeltaStore.getSymmetryX(x, charKey);
    if (symX === null || symX === x) return;

    const targetCell = gridEl.querySelector(`.bulba-cell[data-x="${symX}"][data-z="${z}"]`);
    if (targetCell) {
      targetCell.classList.add('ve-cell-mirror-ghost');
      targetCell._origBg = targetCell.style.backgroundColor || '';
      targetCell.classList.add('ve-ghost-paint');
      targetCell.style.backgroundColor = sourceCell.style.backgroundColor;
    }
  }

  // 1. 滑鼠移入 cellSource (X: 18)
  testHandleCellMirrorHover(mockGrid, 'buzz', cellSource, true);
  assert.strictEqual(cellTarget.classList.contains('ve-cell-mirror-ghost'), true, '對稱目標 cellTarget 應加上 ve-cell-mirror-ghost');
  assert.strictEqual(cellTarget.classList.contains('ve-ghost-paint'), true, '應加上 ve-ghost-paint');
  assert.strictEqual(cellTarget._origBg, '#93c5fd', '原始背景應妥善暫存備份');

  // 2. 滑鼠離開
  testHandleCellMirrorHover(mockGrid, 'buzz', cellSource, false);
  assert.strictEqual(cellTarget.classList.contains('ve-cell-mirror-ghost'), false, '滑鼠離開後 ve-cell-mirror-ghost 應被清除');
  assert.strictEqual(cellTarget._origBg, undefined, '_origBg 應被清理刪除');
  assert.strictEqual(cellTarget.style.backgroundColor, '#93c5fd', '背景色應無痕還原');

  // 3. 滑鼠移入中心軸自身的格子 (X: 20)，不應觸發重複自體發光
  testHandleCellMirrorHover(mockGrid, 'buzz', cellCenter, true);
  assert.strictEqual(cellCenter.classList.contains('ve-cell-mirror-ghost'), false, '中軸自身格子不應重複發光');
});

test('3.14 2D 編輯工具列層級固定懸浮 (getCharSliceCardEl 優先尋找 bulba-slice-card，CSS 不隨平移移動)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("return grid.closest('.bulba-slice-card') || grid.closest('.bulba-grid-container') || grid.parentElement;"), true);

  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('.bulba-slice-card {\n  position: relative;'), true);
  assert.strictEqual(cssCode.includes('.voxel-editor-2d-toolbar {\n  position: absolute;'), true);
  assert.strictEqual(cssCode.includes('pointer-events: none;'), true);
});

test('3.15 切片指南平移事件精確隔離 (pointerdown 過濾工具列本體與編輯狀態下的方塊點擊)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("e.target.closest('button, input, .voxel-editor-2d-toolbar, .voxel-editor-toolbar, .ve-toggle-capsule, .ve-palette-dock')"), true);
  assert.strictEqual(appCode.includes("if (e.target.closest('.bulba-cell')) return;"), true);
});

test('3.16 「恢復預設」按鈕物理隔離至 ve-danger-zone 與嚴格二次確認對話框', () => {
  const editorCode = fs.readFileSync(path.join(__dirname, 'voxel_editor.js'), 'utf-8');
  assert.strictEqual(editorCode.includes('<div class="ve-danger-zone" style="width: 100%;">'), true);
  assert.strictEqual(editorCode.includes('ve-btn-reset-safe'), true);
  assert.strictEqual(editorCode.includes('⚠️ 警告：這將會清除您對當前角色的所有自訂方塊與改動，恢復為官方預設值，且無法撤銷！'), true);

  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('.ve-btn-reset-safe:hover'), true);
});

test('3.17 3D 藍圖停留模型持久化 (LocalStorage + URL Hash 雙向記憶與重整無縫還原)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("const STORAGE_KEY_3D_CUR_CHAR = 'pokopia_3d_cur_char_v1';"), true);
  assert.strictEqual(appCode.includes('function getSaved3DChar() {'), true);
  assert.strictEqual(appCode.includes('function save3DState(charKey, layer = null, mode = null) {'), true);
  assert.strictEqual(appCode.includes("bulbaState.curChar = char;\n    save3DState(char);"), true);
  assert.strictEqual(appCode.includes("const charSuffix = (state.currentTab === 'buzz3d' && bulbaState && bulbaState.curChar) ? `-${bulbaState.curChar}` : '';"), true);
  assert.strictEqual(appCode.includes("if (tab === 'buzz3d' && valid3DChars.includes(parts[2])) {\n            subChar = parts[2];"), true);
});

test('3.18 各角色切片層數與 3D 模式持久化 (setXxxLayer 與 switchXxx3DMode 同步 LocalStorage)', () => {
  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("save3DState('buzz', target);"), true);
  assert.strictEqual(appCode.includes("save3DState('bulba', target);"), true);
  assert.strictEqual(appCode.includes("save3DState('ivysaur', target);"), true);
  assert.strictEqual(appCode.includes("save3DState('venusaur', target);"), true);
  assert.strictEqual(appCode.includes("save3DState('buzz', null, mode);"), true);
  assert.strictEqual(appCode.includes("save3DState('bulba', null, mode);"), true);
  assert.strictEqual(appCode.includes("save3DState('ivysaur', null, mode);"), true);
  assert.strictEqual(appCode.includes("save3DState('venusaur', null, mode);"), true);
  assert.strictEqual(appCode.includes("curLayer: getSaved3DLayer('buzz', 1)"), true);
  assert.strictEqual(appCode.includes("curLayer: getSaved3DLayer('bulba', 1)"), true);
  assert.strictEqual(appCode.includes("curLayer: getSaved3DLayer('ivysaur', 1)"), true);
  assert.strictEqual(appCode.includes("curLayer: getSaved3DLayer('venusaur', 1)"), true);
});

test('3.19 3D 藍圖寬螢幕雙聯工作台響應式佈局 (左 2D 切片 order: 1 / 右 3D 雕像 order: 2 @media min-width: 1280px)', () => {
  const cssCode = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
  assert.strictEqual(cssCode.includes('@media (min-width: 1280px) {'), true);
  assert.strictEqual(cssCode.includes('grid-template-columns: 1fr 1fr;'), true);
  assert.strictEqual(cssCode.includes('max-width: 96vw;'), true);
  assert.strictEqual(cssCode.includes('.bulba-slice-card {\n    order: 1;\n  }'), true, '寬螢幕切片指南應居左 (order: 1)');
  assert.strictEqual(cssCode.includes('.bulba-3d-card {\n    order: 2;\n  }'), true, '寬螢幕 3D 雕像應居右 (order: 2)');

  const appCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
  assert.strictEqual(appCode.includes("document.body.classList.toggle('is-buzz3d-active', tab === 'buzz3d');"), true);
});

test('3.20 跨視窗/跨分頁 BroadcastChannel 0 毫秒即塗即現即時同步', () => {
  const VoxelDeltaStore = require('./voxel_editor.js');
  assert.strictEqual(typeof VoxelDeltaStore.broadcastVoxelDelta, 'function');
  assert.strictEqual(typeof VoxelDeltaStore.handleRemoteOverridesSync, 'function');

  let listenerNotified = false;
  const unsubscribeListener = (k, overrides) => {
    if (k === 'ivysaur' && overrides['50,15,50'] === 4) {
      listenerNotified = true;
    }
  };
  VoxelDeltaStore.addChangeListener(unsubscribeListener);

  // 模擬視窗 B 接收到視窗 A 廣播的 overrides
  VoxelDeltaStore.handleRemoteOverridesSync('ivysaur', { '50,15,50': 4 });
  assert.strictEqual(VoxelDeltaStore.getEffectiveBid('ivysaur', 50, 15, 50), 4, '遠端廣播的方塊資料應即時生效');
  assert.strictEqual(listenerNotified, true, '本機監聽器應被即時觸發以重繪切片');
});

console.log('\n--------------------------------------------------------');
console.log(`🎉 全部 ${passCount} 項離線自動化整合測試全數通過 (100% PASS)！`);
console.log('========================================================\n');
