const fs = require("fs");
const vm = require("vm");

// 1. Read sources
const html = fs.readFileSync("scratch_recipes.html", "utf-8");

const prefCode = fs.readFileSync("preferences_db.js", "utf-8");
const prefContext = {};
vm.createContext(prefContext);
vm.runInContext(prefCode, prefContext);
const prefDB = prefContext.POKOPIA_PREFERENCES_DB;

const dataCode = fs.readFileSync("data.js", "utf-8");
const dataContext = { window: {} };
vm.createContext(dataContext);
vm.runInContext(dataCode, dataContext);
const pokemons = dataContext.window.POKOPIA_DATA.pokemons || [];

// Poke sprite mapping
const pokeMap = {};
pokemons.forEach(p => {
  pokeMap[p.name] = {
    id: p.id,
    number: p.number,
    name: p.name,
    sprite: p.sprite,
    favorites: p.favorites || []
  };
});

// Local sprites
const localSprites = fs.readdirSync("assets/item_sprites");
const findLocalSprite = (name) => {
  if (!name) return "";
  const exact = localSprites.find(f => f.includes(`Bag_${name}_`));
  if (exact) return `assets/item_sprites/${exact}`;
  return "";
};

// Simplified to Traditional Map
const tradMap = {
  "叶子": "葉子",
  "小麦": "小麥",
  "苹野果": "蘋野果",
  "成熟的红萝卜": "成熟的紅蘿蔔",
  "成熟的蘑菇": "成熟的蘑菇",
  "西红柿": "番茄",
  "马铃薯": "馬鈴薯",
  "切块西瓜": "切塊西瓜",
  "平底锅": "平底鍋",
  "时髦的平底锅": "時髦的平底鍋",
  "锅子": "鍋子",
  "时髦锅": "時髦鍋",
  "露营锅": "露營鍋",
  "派对锅": "派對鍋",
  "搅拌机": "食物攪拌機",
  "面包窑": "麵包窯",
  "碾压": "碾壓",
  "点火": "點火",
  "发电": "發電",
  "开派对": "開派對",
  "冲浪": "衝浪",
  "苹野面包": "蘋野果麵包",
  "辣飞天汉堡排": "辣飛天漢堡排",
  "苹野冰沙": "蘋野冰沙",
  "劲爽汽水": "勁爽汽水",
  "哞哞鲜奶咖啡": "哞哞鮮奶咖啡",
  "零余果": "零餘果"
};

const toTrad = (str) => {
  if (!str) return "";
  let res = str;
  for (const [k, v] of Object.entries(tradMap)) {
    res = res.split(k).join(v);
  }
  return res.trim();
};

// Facility standard name and icon
const normalizeFacility = (facStr) => {
  const t = toTrad(facStr);
  if (t.includes("砧板")) return { id: "cutting_board", name: "砧板", move: "樹葉", icon: "assets/item_sprites/60px-Bag_砧板_Pokopia_Sprite.png" };
  if (t.includes("麵包窯") || t.includes("面包窑")) return { id: "bread_oven", name: "麵包窯", move: "居合斬", icon: "assets/item_sprites/60px-Bag_麵包窯_Pokopia_Sprite.png" };
  if (t.includes("平底鍋") || t.includes("平底锅")) return { id: "frying_pan", name: "平底鍋", move: "碎岩", icon: "assets/item_sprites/60px-Bag_平底鍋_Pokopia_Sprite.png" };
  if (t.includes("鍋子") || t.includes("锅子") || t.includes("露營鍋")) return { id: "pot", name: "鍋子", move: "水槍", icon: "assets/item_sprites/60px-Bag_鍋子_Pokopia_Sprite.png" };
  if (t.includes("派對鍋") || t.includes("派对锅")) return { id: "party_pot", name: "派對鍋", move: "開派對", icon: "assets/item_sprites/60px-Bag_派對鍋_Pokopia_Sprite.png" };
  if (t.includes("攪拌機") || t.includes("搅拌机")) return { id: "blender", name: "食物攪拌機", move: "衝浪", icon: "assets/item_sprites/60px-Bag_食物攪拌機_Pokopia_Sprite.png" };
  return { id: "other", name: t, move: "", icon: "" };
};

// Parse ingredients accurately
const parseIngredients = (raw) => {
  let cleaned = raw
    .replace(/File:[^.]+\.(?:png|jpg|webp)/gi, "")
    .replace(/\[\[[^\]]+\]\]/g, "")
    .replace(/Pokopia/gi, "")
    .replace(/Sprite\.png/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  cleaned = toTrad(cleaned);
  
  const re = /([^\d×x＋+]+?)(?:\s*[×x]\s*([０-９\d]+))?(?=\s+[^\d×x＋+]|$)/g;
  const result = [];
  const seenNames = new Set();
  let match;
  while ((match = re.exec(cleaned)) !== null) {
    let name = match[1].trim();
    if (!name || name === "食材" || name.includes("Pokopia") || name.includes("Sprite") || name.includes(".png")) continue;
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    let countStr = match[2] || "1";
    countStr = countStr.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFEE0));
    const count = parseInt(countStr, 10) || 1;
    const icon = findLocalSprite(name) || (prefDB.itemIcons && prefDB.itemIcons[name]) || "";
    result.push({ name, count, icon });
  }
  return result;
};

// Parse Table 1
const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
const recipeTable = tables[1];
const trs = recipeTable.match(/<tr[\s\S]*?<\/tr>/g) || [];

let currentCategory = "";
let currentFacility = "";
const rawRecipes = [];

for (let i = 1; i < trs.length; i++) {
  const tr = trs[i];
  const tds = tr.match(/<td[\s\S]*?<\/td>/g) || [];
  if (tds.length === 0) continue;

  const imgs = [...tr.matchAll(/<img[^>]+(?:src|data-src)="([^">]+)"[^>]*>/g)].map(m => m[1]);

  let name = "", ingredientsRaw = "", specialty = "", taste = "", move = "", effect = "", exp = "", img = "";

  if (tds.length >= 10) {
    currentCategory = tds[0].replace(/<[^>]+>/g, "").trim();
    name = tds[2].replace(/<[^>]+>/g, "").trim();
    currentFacility = tds[3].replace(/<[^>]+>/g, "").trim();
    ingredientsRaw = tds[4].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    specialty = tds[5].replace(/<[^>]+>/g, "").trim();
    taste = tds[6].replace(/<[^>]+>/g, "").trim();
    move = tds[7].replace(/<[^>]+>/g, "").trim();
    effect = tds[8].replace(/<[^>]+>/g, "").trim();
    exp = tds[9].replace(/<[^>]+>/g, "").trim();
    img = imgs[0] || "";
  } else if (tds.length === 8) {
    name = tds[1].replace(/<[^>]+>/g, "").trim();
    ingredientsRaw = tds[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    specialty = tds[3].replace(/<[^>]+>/g, "").trim();
    taste = tds[4].replace(/<[^>]+>/g, "").trim();
    move = tds[5].replace(/<[^>]+>/g, "").trim();
    effect = tds[6].replace(/<[^>]+>/g, "").trim();
    exp = tds[7].replace(/<[^>]+>/g, "").trim();
    img = imgs[0] || "";
  }

  name = toTrad(name);
  if (!name) continue;

  rawRecipes.push({
    category: toTrad(currentCategory),
    facilityRaw: currentFacility,
    name,
    ingredientsRaw,
    specialty: toTrad(specialty),
    taste: toTrad(taste) || (name.includes("咖喱") ? "濃郁" : "美味"),
    move: toTrad(move) || (name.includes("咖喱") ? "開派對" : ""),
    effect: toTrad(effect) || "大家一起享用的派對盛宴",
    exp,
    onlineImg: img.startsWith("//") ? `https:${img}` : img
  });
}

// Convert to structured database
const database = rawRecipes.map((r, idx) => {
  const facilityObj = normalizeFacility(r.facilityRaw);
  let localIcon = findLocalSprite(r.name) || (prefDB.itemIcons && prefDB.itemIcons[r.name]) || "";
  if (!localIcon) {
    if (r.name.includes("沙拉")) localIcon = "assets/item_sprites/60px-Bag_原味沙拉_Pokopia_Sprite.png";
    else if (r.name.includes("冰沙")) localIcon = "assets/item_sprites/60px-Bag_蘋野冰沙_Pokopia_Sprite.png";
    else if (r.name.includes("麵包")) localIcon = "assets/item_sprites/60px-Bag_原味麵包_Pokopia_Sprite.png";
    else if (r.name.includes("漢堡排")) localIcon = "assets/item_sprites/60px-Bag_原味漢堡排_Pokopia_Sprite.png";
    else if (r.name.includes("湯")) localIcon = "assets/item_sprites/60px-Bag_原味湯_Pokopia_Sprite.png";
    else localIcon = "assets/item_sprites/60px-Bag_咖喱飯_Pokopia_Sprite.png";
  }
  const ingredients = parseIngredients(r.ingredientsRaw);

  // Pokemon linkage: find pokemon that like this taste or food
  const likedPkm = [];
  const tasteObj = prefDB.tastes && prefDB.tastes.find(t => t.name === r.taste);
  if (tasteObj && tasteObj.pokemon) {
    tasteObj.pokemon.forEach(pName => {
      const p = pokeMap[pName];
      if (p) {
        likedPkm.push({
          id: p.id,
          number: p.number,
          name: p.name,
          sprite: p.sprite
        });
      }
    });
  }

  return {
    id: `recipe_${String(idx + 1).padStart(3, "0")}`,
    name: r.name,
    category: r.category,
    facilityId: facilityObj.id,
    facilityName: facilityObj.name,
    facilityIcon: facilityObj.icon,
    move: r.move || facilityObj.move,
    specialty: r.specialty,
    taste: r.taste,
    ingredients,
    ingredientsText: ingredients.map(ig => `${ig.name} × ${ig.count}`).join("、 "),
    snorlaxEffect: r.effect,
    snorlaxExp: r.exp,
    icon: localIcon || r.onlineImg,
    onlineIcon: r.onlineImg,
    likedPokemon: likedPkm
  };
});

const outContent = `/**
 * Pokopia Recipe Database (100% Traditional Chinese)
 * Auto-generated from 52poke MediaWiki & Synchronized with Pokopia Pokedex
 */
var POKOPIA_RECIPES_DB = ${JSON.stringify(database, null, 2)};
if (typeof module !== "undefined" && module.exports) {
  module.exports = POKOPIA_RECIPES_DB;
}
`;

fs.writeFileSync("recipe_db.js", outContent, "utf-8");
console.log(`Successfully generated recipe_db.js with ${database.length} recipes!`);
