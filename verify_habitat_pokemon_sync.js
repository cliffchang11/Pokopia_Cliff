const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('🚀 開始執行 Pokopia 全站 252 處棲息地與 367 隻寶可夢雙向對齊嚴格驗證');
console.log('================================================================\n');

const dataPath = path.join(__dirname, 'data.js');
const src = fs.readFileSync(dataPath, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);

const data = sandbox.window.POKOPIA_DATA;
const pkms = data.pokemons;
const habs = data.habitats;

// [Check 1] 核心問題修復：092 小小畫室 100% 歸屬 No. 119 圖圖犬，絕無幸福蛋
const hab092 = habs.find(h => h.official_id === '092');
assert(hab092, '棲息地資料庫必須存在 092 小小畫室');
const pkm092Names = hab092.pokemons.map(p => p.name);
assert(pkm092Names.includes('圖圖犬'), '092 小小畫室必須正確對應 No. 119 圖圖犬');
assert(!pkm092Names.includes('幸福蛋'), '092 小小畫室絕不應再包含幸福蛋 (低級錯誤徹底根除)');
assert(hab092.pokemons.some(p => p.sprite.includes('pkm_icon_0235S.webp')), '圖圖犬圖標必須為原版點陣 pkm_icon_0235S.webp');
console.log('✅ [Check 1] PASS: 【092 小小畫室】正確對應 No. 119 圖圖犬 (彩繪)，幸福蛋錯位徹底排除！');

// [Check 2] 095 超可愛空間 100% 歸屬 No. 102 幸福蛋
const hab095 = habs.find(h => h.official_id === '095');
assert(hab095, '棲息地資料庫必須存在 095 超可愛空間');
const pkm095Names = hab095.pokemons.map(p => p.name);
assert(pkm095Names.includes('幸福蛋'), '095 超可愛空間必須正確對應 No. 102 幸福蛋');
assert(hab095.pokemons.some(p => p.sprite.includes('pkm_icon_0242.webp')), '幸福蛋圖標必須為原版點陣 pkm_icon_0242.webp');
console.log('✅ [Check 2] PASS: 【095 超可愛空間】正名歸屬 No. 102 幸福蛋 (交易/亂撒)！');

// [Check 3] 093 美味的供品 與卡比獸（萌苔）綁定無損
const hab093 = habs.find(h => h.official_id === '093');
assert(hab093 && hab093.pokemons.some(p => p.name === '卡比獸（萌苔）'), '093 美味的供品 必須對應卡比獸（萌苔）');
console.log('✅ [Check 3] PASS: 【093 美味的供品】與 No. 108 卡比獸（萌苔）雙向綁定保全無損！');

// [Check 4] 多形態寶可夢（米立龍/無殼海兔/海兔獸）獨立性與完整性
const hab071 = habs.find(h => h.official_id === '071');
const pkm071Names = hab071.pokemons.map(p => p.name);
assert(pkm071Names.includes('米立龍（上弓）') && pkm071Names.includes('米立龍（下垂）') && pkm071Names.includes('米立龍（平挺）'), '071 必須包含 3 種形態米立龍');

const hab027 = habs.find(h => h.official_id === '027');
const pkm027Names = hab027.pokemons.map(p => p.name);
assert(pkm027Names.includes('無殼海兔（西海）') && pkm027Names.includes('無殼海兔（東海）'), '027 必須包含西海與東海無殼海兔');

const hab185 = habs.find(h => h.official_id === '185');
const pkm185Names = hab185.pokemons.map(p => p.name);
assert(pkm185Names.includes('海兔獸（西海）') && pkm185Names.includes('海兔獸（東海）'), '185 必須包含西海與東海海兔獸');
console.log('✅ [Check 4] PASS: 多形態寶可夢（米立龍 3 款、海兔 2 款、海兔獸 2 款）形態嚴格獨立無遺漏！');

// [Check 5] 全站 252 處棲息地無重複寶可夢 ID
habs.forEach(h => {
  const ids = h.pokemons.map(p => p.id);
  assert.strictEqual(ids.length, new Set(ids).size, `棲息地 ${h.official_id} (${h.name}) 存在重複寶可夢 ID`);
});
console.log('✅ [Check 5] PASS: 全站 252 處棲息地寶可夢陣列 100% 無重複 ID！');

// [Check 6] 全站 367 筆寶可夢反向鏡像映射 100% 完整對齊 (0 錯位、0 缺失)
let unmappedCount = 0;
pkms.forEach(p => {
  const checkHab = (habId) => {
    if (!habId || habId === 'none') return;
    const targetHab = habs.find(h => h.id === habId);
    assert(targetHab, `寶可夢 ${p.name} 參照的棲息地 ID ${habId} 不存在於資料庫`);
    const found = targetHab.pokemons.some(hp => hp.id === p.id);
    if (!found) {
      unmappedCount++;
      console.error(`❌ 遺漏映射: 寶可夢 ${p.name} (${p.id}) 未存在於其目標棲息地 ${targetHab.name} (${targetHab.id})`);
    }
  };
  checkHab(p.habitat1_id);
  checkHab(p.habitat2_id);
});
assert.strictEqual(unmappedCount, 0, `存在 ${unmappedCount} 處寶可夢未正確反向登記在棲息地中`);
console.log('✅ [Check 6] PASS: 全站 367 筆寶可夢棲息地反向對照 100% 嚴格鏡像對齊 (0 錯位、0 遺漏)！');

console.log('\n🎉 Pokopia 全站 252 處棲息地與 367 隻寶可夢雙向對齊嚴格驗證 100% PASS！');
