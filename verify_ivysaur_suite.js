/**
 * 寶可夢 妙蛙草 (Ivysaur #002) v4.26.0 全自動離線驗證測試套件
 * 驗收標準：
 * 1. 體素資料庫 (ivysaur_voxel_data.js) 幾何完整性、76 層切片與 70,384 顆方塊精準對齊
 * 2. 高純度混凝土調色盤色碼與材質名稱完整性
 * 3. index.html 角色切換膠囊依寶可夢圖鑑序排列 (種子 → 妙蛙草 → 妙蛙花 → 巴斯光年)
 * 4. 妙蛙草 3D 方塊建造工作台 (#paneIvysaur) 與 76 層切片滑桿
 * 5. app.js 語法合規性、API 導出 (PokopiaIvysaur) 與分頁切換邏輯
 * 6. Service Worker (sw.js) 快取版本 (pokopia-cache-v4.26.0) 與靜態資源註冊完整性
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('🌿 啟動妙蛙草 (Ivysaur #002) v4.26.0 離線整合驗證測試套件...');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failCount++;
  }
}

// 1. 體素資料庫驗證
const ivysaurDataPath = path.join(__dirname, 'ivysaur_voxel_data.js');
const ivysaurData = require(ivysaurDataPath);

it('1.1 資料庫存在且基本屬性完整 (精準 76 層, 73,495 顆方塊)', () => {
  assert.strictEqual(ivysaurData.dimensions.height, 76);
  assert.strictEqual(ivysaurData.totalBlocks, 73495);
  assert.strictEqual(ivysaurData.layers.length, 76);
});

it('1.2 Minecraft 原生材質調色盤完整性 (青色主體、粉紅花苞、淺綠葉片、白爪齒、紅眼、黑瞳)', () => {
  const palette = ivysaurData.palette;
  assert.ok(palette['1'] && palette['1'].name === '青色混凝土');
  assert.ok(palette['3'] && palette['3'].name === '暗海晶石');
  assert.ok(palette['4'] && palette['4'].name === '粉紅色混凝土');
  assert.ok(palette['8'] && palette['8'].name === '淺綠色混凝土');
  assert.ok(palette['9'] && palette['9'].name === '綠色混凝土');
  assert.ok(palette['10'] && palette['10'].name === '白色混凝土');
  assert.ok(palette['11'] && palette['11'].name === '紅色混凝土');
  assert.ok(palette['12'] && palette['12'].name === '黑色混凝土');
});

it('1.3 76 層切片方塊計數與座標邊界合法性', () => {
  let computedTotal = 0;
  for (let l = 0; l < ivysaurData.layers.length; l++) {
    const layer = ivysaurData.layers[l];
    assert.strictEqual(layer.layerIndex, l + 1);
    computedTotal += layer.blocks.length;

    for (const b of layer.blocks) {
      const [x, z, mat] = b;
      assert.ok(x >= 1 && x <= ivysaurData.dimensions.width, `X 超出邊界: ${x}`);
      assert.ok(z >= 1 && z <= ivysaurData.dimensions.length, `Z 超出邊界: ${z}`);
      assert.ok(ivysaurData.palette[mat.toString()] !== undefined, `未定義材質: ${mat}`);
    }
  }
  assert.strictEqual(computedTotal, 73495);
  assert.strictEqual(computedTotal, ivysaurData.totalBlocks);
});

it('1.4 純淨角色本體：第 1 層爪尖貼地，無任何地表草皮方塊', () => {
  const layer1 = ivysaurData.layers[0];
  assert.ok(layer1.blocks.length > 0, 'Layer 1 應有方塊 (爪尖貼地)');
  // 確認第 1 層方塊均為角色足爪相關材料，絕無草皮泥土方塊
  const matKeys = Object.keys(layer1.materials);
  for (const k of matKeys) {
    const pinfo = ivysaurData.palette[k];
    assert.ok(pinfo, `未知材料 ID: ${k}`);
    assert.ok(!pinfo.key.includes('grass') && !pinfo.key.includes('dirt'), `第 1 層不應有草皮泥土: ${pinfo.key}`);
  }
});

// 2. index.html 結構驗證
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

it('2.1 角色切換膠囊列依照寶可夢圖鑑順序排列 (種子 → 妙蛙草 → 妙蛙花 → 巴斯光年)', () => {
  const bulbaIdx = htmlContent.indexOf('id="btnSubBulba"');
  const ivysaurIdx = htmlContent.indexOf('id="btnSubIvysaur"');
  const venusaurIdx = htmlContent.indexOf('id="btnSubVenusaur"');
  const buzzIdx = htmlContent.indexOf('id="btnSubBuzz"');

  assert.ok(bulbaIdx !== -1, '找不到 btnSubBulba');
  assert.ok(ivysaurIdx !== -1, '找不到 btnSubIvysaur');
  assert.ok(venusaurIdx !== -1, '找不到 btnSubVenusaur');
  assert.ok(buzzIdx !== -1, '找不到 btnSubBuzz');

  assert.ok(bulbaIdx < ivysaurIdx, '妙蛙草應排在妙蛙種子之後');
  assert.ok(ivysaurIdx < venusaurIdx, '妙蛙草應排在妙蛙花之前');
  assert.ok(venusaurIdx < buzzIdx, '妙蛙花應排在巴斯光年之前');
});

it('2.2 妙蛙草獨立工作台結構 (#paneIvysaur) 與 76 層標示完整', () => {
  assert.ok(htmlContent.includes('id="paneIvysaur"'));
  assert.ok(htmlContent.includes('id="ivysaur3dCanvas"'));
  assert.ok(htmlContent.includes('id="ivysaur3dIframeWrap"'));
  assert.ok(htmlContent.includes('id="ivysaurLayerSlider"'));
  assert.ok(htmlContent.includes('min="1" max="76"'));
  assert.ok(htmlContent.includes('76 層建造切片指南'));
  assert.ok(htmlContent.includes('id="ivysaurVoxelGrid"'));
  assert.ok(htmlContent.includes('id="ivysaurMatList"'));
});

it('2.3 index.html 正確引入 ivysaur_voxel_data.js 與最新版本號 (v4.26.0)', () => {
  assert.ok(htmlContent.includes('src="ivysaur_voxel_data.js?v=4.26.0"'));
  assert.ok(htmlContent.includes('src="venusaur_voxel_data.js?v=4.26.0"'));
  assert.ok(htmlContent.includes('src="app.js?v=4.26.0"'));
});

// 3. app.js 邏輯與 API 導出驗證
const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

it('3.1 app.js 包含 DOM.btnSubIvysaur 與 DOM.paneIvysaur 註冊', () => {
  assert.ok(appContent.includes('btnSubIvysaur: document.getElementById(\'btnSubIvysaur\')'));
  assert.ok(appContent.includes('paneIvysaur: document.getElementById(\'paneIvysaur\')'));
  assert.ok(appContent.includes('ivysaurLayerSlider: document.getElementById(\'ivysaurLayerSlider\')'));
  assert.ok(appContent.includes('ivysaurVoxelGrid: document.getElementById(\'ivysaurVoxelGrid\')'));
});

it('3.2 app.js 包含 switchCharacterBlueprint(\'ivysaur\') 與動態層切片徽章', () => {
  assert.ok(appContent.includes("char === 'ivysaur'"));
  assert.ok(appContent.includes("DOM.catalogBadgeIcon.textContent = '🌿'"));
  assert.ok(appContent.includes("${iLayers} 層切片"));
  assert.ok(appContent.includes("renderIvysaurLayer(ivysaurState.curLayer)"));
  assert.ok(appContent.includes("setTimeout(initIvysaurThreeEngine, 60)"));
});

it('3.3 app.js 導出 window.PokopiaIvysaur 且方法完整', () => {
  assert.ok(appContent.includes('window.PokopiaIvysaur = {'));
  assert.ok(appContent.includes('switchIvysaur3DMode'));
  assert.ok(appContent.includes('setIvysaurLayer'));
  assert.ok(appContent.includes('renderIvysaurLayer'));
  assert.ok(appContent.includes('initIvysaurThreeEngine'));
  assert.ok(appContent.includes('updateIvysaur3DSliceFilter'));
});

// 4. sw.js 快取版本驗證
const swPath = path.join(__dirname, 'sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');

it('4.1 sw.js 升級快取版本至 pokopia-cache-v4.26.0', () => {
  assert.ok(swContent.includes("const CACHE_NAME = 'pokopia-cache-v4.26.0';"));
});

it('4.2 sw.js 靜態資源包含 ivysaur_voxel_data.js?v=4.26.0', () => {
  assert.ok(swContent.includes("'./ivysaur_voxel_data.js?v=4.26.0'"));
  assert.ok(swContent.includes("'./venusaur_voxel_data.js?v=4.26.0'"));
  assert.ok(swContent.includes("'./app.js?v=4.26.0'"));
});

console.log('\n--------------------------------------------------------');
console.log(`驗證完成：${passCount} 項通過，${failCount} 項失敗。`);
console.log('--------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 妙蛙草 (Ivysaur #002) v4.26.0 全套驗收 100% PASS！');
}
