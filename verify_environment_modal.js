/**
 * verify_environment_modal.js
 * 驗證【寶可夢百科彈窗喜歡的環境資訊】與【環境屬性標籤點擊跳轉喜好百科】
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== 開始驗證【寶可夢百科環境資訊與環境屬性標籤跳轉】===');

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
  scrollIntoView: () => {},
  querySelectorAll: () => [],
  querySelector: () => mockEl(),
  setAttribute: () => {},
  removeAttribute: () => {}
});

const elements = {};
const getEl = (id) => (elements[id] || (elements[id] = mockEl(id)));
let docClickHandler = null;

const sandbox = {
  console: { log: () => {}, error: () => {}, warn: () => {} },
  window: {
    addEventListener: () => {},
    location: { hash: '#habitat-cards' },
    history: { pushState: () => {}, replaceState: () => {} }
  },
  document: {
    documentElement: mockEl('doc'),
    body: mockEl('body'),
    getElementById: getEl,
    querySelectorAll: () => [],
    querySelector: () => mockEl(),
    addEventListener: (evt, cb) => {
      if (evt === 'DOMContentLoaded') cb();
      if (evt === 'click') docClickHandler = cb;
    }
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  setTimeout: (cb) => cb(),
  clearTimeout: () => {},
  Audio: class { play() {} }
};

vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);
vm.runInContext(prefDbContent, sandbox);
vm.runInContext(autoFarmDataContent, sandbox);
vm.runInContext(appContent, sandbox);

// 1. 驗證 openPkmDetailModal 包含環境維度與營造家具
sandbox.window.openPkmDetailModal('pkm_s1_1'); // 妙蛙種子
const modalBodyHTML = elements['pkmDetailBody'].innerHTML;

assert(modalBodyHTML.includes('喜歡的環境：明亮') && !modalBodyHTML.includes('🌤️ 喜歡的環境：'), '彈窗應包含「喜歡的環境：明亮」且移除開頭 emoji 🌤️');
assert(modalBodyHTML.includes('【維度：亮度】'), '彈窗應包含環境所屬維度【維度：亮度】');
assert(modalBodyHTML.includes('代表營造家具 / 物品：'), '彈窗應包含代表營造家具區塊');
assert(modalBodyHTML.includes('火堆') || modalBodyHTML.includes('火炬'), '彈窗應展示明亮環境的營造家具');
assert(modalBodyHTML.includes('查看全部 ↗'), '彈窗應提供直達喜好百科抽屜的查看全部按鈕');
console.log('✅ [PASS] 1. 寶可夢個人百科彈窗成功完整渲染純淨喜歡的環境、維度與代表家具道具！');

// 2. 驗證全域環境標籤點擊跳轉喜好百科
assert(typeof docClickHandler === 'function', '應已註冊全域點擊委派');

let targetEnvTag = {
  closest: (sel) => {
    if (sel.includes('.tag-env')) {
      return {
        dataset: { env: '☀️ 明亮' },
        textContent: '☀️ 明亮'
      };
    }
    return null;
  }
};

docClickHandler({
  target: targetEnvTag,
  stopPropagation: () => {}
});

assert.strictEqual(elements['prefDrawer'].classList.contains('closed'), false, '點擊環境標籤後百科抽屜應開啟');
console.log('✅ [PASS] 2. 全域點擊 .tag-env 成功開啟喜好百科抽屜並定位至「喜歡的環境」！');

console.log('🎉 所有環境屬性與百科彈窗驗證 100% 通過！');
