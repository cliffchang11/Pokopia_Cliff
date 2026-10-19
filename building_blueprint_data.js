// building_blueprint_data.js
// 建築藍圖專區核心資料庫：萬聖節主題暗夜洋館與南瓜馬車造景
// 參考創作者：リリィ (@__ririmero) - https://www.youtube.com/watch?v=EnLf8D-EuV0
// 所有材料正名 100% 對齊 POKOPIA_PREFERENCES_DB 與遊戲內官方繁中規範

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.POKOPIA_BLUEPRINT_DATA = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // 圖例色碼與材料定義 (100% 精準對齊 preferences_db.js)
  const MATERIAL_DEFINITIONS = {
    'S_WALL': { name: '古舊石牆', code: 'S_WALL', label: '石牆', color: '#475569', icon: 'assets/item_sprites/60px-Bag_古舊石牆_Pokopia_Sprite.png' },
    'S_BRICK': { name: '石磚牆', code: 'S_BRICK', label: '磚基', color: '#64748b', icon: 'assets/item_sprites/60px-Bag_石磚牆_Pokopia_Sprite.png' },
    'STAIR': { name: '石頭樓梯', code: 'STAIR', label: '階梯', color: '#94a3b8', icon: 'assets/item_sprites/60px-Bag_石頭樓梯_Pokopia_Sprite.png' },
    'PATH_STONE': { name: '踏板石', code: 'PATH_STONE', label: '石道', color: '#78716c', icon: 'assets/item_sprites/60px-Bag_踏板石_Pokopia_Sprite.png' },
    'CURB_LINE': { name: '圍邊磚塊（筆直）', code: 'CURB_LINE', label: '直滾邊', color: '#a8a29e', icon: 'assets/item_sprites/60px-Bag_圍邊磚塊（筆直）_Pokopia_Sprite.png' },
    'CURB_CNR': { name: '圍邊磚塊（轉角）', code: 'CURB_CNR', label: '轉角邊', color: '#d6d3d1', icon: 'assets/item_sprites/60px-Bag_圍邊磚塊（轉角）_Pokopia_Sprite.png' },
    'WOOD_LOG': { name: '直立圓木', code: 'WOOD_LOG', label: '柱子', color: '#78350f', icon: 'assets/item_sprites/60px-Bag_直立圓木_Pokopia_Sprite.png' },
    'IRON_WALL': { name: '鐵牆', code: 'IRON_WALL', label: '黑鐵牆', color: '#1e293b', icon: 'assets/item_sprites/60px-Bag_鐵牆_Pokopia_Sprite.png' },
    'DOOR': { name: '大木門', code: 'DOOR', label: '木門', color: '#b45309', icon: 'assets/item_sprites/60px-Bag_大木門_Pokopia_Sprite.png' },
    'WIN_SLIDE': { name: '上下推拉窗', code: 'WIN_SLIDE', label: '推拉窗', color: '#38bdf8', icon: 'assets/item_sprites/60px-Bag_上下推拉窗_Pokopia_Sprite.png' },
    'WIN_COLOR': { name: '彩色玻璃（中）', code: 'WIN_COLOR', label: '彩繪窗', color: '#c084fc', icon: 'assets/item_sprites/60px-Bag_彩色玻璃（中）_Pokopia_Sprite.png' },
    'ROOF_SLOPE': { name: '斜斜屋瓦', code: 'ROOF_SLOPE', label: '斜瓦', color: '#581c87', icon: 'assets/item_sprites/60px-Bag_斜斜屋瓦_Pokopia_Sprite.png' },
    'ROOF_PEAK': { name: '凸凸屋瓦', code: 'ROOF_PEAK', label: '凸瓦', color: '#3b0764', icon: 'assets/item_sprites/60px-Bag_凸凸屋瓦_Pokopia_Sprite.png' },
    'ROOF_VALLEY': { name: '凹凹屋瓦', code: 'ROOF_VALLEY', label: '凹瓦', color: '#6b21a8', icon: 'assets/item_sprites/60px-Bag_凹凹屋瓦_Pokopia_Sprite.png' },
    'SPIRE_DEC': { name: '石頭屋頂的裝飾', code: 'SPIRE_DEC', label: '尖頂飾', color: '#f59e0b', icon: 'assets/item_sprites/60px-Bag_石頭屋頂的裝飾_Pokopia_Sprite.png' },
    'FENCE_IRON': { name: '鐵圍欄', code: 'FENCE_IRON', label: '鐵欄', color: '#334155', icon: 'assets/item_sprites/60px-Bag_鐵圍欄_Pokopia_Sprite.png' },
    'LAMP_STREET': { name: '雅緻路燈', code: 'LAMP_STREET', label: '路燈', color: '#fef08a', icon: 'assets/item_sprites/60px-Bag_雅緻路燈_Pokopia_Sprite.png' },
    'LAMP_WALL': { name: '壁燈', code: 'LAMP_WALL', label: '壁燈', color: '#fde047', icon: 'assets/item_sprites/60px-Bag_壁燈_Pokopia_Sprite.png' },
    'CHANDELIER': { name: '古董吊燈', code: 'CHANDELIER', label: '吊燈', color: '#eab308', icon: 'assets/item_sprites/60px-Bag_古董吊燈_Pokopia_Sprite.png' },
    'CARRIAGE': { name: '板車', code: 'CARRIAGE', label: '馬車座', color: '#ea580c', icon: 'assets/item_sprites/60px-Bag_板車_Pokopia_Sprite.png' },
    'DEAD_TREE': { name: '枯萎的三角樹', code: 'DEAD_TREE', label: '枯木', color: '#44403c', icon: 'assets/item_sprites/60px-Bag_枯萎的三角樹_Pokopia_Sprite.png' },
    'DEAD_VINE': { name: '枯萎的蔓藤', code: 'DEAD_VINE', label: '枯藤', color: '#57534e', icon: 'assets/item_sprites/60px-Bag_枯萎的蔓藤_Pokopia_Sprite.png' },
    'LANTERN': { name: '提燈', code: 'LANTERN', label: '提燈', color: '#fb923c', icon: 'assets/item_sprites/60px-Bag_提燈_Pokopia_Sprite.png' }
  };

  return {
    blueprint: {
      id: 'halloween_mansion',
      title: '暗夜洋館與萬聖南瓜造景',
      author: 'リリィ (@__ririmero)',
      videoUrl: 'https://www.youtube.com/watch?v=EnLf8D-EuV0',
      videoEmbedId: 'EnLf8D-EuV0',
      dimensions: '佔地 16 × 20 格 (高度約 8 格)',
      difficulty: '中級建築師',
      estimatedTime: '約 25 ~ 35 分鐘',
      description: '由人氣島嶼創作者 リリィ 設計的萬聖節洋館造景。擁有嚴格對稱的哥德暗黑立面、神秘彩繪高窗與復古載客南瓜馬車，完美營造節慶典雅莊園氛圍。'
    },

    // 23 種材料總表 (100% 精準對齊 preferences_db.js)
    materialsSummary: [
      { name: '古舊石牆', count: 86, category: '方塊', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, desc: '洋館主結構牆身' },
      { name: '石磚牆', count: 48, category: '方塊', icon: MATERIAL_DEFINITIONS['S_BRICK'].icon, desc: '防潮加厚地基基座' },
      { name: '斜斜屋瓦', count: 42, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_SLOPE'].icon, desc: '左右側斜面深紫屋瓦' },
      { name: '圍邊磚塊（筆直）', count: 32, category: '建築', icon: MATERIAL_DEFINITIONS['CURB_LINE'].icon, desc: '步道兩側邊緣石' },
      { name: '踏板石', count: 28, category: '建築', icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon, desc: '庭園小徑與車位石板' },
      { name: '鐵圍欄', count: 24, category: '建築', icon: MATERIAL_DEFINITIONS['FENCE_IRON'].icon, desc: '莊園外圍黑鐵護欄' },
      { name: '鐵牆', count: 20, category: '方塊', icon: MATERIAL_DEFINITIONS['IRON_WALL'].icon, desc: '屋簷暗色收邊與加固' },
      { name: '凸凸屋瓦', count: 18, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_PEAK'].icon, desc: '正脊隆起屋瓦' },
      { name: '直立圓木', count: 16, category: '方塊', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, desc: '四角立體承重柱' },
      { name: '圍邊磚塊（轉角）', count: 8, category: '建築', icon: MATERIAL_DEFINITIONS['CURB_CNR'].icon, desc: '轉角導角邊石' },
      { name: '凹凹屋瓦', count: 6, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_VALLEY'].icon, desc: '落水與轉角接合屋瓦' },
      { name: '上下推拉窗', count: 6, category: '建築', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, desc: '左右側牆對稱透光窗' },
      { name: '枯萎的蔓藤', count: 6, category: '建築', icon: MATERIAL_DEFINITIONS['DEAD_VINE'].icon, desc: '外牆與枯木陰森裝飾' },
      { name: '石頭屋頂的裝飾', count: 4, category: '建築', icon: MATERIAL_DEFINITIONS['SPIRE_DEC'].icon, desc: '哥德式屋頂尖塔飾品' },
      { name: '彩色玻璃（中）', count: 4, category: '建築', icon: MATERIAL_DEFINITIONS['WIN_COLOR'].icon, desc: '大廳二樓復古彩繪窗' },
      { name: '雅緻路燈', count: 4, category: '戶外', icon: MATERIAL_DEFINITIONS['LAMP_STREET'].icon, desc: '庭院兩側古典黑鐵路燈' },
      { name: '壁燈', count: 4, category: '建築', icon: MATERIAL_DEFINITIONS['LAMP_WALL'].icon, desc: '正門兩側迎賓壁燈' },
      { name: '提燈', count: 4, category: '戶外', icon: MATERIAL_DEFINITIONS['LANTERN'].icon, desc: '南瓜馬車復古前後車燈' },
      { name: '枯萎的三角樹', count: 3, category: '戶外', icon: MATERIAL_DEFINITIONS['DEAD_TREE'].icon, desc: '庭園枯木造景' },
      { name: '石頭樓梯', count: 2, category: '建築', icon: MATERIAL_DEFINITIONS['STAIR'].icon, desc: '正門大階梯' },
      { name: '古董吊燈', count: 2, category: '傢俱', icon: MATERIAL_DEFINITIONS['CHANDELIER'].icon, desc: '主大廳懸掛金屬吊燈' },
      { name: '大木門', count: 1, category: '建築', icon: MATERIAL_DEFINITIONS['DOOR'].icon, desc: '洋館正中央主門扉' },
      { name: '板車', count: 1, category: '戶外', icon: MATERIAL_DEFINITIONS['CARRIAGE'].icon, desc: '南瓜載客馬車底座' }
    ],

    // 四大核心模組樂高立面圖解結構 (高辨識度、結構化、尺寸清晰)
    modules: [
      {
        id: 'mod_foundation',
        name: '防潮基座與迎賓階梯',
        badge: '模組 1：地基層',
        dimensions: '長 12 格 × 寬 11 格 × 高 1 格',
        keyFormula: '石磚牆 12×11 基底 ➔ 正中 2 格放置石頭樓梯 ➔ 往前延伸踏板石步道',
        tips: '平整土地後先拉出 12×11 長方形基座，中央留出對稱中軸，階梯精確放在第 6、7 格！',
        materials: [
          { name: '石磚牆', count: 48, icon: MATERIAL_DEFINITIONS['S_BRICK'].icon },
          { name: '石頭樓梯', count: 2, icon: MATERIAL_DEFINITIONS['STAIR'].icon },
          { name: '踏板石', count: 8, icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon },
          { name: '圍邊磚塊（筆直）', count: 16, icon: MATERIAL_DEFINITIONS['CURB_LINE'].icon }
        ],
        legoLayout: [
          {
            rowName: '洋館主基地 (石磚基座)',
            dimensionNote: '寬 12 格 ↔，高 1 格',
            blocks: [
              { name: '石磚牆', count: 12, label: '石磚牆 (12格平鋪基底)', color: '#64748b', icon: MATERIAL_DEFINITIONS['S_BRICK'].icon, flex: 12 }
            ]
          },
          {
            rowName: '前門迎賓入口 (中央階梯)',
            dimensionNote: '左留 5 格 ↔ 中央 2 格 ↔ 右留 5 格',
            blocks: [
              { name: '圍邊磚塊（筆直）', count: 5, label: '邊石 (5格)', color: '#a8a29e', icon: MATERIAL_DEFINITIONS['CURB_LINE'].icon, flex: 5 },
              { name: '石頭樓梯', count: 2, label: '★ 石頭樓梯 (2格入戶階梯)', color: '#94a3b8', icon: MATERIAL_DEFINITIONS['STAIR'].icon, flex: 2, isKey: true },
              { name: '圍邊磚塊（筆直）', count: 5, label: '邊石 (5格)', color: '#a8a29e', icon: MATERIAL_DEFINITIONS['CURB_LINE'].icon, flex: 5 }
            ]
          },
          {
            rowName: '迎賓石板小徑',
            dimensionNote: '中央向前延伸 3 排踏板石',
            blocks: [
              { name: '踏板石', count: 6, label: '踏板石步道 (寬2格直通台階)', color: '#78716c', icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon, flex: 6 }
            ]
          }
        ]
      },
      {
        id: 'mod_wall',
        name: '正門外牆、樑柱與窗扉',
        badge: '模組 2：主牆層',
        dimensions: '正面寬 12 格 × 高 4 格 (雙側各 11 格深)',
        keyFormula: '四角立柱 ➔ 中央開 2×2 大木門 ➔ 兩側各間隔 2 格古舊石牆後對稱嵌入窗戶',
        tips: '嚴格保持軸對稱！大門兩側各放一盞壁燈，門上方留出彩色玻璃窗開孔。',
        materials: [
          { name: '古舊石牆', count: 86, icon: MATERIAL_DEFINITIONS['S_WALL'].icon },
          { name: '直立圓木', count: 16, icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon },
          { name: '大木門', count: 1, icon: MATERIAL_DEFINITIONS['DOOR'].icon },
          { name: '上下推拉窗', count: 6, icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon },
          { name: '彩色玻璃（中）', count: 4, icon: MATERIAL_DEFINITIONS['WIN_COLOR'].icon },
          { name: '壁燈', count: 4, icon: MATERIAL_DEFINITIONS['LAMP_WALL'].icon }
        ],
        legoLayout: [
          {
            rowName: '第 4 層：頂部橫樑與鐵牆加固 (高 4)',
            dimensionNote: '寬 12 格 ↔',
            blocks: [
              { name: '直立圓木', count: 1, label: '左角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 },
              { name: '古舊石牆', count: 4, label: '石牆橫樑 (4格)', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 4 },
              { name: '彩色玻璃（中）', count: 2, label: '彩繪玻璃 (2格門頂大窗)', color: '#c084fc', icon: MATERIAL_DEFINITIONS['WIN_COLOR'].icon, flex: 2, isKey: true },
              { name: '古舊石牆', count: 4, label: '石牆橫樑 (4格)', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 4 },
              { name: '直立圓木', count: 1, label: '右角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 }
            ]
          },
          {
            rowName: '第 3 層：門頂壁燈與二樓小窗 (高 3)',
            dimensionNote: '左柱 ➔ 牆 ➔ 窗 ➔ 壁燈 ➔ 門頂 ➔ 壁燈 ➔ 窗 ➔ 牆 ➔ 右柱',
            blocks: [
              { name: '直立圓木', count: 1, label: '左角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '上下推拉窗', count: 1, label: '推拉窗', color: '#38bdf8', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, flex: 1.5 },
              { name: '壁燈', count: 1, label: '壁燈', color: '#fde047', icon: MATERIAL_DEFINITIONS['LAMP_WALL'].icon, flex: 1.5 },
              { name: '古舊石牆', count: 2, label: '大門上方門楣 (2格)', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 2 },
              { name: '壁燈', count: 1, label: '壁燈', color: '#fde047', icon: MATERIAL_DEFINITIONS['LAMP_WALL'].icon, flex: 1.5 },
              { name: '上下推拉窗', count: 1, label: '推拉窗', color: '#38bdf8', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, flex: 1.5 },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '直立圓木', count: 1, label: '右角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 }
            ]
          },
          {
            rowName: '第 2 層：一樓大門上半部與窗戶 (高 2)',
            dimensionNote: '中軸安裝大木門上半部',
            blocks: [
              { name: '直立圓木', count: 1, label: '左角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '上下推拉窗', count: 1, label: '推拉窗', color: '#38bdf8', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, flex: 1.5 },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '大木門', count: 2, label: '★ 大木門 (門扇頂部 2格)', color: '#b45309', icon: MATERIAL_DEFINITIONS['DOOR'].icon, flex: 2, isKey: true },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '上下推拉窗', count: 1, label: '推拉窗', color: '#38bdf8', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, flex: 1.5 },
              { name: '古舊石牆', count: 1, label: '牆', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 1 },
              { name: '直立圓木', count: 1, label: '右角柱', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 }
            ]
          },
          {
            rowName: '第 1 層：一樓大門門檻與基底牆 (高 1)',
            dimensionNote: '中軸安裝大木門下半部，兩側實心石牆',
            blocks: [
              { name: '直立圓木', count: 1, label: '左柱底', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 },
              { name: '古舊石牆', count: 4, label: '古舊石牆 (4格實體牆)', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 4 },
              { name: '大木門', count: 2, label: '★ 大木門 (門檻 2格)', color: '#b45309', icon: MATERIAL_DEFINITIONS['DOOR'].icon, flex: 2, isKey: true },
              { name: '古舊石牆', count: 4, label: '古舊石牆 (4格實體牆)', color: '#475569', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, flex: 4 },
              { name: '直立圓木', count: 1, label: '右柱底', color: '#78350f', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, flex: 1 }
            ]
          }
        ]
      },
      {
        id: 'mod_roof',
        name: '深紫斜瓦與哥德尖塔屋頂',
        badge: '模組 3：屋頂層',
        dimensions: '寬 14 格 (左右各外突 1 格簷邊) × 高 3 格',
        keyFormula: '兩側斜斜屋瓦朝中軸升起 ➔ 中央凸凸屋瓦封脊 ➔ 屋頂頂點豎立石頭屋頂裝飾',
        tips: '屋簷要比牆壁向外延伸多突 1 格，營造深邃有層次的陰影效果！大廳內部懸掛古董吊燈。',
        materials: [
          { name: '斜斜屋瓦', count: 42, icon: MATERIAL_DEFINITIONS['ROOF_SLOPE'].icon },
          { name: '凸凸屋瓦', count: 18, icon: MATERIAL_DEFINITIONS['ROOF_PEAK'].icon },
          { name: '凹凹屋瓦', count: 6, icon: MATERIAL_DEFINITIONS['ROOF_VALLEY'].icon },
          { name: '石頭屋頂的裝飾', count: 4, icon: MATERIAL_DEFINITIONS['SPIRE_DEC'].icon },
          { name: '古董吊燈', count: 2, icon: MATERIAL_DEFINITIONS['CHANDELIER'].icon },
          { name: '鐵牆', count: 20, icon: MATERIAL_DEFINITIONS['IRON_WALL'].icon }
        ],
        legoLayout: [
          {
            rowName: '最高層：哥德尖塔頂飾與避雷針',
            dimensionNote: '中軸安裝 4 處尖頂飾品',
            blocks: [
              { name: '石頭屋頂的裝飾', count: 4, label: '★ 石頭屋頂的裝飾 (4處立體哥德尖頂飾)', color: '#f59e0b', icon: MATERIAL_DEFINITIONS['SPIRE_DEC'].icon, flex: 12, isKey: true }
            ]
          },
          {
            rowName: '中層：正脊凸瓦與轉折凹瓦',
            dimensionNote: '中央 6 格凸瓦封頂',
            blocks: [
              { name: '凹凹屋瓦', count: 2, label: '左轉折凹瓦', color: '#6b21a8', icon: MATERIAL_DEFINITIONS['ROOF_VALLEY'].icon, flex: 2 },
              { name: '凸凸屋瓦', count: 6, label: '凸凸屋瓦 (中央屋脊6格)', color: '#3b0764', icon: MATERIAL_DEFINITIONS['ROOF_PEAK'].icon, flex: 6, isKey: true },
              { name: '凹凹屋瓦', count: 2, label: '右轉折凹瓦', color: '#6b21a8', icon: MATERIAL_DEFINITIONS['ROOF_VALLEY'].icon, flex: 2 }
            ]
          },
          {
            rowName: '底層：左右斜面屋瓦與簷口鐵牆',
            dimensionNote: '左右兩側斜瓦向中央合攏',
            blocks: [
              { name: '斜斜屋瓦', count: 4, label: '斜斜屋瓦 (左斜坡 4格)', color: '#581c87', icon: MATERIAL_DEFINITIONS['ROOF_SLOPE'].icon, flex: 4 },
              { name: '鐵牆', count: 4, label: '鐵牆暗色收邊 (4格)', color: '#1e293b', icon: MATERIAL_DEFINITIONS['IRON_WALL'].icon, flex: 4 },
              { name: '斜斜屋瓦', count: 4, label: '斜斜屋瓦 (右斜坡 4格)', color: '#581c87', icon: MATERIAL_DEFINITIONS['ROOF_SLOPE'].icon, flex: 4 }
            ]
          }
        ]
      },
      {
        id: 'mod_garden',
        name: '萬聖庭院造景與南瓜馬車',
        badge: '模組 4：造景層',
        dimensions: '庭院右前方 4 × 4 格獨立月台 + 迎賓外圍小徑',
        keyFormula: '踏板石鋪設 4×4 月台 ➔ 放置板車 ➔ 四角架設提燈當復古車燈 ➔ 外圍鐵圍欄與枯木',
        tips: '板車周圍可擺放橘色萬聖南瓜道具，枯木上點綴枯萎蔓藤，神秘童話氣氛瞬間拉滿！',
        materials: [
          { name: '板車', count: 1, icon: MATERIAL_DEFINITIONS['CARRIAGE'].icon },
          { name: '提燈', count: 4, icon: MATERIAL_DEFINITIONS['LANTERN'].icon },
          { name: '鐵圍欄', count: 24, icon: MATERIAL_DEFINITIONS['FENCE_IRON'].icon },
          { name: '雅緻路燈', count: 4, icon: MATERIAL_DEFINITIONS['LAMP_STREET'].icon },
          { name: '枯萎的三角樹', count: 3, icon: MATERIAL_DEFINITIONS['DEAD_TREE'].icon },
          { name: '枯萎的蔓藤', count: 6, icon: MATERIAL_DEFINITIONS['DEAD_VINE'].icon },
          { name: '踏板石', count: 20, icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon }
        ],
        legoLayout: [
          {
            rowName: '南瓜馬車核心車體 (右前方 4×4 月台)',
            dimensionNote: '板車底座 + 四角復古提燈',
            blocks: [
              { name: '提燈', count: 2, label: '前車提燈 ×2', color: '#fb923c', icon: MATERIAL_DEFINITIONS['LANTERN'].icon, flex: 2 },
              { name: '板車', count: 1, label: '★ 板車 (南瓜馬車主座底盤)', color: '#ea580c', icon: MATERIAL_DEFINITIONS['CARRIAGE'].icon, flex: 6, isKey: true },
              { name: '提燈', count: 2, label: '後車提燈 ×2', color: '#fb923c', icon: MATERIAL_DEFINITIONS['LANTERN'].icon, flex: 2 }
            ]
          },
          {
            rowName: '莊園外圍黑鐵圍欄與路燈',
            dimensionNote: '路口兩側立雅緻路燈',
            blocks: [
              { name: '鐵圍欄', count: 6, label: '鐵圍欄 (左側邊界)', color: '#334155', icon: MATERIAL_DEFINITIONS['FENCE_IRON'].icon, flex: 4 },
              { name: '雅緻路燈', count: 2, label: '迎賓雅緻路燈 ×2', color: '#fef08a', icon: MATERIAL_DEFINITIONS['LAMP_STREET'].icon, flex: 2 },
              { name: '踏板石', count: 2, label: '莊園入口步道', color: '#78716c', icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon, flex: 2 },
              { name: '雅緻路燈', count: 2, label: '迎賓雅緻路燈 ×2', color: '#fef08a', icon: MATERIAL_DEFINITIONS['LAMP_STREET'].icon, flex: 2 },
              { name: '鐵圍欄', count: 6, label: '鐵圍欄 (右側邊界)', color: '#334155', icon: MATERIAL_DEFINITIONS['FENCE_IRON'].icon, flex: 4 }
            ]
          },
          {
            rowName: '庭院角落枯木與蔓藤氛圍造景',
            dimensionNote: '兩側散佈枯萎樹木與垂掛藤蔓',
            blocks: [
              { name: '枯萎的三角樹', count: 2, label: '枯萎的三角樹', color: '#44403c', icon: MATERIAL_DEFINITIONS['DEAD_TREE'].icon, flex: 4 },
              { name: '枯萎的蔓藤', count: 4, label: '枯萎的蔓藤 (掛於枯木與側牆)', color: '#57534e', icon: MATERIAL_DEFINITIONS['DEAD_VINE'].icon, flex: 6 }
            ]
          }
        ]
      }
    ],

    // 8 大依序施工指南 (包含每步分攤材料、影片時間戳與防呆秘訣)
    steps: [
      {
        stepNum: 1,
        title: '整平土地並打好 12 × 11 磚石地基',
        timing: '00:45',
        summary: '在地面平整出至少 16 × 20 的建造空地，用【石磚牆】平鋪一塊寬 12 格、長 11 格的長方形基地，作為防潮與承重基座。',
        tips: '務必先確定洋館座向與居中位置，周圍至少預留 2 格空地以利後續搭建屋簷與庭院。',
        materials: [
          { name: '石磚牆', count: 48 }
        ]
      },
      {
        stepNum: 2,
        title: '鋪設正門階梯與迎賓小徑',
        timing: '02:30',
        summary: '在洋館基座正前方第 6、7 格正中央放置 2 格【石頭樓梯】，由階梯往前鋪設 3 排【踏板石】，兩側以【圍邊磚塊（筆直）】整齊收邊。',
        tips: '台階與大門對齊是全棟建築的中軸基準線，後續所有窗戶與裝飾皆以此為中心對稱分佈。',
        materials: [
          { name: '石頭樓梯', count: 2 },
          { name: '踏板石', count: 6 },
          { name: '圍邊磚塊（筆直）', count: 12 }
        ]
      },
      {
        stepNum: 3,
        title: '立起四角承重圓木柱與搭建外牆輪廓',
        timing: '04:50',
        summary: '在地基四個角落垂直立起 4 格高的【直立圓木】作為立體樑柱，外圍以【古舊石牆】砌至 4 格高，正門中央預留 2 × 2 空位。',
        tips: '四角圓木能強化哥德式建築沉穩莊嚴的立體感，牆身古舊石牆能完美展現歷史痕跡。',
        materials: [
          { name: '直立圓木', count: 16 },
          { name: '古舊石牆', count: 48 }
        ]
      },
      {
        stepNum: 4,
        title: '安裝大木門、上下推拉窗與彩繪大窗',
        timing: '08:15',
        summary: '正門安裝【大木門】，左右兩側各間隔 2 格石牆對稱嵌入【上下推拉窗】，門上方與側牆上方嵌入【彩色玻璃（中）】，門側懸掛【壁燈】。',
        tips: '彩色玻璃在室內燈光照耀下會呈現迷人神秘的光暈，是洋館不可或缺的視覺焦點！',
        materials: [
          { name: '大木門', count: 1 },
          { name: '上下推拉窗', count: 6 },
          { name: '彩色玻璃（中）', count: 4 },
          { name: '壁燈', count: 4 }
        ]
      },
      {
        stepNum: 5,
        title: '搭建深紫色雙面斜屋頂與黑鐵牆收邊',
        timing: '11:30',
        summary: '從左右兩側外簷以【斜斜屋瓦】朝中央中軸逐層升起搭建斜屋頂，中央以【凸凸屋瓦】封脊，屋簷底部以【鐵牆】加固。',
        tips: '屋頂左右側各比牆壁向外延伸多突 1 格，營造深邃有層次的懸挑屋簷陰影。',
        materials: [
          { name: '斜斜屋瓦', count: 42 },
          { name: '凸凸屋瓦', count: 18 },
          { name: '凹凹屋瓦', count: 6 },
          { name: '鐵牆', count: 20 }
        ]
      },
      {
        stepNum: 6,
        title: '安裝哥德尖塔裝飾與內部復古吊燈',
        timing: '14:20',
        summary: '在屋脊中軸頂端安裝【石頭屋頂的裝飾】，大廳內部懸掛 2 盞【古董吊燈】完成主建物封頂。',
        tips: '尖塔飾品垂直置中，完美勾勒出哥德式洋館標誌性的神秘剪影。',
        materials: [
          { name: '石頭屋頂的裝飾', count: 4 },
          { name: '古董吊燈', count: 2 }
        ]
      },
      {
        stepNum: 7,
        title: '拼裝萬聖南瓜載客馬車',
        timing: '18:10',
        summary: '在庭院右前方鋪設 4 × 4 專屬停靠石板，放置【板車】作為車底座，前後加裝【提燈】當作復古車燈。',
        tips: '車身可點綴橘黃色萬聖南瓜飾物，就像剛從童話故事裡駛出的南瓜馬車！',
        materials: [
          { name: '板車', count: 1 },
          { name: '踏板石', count: 8 },
          { name: '提燈', count: 4 }
        ]
      },
      {
        stepNum: 8,
        title: '鋪設踏板石小徑、黑鐵圍欄與枯木景觀',
        timing: '21:40',
        summary: '門前鋪設直通大門的【踏板石】小徑並以【圍邊磚塊】包邊，外圍架設【鐵圍欄】，點綴【枯萎的三角樹】與【雅緻路燈】。',
        tips: '兩側枯木掛上【枯萎的蔓藤】，將莊園幽靜神秘的萬聖節氛圍推向極致！',
        materials: [
          { name: '踏板石', count: 20 },
          { name: '圍邊磚塊（筆直）', count: 32 },
          { name: '圍邊磚塊（轉角）', count: 8 },
          { name: '鐵圍欄', count: 24 },
          { name: '雅緻路燈', count: 4 },
          { name: '枯萎的三角樹', count: 3 },
          { name: '枯萎的蔓藤', count: 6 }
        ]
      }
    ]
  };
});
