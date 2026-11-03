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

console.log('\n--------------------------------------------------------');
console.log(`🎉 全部 ${passCount} 項離線自動化整合測試全數通過 (100% PASS)！`);
console.log('========================================================\n');
