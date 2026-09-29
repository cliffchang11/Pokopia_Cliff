// region_data.js
// Pokopia 5 大世界區域與地圖連通結構資料庫

window.POKOPIA_REGION_DATA = {
  // 樞紐總覽連通關係導航指南
  hubGuidance: {
    title: "Pokopia 四大閘門走向口訣",
    centerName: "空空鎮（Palette Town）",
    centerDesc: "百變怪的自由夢想城鎮 ‧ 所有冒險與資源流轉的中央大本營",
    directions: [
      {
        direction: "北向高空",
        arrow: "⬆️",
        targetId: "sparkling_skylands",
        targetName: "亮晶晶空島",
        gateTip: "最上面的閘門就是去空島！",
        tag: "浮空城 ‧ 重建百貨"
      },
      {
        direction: "東向海岸",
        arrow: "➡️",
        targetId: "bleak_beach",
        targetName: "暗沉沉海邊",
        gateTip: "沿著中央出發的大街一路向東直達海邊！",
        tag: "聖安奴號 ‧ 深海蓋歐卡"
      },
      {
        direction: "西向山陵",
        arrow: "⬅️",
        targetId: "rocky_ridges",
        targetName: "凸隆隆山地",
        gateTip: "穿過西側岩石區閘門深入險峻山脈！",
        tag: "深灰礦山 ‧ 煉鐵採礦"
      },
      {
        direction: "南向荒原",
        arrow: "⬇️",
        targetId: "withered_wastelands",
        targetName: "乾巴巴荒野",
        gateTip: "順著南方的風沙古道閘門通往廣袤荒原！",
        tag: "長期乾旱 ‧ 祈雨復甦"
      }
    ]
  },

  // 5 大區域詳細資訊
  regions: [
    {
      id: "palette_town",
      name: "空空鎮",
      nameEn: "Palette Town",
      kantoOrigin: "關都「真新鎮」（Pallet Town）歷史遺跡",
      themeColor: "#10b981",
      badgeText: "中央大本營",
      mapImage: "assets/maps/map_all.jpg",
      highlightTitle: "🏡 自由打造的度假大本營 ‧ 連通四方閘門樞紐",
      story: "作為冒險的起點與中央大本營，供百變怪隨心所欲自由拓荒打造。四通八達通往各大區域的閘門，也是吸引而來的夥伴寶可夢們安居樂業的核心度假城鎮。",
      mission: "自由建設理想小鎮、佈置棲息地以吸引寶可夢、建立各項農林生產與加工設施。",
      keyLandmarks: [
        "中央探險基地營",
        "北通空島雲端天梯閘門",
        "東通海邊繁華大街閘門",
        "西通山地礦岩閘門",
        "南通荒野沙塵閘門"
      ],
      defaultPokemonIds: ["pkm_s1_132", "pkm_s1_143", "pkm_s1_25", "pkm_s1_1", "pkm_s1_4", "pkm_s1_7"]
    },
    {
      id: "withered_wastelands",
      name: "乾巴巴荒野",
      nameEn: "Withered Wastelands",
      kantoOrigin: "對應關都過去的「淺紅市」（Fuchsia City）及周邊乾涸海岸",
      themeColor: "#f59e0b",
      badgeText: "南方荒原",
      mapImage: "assets/maps/map_wastelands.jpg",
      highlightTitle: "🏜️ 烈日風沙瀰漫 ‧ 喚醒久違的甘霖降雨",
      story: "昔日綠意盎然的淺紅市周邊因環境異變陷入長期乾旱，如今已化為烈日炙烤、風沙滾滾的戈壁荒漠。地表遍佈風化岩層與枯萎植被，渴望著滋潤生命的大雨。",
      mission: "探索荒漠深處遺跡，設法讓長期乾旱的這裡重新降雨，滋養荒蕪的大地以復興原野生態。",
      keyLandmarks: [
        "淺紅市遺跡枯岩群",
        "古代祈雨祭壇",
        "乾涸鹽湖與沙丘",
        "仙人掌與荒野耐旱生態區"
      ],
      defaultPokemonIds: ["pkm_s1_166", "pkm_s1_304", "pkm_s1_95", "pkm_s1_56", "pkm_s1_204"]
    },
    {
      id: "bleak_beach",
      name: "暗沉沉海邊",
      nameEn: "Bleak Beach",
      kantoOrigin: "對應關都過去的「枯葉市」（Vermilion City）與傳奇豪華郵輪「聖安奴號」",
      themeColor: "#0ea5e9",
      badgeText: "東向海岸",
      mapImage: "assets/maps/map_beach.jpg",
      extraImage: "assets/maps/map_kyogre.jpg",
      highlightTitle: "🌊 永夜籠罩的迷霧海岸 ‧ 聖安奴號與深海蓋歐卡傳說",
      story: "曾經繁華停靠各國客輪的枯葉港口，如今常年處於幽暗的永夜之中。海浪拍打著孤寂的礁石，昔日奢華的巨輪「聖安奴號」靜靜停泊於港灣迷霧裡。傳聞變身為拉普拉斯深入外海深處，將能邂逅引動暴風雨的傳說寶可夢「蓋歐卡」。",
      mission: "驅散籠罩海港的濃霧與幽暗，為海灘重新找回光明；出海探索沉船與深海祕境。",
      keyLandmarks: [
        "枯葉港與幽暗碼頭",
        "傳奇豪華郵輪「聖安奴號」殘存甲板",
        "幽靈與水系出沒的礁石洞窟",
        "外海深邃水域（變身拉普拉斯可遇見蓋歐卡）"
      ],
      defaultPokemonIds: ["pkm_s1_7", "pkm_s1_131", "pkm_s1_94", "pkm_s1_117", "pkm_s1_382"]
    },
    {
      id: "rocky_ridges",
      name: "凸隆隆山地",
      nameEn: "Rocky Ridges",
      kantoOrigin: "對應關都過去的「深灰市」（Pewter City）與神秘洞窟「月見山」（Mt. Moon）",
      themeColor: "#8b5cf6",
      badgeText: "西向山陵",
      mapImage: "assets/maps/map_ridges.jpg",
      highlightTitle: "⛰️ 險峻礦脈與月見山遺址 ‧ 採礦煉鐵與重啟博物館",
      story: "以堅硬岩石著稱的深灰市與富含隕石礦藏的月見山交織而成的高聳山地。山體內部深掘著四通八達的地下礦山，這裡聚焦於開採珍貴礦石、金屬錠與煉鐵工業，昔日著名的深灰科學博物館也在此沉睡等待重啟。",
      mission: "深入地下坑道開採礦物、收集煉鐵金屬原料；復原深灰科學博物館中的古代化石。",
      keyLandmarks: [
        "深灰科學博物館遺址",
        "月見山隕石坑與礦石斷崖",
        "深掘地下高溫採礦場與鍛造爐",
        "地下化石岩層發掘點"
      ],
      defaultPokemonIds: ["pkm_s1_4", "pkm_s1_95", "pkm_s1_246", "pkm_s1_41", "pkm_s1_306"]
    },
    {
      id: "sparkling_skylands",
      name: "亮晶晶空島",
      nameEn: "Sparkling Skylands",
      kantoOrigin: "對應關都過去的「玉虹市」（Celadon City）與「金黃市」（Saffron City）",
      themeColor: "#ec4899",
      badgeText: "北向空島",
      mapImage: "assets/maps/map_skylands.jpg",
      highlightTitle: "☁️ 升空漂浮的雲端都市 ‧ 齊心重建玉虹百貨公司",
      story: "因昔日未知的大地災難，原本坐落於關都心臟地帶的兩大都會——玉虹市與金黃市整塊地層升空，成為漂浮於高空的壯麗空島。彩虹與雲海環繞著破碎的都會摩天樓遺跡，玩家的重要使命是讓昔日最繁華的購物聖殿「玉虹百貨公司」在天際重現榮景！",
      mission: "搭建雲端橋樑穿梭空島群，收集高級物資重建「玉虹百貨公司」，復興天空繁華商業都市。",
      keyLandmarks: [
        "升空玉虹百貨公司重建地基",
        "金黃市電磁塔與超能力空島遺跡",
        "高空氣流滑翔軌道與彩虹瀑布",
        "天際雲海觀景台"
      ],
      defaultPokemonIds: ["pkm_s1_18", "pkm_s1_181", "pkm_s1_468", "pkm_s1_479", "pkm_s1_149"]
    }
  ]
};
