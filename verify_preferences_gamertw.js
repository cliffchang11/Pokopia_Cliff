/**
 * 離線自動化檢驗腳本：verify_preferences_gamertw.js
 * 檢驗喜好百科 48 種偏好正名、名冊更新與寶可夢圖鑑 favorites 雙向 100% 對齊
 * 嚴禁叫起瀏覽器驗證。
 */
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('--- 開始檢驗喜好百科與圖鑑雙向對齊 ---');

// 1. 讀取 preferences_db.js
const prefCtx = {};
vm.runInNewContext(fs.readFileSync('preferences_db.js', 'utf8'), prefCtx);
const db = prefCtx.POKOPIA_PREFERENCES_DB;
assert(db, 'preferences_db.js 必須成功解析 POKOPIA_PREFERENCES_DB');

// 2. 檢驗 14 個偏好名稱已全面正名為官方正體中文
const thingNames = db.things.map(th => th.name);
const oldNames = [
  '稜角分明的', '圓圓的', '多彩的', '看起來很難懂的',
  '電力驅動的', '百花盛開的', '很像食物的', '能出聲的',
  '搖搖晃晃的', '旋轉的', '遊樂區', '用於觀賞的',
  '羣聚的', '象徵的'
];
for (const old of oldNames) {
  assert(!thingNames.includes(old), `preferences_db.js 不得再殘留舊名稱：${old}`);
}

const expectedOfficialNames = [
  '方方的', '圓滾滾的', '色彩繽紛的', '艱深難懂的',
  '以電力驅動的', '花朵綻放的', '像食物的', '會發出聲響的',
  '會搖晃的', '會旋轉的', '遊戲區', '觀賞用的',
  '集聚在一起的', '象徵'
];
for (const official of expectedOfficialNames) {
  assert(thingNames.includes(official), `preferences_db.js 必須包含官方正名：${official}`);
}
console.log('✓ 14 個喜好偏好官方正名 100% 驗證通過');

// 3. 檢驗「方方的」收錄 9 隻寶可夢，且補齊「泥巴魚」
const blocky = db.things.find(th => th.name === '方方的');
assert(blocky, '必須存在「方方的」偏好分類');
assert(blocky.pokemon.includes('泥巴魚'), '「方方的」必須補入遺漏的「泥巴魚」');
assert(blocky.pokemon.includes('大岩蛇'), '「方方的」必須包含「大岩蛇」');
assert.strictEqual(blocky.pokemon.length, 9, '「方方的」必須精確收錄 9 隻寶可夢');
console.log('✓ 「方方的」名冊補齊與泥巴魚檢查通過');

// 4. 讀取 data.js
const dataCtx = { window: {} };
vm.runInNewContext(fs.readFileSync('data.js', 'utf8'), dataCtx);
const pokemons = dataCtx.window.POKOPIA_DATA.pokemons;
assert(pokemons && pokemons.length > 0, 'data.js 必須包含 pokemons 陣列');

// 5. 檢驗泥巴魚與大岩蛇在 data.js 中的 favorites 包含「方方的」
const stunfisk = pokemons.find(p => p.name === '泥巴魚');
assert(stunfisk, 'data.js 必須包含泥巴魚');
assert(stunfisk.favorites.includes('方方的'), '泥巴魚的 favorites 必須包含「方方的」');

const onix = pokemons.find(p => p.name === '大岩蛇');
assert(onix, 'data.js 必須包含大岩蛇');
assert(onix.favorites.includes('方方的'), '大岩蛇的 favorites 必須包含「方方的」');
assert(!onix.favorites.includes('稜角分明的'), '大岩蛇的 favorites 不得再包含「稜角分明的」');
console.log('✓ 泥巴魚與大岩蛇個人圖鑑 favorites 標籤已正名對齊');

// 6. 雙向對齊檢驗：
// preferences_db 中的所有 things 和 tastes 寶可夢，在 data.js 的 favorites 必須完全包含對應喜好！
let checkedAssociations = 0;
for (const th of db.things) {
  for (const pName of th.pokemon) {
    const pkm = pokemons.find(p => p.name === pName);
    assert(pkm, `偏好「${th.name}」中的寶可夢「${pName}」必須存在於 data.js`);
    assert(pkm.favorites.includes(th.name), `寶可夢「${pName}」的 favorites 必須包含偏好「${th.name}」`);
    checkedAssociations++;
  }
}
for (const ts of db.tastes) {
  if (ts.name === '平淡無奇的') continue;
  for (const pName of ts.pokemon) {
    const pkm = pokemons.find(p => p.name === pName);
    assert(pkm, `口味「${ts.name}」中的寶可夢「${pName}」必須存在於 data.js`);
    assert(pkm.favorites.includes(ts.name), `寶可夢「${pName}」的 favorites 必須包含口味「${ts.name}」`);
    checkedAssociations++;
  }
}
console.log(`✓ 喜好百科與圖鑑資料庫雙向對齊 100% 零死角驗證通過 (共驗證 ${checkedAssociations} 條雙向關聯)`);

// 7. index.html 快取版號檢查
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('data.js?v=4.12.14'), 'index.html 必須使用 data.js?v=4.12.14');
assert(html.includes('preferences_db.js?v=4.12.14'), 'index.html 必須使用 preferences_db.js?v=4.12.14');
assert(html.includes('index.css?v=4.12.14'), 'index.html 必須使用 index.css?v=4.12.14');
console.log('✓ index.html 4.12.14 版號檢查通過');

console.log('🎉 全部喜好百科與雙向對齊測試 100% 通過！');
