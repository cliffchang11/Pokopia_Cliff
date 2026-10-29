const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- 正在執行巴斯光年 v6 驗證套件：原作 1:1 原生調色盤、正向位置對齊與妙蛙種子同款黑邊 ---');

const buzzData = require('./buzz_voxel_data.js');
const cssContent = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf-8');
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
const jsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf-8');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf-8');

// 1. 檢驗 100% Mike.Nicholson 原生調色盤
assert.strictEqual(buzzData.palette[0].color, '#e6e6e6', 'Mat 0 需為原作太空裝原生純白 #e6e6e6');
assert.strictEqual(buzzData.palette[1].color, '#26b70a', 'Mat 1 需為原作巴斯萊姆綠 #26b70a');
assert.strictEqual(buzzData.palette[2].color, '#69438f', 'Mat 2 需為原作巴斯深紫 #69438f');
assert.strictEqual(buzzData.palette[3].color, '#b00000', 'Mat 3 需為原作按鈕/機翼紅 #b00000');
assert.strictEqual(buzzData.palette[4].color, '#497dff', 'Mat 4 需為原作胸前按鈕藍 #497dff');
assert.strictEqual(buzzData.palette[5].color, '#ffe818', 'Mat 5 需為原作胸前名牌黃 #ffe818');
assert.strictEqual(buzzData.palette[6].color, '#1d1d1d', 'Mat 6 需為原作腰帶關節黑 #1d1d1d');
assert.strictEqual(buzzData.palette[7].color, '#717171', 'Mat 7 需為原作關節灰 #717171');
assert.strictEqual(buzzData.palette[9].color, '#ffd2a3', 'Mat 9 需為原作五官膚質 #ffd2a3');
console.log('✅ 任務 1 通過：巴斯光年 100% Mike.Nicholson 官方原生 Hex 調色盤精準對齊，0 色差！');

// 2. 檢驗零件位置與正向視角對齊 (放對地方)
const yellowBadgeVoxels = [];
const blueButtonVoxels = [];
buzzData.layers.forEach((l) => {
  l.blocks.forEach(([x, z, bid]) => {
    if (bid === 5) yellowBadgeVoxels.push({ x, z, y: l.layerIndex });
    if (bid === 4) blueButtonVoxels.push({ x, z, y: l.layerIndex });
  });
});

const cx = buzzData.dimensions.width / 2;
const cz = buzzData.dimensions.length / 2;
const yellowMeanX = yellowBadgeVoxels.reduce((s, v) => s + v.x, 0) / yellowBadgeVoxels.length;
const blueMeanX = blueButtonVoxels.reduce((s, v) => s + v.x, 0) / blueButtonVoxels.length;
const yellowMeanZ = yellowBadgeVoxels.reduce((s, v) => s + v.z, 0) / yellowBadgeVoxels.length;

assert.ok(yellowMeanX > cx, `黃色名牌 X(${yellowMeanX}) 必須大於中央線(${cx})，顯示在畫面右胸`);
assert.ok(blueMeanX < cx, `藍色按鈕 X(${blueMeanX}) 必須小於中央線(${cx})，顯示在畫面左胸`);
assert.ok(yellowMeanZ > cz, `黃色名牌深度 Z(${yellowMeanZ}) 必須大於深度中央(${cz})，面向鏡頭正面`);
console.log('✅ 任務 2 通過：黃色名牌放於畫面右胸、紅藍按鈕放於畫面左胸，零件位置 100% 放對地方！');

// 3. 檢驗妙蛙種子同款黑線邊框 (createVoxelOutlineTexture)
const outlineUsage = jsContent.match(/map:\s*outlineTexture\s*\|\|\s*null/g);
assert.ok(outlineUsage && outlineUsage.length >= 2, '巴斯光年與妙蛙種子皆需套用 outlineTexture 黑色邊框貼圖');
const boxGeometry1Matches = jsContent.match(/BoxGeometry\(1,\s*1,\s*1\)/g);
assert.ok(boxGeometry1Matches && boxGeometry1Matches.length >= 2, '巴斯光年與妙蛙種子皆需採用 BoxGeometry(1, 1, 1) 緊貼積木規格');
console.log('✅ 任務 3 通過：妙蛙種子同款黑色立體邊框 (Cel-outline) 100% 成功掛載！');

// 4. 檢驗版本號升級與快取作廢
assert.ok(htmlContent.includes('?v=4.19.0'), 'index.html 需跳號至 ?v=4.19.0');
assert.ok(swContent.includes('pokopia-cache-v4.19.0'), 'sw.js 需升級至 pokopia-cache-v4.19.0');
console.log('✅ 任務 4 通過：全站版本號與 Service Worker 100% 跳號升級至 v4.19.0！');

console.log('🎉 所有驗收指標 100% 完美通過！');
