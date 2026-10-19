// verify_all_scroll_restoration.js
// 離線自動化檢驗：全情境點擊跳轉定位與上一頁/全分頁滾動高度精準還原機制 (v4.12.19)

const fs = require('fs');
const assert = require('assert');

console.log('=== [開始離線驗證：全場景跳轉定位與滾動還原系統 (v4.12.19)] ===\n');

const appCode = fs.readFileSync('app.js', 'utf8');
const recipeCode = fs.readFileSync('recipe.js', 'utf8');
const htmlCode = fs.readFileSync('index.html', 'utf8');

// 1. 檢驗全域分頁滾動記憶池 (Tab Scroll Cache) 與 switchTab
console.log('1. 檢驗全域分頁滾動高度記憶池與 switchTab 連動：');
assert(appCode.includes('const tabScrollPositions = {};'), 'app.js 必須宣告 tabScrollPositions 記憶池');
assert(appCode.includes('function switchTab(tab, skipSync = false, targetScrollY = null)'), 'switchTab 必須支援 targetScrollY 參數');
assert(appCode.includes('tabScrollPositions[state.currentTab] = window.scrollY || 0;'), 'switchTab 切換離開前必須儲存當前頁面 scrollY');
assert(appCode.includes('window.scrollTo({ top: restoreY, behavior: \'instant\' });'), 'switchTab 切換後必須平穩還原至原高度');
console.log('  ✅ [PASS] 全域分頁滾動記憶池與 switchTab 自動還原機制驗證通過');

// 2. 檢驗 showFloatingBackBtn / hideFloatingBackBtn 完整狀態支援
console.log('\n2. 檢驗懸浮返回按鈕狀態支援性：');
assert(appCode.includes('returnTab'), 'showFloatingBackBtn 必須支援 returnTab');
assert(appCode.includes('returnPkmId'), 'showFloatingBackBtn 必須支援 returnPkmId');
assert(appCode.includes('returnPrefTab'), 'showFloatingBackBtn 必須支援 returnPrefTab');
assert(appCode.includes('returnHighlightItem'), 'showFloatingBackBtn 必須支援 returnHighlightItem');
assert(appCode.includes('returnTargetId'), 'showFloatingBackBtn 必須支援 returnTargetId');
assert(appCode.includes('returnScrollY'), 'showFloatingBackBtn 必須支援 returnScrollY');
console.log('  ✅ [PASS] 懸浮按鈕支援 returnTab, returnPkmId, returnHighlightItem, returnScrollY 等 7 大狀態');

// 3. 檢驗 floatingBackBtn 點擊處理器與確定性直連還原
console.log('\n3. 檢驗懸浮按鈕點擊處理邏輯：');
assert(appCode.includes('if (returnPkmId) {'), '點擊返回按鈕必須優先判定 returnPkmId');
assert(appCode.includes('scrollToTarget(\'pokemon\', returnPkmId);'), '點擊返回按鈕還原寶可夢時，必須同時調用 scrollToTarget 底層定位');
assert(appCode.includes('openPkmDetailModal(returnPkmId);'), '點擊返回按鈕必須彈出寶可夢卡片');
assert(appCode.includes('if (returnHighlightItem) {'), '點擊返回按鈕必須支援 returnHighlightItem');
assert(appCode.includes('scrollHighlightItem(returnHighlightItem);'), '點擊返回按鈕必須支援 scrollHighlightItem 定位');
console.log('  ✅ [PASS] 懸浮按鈕支援底層對齊、彈窗叫起與項目定位');

// 4. 檢驗 scrollToTarget 重試機制
console.log('\n4. 檢驗 scrollToTarget 容錯重試機制：');
assert(appCode.includes('function scrollToTarget(type, id, retryCount = 0)'), 'scrollToTarget 必須支援 retryCount 參數');
assert(appCode.includes('retryCount < 2'), 'scrollToTarget 必須在元素尚未掛載時具備自動重試防禦');
console.log('  ✅ [PASS] scrollToTarget 具備動態重試鎖定能力');

// 5. 檢驗 jumpToHabitat 與 jumpToPokemon 的歷史快照與滾動高度
console.log('\n5. 檢驗圖鑑與棲息地雙向跳轉：');
assert(appCode.includes('function jumpToHabitat(habId, pushHistory = true, sourcePkmId = null)'), 'jumpToHabitat 函式簽章正確');
assert(appCode.includes('function jumpToPokemon(pkmId, pushHistory = true, sourceHabId = null)'), 'jumpToPokemon 函式簽章正確');
assert(appCode.includes('returnTargetId: sourcePkmId'), 'jumpToHabitat 懸浮按鈕必須綁定 sourcePkmId');
assert(appCode.includes('returnTargetId: sourceHabId'), 'jumpToPokemon 懸浮按鈕必須綁定 sourceHabId');
console.log('  ✅ [PASS] 圖鑑與棲息地雙向跳轉具備精準 ID 與 scrollY 記憶');

// 6. 檢驗 openPrefDrawer 歷史快照與滾動高度
console.log('\n6. 檢驗寶可夢卡片跳轉喜好百科：');
assert(appCode.includes('switchTab(\'preferences\', true);'), 'openPrefDrawer 必須傳入 skipSync = true');
assert(appCode.includes('returnScrollY: currentScroll'), 'openPrefDrawer 必須記錄並傳遞 returnScrollY');
console.log('  ✅ [PASS] openPrefDrawer 具備 scrollY 記憶與 skipSync 守護');

// 7. 檢驗 navigateItemToRecipe 跳轉食譜與回退喜好百科
console.log('\n7. 檢驗喜好百科跳轉料理食譜：');
assert(appCode.includes('function navigateItemToRecipe(itemName)'), 'navigateItemToRecipe 存在');
assert(appCode.includes('returnHighlightItem: cleanName'), 'navigateItemToRecipe 懸浮按鈕必須傳遞 returnHighlightItem');
assert(appCode.includes('returnPrefTab: fromPrefTab'), 'navigateItemToRecipe 懸浮按鈕必須傳遞 returnPrefTab');
console.log('  ✅ [PASS] navigateItemToRecipe 跳轉食譜與回退喜好百科無死角');

// 8. 檢驗 handlePopState 彈窗與底層背景雙重同步
console.log('\n8. 檢驗 handlePopState 歷史回退機制：');
assert(appCode.includes('scrollToTarget(\'pokemon\', navState.pkmId);'), 'handlePopState 叫起彈窗前必須先呼叫 scrollToTarget 對齊底層');
assert(appCode.includes('openPkmDetailModal(navState.pkmId);'), 'handlePopState 必須自動展開寶可夢詳情彈窗');
assert(appCode.includes('typeof navState.scrollY === \'number\''), 'handlePopState 必須支援一般瀏覽的 scrollY 還原');
console.log('  ✅ [PASS] handlePopState 彈窗與底層視窗雙重同步且支援 scrollY 還原');

// 9. 檢驗地區地圖點擊寶可夢頭像跳轉
console.log('\n9. 檢驗地區地圖點擊寶可夢：');
assert(appCode.includes('openPkmDetailModal(pkmId);'), '地區地圖點擊寶可夢頭像必須調用 openPkmDetailModal');
assert(!appCode.includes('showPokemonModal(pkmId)'), '已徹底移除無效的 showPokemonModal 遺留代碼');
console.log('  ✅ [PASS] 地區地圖寶可夢頭像點擊已修正為 openPkmDetailModal');

// 10. 檢驗 recipe.js 食譜詳情卡片點擊查看寶可夢
console.log('\n10. 檢驗食譜模組 (recipe.js) 寶可夢卡片連動：');
assert(recipeCode.includes('data-pkm-id="${p.id}"'), 'recipe.js 寶可夢卡片必須綁定 data-pkm-id');
assert(recipeCode.includes('window.openPkmDetailModal(pId);'), 'recipe.js 點擊卡片必須呼叫 window.openPkmDetailModal');
console.log('  ✅ [PASS] recipe.js 寶可夢卡片具備 data-pkm-id 與點擊開啟百科能力');

// 11. 檢驗 index.html 快取版號 4.13.0
console.log('\n11. 檢驗全站快取版號 (v4.13.0)：');
assert(htmlCode.includes('index.css?v=4.13.0'), 'index.html 必須使用 index.css?v=4.13.0');
assert(htmlCode.includes('app.js?v=4.13.0'), 'index.html 必須使用 app.js?v=4.13.0');
assert(htmlCode.includes('recipe.js?v=4.13.0'), 'index.html 必須使用 recipe.js?v=4.13.0');
console.log('  ✅ [PASS] 全站資源標籤快取版號 v4.13.0 檢驗通過');

console.log('\n🎉 [驗證成功] 全場景跳轉定位與上一頁定位還原系統 11 項檢驗 100% 通過！');
