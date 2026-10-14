/**
 * Pokopia Recipe Encyclopedia Module (100% Traditional Chinese - PWA & Compact Rows)
 * Clean, lightweight row-based encyclopedia list with native 36px sprites,
 * touch-friendly ingredient reverse-lookup, and pure avatar grid popover.
 */
(function() {
  'use strict';

  // State
  const recipeState = {
    facility: 'all',          // 'all' | 'cutting_board' | 'bread_oven' | 'frying_pan' | 'pot' | 'party_pot' | 'blender'
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
    '水枪': '水槍'
  };

  const tasteClassMap = {
    '辣辣的': 'taste-spicy',
    '甜甜的': 'taste-sweet',
    '酸酸的': 'taste-sour',
    '苦苦的': 'taste-bitter',
    '澀澀的': 'taste-astringent',
    '平淡無奇的': 'taste-plain'
  };

  function normalizeKeyword(kw) {
    if (!kw) return '';
    let res = kw.trim();
    for (const [s, t] of Object.entries(tradMap)) {
      res = res.split(s).join(t);
    }
    return res.toLowerCase();
  }

  // Facility Counts helper
  function updateFacilityCounts() {
    if (!window.POKOPIA_RECIPES_DB) return;
    const db = window.POKOPIA_RECIPES_DB;
    const counts = { all: db.length };
    db.forEach(r => {
      counts[r.facilityId] = (counts[r.facilityId] || 0) + 1;
    });

    const tabs = document.querySelectorAll('.recipe-tab');
    tabs.forEach(tab => {
      const fac = tab.getAttribute('data-facility');
      const countEl = tab.querySelector('.recipe-tab-count');
      if (countEl && counts[fac] !== undefined) {
        countEl.textContent = `(${counts[fac]})`;
      }
    });
  }

  // Filter recipes based on state
  function getFilteredRecipes() {
    if (!window.POKOPIA_RECIPES_DB) return [];
    let list = window.POKOPIA_RECIPES_DB;

    // 1. Facility filter
    if (recipeState.facility !== 'all') {
      list = list.filter(r => r.facilityId === recipeState.facility);
    }

    // 2. Selected Ingredient filter (reverse lookup)
    if (recipeState.selectedIngredient) {
      const target = recipeState.selectedIngredient;
      list = list.filter(r => r.ingredients.some(ig => ig.name === target || ig.name.includes(target)));
    }

    // 3. Keyword filter
    if (recipeState.keyword) {
      const kw = normalizeKeyword(recipeState.keyword);
      list = list.filter(r => {
        const nameMatch = r.name.toLowerCase().includes(kw);
        const catMatch = r.category && r.category.toLowerCase().includes(kw);
        const facMatch = r.facilityName && r.facilityName.toLowerCase().includes(kw);
        const moveMatch = r.move && r.move.toLowerCase().includes(kw);
        const tasteMatch = r.taste && r.taste.toLowerCase().includes(kw);
        const ingMatch = r.ingredients.some(ig => ig.name.toLowerCase().includes(kw));
        const effectMatch = r.snorlaxEffect && r.snorlaxEffect.toLowerCase().includes(kw);
        return nameMatch || catMatch || facMatch || moveMatch || tasteMatch || ingMatch || effectMatch;
      });
    }

    return list;
  }

  // Render Compact Recipe Rows
  function renderRecipes() {
    const grid = document.getElementById('recipeCardGrid');
    const emptyState = document.getElementById('recipeEmptyState');
    const notice = document.getElementById('recipeIngredientFilterNotice');
    const activeIngName = document.getElementById('activeIngredientName');

    if (!grid) return;

    // Ingredient Notice Bar
    if (recipeState.selectedIngredient) {
      if (notice) notice.classList.remove('hidden');
      if (activeIngName) activeIngName.textContent = recipeState.selectedIngredient;
    } else {
      if (notice) notice.classList.add('hidden');
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

      // Ingredients HTML - Clean touch-friendly chips
      const ingredientsHtml = r.ingredients.map(ig => {
        const isSelected = recipeState.selectedIngredient === ig.name;
        const iconHtml = ig.icon 
          ? `<img class="recipe-row-ing-icon" src="${ig.icon}" alt="${ig.name}" loading="lazy" onerror="this.style.display='none'">` 
          : '';
        return `
          <button type="button" class="recipe-row-ing-chip ${isSelected ? 'selected' : ''}" data-ingredient="${ig.name}" title="點擊即時反查所有使用「${ig.name}」的食譜" aria-label="篩選食材：${ig.name}">
            ${iconHtml}
            <span class="recipe-row-ing-name">${ig.name}</span>
            <span class="recipe-row-ing-count">×${ig.count}</span>
          </button>
        `;
      }).join('');

      // Pokemon Linkage Popover HTML (Pure Avatar Grid)
      let pokemonSectionHtml = '';
      if (hasLikedPoke) {
        const pokeListHtml = r.likedPokemon.map(p => `
          <div class="recipe-popover-avatar-item" title="${p.number} ${p.name} (喜愛${r.taste})">
            <img class="recipe-popover-avatar-img" src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.src='assets/pkm_sprites/pkm_icon_0001.webp'">
          </div>
        `).join('');

        pokemonSectionHtml = `
          <div class="recipe-row-poke-wrapper">
            <button type="button" class="recipe-row-poke-trigger ${isPopoverOpen ? 'active' : ''}" data-popover-target="${r.id}" title="點擊檢視喜愛此料理的 ${r.likedPokemon.length} 隻寶可夢">
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

      // Facility badge colors
      let facClass = 'fac-default';
      if (r.facilityId === 'cutting_board') facClass = 'fac-leaf';
      else if (r.facilityId === 'bread_oven') facClass = 'fac-bread';
      else if (r.facilityId === 'frying_pan') facClass = 'fac-rock';
      else if (r.facilityId === 'pot') facClass = 'fac-water';
      else if (r.facilityId === 'blender') facClass = 'fac-blender';
      else if (r.facilityId === 'party_pot') facClass = 'fac-party';

      return `
        <div class="recipe-row" data-recipe-id="${r.id}" data-recipe-name="${r.name}" data-facility="${r.facilityId}">
          <!-- 1. 料理主體識別區 -->
          <div class="recipe-row-main">
            <div class="recipe-row-avatar-box">
              <img class="recipe-row-avatar-img" src="${r.icon || r.onlineIcon}" alt="${r.name}" loading="lazy" onerror="this.onerror=null; if('${r.onlineIcon}' && this.src !== '${r.onlineIcon}') { this.src='${r.onlineIcon}'; } else { this.src='assets/item_sprites/60px-Bag_原味沙拉_Pokopia_Sprite.png'; }">
            </div>
            <div class="recipe-row-text-info">
              <div class="recipe-row-name-line">
                <span class="recipe-row-title">${r.name}</span>
                <span class="recipe-row-taste-badge ${tasteClass}">${r.taste || '美味'}</span>
              </div>
              <div class="recipe-row-meta-line">
                <span class="recipe-row-fac-tag ${facClass}">${r.facilityName}</span>
                <span class="recipe-row-move-tag">⚡ ${r.move}</span>
              </div>
            </div>
          </div>

          <!-- 2. 所需食材清單區 (點擊即時反查) -->
          <div class="recipe-row-ingredients">
            <div class="recipe-row-ing-chips">
              ${ingredientsHtml}
            </div>
          </div>

          <!-- 3. 卡比獸效果與連動區 -->
          <div class="recipe-row-extras">
            <div class="recipe-row-snorlax-pill" title="供奉苔卡比獸效果: ${r.snorlaxEffect || '無'}">
              <span class="snorlax-pill-icon">💤</span>
              <span class="snorlax-pill-text">${r.snorlaxEffect || '和寶可夢變得要好'}</span>
              <span class="snorlax-pill-exp">${r.snorlaxExp}</span>
            </div>
            ${pokemonSectionHtml}
          </div>
        </div>
      `;
    }).join('');

    // Update result badge in toolbar if active
    const resultText = document.getElementById('filterResultText');
    if (resultText && window.POKOPIA_STATE && window.POKOPIA_STATE.currentTab === 'recipe') {
      resultText.textContent = `料理 ${recipes.length} / ${window.POKOPIA_RECIPES_DB.length} 道`;
    }
  }

  // Setup Event Listeners
  function initRecipeEvents() {
    // 1. Facility Tabs Click
    const tabsContainer = document.getElementById('recipeTabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.recipe-tab');
        if (!btn) return;
        const fac = btn.getAttribute('data-facility');
        if (!fac) return;

        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        recipeState.facility = fac;
        recipeState.activePopoverId = null;
        renderRecipes();
      });
    }

    // 2. Clear Ingredient Filter Button
    const btnClearIng = document.getElementById('btnClearIngredientFilter');
    if (btnClearIng) {
      btnClearIng.addEventListener('click', () => {
        recipeState.selectedIngredient = '';
        renderRecipes();
      });
    }

    // 3. Delegate on Recipe Grid
    const grid = document.getElementById('recipeCardGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        // A. Ingredient Chip clicked (Reverse lookup)
        const ingChip = e.target.closest('.recipe-row-ing-chip');
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
            const bar = document.querySelector('.recipe-filter-bar');
            if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return;
        }

        // B. Popover Trigger Button clicked
        const popoverBtn = e.target.closest('.recipe-row-poke-trigger');
        if (popoverBtn) {
          const targetId = popoverBtn.getAttribute('data-popover-target');
          if (recipeState.activePopoverId === targetId) {
            recipeState.activePopoverId = null;
          } else {
            recipeState.activePopoverId = targetId;
          }
          renderRecipes();
          return;
        }

        // C. Popover Close Button clicked
        const closeBtn = e.target.closest('.recipe-popover-close-btn');
        if (closeBtn) {
          recipeState.activePopoverId = null;
          renderRecipes();
          return;
        }
      });
    }

    // 4. Global click to dismiss Popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!recipeState.activePopoverId) return;
      const insidePopover = e.target.closest('.recipe-row-popover');
      const insideTrigger = e.target.closest('.recipe-row-poke-trigger');
      if (!insidePopover && !insideTrigger) {
        recipeState.activePopoverId = null;
        renderRecipes();
      }
    });
  }

  // Public Interface
  window.RecipeModule = {
    init: function() {
      updateFacilityCounts();
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
      recipeState.facility = 'all';
      recipeState.selectedIngredient = '';
      recipeState.keyword = '';
      recipeState.activePopoverId = null;
      const tabsContainer = document.getElementById('recipeTabs');
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => {
          if (t.getAttribute('data-facility') === 'all') t.classList.add('active');
          else t.classList.remove('active');
        });
      }
      renderRecipes();
    },
    scrollToRecipe: function(recipeName) {
      if (!recipeName) return;
      // 1. 重設關鍵字與食材篩選，恢復全量食譜
      recipeState.facility = 'all';
      recipeState.selectedIngredient = '';
      recipeState.keyword = '';
      recipeState.activePopoverId = null;
      const tabsContainer = document.getElementById('recipeTabs');
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => {
          if (t.getAttribute('data-facility') === 'all') t.classList.add('active');
          else t.classList.remove('active');
        });
      }
      renderRecipes();

      // 2. 定位到目標料理行並閃爍高亮呼吸光暈
      setTimeout(() => {
        const rows = document.querySelectorAll('.recipe-row');
        let targetRow = null;
        for (const row of rows) {
          const name = row.getAttribute('data-recipe-name');
          const id = row.getAttribute('data-recipe-id');
          if (name === recipeName || id === recipeName || (name && name.includes(recipeName)) || (recipeName && recipeName.includes(name))) {
            targetRow = row;
            break;
          }
        }
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRow.classList.remove('recipe-row-highlight');
          void targetRow.offsetWidth; // 強制重繪觸發動畫
          targetRow.classList.add('recipe-row-highlight');
          setTimeout(() => {
            targetRow.classList.remove('recipe-row-highlight');
          }, 2500);
        }
      }, 100);
    },
    filterByIngredient: function(ingredientName) {
      if (!ingredientName) return;
      // 1. 重設設施為全部，關鍵字清空，激活該食材反查
      recipeState.facility = 'all';
      recipeState.selectedIngredient = ingredientName;
      recipeState.keyword = '';
      recipeState.activePopoverId = null;
      const tabsContainer = document.getElementById('recipeTabs');
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => {
          if (t.getAttribute('data-facility') === 'all') t.classList.add('active');
          else t.classList.remove('active');
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
