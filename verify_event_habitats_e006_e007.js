// verify_event_habitats_e006_e007.js
// 驗證 E006 雀躍沙灘 與 E007 海洋風休閒處 縮圖檔案與資料路徑

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== 開始驗證 E006 與 E007 實機外觀圖片及資料路徑 ===\n');

// 1. 檢查檔案實體存在
const fileE006 = path.join(__dirname, 'assets/habitats/hab_e006.webp');
const fileE007 = path.join(__dirname, 'assets/habitats/hab_e007.webp');

assert(fs.existsSync(fileE006), 'assets/habitats/hab_e006.webp 檔案必須存在');
assert(fs.statSync(fileE006).size > 1000, 'hab_e006.webp 檔案大小必須有效 (> 1KB)');
console.log(`✔ [Check 1] 雀躍沙灘圖片檔案就位 (${fs.statSync(fileE006).size} bytes)`);

assert(fs.existsSync(fileE007), 'assets/habitats/hab_e007.webp 檔案必須存在');
assert(fs.statSync(fileE007).size > 1000, 'hab_e007.webp 檔案大小必須有效 (> 1KB)');
console.log(`✔ [Check 2] 海洋風休閒處圖片檔案就位 (${fs.statSync(fileE007).size} bytes)`);

// 2. 檢驗 data.js 載入
const dataContent = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');

// 檢驗栖息地路徑
assert(dataContent.includes('"id": "hab_e006"'), '必須包含 hab_e006');
assert(dataContent.includes('"assets/habitats/hab_e006.webp"'), '必須引用 hab_e006.webp');
assert(dataContent.includes('"id": "hab_e007"'), '必須包含 hab_e007');
assert(dataContent.includes('"assets/habitats/hab_e007.webp"'), '必須引用 hab_e007.webp');

// 模擬載入 POKOPIA_DATA
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);
const POKOPIA_DATA = sandbox.window.POKOPIA_DATA;
assert(POKOPIA_DATA, 'POKOPIA_DATA 必須成功載入');

// 檢查栖息地列表
const habE006 = POKOPIA_DATA.habitats.find(h => h.id === 'hab_e006');
assert(habE006, '必須找到 hab_e006');
assert.strictEqual(habE006.image, 'assets/habitats/hab_e006.webp', 'hab_e006 圖片路徑必須正確');
console.log('✔ [Check 3] 棲息地 E006 雀躍沙灘 image 路徑正確');

const habE007 = POKOPIA_DATA.habitats.find(h => h.id === 'hab_e007');
assert(habE007, '必須找到 hab_e007');
assert.strictEqual(habE007.image, 'assets/habitats/hab_e007.webp', 'hab_e007 圖片路徑必須正確');
console.log('✔ [Check 4] 棲息地 E007 海洋風休閒處 image 路徑正確');

// 檢查寶可夢圖鑑對應
const pkmFeebas = POKOPIA_DATA.pokemons.find(p => p.name === '醜醜魚');
assert(pkmFeebas, '必須找到醜醜魚');
assert.strictEqual(pkmFeebas.habitat1_img, 'assets/habitats/hab_e006.webp', '醜醜魚 habitat1_img 必須對應 hab_e006.webp');
console.log('✔ [Check 5] 醜醜魚圖鑑項目正確關聯 hab_e006.webp');

const pkmMilotic = POKOPIA_DATA.pokemons.find(p => p.name === '美納斯');
assert(pkmMilotic, '必須找到美納斯');
assert.strictEqual(pkmMilotic.habitat1_img, 'assets/habitats/hab_e007.webp', '美納斯 habitat1_img 必須對應 hab_e007.webp');
console.log('✔ [Check 6] 美納斯圖鑑項目正確關聯 hab_e007.webp');

console.log('\nAll E006 & E007 habitat image verification tests PASSED successfully!');
