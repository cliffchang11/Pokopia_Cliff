// verify_building_blueprint.js
// 驗證建築藍圖專區之四大模組樂高圖解結構、正名對齊、HTML/CSS/JS 整合與無損離線驗證

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('--- 開始驗證建築藍圖專區 (Building Blueprint) ---');

// 1. 載入 preferences_db.js 取得官方繁中物品全集
const prefCtx = {};
vm.runInNewContext(fs.readFileSync('preferences_db.js', 'utf8'), prefCtx);
const prefDb = prefCtx.POKOPIA_PREFERENCES_DB;
assert(prefDb && typeof prefDb === 'object', 'preferences_db.js 必須正確匯出 POKOPIA_PREFERENCES_DB');

const allKnownItemNames = new Set(Object.keys(prefDb.itemIcons || {}));
if (prefDb.items) {
  Object.values(prefDb.items).forEach(catItems => {
    if (Array.isArray(catItems)) {
      catItems.forEach(it => {
        if (it && it.name) allKnownItemNames.add(it.name);
      });
    }
  });
}
console.log(`✓ 成功自 preferences_db.js 萃取 ${allKnownItemNames.size} 種標準正名物品`);

// 2. 驗證 building_blueprint_data.js 核心資料結構與 100% 正名對齊
const bpCode = fs.readFileSync('building_blueprint_data.js', 'utf8');
const bpSandbox = { window: {}, self: {}, console: console, module: {}, define: null };
vm.createContext(bpSandbox);
vm.runInContext(bpCode, bpSandbox);
const bpData = bpSandbox.self.POKOPIA_BLUEPRINT_DATA || bpSandbox.window.POKOPIA_BLUEPRINT_DATA;
assert(bpData, 'building_blueprint_data.js 必須正確掛載 POKOPIA_BLUEPRINT_DATA');

// 2.1 藍圖基本屬性驗證
const { blueprint, materialsSummary, modules, steps } = bpData;
assert(blueprint.id === 'halloween_mansion', '藍圖 ID 應為 halloween_mansion');
assert(blueprint.title.includes('洋館'), '藍圖標題必須包含洋館');
assert(blueprint.author.includes('リリィ'), '藍圖作者必須標記 リリィ');
assert(blueprint.videoUrl.includes('youtube.com/watch?v=EnLf8D-EuV0'), '影片連結必須正確對應');
console.log('✓ 藍圖基本資訊完整無誤');

// 2.2 材料表 100% 對齊驗證
assert(Array.isArray(materialsSummary) && materialsSummary.length === 23, `備料清單應收錄 23 種建材，目前為 ${materialsSummary.length}`);
materialsSummary.forEach(mat => {
  assert(allKnownItemNames.has(mat.name), `建材名稱【${mat.name}】未在 preferences_db.js 中找到，違反正名規範！`);
  assert(typeof mat.count === 'number' && mat.count > 0, `建材【${mat.name}】數量必須大於 0`);
  assert(typeof mat.icon === 'string' && mat.icon.length > 0, `建材【${mat.name}】必須具備圖示路徑`);
  assert(fs.existsSync(mat.icon), `建材【${mat.name}】圖示檔案不存在：${mat.icon}`);
});
console.log(`✓ 全數 ${materialsSummary.length} 種建材名稱與 preferences_db.js 100% 精準對齊，且圖示檔案皆存在`);

// 2.3 四大模組樂高立面圖解結構 (Modules) 驗證
assert(Array.isArray(modules) && modules.length === 4, `模組應為 4 個，目前為 ${modules.length}`);
modules.forEach(mod => {
  assert(mod.id && mod.name && mod.badge && mod.dimensions && mod.keyFormula && mod.tips, `模組 ${mod.id} 缺少必要規格屬性`);
  assert(Array.isArray(mod.materials) && mod.materials.length > 0, `模組 ${mod.id} 缺少建材小計`);
  mod.materials.forEach(m => {
    assert(allKnownItemNames.has(m.name), `模組 ${mod.name} 之建材【${m.name}】未對齊正名！`);
    assert(fs.existsSync(m.icon), `模組建材圖示不存在：${m.icon}`);
  });

  assert(Array.isArray(mod.legoLayout) && mod.legoLayout.length > 0, `模組 ${mod.name} 缺少樂高排版結構`);
  mod.legoLayout.forEach(row => {
    assert(row.rowName && row.dimensionNote && Array.isArray(row.blocks) && row.blocks.length > 0, `模組 ${mod.name} 樂高列格式異常`);
    row.blocks.forEach(block => {
      assert(allKnownItemNames.has(block.name), `積木區塊【${block.name}】未對齊正名！`);
      assert(block.color && block.label && block.icon && block.count > 0, `積木區塊【${block.name}】屬性不完整`);
      assert(fs.existsSync(block.icon), `積木圖示不存在：${block.icon}`);
    });
  });
});
console.log('✓ 四大模組樂高立面結構校驗通過，所有積木區塊與尺寸標註皆具備精確正名與圖示');

// 2.4 8 大分步指南 (Steps) 驗證
assert(Array.isArray(steps) && steps.length === 8, `分步指南應為 8 個步驟，目前為 ${steps.length}`);
steps.forEach(step => {
  assert(step.stepNum >= 1 && step.stepNum <= 8, `步驟編號異常：${step.stepNum}`);
  assert(step.title && step.timing && step.summary && step.tips, `步驟 ${step.stepNum} 缺少必要描述欄位`);
  assert(Array.isArray(step.materials) && step.materials.length > 0, `步驟 ${step.stepNum} 必須列出分攤建材`);
  step.materials.forEach(sm => {
    assert(allKnownItemNames.has(sm.name), `步驟 ${step.stepNum} 之材料【${sm.name}】未對齊正名！`);
    assert(sm.count > 0, `步驟 ${step.stepNum} 之材料【${sm.name}】數量需大於 0`);
  });
});
console.log('✓ 8 大施工步驟指南校驗通過，材料分攤正確無誤');

// 3. index.html 整合驗證
const html = fs.readFileSync('index.html', 'utf8');
assert(html.includes('id="tabBlueprint"'), 'index.html 必須包含 id="tabBlueprint" 目次按鈕');
assert(html.includes('id="btnBlueprintNav"'), 'index.html 必須包含 id="btnBlueprintNav" 導覽按鈕');
assert(html.includes('id="blueprintSection"'), 'index.html 必須包含 id="blueprintSection" 分頁容器');
assert(html.includes('id="blueprintContainer"'), 'index.html 必須包含 id="blueprintContainer" 渲染容器');
assert(html.includes('src="building_blueprint_data.js?v=4.13.0"'), 'index.html 必須引入 building_blueprint_data.js?v=4.13.0');
assert(html.includes('app.js?v=4.13.0'), 'index.html 必須使用 app.js?v=4.13.0');
assert(html.includes('index.css?v=4.13.0'), 'index.html 必須使用 index.css?v=4.13.0');
console.log('✓ index.html 導覽、主容器與 4.13.0 快取版本號驗證通過');

// 4. index.css 樣式完整度驗證
const css = fs.readFileSync('index.css', 'utf8');
const requiredClasses = [
  '.bp-hero-banner',
  '.bp-materials-card',
  '.bp-material-item',
  '.bp-modules-section',
  '.bp-module-pill-btn',
  '.bp-lego-board',
  '.bp-lego-block',
  '.bp-steps-container',
  '.bp-step-card'
];
requiredClasses.forEach(cls => {
  assert(css.includes(cls), `index.css 必須包含核心樣式：${cls}`);
});
console.log('✓ index.css 建築藍圖樂高圖解與三合一工作台專用樣式群驗證通過');

// 5. app.js 控制邏輯驗證
const appCode = fs.readFileSync('app.js', 'utf8');
assert(appCode.includes("validTabs = ['storage', 'habitat', 'habitatCatalog', 'recipe', 'preferences', 'autofarm', 'customStorage', 'regionMap', 'video', 'blueprint']"), 'validTabs 必須包含 blueprint');
assert(appCode.includes("tabBlueprint: document.getElementById('tabBlueprint')"), 'DOM 物件必須快取 tabBlueprint');
assert(appCode.includes("btnBlueprintNav: document.getElementById('btnBlueprintNav')"), 'DOM 物件必須快取 btnBlueprintNav');
assert(appCode.includes("blueprintSection: document.getElementById('blueprintSection')"), 'DOM 物件必須快取 blueprintSection');
assert(appCode.includes("blueprintContainer: document.getElementById('blueprintContainer')"), 'DOM 物件必須快取 blueprintContainer');
assert(appCode.includes("} else if (tab === 'blueprint') {"), 'switchTab 必須處理 tab === blueprint');
assert(appCode.includes('function renderBlueprintSection()'), 'app.js 必須實作 renderBlueprintSection');
assert(appCode.includes('window.PokopiaBlueprint'), 'app.js 必須暴露 window.PokopiaBlueprint API');
console.log('✓ app.js 藍圖專區邏輯、路由與 API 綁定驗證通過');

console.log('🎉 建築藍圖 (Building Blueprint) 專屬自動化測試 100% 通過！');
