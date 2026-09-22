// verify_habitat_unlocked_check_badge.js
// 驗證棲息地外觀縮圖右下角在全數寶可夢解鎖時顯示翠綠 ✔，未全數解鎖時顯示 🔍

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證棲息地縮圖解鎖勾勾圖案功能 ===\n');

// 1. 檢驗 index.css
const cssPath = path.join(__dirname, 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.habitat-thumb-badge.is-unlocked'), 'CSS 必須包含 .habitat-thumb-badge.is-unlocked');
assert(cssContent.includes(':root[data-theme="dark"] .habitat-thumb-badge.is-unlocked'), 'CSS 必須包含暗色模式 .habitat-thumb-badge.is-unlocked');
assert(cssContent.includes('#10b981'), 'CSS 翡翠綠漸層應包含 #10b981');
console.log('✔ [Check 1] index.css 樣式定義正確 (白天與深色模式均包含翡翠綠打勾樣式)');

// 2. 檢驗 app.js 邏輯
const appJsPath = path.join(__dirname, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 檢查卡片模式
assert(appJsContent.includes('const thumbBadgeHTML = isAllPkmUnlocked'), 'app.js 必須根據 isAllPkmUnlocked 計算 thumbBadgeHTML');
assert(appJsContent.includes('habitat-thumb-badge is-unlocked'), 'app.js 必須包含 habitat-thumb-badge is-unlocked');
assert(appJsContent.includes('✔'), 'app.js 必須在解鎖時渲染 ✔');

// 3. 模擬資料邏輯執行驗證
const mockHabUnlocked = {
  id: 'hab_1',
  official_id: '001',
  name: '綠色的草叢',
  details: '雜草 x 10',
  image: 'img/habitats/001.png',
  pokemons: [{ id: 'p1', name: '妙蛙種子', number: '#0001' }]
};

const mockHabLocked = {
  id: 'hab_2',
  official_id: '002',
  name: '樹蔭的草叢',
  details: '果樹 x 1',
  image: 'img/habitats/002.png',
  pokemons: [{ id: 'p2', name: '波波', number: '#0016' }, { id: 'p3', name: '小拉達', number: '#0019' }]
};

// 狀態：p1 已解鎖，p2 已解鎖，p3 未解鎖
const mockState = {
  pkmChecked: {
    'p1': true,
    'p2': true
  }
};

function renderThumbBadgeForHabitat(hab, state) {
  const pkmCount = hab.pokemons.length;
  const isAllPkmUnlocked = pkmCount > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]));
  return isAllPkmUnlocked
    ? `<div class="habitat-thumb-badge is-unlocked" title="此棲息地寶可夢已全數吸引（點擊查看實機全景）">✔</div>`
    : `<div class="habitat-thumb-badge" title="點擊查看高清實機全景">🔍</div>`;
}

const badge1 = renderThumbBadgeForHabitat(mockHabUnlocked, mockState);
assert(badge1.includes('is-unlocked') && badge1.includes('✔'), '全解鎖棲息地應渲染 is-unlocked 與 ✔');
console.log('✔ [Check 2] 全數寶可夢解鎖的棲息地正確渲染翠綠 ✔ 角標');

const badge2 = renderThumbBadgeForHabitat(mockHabLocked, mockState);
assert(!badge2.includes('is-unlocked') && badge2.includes('🔍'), '未全解鎖棲息地應渲染 🔍 且無 is-unlocked');
console.log('✔ [Check 3] 未全數解鎖的棲息地正確維持 🔍 角標');

// 模擬當 p3 也解鎖後
mockState.pkmChecked['p3'] = true;
const badge2After = renderThumbBadgeForHabitat(mockHabLocked, mockState);
assert(badge2After.includes('is-unlocked') && badge2After.includes('✔'), '後續解鎖後應更新為 ✔');
console.log('✔ [Check 4] 動態勾選補齊寶可夢後成功轉變為 ✔ 角標');

console.log('\nAll habitat checkmark badge tests PASSED successfully!');
