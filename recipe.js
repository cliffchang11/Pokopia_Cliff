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

  // 品項分類匹配
  function matchCategory(recipe, cat) {
    if (cat === 'all') return true;
    const c = recipe.category || '';
    const name = recipe.name || '';
    if (cat === 'salad') return c.includes('沙拉') || name.includes('沙拉');
    if (cat === 'bread') return c.includes('麵包') || name.includes('麵包');
    if (cat === 'burger') return c.includes('漢堡') || name.includes('漢堡');
    if (cat === 'soup') return c.includes('湯') || name.includes('湯');
    if (cat === 'smoothie') return c.includes('冰沙') || name.includes('冰沙');
    if (cat === 'curry') return c.includes('咖喱') || c.includes('咖哩') || name.includes('咖喱') || name.includes('咖哩');
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

  // 取得品項顯示名與 CSS class
  function getCategoryMeta(categoryStr, name) {
    if ((categoryStr && categoryStr.includes('沙拉')) || name.includes('沙拉')) {
      return { label: '🥗 沙拉', slug: 'salad' };
    }
    if ((categoryStr && categoryStr.includes('麵包')) || name.includes('麵包')) {
      return { label: '🍞 麵包', slug: 'bread' };
    }
    if ((categoryStr && categoryStr.includes('漢堡')) || name.includes('漢堡')) {
      return { label: '🍔 漢堡排', slug: 'burger' };
    }
    if ((categoryStr && categoryStr.includes('湯')) || name.includes('湯')) {
      return { label: '🍲 湯', slug: 'soup' };
    }
    if ((categoryStr && categoryStr.includes('冰沙')) || name.includes('冰沙')) {
      return { label: '🥤 冰沙', slug: 'smoothie' };
    }
    if ((categoryStr && categoryStr.includes('咖喱')) || (categoryStr && categoryStr.includes('咖哩')) || name.includes('咖哩') || name.includes('咖喱')) {
      return { label: '🍛 咖哩', slug: 'curry' };
    }
    return { label: categoryStr || '料理', slug: 'default' };
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

      // 所需專長徽章 HTML
      let specialtyHtml = '';
      if (r.specialty && r.specialty.trim() !== '') {
        const specName = r.specialty.trim();
        const cfg = specialtyConfig[specName] || { icon: '✨', label: specName, styleClass: 'specialty-default' };
        specialtyHtml = `
          <span class="recipe-badge recipe-badge-specialty ${cfg.styleClass}" title="製作此料理需要寶可夢具備「${cfg.label}」專長">
            <span class="specialty-icon">${cfg.icon}</span>
            <span class="specialty-label">${cfg.label}</span>
          </span>
        `;
      }

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

      // 喜愛寶可夢連動區 (純頭像箱子 Popover)
      let pokemonSectionHtml = '';
      if (hasLikedPoke) {
        const pokeListHtml = r.likedPokemon.map(p => `
          <div class="recipe-popover-avatar-item" title="${p.number} ${p.name} (喜愛${r.taste})">
            <img class="recipe-popover-avatar-img" src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 24 24\\' fill=\\'%2394a3b8\\'><circle cx=\\'12\\' cy=\\'12\\' r=\\'10\\'/></svg>'">
            <span class="recipe-popover-avatar-num">${p.number.replace('No. ', '#')}</span>
          </div>
        `).join('');

        pokemonSectionHtml = `
          <div class="recipe-card-poke-wrapper">
            <button type="button" class="recipe-card-poke-trigger ${isPopoverOpen ? 'active' : ''}" data-popover-target="${r.id}" title="點擊檢視喜愛此料理的 ${r.likedPokemon.length} 隻寶可夢">
              <span class="recipe-poke-heart">❤️</span>
              <span class="recipe-poke-btn-text"><strong>${r.likedPokemon.length}</strong> 隻</span>
            </button>
            <div class="recipe-row-popover ${isPopoverOpen ? 'show' : 'hidden'}" id="popover-${r.id}" role="dialog" aria-label="${r.name} 喜愛寶可夢清單">
              <div class="recipe-popover-header">
                <span class="recipe-popover-title">喜愛寶可夢 <strong>(${r.likedPokemon.length})</strong></span>
                <span class="recipe-popover-taste ${tasteClass}">${r.taste}</span>
                <button type="button" class="recipe-popover-close-btn" data-popover-close="${r.id}" aria-label="關閉">✕</button>
              </div>
              <div class="recipe-popover-avatar-grid">
                ${pokeListHtml}
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="recipe-row" data-recipe-id="${r.id}" data-recipe-name="${r.name}" data-category="${catMeta.slug}">
          <!-- 1. 左區：料理身份與專長 -->
          <div class="recipe-row-identity">
            <img class="recipe-row-avatar-img" src="${r.icon || r.onlineIcon}" alt="${r.name}" loading="lazy" onerror="this.onerror=null; if('${r.onlineIcon}' && this.src !== '${r.onlineIcon}') { this.src='${r.onlineIcon}'; } else { this.src='assets/item_sprites/simple-salad.png'; }">
            <div class="recipe-row-identity-text">
              <div class="recipe-row-title-line">
                <h3 class="recipe-row-title">${r.name}</h3>
                <span class="recipe-badge recipe-badge-cat cat-${catMeta.slug}">${catMeta.label}</span>
                <span class="recipe-badge recipe-badge-taste ${tasteClass}">${r.taste || '美味'}</span>
                ${specialtyHtml}
              </div>
            </div>
          </div>

          <!-- 2. 中區：所需食材籤 (輕盈無框手帳流，點擊反查) -->
          <div class="recipe-row-ingredients">
            ${ingredientsHtml}
          </div>

          <!-- 3. 右區：效果說明與喜愛寶可夢膠囊 -->
          <div class="recipe-row-effects-section">
            <div class="recipe-row-effects-text">
              ${r.move ? `<span class="recipe-row-move-tag">「${r.move}」威力提升</span>` : ''}
              <span class="recipe-row-snorlax-text">🍃 ${r.snorlaxEffect || '可以和寶可夢變得比較要好'}</span>
            </div>
            ${pokemonSectionHtml}
          </div>
        </div>
      `;
    }).join('');
  }

  // 設置雙層篩選與卡片互動事件
  function initRecipeEvents() {
    // 1. 第一層：品項類別點擊
    const catContainer = document.getElementById('recipeCategoryFilters');
    if (catContainer) {
      catContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recipe-filter-btn');
        if (!btn) return;
        const cat = btn.getAttribute('data-category');
        if (!cat) return;

        catContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        recipeState.category = cat;
        recipeState.activePopoverId = null;
        renderRecipes();
      });
    }

    // 2. 第二層：口味風味點擊
    const tasteContainer = document.getElementById('recipeTasteFilters');
    if (tasteContainer) {
      tasteContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recipe-filter-btn');
        if (!btn) return;
        const taste = btn.getAttribute('data-taste');
        if (!taste) return;

        tasteContainer.querySelectorAll('.recipe-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        recipeState.taste = taste;
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

    // 4. 卡片容器代理事件 (食材反查、寶可夢彈層)
    const grid = document.getElementById('recipeCardGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        // A. 食材膠囊點擊 (反查)
        const ingChip = e.target.closest('.recipe-ing-chip');
        if (ingChip) {
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

        // B. 喜愛寶可夢展開按鈕
        const pokeTrigger = e.target.closest('.recipe-card-poke-trigger');
        if (pokeTrigger) {
          const recipeId = pokeTrigger.getAttribute('data-popover-target');
          if (recipeState.activePopoverId === recipeId) {
            recipeState.activePopoverId = null;
          } else {
            recipeState.activePopoverId = recipeId;
          }
          renderRecipes();
          return;
        }

        // C. Popover 關閉按鈕
        const closeBtn = e.target.closest('.recipe-popover-close-btn');
        if (closeBtn) {
          recipeState.activePopoverId = null;
          renderRecipes();
          return;
        }
      });
    }

    // 5. 全域點擊收起 Popover
    document.addEventListener('click', (e) => {
      if (!recipeState.activePopoverId) return;
      const insidePopover = e.target.closest('.recipe-row-popover');
      const insideTrigger = e.target.closest('.recipe-card-poke-trigger');
      if (!insidePopover && !insideTrigger) {
        recipeState.activePopoverId = null;
        renderRecipes();
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
