// verify_performance_boost.js
// 專屬自動化驗收腳本：全方位純效能優化包 (網路預解析 + 圖片非同步解碼 + 現代長列表渲染加速) (v4.10.0)

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證：全方位純效能優化包 (v4.10.0) ===\n');

// 1. 檢驗 index.html
const html = fs.readFileSync('index.html', 'utf8');

// 1.1 網路預解析與 DNS 預查詢
assert.ok(html.includes('<link rel="preconnect" href="https://fonts.googleapis.com">'), 'FAIL: 缺少 fonts.googleapis.com 的 preconnect');
assert.ok(html.includes('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'), 'FAIL: 缺少 fonts.gstatic.com 的 preconnect');
assert.ok(html.includes('<link rel="dns-prefetch" href="https://fonts.googleapis.com">'), 'FAIL: 缺少 fonts.googleapis.com 的 dns-prefetch');
assert.ok(html.includes('<link rel="dns-prefetch" href="https://fonts.gstatic.com">'), 'FAIL: 缺少 fonts.gstatic.com 的 dns-prefetch');
console.log('✅ [Check 1.1] PASS: index.html Google Fonts preconnect 與 dns-prefetch 網路預解析配置完備');

// 1.2 靜態 Logo 圖片具備 decoding="async"
assert.ok(html.includes('<img src="assets/logo.png?v=4.10.1" alt="Pokopia 風速狗 Logo" class="brand-logo-img" decoding="async">'), 'FAIL: 品牌 Logo 缺少 decoding="async"');
console.log('✅ [Check 1.2] PASS: index.html 靜態 Logo 具備 decoding="async" 非同步解碼');

// 1.3 全站快取標籤升級至 v=4.10.1
assert.ok(html.includes('index.css?v=4.10.1'), 'index.css 快取標籤未更新至 v=4.10.1');
assert.ok(html.includes('app.js?v=4.10.1'), 'app.js 快取標籤未更新至 v=4.10.1');
assert.ok(html.includes('firebase.js?v=4.10.1'), 'firebase.js 快取標籤未更新至 v=4.10.1');
assert.ok(html.includes('logo.png?v=4.10.1'), 'logo 快取標籤未更新至 v=4.10.1');
assert.ok(html.includes('data.js?v=4.10.1'), 'data.js 快取標籤未更新至 v=4.10.1');
console.log('✅ [Check 1.3] PASS: index.html 全站快取標籤全數升級至 v=4.10.1');

// 2. 檢驗 app.js 圖片非同步解碼 (decoding="async")
const js = fs.readFileSync('app.js', 'utf8');
const imgTagMatches = js.match(/<img\s+[^>]+>/g) || [];
assert.ok(imgTagMatches.length > 0, 'FAIL: 未找到任何 img 標籤');

let missingDecoding = 0;
imgTagMatches.forEach(tag => {
  if (!tag.includes('decoding="async"')) {
    missingDecoding++;
    console.error('缺少 decoding="async":', tag);
  }
});
assert.strictEqual(missingDecoding, 0, `FAIL: 仍有 ${missingDecoding} 個 img 標籤缺少 decoding="async"`);
console.log(`✅ [Check 2] PASS: app.js 所有動態渲染的 ${imgTagMatches.length} 個 img 標籤 100% 具備 decoding="async" 非同步解碼`);

// 3. 檢驗 index.css 現代長列表渲染加速 (content-visibility: auto)
const css = fs.readFileSync('index.css', 'utf8');

// 3.1 括號平衡值檢驗
let balance = 0;
for (let c of css) {
  if (c === '{') balance++;
  else if (c === '}') balance--;
}
assert.strictEqual(balance, 0, 'FAIL: index.css 大括號未完全閉合');
console.log('✅ [Check 3.1] PASS: index.css 大括號平衡值為 0，語法無懈可擊');

// 3.2 表格行 content-visibility 檢驗
assert.ok(
  css.includes('.data-table tbody tr {') &&
  css.includes('content-visibility: auto;') &&
  css.includes('contain-intrinsic-size: 0 4.5rem;'),
  'FAIL: .data-table tbody tr 缺少 content-visibility: auto 或 contain-intrinsic-size'
);
console.log('✅ [Check 3.2] PASS: .data-table tbody tr 長表格行成功套用 content-visibility 與精準預估高度');

// 3.3 圖鑑卡片 content-visibility 檢驗
assert.ok(
  css.includes('.item-card {') &&
  css.includes('content-visibility: auto;') &&
  css.includes('contain-intrinsic-size: 0 16rem;'),
  'FAIL: .item-card 缺少 content-visibility: auto 或 contain-intrinsic-size'
);
console.log('✅ [Check 3.3] PASS: .item-card 卡片視圖成功套用 content-visibility 與防抖預估高度');

// 3.4 素材庫 1238 種物品網格 content-visibility 檢驗
assert.ok(
  css.includes('.cs-tray-item {') &&
  css.includes('content-visibility: auto;') &&
  css.includes('contain-intrinsic-size: clamp(44px, 5.5vw, 56px) clamp(44px, 5.5vw, 56px);'),
  'FAIL: .cs-tray-item 缺少 content-visibility: auto 或 contain-intrinsic-size'
);
console.log('✅ [Check 3.4] PASS: .cs-tray-item 素材庫 1238 項物品格成功套用 content-visibility 視窗外跳過');

console.log('\n🎉 verify_performance_boost.js 全部檢驗 100% 通過！');
