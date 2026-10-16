/**
 * 離線校驗腳本：驗證特徵代表物品圖示覆蓋率與 GamerTW 67 種規範對齊 (verify_clean_item_icons.js)
 */

const fs = require('fs');
const path = require('path');

const prefDbPath = path.join(__dirname, 'preferences_db.js');
const prefDbContent = fs.readFileSync(prefDbPath, 'utf8');
eval(prefDbContent);

console.log('=== [開始離線驗證：特徵物品清單與 GamerTW 67 種規範] ===\n');
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

// 1. 驗證 GamerTW 官方規範 67 項道具清單
const GAMERTW_BLOCKY_67 = [
  "壁掛收納箱", "自然風儲物櫃", "辦公室的收納櫃", "古董儲物櫃", "自然風衣櫥",
  "辦公室的置物櫃", "古董衣櫥", "辦公室的大型櫃", "自然風矮櫃", "鐵矮櫃",
  "木凳子", "鐵椅子", "公共座椅", "軟綿綿椅子", "包廂沙發",
  "圓木床鋪", "自然風迷你床", "壁掛鏡", "大鏡子", "野餐籃",
  "三明治", "樹果野餐籃", "信件", "筆記簿", "書",
  "翻開的書", "論文", "報紙", "相框", "壁掛相框",
  "軟木板", "迷你書架", "書架", "石頭壁爐", "水槽",
  "爐子", "微波爐", "冰箱", "洗衣機", "洗手台",
  "平板電腦", "行動電話", "筆記型電腦", "電視", "壁掛螢幕",
  "大型遊戲機", "Game Boy", "音箱", "驚嚇箱", "瓦楞紙箱",
  "白板", "控制盤", "壁掛月曆", "掛軸", "沙池",
  "自動販賣機", "吉利蛋植栽", "充氣船", "菜單立牌", "破爛木箱",
  "木箱", "大型排風扇", "裝飾框", "迷你發電機", "壁燈",
  "城鎮地圖", "火箭隊掛飾"
];

console.log('1. 驗證「方方的」特徵清單純淨度與總數：');
const blocky = POKOPIA_PREFERENCES_DB.things.find(t => t.name === '方方的');
assert(blocky && blocky.items.length === 67, `「方方的」代表物品數精確對齊為 67 種 (目前: ${blocky ? blocky.items.length : 0})`);
assert(blocky && blocky.items.includes('野餐籃'), '「方方的」包含合法的「野餐籃」');
assert(blocky && blocky.items.includes('掛軸'), '「方方的」包含合法的「掛軸」');

console.log('\n2. 驗證 4 種未收錄冗餘道具已徹底移除：');
const redundantItems = ['電競冰箱', '收納箱', '大收納箱', '廚房桌子'];
redundantItems.forEach(item => {
  assert(!blocky.items.includes(item), `「方方的」已剔除 GamerTW 未收錄項目「${item}」`);
});

console.log('\n3. 驗證 GamerTW 67 種道具清單 100% 吻合：');
const missingInBlockyList = GAMERTW_BLOCKY_67.filter(it => !blocky.items.includes(it));
assert(missingInBlockyList.length === 0, `GamerTW 67 項道具全數收錄於「方方的」中 (缺漏: ${missingInBlockyList.join(', ') || '無'})`);

console.log('\n4. 驗證「方方的」內所有 67 項物品的圖示覆蓋：');
const icons = POKOPIA_PREFERENCES_DB.itemIcons || {};
const missingIcons = blocky.items.filter(it => !icons[it]);
assert(missingIcons.length === 0, `「方方的」67 項物品圖示 100% 存在 (缺漏數: ${missingIcons.length})`);

console.log(`\n========================================`);
console.log(`離線物品圖示覆蓋驗證結果：${passedCount} / ${totalCount} 項檢查通過！`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
