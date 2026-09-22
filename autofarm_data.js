/**
 * Pokopia End-Game Auto Farm Data
 * 基於 YouTube 教學「MATH PERFECT Pokopia End-Game Auto Farm (delvox)」精準整理
 * 100% 繁體中文名詞對齊、滿舒適度 22 隻寶可夢全自動產線
 */

const AUTOFARM_MODULES = [
  {
    id: "part1_berries",
    partNumber: 1,
    title: "Part 1：自動樹果採收與顏料轉換廠",
    tagline: "利用高落差自然重力收集樹果，無縫研磨為全色系三原色顏料",
    category: "樹果與染料產線",
    assignedPokemon: [
      {
        id: "pkm_s1_176",
        dexNo: "169",
        name: "幼基拉斯",
        sprite: "assets/pkm_sprites/pkm_icon_0246.webp",
        specialty: "採集・搖晃",
        role: "負責在懸崖頂部定時撞擊樹果樹，讓各色樹果受重力自然滾落至下方流水線",
        comfortRequired: "乾燥 / 粗糙 / 堅硬"
      }
    ],
    requiredItems: [
      {
        name: "顏料（紅）",
        sprite: "assets/item_sprites/60px-Bag_顏料（紅）_Pokopia_Sprite.png",
        qty: "核心產物",
        purpose: "研磨紅色樹果產出的主力鮮紅染料"
      },
      {
        name: "顏料（綠）",
        sprite: "assets/item_sprites/60px-Bag_顏料（綠）_Pokopia_Sprite.png",
        qty: "核心產物",
        purpose: "研磨綠色樹果產出的鮮綠染料"
      },
      {
        name: "顏料（藍）",
        sprite: "assets/item_sprites/60px-Bag_顏料（藍）_Pokopia_Sprite.png",
        qty: "核心產物",
        purpose: "研磨藍色樹果產出的深藍染料"
      }
    ],
    buildSteps: [
      "【地形改造】：建造高 4 格的岩石懸崖平臺，邊界設置單向滑梯水流導引槽。",
      "【樹種分佈】：在平臺邊緣密集種植覆盆果、藍橘果、黃梨果等三原色基礎果樹。",
      "【幼基拉斯工作站】：將幼基拉斯生活區劃定在懸崖邊緣，配置沙沙岩石滿足其乾燥偏好。",
      "【自動研磨槽】：底層滑道末端設置顏料研磨臼，樹果滑入即時研磨成三原色顏料並自動落入大收納箱。"
    ],
    proTips: [
      "懸崖導流滑道斜度需至少 45 度，防止果實卡在平臺邊緣縫隙。",
      "幼基拉斯活動範圍用單層柵欄限制，避免其意外跌落到底層研磨槽造成作業中斷。"
    ],
    checklist: [
      { id: "p1_1", text: "完成 4 格高懸崖與三原色果樹種植" },
      { id: "p1_2", text: "建造底層收集斜坡與導水滑道" },
      { id: "p1_3", text: "配置幼基拉斯專屬乾燥沙沙岩石工作區" },
      { id: "p1_4", text: "測試樹果掉落、研磨與收納箱入庫流程順暢" }
    ]
  },
  {
    id: "part2_clay_brick",
    partNumber: 2,
    title: "Part 2：軟糯黏土轉紅磚與寶可金屬燒製廠",
    tagline: "泥地採集與多段式流水線熔礦，全自動高溫產出建材紅磚與特殊金屬",
    category: "建材與高溫冶煉",
    assignedPokemon: [
      {
        id: "pkm_s1_122",
        dexNo: "117",
        name: "烏波（帕底亞的樣子）",
        sprite: "assets/pkm_sprites/pkm_icon_0194P.webp",
        specialty: "泥濘挖掘",
        role: "在沼澤泥地區域持續挖掘出軟塌塌黏土",
        comfortRequired: "潮濕 / 泥濘"
      },
      {
        id: "pkm_s1_245",
        dexNo: "237",
        name: "大顎蟻",
        sprite: "assets/pkm_sprites/pkm_icon_0328.webp",
        specialty: "沙地碎解",
        role: "協助壓實泥土與研磨細沙配料",
        comfortRequired: "乾燥 / 洞窟"
      },
      {
        id: "pkm_s1_237",
        dexNo: "229",
        name: "麒麟奇",
        sprite: "assets/pkm_sprites/pkm_icon_0203.webp",
        specialty: "超能力搬運",
        role: "將軟塌塌黏土高速推移至高溫窯爐區",
        comfortRequired: "開闊 / 草地"
      },
      {
        id: "pkm_s1_200",
        dexNo: "193",
        name: "小炭仔",
        sprite: "assets/pkm_sprites/pkm_icon_0837.webp",
        specialty: "高熱助燃",
        role: "在初級熔礦爐提供源源不絕的煤炭火力",
        comfortRequired: "炙熱 / 岩石"
      },
      {
        id: "pkm_s1_183",
        dexNo: "176",
        name: "煤炭龜",
        sprite: "assets/pkm_sprites/pkm_icon_0324.webp",
        specialty: "超高溫燒製",
        role: "負責金屬熔礦爐極限控溫，完成紅磚與寶可金屬成形",
        comfortRequired: "極熱 / 煙霧"
      }
    ],
    requiredItems: [
      {
        name: "軟塌塌黏土",
        sprite: "assets/item_sprites/60px-Bag_軟塌塌黏土_Pokopia_Sprite.png",
        qty: "核心原料",
        purpose: "帕底亞烏波挖掘出的主要建材黏土原料"
      },
      {
        name: "磚塊",
        sprite: "assets/item_sprites/60px-Bag_磚塊_Pokopia_Sprite.png",
        qty: "成品建材",
        purpose: "高溫窯燒硬化後的核心紅磚，終局必備建材"
      },
      {
        name: "寶可金屬礦石",
        sprite: "assets/item_sprites/60px-Bag_寶可金屬礦石_Pokopia_Sprite.png",
        qty: "高階合金",
        purpose: "金屬熔礦爐高溫燒結出的寶可金屬錠"
      }
    ],
    buildSteps: [
      "【挖掘槽建立】：將帕底亞烏波限制在下凹 1 格的泥濘池，確保出產黏土集中。",
      "【滑軌對準】：鋪設下坡石道將黏土順勢滾動至窯爐入口。",
      "【雙段爐列】：前方佈置標準熔礦爐，後方並列金屬熔礦爐，小炭仔居中提供穩定熱源。",
      "【冷卻收集】：出爐的成品紅磚與金屬沿著鐵地磚滑落至底部的收納箱。"
    ],
    proTips: [
      "小炭仔與煤炭龜需要放置「熾熱岩石」，否則長時間作業會因環境溫度不足罷工。",
      "泥濘池與窯爐區必須有半格隔板隔開，防止帕底亞烏波被高溫爐火嚇跑。"
    ],
    checklist: [
      { id: "p2_1", text: "建造帕底亞烏波專屬泥濘挖掘池" },
      { id: "p2_2", text: "配置大顎蟻與麒麟奇的動線指引通道" },
      { id: "p2_3", text: "放置標準熔礦爐與金屬熔礦爐各 2 座" },
      { id: "p2_4", text: "放置熾熱岩石並確認小炭仔與煤炭龜滿舒適度運轉" }
    ]
  },
  {
    id: "part3_water_crops",
    partNumber: 3,
    title: "Part 3：自動農作物採收供烹飪",
    tagline: "零人力水流梯田自動灌溉與沖刷收割，直達海景開放式料理臺",
    category: "食材與烹飪自動化",
    assignedPokemon: [],
    requiredItems: [
      {
        name: "小麥",
        sprite: "assets/item_sprites/60px-Bag_小麥_Pokopia_Sprite.png",
        qty: "自動作物",
        purpose: "料理不可或缺的主食原料"
      },
      {
        name: "番茄",
        sprite: "assets/item_sprites/60px-Bag_番茄_Pokopia_Sprite.png",
        qty: "自動作物",
        purpose: "漢堡排與高階烹飪關鍵蔬果"
      }
    ],
    buildSteps: [
      "【梯田分層】：依地勢開鑿 3 層階梯狀水田，每層寬度 3 格、長度 8 格。",
      "【水流循環控制】：最頂端設置水源切換閘門，定時放水沖刷已熟成的小麥與番茄。",
      "【無損濾網槽】：底端流水匯聚點設置石製格柵，作物被阻擋浮在水槽，隨手即可一鍵拾取。",
      "【開放式海邊廚房】：緊鄰收割水槽建立廚房，擺設冰箱、平底鍋與料理長椅，實現現採現煮。"
    ],
    proTips: [
      "本區全由純機械幾何與水流動力驅動，不需消耗任何寶可夢名額，極致節省全島 22 隻額度！",
      "水田坡度必須嚴格維持每 4 格下降 1 格，太陡會沖走種子，太平緩作物會滯留水中央。"
    ],
    checklist: [
      { id: "p3_1", text: "完成 3 層階梯式水田挖掘與水道鋪設" },
      { id: "p3_2", text: "種植小麥與番茄並驗證放水沖刷機制" },
      { id: "p3_3", text: "底端設置格柵收集槽，確保作物 100% 不外溢" },
      { id: "p3_4", text: "搭建海景廚房，配置冰箱與平底鍋烹飪區" }
    ]
  },
  {
    id: "part4_lumber",
    partNumber: 4,
    title: "Part 4：全自動木材伐木工廠",
    tagline: "雙斧戰龍超高效率伐木，夜巡靈全天候無休自動聚攏樹枝木料",
    category: "木材與燃料工廠",
    assignedPokemon: [
      {
        id: "pkm_s1_76",
        dexNo: "073",
        name: "雙斧戰龍",
        sprite: "assets/pkm_sprites/pkm_icon_0612.webp",
        specialty: "強力斬擊・破壞",
        role: "核心主砍手，瞬間砍伐高聳大樹",
        comfortRequired: "銳利 / 堅硬 / 戰鬥"
      },
      {
        id: "pkm_s1_74",
        dexNo: "071",
        name: "牙牙",
        sprite: "assets/pkm_sprites/pkm_icon_0610.webp",
        specialty: "削切・細部處理",
        role: "副砍手兼幼株修剪，確保樹林快速再生",
        comfortRequired: "銳利 / 洞窟"
      },
      {
        id: "pkm_s1_250",
        dexNo: "242",
        name: "夜巡靈",
        sprite: "assets/pkm_sprites/pkm_icon_0355.webp",
        specialty: "穿透・陰影搬運",
        role: "負責在樹林中穿梭，將掉落的圓木與樹枝搬運集中至出料口",
        comfortRequired: "幽暗 / 墓地 / 靜謐"
      }
    ],
    requiredItems: [
      {
        name: "木材",
        sprite: "assets/item_sprites/60px-Bag_木材_Pokopia_Sprite.png",
        qty: "大量產出",
        purpose: "家具與大型建築的主力材料"
      },
      {
        name: "結實的樹枝",
        sprite: "assets/item_sprites/60px-Bag_結實的樹枝_Pokopia_Sprite.png",
        qty: "大量產出",
        purpose: "各類工具與精細零件製作原料"
      }
    ],
    buildSteps: [
      "【林地劃定】：用雙層木圍欄圍出 12x12 格的密林培育區，預留 2 格防逃脫玄關門。",
      "【再生樹坑】：以間隔 2 格的棋盤狀挖出種植坑，確保大樹長成時不互相卡住碰撞箱。",
      "【夜巡靈陰影通道】：在林地周圍種植遮光常綠樹，營造幽暗微光，讓夜巡靈保持最高工作效率。",
      "【出料斜坡】：工廠東側設置傾斜漏斗，夜巡靈丟出的木材直接順坡滾入大收納箱。"
    ],
    proTips: [
      "雙斧戰龍揮斧範圍極大，必須在林地邊緣留出 1 格緩衝走道，防止其攻擊破壞外圍圍欄！",
      "務必配置沙包與拳擊機，否則雙斧戰龍會因精力無法宣洩而停滯發呆。"
    ],
    checklist: [
      { id: "p4_1", text: "圍建 12x12 密林培育區並設置防逃雙門" },
      { id: "p4_2", text: "完成棋盤式樹坑挖掘並播種快速生長喬木" },
      { id: "p4_3", text: "配置拳擊機與沙包，確認雙斧戰龍滿舒適度" },
      { id: "p4_4", text: "佈置夜巡靈幽暗走道與外側木材滾落收納槽" }
    ]
  },
  {
    id: "part5_stone_houses",
    partNumber: 5,
    title: "Part 5：6 大原生掉落物石屋群",
    tagline: "全島核心寶可夢聚集地！微氣候精準控制，24 小時滿舒適度穩定產出稀有素材",
    category: "稀有掉落物石屋工廠",
    assignedPokemon: [
      {
        id: "pkm_s1_283",
        dexNo: "275",
        name: "護城龍",
        sprite: "assets/pkm_sprites/pkm_icon_0411.webp",
        specialty: "堅固外殼・石材採掘",
        role: "掉落【堅硬化石與石材】，負責重型礦石石屋",
        comfortRequired: "岩石 / 古老 / 堅硬"
      },
      {
        id: "pkm_s1_115",
        dexNo: "110",
        name: "阿利多斯",
        sprite: "assets/pkm_sprites/pkm_icon_0168.webp",
        specialty: "吐絲・編織",
        role: "掉落【強韌絲線】，負責纖維石屋",
        comfortRequired: "昏暗 / 尖尖的 / 森林"
      },
      {
        id: "pkm_s1_57",
        dexNo: "056",
        name: "夢歌仙人掌",
        sprite: "assets/pkm_sprites/pkm_icon_0332.webp",
        specialty: "乾燥針刺・散播",
        role: "掉落【尖刺棘皮與結實樹枝】，負責荒野石屋",
        comfortRequired: "乾燥 / 尖尖的 / 豪華 / 閃亮亮"
      },
      {
        id: "pkm_s1_116",
        dexNo: "111",
        name: "咩利羊",
        sprite: "assets/pkm_sprites/pkm_icon_0179.webp",
        specialty: "靜電・蓄毛",
        role: "掉落【蓬鬆羊毛與綿花】，負責牧場石屋",
        comfortRequired: "溫暖 / 草原 / 蓬鬆"
      },
      {
        id: "pkm_s1_3",
        dexNo: "003",
        name: "妙蛙花",
        sprite: "assets/pkm_sprites/pkm_icon_0003.webp",
        specialty: "花香・大自然滋養",
        role: "掉落【大朵花瓣與芳香種子】，負責花園石屋",
        comfortRequired: "潮濕 / 陽光 / 巨大花朵"
      },
      {
        id: "pkm_s1_58",
        dexNo: "057",
        name: "三蜜蜂",
        sprite: "assets/pkm_sprites/pkm_icon_0415F.webp",
        specialty: "採蜜・糖漿",
        role: "掉落【甜甜蜜與蜂蠟】，負責蜜源石屋",
        comfortRequired: "甜味 / 花叢 / 蜂巢"
      },
      {
        id: "pkm_s1_141",
        dexNo: "136",
        name: "泡沫栗鼠",
        sprite: "assets/pkm_sprites/pkm_icon_0572.webp",
        specialty: "掃帚尾巴・清潔",
        role: "【全屋整潔守護者】在 6 間石屋間巡邏清掃並聚攏素材",
        comfortRequired: "乾淨 / 豪華 / 漂亮"
      }
    ],
    requiredItems: [
      {
        name: "甜甜蜜",
        sprite: "assets/item_sprites/60px-Bag_甜甜蜜_Pokopia_Sprite.png",
        qty: "石屋 6 產出",
        purpose: "三蜜蜂出產的高級甜味料理原料"
      },
      {
        name: "線團",
        sprite: "assets/item_sprites/60px-Bag_線團_Pokopia_Sprite.png",
        qty: "石屋 2 產出",
        purpose: "阿利多斯吐絲編織的強韌纖維絲線"
      },
      {
        name: "飛翼化石（頭）",
        sprite: "assets/item_sprites/60px-Bag_飛翼化石（頭）_Pokopia_Sprite.png",
        qty: "石屋 1 產出",
        purpose: "護城龍掉落的稀有重型古老石材化石"
      },
      {
        name: "棉花",
        sprite: "assets/item_sprites/60px-Bag_棉花_Pokopia_Sprite.png",
        qty: "石屋 4 產出",
        purpose: "咩利羊掉落的蓬鬆綿花與羊毛材料"
      },
      {
        name: "可愛的花",
        sprite: "assets/item_sprites/60px-Bag_可愛的花_Pokopia_Sprite.png",
        qty: "石屋 5 產出",
        purpose: "妙蛙花自然培育的大朵芬芳花瓣素材"
      },
      {
        name: "結實的樹枝",
        sprite: "assets/item_sprites/60px-Bag_結實的樹枝_Pokopia_Sprite.png",
        qty: "石屋 3 產出",
        purpose: "夢歌仙人掌掉落的結實乾燥尖刺樹枝"
      }
    ],
    buildSteps: [
      "【6 聯排地基劃分】：整平一條 24 格長的地面，依序建置 6 間 4x4 的石頭小屋，正面全部朝向中央走道。",
      "【環境微氣候調校】：",
      "  ・石屋 1（護城龍）：鋪設岩石地板、放置石長椅與重型礦石。",
      "  ・石屋 2（阿利多斯）：屋角放置加濕器與尖刺裝飾，營造潮濕陰翳蛛巢。",
      "  ・石屋 3（夢歌仙人掌）：鋪設沙地、放置沙沙岩石與豪華沙發，滿足乾燥與閃亮喜好。",
      "  ・石屋 4（咩利羊）：鋪設乾草與羊毛地毯，溫暖舒適。",
      "  ・石屋 5（妙蛙花）：安裝加濕器，周邊種滿多色花朵，維持濕潤花香。",
      "  ・石屋 6（三蜜蜂）：掛置蜜蜂巢箱與花叢。",
      "【泡沫栗鼠清掃廊道】：在 6 間石屋門口貫通一條滑道，泡沫栗鼠會一路將各屋掉落物掃向最右側的大收納箱！"
    ],
    proTips: [
      "【正名注意】：本區荒野仙人掌為「夢歌仙人掌（Cacturne, No.056）」，其喜好包含乾燥、尖尖的、豪華與閃亮亮，千萬不要裝加濕器！",
      "妙蛙花體型極大，其石屋門口寬度至少需留 2 格，避免它卡在門框無法轉身掉落素材。"
    ],
    checklist: [
      { id: "p5_1", text: "建造 6 座 4x4 石頭小屋骨架與走廊" },
      { id: "p5_2", text: "為妙蛙花與阿利多斯房間安裝加濕器" },
      { id: "p5_3", text: "為夢歌仙人掌房間鋪設乾燥沙地並放置豪華沙發" },
      { id: "p5_4", text: "為護城龍放置石長椅、咩利羊放置乾草墊" },
      { id: "p5_5", text: "配置泡沫栗鼠與收集滑道，確認 6 大掉落物自動集中" }
    ]
  },
  {
    id: "part6_iron_smelting",
    partNumber: 6,
    title: "Part 6：鐵礦與鐵錠自動冶煉廠",
    tagline: "深層岩層裂解鐵礦石，豪力全力搬運、小火龍與大炭車無間斷冶煉純鐵錠",
    category: "金屬冶煉核心",
    assignedPokemon: [
      {
        id: "pkm_s1_211",
        dexNo: "203",
        name: "晶光芽",
        sprite: "assets/pkm_sprites/pkm_icon_0969.webp",
        specialty: "亂撒",
        role: "在專屬暗室中滿舒適度持續亂撒（Litter）掉落鐵礦石原料",
        comfortRequired: "石製的 / 堅硬的 / 垃圾 / 閃亮亮的"
      },
      {
        id: "pkm_s1_212",
        dexNo: "204",
        name: "晶光花",
        sprite: "assets/pkm_sprites/pkm_icon_0970.webp",
        specialty: "亂撒",
        role: "在專屬暗室中雙倍產能穩定亂撒（Litter）產出鐵礦石",
        comfortRequired: "石製的 / 堅硬的 / 垃圾 / 閃亮亮的"
      },
      {
        id: "pkm_s1_164",
        dexNo: "157",
        name: "豪力",
        sprite: "assets/pkm_sprites/pkm_icon_0067.webp",
        specialty: "極限怪力・裝載",
        role: "將重型鐵礦石整筐搬運送上高溫傳送帶",
        comfortRequired: "健身 / 力量 / 挑戰"
      },
      {
        id: "pkm_s1_201",
        dexNo: "194",
        name: "大炭車",
        sprite: "assets/pkm_sprites/pkm_icon_0838.webp",
        specialty: "煤礦火車・超高熱旋轉",
        role: "維持連續冶煉爐 1200 度超臨界高溫",
        comfortRequired: "極熱 / 軌道 / 煤炭"
      },
      {
        id: "pkm_s1_4",
        dexNo: "004",
        name: "小火龍",
        sprite: "assets/pkm_sprites/pkm_icon_0004.webp",
        specialty: "精確火焰控溫",
        role: "在冷卻出料口補火精修，確保鐵錠無瑕疵成形",
        comfortRequired: "溫暖 / 火焰 / 高地"
      }
    ],
    requiredItems: [
      {
        name: "鐵礦石",
        sprite: "assets/item_sprites/60px-Bag_鐵礦石_Pokopia_Sprite.png",
        qty: "深層開採",
        purpose: "晶光芽與晶光花暗室持續亂撒掉落的粗鐵礦原料"
      },
      {
        name: "純鐵錠",
        sprite: "assets/item_sprites/60px-Bag_鐵_Pokopia_Sprite.png",
        qty: "連續冶煉",
        purpose: "金屬熔礦爐高熱冶煉出爐的純鐵錠成品"
      },
      {
        name: "寶可金屬礦石",
        sprite: "assets/item_sprites/60px-Bag_寶可金屬礦石_Pokopia_Sprite.png",
        qty: "高熱燒製",
        purpose: "夢境島採礦後送入高溫爐冶煉的珍稀金屬"
      }
    ],
    buildSteps: [
      "【專屬暗室開採區】：在深處建造封閉無光照的暗室，分別安置晶光芽與晶光花，房內配置石長椅、垃圾桶與垃圾袋滿足其舒適度。",
      "【豪力搬運通道】：建立一條平直的 2 格寬走廊，將採礦暗室與金屬熔礦爐直接貫通。",
      "【三連金屬爐陣列】：並列放置 3 座金屬熔礦爐，大炭車於背後軌道不斷來回燃燒提供熱力。",
      "【精修冷卻臺】：小火龍守在下料口，完成鐵錠最後冷卻定型並自動推入收納鐵箱。"
    ],
    proTips: [
      "【正名核心】：全島唯一能持續掉落鐵礦石的開採手為「晶光芽（No.203）」與「晶光花（No.204）」，特長為【亂撒（Litter）】且喜好黑暗與垃圾，房內務必放置垃圾桶與石長椅！",
      "豪力需要充足的休閒空間，在通道旁放置大型遊戲機或鐵長椅，可徹底消除怠工問題。",
      "大炭車的活動路徑需鋪設平整石板或鐵磚，避免因高低差脫軌卡在熔爐角落。"
    ],
    checklist: [
      { id: "p6_1", text: "建造封閉暗室並配置晶光芽、晶光花與垃圾桶" },
      { id: "p6_2", text: "鋪設豪力平直搬運走廊並放置大型遊戲機" },
      { id: "p6_3", text: "搭建 3 連金屬熔礦爐與大炭車燃燒槽" },
      { id: "p6_4", text: "配置小火龍出料定型站與成品鐵箱驗收" }
    ]
  },
  {
    id: "part7_poke_center",
    partNumber: 7,
    title: "Part 7：寶可夢中心交易設施",
    tagline: "全島第 22 隻壓軸擔當！頂級門面、商品結算、全自動售貨與遊客招待",
    category: "商業交易與核心門面",
    assignedPokemon: [
      {
        id: "pkm_s1_288",
        dexNo: "280",
        name: "伊布",
        sprite: "assets/pkm_sprites/pkm_icon_0133.webp",
        specialty: "親切接待・靈動結算",
        role: "【終局農場首席看板娘】擔任寶可夢中心櫃檯店長，自動進行資源打包與遊客貿易",
        comfortRequired: "可愛 / 溫馨 / 繁榮 / 豪華"
      }
    ],
    requiredItems: [
      {
        name: "金金徽章",
        sprite: "assets/item_sprites/Bag_金金徽章_Pokopia_Sprite.png",
        qty: "全島總結算",
        purpose: "全自動資源貿易結算與繁榮度金幣收益"
      }
    ],
    buildSteps: [
      "【中心地標選址】：坐落於全島入口樞紐，鋪設紅色地毯與高級瓷磚地板。",
      "【收銀服務櫃檯】：搭建 L 型大理石櫃檯，正中央端正擺放收銀機、讀卡機與筆筒。",
      "【伊布專屬店長席】：櫃檯後方擺放柔軟豪華座墊，讓伊布以 100% 滿舒適度常駐迎賓。",
      "【展示貨架】：兩側陳列前方 6 大模組出產的紅磚、純鐵錠、高級顏料、布料與料理，形成繁榮自給自足經濟圈！"
    ],
    proTips: [
      "伊布非常注重環境美感，周圍多擺放花卉盆栽或小型玩偶，其工作幸福感會直接拉滿。",
      "此處恰好補齊全島上限第 22 隻寶可夢，標誌著終局農場的完美大成！"
    ],
    checklist: [
      { id: "p7_1", text: "在全島樞紐處建造寶可夢中心大廳與紅地毯" },
      { id: "p7_2", text: "設置 L 型收銀櫃檯，擺放收銀機與讀卡機" },
      { id: "p7_3", text: "配置風車、豪華沙發與伊布專屬店長座席" },
      { id: "p7_4", text: "迎入全島第 22 隻寶可夢伊布，完成終局農場大團圓！" }
    ]
  }
];

// 全農場 22 隻作業寶可夢匯總（方便總覽統計）
const AUTOFARM_POKEMON_SUMMARY = [
  { part: 1, id: "pkm_s1_176", dexNo: "169", name: "幼基拉斯", role: "樹果撞擊採集" },
  { part: 2, id: "pkm_s1_122", dexNo: "117", name: "烏波（帕底亞的樣子）", role: "軟糯黏土挖掘" },
  { part: 2, id: "pkm_s1_245", dexNo: "237", name: "大顎蟻", role: "細沙研磨" },
  { part: 2, id: "pkm_s1_237", dexNo: "229", name: "麒麟奇", role: "原料超能推移" },
  { part: 2, id: "pkm_s1_200", dexNo: "193", name: "小炭仔", role: "初級高熱助燃" },
  { part: 2, id: "pkm_s1_183", dexNo: "176", name: "煤炭龜", role: "紅磚合金燒製" },
  { part: 4, id: "pkm_s1_76", dexNo: "073", name: "雙斧戰龍", role: "強力主伐木手" },
  { part: 4, id: "pkm_s1_74", dexNo: "071", name: "牙牙", role: "細部修剪伐木" },
  { part: 4, id: "pkm_s1_250", dexNo: "242", name: "夜巡靈", role: "穿透陰影木材搬運" },
  { part: 5, id: "pkm_s1_283", dexNo: "275", name: "護城龍", role: "石屋 1：堅硬石材化石" },
  { part: 5, id: "pkm_s1_115", dexNo: "110", name: "阿利多斯", role: "石屋 2：強韌絲線" },
  { part: 5, id: "pkm_s1_57", dexNo: "056", name: "夢歌仙人掌", role: "石屋 3：尖刺與結實樹枝" },
  { part: 5, id: "pkm_s1_116", dexNo: "111", name: "咩利羊", role: "石屋 4：蓬鬆羊毛綿花" },
  { part: 5, id: "pkm_s1_3", dexNo: "003", name: "妙蛙花", role: "石屋 5：大花瓣與芳香種子" },
  { part: 5, id: "pkm_s1_58", dexNo: "057", name: "三蜜蜂", role: "石屋 6：甜甜蜜與蜂蠟" },
  { part: 5, id: "pkm_s1_141", dexNo: "136", name: "泡沫栗鼠", role: "6 屋巡邏打掃素材聚攏" },
  { part: 6, id: "pkm_s1_211", dexNo: "203", name: "晶光芽", role: "專屬暗室亂撒掉落鐵礦" },
  { part: 6, id: "pkm_s1_212", dexNo: "204", name: "晶光花", role: "加倍產能穩定亂撒鐵礦" },
  { part: 6, id: "pkm_s1_164", dexNo: "157", name: "豪力", role: "怪力裝載送爐" },
  { part: 6, id: "pkm_s1_201", dexNo: "194", name: "大炭車", role: "1200度超臨界高溫" },
  { part: 6, id: "pkm_s1_4", dexNo: "004", name: "小火龍", role: "出料補火冷卻定型" },
  { part: 7, id: "pkm_s1_288", dexNo: "280", name: "伊布", role: "寶可夢中心店長與結算" }
];

if (typeof window !== "undefined") {
  window.AUTOFARM_MODULES = AUTOFARM_MODULES;
  window.AUTOFARM_POKEMON_SUMMARY = AUTOFARM_POKEMON_SUMMARY;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { AUTOFARM_MODULES, AUTOFARM_POKEMON_SUMMARY };
}

