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
      note: '高效開採夢幻島寶可金屬，並利用 3D 列印島嶼拍照技巧複製加濕器、乾燥石等關鍵終局傢俱。',
      cloudCode: '',
      isDefault: true,
      createdAt: '2026-03-05T00:00:00.000Z'
    }
  ];

  const DEFAULT_TAGS = [
    '全部',
    '終局農場',
    '環境等級',
    '自動化',
    '資源收集',
    '傢俱攻略'
  ];

  global.POKOPIA_DEFAULT_VIDEOS = DEFAULT_REFERENCE_VIDEOS;
  global.POKOPIA_DEFAULT_TAGS = DEFAULT_TAGS;

})(typeof window !== 'undefined' ? window : global);
