/**
 * Offline Verification Script:
 * 1. Verify CSS and JS syntax
 * 2. Verify 2-row effect layout & expanded ingredients container
 * 3. Verify specialty badge rendered at the end of ingredients with .tag-specialty class
 * 4. Verify openRecipeDetailModal renders gamertw-style cards, specialty pokemons, and liked pokemons
 * NO BROWSER INVOKED.
 */
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('--- 開始離線驗證食譜卡片排版與詳情 Modal ---');

// 1. 讀取所需檔案
const htmlContent = fs.readFileSync('index.html', 'utf8');
const cssContent = fs.readFileSync('index.css', 'utf8');
const recipeDbCode = fs.readFileSync('recipe_db.js', 'utf8');
const dataJsCode = fs.readFileSync('data.js', 'utf8');
const recipeJsCode = fs.readFileSync('recipe.js', 'utf8');

// 2. 驗證 index.html 中是否包含 Modal 結構與正確版號 4.12.14
assert(htmlContent.includes('id="recipeDetailModal"'), 'index.html 必須包含 id="recipeDetailModal" 元素');
assert(htmlContent.includes('recipe.js?v=4.12.14'), 'index.html 必須將 recipe.js 版號升級至 4.12.14');
assert(htmlContent.includes('index.css?v=4.12.14'), 'index.html 必須將 index.css 版號升級至 4.12.14');
console.log('✓ index.html 結構與快取版號 4.12.14 檢查通過');

// 3. 驗證 index.css 中包含雙行排版與 Modal 樣式，且採用溫和收斂的 PWA 流體公式
assert(cssContent.includes('.recipe-modal-backdrop'), 'index.css 必須包含 .recipe-modal-backdrop 樣式');
assert(cssContent.includes('.recipe-modal-container'), 'index.css 必須包含 .recipe-modal-container 樣式');
assert(cssContent.includes('.recipe-modal-pkm-grid'), 'index.css 必須包含 .recipe-modal-pkm-grid 網格樣式');
assert(!cssContent.includes('max-height: 220px'), 'index.css 中 .recipe-modal-pkm-grid 必須取消 max-height: 220px 小捲軸限制');
assert(!cssContent.includes('.recipe-row-col-poke'), 'index.css 中必須移除 .recipe-row-col-poke 愛心按鈕樣式');
assert(cssContent.includes('justify-content: flex-start;'), 'index.css 中 .recipe-row 必須靠左對齊 (justify-content: flex-start)');
assert(cssContent.includes('clamp(0.85rem, 0.75rem + 0.35vw, 1.05rem)'), 'index.css 必須採用平滑溫和收斂的 PWA 流體公式');
assert(cssContent.includes('min-height: 1.95rem;'), 'index.css 必須在電腦版將篩選按鈕精巧化為微膠囊 (min-height: 1.95rem)');
console.log('✓ index.css PWA 流體字級公式、全視窗溫和微縮與微膠囊修飾通過');

// 4. 建立 Mock DOM 沙盒環境執行 recipe.js
const mockDomElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerHTML: '',
    textContent: '',
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    style: {},
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    addEventListener() {},
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
}

const sandbox = {
  window: {},
  document: {
    getElementById(id) {
      if (!mockDomElements[id]) {
        mockDomElements[id] = createMockElement(id);
      }
      return mockDomElements[id];
    },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    addEventListener() {},
    body: { style: {} }
  },
  console: console,
  SPECIALTY_ICONS: {
    '伐木': '🪵', '碾壓': '🪨', '滋潤': '💧', '點火': '🔥', '飛翔': '🍃'
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

// 執行 data.js, recipe_db.js, recipe.js
vm.runInContext(dataJsCode, sandbox);
vm.runInContext(recipeDbCode, sandbox);
vm.runInContext(recipeJsCode, sandbox);

assert(sandbox.RecipeModule, 'RecipeModule 必須成功掛載到 window');
assert(typeof sandbox.RecipeModule.render === 'function', 'RecipeModule.render 必須為函式');
assert(typeof sandbox.RecipeModule.openDetail === 'function', 'RecipeModule.openDetail 必須為函式');

// 5. 測試卡片渲染 HTML
sandbox.RecipeModule.render();
const gridHtml = mockDomElements['recipeCardGrid'].innerHTML;
assert(gridHtml.length > 0, 'recipeCardGrid 必須渲染出內容');

// 檢查右側效果區是否為雙行結構，且文字一律靠左
assert(gridHtml.includes('recipe-row-effects-section'), '卡片中必須包含 recipe-row-effects-section 效果容器');
assert(gridHtml.includes('recipe-row-col-move'), '卡片中必須包含 recipe-row-col-move 上行招式欄位');
assert(gridHtml.includes('recipe-row-col-snorlax'), '卡片中必須包含 recipe-row-col-snorlax 下行卡比獸效果欄位');
assert(!gridHtml.includes('recipe-card-poke-trigger'), '卡片中必須徹底取消 recipe-card-poke-trigger 愛心按鈕');
assert(!gridHtml.includes('recipe-row-col-poke'), '卡片中必須徹底取消 recipe-row-col-poke 欄位');
console.log('✓ 料理卡片右側雙行效果起跑線對齊且愛心按鈕已徹底取消');

// 檢查食材在第一行，專長徽章獨立在第二行
assert(gridHtml.includes('recipe-row-ing-list'), '食材區必須包含第一行純食材容器 recipe-row-ing-list');
assert(gridHtml.includes('recipe-row-spec-line'), '專長必須獨立在第二行容器 recipe-row-spec-line');
assert(gridHtml.includes('tag-specialty recipe-spec-tag'), '專長徽章必須帶有 tag-specialty recipe-spec-tag 類別（與寶可夢圖鑑一致）');
assert(gridHtml.includes('data-spec="伐木"'), '卡片中必須渲染有需要「伐木」的專長標籤');
console.log('✓ 第一行純食材、第二行獨立工作專長結構檢查通過');

// 6. 測試開啟專屬食譜詳情 Modal
// 測試絲絲沙拉 (recipe_004) - 需要伐木，酸酸的
sandbox.RecipeModule.openDetail('recipe_004');
const modalBodyHtml = mockDomElements['recipeModalBody'].innerHTML;
const modalTitle = mockDomElements['recipeModalTitle'].textContent;

assert.strictEqual(modalTitle, '絲絲沙拉', 'Modal 標題應為「絲絲沙拉」');
assert(modalBodyHtml.includes('會「伐木」的寶可夢 (32)'), 'Modal 應正確識別會伐木的寶可夢共 32 隻');
assert(modalBodyHtml.includes('大比鳥'), '會伐木的名單中應包含大比鳥');
assert(modalBodyHtml.includes('飛天螳螂'), '會伐木的名單中應包含飛天螳螂');
assert(modalBodyHtml.includes('喜歡這道菜的寶可夢 (72)'), 'Modal 應正確識別喜愛酸酸的的寶可夢共 72 隻');
assert(modalBodyHtml.includes('妙蛙草'), '喜愛名單中應包含妙蛙草');
assert(modalBodyHtml.includes('特殊效果與效益'), 'Modal 應包含特殊效果與效益卡片');
assert(!mockDomElements['recipeDetailModal'].classList.contains('hidden'), '開啟詳情後 Modal 必須移除 hidden');

console.log('✓ gamertw 風格專屬食譜詳情 Modal 正確展示會該專長的 32 隻寶可夢與喜愛該菜的 72 隻寶可夢！');
console.log('--- 全部離線檢驗 100% 通過 ---');
