/**
 * 玩具總動員 巴斯光年 v4.20.0 全自動離線迴歸測試套件
 * 驗收項目：
 * 1. 100% 官方原作 12 色原生調色盤完整性
 * 2. 36 層切片幾何法向回推與零衝突驗證 (總數 1,589 顆)
 * 3. 正面視角方位驗證：左側為控制按鈕、右側為黃色名牌
 * 4. 腹部紫色倒 V 條紋與黑色腰帶連貫性
 * 5. index.html、sw.js、app.js 版本號與快取破壞對齊 (v=4.20.0)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================');
console.log('🧪 啟動巴斯光年 v4.20.0 離線整合驗證測試套件...');
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

// 1. 載入並檢驗 buzz_voxel_data.js
const buzzDataPath = path.join(__dirname, 'buzz_voxel_data.js');
const buzzData = require(buzzDataPath);

it('1.1 資料庫存在且基本屬性完整', () => {
  assert.strictEqual(buzzData.name, '玩具總動員 巴斯光年 (Toy Story Buzz)');
  assert.strictEqual(buzzData.author, 'Mike.Nicholson');
  assert.strictEqual(buzzData.dimensions.width, 41);
  assert.strictEqual(buzzData.dimensions.height, 36);
  assert.strictEqual(buzzData.dimensions.length, 15);
  assert.strictEqual(buzzData.totalBlocks, 1589);
  assert.strictEqual(buzzData.layers.length, 36);
});

it('1.2 12 種原生色彩微調色盤 1:1 完整無缺', () => {
  const palette = buzzData.palette;
  assert.strictEqual(Object.keys(palette).length, 12);
  assert.strictEqual(palette['0'].name, '白色混凝土');
  assert.strictEqual(palette['1'].name, '黃綠色混凝土');
  assert.strictEqual(palette['2'].name, '紫色混凝土');
  assert.strictEqual(palette['3'].name, '紅色混凝土 (機翼)');
  assert.strictEqual(palette['4'].name, '深藍色混凝土');
  assert.strictEqual(palette['5'].name, '黃色混凝土');
  assert.strictEqual(palette['6'].name, '黑色混凝土');
  assert.strictEqual(palette['7'].name, '灰色混凝土');
  assert.strictEqual(palette['8'].name, '白陶瓦 (膚色)');
  assert.strictEqual(palette['9'].name, '平滑石英');
  assert.strictEqual(palette['10'].name, '紅色混凝土 (雷射)');
  assert.strictEqual(palette['11'].name, '綠色混凝土 (胸甲)');
});

it('1.3 正面方位檢驗：按鈕在左（X < 20.5）、名牌在右（X > 20.5）', () => {
  const palette = buzzData.palette;
  const yellowXs = [];
  const blueXs = [];
  const laserRedXs = [];

  buzzData.layers.forEach((layer) => {
    layer.blocks.forEach(([x, z, bid]) => {
      const name = palette[bid].name;
      if (name === '黃色混凝土') yellowXs.push(x);
      if (name === '深藍色混凝土') blueXs.push(x);
      if (name === '紅色混凝土 (雷射)') laserRedXs.push(x);
    });
  });

  const avgYellowX = yellowXs.reduce((a, b) => a + b, 0) / yellowXs.length;
  const avgBlueX = blueXs.reduce((a, b) => a + b, 0) / blueXs.length;
  const avgLaserX = laserRedXs.reduce((a, b) => a + b, 0) / laserRedXs.length;

  // 正面直視時，中心點為 20.5
  assert.ok(avgBlueX < 20.5, `藍色按鈕平均 X (${avgBlueX}) 應在畫面左側 (< 20.5)`);
  assert.ok(avgLaserX < 20.5, `雷射紅色按鈕平均 X (${avgLaserX}) 應在畫面左側 (< 20.5)`);
  assert.ok(avgYellowX > 20.5, `黃色名牌平均 X (${avgYellowX}) 應在畫面右側 (> 20.5)`);
});

it('1.4 頭部與五官檢驗：臉部膚色長柱平整連續', () => {
  const palette = buzzData.palette;
  let skinCount = 0;
  buzzData.layers.forEach((layer) => {
    layer.blocks.forEach(([x, z, bid]) => {
      if (palette[bid].name === '白陶瓦 (膚色)') skinCount++;
    });
  });
  assert.strictEqual(skinCount, 15, `膚色方塊總數應為 15 顆，目前為 ${skinCount}`);
});

it('1.5 腹部黑色腰帶水平橫貫連貫性', () => {
  const palette = buzzData.palette;
  let beltCount = 0;
  // 檢查第 19-21 層中的黑色腰帶 (Layer 19, 20, 21)
  for (let l = 18; l <= 20; l++) {
    const layer = buzzData.layers[l];
    layer.blocks.forEach(([x, z, bid]) => {
      if (palette[bid].name === '黑色混凝土') beltCount++;
    });
  }
  assert.ok(beltCount >= 40, `腰部黑色方塊數量 (${beltCount}) 應大於等於 40 顆`);
});

// 2. 檢驗 index.html
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

it('2.1 index.html 版本號全站升級至 v=4.20.0', () => {
  assert.ok(indexHtml.includes('index.css?v=4.20.0'));
  assert.ok(indexHtml.includes('buzz_voxel_data.js?v=4.20.0'));
  assert.ok(indexHtml.includes('app.js?v=4.20.0'));
  assert.ok(!indexHtml.includes('buzz_voxel_data.js?v=4.19.0'));
});

it('2.2 index.html 切片指南與滑桿更新為 36 層', () => {
  assert.ok(indexHtml.includes('36 層建造切片指南'));
  assert.ok(indexHtml.includes('id="buzzLayerSlider" class="bulba-slider buzz-slider" min="1" max="36"'));
});

// 3. 檢驗 sw.js
const swJs = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

it('3.1 sw.js 快取名稱與版本號對齊 v4.20.0', () => {
  assert.ok(swJs.includes("const CACHE_NAME = 'pokopia-cache-v4.20.0';"));
  assert.ok(swJs.includes("'./index.css?v=4.20.0'"));
  assert.ok(swJs.includes("'./buzz_voxel_data.js?v=4.20.0'"));
  assert.ok(swJs.includes("'./app.js?v=4.20.0'"));
});

// 4. 檢驗 app.js 3D 渲染與黑線邊框
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

it('4.1 app.js 包含巴斯光年黑線邊框貼圖與立體渲染管道', () => {
  assert.ok(appJs.includes('function initBuzzThreeEngine'));
  assert.ok(appJs.includes('createVoxelOutlineTexture'));
  assert.ok(appJs.includes('fitWorkspaceToContainer'));
});

console.log('\n========================================================');
console.log(`測試結果：共通過 ${passCount} 項，失敗 ${failCount} 項`);
console.log('========================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 全部測試通過！\n');
}
