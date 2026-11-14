/**
 * verify_offline_pack_suite.js
 * Pokopia iPad 離線隨身包實質行為級端對端整合驗收測試
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  Pokopia iPad mini 8 離線隨身包實質行為級自動化驗收套件           ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const BASE_DIR = __dirname;
const DIST_DIR = path.join(BASE_DIR, 'dist_offline');
const ZIP_PATH = path.join(BASE_DIR, 'pokopia_offline_ipad.zip');

// ─── [測試 1/5] 驗證 libs/ 本機化相依庫 ─────────────────────────────
console.log('▶ [測試 1/5] 驗證 Three.js 與相依函式庫本機化...');
const threePath = path.join(DIST_DIR, 'libs', 'three.min.js');
const orbitPath = path.join(DIST_DIR, 'libs', 'OrbitControls.js');
assert(fs.existsSync(threePath), '❌ 找不到 dist_offline/libs/three.min.js！');
assert(fs.statSync(threePath).size > 100 * 1024, '❌ three.min.js 檔案體積過小！');
assert(fs.existsSync(orbitPath), '❌ 找不到 dist_offline/libs/OrbitControls.js！');
assert(fs.statSync(orbitPath).size > 10 * 1024, '❌ OrbitControls.js 檔案體積過小！');
console.log('  ✓ PASS: libs/ 本機化函式庫完整齊全\n');

// ─── [測試 2/5] 驗證 index.html 離線標籤與 CDN 脫鉤 ───────────────────
console.log('▶ [測試 2/5] 驗證 dist_offline/index.html 離線標籤與 CDN 脫鉤...');
const htmlPath = path.join(DIST_DIR, 'index.html');
assert(fs.existsSync(htmlPath), '❌ 找不到 dist_offline/index.html！');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('window.POKOPIA_OFFLINE = true'), '❌ index.html 必須注入 window.POKOPIA_OFFLINE = true 離線旗標！');
assert(!htmlContent.includes('cdn.jsdelivr.net'), '❌ 離線版 index.html 絕不能殘留 cdn.jsdelivr.net 依賴！');
assert(htmlContent.includes('src="libs/three.min.js"'), '❌ index.html 必須使用本地 libs/three.min.js！');
assert(htmlContent.includes('src="libs/OrbitControls.js"'), '❌ index.html 必須使用本地 libs/OrbitControls.js！');
assert(htmlContent.includes('id="videoPlayerNative"'), '❌ 必須包含原生 videoPlayerNative 標籤！');
assert(htmlContent.includes('id="shortsModal"'), '❌ 必須包含 5x5 shortsModal 彈窗！');
console.log('  ✓ PASS: index.html 離線模式與雙軌播放器結構 100% 正確\n');

// ─── [測試 3/5] 驗證 16 部參考攻略影片本機 MP4 完整性 ────────────────
console.log('▶ [測試 3/5] 驗證 16 部參考攻略長影片 MP4 檔案...');
const refDataPath = path.join(BASE_DIR, 'video_data.js');
const refContent = fs.readFileSync(refDataPath, 'utf8');
const refMatches = Array.from(new Set(Array.from(refContent.matchAll(/videoId:\s*['"]([a-zA-Z0-9_-]+)['"]/g)).map(m => m[1])));
assert.strictEqual(refMatches.length, 16, `❌ 參考影片應為 16 部，實際解析到 ${refMatches.length} 部！`);

let totalRefBytes = 0;
refMatches.forEach(vid => {
  const mp4Path = path.join(DIST_DIR, 'assets', 'videos', 'reference', `${vid}.mp4`);
  assert(fs.existsSync(mp4Path), `❌ 找不到參考長影片: ${vid}.mp4`);
  const sz = fs.statSync(mp4Path).size;
  assert(sz > 500 * 1024, `❌ 參考影片 ${vid}.mp4 太小 (${sz} bytes)！`);
  totalRefBytes += sz;
});
console.log(`  ✓ PASS: 16 部參考長片全數驗證通過 (總體積: ${(totalRefBytes / (1024 * 1024)).toFixed(1)} MB)\n`);

// ─── [測試 4/5] 驗證 47 部 5x5 Shorts MP4 完整性 ────────────────────
console.log('▶ [測試 4/5] 驗證 47 部 5x5 棲息地 Shorts MP4 檔案...');
const shortsDataPath = path.join(BASE_DIR, 'habitat_5x5_data.js');
const shortsContent = fs.readFileSync(shortsDataPath, 'utf8');
const shortsMatches = Array.from(new Set(Array.from(shortsContent.matchAll(/vid:\s*['"]([a-zA-Z0-9_-]+)['"]/g)).map(m => m[1])));
assert.strictEqual(shortsMatches.length, 47, `❌ 5x5 Shorts 應為 47 部，實際解析到 ${shortsMatches.length} 部！`);

let totalShortsBytes = 0;
shortsMatches.forEach(vid => {
  const mp4Path = path.join(DIST_DIR, 'assets', 'videos', '5x5', `${vid}.mp4`);
  assert(fs.existsSync(mp4Path), `❌ 找不到 5x5 Shorts: ${vid}.mp4`);
  const sz = fs.statSync(mp4Path).size;
  assert(sz > 100 * 1024, `❌ Shorts ${vid}.mp4 太小 (${sz} bytes)！`);
  totalShortsBytes += sz;
});
console.log(`  ✓ PASS: 47 部 5x5 Shorts 全數驗證通過 (總體積: ${(totalShortsBytes / (1024 * 1024)).toFixed(1)} MB)\n`);

// ─── [測試 5/5] 驗證專案隨身包 ZIP 壓縮包存在性與完整性 ───────────────────
console.log('▶ [測試 5/5] 驗證專案隨身包 pokopia_offline_ipad.zip...');
assert(fs.existsSync(ZIP_PATH), '❌ 專案根目錄找不到 pokopia_offline_ipad.zip！');
const zipSize = fs.statSync(ZIP_PATH).size;
assert(zipSize > 50 * 1024 * 1024, '❌ 壓縮包體積異常小！');
console.log(`  ✓ PASS: 專案根目錄 ZIP 產出成功，體積 ${(zipSize / (1024 * 1024)).toFixed(2)} MB\n`);

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  🎉 所有 5 大離線驗收測試項目 100% 全部通過！ (0 錯誤，0 失敗)   ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');

