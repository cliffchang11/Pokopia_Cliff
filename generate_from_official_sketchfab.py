#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
100% Mike.Nicholson 原作 Sketchfab 官方 3D 體素提取轉換器
由 Toy_Story_Buzz.glb 真實 WebGL Mesh 與官方 256x1 調色盤逆向轉換
"""

import json
import math
import numpy as np
from PIL import Image
import trimesh

GLB_PATH = '/home/cliff/.gemini/antigravity-ide/brain/9b697af0-fba6-4edd-9f65-7bf3ed357241/scratch/out/Toy_Story_Buzz.glb'
TEX_PATH = '/home/cliff/.gemini/antigravity-ide/brain/9b697af0-fba6-4edd-9f65-7bf3ed357241/scratch/out/textures/8c66e4fd82074bfbb673ddbb2f7ac9a8.png'
OUT_JS_PATH = '/home/cliff/Desktop/Pokopia/buzz_voxel_data.js'

# Minecraft 官方建材與色彩調色盤
MC_PALETTE = {
    0: {"name": "白色混凝土", "color": "#f1f5f9", "raw": "minecraft:white_concrete", "rgb": (241, 245, 249)},
    1: {"name": "黃綠色混凝土", "color": "#22c55e", "raw": "minecraft:lime_concrete", "rgb": (34, 197, 94)},
    2: {"name": "深綠色混凝土", "color": "#15803d", "raw": "minecraft:green_concrete", "rgb": (21, 128, 61)},
    3: {"name": "紫色混凝土", "color": "#8b5cf6", "raw": "minecraft:purple_concrete", "rgb": (139, 92, 246)},
    4: {"name": "深紫混凝土", "color": "#6d28d9", "raw": "minecraft:dark_purple_concrete", "rgb": (109, 40, 217)},
    5: {"name": "紅色混凝土", "color": "#ef4444", "raw": "minecraft:red_concrete", "rgb": (239, 68, 68)},
    6: {"name": "淡藍色混凝土", "color": "#38bdf8", "raw": "minecraft:light_blue_concrete", "rgb": (56, 189, 248)},
    7: {"name": "深藍色混凝土", "color": "#2563eb", "raw": "minecraft:blue_concrete", "rgb": (37, 99, 235)},
    8: {"name": "黃色混凝土", "color": "#eab308", "raw": "minecraft:yellow_concrete", "rgb": (234, 179, 8)},
    9: {"name": "黑色混凝土", "color": "#1e293b", "raw": "minecraft:black_concrete", "rgb": (30, 41, 59)},
    10: {"name": "灰色混凝土", "color": "#64748b", "raw": "minecraft:gray_concrete", "rgb": (100, 116, 139)},
    11: {"name": "淺灰色混凝土", "color": "#cbd5e1", "raw": "minecraft:light_gray_concrete", "rgb": (203, 213, 225)},
    12: {"name": "白陶瓦 (膚色)", "color": "#fed7aa", "raw": "minecraft:white_terracotta", "rgb": (254, 215, 170)},
    13: {"name": "橡木材 (木質地板)", "color": "#b58855", "raw": "minecraft:oak_planks", "rgb": (181, 136, 85)},
    14: {"name": "深橡木材 (底座邊框)", "color": "#784b25", "raw": "minecraft:dark_oak_planks", "rgb": (120, 75, 37)},
    15: {"name": "平滑石英 (踢腳飾條)", "color": "#f8fafc", "raw": "minecraft:smooth_quartz", "rgb": (248, 250, 252)}
}

def color_distance(c1, c2):
    # 加權感知色差
    rm = 0.5 * (c1[0] + c2[0])
    dr = c1[0] - c2[0]
    dg = c1[1] - c2[1]
    db = c1[2] - c2[2]
    return math.sqrt((2 + rm/256)*dr*dr + 4*dg*dg + (2 + (255-rm)/256)*db*db)

def match_mc_palette(rgb):
    best_id = 0
    min_dist = float('inf')
    for pid, pinfo in MC_PALETTE.items():
        dist = color_distance(rgb, pinfo["rgb"])
        if dist < min_dist:
            min_dist = dist
            best_id = pid
    return best_id

def convert_official_buzz():
    print("🚀 載入 Mike.Nicholson 官方巴斯光年 GLB 模型...")
    scene = trimesh.load(GLB_PATH)
    mesh = list(scene.geometry.values())[0]

    img = Image.open(TEX_PATH).convert('RGB')
    palette = np.array(img)[0]

    uv = mesh.visual.uv
    vertices = mesh.vertices
    faces = mesh.faces
    min_b = mesh.bounds[0]

    voxels = {} # (vx, vy, vz) -> palette_id

    for f in faces:
        v = vertices[f]
        u = uv[f]
        u_idx = int(np.clip(np.round(u[0, 0] * 256), 0, 255))
        c_rgb = tuple(palette[u_idx])
        mc_pid = match_mc_palette(c_rgb)

        v0, v1, v2 = v[0], v[1], v[2]
        edge1 = np.linalg.norm(v1 - v0)
        edge2 = np.linalg.norm(v2 - v0)
        steps = max(2, int(max(edge1, edge2) * 2.5))

        for s in np.linspace(0, 1, steps):
            for t in np.linspace(0, 1 - s, steps):
                p = v0 + s * (v1 - v0) + t * (v2 - v0)
                # X: 橫向 (寬), Z: 縱向 (深), Y: 高度
                vx = int(np.floor(p[0] - min_b[0]))
                vz = int(np.floor(p[1] - min_b[1]))
                vy = int(np.floor(p[2] - min_b[2]))

                key = (vx, vy, vz)
                if key not in voxels:
                    voxels[key] = mc_pid

    # 計算全域維度
    all_x = [k[0] for k in voxels.keys()]
    all_y = [k[1] for k in voxels.keys()]
    all_z = [k[2] for k in voxels.keys()]

    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    min_z, max_z = min(all_z), max(all_z)

    dim_w = max_x - min_x + 1
    dim_h = max_y - min_y + 1
    dim_l = max_z - min_z + 1

    layers = []
    total_blocks = 0

    for y in range(min_y, max_y + 1):
        layer_blocks = []
        materials = {}
        for (x, vy, z), bid in voxels.items():
            if vy == y:
                layer_blocks.append([x - min_x, z - min_z, bid])
                materials[bid] = materials.get(bid, 0) + 1
                total_blocks += 1

        layer_blocks.sort(key=lambda b: (b[1], b[0]))
        layers.append({
            "layerIndex": y - min_y + 1,
            "blocks": layer_blocks,
            "materials": materials
        })

    # 清理 MC_PALETTE 移除 internal rgb
    palette_clean = {}
    for pid, pdata in MC_PALETTE.items():
        palette_clean[pid] = {
            "name": pdata["name"],
            "color": pdata["color"],
            "raw": pdata["raw"]
        }

    data = {
        "name": "玩具總動員 巴斯光年 (Toy Story Buzz)",
        "author": "Mike.Nicholson",
        "origin": "Official Sketchfab Voxel Extraction",
        "dimensions": {
            "width": dim_w,
            "height": dim_h,
            "length": dim_l
        },
        "totalBlocks": total_blocks,
        "palette": palette_clean,
        "layers": layers
    }

    js_content = (
        "// 玩具總動員 巴斯光年 體素切片資料庫 (100% Mike.Nicholson 原作官方抽取)\n"
        f"const BUZZ_VOXEL_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n\n"
        "if (typeof module !== 'undefined' && module.exports) {\n"
        "  module.exports = BUZZ_VOXEL_DATA;\n"
        "}\n"
    )
    with open(OUT_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✓ 成功產出 100% 原作體素資料庫：{OUT_JS_PATH}")
    print(f"總方塊數: {total_blocks} 顆，層數: {dim_h} 層，尺寸: {dim_w} × {dim_h} × {dim_l}")

if __name__ == "__main__":
    convert_official_buzz()
