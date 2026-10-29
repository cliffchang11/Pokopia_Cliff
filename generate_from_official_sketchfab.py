#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
100% Mike.Nicholson 原作 Sketchfab 官方 3D 體素提取轉換器 (純淨角色本體專用版)
由 Toy_Story_Buzz.glb 真實 WebGL Mesh 與官方調色盤逆向轉換
- 修正 float 色彩距離避免 uint8 溢位
- 濾除背景藍天白雲牆與木質地板，純淨聚焦巴斯光年本體角色
- 還原經典純白太空裝、萊姆綠胸甲、紫頭套、膚色臉部五官與紅黃藍三色按鈕
"""

import json
import math
import numpy as np
from PIL import Image
import trimesh

GLB_PATH = '/home/cliff/.gemini/antigravity-ide/brain/9b697af0-fba6-4edd-9f65-7bf3ed357241/scratch/out/Toy_Story_Buzz.glb'
TEX_PATH = '/home/cliff/.gemini/antigravity-ide/brain/9b697af0-fba6-4edd-9f65-7bf3ed357241/scratch/out/textures/8c66e4fd82074bfbb673ddbb2f7ac9a8.png'
OUT_JS_PATH = '/home/cliff/Desktop/Pokopia/buzz_voxel_data.js'

# Minecraft 官方建材與巴斯光年經典調色盤
MC_PALETTE = {
    0: {"name": "白色混凝土", "color": "#f1f5f9", "raw": "minecraft:white_concrete", "rgb": (241, 245, 249)},
    1: {"name": "黃綠色混凝土", "color": "#22c55e", "raw": "minecraft:lime_concrete", "rgb": (34, 197, 94)},
    2: {"name": "紫色混凝土", "color": "#8b5cf6", "raw": "minecraft:purple_concrete", "rgb": (105, 67, 143)},
    3: {"name": "深紫混凝土", "color": "#6d28d9", "raw": "minecraft:dark_purple_concrete", "rgb": (88, 28, 135)},
    4: {"name": "紅色混凝土", "color": "#ef4444", "raw": "minecraft:red_concrete", "rgb": (239, 68, 68)},
    5: {"name": "深藍色混凝土", "color": "#2563eb", "raw": "minecraft:blue_concrete", "rgb": (37, 99, 235)},
    6: {"name": "黃色混凝土", "color": "#eab308", "raw": "minecraft:yellow_concrete", "rgb": (234, 179, 8)},
    7: {"name": "黑色混凝土", "color": "#1e293b", "raw": "minecraft:black_concrete", "rgb": (30, 41, 59)},
    8: {"name": "灰色混凝土", "color": "#64748b", "raw": "minecraft:gray_concrete", "rgb": (100, 116, 139)},
    9: {"name": "淺灰色混凝土", "color": "#cbd5e1", "raw": "minecraft:light_gray_concrete", "rgb": (203, 213, 225)},
    10: {"name": "白陶瓦 (膚色)", "color": "#fed7aa", "raw": "minecraft:white_terracotta", "rgb": (254, 215, 170)},
    11: {"name": "平滑石英", "color": "#ffffff", "raw": "minecraft:smooth_quartz", "rgb": (255, 255, 255)}
}

def color_distance(c1, c2):
    # 浮點數感知加權色差計算，嚴禁整數溢位
    r1, g1, b1 = float(c1[0]), float(c1[1]), float(c1[2])
    r2, g2, b2 = float(c2[0]), float(c2[1]), float(c2[2])
    rm = 0.5 * (r1 + r2)
    dr = r1 - r2
    dg = g1 - g2
    db = b1 - b2
    return math.sqrt((2.0 + rm/256.0)*dr*dr + 4.0*dg*dg + (2.0 + (255.0-rm)/256.0)*db*db)

def match_mc_palette(rgb):
    # 原作者調色盤精確語義對齊
    r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
    if r == 105 and g == 67 and b == 143: # 巴斯光年紫色頭套
        return 2
    if r == 255 and g == 210 and b == 163: # 臉部五官肉色膚質
        return 10
    if r in [31, 38] and g in [158, 183]: # 經典萊姆綠胸甲與機翼
        return 1
    if r in [176, 242] and g == 0 and b == 0: # 紅色胸前按鈕與機翼端頭
        return 4
    if r == 73 and g == 125 and b == 255: # 藍色胸前按鈕
        return 5
    if r == 255 and g == 232 and b == 24: # 黃色標線與胸前按鈕
        return 6
    if r == 29 and g == 29 and b == 29: # 黑色關節/接縫
        return 7
    if r == 113 and g == 113 and b == 113: # 灰色合金護甲
        return 8
    if r in [230, 244]: # 太空裝主體純白
        return 0
    if r == 255 and g == 255 and b == 255: # 亮白高光
        return 11

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

    # 1. 識別並過濾背景牆與木質地板，純淨鎖定巴斯光年本體角色面
    buzz_faces_indices = []
    for f_idx, f in enumerate(faces):
        v = vertices[f]
        y_mean = v[:, 1].mean()
        z_mean = v[:, 2].mean()
        u = uv[f[0]]
        idx = int(u[0] * 256)
        c = palette[idx]
        is_wood = (c[0] in [165, 171, 174] and c[1] in [124, 130, 133])
        is_sky = (c[0] == 82 and c[1] == 191 and c[2] == 255)
        is_wall_base = (c[0] == 244 and c[1] == 240 and c[2] == 221 and y_mean >= 10.0)
        # 僅保留 Buzz 角色本體
        if y_mean < 10.0 and z_mean >= 1.5 and not is_wood and not is_sky and not is_wall_base:
            buzz_faces_indices.append(f_idx)

    buzz_pts = np.concatenate([vertices[faces[i]] for i in buzz_faces_indices], axis=0)
    min_b = buzz_pts.min(axis=0)

    # 2. 空間表面網格三角採樣 (每顆方塊約 1.0 尺寸)
    voxels = {} # (vx, vy, vz) -> palette_id

    for f_idx in buzz_faces_indices:
        f = faces[f_idx]
        v = vertices[f]
        u = uv[f]
        u_idx = int(u[0, 0] * 256)
        c_rgb = tuple(int(x) for x in palette[u_idx])
        mc_pid = match_mc_palette(c_rgb)

        v0, v1, v2 = v[0], v[1], v[2]
        edge1 = np.linalg.norm(v1 - v0)
        edge2 = np.linalg.norm(v2 - v0)
        steps = max(2, int(max(edge1, edge2) * 3.0))

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

    # 3. 計算全域維度與分層排序
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
        "origin": "Official Sketchfab Voxel Extraction (Pure Character)",
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
        "// 玩具總動員 巴斯光年 體素切片資料庫 (100% Mike.Nicholson 原作官方純淨角色本體)\n"
        f"const BUZZ_VOXEL_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n\n"
        "if (typeof module !== 'undefined' && module.exports) {\n"
        "  module.exports = BUZZ_VOXEL_DATA;\n"
        "}\n"
    )
    with open(OUT_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"✓ 成功產出純淨角色本體體素資料庫：{OUT_JS_PATH}")
    print(f"總方塊數: {total_blocks} 顆，層數: {dim_h} 層，尺寸: {dim_w} × {dim_h} × {dim_l}")

if __name__ == "__main__":
    convert_official_buzz()
