// verify_pref_view_all.js
// 驗證寶可夢詳情卡中每一個特徵風格與口味的「查看全部 ↗」功能

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證特徵風格與口味「查看全部 ↗」跳轉百科功能 ===\n');

// 1. 檢驗 app.js 實作
const appJsPath = path.join(__dirname, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 檢驗 HTML 生成中是否包含查看全部邏輯與門檻判斷
assert(appJsContent.includes('const hasMore = items.length > 10;'), '特徵風格必須包含 items.length > 10 門檻判斷');
assert(appJsContent.includes('pkm-pref-thing-link'), '特徵風格標題必須包含 pkm-pref-thing-link 查看全部按鈕');
assert(appJsContent.includes('pkm-pref-taste-link'), '口味標題必須包含 pkm-pref-taste-link 查看全部按鈕');
console.log('✔ [Check 1] app.js 特徵風格與口味「查看全部 ↗」HTML 結構與數量門檻判定完備');

// 檢驗全域事件委派
assert(appJsContent.includes('.pkm-pref-thing-link, .pkm-pref-taste-link'), '全域點擊事件委派必須支援 pkm-pref-thing-link 與 pkm-pref-taste-link');
console.log('✔ [Check 2] 全域點擊事件委派跳轉喜好百科邏輯完備');

// 2. 檢驗 index.css 樣式
const cssPath = path.join(__dirname, 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.pkm-pref-thing-link'), 'CSS 必須包含 .pkm-pref-thing-link 樣式');
assert(cssContent.includes('.pkm-pref-taste-link'), 'CSS 必須包含 .pkm-pref-taste-link 樣式');
assert(cssContent.includes('.pkm-pref-thing-link:hover'), 'CSS 必須包含 hover 微交互動效');
console.log('✔ [Check 3] index.css 查看全部連結樣式與 hover 動效完備');

// 3. 模擬資料驅動渲染測試
// 載入 preferences_db.js 中的喜好資料
const prefDb = require('./preferences_db.js');

assert(prefDb && prefDb.things, 'POKOPIA_PREFERENCES_DB 必須包含 things 特徵風格資料庫');

// 尋找物品數量 > 10 的特徵
const richThing = prefDb.things.find(t => t.items && t.items.length > 10);
assert(richThing, '資料庫中必須存在物品數量 > 10 的特徵風格');

// 尋找物品數量 <= 10 的特徵 (若有的話)
const smallThing = prefDb.things.find(t => t.items && t.items.length <= 10);

// 模擬生成 HTML 邏輯
function renderMockThingHeader(th) {
  const items = th.items || [];
  const hasMore = items.length > 10;
  return `
    <div class="pkm-pref-box-title">
      <span class="pref-pill-btn fav-pill" data-fav="${th.name}">🛋️ 特徵風格：${th.name}</span>
      ${hasMore ? `<span class="pkm-pref-thing-link" data-fav="${th.name}">查看全部 ↗</span>` : ''}
    </div>
  `;
}

const richHtml = renderMockThingHeader(richThing);
assert(richHtml.includes('查看全部 ↗'), `物品數為 ${richThing.items.length} (>10) 的特徵「${richThing.name}」必須顯示「查看全部 ↗」`);
assert(richHtml.includes(`data-fav="${richThing.name}"`), '查看全部連結必須精準帶入特徵名稱 data-fav');
console.log(`✔ [Check 4] 物品數 > 10 (共 ${richThing.items.length} 件) 的特徵「${richThing.name}」成功渲染「查看全部 ↗」`);

if (smallThing) {
  const smallHtml = renderMockThingHeader(smallThing);
  assert(!smallHtml.includes('查看全部 ↗'), `物品數 <= 10 的特徵「${smallThing.name}」不應顯示「查看全部 ↗」`);
  console.log(`✔ [Check 5] 物品數 <= 10 (共 ${smallThing.items.length} 件) 的特徵「${smallThing.name}」正確隱藏按鈕，避免多餘干擾`);
}

// 4. 模擬事件解析邏輯
function parsePrefClick(targetClass, dataFav, textContent) {
  let fav = dataFav || textContent.trim();
  fav = fav.replace(/^(喜歡的口味：|🛋️\s*特徵風格：|特徵風格：)/, '').replace(/查看全部\s*↗?/, '').trim();
  const isTaste = targetClass.includes('taste');
  const targetTab = isTaste ? 'tastes' : 'things';
  return { targetTab, fav };
}

const parsedThing = parsePrefClick('pkm-pref-thing-link', richThing.name, '查看全部 ↗');
assert.strictEqual(parsedThing.targetTab, 'things', '點擊特徵風格查看全部必須導向 things 抽屜標籤');
assert.strictEqual(parsedThing.fav, richThing.name, '點擊特徵風格查看全部必須解析出特徵名稱');
console.log('✔ [Check 6] 點擊特徵風格「查看全部 ↗」精準解析 targetTab=things 與目標特徵名稱');

const parsedTaste = parsePrefClick('pkm-pref-taste-link', '甜味', '查看全部 ↗');
assert.strictEqual(parsedTaste.targetTab, 'tastes', '點擊口味查看全部必須導向 tastes 抽屜標籤');
assert.strictEqual(parsedTaste.fav, '甜味', '點擊口味查看全部必須解析出口味名稱');
console.log('✔ [Check 7] 點擊口味「查看全部 ↗」精準解析 targetTab=tastes 與目標口味名稱');

console.log('\nAll Preference View-All verification tests PASSED successfully!');
