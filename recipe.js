/**
 * Pokopia Recipe Encyclopedia Module (100% Traditional Chinese)
 * Handles recipe card rendering, facility filtering, ingredient reverse-lookup, and pokemon linkage
 */
(function() {
  'use strict';

  // State
  const recipeState = {
    facility: 'all',          // 'all' | 'cutting_board' | 'bread_oven' | 'frying_pan' | 'pot' | 'party_pot' | 'blender'
    selectedIngredient: '',   // Reverse-lookup ingredient filter
    keyword: '',              // Search keyword
    expandedPokemon: {}       // recipeId -> boolean
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

  // Render Recipe Cards
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
      const isExpanded = !!recipeState.expandedPokemon[r.id];
      const hasLikedPoke = r.likedPokemon && r.likedPokemon.length > 0;

      // Ingredients HTML
      const ingredientsHtml = r.ingredients.map(ig => {
        const isSelected = recipeState.selectedIngredient === ig.name;
        const iconHtml = ig.icon 
          ? `<img class="recipe-ing-icon" src="${ig.icon}" alt="${ig.name}" loading="lazy" onerror="this.style.display='none'">` 
          : `<span class="recipe-ing-bullet">🌿</span>`;
        return `
          <button type="button" class="recipe-ing-chip ${isSelected ? 'selected' : ''}" data-ingredient="${ig.name}" title="點擊即時反查使用此食材的料理">
            ${iconHtml}
            <span class="recipe-ing-name">${ig.name}</span>
            <span class="recipe-ing-count">× ${ig.count}</span>
          </button>
        `;
      }).join('');

      // Pokemon Linkage HTML
      let pokemonSectionHtml = '';
      if (hasLikedPoke) {
        const pokeListHtml = r.likedPokemon.map(p => `
          <div class="recipe-poke-badge" title="${p.number} ${p.name}">
            <img class="recipe-poke-sprite" src="${p.sprite}" alt="${p.name}" loading="lazy" onerror="this.src='assets/pkm_sprites/pkm_icon_0001.webp'">
            <span class="recipe-poke-name">${p.name}</span>
          </div>
        `).join('');

        pokemonSectionHtml = `
          <div class="recipe-pokemon-linkage">
            <button type="button" class="recipe-poke-toggle-btn ${isExpanded ? 'expanded' : ''}" data-recipe-id="${r.id}">
              <span class="poke-toggle-left">
                <span class="poke-heart-icon">❤️</span>
                <span class="poke-toggle-label">喜愛此口味寶可夢 <strong>(${r.likedPokemon.length} 隻)</strong></span>
              </span>
              <span class="poke-toggle-arrow">${isExpanded ? '▲ 收起' : '▼ 展開'}</span>
            </button>
            <div class="recipe-poke-list ${isExpanded ? '' : 'hidden'}">
              ${pokeListHtml}
            </div>
          </div>
        `;
      }

      // Facility Badge styling
      let facilityTagColor = 'tag-default';
      if (r.facilityId === 'cutting_board') facilityTagColor = 'tag-leaf';
      else if (r.facilityId === 'bread_oven') facilityTagColor = 'tag-bread';
      else if (r.facilityId === 'frying_pan') facilityTagColor = 'tag-rock';
      else if (r.facilityId === 'pot') facilityTagColor = 'tag-water';
      else if (r.facilityId === 'blender') facilityTagColor = 'tag-blender';
      else if (r.facilityId === 'party_pot') facilityTagColor = 'tag-party';

      return `
        <article class="recipe-card" data-recipe-id="${r.id}" data-facility="${r.facilityId}">
          <!-- Card Header & Image -->
          <div class="recipe-card-header">
            <div class="recipe-img-container">
              <img class="recipe-main-img" src="${r.icon || r.onlineIcon}" alt="${r.name}" loading="lazy" onerror="this.onerror=null; if('${r.onlineIcon}' && this.src !== '${r.onlineIcon}') { this.src='${r.onlineIcon}'; } else { this.src='assets/item_sprites/60px-Bag_原味沙拉_Pokopia_Sprite.png'; }">
            </div>
            <div class="recipe-header-info">
              <div class="recipe-category-row">
                <span class="recipe-category-badge">${r.category}</span>
                <span class="recipe-taste-badge" title="料理口味">${r.taste || '普通'}</span>
              </div>
              <h3 class="recipe-title">${r.name}</h3>
              <div class="recipe-meta-row">
                <span class="recipe-facility-tag ${facilityTagColor}">
                  <span class="recipe-facility-icon">⚙️</span>
                  ${r.facilityName}
                </span>
                <span class="recipe-move-tag" title="烹飪所需招式">
                  <span class="recipe-move-icon">⚡</span>
                  ${r.move}
                </span>
              </div>
            </div>
          </div>

          <!-- Ingredients Section -->
          <div class="recipe-section-body">
            <div class="recipe-section-label">
              <span>所需食材清單</span>
              <span class="recipe-sub-hint">點擊食材可即時反查</span>
            </div>
            <div class="recipe-ingredients-wrap">
              ${ingredientsHtml}
            </div>
          </div>

          <!-- Snorlax Offering Effect -->
          <div class="recipe-snorlax-box">
            <div class="snorlax-box-header">
              <span class="snorlax-icon">💤</span>
              <span class="snorlax-title">供奉苔卡比獸效果</span>
              <span class="snorlax-exp-pill">${r.snorlaxExp} EXP</span>
            </div>
            <div class="snorlax-desc">${r.snorlaxEffect || '無特殊效果'}</div>
          </div>

          <!-- Linked Pokemon Section -->
          ${pokemonSectionHtml}
        </article>
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

        // Update active class
        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');

        recipeState.facility = fac;
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

    // 3. Delegate Ingredient Click & Pokemon Toggle on Recipe Card Grid
    const grid = document.getElementById('recipeCardGrid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        // Ingredient Chip clicked (Reverse lookup)
        const ingChip = e.target.closest('.recipe-ing-chip');
        if (ingChip) {
          const ingName = ingChip.getAttribute('data-ingredient');
          if (ingName && ingName !== '任意食材') {
            if (recipeState.selectedIngredient === ingName) {
              recipeState.selectedIngredient = ''; // Toggle off
            } else {
              recipeState.selectedIngredient = ingName; // Set active ingredient
            }
            renderRecipes();
            // Scroll smoothly to top of filter bar
            const bar = document.querySelector('.recipe-filter-bar');
            if (bar) bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return;
        }

        // Pokemon toggle button clicked
        const toggleBtn = e.target.closest('.recipe-poke-toggle-btn');
        if (toggleBtn) {
          const rId = toggleBtn.getAttribute('data-recipe-id');
          if (rId) {
            recipeState.expandedPokemon[rId] = !recipeState.expandedPokemon[rId];
            renderRecipes();
          }
          return;
        }
      });
    }
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
      renderRecipes();
    },
    resetFilters: function() {
      recipeState.facility = 'all';
      recipeState.selectedIngredient = '';
      recipeState.keyword = '';
      const tabsContainer = document.getElementById('recipeTabs');
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.recipe-tab').forEach(t => {
          if (t.getAttribute('data-facility') === 'all') t.classList.add('active');
          else t.classList.remove('active');
        });
      }
      renderRecipes();
    }
  };

})();
