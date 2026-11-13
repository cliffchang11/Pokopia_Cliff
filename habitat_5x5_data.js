/**
 * Pokopia - FancyCharmander 5x5 專屬棲息地 Shorts 資料庫 (極速 O(1) 字典快取版)
 * 來源: https://www.youtube.com/@FancyCharmander/shorts
 * 說明: 將 FancyCharmander 頻道 5x5 棲息地 Shorts 對應至進化鏈家族寶可夢
 */
(function (global) {
  'use strict';

  // 47 組專屬 5x5 Shorts 原始資料 (排除非棲息地的 2 Types 挑戰)
  const SHORTS_CATALOG = [
    { vid: "zioVEGctqY4", title: "索財靈 & 賽富豪", family: ["Gimmighoul", "Gholdengo", "索財靈", "賽富豪"] },
    { vid: "ZKx2SHzPhy0", title: "水躍魚 / 沼躍魚 / 巨沼怪", family: ["Mudkip", "Marshtomp", "Swampert", "水躍魚", "沼躍魚", "巨沼怪"] },
    { vid: "1gSZUCo_Xlc", title: "小鋸鱷 / 藍鱷 / 大力鱷", family: ["Totodile", "Croconaw", "Feraligatr", "小鋸鱷", "藍鱷", "大力鱷"] },
    { vid: "SQnAqmR0AdA", title: "鯉魚王 & 暴鯉龍", family: ["Magikarp", "Gyarados", "鯉魚王", "暴鯉龍"] },
    { vid: "oGV8X5iR-E0", title: "小磁怪 / 三合一磁怪 / 自爆磁怪", family: ["Magnemite", "Magneton", "Magnezone", "小磁怪", "三合一磁怪", "自爆磁怪"] },
    { vid: "rvZ9vxt-Siw", title: "夜巡靈 / 彷徨夜靈 / 黑夜魔靈", family: ["Duskull", "Dusclops", "Dusknoir", "夜巡靈", "彷徨夜靈", "黑夜魔靈"] },
    { vid: "MXrIzh-ku6U", title: "鬼斯 / 鬼斯通 / 耿鬼", family: ["Gastly", "Haunter", "Gengar", "鬼斯", "鬼斯通", "耿鬼"] },
    { vid: "Vc5Sb0UvT30", title: "南瓜精 & 特大南瓜怪人", family: ["Pumpkaboo", "Gourgeist", "南瓜精", "南瓜怪人"] },
    { vid: "C9vCM9n5H2E", title: "喵喵 / 貓老大", family: ["Meowth", "Persian", "喵喵", "貓老大"] },
    { vid: "DPekJbXQJ3c", title: "泥泥鰍 / 鯰魚王", family: ["Barboach", "Whiscash", "泥泥鰍", "鯰魚王"] },
    { vid: "DVXs_OKuRy8", title: "索羅亞 / 索羅亞克", family: ["Zorua", "Zoroark", "索羅亞", "索羅亞克"] },
    { vid: "lIiD6JZN_zk", title: "海星星 / 寶石海星", family: ["Staryu", "Starmie", "海星星", "寶石海星"] },
    { vid: "qsCOKDI6LYA", title: "球球海獅 / 花漾海獅 / 西獅海壬", family: ["Popplio", "Brionne", "Primarina", "球球海獅", "花漾海獅", "西獅海壬"] },
    { vid: "kJcRI66yqs4", title: "輕飄飄 / 胖嘟嘟", family: ["Frillish", "Jellicent", "輕飄飄", "胖嘟嘟"] },
    { vid: "0Ne_Qw1mZD0", title: "醜醜魚 / 美納斯", family: ["Feebas", "Milotic", "醜醜魚", "美納斯"] },
    { vid: "xfuGew3UZfc", title: "泳圈鼬 / 浮潛鼬", family: ["Buizel", "Floatzel", "泳圈鼬", "浮潛鼬"] },
    { vid: "xSvz5rTSIEU", title: "烏波 / 土王 / 沼王", family: ["Wooper", "Quagsire", "Clodsire", "烏波", "沼王", "土王"] },
    { vid: "f3ko7c4q8lE", title: "小炭仔 / 大炭車 / 巨炭山", family: ["Rolycoly", "Carkol", "Coalossal", "小炭仔", "大炭車", "巨炭山"] },
    { vid: "tzcSz4LvEPY", title: "三蜜蜂 / 蜂女王", family: ["Combee", "Vespiquen", "三蜜蜂", "蜂女王"] },
    { vid: "d4nH2cl_H7A", title: "稚山雀 / 藍鴉 / 鋼鎧鴉", family: ["Rookidee", "Corvisquire", "Corviknight", "稚山雀", "藍鴉", "鋼鎧鴉"] },
    { vid: "AmmniuL8cgQ", title: "卡拉卡拉 / 嘎啦嘎啦", family: ["Cubone", "Marowak", "卡拉卡拉", "嘎啦嘎啦"] },
    { vid: "n8Qw95vWUU0", title: "鐵啞鈴 / 金屬怪 / 巨金怪", family: ["Beldum", "Metang", "Metagross", "鐵啞鈴", "金屬怪", "巨金怪"] },
    { vid: "5TEOvaeonCI", title: "咕咕 / 貓頭夜鷹", family: ["Hoothoot", "Noctowl", "咕咕", "貓頭夜鷹"] },
    { vid: "81u17bs_cMo", title: "基拉祈", family: ["Jirachi", "基拉祈"] },
    { vid: "p2s3lBDRxQM", title: "炎兔兒 / 騰蹴小將 / 閃焰王牌", family: ["Scorbunny", "Raboot", "Cinderace", "炎兔兒", "騰蹴小將", "閃焰王牌"] },
    { vid: "PMa5GV1s5v0", title: "化石翼龍", family: ["Aerodactyl", "化石翼龍"] },
    { vid: "vsF7aipeRBo", title: "冰雪龍 / 冰雪巨龍", family: ["Amaura", "Aurorus", "冰雪龍", "冰雪巨龍"] },
    { vid: "Pe5EWfL2GkI", title: "頭蓋龍 / 戰槌龍", family: ["Cranidos", "Rampardos", "頭蓋龍", "戰槌龍"] },
    { vid: "IPXiUkU4r7s", title: "盾甲龍 / 護城龍", family: ["Shieldon", "Bastiodon", "盾甲龍", "護城龍"] },
    { vid: "gQZaPpiQLWs", title: "火稚雞 / 力壯雞 / 火焰雞", family: ["Torchic", "Combusken", "Blaziken", "火稚雞", "力壯雞", "火焰雞"] },
    { vid: "5qcyNW77WOI", title: "寶寶暴龍 / 怪顎龍", family: ["Tyrunt", "Tyrantrum", "寶寶暴龍", "怪顎龍"] },
    { vid: "i66r9tV1Gkg", title: "波加曼 / 波皇子 / 帝王拿波", family: ["Piplup", "Prinplup", "Empoleon", "波加曼", "波皇子", "帝王拿波"] },
    { vid: "QdrHmnuvnrs", title: "雷公 / 炎帝 / 水君", family: ["Raikou", "Entei", "Suicune", "雷公", "炎帝", "水君"] },
    { vid: "2a54Xh5eXdg", title: "皮丘 / 皮卡丘 / 雷丘", family: ["Pichu", "Pikachu", "Raichu", "皮丘", "皮卡丘", "雷丘"] },
    { vid: "FGHjK1Bb9mA", title: "破破袋 / 灰塵山", family: ["Trubbish", "Garbodor", "破破袋", "灰塵山"] },
    { vid: "6IgvwoikYXo", title: "毽子草 / 毽子花 / 毽子棉", family: ["Hoppip", "Skiploom", "Jumpluff", "毽子草", "毽子花", "毽子棉"] },
    { vid: "Cw8JwD1Kt2g", title: "洛托姆", family: ["Rotom", "洛托姆"] },
    { vid: "LmtXno1qp9c", title: "毒電嬰 / 顫弦蠑螈", family: ["Toxel", "Toxtricity", "毒電嬰", "顫弦蠑螈"] },
    { vid: "clTRr1V0CFQ", title: "咩利羊 / 綿綿 / 電龍", family: ["Mareep", "Flaaffy", "Ampharos", "咩利羊", "綿綿", "電龍"] },
    { vid: "xwhwYB5mWYU", title: "臭泥 / 臭臭泥", family: ["Grimer", "Muk", "臭泥", "臭臭泥"] },
    { vid: "o2NG6MNRFhg", title: "呆呆獸 / 呆殼獸 / 呆呆王", family: ["Slowpoke", "Slowbro", "Slowking", "呆呆獸", "呆殼獸", "呆呆王"] },
    { vid: "sSL6QHW7lFo", title: "魔牆人偶 / 魔尼尼 / 踏冰人偶", family: ["Mime Jr.", "Mr. Mime", "魔尼尼", "魔牆人偶", "踏冰人偶"] },
    { vid: "9Ka6FfHV4zo", title: "波波 / 比比鳥 / 大比鳥", family: ["Pidgey", "Pidgeotto", "Pidgeot", "波波", "比比鳥", "大比鳥"] },
    { vid: "srx9ruAq1t4", title: "黏黏寶 / 黏美兒 / 黏美龍", family: ["Goomy", "Sliggoo", "Goodra", "黏黏寶", "黏美兒", "黏美龍"] },
    { vid: "WRc22MNW6Ik", title: "勾魂眼", family: ["Sableye", "勾魂眼"] },
    { vid: "LRdRiegusjs", title: "六尾 / 九尾", family: ["Vulpix", "Ninetales", "六尾", "九尾"] },
    { vid: "uGMl1sLlUcI", title: "螺釘地鼠 / 龍頭地鼠", family: ["Drilbur", "Excadrill", "螺釘地鼠", "龍頭地鼠"] }
  ];

  // 靜態常數索引字典 (O(1) 直接命中，耗時 0ms)
  const _EXACT_MAP = Object.create(null);

  // 初始化立即建好完全映射表
  (function initFastMap() {
    SHORTS_CATALOG.forEach(item => {
      const dataObj = Object.freeze({
        vid: item.vid,
        url: `https://www.youtube.com/shorts/${item.vid}`,
        title: `FancyCharmander 5x5 棲息地: ${item.title}`
      });

      item.family.forEach(keyword => {
        if (!keyword) return;
        const clean = String(keyword).toLowerCase().trim();
        _EXACT_MAP[clean] = dataObj;
      });
    });
  })();

  // 查詢特定寶可夢是否有對應的 FancyCharmander 5x5 Short (超輕量 O(1))
  function getHabitat5x5(pkm) {
    if (!pkm) return null;

    // 1. 純中文名稱匹配
    if (pkm.name) {
      const rawName = String(pkm.name).replace(/（.*?）|\(.*?\)/g, '').trim().toLowerCase();
      if (_EXACT_MAP[rawName]) return _EXACT_MAP[rawName];
    }

    // 2. 英文名稱匹配
    if (pkm.name_en) {
      const enName = String(pkm.name_en).trim().toLowerCase();
      if (_EXACT_MAP[enName]) return _EXACT_MAP[enName];
    }

    return null;
  }

  const exportObj = {
    catalog: SHORTS_CATALOG,
    getHabitat5x5: getHabitat5x5
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exportObj;
  } else {
    global.POKOPIA_HABITAT_5X5_DATA = exportObj;
  }
})(typeof window !== 'undefined' ? window : this);
