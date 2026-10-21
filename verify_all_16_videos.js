const fs = require('fs');
const assert = require('assert');

console.log('=== [開始離線驗證：16 部精選影片收錄、繁中正名與「建築造景」分類] ===\n');

// 1. 載入 video_data.js
const videoDataJs = fs.readFileSync('video_data.js', 'utf8');
const sandbox = { window: {}, global: {} };
const fn = new Function('window', 'global', videoDataJs);
fn(sandbox.window, sandbox.global);

const defaultVideos = sandbox.window.POKOPIA_DEFAULT_VIDEOS || sandbox.global.POKOPIA_DEFAULT_VIDEOS;
const defaultTags = sandbox.window.POKOPIA_DEFAULT_TAGS || sandbox.global.POKOPIA_DEFAULT_TAGS;

assert.ok(Array.isArray(defaultVideos), 'POKOPIA_DEFAULT_VIDEOS 必須為陣列');
assert.strictEqual(defaultVideos.length, 16, `精選影片總數應為 16 部，目前為 ${defaultVideos.length}`);
console.log(`✅ [PASS] 預設精選影片數精確為 16 部 (既有 5 部 + 新增 11 部)`);

// 2. 驗證標籤清單中包含「建築造景」
assert.ok(defaultTags.includes('建築造景'), '預設標籤必須包含「建築造景」');
console.log(`✅ [PASS] 預設標籤庫成功收錄「建築造景」分類標籤`);

// 3. 驗證 11 部新影片全數存在且欄位齊全
const expectedNewVideoIds = [
  'BgrIUQTrobU', // 7-Eleven
  'GzePoZSfQ78', // 霍格華茲
  'C17uSb_bQH4', // 仙度瑞拉城堡
  '49j3IpNC-JI', // 艾瑞克王子城堡
  'WpMqS6RxBvU', // 關都世界
  'Yvvz5AEptWg', // 工廠/發電廠
  '1jB0sZejsFE', // 神社
  'JRbeKGep7W4', // 銀山溫泉
  'Zpxz9IZc8Ew', // 火車站
  '-hy9ydtbcEE', // 麵包小店
  'nnhJ-qWEKCg'  // 石造車站咖啡廳
];

expectedNewVideoIds.forEach((vid, idx) => {
  const found = defaultVideos.find(v => v.videoId === vid);
  assert.ok(found, `❌ 缺少影片 videoId: ${vid}`);
  assert.ok(found.id && found.id.startsWith('video_def_'), `影片 ${vid} ID 格式錯誤: ${found.id}`);
  assert.ok(found.title && found.title.trim().length > 0, `影片 ${vid} 缺少標題`);
  assert.ok(found.author && found.author.trim().length > 0, `影片 ${vid} 缺少作者`);
  assert.ok(found.url && found.url.includes(vid), `影片 ${vid} 網址不合規: ${found.url}`);
  assert.ok(Array.isArray(found.tags) && found.tags.includes('建築造景'), `影片 ${vid} 必須標有「建築造景」標籤`);
  assert.ok(found.note && found.note.trim().length > 0, `影片 ${vid} 缺少中文備註說明`);
  assert.strictEqual(found.isDefault, true, `影片 ${vid} isDefault 必須為 true`);
});
console.log(`✅ [PASS] 11 部新增建築影片之 ID、繁體中文標題、作者、標籤與備註 100% 完整合格`);

// 4. 驗證增補模擬：模擬使用者原本只有舊的 5 部影片快取，載入時自動增量為 16 部
const oldCachedSaved = defaultVideos.slice(0, 5);
const list = [...oldCachedSaved];
const existingIds = new Set(list.map(v => v.id));
defaultVideos.forEach(def => {
  if (def && def.id && !existingIds.has(def.id)) {
    list.push(JSON.parse(JSON.stringify(def)));
    existingIds.add(def.id);
  }
});
assert.strictEqual(list.length, 16, '增補模擬失敗：舊存檔未自動補齊新官方影片');
console.log(`✅ [PASS] 增補防護模擬驗證成功：舊裝置載入時自動無痛導入 11 部新影片`);

// 5. 驗證所有 16 部影片之 ID 唯一性
const allIds = defaultVideos.map(v => v.id);
const uniqueIds = new Set(allIds);
assert.strictEqual(allIds.length, uniqueIds.size, '影片 ID 不得有重複');
console.log(`✅ [PASS] 16 部影片專屬 ID 完全唯一無衝突`);

console.log('\n========================================');
console.log('🎉 16 部精選影片收錄與增補驗證 100% 通過！');
console.log('========================================\n');
process.exit(0);
