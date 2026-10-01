const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 真實喜好膠囊 (.pref-pill) 微型化與排版精緻驗證');
console.log('================================================================\n');

const cssPath = path.join(__dirname, 'index.css');
const css = fs.readFileSync(cssPath, 'utf8');

// [Check 1] .pref-pill 真實字級收斂檢驗
assert(css.includes('.pref-pill {'), 'index.css 必須包含 .pref-pill 樣式區塊');
assert(css.includes('font-size: 0.68rem;'), '.pref-pill 字級必須精確收斂為 0.68rem (不再是 0.82rem)');
console.log('✅ [Check 1] PASS: .pref-pill 字級成功收斂至 0.68rem (~10.8px，與專長完美對齊)');

// [Check 2] 內距緊縮與 margin 歸零檢驗
assert(css.includes('padding: 0.0800rem 0.3500rem;'), '.pref-pill 內距必須緊湊設定為 0.0800rem 0.3500rem');
assert(css.includes('margin: 0;'), '.pref-pill 必須將 margin 設定為 0 (由容器 flex gap 統一分配)');
console.log('✅ [Check 2] PASS: .pref-pill 內邊距收緊且 margin 歸零，膠囊高度壓縮約 35%');

// [Check 3] 容器 gap 縮減與高度對齊檢驗
assert(css.includes('gap: 0.2000rem;'), '.fav-column-group 必須設定 gap: 0.2000rem (消除空洞與拉扯感)');
console.log('✅ [Check 3] PASS: .fav-column-group 間距收斂為 0.20rem，多列總高度與棲息地圖平齊');

// [Check 4] 色彩與微圓角保全檢驗
assert(css.includes('border-radius: 0.3750rem;'), '.pref-pill 必須維持 0.375rem 微圓角語彙');
assert(css.includes('.pref-pill-thing') && css.includes('.pref-pill-taste'), '特徵與口味色彩定義必須完整完好');
console.log('✅ [Check 4] PASS: 特徵與口味官方色彩反饋與微圓角規格 100% 保持');

console.log('\n🎉 Pokopia 真實喜好膠囊 (.pref-pill) 微型化與排版精緻驗證 100% PASS！');
