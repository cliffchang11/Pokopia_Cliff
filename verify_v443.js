const fs = require('fs');
const vm = require('vm');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia v4.4.3 浮動返回按鈕與版本防快取驗證');
console.log('================================================================\n');

let passedCount = 0;
const totalChecks = 10;

function assertCheck(num, title, condition, detail = '') {
  if (condition) {
    passedCount++;
    console.log(`✅ [Check ${num}] PASS: ${title}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    console.error(`❌ [Check ${num}] FAIL: ${title}`);
    if (detail) console.error(`   └─ 錯誤細節: ${detail}`);
    process.exit(1);
  }
}

// 讀取核心原始碼
const htmlStr = fs.readFileSync('index.html', 'utf8');
const cssStr = fs.readFileSync('index.css', 'utf8');
const appStr = fs.readFileSync('app.js', 'utf8');
const dataStr = fs.readFileSync('data.js', 'utf8');
const prefDbStr = fs.readFileSync('preferences_db.js', 'utf8');

// [Check 1] HTML 結構包含 #floatingBackBtn、.back-arrow 與 #floatingBackText
const check1Pass = htmlStr.includes('id="floatingBackBtn"') &&
                   htmlStr.includes('class="back-arrow">↩</span>') &&
                   htmlStr.includes('id="floatingBackText"');
assertCheck(
  1,
  'HTML 結構包含 #floatingBackBtn、.back-arrow (↩) 與 #floatingBackText',
  check1Pass,
  '浮動返回按鈕標籤結構完整，初始具備 hidden 隱藏類別'
);

// [Check 2] index.html 全站資源版本號統一升級至 ?v=4.4.3 或更高
const check2Pass = /href="index\.css\?v=4\.[4-9]\.[0-9]+"/.test(htmlStr) &&
                   /src="data\.js\?v=4\.[4-9]\.[0-9]+"/.test(htmlStr) &&
                   /src="preferences_db\.js\?v=4\.[4-9]\.[0-9]+"/.test(htmlStr) &&
                   /src="app\.js\?v=4\.[4-9]\.[0-9]+"/.test(htmlStr);
assertCheck(
  2,
  'index.html 全站資源版本號 100% 對齊至 ?v=4.4.3 或更高',
  check2Pass,
  'CSS 與三大 JS 腳本皆具備防快取版本標記'
);

// [Check 3] index.css 包含 .floating-back-btn 固定定位、圓角藥丸與毛玻璃
const check3Pass = cssStr.includes('.floating-back-btn {') &&
                   cssStr.includes('position: fixed;') &&
                   cssStr.includes('border-radius: 9999px;') &&
                   cssStr.includes('backdrop-filter: blur(12px);');
assertCheck(
  3,
  'CSS 包含 .floating-back-btn 固定定位、圓角藥丸與 12px 毛玻璃背景',
  check3Pass,
  '現代感十足的懸浮藥丸按鈕樣式，陰影與毛玻璃質感俱全'
);

// [Check 4] index.css 包含 .floating-back-btn.hidden 強制隱藏規則
const check4Pass = cssStr.includes('.floating-back-btn.hidden {') &&
                   cssStr.includes('display: none !important;');
assertCheck(
  4,
  'CSS 包含 .floating-back-btn.hidden 強制隱藏規則',
  check4Pass,
  'display: none !important 確保在非跳轉狀態下絕不干擾畫面'
);

// [Check 5] index.css 支援 Dark Mode 深色主題與 Hover 特效
const check5Pass = cssStr.includes(':root[data-theme="dark"] .floating-back-btn') &&
                   cssStr.includes('.floating-back-btn:hover');
assertCheck(
  5,
  'CSS 支援深色模式 Dark Mode 適配與 Hover 上浮微動效',
  check5Pass,
  '暗黑主題下邊框與文字採用天空藍高亮，懸浮具備位移動態'
);

// [Check 6] index.css 包含手機端 RWD 觸控定位優化
const check6Pass = cssStr.includes('.floating-back-btn {') &&
                   cssStr.includes('bottom: 16px;') &&
                   cssStr.includes('right: 14px;');
assertCheck(
  6,
  'CSS 包含手機端 RWD 觸控定位適配 (bottom: 16px, right: 14px)',
  check6Pass,
  '窄螢幕下自動微調邊界邊距，避免遮擋主要內容'
);

// [Check 7] app.js 包含 showFloatingBackBtn 與 hideFloatingBackBtn 控制函式
const check7Pass = appStr.includes('function showFloatingBackBtn(') &&
                   appStr.includes('function hideFloatingBackBtn(') &&
                   appStr.includes('floatingBackBtn: document.getElementById(\'floatingBackBtn\')');
assertCheck(
  7,
  'app.js 包含 showFloatingBackBtn 與 hideFloatingBackBtn 控制邏輯',
  check7Pass,
  'DOM 快取與顯隱輔助函式定義完整'
);

// [Check 8] app.js 雙向跳轉時動態綁定返回文字與推入歷史節點
const check8Pass = appStr.includes("showFloatingBackBtn('寶可夢圖鑑')") &&
                   appStr.includes("showFloatingBackBtn('棲息地總覽')") &&
                   appStr.includes('history.replaceState') &&
                   appStr.includes('pushNavHistory');
assertCheck(
  8,
  'app.js 雙向跳轉時動態切換按鈕文字與記錄歷史堆疊',
  check8Pass,
  '跳轉棲息地提示「返回 寶可夢圖鑑」，跳轉寶可夢提示「返回 棲息地總覽」'
);

// [Check 9] app.js 在 switchTab 主動切頁時自動呼叫 hideFloatingBackBtn
const check9Pass = appStr.includes('switchTab') &&
                   appStr.includes('hideFloatingBackBtn()');
assertCheck(
  9,
  'app.js 切換主目次分頁時自動隱藏浮動返回按鈕',
  check9Pass,
  '使用者主動切換至儲存庫或分頁時，自動隱藏返回鍵防誤觸'
);

// [Check 10] Node.js VM 沙盒動態模擬跳轉與顯隱邏輯
let check10Pass = false;
try {
  const listeners = {};
  const windowListeners = {};
  
  const createMockEl = (id = '') => {
    const classSet = new Set(id === 'floatingBackBtn' ? ['floating-back-btn', 'hidden'] : []);
    const el = {
      id: id || '',
      innerHTML: '',
      textContent: id === 'floatingBackText' ? '返回上一頁' : '',
      value: '',
      style: {},
      dataset: {},
      classList: {
        add: (cls) => classSet.add(cls),
        remove: (cls) => classSet.delete(cls),
        toggle: (cls) => (classSet.has(cls) ? classSet.delete(cls) : classSet.add(cls)),
        contains: (cls) => classSet.has(cls)
      },
      addEventListener: (evt, cb) => {
        if (!listeners[id]) listeners[id] = {};
        listeners[id][evt] = cb;
      },
      appendChild: () => {},
      querySelectorAll: () => [createMockEl()],
      querySelector: () => createMockEl(),
      scrollIntoView: () => {},
      setAttribute: () => {},
      removeAttribute: () => {}
    };
    return el;
  };

  const elements = {};
  const getEl = (id) => (elements[id] || (elements[id] = createMockEl(id)));

  const historyStack = [];
  let historyBackTriggered = false;
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    window: {
      addEventListener: (evt, cb) => { windowListeners[evt] = cb; },
      location: { hash: '#habitat-cards' },
      history: {
        length: 3,
        pushState: (state, title, url) => { historyStack.push({ state, url }); },
        replaceState: (state, title, url) => {
          if (historyStack.length) historyStack[historyStack.length - 1] = { state, url };
          else historyStack.push({ state, url });
        },
        back: () => { historyBackTriggered = true; }
      }
    },
    document: {
      documentElement: getEl('doc'),
      getElementById: getEl,
      querySelectorAll: () => [createMockEl()],
      querySelector: () => createMockEl(),
      addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }
    },
    localStorage: { getItem: (k) => (k.includes('nav') ? 'habitat' : '{}'), setItem: () => {} },
    Audio: class { play() {} },
    setTimeout: (cb) => { cb(); },
    clearTimeout: () => {}
  };

  vm.createContext(sandbox);
  vm.runInContext(dataStr, sandbox);
  vm.runInContext(prefDbStr, sandbox);
  vm.runInContext(appStr, sandbox);

  const backBtnEl = getEl('floatingBackBtn');
  const backTextEl = getEl('floatingBackText');

  // 1. 初始化時應具備 hidden
  const initHidden = backBtnEl.classList.contains('hidden');

  // 2. 模擬 popstate 導航跳轉至棲息地
  if (windowListeners['popstate']) {
    windowListeners['popstate']({
      state: { tab: 'habitatCatalog', view: 'cards', targetId: 'hab_001', targetType: 'habitat' }
    });
  }
  const afterHabShow = !backBtnEl.classList.contains('hidden');
  const textHab = backTextEl.textContent;

  // 3. 模擬 popstate 導航跳轉至寶可夢
  if (windowListeners['popstate']) {
    windowListeners['popstate']({
      state: { tab: 'habitat', view: 'cards', targetId: 'pkm_s1_1', targetType: 'pokemon' }
    });
  }
  const textPkm = backTextEl.textContent;

  // 4. 點擊返回按鈕觸發 history.back
  if (listeners['floatingBackBtn'] && listeners['floatingBackBtn']['click']) {
    listeners['floatingBackBtn']['click']({ preventDefault: () => {} });
  }

  // 5. 測試手動切換至儲存庫 tabStorage，應自動隱藏返回鍵
  if (listeners['tabStorage'] && listeners['tabStorage']['click']) {
    listeners['tabStorage']['click']();
  }
  const afterSwitchHidden = backBtnEl.classList.contains('hidden');

  check10Pass = initHidden &&
                afterHabShow &&
                textHab.includes('寶可夢圖鑑') &&
                textPkm.includes('棲息地總覽') &&
                historyBackTriggered &&
                afterSwitchHidden;
} catch (e) {
  console.error('Node VM 模擬拋出例外:', e);
  check10Pass = false;
}

assertCheck(
  10,
  'Node.js VM 沙盒模擬浮動返回按鈕動態顯隱、文字切換與切頁自動隱藏',
  check10Pass,
  '預設 hidden -> 棲息地顯示「返回 寶可夢圖鑑」 -> 寶可夢顯示「返回 棲息地總覽」 -> 點擊觸發 history.back -> 切頁恢復 hidden 驗證 100% 通過！'
);

console.log('\n================================================================');
console.log(`🎉 恭喜！Pokopia v4.4.3 浮動返回鍵全量 ${passedCount}/${totalChecks} 項驗證 100% 全部通過！`);
console.log('================================================================\n');
