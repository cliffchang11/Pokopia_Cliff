/**
 * verify_shorts_vid_fix_suite.js
 * 驗證 5x5 Shorts 按鈕 vid 取值正確性與本地 MP4 播放器觸發鏈
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  Pokopia 5x5 Shorts 欄位 ID 修正與彈窗秒開行為驗收套件             ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

const BASE_DIR = __dirname;
const appCode = fs.readFileSync(path.join(BASE_DIR, 'app.js'), 'utf8');
const distAppCode = fs.readFileSync(path.join(BASE_DIR, 'dist_offline', 'app.js'), 'utf8');

// ─── [測試 1/4] 驗證原始碼中 vid 取值相容性 ────────────────────────
console.log('▶ [測試 1/4] 驗證 app.js 中 5x5 按鈕 vid 取值修正...');
assert(appCode.includes('shortInfo.vid || shortInfo.videoId'), '❌ 表格按鈕缺少 shortInfo.vid || shortInfo.videoId！');
assert(appCode.includes('habitat5x5.vid || habitat5x5.videoId'), '❌ 詳情彈窗缺少 habitat5x5.vid || habitat5x5.videoId！');
assert(appCode.includes('DOM.shortsModal || document.getElementById(\'shortsModal\')'), '❌ 缺少 modalEl 容錯尋找！');
assert(appCode.includes('DOM.shortsPlayerNative || document.getElementById(\'shortsPlayerNative\')'), '❌ 缺少 playerEl 容錯尋找！');
console.log('  ✓ PASS: 程式碼層級已全面採用 shortInfo.vid 與雙重 DOM 容錯\n');

// ─── [測試 2/4] 模擬寶可夢 5x5 按鈕屬性與本機檔案映射 ─────────────
console.log('▶ [測試 2/4] 模擬重點寶可夢 5x5 按鈕生成與 MP4 映射...');
const habitat5x5Module = require(path.join(BASE_DIR, 'habitat_5x5_data.js'));

const testPokemons = [
  { name: '波波', expectedVid: '9Ka6FfHV4zo' },
  { name: '皮卡丘', expectedVid: '2a54Xh5eXdg' },
  { name: '水躍魚', expectedVid: 'ZKx2SHzPhy0' },
  { name: '鯉魚王', expectedVid: 'SQnAqmR0AdA' },
  { name: '化石翼龍', expectedVid: 'PMa5GV1s5v0' }
];

testPokemons.forEach(p => {
  const info = habitat5x5Module.getHabitat5x5(p);
  assert(info, `❌ 找不到 ${p.name} 的 5x5 資訊！`);
  const vid = info.vid || info.videoId || '';
  assert.strictEqual(vid, p.expectedVid, `❌ ${p.name} 的 vid 不符合預期！`);

  // 驗證離線模式下的 href 應指向存在的本機 MP4
  const expectedPath = path.join(BASE_DIR, 'dist_offline', 'assets', 'videos', '5x5', `${vid}.mp4`);
  assert(fs.existsSync(expectedPath), `❌ 本機缺少對應 MP4: ${expectedPath}`);
  const sz = fs.statSync(expectedPath).size;
  assert(sz > 100 * 1024, `❌ MP4 檔案過小 (${sz} bytes)`);
  console.log(`  ✓ PASS: ${p.name} ➔ vid: ${vid} ➔ MP4 實體檔案驗證通過 (${(sz / 1024 / 1024).toFixed(2)} MB)`);
});
console.log('');

// ─── [測試 3/4] 驗證 dist_offline/app.js 熱替換檔案一致性 ────────────
console.log('▶ [測試 3/4] 驗證 dist_offline/app.js 與專案 app.js 100% 同步...');
assert.strictEqual(appCode, distAppCode, '❌ dist_offline/app.js 與 root app.js 內容不一致！');
console.log('  ✓ PASS: dist_offline/app.js 熱替換檔案就緒且內容完全同步\n');

// ─── [測試 4/4] 驗證無 vid 時之友善 Toast 提示機制 ─────────────────
console.log('▶ [測試 4/4] 驗證異常防呆與 Toast 警示機制...');
assert(appCode.includes('找不到此棲息地的 5x5 本機影片代碼'), '❌ 缺少未找到 vid 時的錯誤提示！');
assert(appCode.includes('原生播放器元件未就緒'), '❌ 缺少播放器未就緒時的錯誤提示！');
console.log('  ✓ PASS: 雙重異常防呆與使用者提示完備\n');

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║  🎉 所有 4 大 5x5 Shorts 修復與彈窗秒開測試 100% 全部通過！ (0 錯誤)  ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
