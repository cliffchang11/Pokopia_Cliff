/**
 * 離線校驗腳本：驗證特徵代表物品圖示覆蓋率與贅名清理 (verify_clean_item_icons.js)
 */

const fs = require('fs');
const path = require('path');

const prefDbPath = path.join(__dirname, 'preferences_db.js');
const prefDbContent = fs.readFileSync(prefDbPath, 'utf8');
eval(prefDbContent);

console.log('=== [開始離線驗證：特徵物品清單與圖示覆蓋率] ===\n');
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

// 1. 驗證 3 個非官方別名全庫徹底清空
console.log('1. 驗證非官方別名全庫清理：');
const dbStr = JSON.stringify(POKOPIA_PREFERENCES_DB);
assert(!dbStr.includes('辦公室的置物櫃'), '全庫徹底移除「辦公室的置物櫃」');
assert(!dbStr.includes('辦公室的大型櫃'), '全庫徹底移除「辦公室的大型櫃」');
assert(!dbStr.includes('破爛木箱'), '全庫徹底移除「破爛木箱」');

// 2. 驗證「方方的」特徵項目總數收斂為 71 且包含野餐籃與掛軸
console.log('\n2. 驗證「方方的」特徵清單純淨度：');
const blocky = POKOPIA_PREFERENCES_DB.things.find(t => t.name === '方方的');
assert(blocky && blocky.items.length === 71, `「方方的」代表物品數由 74 收斂為 71 (目前: ${blocky ? blocky.items.length : 0})`);
assert(blocky && blocky.items[blocky.items.length - 1] === '野餐籃', '「方方的」最後一項物品為合法的「野餐籃」');

// 3. 驗證「方方的」內所有 71 項物品的圖示覆蓋
console.log('\n3. 驗證「方方的」代表物品圖示覆蓋：');
const icons = POKOPIA_PREFERENCES_DB.itemIcons || {};
const missingInBlocky = blocky.items.filter(it => !icons[it]);
assert(missingInBlocky.length === 0, `「方方的」71 項物品圖示 100% 存在 (缺漏數: ${missingInBlocky.length})`);

// 4. 驗證其他受影響的特徵清單合法性
console.log('\n4. 驗證關聯特徵清單合法性：');
const affectedThings = ['容器', '有文字的', '有玻璃的', '木製的', '集聚在一起的', '金屬的'];
affectedThings.forEach(name => {
  const th = POKOPIA_PREFERENCES_DB.things.find(t => t.name === name);
  const hasBadItems = th && th.items.some(it => ['辦公室的置物櫃', '辦公室的大型櫃', '破爛木箱'].includes(it));
  assert(!hasBadItems, `特徵「${name}」已完全剔除非官方別名`);
});

console.log(`\n========================================`);
console.log(`離線物品圖示覆蓋驗證結果：${passedCount} / ${totalCount} 項檢查通過！`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
