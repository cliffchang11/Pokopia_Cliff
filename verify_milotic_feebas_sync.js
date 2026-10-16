/**
 * 離線校驗腳本：驗證美納斯、醜醜魚、百變怪雙向對齊與世界地圖 (verify_milotic_feebas_sync.js)
 */

const fs = require('fs');
const path = require('path');

global.window = {};
eval(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'preferences_db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'region_data.js'), 'utf8'));

const data = global.window.POKOPIA_DATA;
const prefDb = POKOPIA_PREFERENCES_DB;
const regionData = global.window.POKOPIA_REGION_DATA;

console.log('=== [開始離線驗證：美納斯、醜醜魚、百變怪與世界地圖對齊] ===\n');
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

// 1. 驗證美納斯
console.log('1. 驗證美納斯（Milotic）喜好與雙向對齊：');
const milotic = data.pokemons.find(p => p.name === '美納斯');
assert(milotic, '美納斯存在於寶可夢圖鑑中');
const expectedMilotic = ['能感受水的', '閃亮亮的', '有玻璃的', '豪華的', '整潔的', '酸酸的'];
expectedMilotic.forEach(f => {
  assert(milotic.favorites.includes(f), `美納斯 favorites 包含「${f}」`);
  const pref = prefDb.tastes.find(t => t.name === f) || prefDb.things.find(t => t.name === f);
  assert(pref && pref.pokemon.includes('美納斯'), `喜好「${f}」的名冊包含美納斯`);
});

// 2. 驗證醜醜魚
console.log('\n2. 驗證醜醜魚（Feebas）喜好與雙向對齊：');
const feebas = data.pokemons.find(p => p.name === '醜醜魚');
assert(feebas, '醜醜魚存在於寶可夢圖鑑中');
const expectedFeebas = ['能感受水的', '閃亮亮的', '有玻璃的', '能感受大自然的', '大家一起用的', '甜甜的'];
expectedFeebas.forEach(f => {
  assert(feebas.favorites.includes(f), `醜醜魚 favorites 包含「${f}」`);
  const pref = prefDb.tastes.find(t => t.name === f) || prefDb.things.find(t => t.name === f);
  assert(pref && pref.pokemon.includes('醜醜魚'), `喜好「${f}」的名冊包含醜醜魚`);
});

// 3. 驗證百變怪
console.log('\n3. 驗證百變怪（Ditto）喜好純淨化：');
const ditto = data.pokemons.find(p => p.name === '百變怪');
assert(ditto && Array.isArray(ditto.favorites) && ditto.favorites.length === 0, '百變怪 favorites 為空陣列（無任何孤兒標籤）');

// 4. 驗證世界地圖 ID
console.log('\n4. 驗證世界地圖區域寶可夢 ID 對齊：');
const pkmIds = new Set(data.pokemons.map(p => p.id));
let regionBadIds = 0;
for (const r of regionData.regions) {
  for (const id of r.defaultPokemonIds) {
    if (!pkmIds.has(id)) {
      regionBadIds++;
      console.error(`  ❌ 區域「${r.name}」包含無效寶可夢 ID: ${id}`);
    }
  }
}
assert(regionBadIds === 0, '世界地圖 5 大區域所有預設寶可夢 ID 100% 存在於圖鑑中');

console.log(`\n========================================`);
console.log(`美納斯與系統對齊驗收結果：${passedCount} / ${totalCount} 項檢查全數通過！`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
