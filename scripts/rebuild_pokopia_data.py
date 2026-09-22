import json
import re
import os

with open("data.js", "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r"window\.POKOPIA_DATA\s*=\s*(\{.*?\});\s*$", text, re.DOTALL)
if not m:
    print("Error: cannot parse data.js")
    exit(1)

data = json.loads(m.group(1))
cur_pokemons = data["pokemons"]
cur_habitats = data["habitats"]
cur_categories = data["categories"]

with open("scripts/52poke_pokemon_list_online.html", "r", encoding="utf-8") as f:
    html = f.read()

sections = re.split(r"<span class=\"mw-headline\" id=\"([^\"]+)\">(.*?)</span>", html)
cat_map = {
    "宝可梦图鉴": ("main", "主圖鑑"),
    "宝可梦图鉴（活动）": ("event", "活動"),
    "宝可梦图鉴（海底）": ("underwater", "海底")
}

online_list = []
for i in range(1, len(sections), 3):
    s_title = sections[i+1]
    if s_title not in cat_map:
        continue
    cat, cat_name = cat_map[s_title]
    s_content = sections[i+2]
    rows = re.findall(r"<tr>(.*?)</tr>", s_content, re.DOTALL)
    curr_no = ""
    for r in rows:
        tds = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.DOTALL)
        clean_tds = [re.sub(r"<[^>]+>", "", td).strip() for td in tds]
        if not clean_tds or clean_tds[0] in ["Pokopia编号", "编号"]:
            continue
        m_icon = re.search(r"sprite-icon-([A-Za-z0-9_]+)", r)
        icon_cls = m_icon.group(1) if m_icon else ""
        if clean_tds[0].isdigit():
            curr_no = clean_tds[0]
            nat_no = clean_tds[1]
            name = clean_tds[3]
        else:
            nat_no = clean_tds[0] if len(clean_tds) > 0 else ""
            name = clean_tds[1] if len(clean_tds) > 1 else ""
        online_list.append({
            "category": cat,
            "category_name": cat_name,
            "official_no": curr_no,
            "nat_no": nat_no,
            "name": name,
            "icon": icon_cls
        })

print(f"Parsed {len(online_list)} online items.")

# Special names dictionary for Traditional Chinese
ZH_TW_NAMES = {
    "0001": "妙蛙種子", "0002": "妙蛙草", "0003": "妙蛙花",
    "0004": "小火龍", "0005": "火恐龍", "0006": "噴火龍",
    "0007": "傑尼龜", "0008": "卡咪龜", "0009": "水箭龜",
    "0016": "波波", "0017": "比比鳥", "0018": "大比鳥",
    "0025": "皮卡丘", "0025Pe": "皮卡丘（淺色）", "0026": "雷丘",
    "0026A": "雷丘（阿羅拉的樣子）",
    "0039": "胖丁", "0040": "胖可丁",
    "0043": "走路草", "0044": "臭臭花", "0045": "霸王花",
    "0052": "喵喵", "0052A": "喵喵（阿羅拉的樣子）", "0052G": "喵喵（伽勒爾的樣子）",
    "0053": "貓老大", "0053A": "貓老大（阿羅拉的樣子）",
    "0054": "可達鴨", "0055": "哥達鴨",
    "0058": "卡蒂狗", "0058H": "卡蒂狗（洗翠的樣子）", "0059": "風速狗", "0059H": "風速狗（洗翠的樣子）",
    "0060": "蚊香蝌蚪", "0061": "蚊香君", "0062": "快泳蛙",
    "0069": "喇叭芽", "0070": "口呆花", "0071": "大食花",
    "0074": "小拳石", "0074A": "小拳石（阿羅拉的樣子）", "0075": "隆隆石", "0075A": "隆隆石（阿羅拉的樣子）", "0076": "隆隆岩", "0076A": "隆隆岩（阿羅拉的樣子）",
    "0077": "小火馬", "0077G": "小火馬（伽勒爾的樣子）", "0078": "烈焰馬", "0078G": "烈焰馬（伽勒爾的樣子）",
    "0079": "呆呆獸", "0079G": "呆呆獸（伽勒爾的樣子）", "0080": "呆殼獸", "0080G": "呆殼獸（伽勒爾的樣子）",
    "0090": "大舌貝", "0091": "刺甲貝",
    "0092": "鬼斯", "0093": "鬼斯通", "0094": "耿鬼",
    "0102": "蛋蛋", "0103": "椰蛋樹", "0103A": "椰蛋樹（阿羅拉的樣子）",
    "0104": "卡拉卡拉", "0105": "嘎啦嘎啦", "0105A": "嘎啦嘎啦（阿羅拉的樣子）",
    "0109": "瓦斯彈", "0110": "雙彈瓦斯", "0110G": "雙彈瓦斯（伽勒爾的樣子）",
    "0111": "獨角犀牛", "0112": "超甲狂犀",
    "0113": "吉利蛋", "0115": "袋獸",
    "0116": "墨海馬", "0117": "海刺龍", "0230": "刺龍王",
    "0120": "海星星", "0121": "寶石海星",
    "0122": "魔牆偶", "0122G": "魔牆偶（伽勒爾的樣子）",
    "0129": "鯉魚王", "0130": "暴鯉龍",
    "0131": "拉普拉斯", "0132": "百變怪",
    "0133": "伊布", "0134": "水伊布", "0135": "雷伊布", "0136": "火伊布",
    "0143": "卡比獸", "0143M": "卡比獸（萌苔）", "0446": "小卡比獸",
    "0144": "急凍鳥", "0144G": "急凍鳥（伽勒爾的樣子）", "0145": "閃電鳥", "0145G": "閃電鳥（伽勒爾的樣子）", "0146": "火焰鳥", "0146G": "火焰鳥（伽勒爾的樣子）",
    "0147": "迷你龍", "0148": "哈克龍", "0149": "快龍",
    "0150": "超夢", "0151": "夢幻",
    "0152": "菊草葉", "0153": "月桂葉", "0154": "大文字草",
    "0158": "小鋸鱷", "0159": "藍鱷", "0160": "大力鱷",
    "0170": "燈籠魚", "0171": "電燈怪",
    "0179": "咩利羊", "0180": "茸茸羊", "0181": "電龍",
    "0182": "美麗花",
    "0187": "毽子草", "0188": "毽子花", "0189": "毽子棉",
    "0194": "烏波", "0194P": "烏波（帕底亞的樣子）", "0195": "沼王",
    "0196": "太陽伊布", "0197": "月亮伊布",
    "0199": "呆呆王", "0199G": "呆呆王（伽勒爾的樣子）",
    "0213": "壺壺", "0214": "赫拉克羅斯",
    "0222": "太陽珊瑚", "0222G": "太陽珊瑚（伽勒爾的樣子）",
    "0258": "水躍魚", "0259": "沼躍魚", "0260": "巨沼怪",
    "0302": "勾魂眼",
    "0318": "利牙魚", "0319": "巨牙鯊",
    "0339": "泥泥鰍", "0340": "鯰魚王",
    "0341": "龍蝦小兵", "0342": "鐵螯龍蝦",
    "0349": "醜醜魚", "0350": "美納斯",
    "0370": "愛心魚",
    "0385": "基拉祈",
    "0418": "泳圈鼬", "0419": "浮潛鼬",
    "0422": "無殼海兔（西海）", "0422E": "無殼海兔（東海）",
    "0423": "海兔獸（西海）", "0423E": "海兔獸（東海）",
    "0456": "熒光魚", "0457": "霓虹魚",
    "0465": "巨蔓藤", "0465P": "巨蔓藤（博士）",
    "0470": "葉伊布", "0471": "冰伊布",
    "0489": "霏歐納", "0490": "瑪納霏",
    "0533": "鐵骨土人",
    "0592": "輕飄飄（雄性）", "0592F": "輕飄飄（雌性）",
    "0593": "胖嘟嘟（雄性）", "0593F": "胖嘟嘟（雌性）",
    "0594": "保姆曼波", "0618": "泥巴魚", "0618G": "泥巴魚（伽勒爾的樣子）",
    "0686": "好啦魷", "0687": "烏賊王",
    "0700": "仙子伊布",
    "0728": "球球海獅", "0729": "花漾海獅", "0730": "西獅海壬",
    "0747": "好壞星", "0748": "超壞星",
    "0767": "膽小蟲", "0768": "具甲武者",
    "0779": "磨牙彩皮魚", "0781": "破破舵輪",
    "0833": "咬咬龜", "0834": "暴噬龜",
    "0849": "顫弦蠑螈（高調）", "0849L": "顫弦蠑螈（低調）",
    "0871": "啪嚓海膽",
    "0957": "小鍛匠", "0958": "巧鍛匠", "0959S": "巨鍛匠",
    "0960": "海地鼠", "0961": "三海地鼠",
    "0976": "輕身鱈",
    "0978": "米立龍（上弓）", "0978D": "米立龍（下垂）", "0978S": "米立龍（平挺）",
    "0999": "索財靈", "1000": "賽富豪"
}

# Map existing pokemons by id
pkm_by_id = {p["id"]: p for p in cur_pokemons}

# Match online list items to existing pokemon records
# In our earlier check, cur_pokemons already has 367 items with IDs:
# pkm_s1_1 to pkm_s1_308 (main)
# pkm_s1_309 to pkm_s1_315 (event)
# pkm_s2_1 to pkm_s2_52 (underwater)

rebuilt_pokemons = []
for idx, onl in enumerate(online_list):
    cat = onl["category"]
    cat_name = onl["category_name"]
    off_no = onl["official_no"]
    icon = onl["icon"]
    
    # Target ID
    if cat == "main":
        target_id = f"pkm_s1_{idx + 1}"
    elif cat == "event":
        target_id = f"pkm_s1_{309 + (idx - 308)}"
    else:
        target_id = f"pkm_s2_{(idx - 315) + 1}"
    
    base_pkm = pkm_by_id.get(target_id, {})
    
    # Determine proper name
    name = ZH_TW_NAMES.get(icon)
    if not name:
        name = base_pkm.get("name", onl["name"])
        # Remove water emoji prefix if present for clean name
        name = name.replace("🌊 ", "").strip()
    
    new_pkm = dict(base_pkm)
    new_pkm["id"] = target_id
    new_pkm["category"] = cat
    new_pkm["categoryName"] = cat_name
    new_pkm["number"] = f"No. {off_no.zfill(3)}"
    new_pkm["raw_number"] = int(off_no) if off_no.isdigit() else 0
    new_pkm["order"] = idx
    new_pkm["name"] = name
    new_pkm["sprite"] = f"assets/pkm_sprites/pkm_icon_{icon}.webp"
    
    # Ensure specialties / environment
    if "specialties" not in new_pkm and "abilities" in new_pkm:
        new_pkm["specialties"] = new_pkm["abilities"]
    if "environment" not in new_pkm:
        new_pkm["environment"] = "☀️ 明亮"
    if "favorites" not in new_pkm:
        new_pkm["favorites"] = []
        
    rebuilt_pokemons.append(new_pkm)

print(f"Rebuilt {len(rebuilt_pokemons)} pokemons.")

# Rebuild habitats
rebuilt_habitats = []
for hab in cur_habitats:
    new_hab = dict(hab)
    oid = new_hab.get("official_id", "")
    
    # Category
    if oid.startswith("E"):
        new_hab["category"] = "event"
        new_hab["categoryName"] = "活動棲息地"
    elif oid.startswith("B") or oid.startswith("U"):
        new_hab["category"] = "underwater"
        new_hab["categoryName"] = "海底棲息地"
    else:
        new_hab["category"] = "main"
        new_hab["categoryName"] = "主棲息地"
        
    # Habitats corrections:
    # 028: 戴上大行李 (小鍛匠, 鐵骨土人, 巧鍛匠)
    if oid == "028":
        new_hab["pokemons"] = [
            {"id": "pkm_s1_276", "number": "No. 268", "name": "小鍛匠", "sprite": "assets/pkm_sprites/pkm_icon_0957.webp"},
            {"id": "pkm_s1_201", "number": "No. 201", "name": "鐵骨土人", "sprite": "assets/pkm_sprites/pkm_icon_0533.webp"},
            {"id": "pkm_s1_277", "number": "No. 269", "name": "巧鍛匠", "sprite": "assets/pkm_sprites/pkm_icon_0958.webp"}
        ]
    # 047: 樹蔭下熟睡的卡比獸 (小卡比獸, 普通卡比獸)
    elif oid == "047":
        new_hab["pokemons"] = [
            {"id": "pkm_s1_111", "number": "No. 106", "name": "小卡比獸", "sprite": "assets/pkm_sprites/pkm_icon_0446.webp"},
            {"id": "pkm_s1_113", "number": "No. 107", "name": "卡比獸", "sprite": "assets/pkm_sprites/pkm_icon_0143.webp"}
        ]
    # 048: 古色古香 (雙彈瓦斯, 普通卡比獸)
    elif oid == "048":
        new_hab["pokemons"] = [
            {"id": "pkm_s1_78", "number": "No. 076", "name": "雙彈瓦斯", "sprite": "assets/pkm_sprites/pkm_icon_0110.webp"},
            {"id": "pkm_s1_113", "number": "No. 107", "name": "卡比獸", "sprite": "assets/pkm_sprites/pkm_icon_0143.webp"}
        ]
    # 093: 美味的供品 (卡比獸（萌苔）)
    elif oid == "093":
        new_hab["pokemons"] = [
            {"id": "pkm_s1_112", "number": "No. 107", "name": "卡比獸（萌苔）", "sprite": "assets/pkm_sprites/pkm_icon_0143M.webp"}
        ]
    else:
        # Update sprite paths for pokemons inside this habitat
        updated_pkm_list = []
        for p in new_hab.get("pokemons", []):
            p_dict = dict(p)
            # Find in rebuilt_pokemons
            matched = [rp for rp in rebuilt_pokemons if rp["id"] == p_dict.get("id") or rp["name"] == p_dict.get("name")]
            if matched:
                rp = matched[0]
                p_dict["sprite"] = rp["sprite"]
                p_dict["number"] = rp["number"]
                p_dict["name"] = rp["name"]
            updated_pkm_list.append(p_dict)
        new_hab["pokemons"] = updated_pkm_list
        
    rebuilt_habitats.append(new_hab)

print(f"Rebuilt {len(rebuilt_habitats)} habitats.")

# Save new data.js
new_data = {
    "categories": cur_categories,
    "pokemons": rebuilt_pokemons,
    "habitats": rebuilt_habitats
}

with open("data.js", "w", encoding="utf-8") as f:
    f.write("// Pokopia 全系統資料庫\nwindow.POKOPIA_DATA = ")
    json.dump(new_data, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print("data.js successfully written!")
