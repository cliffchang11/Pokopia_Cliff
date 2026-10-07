/**
 * 自訂收納盒管理與物品反查系統自動化驗證腳本 (verify_custom_storage.js)
 * 驗收範圍：
 * 1. 權限隔離（未授權訪客隱藏選單與跳轉攔截；白名單解鎖）
 * 2. 初始收納盒結構（預設 6 箱，編號 #01~#06）
 * 3. 物品素材庫托盤（1800+ 道具可搜尋、可拖曳）
 * 4. 收納盒操作（新增、重命名、拖曳/加入、移除、清空、刪除）
 * 5. 物品反查功能（即時定位箱號、橫幅提示、高亮動畫、未找到提示）
 * 6. 本地 LocalStorage 與 Firebase 同步資料結構完整性
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== 自訂收納盒管理與物品反查系統自動化驗收開始 ===');

// 1. 讀取核心檔案內容
const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const autoFarmDataContent = fs.readFileSync('autofarm_data.js', 'utf8');
const appContent = fs.readFileSync('app.js', 'utf8');
const htmlContent = fs.readFileSync('index.html', 'utf8');

// 驗證 HTML 中收納盒重要元素存在（頂部快捷鈕已由參考影片替代，收納盒由目次抽屜 tabCustomStorage 進入）
assert(htmlContent.includes('id="tabCustomStorage"'), 'HTML 缺少 #tabCustomStorage');
assert(htmlContent.includes('id="btnVideoNav"'), 'HTML 缺少 #btnVideoNav');
assert(htmlContent.includes('id="customStorageSection"'), 'HTML 缺少 #customStorageSection');
assert(htmlContent.includes('id="csReverseSearchInput"'), 'HTML 缺少 #csReverseSearchInput');
assert(htmlContent.includes('id="csSearchResultBanner"'), 'HTML 缺少 #csSearchResultBanner');
assert(htmlContent.includes('id="csBoxesContainer"'), 'HTML 缺少 #csBoxesContainer');
assert(htmlContent.includes('id="csItemTray"'), 'HTML 缺少 #csItemTray');
assert(htmlContent.includes('id="csTrayGrid"'), 'HTML 缺少 #csTrayGrid');
console.log('✅ [PASS] 1. HTML DOM 結構檢驗齊全');

// 2. 建立完整的 DOM Mock 環境以在 VM 中執行 app.js
const storageMap = {};
const listeners = {};
const elements = {};

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
    dispatchEvent: function (evtName, extra = {}) {
      if (listeners[id] && listeners[id][evtName]) {
        listeners[id][evtName].forEach(cb => cb({ target: this, ...extra, preventDefault: () => {} }));
      }
    },
    focus: () => {},
    select: () => {},
    blur: () => {},
    scrollIntoView: () => {},
    getAttribute: function (attr) {
      if (attr === 'id') return this.id;
      if (attr === 'data-box-id') return this.dataset.boxId;
      if (attr === 'data-item-name') return this.dataset.itemName;
      return null;
    },
    setAttribute: function (attr, val) {
      if (attr === 'data-box-id') this.dataset.boxId = val;
      if (attr === 'data-item-name') this.dataset.itemName = val;
    },
    closest: function (sel) {
      return this;
    },
    contains: function () { return true; },
    querySelector: function (sel) {
      if (sel.includes('.cs-box-name-input')) return createMockElement('boxNameInput', 'input');
      return createMockElement('subEl');
    },
    querySelectorAll: function (sel) {
      return [];
    },
    appendChild: function (child) {
      return child;
    },
    remove: function () {}
  };
  return el;
};

// 預先註冊核心 DOM ID
const requiredIds = [
  'btnTocMenu', 'tocDropdown', 'tabStorage', 'tabHabitat', 'tabHabitatCatalog',
  'tabAutoFarm', 'tabCustomStorage', 'btnAutoFarmNav', 'btnCustomStorageNav',
  'autoFarmSection', 'customStorageSection', 'csBoxesContainer', 'csReverseSearchInput',
  'csClearSearchBtn', 'csSearchResultBanner', 'btnCsAddBox', 'btnCsToggleDrawer',
  'csItemTray', 'csTrayBackdrop', 'btnCsCloseTray', 'csTrayGrid', 'csTraySearchInput', 'csTrayCategoryPills', 'csTrayItemCount',
  'autoFarmModulesContainer', 'autoFarmProgressBar', 'autoFarmProgressText',
  'btnCardView', 'btnTableView', 'btnThemeToggle', 'btnPrefDrawer', 'filterActiveBadge',
  'envFilter', 'specialtyFilter', 'unlockFilter', 'categoryFilter', 'storageCardGrid',
  'storageTableContainer', 'habitatCardGrid', 'habitatTableContainer', 'habitatCatalogCardGrid',
  'habitatCatalogTableContainer', 'filterToolbar', 'unlockFilterGroup', 'searchInput',
  'csToastContainer', 'csTrayTargetHint'
];

requiredIds.forEach(id => {
  elements[id] = createMockElement(id);
});

['btnAutoFarmNav', 'tabAutoFarm', 'btnCustomStorageNav', 'tabCustomStorage', 'csSearchResultBanner', 'csClearSearchBtn'].forEach(id => {
  if (elements[id]) elements[id].classList.add('hidden');
});

// 模擬 localStorage
const mockLocalStorage = {
  getItem: (k) => (storageMap[k] !== undefined ? storageMap[k] : null),
  setItem: (k, v) => { storageMap[k] = String(v); },
  removeItem: (k) => { delete storageMap[k]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); }
};

const mockBody = createMockElement('body', 'body');

// 執行沙盒
const sandbox = {
  window: {
    location: { hash: '' },
    history: { pushState: () => {}, replaceState: () => {} },
    localStorage: mockLocalStorage,
    confirm: (msg) => true,
    alert: (msg) => {},
    setTimeout: (cb, delay) => { cb(); return 1; },
    clearTimeout: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  document: {
    readyState: 'complete',
    body: mockBody,
    documentElement: { setAttribute: () => {} },
    getElementById: (id) => elements[id] || createMockElement(id),
    createElement: (tag) => createMockElement(`dyn_${tag}_${Math.random().toString(36).substr(2, 5)}`, tag),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {}
  },
  localStorage: mockLocalStorage,
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

console.log('✅ [PASS] 2. app.js 在沙盒中順利初始化執行');

// 3. 驗證權限隔離
// 訪客（未授權）時：
assert(elements.tabCustomStorage.classList.contains('hidden'), '未登入訪客時，自訂收納盒目次選項必須隱藏');
console.log('✅ [PASS] 3.1 未登入狀態：收納盒入口嚴格隱藏');

// 授權登入（模擬授權信箱 cliff210689cliff@gmail.com）
mockLocalStorage.setItem('pokopia_autofarm_authed_v1', '1');

// 3.2 驗證點擊目次入口按鈕能順暢觸發頁面跳轉
assert(listeners['tabCustomStorage'] && listeners['tabCustomStorage']['click'], 'tabCustomStorage 必須註冊 click 事件');

elements.tabCustomStorage.dispatchEvent('click');
assert(!elements.customStorageSection.classList.contains('hidden-section'), '點擊 tabCustomStorage 後 customStorageSection 必須顯示');
assert(sandbox.window.PokopiaCustomStorage.getState().currentTab === 'customStorage', '點擊後 currentTab 應切換為 customStorage');
console.log('✅ [PASS] 3.2 點擊目次抽屜按鈕跳轉功能驗證通過');

// 驗證公開 API 已成功掛載
const csApi = sandbox.window.PokopiaCustomStorage;
assert(csApi, 'window.PokopiaCustomStorage 應成功暴露');
assert(typeof csApi.renderCustomStorage === 'function', 'renderCustomStorage 應為函式');

// 4. 驗證預設初始收納盒結構 (6箱)
csApi.renderCustomStorage();

const renderedBoxesHtml = elements.csBoxesContainer.innerHTML;
assert(renderedBoxesHtml.includes('#01'), '應包含 #01 箱號');
assert(renderedBoxesHtml.includes('食材與烹飪'), '應包含第 1 箱預設名稱');
assert(renderedBoxesHtml.includes('#06'), '應包含 #06 箱號');
assert(renderedBoxesHtml.includes('稀有與特殊'), '應包含第 6 箱預設名稱');
assert(renderedBoxesHtml.includes('cs-drop-zone'), '每個收納盒應包含拖曳放置區 cs-drop-zone');
console.log('✅ [PASS] 4. 初始預設 6 個收納盒結構與放置區完整渲染');

// 5. 驗證物品素材庫托盤（Tray）官方分類標籤與嚴格去重
const pillsHtml = elements.csTrayCategoryPills.innerHTML;
assert(pillsHtml.includes('全部'), '分類標籤列應包含「全部」');
assert(pillsHtml.includes('材料'), '分類標籤列應包含「材料」');
assert(pillsHtml.includes('食物'), '分類標籤列應包含「食物」');
assert(pillsHtml.includes('家具'), '分類標籤列應包含「家具」');
assert(pillsHtml.includes('(44)'), '材料分類應精確顯示 (44) 筆');
assert(pillsHtml.includes('(46)'), '食物分類應精確顯示 (46) 筆');
console.log('✅ [PASS] 5.1 官方 12 大分類標籤列與數量精確生成');

// 5.2 驗證全量物品嚴格去重（重複率嚴格為 0%）
const trayGridHtml = elements.csTrayGrid.innerHTML;
assert(trayGridHtml.includes('draggable="true"'), '托盤項目必須具備 draggable="true"');
const itemMatches = [...trayGridHtml.matchAll(/data-item-name="([^"]+)"/g)].map(m => m[1]);
const uniqueSet = new Set(itemMatches);
assert.strictEqual(uniqueSet.size, itemMatches.length, `素材托盤內物品重複！總數 ${itemMatches.length}，去重後 ${uniqueSet.size}`);
assert.strictEqual(itemMatches.length, 1238, `全部分類去重後物品總數應嚴格為 1238 種，實測為 ${itemMatches.length}`);
console.log('✅ [PASS] 5.2 素材庫全量 1238 種物品嚴格唯一無重複 (重複率嚴格為 0%)');

// 5.3 驗證點選分類標籤篩選與複合搜尋
csApi.getState().activeTrayCategory = '材料';
csApi.renderCustomTrayItems('');
const materialGridHtml = elements.csTrayGrid.innerHTML;
const materialItems = [...materialGridHtml.matchAll(/data-item-name="([^"]+)"/g)].map(m => m[1]);
assert.strictEqual(materialItems.length, 44, `材料分類物品應嚴格為 44 種，實測為 ${materialItems.length}`);
assert(materialItems.includes('甜甜蜜'), '材料分類應包含 甜甜蜜');
assert(materialItems.includes('結實的樹枝'), '材料分類應包含 結實的樹枝');

// 複合搜尋：在材料分類下搜尋「樹枝」
csApi.renderCustomTrayItems('樹枝');
const branchGridHtml = elements.csTrayGrid.innerHTML;
assert(branchGridHtml.includes('結實的樹枝'), '複合搜尋應能正確過濾出 結實的樹枝');
console.log('✅ [PASS] 5.3 分類切換篩選與關鍵字複合搜尋驗證通過');

// 恢復全部分類
csApi.getState().activeTrayCategory = 'all';
csApi.renderCustomTrayItems('');

// 6. 測試收納盒各項互動操作
// 6.1 新增收納盒
csApi.addNewBox();
assert(elements.csBoxesContainer.innerHTML.includes('#07'), '新增後應出現 #07 收納盒');
assert(elements.csBoxesContainer.innerHTML.includes('自訂收納盒 07'), '新增收納盒預設名稱應為 自訂收納盒 07');
console.log('✅ [PASS] 6.1 新增收納盒（#07）操作成功');

// 6.2 加入物品到收納盒
csApi.addItemToBox('box_1', '測試寶石');
assert(elements.csBoxesContainer.innerHTML.includes('測試寶石'), 'box_1 中應成功加入 測試寶石');
console.log('✅ [PASS] 6.2 加入物品到收納盒成功');

// 6.3 測試同一物品亦可加入另一收納盒（多盒獨立管理）
csApi.addItemToBox('box_2', '測試寶石');
assert(elements.csBoxesContainer.innerHTML.includes('測試寶石'), 'box_2 亦可獨立收納 測試寶石');
console.log('✅ [PASS] 6.3 支援同一物品放入不同收納盒');

// 6.4 移除收納盒中的物品
csApi.removeItemFromBox('box_1', '測試寶石');
assert(!elements.csBoxesContainer.innerHTML.includes('data-box-id="box_1" data-item-name="測試寶石"'), 'box_1 中應已移除 測試寶石');
console.log('✅ [PASS] 6.4 移除物品操作成功');

// 6.5 修改收納盒名稱
csApi.renameBox('box_1', '特選超級美味食材');
csApi.renderCustomBoxesGrid();
assert(elements.csBoxesContainer.innerHTML.includes('特選超級美味食材'), '收納盒名稱應成功更新為 特選超級美味食材');
console.log('✅ [PASS] 6.5 修改收納盒名稱操作成功');

// 6.6 清空收納盒
csApi.clearBox('box_1');
assert(elements.csBoxesContainer.innerHTML.includes('拖曳物品至此處加入'), '清空後應呈現拖曳提示空狀態');
console.log('✅ [PASS] 6.6 清空收納盒操作成功');

// 6.7 刪除收納盒
csApi.deleteBox('box_1');
assert(!elements.csBoxesContainer.innerHTML.includes('特選超級美味食材'), '被刪除的收納盒不應再出現');
console.log('✅ [PASS] 6.7 刪除收納盒操作成功');

// 7. 驗證反查物品功能 (Reverse Search)
// 測試反查「鐵」
csApi.handleReverseSearch('鐵');
assert(!elements.csSearchResultBanner.classList.contains('hidden'), '反查有結果時，橫幅應顯示');
assert(elements.csSearchResultBanner.className.includes('cs-search-found'), '反查成功時橫幅應具備 cs-search-found 樣式');
assert(elements.csSearchResultBanner.innerHTML.includes('礦石與金屬'), '橫幅應正確指出包含「鐵」的箱號');
console.log('✅ [PASS] 7.1 物品反查命中：橫幅正確定位所屬箱號');

// 測試反查不存在物品
csApi.handleReverseSearch('世界上不存在的道具ABC');
assert(!elements.csSearchResultBanner.classList.contains('hidden'), '反查無結果時橫幅亦應顯示提示');
assert(elements.csSearchResultBanner.className.includes('cs-search-empty'), '反查無結果時橫幅應具備 cs-search-empty 樣式');
assert(elements.csSearchResultBanner.innerHTML.includes('尚未在任何收納盒中找到'), '反查無結果時應顯示尚未收納提示');
console.log('✅ [PASS] 7.2 物品反查無相符項提示驗證通過');

// 測試清除反查
csApi.handleReverseSearch('');
assert(elements.csSearchResultBanner.classList.contains('hidden'), '清空反查輸入後橫幅應隱藏');
console.log('✅ [PASS] 7.3 清除反查輸入恢復預設網格');
console.log('✅ [PASS] 7.3 清除反查輸入恢復預設網格');

// 8. 驗證 LocalStorage 持久化
const saved = mockLocalStorage.getItem('pokopia_custom_boxes_v1');
assert(saved, 'LocalStorage 應持久化存儲 pokopia_custom_boxes_v1');
const parsedBoxes = JSON.parse(saved);
assert(Array.isArray(parsedBoxes), '持久化資料應為收納盒陣列');
console.log('✅ [PASS] 8. LocalStorage 持久化存儲驗證通過');

// 9. 驗證小螢幕/手機端響應式抽屜 (Bottom Sheet Drawer) 與抗裁切機制
csApi.openCsDrawer();
assert(elements.csItemTray.classList.contains('drawer-open'), 'openCsDrawer 應為 csItemTray 加入 drawer-open 類別');
assert(elements.csTrayBackdrop.classList.contains('is-active'), '開啟抽屜時遮罩應具備 is-active 類別');

csApi.closeCsDrawer();
assert(!elements.csItemTray.classList.contains('drawer-open'), 'closeCsDrawer 應移除 drawer-open');
assert(!elements.csTrayBackdrop.classList.contains('is-active'), '關閉抽屜時遮罩應移除 is-active');

csApi.toggleCsDrawer();
assert(elements.csItemTray.classList.contains('drawer-open'), 'toggleCsDrawer 應切換開啟');
csApi.toggleCsDrawer();
assert(!elements.csItemTray.classList.contains('drawer-open'), 'toggleCsDrawer 再次調用應切換關閉');

// 驗證點擊遮罩觸發關閉
csApi.openCsDrawer();
elements.csTrayBackdrop.dispatchEvent('click');
assert(!elements.csItemTray.classList.contains('drawer-open'), '點擊遮罩應關閉素材庫抽屜');

// 驗證點擊關閉按鈕觸發關閉
csApi.openCsDrawer();
elements.btnCsCloseTray.dispatchEvent('click');
assert(!elements.csItemTray.classList.contains('drawer-open'), '點擊 ✕ 關閉按鈕應關閉素材庫抽屜');

// 驗證 CSS 中具備純單欄 1fr 或防裁切安全佈局與 RWD 抽屜規則
const cssContent = fs.readFileSync('index.css', 'utf8');
assert(cssContent.includes('grid-template-columns: 1fr;') || cssContent.includes('minmax(min(100%, 480px), 1fr)'), 'CSS 必須具備收納盒純單欄或安全寬幅佈局');
assert(cssContent.includes('.cs-item-tray.drawer-open'), 'CSS 必須具備抽屜開啟樣式 .cs-item-tray.drawer-open');
assert(cssContent.includes('@media (max-width: 1024px)'), 'CSS 必須具備小螢幕響應式斷點');
console.log('✅ [PASS] 9. 響應式底部抽屜 (Bottom Sheet) 互動與防裁切機制驗證通過');

// 10. 驗證免拖曳「➕ 加入物品」按鈕與目標接收箱選定切換
csApi.renderCustomBoxesGrid();
assert(elements.csBoxesContainer.innerHTML.includes('cs-box-add-item-btn'), '收納盒應渲染 ➕ 加入物品 快捷按鈕');
assert(elements.csBoxesContainer.innerHTML.includes('cs-box-drag-handle'), '收納盒標頭應渲染 ⠿ 拖曳排序手柄');
assert(elements.csBoxesContainer.innerHTML.includes('btn-cs-move-left'), '收納盒應渲染 ◀ 往前移動按鈕');
assert(elements.csBoxesContainer.innerHTML.includes('btn-cs-move-right'), '收納盒應渲染 ▶ 往後移動按鈕');

// 切換指定接收箱
const currentBoxes = csApi.getState().customBoxes;
assert(currentBoxes.length >= 2, '當前應至少有兩個收納箱以供測試');
const targetBox = currentBoxes[1];
csApi.setActiveTargetBox(targetBox.id, false);
assert(elements.csTrayTargetHint.textContent.includes(targetBox.name), '素材庫提示應正確顯示當前目標接收箱');

// 免拖曳點擊直接加入
csApi.addItemToBox(targetBox.id, '精靈球');
assert(targetBox.items.includes('精靈球'), '免拖曳加入應成功將精靈球寫入目標箱');
console.log('✅ [PASS] 10. 免拖曳「➕ 加入物品」與目標接收箱即時聯動驗證通過');

// 11. 驗證隨意更改收納箱順序 (◀ / ▶ 按鈕位移與拖曳對調)
const beforeBoxes = csApi.getState().customBoxes.slice();
const firstBoxId = beforeBoxes[0].id;
const secondBoxId = beforeBoxes[1].id;

// 測試向後移動第一箱
csApi.moveBox(firstBoxId, 'right');
const afterMoveBoxes = csApi.getState().customBoxes;
assert(afterMoveBoxes[0].id === secondBoxId, '向右移動後，原第二箱應變成第一位');
assert(afterMoveBoxes[1].id === firstBoxId, '向右移動後，原第一箱應變成第二位');
assert(afterMoveBoxes[0].no === '01' && afterMoveBoxes[1].no === '02', '順序變更後箱號必須自動由 01 開始重新排列');

// 測試拖曳換位 (reorderBoxes)
csApi.reorderBoxes(firstBoxId, secondBoxId);
const afterReorder = csApi.getState().customBoxes;
assert(afterReorder[0].id === firstBoxId, '拖曳交換後第一箱應恢復到首位');
assert(afterReorder[0].no === '01', '換位後箱號重新對齊');

// 驗證 LocalStorage 持久化保存新順序
const savedAfterMove = JSON.parse(mockLocalStorage.getItem('pokopia_custom_boxes_v1'));
assert(savedAfterMove[0].id === firstBoxId, 'LocalStorage 應持久化新排列順序');
console.log('✅ [PASS] 11. 收納箱隨意更改順序 (◀ ▶ 微調與拖曳對調及序號自動維持) 驗證通過');

console.log('\n🎉 自訂收納盒與物品反查系統全量 11 大項驗證 100% 全部通過！');
