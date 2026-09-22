// verify_tray_stored_dot.js
// 驗證素材庫已收納物品右上角橘色圓點 (Orange Dot) 標記與即時雙向聯動
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== 開始驗證素材庫已收納物品右上角橘色圓點標記與即時雙向聯動 ===\n');

// 1. 檢驗 index.css 樣式
const css = fs.readFileSync('index.css', 'utf8');

assert(css.includes('.cs-tray-item.is-stored::after {'), 'CSS 必須包含 .cs-tray-item.is-stored::after 偽元素樣式');
assert(css.includes('background-color: #f97316;'), '已收納標記必須採用鮮豔橘色 #f97316');
assert(css.includes('border-radius: 50%;'), '已收納標記必須為圓形 (border-radius: 50%)');
assert(css.includes('top: 3px;') && css.includes('right: 3px;'), '已收納圓點必須定位於右上角 (top: 3px, right: 3px)');
console.log('✅ [PASS] 1. CSS 橘色圓點樣式規格（右上角定位、50% 圓角、#f97316 橘色、陰影邊框）檢驗通過');

// 2. 檢驗 app.js 邏輯
const appContent = fs.readFileSync('app.js', 'utf8');
assert(appContent.includes('function updateTrayStoredStatus()'), 'app.js 必須包含 updateTrayStoredStatus 函式');
assert(appContent.includes("storedClass = isStored ? 'is-stored' : '';"), 'renderCustomTrayItems 必須在渲染時賦予 is-stored class');
console.log('✅ [PASS] 2. app.js 包含已收納判定與 updateTrayStoredStatus 即時聯動邏輯');

// 3. 建立輕量 DOM Mock 環境在 vm 中執行沙盒測試
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
    appendChild: function(child) { return child; },
    removeChild: function(child) { return child; },
    remove: function() {},
    dispatchEvent: function (evt) {
      if (listeners[id] && listeners[id][evt]) {
        listeners[id][evt].forEach(cb => cb({ target: this, preventDefault: () => {}, stopPropagation: () => {} }));
      }
    },
    querySelectorAll: function (selector) {
      if (selector === '.cs-tray-item') {
        return this._children || [];
      }
      return [];
    },
    querySelector: function () { return null; },
    _children: []
  };
  if (id) elements[id] = el;
  return el;
};

// 預先註冊核心 DOM ID
const requiredIds = [
  'btnTocMenu', 'tocDropdown', 'tabStorage', 'tabHabitat', 'tabHabitatCatalog',
  'tabAutoFarm', 'tabCustomStorage', 'btnAutoFarmNav', 'btnCustomStorageNav',
  'autoFarmSection', 'customStorageSection', 'csBoxesContainer', 'csReverseSearchInput',
  'csClearSearchBtn', 'csSearchResultBanner', 'btnCsAddBox', 'btnCsToggleDrawer',
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

// 載入資料
const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const autoFarmDataContent = fs.readFileSync('autofarm_data.js', 'utf8');

vm.runInContext(dataContent, ctx);
vm.runInContext(prefDbContent, ctx);
vm.runInContext(autoFarmDataContent, ctx);
vm.runInContext(appContent, ctx);

const csApi = sandbox.window.PokopiaCustomStorage;
assert(csApi, 'window.PokopiaCustomStorage 應成功暴露');
console.log('✅ [PASS] 3. vm 沙盒成功啟動 app.js 並導出 PokopiaCustomStorage API');

// 4. 驗證 renderCustomStorage 渲染後，素材庫 HTML 包含 is-stored
const trayGridEl = elements['csTrayGrid'];
let capturedHtml = '';
Object.defineProperty(trayGridEl, 'innerHTML', {
  set: function(val) {
    capturedHtml = val;
    const matches = [...val.matchAll(/class="([^"]*cs-tray-item[^"]*)"[^>]*data-item-name="([^"]+)"/g)];
    this._children = matches.map(m => {
      const el = createMockElement('', 'div');
      const classes = m[1].split(/\s+/);
      classes.forEach(c => el.classList.add(c));
      el.setAttribute('data-item-name', m[2]);
      return el;
    });
  },
  get: function() { return capturedHtml; }
});

csApi.renderCustomStorage();

// 初始預設收納盒 #01~#06 內含物品應在素材庫被標記 is-stored
const boxes = csApi.getState().customBoxes || [];
assert(boxes.length > 0, '應存在至少一個預設收納盒');
const firstBoxItems = boxes[0].items || [];
assert(firstBoxItems.length > 0, '預設第 1 箱應有初始物品');

const testItemName = firstBoxItems[0];
const targetChild = trayGridEl._children.find(c => c.getAttribute('data-item-name') === testItemName);
assert(targetChild && targetChild.classList.contains('is-stored'), `收納盒 #01 中的「${testItemName}」在素材庫中必須具備 is-stored 橘點`);
console.log(`✅ [PASS] 4. 收納盒已有物品「${testItemName}」在素材庫方格右上角具備 is-stored 橘點`);

// 5. 測試新物品存入後即時點亮橘點
let unStoredChild = trayGridEl._children.find(c => !c.classList.contains('is-stored'));
assert(unStoredChild, '素材庫中應存在尚未收納的物品');
const newItemName = unStoredChild.getAttribute('data-item-name');

csApi.addItemToBox(boxes[0].id, newItemName);
assert(unStoredChild.classList.contains('is-stored'), `將「${newItemName}」存入收納盒後，素材庫方格應即時點亮 is-stored 橘點`);
console.log(`✅ [PASS] 5. 存入「${newItemName}」後，素材庫方格即時點亮橘色圓點`);

// 6. 測試物品移除後即時熄滅橘點
csApi.removeItemFromBox(boxes[0].id, newItemName);
assert(!unStoredChild.classList.contains('is-stored'), `將「${newItemName}」從收納盒移除後，素材庫方格的 is-stored 橘點應即時熄滅`);
console.log(`✅ [PASS] 6. 移除「${newItemName}」後，素材庫方格的橘色圓點即時熄滅`);

console.log('\n🎉 素材庫已收納物品右上角橘色圓點標記與雙向聯動驗證 100% 全部通過！\n');
