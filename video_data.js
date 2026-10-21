/**
 * Pokopia 參考影片精選資料庫 (Default Reference Videos)
 */
(function (global) {
  'use strict';

  const DEFAULT_REFERENCE_VIDEOS = [
    {
      id: 'video_def_01',
      videoId: '5dCjsO8uskA',
      title: '數學完美終局農場 (End-Game Auto Farm)',
      author: 'Delvox Cozy Gaming',
      url: 'https://www.youtube.com/watch?v=5dCjsO8uskA',
      tags: ['終局農場', '環境等級', '自動化'],
      note: '全材料全自動化生產、最大環境等級 10、嚴格控制在 22 隻寶可夢上限的最佳化配置教學。涵蓋莓果、紅磚金屬、作物、木材、掉落物與鐵錠模組。',
      cloudCode: '6DXL PD6F (加濕器與乾燥石雲端碼)',
      isDefault: true,
      createdAt: '2026-03-01T00:00:00.000Z'
    },
    {
      id: 'video_def_02',
      videoId: 'tjD_ovAAyAQ',
      title: '如何達成最大舒適度 (環境等級 10 達成指南)',
      author: 'Delvox Cozy Gaming',
      url: 'https://www.youtube.com/watch?v=tjD_ovAAyAQ',
      tags: ['環境等級', '傢俱攻略'],
      note: '詳細拆解環境值計算公式、各屬性寶可夢相容環境、擺設衝突避開技巧與島嶼最高舒適度配置實測。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-03-02T00:00:00.000Z'
    },
    {
      id: 'video_def_03',
      videoId: 'BC6Yxf8n1Hw',
      title: '全自動莓果農場 (初代 AFK 掛機配置)',
      author: 'Delvox Cozy Gaming',
      url: 'https://www.youtube.com/watch?v=BC6Yxf8n1Hw',
      tags: ['終局農場', '自動化', '資源收集'],
      note: '利用水流自動推收成熟莓果，並配合碎石/研磨寶可夢（如幼基拉斯）每日自動轉換為各色顏料。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-03-03T00:00:00.000Z'
    },
    {
      id: 'video_def_04',
      videoId: 'XPAJ1YXgBYE',
      title: '全自動農作物收割機 (快速獲取頂級料理食材)',
      author: 'Delvox Cozy Gaming',
      url: 'https://www.youtube.com/watch?v=XPAJ1YXgBYE',
      tags: ['自動化', '資源收集'],
      note: '透過單一開關水流沖刷機制，一鍵收割大量烹飪蔬菜與作物，搭配廚房冰箱快速製作漢堡排與各項增益料理。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-03-04T00:00:00.000Z'
    },
    {
      id: 'video_def_05',
      videoId: 'GLa6X_0vE3M',
      title: '夢幻島金屬農場與 3D 列印秘技 (無限複製設施)',
      author: 'Delvox Cozy Gaming',
      url: 'https://www.youtube.com/watch?v=GLa6X_0vE3M',
      tags: ['資源收集', '傢俱攻略'],
      note: '高效開採夢幻島寶可金屬，並利用 3D列印島嶼拍照技巧複製加濕器、乾燥石等關鍵終局傢俱。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-03-05T00:00:00.000Z'
    },
    {
      id: 'video_def_06',
      videoId: 'BgrIUQTrobU',
      title: '1樓是7-Eleven的現代公寓建築',
      author: 'Pokopia 建築達人',
      url: 'https://www.youtube.com/watch?v=BgrIUQTrobU',
      tags: ['建築', '傢俱攻略'],
      note: '將現代連鎖超商 7-Eleven 融入 1 樓商鋪，2 樓與 3 樓規劃為雙層公寓住宅，包含貨架、冰櫃與住宅陽台細緻排版。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:31:00.000Z'
    },
    {
      id: 'video_def_07',
      videoId: 'GzePoZSfQ78',
      title: '哈利波特霍格華茲中庭、高架橋與船著場',
      author: 'ハリー建築工房',
      url: 'https://www.youtube.com/watch?v=GzePoZSfQ78',
      tags: ['建築', '環境等級'],
      note: '重現霍格華茲魔法學校的宏偉高架石橋、臨水中庭與湖畔船著場，運用大量石磚與拱門組件堆疊立體層次。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:31:21.000Z'
    },
    {
      id: 'video_def_08',
      videoId: 'C17uSb_bQH4',
      title: '仙度瑞拉城堡 (迪士尼夢幻童話白色城堡)',
      author: 'ぽこポケ建築部',
      url: 'https://www.youtube.com/watch?v=C17uSb_bQH4',
      tags: ['建築', '環境等級'],
      note: '在全新街區拔地而起的童話城堡，運用白色石牆、尖頂塔樓與夜間藍色燈光點綴，宛如置身迪士尼樂園。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:33:16.000Z'
    },
    {
      id: 'video_def_09',
      videoId: '49j3IpNC-JI',
      title: '小美人魚艾瑞克王子的海邊城堡',
      author: 'Pokopia Island Studio',
      url: 'https://www.youtube.com/watch?v=49j3IpNC-JI',
      tags: ['建築', '傢俱攻略'],
      note: '重現小美人魚中艾瑞克王子的海濱城堡，具備臨海露台、金黃沙灘步道與大理石石柱景觀。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:34:51.000Z'
    },
    {
      id: 'video_def_10',
      videoId: 'WpMqS6RxBvU',
      title: '關都地方開放世界化 (初代寶可夢城鎮還原)',
      author: 'ぽこポケ工房',
      url: 'https://www.youtube.com/watch?v=WpMqS6RxBvU',
      tags: ['建築', '資源收集'],
      note: '將初代寶可夢紅綠版的真新鎮、常青市與相連道路等比例縮放還原，全地圖無縫連接的史詩級造景。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:54:45.000Z'
    },
    {
      id: 'video_def_11',
      videoId: 'Yvvz5AEptWg',
      title: '工業風無人工廠與無人發電廠街區',
      author: 'ぽこポケ建築部',
      url: 'https://www.youtube.com/watch?v=Yvvz5AEptWg',
      tags: ['建築', '自動化'],
      note: '巧妙將無人發電廠與自動化流水線包裝成現代工業風廠房，兼顧高效率產出與城市美感。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T12:58:16.000Z'
    },
    {
      id: 'video_def_12',
      videoId: '1jB0sZejsFE',
      title: '和風鳥居神社造景 (苔卡比獸島嶼搬家)',
      author: '和風Pokopia',
      url: 'https://www.youtube.com/watch?v=1jB0sZejsFE',
      tags: ['建築', '環境等級'],
      note: '搭建紅色鳥居、參道石燈籠與水手舍神社景觀，並將苔蘚卡比獸妥善安置於聖域中央的高地神木旁。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T13:01:23.000Z'
    },
    {
      id: 'video_def_13',
      videoId: 'JRbeKGep7W4',
      title: '大正浪漫銀山溫泉 (多層木造溫泉街夜景)',
      author: '温泉建築師',
      url: 'https://www.youtube.com/watch?v=JRbeKGep7W4',
      tags: ['建築', '傢俱攻略'],
      note: '復刻日本知名銀山溫泉街景，沿河兩側多層木造閣樓、暖色煤氣燈與石板小橋，夜間氛圍感拉滿。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T13:01:39.000Z'
    },
    {
      id: 'video_def_14',
      videoId: 'Zpxz9IZc8Ew',
      title: '城鎮火車站、鐵路陸橋與穿越隧道設計',
      author: 'Pokopia Railway',
      url: 'https://www.youtube.com/watch?v=Zpxz9IZc8Ew',
      tags: ['建築', '環境等級'],
      note: '完整打造貫穿山脈的火車隧道、跨河鐵路陸橋與復古雙向月台，使島嶼交通網絡充滿生機動感。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-20T13:34:55.000Z'
    },
    {
      id: 'video_def_15',
      videoId: '-hy9ydtbcEE',
      title: '山麓歐風麵包小店 (溫馨烘焙坊與露台)',
      author: 'Bakery Pokopia',
      url: 'https://www.youtube.com/watch?v=-hy9ydtbcEE',
      tags: ['建築', '傢俱攻略'],
      note: '座落於山腳下的溫馨烘焙屋，配備紅瓦斜屋頂、麵包陳列木架與戶外遮陽傘用餐雅座。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-21T12:11:28.000Z'
    },
    {
      id: 'video_def_16',
      videoId: 'nnhJ-qWEKCg',
      title: '石造火車站與主廚咖啡廳 (料理生息地基地)',
      author: 'ぽこポケ料理部',
      url: 'https://www.youtube.com/watch?v=nnhJ-qWEKCg',
      tags: ['建築', '傢俱攻略'],
      note: '將岩石山麓改建為古樸石造火車站，並結合主廚巴里斯的戶外咖啡廳與全自動料理備料基地。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-10-21T12:22:43.000Z'
    }
  ];

  const DEFAULT_TAGS = [
    '全部',
    '建築',
    '終局農場',
    '環境等級',
    '自動化',
    '資源收集',
    '傢俱攻略'
  ];

  global.POKOPIA_DEFAULT_VIDEOS = DEFAULT_REFERENCE_VIDEOS;
  global.POKOPIA_DEFAULT_TAGS = DEFAULT_TAGS;

})(typeof window !== 'undefined' ? window : global);
