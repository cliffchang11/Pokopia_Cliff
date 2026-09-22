// verify_habitat_e002_skiploom.js
// 驗證 E002 遠足必備棲息地 與 No. 002 毽子花 的雙向綁定

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== 開始驗證 E002 遠足必備 與 毽子花 關聯性 ===\n');

const dataContent = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);
const POKOPIA_DATA = sandbox.window.POKOPIA_DATA;

assert(POKOPIA_DATA, 'POKOPIA_DATA 必須成功載入');

// 1. 驗證 E002 棲息地中的寶可夢設定
const habE002 = POKOPIA_DATA.habitats.find(h => h.id === 'hab_e002');
assert(habE002, '必須存在 hab_e002 遠足必備');
assert.strictEqual(habE002.name, '遠足必備', '名稱必須為遠足必備');
assert.strictEqual(habE002.pokemons.length, 1, 'hab_e002 必須包含 1 隻寶可夢');

const pkm = habE002.pokemons[0];
assert.strictEqual(pkm.id, 'pkm_s1_310', '寶可夢 id 必須為 pkm_s1_310 (毽子花)');
assert.strictEqual(pkm.name, '毽子花', '寶可夢名稱必須為毽子花');
assert.strictEqual(pkm.number, 'No. 002', '編號必須為 No. 002');
assert.strictEqual(pkm.sprite, 'assets/pkm_sprites/pkm_icon_0188.webp', '圖標必須為 pkm_icon_0188.webp');
console.log('✔ [Check 1] hab_e002 棲息地寶可夢已修正為 No. 002 毽子花');

// 2. 驗證 毽子花 圖鑑資料中的 habitat2 關聯
const skiploom = POKOPIA_DATA.pokemons.find(p => p.id === 'pkm_s1_310');
assert(skiploom, '必須存在毽子花 (pkm_s1_310)');
assert.strictEqual(skiploom.name, '毽子花');
assert.strictEqual(skiploom.habitat2_id, 'hab_e002', '毽子花 habitat2_id 必須為 hab_e002');
assert(skiploom.habitat2.includes('遠足必備'), '毽子花 habitat2 必須包含遠足必備');
console.log('✔ [Check 2] 毽子花 (pkm_s1_310) habitat2 雙向正確指向 hab_e002 遠足必備');

// 3. 驗證 毽子草 (No. 001) 與 毽子棉 (No. 003) 未受干擾
const hoppip = POKOPIA_DATA.pokemons.find(p => p.id === 'pkm_s1_309');
assert.strictEqual(hoppip.habitat1_id, 'hab_e001', '毽子草 habitat1_id 維持 hab_e001');

const jumpluff = POKOPIA_DATA.pokemons.find(p => p.id === 'pkm_s1_311');
assert.strictEqual(jumpluff.habitat2_id, 'hab_e003', '毽子棉 habitat2_id 維持 hab_e003');
console.log('✔ [Check 3] 毽子草與毽子棉關聯資料保持完好');

console.log('\nAll E002 Skiploom verification tests PASSED successfully!');
