#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精確還原 Mike.Nicholson "Toy Story Buzz" 體素方塊作品
依據 Sketchfab 3D 視窗多視角實拍與比例對齊：
1. 木質地板底座 (Oak Wood Floor Base，寬 26，深 24)
2. 安迪房間立體散熱器 (Radiator with alternating white/light-gray vertical fins) 與藍天白雲牆 (Cloud Wall)
3. 巴斯光年展開的紅白相間噴射機翼 (Extended Hazard Wings，左右凌空超出底板，翼展 36)
4. 深灰色八邊形圓環領圈 (Collar Ring)、紫色頭套 (Purple Hood)、經典太空裝甲、手臂按鈕與紫色鞋底
"""

import json

# 定義 Minecraft 官方建材與色彩調色盤
PALETTE = {
    0: {"name": "白色混凝土", "color": "#f1f5f9", "raw": "minecraft:white_concrete"},
    1: {"name": "黃綠色混凝土", "color": "#22c55e", "raw": "minecraft:lime_concrete"},
    2: {"name": "深綠色混凝土", "color": "#15803d", "raw": "minecraft:green_concrete"},
    3: {"name": "紫色混凝土", "color": "#8b5cf6", "raw": "minecraft:purple_concrete"},
    4: {"name": "深紫混凝土", "color": "#6d28d9", "raw": "minecraft:dark_purple_concrete"},
    5: {"name": "紅色混凝土", "color": "#ef4444", "raw": "minecraft:red_concrete"},
    6: {"name": "淡藍色混凝土", "color": "#38bdf8", "raw": "minecraft:light_blue_concrete"},
    7: {"name": "深藍色混凝土", "color": "#2563eb", "raw": "minecraft:blue_concrete"},
    8: {"name": "黃色混凝土", "color": "#eab308", "raw": "minecraft:yellow_concrete"},
    9: {"name": "黑色混凝土", "color": "#1e293b", "raw": "minecraft:black_concrete"},
    10: {"name": "灰色混凝土", "color": "#64748b", "raw": "minecraft:gray_concrete"},
    11: {"name": "淺灰色混凝土", "color": "#cbd5e1", "raw": "minecraft:light_gray_concrete"},
    12: {"name": "白陶瓦 (膚色)", "color": "#fed7aa", "raw": "minecraft:white_terracotta"},
    13: {"name": "橡木材 (木質地板)", "color": "#b58855", "raw": "minecraft:oak_planks"},
    14: {"name": "深橡木材 (底座邊框)", "color": "#784b25", "raw": "minecraft:dark_oak_planks"},
    15: {"name": "平滑石英 (踢腳飾條)", "color": "#f8fafc", "raw": "minecraft:smooth_quartz"}
}

def generate_buzz_voxels():
    # 比例對齊：底板寬 26 (X: 5~30)，巴斯中心在 X: 18, Z: 10
    # 機翼凌空展開至 X: 1 ~ 35 (總翼展 35 格)
    # 深度 Z: 0 ~ 23，高度 Y: 1 ~ 52
    voxels = {} # (x, y, z) -> palette_id

    # 1. 木質地板底座 (Y: 1 ~ 2, X: 5 ~ 30, Z: 0 ~ 23)
    for y in range(1, 3):
        for x in range(5, 31):
            for z in range(0, 24):
                if x == 5 or x == 30 or z == 0 or z == 23 or y == 1:
                    voxels[(x, y, z)] = 14 # 深橡木材邊框
                else:
                    voxels[(x, y, z)] = 13 # 橡木地板

    # 2. 安迪房間背牆 (位於 Z: 21 ~ 23, X: 5 ~ 30, Y: 3 ~ 52)
    # A. 白色散熱器 (Radiator) —— (Y: 3 ~ 21)
    # 垂直散熱柵欄：白混凝土 (0) 與淺灰混凝土 (11) 交替
    for y in range(3, 22):
        for x in range(6, 30):
            for z in range(21, 24):
                if y == 21:
                    voxels[(x, y, z)] = 0 # 頂部白色平整散熱罩橫桿
                else:
                    voxels[(x, y, z)] = 0 if (x % 2 == 0) else 11
    # 散熱器兩側柱
    for y in range(3, 22):
        for z in range(21, 24):
            voxels[(5, y, z)] = 0
            voxels[(30, y, z)] = 0

    # B. 藍天牆 (Y: 22 ~ 52, X: 5 ~ 30, Z: 22 ~ 23)
    for y in range(22, 53):
        for x in range(5, 31):
            for z in range(22, 24):
                voxels[(x, y, z)] = 6 # 淡藍色混凝土天空

    # C. 牆上的經典積木白雲朵 (Toy Story Andy's Clouds)
    cloud_defs = [
        (11, 44), # 左上白雲
        (25, 41), # 右上白雲
        (18, 29)  # 中央白雲
    ]
    for cx, cy in cloud_defs:
        for dx in range(-4, 5):
            for dy in range(-3, 4):
                if (dx*dx)/16.0 + (dy*dy)/9.0 <= 1.0:
                    x = cx + dx
                    y = cy + dy
                    if 6 <= x <= 29 and 22 <= y <= 51:
                        voxels[(x, y, 22)] = 0

    # 3. 巴斯光年本體 (中心 X: 18, Z: 10)
    # =========================================================
    # A. 雙腳與鞋子 (Y: 3 ~ 8)
    # 左腳中心 X: 14, 右腳中心 X: 22
    for leg_cx in [14, 22]:
        for y in range(3, 9):
            for x in range(leg_cx - 3, leg_cx + 4):
                for z in range(6, 15):
                    dx = x - leg_cx
                    dz = z - 10
                    if (dx*dx)/9.0 + (dz*dz)/20.0 <= 1.0:
                        if y <= 4:
                            voxels[(x, y, z)] = 3 if (dx == -3 or dx == 3 or dz >= 3) else 1
                        elif y <= 6:
                            voxels[(x, y, z)] = 1 if dz <= -2 else 0
                        else:
                            voxels[(x, y, z)] = 1

    # B. 小腿與白色護甲 (Y: 9 ~ 17)
    for leg_cx in [14, 22]:
        for y in range(9, 18):
            for x in range(leg_cx - 2, leg_cx + 3):
                for z in range(7, 13):
                    dx = x - leg_cx
                    dz = z - 10
                    if (dx*dx)/4.0 + (dz*dz)/9.0 <= 1.0:
                        if dz >= 2 and 12 <= y <= 14:
                            voxels[(x, y, z)] = 10 # 膝後窩深灰關節
                        else:
                            voxels[(x, y, z)] = 0 # 白色護腿

    # C. 膝蓋草綠色護膝 (Y: 18 ~ 21)
    for leg_cx in [14, 22]:
        for y in range(18, 22):
            for x in range(leg_cx - 3, leg_cx + 4):
                for z in range(7, 14):
                    dx = x - leg_cx
                    dz = z - 10
                    if (dx*dx)/6.0 + (dz*dz)/9.0 <= 1.0:
                        voxels[(x, y, z)] = 1 # 草綠護膝

    # D. 大腿 (Y: 22 ~ 26)
    for leg_cx in [14, 22]:
        for y in range(22, 27):
            for x in range(leg_cx - 2, leg_cx + 3):
                for z in range(8, 13):
                    voxels[(x, y, z)] = 0 # 純白大腿

    # E. 骨盆與腰部黑色彈性橡膠環節 (Y: 27 ~ 30)
    for y in range(27, 29):
        for x in range(11, 26):
            for z in range(7, 14):
                dx = x - 18
                dz = z - 10
                if (dx*dx)/56.0 + (dz*dz)/10.0 <= 1.0:
                    voxels[(x, y, z)] = 0 # 白色護甲
    for y in range(29, 31):
        for x in range(13, 24):
            for z in range(8, 13):
                voxels[(x, y, z)] = 9 # 腰部黑色伸縮橡膠

    # F. 胸腹部太空裝甲 (Y: 31 ~ 40)
    for y in range(31, 41):
        for x in range(10, 27):
            for z in range(6, 14):
                dx = x - 18
                dz = z - 10
                if (dx*dx)/72.0 + (dz*dz)/14.0 <= 1.0:
                    if y <= 33:
                        voxels[(x, y, z)] = 0 # 白色腹甲
                    else:
                        voxels[(x, y, z)] = 1 # 草綠胸甲

    # 胸前儀表按鈕 (前胸 Z: 6, Y: 36 ~ 38, X: 23)
    voxels[(23, 38, 6)] = 7 # 藍色按鈕
    voxels[(23, 36, 6)] = 1 # 綠色按鈕
    voxels[(23, 34, 6)] = 5 # 紅色按鈕
    # 右胸雷射紅點 (X: 13, Y: 37, Z: 6)
    voxels[(13, 37, 6)] = 5

    # G. 雙肩球形肩甲與雙臂 (Y: 33 ~ 42)
    # 左臂中心 X: 7, 右臂中心 X: 29
    for arm_sign, arm_x_center in [(-1, 7), (1, 29)]:
        for y in range(38, 43):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(7, 13):
                    voxels[(x, y, z)] = 0 # 純白肩甲
        for y in range(33, 38):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(8, 12):
                    voxels[(x, y, z)] = 0 # 白色上臂
        for y in range(26, 33):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(6, 11):
                    if y <= 28:
                        voxels[(x, y, z)] = 1 # 綠色手套
                    else:
                        voxels[(x, y, z)] = 1 if arm_sign == -1 else 0

    # H. 灰色正八邊形太空衣圓環領圈 (Y: 40 ~ 41)
    # 環繞頸部 (X: 13 ~ 23, Z: 6 ~ 14)
    for y in range(40, 42):
        for x in range(12, 25):
            for z in range(5, 15):
                dx = x - 18
                dz = z - 10
                dist_sq = (dx*dx) + (dz*dz)
                if 12.0 <= dist_sq <= 36.0:
                    voxels[(x, y, z)] = 10 # 灰色領圈

    # I. 頭部與紫色太空頭套 (Y: 41 ~ 50, X: 14 ~ 22, Z: 7 ~ 13)
    for y in range(41, 51):
        for x in range(14, 23):
            for z in range(7, 14):
                dx = x - 18
                dz = z - 10
                if (dx*dx)/16.0 + (dz*dz)/9.0 <= 1.0:
                    if z >= 9 or y >= 49:
                        voxels[(x, y, z)] = 3 # 紫色頭套
                    else:
                        voxels[(x, y, z)] = 12 # 皮膚色

    # 面部細節
    voxels[(18, 43, 7)] = 3 # 下巴紫色旋渦
    voxels[(16, 46, 7)] = 9 # 黑眼珠
    voxels[(20, 46, 7)] = 9
    voxels[(17, 46, 7)] = 0 # 眼白
    voxels[(19, 46, 7)] = 0
    for bx in range(16, 21):
        if bx != 18:
            voxels[(bx, 47, 7)] = 14

    # J. 背部噴射背包本體 (Z: 14 ~ 18, Y: 33 ~ 43, X: 12 ~ 24)
    for y in range(33, 44):
        for x in range(12, 25):
            for z in range(14, 19):
                dx = x - 18
                dz = z - 16
                if (dx*dx)/36.0 + (dz*dz)/4.0 <= 1.0:
                    voxels[(x, y, z)] = 4 # 深紫色外殼
    # 背包中央渦輪
    for y in range(36, 41):
        for x in range(16, 21):
            voxels[(x, y, 18)] = 3

    # K. 展開的紅白相間噴射機翼 (Hazard Wings) —— (Y: 35 ~ 41, Z: 15 ~ 16)
    # 左翼凌空展開至 X: 1 ~ 11, 右翼凌空展開至 X: 25 ~ 35 (總翼展 35 格，超出底板兩側！)
    for y in range(35, 42):
        for z in [15, 16]:
            for x in range(2, 12):
                stripe = 5 if ((x + y) // 2) % 2 == 0 else 0
                voxels[(x, y, z)] = stripe
            for x in range(25, 35):
                stripe = 5 if ((x + y) // 2) % 2 == 0 else 0
                voxels[(x, y, z)] = stripe

    # 左右翼尖信號指示方塊 (Wingtip Lights)
    for y in range(37, 41):
        voxels[(1, y, 15)] = 1 # 左翼綠燈
        voxels[(1, y, 16)] = 1
        voxels[(35, y, 15)] = 3 # 右翼紫燈
        voxels[(35, y, 16)] = 3

    return voxels

def export_to_js(voxels, out_path):
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

    data = {
        "name": "玩具總動員 巴斯光年 (Toy Story Buzz)",
        "author": "Mike.Nicholson",
        "dimensions": {
            "width": dim_w,
            "height": dim_h,
            "length": dim_l
        },
        "totalBlocks": total_blocks,
        "palette": PALETTE,
        "layers": layers
    }

    js_content = (
        "// 玩具總動員 巴斯光年 體素切片資料庫 (Toy Story Buzz by Mike.Nicholson)\n"
        f"const BUZZ_VOXEL_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n\n"
        "if (typeof module !== 'undefined' && module.exports) {\n"
        "  module.exports = BUZZ_VOXEL_DATA;\n"
        "}\n"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✓ 成功生成 {out_path}！")
    print(f"總方塊數: {total_blocks} 顆，層數: {dim_h} 層，尺寸: {dim_w} × {dim_h} × {dim_l}")

if __name__ == "__main__":
    v = generate_buzz_voxels()
    export_to_js(v, "/home/cliff/Desktop/Pokopia/buzz_voxel_data.js")
