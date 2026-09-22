#!/usr/bin/env python3
"""
提取 52poke 官方 MSP 點陣圖標並更新 data.js 全站寶可夢 Sprite 路徑
"""

import re
import json
import os
import subprocess
from PIL import Image

# 1. 載入 MSP 精靈圖
im = Image.open("assets/MSP_Normal.webp")
unit = 112 # 4480 / 40 = 112px

# 2. 解析 scripts/msp.css 中的座標對應表
with open("scripts/msp.css", "r", encoding="utf-8") as f:
    css = f.read()

entries = re.findall(r"(\.sprite-icon-[a-zA-Z0-9_-]+(?:,\.sprite-icon-[a-zA-Z0-9_-]+)*)\{background-position:([^}]+)\}", css)

icon_coords = {}
for classes, pos in entries:
    parts = pos.strip().split()
    if len(parts) == 2:
        x_str, y_str = parts[0], parts[1]
        x_em = float(x_str.replace("em", "")) if "em" in x_str else float(x_str)
        y_em = float(y_str.replace("em", "")) if "em" in y_str else float(y_str)
        for cls in classes.split(","):
            cname = cls.strip().replace(".sprite-icon-", "")
            icon_coords[cname] = (int(abs(x_em)), int(abs(y_em)))

print(f"解析到 {len(icon_coords)} 個 MSP 座標定義。")

# 3. 解析 52poke 寶可夢列表中的每隻寶可夢所使用的 icon_class
with open("scripts/52poke_pokemon_list_zh.html", "r", encoding="utf-8") as f:
    html = f.read()

rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL)
poke_icon_map = {}

for r in rows:
    cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, re.DOTALL)
    clean_cells = [re.sub(r"<[^>]+>", "", c).strip() for c in cells]
    if len(clean_cells) >= 6 and clean_cells[0] not in ["編號", "Pokopia"]:
        pokopia_num = clean_cells[0]
        nat_num = clean_cells[1]
        name = clean_cells[3] if len(clean_cells) > 3 and clean_cells[2] == "" else clean_cells[2]
        clean_name = re.sub(r"\(.*?\)", "", name).strip()
        
        m = re.search(r"class=[\"\x27][^\"\x27]*sprite-icon-([a-zA-Z0-9_-]+)", r)
        icon_class = m.group(1) if m else None
        
        if icon_class:
            poke_icon_map[clean_name] = icon_class
            if nat_num.isdigit():
                clean_num_str = str(int(nat_num))
                poke_icon_map[f"NAT_{clean_num_str}"] = icon_class
                poke_icon_map[f"NAT_{nat_num.zfill(4)}"] = icon_class

print(f"52poke 列表建立了 {len(poke_icon_map)} 筆寶可夢到 icon_class 的對照。")

# 4. 讀取 data.js
out = subprocess.check_output(["node", "-e", """
const fs = require("fs");
let file = fs.readFileSync("data.js", "utf8");
let sandbox = { window: {} };
eval(file.replace("window.POKOPIA_DATA", "sandbox.window.POKOPIA_DATA"));
console.log(JSON.stringify(sandbox.window.POKOPIA_DATA));
"""]).decode("utf-8")
data = json.loads(out)

pokemons = data["pokemons"]
habitats = data["habitats"]

os.makedirs("assets/pkm_sprites", exist_ok=True)

# 5. 切割並賦值 Sprite
updated_count = 0
failed = []

for pkm in pokemons:
    raw_name = pkm.get("name", "")
    clean_name = re.sub(r"[🌊✨🔥⚡🍃🌱🪵💧]\s*", "", raw_name)
    clean_name = re.sub(r"\(.*?\)", "", clean_name).strip()
    
    num_digits = re.sub(r"[^\d]", "", pkm.get("number", ""))
    num_int_str = str(int(num_digits)) if num_digits else ""
    num_4d = num_digits.zfill(4) if num_digits else ""
    
    # 查找對應 icon_class
    icon_class = poke_icon_map.get(clean_name)
    if not icon_class and num_int_str:
        icon_class = poke_icon_map.get(f"NAT_{num_int_str}")
    if not icon_class and num_4d:
        icon_class = poke_icon_map.get(f"NAT_{num_4d}")
    if not icon_class and num_4d:
        icon_class = num_4d
    
    # 針對特殊形態微調
    if "巨蔓藤博士" in raw_name:
        icon_class = "0465P"
    elif "皮卡丘" in raw_name and ("淺色" in raw_name or "造型" in raw_name):
        icon_class = "0025Pe"
    elif "卡比獸" in raw_name and "萌苔" in raw_name:
        icon_class = "0143M"
    elif "圖圖犬" in raw_name and "彩繪" in raw_name:
        icon_class = "0235S"
    elif "洛托姆" in raw_name and ("音響" in raw_name or "立體" in raw_name):
        icon_class = "0479D"
    elif "藏飽栗鼠" in raw_name and "廚師" in raw_name:
        icon_class = "0820C"
    elif "顫弦蠑螈" in raw_name and "低調" in raw_name:
        icon_class = "0849L"
    elif "巨鍛匠" in raw_name and "工匠" in raw_name:
        icon_class = "0959S"
    elif "米立龍" in raw_name:
        if "下垂" in raw_name:
            icon_class = "0978D"
        elif "平挺" in raw_name:
            icon_class = "0978S"
        elif "上弓" in raw_name:
            icon_class = "0978"

    coords = icon_coords.get(icon_class)
    if not coords and icon_class and icon_class.lstrip("0"):
        coords = icon_coords.get(icon_class.lstrip("0"))
    if not coords and num_4d:
        coords = icon_coords.get(num_4d)
    
    if coords:
        col, row = coords
        x1 = col * unit
        y1 = row * unit
        x2 = x1 + unit
        y2 = y1 + unit
        
        crop_im = im.crop((x1, y1, x2, y2))
        sprite_filename = f"pkm_{pkm['id']}.webp"
        sprite_relpath = f"assets/pkm_sprites/{sprite_filename}"
        crop_im.save(sprite_relpath, "WEBP")
        
        pkm["sprite"] = sprite_relpath
        updated_count += 1
    else:
        failed.append((pkm["id"], pkm["number"], pkm["name"], icon_class))

print(f"成功切割並更新 {updated_count}/{len(pokemons)} 隻寶可夢 Sprite！")
if failed:
    print(f"失敗列表 ({len(failed)}):", failed)

# 6. 同步更新 habitats 中的 pokemons sprite
pkm_sprite_map = {p["id"]: p["sprite"] for p in pokemons}
for hab in habitats:
    for hpkm in hab.get("pokemons", []):
        if hpkm["id"] in pkm_sprite_map:
            hpkm["sprite"] = pkm_sprite_map[hpkm["id"]]

# 7. 寫回 data.js
js_content = f"""/**
 * Pokopia Storage & Habitat Manager Data Store (雙 Sheet 313 + 52 精準對齊 + 52poke 官方點陣圖標版)
 */

window.POKOPIA_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};
"""

with open("data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("成功更新 data.js！")
