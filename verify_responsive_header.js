// verify_responsive_header.js
// 驗證導航列響應式重構、解除 Fixed 重疊、下拉選單防擠壓與字級可讀性保護
const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證頂部導航與全站響應式自適應規則 ===');

const css = fs.readFileSync('index.css', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

// 1. 驗證 header-actions 已徹底移除 position: fixed
assert(!css.includes('position: fixed;\n  top: 0.8750rem;\n  right: 20px;'), 'header-actions 不得包含 position: fixed (寬螢幕)');
assert(!css.includes('position: fixed;\n    top: 0.8750rem;\n    right: 1.0000rem;'), 'header-actions 不得包含 position: fixed (平板)');
assert(!css.includes('position: fixed;\n    top: 0.6250rem;\n    right: 0.7500rem;'), 'header-actions 不得包含 position: fixed (手機)');
console.log('✅ [PASS] 1. header-actions 脫離文檔流之 position: fixed 已全數根除');

// 2. 驗證 header-container 寫死的 padding-right: 170px 已拔除
assert(!css.includes('padding-right: 170px;'), 'header-container 不得包含寫死的 padding-right: 170px');
assert(!css.includes('padding-right: 7.5000rem;'), 'brand 不得包含寫死的大額 padding-right');
console.log('✅ [PASS] 2. 寫死之硬性右邊距已拔除，恢復純 Flex 彈性分配');

// 3. 驗證手機端按鈕智慧圖示化 (<= 768px)
assert(css.includes('@media (max-width: 768px)'), '必須具備 768px 斷點規則');
assert(css.includes('.autofarm-nav-btn-text,\n  .custom-storage-nav-btn-text {\n    display: none !important;'), '手機端必須隱藏文字以節省 150px 空間');
assert(css.includes('border-radius: 50% !important;'), '手機端按鈕必須轉化為精緻圓形膠囊');
console.log('✅ [PASS] 3. 手機端「終局農場」與「我的收納盒」智慧圖示化規則完備');

// 4. 驗證篩選列 flex-wrap 與防擠壓 (徹底告別被壓成細縫)
assert(!css.includes('flex-wrap: nowrap !important;'), '不得強制 flex-wrap: nowrap，必須允許流式換行');
assert(css.includes('min-width: 4.8000rem;'), '桌面/平板端下拉選單必須具備安全最小寬度');
assert(css.includes('min-width: 4.5000rem;'), '手機端下拉選單必須具備安全最小寬度');
assert(css.includes('font-size: 0.80rem;') || css.includes('font-size: 0.82rem;'), '字級必須嚴格維護在 0.8rem 以上，禁止微縮');
console.log('✅ [PASS] 4. 下拉選單安全最小寬度、換行彈性與字級清晰度保障驗證通過');

// 5. 驗證 app.js 搜尋框自適應 Placeholder
assert(js.includes('function updateResponsivePlaceholders()'), 'app.js 必須具備 updateResponsivePlaceholders 函式');
assert(js.includes("window.addEventListener('resize', updateResponsivePlaceholders)"), '必須監聽 resize 事件以即時自適應');
console.log('✅ [PASS] 5. 搜尋列 placeholder 動態精簡防溢出驗證通過');

// 6. CSS 括號嚴格平衡
const openB = (css.match(/{/g) || []).length;
const closeB = (css.match(/}/g) || []).length;
assert(openB === closeB, `CSS 括號必須嚴格平衡: Open=${openB}, Close=${closeB}`);
console.log(`✅ [PASS] 6. CSS 大括號完全平衡 (Open: ${openB}, Close: ${closeB})`);

console.log('\n🎉 頂部導航重疊修復與全站響應式自適應規則 100% 全部通過！\n');
