/**
 * verify_buzz_lightyear.js
 * 離線自動化單元驗證腳本：巴斯光年 1×1×1 樂高立體雕塑逐層拼砌工作台
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('🚀 開始執行巴斯光年 1×1×1 工作台離線自動化檢驗...\n');

// -------------------------------------------------------------
// 測試項目 1：模型資料庫完整性驗證 (buzz_lightyear_data.js)
// -------------------------------------------------------------
console.log('📦 [測試項目 1] 驗證 buzz_lightyear_data.js 模型結構與色彩定義');
const buzzDataPath = path.join(__dirname, 'buzz_lightyear_data.js');
assert(fs.existsSync(buzzDataPath), 'buzz_lightyear_data.js 檔案存在');

const buzzDataContent = fs.readFileSync(buzzDataPath, 'utf8');
const sandbox = { window: {}, global: {} };
vm.createContext(sandbox);
vm.runInContext(buzzDataContent, sandbox);
const buzzData = sandbox.window.BUZZ_LIGHTYEAR_DATA || sandbox.global.BUZZ_LIGHTYEAR_DATA;

assert(!!buzzData, 'BUZZ_LIGHTYEAR_DATA 正確掛載於全域物件');
assert(buzzData.totalLayers === 75, `總層數為 75 層 (實際: ${buzzData.totalLayers})`);
assert(buzzData.totalBlocks === 13969, `總方塊數為 13,969 塊 (實際: ${buzzData.totalBlocks})`);
assert(Array.isArray(buzzData.layers) && buzzData.layers.length === 75, 'layers 陣列包含 75 層完整資料');

// 檢查 14 種中文色彩名稱，確保無工廠 #數字
const colors = buzzData.colors || {};
const colorKeys = Object.keys(colors);
assert(colorKeys.length === 14, `顏色表包含 14 種精準顏色 (實際: ${colorKeys.length} 種)`);

let hasFactoryCode = false;
let hasGreyJoint = false;
for (const [key, col] of Object.entries(colors)) {
  // 檢查是否有名稱含有工廠 #代碼 (如 #1, #24 等)
  if (/#\d+/.test(col.name)) {
    hasFactoryCode = true;
  }
  if (key === 'grey' && col.name === '水泥灰') {
    hasGreyJoint = true;
  }
}
assert(!hasFactoryCode, '所有顏色中文正名皆無工廠 #數字代碼');
assert(hasGreyJoint, '水泥灰 (灰色球型關節與轉軸) 正確定義');

// 檢查五大部位
const sections = buzzData.sections || [];
assert(sections.length === 5, `五大身體部位完整定義 (實際: ${sections.length} 個)`);
const sectionNames = sections.map(s => s.name);
assert(sectionNames.includes('雙腳鞋履基座') &&
       sectionNames.includes('腿部膝蓋關節') &&
       sectionNames.includes('腰帶軀幹腹甲') &&
       sectionNames.includes('太空胸甲手臂') &&
       sectionNames.includes('頭雕臉部背包'), '五大部位中文名稱完全符合規格要求');

// 檢查各層方塊座標均為整數 1x1x1
let allBlocksValid = true;
let totalCountSum = 0;
for (const l of buzzData.layers) {
  totalCountSum += (l.blockCount !== undefined ? l.blockCount : (l.blocks ? l.blocks.length : 0));
  for (const b of l.blocks) {
    if (!Number.isInteger(b.x) || !Number.isInteger(b.y) || !colors[b.c]) {
      allBlocksValid = false;
      break;
    }
  }
}
assert(totalCountSum === 13969, `逐層方塊加總精確吻合 13,969 塊 (實際: ${totalCountSum})`);
assert(allBlocksValid, '全部 13,969 塊方塊之 X、Y 座標均為合法整數且色彩代碼有效');

// -------------------------------------------------------------
// 測試項目 2：HTML 結構與 CSS 樣式完整性 (index.html, index.css)
// -------------------------------------------------------------
console.log('\n🎨 [測試項目 2] 驗證 index.html 元素與 index.css 樣式');
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const requiredIds = [
  'tabBuzz',
  'btnBuzzNav',
  'buzzSection',
  'buzzLockedBanner',
  'buzzBuilderContainer',
  'buzzSectionPills',
  'btnBuzzPrevLayer',
  'buzzLayerSlider',
  'buzzCurrentLayerNum',
  'buzzCurrentSectionName',
  'buzzCurrentLayerBlocks',
  'btnBuzzNextLayer',
  'buzzHoverInfo',
  'buzzCanvasWrapper',
  'buzzVoxelGrid',
  'tabBuzzLayerMaterials',
  'tabBuzzTotalMaterials',
  'buzzMaterialsBody'
];

let allIdsFound = true;
for (const id of requiredIds) {
  if (!htmlContent.includes(`id="${id}"`)) {
    console.error(`  缺少 ID: ${id}`);
    allIdsFound = false;
  }
}
assert(allIdsFound, `index.html 包含全部 ${requiredIds.length} 個必要 UI 控制項 ID`);
assert(htmlContent.includes('buzz_lightyear_data.js?v=4.14.0'), '正確引入 buzz_lightyear_data.js?v=4.14.0');
assert(htmlContent.includes('index.css?v=4.14.0'), 'index.css 快取版本更新為 v=4.14.0');
assert(htmlContent.includes('app.js?v=4.14.0'), 'app.js 快取版本更新為 v=4.14.0');

const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
assert(cssContent.includes('.buzz-section'), 'index.css 包含 .buzz-section 基礎樣式');
assert(cssContent.includes('.buzz-voxel-grid'), 'index.css 包含 .buzz-voxel-grid 網格視圖樣式');
assert(cssContent.includes('.buzz-mat-card'), 'index.css 包含 .buzz-mat-card 材料卡片樣式');

// -------------------------------------------------------------
// 測試項目 3：應用程式控制器與權限攔截 (app.js)
// -------------------------------------------------------------
console.log('\n🔒 [測試項目 3] 驗證 app.js 控制器邏輯與權限阻擋');
const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// 檢查 validTabs 是否包含 buzz
assert(appJsContent.includes("'buzz'"), "app.js 包含 'buzz' 分頁標識");
assert(appJsContent.includes("tab === 'buzz'") && appJsContent.includes("!isAutoFarmAuthorized()"),
  'switchTab 與 getInitialNavState 對未授權存取 buzz 設有安全攔截');
assert(appJsContent.includes('DOM.btnBuzzNav') && appJsContent.includes('DOM.tabBuzz'),
  'DOM 物件成功註冊 btnBuzzNav 與 tabBuzz 快取');
assert(appJsContent.includes('window.PokopiaBuzz = {'),
  'window.PokopiaBuzz 工作台 API 正確暴露');

// 檢查 app.js 語法合規無語法錯誤 (Syntax Check via Node.js vm)
let syntaxOk = true;
try {
  new vm.Script(appJsContent, { filename: 'app.js' });
} catch (e) {
  syntaxOk = false;
  console.error('app.js 語法錯誤:', e);
}
assert(syntaxOk, 'app.js 通過 Node.js 完整 AST 語法檢查，無任何 SyntaxError');

// -------------------------------------------------------------
// 測試總結
// -------------------------------------------------------------
console.log(`\n========================================`);
console.log(`檢驗結果：${passCount} 項通過，${failCount} 項失敗`);
console.log(`========================================\n`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 巴斯光年工作台所有驗證項目 100% 通過！');
}
