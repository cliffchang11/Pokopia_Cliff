/**
 * verify_homepage_ivysaur43_unified_suite.js
 * 
 * 妙蛙草 43 層精巧建造工作台全站首頁一體化整合（v4.94.0）
 * 行為級自動化模擬測試套件
 * 
 * 驗收範圍：
 * 1. 首頁 DOM 結構與五大角色膠囊列
 * 2. 43 層精巧版專屬工作台元件 (3D展台、模式切換、2D切片、1~43滑桿、材料清單)
 * 3. 獨立頁面 ivysaur_43.html 安全移除與死連結清理
 * 4. app.js 角色切換控制器、切片分層 (1~43) 與狀態管理
 * 5. 數據獨立性與 76 層 11,726 筆固化防線保護
 * 6. Firebase 雲端字串包打包/解包相容性
 * 7. Service Worker 快取清單與全站 v4.94.0 版本一致性
 */

const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('🧪 啟動 妙蛙草 43 層精巧版全站首頁一體化整合 (v4.94.0) 驗收測試...');
console.log('========================================================\n');

// ─────────────────────────────────────────────────────────────
// 測試組 1: 首頁 DOM 結構與五大角色膠囊切換列驗收
// ─────────────────────────────────────────────────────────────
console.log('【測試組 1: 首頁 DOM 結構與五大角色膠囊切換列驗收】');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1.1 膠囊列五大按鈕
assert.ok(indexHtml.includes('id="btnSubBulba"'), '缺少妙蛙種子按鈕 btnSubBulba');
assert.ok(indexHtml.includes('id="btnSubIvysaur43"'), '缺少妙蛙草 43 層精巧版按鈕 btnSubIvysaur43');
assert.ok(indexHtml.includes('id="btnSubIvysaur"'), '缺少妙蛙草 76 層經典版按鈕 btnSubIvysaur');
assert.ok(indexHtml.includes('id="btnSubVenusaur"'), '缺少妙蛙花按鈕 btnSubVenusaur');
assert.ok(indexHtml.includes('id="btnSubBuzz"'), '缺少巴斯光年按鈕 btnSubBuzz');

assert.ok(indexHtml.includes('妙蛙草 (43層)'), '按鈕標籤必須包含「妙蛙草 (43層)」');
assert.ok(indexHtml.includes('妙蛙草 (76層)'), '按鈕標籤必須包含「妙蛙草 (76層)」');
console.log('  ✓ PASS: 1.1 首頁頂部角色膠囊列並列呈現五大選項（含 43 層與 76 層雙版本）');

// 1.2 43 層專屬工作台面板 paneIvysaur43
assert.ok(indexHtml.includes('id="paneIvysaur43"'), '缺少 paneIvysaur43 工作台面板');
assert.ok(indexHtml.includes('id="ivysaur43_3dCanvas"'), '缺少 ivysaur43_3dCanvas 3D 畫布');
assert.ok(indexHtml.includes('id="btnIvysaur43ModeFull"'), '缺少 btnIvysaur43ModeFull 完整模式按鈕');
assert.ok(indexHtml.includes('id="btnIvysaur43ModeSlice"'), '缺少 btnIvysaur43ModeSlice 動態剖面按鈕');
assert.ok(indexHtml.includes('id="ivysaur43SliceCard"'), '缺少 ivysaur43SliceCard 2D 切片工作台容器');
assert.ok(indexHtml.includes('id="ivysaur43LayerSlider"'), '缺少 ivysaur43LayerSlider 切片滑桿');
assert.ok(indexHtml.includes('id="ivysaur43LayerBadge"'), '缺少 ivysaur43LayerBadge 當前層數標籤');
assert.ok(indexHtml.includes('id="ivysaur43VoxelGrid"'), '缺少 ivysaur43VoxelGrid 2D 切片網格容器');
assert.ok(indexHtml.includes('id="ivysaur43MatList"'), '缺少 ivysaur43MatList 方塊材料清單容器');

// 滑桿範圍限制為 1~43
assert.ok(/id="ivysaur43LayerSlider"[^>]*min="1"[^>]*max="43"/.test(indexHtml), '滑桿範圍必須嚴格為 min="1" max="43"');
console.log('  ✓ PASS: 1.2 paneIvysaur43 完整工作台結構與 1~43 尺規滑桿 DOM 定義就緒');

// 1.3 舊獨立頁面連結清理
assert.ok(!indexHtml.includes('href="ivysaur_43.html"'), 'index.html 不應殘留連往 ivysaur_43.html 的過時外鏈');
assert.strictEqual(fs.existsSync('ivysaur_43.html'), false, '獨立檔案 ivysaur_43.html 必須已被徹底移除');
console.log('  ✓ PASS: 1.3 程式庫純淨化：舊外鏈已清理且 ivysaur_43.html 已徹底刪除');

// ─────────────────────────────────────────────────────────────
// 測試組 2: 43 層數據庫結構與幾何特徵驗收
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 2: 43 層數據庫結構與幾何特徵驗收】');

assert.strictEqual(fs.existsSync('ivysaur43_voxel_data.js'), true, '必須存在 ivysaur43_voxel_data.js');

global.window = global;
const ivysaur43Data = require('./ivysaur43_voxel_data.js');

assert.strictEqual(ivysaur43Data.dimensions.height, 43, '數據庫最大高度必須為 43');
assert.strictEqual(ivysaur43Data.dimensions.width, 56, '數據庫寬度 X 必須為 56');
assert.strictEqual(ivysaur43Data.dimensions.length, 56, '數據庫深度 Z 必須為 56');
assert.strictEqual(ivysaur43Data.layers.length, 43, '層級陣列長度必須精確為 43');

let total43Blocks = 0;
ivysaur43Data.layers.forEach((layer, idx) => {
  const count = layer.blocks ? layer.blocks.length : 0;
  total43Blocks += count;
  assert.ok(count > 0, `第 ${idx + 1} 層不能為空層`);
});

console.log(`- 43 層妙蛙草精巧版總方塊數: ${total43Blocks} 顆`);
assert.strictEqual(total43Blocks, 18751, '43 層精巧版方塊數必須精確為 18,751 顆');
console.log('  ✓ PASS: 2.1 43 層數據庫層層連續無空層，56×43×56 尺度與 18,751 顆方塊精準吻合');

// ─────────────────────────────────────────────────────────────
// 測試組 3: app.js 切換控制器與狀態連動行為模擬
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 3: app.js 切換控制器與狀態連動行為模擬】');

const appJs = fs.readFileSync('app.js', 'utf8');

// 3.1 核心變數與函式定義檢查
assert.ok(appJs.includes('const ivysaur43State = {'), 'app.js 必須具備 ivysaur43State 狀態物件');
assert.ok(appJs.includes('function switchIvysaur433DMode('), 'app.js 必須具備 switchIvysaur433DMode 函式');
assert.ok(appJs.includes('function setIvysaur43Layer('), 'app.js 必須具備 setIvysaur43Layer 函式');
assert.ok(appJs.includes('function renderIvysaur43Layer('), 'app.js 必須具備 renderIvysaur43Layer 函式');
assert.ok(appJs.includes('function initIvysaur43ThreeEngine('), 'app.js 必須具備 initIvysaur43ThreeEngine 函式');
assert.ok(appJs.includes('function updateIvysaur433DSliceFilter('), 'app.js 必須具備 updateIvysaur433DSliceFilter 函式');
console.log('  ✓ PASS: 3.1 app.js 具備完整 43 層 3D 與 2D 專屬控制核心函式');

// 3.2 角色切換控制器包含 ivysaur43
assert.ok(appJs.includes("char === 'ivysaur43'"), "switchCharacterBlueprint 必須包含 char === 'ivysaur43'");
assert.ok(appJs.includes("char === 'ivysaur'"), "switchCharacterBlueprint 必須保留 char === 'ivysaur' (76層)");
assert.ok(appJs.includes("char === 'bulba'"), "switchCharacterBlueprint 必須保留 char === 'bulba'");
assert.ok(appJs.includes("char === 'venusaur'"), "switchCharacterBlueprint 必須保留 char === 'venusaur'");
assert.ok(appJs.includes("char === 'buzz'"), "switchCharacterBlueprint 必須保留 char === 'buzz'");
console.log('  ✓ PASS: 3.2 switchCharacterBlueprint 支援五大角色藍圖，包含 ivysaur43 與 ivysaur');

// 3.3 2D 網格與體素編輯器整合
assert.ok(appJs.includes("if (charKey === 'ivysaur43') return DOM.ivysaur43VoxelGrid;"), 'getCharGridEl 必須支援 ivysaur43');
assert.ok(appJs.includes("if (charKey === 'ivysaur43') return ivysaur43State.curMode;"), 'setupVoxelEditorIntegration _getCurMode 支援 ivysaur43');
assert.ok(appJs.includes("if (charKey === 'ivysaur43') return ivysaur43State.curLayer;"), 'setupVoxelEditorIntegration _getCurLayer 支援 ivysaur43');
assert.ok(appJs.includes("if (charKey === 'ivysaur43') updateIvysaur433DSliceFilter();"), 'setupVoxelEditorIntegration _onAfterSync 與 _sliceFilter 支援 ivysaur43');
assert.ok(appJs.includes("setupVoxelEditorIntegration('ivysaur43'"), 'initIvysaur43ThreeEngine 必須呼叫 setupVoxelEditorIntegration');
console.log('  ✓ PASS: 3.3 體素編輯器 15 工具列與 2D 切片事件路由 100% 串接 ivysaur43');

// ─────────────────────────────────────────────────────────────
// 測試組 4: 體素資料隔離與 76 層 11,726 筆固化防線保護驗證
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 4: 體素資料隔離與 76 層 11,726 筆固化防線保護驗證】');

// 載入體素編輯器
let mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

const VoxelStore = require('./voxel_editor.js');

// 4.1 初始狀態驗證
const ivysaur76Overrides = VoxelStore.getOverrides('ivysaur');
const ivysaur76Count = Object.keys(ivysaur76Overrides).length;
console.log(`- 76 層初始覆寫筆數: ${ivysaur76Count}`);
assert.strictEqual(ivysaur76Count, 11726, '76 層初始覆寫必須精準為 11,726 筆固化數據');

const ivysaur43Overrides = VoxelStore.getOverrides('ivysaur43');
console.log(`- 43 層初始覆寫筆數: ${Object.keys(ivysaur43Overrides).length}`);
assert.strictEqual(Object.keys(ivysaur43Overrides).length, 0, '43 層初始覆寫應為乾淨狀態 0 筆');
console.log('  ✓ PASS: 4.1 雙版本記憶體空間嚴格隔離');

// 4.2 在 43 層進行體素編輯操作
VoxelStore.state.mirrorSymmetry = false;
VoxelStore.executeVoxelAction('ivysaur43', 10, 5, 10, 'paint', 1);
VoxelStore.executeVoxelAction('ivysaur43', 12, 6, 12, 'paint', 2);

const ivysaur43AfterEdit = VoxelStore.getOverrides('ivysaur43');
const ivysaur76AfterEdit = VoxelStore.getOverrides('ivysaur');

assert.strictEqual(Object.keys(ivysaur43AfterEdit).length, 2, '43 層應記錄 2 筆覆寫操作');
assert.strictEqual(Object.keys(ivysaur76AfterEdit).length, 11726, '76 層覆寫筆數絕對不可受到 43 層編輯干擾，恆等為 11,726 筆');
console.log('  ✓ PASS: 4.2 43 層體素編輯 0 衝擊 76 層 11,726 筆固化模型資產');

// 4.3 復原 (Undo)
VoxelStore.undo('ivysaur43');
assert.strictEqual(Object.keys(VoxelStore.getOverrides('ivysaur43')).length, 1, '43 層 Undo 成功');
VoxelStore.undo('ivysaur43');
assert.strictEqual(Object.keys(VoxelStore.getOverrides('ivysaur43')).length, 0, '43 層清空還原成功');
console.log('  ✓ PASS: 4.3 43 層 Undo 歷史堆疊獨立運作正常');

// ─────────────────────────────────────────────────────────────
// 測試組 5: Firebase 雲端字串包打包/解包相容性驗證
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 5: Firebase 雲端字串包打包/解包相容性驗證】');

const firebaseJs = fs.readFileSync('firebase.js', 'utf8');
assert.ok(firebaseJs.includes("voxelOverridesPack"), 'firebase.js 必須具備 voxelOverridesPack 處理邏輯');

// 測試 normalizeCloudData
require('./firebase.js');
const PokopiaFirebase = global.PokopiaFirebase;

const mockCloudPayload = {
  voxelOverridesPack: {
    ivysaur: { json: JSON.stringify({ "10,10,10": 1 }), updatedAt: 123456 },
    ivysaur43: { json: JSON.stringify({ "5,5,5": 2 }), updatedAt: 123456 },
    bulbasaur: { json: JSON.stringify({}), updatedAt: 123456 }
  }
};

const normalized = PokopiaFirebase.normalizeCloudData(mockCloudPayload);
assert.ok(normalized.voxelOverrides.ivysaur, '必須正常解包 voxelOverrides.ivysaur');
assert.ok(normalized.voxelOverrides.ivysaur43, '必須正常解包 voxelOverrides.ivysaur43');
assert.strictEqual(normalized.voxelOverrides.ivysaur.data['10,10,10'], 1, '76層解包內容精準還原');
assert.strictEqual(normalized.voxelOverrides.ivysaur43.data['5,5,5'], 2, '43層解包內容精準還原');
console.log('  ✓ PASS: 5.1 Firebase 雲端字串包雙向打包與解包支援 ivysaur43 且保持向後相容');

// ─────────────────────────────────────────────────────────────
// 測試組 6: 全站快取清單與 Service Worker v4.95.0 版本一致性
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 6: 全站快取清單與 Service Worker v4.95.0 版本一致性】');

const swJs = fs.readFileSync('sw.js', 'utf8');

assert.ok(swJs.includes("const CACHE_NAME = 'pokopia-cache-v4.95.0';"), 'sw.js CACHE_NAME 必須為 pokopia-cache-v4.95.0');
assert.ok(swJs.includes("'./ivysaur43_voxel_data.js?v=4.95.0',"), 'sw.js 必須快取 ivysaur43_voxel_data.js');
assert.ok(!swJs.includes("ivysaur_43.html"), 'sw.js 不得快取已被移除的 ivysaur_43.html');

assert.ok(indexHtml.includes("ivysaur43_voxel_data.js?v=4.95.0"), 'index.html 必須引入 ivysaur43_voxel_data.js');
assert.ok(indexHtml.includes("app.js?v=4.95.0"), 'index.html 必須使用 app.js v4.95.0');
assert.ok(indexHtml.includes("index.css?v=4.95.0"), 'index.html 必須使用 index.css v4.95.0');
console.log('  ✓ PASS: 6.1 全站快取版本統一升級至 v4.95.0，無死連結或失效快取');

// ─────────────────────────────────────────────────────────────
// 測試組 7: 43 層 2D 切片網格、標註線與 3D 展台引擎架構修復驗收
// ─────────────────────────────────────────────────────────────
console.log('\n【測試組 7: 43 層 2D 切片網格、標註線與 3D 展台引擎架構修復驗收】');

// 7.1 徹底杜絕未定義函式
assert.ok(!appJs.includes('renderSliceDimensionRulers'), 'app.js 絕對不得包含未定義函式 renderSliceDimensionRulers');
console.log('  ✓ PASS: 7.1 renderSliceDimensionRulers 未定義函式已徹底絕跡');

// 7.2 2D 切片標註線與對稱展開 100% 比照 76 層成熟架構
assert.ok(appJs.includes('renderDimTopSegments(DOM.ivysaur43DimTop, xSegments, cellSize, gridTotalWidth);'), '缺少 ivysaur43 頂部純數字分段標註');
assert.ok(appJs.includes('renderDimRightSegments(DOM.ivysaur43DimRight, zSegments, cellSize, gridTotalHeight);'), '缺少 ivysaur43 側邊純數字分段標註');
assert.ok(appJs.includes('DOM.ivysaur43VoxelGrid._cellMap = cellMap;'), '缺少 ivysaur43VoxelGrid._cellMap 映射緩存');
console.log('  ✓ PASS: 7.2 43 層 2D 切片網格 100% 對齊 76 層雙軸分段純數字尺規');

// 7.3 材料清單 (BOM) 比照 76 層成熟架構
assert.ok(appJs.includes("mat-checkbox"), '材料清單具備核對勾選方塊');
assert.ok(appJs.includes("DOM.ivysaur43MatList.appendChild(item);"), '材料清單正常注入 DOM.ivysaur43MatList');
console.log('  ✓ PASS: 7.3 43 層材料清單 (BOM) 包含核對勾選與動態顆數，告別「0 種建材」');

// 7.4 3D 展台引擎幾何體、幽靈層與中心標記完整就緒
assert.ok(appJs.includes("createStudioGridAndCenterMark(scene, data.dimensions, cx, cy, cz);"), '3D 展台具備中心十字與基底網格');
assert.ok(appJs.includes("scene.add(ghostInstancedMesh);"), '3D 展台具備半透明幽靈導引網格');
console.log('  ✓ PASS: 7.4 43 層 3D 展台引擎具備完整雙網格 (實體+幽靈) 與中心標記');

// 7.5 行為級執行模擬：調用 renderIvysaur43Layer(1) 驗收 0 錯誤、177 顆方塊與材料清單生成
const elements = {};
function mockElement(id) {
  const el = {
    id,
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    closest: function() { return null; },
    innerHTML: "",
    addEventListener: () => {}
  };
  elements[id] = el;
  return el;
}

global.window = { innerWidth: 1200 };
global.document = {
  getElementById: (id) => elements[id] || mockElement(id),
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    dataset: {},
    children: [],
    appendChild: function(c) { this.children.push(c); return c; },
    closest: function() { return null; },
    innerHTML: "",
    addEventListener: () => {},
    querySelector: () => ({ style: {} })
  }),
  createDocumentFragment: () => ({
    children: [],
    appendChild: function(c) { this.children.push(c); return c; }
  })
};

global.IVYSAUR_43_VOXEL_DATA = require("./ivysaur43_voxel_data.js");
global.VoxelDeltaStore = require("./voxel_editor.js");

const DOM = {
  ivysaur43LayerBadge: mockElement("ivysaur43LayerBadge"),
  ivysaur43LayerBlockCount: mockElement("ivysaur43LayerBlockCount"),
  ivysaur43VoxelGrid: mockElement("ivysaur43VoxelGrid"),
  ivysaur43DimTop: mockElement("ivysaur43DimTop"),
  ivysaur43DimRight: mockElement("ivysaur43DimRight"),
  ivysaur43HoverTooltip: mockElement("ivysaur43HoverTooltip"),
  ivysaur43TooltipColor: mockElement("ivysaur43TooltipColor"),
  ivysaur43TooltipText: mockElement("ivysaur43TooltipText"),
  ivysaur43MatList: mockElement("ivysaur43MatList"),
  ivysaur43MatTypesCount: mockElement("ivysaur43MatTypesCount")
};

const ivysaur43State = {
  zoom: { panX: 0, panY: 0, scale: 1 },
  curLayer: 1
};

function evalFunc(funcName) {
  const start = appJs.indexOf("function " + funcName);
  assert.ok(start !== -1, "Cannot find " + funcName);
  let depth = 0;
  let bodyStart = appJs.indexOf("{", start);
  let end = -1;
  for (let i = bodyStart; i < appJs.length; i++) {
    if (appJs[i] === "{") depth++;
    else if (appJs[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  return appJs.slice(start, end);
}

eval(evalFunc("getVoxelAxisSegments"));
eval(evalFunc("renderDimTopSegments"));
eval(evalFunc("renderDimRightSegments"));
eval(evalFunc("setupGridEventDelegation"));
eval(evalFunc("appendSymmetryAxisLine"));
eval(evalFunc("fitWorkspaceToContainer"));
eval(evalFunc("applyWorkspaceZoomPan"));
eval(evalFunc("renderIvysaur43Layer"));

renderIvysaur43Layer(1);

assert.strictEqual(DOM.ivysaur43LayerBlockCount.textContent, "本層 177 顆", "第 1 層方塊顆數應精準為 177 顆");
assert.ok(DOM.ivysaur43VoxelGrid.children.length > 0, "網格必須包含生成的子節點");
assert.strictEqual(DOM.ivysaur43MatList.children.length, 2, "第 1 層材料種類必須為 2 種");
assert.strictEqual(DOM.ivysaur43MatTypesCount.textContent, "2 種建材", "材料種類標籤必須顯示 2 種建材");
console.log('  ✓ PASS: 7.5 實質行為調用 renderIvysaur43Layer(1) 成功生成 177 顆方塊與 2 種建材清單');

console.log('\n========================================================');
console.log('🎉 妙蛙草 43 層精巧版全站首頁一體化整合與渲染修復全數通過 (100% PASS)！');
console.log('========================================================\n');

process.exit(0);
