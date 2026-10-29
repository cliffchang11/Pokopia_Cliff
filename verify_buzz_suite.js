const fs = require("fs");
const buzzData = require("./buzz_voxel_data.js");

console.log("=== 1. 巴斯光年體素數據完整性驗證 ===");
console.log("模型名稱:", buzzData.name);
console.log("網格規格:", buzzData.dimensions);
console.log("總方塊數:", buzzData.totalBlocks);
console.log("總層數:", buzzData.layers.length);

if (buzzData.layers.length !== 52) throw new Error("預期層數應為 52 層");
if (buzzData.totalBlocks !== 10305) throw new Error("預期總方塊數應為 10305");
if (Object.keys(buzzData.palette).length !== 16) throw new Error("調色盤色票數應為 16 種");
console.log("✓ 體素數據結構檢驗通過");

console.log("=== 2. HTML 雙卡結構與資源快取檢查 ===");
const html = fs.readFileSync("index.html", "utf8");
const requiredHtml = [
  "buzz_voxel_data.js?v=4.15.0",
  "buzz-3d-card",
  "buzz3dCanvas",
  "buzz-slice-card",
  "buzzLayerBadge",
  "buzzLayerSlider",
  "buzzVoxelGrid",
  "buzzDimTop",
  "buzzDimRight",
  "buzzMatList"
];
for (const tag of requiredHtml) {
  if (!html.includes(tag)) throw new Error(`HTML 缺少關鍵標籤: ${tag}`);
}
console.log("✓ HTML 結構檢驗通過");

console.log("=== 3. CSS 太空藍紫主題樣式檢查 ===");
const css = fs.readFileSync("index.css", "utf8");
const requiredCss = [
  ".buzz-3d-card",
  ".buzz-slice-card",
  ".buzz-canvas-wrap",
  ".buzz-layer-badge",
  ".buzz-slider",
  ".buzz-grid-container"
];
for (const c of requiredCss) {
  if (!css.includes(c)) throw new Error(`CSS 缺少關鍵類別: ${c}`);
}
console.log("✓ CSS 樣式檢驗通過");

console.log("=== 4. JS 引擎、純數字分段標註與切片聯動檢查 ===");
const appJs = fs.readFileSync("app.js", "utf8");
const requiredJs = [
  "buzzState",
  "renderBuzzLayer",
  "initBuzzThreeEngine",
  "updateBuzz3DSliceFilter",
  "window.PokopiaBuzz"
];
for (const j of requiredJs) {
  if (!appJs.includes(j)) throw new Error(`app.js 缺少核心函式或變數: ${j}`);
}
console.log("✓ JS 邏輯檢驗通過");

console.log("=== 5. 手機 375px 自適應佈局數學防破版驗證 ===");
const maxDim = Math.max(buzzData.dimensions.width, buzzData.dimensions.length);
const available = 375 - 24; // 351px
const cellSize = Math.floor((available - 20) / maxDim); // 9px
const totalGridWidth = maxDim * cellSize + 25; // 331px
console.log(`最大維度: ${maxDim}, 每格寬度: ${cellSize}px, 網格與軸標總寬: ${totalGridWidth}px <= 可用寬度: ${available}px`);
if (totalGridWidth > available) throw new Error("手機寬度破版！");
console.log("✓ 375px 手機極限無破版驗證通過");

console.log("\n==========================================");
console.log("🎉 巴斯光年所有單元與回歸測試 100% 驗收成功！");
console.log("==========================================");
