// verify_avatar_table_scale.js
// 專屬自動化驗收腳本：寶可夢圖鑑表格「外觀」寬螢幕等比微縮 15%、中窄手機比例維持與版本一致性 (v4.9.6)

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證：圖鑑表格外觀等比微縮 15% 與響應式穩定性 (v4.9.6) ===\n');

// 1. 讀取 index.css 與 index.html
const css = fs.readFileSync('index.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

// 2. 檢驗預設與寬螢幕（>= 1280px）外觀圖片尺寸等比微縮 15%
assert.ok(
  css.includes('width: clamp(3.1875rem, 4.25vw, 4.1225rem);') &&
  css.includes('height: clamp(3.1875rem, 4.25vw, 4.1225rem);'),
  'FAIL: .pkm-avatar-table-large 預設尺寸未正確調整為 clamp(3.1875rem, 4.25vw, 4.1225rem)'
);

// 檢驗 @media (min-width: 1280px) 內的覆蓋規則
const wideQueryIdx = css.indexOf('@media (min-width: 1280px)');
assert.ok(wideQueryIdx !== -1, 'FAIL: 缺少 @media (min-width: 1280px) 媒體查詢');
const wideBlock = css.substring(wideQueryIdx, wideQueryIdx + 400);
assert.ok(
  wideBlock.includes('clamp(3.1875rem, 4.25vw, 4.1225rem) !important;'),
  'FAIL: @media (min-width: 1280px) 內的大圖尺寸未更新為微縮 15% (clamp(3.1875rem, 4.25vw, 4.1225rem))'
);
console.log('✅ [Check 1] PASS: 寬螢幕下寶可夢外觀圖片尺寸等比微縮 15% (clamp(3.1875rem, 4.25vw, 4.1225rem)) 驗證通過');

// 3. 檢驗第 3 欄「外觀」欄位寬度維持 16% 不變，置中顯示
assert.ok(
  css.includes('width: 16.0% !important;') && css.includes('.pokemon-table th:nth-child(3)'),
  'FAIL: 寬螢幕下外觀欄位寬度應維持 16.0%'
);
assert.ok(
  css.includes('.pkm-avatar-cell') && css.includes('justify-content: center;'),
  'FAIL: 外觀單元格必須維持水平垂直置中展示'
);
console.log('✅ [Check 2] PASS: 第 3 欄欄位寬度維持 16.0% 不變，圖片保持置中對齊');

// 4. 檢驗中螢幕與手機端比例不受影響（其他螢幕大小比例不變）
assert.ok(
  css.includes('clamp(3.0000rem, 4.8vw, 3.9500rem) !important;'),
  'FAIL: 中窄螢幕 (<= 1024px) 外觀大圖 clamp(3.0rem, 4.8vw, 3.95rem) 受到了非預期干擾'
);
assert.ok(
  css.includes('clamp(2.6000rem, 12.5vw, 3.2000rem) !important;'),
  'FAIL: 手機端 (<= 640px) 外觀頭像 clamp(2.6rem, 12.5vw, 3.2rem) 受到了非預期干擾'
);
console.log('✅ [Check 3] PASS: 中螢幕 (clamp 3.0rem~3.95rem) 與手機端 (clamp 2.6rem~3.2rem) 比例 100% 維持不變');

// 5. 檢驗全站資源快取標籤更新為 v=4.9.6
assert.ok(html.includes('index.css?v=4.9.6'), 'index.css 快取標籤未更新至 v=4.9.6');
assert.ok(html.includes('app.js?v=4.9.6'), 'app.js 快取標籤未更新至 v=4.9.6');
assert.ok(html.includes('firebase.js?v=4.9.6'), 'firebase.js 快取標籤未更新至 v=4.9.6');
assert.ok(html.includes('logo.png?v=4.9.6'), 'logo 快取標籤未更新至 v=4.9.6');
assert.ok(html.includes('data.js?v=4.9.6'), 'data.js 快取標籤未更新至 v=4.9.6');
console.log('✅ [Check 4] PASS: 全站資源快取標籤確認全數升級至 v=4.9.6');

console.log('\n🎉 verify_avatar_table_scale.js 全部 4 項自動化檢驗 100% 通過！');
