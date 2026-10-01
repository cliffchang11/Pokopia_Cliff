const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 喜好標籤 (fav-pill) 字體排版與精緻幾何規格驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] 基礎字級與字重收斂檢驗
assert(css.includes('.fav-pill {'), 'index.css 必須包含 .fav-pill 基礎樣式區塊');
assert(css.includes('font-size: 0.70rem;') && css.includes('font-weight: 500;'), '.fav-pill 基礎樣式必須設定 font-size: 0.70rem 與 font-weight: 500');
console.log('✅ [Check 1] PASS: .fav-pill 成功收斂字級至 0.70rem 並採用 500 (Medium) 中黑字重');

// [Check 2] 邊框細緻化與內距收緊檢驗
assert(css.includes('border: 0.0625rem solid var(--pill-border, #cbd5e1);'), '.fav-pill 邊框必須由 1.5px 縮細為 1px (0.0625rem)');
assert(css.includes('padding: 0.1000rem 0.4500rem;'), '.fav-pill 內距必須設定為 padding: 0.1000rem 0.4500rem');
console.log('✅ [Check 2] PASS: .fav-pill 邊框精緻化為 1px 細線，內距完美收斂');

// [Check 3] 微圓角矩形語彙保全檢驗
assert(css.includes('border-radius: 0.3750rem;'), '.fav-pill 必須維持 0.375rem 微圓角矩形，與專長標籤保持一致語彙');
console.log('✅ [Check 3] PASS: .fav-pill 維持微圓角矩形設計，與工作專長構成諧調標籤雲');

// [Check 4] 中型螢幕防裁切規則相容性檢驗
assert(css.includes('.pokemon-table td.col-favorites .fav-pill') && css.includes('font-size: 0.70rem !important;'), '中型螢幕防裁切字級規範保持無損');
console.log('✅ [Check 4] PASS: 中型螢幕流體防裁切規範 100% 相容無衝突');

console.log('\n🎉 Pokopia 喜好標籤 (fav-pill) 字體排版與精緻幾何規格驗證 100% PASS！');
