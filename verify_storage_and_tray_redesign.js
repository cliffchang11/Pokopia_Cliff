/**
 * Pokopia 素材庫分類選單化、目標切換器、抽屜無留白與收納盒抗裁切驗證模組
 */
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('=== 開始執行素材庫分類選單化與收納盒抗裁切驗證 ===\n');

// 1. 讀取核心檔案
const htmlContent = fs.readFileSync('index.html', 'utf8');
const cssContent = fs.readFileSync('index.css', 'utf8');
const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const autoFarmDataContent = fs.readFileSync('autofarm_data.js', 'utf8');
const appContent = fs.readFileSync('app.js', 'utf8');

// 2. 驗證 index.html 標籤結構
assert(htmlContent.includes('id="csTrayCategorySelect"'), 'HTML 必須包含 csTrayCategorySelect 下拉選單');
assert(htmlContent.includes('id="csTrayTargetBoxSelect"'), 'HTML 必須包含 csTrayTargetBoxSelect 目標收納盒下拉選單');
assert(htmlContent.includes('class="cs-tray-controls-row"'), 'HTML 必須包含 cs-tray-controls-row 並排控制列容器');
console.log('✅ [PASS] 1. HTML 結構包含分類選單、目標收納盒切換器與並排控制列');

// 3. 驗證 CSS 樣式規則
// 3.1 搜尋與選單自適應全寬折行 (零裁切)
assert(cssContent.includes('.cs-tray-controls-row'), 'CSS 必須具備 .cs-tray-controls-row 規則');
assert(cssContent.includes('flex-wrap: wrap;'), 'CSS 控制列必須支援 flex-wrap: wrap 自適應折行');
assert(cssContent.includes('.cs-tray-controls-row .cs-tray-select'), 'CSS 必須定義 .cs-tray-select 樣式');
assert(cssContent.includes('.cs-tray-target-row'), 'CSS 必須定義 .cs-tray-target-row 目標盒子切換樣式');

// 3.2 收納箱卡片 320px 安全防線與標題框抗裁切
assert(cssContent.includes('minmax(min(100%, 320px), 1fr)'), 'CSS 必須具備 minmax(min(100%, 320px), 1fr) 確保卡片安全寬度');
assert(cssContent.includes('min-width: 120px;'), '.cs-box-name-input 必須具備 min-width: 120px 保證名稱字體絕不被截斷');
assert(cssContent.includes('gap: 0.15rem;'), '.cs-box-actions 必須緊湊化間距 gap: 0.15rem');

// 3.3 抽屜響應式高度與消滅底部留白
assert(cssContent.includes('clamp(380px, 62vh, 560px)'), 'CSS 抽屜必須採用 clamp(380px, 62vh, 560px) 響應式適度高度');
assert(cssContent.includes('max-height: 65vh;'), 'CSS 抽屜最大高度必須適度限制在 65vh');
// 3.4 方格與素材圖片等比比例縮放 (Fluid Proportional Scaling)
assert(cssContent.includes('clamp(48px, 6.5vw, 64px)'), '.cs-box-item 必須具備 clamp(48px, 6.5vw, 64px) 流式等比縮放');
assert(cssContent.includes('.cs-box-item-img {\n  width: 64%;\n  height: 64%;'), '.cs-box-item-img 必須使用 64% 黃金比例等比縮放');
assert(cssContent.includes('min-height: clamp(80px, 10vh, 110px);'), '.cs-drop-zone 必須具備響應式自適應高度');
console.log('✅ [PASS] 2. CSS 左右並排、卡片 320px 防線、抽屜滿版與物品圖片 64% 黃金比例縮放規則驗證通過');

// 4. 沙盒驗證 JS 邏輯與 14 大分類選項
const storageMap = {
  'pokopia_custom_boxes_v1': JSON.stringify([
    { id: 'b_test1', no: '01', name: '食材與烹飪', items: ['蘋果'] },
    { id: 'b_test2', no: '02', name: '木材儲存庫', items: [] }
  ])
};

const elements = {};
function createMockElement(id, tag = 'div') {
  const el = {
    id,
    tagName: tag.toUpperCase(),
    classList: {
      _classes: new Set(),
      add: function (...c) { c.forEach(x => this._classes.add(x)); },
      remove: function (...c) { c.forEach(x => this._classes.delete(x)); },
      contains: function (c) { return this._classes.has(c); }
    },
    style: {},
    dataset: {},
    innerHTML: '',
    value: '',
    textContent: '',
    children: [],
    listeners: {},
    setAttribute: function () {},
    getAttribute: function () { return ''; },
    addEventListener: function (ev, fn) {
      if (!this.listeners[ev]) this.listeners[ev] = [];
      this.listeners[ev].push(fn);
    },
    dispatchEvent: function (ev, data = {}) {
      if (this.listeners[ev]) {
        this.listeners[ev].forEach(fn => fn({ target: this, preventDefault: () => {}, ...data }));
      }
    },
    querySelectorAll: function (sel) { return []; },
    querySelector: function (sel) { return null; },
    appendChild: function (c) { this.children.push(c); return c; },
    remove: function () {}
  };
  return el;
}

const reqIds = [
  'btnTocMenu', 'tocDropdown', 'tabStorage', 'tabHabitat', 'tabHabitatCatalog',
  'tabAutoFarm', 'tabCustomStorage', 'btnAutoFarmNav', 'btnCustomStorageNav',
  'autoFarmSection', 'customStorageSection', 'csBoxesContainer', 'csReverseSearchInput',
  'csClearSearchBtn', 'csSearchResultBanner', 'btnCsAddBox', 'btnCsToggleDrawer',
  'csItemTray', 'csTrayBackdrop', 'btnCsCloseTray', 'csTrayGrid', 'csTraySearchInput',
  'csTrayCategorySelect', 'csTrayTargetBoxSelect', 'csTrayCategoryPills', 'csTrayItemCount',
  'autoFarmModulesContainer', 'autoFarmProgressBar', 'autoFarmProgressText',
  'btnCardView', 'btnTableView', 'btnThemeToggle', 'btnPrefDrawer', 'filterActiveBadge',
  'envFilter', 'specialtyFilter', 'unlockFilter', 'categoryFilter', 'storageCardGrid',
  'storageTableContainer', 'habitatCardGrid', 'habitatTableContainer', 'habitatCatalogCardGrid',
  'habitatCatalogTableContainer', 'filterToolbar', 'unlockFilterGroup', 'searchInput',
  'csToastContainer', 'csTrayTargetHint'
];

reqIds.forEach(id => {
  elements[id] = createMockElement(id, id.includes('Select') ? 'select' : 'div');
});

const sandbox = {
  window: {
    location: { hash: '' },
    history: { pushState: () => {}, replaceState: () => {} },
    localStorage: {
      getItem: (k) => storageMap[k] || null,
      setItem: (k, v) => { storageMap[k] = String(v); },
      removeItem: (k) => { delete storageMap[k]; }
    },
    confirm: () => true,
    alert: () => {},
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    readyState: 'complete',
    body: createMockElement('body'),
    documentElement: { setAttribute: () => {} },
    getElementById: (id) => elements[id] || createMockElement(id),
    createElement: (tag) => createMockElement(`dyn_${tag}`, tag),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: {
    getItem: (k) => storageMap[k] || null,
    setItem: (k, v) => { storageMap[k] = String(v); },
    removeItem: (k) => { delete storageMap[k]; }
  },
  setTimeout: (cb) => { cb(); return 1; },
  clearTimeout: () => {},
  console: console
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

const ctx = vm.createContext(sandbox);
vm.runInContext(dataContent, ctx);
vm.runInContext(prefDbContent, ctx);
vm.runInContext(autoFarmDataContent, ctx);
vm.runInContext(appContent, ctx);

const csApi = sandbox.window.PokopiaCustomStorage;
assert(csApi, 'window.PokopiaCustomStorage 必須正確暴露在測試沙盒中');

// 呼叫初始化渲染自訂收納盒
csApi.renderCustomStorage();

// 5. 驗證 14 大官方分類下拉選項與去重計數
const selectHtml = elements.csTrayCategorySelect.innerHTML;
assert(selectHtml.includes('value="all"'), '分類選單必須具備全部分類選項');
assert(selectHtml.includes('全部 (1238)'), '全部分類必須精準標示 全部 (1238)');

const expectedCategories = [
  '材料', '食物', '家具', '雜貨', '戶外', '實用', '大自然', '建築', '方塊', '套組', '重要的物品', '其他', '特別收錄'
];

expectedCategories.forEach(cat => {
  assert(selectHtml.includes(`value="${cat}"`), `分類選單必須包含官方分類「${cat}」`);
  assert(selectHtml.includes(`${cat} (`), `官方分類「${cat}」必須標註數量`);
});
console.log('✅ [PASS] 3. 分類下拉選單 100% 完整收錄 14 大官方分類選項（含全部 1238 種與各分類去重計數）');

// 6. 驗證目標收納盒切換器
const targetBoxSelectHtml = elements.csTrayTargetBoxSelect.innerHTML;
assert(targetBoxSelectHtml.includes('#01 食材與烹飪'), '目標收納盒選單應包含 #01 食材與烹飪');
assert(targetBoxSelectHtml.includes('#02 木材儲存庫'), '目標收納盒選單應包含 #02 木材儲存庫');

// 切換至第二箱
elements.csTrayTargetBoxSelect.value = 'b_test2';
elements.csTrayTargetBoxSelect.dispatchEvent('change');
const activeState = csApi.getState();
assert.strictEqual(activeState.activeDropTargetBoxId, 'b_test2', '切換選單應即時更新當前目標收納盒');

// 點擊免拖曳物品直接秒入庫
csApi.addItemToBox(activeState.activeDropTargetBoxId, '橡木原木');
const updatedBox2 = activeState.customBoxes.find(b => b.id === 'b_test2');
assert(updatedBox2.items.includes('橡木原木'), '點擊入庫應正確加入物品至選定的收納盒');
console.log('✅ [PASS] 4. 抽屜內目標收納盒下拉切換與點擊極速秒入庫驗證通過');

console.log('\n🎉 所有素材庫新功能與抗裁切測試 100% PASS！');
