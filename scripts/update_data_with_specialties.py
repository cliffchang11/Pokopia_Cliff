import re
import json
import subprocess

# 1. Parse 52poke pokemon list
with open("scripts/52poke_pokemon_list_zh.html", "r", encoding="utf-8") as f:
    html = f.read()

tr_matches = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.DOTALL)
poke_spec_map = {}

for tr in tr_matches:
    cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", tr, re.DOTALL)
    clean_cells = [re.sub(r"<[^>]+>", "", c).strip() for c in cells]
    if len(clean_cells) >= 6 and clean_cells[0] not in ["編號", "Pokopia"]:
        pokopia_num = clean_cells[0]
        nat_num = clean_cells[1]
        name = clean_cells[3] if len(clean_cells) > 3 and clean_cells[2] == "" else clean_cells[2]
        spec_text = clean_cells[-1]
        specs = [s.strip() for s in spec_text.split() if s.strip() and s.strip() not in ["—", "-"]]
        
        clean_name = re.sub(r"\(.*?\)", "", name).strip()
        clean_num = str(int(re.sub(r"[^\d]", "", nat_num))) if re.sub(r"[^\d]", "", nat_num) else ""
        
        poke_spec_map[clean_name] = specs
        if clean_num:
            poke_spec_map[f"NAT_{clean_num}"] = specs

print(f"Parsed {len(poke_spec_map)} keys from 52poke list.")

# 2. Read existing data.js via node
out = subprocess.check_output(["node", "-e", """
const fs = require("fs");
let file = fs.readFileSync("data.js", "utf8");
let sandbox = { window: {} };
eval(file.replace("window.POKOPIA_DATA", "sandbox.window.POKOPIA_DATA"));
console.log(JSON.stringify(sandbox.window.POKOPIA_DATA));
"""]).decode("utf-8")
data = json.loads(out)

categories = data["categories"]
pokemons = data["pokemons"]
habitats = data["habitats"]

def clean_hab_str(s):
    if not s or s == "N/A":
        return s
    # Remove English parentheses like (Tall Grass) or (No specific habitat required)
    s = re.sub(r"\([A-Za-z0-9\s&,\'\.\-\?]+\)", "", s)
    s = re.sub(r"\s+-\s+", " - ", s)
    return s.strip()

# 3. Update pokemons
updated_pkm = 0
for p in pokemons:
    clean_name = re.sub(r"[🌊✨🔥⚡🍃🌱🪵💧]\s*", "", p["name"])
    clean_name = re.sub(r"\(.*?\)", "", clean_name).strip()
    clean_num = re.sub(r"[^\d]", "", p["number"])
    clean_num_str = str(int(clean_num)) if clean_num else ""
    
    specs = poke_spec_map.get(clean_name)
    if specs is None and clean_num_str:
        specs = poke_spec_map.get(f"NAT_{clean_num_str}")
    
    if specs is not None:
        p["abilities"] = specs
        p["specialties"] = specs
        updated_pkm += 1
    else:
        p["specialties"] = p.get("abilities", [])
    
    # Clean habitat1 and habitat2
    p["habitat1"] = clean_hab_str(p.get("habitat1", ""))
    p["habitat2"] = clean_hab_str(p.get("habitat2", ""))

print(f"Updated {updated_pkm}/{len(pokemons)} pokemons with official 52poke specialties.")

# 4. Habitats: ensure details are clean
for h in habitats:
    # Ensure details is clean
    if "details" in h:
        h["details"] = clean_hab_str(h["details"])

# 5. Write back to data.js preserving comments and formatting
js_content = f"""/**
 * Pokopia Storage & Habitat Manager Data Store (雙 Sheet 313 + 52 精準對齊 + 實機截圖版)
 */

window.POKOPIA_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};
"""

with open("data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Successfully wrote updated data.js!")
