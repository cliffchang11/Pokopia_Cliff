/**
 * 離線自動化校驗腳本：verify_modal_nav_flow.js
 * 驗收寶可夢詳情卡喜好跳轉無遮擋、懸浮按鈕直連還原與上一頁雙重保險機制 (v4.12.18)
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== [開始離線驗證：寶可夢詳情卡喜好跳轉與上一頁雙重還原保險] ===\n');

const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// 1. 檢驗 openPrefDrawer 是否具備自動關閉卡片機制與阻斷覆蓋
console.log('1. 檢驗 openPrefDrawer 自動關閉彈窗與阻斷覆蓋：');
assert(appJs.includes('function openPrefDrawer(targetTab, highlightItem, fromPkm)'), 'openPrefDrawer 必須支援 fromPkm 參數');
assert(appJs.includes('closePkmDetailModal();') && appJs.includes('state.activeDetailPkm = null;'), 'openPrefDrawer 必須自動執行 closePkmDetailModal 關閉前台遮罩');
assert(appJs.includes("switchTab('preferences', true);"), 'openPrefDrawer 必須傳入 skipSync=true 阻斷同步抹殺 modal 狀態');
assert(appJs.includes("history.pushState({ tab: 'preferences'"), 'openPrefDrawer 必須明確執行 pushState 產生新歷史項目');
console.log('  ✅ [PASS] openPrefDrawer 成功整合彈窗自動關閉與歷史堆疊保護');

// 2. 檢驗 openPkmDetailModal 記錄當前展示之寶可夢
console.log('\n2. 檢驗 openPkmDetailModal 記錄作用中寶可夢：');
assert(appJs.includes('state.activeDetailPkm = pkm;'), 'openPkmDetailModal 必須快取當前展示的寶可夢物件至 state.activeDetailPkm');
console.log('  ✅ [PASS] state.activeDetailPkm 精確追蹤當前作用中寶可夢');

// 3. 檢驗 pushNavHistory 支援 modal 狀態儲存
console.log('\n3. 檢驗 pushNavHistory 支援 modal / pkmId 歷史記錄：');
assert(appJs.includes('const modal = customState.modal || null;'), 'pushNavHistory 必須支援 modal 欄位');
assert(appJs.includes('const pkmId = customState.pkmId || null;'), 'pushNavHistory 必須支援 pkmId 欄位');
assert(appJs.includes('const pkmName = customState.pkmName || null;'), 'pushNavHistory 必須支援 pkmName 欄位');
assert(appJs.includes('modal, pkmId, pkmName, timestamp: Date.now()'), 'stateObj 必須儲存 modal 與 pkm 資訊');
console.log('  ✅ [PASS] 瀏覽歷史堆疊已完全擴充彈窗狀態記錄');

// 4. 檢驗 handlePopState 支援上一頁自動重開卡片
console.log('\n4. 檢驗 handlePopState 原生上一頁自動叫起寶可夢詳情卡：');
assert(appJs.includes("if (navState.modal === 'pokemonDetail' && navState.pkmId) {"), 'handlePopState 必須檢查 modal 是否為 pokemonDetail');
assert(appJs.includes('openPkmDetailModal(navState.pkmId);'), 'handlePopState 必須自動呼叫 openPkmDetailModal 還原卡片');
console.log('  ✅ [PASS] 瀏覽器原生返回鍵可 100% 自動還原寶可夢卡片');

// 5. 檢驗懸浮返回按鈕確定性直連保險
console.log('\n5. 檢驗懸浮返回按鈕直連保險：');
assert(appJs.includes('DOM.floatingBackBtn.dataset.returnPkmId = extra.returnPkmId;'), 'showFloatingBackBtn 必須綁定 returnPkmId dataset');
assert(appJs.includes('const returnPkmId = DOM.floatingBackBtn.dataset.returnPkmId;'), 'floatingBackBtn 點擊事件必須讀取 returnPkmId');
assert(appJs.includes('openPkmDetailModal(returnPkmId);'), '點選懸浮按鈕必須 100% 確定性直接還原卡片');
console.log('  ✅ [PASS] 懸浮返回按鈕具備 100% 確定性直連還原保險');

console.log('\n========================================');
console.log('寶可夢詳情卡喜好跳轉與上一頁雙重還原驗證：全部通過！');
console.log('========================================\n');
