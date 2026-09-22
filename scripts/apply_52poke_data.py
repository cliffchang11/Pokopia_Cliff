import os
import re
import json

HTML_CACHE = "scripts/52poke_habitats.html"
DATA_JS = "data.js"
ASSETS_DIR = "assets/habitats"

with open(HTML_CACHE, "r", encoding="utf-8") as f:
    html = f.read()

rows = re.findall(r'<tr id=\"habitat-([^\"]+)\">(.*?)</tr>', html, re.DOTALL)
poke52_list = []
for hid, r in rows:
    tds = re.findall(r'<td[^>]*>(.*?)</td>', r, re.DOTALL)
    if len(tds) < 5:
        continue
    img_td = tds[1]
    m = re.search(r'/wiki/thumb/([0-9a-f]/[0-9a-f]{2}/[^/\"]+\.webp)/', img_td)
    img_url = ('https://media.52poke.com/wiki/' + m.group(1)) if m else ''
    zh_name = tds[2].strip()
    desc = re.sub(r'<[^>]+>', '', tds[3]).strip()
    details = re.sub(r'<[^>]+>', '', tds[4]).strip()
    pkm_names = re.findall(r'title=\"([^\"]+)（旁支系列）\"', tds[5])
    
    local_img = f"assets/habitats/hab_{hid.lower()}.webp"
    if not os.path.exists(local_img):
        local_img = ""

    poke52_list.append({
        'official_id': hid,
        'zh_name': zh_name,
        'desc': desc,
        'details': details,
        'image': local_img,
        'pkms': pkm_names
    })

print(f"Loaded {len(poke52_list)} habitats from 52poke.")

# Read existing data.js
with open(DATA_JS, "r", encoding="utf-8") as f:
    js_src = f.read()

idx_pkm = js_src.find('pokemons: [')
idx_hab = js_src.find('habitats: [')
prefix = js_src[:idx_pkm]
pkm_str = js_src[idx_pkm + len('pokemons: '):idx_hab].strip().rstrip(',')
hab_str = js_src[idx_hab + len('habitats: '):js_src.rfind(']') + 1]

old_pkms = json.loads(pkm_str)
old_habs = json.loads(hab_str)
print(f"Old data.js: {len(old_pkms)} pokemons, {len(old_habs)} habitats.")

ALIAS_MAP = {
    '謎擬Ｑ': '謎擬丘',
    '多邊獸Ｚ': '多邊獸乙型',
    '多邊獸Ⅱ': '多邊獸Ⅱ',
    '火爆獸': '火暴獸',
    '醜醜魚': '笨笨魚',
    '美納斯': '美納斯',
    '磨牙彩皮魚': '磨牙彩帶魚',
    '熒光魚': '螢光魚'
}

pkm_by_zh = {}
for p in old_pkms:
    clean = re.sub(r'^[^\w\u4e00-\u9fa5]+', '', p['name']).strip()
    zh = clean.split(' ')[0]
    pkm_by_zh[zh] = p

# Map old habitats to find English names and environments
old_hab_by_id = {h['id']: h for h in old_habs}

# Build new habitats list sorted by official_id
new_habs = []
hab_by_official_id = {}

for h52 in poke52_list:
    hid = h52['official_id']
    hab_id = f"hab_{hid.lower()}"
    
    # Find matching old habitat to extract English name & environment
    # Match by pokemons
    best_old_hab = None
    best_score = 0
    h52_pkm_mapped = [ALIAS_MAP.get(name, name) for name in h52['pkms']]
    
    for oh in old_habs:
        oh_pkm_zh = [re.sub(r'^[^\w\u4e00-\u9fa5]+', '', p['name']).split(' ')[0] for p in oh.get('pokemons', [])]
        inter = set(h52_pkm_mapped) & set(oh_pkm_zh)
        if len(inter) > best_score:
            best_score = len(inter)
            best_old_hab = oh
            
    en_name = ""
    env = "🌲 一般"
    if best_old_hab:
        env = best_old_hab.get('environment', '🌲 一般')
        # Extract English name
        raw_name = best_old_hab.get('name', '')
        if '(' in raw_name and ')' in raw_name:
            m = re.search(r'\(([^)]+)\)', raw_name)
            en_name = m.group(1).strip() if m else raw_name
        else:
            en_name = raw_name

    # Clean en_name if it has Chinese
    en_name = re.sub(r'[\u4e00-\u9fa5]+', '', en_name).strip(' -()')
    if not en_name:
        en_name = h52['zh_name']

    # Bilingual Name: 繁中 (English)
    bilingual_name = f"{h52['zh_name']} ({en_name})"
    
    # Attracted pokemons
    attracted = []
    seen_pkm = set()
    for zh in h52_pkm_mapped:
        p = pkm_by_zh.get(zh)
        if p and p['id'] not in seen_pkm:
            seen_pkm.add(p['id'])
            attracted.append({
                'id': p['id'],
                'number': p['number'],
                'name': p['name'],
                'sprite': p['sprite']
            })

    # If seabed habitat, adjust environment to 💧 潮濕 or 🌊 水域
    if hid.startswith('B'):
        env = "🌊 水域"

    hab_obj = {
        'id': hab_id,
        'official_id': hid,
        'name': bilingual_name,
        'zh_name': h52['zh_name'],
        'en_name': en_name,
        'desc': h52['desc'],
        'details': h52['details'],
        'image': h52['image'] if h52['image'] else (best_old_hab.get('image', '') if best_old_hab else ''),
        'environment': env,
        'pokemons': attracted
    }
    new_habs.append(hab_obj)
    hab_by_official_id[hid] = hab_obj

# Add any custom old habitats that had unique pokemons not in 52poke
seen_pkm_in_new = set()
for nh in new_habs:
    for p in nh['pokemons']:
        seen_pkm_in_new.add(p['id'])

print(f"Total pokemons covered by new 52poke habitats: {len(seen_pkm_in_new)} / {len(old_pkms)}")

# Now update Pokémon objects to point to new habitats!
pkm_hab_map = {}
for nh in new_habs:
    for p in nh['pokemons']:
        pid = p['id']
        if pid not in pkm_hab_map:
            pkm_hab_map[pid] = []
        pkm_hab_map[pid].append(nh)

for p in old_pkms:
    pid = p['id']
    assigned_habs = pkm_hab_map.get(pid, [])
    if assigned_habs:
        h1 = assigned_habs[0]
        p['habitat1'] = f"{h1['name']} - {h1['details']}"
        p['habitat1_id'] = h1['id']
        p['habitat1_img'] = h1['image']
        
        if len(assigned_habs) > 1:
            h2 = assigned_habs[1]
            p['habitat2'] = f"{h2['name']} - {h2['details']}"
            p['habitat2_id'] = h2['id']
            p['habitat2_img'] = h2['image']
        else:
            p['habitat2'] = "無特別需求"
            p['habitat2_id'] = ""
            p['habitat2_img'] = ""

# Write updated data.js
new_data_js = prefix + "pokemons: " + json.dumps(old_pkms, ensure_ascii=False, indent=2) + ",\n\n  habitats: " + json.dumps(new_habs, ensure_ascii=False, indent=2) + "\n};\n"

with open("data.js", "w", encoding="utf-8") as f:
    f.write(new_data_js)

print("data.js successfully updated with 52poke official bilingual habitats and HD images!")
