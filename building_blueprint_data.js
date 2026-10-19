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

  // 圖例色碼與材料定義
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

  // 輔助函式：建立寬 W 高 H 的預設空白二維陣列
  function createEmptyGrid(w, h) {
    const grid = [];
    for (let r = 0; r < h; r++) {
      const row = [];
      for (let c = 0; c < w; c++) {
        row.push(null);
      }
      grid.push(row);
    }
    return grid;
  }

  // 1. Layer 1：地基基座與地面小徑 (16 寬 × 20 高)
  const l1Grid = createEmptyGrid(16, 20);
  // (A) 洋館基地：行 2 到行 12，列 2 到列 13 鋪設石磚牆底座
  for (let r = 2; r <= 12; r++) {
    for (let c = 2; c <= 13; c++) {
      l1Grid[r][c] = MATERIAL_DEFINITIONS['S_BRICK'];
    }
  }
  // (B) 正門迎賓階梯 (行 13, 列 7-8)
  l1Grid[13][7] = MATERIAL_DEFINITIONS['STAIR'];
  l1Grid[13][8] = MATERIAL_DEFINITIONS['STAIR'];
  // (C) 正門步道與踏板石 (行 14 到行 19, 列 7-8)
  for (let r = 14; r <= 19; r++) {
    l1Grid[r][7] = MATERIAL_DEFINITIONS['PATH_STONE'];
    l1Grid[r][8] = MATERIAL_DEFINITIONS['PATH_STONE'];
    // 兩側滾邊磚塊
    l1Grid[r][6] = MATERIAL_DEFINITIONS['CURB_LINE'];
    l1Grid[r][9] = MATERIAL_DEFINITIONS['CURB_LINE'];
  }
  // (D) 馬車停放平台 (行 15 到行 18, 列 11 到列 14)
  for (let r = 15; r <= 18; r++) {
    for (let c = 11; c <= 14; c++) {
      l1Grid[r][c] = MATERIAL_DEFINITIONS['PATH_STONE'];
    }
  }

  // 2. Layer 2：1F 外牆、對稱柱體與門窗
  const l2Grid = createEmptyGrid(16, 20);
  // 四個轉角木樑支撐柱
  l2Grid[2][2] = MATERIAL_DEFINITIONS['WOOD_LOG'];
  l2Grid[2][13] = MATERIAL_DEFINITIONS['WOOD_LOG'];
  l2Grid[12][2] = MATERIAL_DEFINITIONS['WOOD_LOG'];
  l2Grid[12][13] = MATERIAL_DEFINITIONS['WOOD_LOG'];
  // 中間支撐柱
  l2Grid[7][2] = MATERIAL_DEFINITIONS['WOOD_LOG'];
  l2Grid[7][13] = MATERIAL_DEFINITIONS['WOOD_LOG'];

  // 北側後牆 (行 2, 列 3 到列 12)
  for (let c = 3; c <= 12; c++) {
    l2Grid[2][c] = MATERIAL_DEFINITIONS['S_WALL'];
  }
  // 後牆彩繪窗
  l2Grid[2][5] = MATERIAL_DEFINITIONS['WIN_COLOR'];
  l2Grid[2][10] = MATERIAL_DEFINITIONS['WIN_COLOR'];

  // 西側與東側外牆 (行 3 到行 11)
  for (let r = 3; r <= 11; r++) {
    if (r !== 7) {
      l2Grid[r][2] = MATERIAL_DEFINITIONS['S_WALL'];
      l2Grid[r][13] = MATERIAL_DEFINITIONS['S_WALL'];
    }
  }
  // 側牆推拉窗
  l2Grid[5][2] = MATERIAL_DEFINITIONS['WIN_SLIDE'];
  l2Grid[9][2] = MATERIAL_DEFINITIONS['WIN_SLIDE'];
  l2Grid[5][13] = MATERIAL_DEFINITIONS['WIN_SLIDE'];
  l2Grid[9][13] = MATERIAL_DEFINITIONS['WIN_SLIDE'];

  // 南側前牆 (行 12)
  for (let c = 3; c <= 12; c++) {
    l2Grid[12][c] = MATERIAL_DEFINITIONS['S_WALL'];
  }
  // 前牆正中央大木門 (列 7-8)
  l2Grid[12][7] = MATERIAL_DEFINITIONS['DOOR'];
  l2Grid[12][8] = MATERIAL_DEFINITIONS['DOOR'];
  // 大門兩側對稱窗與玄關壁燈
  l2Grid[12][4] = MATERIAL_DEFINITIONS['WIN_SLIDE'];
  l2Grid[12][11] = MATERIAL_DEFINITIONS['WIN_SLIDE'];
  l2Grid[12][6] = MATERIAL_DEFINITIONS['LAMP_WALL'];
  l2Grid[12][9] = MATERIAL_DEFINITIONS['LAMP_WALL'];

  // 3. Layer 3：2F 屋頂、雙向斜瓦與中央尖塔裝飾
  const l3Grid = createEmptyGrid(16, 20);
  // 斜屋瓦鋪設 (西側向上斜，東側向西斜，中央合龍)
  for (let r = 1; r <= 13; r++) {
    l3Grid[r][1] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];
    l3Grid[r][2] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];
    l3Grid[r][3] = MATERIAL_DEFINITIONS['ROOF_VALLEY'];
    l3Grid[r][4] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];

    l3Grid[r][14] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];
    l3Grid[r][13] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];
    l3Grid[r][12] = MATERIAL_DEFINITIONS['ROOF_VALLEY'];
    l3Grid[r][11] = MATERIAL_DEFINITIONS['ROOF_SLOPE'];

    // 屋脊中軸線
    l3Grid[r][7] = MATERIAL_DEFINITIONS['ROOF_PEAK'];
    l3Grid[r][8] = MATERIAL_DEFINITIONS['ROOF_PEAK'];
  }
  // 洋館中央與四角尖塔裝飾
  l3Grid[1][7] = MATERIAL_DEFINITIONS['SPIRE_DEC'];
  l3Grid[1][8] = MATERIAL_DEFINITIONS['SPIRE_DEC'];
  l3Grid[13][7] = MATERIAL_DEFINITIONS['SPIRE_DEC'];
  l3Grid[13][8] = MATERIAL_DEFINITIONS['SPIRE_DEC'];
  l3Grid[7][7] = MATERIAL_DEFINITIONS['SPIRE_DEC'];
  l3Grid[7][8] = MATERIAL_DEFINITIONS['SPIRE_DEC'];

  // 4. Layer 4：庭院造景、黑鐵圍欄與南瓜馬車
  const l4Grid = createEmptyGrid(16, 20);
  // 南瓜馬車主體 (行 16-17, 列 12-13)
  l4Grid[16][12] = MATERIAL_DEFINITIONS['CARRIAGE'];
  l4Grid[16][13] = MATERIAL_DEFINITIONS['CARRIAGE'];
  l4Grid[17][12] = MATERIAL_DEFINITIONS['LANTERN'];
  l4Grid[17][13] = MATERIAL_DEFINITIONS['LANTERN'];

  // 外圍黑鐵圍欄 (沿行 19, 列 1 到 5 與 列 10 到 15)
  for (let c = 1; c <= 5; c++) {
    l4Grid[19][c] = MATERIAL_DEFINITIONS['FENCE_IRON'];
  }
  for (let c = 10; c <= 15; c++) {
    l4Grid[19][c] = MATERIAL_DEFINITIONS['FENCE_IRON'];
  }
  // 迎賓路口兩側雙臂路燈 (行 19, 列 5 與 列 10)
  l4Grid[19][5] = MATERIAL_DEFINITIONS['LAMP_STREET'];
  l4Grid[19][10] = MATERIAL_DEFINITIONS['LAMP_STREET'];
  l4Grid[14][5] = MATERIAL_DEFINITIONS['LAMP_STREET'];
  l4Grid[14][10] = MATERIAL_DEFINITIONS['LAMP_STREET'];

  // 庭園枯木與枯藤裝飾
  l4Grid[15][2] = MATERIAL_DEFINITIONS['DEAD_TREE'];
  l4Grid[17][3] = MATERIAL_DEFINITIONS['DEAD_VINE'];
  l4Grid[14][14] = MATERIAL_DEFINITIONS['DEAD_TREE'];
  l4Grid[18][15] = MATERIAL_DEFINITIONS['DEAD_VINE'];

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
      description: '由人氣島嶼創作者 リリィ 設計的萬聖節洋館造景。擁有對稱式哥德暗黑外觀、神秘彩繪窗與復古載客南瓜馬車，完美營造節慶典雅神秘的莊園氛圍。'
    },
    // 全材料總表 (總量統計與正名對齊)
    materialsSummary: [
      { name: '古舊石牆', count: 86, category: '方塊', icon: MATERIAL_DEFINITIONS['S_WALL'].icon, desc: '洋館主結構牆身' },
      { name: '石磚牆', count: 48, category: '方塊', icon: MATERIAL_DEFINITIONS['S_BRICK'].icon, desc: '防潮加厚地基基座' },
      { name: '斜斜屋瓦', count: 42, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_SLOPE'].icon, desc: '左右側斜面深紫屋瓦' },
      { name: '圍邊磚塊（筆直）', count: 32, category: '建築', icon: MATERIAL_DEFINITIONS['CURB_LINE'].icon, desc: '步道兩側邊緣石' },
      { name: '踏板石', count: 28, category: '建築', icon: MATERIAL_DEFINITIONS['PATH_STONE'].icon, desc: '庭園小徑與車位石板' },
      { name: '鐵圍欄', count: 24, category: '建築', icon: MATERIAL_DEFINITIONS['FENCE_IRON'].icon, desc: '莊園外圍黑鐵護欄' },
      { name: '鐵牆', count: 20, category: '方塊', icon: MATERIAL_DEFINITIONS['IRON_WALL'].icon, desc: '屋簷暗色收邊與加固' },
      { name: '直立圓木', count: 16, category: '建築', icon: MATERIAL_DEFINITIONS['WOOD_LOG'].icon, desc: '四角與中軸耐重樑柱' },
      { name: '凸凸屋瓦', count: 16, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_PEAK'].icon, desc: '屋頂正脊頂部' },
      { name: '凹凹屋瓦', count: 12, category: '建築', icon: MATERIAL_DEFINITIONS['ROOF_VALLEY'].icon, desc: '排水屋脊折角' },
      { name: '上下推拉窗', count: 8, category: '建築', icon: MATERIAL_DEFINITIONS['WIN_SLIDE'].icon, desc: '左右兩側對稱採光窗' },
      { name: '圍邊磚塊（轉角）', count: 8, category: '建築', icon: MATERIAL_DEFINITIONS['CURB_CNR'].icon, desc: '步道轉折處收角' },
      { name: '石頭樓梯', count: 6, category: '建築', icon: MATERIAL_DEFINITIONS['STAIR'].icon, desc: '大門迎賓階梯' },
      { name: '壁燈', count: 6, category: '家具', icon: MATERIAL_DEFINITIONS['LAMP_WALL'].icon, desc: '玄關外側引路照明' },
      { name: '枯萎的蔓藤', count: 6, category: '大自然', icon: MATERIAL_DEFINITIONS['DEAD_VINE'].icon, desc: '庭院老樹攀附裝飾' },
      { name: '彩色玻璃（中）', count: 4, category: '建築', icon: MATERIAL_DEFINITIONS['WIN_COLOR'].icon, desc: '洋館後方神秘彩繪窗' },
      { name: '石頭屋頂的裝飾', count: 4, category: '建築', icon: MATERIAL_DEFINITIONS['SPIRE_DEC'].icon, desc: '屋頂尖塔避雷針裝飾' },
      { name: '雅緻路燈', count: 4, category: '家具', icon: MATERIAL_DEFINITIONS['LAMP_STREET'].icon, desc: '入口步道雙向路燈' },
      { name: '提燈', count: 4, category: '家具', icon: MATERIAL_DEFINITIONS['LANTERN'].icon, desc: '馬車車燈與裝飾' },
      { name: '枯萎的三角樹', count: 3, category: '大自然', icon: MATERIAL_DEFINITIONS['DEAD_TREE'].icon, desc: '莊園兩側神祕枯木' },
      { name: '古董吊燈', count: 2, category: '家具', icon: MATERIAL_DEFINITIONS['CHANDELIER'].icon, desc: '室內大廳天花板' },
      { name: '大木門', count: 1, category: '建築', icon: MATERIAL_DEFINITIONS['DOOR'].icon, desc: '洋館正中央主門扉' },
      { name: '板車', count: 1, category: '戶外', icon: MATERIAL_DEFINITIONS['CARRIAGE'].icon, desc: '南瓜載客馬車底座' }
    ],
    // 4 層俯視棋盤網格藍圖
    layers: [
      {
        id: 'layer_foundation',
        name: '第 1 層：地基與步道',
        badge: '地基層',
        width: 16,
        height: 20,
        description: '先用【石磚牆】平鋪 12 × 11 格洋館基底，並在前方第 13 行正中放置 2 格【石頭樓梯】與鋪設【踏板石】迎賓步道。',
        grid: l1Grid
      },
      {
        id: 'layer_wall',
        name: '第 2 層：外牆門窗與樑柱',
        badge: '牆面層',
        width: 16,
        height: 20,
        description: '四角立起【直立圓木】承重柱，外圍以【古舊石牆】圍合；正前方第 12 行中軸安裝【大木門】，兩側對稱嵌入【上下推拉窗】與【壁燈】。',
        grid: l2Grid
      },
      {
        id: 'layer_roof',
        name: '第 3 層：屋頂斜瓦與尖塔',
        badge: '屋頂層',
        width: 16,
        height: 20,
        description: '兩側搭建深紫色【斜斜屋瓦】朝中軸交會，中央以【凸凸屋瓦】封脊，並在尖端豎立【石頭屋頂的裝飾】完成哥德尖塔外觀。',
        grid: l3Grid
      },
      {
        id: 'layer_garden',
        name: '第 4 層：庭院造景與南瓜馬車',
        badge: '造景層',
        width: 16,
        height: 20,
        description: '右前側以【板車】搭建南瓜馬車座，兩側佈置【鐵圍欄】、【雅緻路燈】、【枯萎的三角樹】與【提燈】，呈現萬聖節莊園氣派氛圍。',
        grid: l4Grid
      }
    ],
    // 8 大按部就班施工步驟
    steps: [
      {
        stepNum: 1,
        title: '整地與劃定 16 × 20 區域邊界',
        timing: '00:30',
        summary: '清理地面雜草，用鏟子或標記物標出橫向 16 格、縱向 20 格的莊園基地範圍。',
        tips: '後方預留 2 格空隙作為外牆散步道，前方預留 7 格作為馬車迴轉庭園。',
        materials: [
          { name: '石磚牆', count: 12 }
        ]
      },
      {
        stepNum: 2,
        title: '鋪設加厚石磚地基與迎賓階梯',
        timing: '02:15',
        summary: '在第 2 行至第 12 行鋪設 12 × 11 格的【石磚牆】平整地面，並在第 13 行正中放置 2 塊【石頭樓梯】。',
        tips: '基座高於地面一格能讓洋館顯得更巍峨莊嚴，階梯置中（列 7-8）是全館對稱的基準！',
        materials: [
          { name: '石磚牆', count: 36 },
          { name: '石頭樓梯', count: 2 }
        ]
      },
      {
        stepNum: 3,
        title: '立起承重圓木柱與砌築古舊石牆',
        timing: '04:50',
        summary: '在基座四個角落與中間支撐點豎立 6 根【直立圓木】，周圍砌築 3 格高的【古舊石牆】圍合出洋館大廳。',
        tips: '石牆保留門窗預留孔，先立柱再填牆可以保證建築不歪斜。',
        materials: [
          { name: '直立圓木', count: 16 },
          { name: '古舊石牆', count: 52 }
        ]
      },
      {
        stepNum: 4,
        title: '安裝正門大木門與對稱採光推拉窗',
        timing: '07:30',
        summary: '正面中央對準階梯安裝雙開【大木門】，左右兩翼與側牆鑲嵌【上下推拉窗】，後方嵌入【彩色玻璃（中）】。',
        tips: '大木門左右兩側外牆各掛上一盞【壁燈】，夜晚點亮時非常有萬聖古堡氛圍。',
        materials: [
          { name: '大木門', count: 1 },
          { name: '上下推拉窗', count: 8 },
          { name: '彩色玻璃（中）', count: 4 },
          { name: '壁燈', count: 4 }
        ]
      },
      {
        stepNum: 5,
        title: '搭設雙斜面屋頂與凹凸屋脊',
        timing: '10:45',
        summary: '自兩側外牆上方依序鋪排深紫【斜斜屋瓦】向中軸延伸，中央接縫以【凸凸屋瓦】壓頂。',
        tips: '屋簷向外延伸 1 格能製造漂亮的深邃陰影立體感！',
        materials: [
          { name: '斜斜屋瓦', count: 42 },
          { name: '凸凸屋瓦', count: 16 },
          { name: '凹凹屋瓦', count: 12 },
          { name: '鐵牆', count: 20 }
        ]
      },
      {
        stepNum: 6,
        title: '安裝尖塔避雷針裝飾與室內吊燈',
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
