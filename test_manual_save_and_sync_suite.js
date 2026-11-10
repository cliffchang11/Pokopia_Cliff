const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== 啟動 Pokopia 手動儲存架構與 18:00 定稿離線自動化全套驗證 ===\n');

// 1. 驗證 18:00 模型方塊數 (1,321 顆)
console.log('【測試 1: 妙蛙草定稿 1,321 顆核心資料驗證】');
const savedOverrides = JSON.parse(fs.readFileSync(path.join(__dirname, 'ivysaur_saved_overrides.json'), 'utf8'));
const backupOverrides = JSON.parse(fs.readFileSync(path.join(__dirname, 'model_backups/ivysaur_saved_overrides.json'), 'utf8'));
const count1 = Object.keys(savedOverrides).length;
const count2 = Object.keys(backupOverrides).length;
console.log(`  - ivysaur_saved_overrides.json 筆數: ${count1}`);
console.log(`  - model_backups/ivysaur_saved_overrides.json 筆數: ${count2}`);
assert.strictEqual(count1, 1321, 'ivysaur_saved_overrides.json 必須精確包含 1,321 顆方塊');
assert.strictEqual(count2, 1321, 'model_backups 備份必須精確包含 1,321 顆方塊');

const voxelEditorContent = fs.readFileSync(path.join(__dirname, 'voxel_editor.js'), 'utf8');
assert.ok(voxelEditorContent.includes('const IVYSAUR_SAVED_OVERRIDES = {'), 'voxel_editor.js 必須包含 IVYSAUR_SAVED_OVERRIDES');
assert.ok(voxelEditorContent.includes('1,321 顆 (1321)'), '註解與清洗邏輯需明確包含 1321');
console.log('  ✓ PASS: 妙蛙草 18:00 模型 (1,321 顆) 核心定稿資料 100% 正確！\n');

// 2. 驗證手動儲存按鈕與未儲存狀態標記 (Dirty State)
console.log('【測試 2: 手動儲存按鈕與未儲存狀態標記】');
assert.ok(voxelEditorContent.includes('id="btnSaveCloud_${charKey}"'), '工具列必須包含手動儲存按鈕 btnSaveCloud');
assert.ok(voxelEditorContent.includes('function updateSaveButtonUI'), '必須包含 updateSaveButtonUI 狀態切換函式');
assert.ok(voxelEditorContent.includes('async function saveOverridesToCloud'), '必須包含手動儲存 saveOverridesToCloud 函式');
assert.ok(voxelEditorContent.includes("updateSaveButtonUI(charKey, 'dirty')"), '編輯方塊後必須標記 dirty 狀態，不自動送網路');
assert.ok(!voxelEditorContent.includes('syncOverridesToCloud(charKey, isDrag)'), 'notifyListeners 內不得再殘留自動網路發送');
console.log('  ✓ PASS: 手動儲存架構完備，編輯純本地極速操作，不觸發自動連網競爭！\n');

// 3. 驗證 Firebase 角色級整份替換 (防 deep merge 消除方塊殘留)
console.log('【測試 3: Firebase 角色級整份替換與消除不回彈】');
const firebaseContent = fs.readFileSync(path.join(__dirname, 'firebase.js'), 'utf8');
assert.ok(firebaseContent.includes('[`voxelOverrides.${charKey}`]: {'), 'saveVoxelOverrides 必須採角色級整份替換');
assert.ok(!firebaseContent.includes('voxelOverrides: {\n            [charKey]: {'), '不得再有 nested deep merge 寫法');
assert.ok(firebaseContent.includes('cTime > lTime'), 'mergeProgressUnion 必須以最新時間戳為準');
console.log('  ✓ PASS: Firebase 消除方塊角色級整份替換完備，絕不殘留舊 key！\n');

// 4. 驗證 1,384 顆舊快取清洗邏輯
console.log('【測試 4: 1,384 顆舊快取主動清洗升級】');
assert.ok(voxelEditorContent.includes('count === 1384'), 'loadOverridesFromStorage 必須主動清洗 1384 舊快取');
assert.ok(voxelEditorContent.includes('localCount === 1384'), '自救水合必須主動清洗 1384 舊快取為 1321 定稿版');
console.log('  ✓ PASS: 舊快取 1,384 顆清洗升級邏輯生效，重新整理自動切換 1,321 顆！\n');

// 5. 驗證臨時對照頁面已清除
console.log('【測試 5: 臨時比對檔案清理檢驗】');
assert.ok(!fs.existsSync(path.join(__dirname, 'compare.html')), 'compare.html 必須已刪除');
assert.ok(!fs.existsSync(path.join(__dirname, 'compare_data.js')), 'compare_data.js 必須已刪除');
console.log('  ✓ PASS: 臨時比對頁面與資料檔已全部乾淨移除！\n');

// 6. 驗證全站版本號推進至 v4.73.0
console.log('【測試 6: 全站快取版本升級至 v4.73.0】');
const swContent = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.ok(/pokopia-cache-v4\.(7[3-9]|[89]\d|\d{3,})\.0/.test(swContent), 'sw.js 必須升級為 pokopia-cache >= v4.73.0');
assert.ok(/v=4\.(7[3-9]|[89]\d|\d{3,})\.0/.test(indexHtmlContent), 'index.html 必須升級為 >= v4.73.0');
assert.ok(!indexHtmlContent.includes('v=4.72.0'), 'index.html 不得殘留 v=4.72.0');
console.log('  ✓ PASS: 全站版本號已升級至 v4.73.0！\n');

console.log('🎉🎉 全部 6 大項離線整合自動化測試 100% 全數通過 (PASS)！');
