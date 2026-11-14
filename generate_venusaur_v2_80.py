#!/usr/bin/env python3
"""
妙蛙花 (Venusaur #003) 80 層生動動態版體素資料庫生成腳本 (v4.101.0 - 高保真表面體素版)
- 來源: Sketchfab 官方/高品質模型 UID 67086e2e198a4d1992c51db2e971c46b (Venusaur.glb)
- 特色:
  1. 張嘴咆哮、四足邁步之生動動態姿勢
  2. 嚴格鎖定連續 80 層 (Y = 1 ~ 80)，四足爪尖踏於第 1 層，花蕊頂點抵達第 80 層
  3. 純本體俐落踏地，無人造假草皮，四足自然分開、肚子底面懸空鏤空
  4. 高傳真還原五官：紅眼珠 (red_concrete)、黑瞳孔 (black_concrete)、白牙爪 (white_concrete)、深紅口腔 (crimson_hyphae)、粉紅舌唇 (pink_terracotta)
  5. 綠色大葉、棕色樹幹、粉紅花瓣與白色花瓣斑點、青色主體皮膚與暗海晶斑點
- 輸出: venusaur80_v2_voxel_data.js (常數名: VENUSAUR_80_V2_VOXEL_DATA)
"""

import os
import json
import time
import numpy as np
import trimesh
from collections import defaultdict, Counter

GLB_PATH = '/home/cliff/Desktop/Pokopia/venusaur80_v2_rip/Venusaur.glb'
OUTPUT_JS = '/home/cliff/Desktop/Pokopia/venusaur80_v2_voxel_data.js'
TARGET_HEIGHT = 80

MC_PALETTE = [
    {'id': 1, 'key': 'cyan_concrete', 'name': '青色混凝土', 'color': '#00a8c8', 'rgb': np.array([0, 168, 200])},
    {'id': 2, 'key': 'prismarine_bricks', 'name': '海晶石磚', 'color': '#63ab9e', 'rgb': np.array([99, 171, 158])},
    {'id': 3, 'key': 'dark_prismarine', 'name': '暗海晶石', 'color': '#2a554a', 'rgb': np.array([42, 85, 74])},
    {'id': 4, 'key': 'pink_concrete', 'name': '粉紅色混凝土', 'color': '#f04070', 'rgb': np.array([240, 64, 112])},
    {'id': 5, 'key': 'magenta_concrete', 'name': '品紅色混凝土', 'color': '#e02868', 'rgb': np.array([224, 40, 104])},
    {'id': 6, 'key': 'red_terracotta', 'name': '紅色陶土', 'color': '#9e2238', 'rgb': np.array([158, 34, 56])},
    {'id': 7, 'key': 'yellow_concrete', 'name': '黃色混凝土', 'color': '#f0b820', 'rgb': np.array([240, 184, 32])},
    {'id': 8, 'key': 'lime_concrete', 'name': '淺綠色混凝土', 'color': '#5ea918', 'rgb': np.array([94, 169, 24])},
    {'id': 9, 'key': 'green_concrete', 'name': '綠色混凝土', 'color': '#427020', 'rgb': np.array([66, 112, 32])},
    {'id': 10, 'key': 'brown_concrete', 'name': '棕色混凝土', 'color': '#603b20', 'rgb': np.array([96, 59, 32])},
    {'id': 11, 'key': 'stripped_oak_wood', 'name': '去皮橡木', 'color': '#b88e4c', 'rgb': np.array([184, 142, 76])},
    {'id': 12, 'key': 'white_concrete', 'name': '白色混凝土', 'color': '#eaeaea', 'rgb': np.array([234, 234, 234])},
    {'id': 13, 'key': 'red_concrete', 'name': '紅色混凝土', 'color': '#c02020', 'rgb': np.array([192, 32, 32])},
    {'id': 14, 'key': 'black_concrete', 'name': '黑色混凝土', 'color': '#11141a', 'rgb': np.array([17, 20, 26])},
    {'id': 15, 'key': 'pink_terracotta', 'name': '粉紅色陶土', 'color': '#d85068', 'rgb': np.array([216, 80, 104])},
    {'id': 16, 'key': 'crimson_hyphae', 'name': '緋紅蕈菌絲', 'color': '#5c1926', 'rgb': np.array([92, 25, 38])},
]

PRIORITY = {
    13: 100, # 眼珠紅
    14: 100, # 瞳孔黑
    12: 90,  # 白色齒爪獠牙/花瓣斑點/眼白
    7:  85,  # 花蕊黃
    15: 80,  # 舌頭/口唇粉
    16: 75,  # 深紅口腔
    4:  70,  # 粉紅花瓣
    6:  65,  # 花瓣暗紋
    5:  60,  # 品紅
    10: 50,  # 棕色樹幹
    11: 45,  # 去皮橡木
    8:  40,  # 淺綠葉片
    9:  40,  # 深綠葉片
    3:  35,  # 暗海晶深斑
    2:  25,  # 海晶磚
    1:  20   # 青色主體皮膚
}

def map_rgb_batch(rgbs, mesh_hint=None):
    R = rgbs[:, 0].astype(int)
    G = rgbs[:, 1].astype(int)
    B = rgbs[:, 2].astype(int)
    max_rgb = np.maximum(np.maximum(R, G), B)

    res = np.zeros(len(rgbs), dtype=int)

    # 1. 眼睛特徵
    if mesh_hint == 'eye':
        is_red = (R > 130) & (G < 75) & (B < 75)
        is_black = (max_rgb < 55) & ~is_red
        is_white = (R > 180) & (G > 180) & (B > 180)
        res[is_red] = 13
        res[is_black] = 14
        res[is_white] = 12
        leftover = (res == 0) & (R > 100) & (G < 80)
        res[leftover] = 13

    # 2. 白色判定 (牙齒、爪子、花瓣白斑)
    is_white = (res == 0) & (R > 180) & (G > 180) & (B > 180)
    res[is_white] = 12

    # 3. 瞳孔黑
    is_black = (res == 0) & (max_rgb < 38)
    res[is_black] = 14

    # 4. 紅色
    is_red = (res == 0) & (R > 150) & (G < 70) & (B < 70)
    res[is_red] = 13

    # 5. 花朵 (flower)
    if mesh_hint == 'flower':
        is_yellow = (res == 0) & (R > 180) & (G > 150) & (B < 90)
        res[is_yellow] = 7
        is_pink = (res == 0) & (R > 165) & (B > 70)
        res[is_pink] = 4
        is_red_terra = (res == 0) & (R > 120) & (B > 50)
        res[is_red_terra] = 6

    # 6. 身體 (body)
    if mesh_hint == 'body':
        is_pink_tongue = (res == 0) & (R > 140) & (G >= 40) & (G <= 120) & (B >= 50) & (B <= 125)
        res[is_pink_tongue] = 15
        is_crimson = (res == 0) & (((R >= 50) & (R <= 120) & (G < 45) & (B < 55)) | ((R > 150) & (G < 60) & (B < 70)))
        res[is_crimson] = 16

    # 7. 樹葉與樹幹 (leaves)
    if mesh_hint == 'leaves':
        is_brown = (res == 0) & (R >= 60) & (R <= 160) & (G >= 35) & (G <= 110) & (B >= 15) & (B <= 60)
        res[is_brown] = 10
        is_yellow_wood = (res == 0) & (R > 160) & (G > 140) & (B < 80)
        res[is_yellow_wood] = 7
        is_lime = (res == 0) & (G > R) & (G > B) & (G > 145)
        res[is_lime] = 8
        is_green = (res == 0) & (G > R) & (G > B)
        res[is_green] = 9

    # 8. 青色皮膚與暗斑
    is_cyan_domain = (res == 0) & (G >= 75) & (B >= 75) & ((B > R + 10) | (G > R + 10))
    is_dark = is_cyan_domain & (R <= 60) & (G <= 110) & (B <= 110)
    res[is_dark] = 3
    is_cyan = (res == 0) & is_cyan_domain & ((G > 140) | (B > 150))
    res[is_cyan] = 1
    is_prism = (res == 0) & is_cyan_domain
    res[is_prism] = 2

    # 9. 綠色一般判定
    is_general_green = (res == 0) & (G > R + 15) & (G > B + 15)
    is_lime_gen = is_general_green & (G > 140)
    res[is_lime_gen] = 8
    res[is_general_green & ~is_lime_gen] = 9

    # 10. 歐氏距離 fallback
    unresolved_idx = np.where(res == 0)[0]
    if len(unresolved_idx) > 0:
        pal_rgbs = np.array([m['rgb'] for m in MC_PALETTE])
        pal_ids = np.array([m['id'] for m in MC_PALETTE])
        unres_rgbs = rgbs[unresolved_idx]
        diff = unres_rgbs[:, None, :] - pal_rgbs[None, :, :]
        sq_dist = (diff ** 2).sum(axis=2)
        best_pal = np.argmin(sq_dist, axis=1)
        res[unresolved_idx] = pal_ids[best_pal]

    return res

def main():
    start_t = time.time()
    print(f"=== [1/4] 載入動態姿勢 3D 模型: {GLB_PATH} ===")
    scene = trimesh.load(GLB_PATH)

    all_verts = np.concatenate([geom.vertices for geom in scene.geometry.values()], axis=0)
    min_b = all_verts.min(axis=0)
    max_b = all_verts.max(axis=0)
    print(f"  原始邊界: X=[{min_b[0]:.2f}, {max_b[0]:.2f}], Y=[{min_b[1]:.2f}, {max_b[1]:.2f}], Z=[{min_b[2]:.2f}, {max_b[2]:.2f}]")

    orig_height = max_b[2] - min_b[2]
    scale = (TARGET_HEIGHT - 1.0) / orig_height
    print(f"  高度縮放比例: {scale:.6f} (目標 {TARGET_HEIGHT} 層)")

    # 保持以 X=0 為對稱中心，以利完美對稱鏡像
    cx = 0.0
    cy = (min_b[1] + max_b[1]) / 2.0
    min_z = min_b[2]

    voxel_grid = {}

    mesh_configs = {
        'VenusaurF_Material #61_0': {'hint': 'eye', 'u_off': 0.5, 'v_off': 0.0, 'density': 100},
        'VenusaurF_Material #62_0': {'hint': 'body', 'u_off': 0.0, 'v_off': 0.0, 'density': 25},
        'VenusaurF_Material #60_0': {'hint': 'flower', 'u_off': 0.0, 'v_off': 0.0, 'density': 25},
        'VenusaurF_Material #63_0': {'hint': 'leaves', 'u_off': 0.0, 'v_off': 0.0, 'density': 25},
    }

    print(f"=== [2/4] 高精度表面體素化與紋理取樣 (無黏合、自然鏤空) ===")
    for name, geom in scene.geometry.items():
        t0 = time.time()
        cfg = mesh_configs.get(name, {'hint': None, 'u_off': 0.0, 'v_off': 0.0, 'density': 25})
        hint = cfg['hint']
        u_off = cfg['u_off']
        v_off = cfg['v_off']
        density = cfg['density']

        mat = geom.visual.material
        tex = np.array(mat.baseColorTexture)
        th, tw = tex.shape[:2]

        n_samples = max(25000, int(geom.area * density))
        pts, f_idx = trimesh.sample.sample_surface(geom, n_samples)
        tris = geom.triangles[f_idx]
        bary = trimesh.triangles.points_to_barycentric(tris, pts)
        tri_uvs = geom.visual.uv[geom.faces[f_idx]]
        uvs = (bary[:, :, None] * tri_uvs).sum(axis=1)

        u = (uvs[:, 0] + u_off) % 1.0
        v = 1.0 - ((uvs[:, 1] + v_off) % 1.0)
        px = np.clip((u * (tw - 1)).astype(int), 0, tw - 1)
        py = np.clip((v * (th - 1)).astype(int), 0, th - 1)
        sampled_rgbs = tex[py, px, :3]

        bids = map_rgb_batch(sampled_rgbs, mesh_hint=hint)

        txs = np.round((pts[:, 0] - cx) * scale).astype(int)
        tzs = np.round((pts[:, 1] - cy) * scale).astype(int)
        tys = np.round((pts[:, 2] - min_z) * scale).astype(int) + 1
        tys = np.clip(tys, 1, TARGET_HEIGHT)

        for tx, ty, tz, bid in zip(txs, tys, tzs, bids):
            key = (int(tx), int(ty), int(tz))
            if key not in voxel_grid:
                voxel_grid[key] = bid
            else:
                curr_bid = voxel_grid[key]
                if PRIORITY.get(bid, 0) > PRIORITY.get(curr_bid, 0):
                    voxel_grid[key] = bid

        print(f"  網格 {name}: {len(pts):,} 點處理完成，耗時 {time.time()-t0:.2f}s (當前累計體素: {len(voxel_grid):,} 個)")

    print(f"=== [3/4] 幾何高度連續性、四足分離度與色彩統計 ===")
    all_ys = [k[1] for k in voxel_grid.keys()]
    min_y = min(all_ys)
    max_y = max(all_ys)
    assert min_y == 1, f"最低層應為 1，實際為 {min_y}"
    assert max_y == TARGET_HEIGHT, f"最高層應為 {TARGET_HEIGHT}，實際為 {max_y}"

    layer_counts = defaultdict(int)
    for k in voxel_grid.keys():
        layer_counts[k[1]] += 1
    for y in range(1, TARGET_HEIGHT + 1):
        assert layer_counts[y] > 0, f"第 {y} 層方塊數為 0！"
    print(f"  連續 80 層檢驗 PASS！每層均有方塊 (Y=1: {layer_counts[1]} 顆, Y=80: {layer_counts[80]} 顆)")

    # 檢查第 1 層中心點是否自然鏤空 (四足獨立踏地)
    l1_blocks = [(k[0], k[2]) for k in voxel_grid.keys() if k[1] == 1]
    has_center_l1 = (0, 0) in l1_blocks
    print(f"  第 1 層四足接地檢驗: 共有 {len(l1_blocks)} 顆足爪方塊，中央 (0,0) 懸空鏤空: {not has_center_l1}")
    assert not has_center_l1, "四足之間應保持自然懸空鏤空，不應黏合！"

    all_xs = [k[0] for k in voxel_grid.keys()]
    all_zs = [k[2] for k in voxel_grid.keys()]
    min_x, max_x = min(all_xs), max(all_xs)
    min_z, max_z = min(all_zs), max(all_zs)
    width = max_x - min_x + 1
    depth = max_z - min_z + 1
    height = TARGET_HEIGHT
    print(f"  立體維度: 寬 {width} × 高 {height} × 深 {depth} (總方塊數: {len(voxel_grid):,})")

    b_counts = Counter(voxel_grid.values())
    total_materials = {str(k): v for k, v in b_counts.items()}
    print("  色號分佈統計:")
    for p in MC_PALETTE:
        cnt = b_counts.get(p['id'], 0)
        print(f"    [{p['id']:2d}] {p['name']} ({p['key']}): {cnt:5d} ({cnt/len(voxel_grid)*100:4.1f}%)")

    assert b_counts.get(13, 0) > 0, "必須包含紅色眼珠方塊！"
    assert b_counts.get(14, 0) > 0, "必須包含黑色瞳孔方塊！"
    assert b_counts.get(12, 0) > 0, "必須包含白色齒爪獠牙方塊！"
    assert b_counts.get(4, 0) > 0,  "必須包含粉紅花瓣方塊！"
    assert b_counts.get(1, 0) > 0,  "必須包含青色皮膚方塊！"

    print(f"=== [4/4] 封裝並寫入 {OUTPUT_JS} ===")
    layers_output = []
    for y in range(1, TARGET_HEIGHT + 1):
        blocks_in_layer = []
        layer_mat_count = Counter()
        for (x, vy, z), bid in voxel_grid.items():
            if vy == y:
                lx = int(x - min_x)
                lz = int(z - min_z)
                blocks_in_layer.append([lx, lz, int(bid)])
                layer_mat_count[bid] += 1
        blocks_in_layer.sort(key=lambda b: (b[1], b[0]))
        layers_output.append({
            'layerIndex': y,
            'blocks': blocks_in_layer,
            'materials': {str(k): v for k, v in layer_mat_count.items()}
        })

    model_data = {
        'dimensions': {
            'width': width,
            'height': height,
            'length': depth
        },
        'totalBlocks': len(voxel_grid),
        'palette': {str(p['id']): {'id': p['id'], 'key': p['key'], 'name': p['name'], 'color': p['color']} for p in MC_PALETTE},
        'totalMaterials': total_materials,
        'layers': layers_output
    }

    with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
        f.write('/**\n')
        f.write(' * Pokopia 妙蛙花 (80層動態版 / Venusaur #003) 3D 方塊建造資料庫 (v4.101.0)\n')
        f.write(' * 姿勢來源: Sketchfab 3D UID 67086e2e198a4d1992c51db2e971c46b (張嘴咆哮動態版)\n')
        f.write(f' * 規格：寬 {width} × 高 {height} × 深 {depth} (精準 80 層切片)\n')
        f.write(f' * 總方塊數：{len(voxel_grid):,} 顆角色純本體 (無假草皮，四足獨立踏地)\n')
        f.write(' * 特點：高傳真還原紅眼珠、黑瞳孔、白齒爪獠牙、深紅口腔與粉紅舌唇、粉紅花瓣斑紋\n')
        f.write(' */\n')
        f.write('const VENUSAUR_80_V2_VOXEL_DATA = ')
        f.write(json.dumps(model_data, ensure_ascii=False, separators=(',', ':')))
        f.write(';\n\n')
        f.write('if (typeof module !== "undefined" && module.exports) {\n')
        f.write('  module.exports = VENUSAUR_80_V2_VOXEL_DATA;\n')
        f.write('}\n')

    print(f"  成功產出: {OUTPUT_JS} (大小: {os.path.getsize(OUTPUT_JS):,} bytes, 耗時: {time.time()-start_t:.2f}s)")

if __name__ == '__main__':
    main()
