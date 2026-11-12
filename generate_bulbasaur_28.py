#!/usr/bin/env python3
"""
妙蛙種子 28 層精巧建造藍圖資料庫生成腳本 (Bulbasaur #001 - 28 Layers Compact Edition)
來源：Bloxelizer 原版點陣藍圖 0001-bulbasaur.litematic (作者: @minimon)
原始高度: 31 層 (Y=0~30)
壓縮策略: 保留 Y=0~16 爪尖貼地與頭面部五官（100%不變形），球莖上部自適應平滑壓縮至總高 28 層 (Y=1~28)
調色盤: 原版 35 種 Minecraft 方塊精緻配色
輸出檔案: bulbasaur28_voxel_data.js
"""

import gzip
import struct
import json
import os
from collections import defaultdict, Counter

PALETTE_META = {
    'air': {'id': 0, 'key': 'air', 'name': '空氣', 'color': '#00000000'},
    'black_terracotta': {'id': 1, 'key': 'black_terracotta', 'name': '黑色陶土', 'color': '#251610'},
    'bone_block': {'id': 2, 'key': 'bone_block', 'name': '骨塊', 'color': '#e3dec9'},
    'calcite': {'id': 3, 'key': 'calcite', 'name': '方解石', 'color': '#dfdfdf'},
    'cherry_planks': {'id': 4, 'key': 'cherry_planks', 'name': '櫻花木材', 'color': '#e6b2ac'},
    'crimson_planks': {'id': 5, 'key': 'crimson_planks', 'name': '緋紅木材', 'color': '#653041'},
    'dark_prismarine': {'id': 6, 'key': 'dark_prismarine', 'name': '暗海晶石', 'color': '#335b4b'},
    'diamond_block': {'id': 7, 'key': 'diamond_block', 'name': '鑽石方塊', 'color': '#62e2d9'},
    'emerald_block': {'id': 8, 'key': 'emerald_block', 'name': '綠寶石方塊', 'color': '#17dd62'},
    'gray_terracotta': {'id': 9, 'key': 'gray_terracotta', 'name': '灰色陶土', 'color': '#392a24'},
    'green_concrete': {'id': 10, 'key': 'green_concrete', 'name': '綠色混凝土', 'color': '#495b24'},
    'green_wool': {'id': 11, 'key': 'green_wool', 'name': '綠色羊毛', 'color': '#556e1b'},
    'iron_block': {'id': 12, 'key': 'iron_block', 'name': '鐵方塊', 'color': '#d8d8d8'},
    'light_gray_wool': {'id': 13, 'key': 'light_gray_wool', 'name': '淺灰色羊毛', 'color': '#8e8e86'},
    'magenta_terracotta': {'id': 14, 'key': 'magenta_terracotta', 'name': '品紅色陶土', 'color': '#95576c'},
    'mangrove_planks': {'id': 15, 'key': 'mangrove_planks', 'name': '紅樹林木材', 'color': '#763631'},
    'moss_block': {'id': 16, 'key': 'moss_block', 'name': '青苔方塊', 'color': '#5b6d2c'},
    'mossy_cobblestone': {'id': 17, 'key': 'mossy_cobblestone', 'name': '青苔鵝卵石', 'color': '#727d63'},
    'mossy_stone_bricks': {'id': 18, 'key': 'mossy_stone_bricks', 'name': '青苔石磚', 'color': '#737c67'},
    'netherrack': {'id': 19, 'key': 'netherrack', 'name': '地獄石', 'color': '#642828'},
    'pale_oak_planks': {'id': 20, 'key': 'pale_oak_planks', 'name': '蒼白橡木材', 'color': '#d8d3c7'},
    'pink_concrete': {'id': 21, 'key': 'pink_concrete', 'name': '粉紅色混凝土', 'color': '#d5658e'},
    'pink_terracotta': {'id': 22, 'key': 'pink_terracotta', 'name': '粉紅色陶土', 'color': '#a14e4e'},
    'pink_wool': {'id': 23, 'key': 'pink_wool', 'name': '粉紅色羊毛', 'color': '#ed8dac'},
    'polished_granite': {'id': 24, 'key': 'polished_granite', 'name': '拋光花崗岩', 'color': '#9b6b59'},
    'prismarine': {'id': 25, 'key': 'prismarine', 'name': '海晶石', 'color': '#5d9990'},
    'prismarine_bricks': {'id': 26, 'key': 'prismarine_bricks', 'name': '海晶石磚', 'color': '#64a395'},
    'purple_terracotta': {'id': 27, 'key': 'purple_terracotta', 'name': '紫色陶土', 'color': '#764556'},
    'quartz_block': {'id': 28, 'key': 'quartz_block', 'name': '石英方塊', 'color': '#eae5de'},
    'red_wool': {'id': 29, 'key': 'red_wool', 'name': '紅色羊毛', 'color': '#a12722'},
    'smooth_quartz': {'id': 30, 'key': 'smooth_quartz', 'name': '平滑石英', 'color': '#eae5de'},
    'smooth_stone': {'id': 31, 'key': 'smooth_stone', 'name': '平滑石頭', 'color': '#9e9e9e'},
    'snow_block': {'id': 32, 'key': 'snow_block', 'name': '雪方塊', 'color': '#f9fefc'},
    'waxed_oxidized_copper': {'id': 33, 'key': 'waxed_oxidized_copper', 'name': '上蠟氧化銅', 'color': '#52a38c'},
    'waxed_weathered_copper': {'id': 34, 'key': 'waxed_weathered_copper', 'name': '上蠟鏽蝕銅', 'color': '#6c9a7c'},
    'white_wool': {'id': 35, 'key': 'white_wool', 'name': '白色羊毛', 'color': '#e4e4e4'},
}

def parse_nbt(data):
    offset = 0
    def read_byte(): nonlocal offset; b = data[offset]; offset += 1; return b
    def read_short(): nonlocal offset; s = struct.unpack(">h", data[offset:offset+2])[0]; offset += 2; return s
    def read_int(): nonlocal offset; i = struct.unpack(">i", data[offset:offset+4])[0]; offset += 4; return i
    def read_string():
        nonlocal offset; length = struct.unpack(">H", data[offset:offset+2])[0]; offset += 2
        s = data[offset:offset+length].decode("utf-8", errors="replace"); offset += length; return s
    def parse_tag(tag_type):
        nonlocal offset
        if tag_type == 1: return read_byte()
        elif tag_type == 2: return read_short()
        elif tag_type == 3: return read_int()
        elif tag_type == 4: offset += 8; return "long"
        elif tag_type == 5: offset += 4; return "float"
        elif tag_type == 6: offset += 8; return "double"
        elif tag_type == 7: length = read_int(); res = data[offset:offset+length]; offset += length; return res
        elif tag_type == 8: return read_string()
        elif tag_type == 9: elem_type = read_byte(); length = read_int(); return [parse_tag(elem_type) for _ in range(length)]
        elif tag_type == 10:
            c = {}
            while True:
                t = read_byte()
                if t == 0: break
                n = read_string()
                c[n] = parse_tag(t)
            return c
        elif tag_type == 11: length = read_int(); res = struct.unpack(f">{length}i", data[offset:offset+length*4]); offset += length*4; return res
        elif tag_type == 12: length = read_int(); longs = struct.unpack(f">{length}q", data[offset:offset+length*8]); offset += length*8; return list(longs)
    r_type = read_byte(); r_name = read_string(); return r_name, parse_tag(r_type)

def main():
    litematic_path = "/home/cliff/Downloads/0001-bulbasaur.litematic"
    print(f"Reading {litematic_path}...")
    with open(litematic_path, "rb") as f:
        raw = gzip.decompress(f.read())
    
    _, nbt = parse_nbt(raw)
    region = list(nbt["Regions"].values())[0]
    palette = region["BlockStatePalette"]
    size = region["Size"]
    sx, sy, sz = abs(size["x"]), abs(size["y"]), abs(size["z"])
    block_states = region["BlockStates"]
    bits = max(2, (len(palette) - 1).bit_length())
    bit_mask = (1 << bits) - 1

    # Map palette index to our material id
    palette_map = {}
    for idx, p in enumerate(palette):
        name = p["Name"].split(":")[-1]
        if name in PALETTE_META:
            palette_map[idx] = PALETTE_META[name]["id"]
        else:
            print(f"Unknown block name: {name}")
            palette_map[idx] = 1 # fallback

    orig_layers = defaultdict(dict)
    for i in range(sx * sy * sz):
        start_long = (i * bits) // 64
        start_bit = (i * bits) % 64
        end_long = ((i + 1) * bits - 1) // 64
        val = (block_states[start_long] & 0xFFFFFFFFFFFFFFFF) >> start_bit
        if start_long != end_long:
            val |= ((block_states[end_long] & 0xFFFFFFFFFFFFFFFF) << (64 - start_bit))
        val &= bit_mask
        if val != 0:
            y = i // (sz * sx)
            rem = i % (sz * sx)
            z = rem // sx
            x = rem % sx
            orig_layers[y][(x, z)] = palette_map[val]

    # Smooth adaptive compression to 28 layers (1 to 28)
    resampled_layers = defaultdict(dict)
    for ty in range(28):
        if ty <= 16:
            resampled_layers[ty + 1] = orig_layers[ty].copy()
        else:
            orig_fy = 17.0 + (ty - 17.0) * (30.0 - 17.0) / (27.0 - 17.0)
            y0 = int(orig_fy)
            y1 = min(30, y0 + 1)
            w1 = orig_fy - y0
            w0 = 1.0 - w1
            pos_all = set(orig_layers[y0].keys()) | set(orig_layers[y1].keys())
            for (x, z) in pos_all:
                in_0 = (x, z) in orig_layers[y0]
                in_1 = (x, z) in orig_layers[y1]
                if in_0 and in_1:
                    mat = orig_layers[y1][(x, z)] if w1 >= 0.5 else orig_layers[y0][(x, z)]
                    resampled_layers[ty + 1][(x, z)] = mat
                elif in_0 and w0 >= 0.35:
                    resampled_layers[ty + 1][(x, z)] = orig_layers[y0][(x, z)]
                elif in_1 and w1 >= 0.35:
                    resampled_layers[ty + 1][(x, z)] = orig_layers[y1][(x, z)]

    # Calculate overall dimensions
    all_x = []
    all_z = []
    for l_voxels in resampled_layers.values():
        for (x, z) in l_voxels.keys():
            all_x.append(x)
            all_z.append(z)
    
    min_x, max_x = min(all_x), max(all_x)
    min_z, max_z = min(all_z), max(all_z)
    width = max_x - min_x + 1
    length = max_z - min_z + 1
    height = 28

    print(f"Bounds: X=[{min_x}, {max_x}] (W={width}), Y=[1, 28] (H={height}), Z=[{min_z}, {max_z}] (L={length})")

    # Build layers structure
    layers_data = []
    total_blocks = 0
    used_materials = set()

    for layer_idx in range(1, 29):
        l_voxels = resampled_layers[layer_idx]
        blocks = []
        mat_counts = Counter()
        for (x, z), mat_id in sorted(l_voxels.items()):
            blocks.append([x, z, mat_id])
            mat_counts[str(mat_id)] += 1
            used_materials.add(mat_id)
        
        total_blocks += len(blocks)
        layers_data.append({
            "layerIndex": layer_idx,
            "blocks": blocks,
            "materials": dict(mat_counts)
        })

    # Build palette object
    palette_data = {}
    for mat_id in sorted(used_materials):
        for name, meta in PALETTE_META.items():
            if meta["id"] == mat_id:
                palette_data[str(mat_id)] = {
                    "id": meta["id"],
                    "key": meta["key"],
                    "name": meta["name"],
                    "color": meta["color"]
                }
                break

    output_obj = {
        "name": "妙蛙種子 (28層精巧版)",
        "totalBlocks": total_blocks,
        "dimensions": {
            "width": width,
            "height": height,
            "length": length
        },
        "palette": palette_data,
        "layers": layers_data
    }

    out_file = "/home/cliff/Desktop/Pokopia/bulbasaur28_voxel_data.js"
    with open(out_file, "w", encoding="utf-8") as f:
        f.write("/**\n")
        f.write(" * 妙蛙種子 (Bulbasaur #001) 28 層精巧建造藍圖資料庫\n")
        f.write(" * 來源：Bloxelizer 0001-bulbasaur.litematic (作者: @minimon)\n")
        f.write(f" * 總體素數: {total_blocks} 顆，高度: 28 層，寬度: {width}，長度: {length}\n")
        f.write(" */\n")
        f.write("const BULBASAUR_28_VOXEL_DATA = ")
        json.dump(output_obj, f, ensure_ascii=False, indent=2)
        f.write(";\n\n")
        f.write("if (typeof module !== 'undefined' && module.exports) {\n")
        f.write("  module.exports = BULBASAUR_28_VOXEL_DATA;\n")
        f.write("}\n")

    print(f"Successfully generated {out_file} with {total_blocks} blocks across {len(layers_data)} layers!")

if __name__ == "__main__":
    main()
