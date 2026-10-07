// verify_avatar_table_scale.js
// 專屬自動化驗收腳本：寶可夢圖鑑表格「外觀」精準僅更動大寬螢幕微縮 15%、常態尺寸 100% 還原與版本一致性 (v4.9.7)

const fs = require('fs');
const assert = require('assert');

console.log('=== 開始驗證：圖鑑表格外觀精準僅限大寬螢幕微縮 15%、其他尺寸 100% 還原 (v4.9.7) ===\n');

// 1. 讀取 index.css 與 index.html
const css = fs.readFileSync('index.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

// 2. 檢驗全域常態尺寸 100% 完整還原回 clamp(3.7500rem, 5.0vw, 4.8500rem)
assert.ok(
  css.includes('width: clamp(3.7500rem, 5.0vw, 4.8500rem);') &&
  css.includes('height: clamp(3.7500rem, 5.0vw, 4.8500rem);'),
  'FAIL: .pkm-avatar-table-large 全域常態尺寸未還原為 clamp(3.7500rem, 5.0vw, 4.8500rem)'
);
console.log('✅ [Check 1] PASS: 全域基礎樣式完整還原為 clamp(3.75rem, 5.0vw, 4.85rem)，電腦版其他視窗大小不受波及');

// 3. 檢驗 @media (min-width: 1280px) 專屬隔離微縮 15% (clamp(3.825rem, 5.525vw, 5.1rem))
const wideQueryIdx = css.indexOf('@media (min-width: 1280px)');
assert.ok(wideQueryIdx !== -1, 'FAIL: 缺少 @media (min-width: 1280px) 媒體查詢');
const wideBlock = css.substring(wideQueryIdx, wideQueryIdx + 400);
assert.ok(
  wideBlock.includes('clamp(3.8250rem, 5.525vw, 5.1000rem) !important;'),
  'FAIL: @media (min-width: 1280px) 內的大圖尺寸未精準設定為微縮 15% (clamp(3.8250rem, 5.525vw, 5.1000rem))'
);
console.log('✅ [Check 2] PASS: 大寬螢幕特定尺寸嚴格隔離微縮 15% (clamp(3.825rem, 5.525vw, 5.1rem)) 驗證通過');

// 4. 檢驗第 3 欄「外觀」欄位寬度維持 16% 不變，置中顯示
assert.ok(
  css.includes('width: 16.0% !important;') && css.includes('.pokemon-table th:nth-child(3)'),
  'FAIL: 寬螢幕下外觀欄位寬度應維持 16.0%'
);
assert.ok(
  css.includes('.pkm-avatar-cell') && css.includes('justify-content: center;'),
  'FAIL: 外觀單元格必須維持水平垂直置中展示'
);
console.log('✅ [Check 3] PASS: 第 3 欄欄位寬度維持 16.0% 不變，圖片保持置中對齊');

// 5. 檢驗中螢幕與手機端比例不受影響
assert.ok(
  css.includes('clamp(3.0000rem, 4.8vw, 3.9500rem) !important;'),
  'FAIL: 中窄螢幕 (<= 1024px) 外觀大圖 clamp(3.0rem, 4.8vw, 3.95rem) 受到了非預期干擾'
);
assert.ok(
  css.includes('clamp(2.6000rem, 12.5vw, 3.2000rem) !important;'),
  'FAIL: 手機端 (<= 640px) 外觀頭像 clamp(2.6rem, 12.5vw, 3.2rem) 受到了非預期干擾'
);
console.log('✅ [Check 4] PASS: 中螢幕與手機端比例 100% 維持原樣，未受任何干擾');

// 6. 檢驗全站資源快取標籤更新為 v=4.9.9
assert.ok(html.includes('index.css?v=4.9.9'), 'index.css 快取標籤未更新至 v=4.9.9');
assert.ok(html.includes('app.js?v=4.9.9'), 'app.js 快取標籤未更新至 v=4.9.9');
assert.ok(html.includes('firebase.js?v=4.9.9'), 'firebase.js 快取標籤未更新至 v=4.9.9');
assert.ok(html.includes('logo.png?v=4.9.9'), 'logo 快取標籤未更新至 v=4.9.9');
assert.ok(html.includes('data.js?v=4.9.9'), 'data.js 快取標籤未更新至 v=4.9.9');
console.log('✅ [Check 5] PASS: 全站資源快取標籤確認全數升級至 v=4.9.9');

console.log('\n🎉 verify_avatar_table_scale.js 全部 5 項自動化檢驗 100% 通過！');
