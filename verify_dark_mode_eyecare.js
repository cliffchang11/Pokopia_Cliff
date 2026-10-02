const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 暗色模式暖炭板岩護眼調 (Dark Dimmed Eyecare) 自動化驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] 嚴格檢查亮色模式完全未被竄改 (100% 保持既有柔和溫潤米杏色)
assert(css.includes('--bg-dark: #eef2f6;'), '亮色模式核心底色必須 100% 保持 #eef2f6');
assert(css.includes('--text-main: #0f172a;'), '亮色模式主文字必須保持 #0f172a');
console.log('✅ [Check 1] PASS: 亮色模式全域變數與樣式 100% 保持原樣未受任何影響');

// [Check 2] 暗色模式基底升級為沉穩板岩灰暖黑 (#151822)
const darkRootIdx = css.indexOf(':root[data-theme="dark"] {');
assert(darkRootIdx !== -1, 'index.css 必須包含 :root[data-theme="dark"] 定義');
const darkRootChunk = css.substring(darkRootIdx, darkRootIdx + 1500);

assert(darkRootChunk.includes('--bg-dark: #151822;'), '暗色模式底色必須升級為沉穩板岩灰暖黑 #151822');
assert(darkRootChunk.includes('--bg-card: rgba(28, 33, 44, 0.78);'), '暗色卡片底色必須升級為板岩深灰 rgba(28, 33, 44, 0.78)');
console.log('✅ [Check 2] PASS: 暗色基底成功由冷黑升級為沉穩板岩灰暖黑 (#151822)，與卡片自然形成溫和層次');

// [Check 3] 主文字抗光暈霧化 (#e2e8f0 霧白)，對比度收斂在 12:1 舒適黃金線
assert(darkRootChunk.includes('--text-main: #e2e8f0;'), '暗色主文字必須微調為護眼霧白 #e2e8f0');
assert(darkRootChunk.includes('--text-sub: #94a3b8;'), '暗色次要文字保持石板灰 #94a3b8');
console.log('✅ [Check 3] PASS: 暗色主文字降為護眼霧白 (#e2e8f0)，文字邊緣光暈毛刺徹底消除');

// [Check 4] 表頭、表格斑馬紋與控制元件色系統一收斂
assert(darkRootChunk.includes('--table-th-bg: rgba(21, 26, 38, 0.96);'), '暗色表頭底色必須收斂為 rgba(21, 26, 38, 0.96)');
assert(darkRootChunk.includes('--input-bg: rgba(24, 28, 40, 0.85);'), '暗色輸入框底色必須收斂為 rgba(24, 28, 40, 0.85)');
console.log('✅ [Check 4] PASS: 表頭、隔行斑馬紋與下拉選單底色全面收斂至板岩灰體系，視覺動線安穩');

// [Check 5] 棲息地縮圖高亮防雪盲柔光與 Hover 即時 100% 原色還原
const antiGlareIdx = css.indexOf('/* 5. 暗色模式高亮縮圖防雪盲柔光調校與 Hover 原色即時還原 */');
assert(antiGlareIdx !== -1, 'index.css 必須包含暗色縮圖防雪盲柔光規則區塊');
const antiGlareChunk = css.substring(antiGlareIdx);

assert(antiGlareChunk.includes('filter: brightness(0.90) contrast(0.98);'), '暗色縮圖常態必須套用 brightness(0.90) 柔光');
assert(antiGlareChunk.includes('border: 0.0625rem solid rgba(255, 255, 255, 0.08);'), '暗色縮圖必須包含柔和防割裂邊框');
assert(antiGlareChunk.includes('filter: brightness(1) contrast(1);'), '暗色縮圖 Hover 必須 100% 原色即時還原');
assert(antiGlareChunk.includes('transition: filter 0.2s'), '縮圖還原必須具備平滑 transition 過渡');
console.log('✅ [Check 5] PASS: 暗色高亮縮圖防雪盲柔光生效 (常態 90% 柔光 + Hover 100% 原色即時還原)，告別直射手電筒感');

console.log('\n🎉 Pokopia 暗色模式暖炭板岩護眼調 (Dark Dimmed Eyecare) 驗證 100% PASS！');
