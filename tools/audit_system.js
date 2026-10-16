const fs = require('fs');
const path = require('path');

// 建立模擬瀏覽器環境
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '../data.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../preferences_db.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../recipe_db.js'), 'utf8'));

const data = global.window.POKOPIA_DATA;
const prefDb = POKOPIA_PREFERENCES_DB;
const recipes = POKOPIA_RECIPES_DB;

console.log('=== [全系統深層對齊與健康檢查開始] ===\n');

let issues = [];

// 1. 喜好百科與寶可夢圖鑑雙向對齊
const tasteNames = new Set(prefDb.tastes.map(t => t.name));
const thingNames = new Set(prefDb.things.map(t => t.name));
const allPrefNames = new Set([...tasteNames, ...thingNames]);

console.log('1. 喜好百科規模：48 種偏好 (口味 5/6 種, 特徵 43 種)');

// 寶可夢 favorites 是否有不在 48 種偏好裡的孤兒標籤
for (const p of data.pokemons) {
  for (const f of (p.favorites || [])) {
    if (!allPrefNames.has(f)) {
      issues.push(`寶可夢「${p.name}」包含未登錄偏好「${f}」`);
    }
  }
}

// 雙向對齊檢驗
for (const p of data.pokemons) {
  for (const f of (p.favorites || [])) {
    const prefObj = prefDb.tastes.find(t => t.name === f) || prefDb.things.find(t => t.name === f);
    if (!prefObj || !prefObj.pokemon.includes(p.name)) {
      issues.push(`雙向缺漏: 寶可夢「${p.name}」喜歡「${f}」，但喜好名冊中沒有牠`);
    }
  }
}

for (const th of [...prefDb.tastes, ...prefDb.things]) {
  for (const pName of (th.pokemon || [])) {
    const p = data.pokemons.find(x => x.name === pName);
    if (!p) {
      issues.push(`偏好「${th.name}」包含不存在的寶可夢「${pName}」`);
    } else if (!p.favorites || !p.favorites.includes(th.name)) {
      issues.push(`雙向缺漏: 偏好「${th.name}」包含「${pName}」，但該寶可夢 favorites 沒有它`);
    }
  }
}

// 2. 代表物品圖示解析率檢驗
const icons = prefDb.itemIcons || {};
let missingIconsCount = 0;
for (const th of prefDb.things) {
  for (const it of (th.items || [])) {
    const icon = icons[it];
    if (!icon || !fs.existsSync(path.join(__dirname, '..', icon))) {
      missingIconsCount++;
      issues.push(`特徵「${th.name}」之物品「${it}」無圖示或檔案不存在`);
    }
  }
}

// 3. 食譜所需專長與寶可夢專長對齊
const pkmSpecialties = new Set();
for (const p of data.pokemons) {
  if (p.specialty) pkmSpecialties.add(p.specialty);
  if (Array.isArray(p.specialties)) p.specialties.forEach(s => pkmSpecialties.add(s));
}

for (const r of recipes) {
  if (r.specialties) {
    for (const s of r.specialties) {
      if (!pkmSpecialties.has(s.name)) {
        issues.push(`食譜「${r.name}」所需專長「${s.name}」在全島寶可夢中無人具備`);
      }
    }
  }
}

// 4. 食譜喜好寶可夢 vs 寶可夢喜好口味對齊
// 檢查每道菜的 taste 是否能找到對應喜愛該口味的寶可夢
let recipeTasteNoPkms = 0;
for (const r of recipes) {
  if (r.taste && r.taste !== 'all' && r.taste !== '美味') {
    const tastePref = prefDb.tastes.find(t => t.name === r.taste || r.taste.includes(t.name));
    if (!tastePref || tastePref.pokemon.length === 0) {
      issues.push(`食譜「${r.name}」的口味「${r.taste}」在全島沒有任何寶可夢喜愛`);
    }
  }
}

// 5. 寶可夢棲息地代碼對齊
let missingHabitatPkms = 0;
const knownHabitats = new Set(data.habitats.map(h => h.id));
for (const p of data.pokemons) {
  if (p.habitats) {
    for (const hid of p.habitats) {
      if (!knownHabitats.has(hid)) {
        issues.push(`寶可夢「${p.name}」包含未知棲息地代碼「${hid}」`);
      }
    }
  }
}

// 6. 寶可夢精靈圖 (sprite / avatar) 存在性檢驗
let missingSprites = 0;
for (const p of data.pokemons) {
  if (p.avatar && !fs.existsSync(path.join(__dirname, '..', p.avatar))) {
    issues.push(`寶可夢「${p.name}」的 avatar 檔案不存在: ${p.avatar}`);
  }
}

console.log('--- 稽核結果統計 ---');
console.log('總發現問題數:', issues.length);
if (issues.length > 0) {
  console.log('詳細問題清單:');
  issues.slice(0, 30).forEach(iss => console.log('  ⚠️ ', iss));
  if (issues.length > 30) console.log(`  ...還有 ${issues.length - 30} 項問題`);
} else {
  console.log('🎉 恭喜！全系統核心資料庫（圖鑑、百科、食譜、棲息地、圖示）100% 零死角完全對齊！');
}
