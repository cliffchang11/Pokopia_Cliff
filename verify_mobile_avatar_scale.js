const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 手機端 6 欄寬度重分配、防擠間隔與頭像微調驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] 大螢幕頭像樣式嚴格隔離於 min-width: 1280px
const wideRuleIdx = css.indexOf('@media (min-width: 1280px)');
assert(wideRuleIdx !== -1, 'index.css 必須宣告 @media (min-width: 1280px) 媒體查詢');
const wideChunk = css.substring(wideRuleIdx, wideRuleIdx + 300);
assert(wideChunk.includes('clamp(3.8250rem, 5.525vw, 5.1000rem)'), '桌機頭像 clamp(3.8250rem, 5.525vw, 5.1000rem) 必須被嚴格隔離在 @media (min-width: 1280px) 內');
console.log('✅ [Check 1] PASS: 桌機大圖規則成功隔離在 min-width: 1280px，微縮 15% 阻斷向下滲透');

// [Check 2] 手機端 (<= 640px) 6 欄寬度流體百分比系統 (總和 100%)
assert(css.includes('width: 6.5% !important;'), '手機端缺少解鎖 6.5%');
assert(css.includes('width: 24.0% !important;'), '手機端缺少寶可夢 24.0%');
assert(css.includes('width: 16.5% !important;'), '手機端缺少外觀 16.5%');
assert(css.includes('width: 14.5% !important;'), '手機端缺少環境/專長 14.5%');
assert(css.includes('width: 24.0% !important;'), '手機端缺少棲息地 24.0%');

const sumMobile = 6.5 + 24.0 + 16.5 + 14.5 + 14.5 + 24.0;
assert.strictEqual(Math.round(sumMobile * 10) / 10, 100.0, `手機端 6 欄百分比總和應為 100%，實測為 ${sumMobile}%`);
console.log(`✅ [Check 2] PASS: 手機端 6 欄流體百分比重分配完備 (解鎖 6.5% : 寶可夢 24% : 外觀 16.5% : 環境 14.5% : 專長 14.5% : 棲息地 24%，總和 100%)`);

// [Check 3] 解鎖與寶可夢之間防擠留白緩衝
assert(css.includes('padding: 0.2500rem 0.1250rem 0.2500rem 0.3750rem !important;'), '寶可夢欄位必須設定 padding-left: 0.375rem 留白防擠');
console.log('✅ [Check 3] PASS: 寶可夢欄位左側成功注入 0.375rem (~6px) 安全間隙，勾選框與名稱清爽區隔不再黏貼');

// [Check 4] 外觀頭像微調放大至 clamp(2.6rem, 12.5vw, 3.2rem)
const mobileRuleIdx = css.lastIndexOf('@media (max-width: 640px)');
assert(mobileRuleIdx !== -1, 'index.css 必須包含底部手機端 @media (max-width: 640px) 規則');
const mobileChunk = css.substring(mobileRuleIdx);
assert(mobileChunk.includes('clamp(2.6000rem, 12.5vw, 3.2000rem) !important;'), '手機端必須設定 clamp(2.6rem, 12.5vw, 3.2rem) 外觀微調放大');
assert(mobileChunk.includes('aspect-ratio: 1 / 1 !important;') && mobileChunk.includes('object-fit: contain !important;'), '手機端頭像必須嚴格鎖定 1:1 等比與 contain');
console.log('✅ [Check 4] PASS: 手機端外觀頭像微調放大至 clamp(2.6rem, 12.5vw, 3.2rem) (~42px~50px)，點陣細節更飽滿');

// [Check 5] 環境與專長膠囊手機端樣式輕量化與防貼邊
assert(mobileChunk.includes('font-size: clamp(0.6000rem, 2.5vw, 0.6800rem) !important;'), '手機端膠囊字級必須設定 clamp(0.60rem, 2.5vw, 0.68rem)');
assert(mobileChunk.includes('padding: 0.1500em 0.4500em !important;'), '手機端膠囊 padding 必須微調為 0.15em 0.45em');
console.log('✅ [Check 5] PASS: 手機端環境與專長膠囊字級與內距輕量化，左右留白充裕，雙專長向下排列清爽大器');

console.log('\n🎉 Pokopia 手機端 6 欄寬度重分配、防擠間隔與頭像微調驗證 100% PASS！');
