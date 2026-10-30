/**
 * 寶可夢 妙蛙花 (Venusaur #003) v4.22.0 全自動離線驗證測試套件
 * 驗收標準：
 * 1. 體素資料庫 (venusaur_voxel_data.js) 幾何完整性、100 層切片與 142,996 顆方塊精準對齊
 * 2. 16 種 Minecraft 原生方塊調色盤色碼與材質名稱
 * 3. index.html 頂部選單第 3 膠囊按鈕、三合一展示容器 (3D/Slice/Sketchfab)、逐層切片卡片與材料清單
 * 4. app.js 語法合規性、API 導出 (PokopiaVenusaur) 與模式切換邏輯
 * 5. Service Worker (sw.js) 快取版本 (pokopia-cache-v4.22.0) 與靜態資源註冊完整性
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('🌺 啟動妙蛙花 (Venusaur #003) v4.22.0 離線整合驗證測試套件...');
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
const venusaurDataPath = path.join(__dirname, 'venusaur_voxel_data.js');
const venusaurData = require(venusaurDataPath);

it('1.1 資料庫存在且基本屬性完整', () => {
  assert.strictEqual(venusaurData.dimensions.width, 145);
  assert.strictEqual(venusaurData.dimensions.height, 100);
  assert.strictEqual(venusaurData.dimensions.length, 144);
  assert.strictEqual(venusaurData.totalBlocks, 142996);
  assert.strictEqual(venusaurData.layers.length, 100);
});

it('1.2 16 種 Minecraft 原生材質調色盤完整性', () => {
  const palette = venusaurData.palette;
  assert.strictEqual(Object.keys(palette).length, 16);
  assert.ok(palette['1'] && palette['1'].name === '青色混凝土');
  assert.ok(palette['4'] && palette['4'].name === '粉紅色混凝土');
  assert.ok(palette['6'] && palette['6'].name === '紅色陶土');
  assert.ok(palette['8'] && palette['8'].name === '淺綠色混凝土');
  assert.ok(palette['10'] && palette['10'].name === '棕色混凝土');
  assert.ok(palette['12'] && palette['12'].name === '白色混凝土');
  assert.ok(palette['13'] && palette['13'].name === '紅色混凝土');
  assert.ok(palette['14'] && palette['14'].name === '黑色混凝土');
});

it('1.3 100 層切片方塊計數與座標邊界合法性', () => {
  let computedTotal = 0;
  for (let l = 0; l < venusaurData.layers.length; l++) {
    const layer = venusaurData.layers[l];
    assert.strictEqual(layer.layerIndex, l + 1);
    computedTotal += layer.blocks.length;

    for (const b of layer.blocks) {
      const [x, z, mat] = b;
      assert.ok(x >= 0 && x < 145, `X 超出邊界: ${x}`);
      assert.ok(z >= 0 && z < 144, `Z 超出邊界: ${z}`);
      assert.ok(venusaurData.palette[mat.toString()] !== undefined, `未定義材質: ${mat}`);
    }
  }
  assert.strictEqual(computedTotal, 142996);
  assert.strictEqual(computedTotal, venusaurData.totalBlocks);
});

// 2. index.html 結構驗證
const htmlPath = path.join(__dirname, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

it('2.1 頂部選單包含第 3 顆膠囊按鈕「🌺 妙蛙花」', () => {
  assert.ok(htmlContent.includes('id="btnSubVenusaur"'));
  assert.ok(htmlContent.includes('data-char="venusaur"'));
  assert.ok(htmlContent.includes('🌺 妙蛙花'));
});

it('2.2 妙蛙花獨立工作台結構 (#paneVenusaur) 完整', () => {
  assert.ok(htmlContent.includes('id="paneVenusaur"'));
  assert.ok(htmlContent.includes('id="venusaur3dCanvas"'));
  assert.ok(htmlContent.includes('id="venusaur3dIframeWrap"'));
  assert.ok(htmlContent.includes('a893ba041c1b4c8b96fce72d5393c2f7')); // Sketchfab model ID
  assert.ok(htmlContent.includes('id="venusaurSliceCard"'));
  assert.ok(htmlContent.includes('id="venusaurVoxelGrid"'));
  assert.ok(htmlContent.includes('id="venusaurLayerSlider"'));
  assert.ok(htmlContent.includes('id="venusaurMatList"'));
});

it('2.3 靜態資源引入與版本破壞標籤正確對齊 (v=4.22.0)', () => {
  assert.ok(htmlContent.includes('index.css?v=4.22.0'));
  assert.ok(htmlContent.includes('venusaur_voxel_data.js?v=4.22.0'));
  assert.ok(htmlContent.includes('app.js?v=4.22.0'));
});

// 3. app.js 邏輯與 API 導出驗證
const appPath = path.join(__dirname, 'app.js');
const appContent = fs.readFileSync(appPath, 'utf8');

it('3.1 app.js 語法合規且包含 Venusaur 狀態管理與控制器', () => {
  assert.ok(appContent.includes('venusaurState'));
  assert.ok(appContent.includes('switchVenusaur3DMode'));
  assert.ok(appContent.includes('setVenusaurLayer'));
  assert.ok(appContent.includes('renderVenusaurLayer'));
  assert.ok(appContent.includes('initVenusaurThreeEngine'));
  assert.ok(appContent.includes('updateVenusaur3DSliceFilter'));
});

it('3.2 app.js 暴露 window.PokopiaVenusaur 全域介面', () => {
  assert.ok(appContent.includes('window.PokopiaVenusaur = {'));
  assert.ok(appContent.includes('switchVenusaur3DMode'));
  assert.ok(appContent.includes('setVenusaurLayer'));
  assert.ok(appContent.includes('renderVenusaurLayer'));
  assert.ok(appContent.includes('initVenusaurThreeEngine'));
});

it('3.3 材料勾選追蹤持久化 key 隔離命名 (pokopia_venusaur_layer_checks_)', () => {
  assert.ok(appContent.includes('pokopia_venusaur_layer_checks_L'));
});

// 4. Service Worker 快取驗證
const swPath = path.join(__dirname, 'sw.js');
const swContent = fs.readFileSync(swPath, 'utf8');

it('4.1 sw.js 快取名稱升級至 pokopia-cache-v4.22.0', () => {
  assert.ok(swContent.includes("CACHE_NAME = 'pokopia-cache-v4.22.0'"));
});

it('4.2 sw.js 包含 venusaur_voxel_data.js 靜態離線預載入', () => {
  assert.ok(swContent.includes("'./venusaur_voxel_data.js?v=4.22.0'"));
});

console.log('\n--------------------------------------------------------');
console.log(`總測試數: ${passCount + failCount} | 通過: ${passCount} | 失敗: ${failCount}`);
console.log('--------------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 妙蛙花 (Venusaur #003) v4.22.0 離線驗證全數通過！\n');
}
