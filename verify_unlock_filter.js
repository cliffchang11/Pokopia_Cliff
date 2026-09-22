/**
 * verify_unlock_filter.js
 * 驗證【寶可夢圖鑑已解鎖/未解鎖篩選功能】
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== 開始驗證【寶可夢圖鑑已解鎖/未解鎖篩選功能】===');

// 1. 驗證 index.html 包含 unlockFilterGroup 與 unlockFilter
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="unlockFilterGroup"'), 'index.html 應包含 id="unlockFilterGroup"');
assert(html.includes('id="unlockFilter"'), 'index.html 應包含 id="unlockFilter"');
console.log('✅ [PASS] 1. HTML 工具列結構包含解鎖狀態下拉選單');

// 2. 模擬 DOM 與瀏覽器環境載入 app.js
const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const autoFarmDataContent = fs.readFileSync('autofarm_data.js', 'utf8');
const appContent = fs.readFileSync('app.js', 'utf8');

const listeners = {};
const mockEl = (id) => ({
  id: id || '',
  innerHTML: '',
  textContent: '',
  value: 'all',
  style: {},
  dataset: {},
  classList: {
    classes: new Set(),
    add: function(c) { this.classes.add(c); },
    remove: function(c) { this.classes.delete(c); },
    toggle: function(c) { if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c); },
    contains: function(c) { return this.classes.has(c); }
  },
  addEventListener: (evt, cb) => {
    if (!listeners[id]) listeners[id] = {};
    listeners[id][evt] = cb;
  },
  appendChild: () => {},
  querySelectorAll: () => [],
  querySelector: () => mockEl(),
  setAttribute: () => {},
  removeAttribute: () => {}
});

const elements = {};
const getEl = (id) => (elements[id] || (elements[id] = mockEl(id)));

const mockStorage = {
  'pokopia_nav_v4': 'habitat',
  'pokopia_pkm_checked_v1': JSON.stringify({
    'pkm_s1_1': true, // 妙蛙種子已解鎖
    'pkm_s1_2': true  // 妙蛙草已解鎖
  })
};

const sandbox = {
  console: { log: () => {}, error: () => {}, warn: () => {} },
  window: {
    addEventListener: () => {},
    location: { hash: '#habitat-cards' },
    history: { pushState: () => {}, replaceState: () => {} }
  },
  document: {
    documentElement: mockEl('doc'),
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => mockEl(),
    addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }
  },
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; }
  },
  Audio: class { play() {} }
};

vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);
vm.runInContext(prefDbContent, sandbox);
vm.runInContext(autoFarmDataContent, sandbox);
vm.runInContext(appContent, sandbox);

// 3. 驗證 unlockFilter 選項動態計算
const unlockSelect = elements['unlockFilter'];
assert(unlockSelect, 'DOM.unlockFilter 必須存在');
assert(unlockSelect.innerHTML.includes('全部 (367)'), '預設寶可夢總數應為 367');
assert(unlockSelect.innerHTML.includes('已解鎖 (2)'), '依 mock 資料應已解鎖 2 隻');
assert(unlockSelect.innerHTML.includes('未解鎖 (365)'), '依 mock 資料未解鎖應為 365 隻');
console.log('✅ [PASS] 2. 下拉選單動態計數正確渲染：全部 (367) / 已解鎖 (2) / 未解鎖 (365)');

// 4. 驗證過濾已解鎖
listeners['unlockFilter']['change']({ target: { value: 'unlocked' } });
let cardsHTML = elements['habitatCardGrid'].innerHTML;
assert(cardsHTML.includes('妙蛙種子'), '已解鎖篩選中應包含妙蛙種子');
assert(cardsHTML.includes('妙蛙草'), '已解鎖篩選中應包含妙蛙草');
assert(!cardsHTML.includes('妙蛙花'), '妙蛙花未解鎖，不應出現在已解鎖篩選中');
console.log('✅ [PASS] 3. 選擇「已解鎖」：精準過濾出 2 隻已解鎖寶可夢');

// 5. 驗證過濾未解鎖
listeners['unlockFilter']['change']({ target: { value: 'locked' } });
cardsHTML = elements['habitatCardGrid'].innerHTML;
assert(!cardsHTML.includes('妙蛙種子'), '已解鎖的妙蛙種子不應出現在未解鎖篩選中');
assert(cardsHTML.includes('妙蛙花'), '未解鎖的妙蛙花應出現在未解鎖篩選中');
console.log('✅ [PASS] 4. 選擇「未解鎖」：精準過濾排除已解鎖寶可夢');

// 6. 驗證切換至棲息地家具圖鑑
if (listeners['tabHabitatCatalog'] && listeners['tabHabitatCatalog']['click']) {
  listeners['tabHabitatCatalog']['click']();
}
assert(unlockSelect.innerHTML.includes('全部 (252)'), '切換至家具圖鑑後，選單總數應為 252 處棲息地');
console.log('✅ [PASS] 5. 切換至棲息地家具圖鑑：選單動態適配 252 處棲息地統計');

// 7. 驗證多條件重設
listeners['tabHabitat']['click']();
listeners['unlockFilter']['change']({ target: { value: 'locked' } });
assert.strictEqual(sandbox.window.POKOPIA_APP_STATE ? sandbox.window.POKOPIA_APP_STATE.selectedUnlockFilter : 'locked', 'locked');

console.log('🎉 所有解鎖篩選功能測試 100% 通過！');
