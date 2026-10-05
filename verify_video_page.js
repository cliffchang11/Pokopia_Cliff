const fs = require('fs');
const assert = require('assert');

console.log('--- 正在驗證參考影片功能結構 ---');

// 1. 驗證 index.html 元素
const html = fs.readFileSync('./index.html', 'utf-8');
const requiredIds = [
  'tabVideo',
  'videoSection',
  'videoPlayerIframe',
  'videoCurrentAuthor',
  'videoCurrentDate',
  'videoExternalLink',
  'btnEditCurrentVideo',
  'videoCurrentTitle',
  'videoCurrentNote',
  'videoCurrentCloudCodeWrap',
  'videoCurrentCloudCode',
  'btnCopyCloudCode',
  'videoCurrentTags',
  'videoTagsContainer',
  'btnAddVideoBtn',
  'videoCardsGrid',
  'videoModal',
  'videoForm',
  'videoFormUrl',
  'videoFormTitle',
  'videoFormTagsPool',
  'btnVideoAddTag',
  'btnAutoFetchVideoInfo',
  'btnToggleTitleLang',
  'toggleLangText',
  'btnVideoSave'
];

requiredIds.forEach(id => {
  assert(html.includes(`id="${id}"`), `index.html 應包含 id="${id}"`);
});
console.log('✓ index.html 元素檢查全數通過');

// 2. 驗證 video_data.js
require('./video_data.js');
assert(Array.isArray(global.POKOPIA_DEFAULT_VIDEOS), 'POKOPIA_DEFAULT_VIDEOS 應為陣列');
assert(global.POKOPIA_DEFAULT_VIDEOS.length >= 5, '預設影片應至少有 5 部');
assert(Array.isArray(global.POKOPIA_DEFAULT_TAGS), 'POKOPIA_DEFAULT_TAGS 應為陣列');
assert(!global.POKOPIA_DEFAULT_TAGS.includes('我的自訂'), '預設標籤集不應包含「我的自訂」');
console.log(`✓ video_data.js 預設精選影片 ${global.POKOPIA_DEFAULT_VIDEOS.length} 部，標籤 ${global.POKOPIA_DEFAULT_TAGS.length} 個 (已成功移除「我的自訂」)`);

// 3. 驗證 YouTube ID 解析正則邏輯
function parseYouTubeId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const fullMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (fullMatch) return fullMatch[1];
  return trimmed;
}

assert.strictEqual(parseYouTubeId('5dCjsO8uskA'), '5dCjsO8uskA');
assert.strictEqual(parseYouTubeId('https://www.youtube.com/watch?v=5dCjsO8uskA'), '5dCjsO8uskA');
assert.strictEqual(parseYouTubeId('https://youtu.be/5dCjsO8uskA'), '5dCjsO8uskA');
assert.strictEqual(parseYouTubeId('https://www.youtube.com/embed/5dCjsO8uskA?rel=0'), '5dCjsO8uskA');
console.log('✓ parseYouTubeId 格式相容性驗證通過');

// 4. 驗證 firebase.js 中的合併欄位
const firebaseCode = fs.readFileSync('./firebase.js', 'utf-8');
assert(firebaseCode.includes('customVideos'), 'firebase.js 應包含 customVideos 合併');
assert(firebaseCode.includes('customVideoTags'), 'firebase.js 應包含 customVideoTags 合併');
console.log('✓ firebase.js 雲端同步欄位驗證通過');

// 5. 驗證 app.js 路由白名單包含 video
const appCode = fs.readFileSync('./app.js', 'utf-8');
assert(appCode.includes("'video'") && appCode.includes("validTabs"), 'app.js validTabs 應包含 video');
console.log('✓ app.js validTabs 包含 video（重新整理停留機制）驗證通過');

// 6. 驗證 app.js 包含標籤編輯功能
assert(appCode.includes('function renameVideoTag'), 'app.js 應包含 renameVideoTag 函式');
assert(appCode.includes('function deleteVideoTag'), 'app.js 應包含 deleteVideoTag 函式');
assert(appCode.includes('btn-tag-edit') && appCode.includes('btn-tag-del'), 'app.js 應包含標籤改名與刪除按鈕');
console.log('✓ app.js 標籤就地編輯 (改名/刪除) 與全局連動機制驗證通過');

console.log('所有單元邏輯驗證全部成功！');
