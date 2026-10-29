// verify_buzz_v2_suite.js
// 巴斯光年 1:1 極致對齊 (展開紅白機翼、散熱器條紋、灰色領圈、動態緊縮邊界) 離線單元測試

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🚀 開始執行巴斯光年 1:1 精準對齊離線單元測試...');

// 1. 驗證 buzz_voxel_data.js
const buzzData = require('./buzz_voxel_data.js');
assert.strictEqual(buzzData.layers.length, 52, '層數應為 52 層');
assert.strictEqual(buzzData.totalBlocks, 8933, '總方塊數應為 8,933 顆');
assert.strictEqual(buzzData.dimensions.width, 35, '寬度應為 35');
assert.strictEqual(buzzData.dimensions.height, 52, '高度應為 52');
assert.strictEqual(buzzData.dimensions.length, 24, '長度應為 24');
console.log('✓ 1. buzz_voxel_data.js 基礎幾何與層數檢驗通過！');

// 2. 驗證展開的紅白機翼 (第 35 ~ 41 層)
let hasLeftWing = false;
let hasRightWing = false;
let hasRedStripe = false;
let hasWhiteStripe = false;
let hasWingTipGreen = false;
let hasWingTipPurple = false;

for (let i = 34; i <= 41; i++) {
  const layer = buzzData.layers[i];
  layer.blocks.forEach(([x, z, bid]) => {
    if (x <= 3) {
      hasLeftWing = true;
      if (bid === 1) hasWingTipGreen = true;
    }
    if (x >= 32) {
      hasRightWing = true;
      if (bid === 3) hasWingTipPurple = true;
    }
    if (bid === 5) hasRedStripe = true;
    if (bid === 0) hasWhiteStripe = true;
  });
}
assert.ok(hasLeftWing && hasRightWing, '機翼必須向左右兩側充分展開');
assert.ok(hasRedStripe && hasWhiteStripe, '機翼必須包含紅白相間條紋');
assert.ok(hasWingTipGreen && hasWingTipPurple, '機翼兩端必須包含綠色與紫色指示燈');
console.log('✓ 2. 展開紅白機翼與翼尖信號燈特徵檢驗通過！');

// 3. 驗證立體散熱器 (Radiator) 垂直條紋 (第 5 ~ 20 層，背牆 Z 座標處)
let hasRadiatorWhite = false;
let hasRadiatorLightGray = false;
for (let i = 4; i <= 19; i++) {
  const layer = buzzData.layers[i];
  layer.blocks.forEach(([x, z, bid]) => {
    if (z >= 20) {
      if (bid === 0) hasRadiatorWhite = true;
      if (bid === 11) hasRadiatorLightGray = true;
    }
  });
}
assert.ok(hasRadiatorWhite && hasRadiatorLightGray, '散熱器必須具備純白與淺灰交替條紋');
console.log('✓ 3. 立體白色散熱器垂直柵條紋檢驗通過！');

// 4. 驗證灰色八邊形圓環領圈 (第 40 ~ 41 層)
let hasCollarRing = false;
for (let i = 39; i <= 41; i++) {
  const layer = buzzData.layers[i];
  layer.blocks.forEach(([x, z, bid]) => {
    if (bid === 10) hasCollarRing = true;
  });
}
assert.ok(hasCollarRing, '必須包含灰色正八邊形/圓環太空衣領圈');
console.log('✓ 4. 灰色圓環太空衣領圈檢驗通過！');

// 5. 驗證 index.html 與 index.css 關鍵標籤與樣式
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.ok(htmlContent.includes('8,933 顆方塊'), 'index.html 應展示 8,933 顆方塊');
assert.ok(htmlContent.includes('上下左右 360° 拖曳旋轉'), 'index.html 應展示全角度拖曳提示');
assert.ok(htmlContent.includes('buzz_voxel_data.js?v=4.16.0'), 'index.html 應引用 4.16.0 版數據');

const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
assert.ok(cssContent.includes('touch-action: none;'), 'index.css 必須為 3D canvas 宣告 touch-action: none;');
assert.ok(cssContent.includes('cursor: grab;'), 'index.css 必須為 3D canvas 宣告 cursor: grab;');
console.log('✓ 5. index.html 與 index.css 關鍵規範檢驗通過！');

// 6. 模擬每層動態緊縮邊界
const legLayer = buzzData.layers[14]; // 第 15 層 (腿部)
let legMinX = Infinity, legMaxX = -Infinity;
legLayer.blocks.forEach(([x, z]) => {
  if (x < legMinX) legMinX = x;
  if (x > legMaxX) legMaxX = x;
});
const legSpanX = legMaxX - legMinX + 1;
// 腿部 spanX 應顯著小於全域寬度 42，證明下半身具備緊縮放大的空間
assert.ok(legSpanX <= 28, `腿部跨度 (${legSpanX}) 應緊縮於 28 方塊內`);
console.log(`✓ 6. 腿部層動態緊縮邊界檢驗通過 (跨度: ${legSpanX} 格，具備極佳放大空間)！`);

console.log('\n🎉 所有巴斯光年 1:1 極致升級單元測試全部 PASS！');
