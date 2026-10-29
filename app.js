/**
 * Pokopia Storage & Habitat Manager Application Controller
 * 全量 367 隻寶可夢 + 高清 Sprite 大頭像 + 本地 LocalStorage 進度控制
 */

(function () {
  'use strict';

  // LocalStorage Keys
  const STORAGE_KEY_CAT = 'pokopia_cat_checked_v1';
  const STORAGE_KEY_PKM = 'pokopia_pkm_checked_v1';
  const STORAGE_KEY_HAB = 'pokopia_hab_checked_v1';
  const STORAGE_KEY_BENCH = 'pokopia_bench_overrides_v1';
  const STORAGE_KEY_AUTOFARM = 'pokopia_autofarm_checked_v1';
  const STORAGE_KEY_NAV_TAB = 'pokopia_active_tab_v2';
  const STORAGE_KEY_NAV_VIEW = 'pokopia_active_view_v2';
  const STORAGE_KEY_THEME = 'pokopia_theme_v1';
  const STORAGE_KEY_AUTOFARM_AUTHED = 'pokopia_autofarm_authed_v1';
  const STORAGE_KEY_CUSTOM_STORAGE = 'pokopia_custom_boxes_v1';
  const STORAGE_KEY_CUSTOM_VIDEOS = 'pokopia_custom_videos_v1';
  const STORAGE_KEY_CUSTOM_VIDEO_TAGS = 'pokopia_custom_video_tags_v1';
  const STORAGE_KEY_DELETED_VIDEO_TAGS = 'pokopia_deleted_video_tags_v1';
  const STORAGE_KEY_DELETED_VIDEO_IDS = 'pokopia_deleted_video_ids_v1';
  const STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS = 'pokopia_video_progress_v1';
  const STORAGE_KEY_ACTIVE_VIDEO = 'pokopia_active_video_id_v1';

  // 我的收納盒預設初始箱號配置 (6 個預設收納盒，使用者可自由增刪與修改)
  const DEFAULT_CUSTOM_BOXES = [
    { id: 'box_1', no: '01', name: '食材與烹飪', items: ['甜甜蜜', '小麥', '番茄'] },
    { id: 'box_2', no: '02', name: '木材與纖維', items: ['結實的樹枝', '小圓木', '木材'] },
    { id: 'box_3', no: '03', name: '石材與黏土', items: ['石頭', '磚塊', '軟塌塌黏土'] },
    { id: 'box_4', no: '04', name: '礦石與金屬', items: ['鐵', '銅', '金子'] },
    { id: 'box_5', no: '05', name: '海洋與素材', items: ['海玻璃碎片', '貝殼', '線團'] },
    { id: 'box_6', no: '06', name: '稀有與特殊', items: ['水晶碎片', '寶可金屬碎片', '發光蘑菇'] }
  ];

  // 終局農場與自訂收納限定授權 Email (僅 cliff210689cliff@gmail.com 具備存取權限)
  const AUTOFARM_ALLOWED_EMAIL = 'cliff210689cliff@gmail.com';

  // Fallback SVG Badge for sprite images
  const FALLBACK_SPRITE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%230284c7'><circle cx='12' cy='12' r='10' fill-opacity='0.15' stroke='%230284c7' stroke-width='2'/><text x='12' y='16' font-size='12' text-anchor='middle' fill='%230284c7'>🐾</text></svg>";

  // Determine initial navigation state from URL hash or LocalStorage
  const initialNav = getInitialNavState();
  const initialTheme = getInitialTheme();

  // Apply theme immediately to prevent flash
  document.documentElement.setAttribute('data-theme', initialTheme);

  // 52poke 官方專長圖示對應 (33 種官方專長)
  const SPECIALTY_ICONS = {
    '栽培': '🌱',
    '點火': '🔥',
    '滋潤': '💧',
    '飛翔': '🍃',
    '伐木': '🪵',
    '找東西': '🔍',
    '亂撒': '📦',
    '交易': '💼',
    '發電': '⚡',
    '帶動氣氛': '📣',
    '建造': '🔨',
    '分類': '📂',
    '碾壓': '🪨',
    '重踏': '🐾',
    '瞬間移動': '🌀',
    '回收利用': '♻️',
    '擦亮': '✨',
    '收納': '🗃️',
    '爆炸': '💥',
    '收藏家': '💎',
    '哈欠': '🥱',
    '鑑定': '🔎',
    '變身': '🎭',
    '採蜜': '🍯',
    '夢島': '🏝️',
    '發光': '💡',
    '貪喫鬼': '🍖',
    '彩繪': '🎨',
    'DJ': '🎧',
    '開派對': '🎉',
    '稀有物': '🌟',
    '工匠': '🛠️',
    '不明': '❓'
  };

  // 環境中英對照映射表 (解決按鈕英文與資料庫中文環境匹對問題)
  const ENV_FILTER_MAP = {
    'Bright': '明亮',
    'Warm': '溫暖',
    'Humid': '潮濕',
    'Dry': '乾燥',
    'Cool': '涼爽',
    'Dark': '黑暗',
    'env-Bright': '明亮',
    'env-Warm': '溫暖',
    'env-Humid': '潮濕',
    'env-Dry': '乾燥',
    'env-Cool': '涼爽',
    'env-Dark': '黑暗'
  };

  // Application State
  const state = {
    currentTab: initialNav.tab,   // 'storage' | 'habitat' | 'habitatCatalog'
    currentView: initialNav.view, // 'card' | 'table'
    currentTheme: initialTheme,   // 'light' | 'dark'
    searchQuery: '',
    selectedEnvFilter: 'env-all',
    selectedSpecialtyFilter: 'all',
    selectedUnlockFilter: 'all',
    selectedRegionFilter: 'all',
    selectedPkmCategory: 'all',   // 'all' | 'main' | 'event' | 'underwater'
    selectedHabCategory: 'all',   // 'all' | 'main' | 'event' | 'underwater'
    catChecked: loadProgress(STORAGE_KEY_CAT),
    pkmChecked: loadProgress(STORAGE_KEY_PKM),
    habChecked: loadProgress(STORAGE_KEY_HAB),
    benchOverrides: loadProgress(STORAGE_KEY_BENCH),
    autoFarmChecked: loadProgress(STORAGE_KEY_AUTOFARM) || {},
    customBoxes: (function() {
      const saved = loadProgress(STORAGE_KEY_CUSTOM_STORAGE, null);
      return (Array.isArray(saved) && saved.length > 0) ? saved : JSON.parse(JSON.stringify(DEFAULT_CUSTOM_BOXES));
    })(),
    activeTraySearch: '',
    activeTrayCategory: 'all',
    reverseSearchItem: '',
    prefTab: 'tastes',            // 'tastes' | 'environments' | 'things' | 'items'
    prefSearch: '',
    prefItemCat: '材料',
    regionAssignments: (function() {
      const saved = loadProgress('pokopia_region_assignments', null);
      if (saved && typeof saved === 'object') return saved;
      const initial = {};
      const regData = (window.POKOPIA_REGION_DATA && window.POKOPIA_REGION_DATA.regions) || [];
      regData.forEach(r => {
        initial[r.id] = [...(r.defaultPokemonIds || [])];
      });
      return initial;
    })(),
    activeAssignRegionId: null,
    customVideos: (function() {
      const saved = loadProgress(STORAGE_KEY_CUSTOM_VIDEOS, null);
      const defaults = (window.POKOPIA_DEFAULT_VIDEOS || []);
      const deletedIds = new Set(loadProgress(STORAGE_KEY_DELETED_VIDEO_IDS, []));

      // 若為全新裝置，載入預設影片（過濾黑名單）
      if (!Array.isArray(saved) || saved.length === 0) {
        return JSON.parse(JSON.stringify(defaults.filter(d => !deletedIds.has(d.id))));
      }

      // 平滑遷移舊資料標籤（將「建築造景」自動轉為「建築」）
      const list = saved.map(v => {
        if (v && Array.isArray(v.tags)) {
          const newTags = v.tags.map(t => t === '建築造景' ? '建築' : t);
          return { ...v, tags: Array.from(new Set(newTags)) };
        }
        return v;
      });

      const existingIds = new Set(list.map(v => v.id));
      defaults.forEach(def => {
        // 關鍵防復活：命中 deletedIds 黑名單的影片絕不自動增補
        if (def && def.id && !existingIds.has(def.id) && !deletedIds.has(def.id)) {
          list.push(JSON.parse(JSON.stringify(def)));
          existingIds.add(def.id);
        }
      });
      return list;
    })(),
    customVideoTags: (function() {
      const saved = loadProgress(STORAGE_KEY_CUSTOM_VIDEO_TAGS, null);
      if (Array.isArray(saved)) {
        // 平滑遷移標籤庫中的「建築造景」為「建築」
        const migrated = saved.map(t => t === '建築造景' ? '建築' : t);
        return Array.from(new Set(migrated));
      }
      const defaultTags = (window.POKOPIA_DEFAULT_TAGS || ['建築', '終局農場', '環境等級', '自動化', '資源收集', '傢俱攻略']);
      return defaultTags.filter(t => t !== '全部' && t !== '我的自訂');
    })(),
    deletedVideoTags: (function() {
      const saved = loadProgress(STORAGE_KEY_DELETED_VIDEO_TAGS, null);
      return (Array.isArray(saved)) ? saved : [];
    })(),
    deletedVideoIds: (function() {
      const saved = loadProgress(STORAGE_KEY_DELETED_VIDEO_IDS, null);
      return (Array.isArray(saved)) ? saved : [];
    })(),
    videoProgress: (function() {
      const saved = loadProgress(STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS, null);
      return (saved && typeof saved === 'object' && !Array.isArray(saved)) ? saved : {};
    })(),
    currentVideoId: (function() {
      const saved = loadProgress(STORAGE_KEY_ACTIVE_VIDEO, null);
      return (typeof saved === 'string' && saved.trim()) ? saved.trim() : null;
    })(),
    selectedVideoTag: '全部',
    isStaggerAnim: true
  };

  // DOM Elements Cache
  const DOM = {
    btnScrollTop: document.getElementById('btnScrollTop'),
    floatingBackBtn: document.getElementById('floatingBackBtn'),
    btnTocMenu: document.getElementById('btnTocMenu'),
    tocDropdown: document.getElementById('tocDropdown'),
    tabStorage: document.getElementById('tabStorage'),
    tabHabitat: document.getElementById('tabHabitat'),
    tabHabitatCatalog: document.getElementById('tabHabitatCatalog'),
    tabRecipe: document.getElementById('tabRecipe'),
    tabPreferences: document.getElementById('tabPreferences'),
    tabAutoFarm: document.getElementById('tabAutoFarm'),
    tabCustomStorage: document.getElementById('tabCustomStorage'),
    tabVideo: document.getElementById('tabVideo'),
    tabBuzz3d: document.getElementById('tabBuzz3d'),
    btnAutoFarmNav: document.getElementById('btnAutoFarmNav'),
    btnCustomStorageNav: document.getElementById('btnCustomStorageNav'),
    btnVideoNav: document.getElementById('btnVideoNav'),
    btnBuzz3dNav: document.getElementById('btnBuzz3dNav'),
    autoFarmSection: document.getElementById('autoFarmSection'),
    customStorageSection: document.getElementById('customStorageSection'),
    preferencesSection: document.getElementById('preferencesSection'),
    videoSection: document.getElementById('videoSection'),
    buzz3dSection: document.getElementById('buzz3dSection'),
    buzz3dIframe: document.getElementById('buzz3dIframe'),
    btnSubBuzz: document.getElementById('btnSubBuzz'),
    btnSubBulba: document.getElementById('btnSubBulba'),
    paneBuzz: document.getElementById('paneBuzz'),
    paneBulba: document.getElementById('paneBulba'),
    btnBulbaModeFull: document.getElementById('btnBulbaModeFull'),
    btnBulbaModeSlice: document.getElementById('btnBulbaModeSlice'),
    bulba3dCanvas: document.getElementById('bulba3dCanvas'),
    bulbaLayerBadge: document.getElementById('bulbaLayerBadge'),
    bulbaLayerBlockCount: document.getElementById('bulbaLayerBlockCount'),
    btnBulbaPrevLayer: document.getElementById('btnBulbaPrevLayer'),
    btnBulbaNextLayer: document.getElementById('btnBulbaNextLayer'),
    bulbaLayerSlider: document.getElementById('bulbaLayerSlider'),
    bulbaVoxelGrid: document.getElementById('bulbaVoxelGrid'),
    bulbaDimTop: document.getElementById('bulbaDimTop'),
    bulbaDimRight: document.getElementById('bulbaDimRight'),
    bulbaHoverTooltip: document.getElementById('bulbaHoverTooltip'),
    bulbaTooltipColor: document.getElementById('bulbaTooltipColor'),
    bulbaTooltipText: document.getElementById('bulbaTooltipText'),
    bulbaMatTypesCount: document.getElementById('bulbaMatTypesCount'),
    bulbaMatList: document.getElementById('bulbaMatList'),
    videoPlayerIframe: document.getElementById('videoPlayerIframe'),
    videoResumeBanner: document.getElementById('videoResumeBanner'),
    videoResumeText: document.getElementById('videoResumeText'),
    btnVideoRestart: document.getElementById('btnVideoRestart'),
    btnVideoResumeDismiss: document.getElementById('btnVideoResumeDismiss'),
    videoCurrentAuthor: document.getElementById('videoCurrentAuthor'),
    videoCurrentDate: document.getElementById('videoCurrentDate'),
    videoExternalLink: document.getElementById('videoExternalLink'),
    btnEditCurrentVideo: document.getElementById('btnEditCurrentVideo'),
    videoCurrentTitle: document.getElementById('videoCurrentTitle'),
    videoCurrentNote: document.getElementById('videoCurrentNote'),
    videoCurrentCloudCodeWrap: document.getElementById('videoCurrentCloudCodeWrap'),
    videoCurrentCloudCode: document.getElementById('videoCurrentCloudCode'),
    btnCopyCloudCode: document.getElementById('btnCopyCloudCode'),
    videoCurrentTags: document.getElementById('videoCurrentTags'),
    videoTagsContainer: document.getElementById('videoTagsContainer'),
    btnAddVideoBtn: document.getElementById('btnAddVideoBtn'),
    videoCardsGrid: document.getElementById('videoCardsGrid'),
    videoModal: document.getElementById('videoModal'),
    videoModalBackdrop: document.getElementById('videoModalBackdrop'),
    videoModalCloseBtn: document.getElementById('videoModalCloseBtn'),
    videoModalBadge: document.getElementById('videoModalBadge'),
    videoModalTitle: document.getElementById('videoModalTitle'),
    videoForm: document.getElementById('videoForm'),
    videoFormId: document.getElementById('videoFormId'),
    videoFormUrl: document.getElementById('videoFormUrl'),
    btnAutoFetchVideoInfo: document.getElementById('btnAutoFetchVideoInfo'),
    videoFormTitle: document.getElementById('videoFormTitle'),
    btnToggleTitleLang: document.getElementById('btnToggleTitleLang'),
    toggleLangText: document.getElementById('toggleLangText'),
    videoFormAuthor: document.getElementById('videoFormAuthor'),
    videoFormNote: document.getElementById('videoFormNote'),
    videoFormCloudCode: document.getElementById('videoFormCloudCode'),
    videoFormTagsPool: document.getElementById('videoFormTagsPool'),
    videoFormNewTagInput: document.getElementById('videoFormNewTagInput'),
    btnVideoAddTag: document.getElementById('btnVideoAddTag'),
    btnVideoDelete: document.getElementById('btnVideoDelete'),
    btnVideoCancel: document.getElementById('btnVideoCancel'),
    btnVideoSave: document.getElementById('btnVideoSave'),
    csBoxesContainer: document.getElementById('csBoxesContainer'),
    csReverseSearchInput: document.getElementById('csReverseSearchInput'),
    csClearSearchBtn: document.getElementById('csClearSearchBtn'),
    csSearchResultBanner: document.getElementById('csSearchResultBanner'),
    btnCsAddBox: document.getElementById('btnCsAddBox'),
    btnCsAddBoxBottom: document.getElementById('btnCsAddBoxBottom'),
    btnCsToggleDrawer: document.getElementById('btnCsToggleDrawer'),
    csItemTray: document.getElementById('csItemTray'),
    csTrayBackdrop: document.getElementById('csTrayBackdrop'),
    btnCsCloseTray: document.getElementById('btnCsCloseTray'),
    csTrayGrid: document.getElementById('csTrayGrid'),
    csTraySearchInput: document.getElementById('csTraySearchInput'),
    csTrayCategorySelect: document.getElementById('csTrayCategorySelect'),
    csTrayTargetBoxSelect: document.getElementById('csTrayTargetBoxSelect'),
    csTrayCategoryPills: document.getElementById('csTrayCategoryPills'),
    csTrayItemCount: document.getElementById('csTrayItemCount'),
    csTrayTargetHint: document.getElementById('csTrayTargetHint'),
    autoFarmModulesContainer: document.getElementById('autoFarmModulesContainer'),
    autoFarmProgressBar: document.getElementById('autoFarmProgressBar'),
    autoFarmProgressText: document.getElementById('autoFarmProgressText'),
    btnCardView: document.getElementById('btnCardView'),
    btnTableView: document.getElementById('btnTableView'),
    btnThemeToggle: document.getElementById('btnThemeToggle'),
    btnPrefDrawer: document.getElementById('btnPrefDrawer'),
    prefDrawer: document.getElementById('prefDrawer'),
    prefDrawerBackdrop: document.getElementById('prefDrawerBackdrop'),
    prefDrawerCloseBtn: document.getElementById('prefDrawerCloseBtn'),
    prefDrawerSearch: document.getElementById('prefDrawerSearch'),
    prefDrawerClearSearch: document.getElementById('prefDrawerClearSearch'),
    prefDrawerBody: document.getElementById('prefDrawerBody'),
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchRow: document.querySelector('.search-row'),
    filterToolbar: document.getElementById('filterToolbar'),
    toolbarContainer: document.getElementById('toolbarContainer'),
    toolbarHeaderRow: document.getElementById('toolbarHeaderRow'),
    toolbarTitle: document.getElementById('toolbarTitle'),
    viewToggleGroup: document.getElementById('viewToggleGroup'),
    categoryFilterGroup: document.getElementById('categoryFilterGroup'),
    categoryFilter: document.getElementById('categoryFilter'),
    envFilterGroup: document.getElementById('envFilterGroup'),
    envFilter: document.getElementById('envFilter'),
    specialtyFilterGroup: document.getElementById('specialtyFilterGroup'),
    specialtyFilter: document.getElementById('specialtyFilter'),
    unlockFilterGroup: document.getElementById('unlockFilterGroup'),
    unlockFilter: document.getElementById('unlockFilter'),
    regionFilterGroup: document.getElementById('regionFilterGroup'),
    regionFilter: document.getElementById('regionFilter'),
    filterResultGroup: document.getElementById('filterResultGroup'),
    filterResultBadge: document.getElementById('filterResultBadge'),
    filterResultIcon: document.getElementById('filterResultIcon'),
    filterResultText: document.getElementById('filterResultText'),
    btnResetFilters: document.getElementById('btnResetFilters'),
    catalogProgressBadge: document.getElementById('catalogProgressBadge'),
    catalogBadgeIcon: document.getElementById('catalogBadgeIcon'),
    catalogBadgeText: document.getElementById('catalogBadgeText'),
    catalogDoneCount: document.getElementById('catalogDoneCount'),
    catalogTotalCount: document.getElementById('catalogTotalCount'),
    storageSection: document.getElementById('storageSection'),
    habitatSection: document.getElementById('habitatSection'),
    habitatCatalogSection: document.getElementById('habitatCatalogSection'),
    recipeSection: document.getElementById('recipeSection'),
    recipeCardGrid: document.getElementById('recipeCardGrid'),
    storageCardGrid: document.getElementById('storageCardGrid'),
    storageTableContainer: document.getElementById('storageTableContainer'),
    storageTableBody: document.getElementById('storageTableBody'),
    habitatCardGrid: document.getElementById('habitatCardGrid'),
    habitatTableContainer: document.getElementById('habitatTableContainer'),
    habitatTableBody: document.getElementById('habitatTableBody'),
    habitatCatalogCardGrid: document.getElementById('habitatCatalogCardGrid'),
    habitatCatalogTableContainer: document.getElementById('habitatCatalogTableContainer'),
    habitatCatalogTableBody: document.getElementById('habitatCatalogTableBody'),
    catDoneCount: document.getElementById('catDoneCount'),
    pkmDoneCount: document.getElementById('pkmDoneCount'),
    pkmTotalCount: document.getElementById('pkmTotalCount'),
    habDoneCount: document.getElementById('habDoneCount'),
    habTotalCount: document.getElementById('habTotalCount'),
    pkmProgressBadge: document.getElementById('pkmProgressBadge'),
    habProgressBadge: document.getElementById('habProgressBadge'),
    emptyResult: document.getElementById('emptyResult'),
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxBackdrop: document.getElementById('lightboxBackdrop'),
    lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    floatingBackBtn: document.getElementById('floatingBackBtn'),
    floatingBackText: document.getElementById('floatingBackText'),
    pkmDetailModal: document.getElementById('pkmDetailModal'),
    pkmDetailBackdrop: document.getElementById('pkmDetailBackdrop'),
    pkmDetailCloseBtn: document.getElementById('pkmDetailCloseBtn'),
    pkmDetailAvatar: document.getElementById('pkmDetailAvatar'),
    pkmDetailNumber: document.getElementById('pkmDetailNumber'),
    pkmDetailName: document.getElementById('pkmDetailName'),
    pkmDetailCategory: document.getElementById('pkmDetailCategory'),
    pkmDetailForm: document.getElementById('pkmDetailForm'),
    pkmDetailBody: document.getElementById('pkmDetailBody'),
    csHeaderRow: document.getElementById('csHeaderRow'),
    csTitle: document.getElementById('csTitle'),
    csBadgeText: document.getElementById('csBadgeText'),
    tabRegionMap: document.getElementById('tabRegionMap'),
    regionMapSection: document.getElementById('regionMapSection'),
    regionMapContainer: document.getElementById('regionMapContainer'),
    regionPkmAssignModal: document.getElementById('regionPkmAssignModal'),
    regionPkmBackdrop: document.getElementById('regionPkmBackdrop'),
    regionPkmCloseBtn: document.getElementById('regionPkmCloseBtn'),
    regionPkmTargetBadge: document.getElementById('regionPkmTargetBadge'),
    regionPkmModalTitle: document.getElementById('regionPkmModalTitle'),
    regionPkmSearchInput: document.getElementById('regionPkmSearchInput'),
    regionPkmCandidateList: document.getElementById('regionPkmCandidateList')
  };

  // 官方口味集合 (用於純文字喜好標籤柔和色系微區分，絕無 emoji)
  const TASTE_SET = new Set(['甜甜的', '酸酸的', '辣辣的', '苦苦的', '澀澀的', '平淡無奇的', '多滋味']);

  // 渲染純文字喜好藥丸標籤 (純文字無圖標，粉暖色為口味、冷藍色為特徵)
  function renderPrefPill(f) {
    if (!f) return '';
    const isTaste = TASTE_SET.has(f);
    const pillClass = isTaste ? 'pref-pill pref-pill-taste' : 'pref-pill pref-pill-thing';
    const typeLabel = isTaste ? '口味' : '特徵';
    return `<span class="${pillClass}" data-fav="${escapeHTML(f)}" data-fav-type="${isTaste ? 'taste' : 'thing'}" title="點擊在喜好百科查看「${escapeHTML(f)}」(${typeLabel})">${escapeHTML(f)}</span>`;
  }

  // Theme Management (Default to Harmony Light Theme)
  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    } catch (e) {}
    return 'light'; // 預設為和諧亮色模式
  }

  function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {}

    if (DOM.btnThemeToggle) {
      if (theme === 'dark') {
        DOM.btnThemeToggle.innerHTML = '<span class="theme-toggle-icon">🌙</span>';
        DOM.btnThemeToggle.title = '點擊切換為亮色模式';
        DOM.btnThemeToggle.setAttribute('aria-label', '點擊切換為亮色模式');
      } else {
        DOM.btnThemeToggle.innerHTML = '<span class="theme-toggle-icon">☀️</span>';
        DOM.btnThemeToggle.title = '點擊切換為暗色模式';
        DOM.btnThemeToggle.setAttribute('aria-label', '點擊切換為暗色模式');
      }
    }
  }

  // Navigation State Persistence (URL Hash 絕對第一優先權 + LocalStorage 回退)
  function getInitialNavState() {
    const validTabs = ['storage', 'habitat', 'habitatCatalog', 'recipe', 'preferences', 'autofarm', 'customStorage', 'regionMap', 'video', 'buzz3d'];
    const validViews = ['card', 'table'];

    let tab = null;
    let view = null;
    let targetId = null;

    // 1. 嚴格優先讀取 URL Hash (如 #habitatCatalog-table 或 #customStorage-card 或 #video-card 或 #buzz3d-card)
    try {
      const hash = (window.location.hash || '').replace(/^#/, '');
      if (hash) {
        const parts = hash.split('-');
        if (validTabs.includes(parts[0])) {
          tab = parts[0];
          // 專屬安全攔截：未授權使用者直接輸入 #autofarm, #customStorage, #video 或 #buzz3d 時強制跳轉回首頁
          if ((tab === 'autofarm' || tab === 'customStorage' || tab === 'video' || tab === 'buzz3d') && !isAutoFarmAuthorized()) {
            tab = 'habitat';
            try {
              if (window.location.hash.includes('autofarm') || window.location.hash.includes('customStorage') || window.location.hash.includes('video') || window.location.hash.includes('buzz3d')) {
                history.replaceState(null, '', '#habitat-table');
              }
            } catch (e) {}
          }
        }
        if (parts[1] && validViews.includes(parts[1])) {
          view = parts[1];
        }
        if (parts.length >= 3) {
          targetId = parts.slice(2).join('-');
        }
      }
    } catch (e) {}

    // 2. 僅在 URL Hash 未指定時才回退至 LocalStorage
    if (!tab) {
      try {
        const savedTab = localStorage.getItem(STORAGE_KEY_NAV_TAB);
        if (savedTab && validTabs.includes(savedTab)) {
          tab = savedTab;
        }
      } catch (e) {}
    }
    if (!view) {
      try {
        const savedView = localStorage.getItem(STORAGE_KEY_NAV_VIEW);
        if (savedView && validViews.includes(savedView)) {
          view = savedView;
        }
      } catch (e) {}
    }

    return {
      tab: tab || 'habitat',
      view: view || 'table',
      targetId: targetId || null
    };
  }

  function pushNavHistory(customState = {}) {
    const tab = customState.tab || state.currentTab;
    const view = customState.view || state.currentView;
    const targetId = customState.targetId || null;
    const targetType = customState.targetType || null; // 'pokemon' | 'habitat'
    const modal = customState.modal || null;
    const pkmId = customState.pkmId || null;
    const pkmName = customState.pkmName || null;
    const targetHash = `#${tab}-${view}${targetId ? `-${targetId}` : ''}`;

    try {
      localStorage.setItem(STORAGE_KEY_NAV_TAB, tab);
      localStorage.setItem(STORAGE_KEY_NAV_VIEW, view);
    } catch (e) {}

    try {
      const stateObj = { tab, view, targetId, targetType, modal, pkmId, pkmName, timestamp: Date.now() };
      if (window.location.hash !== targetHash) {
        history.pushState(stateObj, '', targetHash);
      } else {
        history.replaceState(stateObj, '', targetHash);
      }
    } catch (e) {}
  }

  function syncNavStateToURLAndStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_NAV_TAB, state.currentTab);
      localStorage.setItem(STORAGE_KEY_NAV_VIEW, state.currentView);
    } catch (e) {}

    try {
      const search = window.location.search || '';
      const targetHash = `${search}#${state.currentTab}-${state.currentView}`;
      if (window.location.hash !== `#${state.currentTab}-${state.currentView}`) {
        history.replaceState({ tab: state.currentTab, view: state.currentView }, '', targetHash);
      }
    } catch (e) {}
  }

  // Floating Back Button Helpers
  function showFloatingBackBtn(label, extra = {}) {
    if (!DOM.floatingBackBtn) return;
    if (DOM.floatingBackText) {
      DOM.floatingBackText.textContent = label ? (label.startsWith('返回') ? label : `返回 ${label}`) : '返回上一頁';
    }
    const fields = ['returnTab', 'returnPkmId', 'returnPrefTab', 'returnHighlightItem', 'returnTargetId', 'returnTargetType', 'returnScrollY'];
    fields.forEach(field => {
      if (extra[field] !== undefined && extra[field] !== null) {
        DOM.floatingBackBtn.dataset[field] = extra[field];
      } else {
        delete DOM.floatingBackBtn.dataset[field];
      }
    });
    if (extra.returnPkmId) {
      DOM.floatingBackBtn.dataset.returnPkmId = extra.returnPkmId;
    }
    DOM.floatingBackBtn.classList.remove('hidden');
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('has-floating-back');
    }
  }

  function hideFloatingBackBtn() {
    if (!DOM.floatingBackBtn) return;
    DOM.floatingBackBtn.classList.add('hidden');
    const fields = ['returnTab', 'returnPkmId', 'returnPrefTab', 'returnHighlightItem', 'returnTargetId', 'returnTargetType', 'returnScrollY'];
    fields.forEach(field => delete DOM.floatingBackBtn.dataset[field]);
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('has-floating-back');
    }
  }

  // Helper: LocalStorage Loader & Saver
  function loadProgress(key, fallback = {}) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('Failed to load progress from LocalStorage:', e);
      return fallback;
    }
  }

  function saveProgress(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save progress to LocalStorage:', e);
    }

    // 若已登入 Google，自動觸發雲端 Firestore 防抖上傳
    const fb = window.PokopiaFirebase;
    if (fb && typeof fb.getCurrentUser === 'function') {
      const user = fb.getCurrentUser();
      if (user) {
        const snapshot = {
          catChecked:        state.catChecked        || {},
          pkmChecked:        state.pkmChecked        || {},
          habChecked:        state.habChecked        || {},
          benchOverrides:    state.benchOverrides    || {},
          autoFarmChecked:   state.autoFarmChecked   || {},
          customBoxes:       state.customBoxes       || [],
          customVideos:      state.customVideos      || [],
          customVideoTags:   state.customVideoTags   || [],
          deletedVideoTags:  state.deletedVideoTags  || [],
          regionAssignments: state.regionAssignments || {}
        };
        fb.debouncedSave(user.uid, snapshot);
      }
    }
  }

  // 同時寫 LocalStorage + Firestore（相容保留）
  function saveProgressWithCloud(key, data) {
    saveProgress(key, data);
  }

  // Helper: Crafting Bench Override Manager
  function getBenchVal(catId, subIdx, defaultVal) {
    const key = `${catId}_sub_${subIdx}`;
    if (state.benchOverrides && state.benchOverrides[key] !== undefined) {
      return state.benchOverrides[key];
    }
    return defaultVal || '';
  }

  function setBenchVal(catId, subIdx, newVal) {
    const key = `${catId}_sub_${subIdx}`;
    if (!state.benchOverrides) state.benchOverrides = {};
    state.benchOverrides[key] = newVal;
    saveProgress(STORAGE_KEY_BENCH, state.benchOverrides);
  }

  // Lightbox Handlers
  function openLightbox(src, caption) {
    if (!src) return;
    DOM.lightboxImg.src = src;
    DOM.lightboxCaption.innerHTML = caption || '';
    DOM.lightboxModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    DOM.lightboxModal.classList.add('hidden');
    DOM.lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  // Precise Target Scrolling (鎖定可見容器，具備短間隔重試確保動態 DOM 就緒)
  function scrollToTarget(type, id, retryCount = 0) {
    if (!id) return;
    setTimeout(() => {
      let targetEl = null;
      if (type === 'pokemon') {
        if (state.currentView === 'card') {
          targetEl = DOM.habitatCardGrid ? DOM.habitatCardGrid.querySelector(`.item-card[data-id="${id}"]`) : null;
        } else {
          targetEl = DOM.habitatTableBody ? DOM.habitatTableBody.querySelector(`tr[data-id="${id}"]`) : null;
        }
        if (!targetEl) {
          targetEl = document.querySelector(`.item-card[data-id="${id}"]`) || document.querySelector(`tr[data-id="${id}"]`);
        }
      } else if (type === 'habitat') {
        if (state.currentView === 'card') {
          targetEl = DOM.habitatCatalogCardGrid ? DOM.habitatCatalogCardGrid.querySelector(`.habitat-catalog-card[data-id="${id}"]`) : null;
        } else {
          targetEl = DOM.habitatCatalogTableBody ? DOM.habitatCatalogTableBody.querySelector(`tr[data-id="${id}"]`) : null;
        }
        if (!targetEl) {
          targetEl = document.querySelector(`.habitat-catalog-card[data-id="${id}"]`) || document.querySelector(`tr[data-id="${id}"]`);
        }
      }

      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetEl.classList.remove('highlight-target');
        void targetEl.offsetWidth; // 強制重繪
        targetEl.classList.add('highlight-target');
        setTimeout(() => targetEl.classList.remove('highlight-target'), 2600);
      } else if (retryCount < 2) {
        scrollToTarget(type, id, retryCount + 1);
      }
    }, retryCount === 0 ? 120 : 180);
  }

  // Bidirectional Navigation Helpers (支援上一頁/下一頁歷史堆疊與來源精準記憶)
  function jumpToHabitat(habId, pushHistory = true, sourcePkmId = null) {
    if (!habId) return;
    const fromTab = state.currentTab;
    const fromView = state.currentView;
    const currentScroll = window.scrollY || 0;

    if (pushHistory) {
      // 1. 先將跳轉前「當前寶可夢」位置與 scrollY 記錄到當前歷史節點中
      try {
        const fromHash = `#${fromTab}-${fromView}${sourcePkmId ? `-${sourcePkmId}` : ''}`;
        history.replaceState({
          tab: fromTab,
          view: fromView,
          targetId: sourcePkmId,
          targetType: 'pokemon',
          scrollY: currentScroll
        }, '', fromHash);
      } catch (e) {}

      // 2. 推入目標棲息地節點
      pushNavHistory({
        tab: 'habitatCatalog',
        view: state.currentView,
        targetId: habId,
        targetType: 'habitat'
      });
    }

    state.selectedEnvFilter = 'env-all';
    state.selectedHabCategory = 'all';
    state.searchQuery = '';
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.envFilter) DOM.envFilter.value = 'env-all';
    if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';

    switchTab('habitatCatalog', true);
    scrollToTarget('habitat', habId);
    showFloatingBackBtn('寶可夢圖鑑', {
      returnTab: fromTab || 'habitat',
      returnTargetId: sourcePkmId,
      returnTargetType: 'pokemon',
      returnScrollY: currentScroll
    });
  }

  function jumpToPokemon(pkmId, pushHistory = true, sourceHabId = null) {
    if (!pkmId) return;
    const fromTab = state.currentTab;
    const fromView = state.currentView;
    const currentScroll = window.scrollY || 0;

    if (pushHistory) {
      // 1. 先將跳轉前「當前棲息地」位置與 scrollY 記錄到當前歷史節點中
      try {
        const fromHash = `#${fromTab}-${fromView}${sourceHabId ? `-${sourceHabId}` : ''}`;
        history.replaceState({
          tab: fromTab,
          view: fromView,
          targetId: sourceHabId,
          targetType: 'habitat',
          scrollY: currentScroll
        }, '', fromHash);
      } catch (e) {}

      // 2. 推入目標寶可夢節點
      pushNavHistory({
        tab: 'habitat',
        view: state.currentView,
        targetId: pkmId,
        targetType: 'pokemon'
      });
    }

    state.selectedEnvFilter = 'env-all';
    state.selectedSpecialtyFilter = 'all';
    state.selectedPkmCategory = 'all';
    state.searchQuery = '';
    state.isStaggerAnim = false; // 定向跳轉保護：零延遲立即顯現
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.specialtyFilter) DOM.specialtyFilter.value = 'all';
    if (DOM.envFilter) DOM.envFilter.value = 'env-all';
    if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';

    switchTab('habitat', true);
    scrollToTarget('pokemon', pkmId);
    showFloatingBackBtn('棲息地總覽', {
      returnTab: fromTab || 'habitatCatalog',
      returnTargetId: sourceHabId,
      returnTargetType: 'habitat',
      returnScrollY: currentScroll
    });
  }

  // 自適應搜尋框提示文字 (避免窄螢幕時文字過長被擠壓)
  function updateResponsivePlaceholders() {
    if (!DOM.searchInput) return;
    if (window.innerWidth <= 768) {
      DOM.searchInput.placeholder = '搜尋物品、寶可夢、棲息地、傢俱...';
    } else {
      DOM.searchInput.placeholder = '搜尋物品名稱、分類、寶可夢、棲息地或傢俱 (如: 樹枝, 綠意長椅, 妙蛙種子)...';
    }
  }

  // 右下角「回頂部」懸浮按鈕監聽 (一鍵滑順回頂端，不強奪焦點)
  function initScrollTopButton() {
    if (!DOM.btnScrollTop) return;

    function checkScrollTopVisibility() {
      const scrollY = window.scrollY || 0;
      if (scrollY > 300) {
        DOM.btnScrollTop.classList.remove('hidden');
      } else {
        DOM.btnScrollTop.classList.add('hidden');
      }

      // 檢查是否同時存在浮動返回按鈕，動態調整層疊位置
      if (DOM.floatingBackBtn && !DOM.floatingBackBtn.classList.contains('hidden')) {
        document.body.classList.add('has-floating-back');
      } else {
        document.body.classList.remove('has-floating-back');
      }
    }

    window.addEventListener('scroll', checkScrollTopVisibility, { passive: true });

    DOM.btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Initialize App
  function init() {
    applyTheme(state.currentTheme);
    initSpecialtyDropdown();
    bindEvents();
    initRegionMapEvents();
    initVideoEvents();
    renderStats();
    updateAutoFarmAuthUI();
    initScrollTopButton();

    // Restore saved navigation state (tab & view mode)
    switchTab(state.currentTab, true);
    switchView(state.currentView, true);
    syncNavStateToURLAndStorage();

    // 視窗自適應 Placeholder，防窄螢幕擠壓
    updateResponsivePlaceholders();
    window.addEventListener('resize', updateResponsivePlaceholders);

    // Listen to popstate & hashchange for browser forward/back navigation
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // URL 參數即時展開支援 (便利無障礙深層連結與自動化視覺驗證)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('openToc')) {
        toggleTocDropdown(true);
      }
      if (urlParams.has('openFilter')) {
        openMobileFilterDrawer();
        if (DOM.filterDrawerWrapper) {
          DOM.filterDrawerWrapper.style.transition = 'none';
          const panel = DOM.filterDrawerWrapper.querySelector('.filter-drawer-panel');
          if (panel) {
            panel.style.transition = 'none';
            panel.style.transform = 'translateY(0)';
          }
        }
      }
    } catch (e) {}

    // ─── Firebase 初始化 + Google 登入整合 ──────────────────────────────
    const fb = window.PokopiaFirebase;
    if (fb) {
      const btnSignIn = document.getElementById('btnGoogleSignIn');
      if (btnSignIn) {
        btnSignIn.addEventListener('click', function () { fb.signInWithGoogle(); });
      }
      const btnSignOutEl = document.getElementById('btnSignOut');
      if (btnSignOutEl) {
        btnSignOutEl.addEventListener('click', function () {
          try { localStorage.removeItem(STORAGE_KEY_AUTOFARM_AUTHED); } catch (e) {}
          fb.signOut();
        });
      }

      // 點擊頭像登出
      const elAvatarClick = document.getElementById('authUserAvatar');
      if (elAvatarClick) {
        elAvatarClick.addEventListener('click', function () {
          const user = fb.getCurrentUser();
          const name = (user && (user.displayName || user.email)) || '目前使用者';
          if (confirm('確定要登出 Google 帳號（' + name + '）嗎？')) {
            try { localStorage.removeItem(STORAGE_KEY_AUTOFARM_AUTHED); } catch (e) {}
            fb.signOut();
          }
        });
      }

      fb.onAuthChange(async function (user) {
        const elSignIn   = document.getElementById('btnGoogleSignIn');
        const elUserInfo = document.getElementById('authUserInfo');
        const elAvatar   = document.getElementById('authUserAvatar');
        const elName     = document.getElementById('authUserName');
        const elSync     = document.getElementById('authSyncStatus');

        if (user) {
          if (elSignIn)   elSignIn.classList.add('hidden');
          if (elUserInfo) elUserInfo.classList.remove('hidden');
          const displayName = user.displayName || user.email || '使用者';
          if (elAvatar)   {
            elAvatar.src = user.photoURL || '';
            elAvatar.title = displayName + '（點擊登出）';
            elAvatar.setAttribute('aria-label', displayName + '（點擊登出）');
          }
          if (elName)     elName.textContent = displayName;
          if (elSync)     elSync.classList.remove('hidden');

          const cloudData = await fb.loadCloudProgress(user.uid);
          const localSnapshot = {
            catChecked:        state.catChecked        || {},
            pkmChecked:        state.pkmChecked        || {},
            habChecked:        state.habChecked        || {},
            benchOverrides:    state.benchOverrides    || {},
            autoFarmChecked:   state.autoFarmChecked   || {},
            customBoxes:       state.customBoxes       || [],
            customVideos:      state.customVideos      || [],
            customVideoTags:   state.customVideoTags   || [],
            deletedVideoTags:  state.deletedVideoTags  || [],
            regionAssignments: state.regionAssignments || (typeof getRegionAssignments === 'function' ? getRegionAssignments() : {})
          };
          const merged = fb.mergeProgressUnion(localSnapshot, cloudData);

          state.catChecked      = merged.catChecked      || {};
          state.pkmChecked      = merged.pkmChecked      || {};
          state.habChecked      = merged.habChecked      || {};
          state.benchOverrides  = merged.benchOverrides  || {};
          state.autoFarmChecked = merged.autoFarmChecked || {};
          if (merged.customBoxes && Array.isArray(merged.customBoxes)) {
            state.customBoxes   = merged.customBoxes;
          }
          if (merged.regionAssignments && typeof merged.regionAssignments === 'object') {
            state.regionAssignments = merged.regionAssignments;
            try {
              localStorage.setItem('pokopia_region_assignments', JSON.stringify(state.regionAssignments));
            } catch (e) {}
          }
          if (merged.customVideos && Array.isArray(merged.customVideos)) {
            state.customVideos = merged.customVideos;
          }
          if (merged.customVideoTags && Array.isArray(merged.customVideoTags)) {
            state.customVideoTags = merged.customVideoTags;
          }
          if (merged.deletedVideoTags && Array.isArray(merged.deletedVideoTags)) {
            const currentDels = new Set(state.deletedVideoTags || []);
            merged.deletedVideoTags.forEach(t => currentDels.add(t));
            state.deletedVideoTags = Array.from(currentDels);
          }
          if (merged.deletedVideoIds && Array.isArray(merged.deletedVideoIds)) {
            const currentDelIds = new Set(state.deletedVideoIds || []);
            merged.deletedVideoIds.forEach(id => currentDelIds.add(id));
            state.deletedVideoIds = Array.from(currentDelIds);
          }
          saveProgress(STORAGE_KEY_CAT,            state.catChecked);
          saveProgress(STORAGE_KEY_PKM,            state.pkmChecked);
          saveProgress(STORAGE_KEY_HAB,            state.habChecked);
          saveProgress(STORAGE_KEY_BENCH,          state.benchOverrides);
          saveProgress(STORAGE_KEY_AUTOFARM,       state.autoFarmChecked);
          saveProgress(STORAGE_KEY_CUSTOM_STORAGE, state.customBoxes);
          saveProgress(STORAGE_KEY_CUSTOM_VIDEOS,  state.customVideos);
          saveProgress(STORAGE_KEY_CUSTOM_VIDEO_TAGS, state.customVideoTags);
          saveProgress(STORAGE_KEY_DELETED_VIDEO_TAGS, state.deletedVideoTags);
          saveProgress(STORAGE_KEY_DELETED_VIDEO_IDS, state.deletedVideoIds);

          await fb.saveCloudProgress(user.uid, merged);
          if (elSync) elSync.classList.add('hidden');
          updateAutoFarmAuthUI(user);
          renderAll();
          renderStats();
          if (state.currentTab === 'customStorage') renderCustomStorage();
          if (state.currentTab === 'regionMap') renderRegionMap();
          if (state.currentTab === 'video') renderVideoSection();

          // ─── 多裝置實時雙向監聽 (Real-time Sync) ─────────────────
          fb.subscribeCloudProgress(user.uid, function (remoteData, hasPendingWrites) {
            if (hasPendingWrites || !remoteData) return;
            const currentSnap = {
              catChecked:        state.catChecked        || {},
              pkmChecked:        state.pkmChecked        || {},
              habChecked:        state.habChecked        || {},
              benchOverrides:    state.benchOverrides    || {},
              autoFarmChecked:   state.autoFarmChecked   || {},
              customBoxes:       state.customBoxes       || [],
              customVideos:      state.customVideos      || [],
              customVideoTags:   state.customVideoTags   || [],
              deletedVideoTags:  state.deletedVideoTags  || [],
              deletedVideoIds:   state.deletedVideoIds   || [],
              regionAssignments: state.regionAssignments || (typeof getRegionAssignments === 'function' ? getRegionAssignments() : {})
            };
            const updated = fb.mergeProgressUnion(currentSnap, remoteData);
            const isChanged = JSON.stringify(state.pkmChecked) !== JSON.stringify(updated.pkmChecked) ||
                              JSON.stringify(state.catChecked) !== JSON.stringify(updated.catChecked) ||
                              JSON.stringify(state.habChecked) !== JSON.stringify(updated.habChecked) ||
                              JSON.stringify(state.autoFarmChecked) !== JSON.stringify(updated.autoFarmChecked) ||
                              JSON.stringify(state.customBoxes) !== JSON.stringify(updated.customBoxes) ||
                              !areVideoListsEqual(state.customVideos, updated.customVideos) ||
                              JSON.stringify(state.customVideoTags) !== JSON.stringify(updated.customVideoTags) ||
                              JSON.stringify(state.deletedVideoTags) !== JSON.stringify(updated.deletedVideoTags) ||
                              JSON.stringify(state.deletedVideoIds) !== JSON.stringify(updated.deletedVideoIds) ||
                              JSON.stringify(state.regionAssignments) !== JSON.stringify(updated.regionAssignments);
            if (isChanged) {
              state.catChecked      = updated.catChecked      || {};
              state.pkmChecked      = updated.pkmChecked      || {};
              state.habChecked      = updated.habChecked      || {};
              state.benchOverrides  = updated.benchOverrides  || {};
              state.autoFarmChecked = updated.autoFarmChecked || {};
              if (updated.customBoxes && Array.isArray(updated.customBoxes)) {
                state.customBoxes   = updated.customBoxes;
              }
              if (updated.customVideos && Array.isArray(updated.customVideos)) {
                state.customVideos  = updated.customVideos;
              }
              if (updated.customVideoTags && Array.isArray(updated.customVideoTags)) {
                state.customVideoTags = updated.customVideoTags;
              }
              if (updated.deletedVideoTags && Array.isArray(updated.deletedVideoTags)) {
                state.deletedVideoTags = updated.deletedVideoTags;
              }
              if (updated.deletedVideoIds && Array.isArray(updated.deletedVideoIds)) {
                state.deletedVideoIds = updated.deletedVideoIds;
              }
              if (updated.regionAssignments && typeof updated.regionAssignments === 'object') {
                state.regionAssignments = updated.regionAssignments;
                try {
                  localStorage.setItem('pokopia_region_assignments', JSON.stringify(state.regionAssignments));
                } catch (e) {}
              }
              try {
                localStorage.setItem(STORAGE_KEY_CAT,            JSON.stringify(state.catChecked));
                localStorage.setItem(STORAGE_KEY_PKM,            JSON.stringify(state.pkmChecked));
                localStorage.setItem(STORAGE_KEY_HAB,            JSON.stringify(state.habChecked));
                localStorage.setItem(STORAGE_KEY_BENCH,          JSON.stringify(state.benchOverrides));
                localStorage.setItem(STORAGE_KEY_AUTOFARM,       JSON.stringify(state.autoFarmChecked));
                localStorage.setItem(STORAGE_KEY_CUSTOM_STORAGE, JSON.stringify(state.customBoxes));
                localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEOS,  JSON.stringify(state.customVideos));
                localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEO_TAGS, JSON.stringify(state.customVideoTags));
                localStorage.setItem(STORAGE_KEY_DELETED_VIDEO_TAGS, JSON.stringify(state.deletedVideoTags));
                localStorage.setItem(STORAGE_KEY_DELETED_VIDEO_IDS, JSON.stringify(state.deletedVideoIds));
              } catch (e) {}
              renderStats();
              if (state.currentTab === 'customStorage') {
                renderCustomStorage();
              } else if (state.currentTab === 'regionMap') {
                renderRegionMap();
              } else if (state.currentTab === 'video') {
                renderVideoCards();
                renderVideoTags();
                const active = getActiveVideo();
                if (active) renderTheaterPlayer(active);
              } else {
                renderAll();
              }
            }
          });

        } else {
          if (elSignIn)   elSignIn.classList.remove('hidden');
          if (elUserInfo) elUserInfo.classList.add('hidden');
          if (elSync)     elSync.classList.add('hidden');
          updateAutoFarmAuthUI(null);
        }
      });

      fb.init();
    }
  }

  function handlePopState(e) {
    const navState = e.state;
    if (navState && navState.tab) {
      switchTab(navState.tab, true, navState.scrollY);
      if (navState.view && navState.view !== state.currentView) {
        switchView(navState.view, true);
      }
      if (navState.modal === 'pokemonDetail' && navState.pkmId) {
        // 彈窗與底層雙重同步：底層先對齊該寶可夢卡片，同時打開彈窗
        scrollToTarget('pokemon', navState.pkmId);
        openPkmDetailModal(navState.pkmId);
        hideFloatingBackBtn();
      } else if (navState.targetId && navState.targetType) {
        closePkmDetailModal();
        scrollToTarget(navState.targetType, navState.targetId);
        showFloatingBackBtn(navState.targetType === 'pokemon' ? '棲息地總覽' : '寶可夢圖鑑');
      } else if (navState.highlightItem) {
        closePkmDetailModal();
        if (navState.prefTab) state.prefTab = navState.prefTab;
        if (typeof scrollHighlightItem === 'function') {
          scrollHighlightItem(navState.highlightItem);
        }
        hideFloatingBackBtn();
      } else {
        closePkmDetailModal();
        hideFloatingBackBtn();
        if (typeof navState.scrollY === 'number' && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
          if (typeof setTimeout === 'function') {
            setTimeout(() => {
              if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                window.scrollTo({ top: navState.scrollY, behavior: 'instant' });
              }
            }, 40);
          } else {
            window.scrollTo({ top: navState.scrollY, behavior: 'instant' });
          }
        }
      }
    } else {
      closePkmDetailModal();
      handleHashChange();
    }
  }

  function handleHashChange() {
    const nav = getInitialNavState();
    if (nav.tab !== state.currentTab) {
      switchTab(nav.tab, true);
    }
    if (nav.view !== state.currentView) {
      switchView(nav.view, true);
    }
    if (nav.targetId) {
      const type = nav.tab === 'habitat' ? 'pokemon' : (nav.tab === 'habitatCatalog' ? 'habitat' : null);
      if (type) {
        scrollToTarget(type, nav.targetId);
        showFloatingBackBtn(type === 'pokemon' ? '棲息地總覽' : '寶可夢圖鑑');
      }
    } else {
      hideFloatingBackBtn();
    }
  }

  // Populate Specialty Filter Dropdown (33 Official Specialties from 52poke)
  function initSpecialtyDropdown() {
    if (!DOM.specialtyFilter) return;
    const pokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
    const counts = {};
    pokemons.forEach(p => {
      const specs = p.specialties || p.abilities || [];
      specs.forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });

    const sortedSpecs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    let html = '<option value="all">全部 (33)</option>';
    sortedSpecs.forEach(s => {
      const icon = SPECIALTY_ICONS[s] || '⭐';
      html += `<option value="${escapeHTML(s)}">${icon} ${escapeHTML(s)} (${counts[s]})</option>`;
    });
    DOM.specialtyFilter.innerHTML = html;
  }

  // TOC 目次選單 (Popover) 控制函數
  function toggleTocDropdown(show) {
    if (!DOM.tocDropdown) return;
    const isCurrentlyOpen = !DOM.tocDropdown.classList.contains('hidden');
    const targetState = typeof show === 'boolean' ? show : !isCurrentlyOpen;
    if (targetState) {
      DOM.tocDropdown.classList.remove('hidden');
      if (DOM.btnTocMenu) DOM.btnTocMenu.setAttribute('aria-expanded', 'true');
    } else {
      DOM.tocDropdown.classList.add('hidden');
      if (DOM.btnTocMenu) DOM.btnTocMenu.setAttribute('aria-expanded', 'false');
    }
  }

  function closeTocDropdown() {
    toggleTocDropdown(false);
  }

  // Event Binding
  function bindEvents() {
    // TOC 目次按鈕開關與點選外部關閉
    if (DOM.btnTocMenu) {
      DOM.btnTocMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTocDropdown();
      });
    }

    // 風速狗 Logo 點擊完整回歸首頁（寶可夢圖鑑 ‧ 表格視窗）
    const brandLogo = document.getElementById('brandLogo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. 清空搜尋框與重設所有篩選狀態
        if (DOM.searchInput) DOM.searchInput.value = '';
        state.searchQuery = '';
        state.selectedPkmCategory = 'all';
        state.selectedEnvFilter = 'env-all';
        state.selectedSpecialtyFilter = 'all';
        state.selectedUnlockFilter = 'all';
        state.selectedRegionFilter = 'all';
        if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
        if (DOM.envFilter) DOM.envFilter.value = 'env-all';
        if (DOM.specialtyFilter) DOM.specialtyFilter.value = 'all';
        if (DOM.unlockFilter) DOM.unlockFilter.value = 'all';
        if (DOM.regionFilter) DOM.regionFilter.value = 'all';

        // 2. 切換至首頁（寶可夢圖鑑 + 表格視窗）
        closeTocDropdown();
        switchTab('habitat', true);
        switchView('table', true);
        pushNavHistory({ tab: 'habitat', view: 'table' });
        hideFloatingBackBtn();

        // 3. 重新渲染畫面並平滑滾動至最頂端
        renderAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    document.addEventListener('click', (e) => {
      if (DOM.tocDropdown && !DOM.tocDropdown.classList.contains('hidden')) {
        if (!DOM.tocDropdown.contains(e.target) && (!DOM.btnTocMenu || !DOM.btnTocMenu.contains(e.target))) {
          closeTocDropdown();
        }
      }
    });

    // Tab switching (推入瀏覽器歷史堆疊並自動收合目次選單)
    DOM.tabStorage.addEventListener('click', () => {
      closeTocDropdown();
      switchTab('storage', true);
      pushNavHistory({ tab: 'storage' });
      hideFloatingBackBtn();
    });
    DOM.tabHabitat.addEventListener('click', () => {
      closeTocDropdown();
      switchTab('habitat', true);
      pushNavHistory({ tab: 'habitat' });
      hideFloatingBackBtn();
    });
    DOM.tabHabitatCatalog.addEventListener('click', () => {
      closeTocDropdown();
      switchTab('habitatCatalog', true);
      pushNavHistory({ tab: 'habitatCatalog' });
      hideFloatingBackBtn();
    });

    if (DOM.tabRecipe) {
      DOM.tabRecipe.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('recipe', true);
        pushNavHistory({ tab: 'recipe' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabPreferences) {
      DOM.tabPreferences.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('preferences', true);
        pushNavHistory({ tab: 'preferences' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabAutoFarm) {
      DOM.tabAutoFarm.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('autofarm', true);
        pushNavHistory({ tab: 'autofarm' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.btnAutoFarmNav) {
      DOM.btnAutoFarmNav.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('autofarm', true);
        pushNavHistory({ tab: 'autofarm' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabCustomStorage) {
      DOM.tabCustomStorage.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('customStorage', true);
        pushNavHistory({ tab: 'customStorage' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabRegionMap) {
      DOM.tabRegionMap.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('regionMap', true);
        pushNavHistory({ tab: 'regionMap' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabVideo) {
      DOM.tabVideo.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('video', true);
        pushNavHistory({ tab: 'video' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.tabBuzz3d) {
      DOM.tabBuzz3d.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('buzz3d', true);
        pushNavHistory({ tab: 'buzz3d' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.btnCustomStorageNav) {
      DOM.btnCustomStorageNav.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('customStorage', true);
        pushNavHistory({ tab: 'customStorage' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.btnVideoNav) {
      DOM.btnVideoNav.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('video', true);
        pushNavHistory({ tab: 'video' });
        hideFloatingBackBtn();
      });
    }

    if (DOM.btnBuzz3dNav) {
      DOM.btnBuzz3dNav.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('buzz3d', true);
        pushNavHistory({ tab: 'buzz3d' });
        hideFloatingBackBtn();
      });
    }

    // 3D 藍圖次級角色切換與妙蛙種子工作台事件綁定
    if (DOM.btnSubBuzz) {
      DOM.btnSubBuzz.addEventListener('click', () => switchCharacterBlueprint('buzz'));
    }
    if (DOM.btnSubBulba) {
      DOM.btnSubBulba.addEventListener('click', () => switchCharacterBlueprint('bulba'));
    }
    if (DOM.btnBulbaModeFull) {
      DOM.btnBulbaModeFull.addEventListener('click', () => switchBulba3DMode('full'));
    }
    if (DOM.btnBulbaModeSlice) {
      DOM.btnBulbaModeSlice.addEventListener('click', () => switchBulba3DMode('slice'));
    }
    if (DOM.btnBulbaPrevLayer) {
      DOM.btnBulbaPrevLayer.addEventListener('click', () => setBulbaLayer(bulbaState.curLayer - 1));
    }
    if (DOM.btnBulbaNextLayer) {
      DOM.btnBulbaNextLayer.addEventListener('click', () => setBulbaLayer(bulbaState.curLayer + 1));
    }
    if (DOM.bulbaLayerSlider) {
      DOM.bulbaLayerSlider.addEventListener('input', (e) => setBulbaLayer(Number(e.target.value)));
    }

    // View mode switching
    DOM.btnCardView.addEventListener('click', () => {
      switchView('card', true);
      pushNavHistory({ view: 'card' });
    });
    DOM.btnTableView.addEventListener('click', () => {
      switchView('table', true);
      pushNavHistory({ view: 'table' });
    });

    // Floating Back Button Click (一鍵返回上一個頁面 / 項目)
    if (DOM.floatingBackBtn) {
      DOM.floatingBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const returnTab = DOM.floatingBackBtn.dataset.returnTab;
        const returnPkmId = DOM.floatingBackBtn.dataset.returnPkmId;
        const returnHighlightItem = DOM.floatingBackBtn.dataset.returnHighlightItem;
        const returnPrefTab = DOM.floatingBackBtn.dataset.returnPrefTab;
        const returnTargetId = DOM.floatingBackBtn.dataset.returnTargetId;
        const returnTargetType = DOM.floatingBackBtn.dataset.returnTargetType;
        const returnScrollY = DOM.floatingBackBtn.dataset.returnScrollY ? parseInt(DOM.floatingBackBtn.dataset.returnScrollY, 10) : null;

        if (returnPkmId) {
          // 確定性直連保險：切回原分頁、底層對齊卡片並彈出卡片
          if (returnTab) switchTab(returnTab, true, returnScrollY);
          scrollToTarget('pokemon', returnPkmId);
          openPkmDetailModal(returnPkmId);
          hideFloatingBackBtn();
          return;
        }

        if (returnHighlightItem) {
          if (returnTab) switchTab(returnTab, true, returnScrollY);
          if (returnPrefTab) state.prefTab = returnPrefTab;
          if (typeof scrollHighlightItem === 'function') {
            scrollHighlightItem(returnHighlightItem);
          }
          hideFloatingBackBtn();
          return;
        }

        if (returnTargetId && returnTargetType) {
          if (returnTab) switchTab(returnTab, true, returnScrollY);
          scrollToTarget(returnTargetType, returnTargetId);
          hideFloatingBackBtn();
          return;
        }

        if (returnTab && returnScrollY !== null) {
          switchTab(returnTab, true, returnScrollY);
          hideFloatingBackBtn();
          return;
        }

        if (window.history.length > 1) {
          window.history.back();
        } else {
          switchTab(returnTab || 'habitatCatalog', true, returnScrollY);
          pushNavHistory({ tab: returnTab || 'habitatCatalog' });
          hideFloatingBackBtn();
        }
      });
    }

    // Theme Switcher
    if (DOM.btnThemeToggle) {
      DOM.btnThemeToggle.addEventListener('click', () => {
        const nextTheme = state.currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
      });
    }

    // Search Input (打字即時回饋，零階梯延遲)
    DOM.searchInput.addEventListener('input', (e) => {
      state.isStaggerAnim = false;
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderAll();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      state.isStaggerAnim = true;
      DOM.searchInput.value = '';
      state.searchQuery = '';
      renderAll();
    });

    // Unified Single-Row Select Dropdowns (選單切換時套用微瀑布進場動效)
    if (DOM.categoryFilter) {
      DOM.categoryFilter.addEventListener('change', (e) => {
        state.isStaggerAnim = true;
        if (state.currentTab === 'habitat') {
          state.selectedPkmCategory = e.target.value;
        } else if (state.currentTab === 'habitatCatalog') {
          state.selectedHabCategory = e.target.value;
        }
        renderAll();
      });
    }

    if (DOM.envFilter) {
      DOM.envFilter.addEventListener('change', (e) => {
        state.isStaggerAnim = true;
        state.selectedEnvFilter = e.target.value;
        renderAll();
      });
    }

    if (DOM.specialtyFilter) {
      DOM.specialtyFilter.addEventListener('change', (e) => {
        state.isStaggerAnim = true;
        state.selectedSpecialtyFilter = e.target.value;
        renderAll();
      });
    }

    if (DOM.unlockFilter) {
      DOM.unlockFilter.addEventListener('change', (e) => {
        state.isStaggerAnim = true;
        state.selectedUnlockFilter = e.target.value;
        renderAll();
      });
    }

    if (DOM.regionFilter) {
      DOM.regionFilter.addEventListener('change', (e) => {
        state.isStaggerAnim = true;
        state.selectedRegionFilter = e.target.value;
        renderAll();
      });
    }

    if (DOM.btnResetFilters) {
      DOM.btnResetFilters.addEventListener('click', resetPokemonFilters);
    }

    // 喜好百科入口按鈕切換
    if (DOM.btnPrefDrawer) {
      DOM.btnPrefDrawer.addEventListener('click', () => {
        closeTocDropdown();
        switchTab('preferences', true);
        pushNavHistory({ tab: 'preferences' });
        hideFloatingBackBtn();
      });
    }
    if (DOM.prefDrawerCloseBtn) {
      DOM.prefDrawerCloseBtn.addEventListener('click', closePrefDrawer);
    }
    if (DOM.prefDrawerBackdrop) {
      DOM.prefDrawerBackdrop.addEventListener('click', closePrefDrawer);
    }

    // 喜好百科 4 大子分頁切換
    document.querySelectorAll('.pref-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetTab = btn.dataset.prefTab;
        if (targetTab) {
          state.prefTab = targetTab;
          document.querySelectorAll('.pref-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          renderPrefDrawerContent();
        }
      });
    });

    // 喜好百科搜尋框即時過濾
    if (DOM.prefDrawerSearch) {
      DOM.prefDrawerSearch.addEventListener('input', (e) => {
        state.prefSearch = e.target.value;
        if (DOM.prefDrawerClearSearch) {
          DOM.prefDrawerClearSearch.classList.toggle('hidden', !state.prefSearch);
        }
        renderPrefDrawerContent();
      });
    }
    if (DOM.prefDrawerClearSearch) {
      DOM.prefDrawerClearSearch.addEventListener('click', () => {
        state.prefSearch = '';
        if (DOM.prefDrawerSearch) DOM.prefDrawerSearch.value = '';
        DOM.prefDrawerClearSearch.classList.add('hidden');
        renderPrefDrawerContent();
      });
    }

    // 喜好百科極速父層事件委派 (單一監聽器接管 2500+ 按鈕點擊，零遍歷消耗)
    if (DOM.prefDrawerBody) {
      DOM.prefDrawerBody.addEventListener('click', (e) => {
        // 1. 點擊道具方格
        const itemSlot = e.target.closest('.pref-item-slot');
        if (itemSlot) {
          e.stopPropagation();
          const itemName = itemSlot.dataset.itemName;
          if (!itemName) return;
          if (navigateItemToRecipe(itemName)) return;

          state.prefTab = 'items';
          document.querySelectorAll('.pref-tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.prefTab === 'items');
          });
          state.prefItemCat = 'all';
          state.prefSearch = '';
          if (DOM.prefDrawerSearch) DOM.prefDrawerSearch.value = '';
          const db = window.POKOPIA_PREFERENCES_DB;
          renderPrefDrawerItems(db ? (db.items || {}) : {}, '', itemName, db);
          return;
        }

        // 2. 點擊寶可夢方格或頭像 Chip
        const pkmSlot = e.target.closest('.pref-pkm-slot, .pref-pkm-chip');
        if (pkmSlot) {
          e.stopPropagation();
          const pkmId = pkmSlot.dataset.pkmId;
          const pkmName = pkmSlot.dataset.pkmName;
          const curScroll = window.scrollY || 0;
          const fromPrefTab = state.prefTab;
          if (pkmId) {
            jumpToPokemon(pkmId, true);
          } else if (pkmName) {
            const pokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
            const found = pokemons.find(p => p.name === pkmName);
            if (found) jumpToPokemon(found.id, true);
          }
          showFloatingBackBtn('喜好百科', {
            returnTab: 'preferences',
            returnPrefTab: fromPrefTab,
            returnScrollY: curScroll
          });
          return;
        }

        // 3. 點擊特徵或口味藥丸標籤
        const favChip = e.target.closest('.pref-fav-chip');
        if (favChip) {
          e.stopPropagation();
          const targetFav = favChip.dataset.fav;
          if (targetFav) {
            openPrefDrawer('things', targetFav);
          }
          return;
        }
      });
    }

    // 全域事件委派：點擊任一純文字喜好標籤或環境標籤，連動開啟右側喜好百科並定位！
    document.addEventListener('click', (e) => {
      // 1. 環境標籤跳轉（支援卡片、表格與彈窗中的所有環境屬性標籤）
      const envTag = e.target.closest('.tag-env, .env-pill, .pkm-pref-env-link');
      if (envTag) {
        e.stopPropagation();
        let rawEnv = envTag.dataset.env || envTag.textContent.trim();
        rawEnv = rawEnv.replace(/[☀️🔥💧🌵❄️🌙【】維度：]/g, '').trim();
        const matchEnv = ['明亮', '溫暖', '潮濕', '乾燥', '涼爽', '黑暗'].find(en => rawEnv.includes(en));
        const targetEnv = matchEnv || rawEnv;
        openPrefDrawer('environments', targetEnv, state.activeDetailPkm);
        return;
      }

      // 2. 喜好藥丸標籤與「查看全部」跳轉 (支援喜歡的東西、口味)
      const pill = e.target.closest('.pref-pill, .fav-pill, .taste-pill, .pkm-pref-thing-link, .pkm-pref-taste-link');
      if (pill) {
        e.stopPropagation();
        let fav = pill.dataset.fav || pill.textContent.trim();
        // 清理文字前綴與查看全部字樣
        fav = fav.replace(/^(喜歡的口味：|喜歡的東西：|🛋️\s*特徵風格：|特徵風格：)/, '').replace(/查看全部\s*↗?/, '').trim();
        if (!fav && pill.dataset.fav) fav = pill.dataset.fav.trim();
        if (!fav) return;
        const isTaste = TASTE_SET.has(fav) || pill.classList.contains('pkm-pref-taste-link') || pill.classList.contains('taste-pill');
        const targetTab = isTaste ? 'tastes' : 'things';
        openPrefDrawer(targetTab, fav, state.activeDetailPkm);
      }
    });

    // Lightbox Close Events
    DOM.lightboxCloseBtn.addEventListener('click', closeLightbox);
    DOM.lightboxBackdrop.addEventListener('click', closeLightbox);

    // Pokemon Detail Modal Close Events
    if (DOM.pkmDetailCloseBtn) {
      DOM.pkmDetailCloseBtn.addEventListener('click', closePkmDetailModal);
    }
    if (DOM.pkmDetailBackdrop) {
      DOM.pkmDetailBackdrop.addEventListener('click', closePkmDetailModal);
    }

    // 點擊百科彈窗頭像跳轉至寶可夢圖鑑並平滑高亮聚焦
    const detailAvatarWrap = document.querySelector('.pkm-detail-avatar-wrap');
    if (detailAvatarWrap) {
      detailAvatarWrap.addEventListener('click', (e) => {
        e.stopPropagation();
        const pkmId = detailAvatarWrap.dataset.pkmId || (DOM.pkmDetailAvatar ? DOM.pkmDetailAvatar.dataset.pkmId : null);
        if (pkmId) {
          const fromTab = state.currentTab;
          closePkmDetailModal();
          jumpToPokemon(pkmId, true);
          if (fromTab && fromTab !== 'habitat') {
            const tabNameMap = {
              regionMap: '地區地圖',
              autofarm: '終局農場',
              customStorage: '我的收納盒',
              habitatCatalog: '棲息地總覽',
              storage: '儲存庫'
            };
            showFloatingBackBtn(tabNameMap[fromTab] || '上一頁');
          }
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closePrefDrawer();
        closePkmDetailModal();
      }
    });

    // 點擊表格列名稱或頭像喚起寶可夢個人百科卡 (完全防衝突)
    if (DOM.habitatTableBody) {
      DOM.habitatTableBody.addEventListener('click', (e) => {
        const trigger = e.target.closest('.pkm-cell-identity, .pkm-avatar-cell, .pkm-col-identity, .pkm-col-avatar');
        if (trigger) {
          const row = trigger.closest('tr');
          if (row && row.dataset.id) {
            openPkmDetailModal(row.dataset.id);
          }
        }
      });
    }

    // 點擊卡片視圖頭像或標題喚起寶可夢個人百科卡
    if (DOM.habitatCardGrid) {
      DOM.habitatCardGrid.addEventListener('click', (e) => {
        const trigger = e.target.closest('.card-title-group, .pkm-avatar-box, .card-name');
        if (trigger) {
          const card = trigger.closest('.item-card');
          if (card && card.dataset.id) {
            openPkmDetailModal(card.dataset.id);
          }
        }
      });
    }
  }

  // Update Category Select Options dynamically based on active tab
  function updateCategoryFilterOptions() {
    if (!DOM.categoryFilter) return;
    if (state.currentTab === 'habitat') {
      DOM.categoryFilter.innerHTML = `
        <option value="all">全部 (367)</option>
        <option value="main">主圖鑑 (308)</option>
        <option value="event">活動 (7)</option>
        <option value="underwater">海底 (52)</option>
      `;
      DOM.categoryFilter.value = state.selectedPkmCategory || 'all';
    } else if (state.currentTab === 'habitatCatalog') {
      DOM.categoryFilter.innerHTML = `
        <option value="all">全部 (252)</option>
        <option value="main">主棲息地 (209)</option>
        <option value="event">活動棲息地 (7)</option>
        <option value="underwater">海底棲息地 (36)</option>
      `;
      DOM.categoryFilter.value = state.selectedHabCategory || 'all';
    }
  }

  // Update Unlock Filter Options dynamically based on active tab & progress
  function updateUnlockFilterOptions() {
    if (!DOM.unlockFilter) return;
    const currentVal = state.selectedUnlockFilter || 'all';
    let total = 0, done = 0;
    if (state.currentTab === 'habitatCatalog') {
      const habitats = (window.POKOPIA_DATA && window.POKOPIA_DATA.habitats) || [];
      total = habitats.length;
      done = habitats.filter(hab => 
        hab.pokemons && hab.pokemons.length > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]))
      ).length;
    } else {
      const pokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
      total = pokemons.length;
      done = Object.values(state.pkmChecked || {}).filter(Boolean).length;
    }
    const locked = Math.max(0, total - done);
    DOM.unlockFilter.innerHTML = `
      <option value="all">全部 (${total})</option>
      <option value="unlocked">已解鎖 (${done})</option>
      <option value="locked">未解鎖 (${locked})</option>
    `;
    DOM.unlockFilter.value = currentVal;
  }

  // 全域分頁滾動高度記憶池 (Tab Scroll Restoration Cache)
  const tabScrollPositions = {};

  // Switch Tab (支援精準滾動還原 targetScrollY)
  function switchTab(tab, skipSync = false, targetScrollY = null) {
    if (state.currentTab && typeof window !== 'undefined') {
      tabScrollPositions[state.currentTab] = window.scrollY || 0;
      try {
        const curState = history.state || {};
        history.replaceState({ ...curState, tab: state.currentTab, scrollY: window.scrollY || 0 }, '', window.location.hash);
      } catch (e) {}
    }

    state.currentTab = tab;
    state.isStaggerAnim = true;
    closeTocDropdown();

    // Reset Tabs
    DOM.tabStorage.classList.remove('active');
    DOM.tabHabitat.classList.remove('active');
    DOM.tabHabitatCatalog.classList.remove('active');
    if (DOM.tabRecipe) DOM.tabRecipe.classList.remove('active');
    if (DOM.tabPreferences) DOM.tabPreferences.classList.remove('active');
    if (DOM.btnPrefDrawer) DOM.btnPrefDrawer.classList.remove('active');
    if (DOM.tabAutoFarm) DOM.tabAutoFarm.classList.remove('active');
    if (DOM.btnAutoFarmNav) DOM.btnAutoFarmNav.classList.remove('active');
    if (DOM.tabCustomStorage) DOM.tabCustomStorage.classList.remove('active');
    if (DOM.btnCustomStorageNav) DOM.btnCustomStorageNav.classList.remove('active');
    if (DOM.tabRegionMap) DOM.tabRegionMap.classList.remove('active');
    if (DOM.tabVideo) DOM.tabVideo.classList.remove('active');
    if (DOM.btnVideoNav) DOM.btnVideoNav.classList.remove('active');
    if (DOM.tabBuzz3d) DOM.tabBuzz3d.classList.remove('active');
    if (DOM.btnBuzz3dNav) DOM.btnBuzz3dNav.classList.remove('active');

    DOM.storageSection.classList.add('hidden-section');
    DOM.storageSection.classList.remove('active-section');
    DOM.habitatSection.classList.add('hidden-section');
    DOM.habitatSection.classList.remove('active-section');
    DOM.habitatCatalogSection.classList.add('hidden-section');
    DOM.habitatCatalogSection.classList.remove('active-section');
    if (DOM.recipeSection) {
      DOM.recipeSection.classList.add('hidden-section');
      DOM.recipeSection.classList.remove('active-section');
    }
    if (DOM.preferencesSection) {
      DOM.preferencesSection.classList.add('hidden-section');
      DOM.preferencesSection.classList.remove('active-section');
    }
    if (DOM.autoFarmSection) {
      DOM.autoFarmSection.classList.add('hidden-section');
      DOM.autoFarmSection.classList.remove('active-section');
    }
    if (DOM.customStorageSection) {
      DOM.customStorageSection.classList.add('hidden-section');
      DOM.customStorageSection.classList.remove('active-section');
    }
    if (DOM.regionMapSection) {
      DOM.regionMapSection.classList.add('hidden-section');
      DOM.regionMapSection.classList.remove('active-section');
    }
    if (DOM.videoSection) {
      DOM.videoSection.classList.add('hidden-section');
      DOM.videoSection.classList.remove('active-section');
    }
    if (DOM.buzz3dSection) {
      DOM.buzz3dSection.classList.add('hidden-section');
      DOM.buzz3dSection.classList.remove('active-section');
    }

    if (tab === 'storage') {
      DOM.tabStorage.classList.add('active');
      DOM.storageSection.classList.remove('hidden-section');
      DOM.storageSection.classList.add('active-section');
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '儲存庫分類';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '📦';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>9</strong> 大分類 ‧ 44 方案';
      if (DOM.searchRow) DOM.searchRow.classList.remove('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
    } else if (tab === 'habitat') {
      DOM.tabHabitat.classList.add('active');
      DOM.habitatSection.classList.remove('hidden-section');
      DOM.habitatSection.classList.add('active-section');
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '寶可夢圖鑑';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '✨';
      if (DOM.catalogBadgeText) {
        DOM.catalogBadgeText.innerHTML = '已解鎖 <strong id="catalogDoneCount">0</strong> / <span id="catalogTotalCount">0</span>';
        DOM.catalogDoneCount = document.getElementById('catalogDoneCount');
        DOM.catalogTotalCount = document.getElementById('catalogTotalCount');
      }
      if (DOM.searchRow) DOM.searchRow.classList.remove('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.remove('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.remove('hidden');
      if (DOM.filterResultGroup) DOM.filterResultGroup.classList.remove('hidden');
      if (DOM.specialtyFilterGroup) DOM.specialtyFilterGroup.classList.remove('hidden');
      if (DOM.regionFilterGroup) DOM.regionFilterGroup.classList.remove('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.remove('hidden');
      updateCategoryFilterOptions();
      updateUnlockFilterOptions();
    } else if (tab === 'habitatCatalog') {
      DOM.tabHabitatCatalog.classList.add('active');
      DOM.habitatCatalogSection.classList.remove('hidden-section');
      DOM.habitatCatalogSection.classList.add('active-section');
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '棲息地總覽';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '✨';
      if (DOM.catalogBadgeText) {
        DOM.catalogBadgeText.innerHTML = '已解鎖 <strong id="catalogDoneCount">0</strong> / <span id="catalogTotalCount">0</span>';
        DOM.catalogDoneCount = document.getElementById('catalogDoneCount');
        DOM.catalogTotalCount = document.getElementById('catalogTotalCount');
      }
      if (DOM.searchRow) DOM.searchRow.classList.remove('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.remove('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.remove('hidden');
      if (DOM.filterResultGroup) DOM.filterResultGroup.classList.add('hidden');
      if (DOM.specialtyFilterGroup) DOM.specialtyFilterGroup.classList.add('hidden');
      if (DOM.regionFilterGroup) DOM.regionFilterGroup.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.remove('hidden');
      updateCategoryFilterOptions();
      updateUnlockFilterOptions();
    } else if (tab === 'recipe') {
      if (DOM.tabRecipe) DOM.tabRecipe.classList.add('active');
      if (DOM.recipeSection) {
        DOM.recipeSection.classList.remove('hidden-section');
        DOM.recipeSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '料理食譜';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🍲';
      const recipeTotal = window.POKOPIA_RECIPES_DB ? window.POKOPIA_RECIPES_DB.length : 35;
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>' + recipeTotal + '</strong> 道美味料理全收錄';
      if (DOM.searchRow) DOM.searchRow.classList.remove('hidden');
      if (DOM.searchInput) DOM.searchInput.placeholder = '搜尋料理名稱、食材、設施、招式或口味 (如: 西瓜麵包, 小麥, 番茄)...';
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.filterResultGroup) DOM.filterResultGroup.classList.add('hidden');
      if (DOM.categoryFilterGroup) DOM.categoryFilterGroup.classList.add('hidden');
      if (DOM.envFilterGroup) DOM.envFilterGroup.classList.add('hidden');
      if (DOM.specialtyFilterGroup) DOM.specialtyFilterGroup.classList.add('hidden');
      if (DOM.regionFilterGroup) DOM.regionFilterGroup.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
      if (window.RecipeModule) {
        window.RecipeModule.init();
        window.RecipeModule.render();
      }
    } else if (tab === 'autofarm') {
      if (!isAutoFarmAuthorized()) {
        switchTab('habitat', skipSync);
        return;
      }
      if (DOM.tabAutoFarm) DOM.tabAutoFarm.classList.add('active');
      if (DOM.btnAutoFarmNav) DOM.btnAutoFarmNav.classList.add('active');
      if (DOM.autoFarmSection) {
        DOM.autoFarmSection.classList.remove('hidden-section');
        DOM.autoFarmSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '終局農場';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🌾';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>7</strong> 大全自動流水線';
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
    } else if (tab === 'customStorage') {
      if (!isAutoFarmAuthorized()) {
        switchTab('habitat', skipSync);
        return;
      }
      if (DOM.tabCustomStorage) DOM.tabCustomStorage.classList.add('active');
      if (DOM.btnCustomStorageNav) DOM.btnCustomStorageNav.classList.add('active');
      if (DOM.customStorageSection) {
        DOM.customStorageSection.classList.remove('hidden-section');
        DOM.customStorageSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '我的收納盒';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '📦';
      const boxCount = (state.customBoxes || []).length;
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = boxCount > 0 ? '<strong>' + boxCount + '</strong> 箱收納管理' : '自訂收納管理';
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
      renderCustomStorage();
    } else if (tab === 'regionMap') {
      if (DOM.tabRegionMap) DOM.tabRegionMap.classList.add('active');
      if (DOM.regionMapSection) {
        DOM.regionMapSection.classList.remove('hidden-section');
        DOM.regionMapSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '地區地圖';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🗺️';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>5</strong> 大世界區域';
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
      renderRegionMap();
    } else if (tab === 'video') {
      if (!isAutoFarmAuthorized()) {
        switchTab('habitat', skipSync);
        return;
      }
      if (DOM.tabVideo) DOM.tabVideo.classList.add('active');
      if (DOM.btnVideoNav) DOM.btnVideoNav.classList.add('active');
      if (DOM.videoSection) {
        DOM.videoSection.classList.remove('hidden-section');
        DOM.videoSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '參考影片';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🎬';
      const totalVids = (typeof getAllVideos === 'function') ? getAllVideos().length : 0;
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = totalVids > 0 ? '<strong>' + totalVids + '</strong> 部精選攻略影音' : '攻略影音';
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
      if (typeof renderVideoSection === 'function') {
        renderVideoSection();
      }
    } else if (tab === 'buzz3d') {
      if (!isAutoFarmAuthorized()) {
        switchTab('habitat', skipSync);
        return;
      }
      if (DOM.tabBuzz3d) DOM.tabBuzz3d.classList.add('active');
      if (DOM.btnBuzz3dNav) DOM.btnBuzz3dNav.classList.add('active');
      if (DOM.buzz3dSection) {
        DOM.buzz3dSection.classList.remove('hidden-section');
        DOM.buzz3dSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '3D 藍圖';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (bulbaState.curChar === 'bulba') {
        if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🍃';
        if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>8,415</strong> 顆方塊 ‧ 53 層切片';
        if (typeof renderBulbaLayer === 'function') renderBulbaLayer(bulbaState.curLayer);
        if (typeof initBulbaThreeEngine === 'function') setTimeout(initBulbaThreeEngine, 60);
      } else {
        if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🚀';
        if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>3D</strong> 互動模型檢視';
      }
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
    } else if (tab === 'preferences') {
      if (DOM.tabPreferences) DOM.tabPreferences.classList.add('active');
      if (DOM.btnPrefDrawer) DOM.btnPrefDrawer.classList.add('active');
      if (DOM.preferencesSection) {
        DOM.preferencesSection.classList.remove('hidden-section');
        DOM.preferencesSection.classList.add('active-section');
      }
      if (DOM.toolbarContainer) DOM.toolbarContainer.classList.remove('hidden');
      if (DOM.toolbarHeaderRow) DOM.toolbarHeaderRow.classList.remove('hidden');
      if (DOM.toolbarTitle) DOM.toolbarTitle.textContent = '喜好百科';
      if (DOM.catalogProgressBadge) DOM.catalogProgressBadge.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '💖';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>48</strong> 種偏好 ‧ 12 大類物品';
      if (DOM.searchRow) DOM.searchRow.classList.add('hidden');
      if (DOM.viewToggleGroup) DOM.viewToggleGroup.classList.add('hidden');
      if (DOM.filterToolbar) DOM.filterToolbar.classList.add('hidden');
      if (DOM.unlockFilterGroup) DOM.unlockFilterGroup.classList.add('hidden');
      renderPrefDrawerContent();
    }

    if (!skipSync) {
      syncNavStateToURLAndStorage();
    }
    renderStats();
    renderAll();

    // 跨分頁精確滾動高度還原
    const restoreY = (targetScrollY !== null && typeof targetScrollY === 'number')
      ? targetScrollY
      : (typeof tabScrollPositions[tab] === 'number' ? tabScrollPositions[tab] : null);

    if (restoreY !== null && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      if (typeof setTimeout === 'function') {
        setTimeout(() => {
          if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo({ top: restoreY, behavior: 'instant' });
          }
        }, 40);
      } else {
        window.scrollTo({ top: restoreY, behavior: 'instant' });
      }
    }
  }

  // Switch View (Card vs Table)
  function switchView(view, skipSync = false) {
    state.currentView = view;
    if (view === 'card') {
      DOM.btnCardView.classList.add('active');
      DOM.btnTableView.classList.remove('active');
      DOM.storageCardGrid.classList.remove('hidden');
      DOM.storageTableContainer.classList.add('hidden');
      DOM.habitatCardGrid.classList.remove('hidden');
      DOM.habitatTableContainer.classList.add('hidden');
      DOM.habitatCatalogCardGrid.classList.remove('hidden');
      DOM.habitatCatalogTableContainer.classList.add('hidden');
    } else {
      DOM.btnTableView.classList.add('active');
      DOM.btnCardView.classList.remove('active');
      DOM.storageCardGrid.classList.add('hidden');
      DOM.storageTableContainer.classList.remove('hidden');
      DOM.habitatCardGrid.classList.add('hidden');
      DOM.habitatTableContainer.classList.remove('hidden');
      DOM.habitatCatalogCardGrid.classList.add('hidden');
      DOM.habitatCatalogTableContainer.classList.remove('hidden');
    }

    if (!skipSync) {
      syncNavStateToURLAndStorage();
    }
    renderAll();
  }

  // Update Progress Counters
  function renderStats() {
    if (DOM.catDoneCount) {
      const doneCat = Object.values(state.catChecked || {}).filter(Boolean).length;
      DOM.catDoneCount.textContent = doneCat;
    }

    const totalPkm = window.POKOPIA_DATA.pokemons.length;
    const donePkm = Object.values(state.pkmChecked || {}).filter(Boolean).length;
    if (DOM.pkmDoneCount) DOM.pkmDoneCount.textContent = donePkm;
    if (DOM.pkmTotalCount) DOM.pkmTotalCount.textContent = totalPkm;

    const habitats = (window.POKOPIA_DATA && window.POKOPIA_DATA.habitats) || [];
    const totalHab = habitats.length;
    const doneHab = habitats.filter(hab => 
      hab.pokemons && hab.pokemons.length > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]))
    ).length;
    if (DOM.habDoneCount) DOM.habDoneCount.textContent = doneHab;
    if (DOM.habTotalCount) DOM.habTotalCount.textContent = totalHab;

    if (state.currentTab === 'storage') {
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '📦';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>9</strong> 大分類 ‧ 44 方案';
    } else if (state.currentTab === 'autofarm') {
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🌾';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>7</strong> 大全自動流水線';
    } else if (state.currentTab === 'customStorage') {
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '📦';
      const boxCount = (state.customBoxes || []).length;
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = boxCount > 0 ? '<strong>' + boxCount + '</strong> 箱收納管理' : '自訂收納管理';
    } else if (state.currentTab === 'regionMap') {
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🗺️';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>5</strong> 大世界區域';
    } else {
      if (DOM.catalogDoneCount && DOM.catalogTotalCount) {
        if (state.currentTab === 'habitat') {
          DOM.catalogDoneCount.textContent = donePkm;
          DOM.catalogTotalCount.textContent = totalPkm;
        } else if (state.currentTab === 'habitatCatalog') {
          DOM.catalogDoneCount.textContent = doneHab;
          DOM.catalogTotalCount.textContent = totalHab;
        }
      }
    }
    updateUnlockFilterOptions();
  }

  // Render Storage Categories (Card View & Table View)
  function renderStorage() {
    const query = state.searchQuery;
    const categories = window.POKOPIA_DATA.categories.filter(cat => {
      if (!query) return true;
      const catText = (
        cat.name + ' ' + 
        cat.subCategories.map((s, idx) => {
          const bench = getBenchVal(cat.id, idx, s.craftingBench);
          const comm = s.comments || s.note || '';
          const en = s.name_en || '';
          return `${s.name} ${en} ${s.items.join(' ')} ${comm} ${bench}`;
        }).join(' ')
      ).toLowerCase();
      return catText.includes(query);
    });

    let hasResults = categories.length > 0;

    // Render Cards
    DOM.storageCardGrid.innerHTML = categories.map(cat => {
      const subCatsHTML = cat.subCategories.map((sub, idx) => {
        const commentText = sub.note || sub.comments || '';
        return `
          <div class="sub-cat-item">
            <div class="sub-cat-header">
              <div class="sub-cat-name">📌 ${escapeHTML(sub.name)}</div>
            </div>
            <div class="items-pills">
              ${sub.items.map(item => `<span class="item-pill">${escapeHTML(item)}</span>`).join('')}
            </div>
            <div class="item-note">💡 ${escapeHTML(commentText)}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="item-card" data-id="${cat.id}">
          <div class="card-header">
            <div class="card-title-group">
              <div class="card-icon" style="border-color: ${cat.borderColor}">${cat.icon}</div>
              <div>
                <div class="card-number">分類 ${cat.number}</div>
                <div class="card-title">${escapeHTML(cat.name)}</div>
              </div>
            </div>
          </div>
          <div class="sub-cat-list">
            ${subCatsHTML}
          </div>
        </div>
      `;
    }).join('');

    // Render Table Rows (子分類獨立橫列，大分類跨列合併且垂直靠頂對齊)
    const tableRows = [];
    categories.forEach(cat => {
      const subCats = cat.subCategories || [];
      const rowSpan = subCats.length;

      subCats.forEach((sub, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === rowSpan - 1;
        const rowClass = [
          isFirst ? 'cat-row-first' : '',
          isLast ? 'cat-row-last' : ''
        ].filter(Boolean).join(' ');

        const noteContent = (sub.note || sub.comments) 
          ? escapeHTML(sub.note || sub.comments) 
          : '<span class="empty-note">—</span>';

        const trHTML = `
          <tr class="${rowClass}">
            ${isFirst ? `
              <td rowspan="${rowSpan}" class="col-storage-name">
                <div class="storage-cat-title-group">
                  <strong class="storage-cat-title">${cat.number}. ${cat.icon} ${escapeHTML(cat.name)}</strong>
                </div>
              </td>
            ` : ''}
            <td class="col-storage-sub">
              <strong class="sub-cat-title">${escapeHTML(sub.name)}</strong>
            </td>
            <td class="col-storage-items">
              <div class="storage-items-wrap">
                ${sub.items.map(i => `<span class="item-pill">${escapeHTML(i)}</span>`).join('')}
              </div>
            </td>
            <td class="col-storage-note">
              <div class="storage-note-text">${noteContent}</div>
            </td>
          </tr>
        `;
        tableRows.push(trHTML);
      });
    });

    DOM.storageTableBody.innerHTML = tableRows.join('');

    return hasResults;
  }

  // 更新即時結果計數膠囊 (如: 🎯 24 / 308 隻 或 全部 308 隻)
  function updateFilterResultBadge(filteredCount, categoryTotalCount, isFiltered) {
    if (!DOM.filterResultBadge || !DOM.filterResultText) return;
    
    if (isFiltered) {
      if (filteredCount === 0) {
        DOM.filterResultBadge.className = 'filter-result-badge is-empty';
        if (DOM.filterResultIcon) DOM.filterResultIcon.textContent = '⚠️';
        DOM.filterResultText.textContent = `0 / ${categoryTotalCount} 隻`;
      } else {
        DOM.filterResultBadge.className = 'filter-result-badge is-filtered';
        if (DOM.filterResultIcon) DOM.filterResultIcon.textContent = '🎯';
        DOM.filterResultText.textContent = `${filteredCount} / ${categoryTotalCount} 隻`;
      }
      if (DOM.btnResetFilters) DOM.btnResetFilters.classList.remove('hidden');
    } else {
      DOM.filterResultBadge.className = 'filter-result-badge';
      if (DOM.filterResultIcon) DOM.filterResultIcon.textContent = '🎯';
      DOM.filterResultText.textContent = `全部 ${categoryTotalCount} 隻`;
      if (DOM.btnResetFilters) DOM.btnResetFilters.classList.add('hidden');
    }
  }

  // 一鍵重設所有篩選為全部
  function resetPokemonFilters() {
    state.selectedEnvFilter = 'env-all';
    state.selectedSpecialtyFilter = 'all';
    state.selectedUnlockFilter = 'all';
    state.selectedRegionFilter = 'all';
    state.searchQuery = '';
    if (DOM.envFilter) DOM.envFilter.value = 'env-all';
    if (DOM.specialtyFilter) DOM.specialtyFilter.value = 'all';
    if (DOM.unlockFilter) DOM.unlockFilter.value = 'all';
    if (DOM.regionFilter) DOM.regionFilter.value = 'all';
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.clearSearchBtn) DOM.clearSearchBtn.classList.add('hidden');
    if (state.currentTab === 'recipe' && window.RecipeModule) {
      window.RecipeModule.resetFilters();
    }
    renderAll();
  }

  // Render Pokemon Habitats (Card View & Table View with Sprite Avatars + Habitat Screenshots)
  function renderHabitat() {
    const query = state.searchQuery;
    const filterEnv = state.selectedEnvFilter;
    const filterSpec = state.selectedSpecialtyFilter;

    const pokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons || []).filter(pkm => {
      // Category filter (全部 / 主圖鑑 / 活動 / 海底)
      if (state.selectedPkmCategory !== 'all' && pkm.category !== state.selectedPkmCategory) {
        return false;
      }
      // Env filter (使用 ENV_FILTER_MAP 轉換為中文關鍵字進行匹對)
      if (filterEnv !== 'env-all') {
        const envKey = filterEnv.replace('env-', '');
        const envZh = ENV_FILTER_MAP[envKey] || envKey;
        if (!pkm.environment || !pkm.environment.includes(envZh)) return false;
      }
      // Specialty filter (52poke official specialties)
      if (filterSpec !== 'all') {
        const specs = pkm.specialties || pkm.abilities || [];
        if (!specs.includes(filterSpec)) return false;
      }
      // Unlock filter (all / unlocked / locked)
      if (state.selectedUnlockFilter === 'unlocked' && !state.pkmChecked[pkm.id]) {
        return false;
      }
      if (state.selectedUnlockFilter === 'locked' && state.pkmChecked[pkm.id]) {
        return false;
      }
      // Region filter (all / specific regionId / unassigned)
      if (state.selectedRegionFilter && state.selectedRegionFilter !== 'all') {
        const curReg = getPokemonCurrentRegion(pkm.id);
        if (state.selectedRegionFilter === 'unassigned') {
          if (curReg !== null) return false;
        } else {
          if (!curReg || curReg.regionId !== state.selectedRegionFilter) return false;
        }
      }
      // Search query filter
      if (!query) return true;
      const specs = pkm.specialties || pkm.abilities || [];
      const pkmText = (
        (pkm.number || '') + ' ' + 
        (pkm.name || '') + ' ' + 
        (pkm.categoryName || '') + ' ' + 
        (pkm.name_en || '') + ' ' + 
        specs.join(' ') + ' ' + 
        (pkm.environment || '') + ' ' + 
        (pkm.habitat1 || '') + ' ' + 
        (pkm.habitat2 || '') + ' ' + 
        (pkm.favorites || []).join(' ')
      ).toLowerCase();
      return pkmText.includes(query);
    });

    // 計算當前大分類下的全部寶可夢總數 (分母)
    const allCategoryPokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons || []).filter(pkm => {
      if (state.selectedPkmCategory !== 'all' && pkm.category !== state.selectedPkmCategory) return false;
      return true;
    });
    const categoryTotalCount = allCategoryPokemons.length;
    const isFiltered = !!(
      query ||
      filterEnv !== 'env-all' ||
      filterSpec !== 'all' ||
      state.selectedUnlockFilter !== 'all' ||
      (state.selectedRegionFilter && state.selectedRegionFilter !== 'all')
    );
    updateFilterResultBadge(pokemons.length, categoryTotalCount, isFiltered);

    let hasResults = pokemons.length > 0;

    // Render Cards
    DOM.habitatCardGrid.innerHTML = pokemons.map((pkm, index) => {
      const isChecked = !!state.pkmChecked[pkm.id];
      const specs = pkm.specialties || pkm.abilities || [];
      const specialtiesHTML = specs.map(s => {
        const icon = SPECIALTY_ICONS[s] || '⚡';
        return `<span class="tag-specialty" data-spec="${escapeHTML(s)}" title="點擊篩選專長：${escapeHTML(s)}">${icon} ${escapeHTML(s)}</span>`;
      }).join(' ');
      const favoritesHTML = pkm.favorites.map(f => renderPrefPill(f)).join(' ');

      const habThumbs = [];
      if (pkm.habitat1 && pkm.habitat1 !== '無特別需求') {
        const hab1Name = pkm.habitat1.split(' - ')[0] || '棲息地 1';
        if (pkm.habitat1_img) {
          habThumbs.push(`
            <div class="pkm-card-hab-thumb is-loading" data-hab-id="${pkm.habitat1_id || ''}" data-img="${escapeHTML(pkm.habitat1_img)}" data-caption="<strong>${escapeHTML(pkm.name)}</strong> - ${escapeHTML(hab1Name)}" title="${escapeHTML(hab1Name)}（點擊查看 52poke 官方實機全景）">
              <img decoding="async" src="${pkm.habitat1_img}" alt="${escapeHTML(hab1Name)}" class="img-fade-in" loading="lazy" onload="this.parentElement.classList.remove('is-loading');" onerror="this.parentElement.classList.remove('is-loading');">
            </div>
          `);
        } else {
          habThumbs.push(`
            <div class="pkm-card-hab-thumb hab-thumb-placeholder" data-hab-id="${pkm.habitat1_id || ''}" title="${escapeHTML(hab1Name)}（點擊跳轉棲息地圖鑑）">
              <span>${escapeHTML(hab1Name)}</span>
            </div>
          `);
        }
      }
      if (pkm.habitat2 && pkm.habitat2 !== '無特別需求') {
        const hab2Name = pkm.habitat2.split(' - ')[0] || '棲息地 2';
        if (pkm.habitat2_img) {
          habThumbs.push(`
            <div class="pkm-card-hab-thumb is-loading" data-hab-id="${pkm.habitat2_id || ''}" data-img="${escapeHTML(pkm.habitat2_img)}" data-caption="<strong>${escapeHTML(pkm.name)}</strong> - ${escapeHTML(hab2Name)}" title="${escapeHTML(hab2Name)}（點擊跳轉棲息地圖鑑）">
              <img decoding="async" src="${pkm.habitat2_img}" alt="${escapeHTML(hab2Name)}" class="img-fade-in" loading="lazy" onload="this.parentElement.classList.remove('is-loading');" onerror="this.parentElement.classList.remove('is-loading');">
            </div>
          `);
        } else {
          habThumbs.push(`
            <div class="pkm-card-hab-thumb hab-thumb-placeholder" data-hab-id="${pkm.habitat2_id || ''}" title="${escapeHTML(hab2Name)}（點擊跳轉棲息地圖鑑）">
              <span>${escapeHTML(hab2Name)}</span>
            </div>
          `);
        }
      }

      const habsCardHTML = habThumbs.length > 0 ? `
        <div class="pkm-card-hab-container">
          <div class="pkm-card-hab-label">棲息地</div>
          <div class="pkm-card-hab-group ${habThumbs.length === 1 ? 'single-hab' : 'dual-hab'}">
            ${habThumbs.join('')}
          </div>
        </div>
      ` : '';

      const currentReg = getPokemonCurrentRegion(pkm.id);
      const locationChipHTML = currentReg ? `
        <span class="pkm-location-chip" data-region-id="${currentReg.regionId}" style="--loc-theme:${currentReg.themeColor};" title="目前位於【${escapeHTML(currentReg.regionName)}】（點擊跳轉至地圖）">
          📍 ${escapeHTML(currentReg.regionName)}
        </span>
      ` : `
        <span class="pkm-location-chip unassigned" data-region-id="" title="尚未安置至任何度假村（點擊跳轉至地圖進行配置）">
          📍 未安置
        </span>
      `;

      const isStagger = state.isStaggerAnim && index < 16;
      const staggerClass = isStagger ? 'stagger-in' : '';
      const staggerStyle = isStagger ? `style="--stagger-i: ${index};"` : '';

      return `
        <div class="item-card ${staggerClass} ${isChecked ? 'completed' : ''}" ${staggerStyle} data-id="${pkm.id}">
          <div class="card-header">
            <div class="card-title-group">
              <div class="pkm-avatar-box is-loading">
                <img decoding="async" src="${pkm.sprite}" alt="${escapeHTML(pkm.name)}" class="img-fade-in" loading="lazy" onload="this.parentElement.classList.remove('is-loading');" onerror="this.src='${FALLBACK_SPRITE}'; this.parentElement.classList.remove('is-loading');">
              </div>
              <div>
                <div class="card-number-group">
                  <span class="card-number">${escapeHTML(pkm.number)}</span>
                  <span class="tag-badge tag-cat-${escapeHTML(pkm.category || 'main')}">${escapeHTML(pkm.categoryName || '主圖鑑')}</span>
                </div>
                <div class="card-title">${escapeHTML(pkm.name)}</div>
              </div>
            </div>
            <label class="checkbox-container" title="標記為已成功吸引/已解鎖">
              <input type="checkbox" class="pkm-checkbox" data-id="${pkm.id}" ${isChecked ? 'checked' : ''}>
              <span class="custom-checkbox"></span>
            </label>
          </div>
          <div class="pokemon-meta">
            <span class="tag-badge tag-env" data-env="${escapeHTML(pkm.environment)}" title="點擊在喜好百科查看「${escapeHTML(pkm.environment)}」營造家具與說明">${escapeHTML(pkm.environment)}</span>
            ${locationChipHTML}
            ${specialtiesHTML}
          </div>
          ${habsCardHTML}
          <div style="font-size:0.8rem; color:var(--text-sub);">
            <strong>❤️ 喜好：</strong>
            <div class="items-pills" style="margin-top:4px;">${favoritesHTML}</div>
          </div>
        </div>
      `;
    }).join('');

    // Render Table Rows
    DOM.habitatTableBody.innerHTML = pokemons.map(pkm => {
      const isChecked = !!state.pkmChecked[pkm.id];
      const specs = pkm.specialties || pkm.abilities || [];
      const currentReg = getPokemonCurrentRegion(pkm.id);
      const locationChipHTML = currentReg ? `
        <span class="pkm-location-chip" data-region-id="${currentReg.regionId}" style="--loc-theme:${currentReg.themeColor};" title="目前位於【${escapeHTML(currentReg.regionName)}】（點擊跳轉至地圖）">
          📍 ${escapeHTML(currentReg.regionName)}
        </span>
      ` : `
        <span class="pkm-location-chip unassigned" data-region-id="" title="尚未安置至任何度假村（點擊跳轉至地圖進行配置）">
          📍 未安置
        </span>
      `;
      
      const habList = [];
      if (pkm.habitat1 && pkm.habitat1 !== '無特別需求') {
        habList.push({
          id: pkm.habitat1_id || '',
          name: pkm.habitat1.split(' - ')[0] || '棲息地 1',
          img: pkm.habitat1_img || ''
        });
      }
      if (pkm.habitat2 && pkm.habitat2 !== '無特別需求') {
        habList.push({
          id: pkm.habitat2_id || '',
          name: pkm.habitat2.split(' - ')[0] || '棲息地 2',
          img: pkm.habitat2_img || ''
        });
      }

      let habsCell = '<span style="color:var(--text-muted);">-</span>';
      if (habList.length === 1) {
        const h = habList[0];
        habsCell = `
          <div class="pkm-table-hab-single-wrap">
            <div class="pkm-table-hab-thumb" data-hab-id="${h.id}" data-img="${escapeHTML(h.img)}" data-caption="<strong>${escapeHTML(pkm.name)}</strong> - ${escapeHTML(h.name)}" title="${escapeHTML(h.name)}（點擊跳轉棲息地圖鑑）">
              ${h.img ? `<img decoding="async" src="${h.img}" alt="${escapeHTML(h.name)}" loading="lazy">` : `<div class="hab-thumb-placeholder"><span>${escapeHTML(h.name)}</span></div>`}
            </div>
            <div class="pkm-hab-bottom-bar">
              <span class="pkm-hab-name-text" title="${escapeHTML(h.name)}">${escapeHTML(h.name)}</span>
            </div>
          </div>
        `;
      } else if (habList.length >= 2) {
        const h = habList[0];
        const habsDataAttr = escapeHTML(JSON.stringify(habList));
        habsCell = `
          <div class="pkm-table-hab-carousel" data-pkm-name="${escapeHTML(pkm.name)}" data-current-index="0" data-habs='${habsDataAttr}'>
            <div class="pkm-table-hab-thumb" data-hab-id="${h.id}" data-img="${escapeHTML(h.img)}" data-caption="<strong>${escapeHTML(pkm.name)}</strong> - ${escapeHTML(h.name)}" title="${escapeHTML(h.name)}（點擊跳轉棲息地圖鑑）">
              ${h.img ? `<img decoding="async" class="pkm-hab-active-img" src="${h.img}" alt="${escapeHTML(h.name)}" loading="lazy">` : `<div class="hab-thumb-placeholder"><span class="pkm-hab-placeholder-text">${escapeHTML(h.name)}</span></div>`}
            </div>
            <div class="pkm-hab-bottom-bar">
              <button type="button" class="pkm-hab-arrow-btn pkm-hab-prev" title="切換至上一個棲息地" aria-label="上一個棲息地">‹</button>
              <span class="pkm-hab-name-text" title="${escapeHTML(h.name)}">${escapeHTML(h.name)} (1/${habList.length})</span>
              <button type="button" class="pkm-hab-arrow-btn pkm-hab-next" title="切換至下一個棲息地" aria-label="下一個棲息地">›</button>
            </div>
          </div>
        `;
      }

      const allRegions = (window.POKOPIA_REGION_DATA && window.POKOPIA_REGION_DATA.regions) || [];
      const regOptionsHTML = allRegions.map(r => `
        <option value="${r.id}" ${currentReg && currentReg.regionId === r.id ? 'selected' : ''}>
          📍 ${escapeHTML(r.name)}
        </option>
      `).join('');

      // 整合於第 2 欄名稱下方的小巧膠囊下拉選擇器
      const tableLocationSelectHTML = `
        <select class="pkm-table-region-select ${!currentReg ? 'is-unassigned' : ''}" data-pkm-id="${pkm.id}" style="--loc-theme: ${currentReg ? currentReg.themeColor : '#64748b'};" title="點擊切換此寶可夢安置的地區">
          <option value="unassigned" ${!currentReg ? 'selected' : ''}>⚪ 未安置</option>
          ${regOptionsHTML}
        </select>
      `;

      const formMatch = pkm.name.match(/^(.*?)[（\(](.*?)[）\)]$/);
      const baseName = formMatch ? formMatch[1].trim() : pkm.name;
      const formName = formMatch ? formMatch[2].trim() : '';

      return `
        <tr class="${isChecked ? 'completed' : ''}" data-id="${pkm.id}">
          <td>
            <label class="checkbox-container">
              <input type="checkbox" class="pkm-checkbox" data-id="${pkm.id}" ${isChecked ? 'checked' : ''}>
              <span class="custom-checkbox"></span>
            </label>
          </td>
          <td class="pkm-col-identity" title="點擊查看 ${escapeHTML(pkm.name)} 完整百科與喜好">
            <div class="pkm-cell-identity">
              <span class="card-number">${escapeHTML(pkm.number)}</span>
              <strong class="pkm-table-name">${escapeHTML(baseName)}</strong>
              ${formName ? `<span class="pkm-form-badge">${escapeHTML(formName)}</span>` : ''}
              <span class="tag-badge tag-cat-${escapeHTML(pkm.category || 'main')}">${escapeHTML(pkm.categoryName || '主圖鑑')}</span>
              <div class="pkm-name-region-wrap">
                ${tableLocationSelectHTML}
              </div>
            </div>
          </td>
          <td class="pkm-col-avatar" title="點擊查看 ${escapeHTML(pkm.name)} 完整百科與喜好">
            <div class="pkm-avatar-cell">
              <img decoding="async" class="pkm-avatar-table-large" src="${pkm.sprite}" alt="${escapeHTML(pkm.name)}" onerror="this.src='${FALLBACK_SPRITE}'" loading="lazy">
            </div>
          </td>
          <td><span class="tag-badge tag-env" data-env="${escapeHTML(pkm.environment)}" title="點擊在喜好百科查看「${escapeHTML(pkm.environment)}」營造家具與說明">${escapeHTML(pkm.environment)}</span></td>
          <td>
            <div class="spec-column-group">
              ${specs.map(s => {
                const icon = SPECIALTY_ICONS[s] || '⚡';
                return `<span class="tag-specialty" data-spec="${escapeHTML(s)}" title="點擊篩選專長：${escapeHTML(s)}">${icon} ${escapeHTML(s)}</span>`;
              }).join('')}
            </div>
          </td>
          <td class="col-td-region">
            <div class="pkm-standalone-region-wrap">
              ${tableLocationSelectHTML}
            </div>
          </td>
          <td class="pkm-col-hab">${habsCell}</td>
          <td class="col-favorites">
            <div class="fav-column-group">
              ${pkm.favorites.map(f => renderPrefPill(f)).join('')}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners for Pokemon checkboxes (支援勾選暫留機制，不因重新過濾導致卡片瞬間消失)
    document.querySelectorAll('.pkm-checkbox').forEach(box => {
      box.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const isChecked = e.target.checked;
        state.pkmChecked[id] = isChecked;
        saveProgress(STORAGE_KEY_PKM, state.pkmChecked);
        renderStats();

        const card = document.querySelector(`.card-grid .item-card[data-id="${id}"]`);
        if (card) {
          if (isChecked) card.classList.add('completed');
          else card.classList.remove('completed');
        }
        const row = document.querySelector(`.data-table tr[data-id="${id}"]`);
        if (row) {
          if (isChecked) row.classList.add('completed');
          else row.classList.remove('completed');
        }
        document.querySelectorAll(`.pkm-checkbox[data-id="${id}"]`).forEach(cb => {
          cb.checked = isChecked;
        });
      });
    });

    // Event listeners for Thumbnail Lightbox
    document.querySelectorAll('.habitat-thumb-box').forEach(box => {
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(box.dataset.img, box.dataset.caption);
      });
    });

    // Event listeners for Jump to Habitat Button
    document.querySelectorAll('.habitat-jump-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentPkm = btn.closest('.item-card, tr[data-id]');
        const sourcePkmId = parentPkm ? parentPkm.dataset.id : null;
        jumpToHabitat(btn.dataset.habId, true, sourcePkmId);
      });
    });

    // Event listeners for Table Habitat Carousel Navigation (‹ and › in Bottom Bar)
    document.querySelectorAll('.pkm-hab-arrow-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const carousel = btn.closest('.pkm-table-hab-carousel');
        if (!carousel) return;
        
        const rawHabs = carousel.getAttribute('data-habs');
        if (!rawHabs) return;
        
        let habs = [];
        try {
          habs = JSON.parse(rawHabs);
        } catch (err) {
          return;
        }
        if (!habs || habs.length <= 1) return;

        let currentIndex = parseInt(carousel.getAttribute('data-current-index') || '0', 10);
        if (btn.classList.contains('pkm-hab-prev')) {
          currentIndex = (currentIndex - 1 + habs.length) % habs.length;
        } else {
          currentIndex = (currentIndex + 1) % habs.length;
        }
        carousel.setAttribute('data-current-index', currentIndex);

        const currentHab = habs[currentIndex];
        const pkmName = carousel.getAttribute('data-pkm-name') || '';
        const thumb = carousel.querySelector('.pkm-table-hab-thumb');
        const nameText = carousel.querySelector('.pkm-hab-name-text');

        if (thumb) {
          thumb.setAttribute('data-hab-id', currentHab.id || '');
          thumb.setAttribute('data-img', currentHab.img || '');
          thumb.setAttribute('data-caption', `<strong>${escapeHTML(pkmName)}</strong> - ${escapeHTML(currentHab.name)}`);
          thumb.setAttribute('title', `${currentHab.name}（點擊查看官方實機全景）`);
          
          let imgEl = thumb.querySelector('.pkm-hab-active-img');
          let placeholderEl = thumb.querySelector('.hab-thumb-placeholder');
          if (currentHab.img) {
            if (!imgEl) {
              imgEl = document.createElement('img');
              imgEl.className = 'pkm-hab-active-img';
              imgEl.setAttribute('loading', 'lazy');
              thumb.prepend(imgEl);
            }
            imgEl.src = currentHab.img;
            imgEl.alt = currentHab.name;
            imgEl.style.display = 'block';
            if (placeholderEl) placeholderEl.style.display = 'none';
          } else {
            if (imgEl) imgEl.style.display = 'none';
            if (!placeholderEl) {
              placeholderEl = document.createElement('div');
              placeholderEl.className = 'hab-thumb-placeholder';
              placeholderEl.innerHTML = `<span class="pkm-hab-placeholder-text">${escapeHTML(currentHab.name)}</span>`;
              thumb.prepend(placeholderEl);
            } else {
              placeholderEl.style.display = 'flex';
              const textSpan = placeholderEl.querySelector('.pkm-hab-placeholder-text');
              if (textSpan) textSpan.textContent = `${currentHab.name}`;
            }
          }
        }

        if (nameText) {
          nameText.textContent = `${currentHab.name} (${currentIndex + 1}/${habs.length})`;
          nameText.setAttribute('title', currentHab.name);
        }
      });
    });

    // Event listeners for Pokemon Card & Table Habitat Thumbnails (點擊直接跳轉至棲息地圖鑑)
    document.querySelectorAll('.pkm-card-hab-thumb, .pkm-table-hab-thumb').forEach(box => {
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        const habId = box.dataset.habId;
        if (habId) {
          const parentPkm = box.closest('.item-card, tr[data-id]');
          const sourcePkmId = parentPkm ? parentPkm.dataset.id : null;
          jumpToHabitat(habId, true, sourcePkmId);
        } else if (box.dataset.img) {
          openLightbox(box.dataset.img, box.dataset.caption);
        }
      });
    });

    // Event listeners for Specialty Badges quick filter
    document.querySelectorAll('.tag-specialty').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const spec = badge.dataset.spec;
        if (spec) {
          state.selectedSpecialtyFilter = spec;
          if (DOM.specialtyFilter) {
            DOM.specialtyFilter.value = spec;
          }
          renderAll();
        }
      });
    });

    // Event listeners for Pokemon Location Chips (點擊直接跳轉至地區地圖)
    document.querySelectorAll('.pkm-location-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const rId = chip.getAttribute('data-region-id');
        navigateToRegion(rId || 'palette_town');
      });
    });

    // Event listeners for Table & Mobile Location Selects (表格內直接更換地區)
    document.querySelectorAll('.pkm-table-region-select, .pkm-mobile-location-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
        const pkmId = sel.getAttribute('data-pkm-id');
        const targetRegionId = sel.value;
        setPokemonRegion(pkmId, targetRegionId);
      });
      sel.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    return hasResults;
  }

  // Render Habitat Catalog (New Tab 3: Habitat-first View)
  function renderHabitatCatalog() {
    const query = state.searchQuery;
    const filterEnv = state.selectedEnvFilter;

    const habitats = (window.POKOPIA_DATA.habitats || []).filter(hab => {
      // Hab category filter (全部 / 主棲息地 / 活動棲息地 / 海底棲息地)
      if (state.selectedHabCategory !== 'all' && hab.category !== state.selectedHabCategory) {
        return false;
      }
      // Env filter (使用 ENV_FILTER_MAP 轉換為中文關鍵字進行匹對)
      if (filterEnv !== 'env-all') {
        const envKey = filterEnv.replace('env-', '');
        const envZh = ENV_FILTER_MAP[envKey] || envKey;
        if (!hab.environment || !hab.environment.includes(envZh)) return false;
      }
      // Unlock filter (all / unlocked / locked)
      if (state.selectedUnlockFilter !== 'all') {
        const isAllUnlocked = hab.pokemons && hab.pokemons.length > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]));
        if (state.selectedUnlockFilter === 'unlocked' && !isAllUnlocked) return false;
        if (state.selectedUnlockFilter === 'locked' && isAllUnlocked) return false;
      }
      // Search query filter
      if (!query) return true;
      const habText = (
        (hab.official_id || '') + ' ' + 
        hab.name + ' ' + 
        (hab.categoryName || '') + ' ' + 
        (hab.desc || '') + ' ' + 
        hab.details + ' ' + 
        hab.environment + ' ' + 
        hab.pokemons.map(p => p.number + ' ' + p.name).join(' ')
      ).toLowerCase();
      return habText.includes(query);
    });

    let hasResults = habitats.length > 0;

    const parseHabitatDetailItems = (details) => {
      if (!details || details === '—') return [];
      const regex = /([^\s].*?)\s+x\s+(\d+)/g;
      const items = [];
      let match;
      while ((match = regex.exec(details)) !== null) {
        items.push(`${match[1].trim()} x ${match[2]}`);
      }
      return items.length > 0 ? items : [details];
    };

    // Render Cards
    DOM.habitatCatalogCardGrid.innerHTML = habitats.map(hab => {
      const pkmCount = hab.pokemons.length;
      const isAllPkmUnlocked = pkmCount > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]));
      const isChecked = isAllPkmUnlocked;
      const detailItems = parseHabitatDetailItems(hab.details);
      const cardDetailsHTML = detailItems.length > 0
        ? detailItems.map(item => `<span class="hab-furniture-item">${escapeHTML(item)}</span>`).join('<span class="hab-sep">•</span>')
        : '—';
      const cardDetailsPlainText = detailItems.join('  •  ');
      const thumbBadgeHTML = isAllPkmUnlocked
        ? `<div class="habitat-thumb-badge is-unlocked" title="此棲息地寶可夢已全數吸引（點擊查看實機全景）">✔</div>`
        : `<div class="habitat-thumb-badge" title="點擊查看高清實機全景">🔍</div>`;
      const imgThumbHTML = hab.image ? `
        <div class="hab-catalog-thumb-box" data-img="${escapeHTML(hab.image)}" data-caption="<strong>${escapeHTML(hab.official_id)} ${escapeHTML(hab.name)}</strong> - ${escapeHTML(cardDetailsPlainText)}" title="點擊查看高清實機全景">
          <img decoding="async" src="${hab.image}" alt="${escapeHTML(hab.name)}" loading="lazy">
          ${thumbBadgeHTML}
        </div>
      ` : `
        <div class="hab-catalog-thumb-box hab-thumb-placeholder" title="暫無實機截圖">
          <span>🏡</span>
        </div>
      `;

      const pkmChipsHTML = [...hab.pokemons].sort((a, b) => parseInt((a.number || '0').replace(/\D/g, '')) - parseInt((b.number || '0').replace(/\D/g, ''))).map(p => {
        const isPkmUnlocked = !!(state.pkmChecked && state.pkmChecked[p.id]);
        const unlockBadge = isPkmUnlocked ? '<span class="pkm-unlocked-badge" title="已解鎖">✔</span>' : '';
        const statusText = isPkmUnlocked ? '【已解鎖】' : '';
        return `
          <div class="hab-pkm-chip ${isPkmUnlocked ? 'is-unlocked' : ''}" data-pkm-id="${p.id}" title="${statusText}${escapeHTML(p.name)} - 點擊跳轉圖鑑">
            <img decoding="async" src="${p.sprite}" alt="${escapeHTML(p.name)}" onerror="this.src='${FALLBACK_SPRITE}'" loading="lazy">
            <span>${escapeHTML(p.name)}</span>
            ${unlockBadge}
          </div>
        `;
      }).join('');

      return `
        <div class="habitat-catalog-card ${isChecked ? 'completed' : ''}" data-id="${hab.id}">
          <div class="hab-content-body">
            <div class="hab-card-top-row">
              <div class="hab-card-info-col">
                <div class="hab-header-title-row">
                  <div class="hab-header-title">
                    <span class="hab-num-pill">${escapeHTML(hab.official_id || hab.id)}</span>
                    🏡 ${escapeHTML(hab.zh_name || hab.name)}
                  </div>
                  <div class="hab-badge-row">
                    <span class="tag-badge tag-cat-${escapeHTML(hab.category || 'main')}">${escapeHTML(hab.categoryName || '主棲息地')}</span>
                    <span class="tag-badge tag-env" data-env="${escapeHTML(hab.environment)}" title="點擊在喜好百科查看「${escapeHTML(hab.environment)}」營造家具與說明">${escapeHTML(hab.environment)}</span>
                    <span class="hab-count-badge">🐾 可吸引 ${pkmCount} 隻</span>
                    ${isChecked ? '<span class="tag-badge" style="background:#10b981; color:#fff;">✔ 全數解鎖</span>' : ''}
                  </div>
                </div>
                ${hab.desc ? `<div class="hab-desc-quote">${escapeHTML(hab.desc)}</div>` : ''}
                <div class="hab-furniture-box">
                  <div class="hab-furniture-label">🪑 構成傢俱與擺設需求：</div>
                  <div class="hab-furniture-text">${cardDetailsHTML}</div>
                </div>
              </div>
              <div class="hab-card-right-group">
                ${imgThumbHTML}
              </div>
            </div>
            <div class="hab-pokemon-section">
              <div class="hab-pokemon-label">
                <span>🎯 能吸引的寶可夢 (${pkmCount} 隻)：</span>
                <small style="color:var(--text-muted); font-weight:normal;">點擊可跳轉圖鑑</small>
              </div>
              <div class="hab-pokemon-grid">
                ${pkmChipsHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Render Table Rows (4 欄：棲息地、外觀、擺設條件、可吸引寶可夢)
    DOM.habitatCatalogTableBody.innerHTML = habitats.map(hab => {
      const pkmCount = hab.pokemons.length;
      const isAllPkmUnlocked = pkmCount > 0 && hab.pokemons.every(p => !!(state.pkmChecked && state.pkmChecked[p.id]));
      const isChecked = isAllPkmUnlocked;
      const detailItems = parseHabitatDetailItems(hab.details);
      const tableDetailsHTML = detailItems.length > 0
        ? detailItems.map(item => `<div class="hab-detail-line">${escapeHTML(item)}</div>`).join('')
        : '—';
      const thumbBadgeHTML = isAllPkmUnlocked
        ? `<div class="habitat-thumb-badge is-unlocked" title="此棲息地寶可夢已全數吸引（點擊放大全景）">✔</div>`
        : `<div class="habitat-thumb-badge" title="點擊放大全景">🔍</div>`;
      const imgPreview = hab.image ? `
        <div class="table-hab-thumb-wrap" data-img="${escapeHTML(hab.image)}" data-caption="<strong>${escapeHTML(hab.official_id)} ${escapeHTML(hab.name)}</strong> - ${escapeHTML(detailItems.join('   '))}" title="點擊放大全景">
          <img decoding="async" src="${hab.image}" alt="${escapeHTML(hab.name)}" class="table-hab-img" loading="lazy">
          ${thumbBadgeHTML}
        </div>
      ` : `
        <div class="table-hab-thumb-wrap table-hab-thumb-empty">
          <span>🏡</span>
        </div>
      `;

      const pkmIconsHTML = [...hab.pokemons].sort((a, b) => parseInt((a.number || '0').replace(/\D/g, '')) - parseInt((b.number || '0').replace(/\D/g, ''))).map(p => {
        const isPkmUnlocked = !!(state.pkmChecked && state.pkmChecked[p.id]);
        const unlockBadge = isPkmUnlocked ? '<span class="pkm-unlocked-badge" title="已解鎖">✔</span>' : '';
        const statusText = isPkmUnlocked ? '【已解鎖】' : '';
        return `
          <div class="hab-pkm-icon-btn ${isPkmUnlocked ? 'is-unlocked' : ''}" data-pkm-id="${p.id}" title="${statusText}${escapeHTML(p.name)} (${escapeHTML(p.number)}) - 點擊跳轉圖鑑">
            <img decoding="async" src="${p.sprite}" alt="${escapeHTML(p.name)}" onerror="this.src='${FALLBACK_SPRITE}'" loading="lazy">
            ${unlockBadge}
          </div>
        `;
      }).join('');

      return `
        <tr data-id="${hab.id}" class="${isChecked ? 'completed' : ''}">
          <td class="col-hab-identity">
            <div class="table-hab-id-cell">
              <span class="hab-num-pill">${escapeHTML(hab.official_id || hab.id)}</span>
              <div class="table-hab-name-zh">${escapeHTML(hab.zh_name || hab.name.split(' (')[0])}</div>
              <div class="table-hab-tags-row">
                <span class="tag-badge tag-cat-${escapeHTML(hab.category || 'main')}">${escapeHTML(hab.categoryName || '主棲息地')}</span>
                <span class="tag-badge tag-env" data-env="${escapeHTML(hab.environment)}" title="點擊在喜好百科查看「${escapeHTML(hab.environment)}」營造家具與說明">${escapeHTML(hab.environment)}</span>
              </div>
            </div>
          </td>
          <td class="col-hab-appearance">
            <div class="table-hab-appearance-cell">
              ${imgPreview}
            </div>
          </td>
          <td class="col-hab-details">
            <div class="table-hab-detail-box">${tableDetailsHTML}</div>
          </td>
          <td class="col-hab-pokemons">
            <div class="table-pkm-icon-grid">
              ${pkmIconsHTML}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Event listeners for Lightbox in Catalog
    document.querySelectorAll('.hab-catalog-thumb-box[data-img], .table-hab-thumb-wrap[data-img]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightbox(el.dataset.img, el.dataset.caption);
      });
    });

    // Event listeners for Jumping to Pokemon
    document.querySelectorAll('.hab-pkm-chip, .hab-pkm-icon-btn').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentItem = chip.closest('.habitat-catalog-card, tr[data-id]');
        const sourceHabId = parentItem ? parentItem.dataset.id : null;
        jumpToPokemon(chip.dataset.pkmId, true, sourceHabId);
      });
    });

    return hasResults;
  }

  // Render All depending on active tab
  function renderAll() {
    let hasResults = true;
    if (state.currentTab === 'storage') {
      hasResults = renderStorage();
    } else if (state.currentTab === 'habitat') {
      hasResults = renderHabitat();
    } else if (state.currentTab === 'habitatCatalog') {
      hasResults = renderHabitatCatalog();
    } else if (state.currentTab === 'recipe') {
      if (window.RecipeModule) {
        window.RecipeModule.setKeyword(state.searchQuery);
        hasResults = true;
      }
    } else if (state.currentTab === 'autofarm') {
      hasResults = renderAutoFarm();
    } else if (state.currentTab === 'preferences') {
      renderPrefDrawerContent();
      hasResults = true;
    }

    if (!hasResults) {
      DOM.emptyResult.classList.remove('hidden');
    } else {
      DOM.emptyResult.classList.add('hidden');
    }
  }

  // ==========================================================================
  // 終局自動化農場規劃 (End-Game Auto Farm Controller & Renderer)
  // ==========================================================================
  function isAutoFarmAuthorized(user) {
    if (!user) {
      const fb = window.PokopiaFirebase;
      if (fb && typeof fb.getCurrentUser === 'function') {
        user = fb.getCurrentUser();
      }
    }
    if (user && user.email) {
      const isAuth = user.email.trim().toLowerCase() === AUTOFARM_ALLOWED_EMAIL.toLowerCase();
      try {
        if (isAuth) {
          localStorage.setItem(STORAGE_KEY_AUTOFARM_AUTHED, '1');
        } else {
          localStorage.removeItem(STORAGE_KEY_AUTOFARM_AUTHED);
        }
      } catch (e) {}
      return isAuth;
    }
    // 若尚未取得 Firebase User（例如按 F5 重新整理剛載入瞬間），讀取本地授權信任快照
    try {
      if (localStorage.getItem(STORAGE_KEY_AUTOFARM_AUTHED) === '1') {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function updateAutoFarmAuthUI(user) {
    let isAuth = false;
    if (user && user.email) {
      isAuth = user.email.trim().toLowerCase() === AUTOFARM_ALLOWED_EMAIL.toLowerCase();
      try {
        if (isAuth) {
          localStorage.setItem(STORAGE_KEY_AUTOFARM_AUTHED, '1');
        } else {
          localStorage.removeItem(STORAGE_KEY_AUTOFARM_AUTHED);
        }
      } catch (e) {}
    } else if (user === null) {
      // 明確登出狀態，立即清除授權快取
      try { localStorage.removeItem(STORAGE_KEY_AUTOFARM_AUTHED); } catch (e) {}
      isAuth = false;
    } else {
      isAuth = isAutoFarmAuthorized(user);
    }

    if (DOM.btnAutoFarmNav) {
      if (isAuth) {
        DOM.btnAutoFarmNav.classList.remove('hidden');
      } else {
        DOM.btnAutoFarmNav.classList.add('hidden');
      }
    }
    if (DOM.tabAutoFarm) {
      if (isAuth) {
        DOM.tabAutoFarm.classList.remove('hidden');
      } else {
        DOM.tabAutoFarm.classList.add('hidden');
      }
    }
    if (DOM.btnCustomStorageNav) {
      if (isAuth) {
        DOM.btnCustomStorageNav.classList.remove('hidden');
      } else {
        DOM.btnCustomStorageNav.classList.add('hidden');
      }
    }
    if (DOM.tabCustomStorage) {
      if (isAuth) {
        DOM.tabCustomStorage.classList.remove('hidden');
      } else {
        DOM.tabCustomStorage.classList.add('hidden');
      }
    }
    if (DOM.tabVideo) {
      if (isAuth) {
        DOM.tabVideo.classList.remove('hidden');
      } else {
        DOM.tabVideo.classList.add('hidden');
      }
    }
    if (DOM.btnVideoNav) {
      if (isAuth) {
        DOM.btnVideoNav.classList.remove('hidden');
      } else {
        DOM.btnVideoNav.classList.add('hidden');
      }
    }
    if (DOM.tabBuzz3d) {
      if (isAuth) {
        DOM.tabBuzz3d.classList.remove('hidden');
      } else {
        DOM.tabBuzz3d.classList.add('hidden');
      }
    }
    if (DOM.btnBuzz3dNav) {
      if (isAuth) {
        DOM.btnBuzz3dNav.classList.remove('hidden');
      } else {
        DOM.btnBuzz3dNav.classList.add('hidden');
      }
    }

    // 若未授權但當前在 autofarm, customStorage, video 或 buzz3d 分頁，立即跳轉回首頁
    if (!isAuth && (state.currentTab === 'autofarm' || state.currentTab === 'customStorage' || state.currentTab === 'video' || state.currentTab === 'buzz3d')) {
      switchTab('habitat', true);
      pushNavHistory({ tab: 'habitat', view: state.currentView || 'table' });
    }
  }

  function renderAutoFarm() {
    if (!DOM.autoFarmModulesContainer) return true;

    const modules = window.AUTOFARM_MODULES || [];
    if (!modules.length) {
      DOM.autoFarmModulesContainer.innerHTML = '<div class="autofarm-empty">尚無農場資料</div>';
      return true;
    }

    let html = '';
    modules.forEach(m => {
      // 寶可夢徽章清單
      let pkmHtml = '';
      if (m.assignedPokemon && m.assignedPokemon.length > 0) {
        pkmHtml = m.assignedPokemon.map(p => `
          <div class="autofarm-pkm-badge" data-pkm-id="${p.id}" title="點擊查看 No.${p.dexNo} ${escapeHTML(p.name)} 圖鑑百科">
            <div class="autofarm-pkm-avatar-wrap">
              <img decoding="async" src="${p.sprite}" alt="${escapeHTML(p.name)}" class="autofarm-pkm-sprite" loading="lazy" onerror="this.src='${FALLBACK_SPRITE}'">
            </div>
            <div class="autofarm-pkm-info">
              <div class="autofarm-pkm-top">
                <span class="autofarm-pkm-no">No.${p.dexNo}</span>
                <strong class="autofarm-pkm-name">${escapeHTML(p.name)}</strong>
              </div>
              <div class="autofarm-pkm-spec">特長：${escapeHTML(p.specialty)}</div>
              <div class="autofarm-pkm-role">${escapeHTML(p.role)}</div>
              <div class="autofarm-pkm-comfort">滿舒適度需求：<span class="comfort-highlight">${escapeHTML(p.comfortRequired)}</span></div>
            </div>
          </div>
        `).join('');
      } else {
        pkmHtml = '<div class="autofarm-no-pkm">💧 純水流重力自動化運作，無需配置寶可夢（極致節省全島 22 隻珍貴額度）</div>';
      }

      // 必備道具清單（帶本地圖片）
      let itemsHtml = '';
      if (m.requiredItems && m.requiredItems.length > 0) {
        itemsHtml = m.requiredItems.map(item => `
          <div class="autofarm-item-chip" title="${escapeHTML(item.name)}: ${escapeHTML(item.purpose)}">
            <img decoding="async" src="${item.sprite}" alt="${escapeHTML(item.name)}" class="autofarm-item-img" loading="lazy">
            <div class="autofarm-item-meta">
              <span class="autofarm-item-name">${escapeHTML(item.name)}</span>
              <span class="autofarm-item-qty">${escapeHTML(item.qty)}</span>
            </div>
          </div>
        `).join('');
      }

      // 步驟
      let stepsHtml = '';
      if (m.buildSteps && m.buildSteps.length > 0) {
        stepsHtml = m.buildSteps.map((step, idx) => `
          <li class="autofarm-step-item">
            <span class="autofarm-step-idx">${idx + 1}</span>
            <span class="autofarm-step-text">${escapeHTML(step)}</span>
          </li>
        `).join('');
      }

      // 避坑指引 (Pro Tips)
      let tipsHtml = '';
      if (m.proTips && m.proTips.length > 0) {
        tipsHtml = m.proTips.map(tip => `
          <div class="autofarm-tip-row">
            <span class="autofarm-tip-icon">⚠️</span>
            <span class="autofarm-tip-desc">${escapeHTML(tip)}</span>
          </div>
        `).join('');
      }



      html += `
        <article class="autofarm-card" id="farm-${m.id}">
          <header class="autofarm-card-header">
            <div class="autofarm-card-header-top">
              <span class="autofarm-part-badge">PART ${String(m.partNumber).padStart(2, '0')}</span>
              <span class="autofarm-category-badge">${escapeHTML(m.category)}</span>
            </div>
            <h3 class="autofarm-card-title">${escapeHTML(m.title)}</h3>
            <p class="autofarm-card-tagline">${escapeHTML(m.tagline)}</p>
          </header>

          <div class="autofarm-card-body">
            <!-- 作業寶可夢 -->
            <div class="autofarm-sub-block">
              <h4 class="autofarm-sub-title">🐾 作業寶可夢配置 (${m.assignedPokemon ? m.assignedPokemon.length : 0} 隻)</h4>
              <div class="autofarm-pkm-grid">
                ${pkmHtml}
              </div>
            </div>

            <!-- 核心產物收穫 -->
            <div class="autofarm-sub-block">
              <h4 class="autofarm-sub-title">✨ 核心產物收穫</h4>
              <div class="autofarm-items-row">
                ${itemsHtml}
              </div>
            </div>

            <!-- 建造與流向步驟 -->
            <div class="autofarm-sub-block">
              <h4 class="autofarm-sub-title">📐 模組搭建指引</h4>
              <ol class="autofarm-steps-list">
                ${stepsHtml}
              </ol>
            </div>

            <!-- 避坑與調校注意事項 -->
            ${tipsHtml ? `
              <div class="autofarm-tips-box">
                <div class="autofarm-tips-title">💡 建造要點與避坑提醒</div>
                ${tipsHtml}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    });

    DOM.autoFarmModulesContainer.innerHTML = html;

    // 綁定寶可夢卡片點擊查看百科詳情事件
    const pkmBadges = DOM.autoFarmModulesContainer.querySelectorAll('.autofarm-pkm-badge[data-pkm-id]');
    pkmBadges.forEach(badge => {
      badge.addEventListener('click', () => {
        const pkmId = badge.getAttribute('data-pkm-id');
        if (pkmId && typeof openPkmDetailModal === 'function') {
          openPkmDetailModal(pkmId);
        }
      });
    });

    return true;
  }

  function toggleAutoFarmCheck(chkId, checked) {
    if (!state.autoFarmChecked) state.autoFarmChecked = {};
    if (checked) {
      state.autoFarmChecked[chkId] = true;
    } else {
      delete state.autoFarmChecked[chkId];
    }
    saveProgress(STORAGE_KEY_AUTOFARM, state.autoFarmChecked);

    // 觸發雲端儲存
    const fb = window.PokopiaFirebase;
    if (fb && typeof fb.getCurrentUser === 'function') {
      const user = fb.getCurrentUser();
      if (user && isAutoFarmAuthorized(user)) {
        fb.saveCloudProgress(user.uid, { autoFarmChecked: state.autoFarmChecked });
      }
    }

    // 更新 label 的 class
    const label = DOM.autoFarmModulesContainer.querySelector(`.autofarm-chk-label[data-chk-id="${chkId}"]`);
    if (label) {
      if (checked) {
        label.classList.add('is-checked');
      } else {
        label.classList.remove('is-checked');
      }
    }

    // 重新計算進度條
    const modules = window.AUTOFARM_MODULES || [];
    let totalItems = 0;
    let checkedItems = 0;
    modules.forEach(m => {
      (m.checklist || []).forEach(item => {
        totalItems++;
        if (state.autoFarmChecked && state.autoFarmChecked[item.id]) {
          checkedItems++;
        }
      });
    });
    const percent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
    if (DOM.autoFarmProgressBar) {
      DOM.autoFarmProgressBar.style.width = percent + '%';
    }
    if (DOM.autoFarmProgressText) {
      DOM.autoFarmProgressText.textContent = `${checkedItems} / ${totalItems} (${percent}%)`;
    }
  }

  // ==========================================================================
  // 自訂收納盒物品管理與反查系統 (Custom Storage Boxes & Reverse Search)
  // ==========================================================================

  let isCustomStorageEventsBound = false;
  let activeDropTargetBoxId = null;

  // 儲存收納盒設定 (本地與雲端)
  function saveCustomBoxes() {
    saveProgress(STORAGE_KEY_CUSTOM_STORAGE, state.customBoxes);
    const fb = window.PokopiaFirebase;
    if (fb && typeof fb.getCurrentUser === 'function') {
      const user = fb.getCurrentUser();
      if (user && isAutoFarmAuthorized(user)) {
        fb.saveCloudProgress(user.uid, { customBoxes: state.customBoxes });
      }
    }
  }

  // 取得物品圖示 (支援 preferences_db.js 1800+ 物品圖示庫與容錯)
  function getItemIcon(itemName) {
    if (!itemName) return FALLBACK_SPRITE;
    const db = window.POKOPIA_PREFERENCES_DB;
    if (db && db.itemIcons) {
      if (db.itemIcons[itemName]) return db.itemIcons[itemName];
      const keys = Object.keys(db.itemIcons);
      const matched = keys.find(k => k === itemName || k.includes(itemName) || itemName.includes(k));
      if (matched) return db.itemIcons[matched];
    }
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='%2364748b'><rect width='20' height='20' x='2' y='2' rx='4' fill-opacity='0.15' stroke='%2364748b' stroke-width='2'/><text x='12' y='16' font-size='12' text-anchor='middle' fill='%2364748b'>📦</text></svg>";
  }

  // 素材庫物品官方全局順序索引映射 (快取 1238 種官方物品順序)
  let _trayItemOrderMap = null;
  function getTrayItemOrderMap() {
    if (_trayItemOrderMap && _trayItemOrderMap.size > 0) return _trayItemOrderMap;
    _trayItemOrderMap = new Map();
    const db = window.POKOPIA_PREFERENCES_DB;
    const itemsDb = (db && db.items) ? db.items : {};
    let idx = 0;
    Object.keys(itemsDb).forEach(cat => {
      (itemsDb[cat] || []).forEach(item => {
        if (item && item.name && !_trayItemOrderMap.has(item.name)) {
          _trayItemOrderMap.set(item.name, idx++);
        }
      });
    });
    return _trayItemOrderMap;
  }

  // 將收納盒物品陣列依據素材庫官方順序排列
  function sortBoxItems(items) {
    if (!Array.isArray(items) || items.length <= 1) return items || [];
    const orderMap = getTrayItemOrderMap();
    return items.sort((a, b) => {
      const orderA = orderMap.has(a) ? orderMap.get(a) : 999999;
      const orderB = orderMap.has(b) ? orderMap.get(b) : 999999;
      if (orderA !== orderB) return orderA - orderB;
      return a.localeCompare(b, 'zh-Hant');
    });
  }

  // 整理所有收納盒內的物品順序
  function sortAllCustomBoxes() {
    if (!Array.isArray(state.customBoxes)) return;
    state.customBoxes.forEach(box => {
      if (Array.isArray(box.items)) {
        sortBoxItems(box.items);
      }
    });
  }

  // 觸發加入物品至當前選中之收納盒
  function handleTrayItemAdd(itemName) {
    if (!itemName) return;
    const boxes = state.customBoxes || [];
    if (boxes.length === 0) {
      alert('請先建立至少一個收納盒！');
      return;
    }
    const targetBox = boxes.find(b => b.id === activeDropTargetBoxId) || boxes[0];
    addItemToBox(targetBox.id, itemName);
  }

  // 主渲染入口
  function renderCustomStorage() {
    if (!DOM.customStorageSection) return;
    sortAllCustomBoxes();
    initCustomStorageEvents();
    renderCustomBoxesGrid();
    renderCustomTrayItems(state.activeTraySearch || '');

    // 更新收納盒標題徽章箱數 (統一頂部卡片徽章)
    const badgeText = DOM.catalogBadgeText || document.getElementById('catalogBadgeText');
    if (badgeText && state.currentTab === 'customStorage') {
      const boxCount = (state.customBoxes || []).length;
      badgeText.innerHTML = boxCount > 0 ? `<strong>${boxCount}</strong> 箱收納管理` : '自訂收納管理';
    }
  }

  // 手機/小螢幕素材庫抽屜控制 (Bottom Sheet Drawer Controller)
  function openCsDrawer() {
    if (DOM.csItemTray) DOM.csItemTray.classList.add('drawer-open');
    if (DOM.csTrayBackdrop) {
      DOM.csTrayBackdrop.classList.remove('hidden');
      void DOM.csTrayBackdrop.offsetWidth;
      DOM.csTrayBackdrop.classList.add('is-active');
    }
  }

  function closeCsDrawer() {
    if (DOM.csItemTray) DOM.csItemTray.classList.remove('drawer-open');
    if (DOM.csTrayBackdrop) {
      DOM.csTrayBackdrop.classList.remove('is-active');
      setTimeout(() => {
        if (DOM.csTrayBackdrop && !DOM.csTrayBackdrop.classList.contains('is-active')) {
          DOM.csTrayBackdrop.classList.add('hidden');
        }
      }, 200);
    }
  }

  function toggleCsDrawer() {
    if (DOM.csItemTray && DOM.csItemTray.classList.contains('drawer-open')) {
      closeCsDrawer();
    } else {
      openCsDrawer();
    }
  }

  // 初始化一次性全域事件綁定
  function initCustomStorageEvents() {
    if (isCustomStorageEventsBound) return;
    isCustomStorageEventsBound = true;

    // 1. 新增收納盒 (頂部與底部雙通道便捷入口)
    if (DOM.btnCsAddBox) {
      DOM.btnCsAddBox.addEventListener('click', addNewBox);
    }
    if (DOM.btnCsAddBoxBottom) {
      DOM.btnCsAddBoxBottom.addEventListener('click', addNewBox);
    }

    // 2. 切換/開關物品素材庫抽屜 (小螢幕 Bottom Sheet)
    if (DOM.btnCsToggleDrawer) {
      DOM.btnCsToggleDrawer.addEventListener('click', toggleCsDrawer);
    }
    if (DOM.btnCsCloseTray) {
      DOM.btnCsCloseTray.addEventListener('click', closeCsDrawer);
    }
    if (DOM.csTrayBackdrop) {
      DOM.csTrayBackdrop.addEventListener('click', closeCsDrawer);
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.csItemTray && DOM.csItemTray.classList.contains('drawer-open')) {
        closeCsDrawer();
      }
    });

    // 3. 物品素材庫托盤搜尋
    if (DOM.csTraySearchInput) {
      let trayTimer = null;
      DOM.csTraySearchInput.addEventListener('input', (e) => {
        clearTimeout(trayTimer);
        trayTimer = setTimeout(() => {
          state.activeTraySearch = e.target.value.trim();
          renderCustomTrayItems(state.activeTraySearch);
        }, 150);
      });
    }

    // 3.1 素材庫官方分類下拉選單切換
    if (DOM.csTrayCategorySelect) {
      DOM.csTrayCategorySelect.addEventListener('change', (e) => {
        state.activeTrayCategory = e.target.value;
        renderCustomTrayItems(state.activeTraySearch || '');
      });
    }

    // 3.2 素材庫目標收納盒下拉選單切換
    if (DOM.csTrayTargetBoxSelect) {
      DOM.csTrayTargetBoxSelect.addEventListener('change', (e) => {
        const bId = e.target.value;
        if (bId) {
          setActiveTargetBox(bId, false);
        }
      });
    }

    // 4. 反查搜尋框
    if (DOM.csReverseSearchInput) {
      let searchTimer = null;
      DOM.csReverseSearchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          handleReverseSearch(e.target.value.trim());
        }, 200);
      });
    }

    // 5. 清除反查按鈕
    if (DOM.csClearSearchBtn) {
      DOM.csClearSearchBtn.addEventListener('click', () => {
        if (DOM.csReverseSearchInput) DOM.csReverseSearchInput.value = '';
        handleReverseSearch('');
      });
    }

    // 6. 素材庫卡片點擊與拖曳 (事件委派 + Pointer 容差 6px 判定，保證 100% 靈敏度並兼容原生拖曳)
    if (DOM.csTrayGrid) {
      let trayPointerStart = null;
      let lastTrayAddTimestamp = 0;

      DOM.csTrayGrid.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const itemEl = e.target.closest('.cs-tray-item');
        if (!itemEl) return;
        trayPointerStart = {
          x: e.clientX,
          y: e.clientY,
          time: Date.now(),
          itemName: itemEl.getAttribute('data-item-name')
        };
      });

      DOM.csTrayGrid.addEventListener('pointerup', (e) => {
        if (!trayPointerStart) return;
        const start = trayPointerStart;
        trayPointerStart = null;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Date.now() - start.time;

        // 容差 <= 6px 且點擊間隔 < 600ms，判定為有效點擊！
        if (dist <= 6 && duration < 600) {
          lastTrayAddTimestamp = Date.now();
          handleTrayItemAdd(start.itemName);
        }
      });

      DOM.csTrayGrid.addEventListener('pointercancel', () => {
        trayPointerStart = null;
      });

      DOM.csTrayGrid.addEventListener('dragstart', (e) => {
        trayPointerStart = null; // 開始拖曳，取消點擊判定
        const itemEl = e.target.closest('.cs-tray-item');
        if (!itemEl) return;
        const itemName = itemEl.getAttribute('data-item-name');
        if (itemName && e.dataTransfer) {
          e.dataTransfer.setData('text/plain', itemName);
          e.dataTransfer.effectAllowed = 'copy';
        }
      });

      DOM.csTrayGrid.addEventListener('click', (e) => {
        // 若剛剛 pointerup 已在 400ms 內觸發過加入，防重保護
        if (Date.now() - lastTrayAddTimestamp < 400) return;
        const itemEl = e.target.closest('.cs-tray-item');
        if (!itemEl) return;
        const itemName = itemEl.getAttribute('data-item-name');
        lastTrayAddTimestamp = Date.now();
        handleTrayItemAdd(itemName);
      });
    }
  }

  // 渲染素材庫目標收納盒下拉選單
  function renderCustomTrayTargetBoxSelect() {
    if (!DOM.csTrayTargetBoxSelect) return;
    const boxes = Array.isArray(state.customBoxes) ? state.customBoxes : [];
    if (boxes.length === 0) {
      DOM.csTrayTargetBoxSelect.innerHTML = '<option value="">(尚未建立收納盒)</option>';
      return;
    }
    let html = '';
    boxes.forEach(box => {
      const isSel = box.id === activeDropTargetBoxId ? 'selected' : '';
      html += `<option value="${box.id}" ${isSel}>#${box.no} ${escapeHTML(box.name)} (${(box.items || []).length}件)</option>`;
    });
    DOM.csTrayTargetBoxSelect.innerHTML = html;
  }

  // 渲染所有收納盒網格
  function renderCustomBoxesGrid(matchedBoxIds = null, query = '') {
    if (!DOM.csBoxesContainer) return;

    const boxes = Array.isArray(state.customBoxes) ? state.customBoxes : (state.customBoxes = []);
    boxes.forEach(b => { if (Array.isArray(b.items)) sortBoxItems(b.items); });
    if (boxes.length === 0) {
      DOM.csBoxesContainer.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; padding: 2.5rem 1rem;">
          <div class="empty-icon">📦</div>
          <h3>尚未建立任何收納盒</h3>
          <p>點擊上方「➕ 新增收納盒」按鈕即可開始規劃您的第一個儲存盒！</p>
        </div>
      `;
      renderCustomTrayTargetBoxSelect();
      return;
    }

    // 確保有預設有效選中目標箱
    if (!activeDropTargetBoxId || !boxes.some(b => b.id === activeDropTargetBoxId)) {
      activeDropTargetBoxId = boxes[0].id;
    }

    // 更新素材庫頂部目前放入箱號標籤與目標選單
    const currentTargetBox = boxes.find(b => b.id === activeDropTargetBoxId) || boxes[0];
    if (DOM.csTrayTargetHint) {
      DOM.csTrayTargetHint.textContent = `🎯 目前放入：#${currentTargetBox.no} ${currentTargetBox.name}`;
    }
    renderCustomTrayTargetBoxSelect();

    let html = '';
    boxes.forEach((box, index) => {
      const isMatched = matchedBoxIds && matchedBoxIds.includes(box.id);
      const isTarget = box.id === activeDropTargetBoxId;
      const highlightClass = isMatched ? 'highlight-pulse' : '';
      const targetClass = isTarget ? 'is-active-target' : '';
      
      let itemsHtml = '';
      if (box.items && box.items.length > 0) {
        itemsHtml = box.items.map(itemName => {
          const iconSrc = getItemIcon(itemName);
          const isItemMatch = query && itemName.toLowerCase().includes(query.toLowerCase());
          return `
            <div class="cs-box-item ${isItemMatch ? 'is-match' : ''}" data-box-id="${box.id}" data-item-name="${escapeHTML(itemName)}" title="${escapeHTML(itemName)}">
              <img decoding="async" src="${iconSrc}" class="cs-box-item-img" alt="${escapeHTML(itemName)}" loading="lazy">
              <button class="cs-box-item-remove" data-box-id="${box.id}" data-item-name="${escapeHTML(itemName)}" title="從此收納盒移除">✕</button>
            </div>
          `;
        }).join('');
      } else {
        itemsHtml = `
          <div class="cs-drop-empty" data-box-id="${box.id}" title="點選此收納箱並挑選物品加入">
            <span style="font-size: 1.5rem;">📥</span>
            <span>拖曳物品至此處加入，亦可點選加入</span>
          </div>
        `;
      }

      // 在物品後方附帶直觀的「➕ 加入」快捷按鈕
      const addBtnHtml = `
        <button class="cs-box-item cs-box-add-item-btn" data-box-id="${box.id}" title="選定此收納盒並挑選物品加入">
          <span class="cs-add-item-icon">➕</span>
          <span class="cs-add-item-label">加入</span>
        </button>
      `;

      html += `
        <article class="cs-box-card ${highlightClass} ${targetClass}" id="csBox_${box.id}" data-box-id="${box.id}">
          <header class="cs-box-header">
            <div class="cs-box-title-wrap">
              <span class="cs-box-drag-handle" draggable="true" data-box-id="${box.id}" title="按住拖曳調整收納盒順序">⠿</span>
              <span class="cs-box-no-badge">#${escapeHTML(box.no)}</span>
              <input type="text" class="cs-box-name-input" data-box-id="${box.id}" value="${escapeHTML(box.name)}" placeholder="請輸入收納盒名稱..." maxlength="20" title="點擊直接修改收納盒名稱">
            </div>
            <div class="cs-box-actions">
              <button class="cs-box-btn-icon btn-cs-move-left" data-box-id="${box.id}" ${index === 0 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''} title="往前移">◀</button>
              <button class="cs-box-btn-icon btn-cs-move-right" data-box-id="${box.id}" ${index === boxes.length - 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''} title="往後移">▶</button>
              <button class="cs-box-btn-icon btn-cs-clear" data-box-id="${box.id}" title="清空收納盒">🧹</button>
              <button class="cs-box-btn-icon btn-cs-delete" data-box-id="${box.id}" title="刪除收納盒">🗑️</button>
            </div>
          </header>
          <div class="cs-drop-zone" data-box-id="${box.id}">
            ${itemsHtml}
            ${box.items && box.items.length > 0 ? addBtnHtml : ''}
          </div>
        </article>
      `;
    });

    DOM.csBoxesContainer.innerHTML = html;

    // 綁定各收納盒卡片選中（點擊設為當前目標）
    const cards = DOM.csBoxesContainer.querySelectorAll('.cs-box-card');
    cards.forEach(card => {
      const bId = card.getAttribute('data-box-id');
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cs-box-actions') || e.target.closest('.cs-box-name-input') || e.target.closest('.cs-box-item-remove')) {
          return;
        }
        if (activeDropTargetBoxId !== bId) {
          setActiveTargetBox(bId, false);
        }
      });
    });

    // 綁定各收納盒名稱修改事件
    const nameInputs = DOM.csBoxesContainer.querySelectorAll('.cs-box-name-input');
    nameInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const bId = e.target.getAttribute('data-box-id');
        renameBox(bId, e.target.value.trim());
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.blur();
      });
    });

    // 綁定順序微調按鈕 (◀ 往前移, ▶ 往後移)
    const moveLeftBtns = DOM.csBoxesContainer.querySelectorAll('.btn-cs-move-left');
    moveLeftBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        moveBox(bId, 'left');
      });
    });

    const moveRightBtns = DOM.csBoxesContainer.querySelectorAll('.btn-cs-move-right');
    moveRightBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        moveBox(bId, 'right');
      });
    });

    // 綁定「➕ 加入」快捷鈕與空狀態點擊
    const addBtns = DOM.csBoxesContainer.querySelectorAll('.cs-box-add-item-btn, .cs-drop-empty');
    addBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        setActiveTargetBox(bId, true);
      });
    });

    // 綁定清空按鈕
    const clearBtns = DOM.csBoxesContainer.querySelectorAll('.btn-cs-clear');
    clearBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        clearBox(bId);
      });
    });

    // 綁定刪除按鈕
    const deleteBtns = DOM.csBoxesContainer.querySelectorAll('.btn-cs-delete');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        deleteBox(bId);
      });
    });

    // 綁定盒內物品 ✕ 移除按鈕
    const removeBtns = DOM.csBoxesContainer.querySelectorAll('.cs-box-item-remove');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bId = btn.getAttribute('data-box-id');
        const iName = btn.getAttribute('data-item-name');
        removeItemFromBox(bId, iName);
      });
    });

    // 綁定卡片拖曳排序 (Box Reordering Drag & Drop)
    let draggedBoxId = null;
    const dragHandles = DOM.csBoxesContainer.querySelectorAll('.cs-box-drag-handle');
    dragHandles.forEach(handle => {
      handle.addEventListener('dragstart', (e) => {
        draggedBoxId = handle.getAttribute('data-box-id');
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/pokopia-box-id', draggedBoxId);
          e.dataTransfer.effectAllowed = 'move';
        }
      });
    });

    cards.forEach(card => {
      const bId = card.getAttribute('data-box-id');

      card.addEventListener('dragover', (e) => {
        if (draggedBoxId && draggedBoxId !== bId) {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
          card.classList.add('card-reorder-over');
        }
      });

      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('card-reorder-over');
        }
      });

      card.addEventListener('drop', (e) => {
        card.classList.remove('card-reorder-over');
        const sourceBoxId = (e.dataTransfer && e.dataTransfer.getData('text/pokopia-box-id')) || draggedBoxId;
        if (sourceBoxId && sourceBoxId !== bId) {
          e.preventDefault();
          e.stopPropagation();
          reorderBoxes(sourceBoxId, bId);
          draggedBoxId = null;
        }
      });
    });

    // 綁定拖曳目標放置區 (Drag & Drop Zone - 物品拖入)
    const dropZones = DOM.csBoxesContainer.querySelectorAll('.cs-drop-zone');
    dropZones.forEach(zone => {
      const boxCard = zone.closest('.cs-box-card');
      const bId = zone.getAttribute('data-box-id');

      zone.addEventListener('dragover', (e) => {
        if (draggedBoxId) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (boxCard) boxCard.classList.add('drag-over');
      });

      zone.addEventListener('dragenter', (e) => {
        if (draggedBoxId) return;
        e.preventDefault();
        if (boxCard) boxCard.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', (e) => {
        if (!zone.contains(e.relatedTarget)) {
          if (boxCard) boxCard.classList.remove('drag-over');
        }
      });

      zone.addEventListener('drop', (e) => {
        if (draggedBoxId) return;
        e.preventDefault();
        if (boxCard) boxCard.classList.remove('drag-over');
        const itemName = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
        if (itemName && bId) {
          activeDropTargetBoxId = bId;
          addItemToBox(bId, itemName);
        }
      });
    });
  }

  // 渲染素材庫官方分類下拉選單與相容標籤列 (100% 完整收錄 14 大官方選項)
  function renderCustomTrayCategoryPills() {
    const db = window.POKOPIA_PREFERENCES_DB;
    const categories = (db && db.items) ? Object.keys(db.items) : [];

    // 計算去重總數與各分類計數
    const allUniqueSet = new Set();
    const catCounts = {};
    categories.forEach(cat => {
      const items = db.items[cat] || [];
      catCounts[cat] = items.length;
      items.forEach(item => allUniqueSet.add(item.name));
    });

    const activeCat = state.activeTrayCategory || 'all';

    // 1. 渲染下拉選單 (主功能)
    if (DOM.csTrayCategorySelect) {
      let optionsHtml = `<option value="all" ${activeCat === 'all' ? 'selected' : ''}>全部 (${allUniqueSet.size})</option>`;
      categories.forEach(cat => {
        const count = catCounts[cat] || 0;
        const isSel = activeCat === cat ? 'selected' : '';
        optionsHtml += `<option value="${escapeHTML(cat)}" ${isSel}>${escapeHTML(cat)} (${count})</option>`;
      });
      DOM.csTrayCategorySelect.innerHTML = optionsHtml;
    }

    // 2. 渲染相容標籤列 (供自動化檢驗模組與相容操作)
    if (DOM.csTrayCategoryPills) {
      let pillsHtml = `
        <button class="cs-tray-pill ${activeCat === 'all' ? 'active' : ''}" data-cat="all">
          <span>全部</span>
          <span class="cs-tray-pill-count">(${allUniqueSet.size})</span>
        </button>
      `;

      categories.forEach(cat => {
        const count = catCounts[cat] || 0;
        const isActive = activeCat === cat;
        pillsHtml += `
          <button class="cs-tray-pill ${isActive ? 'active' : ''}" data-cat="${escapeHTML(cat)}">
            <span>${escapeHTML(cat)}</span>
            <span class="cs-tray-pill-count">(${count})</span>
          </button>
        `;
      });

      DOM.csTrayCategoryPills.innerHTML = pillsHtml;

      // 綁定相容標籤點擊切換事件
      const pillBtns = DOM.csTrayCategoryPills.querySelectorAll('.cs-tray-pill');
      pillBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const cat = btn.getAttribute('data-cat');
          state.activeTrayCategory = cat;
          renderCustomTrayCategoryPills();
          renderCustomTrayItems(state.activeTraySearch || '');
        });
      });
    }
  }

  // 渲染右側/底部物品素材庫托盤 (嚴格依據官方分類去重展示)
  function renderCustomTrayItems(query = '') {
    if (!DOM.csTrayGrid) return;

    renderCustomTrayCategoryPills();

    const db = window.POKOPIA_PREFERENCES_DB;
    const itemsDb = (db && db.items) ? db.items : {};
    const activeCat = state.activeTrayCategory || 'all';

    // 1. 依據選中分類提取物品清單
    let targetItems = [];
    const seenNames = new Set();

    if (activeCat === 'all') {
      // 全部分類依序提取並全域去重
      Object.keys(itemsDb).forEach(cat => {
        (itemsDb[cat] || []).forEach(item => {
          if (!seenNames.has(item.name)) {
            seenNames.add(item.name);
            targetItems.push(item);
          }
        });
      });
    } else {
      // 特定分類項下去重
      (itemsDb[activeCat] || []).forEach(item => {
        if (!seenNames.has(item.name)) {
          seenNames.add(item.name);
          targetItems.push(item);
        }
      });
    }

    // 2. 關鍵字搜尋篩選
    if (query) {
      const q = query.toLowerCase();
      targetItems = targetItems.filter(item => item.name && item.name.toLowerCase().includes(q));
    }

    // 3. 更新標題徽章計數
    if (DOM.csTrayItemCount) {
      DOM.csTrayItemCount.textContent = `${targetItems.length} 種`;
    }

    // 4. 空狀態展示
    if (targetItems.length === 0) {
      DOM.csTrayGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem 0.5rem; font-size: 0.8rem;">
          ${query ? '無相符物品' : '此分類暫無物品'}
        </div>
      `;
      return;
    }

    // 統計已收納物品 (全域任一收納盒包含即標記)
    const storedMap = new Map();
    (state.customBoxes || []).forEach(box => {
      (box.items || []).forEach(name => {
        if (!storedMap.has(name)) storedMap.set(name, []);
        storedMap.get(name).push(`#${box.no} ${box.name}`);
      });
    });

    // 5. 渲染素材項目方格 (未收納物品右上角標記圓形橘色小點 Todo 提醒)
    let html = '';
    targetItems.forEach(item => {
      const icon = item.icon || (db.itemIcons && db.itemIcons[item.name]) || FALLBACK_SPRITE;
      const isStored = storedMap.has(item.name);
      const baseTitle = `${escapeHTML(item.name)}${item.description ? ' - ' + escapeHTML(item.description) : ''}`;
      const hint = isStored ? `\n📦 已收納於：${storedMap.get(item.name).join('、')}` : '\n💡 尚未加入任何收納盒';
      const unstoredClass = !isStored ? 'is-unstored' : '';
      html += `
        <div class="cs-tray-item ${unstoredClass}" draggable="true" data-item-name="${escapeHTML(item.name)}" data-base-title="${baseTitle}" title="${baseTitle}${hint}">
          <img decoding="async" src="${icon}" alt="${escapeHTML(item.name)}" loading="lazy">
        </div>
      `;
    });

    DOM.csTrayGrid.innerHTML = html;

    // 6. 點擊與拖曳事件已由 DOM.csTrayGrid 容器事件委派高效統一處理 (含 Pointer 容差判定)
  }

  // 輕量操作回饋 Toast
  function showCsToast(message, type = 'success') {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
    let container = document.getElementById('csToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'csToastContainer';
      container.className = 'cs-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `cs-toast cs-toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('cs-toast-show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('cs-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // 設定當前接收物品的目標收納盒
  function setActiveTargetBox(boxId, shouldOpenDrawer = true) {
    activeDropTargetBoxId = boxId;
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box) return;

    if (DOM.csBoxesContainer) {
      const cards = DOM.csBoxesContainer.querySelectorAll('.cs-box-card');
      cards.forEach(card => {
        if (card.getAttribute('data-box-id') === boxId) {
          card.classList.add('is-active-target');
        } else {
          card.classList.remove('is-active-target');
        }
      });
    }

    if (DOM.csTrayTargetBoxSelect) {
      DOM.csTrayTargetBoxSelect.value = boxId;
    }

    if (DOM.csTrayTargetHint) {
      DOM.csTrayTargetHint.textContent = `🎯 目前放入：#${box.no} ${box.name}`;
      DOM.csTrayTargetHint.classList.add('target-hint-highlight');
      setTimeout(() => {
        if (DOM.csTrayTargetHint) DOM.csTrayTargetHint.classList.remove('target-hint-highlight');
      }, 600);
    }

    if (shouldOpenDrawer) {
      openCsDrawer();
    }
    showCsToast(`🎯 已選定【#${box.no} ${box.name}】，點擊素材直接收納`);
  }

  // 調整收納盒前後順序 (◀ / ▶)
  function moveBox(boxId, direction) {
    const boxes = state.customBoxes || [];
    const idx = boxes.findIndex(b => b.id === boxId);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= boxes.length) return;

    const [movedBox] = boxes.splice(idx, 1);
    boxes.splice(targetIdx, 0, movedBox);

    // 重新排序號 #01, #02...
    boxes.forEach((b, i) => {
      b.no = String(i + 1).padStart(2, '0');
    });

    saveCustomBoxes();
    renderCustomBoxesGrid();
    showCsToast(`已將「${movedBox.name}」移至 #${movedBox.no}`);
  }

  // 拖曳重排收納盒卡片順序
  function reorderBoxes(draggedBoxId, targetBoxId) {
    if (!draggedBoxId || !targetBoxId || draggedBoxId === targetBoxId) return;
    const boxes = state.customBoxes || [];
    const fromIdx = boxes.findIndex(b => b.id === draggedBoxId);
    const toIdx = boxes.findIndex(b => b.id === targetBoxId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [movedBox] = boxes.splice(fromIdx, 1);
    boxes.splice(toIdx, 0, movedBox);

    boxes.forEach((b, i) => {
      b.no = String(i + 1).padStart(2, '0');
    });

    saveCustomBoxes();
    renderCustomBoxesGrid();
    showCsToast(`已將「${movedBox.name}」移至 #${movedBox.no}`);
  }

  // 即時更新素材庫托盤中各項目的待收納橘點狀態 (未加入標記橘點，已加入熄滅)
  function updateTrayStoredStatus() {
    if (!DOM.csTrayGrid) return;
    const storedMap = new Map();
    (state.customBoxes || []).forEach(box => {
      (box.items || []).forEach(name => {
        if (!storedMap.has(name)) storedMap.set(name, []);
        storedMap.get(name).push(`#${box.no} ${box.name}`);
      });
    });

    const trayItems = DOM.csTrayGrid.querySelectorAll('.cs-tray-item');
    trayItems.forEach(item => {
      const itemName = item.getAttribute('data-item-name');
      const isStored = storedMap.has(itemName);
      const baseTitle = item.getAttribute('data-base-title') || item.getAttribute('title') || itemName;
      if (!isStored) {
        // 未收納：顯示橘點 (Todo Dot 待收納)
        item.classList.add('is-unstored');
        item.classList.remove('is-stored');
        item.setAttribute('title', `${baseTitle}\n💡 尚未加入任何收納盒`);
      } else {
        // 已收納：乾淨熄滅橘點，顯示已歸檔提示
        item.classList.remove('is-unstored');
        item.classList.remove('is-stored');
        item.setAttribute('title', `${baseTitle}\n📦 已收納於：${storedMap.get(itemName).join('、')}`);
      }
    });
  }

  // 加入物品至指定收納盒
  function addItemToBox(boxId, itemName) {
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box) return;
    if (!box.items) box.items = [];
    
    if (box.items.includes(itemName)) {
      const boxCard = document.getElementById('csBox_' + boxId);
      if (boxCard) {
        boxCard.classList.add('highlight-pulse');
        setTimeout(() => boxCard.classList.remove('highlight-pulse'), 1200);
      }
      showCsToast(`「${itemName}」已在 #${box.no} ${box.name} 中`, 'info');
      return;
    }

    box.items.push(itemName);
    sortBoxItems(box.items);
    saveCustomBoxes();
    renderCustomBoxesGrid();
    updateTrayStoredStatus();
    showCsToast(`✅ 已加入「${itemName}」至 #${box.no} ${box.name}`);
  }

  // 從指定收納盒移除物品
  function removeItemFromBox(boxId, itemName) {
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box || !box.items) return;

    box.items = box.items.filter(i => i !== itemName);
    saveCustomBoxes();
    renderCustomBoxesGrid();
    updateTrayStoredStatus();
  }

  // 重新命名收納盒
  function renameBox(boxId, newName) {
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box) return;
    box.name = newName || `收納盒 #${box.no}`;
    saveCustomBoxes();
    updateTrayStoredStatus();
  }

  // 清空收納盒
  function clearBox(boxId) {
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box) return;
    if (window.confirm(`確定要清空收納盒【#${box.no} ${box.name}】中的所有物品嗎？`)) {
      box.items = [];
      saveCustomBoxes();
      renderCustomBoxesGrid();
      updateTrayStoredStatus();
    }
  }

  // 刪除收納盒
  function deleteBox(boxId) {
    const box = (state.customBoxes || []).find(b => b.id === boxId);
    if (!box) return;
    if (window.confirm(`確定要刪除收納盒【#${box.no} ${box.name}】嗎？`)) {
      state.customBoxes = (state.customBoxes || []).filter(b => b.id !== boxId);
      saveCustomBoxes();
      renderCustomBoxesGrid();
      updateTrayStoredStatus();
    }
  }

  // 新增收納盒
  function addNewBox() {
    if (!state.customBoxes) state.customBoxes = [];
    const nextIdx = state.customBoxes.length + 1;
    const nextNo = String(nextIdx).padStart(2, '0');
    const newBox = {
      id: 'box_' + Date.now(),
      no: nextNo,
      name: `自訂收納盒 ${nextNo}`,
      items: []
    };
    activeDropTargetBoxId = newBox.id;
    state.customBoxes.push(newBox);
    saveCustomBoxes();
    renderCustomBoxesGrid();

    setTimeout(() => {
      const newCard = document.getElementById('csBox_' + newBox.id);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const nameInput = newCard.querySelector('.cs-box-name-input');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }
    }, 100);
  }

  // 反查物品邏輯
  function handleReverseSearch(query) {
    state.reverseSearchItem = query;

    if (!DOM.csSearchResultBanner) return;

    if (!query) {
      DOM.csSearchResultBanner.classList.add('hidden');
      DOM.csSearchResultBanner.innerHTML = '';
      if (DOM.csClearSearchBtn) DOM.csClearSearchBtn.classList.add('hidden');
      renderCustomBoxesGrid(null, '');
      return;
    }

    if (DOM.csClearSearchBtn) DOM.csClearSearchBtn.classList.remove('hidden');

    const q = query.toLowerCase();
    const boxes = state.customBoxes || [];
    const matchedBoxes = [];

    boxes.forEach(box => {
      const hasMatch = (box.items || []).some(item => item.toLowerCase().includes(q));
      if (hasMatch) {
        matchedBoxes.push(box);
      }
    });

    if (matchedBoxes.length > 0) {
      const boxLabels = matchedBoxes.map(b => `<strong class="cs-banner-tag">#${escapeHTML(b.no)} ${escapeHTML(b.name)}</strong>`).join('、');
      DOM.csSearchResultBanner.className = 'cs-search-banner cs-search-found';
      DOM.csSearchResultBanner.innerHTML = `
        <span class="cs-banner-icon">🎯</span>
        <div class="cs-banner-text">找到物品！存在於：${boxLabels}</div>
      `;
      DOM.csSearchResultBanner.classList.remove('hidden');

      const matchedIds = matchedBoxes.map(b => b.id);
      renderCustomBoxesGrid(matchedIds, query);

      const firstMatchedCard = document.getElementById('csBox_' + matchedBoxes[0].id);
      if (firstMatchedCard) {
        firstMatchedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      DOM.csSearchResultBanner.className = 'cs-search-banner cs-search-empty';
      DOM.csSearchResultBanner.innerHTML = `
        <span class="cs-banner-icon">⚠️</span>
        <div class="cs-banner-text">尚未在任何收納盒中找到與「<strong>${escapeHTML(query)}</strong>」相符的物品</div>
      `;
      DOM.csSearchResultBanner.classList.remove('hidden');
      renderCustomBoxesGrid([], query);
    }
  }

  // ==========================================================================
  // 寶可夢個人百科詳情卡邏輯 (Pokemon Individual Detail Modal / Bottom Sheet)
  // ==========================================================================
  function openPkmDetailModal(pkmId) {
    if (!DOM.pkmDetailModal || !DOM.pkmDetailBody) return;

    const allPokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
    const pkm = allPokemons.find(p => p.id === pkmId || p.number === pkmId || p.name === pkmId);
    if (!pkm) return;
    state.activeDetailPkm = pkm;

    // 1. 設定頂部標題資訊
    if (DOM.pkmDetailAvatar) {
      DOM.pkmDetailAvatar.src = pkm.sprite || FALLBACK_SPRITE;
      DOM.pkmDetailAvatar.alt = pkm.name;
      DOM.pkmDetailAvatar.dataset.pkmId = pkm.id;
      DOM.pkmDetailAvatar.title = `點擊前往 ${pkm.name} 的圖鑑百科 ↗`;
    }
    const avatarWrap = document.querySelector('.pkm-detail-avatar-wrap');
    if (avatarWrap) {
      avatarWrap.dataset.pkmId = pkm.id;
      avatarWrap.title = `點擊前往 ${pkm.name} 的圖鑑百科 ↗`;
    }
    if (DOM.pkmDetailNumber) {
      DOM.pkmDetailNumber.textContent = pkm.number;
    }
    
    const formMatch = pkm.name.match(/^(.*?)[（\(](.*?)[）\)]$/);
    const baseName = formMatch ? formMatch[1].trim() : pkm.name;
    const formName = formMatch ? formMatch[2].trim() : '';

    if (DOM.pkmDetailName) {
      DOM.pkmDetailName.textContent = baseName;
    }
    if (DOM.pkmDetailCategory) {
      DOM.pkmDetailCategory.textContent = pkm.categoryName || '主圖鑑';
      DOM.pkmDetailCategory.className = `tag-badge tag-cat-${pkm.category || 'main'}`;
    }
    if (DOM.pkmDetailForm) {
      if (formName) {
        DOM.pkmDetailForm.textContent = formName;
        DOM.pkmDetailForm.classList.remove('hidden');
      } else {
        DOM.pkmDetailForm.classList.add('hidden');
      }
    }

    // 2. 組合屬性與專長
    const specs = pkm.specialties || pkm.abilities || [];
    const specsHTML = specs.map(s => {
      const icon = SPECIALTY_ICONS[s] || '⚡';
      return `<span class="tag-specialty">${icon} ${escapeHTML(s)}</span>`;
    }).join('');

    // 3. 雙向棲息地輪播/卡片 HTML
    const habList = [];
    if (pkm.habitat1 && pkm.habitat1 !== '無特別需求') {
      habList.push({
        id: pkm.habitat1_id || '',
        name: pkm.habitat1.split(' - ')[0] || '棲息地 1',
        img: pkm.habitat1_img || ''
      });
    }
    if (pkm.habitat2 && pkm.habitat2 !== '無特別需求') {
      habList.push({
        id: pkm.habitat2_id || '',
        name: pkm.habitat2.split(' - ')[0] || '棲息地 2',
        img: pkm.habitat2_img || ''
      });
    }

    let habsHTML = '';
    if (habList.length === 1) {
      const h = habList[0];
      habsHTML = `
        <div class="pkm-detail-hab-card" data-hab-id="${h.id}" style="cursor:pointer;" title="${escapeHTML(h.name)}（點擊跳轉棲息地圖鑑）">
          <div class="pkm-detail-hab-thumb">
            <img decoding="async" src="${h.img}" alt="${escapeHTML(h.name)}" loading="lazy">
          </div>
          <div style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-top:2px;">${escapeHTML(h.name)}</div>
        </div>
      `;
    } else if (habList.length >= 2) {
      const habsJson = escapeHTML(JSON.stringify(habList));
      habsHTML = `
        <div class="pkm-detail-hab-card pkm-table-hab-carousel" data-pkm-name="${escapeHTML(pkm.name)}" data-current-index="0" data-habs='${habsJson}'>
          <div class="pkm-detail-hab-thumb pkm-table-hab-thumb" data-hab-id="${habList[0].id}" style="cursor:pointer;" title="${escapeHTML(habList[0].name)}（點擊跳轉棲息地圖鑑）">
            <img decoding="async" class="pkm-hab-active-img" src="${habList[0].img}" alt="${escapeHTML(habList[0].name)}" loading="lazy">
          </div>
          <div class="pkm-hab-bottom-bar" style="width:100%; max-width:360px; justify-content:space-between; margin-top:4px;">
            <button type="button" class="pkm-hab-arrow-btn pkm-hab-prev" title="上一個棲息地">‹</button>
            <span class="pkm-hab-name-text" style="font-size:0.86rem; font-weight:700;">${escapeHTML(habList[0].name)} (1/${habList.length})</span>
            <button type="button" class="pkm-hab-arrow-btn pkm-hab-next" title="下一個棲息地">›</button>
          </div>
        </div>
      `;
    } else {
      habsHTML = `<div style="font-size:0.82rem; color:var(--text-muted); padding:8px 0;">無特別棲息地需求</div>`;
    }

    // 4. 結構化喜好百科 (從 preferences_db 解析口味、環境、風格)
    const db = window.POKOPIA_PREFERENCES_DB || {};
    const pkmFavs = pkm.favorites || [];

    const matchedTastes = [];
    const matchedThings = [];
    const matchedEnvs = [];

    pkmFavs.forEach(fav => {
      const t = (db.tastes || []).find(taste => taste.name === fav);
      if (t) {
        matchedTastes.push(t);
        return;
      }
      const th = (db.things || []).find(thing => thing.name === fav);
      if (th) {
        matchedThings.push(th);
        return;
      }
      const env = (db.environments || []).find(e => e.name.includes(fav) || fav.includes(e.name));
      if (env) {
        matchedEnvs.push(env);
        return;
      }
      matchedThings.push({ name: fav, items: [] });
    });

    // 口味區塊 HTML
    let tastesHTML = '';
    if (matchedTastes.length > 0) {
      tastesHTML = matchedTastes.map(t => {
        const foods = t.foods || [];
        const hasMore = foods.length > 8;
        const foodBadges = foods.slice(0, 8).map(food => {
          const icon = (db.itemIcons && db.itemIcons[food]) || '';
          return `
            <div class="pkm-pref-item-badge" title="${escapeHTML(food)}">
              ${icon ? `<img decoding="async" src="${icon}" alt="${escapeHTML(food)}" loading="lazy">` : ''}
              <span>${escapeHTML(food)}</span>
            </div>
          `;
        }).join('');

        return `
          <div class="pkm-pref-box">
            <div class="pkm-pref-box-title">
              <span class="pref-pill-btn taste-pill" data-fav="${escapeHTML(t.name)}" style="font-size:0.8rem; cursor:pointer;" title="點擊在喜好百科查看「${escapeHTML(t.name)}」料理與說明">喜歡的口味：${escapeHTML(t.name)}</span>
              ${hasMore ? `<span class="pkm-pref-taste-link" data-fav="${escapeHTML(t.name)}" style="font-size:0.75rem; color:var(--primary-indigo); cursor:pointer; font-weight:600;" title="點擊在喜好百科查看「${escapeHTML(t.name)}」完整料理清單">查看全部 ↗</span>` : ''}
            </div>
            ${t.snorlaxEffect ? `<div class="pkm-pref-bonus">✨ 供奉苔卡比獸效果：${escapeHTML(t.snorlaxEffect)}</div>` : ''}
            ${foodBadges ? `<div class="pkm-pref-items-grid">${foodBadges}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    // 風格區塊 HTML
    let thingsHTML = '';
    if (matchedThings.length > 0) {
      thingsHTML = matchedThings.map(th => {
        const items = th.items || [];
        const hasMore = items.length > 10;
        const itemBadges = items.slice(0, 10).map(item => {
          const icon = (db.itemIcons && db.itemIcons[item]) || '';
          return `
            <div class="pkm-pref-item-badge" title="${escapeHTML(item)}">
              ${icon ? `<img decoding="async" src="${icon}" alt="${escapeHTML(item)}" loading="lazy">` : ''}
              <span>${escapeHTML(item)}</span>
            </div>
          `;
        }).join('');

        return `
          <div class="pkm-pref-box">
            <div class="pkm-pref-box-title">
              <span class="pref-pill-btn fav-pill" data-fav="${escapeHTML(th.name)}" style="font-size:0.8rem; cursor:pointer;" title="點擊在喜好百科查看「${escapeHTML(th.name)}」物品與說明">喜歡的東西：${escapeHTML(th.name)}</span>
              ${hasMore ? `<span class="pkm-pref-thing-link" data-fav="${escapeHTML(th.name)}" style="font-size:0.75rem; color:var(--primary-indigo); cursor:pointer; font-weight:600;" title="點擊在喜好百科查看「${escapeHTML(th.name)}」完整物品清單">查看全部 ↗</span>` : ''}
            </div>
            ${itemBadges ? `<div class="pkm-pref-items-grid">${itemBadges}</div>` : '<div style="font-size:0.75rem; color:var(--text-muted);">收錄代表風格物品</div>'}
          </div>
        `;
      }).join('');
    }

    // 環境區塊 HTML (根據 pkm.environment 匹配官方環境維度與營造家具)
    let envsHTML = '';
    const cleanEnvName = (pkm.environment || '').replace(/[☀️🔥💧🌵❄️🌙【】維度：]/g, '').trim();
    const envObj = (db.environments || []).find(e => 
      cleanEnvName && (e.name === cleanEnvName || cleanEnvName.includes(e.name) || e.name.includes(cleanEnvName))
    );
    if (envObj) {
      const envItems = (envObj.items || []).slice(0, 10);
      const envItemBadges = envItems.map(item => {
        const icon = (db.itemIcons && db.itemIcons[item]) || '';
        return `
          <div class="pkm-pref-item-badge" title="${escapeHTML(item)}">
            ${icon ? `<img decoding="async" src="${icon}" alt="${escapeHTML(item)}" loading="lazy">` : ''}
            <span>${escapeHTML(item)}</span>
          </div>
        `;
      }).join('');

      const isDark = (envObj.name || '').includes('黑暗');
      const envItemsSection = envItemBadges ? `
        <div style="font-size:0.75rem; color:var(--text-muted); margin:4px 0 6px 0;">代表營造家具 / 物品：</div>
        <div class="pkm-pref-items-grid">${envItemBadges}</div>
      ` : (isDark ? '' : '<div style="font-size:0.75rem; color:var(--text-muted);">收錄代表營造物品</div>');

      envsHTML = `
        <div class="pkm-pref-box">
          <div class="pkm-pref-box-title" style="display:flex; justify-content:space-between; align-items:center;">
            <span class="pref-pill-btn env-pill" data-env="${escapeHTML(envObj.name)}" style="font-size:0.8rem; cursor:pointer;" title="點擊在喜好百科查看「${escapeHTML(envObj.name)}」營造家具與說明">
              喜歡的環境：${escapeHTML(envObj.name)} ${envObj.dimension ? `【維度：${escapeHTML(envObj.dimension)}】` : ''}
            </span>
            <span class="pkm-pref-env-link" data-env="${escapeHTML(envObj.name)}" style="font-size:0.75rem; color:var(--primary-indigo); cursor:pointer; font-weight:600;" title="點擊在喜好百科查看完整營造物品清單">查看全部 ↗</span>
          </div>
          ${envItemsSection}
        </div>
      `;
    }

    // 所在區域控制
    const curPkmRegion = getPokemonCurrentRegion(pkm.id);
    const regOptionsHTML = ((window.POKOPIA_REGION_DATA && window.POKOPIA_REGION_DATA.regions) || []).map(r => `
      <option value="${r.id}" ${curPkmRegion && curPkmRegion.regionId === r.id ? 'selected' : ''}>
        📍 ${escapeHTML(r.name)}
      </option>
    `).join('');

    const locationControlHTML = `
      <div class="pkm-detail-location-bar">
        <div class="pkm-detail-loc-left">
          <span class="pkm-detail-loc-title">目前位置：</span>
          <select class="pkm-detail-region-select" id="pkmDetailRegionSelect" data-pkm-id="${pkm.id}" title="直接更換此寶可夢安置的地區">
            <option value="unassigned" ${!curPkmRegion ? 'selected' : ''}>⚪ 未安置</option>
            ${regOptionsHTML}
          </select>
        </div>
        <button type="button" class="pkm-detail-goto-region-btn" id="btnDetailGotoRegion" data-region-id="${curPkmRegion ? curPkmRegion.regionId : ''}" title="在地圖頁面查看此區域">
          前往地圖 ↗
        </button>
      </div>
    `;

    // 5. 組合注入 Detail Body
    DOM.pkmDetailBody.innerHTML = `
      <!-- 基礎屬性與專長 -->
      <div class="pkm-detail-section">
        <h3 class="pkm-detail-sec-title">
          <span class="pkm-detail-sec-title-icon">⚡</span> 屬性與工作專長
        </h3>
        <div class="pkm-detail-tags-row">
          <span class="tag-badge tag-env" data-env="${escapeHTML(pkm.environment)}" style="font-size:0.8rem; padding:4px 10px;" title="點擊在喜好百科查看「${escapeHTML(pkm.environment)}」營造家具與說明">${escapeHTML(pkm.environment)}</span>
          ${specsHTML}
        </div>
        ${locationControlHTML}
      </div>

      <!-- 官方實機棲息地 -->
      <div class="pkm-detail-section">
        <h3 class="pkm-detail-sec-title">
          <span class="pkm-detail-sec-title-icon">🏡</span> 官方棲息地
        </h3>
        ${habsHTML}
      </div>

      <!-- 核心喜好百科 -->
      <div class="pkm-detail-section">
        <h3 class="pkm-detail-sec-title">
          <span class="pkm-detail-sec-title-icon">❤️</span> 完整喜好百科
        </h3>
        ${tastesHTML || ''}
        ${envsHTML || ''}
        ${thingsHTML || ''}
        ${(!tastesHTML && !envsHTML && !thingsHTML) ? '<div style="color:var(--text-muted); font-size:0.8rem;">尚無特定喜好紀錄</div>' : ''}
      </div>
    `;

    // 6. 綁定詳情卡內的棲息地輪播事件（若為雙棲息地）
    DOM.pkmDetailBody.querySelectorAll('.pkm-hab-arrow-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const carousel = btn.closest('.pkm-table-hab-carousel');
        if (!carousel) return;
        const habs = JSON.parse(carousel.dataset.habs || '[]');
        let idx = parseInt(carousel.dataset.currentIndex || '0', 10);
        if (btn.classList.contains('pkm-hab-prev')) {
          idx = (idx - 1 + habs.length) % habs.length;
        } else {
          idx = (idx + 1) % habs.length;
        }
        carousel.dataset.currentIndex = idx;
        const curHab = habs[idx];
        const img = carousel.querySelector('img');
        const text = carousel.querySelector('.pkm-hab-name-text');
        if (img) {
          img.src = curHab.img;
          img.alt = curHab.name;
        }
        const thumbEl = carousel.querySelector('.pkm-detail-hab-thumb');
        if (thumbEl) {
          thumbEl.dataset.habId = curHab.id;
          thumbEl.title = `${curHab.name}（點擊跳轉棲息地圖鑑）`;
        }
        if (text) {
          text.textContent = `${curHab.name} (${idx + 1}/${habs.length})`;
        }
      });
    });

    // 詳情卡點選棲息地縮圖關閉 Modal 並跳轉
    DOM.pkmDetailBody.querySelectorAll('.pkm-detail-hab-card, .pkm-detail-hab-thumb').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.pkm-hab-arrow-btn')) return;
        const habId = card.dataset.habId || (card.querySelector('[data-hab-id]') && card.querySelector('[data-hab-id]').dataset.habId);
        if (habId) {
          closePkmDetailModal();
          jumpToHabitat(habId, true, pkm.id);
        }
      });
    });

    // 所在區域即時更換與跳轉
    const selReg = DOM.pkmDetailBody.querySelector('#pkmDetailRegionSelect');
    if (selReg) {
      selReg.addEventListener('change', (e) => {
        const targetRegId = e.target.value;
        setPokemonRegion(pkm.id, targetRegId);
        const gotoBtn = DOM.pkmDetailBody.querySelector('#btnDetailGotoRegion');
        if (gotoBtn) {
          gotoBtn.dataset.regionId = targetRegId !== 'unassigned' ? targetRegId : '';
        }
      });
    }

    const gotoMapBtn = DOM.pkmDetailBody.querySelector('#btnDetailGotoRegion');
    if (gotoMapBtn) {
      gotoMapBtn.addEventListener('click', () => {
        const rId = gotoMapBtn.dataset.regionId;
        navigateToRegion(rId || 'palette_town');
      });
    }

    // 7. 顯示 Modal
    DOM.pkmDetailModal.classList.remove('hidden');
    DOM.pkmDetailBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePkmDetailModal() {
    if (DOM.pkmDetailModal) DOM.pkmDetailModal.classList.add('hidden');
    if (DOM.pkmDetailBackdrop) DOM.pkmDetailBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // 暴露全域調度
  window.openPkmDetailModal = openPkmDetailModal;
  window.closePkmDetailModal = closePkmDetailModal;

  // ==========================================================================
  // Preferences & Items Encyclopedia Slide-over Drawer Logic (喜好與物品百科抽屜)
  // ==========================================================================

  // 開啟喜好百科抽屜 (可指定目標分頁與高亮項目)
  function openPrefDrawer(targetTab, highlightItem, fromPkm) {
    const pkm = fromPkm || state.activeDetailPkm;
    const fromTab = state.currentTab;

    // 1. 若當前開著詳情卡片，平滑關閉以完全露出喜好百科
    closePkmDetailModal();
    state.activeDetailPkm = null;

    // 2. 記錄原先頁面的寶可夢卡片歷史狀態與滾動高度，讓上一頁能完美自動叫起與定位
    const currentScroll = window.scrollY || 0;
    if (pkm) {
      try {
        history.replaceState({
          tab: fromTab,
          view: state.currentView,
          modal: 'pokemonDetail',
          pkmId: pkm.id,
          pkmName: pkm.name,
          scrollY: currentScroll
        }, '', window.location.hash);
      } catch (e) {}
    } else {
      try {
        history.replaceState({
          tab: fromTab,
          view: state.currentView,
          scrollY: currentScroll
        }, '', window.location.hash);
      } catch (e) {}
    }

    if (targetTab) {
      state.prefTab = targetTab;
    }
    // 同步分頁按鈕狀態
    document.querySelectorAll('.pref-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.prefTab === state.prefTab);
    });

    // 傳入 skipSync = true，避免 switchTab 內部的 syncNavStateToURLAndStorage 抹殺 modal 狀態！
    switchTab('preferences', true);

    // 明確推入新的歷史項目（pushState）
    const newHash = `#preferences-${state.currentView || 'table'}`;
    try {
      history.pushState({ tab: 'preferences', view: state.currentView }, '', newHash);
    } catch (e) {}

    // 3. 懸浮返回按鈕明確指示返回該寶可夢，並綁定直連資料保險
    if (pkm) {
      showFloatingBackBtn(pkm.name, {
        returnTab: fromTab,
        returnPkmId: pkm.id,
        returnScrollY: currentScroll
      });
    } else if (fromTab && fromTab !== 'preferences') {
      const tabNameMap = {
        habitat: '寶可夢圖鑑',
        habitatCatalog: '棲息地總覽',
        recipe: '料理食譜',
        storage: '儲存庫'
      };
      showFloatingBackBtn(tabNameMap[fromTab] || '上一頁', {
        returnTab: fromTab,
        returnScrollY: currentScroll
      });
    }

    if (highlightItem) {
      setTimeout(() => {
        scrollHighlightItem(highlightItem);
      }, 60);
    }
  }

  // 關閉喜好百科 (返回首頁圖鑑)
  function closePrefDrawer() {
    if (state.currentTab === 'preferences') {
      switchTab('habitat', false);
      hideFloatingBackBtn();
    }
  }

  // 取得寶可夢頭像與資訊對照表 (透過名稱快速取得 icon 與 id)
  function getPokemonInfoMap() {
    const map = {};
    const pokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
    pokemons.forEach(p => {
      // 1. 精確全名匹配（優先權最高，包含形態如「無殼海兔（西海）」、「米立龍（下垂）」）
      map[p.name] = {
        id: p.id,
        name: p.name,
        sprite: p.sprite || FALLBACK_SPRITE
      };
      // 2. 去括號基礎名備援（如查詢「無殼海兔」亦能匹配頭像與 ID）
      const baseName = p.name.replace(/（.*?）|\(.*?\)/g, '').trim();
      if (baseName && !map[baseName]) {
        map[baseName] = {
          id: p.id,
          name: p.name,
          sprite: p.sprite || FALLBACK_SPRITE
        };
      }
    });
    return map;
  }

  // 渲染百科抽屜主內容
  function renderPrefDrawerContent(highlightItem) {
    if (!DOM.prefDrawerBody) return;
    const db = window.POKOPIA_PREFERENCES_DB || (typeof POKOPIA_PREFERENCES_DB !== 'undefined' ? POKOPIA_PREFERENCES_DB : null);
    if (!db) {
      DOM.prefDrawerBody.innerHTML = '<div style="padding:24px; text-align:center; color:#94a3b8;">喜好資料庫載入中...</div>';
      setTimeout(() => {
        const retryDb = window.POKOPIA_PREFERENCES_DB || (typeof POKOPIA_PREFERENCES_DB !== 'undefined' ? POKOPIA_PREFERENCES_DB : null);
        if (retryDb && DOM.prefDrawer && !DOM.prefDrawer.classList.contains('closed')) {
          renderPrefDrawerContent(highlightItem);
        }
      }, 250);
      return;
    }

    const query = (state.prefSearch || '').trim().toLowerCase();
    const pkmMap = getPokemonInfoMap();

    if (state.prefTab === 'tastes') {
      renderPrefDrawerTastes(db.tastes || [], query, pkmMap, highlightItem, db);
    } else if (state.prefTab === 'environments') {
      renderPrefDrawerEnvironments(db.environments || [], query, pkmMap, highlightItem, db);
    } else if (state.prefTab === 'things') {
      renderPrefDrawerThings(db.things || [], query, pkmMap, highlightItem, db);
    } else if (state.prefTab === 'items') {
      renderPrefDrawerItems(db.items || {}, query, highlightItem, db);
    }
  }

  // 輔助函式：渲染純圖片圖標道具格 (帶 Tooltip 與連動跳轉能力)
  function renderPrefItemSlot(itemName, db) {
    let iconUrl = (db && db.itemIcons && db.itemIcons[itemName]) || '';
    if (!iconUrl && db && db.itemIcons) {
      const norm1 = itemName.replace(/\(/g, '（').replace(/\)/g, '）');
      const norm2 = itemName.replace(/（/g, '(').replace(/）/g, ')');
      const norm3 = itemName.replace(/台/g, '檯');
      const norm4 = itemName.replace(/檯/g, '台');
      iconUrl = db.itemIcons[norm1] || db.itemIcons[norm2] || db.itemIcons[norm3] || db.itemIcons[norm4] || '';
      if (!iconUrl && (itemName.startsWith('♪') || itemName.startsWith('♪♪'))) {
        iconUrl = 'assets/item_sprites/60px-Bag_CD（紅／綠）_Pokopia_Sprite.png';
      }
    }
    const safeName = escapeHTML(itemName);
    if (iconUrl) {
      return `
        <button class="pref-item-slot" data-item-name="${safeName}" data-tooltip="${safeName}" title="${safeName}">
          <img decoding="async" class="pref-item-slot-img" src="${iconUrl}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <span class="pref-item-slot-fallback" style="display:none;">${safeName.slice(0, 2)}</span>
        </button>
      `;
    } else {
      return `
        <button class="pref-item-slot" data-item-name="${safeName}" data-tooltip="${safeName}" title="${safeName}">
          <span class="pref-item-slot-fallback">${safeName.slice(0, 2)}</span>
        </button>
      `;
    }
  }

  // 輔助函式：渲染純圖片圖標寶可夢格 (42x42px 純圖片無文字，同道具格規格)
  function renderPrefPokemonSlot(pName, pkmMap) {
    const info = (pkmMap && pkmMap[pName]) || { id: '', sprite: FALLBACK_SPRITE };
    const safeName = escapeHTML(pName);
    return `
      <button class="pref-pkm-slot" data-pkm-name="${safeName}" data-pkm-id="${info.id}" data-tooltip="${safeName}" title="${safeName}">
        <img decoding="async" class="pref-pkm-slot-img" src="${info.sprite}" alt="${safeName}" loading="lazy" onerror="this.src='${FALLBACK_SPRITE}'">
      </button>
    `;
  }

  // 輔助函式：判斷物品是否為料理或食材，若是則智慧導向料理食譜分頁並定位/反查
  function navigateItemToRecipe(itemName) {
    if (!itemName) return false;
    const cleanName = itemName.trim();
    const recipeDb = window.POKOPIA_RECIPES_DB || [];
    if (recipeDb.length === 0) return false;

    const curScroll = window.scrollY || 0;
    const fromTab = state.currentTab || 'preferences';
    const fromPrefTab = state.prefTab;

    // 1. 優先精確/包含匹配 34 道料理成品
    const recipe = recipeDb.find(r => r.name === cleanName || r.name.includes(cleanName) || cleanName.includes(r.name));
    if (recipe) {
      try {
        history.replaceState({
          tab: fromTab,
          view: state.currentView,
          prefTab: fromPrefTab,
          highlightItem: cleanName,
          scrollY: curScroll
        }, '', window.location.hash);
      } catch (e) {}

      closePrefDrawer();
      switchTab('recipe', true);
      pushNavHistory({ tab: 'recipe', recipeName: recipe.name });
      if (window.RecipeModule && window.RecipeModule.scrollToRecipe) {
        window.RecipeModule.scrollToRecipe(recipe.name);
      }
      showFloatingBackBtn('喜好百科', {
        returnTab: 'preferences',
        returnPrefTab: fromPrefTab,
        returnHighlightItem: cleanName,
        returnScrollY: curScroll
      });
      return true;
    }

    // 2. 次要匹配食譜中所使用的原料食材 (如 蘋野果, 辣味草, 小麥 等)
    const isIngredient = recipeDb.some(r => r.ingredients && r.ingredients.some(ig => ig.name === cleanName || ig.name.includes(cleanName) || cleanName.includes(ig.name)));
    if (isIngredient) {
      try {
        history.replaceState({
          tab: fromTab,
          view: state.currentView,
          prefTab: fromPrefTab,
          highlightItem: cleanName,
          scrollY: curScroll
        }, '', window.location.hash);
      } catch (e) {}

      closePrefDrawer();
      switchTab('recipe', true);
      pushNavHistory({ tab: 'recipe', ingredient: cleanName });
      if (window.RecipeModule && window.RecipeModule.filterByIngredient) {
        window.RecipeModule.filterByIngredient(cleanName);
      }
      showFloatingBackBtn('喜好百科', {
        returnTab: 'preferences',
        returnPrefTab: fromPrefTab,
        returnHighlightItem: cleanName,
        returnScrollY: curScroll
      });
      return true;
    }

    return false;
  }

  // 輔助函式：道具與寶可夢事件由父層事件委派接管 (相容保留函式簽章)
  function bindPrefDrawerItemSlots(db) {}

  // 渲染分頁 1：喜歡的口味
  function renderPrefDrawerTastes(tastes, query, pkmMap, highlightItem, db) {
    const filtered = tastes.filter(t => {
      if (!query) return true;
      const haystack = (t.name + ' ' + (t.foods || []).join(' ') + ' ' + (t.snorlaxEffect || '') + ' ' + (t.pokemon || []).join(' ')).toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      DOM.prefDrawerBody.innerHTML = '<div style="padding:30px; text-align:center; color:#94a3b8;">無符合條件的口味項目</div>';
      return;
    }

    let html = filtered.map(t => {
      const isTarget = highlightItem && (t.name === highlightItem || t.name.includes(highlightItem));
      
      // 卡比獸等級食物純圖片網格
      let snorlaxLevelsHTML = '';
      if (t.snorlaxLevels) {
        snorlaxLevelsHTML = Object.entries(t.snorlaxLevels).map(([lvl, foods]) => {
          const slots = foods.map(f => renderPrefItemSlot(f, db)).join('');
          return `
            <div style="margin-bottom:8px;">
              <strong style="font-size:0.78rem; display:block; margin-bottom:4px; color:#475569;">${escapeHTML(lvl)}：</strong>
              <div class="pref-item-grid">${slots}</div>
            </div>
          `;
        }).join('');
      }

      // 包含食物純圖片道具格 (無文字干擾)
      const foodsGridHTML = (t.foods && t.foods.length > 0)
        ? `<div class="pref-item-grid">${t.foods.map(f => renderPrefItemSlot(f, db)).join('')}</div>`
        : '';

      // 喜歡的寶可夢純圖片方格 (與物品方格完全一致)
      const pkmSlotsHTML = (t.pokemon || []).map(pName => renderPrefPokemonSlot(pName, pkmMap)).join('');

      return `
        <div class="pref-card ${isTarget ? 'highlight-target' : ''}" data-name="${escapeHTML(t.name)}">
          <div class="pref-card-header">
            <div class="pref-card-title">
              <span class="pref-pill pref-pill-taste" data-fav="${escapeHTML(t.name)}" style="font-size:0.95rem; font-weight:700;">${escapeHTML(t.name)}</span>
            </div>
            <span class="pref-card-badge">${(t.pokemon || []).length} 隻寶可夢喜愛</span>
          </div>

          <!-- 供奉苔卡比獸效果 -->
          ${t.snorlaxEffect ? `
            <div class="pref-snorlax-box">
              <div class="pref-snorlax-title">🥣 供奉苔卡比獸效果</div>
              <div style="margin-bottom:6px;">${escapeHTML(t.snorlaxEffect)}</div>
              ${snorlaxLevelsHTML ? `<div class="pref-snorlax-levels">${snorlaxLevelsHTML}</div>` : ''}
            </div>
          ` : ''}

          <!-- 喜愛的食物 (純圖片道具方格) -->
          ${foodsGridHTML ? `
            <div class="pref-section-subtitle">
              <span>🍎 包含食物 (${t.foods.length}種，點擊圖標查閱物品說明)</span>
            </div>
            ${foodsGridHTML}
          ` : ''}

          <!-- 喜愛的寶可夢 (純圖片方格，同物品道具欄規格) -->
          <div class="pref-section-subtitle" style="margin-top:12px;">
            <span>🐾 喜歡此口味的寶可夢 (${(t.pokemon || []).length}隻)</span>
          </div>
          <div class="pref-item-grid">${pkmSlotsHTML || '<span style="color:#94a3b8; font-size:0.8rem;">無特定喜好寶可夢</span>'}</div>
        </div>
      `;
    }).join('');

    DOM.prefDrawerBody.innerHTML = html;
    bindPrefDrawerPokemonChips();
    bindPrefDrawerItemSlots(db);
    scrollHighlightItem(highlightItem);
  }

  // 渲染分頁 2：喜歡的環境
  function renderPrefDrawerEnvironments(envs, query, pkmMap, highlightItem, db) {
    const filtered = envs.filter(e => {
      if (!query) return true;
      const haystack = (e.name + ' ' + (e.dimension || '') + ' ' + (e.items || []).join(' ') + ' ' + (e.pokemon || []).join(' ')).toLowerCase();
      // 同義詞支援：輸入「昏暗」亦能即時命中「🌙 黑暗」
      if (query.includes('昏暗') && (e.name.includes('黑暗') || haystack.includes('黑暗'))) return true;
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      DOM.prefDrawerBody.innerHTML = '<div style="padding:30px; text-align:center; color:#94a3b8;">無符合條件的環境項目</div>';
      return;
    }

    const envIcons = {
      '明亮': '☀️',
      '溫暖': '🔥',
      '潮濕': '💧',
      '乾燥': '🌵',
      '涼爽': '❄️',
      '🌙 黑暗': '🌙',
      '黑暗': '🌙'
    };
    const dimIcons = { '亮度': '☀️', '溫度': '🔥', '滋潤度': '💧' };

    let html = filtered.map(e => {
      const isTarget = highlightItem && (e.name === highlightItem || e.name.includes(highlightItem));
      const hasLeadingEmoji = /^[^\u4e00-\u9fa5a-zA-Z0-9]/.test(e.name.trim());
      const icon = hasLeadingEmoji ? '' : (envIcons[e.name] || dimIcons[e.dimension] || '🌐');
      const titleDisplay = icon ? `${icon} ${escapeHTML(e.name)}` : escapeHTML(e.name);

      // 營造環境的純圖片道具方格 (無文字干擾)
      const itemsGridHTML = (e.items && e.items.length > 0)
        ? `<div class="pref-item-grid">${e.items.map(it => renderPrefItemSlot(it, db)).join('')}</div>`
        : '';

      // 喜歡的寶可夢純圖片方格 (與物品方格完全一致)
      const pkmSlotsHTML = (e.pokemon || []).map(pName => renderPrefPokemonSlot(pName, pkmMap)).join('');

      return `
        <div class="pref-card ${isTarget ? 'highlight-target' : ''}" data-name="${escapeHTML(e.name)}">
          <div class="pref-card-header">
            <div class="pref-card-title">
              <span>${titleDisplay}</span>
            </div>
            <span class="pref-card-badge">${escapeHTML(e.dimension || '環境維度')} ‧ ${(e.pokemon || []).length} 隻寶可夢在意</span>
          </div>

          <!-- 改善/營造環境的物品與家具 (純圖片道具方格) -->
          ${itemsGridHTML ? `
            <div class="pref-section-subtitle">
              <span>🪑 營造此環境的物品與家具 (${e.items.length}種，點擊圖標查閱說明)</span>
            </div>
            ${itemsGridHTML}
          ` : ''}

          <!-- 喜愛的寶可夢 (純圖片方格，同物品道具欄規格) -->
          <div class="pref-section-subtitle" style="margin-top:12px;">
            <span>🐾 喜歡此環境的寶可夢 (${(e.pokemon || []).length}隻)</span>
          </div>
          <div class="pref-item-grid">${pkmSlotsHTML || '<span style="color:#94a3b8; font-size:0.8rem;">無特定寶可夢</span>'}</div>
        </div>
      `;
    }).join('');

    DOM.prefDrawerBody.innerHTML = html;
    bindPrefDrawerPokemonChips();
    bindPrefDrawerItemSlots(db);
    scrollHighlightItem(highlightItem);
  }

  // 渲染分頁 3：喜歡的東西 (風格特徵)
  function renderPrefDrawerThings(things, query, pkmMap, highlightItem, db) {
    const filtered = things.filter(th => {
      if (!query) return true;
      const haystack = (th.name + ' ' + (th.items || []).join(' ') + ' ' + (th.pokemon || []).join(' ')).toLowerCase();
      return haystack.includes(query);
    });

    if (filtered.length === 0) {
      DOM.prefDrawerBody.innerHTML = '<div style="padding:30px; text-align:center; color:#94a3b8;">無符合條件的特徵風格</div>';
      return;
    }

    let html = filtered.map(th => {
      const isTarget = highlightItem && (th.name === highlightItem || th.name.includes(highlightItem));

      // 代表物品與家具純圖片道具方格 (無文字干擾)
      const itemsGridHTML = (th.items && th.items.length > 0)
        ? `<div class="pref-item-grid">${th.items.map(it => renderPrefItemSlot(it, db)).join('')}</div>`
        : '';

      // 喜歡的寶可夢純圖片方格 (與物品方格完全一致)
      const pkmSlotsHTML = (th.pokemon || []).map(pName => renderPrefPokemonSlot(pName, pkmMap)).join('');

      return `
        <div class="pref-card ${isTarget ? 'highlight-target' : ''}" data-name="${escapeHTML(th.name)}">
          <div class="pref-card-header">
            <div class="pref-card-title">
              <span class="pref-pill pref-pill-thing" style="font-size:0.95rem; font-weight:700;">${escapeHTML(th.name)}</span>
            </div>
            <span class="pref-card-badge">${(th.items || []).length} 種代表物品 ‧ ${(th.pokemon || []).length} 隻寶可夢喜愛</span>
          </div>

          <!-- 代表物品與家具 (純圖片道具方格) -->
          ${itemsGridHTML ? `
            <div class="pref-section-subtitle">
              <span>📦 代表物品與家具 (${th.items.length}種，點擊圖標查閱說明)</span>
            </div>
            ${itemsGridHTML}
          ` : ''}

          <!-- 喜愛的寶可夢 (純圖片方格，同物品道具欄規格) -->
          <div class="pref-section-subtitle" style="margin-top:12px;">
            <span>🐾 喜歡此風格的寶可夢 (${(th.pokemon || []).length}隻)</span>
          </div>
          <div class="pref-item-grid">${pkmSlotsHTML || '<span style="color:#94a3b8; font-size:0.8rem;">無特定喜好寶可夢</span>'}</div>
        </div>
      `;
    }).join('');

    DOM.prefDrawerBody.innerHTML = html;
    bindPrefDrawerPokemonChips();
    bindPrefDrawerItemSlots(db);
    scrollHighlightItem(highlightItem);
  }

  // 渲染分頁 4：13 大分類官方物品列表 (展示官方 Sprite 圖標)
  function renderPrefDrawerItems(itemsByCat, query, highlightItem, db) {
    const activeDb = db || window.POKOPIA_PREFERENCES_DB || (typeof POKOPIA_PREFERENCES_DB !== 'undefined' ? POKOPIA_PREFERENCES_DB : null);
    const cats = Object.keys(itemsByCat);
    if (!state.prefItemCat || (!itemsByCat[state.prefItemCat] && state.prefItemCat !== 'all')) {
      state.prefItemCat = cats[0] || '材料';
    }

    // 分類按鈕列
    let catButtonsHTML = `
      <div class="pref-items-cats">
        <button class="pref-cat-filter-btn ${state.prefItemCat === 'all' ? 'active' : ''}" data-cat="all">全部</button>
        ${cats.map(cat => `
          <button class="pref-cat-filter-btn ${state.prefItemCat === cat ? 'active' : ''}" data-cat="${escapeHTML(cat)}">
            ${escapeHTML(cat)} (${(itemsByCat[cat] || []).length})
          </button>
        `).join('')}
      </div>
    `;

    // 收集要顯示的物品
    let list = [];
    if (state.prefItemCat === 'all') {
      cats.forEach(c => {
        (itemsByCat[c] || []).forEach(it => {
          list.push({ ...it, category: c });
        });
      });
    } else {
      list = (itemsByCat[state.prefItemCat] || []).map(it => ({ ...it, category: state.prefItemCat }));
    }

    if (query) {
      list = list.filter(it => {
        return (it.name.toLowerCase().includes(query) || (it.description && it.description.toLowerCase().includes(query)) || (it.tag && it.tag.toLowerCase().includes(query)));
      });
    }

    let itemsHTML = '';
    if (list.length === 0) {
      itemsHTML = '<div style="padding:20px; text-align:center; color:#94a3b8;">無符合條件的物品</div>';
    } else {
      itemsHTML = list.map(it => {
        const isTarget = highlightItem && (it.name === highlightItem || it.name.includes(highlightItem));
        const iconUrl = it.icon || (activeDb && activeDb.itemIcons && activeDb.itemIcons[it.name]) || '';
        const iconHTML = iconUrl ? `
          <div class="pref-item-row-icon">
            <img decoding="async" src="${iconUrl}" alt="${escapeHTML(it.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.style.display='none';">
          </div>
        ` : '';

        // 清洗與渲染官方 5 款特徵標籤小圖示
        const cleanTag = (it.tag || '').replace(/\[\[.*?\]\]/g, '').trim();
        const tagIcons = {
          '食物': 'assets/tag_icons/food.png',
          '裝飾': 'assets/tag_icons/decor.png',
          '休憩': 'assets/tag_icons/rest.png',
          '玩具': 'assets/tag_icons/toy.png',
          '道路': 'assets/tag_icons/road.png'
        };
        const tagIconSrc = tagIcons[cleanTag];
        let tagBadgeHTML = '';
        // 僅當具備官方特徵圖案時才渲染標籤，沒有圖案的標籤徹底拿掉
        if (cleanTag && tagIconSrc) {
          tagBadgeHTML = `
            <span class="pref-card-badge pref-tag-badge" title="特徵標籤：${escapeHTML(cleanTag)}">
              <img decoding="async" src="${tagIconSrc}" class="pref-tag-icon" alt="${escapeHTML(cleanTag)}" loading="lazy">
              <span>${escapeHTML(cleanTag)}</span>
            </span>
          `;
        }

        // 若為料理成品或食譜原料，標註可前往料理食譜
        const isFoodOrIngredient = window.POKOPIA_RECIPES_DB && (
          window.POKOPIA_RECIPES_DB.some(r => r.name === it.name) ||
          window.POKOPIA_RECIPES_DB.some(r => r.ingredients && r.ingredients.some(ig => ig.name === it.name)) ||
          cleanTag === '食物'
        );
        const recipeBadgeHTML = isFoodOrIngredient ? `
          <span class="pref-card-badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-size:0.72rem; display:inline-flex; align-items:center; gap:2px;" title="點擊前往料理食譜並定位">
            <span>🍽️</span>
            <span>食譜</span>
          </span>
        ` : '';

        return `
          <div class="pref-item-row ${isTarget ? 'pref-item-highlight' : ''} ${isFoodOrIngredient ? 'is-recipe-link' : ''}" data-name="${escapeHTML(it.name)}" ${isFoodOrIngredient ? 'title="點擊導向料理食譜頁面"' : ''}>
            <div class="pref-item-row-header">
              <div class="pref-item-row-main">
                ${iconHTML}
                <span class="pref-item-name">${escapeHTML(it.name)}</span>
              </div>
              <div style="display:flex; gap:6px; align-items:center;">
                ${recipeBadgeHTML}
                ${tagBadgeHTML}
              </div>
            </div>
            ${it.description ? `<div class="pref-item-desc" style="margin-top:4px;">${escapeHTML(it.description)}</div>` : ''}
          </div>
        `;
      }).join('');
    }

    DOM.prefDrawerBody.innerHTML = catButtonsHTML + `<div style="margin-top:10px;">${itemsHTML}</div>`;

    // 綁定食物/食材項目點擊導向料理食譜事件
    DOM.prefDrawerBody.querySelectorAll('.pref-item-row.is-recipe-link').forEach(row => {
      row.addEventListener('click', (e) => {
        const itemName = row.dataset.name;
        if (itemName && navigateItemToRecipe(itemName)) {
          e.stopPropagation();
        }
      });
    });

    // 綁定分類切換事件
    DOM.prefDrawerBody.querySelectorAll('.pref-cat-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.prefItemCat = btn.dataset.cat;
        renderPrefDrawerItems(itemsByCat, (state.prefSearch || '').trim().toLowerCase(), null, activeDb);
      });
    });

    scrollHighlightItem(highlightItem);
  }

  // 滾動至高亮項目 (精確定位並觸發平滑滾動與光暈動畫)
  function scrollHighlightItem(highlightItem) {
    if (!highlightItem || !DOM.prefDrawerBody) return;
    setTimeout(() => {
      const target = DOM.prefDrawerBody.querySelector(`[data-name="${highlightItem}"]`) ||
                     DOM.prefDrawerBody.querySelector(`[data-name*="${highlightItem}"]`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.remove('pref-item-highlight');
        void target.offsetWidth; // 強制重繪以重播動畫
        target.classList.add('pref-item-highlight');
      }
    }, 120);
  }

  // 綁定抽屜內點擊寶可夢跳轉事件 (由父層事件委派接管，保留相容函式)
  function bindPrefDrawerPokemonChips() {}

  // 手機進階篩選抽屜控制與 Badge 計算
  function updateFilterBadge() {
    let count = 0;
    if (state.selectedEnvFilter && state.selectedEnvFilter !== 'env-all') count++;
    if (state.selectedUnlockFilter && state.selectedUnlockFilter !== 'all') count++;
    if (state.currentTab === 'habitat') {
      if (state.selectedSpecialtyFilter && state.selectedSpecialtyFilter !== 'all') count++;
      if (state.selectedPkmCategory && state.selectedPkmCategory !== 'all') count++;
    } else if (state.currentTab === 'habitatCatalog') {
      if (state.selectedHabCategory && state.selectedHabCategory !== 'all') count++;
    }
    if (DOM.filterActiveBadge) {
      if (count > 0) {
        DOM.filterActiveBadge.textContent = count;
        DOM.filterActiveBadge.classList.remove('hidden');
      } else {
        DOM.filterActiveBadge.textContent = '0';
        DOM.filterActiveBadge.classList.add('hidden');
      }
    }
  }

  function openMobileFilterDrawer() {}
  function closeMobileFilterDrawer() {}

  function resetAllFilters() {
    state.selectedEnvFilter = 'env-all';
    state.selectedSpecialtyFilter = 'all';
    state.selectedUnlockFilter = 'all';
    state.selectedRegionFilter = 'all';
    state.selectedPkmCategory = 'all';
    state.selectedHabCategory = 'all';
    if (DOM.envFilter) DOM.envFilter.value = 'env-all';
    if (DOM.specialtyFilter) DOM.specialtyFilter.value = 'all';
    if (DOM.unlockFilter) DOM.unlockFilter.value = 'all';
    if (DOM.regionFilter) DOM.regionFilter.value = 'all';
    if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
    renderAll();
  }

  // Helper: HTML Escaper
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  // ==========================================================================
  // 地區地圖與世界觀指南 (Region Map & World Guide)
  // ==========================================================================

  function getRegionAssignments() {
    if (!state.regionAssignments || typeof state.regionAssignments !== 'object') {
      state.regionAssignments = {};
      const regData = (window.POKOPIA_REGION_DATA && window.POKOPIA_REGION_DATA.regions) || [];
      regData.forEach(r => {
        state.regionAssignments[r.id] = [...(r.defaultPokemonIds || [])];
      });
      saveRegionAssignments();
    }
    return state.regionAssignments;
  }

  function saveRegionAssignments() {
    try {
      localStorage.setItem('pokopia_region_assignments', JSON.stringify(state.regionAssignments));
    } catch (e) {}

    // 若已登入 Google，自動觸發雲端 Firestore 防抖上傳
    const fb = window.PokopiaFirebase;
    if (fb && typeof fb.getCurrentUser === 'function') {
      const user = fb.getCurrentUser();
      if (user) {
        const snapshot = {
          catChecked:        state.catChecked        || {},
          pkmChecked:        state.pkmChecked        || {},
          habChecked:        state.habChecked        || {},
          benchOverrides:    state.benchOverrides    || {},
          autoFarmChecked:   state.autoFarmChecked   || {},
          customBoxes:       state.customBoxes       || [],
          regionAssignments: state.regionAssignments || {}
        };
        fb.debouncedSave(user.uid, snapshot);
      }
    }
  }

  // 取得寶可夢當前所在區域（單一歸屬互斥：全站唯一或 null）
  function getPokemonCurrentRegion(pkmId) {
    if (!pkmId) return null;
    const assignments = getRegionAssignments();
    const regData = (window.POKOPIA_REGION_DATA && window.POKOPIA_REGION_DATA.regions) || [];
    for (const reg of regData) {
      const list = assignments[reg.id] || [];
      if (list.includes(pkmId)) {
        return {
          regionId: reg.id,
          regionName: reg.name,
          themeColor: reg.themeColor || '#6366f1',
          badgeText: reg.badgeText || ''
        };
      }
    }
    return null;
  }

  // 設定寶可夢區域（若 targetRegionId 為空或 'unassigned' 則設為未安置；否則移出其他所有區域並加入目標區域）
  function setPokemonRegion(pkmId, targetRegionId) {
    if (!pkmId) return;
    const assignments = getRegionAssignments();
    
    // 1. 先從所有區域中移出，確保單一歸屬互斥！
    Object.keys(assignments).forEach(rId => {
      assignments[rId] = (assignments[rId] || []).filter(id => id !== pkmId);
    });

    // 2. 若指定了目標區域，加入目標區域
    if (targetRegionId && targetRegionId !== 'unassigned') {
      if (!assignments[targetRegionId]) assignments[targetRegionId] = [];
      if (!assignments[targetRegionId].includes(pkmId)) {
        assignments[targetRegionId].push(pkmId);
      }
    }

    saveRegionAssignments();

    // 3. 根據當前分頁即時更新畫面
    if (state.currentTab === 'regionMap') {
      renderRegionMap();
    } else if (state.currentTab === 'habitat') {
      renderHabitatView();
    }
  }

  // 跨頁跳轉至指定地區地圖卡片並高亮
  function navigateToRegion(regionId) {
    if (DOM.pkmDetailModal && !DOM.pkmDetailModal.classList.contains('hidden')) {
      closePkmDetailModal();
    }
    switchTab('regionMap');
    if (regionId) {
      setTimeout(() => {
        const targetEl = document.getElementById(`regionCard_${regionId}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.classList.add('reg-card-highlight-pulse');
          setTimeout(() => targetEl.classList.remove('reg-card-highlight-pulse'), 1600);
        }
      }, 100);
    }
  }

  function renderRegionMap() {
    if (!DOM.regionMapContainer) return;
    const regionData = window.POKOPIA_REGION_DATA;
    if (!regionData) {
      DOM.regionMapContainer.innerHTML = '<p class="error-text">地區地圖資料尚未載入。</p>';
      return;
    }

    const assignments = getRegionAssignments();
    const pkmMap = new Map();
    (window.POKOPIA_DATA.pokemons || []).forEach(p => pkmMap.set(p.id, p));

    // 5 大區域卡片列表 (Regions Cards Flow)
    const regionsHTML = (regionData.regions || []).map(reg => {
      const pkmIds = assignments[reg.id] || [];
      const assignedPokemons = pkmIds.map(id => pkmMap.get(id)).filter(Boolean);

      const pkmRosterHTML = assignedPokemons.map(pkm => {
        const isUnlocked = !!(state.pkmChecked && state.pkmChecked[pkm.id]);
        return `
          <div class="reg-pkm-slot" data-pkm-id="${pkm.id}">
            <button class="reg-pkm-remove-btn" data-region-id="${reg.id}" data-pkm-id="${pkm.id}" title="從此區域移除">✕</button>
            <div class="reg-pkm-avatar-wrap" data-pkm-id="${pkm.id}" title="點擊查看 ${escapeHTML(pkm.name)} 完整百科">
              <img decoding="async" src="${pkm.sprite}" alt="${escapeHTML(pkm.name)}" onerror="this.src='${FALLBACK_SPRITE}'" loading="lazy">
              ${isUnlocked ? '<span class="reg-pkm-unlocked-badge" title="已解鎖">✔</span>' : ''}
            </div>
            <div class="reg-pkm-name" data-pkm-id="${pkm.id}" title="點擊查看 ${escapeHTML(pkm.name)} 完整百科">${escapeHTML(pkm.name)}</div>
          </div>
        `;
      }).join('');

      const landmarksHTML = (reg.keyLandmarks || []).map(lm => `
        <span class="reg-landmark-pill">${escapeHTML(lm)}</span>
      `).join('');

      const extraImageHTML = reg.extraImage ? `
        <button class="reg-map-thumb-btn" data-img="${reg.extraImage}" data-caption="<strong>${escapeHTML(reg.name)}</strong> - 遇見傳說寶可夢【蓋歐卡】深海出沒位置">
          <img decoding="async" src="${reg.extraImage}" alt="${escapeHTML(reg.name)} 蓋歐卡出沒" loading="lazy">
          <span class="reg-map-thumb-overlay">🌊 蓋歐卡出沒點 ↗</span>
        </button>
      ` : '';

      const viewAllMapBtnHTML = reg.id === 'palette_town' ? `
        <div class="reg-hub-map-preview-btn-wrap">
          <button class="reg-btn-view-all-map" id="btnViewAllMapModal" title="點擊檢視 4 大區域連通高解析大地圖">
            🗺️ 檢視全域連通大圖
          </button>
        </div>
      ` : '';

      return `
        <div class="reg-region-card" id="regionCard_${reg.id}" style="--region-theme: ${reg.themeColor};">
          <div class="reg-card-header">
            <div class="reg-header-titles">
              <div class="reg-badge-row">
                <span class="reg-theme-badge" style="background: ${reg.themeColor}22; color: ${reg.themeColor}; border: 1px solid ${reg.themeColor}44;">
                  ${escapeHTML(reg.badgeText)}
                </span>
                <span class="reg-kanto-pill">${escapeHTML(reg.kantoOrigin)}</span>
              </div>
              <h3 class="reg-name">${escapeHTML(reg.name)} <span class="reg-name-en">${escapeHTML(reg.nameEn)}</span></h3>
            </div>
            <div class="reg-header-highlight-row">
              <div class="reg-header-highlight">${escapeHTML(reg.highlightTitle)}</div>
              ${viewAllMapBtnHTML}
            </div>
          </div>

          <div class="reg-card-body">
            <div class="reg-desc-box">
              <div class="reg-desc-story">${escapeHTML(reg.story)}</div>
              <div class="reg-desc-mission">
                <strong>🎯 核心任務與使命：</strong>
                <span>${escapeHTML(reg.mission)}</span>
              </div>
              <div class="reg-landmarks-wrap">
                <strong>📍 關鍵地標與設施：</strong>
                <div class="reg-landmarks-list">${landmarksHTML}</div>
              </div>
            </div>

            <div class="reg-map-preview-col">
              <button class="reg-map-thumb-btn" data-img="${reg.mapImage}" data-caption="<strong>${escapeHTML(reg.name)}</strong> - 高解析全景地圖">
                <img decoding="async" src="${reg.mapImage}" alt="${escapeHTML(reg.name)} 地圖" loading="lazy">
                <span class="reg-map-thumb-overlay">🔍 點擊查看大圖 ↗</span>
              </button>
              ${extraImageHTML}
            </div>
          </div>

          <!-- 區域寶可夢自訂放置展台 -->
          <div class="reg-roster-section">
            <div class="reg-roster-header">
              <div class="reg-roster-title">
                <span>🐾 該地區放置的寶可夢夥伴</span>
                <span class="reg-roster-count" id="regRosterCount_${reg.id}">${assignedPokemons.length} 隻</span>
              </div>
              <button class="reg-btn-assign" data-region-id="${reg.id}" title="從 367 筆寶可夢中選擇並指派到此地區">
                ➕ 配置寶可夢
              </button>
            </div>
            <div class="reg-roster-grid" id="regRosterGrid_${reg.id}">
              ${pkmRosterHTML || '<div class="reg-roster-empty">尚未配置任何寶可夢，點擊上方「➕ 配置寶可夢」進行安排！</div>'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    DOM.regionMapContainer.innerHTML = `
      <div class="reg-page-layout">
        <div class="reg-cards-list">
          ${regionsHTML}
        </div>
      </div>
    `;

    bindRegionMapInteractions();
  }

  function bindRegionMapInteractions() {
    if (!DOM.regionMapContainer) return;

    // 檢視全圖大圖
    const btnAll = DOM.regionMapContainer.querySelector('#btnViewAllMapModal');
    if (btnAll) {
      btnAll.addEventListener('click', () => {
        openLightbox('assets/maps/map_all.jpg', 'Pokopia 4 大世界區域連通關係全貌 (空空鎮、空島、海邊、山地、荒野)');
      });
    }

    // 縮圖放大點擊
    DOM.regionMapContainer.querySelectorAll('.reg-map-thumb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const img = btn.getAttribute('data-img');
        const caption = btn.getAttribute('data-caption') || '';
        if (img) openLightbox(img, caption);
      });
    });

    // 寶可夢頭像點擊查看百科
    DOM.regionMapContainer.querySelectorAll('.reg-pkm-avatar-wrap, .reg-pkm-name').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const pkmId = el.getAttribute('data-pkm-id');
        if (pkmId && typeof openPkmDetailModal === 'function') {
          openPkmDetailModal(pkmId);
        }
      });
    });

    // 移除寶可夢按鈕
    DOM.regionMapContainer.querySelectorAll('.reg-pkm-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const regId = btn.getAttribute('data-region-id');
        const pkmId = btn.getAttribute('data-pkm-id');
        if (regId && pkmId) {
          removePokemonFromRegion(regId, pkmId);
        }
      });
    });

    // 開啟指派彈窗
    DOM.regionMapContainer.querySelectorAll('.reg-btn-assign').forEach(btn => {
      btn.addEventListener('click', () => {
        const regId = btn.getAttribute('data-region-id');
        if (regId) openRegionAssignModal(regId);
      });
    });
  }

  function removePokemonFromRegion(regionId, pkmId) {
    setPokemonRegion(pkmId, null);
  }

  function addPokemonToRegion(regionId, pkmId) {
    setPokemonRegion(pkmId, regionId);
  }

  // 區域寶可夢指派 Modal
  function openRegionAssignModal(regionId) {
    state.activeAssignRegionId = regionId;
    const regionData = window.POKOPIA_REGION_DATA;
    const reg = (regionData && regionData.regions ? regionData.regions : []).find(r => r.id === regionId);
    if (!reg || !DOM.regionPkmAssignModal) return;

    if (DOM.regionPkmTargetBadge) {
      DOM.regionPkmTargetBadge.textContent = reg.name;
      DOM.regionPkmTargetBadge.style.color = reg.themeColor;
      DOM.regionPkmTargetBadge.style.borderColor = `${reg.themeColor}55`;
    }
    if (DOM.regionPkmModalTitle) {
      DOM.regionPkmModalTitle.textContent = `配置寶可夢至【${reg.name}】`;
    }
    if (DOM.regionPkmSearchInput) {
      DOM.regionPkmSearchInput.value = '';
    }

    renderCandidatePokemonList('');
    DOM.regionPkmAssignModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    if (DOM.regionPkmSearchInput) DOM.regionPkmSearchInput.focus();
  }

  function closeRegionAssignModal() {
    if (!DOM.regionPkmAssignModal) return;
    DOM.regionPkmAssignModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    state.activeAssignRegionId = null;
  }

  function renderCandidatePokemonList(query = '') {
    if (!DOM.regionPkmCandidateList || !state.activeAssignRegionId) return;
    const regionId = state.activeAssignRegionId;
    const assignments = getRegionAssignments();
    const assignedSet = new Set(assignments[regionId] || []);

    const allPokemons = (window.POKOPIA_DATA && window.POKOPIA_DATA.pokemons) || [];
    const q = query.trim().toLowerCase();

    const filtered = allPokemons.filter(p => {
      if (!q) return true;
      return (p.name && p.name.toLowerCase().includes(q)) ||
             (p.number && p.number.toLowerCase().includes(q)) ||
             (p.environment && p.environment.toLowerCase().includes(q)) ||
             (p.categoryName && p.categoryName.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      DOM.regionPkmCandidateList.innerHTML = `
        <div class="reg-pkm-empty-search">
          <span>🔍 找不到符合「${escapeHTML(query)}」的寶可夢</span>
        </div>
      `;
      return;
    }

    DOM.regionPkmCandidateList.innerHTML = filtered.map(pkm => {
      const isAssigned = assignedSet.has(pkm.id);
      const isUnlocked = !!(state.pkmChecked && state.pkmChecked[pkm.id]);
      return `
        <div class="reg-candidate-card ${isAssigned ? 'is-assigned' : ''}" data-pkm-id="${pkm.id}">
          <div class="reg-candidate-avatar">
            <img decoding="async" src="${pkm.sprite}" alt="${escapeHTML(pkm.name)}" onerror="this.src='${FALLBACK_SPRITE}'" loading="lazy">
            ${isUnlocked ? '<span class="reg-candidate-unlocked-dot" title="已吸引解鎖">✔</span>' : ''}
          </div>
          <div class="reg-candidate-info">
            <span class="reg-candidate-number">${escapeHTML(pkm.number)}</span>
            <strong class="reg-candidate-name">${escapeHTML(pkm.name)}</strong>
          </div>
          <button class="reg-candidate-action-btn ${isAssigned ? 'btn-remove' : 'btn-add'}" data-pkm-id="${pkm.id}">
            ${isAssigned ? '已放置 (✕)' : '＋ 加入'}
          </button>
        </div>
      `;
    }).join('');

    // 綁定加入/移除按鈕事件
    DOM.regionPkmCandidateList.querySelectorAll('.reg-candidate-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pkmId = btn.getAttribute('data-pkm-id');
        if (!pkmId) return;
        if (assignedSet.has(pkmId)) {
          removePokemonFromRegion(regionId, pkmId);
          assignedSet.delete(pkmId);
          btn.textContent = '＋ 加入';
          btn.classList.remove('btn-remove');
          btn.classList.add('btn-add');
          btn.closest('.reg-candidate-card').classList.remove('is-assigned');
        } else {
          addPokemonToRegion(regionId, pkmId);
          assignedSet.add(pkmId);
          btn.textContent = '已放置 (✕)';
          btn.classList.remove('btn-add');
          btn.classList.add('btn-remove');
          btn.closest('.reg-candidate-card').classList.add('is-assigned');
        }
      });
    });
  }

  function initRegionMapEvents() {
    if (DOM.regionPkmCloseBtn) {
      DOM.regionPkmCloseBtn.addEventListener('click', closeRegionAssignModal);
    }
    if (DOM.regionPkmBackdrop) {
      DOM.regionPkmBackdrop.addEventListener('click', closeRegionAssignModal);
    }
    if (DOM.regionPkmSearchInput) {
      DOM.regionPkmSearchInput.addEventListener('input', (e) => {
        renderCandidatePokemonList(e.target.value);
      });
    }

    // 按下 ESC 鍵關閉彈窗
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.regionPkmAssignModal && !DOM.regionPkmAssignModal.classList.contains('hidden')) {
        closeRegionAssignModal();
      }
    });
  }

  // ==========================================================================
  // 參考影片影廳模式與自訂管理控制器 (Video Theater & Management)
  // ==========================================================================

  // 解析多種 YouTube 網址或純 ID 格式（完整支援電腦與手機分享格式）
  function parseYouTubeId(input) {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    // 1. 純 11 碼 ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    // 2. 短網址 youtu.be/xxxx
    const shortMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return shortMatch[1];
    // 3. YouTube Shorts 格式 (手機 App 常用分享)
    const shortsMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
    if (shortsMatch) return shortsMatch[1];
    // 4. YouTube Live 直播格式
    const liveMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
    if (liveMatch) return liveMatch[1];
    // 5. 標準 watch / embed / v 格式
    const standardMatch = trimmed.match(/(?:https?:\/\/)?(?:(?:www|m)\.)?youtube\.com\/(?:watch\?.*v=|embed\/|v\/)([a-zA-Z0-9_-]{11})/i);
    if (standardMatch) return standardMatch[1];
    // 6. 通用參數提取 (例如 v=xxxx 在任何 query 參數中)
    const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/);
    if (queryMatch) return queryMatch[1];

    return '';
  }

  function areVideoListsEqual(listA, listB) {
    if (!Array.isArray(listA) || !Array.isArray(listB)) return listA === listB;
    if (listA.length !== listB.length) return false;
    for (let i = 0; i < listA.length; i++) {
      const a = listA[i], b = listB[i];
      if (!a || !b) return false;
      if (a.id !== b.id || a.videoId !== b.videoId || a.title !== b.title || a.author !== b.author) return false;
      if (a.note !== b.note || a.cloudCode !== b.cloudCode) return false;
      const tagsA = (a.tags || []).join(',');
      const tagsB = (b.tags || []).join(',');
      if (tagsA !== tagsB) return false;
    }
    return true;
  }

  function getAllVideos() {
    return (state.customVideos && Array.isArray(state.customVideos)) ? state.customVideos : [];
  }

  function getAllVideoTags() {
    const deleted = new Set(state.deletedVideoTags || []);
    const defaultTags = (window.POKOPIA_DEFAULT_TAGS || ['全部', '建築', '終局農場', '環境等級', '自動化', '資源收集', '傢俱攻略']);
    
    // 優先以 state.customVideoTags 為準，若尚未有 customVideoTags 則使用 defaultTags
    let baseList = [];
    if (Array.isArray(state.customVideoTags) && state.customVideoTags.length > 0) {
      baseList = state.customVideoTags;
    } else {
      baseList = defaultTags.filter(t => t !== '全部' && t !== '我的自訂');
    }

    const tagSet = new Set();
    tagSet.add('全部');
    baseList.forEach(t => {
      if (t && t !== '我的自訂' && !deleted.has(t)) {
        tagSet.add(t);
      }
    });

    // 從所有現存影片補充使用者新增在個別影片上的標籤（但排除已刪除黑名單）
    const videoList = getAllVideos();
    videoList.forEach(v => {
      if (Array.isArray(v.tags)) {
        v.tags.forEach(t => {
          if (t && t !== '我的自訂' && !deleted.has(t)) {
            tagSet.add(t);
          }
        });
      }
    });

    tagSet.delete('我的自訂');
    deleted.forEach(d => tagSet.delete(d));

    // 保證 '全部' 在第一位
    const result = Array.from(tagSet);
    const allIdx = result.indexOf('全部');
    if (allIdx > -1) {
      result.splice(allIdx, 1);
      result.unshift('全部');
    }
    return result;
  }

  function saveCustomVideosAndSync() {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEOS, JSON.stringify(state.customVideos));
      localStorage.setItem(STORAGE_KEY_CUSTOM_VIDEO_TAGS, JSON.stringify(state.customVideoTags));
      localStorage.setItem(STORAGE_KEY_DELETED_VIDEO_TAGS, JSON.stringify(state.deletedVideoTags));
      localStorage.setItem(STORAGE_KEY_DELETED_VIDEO_IDS, JSON.stringify(state.deletedVideoIds));
    } catch (e) {
      console.warn('Failed to save custom videos to LocalStorage:', e);
    }
    const fb = window.PokopiaFirebase;
    if (fb && typeof fb.getCurrentUser === 'function') {
      const user = fb.getCurrentUser();
      if (user && user.uid) {
        fb.saveCloudProgress(user.uid, {
          customVideos: state.customVideos,
          customVideoTags: state.customVideoTags,
          deletedVideoTags: state.deletedVideoTags,
          deletedVideoIds: state.deletedVideoIds
        });
      }
    }
  }

  function getActiveVideo() {
    const all = getAllVideos();
    if (all.length === 0) return null;
    if (state.currentVideoId) {
      const found = all.find(v => v.id === state.currentVideoId);
      if (found) return found;
    }
    return all[0];
  }

  function renderVideoSection() {
    if (!DOM.videoSection) return;
    const activeVideo = getActiveVideo();
    if (activeVideo) {
      state.currentVideoId = activeVideo.id;
      saveProgress(STORAGE_KEY_ACTIVE_VIDEO, state.currentVideoId);
    }
    renderTheaterPlayer(activeVideo);
    renderVideoTags();
    renderVideoCards();
  }

  // ─── 影片播放進度記憶與續播控制器 (Video Playback Progress & Resume) ──────
  let _currentLoadedVideoId = null;
  let _ytPlayer = null;
  let _ytProgressInterval = null;
  let _ytApiLoading = false;
  let _resumeBannerDismissTimer = null;

  function formatPlaybackTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function saveVideoProgressAndSync() {
    saveProgress(STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS, state.videoProgress);
  }

  function recordCurrentVideoProgress(videoId, currentTime, duration) {
    if (!videoId) return;
    if (!state.videoProgress) state.videoProgress = {};

    // 完播（ENDED）或離片尾 <= 10 秒：自動歸零重置
    if (duration > 0 && (duration - currentTime) <= 10) {
      if (state.videoProgress[videoId]) {
        delete state.videoProgress[videoId];
        saveVideoProgressAndSync();
      }
      return;
    }

    // 未滿 5 秒不予紀錄 (重置/清除)
    if (currentTime < 5) {
      if (state.videoProgress[videoId]) {
        delete state.videoProgress[videoId];
        saveVideoProgressAndSync();
      }
      return;
    }

    const rounded = Math.floor(currentTime);
    if (state.videoProgress[videoId] !== rounded) {
      state.videoProgress[videoId] = rounded;
      saveVideoProgressAndSync();
    }
  }

  function initYouTubeIframeApi() {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) return;
    if (_ytApiLoading) return;
    _ytApiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tag, firstScript);
    } else {
      document.head.appendChild(tag);
    }
  }

  function setupYouTubePlayerInstance() {
    if (typeof window === 'undefined' || !window.YT || !window.YT.Player || !DOM.videoPlayerIframe) return;
    try {
      if (_ytPlayer) return;
      _ytPlayer = new window.YT.Player('videoPlayerIframe', {
        events: {
          onStateChange: (event) => {
            // 1: PLAYING, 2: PAUSED, 0: ENDED
            if (event.data === 1) {
              startProgressSampling();
            } else {
              stopProgressSampling();
              const active = getActiveVideo();
              if (event.data === 0) {
                if (active) recordCurrentVideoProgress(active.videoId, 0, 0);
              } else if (event.data === 2) {
                sampleCurrentProgress();
              }
            }
          }
        }
      });
    } catch (e) {
      console.warn('[YT.Player] Init warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    window.onYouTubeIframeAPIReady = function() {
      setupYouTubePlayerInstance();
    };

    // ─── 雙軌監聽：YouTube 原生 postMessage 事件通道 (無延遲零阻擋) ───
    window.addEventListener('message', (event) => {
      if (!event || !event.data) return;
      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          return;
        }
      }
      if (data && data.event === 'infoDelivery' && data.info) {
        const info = data.info;
        const active = getActiveVideo();
        if (active) {
          if (typeof info.currentTime === 'number') {
            const cur = info.currentTime;
            const dur = (typeof info.duration === 'number') ? info.duration : (active.duration || 0);
            recordCurrentVideoProgress(active.videoId, cur, dur);
          }
          if (typeof info.playerState === 'number') {
            // 0: ENDED, 1: PLAYING, 2: PAUSED
            if (info.playerState === 0) {
              recordCurrentVideoProgress(active.videoId, 0, 0);
            }
          }
        }
      }
    });

    // 重新整理或關閉分頁瞬間 (beforeunload) 立即 Flush 當前進度
    window.addEventListener('beforeunload', () => {
      sampleCurrentProgress();
      try {
        localStorage.setItem(STORAGE_KEY_VIDEO_PLAYBACK_PROGRESS, JSON.stringify(state.videoProgress));
        if (state.currentVideoId) {
          localStorage.setItem(STORAGE_KEY_ACTIVE_VIDEO, JSON.stringify(state.currentVideoId));
        }
      } catch (e) {}
    });
  }

  function startProgressSampling() {
    stopProgressSampling();
    _ytProgressInterval = setInterval(() => {
      sampleCurrentProgress();
    }, 1000);
  }

  function stopProgressSampling() {
    if (_ytProgressInterval) {
      clearInterval(_ytProgressInterval);
      _ytProgressInterval = null;
    }
  }

  function sampleCurrentProgress() {
    if (!_ytPlayer) return;
    try {
      const active = getActiveVideo();
      if (!active) return;
      if (typeof _ytPlayer.getCurrentTime === 'function') {
        const cur = _ytPlayer.getCurrentTime() || 0;
        const dur = (typeof _ytPlayer.getDuration === 'function') ? (_ytPlayer.getDuration() || 0) : 0;
        recordCurrentVideoProgress(active.videoId, cur, dur);
      }
    } catch (e) {}
  }

  function showResumeBanner(video, savedSeconds) {
    if (!DOM.videoResumeBanner) return;
    clearTimeout(_resumeBannerDismissTimer);
    DOM.videoResumeBanner.classList.remove('fade-out', 'hidden');
    if (DOM.videoResumeText) {
      DOM.videoResumeText.textContent = `已定位至上次觀看進度 ${formatPlaybackTime(savedSeconds)}`;
    }

    if (DOM.btnVideoRestart) {
      DOM.btnVideoRestart.onclick = () => {
        restartCurrentVideoFromBeginning(video);
      };
    }

    if (DOM.btnVideoResumeDismiss) {
      DOM.btnVideoResumeDismiss.onclick = () => {
        hideResumeBanner();
      };
    }

    _resumeBannerDismissTimer = setTimeout(() => {
      hideResumeBanner();
    }, 5000);
  }

  function hideResumeBanner() {
    clearTimeout(_resumeBannerDismissTimer);
    if (!DOM.videoResumeBanner) return;
    DOM.videoResumeBanner.classList.add('fade-out');
    setTimeout(() => {
      if (DOM.videoResumeBanner && DOM.videoResumeBanner.classList.contains('fade-out')) {
        DOM.videoResumeBanner.classList.add('hidden');
        DOM.videoResumeBanner.classList.remove('fade-out');
      }
    }, 350);
  }

  function restartCurrentVideoFromBeginning(video) {
    if (!video) return;
    hideResumeBanner();
    if (state.videoProgress && state.videoProgress[video.videoId]) {
      delete state.videoProgress[video.videoId];
      saveVideoProgressAndSync();
    }
    if (_ytPlayer && typeof _ytPlayer.seekTo === 'function') {
      try {
        _ytPlayer.seekTo(0, true);
        if (typeof _ytPlayer.playVideo === 'function') _ytPlayer.playVideo();
        return;
      } catch (e) {}
    }
    if (DOM.videoPlayerIframe) {
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? encodeURIComponent(window.location.origin) : '';
      const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?rel=0&enablejsapi=1&autoplay=1${origin ? '&origin=' + origin : ''}`;
      DOM.videoPlayerIframe.src = embedUrl;
    }
  }

  function renderTheaterPlayer(video) {
    if (!video) {
      _currentLoadedVideoId = null;
      stopProgressSampling();
      hideResumeBanner();
      if (DOM.videoPlayerIframe) DOM.videoPlayerIframe.src = '';
      if (DOM.videoCurrentTitle) DOM.videoCurrentTitle.textContent = '尚無參考影片';
      if (DOM.videoCurrentNote) DOM.videoCurrentNote.textContent = '請點擊下方「新增影片」按鈕添加您的第一部影片。';
      if (DOM.videoCurrentAuthor) DOM.videoCurrentAuthor.textContent = '-';
      if (DOM.videoCurrentDate) DOM.videoCurrentDate.textContent = '';
      if (DOM.videoExternalLink) DOM.videoExternalLink.style.display = 'none';
      if (DOM.btnEditCurrentVideo) DOM.btnEditCurrentVideo.classList.add('hidden');
      if (DOM.videoCurrentCloudCodeWrap) DOM.videoCurrentCloudCodeWrap.classList.add('hidden');
      if (DOM.videoCurrentTags) DOM.videoCurrentTags.innerHTML = '';
      return;
    }

    // 檢查是否已在播放同一部影片，若是，絕對不更動 iframe 與播放狀態，避免中斷播放
    const isSameVideo = (_currentLoadedVideoId === video.videoId) && DOM.videoPlayerIframe && DOM.videoPlayerIframe.src;
    if (!isSameVideo) {
      _currentLoadedVideoId = video.videoId;
      stopProgressSampling();
      hideResumeBanner();

      // 啟動 YouTube Iframe API 載入 (如未載入)
      initYouTubeIframeApi();

      // 取得該影片上次儲存之播放進度 (秒數)
      const savedTime = (state.videoProgress && typeof state.videoProgress[video.videoId] === 'number')
        ? state.videoProgress[video.videoId]
        : 0;

      // 播放器 iframe (支援從上次秒數續播 start 參數)
      if (DOM.videoPlayerIframe) {
        DOM.videoPlayerIframe.referrerPolicy = 'strict-origin-when-cross-origin';
        const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? encodeURIComponent(window.location.origin) : '';
        const startParam = (savedTime >= 5) ? `&start=${Math.floor(savedTime)}` : '';
        const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.videoId)}?rel=0&enablejsapi=1${startParam}${origin ? '&origin=' + origin : ''}`;
        if (DOM.videoPlayerIframe.src !== embedUrl) {
          DOM.videoPlayerIframe.src = embedUrl;
        }
      }

      // 若有上次紀錄（>= 5 秒），跳出續播提示膠囊
      if (savedTime >= 5) {
        showResumeBanner(video, savedTime);
      }

      // 若 API 已就緒，嘗試掛載實例
      setupYouTubePlayerInstance();
    }

    if (DOM.videoCurrentTitle) DOM.videoCurrentTitle.textContent = video.title || '未命名影片';
    if (DOM.videoCurrentNote) DOM.videoCurrentNote.textContent = video.note || '暫無詳細說明。';
    if (DOM.videoCurrentAuthor) DOM.videoCurrentAuthor.textContent = video.author || '攻略作者';
    if (DOM.videoCurrentDate) {
      DOM.videoCurrentDate.textContent = '自選攻略';
    }

    // 外部連結
    if (DOM.videoExternalLink) {
      DOM.videoExternalLink.style.display = 'inline-flex';
      DOM.videoExternalLink.href = video.url || `https://www.youtube.com/watch?v=${video.videoId}`;
    }

    // 編輯按鈕：全清單影片皆可自由編輯
    if (DOM.btnEditCurrentVideo) {
      DOM.btnEditCurrentVideo.classList.remove('hidden');
      DOM.btnEditCurrentVideo.onclick = () => openVideoModal(video);
    }

    // 雲端碼
    if (DOM.videoCurrentCloudCodeWrap && DOM.videoCurrentCloudCode) {
      if (video.cloudCode && video.cloudCode.trim()) {
        DOM.videoCurrentCloudCodeWrap.classList.remove('hidden');
        DOM.videoCurrentCloudCode.textContent = video.cloudCode.trim();
      } else {
        DOM.videoCurrentCloudCodeWrap.classList.add('hidden');
      }
    }

    // 標籤清單
    if (DOM.videoCurrentTags) {
      const tags = Array.isArray(video.tags) ? video.tags : [];
      DOM.videoCurrentTags.innerHTML = tags.map(t => `<span class="video-card-tag-pill">#${escapeHTML(t)}</span>`).join('');
    }
  }

  function renderVideoTags() {
    if (!DOM.videoTagsContainer) return;
    const allTags = getAllVideoTags();
    const allVideos = getAllVideos();

    let html = '';
    allTags.forEach(tag => {
      let count = 0;
      if (tag === '全部') {
        count = allVideos.length;
      } else {
        count = allVideos.filter(v => Array.isArray(v.tags) && v.tags.includes(tag)).length;
      }

      const isActive = (state.selectedVideoTag === tag);
      html += `
        <button class="video-tag-pill ${isActive ? 'active' : ''}" data-tag="${escapeHTML(tag)}">
          <span>${escapeHTML(tag)}</span>
          <span class="video-tag-count">${count}</span>
        </button>
      `;
    });

    DOM.videoTagsContainer.innerHTML = html;

    // 綁定標籤切換事件
    DOM.videoTagsContainer.querySelectorAll('.video-tag-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        state.selectedVideoTag = tag;
        renderVideoTags();
        renderVideoCards();
      });
    });
  }

  let _lastRenderedCardsFingerprint = '';

  function renderVideoCards() {
    if (!DOM.videoCardsGrid) return;
    const allVideos = getAllVideos();
    const selectedTag = state.selectedVideoTag || '全部';

    const filtered = allVideos.filter(v => {
      if (selectedTag === '全部') return true;
      return Array.isArray(v.tags) && v.tags.includes(selectedTag);
    });

    if (filtered.length === 0) {
      _lastRenderedCardsFingerprint = `${selectedTag}::empty`;
      DOM.videoCardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎬</div>
          <p style="font-size: 0.95rem; margin: 0;">目前標籤「${escapeHTML(selectedTag)}」沒有任何影片</p>
        </div>
      `;
      return;
    }

    // 渲染指紋守衛：若當前標籤、播放中影片與卡片內容均未實質變更，絕不重新清空 DOM，徹底消除縮圖閃爍
    const currentFingerprint = `${selectedTag}::${state.currentVideoId}::` + filtered.map(v => `${v.id}_${v.title}_${v.videoId}`).join('|');
    if (_lastRenderedCardsFingerprint === currentFingerprint && DOM.videoCardsGrid.children.length > 0) {
      return;
    }
    _lastRenderedCardsFingerprint = currentFingerprint;

    DOM.videoCardsGrid.innerHTML = filtered.map(v => {
      const isPlaying = (state.currentVideoId === v.id);
      const thumbUrl = `https://img.youtube.com/vi/${encodeURIComponent(v.videoId)}/hqdefault.jpg`;
      const tags = Array.isArray(v.tags) ? v.tags : [];
      return `
        <div class="video-card ${isPlaying ? 'playing' : ''}" data-video-id="${escapeHTML(v.id)}">
          <div class="video-card-thumb-wrap">
            <img decoding="async" class="video-card-thumb-img" src="${thumbUrl}" alt="${escapeHTML(v.title)}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'320\\' height=\\'180\\' viewBox=\\'0 0 320 180\\' fill=\\'%23222\\'><rect width=\\'320\\' height=\\'180\\'/><text x=\\'160\\' y=\\'95\\' fill=\\'%23666\\' font-size=\\'14\\' text-anchor=\\'middle\\'>🎬 暫無縮圖</text></svg>'">
            <div class="video-card-play-overlay">
              <span class="video-card-play-icon">▶</span>
            </div>
            ${isPlaying ? '<div class="video-card-playing-badge"><span>▶ 播放中</span></div>' : ''}
          </div>
          <div class="video-card-body">
            <div class="video-card-top-row">
              <span class="video-card-author">${escapeHTML(v.author || '攻略作者')}</span>
              <button class="video-card-edit-btn" data-edit-id="${escapeHTML(v.id)}" title="編輯此影片">✏️</button>
            </div>
            <h3 class="video-card-title" title="${escapeHTML(v.title)}">${escapeHTML(v.title)}</h3>
            <p class="video-card-note">${escapeHTML(v.note || '')}</p>
            <div class="video-card-tags-row">
              ${tags.map(t => `<span class="video-card-tag-pill">#${escapeHTML(t)}</span>`).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // 點擊卡片切換上方影廳主播放器
    DOM.videoCardsGrid.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.video-card-edit-btn')) return; // 防止觸發編輯按鈕冒泡
        const vidId = card.getAttribute('data-video-id');
        const targetVid = allVideos.find(v => v.id === vidId);
        if (targetVid) {
          state.currentVideoId = targetVid.id;
          saveProgress(STORAGE_KEY_ACTIVE_VIDEO, state.currentVideoId);
          renderTheaterPlayer(targetVid);
          renderVideoCards();
          // 平滑滾動至影廳主播放器
          if (DOM.videoSection) {
            DOM.videoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // 卡片內編輯按鈕
    DOM.videoCardsGrid.querySelectorAll('.video-card-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const editId = btn.getAttribute('data-edit-id');
        const targetVid = allVideos.find(v => v.id === editId);
        if (targetVid) {
          openVideoModal(targetVid);
        }
      });
    });
  }

  // ─── Modal 與自訂影片管理 ──────────────────────────────────────────
  let _activeFormSelectedTags = new Set();

  function openVideoModal(videoToEdit = null) {
    if (!DOM.videoModal) return;
    _activeFormSelectedTags.clear();

    if (videoToEdit) {
      if (DOM.videoModalBadge) DOM.videoModalBadge.textContent = '編輯影片';
      if (DOM.videoModalTitle) DOM.videoModalTitle.textContent = '編輯影片內容';
      if (DOM.videoFormId) DOM.videoFormId.value = videoToEdit.id;
      if (DOM.videoFormUrl) DOM.videoFormUrl.value = videoToEdit.url || videoToEdit.videoId;
      if (DOM.videoFormTitle) DOM.videoFormTitle.value = videoToEdit.title || '';
      if (DOM.videoFormAuthor) DOM.videoFormAuthor.value = videoToEdit.author || '';
      if (DOM.videoFormNote) DOM.videoFormNote.value = videoToEdit.note || '';
      if (DOM.videoFormCloudCode) DOM.videoFormCloudCode.value = videoToEdit.cloudCode || '';
      if (DOM.btnVideoDelete) DOM.btnVideoDelete.classList.remove('hidden');

      if (Array.isArray(videoToEdit.tags)) {
        videoToEdit.tags.forEach(t => _activeFormSelectedTags.add(t));
      }
    } else {
      if (DOM.videoModalBadge) DOM.videoModalBadge.textContent = '新增影片';
      if (DOM.videoModalTitle) DOM.videoModalTitle.textContent = '新增參考影片';
      if (DOM.videoFormId) DOM.videoFormId.value = '';
      if (DOM.videoFormUrl) DOM.videoFormUrl.value = '';
      if (DOM.videoFormTitle) DOM.videoFormTitle.value = '';
      if (DOM.videoFormAuthor) DOM.videoFormAuthor.value = '';
      if (DOM.videoFormNote) DOM.videoFormNote.value = '';
      if (DOM.videoFormCloudCode) DOM.videoFormCloudCode.value = '';
      if (DOM.btnVideoDelete) DOM.btnVideoDelete.classList.add('hidden');
    }

    _videoOriginalTitle = '';
    _videoTranslatedTitle = '';
    _isShowingOriginalTitle = false;
    if (DOM.btnToggleTitleLang) DOM.btnToggleTitleLang.classList.add('hidden');
    if (DOM.toggleLangText) DOM.toggleLangText.textContent = '原文';

    renderModalTagPool();
    DOM.videoModal.classList.remove('hidden');
    if (DOM.videoFormUrl) DOM.videoFormUrl.focus();
  }

  function closeVideoModal() {
    if (DOM.videoModal) {
      DOM.videoModal.classList.add('hidden');
    }
  }

  function renameVideoTag(oldTag, newTag) {
    if (!oldTag || !newTag) return;
    oldTag = oldTag.trim();
    newTag = newTag.trim();
    if (!newTag || oldTag === newTag) return;
    if (newTag === '全部') {
      alert('「全部」為系統保留標籤名稱，請使用其他名稱！');
      return;
    }

    // 若新標籤曾在黑名單中，將其解禁
    if (!Array.isArray(state.deletedVideoTags)) {
      state.deletedVideoTags = [];
    }
    state.deletedVideoTags = state.deletedVideoTags.filter(t => t !== newTag);
    // 將舊標籤加入黑名單，防範未來從預設標籤復活
    if (!state.deletedVideoTags.includes(oldTag)) {
      state.deletedVideoTags.push(oldTag);
    }
    saveProgress(STORAGE_KEY_DELETED_VIDEO_TAGS, state.deletedVideoTags);

    // 1. 更新 state.customVideoTags
    if (!Array.isArray(state.customVideoTags) || state.customVideoTags.length === 0) {
      state.customVideoTags = getAllVideoTags().filter(t => t !== '全部');
    }
    const tagIdx = state.customVideoTags.indexOf(oldTag);
    if (tagIdx > -1) {
      state.customVideoTags[tagIdx] = newTag;
    } else {
      state.customVideoTags.push(newTag);
    }
    state.customVideoTags = Array.from(new Set(state.customVideoTags.filter(t => t !== oldTag)));

    // 2. 批次更新所有包含舊標籤的影片
    let affectedCount = 0;
    (state.customVideos || []).forEach(v => {
      if (Array.isArray(v.tags) && v.tags.includes(oldTag)) {
        v.tags = v.tags.map(t => (t === oldTag ? newTag : t));
        affectedCount++;
      }
    });

    // 3. 更新當前表單已選中的 Set
    if (_activeFormSelectedTags.has(oldTag)) {
      _activeFormSelectedTags.delete(oldTag);
      _activeFormSelectedTags.add(newTag);
    }

    // 4. 若當前檢視篩選正是舊標籤，切換為新標籤
    if (state.selectedVideoTag === oldTag) {
      state.selectedVideoTag = newTag;
    }

    saveCustomVideosAndSync();
    renderModalTagPool();
    renderVideoTags();
    renderVideoCards();
    showCsToast(`✅ 已將「${oldTag}」重新命名為「${newTag}」${affectedCount > 0 ? `（同步更新 ${affectedCount} 部影片）` : ''}`);
  }

  function deleteVideoTag(tagToDelete) {
    if (!tagToDelete) return;
    tagToDelete = tagToDelete.trim();
    if (tagToDelete === '全部') {
      alert('「全部」為系統保留標籤，無法刪除！');
      return;
    }

    if (!confirm(`確定要刪除標籤「${tagToDelete}」嗎？\n已套用此標籤的影片將自動移除此標籤。`)) {
      return;
    }

    // 0. 將被刪除標籤加入黑名單，保證任何地方都不會復活
    if (!Array.isArray(state.deletedVideoTags)) {
      state.deletedVideoTags = [];
    }
    if (!state.deletedVideoTags.includes(tagToDelete)) {
      state.deletedVideoTags.push(tagToDelete);
    }
    saveProgress(STORAGE_KEY_DELETED_VIDEO_TAGS, state.deletedVideoTags);

    // 1. 從 state.customVideoTags 移除
    if (!Array.isArray(state.customVideoTags) || state.customVideoTags.length === 0) {
      state.customVideoTags = getAllVideoTags().filter(t => t !== '全部');
    }
    state.customVideoTags = state.customVideoTags.filter(t => t !== tagToDelete);

    // 2. 批次自所有影片移除該標籤
    let affectedCount = 0;
    (state.customVideos || []).forEach(v => {
      if (Array.isArray(v.tags) && v.tags.includes(tagToDelete)) {
        v.tags = v.tags.filter(t => t !== tagToDelete);
        affectedCount++;
      }
    });

    // 3. 從當前表單已選集合移除
    _activeFormSelectedTags.delete(tagToDelete);

    // 4. 若當前檢視篩選正是此標籤，重置回「全部」
    if (state.selectedVideoTag === tagToDelete) {
      state.selectedVideoTag = '全部';
    }

    saveCustomVideosAndSync();
    renderModalTagPool();
    renderVideoTags();
    renderVideoCards();
    showCsToast(`🗑️ 已刪除標籤「${tagToDelete}」${affectedCount > 0 ? `（已自 ${affectedCount} 部影片移除）` : ''}`);
  }

  function renderModalTagPool() {
    if (!DOM.videoFormTagsPool) return;
    const allTags = getAllVideoTags().filter(t => t !== '全部');
    DOM.videoFormTagsPool.innerHTML = allTags.map(tag => {
      const isSelected = _activeFormSelectedTags.has(tag);
      return `
        <span class="video-tag-choice ${isSelected ? 'selected' : ''}" data-choice-tag="${escapeHTML(tag)}">
          <span class="video-tag-choice-label" data-action="toggle">
            ${isSelected ? '✔ ' : '＋ '}${escapeHTML(tag)}
          </span>
          <span class="video-tag-choice-actions">
            <button type="button" class="btn-tag-edit" data-action="edit" data-tag="${escapeHTML(tag)}" title="重新命名標籤">✏️</button>
            <button type="button" class="btn-tag-del" data-action="del" data-tag="${escapeHTML(tag)}" title="刪除標籤">✕</button>
          </span>
        </span>
      `;
    }).join('');

    DOM.videoFormTagsPool.querySelectorAll('.video-tag-choice').forEach(choice => {
      const tag = choice.getAttribute('data-choice-tag');
      const toggleLabel = choice.querySelector('[data-action="toggle"]');
      const btnEdit = choice.querySelector('[data-action="edit"]');
      const btnDel = choice.querySelector('[data-action="del"]');

      if (toggleLabel) {
        toggleLabel.addEventListener('click', () => {
          if (_activeFormSelectedTags.has(tag)) {
            _activeFormSelectedTags.delete(tag);
          } else {
            _activeFormSelectedTags.add(tag);
          }
          renderModalTagPool();
        });
      }

      if (btnEdit) {
        btnEdit.addEventListener('click', (e) => {
          e.stopPropagation();
          const newName = prompt(`請輸入標籤「${tag}」的新名稱：`, tag);
          if (newName && newName.trim() && newName.trim() !== tag) {
            renameVideoTag(tag, newName.trim());
          }
        });
      }

      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteVideoTag(tag);
        });
      }
    });
  }

  // ─── 免金鑰 Google 翻譯為繁體中文 (支援多國語言與簡轉繁) ──────────────
  async function translateToTraditionalChinese(text) {
    if (!text || typeof text !== 'string') return text;
    const trimmed = text.trim();
    if (!trimmed) return trimmed;

    // 1. 優先使用 Google Chrome 擴充專用端點 (支援 CORS、帶有 #shorts 多重井字標籤不觸發 WAF 阻擋)
    const chromeApiUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=zh-TW&q=${encodeURIComponent(trimmed)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const resp = await fetch(chromeApiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data = await resp.json();
        // Chrome 端點格式為 [["譯文", "原始語系"]] 或 ["譯文"]
        if (Array.isArray(data) && data.length > 0) {
          if (Array.isArray(data[0]) && data[0][0]) {
            return data[0][0];
          }
          if (typeof data[0] === 'string') {
            return data[0];
          }
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[Translate] Chrome endpoint failed, trying fallback:', err);
    }

    // 2. 備援端點 (gtx)
    const fallbackUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-TW&dt=t&q=${encodeURIComponent(trimmed)}`;
    const fbController = new AbortController();
    const fbTimeoutId = setTimeout(() => fbController.abort(), 4000);

    try {
      const resp = await fetch(fallbackUrl, { signal: fbController.signal });
      clearTimeout(fbTimeoutId);
      if (!resp.ok) return trimmed;
      const data = await resp.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => item[0]).filter(Boolean).join('');
        return translated || trimmed;
      }
      return trimmed;
    } catch (err) {
      clearTimeout(fbTimeoutId);
      console.warn('[Translate] All translation endpoints failed, fallback to original:', err);
      return trimmed;
    }
  }

  // ─── YouTube 資訊自動擷取與雙語快取 ───────────────────────────────
  let _videoOriginalTitle = '';
  let _videoTranslatedTitle = '';
  let _isShowingOriginalTitle = false;

  async function fetchYouTubeVideoDetails(videoIdOrUrl) {
    const videoId = parseYouTubeId(videoIdOrUrl);
    if (!videoId) return null;

    const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const apiUrl = `https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const resp = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data && data.title) {
        return {
          title: data.title || '',
          author: data.author_name || '',
          videoId: videoId
        };
      }
      return null;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('[Video AutoFetch] Failed to fetch oEmbed details:', err);
      return null;
    }
  }

  async function handleAutoFetchVideoInfo(isManualClick = false) {
    if (!DOM.videoFormUrl) return;
    const rawVal = DOM.videoFormUrl.value.trim();
    if (!rawVal) {
      if (isManualClick) {
        showCsToast('請先輸入 YouTube 網址或影片 ID', 'info');
      }
      return;
    }

    const videoId = parseYouTubeId(rawVal);
    if (!videoId) {
      if (isManualClick) {
        showCsToast('⚠️ 無法解析有效 YouTube 影片 ID', 'error');
      }
      return;
    }

    const fetchBtn = DOM.btnAutoFetchVideoInfo;
    if (fetchBtn) {
      fetchBtn.classList.add('is-loading');
      fetchBtn.disabled = true;
    }

    try {
      const info = await fetchYouTubeVideoDetails(videoId);
      if (info && info.title) {
        const rawTitle = info.title;
        // 自動翻譯為繁體中文
        const zhTitle = await translateToTraditionalChinese(rawTitle);

        _videoOriginalTitle = rawTitle;
        _videoTranslatedTitle = zhTitle;
        _isShowingOriginalTitle = false;

        // 若翻譯與原文有差異，顯示切換原文/繁中按鈕
        if (DOM.btnToggleTitleLang && _videoOriginalTitle && _videoTranslatedTitle && _videoOriginalTitle !== _videoTranslatedTitle) {
          DOM.btnToggleTitleLang.classList.remove('hidden');
          if (DOM.toggleLangText) DOM.toggleLangText.textContent = '原文';
        } else if (DOM.btnToggleTitleLang) {
          DOM.btnToggleTitleLang.classList.add('hidden');
        }

        let titleUpdated = false;
        let authorUpdated = false;
        const titleToApply = _videoTranslatedTitle || _videoOriginalTitle;

        // 手動點擊強制覆蓋；失焦自動帶入僅在欄位為空時填入
        if (isManualClick || !DOM.videoFormTitle.value.trim()) {
          DOM.videoFormTitle.value = titleToApply;
          titleUpdated = true;
        }

        if (info.author && (isManualClick || !DOM.videoFormAuthor.value.trim())) {
          DOM.videoFormAuthor.value = info.author;
          authorUpdated = true;
        }

        // 柔和高亮視覺回饋
        if (titleUpdated && DOM.videoFormTitle) {
          DOM.videoFormTitle.classList.remove('field-auto-highlight');
          void DOM.videoFormTitle.offsetWidth; // 觸發重繪 (reflow)
          DOM.videoFormTitle.classList.add('field-auto-highlight');
          setTimeout(() => DOM.videoFormTitle && DOM.videoFormTitle.classList.remove('field-auto-highlight'), 1300);
        }

        if (authorUpdated && DOM.videoFormAuthor) {
          DOM.videoFormAuthor.classList.remove('field-auto-highlight');
          void DOM.videoFormAuthor.offsetWidth;
          DOM.videoFormAuthor.classList.add('field-auto-highlight');
          setTimeout(() => DOM.videoFormAuthor && DOM.videoFormAuthor.classList.remove('field-auto-highlight'), 1300);
        }

        if (isManualClick) {
          const hasTranslation = _videoOriginalTitle !== _videoTranslatedTitle;
          showCsToast(hasTranslation ? '✅ 已自動帶入繁體中文標題' : '✅ 已自動帶入影片資訊');
        }
      } else {
        if (isManualClick) {
          showCsToast('⚠️ 無法自動取得影片資訊，請手動填寫', 'error');
        }
      }
    } catch (err) {
      if (isManualClick) {
        showCsToast('⚠️ 取得影片資訊失敗，請手動填寫', 'error');
      }
    } finally {
      if (fetchBtn) {
        fetchBtn.classList.remove('is-loading');
        fetchBtn.disabled = false;
      }
    }
  }

  function initVideoEvents() {
    if (DOM.btnAddVideoBtn) {
      DOM.btnAddVideoBtn.addEventListener('click', () => openVideoModal(null));
    }
    if (DOM.videoModalCloseBtn) {
      DOM.videoModalCloseBtn.addEventListener('click', closeVideoModal);
    }
    if (DOM.videoModalBackdrop) {
      DOM.videoModalBackdrop.addEventListener('click', closeVideoModal);
    }
    if (DOM.btnVideoCancel) {
      DOM.btnVideoCancel.addEventListener('click', closeVideoModal);
    }

    // 自動帶入影片資訊 (加入 300ms 防抖去重，避免手機貼上與失焦連續重複觸發造成閃爍)
    let _autoFetchDebounceTimer = null;
    function triggerDebouncedAutoFetch() {
      clearTimeout(_autoFetchDebounceTimer);
      _autoFetchDebounceTimer = setTimeout(() => {
        if (DOM.videoFormUrl && DOM.videoFormUrl.value.trim()) {
          handleAutoFetchVideoInfo(false);
        }
      }, 300);
    }

    if (DOM.btnAutoFetchVideoInfo) {
      DOM.btnAutoFetchVideoInfo.addEventListener('click', () => {
        clearTimeout(_autoFetchDebounceTimer);
        handleAutoFetchVideoInfo(true);
      });
    }
    if (DOM.videoFormUrl) {
      DOM.videoFormUrl.addEventListener('blur', triggerDebouncedAutoFetch);
      DOM.videoFormUrl.addEventListener('paste', triggerDebouncedAutoFetch);
    }

    // 標題語言切換（繁中譯文 / 原始標題）
    if (DOM.btnToggleTitleLang) {
      DOM.btnToggleTitleLang.addEventListener('click', () => {
        if (!DOM.videoFormTitle) return;
        if (!_videoOriginalTitle || !_videoTranslatedTitle) return;

        if (!_isShowingOriginalTitle) {
          DOM.videoFormTitle.value = _videoOriginalTitle;
          _isShowingOriginalTitle = true;
          if (DOM.toggleLangText) DOM.toggleLangText.textContent = '繁中';
          showCsToast('已切換為原始標題', 'info');
        } else {
          DOM.videoFormTitle.value = _videoTranslatedTitle;
          _isShowingOriginalTitle = false;
          if (DOM.toggleLangText) DOM.toggleLangText.textContent = '原文';
          showCsToast('已切換為繁體中文譯文', 'info');
        }

        DOM.videoFormTitle.classList.remove('field-auto-highlight');
        void DOM.videoFormTitle.offsetWidth;
        DOM.videoFormTitle.classList.add('field-auto-highlight');
        setTimeout(() => DOM.videoFormTitle && DOM.videoFormTitle.classList.remove('field-auto-highlight'), 1000);
      });
    }

    // 加入新標籤
    const handleAddNewTag = () => {
      if (!DOM.videoFormNewTagInput) return;
      const newTag = DOM.videoFormNewTagInput.value.trim();
      if (!newTag) return;
      if (newTag === '全部') {
        alert('「全部」為系統保留標籤名稱，請使用其他名稱！');
        return;
      }
      // 若曾被刪除過，從 deletedVideoTags 移除（解除黑名單）
      if (Array.isArray(state.deletedVideoTags) && state.deletedVideoTags.includes(newTag)) {
        state.deletedVideoTags = state.deletedVideoTags.filter(t => t !== newTag);
        saveProgress(STORAGE_KEY_DELETED_VIDEO_TAGS, state.deletedVideoTags);
      }
      if (!state.customVideoTags.includes(newTag)) {
        state.customVideoTags.push(newTag);
      }
      _activeFormSelectedTags.add(newTag);
      DOM.videoFormNewTagInput.value = '';
      renderModalTagPool();
      saveCustomVideosAndSync();
    };

    if (DOM.btnVideoAddTag) {
      DOM.btnVideoAddTag.addEventListener('click', handleAddNewTag);
    }
    if (DOM.videoFormNewTagInput) {
      DOM.videoFormNewTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddNewTag();
        }
      });
    }

    // 複製雲端代碼
    if (DOM.btnCopyCloudCode && DOM.videoCurrentCloudCode) {
      DOM.btnCopyCloudCode.addEventListener('click', () => {
        const code = DOM.videoCurrentCloudCode.textContent.trim();
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            const originalText = DOM.btnCopyCloudCode.textContent;
            DOM.btnCopyCloudCode.textContent = '已複製！';
            setTimeout(() => {
              DOM.btnCopyCloudCode.textContent = originalText;
            }, 1800);
          }).catch(err => {
            alert('複製失敗，代碼為：' + code);
          });
        }
      });
    }

    // 刪除參考影片
    if (DOM.btnVideoDelete) {
      DOM.btnVideoDelete.addEventListener('click', () => {
        const idToDelete = DOM.videoFormId.value;
        if (!idToDelete) return;
        if (confirm('確定要刪除這部參考影片嗎？')) {
          state.customVideos = state.customVideos.filter(v => v.id !== idToDelete);
          if (!Array.isArray(state.deletedVideoIds)) {
            state.deletedVideoIds = [];
          }
          if (!state.deletedVideoIds.includes(idToDelete)) {
            state.deletedVideoIds.push(idToDelete);
          }
          if (state.currentVideoId === idToDelete) {
            state.currentVideoId = null;
            try { localStorage.removeItem(STORAGE_KEY_ACTIVE_VIDEO); } catch (e) {}
          }
          if (state.videoProgress && state.videoProgress[idToDelete]) {
            delete state.videoProgress[idToDelete];
            saveVideoProgressAndSync();
          }
          saveCustomVideosAndSync();
          closeVideoModal();
          renderVideoSection();
        }
      });
    }

    // 儲存影片（表單提交）
    if (DOM.videoForm) {
      DOM.videoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlInput = DOM.videoFormUrl.value.trim();
        const titleInput = DOM.videoFormTitle.value.trim();
        if (!urlInput || !titleInput) {
          alert('請填寫影片網址與標題！');
          return;
        }

        const videoId = parseYouTubeId(urlInput);
        if (!videoId) {
          alert('無法解析有效的 YouTube 影片 ID，請檢查網址！');
          return;
        }

        const editId = DOM.videoFormId.value;
        const tags = Array.from(_activeFormSelectedTags).filter(t => t !== '我的自訂');

        const videoData = {
          id: editId || 'video_custom_' + Date.now(),
          videoId: videoId,
          title: titleInput,
          author: (DOM.videoFormAuthor && DOM.videoFormAuthor.value.trim()) || '精選創作者',
          url: urlInput.startsWith('http') ? urlInput : `https://www.youtube.com/watch?v=${videoId}`,
          tags: tags,
          note: (DOM.videoFormNote && DOM.videoFormNote.value.trim()) || '',
          cloudCode: (DOM.videoFormCloudCode && DOM.videoFormCloudCode.value.trim()) || '',
          isDefault: false,
          updatedAt: new Date().toISOString()
        };

        // 若該影片曾存在於已刪除黑名單中，自動解禁
        if (Array.isArray(state.deletedVideoIds)) {
          state.deletedVideoIds = state.deletedVideoIds.filter(id => id !== videoData.id && id !== editId);
        }

        if (editId) {
          const idx = state.customVideos.findIndex(v => v.id === editId);
          if (idx > -1) {
            state.customVideos[idx] = { ...state.customVideos[idx], ...videoData };
          } else {
            state.customVideos.push(videoData);
          }
        } else {
          videoData.createdAt = new Date().toISOString();
          state.customVideos.unshift(videoData);
        }

        state.currentVideoId = videoData.id;
        saveProgress(STORAGE_KEY_ACTIVE_VIDEO, state.currentVideoId);
        saveCustomVideosAndSync();
        closeVideoModal();
        renderVideoSection();
      });
    }

    // ESC 鍵關閉 Modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && DOM.videoModal && !DOM.videoModal.classList.contains('hidden')) {
        closeVideoModal();
      }
    });
  }

  // 暴露參考影片管理器 API
  window.PokopiaVideoManager = {
    getAllVideos,
    getAllVideoTags,
    renderVideoSection,
    openVideoModal,
    closeVideoModal,
    parseYouTubeId,
    formatPlaybackTime,
    recordCurrentVideoProgress,
    restartCurrentVideoFromBeginning,
    getVideoProgress: () => state.videoProgress
  };

  /* ═══════════════════════════════════════════════════════════════════
     3D 角色藍圖館 (3D Character Blueprint Gallery) - 妙蛙種子工作台
     ═══════════════════════════════════════════════════════════════════ */
  const bulbaState = {
    curChar: 'buzz',
    curMode: 'full', // 'full' | 'slice'
    curLayer: 1,
    three: {
      isInit: false,
      scene: null,
      camera: null,
      renderer: null,
      controls: null,
      instancedMesh: null,
      blockDataList: [],
      animFrameId: null
    }
  };

  function switchCharacterBlueprint(char) {
    bulbaState.curChar = char;
    if (char === 'buzz') {
      if (DOM.btnSubBuzz) DOM.btnSubBuzz.classList.add('active');
      if (DOM.btnSubBulba) DOM.btnSubBulba.classList.remove('active');
      if (DOM.paneBuzz) DOM.paneBuzz.classList.remove('hidden');
      if (DOM.paneBulba) DOM.paneBulba.classList.add('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🚀';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>3D</strong> 互動模型檢視';
    } else {
      if (DOM.btnSubBuzz) DOM.btnSubBuzz.classList.remove('active');
      if (DOM.btnSubBulba) DOM.btnSubBulba.classList.add('active');
      if (DOM.paneBuzz) DOM.paneBuzz.classList.add('hidden');
      if (DOM.paneBulba) DOM.paneBulba.classList.remove('hidden');
      if (DOM.catalogBadgeIcon) DOM.catalogBadgeIcon.textContent = '🍃';
      if (DOM.catalogBadgeText) DOM.catalogBadgeText.innerHTML = '<strong>8,415</strong> 顆方塊 ‧ 53 層切片';
      renderBulbaLayer(bulbaState.curLayer);
      setTimeout(initBulbaThreeEngine, 60);
    }
  }

  function switchBulba3DMode(mode) {
    bulbaState.curMode = mode;
    if (DOM.btnBulbaModeFull) {
      DOM.btnBulbaModeFull.classList.toggle('active', mode === 'full');
    }
    if (DOM.btnBulbaModeSlice) {
      DOM.btnBulbaModeSlice.classList.toggle('active', mode === 'slice');
    }
    updateBulba3DSliceFilter();
  }

  function setBulbaLayer(layerIndex) {
    if (typeof BULBASAUR_VOXEL_DATA === 'undefined') return;
    const maxLayer = BULBASAUR_VOXEL_DATA.layers.length;
    const target = Math.max(1, Math.min(maxLayer, layerIndex));
    bulbaState.curLayer = target;
    if (DOM.bulbaLayerSlider) DOM.bulbaLayerSlider.value = target;
    renderBulbaLayer(target);
    if (bulbaState.curMode === 'slice') {
      updateBulba3DSliceFilter();
    }
  }

  // 分析軸向投影的實體段落與中空間隔段落
  function getVoxelAxisSegments(minVal, maxVal, occupiedSet) {
    const segments = [];
    let currentType = occupiedSet.has(minVal) ? 'block' : 'gap';
    let count = 0;
    for (let i = minVal; i <= maxVal; i++) {
      const type = occupiedSet.has(i) ? 'block' : 'gap';
      if (type === currentType) {
        count++;
      } else {
        segments.push({ type: currentType, count });
        currentType = type;
        count = 1;
      }
    }
    segments.push({ type: currentType, count });
    return segments;
  }

  // 渲染頂部水平分段標註線 (純數字，區分實體段與間隔虛線段)
  function renderDimTopSegments(container, segments, cellSize, totalGridWidth) {
    if (!container) return;
    container.innerHTML = '';
    container.style.width = `${totalGridWidth}px`;
    container.style.display = 'flex';
    const frag = document.createDocumentFragment();

    segments.forEach((seg) => {
      const segWidth = seg.count * cellSize + (seg.count - 1);
      const el = document.createElement('div');
      el.className = `dim-seg ${seg.type === 'gap' ? 'dim-seg-gap' : 'dim-seg-block'}`;
      el.style.width = `${segWidth}px`;
      el.innerHTML = `
        <span class="dim-tick"></span>
        <span class="dim-line"></span>
        <span class="dim-num" title="${seg.type === 'gap' ? '間隔 ' + seg.count + ' 格' : '實體 ' + seg.count + ' 格'}">${seg.count}</span>
        <span class="dim-line"></span>
        <span class="dim-tick"></span>
      `;
      frag.appendChild(el);
    });
    container.appendChild(frag);
  }

  // 渲染右側垂直分段標註線 (純數字，區分實體段與間隔虛線段)
  function renderDimRightSegments(container, segments, cellSize, totalGridHeight) {
    if (!container) return;
    container.innerHTML = '';
    container.style.height = `${totalGridHeight}px`;
    container.style.display = 'flex';
    const frag = document.createDocumentFragment();

    segments.forEach((seg) => {
      const segHeight = seg.count * cellSize + (seg.count - 1);
      const el = document.createElement('div');
      el.className = `dim-seg-v ${seg.type === 'gap' ? 'dim-seg-gap' : 'dim-seg-block'}`;
      el.style.height = `${segHeight}px`;
      el.innerHTML = `
        <span class="dim-tick-v"></span>
        <span class="dim-line-v"></span>
        <span class="dim-num-v" title="${seg.type === 'gap' ? '間隔 ' + seg.count + ' 格' : '實體 ' + seg.count + ' 格'}">${seg.count}</span>
        <span class="dim-line-v"></span>
        <span class="dim-tick-v"></span>
      `;
      frag.appendChild(el);
    });
    container.appendChild(frag);
  }

  function renderBulbaLayer(layerIndex) {
    if (typeof BULBASAUR_VOXEL_DATA === 'undefined') return;
    const data = BULBASAUR_VOXEL_DATA;
    const layer = data.layers[layerIndex - 1];
    if (!layer) return;

    if (DOM.bulbaLayerBadge) {
      DOM.bulbaLayerBadge.textContent = `第 ${layerIndex} / ${data.layers.length} 層`;
    }
    const blockCount = layer.blocks.length;
    if (DOM.bulbaLayerBlockCount) {
      DOM.bulbaLayerBlockCount.textContent = `本層 ${blockCount} 顆`;
    }

    // 2D 點陣網格智慧邊界聚焦與工程長寬雙軸尺寸標註 (純數字分段)
    if (DOM.bulbaVoxelGrid) {
      DOM.bulbaVoxelGrid.innerHTML = '';
      if (blockCount === 0) {
        DOM.bulbaVoxelGrid.innerHTML = '<div class="bulba-empty-hint" style="color:#94a3b8;font-size:0.875rem;padding:2rem;">本層無方塊（可跳至下一層）</div>';
        if (DOM.bulbaDimTop) DOM.bulbaDimTop.style.display = 'none';
        if (DOM.bulbaDimRight) DOM.bulbaDimRight.style.display = 'none';
      } else {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        const blockMap = new Map();
        const xOccupied = new Set();
        const zOccupied = new Set();

        layer.blocks.forEach(([x, z, bid]) => {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
          blockMap.set(`${x},${z}`, bid);
          xOccupied.add(x);
          zOccupied.add(z);
        });

        const spanX = maxX - minX + 1;
        const spanZ = maxZ - minZ + 1;

        // 計算 X 軸與 Z 軸的實體與間隔段落 (如左腳 10、中空 15、右腳 11)
        const xSegments = getVoxelAxisSegments(minX, maxX, xOccupied);
        const zSegments = getVoxelAxisSegments(minZ, maxZ, zOccupied);

        // 智能適配：手機版 100% 完美全覽零裁切，桌面版寬高雙約束一屏全覽
        const parent = DOM.bulbaVoxelGrid.closest('.bulba-grid-container') || DOM.bulbaVoxelGrid.parentElement;
        const containerWidth = parent ? (parent.clientWidth || 800) : 800;
        const isMobile = window.innerWidth <= 768;

        let cellSize;
        if (isMobile) {
          // 手機版：扣除容器內距 (約 24px) + 右側長度標註線 (24px) + 網格內邊距 (16px) + (spanX - 1) 間距
          // 確保「網格 + 右側標註線」100% 完整收納於螢幕寬度內，絕不產生橫向捲軸或裁切
          const rightDimReserved = 28;
          const netWidth = containerWidth - 36 - rightDimReserved - (spanX - 1);
          cellSize = Math.max(3, Math.floor(netWidth / spanX));
          cellSize = Math.min(10, cellSize);
        } else {
          // 桌面版：寬高雙向約束，扣除頂部標註 (22px) 與右側標註 (26px)
          const cellByHeight = Math.floor((320 - 24 - (spanZ - 1)) / spanZ);
          const cellByWidth = Math.floor((containerWidth - 60 - 28 - (spanX - 1)) / spanX);
          cellSize = Math.min(cellByHeight, cellByWidth, 12);
          cellSize = Math.max(5, cellSize);
        }
        DOM.bulbaVoxelGrid.style.gap = '1px';
        DOM.bulbaVoxelGrid.style.gridTemplateColumns = `repeat(${spanX}, ${cellSize}px)`;

        // 動態將頂部標註線寬度與側邊長度標註高度，精準對齊網格本體邊緣並注入分段純數字
        const gridTotalWidth = spanX * cellSize + (spanX - 1) + 16;
        const gridTotalHeight = spanZ * cellSize + (spanZ - 1) + 16;
        renderDimTopSegments(DOM.bulbaDimTop, xSegments, cellSize, gridTotalWidth);
        renderDimRightSegments(DOM.bulbaDimRight, zSegments, cellSize, gridTotalHeight);

        const frag = document.createDocumentFragment();
        for (let z = minZ; z <= maxZ; z++) {
          for (let x = minX; x <= maxX; x++) {
            const bid = blockMap.get(`${x},${z}`);
            const cell = document.createElement('div');
            cell.className = 'bulba-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;

            if (bid) {
              const pItem = data.palette[bid] || { name: '方塊', color: '#64a395' };
              cell.style.backgroundColor = pItem.color;
              cell.style.border = '1px solid rgba(15, 23, 42, 0.65)';
              cell.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.35)';
              cell.dataset.x = x;
              cell.dataset.z = z;
              cell.dataset.name = pItem.name;
              cell.dataset.color = pItem.color;

              cell.addEventListener('mouseenter', (e) => {
                if (!DOM.bulbaHoverTooltip) return;
                DOM.bulbaHoverTooltip.classList.remove('hidden');
                if (DOM.bulbaTooltipColor) DOM.bulbaTooltipColor.style.backgroundColor = pItem.color;
                if (DOM.bulbaTooltipText) {
                  DOM.bulbaTooltipText.textContent = `${pItem.name} (X: ${x}, Z: ${z})`;
                }
              });
              cell.addEventListener('mouseleave', () => {
                if (DOM.bulbaHoverTooltip) DOM.bulbaHoverTooltip.classList.add('hidden');
              });
            } else {
              // 清新草系工程藍圖座標格線（不再黑死一團）
              cell.style.backgroundColor = 'rgba(52, 211, 153, 0.04)';
              cell.style.border = '1px solid rgba(52, 211, 153, 0.1)';
            }
            frag.appendChild(cell);
          }
        }
        DOM.bulbaVoxelGrid.appendChild(frag);
      }
    }

    // 本層材料清單
    if (DOM.bulbaMatList) {
      DOM.bulbaMatList.innerHTML = '';
      const matEntries = Object.entries(layer.materials);
      if (DOM.bulbaMatTypesCount) {
        DOM.bulbaMatTypesCount.textContent = `${matEntries.length} 種建材`;
      }
      matEntries.sort((a, b) => b[1] - a[1]);
      matEntries.forEach(([bid, count]) => {
        const pItem = data.palette[bid] || { name: '方塊', color: '#64a395' };
        const item = document.createElement('div');
        item.className = 'bulba-mat-item';
        item.innerHTML = `
          <span class="bulba-mat-chip" style="background-color: ${pItem.color};"></span>
          <span class="bulba-mat-name" title="${pItem.name}">${pItem.name}</span>
          <span class="bulba-mat-count">×${count}</span>
        `;
        DOM.bulbaMatList.appendChild(item);
      });
    }
  }

  function initBulbaThreeEngine() {
    if (typeof THREE === 'undefined' || typeof BULBASAUR_VOXEL_DATA === 'undefined') return;
    if (!DOM.bulba3dCanvas) return;

    const wrap = DOM.bulba3dCanvas.parentElement;
    if (!wrap) return;
    const width = wrap.clientWidth || 800;
    const height = wrap.clientHeight || 480;

    const t = bulbaState.three;
    if (t.isInit) {
      t.renderer.setSize(width, height);
      t.camera.aspect = width / height;
      t.camera.updateProjectionMatrix();
      return;
    }

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // 2. Camera (480px 黃金比例舒展視野)
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 1000);
    camera.position.set(56, 42, 68);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: DOM.bulba3dCanvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // 4. Lights (高角度強對比立體光影系統，雕刻方塊階梯明暗)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
    scene.add(ambientLight);
    // 主光：右前方高角度，形成頂面強烈高光與階梯立體陰影
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.05);
    dirLight1.position.set(50, 85, 50);
    scene.add(dirLight1);
    // 側光：左後方草系薄荷微光，形成側面柔和半影
    const dirLight2 = new THREE.DirectionalLight(0x86efac, 0.45);
    dirLight2.position.set(-50, 30, -50);
    scene.add(dirLight2);
    // 仰光：底部微弱環境反光
    const dirLight3 = new THREE.DirectionalLight(0x0f3b38, 0.15);
    dirLight3.position.set(0, -60, 0);
    scene.add(dirLight3);

    // 5. Controls
    let controls = null;
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 0, 0);
      controls.maxDistance = 250;
      controls.minDistance = 15;
    }

    // 動態產生方塊細微深黑外框紋理 (Cel-outline Texture)
    function createVoxelOutlineTexture() {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      // 內部為純白 (WebGL 渲染時頂點顏色與紋理相乘，白色即原色)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 64, 64);
      // 邊緣細小微黑描邊（約 70% 深度黑，既有清晰分界又保留方塊通透感）
      ctx.strokeStyle = 'rgba(25, 25, 25, 0.72)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(1, 1, 62, 62);

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      return texture;
    }

    // 6. Build InstancedMesh (緊密貼合 1.0，細微深黑描邊雕刻方塊輪廓)
    const data = BULBASAUR_VOXEL_DATA;
    const totalCount = data.totalBlocks;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const outlineTexture = createVoxelOutlineTexture();
    const material = new THREE.MeshStandardMaterial({
      map: outlineTexture || null,
      roughness: 0.3,
      metalness: 0.05
    });

    const instancedMesh = new THREE.InstancedMesh(geometry, material, totalCount);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const cx = data.dimensions.width / 2;
    const cy = data.dimensions.height / 2;
    const cz = data.dimensions.length / 2;

    const blockDataList = [];
    let idx = 0;

    data.layers.forEach((layer) => {
      const y = layer.layerIndex - 1;
      layer.blocks.forEach(([x, z, bid]) => {
        dummy.position.set(x - cx, y - cy, z - cz);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(idx, dummy.matrix);
        const pItem = data.palette[bid] || { color: '#64a395' };
        color.set(pItem.color);
        instancedMesh.setColorAt(idx, color);

        blockDataList.push({
          index: idx,
          layerIndex: layer.layerIndex,
          defaultMatrix: dummy.matrix.clone(),
          posX: x - cx,
          posY: y - cy,
          posZ: z - cz
        });
        idx++;
      });
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    scene.add(instancedMesh);

    t.isInit = true;
    t.scene = scene;
    t.camera = camera;
    t.renderer = renderer;
    t.controls = controls;
    t.instancedMesh = instancedMesh;
    t.blockDataList = blockDataList;

    // Animation Loop
    function animate() {
      t.animFrameId = requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // RWD Resize
    window.addEventListener('resize', () => {
      if (!t.isInit || !DOM.bulba3dCanvas) return;
      const curWrap = DOM.bulba3dCanvas.parentElement;
      if (!curWrap) return;
      const nw = curWrap.clientWidth || 500;
      const nh = curWrap.clientHeight || 560;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
  }

  function updateBulba3DSliceFilter() {
    const t = bulbaState.three;
    if (!t.isInit || !t.instancedMesh || !t.blockDataList.length) return;

    const isSlice = bulbaState.curMode === 'slice';
    const curLayer = bulbaState.curLayer;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < t.blockDataList.length; i++) {
      const item = t.blockDataList[i];
      if (!isSlice || item.layerIndex <= curLayer) {
        t.instancedMesh.setMatrixAt(item.index, item.defaultMatrix);
      } else {
        dummy.position.set(item.posX, item.posY, item.posZ);
        dummy.scale.set(0, 0, 0); // 縮至 0 隱藏
        dummy.updateMatrix();
        t.instancedMesh.setMatrixAt(item.index, dummy.matrix);
      }
    }
    t.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  // 暴露妙蛙種子 API
  window.PokopiaBulba = {
    getState: () => bulbaState,
    switchCharacterBlueprint,
    switchBulba3DMode,
    setBulbaLayer,
    renderBulbaLayer,
    initBulbaThreeEngine,
    updateBulba3DSliceFilter
  };

  // 暴露地區地圖 API
  window.PokopiaRegionMap = {
    renderRegionMap,
    getRegionAssignments,
    saveRegionAssignments,
    getPokemonCurrentRegion,
    setPokemonRegion,
    navigateToRegion,
    addPokemonToRegion,
    removePokemonFromRegion,
    openRegionAssignModal,
    closeRegionAssignModal
  };
  window.PokopiaCustomStorage = {
    renderCustomStorage,
    renderCustomBoxesGrid,
    renderCustomTrayItems,
    addItemToBox,
    removeItemFromBox,
    renameBox,
    clearBox,
    deleteBox,
    addNewBox,
    handleReverseSearch,
    setActiveTargetBox,
    moveBox,
    reorderBoxes,
    openCsDrawer,
    closeCsDrawer,
    toggleCsDrawer,
    sortBoxItems,
    getTrayItemOrderMap,
    sortAllCustomBoxes,
    handleTrayItemAdd,
    getActiveTargetBoxId: () => activeDropTargetBoxId,
    getState: () => {
      state.activeDropTargetBoxId = activeDropTargetBoxId;
      return state;
    }
  };

  // Kickoff App on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

