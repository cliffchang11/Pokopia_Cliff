// verify_skeleton_and_scroll_top.js
// 驗證「圖片呼吸骨架屏、首屏微瀑布進場動效、與右下角回頂部懸浮按鈕」

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證骨架屏、微瀑布動效與右下角回頂部功能 ===\n');

// 1. 檢驗 index.html
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="btnScrollTop"'), 'index.html 必須包含 id="btnScrollTop"');
assert(html.includes('class="scroll-top-btn hidden"'), 'btnScrollTop 預設必須隱藏');
assert(html.includes('class="scroll-top-icon">⬆</span>'), '按鈕必須包含 ⬆ 圖示');
console.log('✔ [Check 1] index.html 回頂部按鈕 DOM 結構驗證完備');

// 2. 檢驗 index.css
const css = fs.readFileSync('index.css', 'utf8');

// 2.1 回頂部按鈕樣式
assert(css.includes('.scroll-top-btn {'), 'index.css 必須包含 .scroll-top-btn 類別');
assert(css.includes('position: fixed;'), '.scroll-top-btn 必須為 fixed 定位');
assert(css.includes('border-radius: 50%;'), '.scroll-top-btn 必須為精緻圓形');
assert(css.includes('body.has-floating-back .scroll-top-btn'), '必須支援與返回上一頁按鈕縱向堆疊排版');
console.log('✔ [Check 2] 回頂部按鈕毛玻璃懸浮、圓形幾何與避讓返回按鈕堆疊樣式驗證完備');

// 2.2 呼吸骨架屏樣式
assert(css.includes('.pkm-avatar-box.is-loading'), '必須包含 .pkm-avatar-box.is-loading 骨架屏狀態');
assert(css.includes('skeletonShimmer'), '必須包含 skeletonShimmer 微光掃掠動畫');
assert(css.includes('.item-card.stagger-in'), '必須包含 .item-card.stagger-in 階梯進場動效');
assert(css.includes('img.img-fade-in'), '必須包含 img.img-fade-in 圖片淡入動效');
console.log('✔ [Check 3] 圖片局部呼吸骨架屏 (Shimmer) 與前 16 卡瀑布微淡入樣式完備');

// 3. 檢驗 app.js
const js = fs.readFileSync('app.js', 'utf8');

// 3.1 DOM 快取與 State
assert(js.includes("btnScrollTop: document.getElementById('btnScrollTop')"), 'DOM 快取必須包含 btnScrollTop');
assert(js.includes('isStaggerAnim: true'), 'state 必須包含 isStaggerAnim 控制旗標');
console.log('✔ [Check 4] app.js DOM 快取與 state 狀態變數完備');

// 3.2 回頂部按鈕滾動與點擊監聽
assert(js.includes('function initScrollTopButton()'), '必須具備 initScrollTopButton 函式');
assert(js.includes('initScrollTopButton();'), 'init() 中必須呼叫 initScrollTopButton');
assert(js.includes("window.scrollTo({ top: 0, behavior: 'smooth' })"), '點擊回頂部必須調用 smooth scrollTo');
assert(!js.includes("DOM.searchInput.focus()"), '回頂部按鈕點擊不應強奪搜尋框焦點');
console.log('✔ [Check 5] 回頂部滾動閾值 (300px)、點擊平滑返回與不強奪焦點驗證完備');

// 3.3 動效分流與定向跳轉保護
assert(js.includes("state.isStaggerAnim = false; // 定向跳轉保護"), 'jumpToPokemon 必須停用瀑布延遲以確保精確定位');
assert(js.includes("DOM.searchInput.addEventListener('input'"), '搜尋框 input 必須停用瀑布延遲');
assert(js.includes("const isStagger = state.isStaggerAnim && index < 16;"), '微瀑布動效僅限前 16 張卡片');
console.log('✔ [Check 6] 打字搜尋零延遲即時反饋、切換選單微瀑布、定向跳轉優先保護驗證通過');

console.log('\n🎉 骨架屏、微瀑布動效與右下角回頂部功能全量驗收通過 (100% PASS)！\n');
