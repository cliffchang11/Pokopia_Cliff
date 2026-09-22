#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build Pokopia Preferences and Items Encyclopedia Database (preferences_db.js)
Sources: 52poke MediaWiki exports & Parsed HTML in scratch/
- scratch/喜欢的口味（Pokopia）.wiki
- scratch/喜歡的環境（Pokopia）.wiki
- scratch/喜歡的東西（Pokopia）.wiki
- scratch/物品列表（Pokopia）.wiki
- scratch/52poke_items_parsed.html (官方物品列表含全量 1438 Sprite 圖標)
"""

import re
import os
import json
import time
import urllib.parse

def preprocess_wiki_text(text):
    if not text:
        return ""
    def replace_zh_variant(match):
        content = match.group(1)
        hant_m = re.search(r'zh-han[tt]:([^;|}]+)', content)
        if hant_m:
            return hant_m.group(1).strip()
        tw_m = re.search(r'zh-tw:([^;|}]+)', content)
        if tw_m:
            return tw_m.group(1).strip()
        hans_m = re.search(r'zh-hans:([^;|}]+)', content)
        if hans_m:
            return hans_m.group(1).strip()
        if ';' in content:
            return content.split(';')[-1].split(':')[-1].strip()
        return content

    text = re.sub(r'-\{(.*?)\}-', replace_zh_variant, text)
    return text

def extract_template_item_name(template_body):
    """
    從 BagPokopia 或 bag 模板中精確提取物品標準繁體名稱
    BagPokopia: |圖片名稱|簡體名|繁體名|分類|yes
    bag: |名稱|gen=Pokopia|size=30px
    """
    parts = [p.strip() for p in template_body.split('|')]
    if len(parts) >= 3 and parts[2] and not parts[2].startswith('yes') and not parts[2].isdigit():
        return parts[2]
    return parts[0]

def clean_wiki_markup(text):
    if not text:
        return ""
    text = text.strip()
    if text.startswith('|'):
        text = text[1:].strip()
    text = re.sub(r'\[\[File:[^\]]+\]\]', '', text)
    text = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^\]]+)\]\]', r'\1', text)
    
    # 針對 BagPokopia / bag 提取標準物品名
    def _rep_bag(m):
        return extract_template_item_name(m.group(1))
    text = re.sub(r'\{\{[Bb]ag(?:Pokopia)?\|([^}]+)\}\}', _rep_bag, text)
    
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace("'''", "").replace("''", "")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_pokemon_names(text):
    names = []
    matches = re.findall(r'link=([^（#\]]+)', text)
    for m in matches:
        name = clean_wiki_markup(m.strip())
        if name and name not in names and name not in ['Pokémon Pokopia', 'Pokopia']:
            names.append(name)
    direct_matches = re.findall(r'\[\[[^\]|]*?([^\]|]+)（旁支系列）[^\]]*?\|([^\]]+)\]\]', text)
    for _, name in direct_matches:
        name = clean_wiki_markup(name.strip())
        if name and name not in names:
            names.append(name)
    return names

def parse_wiki_rows(table_wikitext):
    rows = []
    raw_rows = table_wikitext.split('|-')
    for raw in raw_rows:
        raw = raw.strip()
        if not raw or raw.startswith('{|') or raw.startswith('class="bgl'):
            continue
        cells = []
        cur_cell = []
        for line in raw.split('\n'):
            line_str = line.strip()
            if line_str.startswith('|') and not line_str.startswith('|}'):
                if cur_cell:
                    cells.append('\n'.join(cur_cell))
                    cur_cell = []
                cur_cell.append(line_str[1:].strip())
            elif cur_cell:
                cur_cell.append(line_str)
        if cur_cell:
            cells.append('\n'.join(cur_cell))
        if cells:
            rows.append(cells)
    return rows

# 1. 解析喜歡的口味 (Tastes)
def parse_tastes():
    with open('scratch/喜欢的口味（Pokopia）.wiki', 'r', encoding='utf-8') as f:
        wiki = preprocess_wiki_text(f.read())

    tastes = []
    snorlax_effects = {
        "甜甜的": {
            "effect": "會變得稍微／比較／相當容易找到遠古之物。",
            "levels": {
                "稍微容易": ["桃桃果", "豆子"],
                "比較容易": ["蘋野沙拉", "馬鈴薯漢堡排"],
                "相當容易": ["鬆軟麵包"]
            }
        },
        "酸酸的": {
            "effect": "商店會變得稍微／比較／相當容易出現好東西。",
            "levels": {
                "稍微容易": ["利木果", "番茄"],
                "比較容易": ["絲絲沙拉", "蘋野果麵包", "番茄漢堡排"],
                "相當容易": ["多滋湯"]
            }
        },
        "辣辣的": {
            "effect": "棲息地會稍微／比較／相當容易出現寶可夢。",
            "levels": {
                "稍微容易": ["成熟的紅蘿蔔"],
                "比較容易": ["麵包丁沙拉", "紅蘿蔔麵包", "電電湯", "藥膳湯"],
                "相當容易": ["熱騰騰的濃湯麵包"]
            }
        },
        "苦苦的": {
            "effect": "可以稍微／比較／相當容易發現稀有物品。",
            "levels": {
                "稍微容易": ["莓莓果", "馬鈴薯", "海藻"],
                "比較容易": ["海藻沙拉", "重製麵包", "海藻湯"],
                "相當容易": ["成熟滋味漢堡排"]
            }
        },
        "澀澀的": {
            "effect": "可以稍微／比較／相當容易遇到帶著稀有羽毛的寶可夢。",
            "levels": {
                "稍微容易": ["零餘果", "小麥", "成熟的蘑菇"],
                "比較容易": ["蘑菇漢堡排", "蘑菇湯"],
                "相當容易": ["搗搗沙拉"]
            }
        },
        "平淡無奇的": {
            "effect": "可以和寶可夢變得稍微／比較／相當要好。",
            "levels": {
                "稍微容易": ["蘋野果", "木子果"],
                "比較容易": ["原味沙拉", "原味麵包", "原味漢堡排", "原味湯"],
                "相當容易": ["多彩漢堡排"]
            }
        }
    }

    sec_m = re.search(r'==口味列表==\s*\{\|.*?\n(.*?)\|\}', wiki, re.S)
    if sec_m:
        rows = parse_wiki_rows(sec_m.group(1))
        for cols in rows:
            if not cols: continue
            name = clean_wiki_markup(cols[0])
            if name.startswith('!') or name in ['口味', '寶可夢', '食物', '']:
                continue
            if name in ['无', '無']:
                continue
            if name == '涩涩的': name = '澀澀的'
            
            poke_col = cols[1] if len(cols) > 1 else ""
            food_col = cols[2] if len(cols) > 2 else ""
            pokemon_list = extract_pokemon_names(poke_col)

            foods = []
            food_matches = re.findall(r'\{\{[Bb]ag(?:Pokopia)?\|([^}]+)\}\}', food_col)
            for f in food_matches:
                fname = extract_template_item_name(f)
                if fname and fname not in foods:
                    foods.append(fname)
            if not foods and food_col:
                foods = [clean_wiki_markup(x.strip()) for x in food_col.split('、') if clean_wiki_markup(x.strip())]

            snorlax_info = snorlax_effects.get(name, {})
            tastes.append({
                "name": name,
                "pokemonCount": len(pokemon_list),
                "pokemon": pokemon_list,
                "foods": foods,
                "snorlaxEffect": snorlax_info.get("effect", ""),
                "snorlaxLevels": snorlax_info.get("levels", {})
            })

    return tastes

# 2. 解析喜歡的環境 (Environments)
def parse_environments():
    with open('scratch/喜歡的環境（Pokopia）.wiki', 'r', encoding='utf-8') as f:
        wiki = preprocess_wiki_text(f.read())

    envs = []
    env_dim_map = {
        "明亮": "亮度",
        "昏暗": "亮度",
        "黑暗": "亮度",
        "溫暖": "溫度",
        "温暖": "溫度",
        "涼爽": "溫度",
        "凉爽": "溫度",
        "潮濕": "滋潤度",
        "潮湿": "滋潤度",
        "乾燥": "滋潤度",
        "干燥": "滋潤度"
    }

    sec_m = re.search(r'==环境列表==\s*\{\|.*?\n(.*?)\|\}', wiki, re.S)
    if sec_m:
        rows = parse_wiki_rows(sec_m.group(1))
        for cols in rows:
            if not cols: continue
            name = clean_wiki_markup(cols[0])
            if name.startswith('!') or name in ['环境', '環境', '寶可夢', '改善环境的物品', '']:
                continue
            if name == '凉爽': name = '涼爽'
            if name == '温暖': name = '溫暖'
            if name == '干燥': name = '乾燥'
            if name == '潮湿': name = '潮濕'

            poke_col = cols[1] if len(cols) > 1 else ""
            item_col = cols[2] if len(cols) > 2 else ""
            pokemon_list = extract_pokemon_names(poke_col)

            items = []
            item_matches = re.findall(r'\{\{[Bb]ag(?:Pokopia)?\|([^}]+)\}\}', item_col)
            for it in item_matches:
                iname = extract_template_item_name(it)
                if iname and iname not in items:
                    items.append(iname)
            if not items and item_col:
                raw_items = clean_wiki_markup(item_col).split('、')
                items = [clean_wiki_markup(x.strip()) for x in raw_items if clean_wiki_markup(x.strip())]

            dimension = env_dim_map.get(name, "一般")
            envs.append({
                "name": name,
                "dimension": dimension,
                "pokemonCount": len(pokemon_list),
                "pokemon": pokemon_list,
                "items": items
            })

    return envs

# 3. 解析喜歡的東西 (Things / Styles)
def parse_things():
    with open('scratch/喜歡的東西（Pokopia）.wiki', 'r', encoding='utf-8') as f:
        wiki = preprocess_wiki_text(f.read())

    sections = re.split(r'==\{\{Pokopiatag\|([^}]+)\}\}==', wiki)
    things = []
    for i in range(1, len(sections), 2):
        tag_name = clean_wiki_markup(sections[i].strip())
        content = sections[i+1]

        poke_sec = ""
        if '===宝可梦===' in content:
            poke_sec = content.split('===宝可梦===')[1].split('===')[0]
        elif '===寶可夢===' in content:
            poke_sec = content.split('===寶可夢===')[1].split('===')[0]
        pokemon_list = extract_pokemon_names(poke_sec)

        item_sec = ""
        if '===物品===' in content:
            item_sec = content.split('===物品===')[1].split('==')[0]
        items = []
        item_matches = re.findall(r'\{\{[Bb]ag(?:Pokopia)?\|([^}]+)\}\}', item_sec)
        for it in item_matches:
            iname = extract_template_item_name(it)
            if iname and iname not in items:
                items.append(iname)
        if not items and item_sec:
            raw_lines = clean_wiki_markup(item_sec).split('\n')
            for l in raw_lines:
                for chunk in re.split(r'[、,，|]', l):
                    c = chunk.strip()
                    if c and len(c) > 1 and c not in items:
                        items.append(c)

        things.append({
            "name": tag_name,
            "pokemonCount": len(pokemon_list),
            "pokemon": pokemon_list,
            "items": items
        })

    return things

# 4. 解析官方物品清單與 Sprite 圖片庫 (從 52poke 官方物品列表與 HTML 解析)
def parse_official_items_and_icons():
    with open('scratch/物品列表（Pokopia）.wiki', 'r', encoding='utf-8') as f:
        wiki_text = f.read()

    with open('scratch/52poke_items_parsed.html', 'r', encoding='utf-8') as f:
        html_text = f.read()

    # 1. 從 HTML 建立 60px/30px 官方 Sprite 圖片映射庫
    clean_tag = re.compile(r'<[^>]+>')
    img_map = {}
    for m in re.finditer(r'<tr[^>]*>\s*<td[^>]*>(.*?)</td>\s*<td[^>]*>(.*?)</td>', html_text, re.S):
        td0, td1 = m.group(1), m.group(2)
        src_m = re.search(r'data-loginonly-srcset=[\"\']([^\"\']+)[\"\']', td0)
        src = ''
        if src_m:
            src = src_m.group(1).split(',')[-1].strip().split(' ')[0]
        else:
            fb = re.search(r'src=[\"\']([^\"\']+)[\"\']', td0)
            if fb: src = fb.group(1)
        if src.startswith('//'): src = 'https:' + src
        
        # 匹配 Bag_..._Sprite.png (包含有/無 Pokopia)
        sp_m = re.search(r'Bag_(.+?)(?:_Pokopia)?_Sprite\.png', td0)
        if sp_m and src:
            raw_sp = urllib.parse.unquote(sp_m.group(1)).strip()
            img_map[raw_sp] = src
            img_map[raw_sp.replace('_', ' ')] = src
        
        td1_clean = clean_tag.sub('', td1).strip()
        if td1_clean and src:
            img_map[td1_clean] = src

    # 載入本地 Sprite 映射庫，全面轉為本地 assets/item_sprites/ 路徑
    url_to_local = {}
    if os.path.exists('assets/item_sprites/url_to_local.json'):
        with open('assets/item_sprites/url_to_local.json', 'r', encoding='utf-8') as f:
            url_to_local = json.load(f)

    def to_local(u):
        if not u: return ""
        return url_to_local.get(u, u)

    for k in list(img_map.keys()):
        img_map[k] = to_local(img_map[k])

    # 2. 解析 wiki 分類章節
    def get_hant(text):
        m = re.search(r'zh-han[tt]:([^;|}]+)', text)
        if m: return m.group(1).strip()
        m2 = re.search(r'zh-tw:([^;|}]+)', text)
        if m2: return m2.group(1).strip()
        return re.sub(r'-\{(.*?)\}-', r'\1', text).strip()

    sections = re.split(r'==\s*([^=]+?)\s*==', wiki_text)
    cat_items = {}
    item_icon_map = dict(img_map)

    for i in range(1, len(sections), 2):
        sec_title = get_hant(sections[i].strip())
        if sec_title in ['自然', '大自然']: sec_title = '大自然'
        if sec_title in ['不在收藏图鉴内的物品', '不在收藏圖鑑內的物品']: sec_title = '特別收錄'
        
        content = sections[i+1]
        rows = content.split('|-')
        for r in rows:
            r_str = r.strip()
            if not r_str or r_str.startswith('{|') or 'class="bgl' in r_str or '! style' in r_str:
                continue
            cells = [c.strip() for c in r_str.split('\n|') if c.strip()]
            if len(cells) >= 3:
                # cell 0: {{bag|...}}
                c0 = cells[0].lstrip('|').strip()
                bag_m = re.search(r'\{\{bag\|([^|}]+)', c0)
                bag_name = bag_m.group(1).strip() if bag_m else ''
                
                c1 = cells[1].strip()
                trad_name = get_hant(c1)
                
                c2 = cells[2].strip()
                desc = get_hant(c2)
                
                tag = cells[3].strip() if len(cells) > 3 else ''
                if tag in ['N/A', '無', '']: tag = ''
                
                final_name = trad_name or bag_name
                # 尋找官方 Sprite
                icon = img_map.get(final_name) or img_map.get(bag_name) or img_map.get(bag_name.replace('_', ' ')) or ''
                
                if sec_title not in cat_items:
                    cat_items[sec_title] = []
                
                cat_items[sec_title].append({
                    'name': final_name,
                    'icon': icon,
                    'description': desc,
                    'tag': tag
                })
                
                if icon:
                    item_icon_map[final_name] = icon
                    if bag_name:
                        item_icon_map[bag_name] = icon
                        item_icon_map[bag_name.replace('_', ' ')] = icon

    # 別名與精準對照補強
    alias_dict = {
        "庭院桌子": "庭園桌子",
        "乾涸的貝殼土": "貝殼土",
        "不可燃垃圾 戶外": "不可燃垃圾",
        "空調": "空调",
        "♪~序曲~": "CD（紅／綠）",
        "♪真新鎮主題曲": "CD（紅／綠）",
        "♪大木研究所": "CD（紅／綠）",
        "♪往常青的道路": "CD（紅／綠）",
        "♪深灰市主題曲": "CD（紅／綠）",
        "♪寶可夢中心": "CD（紅／綠）",
        "♪月見山的洞窟": "CD（紅／綠）",
        "♪往華藍的道路": "CD（紅／綠）",
        "♪淺紅市主題曲": "CD（紅／綠）",
        "♪寶可夢道館": "CD（紅／綠）",
        "♪去找正輝": "CD（紅／綠）",
        "♪聖特安努號": "CD（紅／綠）",
        "♪火箭隊基地": "CD（紅／綠）",
        "♪西爾佛公司": "CD（紅／綠）",
        "♪對戰（VS道館館主）": "CD（紅／綠）",
        "♪互連洞": "CD（金／銀）",
        "♪緣朱市": "CD（金／銀）",
        "♪鈴鐺塔": "CD（金／銀）",
        "♪茵鬱市": "CD（紅寶石／藍寶石）",
        "♪琉璃市": "CD（紅寶石／藍寶石）",
        "♪華麗現場大賽！": "CD（紅寶石／藍寶石）",
        "♪209號道路（白天）": "CD（鑽石／珍珠）",
        "♪天冠山": "CD（鑽石／珍珠）",
        "♪遊戲城": "CD（鑽石／珍珠）",
        "♪帆巴市": "CD（黑／白）",
        "♪10號道路": "CD（黑／白）",
        "♪用物品盛裝打扮！": "CD（黑／白）",
        "♪映雪市": "CD（Ｘ／Ｙ）",
        "♪時裝店": "CD（Ｘ／Ｙ）",
        "♪超級訓練！": "CD（Ｘ／Ｙ）",
        "♪好奧樂市（白天）": "CD（太陽／月亮）",
        "♪以太樂園": "CD（太陽／月亮）",
        "♪究極大廈": "CD（太陽／月亮）",
        "♪曠野地帶：北": "CD（劍／盾）",
        "♪宮門市": "CD（劍／盾）",
        "♪洛茲大廈": "CD（劍／盾）",
        "♪戰鬥！道館館主：1": "CD（劍／盾）",
        "♪♪戰鬥！道館館主：1": "CD（劍／盾）",
        "♪戰鬥！道館館主：2": "CD（朱／紫）",
        "♪祝慶村": "CD（傳說 阿爾宙斯）",
        "♪南區": "CD（朱／紫）",
        "♪學院": "CD（朱／紫）",
        "♪第零區": "CD（朱／紫）",
        "水流柱子（14）": "水流柱子（1/4）"
    }
    for k, v in alias_dict.items():
        if v in item_icon_map:
            item_icon_map[k] = item_icon_map[v]
        elif k in item_icon_map:
            item_icon_map[v] = item_icon_map[k]

    return cat_items, item_icon_map

def apply_full_traditional(content):
    char_dict = {}
    phrase_dict = {}
    if os.path.exists('scripts/STCharacters.txt'):
        with open('scripts/STCharacters.txt', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                parts = line.split('\t')
                if len(parts) >= 2:
                    char_dict[parts[0]] = parts[1].split(' ')[0]
    if os.path.exists('scripts/STPhrases.txt'):
        with open('scripts/STPhrases.txt', 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'): continue
                parts = line.split('\t')
                if len(parts) >= 2:
                    phrase_dict[parts[0]] = parts[1].split(' ')[0]

    # 保全寶可夢官方專有名詞，嚴禁過度轉換
    custom_dict = {
        # 保持官方用字「床」（非「牀」）
        "床": "床",
        "圓木床鋪": "圓木床鋪",
        "新潮床鋪": "新潮床鋪",
        "樹果造型床": "樹果造型床",
        "可愛床鋪": "可愛床鋪",
        "電競床": "電競床",
        "木床鋪": "木床鋪",
        "自然風床鋪": "自然風床鋪",
        "客房床鋪": "客房床鋪",
        "古董床鋪": "古董床鋪",
        "工業風床鋪": "工業風床鋪",
        "豪華床鋪": "豪華床鋪",
        "自然風迷你床": "自然風迷你床",
        "度假風情床鋪": "度假風情床鋪",
        "鐵床鋪": "鐵床鋪",
        "精靈球造型床": "精靈球造型床",
        "度假風情吊床": "度假風情吊床",
        "乾草床鋪": "乾草床鋪",
        "瞌睡床鋪": "瞌睡床鋪",
        # 保持官方用字「岩」（非「巖」）
        "岩": "岩",
        "怪力岩": "怪力岩",
        "岩地的花": "岩地的花",
        "熾熱岩石": "熾熱岩石",
        "岩漿岩": "岩漿岩",
        "熱熱岩": "熱熱岩",
        "潮濕岩石": "潮濕岩石",
        "沙沙岩石": "沙沙岩石",
        "冰冷岩石": "冰冷岩石",
        "冷卻的熱熱岩": "冷卻的熱熱岩",
        "大岩蛇": "大岩蛇",
        # 保持官方用字「台」（非「檯」）
        "洗手台": "洗手台",
        "舞台": "舞台",
        "工作台": "工作台",
        "供品台": "供品台",
        "星形梳妝台": "星形梳妝台",
        # 保持官方專有名詞
        "樹才怪氣球": "樹才怪氣球",
        "樹才怪": "樹才怪",
        "吃剩的東西": "吃剩的東西",
        "麵包窯": "麵包窯",
        "神秘水滴": "神秘水滴",
        "枯萎的山岳草皮": "枯萎的山岳草皮",
        "山岳的草皮": "山岳的草皮",
        "雅致路燈": "雅致路燈",
        "雅致桌子": "雅致桌子",
        "庭院桌子": "庭園桌子",
        "庭園桌子": "庭園桌子",
        "乾涸的貝殼土": "貝殼土",
        "不可燃垃圾 戶外": "不可燃垃圾",
        "空调": "空调",
        "空調": "空调",
        "花篱": "花籬",
        "（长）": "（長）",
        "椅子（长）": "長椅",
        "树桩": "樹樁",
        "蘑菇台灯": "蘑菇檯燈",
        "庭园灯": "庭園燈",
        "庭园椅子": "庭園椅子",
        "路灯": "路燈",
        "书架": "書架",
        "手推车": "手推車",
        "平板货车": "平板貨車",
        "推车": "推車",
        "单枝花瓶": "單枝花瓶",
        "装盘的食物": "裝盤的食物",
        "时髦锅": "時髦鍋",
        "平底锅": "平底鍋",
        "沙滩遮阳伞": "沙灘遮陽傘",
        "沙滩椅": "沙灘椅",
        "晴雨飘浮泡泡": "晴雨飄浮泡泡",
        "树果野餐篮": "樹果野餐籃",
        "自然风储物柜": "自然風儲物櫃",
        "充气船": "充氣船",
        "掘山道具": "掘山道具",
        "钢骨": "鋼骨",
        "熔炉": "熔爐",
        "大宝箱": "大寶箱",
        "财宝": "財寶",
        "总是水润润": "總是水潤潤",
        "雅致沙发": "雅緻沙發",
        "细长蜡烛": "細長蠟燭",
        "储物柜": "儲物櫃",
        "垃圾桶": "垃圾桶",
        "傢俱": "家具",
        "家具": "家具",
        "宝可梦": "寶可夢",
        "喜欢的口味": "喜歡的口味",
        "喜欢的东西": "喜歡的東西",
        "喜欢的环境": "喜歡的環境",
        "物品列表": "物品列表",
        "涩涩的": "澀澀的",
        "平淡无奇的": "平淡無奇的",
        "干燥": "乾燥",
        "温暖": "溫暖",
        "凉爽": "涼爽",
        "潮湿": "潮濕",
        "昏暗": "昏暗",
        "明亮": "明亮",
        "能出声的": "能出聲的",
        "可爱的": "可愛的",
        "圆圆的": "圓圓的",
        "坚硬的": "堅硬的",
        "布制的": "布製的",
        "木制的": "木製的",
        "石制的": "石製的",
        "用于观赏的": "用於觀賞的",
        "电力驱动的": "電力驅動的",
        "看起来很难懂的": "看起來很難懂的",
        "群聚的": "群聚的",
        "能感受自然的": "能感受大自然的",
        "能感受风的": "能感受風的",
        "能治愈伤口的": "能治癒傷口的",
        "训练用的": "訓練用的",
        "象征的": "象徵的",
        "金属的": "金屬的"
    }
    phrase_dict.update(custom_dict)
    sorted_phrases = sorted(phrase_dict.keys(), key=lambda x: len(x), reverse=True)

    print("Applying phrases substitution to JSON string...")
    t0 = time.time()
    for phrase in sorted_phrases:
        if phrase in content:
            content = content.replace(phrase, phrase_dict[phrase])
    print(f"Phrases done in {time.time()-t0:.2f}s")

    # 移除單字轉換中會破壞官方標準用字之規則
    protected_chars = ['床', '岩', '才', '吃', '台', '岳', '秘', '麵']
    safe_char_dict = {k: v for k, v in char_dict.items() if ord(k) > 127 and ord(v) > 127 and k not in protected_chars and v not in ['牀', '巖', '纔', '喫', '檯', '嶽', '祕', '麪']}
    safe_table = str.maketrans(safe_char_dict)
    content = content.translate(safe_table)

    # 再次覆蓋確保不受任何單字轉換影響
    post_fixes = {
        "牀": "床",
        "巖": "岩",
        "纔": "才",
        "喫": "吃",
        "麪": "麵",
        "祕": "秘",
        "嶽": "岳",
        "&lt;寶可夢&gt;的禮物": "寶可夢的禮物"
    }
    for k, v in post_fixes.items():
        content = content.replace(k, v)

    return content

def main():
    print("Parsing Tastes...")
    tastes = parse_tastes()
    print(f"Parsed {len(tastes)} tastes: {[t['name'] for t in tastes]}")

    print("Parsing Environments...")
    environments = parse_environments()
    print(f"Parsed {len(environments)} environments: {[e['name'] for e in environments]}")

    print("Parsing Things...")
    things = parse_things()
    print(f"Parsed {len(things)} things.")

    print("Parsing Official Items Categories & Sprite Icons from 52poke...")
    items_by_category, item_icons_map = parse_official_items_and_icons()
    total_items = sum(len(v) for v in items_by_category.values())
    print(f"Parsed {len(items_by_category)} categories, total items: {total_items}")
    print(f"Total mapped Sprite icons: {len(item_icons_map)}")

    pref_db = {
        "tastes": tastes,
        "environments": environments,
        "things": things,
        "items": items_by_category,
        "itemIcons": item_icons_map
    }

    # 輸出 preferences_db.js
    output_path = "preferences_db.js"
    json_str = json.dumps(pref_db, ensure_ascii=False, indent=2)

    print("Converting full database to Traditional Chinese with official terminology protection...")
    json_str_trad = apply_full_traditional(json_str)

    js_content = "/**\n * Pokopia Preferences and Items Encyclopedia Database\n * Auto-generated from 52poke MediaWiki exports & Official Items HTML (100% Traditional Chinese)\n */\n"
    js_content += "var POKOPIA_PREFERENCES_DB = " + json_str_trad + ";\n"
    js_content += "if (typeof window !== 'undefined') {\n  window.POKOPIA_PREFERENCES_DB = POKOPIA_PREFERENCES_DB;\n}\n"
    js_content += "if (typeof module !== 'undefined' && module.exports) {\n  module.exports = { POKOPIA_PREFERENCES_DB };\n}\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Successfully generated {output_path}, file size: {os.path.getsize(output_path)} bytes.")

if __name__ == "__main__":
    main()
