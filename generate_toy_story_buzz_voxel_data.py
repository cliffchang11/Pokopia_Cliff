#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
精確還原 Mike.Nicholson "Toy Story Buzz" 體素方塊作品
包含：
1. 木質地板底座 (Oak Wood Floor Base)
2. 安迪房間藍天白雲牆與米白踢腳板 (Andy's Cloud Wall & Baseboard)
3. 巴斯光年經典白綠紫裝甲、紫色頭套、紅藍綠胸前儀表、紅白條紋噴射背包 (Buzz Lightyear)
輸出符合前端 Three.js 與切片指南相容的 buzz_voxel_data.js
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
    15: {"name": "平滑砂岩 (踢腳板)", "color": "#f3e8d2", "raw": "minecraft:smooth_sandstone"}
}

def generate_buzz_voxels():
    # 網格尺寸：寬 34 (X: 0~33), 深 30 (Z: 0~29), 高 52 (Y: 1~52)
    voxels = {} # (x, y, z) -> palette_id

    # 1. 木質地板底座 (Y: 1 ~ 2, X: 0 ~ 33, Z: 0 ~ 29)
    for y in range(1, 3):
        for x in range(0, 34):
            for z in range(0, 30):
                # 邊框為深橡木材，內部為橡木地板
                if x == 0 or x == 33 or z == 0 or z == 29 or y == 1:
                    voxels[(x, y, z)] = 14 # 深橡木材
                else:
                    voxels[(x, y, z)] = 13 # 橡木地板

    # 2. 安迪房間藍天白雲牆 (位於後側 Z: 26 ~ 28, X: 0 ~ 33, Y: 3 ~ 52)
    # 踢腳板 (Y: 3 ~ 16)
    for y in range(3, 17):
        for x in range(0, 34):
            for z in range(26, 29):
                voxels[(x, y, z)] = 15 # 平滑砂岩踢腳板

    # 藍天牆 (Y: 17 ~ 52)
    for y in range(17, 53):
        for x in range(0, 34):
            for z in range(27, 29):
                voxels[(x, y, z)] = 6 # 淡藍色混凝土天空

    # 牆上的經典積木白雲朵 (Toy Story Clouds)
    cloud_centers = [(7, 44), (25, 42), (8, 26), (26, 25), (16, 34)]
    for cx, cy in cloud_centers:
        for dx in range(-4, 5):
            for dy in range(-3, 4):
                # 梯形/橢圓雲朵形狀
                if (dx*dx)/16.0 + (dy*dy)/9.0 <= 1.0:
                    x = cx + dx
                    y = cy + dy
                    if 1 <= x <= 32 and 17 <= y <= 51:
                        voxels[(x, y, 27)] = 0 # 白雲

    # 3. 巴斯光年本體 (中心約在 X: 17, Z: 14)
    # =========================================================
    # A. 雙腳與鞋子 (Y: 3 ~ 8)
    # 左腳中心 X: 12, 右腳中心 X: 22
    for leg_cx in [12, 22]:
        for y in range(3, 9):
            for x in range(leg_cx - 3, leg_cx + 4):
                for z in range(9, 19):
                    # 橢圓鞋底
                    dx = x - leg_cx
                    dz = z - 14
                    if (dx*dx)/9.0 + (dz*dz)/25.0 <= 1.0:
                        if y <= 4:
                            # 鞋底紫色邊條與草綠底
                            voxels[(x, y, z)] = 3 if (dx == -3 or dx == 3 or dz == -4 or dz == 4) else 1
                        elif y <= 6:
                            # 鞋身純白與前掌綠色
                            voxels[(x, y, z)] = 1 if dz <= -2 else 0
                        else:
                            # 腳踝綠色圈
                            voxels[(x, y, z)] = 1

    # B. 小腿與白色護甲 (Y: 9 ~ 17)
    for leg_cx in [12, 22]:
        for y in range(9, 18):
            for x in range(leg_cx - 2, leg_cx + 3):
                for z in range(11, 17):
                    # 圓筒腿身
                    dx = x - leg_cx
                    dz = z - 14
                    if (dx*dx)/4.0 + (dz*dz)/9.0 <= 1.0:
                        voxels[(x, y, z)] = 0 # 白色護腿

    # C. 膝蓋草綠色護膝 (Y: 18 ~ 21)
    for leg_cx in [12, 22]:
        for y in range(18, 22):
            for x in range(leg_cx - 3, leg_cx + 4):
                for z in range(11, 18):
                    dx = x - leg_cx
                    dz = z - 14
                    if (dx*dx)/6.0 + (dz*dz)/9.0 <= 1.0:
                        voxels[(x, y, z)] = 1 # 草綠護膝

    # D. 大腿 (Y: 22 ~ 26)
    for leg_cx in [12, 22]:
        for y in range(22, 27):
            for x in range(leg_cx - 2, leg_cx + 3):
                for z in range(12, 17):
                    voxels[(x, y, z)] = 0 # 純白大腿

    # E. 骨盆與腰部彈性黑色環節 (Y: 27 ~ 30)
    for y in range(27, 29):
        for x in range(9, 26):
            for z in range(11, 18):
                dx = x - 17
                dz = z - 14
                if (dx*dx)/64.0 + (dz*dz)/12.0 <= 1.0:
                    voxels[(x, y, z)] = 0 # 白色三角短褲底
    for y in range(29, 31):
        for x in range(11, 24):
            for z in range(12, 17):
                voxels[(x, y, z)] = 9 # 腰部黑色伸縮橡膠

    # F. 胸腹部太空裝甲 (Y: 31 ~ 40)
    for y in range(31, 41):
        for x in range(8, 27):
            for z in range(10, 18):
                dx = x - 17
                dz = z - 14
                if (dx*dx)/81.0 + (dz*dz)/16.0 <= 1.0:
                    if y <= 33:
                        voxels[(x, y, z)] = 0 # 白色腹甲
                    else:
                        # 胸前經典草綠色護甲
                        voxels[(x, y, z)] = 1 # 草綠色裝甲

    # 胸前儀表按鈕 (前面 Z: 10, Y: 36 ~ 38)
    voxels[(22, 38, 10)] = 7 # 藍色橢圓按鈕
    voxels[(22, 36, 10)] = 1 # 綠色橢圓按鈕
    voxels[(22, 34, 10)] = 5 # 紅色圓形按鈕
    # 胸口右側紅色雷射發射標記 (X: 12, Y: 37, Z: 10)
    voxels[(12, 37, 10)] = 5

    # G. 雙肩球形肩甲與雙臂 (Y: 33 ~ 42)
    # 左臂 (X: 2 ~ 7), 右臂 (X: 27 ~ 32)
    for arm_sign, arm_x_center in [(-1, 5), (1, 29)]:
        # 肩甲 (Y: 38 ~ 42)
        for y in range(38, 43):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(11, 17):
                    voxels[(x, y, z)] = 0 # 純白圓弧肩甲
        # 上臂 (Y: 33 ~ 37)
        for y in range(33, 38):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(12, 16):
                    voxels[(x, y, z)] = 0 # 純白
        # 小臂與手套 (Y: 26 ~ 32, 自然前垂)
        for y in range(26, 33):
            for x in range(arm_x_center - 2, arm_x_center + 3):
                for z in range(10, 15):
                    if y <= 28:
                        voxels[(x, y, z)] = 1 # 草綠色手套
                    else:
                        voxels[(x, y, z)] = 1 if arm_sign == -1 else 0 # 綠色通信小臂

    # H. 背部噴射背包 (Jetpack & Hazard Wings) —— 位於背後 Z: 18 ~ 23, Y: 33 ~ 43
    for y in range(33, 44):
        for x in range(10, 25):
            for z in range(18, 22):
                dx = x - 17
                dz = z - 20
                if (dx*dx)/49.0 + (dz*dz)/4.0 <= 1.0:
                    voxels[(x, y, z)] = 0 # 白色背包基座
    # 背包中央紫色圓形推進器 (X: 15 ~ 19, Y: 36 ~ 40, Z: 22)
    for y in range(36, 41):
        for x in range(15, 20):
            voxels[(x, y, 22)] = 3 # 紫色推進渦輪

    # 機翼警示條紋 (Wings Hazard Stripes) —— 背包上方兩側 (Y: 41 ~ 44, X: 8 ~ 26, Z: 19 ~ 21)
    for x in range(8, 27):
        # 紅白相間斜向條紋
        color_id = 5 if (x // 2) % 2 == 0 else 0
        for y in range(41, 44):
            for z in range(19, 21):
                voxels[(x, y, z)] = color_id
    # 機翼端點信號燈
    voxels[(7, 43, 19)] = 5 # 左翼紅色信號燈
    voxels[(27, 43, 19)] = 1 # 右翼綠色信號燈

    # I. 頭部與紫色太空頭套 (Y: 41 ~ 50, X: 13 ~ 21, Z: 11 ~ 17)
    for y in range(41, 51):
        for x in range(13, 22):
            for z in range(11, 18):
                dx = x - 17
                dz = z - 14
                # 圓頭形狀
                if (dx*dx)/16.0 + (dz*dz)/9.0 <= 1.0:
                    if z >= 13 or y >= 49:
                        # 頭頂與後腦勺為紫色頭套 (Hood)
                        voxels[(x, y, z)] = 3
                    else:
                        # 面部為皮膚色
                        voxels[(x, y, z)] = 12

    # 面部細節：下巴招牌紫色旋渦標記 (X: 17, Y: 43, Z: 11)
    voxels[(17, 43, 11)] = 3
    # 眼睛 (X: 15 & 19, Y: 46, Z: 11)
    voxels[(15, 46, 11)] = 9 # 黑眼珠
    voxels[(19, 46, 11)] = 9
    voxels[(16, 46, 11)] = 0 # 眼白
    voxels[(18, 46, 11)] = 0
    # 棕色英挺眉毛 (X: 15 ~ 19, Y: 47, Z: 11)
    voxels[(15, 47, 11)] = 14
    voxels[(16, 47, 11)] = 14
    voxels[(18, 47, 11)] = 14
    voxels[(19, 47, 11)] = 14

    return voxels

def export_to_js(voxels, out_path):
    # 計算邊界與層數
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
                # 歸一化座標到 (0 ~ dim_w - 1, 0 ~ dim_l - 1)
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

    js_content = f"// 玩具總動員 巴斯光年 體素切片資料庫 (Toy Story Buzz by Mike.Nicholson)\nconst BUZZ_VOXEL_DATA = {json.dumps(data, ensure_ascii=False, indent=2)};\n"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✓ 成功生成 {out_path}！")
    print(f"總方塊數: {total_blocks} 顆，層數: {dim_h} 層，尺寸: {dim_w} × {dim_h} × {dim_l}")

if __name__ == "__main__":
    v = generate_buzz_voxels()
    export_to_js(v, "/home/cliff/Desktop/Pokopia/buzz_voxel_data.js")
