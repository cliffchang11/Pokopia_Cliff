/**
 * Pokopia Recipe Encyclopedia Module (100% Traditional Chinese)
 * Modern clean card grid inspired by gamertw + Dual-layer filter system + Required Specialty badges
 * Interactive touch-friendly ingredient reverse-lookup + Pokemon affinity avatar box popover.
 */
(function() {
  'use strict';

  // State
  const recipeState = {
    category: 'all',          // 'all' | 'salad' | 'bread' | 'burger' | 'soup' | 'smoothie' | 'curry'
    taste: 'all',             // 'all' | '甜甜的' | '酸酸的' | '苦苦的' | '辣辣的' | '澀澀的' | '平淡無奇的'
    selectedIngredient: '',   // Reverse-lookup ingredient filter
    keyword: '',              // Search keyword
    activePopoverId: null     // ID of the recipe whose pokemon popover is open
  };

  // Simplified to Traditional keyword map for inclusive search
  const tradMap = {
    '西红柿': '番茄', '西紅柿': '番茄',
    '马铃薯': '馬鈴薯',
    '小麦': '小麥',
    '叶子': '葉子',
    '苹野果': '蘋野果', '苹果': '蘋野果', '蘋果': '蘋野果',
    '零余果': '零餘果',
    '切块西瓜': '切塊西瓜', '西瓜块': '切塊西瓜', '西瓜塊': '切塊西瓜',
    '平底锅': '平底鍋',
    '锅子': '鍋子', '时髦锅': '時髦鍋', '露营锅': '露營鍋',
    '派对锅': '派對鍋',
    '搅拌机': '食物攪拌機', '食物搅拌机': '食物攪拌機',
    '面包窑': '麵包窯',
    '冲浪': '衝浪',
    '居合斩': '居合斬',
    '碎岩': '碎岩',
    '树叶': '樹葉',
    '水枪': '水槍',
    '滋润': '滋潤'
  };

  const tasteClassMap = {
    '辣辣的': 'taste-spicy',
    '甜甜的': 'taste-sweet',
    '酸酸的': 'taste-sour',
    '苦苦的': 'taste-bitter',
    '澀澀的': 'taste-astringent',
    '平淡無奇的': 'taste-plain',
    '濃郁': 'taste-rich'
  };

  // 專長徽章圖示與樣式對應
  const specialtyConfig = {
    '伐木': { icon: '🪵', label: '伐木', styleClass: 'specialty-wood' },
    '碾壓': { icon: '🪨', label: '碾壓', styleClass: 'specialty-crush' },
    '回收利用': { icon: '♻️', label: '回收利用', styleClass: 'specialty-recycle' },
    '滋潤': { icon: '💧', label: '滋潤', styleClass: 'specialty-water' },
    '點火': { icon: '🔥', label: '點火', styleClass: 'specialty-fire' },
    '爆炸': { icon: '💥', label: '爆炸', styleClass: 'specialty-blast' },
    '發電': { icon: '⚡', label: '發電', styleClass: 'specialty-electric' },
    '開派對': { icon: '🎉', label: '開派對', styleClass: 'specialty-party' }
  };

  function normalizeKeyword(kw) {
    if (!kw) return '';
    let res = kw.trim();
    for (const [s, t] of Object.entries(tradMap)) {
      res = res.split(s).join(t);
    }
    return res.toLowerCase();
  }

  // 品項分類匹配 (100% 嚴格依照 recipe.category 官方分類欄位，徹底排除 name.includes 模糊干擾)
  function matchCategory(recipe, cat) {
    if (cat === 'all') return true;
    const c = recipe.category || '';
    if (cat === 'salad') return c === '沙拉類' || c.includes('沙拉');
    if (cat === 'bread') return c === '麵包類' || c.includes('麵包');
    if (cat === 'burger') return c === '漢堡排類' || c.includes('漢堡');
    if (cat === 'soup') return c === '湯類' || c === '湯品類' || c.includes('湯');
    if (cat === 'smoothie') return c === '冰沙類' || c.includes('冰沙');
    if (cat === 'curry') return c === '咖喱類' || c === '咖哩類' || c.includes('咖哩') || c.includes('咖喱');
    return true;
  }

  // 口味風味匹配
  function matchTaste(recipe, taste) {
    if (taste === 'all') return true;
    if (taste === '平淡無奇的') {
      return recipe.taste === '平淡無奇的' || recipe.taste === '平淡';
    }
    return recipe.taste === taste || (recipe.taste && recipe.taste.includes(taste));
  }

  // 取得過濾後的食譜清單
  function getFilteredRecipes() {
    if (!window.POKOPIA_RECIPES_DB) return [];
    let list = window.POKOPIA_RECIPES_DB;

    // 1. 第一層：品項類別
    if (recipeState.category !== 'all') {
      list = list.filter(r => matchCategory(r, recipeState.category));
    }

    // 2. 第二層：口味風味
    if (recipeState.taste !== 'all') {
      list = list.filter(r => matchTaste(r, recipeState.taste));
    }

    // 3. 食材反查過濾
    if (recipeState.selectedIngredient) {
      const target = recipeState.selectedIngredient.trim();
      list = list.filter(r => r.ingredients.some(ig => ig.name === target || ig.name.includes(target)));
    }

    // 4. 關鍵字過濾
    if (recipeState.keyword) {
      const kw = normalizeKeyword(recipeState.keyword);
      list = list.filter(r => {
        const nameMatch = r.name.toLowerCase().includes(kw);
        const catMatch = r.category && r.category.toLowerCase().includes(kw);
        const facMatch = r.facilityName && r.facilityName.toLowerCase().includes(kw);
        const moveMatch = r.move && r.move.toLowerCase().includes(kw);
        const specMatch = r.specialty && r.specialty.toLowerCase().includes(kw);
        const tasteMatch = r.taste && r.taste.toLowerCase().includes(kw);
        const ingMatch = r.ingredients.some(ig => ig.name.toLowerCase().includes(kw));
        const effectMatch = r.snorlaxEffect && r.snorlaxEffect.toLowerCase().includes(kw);
        return nameMatch || catMatch || facMatch || moveMatch || specMatch || tasteMatch || ingMatch || effectMatch;
      });
    }

    return list;
  }

  // 取得品項顯示名與 CSS class (100% 嚴格以 categoryStr 官方分類為準)
  function getCategoryMeta(categoryStr) {
    const c = categoryStr || '';
    if (c.includes('沙拉')) {
      return { label: '🥗 沙拉', slug: 'salad' };
    }
    if (c.includes('麵包')) {
      return { label: '🍞 麵包', slug: 'bread' };
    }
    if (c.includes('漢堡')) {
      return { label: '🍔 漢堡排', slug: 'burger' };
    }
    if (c.includes('湯')) {
      return { label: '🍲 湯', slug: 'soup' };
    }
    if (c.includes('冰沙')) {
      return { label: '🥤 冰沙', slug: 'smoothie' };
    }
    if (c.includes('咖喱') || c.includes('咖哩')) {
      return { label: '🍛 咖哩', slug: 'curry' };
    }
    return { label: categoryStr || '料理', slug: 'default' };
  }

  // 招式與效果標籤智慧格式化 (精簡用詞、消滅死板模板與冗詞)
  function formatMoveTag(moveStr) {
    if (!moveStr || moveStr.trim() === '') return '<span class="recipe-row-col-empty"></span>';
    const m = moveStr.trim();
    if (m === '開派對') {
      return '<span class="recipe-row-move-tag">開派對</span>';
    }
    if (m.includes('大幅') || m.includes('碎岩（大幅增強）')) {
      return '<span class="recipe-row-move-tag">「碎岩」大幅增強</span>';
    }
    return `<span class="recipe-row-move-tag">「${m}」提升</span>`;
  }

  // 渲染現代清爽卡片清單 (gamertw 風格)
  function renderRecipes() {
    const grid = document.getElementById('recipeCardGrid');
    const emptyState = document.getElementById('recipeEmptyState');
    const notice = document.getElementById('recipeIngredientFilterNotice');
    const activeIngName = document.getElementById('activeIngredientName');

    if (!grid) return;

    // 食材反查專用提示膠囊控制
    if (recipeState.selectedIngredient && recipeState.selectedIngredient.trim() !== '') {
      if (notice) notice.classList.remove('hidden');
      if (activeIngName) activeIngName.textContent = recipeState.selectedIngredient.trim();
    } else {
      if (notice) notice.classList.add('hidden');
      if (activeIngName) activeIngName.textContent = '';
    }

    const recipes = getFilteredRecipes();

    if (recipes.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = recipes.map(r => {
      const isPopoverOpen = recipeState.activePopoverId === r.id;
      const hasLikedPoke = r.likedPokemon && r.likedPokemon.length > 0;
      const tasteClass = tasteClassMap[r.taste] || 'taste-plain';
      const catMeta = getCategoryMeta(r.category, r.name);

      // 食材膠囊 HTML (乾淨無 emoji，點擊可即時反查)
      const ingredientsHtml = r.ingredients.map(ig => {
        const isSelected = recipeState.selectedIngredient === ig.name;
        const iconHtml = ig.icon 
          ? `<img class="recipe-ing-chip-icon" src="${ig.icon}" alt="${ig.name}" loading="lazy" onerror="this.style.display='none'">` 
          : '';
        return `
          <button type="button" class="recipe-ing-chip ${isSelected ? 'selected' : ''}" data-ingredient="${ig.name}" title="點擊即時反查所有使用「${ig.name}」的食譜" aria-label="反查食材：${ig.name}">
            ${iconHtml}
            <span class="recipe-ing-chip-name">${ig.name}</span>
            <span class="recipe-ing-chip-count">×${ig.count}</span>
          </button>
        `;
      }).join('');

      // 工作專長需求徽章 (放在食材最後方，格式 100% 與寶可夢圖鑑 .tag-specialty 一致，點擊開啟介紹面板)
      let specialtyBadgeHtml = '';
      if (r.specialty && r.specialty.trim() !== '') {
        const specName = r.specialty.trim();
        const icon = (window.SPECIALTY_ICONS && window.SPECIALTY_ICONS[specName]) || (specialtyConfig[specName] && specialtyConfig[specName].icon) || '✨';
        specialtyBadgeHtml = `
          <button type="button" class="tag-specialty recipe-spec-tag" data-spec="${specName}" data-recipe-id="${r.id}" title="點擊檢視需要「${specName}」的寶可夢及食譜詳情" aria-label="工作專長：${specName}">
            ${icon} ${specName}
          </button>
        `;
      }

      return `
        <div class="recipe-row" data-recipe-id="${r.id}" data-recipe-name="${r.name}" data-category="${catMeta.slug}">
          <!-- 1. 左區：定寬料理名片（點擊開啟專屬詳情介紹） -->
          <div class="recipe-row-identity" data-recipe-detail="${r.id}" title="點擊查看「${r.name}」專屬介紹面板">
            <img class="recipe-row-avatar-img" src="${r.icon || r.onlineIcon}" alt="${r.name}" loading="lazy" onerror="this.onerror=null; if('${r.onlineIcon}' && this.src !== '${r.onlineIcon}') { this.src='${r.onlineIcon}'; } else { this.src='assets/item_sprites/simple-salad.png'; }">
            <div class="recipe-row-identity-text">
              <h3 class="recipe-row-title">${r.name}</h3>
              <div class="recipe-row-subtitle">
                <span class="recipe-badge recipe-badge-cat cat-${catMeta.slug}">${catMeta.label}</span>
                <span class="recipe-badge recipe-badge-taste ${tasteClass}">${r.taste || '美味'}</span>
              </div>
            </div>
          </div>

          <!-- 2. 中區：所需食材籤（第一行） ＋ 所需專長徽章（一律第二行） -->
          <div class="recipe-row-ingredients">
            <div class="recipe-row-ing-list">
              ${ingredientsHtml}
            </div>
            ${specialtyBadgeHtml ? `<div class="recipe-row-spec-line">${specialtyBadgeHtml}</div>` : ''}
          </div>

          <!-- 3. 右區：雙行效果（垂直起跑線對齊，文字靠左） -->
          <div class="recipe-row-effects-section">
            <div class="recipe-row-col-move">
              ${formatMoveTag(r.move)}
            </div>
            <div class="recipe-row-col-snorlax">
              <span class="recipe-row-snorlax-text" title="${r.snorlaxEffect || ''}">🍃 ${r.snorlaxEffect || '可以和寶可夢變得比較要好'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 開啟 gamertw 風格的專屬食譜詳情介紹面板 (Modal)
  function openRecipeDetailModal(recipeId) {
    if (!window.POKOPIA_RECIPES_DB) return;
    const recipe = window.POKOPIA_RECIPES_DB.find(x => x.id === recipeId);
    if (!recipe) return;

    const modal = document.getElementById('recipeDetailModal');
    const avatar = document.getElementById('recipeModalAvatar');
    const title = document.getElementById('recipeModalTitle');
    const badges = document.getElementById('recipeModalBadges');
    const body = document.getElementById('recipeModalBody');

    if (!modal || !body) return;

    const catMeta = getCategoryMeta(recipe.category, recipe.name);
    const tasteClass = tasteClassMap[recipe.taste] || 'taste-plain';

    // 料理名與大圖
    if (avatar) {
      avatar.src = recipe.icon || recipe.onlineIcon || 'assets/item_sprites/simple-salad.png';
      avatar.alt = recipe.name;
    }
    if (title) {
      title.textContent = recipe.name;
    }
    if (badges) {
      const facilityHtml = recipe.facilityName ? `<span class="recipe-modal-tag tag-facility">🔪 ${recipe.facilityName}</span>` : '';
      badges.innerHTML = `
        <span class="recipe-badge recipe-badge-cat cat-${catMeta.slug}">${catMeta.label}</span>
        <span class="recipe-badge recipe-badge-taste ${tasteClass}">${recipe.taste || '美味'}</span>
        ${facilityHtml}
      `;
    }

    // 1. 食材清單卡片
    const ingredientsHtml = recipe.ingredients.map(ig => {
      const iconHtml = ig.icon 
        ? `<img class="recipe-modal-ing-img" src="${ig.icon}" alt="${ig.name}" onerror="this.style.display='none'">` 
        : '';
      return `
        <div class="recipe-modal-ing-item">
          ${iconHtml}
          <div class="recipe-modal-ing-info">
            <span class="recipe-modal-ing-name">${ig.name}</span>
            <span class="recipe-modal-ing-count">× ${ig.count}</span>
          </div>
        </div>
      `;
    }).join('');

    // 2. 會「該專長」的寶可夢清單 (例如：會「伐木」的寶可夢，共 32 隻)
    let specPokemons = [];
    const specName = (recipe.specialty || '').trim();
    if (specName && window.POKOPIA_DATA && Array.isArray(window.POKOPIA_DATA.pokemons)) {
      specPokemons = window.POKOPIA_DATA.pokemons.filter(p => 
        (p.specialties && p.specialties.includes(specName)) ||
        (p.abilities && p.abilities.includes(specName))
      );
    }

    let specSectionHtml = '';
    if (specName) {
      const specIcon = (window.SPECIALTY_ICONS && window.SPECIALTY_ICONS[specName]) || (specialtyConfig[specName] && specialtyConfig[specName].icon) || '✨';
      const specPkmGridHtml = specPokemons.length > 0
        ? specPokemons.map(p => `
            <div class="recipe-modal-pkm-card" data-pkm-id="${p.id}" title="${p.number} ${p.name}">
              <img class="recipe-modal-pkm-sprite" src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'44\\' height=\\'44\\' viewBox=\\'0 0 24 24\\' fill=\\'%2394a3b8\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
              <span class="recipe-modal-pkm-num">${p.number.replace('No. ', '#')}</span>
              <span class="recipe-modal-pkm-name">${p.name}</span>
            </div>
          `).join('')
        : '<div class="recipe-modal-empty-msg">暫無資料</div>';

      specSectionHtml = `
        <div class="recipe-modal-section" id="modalSpecialtySection">
          <div class="recipe-modal-section-header">
            <h4 class="recipe-modal-section-title">
              <span class="tag-specialty" data-spec="${specName}">${specIcon} ${specName}</span>
              會「${specName}」的寶可夢 (${specPokemons.length})
            </h4>
            <span class="recipe-modal-section-desc">這道菜需要有「${specName}」專長的寶可夢才能製作，共 ${specPokemons.length} 隻寶可夢具備此專長。</span>
          </div>
          <div class="recipe-modal-pkm-grid">
            ${specPkmGridHtml}
          </div>
        </div>
      `;
    }

    // 3. 喜歡這道菜的寶可夢清單 (例如：喜好為「酸酸的」的寶可夢，共 72 隻)
    let likedPokemons = recipe.likedPokemon || [];
    if ((!likedPokemons || likedPokemons.length === 0) && recipe.taste && window.POKOPIA_DATA && Array.isArray(window.POKOPIA_DATA.pokemons)) {
      likedPokemons = window.POKOPIA_DATA.pokemons.filter(p => 
        p.favorites && p.favorites.includes(recipe.taste)
      );
    }

    const likedPkmGridHtml = likedPokemons.length > 0
      ? likedPokemons.map(p => `
          <div class="recipe-modal-pkm-card" data-pkm-id="${p.id}" title="${p.number} ${p.name}">
            <img class="recipe-modal-pkm-sprite" src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'44\\' height=\\'44\\' viewBox=\\'0 0 24 24\\' fill=\\'%2394a3b8\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
            <span class="recipe-modal-pkm-num">${(p.number || '').replace('No. ', '#')}</span>
            <span class="recipe-modal-pkm-name">${p.name}</span>
          </div>
        `).join('')
      : '<div class="recipe-modal-empty-msg">暫無資料</div>';

    const likedSectionHtml = `
      <div class="recipe-modal-section">
        <div class="recipe-modal-section-header">
          <h4 class="recipe-modal-section-title">❤️ 喜歡這道菜的寶可夢 (${likedPokemons.length})</h4>
          <span class="recipe-modal-section-desc">喜好風味為「${recipe.taste || '美味'}」的寶可夢夥伴。</span>
        </div>
        <div class="recipe-modal-pkm-grid">
          ${likedPkmGridHtml}
        </div>
      </div>
    `;

    // 組裝 Modal 內部結構
    body.innerHTML = `
      <!-- 料理配方與效果 -->
      <div class="recipe-modal-overview-grid">
        <!-- 所需材料 -->
        <div class="recipe-modal-card">
          <div class="recipe-modal-card-title">📦 所需食材材料</div>
          <div class="recipe-modal-ing-grid">
            ${ingredientsHtml}
          </div>
        </div>

        <!-- 供奉效果與招式強化 -->
        <div class="recipe-modal-card">
          <div class="recipe-modal-card-title">✨ 特殊效果與效益</div>
          <div class="recipe-modal-effect-list">
            <div class="recipe-modal-effect-row">
              <span class="recipe-modal-effect-label">招式強化</span>
              <span class="recipe-modal-effect-val">${formatMoveTag(recipe.move)}</span>
            </div>
            <div class="recipe-modal-effect-row">
              <span class="recipe-modal-effect-label">供奉效果</span>
              <span class="recipe-modal-effect-val effect-snorlax">🍃 ${recipe.snorlaxEffect || '可以和寶可夢變得比較要好'}</span>
            </div>
            <div class="recipe-modal-effect-row">
              <span class="recipe-modal-effect-label">精力獲得</span>
              <span class="recipe-modal-effect-val">⚡ ${recipe.snorlaxExp || '100／150'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 會該專長的寶可夢 -->
      ${specSectionHtml}

      <!-- 喜愛該菜的寶可夢 -->
      ${likedSectionHtml}
    `;

    // 點擊寶可夢卡片開啟該寶可夢詳情彈窗
    body.querySelectorAll('.recipe-modal-pkm-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const pId = card.dataset.pkmId;
        if (pId && typeof window.openPkmDetailModal === 'function') {
          window.openPkmDetailModal(pId);
        }
      });
    });

    // 顯示 Modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // 關閉食譜詳情介紹面板
  function closeRecipeDetailModal() {
    const modal = document.getElementById('recipeDetailModal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  // 防重複初始化守衛
  let isEventsInited = false;

  // 設置雙層篩選與卡片互動事件
  function initRecipeEvents() {
    if (isEventsInited) return;
    isEventsInited = true;

    // 1. 第一層：品項類別點擊 (支援 Toggle 再次點擊取消)
    const catContainer = document.getElementById('recipeCategoryFilters');
    if (catContainer) {
      catContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recipe-filter-btn');
        if (!btn) return;
        const cat = btn.getAttribute('data-category');
        if (!cat) return;

        // 若點擊當前已啟用的按鈕（且非 "all"），則切換為取消 (Toggle Off 回退至 "all")
        if (cat !== 'all' && recipeState.category === cat) {
          recipeState.category = 'all';
          catContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
          const allBtn = catContainer.querySelector('[data-category="all"]');
          if (allBtn) allBtn.classList.add('active');
        } else {
          catContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          recipeState.category = cat;
        }

        recipeState.activePopoverId = null;
        renderRecipes();
      });
    }

    // 2. 第二層：口味風味點擊 (支援 Toggle 再次點擊取消)
    const tasteContainer = document.getElementById('recipeTasteFilters');
    if (tasteContainer) {
      tasteContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recipe-filter-btn');
        if (!btn) return;
        const taste = btn.getAttribute('data-taste');
        if (!taste) return;

        // 若點擊當前已啟用的按鈕（且非 "all"），則切換為取消 (Toggle Off 回退至 "all")
        if (taste !== 'all' && recipeState.taste === taste) {
          recipeState.taste = 'all';
          tasteContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
          const allBtn = tasteContainer.querySelector('[data-taste="all"]');
          if (allBtn) allBtn.classList.add('active');
        } else {
          tasteContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          recipeState.taste = taste;
        }

        recipeState.activePopoverId = null;
        renderRecipes();
      });
    }

    // 3. 清除食材反查按鈕
    const btnClearIng = document.getElementById('btnClearIngredientFilter');
    if (btnClearIng) {
      btnClearIng.addEventListener('click', () => {
        recipeState.selectedIngredient = '';
        renderRecipes();
      });
    }

    // 4. 卡片容器代理事件 (食材反查、專長點擊開啟詳情、料理標題開啟詳情、喜愛寶可夢彈層)
    const grid = document.getElementById('recipeCardGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        // A. 專長徽章點擊 (開啟專屬食譜詳情面板)
        const specTag = e.target.closest('.recipe-spec-tag');
        if (specTag) {
          e.stopPropagation();
          const recipeId = specTag.getAttribute('data-recipe-id');
          if (recipeId) {
            openRecipeDetailModal(recipeId);
            return;
          }
        }

        // B. 食材膠囊點擊 (反查)
        const ingChip = e.target.closest('.recipe-ing-chip');
        if (ingChip) {
          e.stopPropagation();
          const ingName = ingChip.getAttribute('data-ingredient');
          if (ingName && ingName !== '任意食材') {
            if (recipeState.selectedIngredient === ingName) {
              recipeState.selectedIngredient = '';
            } else {
              recipeState.selectedIngredient = ingName;
            }
            recipeState.activePopoverId = null;
            renderRecipes();
            return;
          }
        }

        // C. 點擊料理名片/頭像 (開啟專屬食譜詳情面板)
        const identityCard = e.target.closest('.recipe-row-identity');
        if (identityCard) {
          const recipeId = identityCard.getAttribute('data-recipe-detail');
          if (recipeId) {
            openRecipeDetailModal(recipeId);
            return;
          }
        }
      });
    }

    // 5. 食譜詳情 Modal 關閉事件綁定
    const modal = document.getElementById('recipeDetailModal');
    const modalCloseBtn = document.getElementById('recipeModalCloseBtn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeRecipeDetailModal);
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeRecipeDetailModal();
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeRecipeDetailModal();
      }
    });
  }

  // 公開外部 API
  window.RecipeModule = {
    init: function() {
      initRecipeEvents();
    },
    render: function() {
      renderRecipes();
    },
    openDetail: function(id) {
      openRecipeDetailModal(id);
    },
    setKeyword: function(kw) {
      recipeState.keyword = kw || '';
      recipeState.activePopoverId = null;
      renderRecipes();
    },
    resetFilters: function() {
      recipeState.category = 'all';
      recipeState.taste = 'all';
      recipeState.selectedIngredient = '';
      recipeState.keyword = '';
      recipeState.activePopoverId = null;

      // 重設按鈕 active 樣式
      const catContainer = document.getElementById('recipeCategoryFilters');
      if (catContainer) {
        catContainer.querySelectorAll('.recipe-filter-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-category') === 'all');
        });
      }
      const tasteContainer = document.getElementById('recipeTasteFilters');
      if (tasteContainer) {
        tasteContainer.querySelectorAll('.recipe-filter-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-taste') === 'all');
        });
      }

      renderRecipes();
    },
    scrollToRecipe: function(recipeName) {
      if (!recipeName) return;
      // 1. 重設篩選為全部，確保目標食譜可見
      this.resetFilters();

      // 2. 定位到目標卡片並閃爍呼吸光暈
      setTimeout(() => {
        const cards = document.querySelectorAll('.recipe-row, .recipe-card');
        let targetCard = null;
        for (const card of cards) {
          const name = card.getAttribute('data-recipe-name');
          const id = card.getAttribute('data-recipe-id');
          if (name === recipeName || id === recipeName || (name && name.includes(recipeName)) || (recipeName && recipeName.includes(name))) {
            targetCard = card;
            break;
          }
        }
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.classList.remove('recipe-card-highlight', 'recipe-row-highlight');
          void targetCard.offsetWidth; // 重繪動畫
          targetCard.classList.add('recipe-row-highlight', 'recipe-card-highlight');
          setTimeout(() => {
            targetCard.classList.remove('recipe-card-highlight', 'recipe-row-highlight');
          }, 2500);
        }
      }, 100);
    },
    filterByIngredient: function(ingredientName) {
      if (!ingredientName) return;
      // 1. 重設兩層分類為全部，關鍵字清空，激活該食材反查
      recipeState.category = 'all';
      recipeState.taste = 'all';
      recipeState.selectedIngredient = ingredientName.trim();
      recipeState.keyword = '';
      recipeState.activePopoverId = null;

      const catContainer = document.getElementById('recipeCategoryFilters');
      if (catContainer) {
        catContainer.querySelectorAll('.recipe-filter-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-category') === 'all');
        });
      }
      const tasteContainer = document.getElementById('recipeTasteFilters');
      if (tasteContainer) {
        tasteContainer.querySelectorAll('.recipe-filter-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-taste') === 'all');
        });
      }

      renderRecipes();

      // 2. 平滑滾動至食譜區頂部
      setTimeout(() => {
        const sec = document.getElementById('recipeSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  };

})();
