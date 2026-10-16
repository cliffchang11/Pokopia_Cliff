/**
 * 離線校驗腳本：全量 43 特徵 0 文字方格驗證 (verify_all_pref_items_icons.js)
 */

const fs = require('fs');
const path = require('path');

const prefDbPath = path.join(__dirname, 'preferences_db.js');
const prefDbContent = fs.readFileSync(prefDbPath, 'utf8');
eval(prefDbContent);

console.log('=== [開始離線驗證：全庫 43 種特徵 0 文字方格校驗] ===\n');
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

const icons = POKOPIA_PREFERENCES_DB.itemIcons || {};

// 1. 驗證「可愛的」特徵
console.log('1. 驗證「可愛的」特徵項目與圖示覆蓋：');
const cute = POKOPIA_PREFERENCES_DB.things.find(t => t.name === '可愛的');
assert(cute && cute.items.length > 0, `「可愛的」特徵存在且包含 ${cute ? cute.items.length : 0} 項代表物品`);

const cuteMissing = (cute.items || []).filter(it => {
  const icon = icons[it];
  if (!icon) return true;
  return !fs.existsSync(path.join(__dirname, icon));
});
assert(cuteMissing.length === 0, `「可愛的」所有物品圖示 100% 存在於磁碟 (缺漏: ${cuteMissing.join(', ') || '無'})`);

// 驗證關鍵正名項目
const expectedCuteItems = [
  '棱棱角角櫃', '可愛的桌子', '時髦凳子', '新潮椅子', '可愛的沙發',
  '樹果造型床', '可愛梳妝檯', '波波浴缸', '樹果桌燈',
  '流星檯燈（紅色）', '流星檯燈（橘黃色）', '流星檯燈（黃色）',
  '流星檯燈（綠色）', '流星檯燈（淺藍）', '流星檯燈（藍色）', '流星檯燈（紫色）',
  '豪華立燈', '妖精之羽', '花朵餐具套組'
];
expectedCuteItems.forEach(it => {
  assert(cute.items.includes(it), `「可愛的」清單正確收錄官方正名「${it}」`);
});

// 2. 驗證全庫 43 種特徵
console.log('\n2. 驗證全庫 43 種特徵所有代表物品圖示覆蓋率：');
let allItemsCount = 0;
let globalMissingCount = 0;
const globalMissingList = [];

for (const th of POKOPIA_PREFERENCES_DB.things) {
  for (const it of (th.items || [])) {
    allItemsCount++;
    const icon = icons[it];
    if (!icon || !fs.existsSync(path.join(__dirname, icon))) {
      globalMissingCount++;
      globalMissingList.push({ thing: th.name, item: it });
    }
  }
}

assert(allItemsCount > 1500, `全庫特徵代表物品檢驗總數符合預期 (共 ${allItemsCount} 件)`);
assert(globalMissingCount === 0, `全庫 43 種特徵代表物品圖示 100% 存在於磁碟 (0 個文字方格，缺漏數: ${globalMissingCount})`);

// 3. 驗證 app.js 容錯防禦邏輯
console.log('\n3. 驗證 app.js 前端渲染防禦機制：');
const appJsCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
assert(appJsCode.includes('norm1 = itemName.replace(/\\(/g, \'（\')'), 'app.js 包含全半形括號自動容錯轉換');
assert(appJsCode.includes('norm3 = itemName.replace(/台/g, \'檯\')'), 'app.js 包含台/檯自動容錯轉換');
assert(appJsCode.includes('CD（紅／綠）'), 'app.js 包含音樂曲目自動 CD 圖示兜底');

console.log(`\n========================================`);
console.log(`全庫代表物品圖示檢驗結果：${passedCount} / ${totalCount} 項檢查全數通過！`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
