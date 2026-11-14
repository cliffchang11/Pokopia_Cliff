#!/usr/bin/env python3
"""
妙蛙花 (Venusaur #003) 80 層精巧建造藍圖生成腳本 (v4.100.0)
- 來源: 妙蛙花高精度語意幾何藍圖 (等比例自 103 層高保真縮放)
- 高度鎖定: 嚴格連續 80 層 (Y=1 ~ 80)，四足爪尖踏地於第 2~3 層，花蕊頂點於第 80 層
- 特徵繼承:
  1. 保留四足周圍厚實立體踏地草皮 (半徑 <= 2~3 格)
  2. 高傳真還原五官：紅色眼睛、黑色瞳孔、白色爪齒獠牙與花瓣斑點、深紅口腔底部與粉紅舌唇
  3. 保留暗海晶石斑點與青色主體皮膚
  4. 奇數寬度 X 中心對稱軸支援
- 輸出: venusaur80_voxel_data.js (常數名: VENUSAUR_80_VOXEL_DATA)
"""

import json
import re
import os
from collections import defaultdict, Counter

SOURCE_JS = '/home/cliff/Desktop/Pokopia/venusaur_voxel_data.js'
OUTPUT_JS = '/home/cliff/Desktop/Pokopia/venusaur80_voxel_data.js'
TARGET_HEIGHT = 80

def main():
    print(f"=== [1/4] 讀取原始妙蛙花資料庫: {SOURCE_JS} ===")
    with open(SOURCE_JS, 'r', encoding='utf-8') as f:
        content = f.read()

    m = re.search(r"const VENUSAUR_VOXEL_DATA = (\{.*\});", content, re.DOTALL)
    if not m:
        raise ValueError("無法解析原始 VENUSAUR_VOXEL_DATA JSON")
    orig_data = json.loads(m.group(1))

    palette = orig_data.get('palette', {})
    orig_h = orig_data['dimensions']['height']
    orig_w = orig_data['dimensions']['width']
    orig_l = orig_data['dimensions']['length']
    print(f"  原始維度: 寬 {orig_w} × 高 {orig_h} × 深 {orig_l} (方塊數: {orig_data['totalBlocks']})")

    # 提取所有三維體素座標
    src_blocks = []
    for layer in orig_data['layers']:
        y = layer['layerIndex'] - 1 # 0 ~ 102
        for x, z, bid in layer['blocks']:
            src_blocks.append((x, y, z, bid))

    xs = [b[0] for b in src_blocks]
    zs = [b[2] for b in src_blocks]
    cx = (min(xs) + max(xs)) / 2.0
    cz = (min(zs) + max(zs)) / 2.0

    print(f"=== [2/4] 等比例精準縮放至 {TARGET_HEIGHT} 層 ===")
    scale_y = (TARGET_HEIGHT - 1.0) / (orig_h - 1.0)
    scale_x = scale_y
    scale_z = scale_y
    print(f"  縮放比例: {scale_y:.6f}")

    # 特徵優先權表 (確保縮放時關鍵細節如眼睛、牙齒、花蕊不被青色皮膚或大葉片吞噬)
    PRIORITY = {
        13: 100, # 眼珠紅 (red_concrete)
        14: 100, # 瞳孔黑 (black_concrete)
        12: 90,  # 白色爪/齒/眼白/花瓣白斑 (white_concrete)
        7: 85,   # 花蕊黃 (yellow_concrete)
        15: 80,  # 舌頭/口唇粉 (pink_terracotta)
        16: 75,  # 深紅口腔 (crimson_hyphae)
        4: 70,   # 花瓣粉紅 (pink_concrete)
        6: 65,   # 花瓣暗折線 (red_terracotta)
        3: 60,   # 深色斑點 (dark_prismarine)
        5: 55,   # 品紅 (magenta_concrete)
        10: 40,  # 棕色樹幹 (brown_concrete)
        11: 40,  # 去皮橡木 (stripped_oak_wood)
        8: 30,   # 淺綠草皮/葉片 (lime_concrete)
        9: 30,   # 綠色草皮/葉片 (green_concrete)
        2: 25,   # 海晶磚 (prismarine_bricks)
        1: 20    # 青色皮膚 (cyan_concrete)
    }

    grid = {}
    for x, y, z, bid in src_blocks:
        tx = int(round((x - cx) * scale_x))
        ty = int(round(y * scale_y))
        tz = int(round((z - cz) * scale_z))
        key = (tx, ty, tz)

        if key not in grid:
            grid[key] = bid
        else:
            existing_bid = grid[key]
            if PRIORITY.get(bid, 0) > PRIORITY.get(existing_bid, 0):
                grid[key] = bid

    min_tx = min(k[0] for k in grid.keys())
    max_tx = max(k[0] for k in grid.keys())
    min_ty = min(k[1] for k in grid.keys())
    max_ty = max(k[1] for k in grid.keys())
    min_tz = min(k[2] for k in grid.keys())
    max_tz = max(k[2] for k in grid.keys())

    width = max_tx - min_tx + 1
    height = max_ty - min_ty + 1
    length = max_tz - min_tz + 1
    total_blocks = len(grid)

    print(f"  80層新模型幾何維度: 寬 {width} × 高 {height} × 深 {length}")
    print(f"  總方塊數: {total_blocks} (較原版降低 {(orig_data['totalBlocks'] - total_blocks)/orig_data['totalBlocks']*100:.1f}%)")
    assert height == TARGET_HEIGHT, f"高度必須精準為 {TARGET_HEIGHT} 層，但得到 {height}"

    print("=== [3/4] 建構層級數據與材質清單 ===")
    layers = []
    total_materials = defaultdict(int)

    for y in range(height):
        layer_idx = y + 1
        layer_voxels = []
        layer_mats = defaultdict(int)

        # 收集該層所有方塊
        for (tx, ty, tz), bid in grid.items():
            if ty == y:
                lx = tx - min_tx
                lz = tz - min_tz
                layer_voxels.append((lx, lz, bid))

        # 排序：Z 由小到大，X 由小到大
        layer_voxels.sort(key=lambda item: (item[1], item[0]))

        layer_blocks = []
        for lx, lz, bid in layer_voxels:
            layer_blocks.append([int(lx), int(lz), int(bid)])
            layer_mats[str(bid)] += 1
            total_materials[str(bid)] += 1

        layers.append({
            'layerIndex': layer_idx,
            'blocks': layer_blocks,
            'materials': dict(layer_mats)
        })

    payload = {
        'dimensions': {
            'width': int(width),
            'height': int(height),
            'length': int(length)
        },
        'totalBlocks': int(total_blocks),
        'palette': palette,
        'totalMaterials': dict(total_materials),
        'layers': layers
    }

    print(f"=== [4/4] 寫入輸出檔案: {OUTPUT_JS} ===")
    header = f"""/**
 * 妙蛙花 (Venusaur #003) 80 層精巧版 3D 方塊建造資料庫 (v4.100.0)
 * 規格：寬 {width} × 高 {height} × 深 {length} (精準 {height} 層切片)
 * 總方塊數：{total_blocks} 顆角色本體與腳邊立體草皮
 * 特點：比照 103 層原版演算法等比例縮放，四足踏地立體草皮自然厚實，高保真雙眼五官與花瓣斑紋
 */
const VENUSAUR_80_VOXEL_DATA = """

    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write(header)
        json.dump(payload, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = VENUSAUR_80_VOXEL_DATA;\n}\n')

    print(f"🎉 成功生成 {OUTPUT_JS}！")

if __name__ == '__main__':
    main()
