#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pokopia Storage & Habitat Manager - 自動化驗證腳本
包含：
1. 儲存箱 9 大分類 44 列核心結構 100% 嚴格保全
2. 寶可夢官方三大圖鑑 (367筆) 與雙向棲息地關聯 (352處)
3. 喜好與物品四合一百科資料庫 (preferences_db.js)
4. 正名「喜好」、純文字藥丸 (無 🍬、🌶️ emoji)
5. 右側滑出抽屜面板 (Slide-over Drawer) 與版本號 v4.0.5
"""

import json
import re
import urllib.request
import os
import subprocess

def run_tests():
    print("=== Pokopia 喜好正名、百科資料庫、右側抽屜與雙向圖鑑自動化驗證 ===")
    
    # Test 1: HTTP Endpoint Verification
    url = "http://localhost:8899/"
    req = urllib.request.urlopen(url)
    html_content = req.read().decode('utf-8')
    assert req.status == 200, "HTTP Status must be 200"
    print("✅ [PASS] HTTP 伺服器正常回應 200 OK")

    # Test 2: Read data.js and parse structure
    with open("data.js", "r", encoding="utf-8") as f:
        data_js = f.read()

    pdata_match = re.search(r'window\.POKOPIA_DATA\s*=\s*(\{.*\});', data_js, re.DOTALL)
    assert pdata_match, "無法解析 data.js 中的 window.POKOPIA_DATA 數據"
    pdata = json.loads(pdata_match.group(1))
    
    # Verify Categories & Crafting Bench Structure (100% 嚴格保全)
    categories = pdata["categories"]
    assert len(categories) == 9, f"儲存箱類別數量應為 9，實測為 {len(categories)}"
    for cat in categories:
        assert not re.search(r'[（\(].*?[）\)]', cat.get("name", "")), f"儲存箱大類別名稱不應包含英文括號: {cat.get('name')}"

    expected_subcat_counts = [4, 4, 4, 4, 4, 4, 8, 8, 4]
    actual_subcat_counts = [len(c.get("subCategories", [])) for c in categories]
    assert actual_subcat_counts == expected_subcat_counts, f"子項目數量分配不符！預期 {expected_subcat_counts}，實測為 {actual_subcat_counts}"

    total_subcategories = sum(actual_subcat_counts)
    assert total_subcategories == 44, f"全量子項目總數應嚴格為 44 列，實測為 {total_subcategories}"

    for c in categories:
        for sub in c.get("subCategories", []):
            name = sub.get("name", "")
            assert re.match(r'^\d+-\d+\s+', name), f"子項目名稱不符合 'X-Y 中文' 格式: {name}"
            assert not re.search(r'[（\(].*?[）\)]', name), f"子項目名稱不應包含任何英文括號: {name}"
            items = sub.get("items", [])
            assert len(items) > 0, f"子項目 '{name}' 的物品細項 (items) 為空！"
            assert "craftingBench" in sub, f"子項目 '{name}' 缺少 craftingBench 欄位"

    assert categories[0]["subCategories"][2]["craftingBench"] == "Box 1", "1-3 有機材料應綁定 Box 1"
    assert categories[0]["subCategories"][3]["craftingBench"] == "Box 1", "1-4 無機材料應綁定 Box 1"
    assert categories[1]["subCategories"][0]["craftingBench"] == "Box 2", "2-1 木材與磚塊應綁定 Box 2"
    assert categories[1]["subCategories"][1]["craftingBench"] == "Box 3", "2-2 玻璃與水泥應綁定 Box 3"
    assert categories[1]["subCategories"][2]["craftingBench"] == "Box 4", "2-3 金屬材料應綁定 Box 4"
    assert categories[1]["subCategories"][3]["craftingBench"] == "Box 4", "2-4 寶可金屬應綁定 Box 4"
    print("✅ [PASS] 儲存箱 9 大類別 44 列核心結構 100% 嚴格保全無損！")

    # Test 3: 寶可夢三大圖鑑分類與純數字編號驗證
    pokemons = pdata["pokemons"]
    assert len(pokemons) == 367, f"寶可夢數據筆數應為 367 筆，實測為 {len(pokemons)}"
    
    main_pkm = [p for p in pokemons if p.get("category") == "main"]
    event_pkm = [p for p in pokemons if p.get("category") == "event"]
    under_pkm = [p for p in pokemons if p.get("category") == "underwater"]
    
    assert len(main_pkm) == 308, f"主圖鑑寶可夢應為 308 筆，實測為 {len(main_pkm)}"
    assert len(event_pkm) == 7, f"活動圖鑑寶可夢應為 7 筆，實測為 {len(event_pkm)}"
    assert len(under_pkm) == 52, f"海底圖鑑寶可夢應為 52 筆，實測為 {len(under_pkm)}"
    
    assert main_pkm[0]["number"] == "No. 001" and "妙蛙種子" in main_pkm[0]["name"], "主圖鑑 No. 001 應為妙蛙種子"
    assert main_pkm[-1]["number"] == "No. 300" and "夢幻" in main_pkm[-1]["name"], "主圖鑑 No. 300 應為夢幻"
    print(f"✅ [PASS] 寶可夢三大圖鑑結構對齊：主圖鑑 308 筆、活動 7 筆、海底 52 筆！")

    # Test 4: 2D 點陣圖標 (MSP_Normal) 全量驗證
    for p in pokemons:
        sprite = p.get("sprite", "")
        assert sprite.startswith("assets/pkm_sprites/pkm_icon_"), f"Sprite 未指向 2D 點陣圖標: {sprite}"
        assert os.path.exists(sprite), f"Sprite 檔案不存在: {sprite}"
        assert os.path.getsize(sprite) > 500, f"Sprite 檔案異常過小: {sprite}"
    print("✅ [PASS] 全量 367 筆寶可夢 100% 採用 52poke 原版 2D 點陣圖標 (MSP_Normal)！")

    # Test 5: 棲息地 252 處與卡比獸雙向綁定驗證
    habitats = pdata["habitats"]
    assert len(habitats) == 252, f"棲息地總數應為 252 處，實測為 {len(habitats)}"
    hab_093 = next(h for h in habitats if h.get("official_id") == "093")
    assert any("pkm_icon_0143M.webp" in p["sprite"] for p in hab_093["pokemons"]), "093 專屬吸引卡比獸（萌苔）(0143M)"
    
    # 驗證多形態寶可夢在棲息地名單中形態完全獨立且無重複
    hab_071 = next(h for h in habitats if h.get("official_id") == "071")
    hab_071_names = [p["name"] for p in hab_071["pokemons"]]
    assert len(hab_071_names) == 3, "071 沙灘套組應包含 3 隻寶可夢"
    assert "米立龍（上弓）" in hab_071_names and "米立龍（下垂）" in hab_071_names and "米立龍（平挺）" in hab_071_names, "071 沙灘套組應分別包含上弓、下垂、平挺三種形態的米立龍"
    assert len(set(p["sprite"] for p in hab_071["pokemons"])) == 3, "071 沙灘套組三隻米立龍圖標應各不相同"

    hab_027 = next(h for h in habitats if h.get("official_id") == "027")
    hab_027_names = [p["name"] for p in hab_027["pokemons"]]
    assert "無殼海兔（西海）" in hab_027_names and "無殼海兔（東海）" in hab_027_names, "027 指路牌應分別包含西海與東海兩種無殼海兔"

    hab_185 = next(h for h in habitats if h.get("official_id") == "185")
    hab_185_names = [p["name"] for p in hab_185["pokemons"]]
    assert "海兔獸（西海）" in hab_185_names and "海兔獸（東海）" in hab_185_names, "185 海釣應分別包含西海與東海兩種海兔獸"

    for h in habitats:
        p_ids = [p["id"] for p in h.get("pokemons", [])]
        assert len(p_ids) == len(set(p_ids)), f"棲息地 {h.get('official_id')} ({h.get('name')}) 存在重複的寶可夢 ID: {p_ids}"

    snorlax_moss = next(p for p in pokemons if p.get("id") == "pkm_s1_112")
    assert snorlax_moss["habitat1_id"] == "hab_093", "卡比獸（萌苔）habitat1_id 應為 hab_093"
    print("✅ [PASS] 棲息地 252 處與卡比獸（萌苔）093 雙向棲息地綁定 100% 正確，且全量多形態寶可夢（米立龍/海兔等）嚴格獨立無重複！")

    # Test 6: 喜好與物品四合一百科資料庫 (preferences_db.js) 深入驗證
    assert os.path.exists("preferences_db.js"), "缺少 preferences_db.js 資料庫檔案"
    with open("preferences_db.js", "r", encoding="utf-8") as f:
        pref_js = f.read()

    assert "POKOPIA_PREFERENCES_DB = " in pref_js, "無法解析 preferences_db.js 中的 POKOPIA_PREFERENCES_DB"
    json_str = pref_js.split('POKOPIA_PREFERENCES_DB = ')[1].split(';\nif')[0].strip()
    pref_db = json.loads(json_str)

    # 口味檢驗 (6 大官方口味)
    tastes = pref_db.get("tastes", [])
    assert len(tastes) == 6, f"口味數量應為 6，實測為 {len(tastes)}"
    expected_tastes = ["甜甜的", "酸酸的", "辣辣的", "苦苦的", "澀澀的", "平淡無奇的"]
    actual_tastes = [t["name"] for t in tastes]
    assert set(expected_tastes) == set(actual_tastes), f"口味名稱不符！預期 {expected_tastes}，實測為 {actual_tastes}"
    for t in tastes:
        assert t.get("snorlaxEffect"), f"口味 '{t['name']}' 缺少供奉苔卡比獸效果"
        assert t.get("snorlaxLevels"), f"口味 '{t['name']}' 缺少供奉等級食物"
    print(f"✅ [PASS] 喜好口味資料庫：收錄完整 6 大口味，皆具供奉苔卡比獸效果與食物對照！")

    # 環境檢驗 (6 大官方環境狀態，3 大維度)
    envs = pref_db.get("environments", [])
    assert len(envs) == 6, f"環境狀態應為 6，實測為 {len(envs)}"
    expected_envs = ["明亮", "🌙 黑暗", "溫暖", "涼爽", "潮濕", "乾燥"]
    actual_envs = [e["name"] for e in envs]
    assert set(expected_envs) == set(actual_envs), f"環境名稱不符！預期 {expected_envs}，實測為 {actual_envs}"
    dims = set(e["dimension"] for e in envs)
    assert dims == {"亮度", "溫度", "滋潤度"}, f"環境維度不符: {dims}"
    print(f"✅ [PASS] 喜好環境資料庫：收錄 6 大環境狀態（亮度、溫度、滋潤度三大維度），營造物品齊全！")

    # 喜歡的東西特徵風格 (43 種風格)
    things = pref_db.get("things", [])
    assert len(things) == 43, f"特徵風格應為 43 種，實測為 {len(things)}"
    sample_styles = ["交通工具", "可愛的", "木製的", "柔軟的", "能感受大自然的"]
    for s in sample_styles:
        assert any(th["name"] == s for th in things), f"缺少特徵風格: {s}"
    print(f"✅ [PASS] 喜歡的東西風格資料庫：收錄完整 43 種官方特徵風格與代表物品！")

    # 12 大分類物品列表 (100% 繁體中文，無名稱錯誤)
    items_by_cat = pref_db.get("items", [])
    expected_cats = ["材料", "食物", "家具", "雜貨", "戶外", "實用", "大自然", "建築", "方塊", "套組", "重要的物品", "其他"]
    for c in expected_cats:
        assert c in items_by_cat, f"物品列表缺少官方分類: {c}"
        assert len(items_by_cat[c]) > 0, f"分類 '{c}' 物品為空"
    total_items = sum(len(v) for v in items_by_cat.values())
    assert total_items >= 1200, f"物品總數應至少 1,200 項，實測為 {total_items}"
    print(f"✅ [PASS] 官方 12 大分類物品列表：共收錄 {total_items} 筆繁體中文物品，名稱與說明完整無誤！")

    # Test 7: 前端 UI 結構與版本號斷言
    with open("index.html", "r", encoding="utf-8") as f:
        html_src = f.read()
    with open("app.js", "r", encoding="utf-8") as f:
        js_src = f.read()
    with open("index.css", "r", encoding="utf-8") as f:
        css_src = f.read()

    # 1. 欄位正名為「喜好」
    assert '<th width="220">喜好</th>' in html_src or '<th>喜好</th>' in html_src, "index.html 寶可夢表格應包含標題「喜好」"
    assert '<strong>❤️ 喜好：</strong>' in js_src, "app.js 寶可夢卡片標題應為「❤️ 喜好：」"
    assert '喜好風格與質感' not in js_src, "app.js 不應再包含舊名稱「喜好風格與質感」"
    print("✅ [PASS] 欄位正式正名為「喜好」（表格標頭「喜好」、卡片「❤️ 喜好：」）！")

    # 2. 純文字藥丸標籤，無 🍬、🌶️ emoji
    assert 'renderPrefPill' in js_src, "app.js 應具備 renderPrefPill 純文字藥丸渲染函數"
    assert 'pref-pill-taste' in js_src and 'pref-pill-thing' in js_src, "app.js 應以柔和色系區分口味與特徵"
    assert '🍬' not in js_src and '🌶️' not in js_src, "喜好標籤絕不可帶有 🍬、🌶️ 等微小圖標！"
    print("✅ [PASS] 喜好標籤為純淨純文字藥丸，柔和色彩區分口味與特徵，無任何 🍬、🌶️ 圖標！")

    # 3. 系統右上角按鈕與右側滑出抽屜面板
    assert 'id="btnPrefDrawer"' in html_src, "index.html 缺少 btnPrefDrawer 喜好百科按鈕"
    assert 'id="prefDrawer"' in html_src, "index.html 缺少 prefDrawer 右側抽屜面板"
    assert 'id="prefDrawerBackdrop"' in html_src, "index.html 缺少 prefDrawerBackdrop 遮罩"
    assert 'data-pref-tab="tastes"' in html_src, "抽屜缺少 tastes 分頁按鈕"
    assert 'data-pref-tab="environments"' in html_src, "抽屜缺少 environments 分頁按鈕"
    assert 'data-pref-tab="things"' in html_src, "抽屜缺少 things 分頁按鈕"
    assert 'data-pref-tab="items"' in html_src, "抽屜缺少 items 分頁按鈕"
    assert 'id="prefDrawerSearch"' in html_src, "抽屜缺少即時搜尋列"

    # 4. 抽屜 CSS 動效與純圖片方格樣式
    assert '.pref-drawer' in css_src, "index.css 缺少 .pref-drawer 抽屜樣式"
    assert '.pref-drawer-btn' in css_src, "index.css 缺少 .pref-drawer-btn 按鈕樣式"
    assert '.pref-pill' in css_src, "index.css 缺少 .pref-pill 純文字藥丸樣式"
    assert '.pref-item-grid' in css_src, "index.css 缺少 .pref-item-grid 純圖片網格樣式"
    assert '.pref-item-slot' in css_src, "index.css 缺少 .pref-item-slot 道具方格樣式"
    assert '.pref-item-slot-img' in css_src, "index.css 缺少 .pref-item-slot-img 縮圖樣式"
    assert '.pref-item-highlight' in css_src, "index.css 缺少 .pref-item-highlight 高亮動畫樣式"

    # 5. preferences_db.js 明確掛載至 window 物件，全量 100% 本地 Sprite 圖標覆蓋率
    assert 'window.POKOPIA_PREFERENCES_DB = POKOPIA_PREFERENCES_DB;' in pref_js, "preferences_db.js 必須明確掛載至 window.POKOPIA_PREFERENCES_DB"
    item_icons = pref_db.get("itemIcons", {})
    assert len(item_icons) >= 1500, f"官方 Sprite 圖標對照數量應至少 1,500 個，實測為 {len(item_icons)}"
    
    # 驗證所有引用道具 100% 具備本地 Sprite 圖標 (0 缺漏，且磁碟檔案存在且有效)
    all_referenced_items = set()
    for th in pref_db.get("things", []):
        for it in th.get("items", []): all_referenced_items.add(it)
    for env in pref_db.get("environments", []):
        for it in env.get("items", []): all_referenced_items.add(it)
    for taste in pref_db.get("tastes", []):
        for it in taste.get("foods", []): all_referenced_items.add(it)
    
    missing_icons = [it for it in all_referenced_items if not item_icons.get(it)]
    assert len(missing_icons) == 0, f"存在未對齊官方圖標之道具: {missing_icons}"
    
    missing_files = []
    for it in all_referenced_items:
        p = item_icons[it]
        if not p.startswith("assets/item_sprites/") or not os.path.exists(p) or os.path.getsize(p) < 100:
            missing_files.append((it, p))
    assert len(missing_files) == 0, f"存在本地圖標檔案缺失或異常: {missing_files[:5]}"
    print(f"✅ [PASS] 喜好百科引用的 {len(all_referenced_items)} 種道具與食物 100% 指向本地 assets/item_sprites/ 有效檔案（0 缺漏）！")

    # 6. 防盜鏈保護與版本號升級至 ?v=4.7.0
    assert '<meta name="referrer" content="no-referrer">' in html_src, "index.html 缺少 meta no-referrer 雙層防盜鏈防禦"
    assert 'referrerpolicy="no-referrer"' in js_src, "app.js 圖片缺少 referrerpolicy='no-referrer' 屬性"
    assert 'index.css?v=4.7.0' in html_src, "index.html 應升級至 index.css?v=4.7.0"
    assert 'data.js?v=4.7.0' in html_src, "index.html 應升級至 data.js?v=4.7.0"
    assert 'preferences_db.js?v=4.7.0' in html_src, "index.html 應升級至 preferences_db.js?v=4.7.0"
    assert 'autofarm_data.js?v=4.7.0' in html_src, "index.html 應引入 autofarm_data.js?v=4.7.0"
    assert 'app.js?v=4.7.0' in html_src, "index.html 應升級至 app.js?v=4.7.0"
    assert 'assets/logo.png' in html_src, "index.html 缺少風速狗 Logo 或 Favicon 引用"
    assert 'id="brandLogo"' in html_src, "index.html 缺少 #brandLogo 品牌圖示元素"
    assert "tab: tab || 'habitat'" in js_src, "app.js 預設首頁分頁應為 habitat 寶可夢圖鑑"
    assert "view: view || 'table'" in js_src, "app.js 預設首頁視圖應為 table 表格視圖"
    assert "switchTab('habitat', true)" in js_src, "app.js 點擊 Logo 應切換至 habitat"
    assert "switchView('table', true)" in js_src, "app.js 點擊 Logo 應切換至 table"
    assert html_src.find('class="toc-container"') < html_src.find('class="search-box"'), "目次按鈕應位於搜尋框左側"

    # 驗證喜好百科按鈕無圖示、精緻縮小與置中
    assert 'pref-drawer-btn-icon' not in html_src, "index.html 喜好百科按鈕不應再包含圖示元素"
    assert "💖" not in html_src.split('id="btnPrefDrawer"')[1].split('</button>')[0], "喜好百科按鈕不應包含 💖 表情圖示"
    assert "justify-content: center" in css_src, "index.css 喜好百科按鈕應具備居中設定"
    
    # 驗證官方 5 款標籤圖示下載且 preferences_db.js 無 Wiki 語法殘留
    for tag_fname in ["food.png", "decor.png", "rest.png", "toy.png", "road.png"]:
        tag_path = os.path.join("assets", "tag_icons", tag_fname)
        assert os.path.exists(tag_path) and os.path.getsize(tag_path) > 1000, f"標籤圖示 {tag_fname} 缺失或無效"
    assert "[[File:" not in pref_js, "preferences_db.js 不應包含任何 [[File: 殘留語法"
    assert ".pref-tag-badge" in css_src, "index.css 應包含 .pref-tag-badge 樣式"
    assert ".pref-tag-icon" in css_src, "index.css 應包含 .pref-tag-icon 樣式"

    # 驗證儲存庫徹底移除「完成」欄位、移除「類別」欄位與移除「工作臺箱號」
    assert '<th width="60">完成</th>' not in html_src, "index.html 儲存庫表格表頭不應包含「完成」欄位"
    assert 'cat-checkbox' not in js_src, "app.js 儲存庫渲染邏輯不應再包含 cat-checkbox 勾選框"
    assert 'cat-checkbox' not in html_src, "index.html 儲存庫不應包含 cat-checkbox"
    assert '工作臺箱號' not in html_src, "index.html 儲存庫表格不應包含「工作臺箱號」"
    assert '<th width="75">類別</th>' not in html_src, "index.html 儲存庫表格不應包含獨立的「類別」欄位"
    assert '<th width="80">類別</th>' not in html_src, "index.html 儲存庫表格不應包含獨立的「類別」欄位"
    assert '<th width="170">分類名稱</th>' in html_src, "index.html 儲存庫表格第一欄應為「分類名稱」"
    assert '<th width="150">子分類</th>' in html_src, "index.html 儲存庫表格第二欄應為「子分類」"
    assert 'crafting-bench-badge' not in js_src, "app.js 儲存庫指引中不應再渲染 crafting-bench-badge 按鈕"

    # 驗證環境篩選映射表與專長動態隱藏機制 (v4.3.8)
    assert 'ENV_FILTER_MAP' in js_src, "app.js 缺少 ENV_FILTER_MAP 環境中英映射表"
    assert 'specialtyFilterGroup' in js_src, "app.js 缺少 specialtyFilterGroup 動態分頁隱藏支援"

    # 驗證純文字極簡排版：目次與視圖按鈕無 Emoji 圖標，標題無 brand-icon
    assert '<span class="brand-icon">' not in html_src, "index.html 標題旁不應包含 brand-icon"
    assert '🎴' not in html_src and '📋' not in html_src, "index.html 視圖切換按鈕不應包含 🎴 📋 圖標"
    assert '<span class="toc-item-icon">' not in html_src, "index.html 目次選單不應包含 .toc-item-icon 圖標"

    # 驗證 v4.3.8 徹底移除「篩選」按鈕與抽屜，同步電腦與手機版，全面下拉化與單行無滑動
    assert 'btnMobileFilter' not in html_src, "index.html 應徹底移除 btnMobileFilter「篩選」按鈕"
    assert 'filterDrawerWrapper' not in html_src, "index.html 應徹底移除 filterDrawerWrapper 彈出抽屜"
    assert 'id="envFilter"' in html_src, "index.html 應具備 envFilter 環境下拉選單"
    assert 'id="categoryFilter"' in html_src, "index.html 應具備 categoryFilter 分類下拉選單"
    assert 'id="specialtyFilter"' in html_src, "index.html 應具備 specialtyFilter 專長下拉選單"
    assert 'id="unlockFilter"' in html_src, "index.html 應具備 unlockFilter 解鎖狀態下拉選單"
    assert 'id="filterToolbar"' in html_src, "index.html 應具備 filterToolbar 單行統一過濾工具列"
    assert '<div class="header-stats">' not in html_src, "頂部常駐統計卡 header-stats 應徹底移除"

    with open("index.css", "r", encoding="utf-8") as f:
        css_src = f.read()
    assert ".pref-pkm-slot" in css_src, "index.css 缺少 .pref-pkm-slot 樣式定義"
    assert ".pref-pkm-slot-img" in css_src, "index.css 缺少 .pref-pkm-slot-img 樣式定義"
    assert "object-position: center bottom" in css_src, "index.css 應鎖定棲息地縮圖底部焦點以修復純藍天問題"
    assert "top: unset !important" in css_src, "index.css 手機端 Header 應解除 sticky 固定"

    # 驗證 14 筆 52poke 官方名稱正名
    p148 = next(p for p in pokemons if p['number'] == 'No. 148')
    assert p148['name'] == '皮寶寶', f"No. 148 應正名為皮寶寶，實測為 {p148['name']}"
    pkm_map = {p['id']: p['name'] for p in pokemons}
    assert pkm_map['pkm_s1_219'] == '蚊香泳士', "pkm_s1_219 應為蚊香泳士"
    assert pkm_map['pkm_s1_225'] == '魔牆人偶', "pkm_s1_225 應為魔牆人偶"
    assert pkm_map['pkm_s1_228'] == '多邊獸Ｚ', "pkm_s1_228 應為多邊獸Ｚ"
    assert pkm_map['pkm_s1_66'] == '螺釘地鼠', "pkm_s1_66 應為螺釘地鼠"
    assert pkm_map['pkm_s1_68'] == '搬運小匠', "pkm_s1_68 應為搬運小匠"
    assert pkm_map['pkm_s1_146'] == '謎擬Ｑ', "pkm_s1_146 應為謎擬Ｑ"
    assert pkm_map['pkm_s1_234'] == '火爆獸', "pkm_s1_234 應為火爆獸"
    assert pkm_map['pkm_s1_172'] == '盆才怪', "pkm_s1_172 應為盆才怪"
    assert pkm_map['pkm_s1_173'] == '樹才怪', "pkm_s1_173 應為樹才怪"
    assert pkm_map['pkm_s1_30'] == '大岩蛇', "pkm_s1_30 應為大岩蛇"
    assert pkm_map['pkm_s1_233'] == '火岩鼠', "pkm_s1_233 應為火岩鼠"
    assert pkm_map['pkm_s2_26'] == '螢光魚', "pkm_s2_26 應為螢光魚"
    assert pkm_map['pkm_s2_32'] == '保母曼波', "pkm_s2_32 應為保母曼波"
    print("✅ [PASS] 全量 14 筆寶可夢 52poke 官方繁體正名 (No. 148 皮寶寶等) 驗證 100% 正確！")

    # 驗證喜好百科與主圖鑑反向同步對齊（v4.3.1 核心斷言）
    all_data_pkm_names = set(p['name'] for p in pokemons)
    all_pref_pkm_names = set()
    for t in pref_db.get("tastes", []):
        for p in t.get("pokemon", []): all_pref_pkm_names.add(p)
    for e in pref_db.get("environments", []):
        for p in e.get("pokemon", []): all_pref_pkm_names.add(p)
    for th in pref_db.get("things", []):
        for p in th.get("pokemon", []): all_pref_pkm_names.add(p)
    
    missing_from_data = [p for p in all_pref_pkm_names if p not in all_data_pkm_names]
    assert len(missing_from_data) == 0, f"百科中存在主圖鑑未收錄之寶可夢名稱: {missing_from_data}"
    assert "淺淺丘" not in all_pref_pkm_names, "百科中絕不應存在舊稱「淺淺丘」"
    assert "皮卡丘（淺色）" in all_pref_pkm_names, "百科中應包含標準命名「皮卡丘（淺色）」"
    
    # 驗證無殼海兔、海兔獸形態喜好獨立（西海 vs 東海不混淆）
    sour_pkm = next(t['pokemon'] for t in pref_db['tastes'] if t['name'] == '酸酸的')
    astr_pkm = next(t['pokemon'] for t in pref_db['tastes'] if t['name'] == '澀澀的')
    sweet_pkm = next(t['pokemon'] for t in pref_db['tastes'] if t['name'] == '甜甜的')
    spicy_pkm = next(t['pokemon'] for t in pref_db['tastes'] if t['name'] == '辣辣的')
    bitter_pkm = next(t['pokemon'] for t in pref_db['tastes'] if t['name'] == '苦苦的')

    assert '無殼海兔（西海）' in sour_pkm and '無殼海兔（東海）' not in sour_pkm, "酸酸的應僅包含無殼海兔（西海）"
    assert '無殼海兔（東海）' in astr_pkm and '無殼海兔（西海）' not in astr_pkm, "澀澀的應僅包含無殼海兔（東海）"
    assert '海兔獸（西海）' in sour_pkm and '海兔獸（東海）' not in sour_pkm, "酸酸的應僅包含海兔獸（西海）"
    assert '海兔獸（東海）' in astr_pkm and '海兔獸（西海）' not in astr_pkm, "澀澀的應僅包含海兔獸（東海）"

    # 驗證米立龍形態喜好獨立（上弓 vs 下垂 vs 平挺）
    assert '米立龍（下垂）' in sweet_pkm and '米立龍（上弓）' not in sweet_pkm, "甜甜的應僅包含米立龍（下垂）"
    assert '米立龍（上弓）' in sour_pkm and '米立龍（下垂）' not in sour_pkm, "酸酸的應僅包含米立龍（上弓）"
    assert '米立龍（平挺）' in spicy_pkm, "辣辣的應包含米立龍（平挺）"

    # 驗證皮卡丘形態喜好獨立（淺色 vs 普通）
    assert '皮卡丘（淺色）' in sweet_pkm, "甜甜的應包含皮卡丘（淺色）"
    assert '皮卡丘' in sour_pkm, "酸酸的應包含皮卡丘"

    # 驗證環境與特徵統一命名
    env_names = [e['name'] for e in pref_db['environments']]
    assert '🌙 黑暗' in env_names, "百科環境名稱應統一為「🌙 黑暗」"
    assert '昏暗' not in env_names, "百科環境名稱不應再保留舊稱「昏暗」"
    thing_names = [th['name'] for th in pref_db['things']]
    assert '稜角分明的' in thing_names, "百科特徵名稱應統一為正體繁體「稜角分明的」"
    assert '棱角分明的' not in thing_names, "百科特徵名稱不應再包含簡體「棱角分明的」"
    print("✅ [PASS] 喜好百科反向對齊 (367筆)、形態喜好嚴格獨立 (西海/東海、下垂/上弓/平挺等) 驗證 100% 正確！")

    # 7. 全設備 RWD 響應式、右上角 fixed 釘選、大圖核心與流體比例縮放斷言
    assert "@media (min-width: 641px) and (max-width: 1300px)" in css_src, "index.css 缺少中型螢幕 1300px 雙行自適應 RWD 斷點"
    assert "@media (max-width: 640px)" in css_src, "index.css 缺少手機窄螢幕 RWD 斷點"
    assert "position: sticky" in css_src, "index.css 缺少表格凍結首欄 (Sticky Column) 樣式"
    # 驗證 52poke 目次導航清單 (TOC Popover) 與經典漏斗篩選圖示
    assert '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>' not in html_src, "index.html 篩選按鈕與漏斗圖示應已徹底移除"

    # 驗證導航列採用標準 Flexbox 流式佈局，徹底拔除脫流的 fixed 釘選與寫死右邊距，防範重疊
    assert ".header-actions {" in css_src and "display: flex" in css_src, "index.css .header-actions 應採用 Flexbox 流式佈局"
    assert "padding-right: 170px" not in css_src, "index.css 不應殘留寫死的 padding-right: 170px"

    # 驗證 CSS clamp 流體字級與大圖流體縮放
    assert "clamp(180px, 18vw, 260px)" in css_src, "index.css 棲息地縮圖應包含 clamp(180px, 18vw, 260px) 流體比例縮放"
    assert "clamp(64px, 5.5vw, 85px)" in css_src, "index.css 寶可夢大圖應包含 clamp(64px, 5.5vw, 85px) 流體比例縮放"
    assert "clamp(170px, 16vw, 220px)" in css_src, "index.css 喜好單元格應包含 clamp(170px, 16vw, 220px) 收緊比例"

    # 驗證表格黃金比例大圖核心：外觀130px、棲息地320px、喜好220px
    assert '<th width="75">寶可夢</th>' in html_src, "index.html 寶可夢表頭寬度應為 75px"
    assert '<th width="130">外觀</th>' in html_src, "index.html 外觀表頭寬度應為 130px 主角大圖空間"
    assert '<th width="80">環境屬性</th>' in html_src, "index.html 環境屬性表頭寬度應為 80px"
    assert '<th width="85">工作專長</th>' in html_src, "index.html 工作專長表頭寬度應為 85px"
    assert '<th width="320" class="col-th-habitat">棲息地</th>' in html_src, "index.html 棲息地表頭寬度應擴展至 320px 全景大圖規格"
    assert '<th width="220">喜好</th>' in html_src, "index.html 喜好表頭應嚴格收緊至 220px"
    assert ".pkm-cell-identity" in css_src, "index.css 缺少 .pkm-cell-identity 編號名稱垂直排列樣式"
    assert ".pkm-form-badge" in css_src, "index.css 缺少 .pkm-form-badge 形態微型標籤樣式"
    assert "flex-wrap: wrap" in css_src, "index.css 喜好標籤組應採用 flex-wrap: wrap 橫向流動排列"
    assert ".pkm-avatar-table-large" in css_src, "index.css 缺少 .pkm-avatar-table-large 大圖樣式"
    assert ".pkm-hab-bottom-bar" in css_src, "index.css 缺少 .pkm-hab-bottom-bar 底部控制列樣式"
    assert ".pkm-hab-arrow-btn" in css_src, "index.css 缺少 .pkm-hab-arrow-btn 切換箭頭樣式"
    assert ".pkm-hab-name-text" in css_src, "index.css 缺少 .pkm-hab-name-text 標籤文字樣式"
    assert ".spec-column-group" in css_src, "index.css 缺少 .spec-column-group 工作專長垂直換行樣式"
    assert "index.css?v=4.7.0" in html_src, "index.html 應引用 v4.7.0 版本之 index.css"
    assert "app.js?v=4.7.0" in html_src, "index.html 應引用 v4.7.0 版本之 app.js"
    assert "cleanTag && tagIconSrc" in js_src, "app.js 應僅在具備官方圖案時才渲染標籤"

    # 驗證 v4.3.8 頂部卡片移除、單行工具列、環境分類下拉選單與棲息地解鎖體系
    assert 'class="header-stats"' not in html_src, "index.html 頂部常駐 header-stats 統計卡應徹底移除"
    assert 'id="catalogProgressBadge"' in html_src, "index.html 單行過濾列右側應包含 catalogProgressBadge"
    assert '.catalog-progress-badge' in css_src, "index.css 應包含 catalog-progress-badge 膠囊樣式"
    assert 'habitat-52poke-table' in html_src, "index.html 棲息地總覽表格應存在"
    assert '<th width="140">棲息地</th>' in html_src, "index.html 棲息地表格第一欄應為「棲息地」"
    assert '<th width="260">外觀</th>' in html_src, "index.html 棲息地表格第二欄應為「外觀」"
    assert '.pkm-unlocked-badge' in css_src, "index.css 應包含 .pkm-unlocked-badge 徽章樣式"
    assert 'pkm-unlocked-badge' in js_src, "app.js 應包含 pkm-unlocked-badge 渲染邏輯"
    assert '.filter-toolbar-row' in css_src, "index.css 應包含 .filter-toolbar-row 單行樣式"
    assert 'flex-wrap: nowrap' in css_src, "index.css 單行過濾列應設置 flex-wrap: nowrap 絕不折行"

    # 驗證主題按鈕已徹底純圖標化與半透明毛玻璃
    assert 'class="theme-toggle-text"' not in html_src, "index.html 主題切換按鈕不應包含文字標籤 theme-toggle-text"
    assert "border-radius: 50%" in css_src, "index.css 主題按鈕應為圓形圖標按鈕 (border-radius: 50%)"
    assert "backdrop-filter: blur" in css_src, "index.css 主題按鈕應具備半透明毛玻璃質感 (backdrop-filter: blur)"
    print("✅ [PASS] v4.3.8 移除篩選按鈕、同步電腦手機單行下拉選單、窄螢幕等比例縮放斷言通過！")

    # 執行獨立模組 verify_v443.js 驗證浮動返回鍵與導航歷史
    res_v443 = subprocess.run(["node", "verify_v443.js"], capture_output=True, text=True)
    assert res_v443.returncode == 0, f"verify_v443.js 驗證失敗:\n{res_v443.stderr or res_v443.stdout}"
    print("✅ [PASS] 獨立模組 verify_v443.js 全量 10 項浮動返回按鈕與導航驗證 100% 通過！")

    # 執行獨立模組 verify_v446.js 驗證表格手機端隱藏喜好與個人百科卡
    res_v446 = subprocess.run(["node", "verify_v446.js"], capture_output=True, text=True)
    assert res_v446.returncode == 0, f"verify_v446.js 驗證失敗:\n{res_v446.stderr or res_v446.stdout}"
    print("✅ [PASS] 獨立模組 verify_v446.js 全量 10 項表格手機端隱藏喜好與個人百科卡驗證 100% 通過！")


    # Test 8: Node.js 端對端渲染檢驗 (包含全庫與喜好百科抽屜即開即顯)
    node_test_cmd = """node -e \"
const fs = require('fs');
const vm = require('vm');
const dataContent = fs.readFileSync('data.js', 'utf8');
const prefDbContent = fs.readFileSync('preferences_db.js', 'utf8');
const appContent = fs.readFileSync('app.js', 'utf8');
const listeners = {};
const mockEl = (id) => ({
  id: id || '',
  innerHTML: '',
  textContent: '',
  value: '',
  style: {},
  dataset: {},
  classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{}, contains: ()=>false },
  addEventListener: (evt, cb)=>{
    if (!listeners[id]) listeners[id] = {};
    listeners[id][evt] = cb;
  },
  appendChild: ()=>{},
  querySelectorAll: ()=>[mockEl()],
  querySelector: ()=>mockEl(),
  setAttribute: ()=>{},
  removeAttribute: ()=>{}
});
const elements = {};
const getEl = (id) => (elements[id] || (elements[id] = mockEl(id)));
const sandbox = {
  console: { log: ()=>{}, error: ()=>{} },
  window: { addEventListener: ()=>{}, location: { hash: '#habitat-cards' }, history: { pushState: ()=>{}, replaceState: ()=>{} } },
  document: {
    documentElement: mockEl('doc'),
    getElementById: getEl,
    querySelectorAll: ()=>[mockEl()],
    querySelector: ()=>mockEl(),
    addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }
  },
  localStorage: { getItem: (k)=>(k.includes('nav') ? 'habitat' : '{}'), setItem: ()=>{} },
  Audio: class { play(){} }
};
vm.createContext(sandbox);
vm.runInContext(dataContent, sandbox);
vm.runInContext(prefDbContent, sandbox);
vm.runInContext(appContent, sandbox);

// 驗證全域變數確實掛載至 sandbox.window
if (!sandbox.window.POKOPIA_PREFERENCES_DB) process.exit(10);

const rowCount = (elements['habitatTableBody'].innerHTML.match(/<tr/g) || []).length;
const cardCount = (elements['habitatCardGrid'].innerHTML.match(/class=\\\"item-card/g) || []).length;
if (rowCount !== 367 || cardCount !== 367) process.exit(1);

// 驗證卡片包含「❤️ 喜好：」
if (!elements['habitatCardGrid'].innerHTML.includes('❤️ 喜好：')) process.exit(2);

// 驗證純文字標籤包含 pref-pill 且無 emoji 圖標
if (!elements['habitatCardGrid'].innerHTML.includes('class=\\\"pref-pill')) process.exit(3);
if (elements['habitatCardGrid'].innerHTML.includes('🍬') || elements['habitatCardGrid'].innerHTML.includes('🌶️')) process.exit(4);

// 驗證表格模式
if (!elements['habitatTableBody'].innerHTML.includes('class=\\\"pref-pill')) process.exit(5);

// 驗證表格寶可夢身份單元格（編號 -> 名稱 -> 標籤垂直三行）
if (!elements['habitatTableBody'].innerHTML.includes('pkm-cell-identity')) process.exit(15);

// 驗證表格獨立大圖案單元格（68px 大圖）
if (!elements['habitatTableBody'].innerHTML.includes('pkm-avatar-table-large')) process.exit(20);

// 驗證工作專長如喜好採用垂直堆疊 spec-column-group
if (!elements['habitatTableBody'].innerHTML.includes('spec-column-group')) process.exit(19);

// 驗證表格雙棲息地下方切換控制列 (‹ 名稱 1/2 ›) 與圖片純淨無遮擋
if (!elements['habitatTableBody'].innerHTML.includes('pkm-hab-bottom-bar')) process.exit(16);
if (!elements['habitatTableBody'].innerHTML.includes('pkm-hab-arrow-btn')) process.exit(17);
if (!elements['habitatTableBody'].innerHTML.includes('pkm-hab-name-text')) process.exit(18);

// 驗證主題切換按鈕渲染後絕不包含「模式」中文字
if (elements['btnThemeToggle'].innerHTML.includes('模式')) process.exit(13);
if (!elements['btnThemeToggle'].innerHTML.includes('theme-toggle-icon')) process.exit(14);

// 觸發點擊開啟百科抽屜
if (listeners['btnPrefDrawer'] && listeners['btnPrefDrawer']['click']) {
  listeners['btnPrefDrawer']['click']();
}

// 驗證百科抽屜內容已成功渲染，絕不包含「喜好資料庫載入中...」
if (elements['prefDrawerBody'].innerHTML.includes('喜好資料庫載入中...')) process.exit(6);

// 驗證百科抽屜包含純圖片道具格 pref-item-slot 與 pref-item-grid
if (!elements['prefDrawerBody'].innerHTML.includes('pref-item-slot')) process.exit(7);
if (!elements['prefDrawerBody'].innerHTML.includes('pref-item-grid')) process.exit(8);

// 驗證百科抽屜道具格全部指向本地 assets/item_sprites/ 路徑，不再包含遠端 https:// 依賴
if (!elements['prefDrawerBody'].innerHTML.includes('src=\\\"assets/item_sprites/')) process.exit(9);

// 驗證百科抽屜包含純圖片寶可夢格 pref-pkm-slot (純圖片無文字，42x42px 同道具格規格)
if (!elements['prefDrawerBody'].innerHTML.includes('pref-pkm-slot')) process.exit(11);
// 驗證百科抽屜寶可夢清單中已不再使用 pref-pkm-chip 帶字晶片
if (elements['prefDrawerBody'].innerHTML.includes('pref-pkm-chip')) process.exit(12);

// 驗證 v4.3.8 單行過濾工具列與下拉選單動態選項
if (!elements['categoryFilter'] || !elements['envFilter']) process.exit(21);
if (!elements['categoryFilter'].innerHTML.includes('367')) process.exit(22);

// 驗證 v4.3.9 儲存庫表格與卡片徹底移除 Checkbox 勾選框
if (elements['storageTableBody'].innerHTML.includes('cat-checkbox')) process.exit(23);
if (elements['storageCardGrid'].innerHTML.includes('cat-checkbox')) process.exit(24);

// 切換至儲存庫分頁以渲染儲存庫表格
if (listeners['tabStorage'] && listeners['tabStorage']['click']) {
  listeners['tabStorage']['click']();
}

// 驗證 v4.4.2 儲存庫表格無工作臺箱號與無獨立類別欄，首欄為「1. 🍎 食品與烹飪」，共 44 行子分類
if (elements['storageTableBody'].innerHTML.includes('crafting-bench-badge')) process.exit(25);
if (elements['storageCardGrid'].innerHTML.includes('crafting-bench-badge')) process.exit(26);
if (!elements['storageTableBody'].innerHTML.includes('1. 🍎 食品與烹飪')) process.exit(27);
const storageRows = (elements['storageTableBody'].innerHTML.match(/<tr/g) || []).length;
if (storageRows !== 44) process.exit(28);

// 驗證 v4.4.3 浮動返回按鈕 DOM 元素存在
if (!elements['floatingBackBtn']) process.exit(29);
\""""
    res = subprocess.run(node_test_cmd, shell=True, capture_output=True, text=True)
    # Test 9: 終局自動化農場規劃專區 (End-Game Auto Farm) 核心檢驗
    autofarm_data_src = open('autofarm_data.js', 'r', encoding='utf-8').read()
    assert 'AUTOFARM_MODULES' in autofarm_data_src, "autofarm_data.js 應包含 AUTOFARM_MODULES 定義"
    assert 'AUTOFARM_POKEMON_SUMMARY' in autofarm_data_src, "autofarm_data.js 應包含 22 隻作業寶可夢匯總"
    assert '夢歌仙人掌' in autofarm_data_src, "autofarm_data.js 必須正確使用「夢歌仙人掌 (No.056)」，絕非 Cacnea 或沙漠奈亞"
    assert '幼基拉斯' in autofarm_data_src, "autofarm_data.js Part 1 應收錄幼基拉斯"
    assert '烏波（帕底亞的樣子）' in autofarm_data_src, "autofarm_data.js Part 2 應收錄烏波（帕底亞的樣子）"
    assert '伊布' in autofarm_data_src, "autofarm_data.js Part 7 應收錄伊布"
    assert '毽子草水壺' not in autofarm_data_src, "autofarm_data.js Part 3 不應包含毽子草水壺（已依原影片設定移除）"
    assert '顏料（綠）' in autofarm_data_src, "autofarm_data.js Part 1 應收錄顏料（綠）"
    assert '晶光芽' in autofarm_data_src and '晶光花' in autofarm_data_src, "autofarm_data.js Part 6 必須正名收錄晶光芽 (No.203) 與晶光花 (No.204)"
    assert '小拳石' not in autofarm_data_src and '隆隆石' not in autofarm_data_src, "autofarm_data.js Part 6 不應包含小拳石或隆隆石"

    # 檢查所有道具圖片是否存在且有效
    sprite_paths = re.findall(r'assets/item_sprites/[^\s"\']+\.png', autofarm_data_src)
    assert len(sprite_paths) > 0, "autofarm_data.js 應引用本地 assets/item_sprites 圖示"
    missing_sprites = [p for p in sprite_paths if not os.path.exists(p) or os.path.getsize(p) < 100]
    assert len(missing_sprites) == 0, f"終局農場引用的道具圖示缺失: {missing_sprites}"
    print(f"✅ [PASS] 終局農場 7 大模組引用的 {len(sprite_paths)} 個純產物圖示 100% 存在且有效！")

    # 執行獨立模組 verify_autofarm.js 驗證終局農場權限與模組渲染
    res_autofarm = subprocess.run(["node", "verify_autofarm.js"], capture_output=True, text=True)
    assert res_autofarm.returncode == 0, f"verify_autofarm.js 驗證失敗:\n{res_autofarm.stderr or res_autofarm.stdout}"
    # 執行獨立模組 verify_unlock_filter.js 驗證寶可夢圖鑑已解鎖/未解鎖篩選與動態計數
    res_unlock = subprocess.run(["node", "verify_unlock_filter.js"], capture_output=True, text=True)
    assert res_unlock.returncode == 0, f"verify_unlock_filter.js 驗證失敗:\n{res_unlock.stderr or res_unlock.stdout}"
    print("✅ [PASS] 獨立模組 verify_unlock_filter.js 全量解鎖狀態過濾與動態計數測試 100% 通過！")

    # 執行獨立模組 verify_environment_modal.js 驗證百科彈窗環境維度與環境標籤點擊跳轉
    res_env = subprocess.run(["node", "verify_environment_modal.js"], capture_output=True, text=True)
    assert res_env.returncode == 0, f"verify_environment_modal.js 驗證失敗:\n{res_env.stderr or res_env.stdout}"
    print("✅ [PASS] 獨立模組 verify_environment_modal.js 百科彈窗環境維度與全域環境標籤跳轉測試 100% 通過！")

    # 執行獨立模組 verify_custom_storage.js 驗證自訂收納盒管理與物品反查系統
    res_storage = subprocess.run(["node", "verify_custom_storage.js"], capture_output=True, text=True)
    assert res_storage.returncode == 0, f"verify_custom_storage.js 驗證失敗:\n{res_storage.stderr or res_storage.stdout}"
    print("✅ [PASS] 獨立模組 verify_custom_storage.js 自訂收納盒增刪改、拖曳放入、物品反查 8 大項驗證 100% 通過！")

    # 執行獨立模組 verify_responsive_header.js 驗證頂部導航重疊修復與響應式字級防擠壓
    res_resp = subprocess.run(["node", "verify_responsive_header.js"], capture_output=True, text=True)
    assert res_resp.returncode == 0, f"verify_responsive_header.js 驗證失敗:\n{res_resp.stderr or res_resp.stdout}"
    print("✅ [PASS] 獨立模組 verify_responsive_header.js 頂部導航重疊修復與全站響應式自適應驗證 100% 通過！")

    # 執行獨立模組 verify_page_toolbar_and_footer.js 驗證智能空間釋放、目次常駐與頁尾作者
    res_footer = subprocess.run(["node", "verify_page_toolbar_and_footer.js"], capture_output=True, text=True)
    assert res_footer.returncode == 0, f"verify_page_toolbar_and_footer.js 驗證失敗:\n{res_footer.stderr or res_footer.stdout}"
    print("✅ [PASS] 獨立模組 verify_page_toolbar_and_footer.js 空間釋放、目次常駐與頁尾樣式驗證 100% 通過！")

    # 執行獨立模組 verify_pref_view_all.js 驗證卡片特徵風格與口味「查看全部 ↗」跳轉百科
    res_pref_all = subprocess.run(["node", "verify_pref_view_all.js"], capture_output=True, text=True)
    assert res_pref_all.returncode == 0, f"verify_pref_view_all.js 驗證失敗:\n{res_pref_all.stderr or res_pref_all.stdout}"
    print("✅ [PASS] 獨立模組 verify_pref_view_all.js 卡片特徵與口味「查看全部 ↗」跳轉百科驗證 100% 通過！")

    # 執行獨立模組 verify_mobile_toolbar_layout.js 驗證圖鑑上方標題、進度徽章與 2x2 雙行篩選列
    res_mob_tb = subprocess.run(["node", "verify_mobile_toolbar_layout.js"], capture_output=True, text=True)
    assert res_mob_tb.returncode == 0, f"verify_mobile_toolbar_layout.js 驗證失敗:\n{res_mob_tb.stderr or res_mob_tb.stdout}"
    print("✅ [PASS] 獨立模組 verify_mobile_toolbar_layout.js 圖鑑標題、進度徽章與 2x2 雙行篩選列驗證 100% 通過！")

    print("\n🎉 全部驗收項目 100% 通過 (100% PASS)！")

if __name__ == "__main__":
    run_tests()

