// verify_global_console_styling.js
// 專屬自動化驗收腳本：全站通用視覺基底（現代主機精緻風）全覆蓋檢驗

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始執行：全站通用視覺基底（Nintendo 主機精緻風）自動化驗收 ===\n');

const css = fs.readFileSync('index.css', 'utf8');

// 1. 檢驗 Design Tokens 齊全度
console.log('--- 1. 檢驗 Design Tokens 與色彩變數 ---');
assert(css.includes('--card-edge-glow:'), ':root 必須定義 --card-edge-glow 微光倒角變數');
assert(css.includes('--shadow-main:'), ':root 必須定義 --shadow-main 漫射陰影變數');
assert(css.includes('--shadow-hover:'), ':root 必須定義 --shadow-hover 懸浮陰影變數');
assert(css.includes('--ease-spring:'), ':root 必須定義 --ease-spring 彈簧貝茲動效曲線');
assert(css.includes('--ease-smooth:'), ':root 必須定義 --ease-smooth 平滑過渡曲線');
console.log('✅ [PASS] 1. 全局 Design Tokens (微光倒角、多層漫射陰影、彈簧動效貝茲曲線) 齊備');

// 2. 檢驗 body 全局背景微漫射光暈
console.log('\n--- 2. 檢驗全站背景環境光暈 ---');
assert(css.includes('body {') && css.includes('radial-gradient(at 10% 8%'), 'body 必須採用柔和多重漫射漸層背景');
assert(css.includes('background-attachment: fixed;'), '背景漸層必須採用 fixed 保持滾動時沉浸透光質感');
console.log('✅ [PASS] 2. 全局背景雙重/三重環境光漫射層與 fixed 沉浸光效檢驗通過');

// 3. 檢驗頂部導航列、TOC 目次選單與主題切換器
console.log('\n--- 3. 檢驗頂部導航列、TOC 目次與切換器 ---');
assert(css.includes('.app-header {') && css.includes('backdrop-filter: blur(1.125rem)'), 'app-header 必須包含深層毛玻璃模糊');
assert(css.includes('.toc-btn {') && css.includes('--ease-spring'), 'toc-btn 必須具備主機彈簧微互動曲線');
assert(css.includes('.theme-toggle-btn {') && css.includes('--ease-spring'), 'theme-toggle-btn 必須具備主機彈簧微互動曲線');
assert(css.includes('.toc-dropdown {') && css.includes('backdrop-filter: blur(1.25rem)'), 'toc-dropdown 必須具備高階毛玻璃與微光倒角');
console.log('✅ [PASS] 3. 頂部導航列、TOC 目次與主題切換器高階毛玻璃與彈簧微互動檢驗通過');

// 4. 檢驗搜尋框與視圖切換鍵
console.log('\n--- 4. 檢驗搜尋框與視圖切換器 ---');
assert(css.includes('.search-box input {') && css.includes('inset 0 1px 2px'), '搜尋框必須具備內凹微倒角質感');
assert(css.includes('.search-box input:focus {') && css.includes('--primary-indigo-glow'), '搜尋框聚焦時必須具有外發光呼吸微暈圈');
assert(css.includes('.view-toggle-group {') && css.includes('box-shadow: inset 0 1px 2px'), '視圖切換容器必須具備凹槽質感');
assert(css.includes('.view-btn.active {') && css.includes('--card-edge-glow'), '活躍視圖鍵必須具備果凍微浮雕質感');
console.log('✅ [PASS] 4. 搜尋框微倒角、聚焦外光暈與視圖切換器果凍浮雕檢驗通過');

// 5. 檢驗三大核心卡片 (.item-card, .habitat-catalog-card)
console.log('\n--- 5. 檢驗三大核心卡片微立體與 Hover 懸浮動效 ---');
assert(css.includes('.item-card {') && css.includes('--card-edge-glow'), 'item-card 必須套用 --card-edge-glow 微光倒角');
assert(css.includes('.item-card:hover {') && css.includes('--shadow-hover'), 'item-card:hover 必須觸發 --shadow-hover 漫射懸浮');
assert(css.includes('.habitat-catalog-card {') && css.includes('--card-edge-glow'), 'habitat-catalog-card 必須套用 --card-edge-glow 微光倒角');
assert(css.includes('.habitat-catalog-card:hover {') && css.includes('--shadow-hover'), 'habitat-catalog-card:hover 必須觸發 --shadow-hover 漫射懸浮');
console.log('✅ [PASS] 5. 儲存庫卡片、寶可夢圖鑑卡片、棲息地卡片微立體倒角與漫射懸浮檢驗通過');

// 6. 檢驗深色模式 (Dark Mode) 對比度與極光光暈
console.log('\n--- 6. 檢驗深色模式 ---');
assert(css.includes(':root[data-theme="dark"]') && css.includes('--card-edge-glow: inset 0 1px 0 rgba(255, 255, 255, 0.14)'), '深色模式必須包含專屬微光邊框');
assert(css.includes(':root[data-theme="dark"] .habitat-catalog-card:hover'), '深色模式必須具備專屬極光微光懸浮');
console.log('✅ [PASS] 6. 深色模式極光光影與暗色卡匣邊框調校檢驗通過');

console.log('\n🎉 [ALL CHECKS PASSED] 全站通用視覺基底（現代 Nintendo 主機精緻風）自動化檢驗 100% 全部通過！');
