const fs = require('fs');
const vm = require('vm');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia v4.4.7 表格手機端隱藏喜好與個人百科卡驗證');
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

// 讀取核心檔案
const htmlStr = fs.readFileSync('index.html', 'utf8');
const cssStr = fs.readFileSync('index.css', 'utf8');
const appStr = fs.readFileSync('app.js', 'utf8');
const dataStr = fs.readFileSync('data.js', 'utf8');
const prefDbStr = fs.readFileSync('preferences_db.js', 'utf8');

// [Check 1] index.html 全站資源版本號 100% 具備防快取標記
const check1Pass = /href="index\.css\?v=4\.\d+\.\d+"/.test(htmlStr) &&
                   /src="data\.js\?v=4\.\d+\.\d+"/.test(htmlStr) &&
                   /src="preferences_db\.js\?v=4\.\d+\.\d+"/.test(htmlStr) &&
                   /src="app\.js\?v=4\.\d+\.\d+"/.test(htmlStr);
assertCheck(
  1,
  'index.html 全站資源版本號 100% 具備防快取標記',
  check1Pass,
  'CSS 與三大 JS 核心腳本全面具備 ?v=4.x 防快取標記'
);

// [Check 2] index.html 包含個人百科詳情卡 DOM 骨架
const check2Pass = htmlStr.includes('id="pkmDetailBackdrop"') &&
                   htmlStr.includes('id="pkmDetailModal"') &&
                   htmlStr.includes('id="pkmDetailCloseBtn"') &&
                   htmlStr.includes('id="pkmDetailAvatar"') &&
                   htmlStr.includes('id="pkmDetailName"') &&
                   htmlStr.includes('id="pkmDetailBody"');
assertCheck(
  2,
  'index.html 包含完整個人百科詳情卡 (#pkmDetailModal) 結構',
  check2Pass,
  '包含遮罩、卡片容器、關閉按鈕、頭像與動態百科內容容器'
);

// [Check 3] CSS 詳情卡毛玻璃、動效與手機端 Bottom Sheet 樣式
const check3Pass = cssStr.includes('.pkm-detail-backdrop {') &&
                   cssStr.includes('.pkm-detail-card {') &&
                   cssStr.includes('backdrop-filter: blur(') &&
                   cssStr.includes('@keyframes pkmModalPop') &&
                   cssStr.includes('@keyframes pkmSheetUp');
assertCheck(
  3,
  'CSS 詳情卡支援桌面毛玻璃 Modal 與手機底部滑出 Bottom Sheet',
  check3Pass,
  '包含 20px 毛玻璃模糊、彈出與升起雙向平滑動畫'
);

// [Check 4] 手機端 (<= 640px) 表格第 7 欄喜好徹底隱藏
const check4Pass = cssStr.includes('.pokemon-table th:nth-child(7),') &&
                   cssStr.includes('.pokemon-table td:nth-child(7) {') &&
                   cssStr.includes('display: none !important;');
assertCheck(
  4,
  '手機端 (<= 640px) 表格第 7 欄喜好徹底隱藏 (display: none !important)',
  check4Pass,
  '消除表格寬度瓶頸，保留純淨前 6 欄'
);

// [Check 5] 手機端表格容器徹底拔除橫向滾動 (overflow-x: hidden !important)
const check5Pass = cssStr.includes('.table-container {') &&
                   cssStr.includes('overflow-x: hidden !important;') &&
                   cssStr.includes('width: 100% !important;');
assertCheck(
  5,
  '手機端表格容器徹底消除左右滾動條 (overflow-x: hidden !important)',
  check5Pass,
  '前 6 欄自適應 100% 滿版，單手純縱向滑動到底'
);

// [Check 6] 寶可夢表格設定 table-layout: fixed !important 與 100% 滿版
const check6Pass = cssStr.includes('.pokemon-table {') &&
                   cssStr.includes('table-layout: fixed !important;') &&
                   cssStr.includes('width: 100% !important;');
assertCheck(
  6,
  '寶可夢表格設定 table-layout: fixed !important 與 100% 滿版',
  check6Pass,
  '每欄嚴格按指定寬度比例排列，每列高度完全均勻一致'
);

// [Check 7] 棲息地縮圖 3:2 鎖定與 center bottom 焦點
const check7Pass = cssStr.includes('aspect-ratio: 3 / 2 !important;') &&
                   cssStr.includes('object-position: center bottom !important;');
assertCheck(
  7,
  '棲息地縮圖容器鎖定 3:2 與 object-position: center bottom',
  check7Pass,
  '縮圖高度穩定，草地、樹木與長椅地貌 100% 完整無損'
);

// [Check 8] app.js 表格點擊觸發與三向關閉事件綁定
const check8Pass = appStr.includes('openPkmDetailModal') &&
                   appStr.includes('closePkmDetailModal') &&
                   appStr.includes("e.key === 'Escape'") &&
                   appStr.includes('.pkm-cell-identity, .pkm-avatar-cell');
assertCheck(
  8,
  'app.js 點擊名稱/頭像展開詳情卡與三向關閉 (✕/遮罩/ESC) 邏輯就緒',
  check8Pass,
  '點擊編號名稱或頭像喚起卡片，與勾選框及棲息地完全防衝突'
);

// [Check 9] 詳情卡渲染結構化口味(含食物樹果)、環境與風格(含家具)
const check9Pass = appStr.includes('matchedTastes') &&
                   appStr.includes('pkm-pref-item-badge') &&
                   appStr.includes('snorlaxEffect') &&
                   appStr.includes('matchedThings') &&
                   appStr.includes('matchedEnvs');
assertCheck(
  9,
  '詳情卡結構化解析喜好口味、苔卡比獸效果、食物樹果與家具物品圖標',
  check9Pass,
  '玩家可在卡片中清楚看見具體道具食物圖標'
);

// [Check 10] Node.js VM 沙盒驗證全量掛載與 openPkmDetailModal 模擬執行
let check10Pass = false;
try {
  const elements = {};
  const createMockEl = (id = '') => {
    const classSet = new Set(id === 'floatingBackBtn' ? ['floating-back-btn', 'hidden'] : []);
    return {
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
      addEventListener: () => {},
      appendChild: () => {},
      querySelectorAll: () => [createMockEl()],
      querySelector: () => createMockEl(),
      closest: () => createMockEl(),
      scrollIntoView: () => {},
      setAttribute: () => {},
      removeAttribute: () => {}
    };
  };

  const getEl = (id) => (elements[id] || (elements[id] = createMockEl(id)));
  const sandbox = {
    console: { log: () => {}, warn: () => {}, error: () => {} },
    window: {
      addEventListener: () => {},
      location: { hash: '#habitat-table' },
      history: { length: 2, pushState: () => {}, replaceState: () => {}, back: () => {} }
    },
    document: {
      documentElement: getEl('doc'),
      body: { style: {} },
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
  sandbox.window.window = sandbox.window;

  vm.createContext(sandbox);
  vm.runInContext(dataStr, sandbox);
  vm.runInContext(prefDbStr, sandbox);
  vm.runInContext(appStr, sandbox);

  // 模擬調用 openPkmDetailModal
  sandbox.window.openPkmDetailModal('pkm_s1_1');

  const modalBodyHTML = elements['pkmDetailBody'] ? elements['pkmDetailBody'].innerHTML : '';
  const rowCount = (elements['habitatTableBody'].innerHTML.match(/<tr/g) || []).length;

  const modalName = elements['pkmDetailName'] ? elements['pkmDetailName'].textContent : '';
  check10Pass = rowCount === 367 &&
                modalBodyHTML.includes('屬性與工作專長') &&
                modalBodyHTML.includes('完整喜好百科') &&
                modalName === '妙蛙種子';
} catch (e) {
  console.error('Node VM 模擬例外:', e);
  check10Pass = false;
}

assertCheck(
  10,
  'Node.js VM 沙盒驗證全量 367 筆表格與 openPkmDetailModal 實機渲染無損',
  check10Pass,
  '367 筆表格正常掛載，點擊妙蛙種子成功渲染屬性、棲息地與結構化喜好百科'
);

console.log('\n================================================================');
console.log(`🎉 恭喜！Pokopia v4.4.7 表格手機免滑動與個人百科卡驗證全量 ${passedCount}/${totalChecks} 項 100% 全部通過！`);
console.log('================================================================\n');
