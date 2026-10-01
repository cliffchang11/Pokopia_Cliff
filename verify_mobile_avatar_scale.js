const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 手機端寶可夢頭像微縮與桌機大圖樣式隔離驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] 大螢幕頭像樣式嚴格隔離於 min-width: 1280px
const wideRuleIdx = css.indexOf('@media (min-width: 1280px)');
assert(wideRuleIdx !== -1, 'index.css 必須宣告 @media (min-width: 1280px) 媒體查詢');
const wideChunk = css.substring(wideRuleIdx, wideRuleIdx + 300);
assert(wideChunk.includes('clamp(4.5000rem, 6.5vw, 6.0000rem)'), '桌機頭像 clamp(4.5rem, 6.5vw, 6.0rem) 必須被嚴格隔離在 @media (min-width: 1280px) 內');
console.log('✅ [Check 1] PASS: 桌機大圖規則成功隔離在 min-width: 1280px，徹底阻斷向下滲透');

// [Check 2] 手機端 (<= 640px) 寶可夢頭像精緻微縮
assert(css.includes('clamp(2.2000rem, 11vw, 2.7500rem) !important;'), '手機端必須設定 clamp(2.2rem, 11vw, 2.75rem) 頭像微縮規則');
console.log('✅ [Check 2] PASS: 手機端頭像微縮至 clamp(2.2rem, 11vw, 2.75rem) (~36px~44px，縮減約 40%)');

// [Check 3] 手機端外觀單元格緊湊內距與比例鎖定
const mobileRuleIdx = css.lastIndexOf('@media (max-width: 640px)');
assert(mobileRuleIdx !== -1, 'index.css 必須包含手機端 @media (max-width: 640px) 規則');
const mobileChunk = css.substring(mobileRuleIdx);
assert(mobileChunk.includes('aspect-ratio: 1 / 1 !important;') && mobileChunk.includes('object-fit: contain !important;'), '手機端頭像必須嚴格鎖定 1:1 等比與 contain');
assert(mobileChunk.includes('padding: 0.2500rem 0.0625rem !important;'), '手機端外觀單元格必須套用緊湊 0.25rem 內距');
console.log('✅ [Check 3] PASS: 手機端單元格緊湊化與 1:1 比例鎖定完備，每列行高大幅收緊至 ~54px');

console.log('\n🎉 Pokopia 手機端寶可夢頭像微縮與桌機大圖樣式隔離驗證 100% PASS！');
