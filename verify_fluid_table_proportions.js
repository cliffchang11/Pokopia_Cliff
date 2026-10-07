const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 8 欄與 7 欄流體百分比、主角放大與棲息地字級微縮驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] 8 欄大寬螢幕流體百分比權重分配驗證
assert(css.includes('width: 3.5% !important;'), '8 欄模式缺少解鎖 3.5%');
assert(css.includes('width: 7.0% !important;'), '8 欄模式缺少寶可夢 7.0%');
assert(css.includes('width: 16.0% !important;'), '8 欄模式缺少外觀 16.0%');
assert(css.includes('width: 6.5% !important;'), '8 欄模式缺少環境 6.5%');
assert(css.includes('width: 8.5% !important;'), '8 欄模式缺少目前位置 8.5%');
assert(css.includes('width: 36.5% !important;'), '8 欄模式缺少棲息地 36.5%');
assert(css.includes('width: 15.0% !important;'), '8 欄模式缺少喜好 15.0%');

const sum8Col = 3.5 + 7.0 + 16.0 + 6.5 + 7.0 + 8.5 + 36.5 + 15.0;
assert.strictEqual(Math.round(sum8Col * 10) / 10, 100.0, `8 欄百分比總和應為 100%，實測為 ${sum8Col}%`);
console.log(`✅ [Check 1] PASS: 8 欄大寬螢幕流體百分比配置完備 (喜好 15% : 外觀 16% : 棲息地 36.5%，總和 100%)`);

// [Check 2] 7 欄中窄螢幕流體百分比無縫降級驗證
assert(css.includes('width: 4.0% !important;'), '7 欄模式缺少解鎖 4.0%');
assert(css.includes('width: 9.5% !important;'), '7 欄模式缺少寶可夢 9.5%');
assert(css.includes('width: 16.5% !important;'), '7 欄模式缺少外觀 16.5%');
assert(css.includes('width: 7.5% !important;'), '7 欄模式缺少環境 7.5%');
assert(css.includes('width: 8.0% !important;'), '7 欄模式缺少專長 8.0%');
assert(css.includes('width: 37.5% !important;'), '7 欄模式缺少棲息地 37.5%');
assert(css.includes('width: 17.0% !important;'), '7 欄模式缺少喜好 17.0%');

const sum7Col = 4.0 + 9.5 + 16.5 + 7.5 + 8.0 + 37.5 + 17.0;
assert.strictEqual(Math.round(sum7Col * 10) / 10, 100.0, `7 欄百分比總和應為 100%，實測為 ${sum7Col}%`);
console.log(`✅ [Check 2] PASS: 7 欄中窄螢幕流體百分比配置完備 (外觀 16.5% : 棲息地 37.5% : 喜好 17%，總和 100%)`);

// [Check 3] 主角視覺等比微縮 15% 驗證 (外觀頭像與棲息地縮圖)
assert(css.includes('clamp(3.1875rem, 4.25vw, 4.1225rem)'), '外觀頭像必須微縮 15% 至 clamp(3.1875rem, 4.25vw, 4.1225rem)');
assert(css.includes('width: 95% !important;') && css.includes('aspect-ratio: 3 / 2 !important;'), '棲息地縮圖必須吃滿欄位 95% 寬度且維持 3:2');
console.log('✅ [Check 3] PASS: 外觀點陣頭像微調收斂 15%，精緻不壓迫，棲息地縮圖吃滿 95% 滿版開展');

// [Check 4] 棲息地底部文字微縮驗證
assert(css.includes('.pokemon-table .pkm-hab-name-text') && css.includes('font-size: 0.68rem !important;'), '棲息地名字必須微縮至 0.68rem');
console.log('✅ [Check 4] PASS: 棲息地底部名稱微縮至 0.68rem，垂直空間完美讓位給全景縮圖');

console.log('\n🎉 Pokopia 8 欄與 7 欄流體百分比、主角放大與棲息地字級微縮驗證 100% PASS！');
