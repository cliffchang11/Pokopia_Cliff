const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('--- 開始驗證 PWA 離線支援與整合設定 (v4.9.0) ---');

// 1. 檢驗 manifest.json
const manifestPath = path.resolve('manifest.json');
assert.ok(fs.existsSync(manifestPath), '測試失敗：manifest.json 檔案不存在！');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert.strictEqual(manifest.name, 'Pokopia', 'manifest.json name 應為 Pokopia');
assert.strictEqual(manifest.short_name, 'Pokopia', 'manifest.json short_name 應為 Pokopia');
assert.strictEqual(manifest.display, 'standalone', 'manifest.json display 應為 standalone');
assert.strictEqual(manifest.theme_color, '#12151c', 'manifest.json theme_color 應為 #12151c');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'manifest.json icons 數量不足');

// 檢驗各 icon 檔案是否存在
manifest.icons.forEach(icon => {
  const iconFile = path.resolve(icon.src);
  assert.ok(fs.existsSync(iconFile), `測試失敗：Icon 檔案不存在：${icon.src}`);
});
console.log('✓ 驗證通過：manifest.json 結構合法且各尺寸圖示實體均已就緒');

// 2. 檢驗 index.html 標籤
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert.ok(indexHtml.includes('<link rel="manifest" href="manifest.json">'), 'index.html 未正確載入 manifest.json');
assert.ok(indexHtml.includes('<meta name="apple-mobile-web-app-capable" content="yes">'), 'index.html 缺少 iOS 獨立 App 全螢幕標籤');
assert.ok(indexHtml.includes('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'), 'index.html 缺少 iOS 狀態列半透明融合標籤');
assert.ok(indexHtml.includes('<meta name="theme-color" content="#12151c">'), 'index.html 缺少 theme-color 標籤');
assert.ok(indexHtml.includes('app.js?v=4.9.0'), 'index.html 未更新至 v=4.9.0');
console.log('✓ 驗證通過：index.html 已完整配置 PWA 與 iOS 專屬 Meta 標籤');

// 3. 檢驗 sw.js 內容與邏輯
const swPath = path.resolve('sw.js');
assert.ok(fs.existsSync(swPath), '測試失敗：sw.js 檔案不存在！');
const swJs = fs.readFileSync(swPath, 'utf8');

assert.ok(swJs.includes("CACHE_NAME = 'pokopia-cache-v4.9.0'"), 'sw.js CACHE_NAME 應包含 v4.9.0');
assert.ok(swJs.includes("addEventListener('install'"), 'sw.js 缺少 install 事件');
assert.ok(swJs.includes("addEventListener('activate'"), 'sw.js 缺少 activate 事件');
assert.ok(swJs.includes("addEventListener('fetch'"), 'sw.js 缺少 fetch 事件');
assert.ok(swJs.includes('caches.delete'), 'sw.js 缺少過期快取清理邏輯');
assert.ok(swJs.includes("req.mode === 'navigate'"), 'sw.js 缺少導航請求離線 fallback');
console.log('✓ 驗證通過：sw.js 具備完整 Service Worker 生命週期與 Network-First 離線回退邏輯');

// 4. 檢驗 app.js 註冊函式
const appJs = fs.readFileSync('app.js', 'utf8');
assert.ok(appJs.includes('registerServiceWorker()'), 'app.js 缺少 registerServiceWorker 呼叫');
assert.ok(appJs.includes("navigator.serviceWorker.register('./sw.js')"), 'app.js 缺少 navigator.serviceWorker.register 邏輯');
console.log('✓ 驗證通過：app.js 已成功整合 Service Worker 註冊守衛');

console.log('🎉 PWA 自動化測試 100% 全部通過！');
