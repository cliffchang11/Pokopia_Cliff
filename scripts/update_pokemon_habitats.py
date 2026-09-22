import json
import re
import urllib.parse

with open("data.js", "r", encoding="utf-8") as f:
    text = f.read()

m = re.search(r"window\.POKOPIA_DATA\s*=\s*(\{.*?\});\s*$", text, re.DOTALL)
if not m:
    print("Error parsing data.js")
    exit(1)

data = json.loads(m.group(1))
pokemons = data["pokemons"]
habitats = data["habitats"]
categories = data["categories"]

hab_by_oid = {h.get("official_id"): h for h in habitats}

with open("scripts/52poke_pokemon_list_online.html", "r", encoding="utf-8") as f:
    html = f.read()

sections = re.split(r"<span class=\"mw-headline\" id=\"([^\"]+)\">(.*?)</span>", html)
cat_map = {
    "宝可梦图鉴": "main",
    "宝可梦图鉴（活动）": "event",
    "宝可梦图鉴（海底）": "underwater"
}

online_rows = []
for i in range(1, len(sections), 3):
    s_title = sections[i+1]
    if s_title not in cat_map:
        continue
    cat = cat_map[s_title]
    s_content = sections[i+2]
    rows = re.findall(r"<tr>(.*?)</tr>", s_content, re.DOTALL)
    for r in rows:
        tds = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", r, re.DOTALL)
        clean_tds = [re.sub(r"<[^>]+>", "", td).strip() for td in tds]
        if not clean_tds or clean_tds[0] in ["Pokopia编号", "编号"]:
            continue
        m_icon = re.search(r"sprite-icon-([A-Za-z0-9_]+)", r)
        icon = m_icon.group(1) if m_icon else ""
        hab_td = tds[4] if len(clean_tds) > 4 and clean_tds[0].isdigit() else (tds[2] if len(tds) > 2 else "")
        unquoted_td = urllib.parse.unquote(hab_td)
        hab_codes = re.findall(r"Pokopia[ _](?:棲息地|栖息地)[ _]([A-Za-z0-9]+)\.webp", unquoted_td)
        if not hab_codes:
            for oid, h in hab_by_oid.items():
                if h["name"] in unquoted_td or h.get("zh_name","") in unquoted_td:
                    if oid not in hab_codes:
                        hab_codes.append(oid)
        seen = set()
        dedup_codes = []
        for c in hab_codes:
            if c not in seen:
                seen.add(c)
                dedup_codes.append(c)
        online_rows.append((icon, dedup_codes))

print(f"Total online rows: {len(online_rows)}, total pokemons: {len(pokemons)}")

updated_pokemons = []
for idx, p in enumerate(pokemons):
    icon, codes = online_rows[idx]
    new_p = dict(p)
    if codes:
        h1_oid = codes[0]
        h1 = hab_by_oid.get(h1_oid)
        if h1:
            new_p["habitat1"] = str(h1["name"]) + " - " + str(h1["details"])
            new_p["habitat1_id"] = h1["id"]
            new_p["habitat1_img"] = h1["image"]
        else:
            print("Warning: hab1 not found for", p["name"], h1_oid)
            
        if len(codes) > 1:
            h2_oid = codes[1]
            h2 = hab_by_oid.get(h2_oid)
            if h2:
                new_p["habitat2"] = str(h2["name"]) + " - " + str(h2["details"])
                new_p["habitat2_id"] = h2["id"]
                new_p["habitat2_img"] = h2["image"]
            else:
                print("Warning: hab2 not found for", p["name"], h2_oid)
        else:
            new_p["habitat2"] = "無特別需求"
            new_p["habitat2_id"] = ""
            new_p["habitat2_img"] = ""
    else:
        new_p["habitat1"] = "無特別需求"
        new_p["habitat1_id"] = ""
        new_p["habitat1_img"] = ""
        new_p["habitat2"] = "無特別需求"
        new_p["habitat2_id"] = ""
        new_p["habitat2_img"] = ""
    updated_pokemons.append(new_p)

# Also check habitats pokemons list:
# Ensure hab_093 has pokemons: [{'id': 'pkm_s1_112', 'number': 'No. 108', 'name': '卡比獸（萌苔）', 'sprite': 'assets/pkm_sprites/pkm_icon_0143M.webp'}]
hab_093 = hab_by_oid["093"]
hab_093["pokemons"] = [{
    "id": "pkm_s1_112",
    "number": "No. 108",
    "name": "卡比獸（萌苔）",
    "sprite": "assets/pkm_sprites/pkm_icon_0143M.webp"
}]

new_data = {
    "categories": categories,
    "pokemons": updated_pokemons,
    "habitats": habitats
}

with open("data.js", "w", encoding="utf-8") as f:
    f.write("// Pokopia 全系統資料庫\nwindow.POKOPIA_DATA = ")
    json.dump(new_data, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print("data.js successfully updated!")
