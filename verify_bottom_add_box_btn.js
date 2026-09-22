// verify_bottom_add_box_btn.js
// 驗證自訂收納盒最底端居中小膠囊按鈕 (btnCsAddBoxBottom) 的 DOM 結構、樣式與新增聯動
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== 開始驗證自訂收納盒底端居中新增按鈕功能 ===\n');

// 1. 檢驗 index.html
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="btnCsAddBoxBottom"'), 'index.html 必須包含 #btnCsAddBoxBottom 按鈕');
assert(html.includes('class="cs-bottom-add-wrap"'), 'index.html 必須包含 .cs-bottom-add-wrap 容器');
assert(html.includes('class="cs-bottom-add-btn"'), 'index.html 必須包含 .cs-bottom-add-btn 樣式類別');
console.log('✅ [PASS] 1. index.html 包含底端居中按鈕 DOM 結構與語意標籤');

// 2. 檢驗 index.css 樣式
const css = fs.readFileSync('index.css', 'utf8');
assert(css.includes('.cs-bottom-add-wrap {'), 'CSS 必須包含 .cs-bottom-add-wrap');
assert(css.includes('justify-content: center;'), '底端按鈕容器必須水平居中 (justify-content: center)');
assert(css.includes('.cs-bottom-add-btn {'), 'CSS 必須包含 .cs-bottom-add-btn');
assert(css.includes('border-radius: 9999px;'), '底端按鈕必須採用圓角膠囊 (border-radius: 9999px)');
console.log('✅ [PASS] 2. index.css 包含底端居中小膠囊按鈕樣式 (圓角膠囊、居中對齊、微陰影)');

// 3. 檢驗 app.js 邏輯與事件綁定
const appContent = fs.readFileSync('app.js', 'utf8');
assert(appContent.includes("btnCsAddBoxBottom: document.getElementById('btnCsAddBoxBottom')"), 
  'app.js DOM 物件必須註冊 btnCsAddBoxBottom');
assert(appContent.includes("DOM.btnCsAddBoxBottom.addEventListener('click', addNewBox);"),
  'app.js 必須為 btnCsAddBoxBottom 綁定點擊事件至 addNewBox');
console.log('✅ [PASS] 3. app.js 正確註冊元素並綁定 addNewBox 雙通道新增');

// 4. 沙盒模擬點擊底部新增按鈕
const elements = {};
const listeners = {};
const storageMap = {};

const createMockElement = (id = '', tagName = 'div') => {
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    innerHTML: '',
    textContent: '',
    value: '',
    title: '',
    style: {},
    dataset: {},
    _attrs: {},
    setAttribute: function(k, v) { this._attrs[k] = String(v); },
    getAttribute: function(k) { return this._attrs[k] || null; },
    hasAttribute: function(k) { return k in this._attrs; },
    classList: {
      _classes: new Set(),
      add: function (...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function (...cls) { cls.forEach(c => this._classes.delete(c)); },
      toggle: function (c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); },
      contains: function (c) { return this._classes.has(c); }
    },
    addEventListener: function (evt, cb) {
      if (!listeners[id]) listeners[id] = {};
      if (!listeners[id][evt]) listeners[id][evt] = [];
      listeners[id][evt].push(cb);
    },
    dispatchEvent: function (evt) {
      if (listeners[id] && listeners[id][evt]) {
        listeners[id][evt].forEach(cb => cb({ target: this, preventDefault: () => {}, stopPropagation: () => {} }));
      }
    },
    appendChild: function(c) { return c; },
    removeChild: function(c) { return c; },
    remove: function() {},
    scrollIntoView: function() {},
    focus: function() {},
    select: function() {},
    querySelectorAll: function () { return []; },
    querySelector: function () { return createMockElement('subInput', 'input'); },
    _children: []
  };
  if (id) elements[id] = el;
  return el;
};

const requiredIds = [
  'btnTocMenu', 'tocDropdown', 'tabStorage', 'tabHabitat', 'tabHabitatCatalog',
  'tabAutoFarm', 'tabCustomStorage', 'btnAutoFarmNav', 'btnCustomStorageNav',
  'autoFarmSection', 'customStorageSection', 'csBoxesContainer', 'csReverseSearchInput',
  'csClearSearchBtn', 'csSearchResultBanner', 'btnCsAddBox', 'btnCsAddBoxBottom', 'btnCsToggleDrawer',
  'csItemTray', 'csTrayBackdrop', 'btnCsCloseTray', 'csTrayGrid', 'csTraySearchInput',
  'csTrayCategorySelect', 'csTrayCategoryPills', 'csTrayTargetBoxSelect', 'csTrayItemCount',
  'autoFarmModulesContainer', 'autoFarmProgressBar', 'autoFarmProgressText',
  'btnCardView', 'btnTableView', 'btnThemeToggle', 'btnPrefDrawer', 'filterActiveBadge',
  'envFilter', 'specialtyFilter', 'unlockFilter', 'categoryFilter', 'storageCardGrid',
  'storageTableContainer', 'habitatCardGrid', 'habitatTableContainer', 'habitatCatalogCardGrid',
  'habitatCatalogTableContainer', 'filterToolbar', 'unlockFilterGroup', 'searchInput',
  'csToastContainer', 'csTrayTargetHint'
];
requiredIds.forEach(id => createMockElement(id));

const mockStorage = {
  getItem: (k) => (storageMap[k] !== undefined ? storageMap[k] : null),
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};

const sandbox = {
  console: { log: () => {}, warn: () => {}, error: console.error },
  document: {
    readyState: 'complete',
    documentElement: { setAttribute: () => {} },
    body: createMockElement('body', 'body'),
    getElementById: (id) => elements[id] || createMockElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  window: {
    location: { hash: '' },
    history: { pushState: () => {}, replaceState: () => {} },
    localStorage: mockStorage,
    confirm: () => true,
    alert: () => {},
    setTimeout: (cb) => { cb(); return 1; },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: mockStorage,
  setTimeout: (cb) => { cb(); return 1; },
  clearTimeout: () => {},
  navigator: { userAgent: 'node' }
};
sandbox.window.document = sandbox.document;
sandbox.window.window = sandbox.window;

const ctx = vm.createContext(sandbox);

const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const autoFarmDataContent = fs.readFileSync('autofarm_data.js', 'utf8');

vm.runInContext(dataContent, ctx);
vm.runInContext(prefDbContent, ctx);
vm.runInContext(autoFarmDataContent, ctx);
vm.runInContext(appContent, ctx);

const csApi = sandbox.window.PokopiaCustomStorage;
csApi.renderCustomStorage();

const initialBoxesCount = (csApi.getState().customBoxes || []).length;
console.log(`初始收納盒數量: ${initialBoxesCount} 個`);

// 模擬點擊底端新增按鈕
assert(listeners['btnCsAddBoxBottom'] && listeners['btnCsAddBoxBottom']['click'], 
  'btnCsAddBoxBottom 必須註冊 click 事件監聽');

elements['btnCsAddBoxBottom'].dispatchEvent('click');

const newBoxesCount = (csApi.getState().customBoxes || []).length;
assert(newBoxesCount === initialBoxesCount + 1, `點擊底部按鈕後收納盒數量應為 ${initialBoxesCount + 1}，實測為 ${newBoxesCount}`);

const newestBox = csApi.getState().customBoxes[newBoxesCount - 1];
console.log(`✅ [PASS] 4. 點擊底端按鈕成功在末尾新增收納盒: #${newestBox.no} ${newestBox.name}`);

console.log('\n🎉 底端居中小膠囊新增收納盒按鈕功能 100% 全部通過！\n');
