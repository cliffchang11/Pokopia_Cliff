"""
妙蛙花 (Venusaur #003) 體素資料庫生成腳本
由 Sketchfab 官方 Minecraft Schematic 解密模型精確逆向抽取
過濾地台底座與前方草叢雜草，萃取出 100% 純淨無瑕的妙蛙花本體
"""

import os
import json
import numpy as np
from sketchfang.pipeline import fetch_and_decrypt_streams
from sketchfang.osgjs.walk import walk_geometries
from sketchfang.osgjs.buffers import read_array_buffer, parse_userdata
from sketchfang.osgjs.geometry import decode_geometry
from sketchfang.materials.stateset import StateSetBinder

UID = 'a893ba041c1b4c8b96fce72d5393c2f7'

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

def find_closest_block_id(rgb):
    r, g, b = rgb
    # 專用高保真規則
    # 1. 眼睛紅
    if r > 160 and g < 65 and b < 65:
        return 13 # red_concrete
    # 2. 黑色瞳孔
    if max(rgb) < 35:
        return 14 # black_concrete
    # 3. 白色爪子、牙齒、眼白與花瓣白斑
    if r > 180 and g > 180 and b > 180:
        return 12 # white_concrete
    # 4. 花蕊黃色
    if r > 180 and g > 150 and b < 70:
        return 7 # yellow_concrete
    # 5. 口腔深處暗紅
    if 50 <= r <= 100 and g < 40 and b < 50:
        return 16 # crimson_hyphae
    # 6. 舌頭 / 口唇粉紅
    if r > 160 and 40 <= g <= 110 and 60 <= b <= 120:
        return 15 # pink_terracotta
    # 7. 花瓣粉紅
    if r > 180 and b > 70 and g < 140:
        return 4 # pink_concrete
    # 8. 花瓣暗折線
    if 110 <= r <= 180 and 20 <= g <= 60 and 40 <= b <= 90:
        return 6 # red_terracotta
    # 9. 棕色樹幹
    if 60 <= r <= 150 and 30 <= g <= 90 and 15 <= b <= 60:
        return 10 # brown_concrete
    if 140 <= r <= 200 and 100 <= g <= 160 and 40 <= b <= 90:
        return 11 # stripped_oak_wood
    # 10. 綠色大葉片
    if g > r and g > b:
        if g > 130:
            return 8 # lime_concrete
        else:
            return 9 # green_concrete
    # 11. 青色皮膚與暗斑
    if g >= 80 and b >= 80:
        if r <= 55 and g <= 105 and b <= 105:
            return 3 # dark_prismarine
        elif g > 150 or b > 170:
            return 1 # cyan_concrete
        else:
            return 2 # prismarine_bricks

    # 通用最近距離補底
    dists = [np.sum((rgb - m['rgb'])**2) for m in MC_PALETTE]
    return MC_PALETTE[int(np.argmin(dists))]['id']

def generate():
    print('[1/4] 下載並解密 Sketchfab 數據流...')
    osgjs_data, model_bin, model_name = fetch_and_decrypt_streams(UID, progress=False)
    bin_map = {'model_file.binz': model_bin, 'model_file.bin': model_bin}
    scene = json.loads(osgjs_data.decode('utf-8'))
    
    geoms = []
    walk_geometries(scene, geoms, StateSetBinder({}, {}))
    solid_geoms = [g for g, w, b in geoms if not parse_userdata(g).get('wireframe')]
    print(f'  成功讀取 {len(solid_geoms)} 個實體網格')

    print('[2/4] 逆向回推 3D 體素座標與頂點色...')
    voxels = {}
    for g in solid_geoms:
        m = decode_geometry(g, bin_map)
        pos = np.array(m['positions']).reshape(-1, 3)
        indices = np.array(m['indices']).reshape(-1, 3)
        carr = g['VertexAttributeList']['Color']
        cvals = np.array(read_array_buffer(carr['Array'], 4, bin_map), dtype=np.uint8).reshape(-1, 4)[:, :3]

        tri_verts = pos[indices]
        tri_centers = tri_verts.mean(axis=1)
        v0, v1, v2 = tri_verts[:, 0, :], tri_verts[:, 1, :], tri_verts[:, 2, :]
        normals = np.cross(v1 - v0, v2 - v0)
        norm_lens = np.linalg.norm(normals, axis=1, keepdims=True)
        valid = norm_lens[:, 0] > 1e-5
        normals = np.where(valid[:, None], normals / np.maximum(norm_lens, 1e-9), 0)
        
        tri_vox = np.round(tri_centers - 0.5 * normals).astype(int)
        tri_colors = cvals[indices].mean(axis=1).astype(int)

        for v, c in zip(tri_vox[valid], tri_colors[valid]):
            key = (int(v[0]), int(v[1]), int(v[2]))
            if key not in voxels:
                voxels[key] = []
            voxels[key].append(c)

    voxel_map = {k: np.mean(v, axis=0).astype(int) for k, v in voxels.items()}
    print(f'  全場景總體素數: {len(voxel_map)}')

    print('[3/4] 執行高精度去底座演算法 (濾除地台、泥土與前方草叢)...')
    def is_green_plant(c):
        return c[1] > c[0] and c[1] > c[2]

    def is_dirt_or_stone(c):
        r, g, b = c
        if 35 <= r <= 95 and 25 <= g <= 75 and 15 <= b <= 60: return True
        if 20 <= r <= 65 and 20 <= g <= 65 and 20 <= b <= 65: return True
        return False

    venusaur_voxels = {}
    for (x, y, z), c in voxel_map.items():
        if y >= 45:
            venusaur_voxels[(x, y, z)] = c
        elif y >= 19:
            # 妙蛙花四足著地點為 Y=19，濾除在低高度下生長的前方草葉與泥石
            if -60 <= z <= 42:
                if not is_green_plant(c) and not is_dirt_or_stone(c):
                    venusaur_voxels[(x, y, z)] = c

    total_blocks = len(venusaur_voxels)
    min_x = min(v[0] for v in venusaur_voxels)
    max_x = max(v[0] for v in venusaur_voxels)
    min_y = min(v[1] for v in venusaur_voxels) # 19
    max_y = max(v[1] for v in venusaur_voxels) # 118
    min_z = min(v[2] for v in venusaur_voxels)
    max_z = max(v[2] for v in venusaur_voxels)

    width = max_x - min_x + 1
    height = max_y - min_y + 1 # 100
    length = max_z - min_z + 1

    print(f'  純淨妙蛙花本體方塊總數: {total_blocks}')
    print(f'  幾何尺寸: 寬(X) {width} × 高(Y) {height} × 深(Z) {length}')

    print('[4/4] 建構層級數據與輸出 venusaur_voxel_data.js...')
    # 建立 palette 結構
    palette_dict = {}
    for p in MC_PALETTE:
        palette_dict[str(p['id'])] = {
            'id': p['id'],
            'key': p['key'],
            'name': p['name'],
            'color': p['color']
        }

    total_materials = {}
    layers = []

    for y in range(min_y, max_y + 1):
        layer_idx = y - min_y + 1 # 1 ~ 100
        layer_vox = [(v[0], v[2], v) for v in venusaur_voxels if v[1] == y]
        # 依 Z 軸、X 軸排序
        layer_vox.sort(key=lambda item: (item[1], item[0]))
        
        layer_blocks = []
        layer_mats = {}
        for x, z, orig_v in layer_vox:
            rel_x = x - min_x
            rel_z = z - min_z
            bid = find_closest_block_id(venusaur_voxels[orig_v])
            layer_blocks.append([rel_x, rel_z, bid])
            
            s_bid = str(bid)
            layer_mats[s_bid] = layer_mats.get(s_bid, 0) + 1
            total_materials[s_bid] = total_materials.get(s_bid, 0) + 1

        layers.append({
            'layerIndex': layer_idx,
            'blocks': layer_blocks,
            'materials': layer_mats
        })

    data_obj = {
        'dimensions': {
            'width': width,
            'height': height,
            'length': length
        },
        'totalBlocks': total_blocks,
        'palette': palette_dict,
        'totalMaterials': total_materials,
        'layers': layers
    }

    out_file = '/home/cliff/Desktop/Pokopia/venusaur_voxel_data.js'
    with open(out_file, 'w', encoding='utf-8') as f:
        f.write('/**\n')
        f.write(' * 妙蛙花 (Venusaur #003) 3D 方塊建造資料庫\n')
        f.write(' * 官方模型來源：Sketchfab (a893ba041c1b4c8b96fce72d5393c2f7)\n')
        f.write(f' * 規格：寬 {width} × 高 {height} × 深 {length} (精準 {height} 層切片)\n')
        f.write(f' * 總方塊數：{total_blocks} 顆純淨角色本體\n')
        f.write(' */\n')
        f.write('const VENUSAUR_VOXEL_DATA = ')
        json.dump(data_obj, f, separators=(',', ':'), ensure_ascii=False)
        f.write(';\n\n')
        f.write('if (typeof module !== "undefined" && module.exports) {\n')
        f.write('  module.exports = VENUSAUR_VOXEL_DATA;\n')
        f.write('}\n')

    print(f'✓ 成功寫入 {out_file} (檔案大小: {os.path.getsize(out_file) / (1024*1024):.2f} MB)')

if __name__ == '__main__':
    generate()
