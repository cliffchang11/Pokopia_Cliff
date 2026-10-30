"""
妙蛙花 (Venusaur #003) 體素資料庫生成腳本 (v4.25.0 高精度足部幾何與立體草皮版)
特點：
1. 採用深入幾何內部 0.2 個單位的 floor 採樣，徹底根除四捨六入導致的爪子膨脹與外溢薄片
2. 解除 Z 軸人為硬截斷，救回完整的下巴、下唇粉紅肉、白色獠牙與後臀身軀
3. 採用語意色彩與拓撲連通性分析 (Semantic Connected Component Filter)
4. 四足周圍保留半徑 <= 3 格的 2 層立體踏地草皮 (Y=15~17)，踏地自然厚實
5. 總建造層數 103 層 (第 1 層對應 Y=15)
"""

import os
import json
import numpy as np
from collections import deque
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
    if r > 160 and g < 65 and b < 65: return 13 # red_concrete (眼珠紅)
    if max(rgb) < 35: return 14 # black_concrete (瞳孔黑)
    if r > 175 and g > 175 and b > 175: return 12 # white_concrete (爪/齒/眼白/花瓣白斑)
    if r > 180 and g > 150 and b < 70: return 7 # yellow_concrete (花蕊黃)
    if 50 <= r <= 100 and g < 40 and b < 50: return 16 # crimson_hyphae (深紅口腔)
    if r > 160 and 40 <= g <= 110 and 60 <= b <= 120: return 15 # pink_terracotta (舌頭/口唇粉)
    if r > 180 and b > 70 and g < 140: return 4 # pink_concrete (花瓣粉紅)
    if 110 <= r <= 180 and 20 <= g <= 60 and 40 <= b <= 90: return 6 # red_terracotta (花瓣暗折線)
    if 60 <= r <= 150 and 30 <= g <= 90 and 15 <= b <= 60: return 10 # brown_concrete (棕色樹幹)
    if g >= 80 and b >= 80 and (b > r + 15 or g > r + 15):
        if r <= 55 and g <= 105 and b <= 105: return 3 # dark_prismarine (深色斑點)
        elif g > 150 or b > 170: return 1 # cyan_concrete (主體皮膚青色)
        else: return 2 # prismarine_bricks (海晶磚)

    if g > r and g > b:
        return 8 if g > 130 else 9 # lime_concrete / green_concrete

    dists = [np.sum((rgb - m['rgb'])**2) for m in MC_PALETTE]
    return MC_PALETTE[int(np.argmin(dists))]['id']

def generate():
    raw_cache_path = '/home/cliff/.gemini/antigravity-ide/brain/9b697af0-fba6-4edd-9f65-7bf3ed357241/scratch/raw_voxel_map_precise.npy'
    if os.path.exists(raw_cache_path):
        print('[1/4] 從本機快取快速讀取高精度體素網格...')
        raw_map = np.load(raw_cache_path, allow_pickle=True).item()
    else:
        print('[1/4] 下載並解密 Sketchfab 數據流...')
        osgjs_data, model_bin, model_name = fetch_and_decrypt_streams(UID, progress=False)
        bin_map = {'model_file.binz': model_bin, 'model_file.bin': model_bin}
        scene = json.loads(osgjs_data.decode('utf-8'))
        
        geoms = []
        walk_geometries(scene, geoms, StateSetBinder({}, {}))
        solid_geoms = [g for g, w, b in geoms if not parse_userdata(g).get('wireframe')]
        
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
            
            # 高精度採樣：內部 0.2 單位取 floor，根除 Banker's rounding 導致的邊界膨脹
            tri_vox = np.floor(tri_centers - 0.2 * normals).astype(int)
            tri_colors = cvals[indices].mean(axis=1).astype(int)

            for v, c in zip(tri_vox[valid], tri_colors[valid]):
                key = (int(v[0]), int(v[1]), int(v[2]))
                if key not in voxels:
                    voxels[key] = []
                voxels[key].append(c)

        raw_map = {k: np.mean(v, axis=0).astype(int) for k, v in voxels.items()}
        np.save(raw_cache_path, raw_map)

    print(f'  高精度原始模型總體素數: {len(raw_map)}')

    print('[2/4] 執行語意連通性分離與四足立體草皮吸附...')
    def is_core_body(k, c):
        x, y, z = k
        r, g, b = int(c[0]), int(c[1]), int(c[2])
        if y < 17: return False
        
        # 著地層純淨約束
        if y <= 21:
            if r > 175 and g > 175 and b > 175: return True # 白色爪子
            if b >= 110 and g >= 110 and b > r + 15: return True # 青色皮膚
            return False
            
        if y > 37: return True
        if r > 175 and g > 175 and b > 175: return True # 白色齒/眼
        if r > 105 and r > g + 20 and r > b + 15: return True # 嘴唇粉紅/眼睛紅
        if r >= 48 and r > g + 12 and r > b + 5 and g < 65: return True # 深紅口腔底部
        if r > 170 and g > 140 and b < 80: return True # 花蕊黃
        if max(r, g, b) < 35: return True # 瞳孔黑
        if g > r and g > b and g >= 135: return True # 大葉片鮮豔綠
        if b >= 110 and g >= 110 and b > r + 15: return True # 青色皮膚
        return False

    core = {k: c for k, c in raw_map.items() if is_core_body(k, c)}
    max_y_core = max(k[1] for k in core)
    top_nodes = [k for k in core if k[1] == max_y_core]
    visited_body = set(top_nodes)
    queue = deque(top_nodes)
    dirs = [
        (1,0,0), (-1,0,0), (0,1,0), (0,-1,0), (0,0,1), (0,0,-1),
        (1,1,0), (1,-1,0), (-1,1,0), (-1,-1,0),
        (1,0,1), (1,0,-1), (-1,0,1), (-1,0,-1),
        (0,1,1), (0,1,-1), (0,-1,1), (0,-1,-1),
        (1,1,1), (1,1,-1), (1,-1,1), (1,-1,-1),
        (-1,1,1), (-1,1,-1), (-1,-1,1), (-1,-1,-1)
    ]
    while queue:
        curr = queue.popleft()
        for dx, dy, dz in dirs:
            nbr = (curr[0]+dx, curr[1]+dy, curr[2]+dz)
            if nbr in core and nbr not in visited_body:
                visited_body.add(nbr)
                queue.append(nbr)

    # 斑點吸附 (Y > 21)
    spots = [k for k, c in raw_map.items() if tuple(c) == (59, 92, 84) and k[1] > 21]
    for p in spots:
        if any((p[0]+dx, p[1]+dy, p[2]+dz) in visited_body for dx, dy, dz in dirs):
            visited_body.add(p)

    print(f'  妙蛙花本體核心方塊數: {len(visited_body)}')

    # 提取四足足部核心 (Y in [17, 21])
    foot_core = [k for k in visited_body if k[1] <= 21]
    foot_coords_2d = set((k[0], k[2]) for k in foot_core)

    # 快速集合查表：半徑 <= 3 格 (2層立體草皮 Y in [15, 17])
    expanded_foot = set()
    for fx, fz in foot_coords_2d:
        for dx in range(-3, 4):
            for dz in range(-3, 4):
                expanded_foot.add((fx+dx, fz+dz))

    foot_grass = set()
    for k, c in raw_map.items():
        if 15 <= k[1] <= 17 and k not in visited_body:
            if (k[0], k[2]) in expanded_foot:
                foot_grass.add(k)

    print(f'  四足周圍 2 層踏地立體草皮方塊數: {len(foot_grass)}')

    final_voxels = {k: raw_map[k] for k in visited_body | foot_grass}
    total_blocks = len(final_voxels)

    min_x = min(k[0] for k in final_voxels)
    max_x = max(k[0] for k in final_voxels)
    min_y = min(k[1] for k in final_voxels) # 15
    max_y = max(k[1] for k in final_voxels) # 117
    min_z = min(k[2] for k in final_voxels)
    max_z = max(k[2] for k in final_voxels)

    width = max_x - min_x + 1
    height = max_y - min_y + 1 # 103 層
    length = max_z - min_z + 1

    print(f'  100% 精準高保真方塊總數: {total_blocks}')
    print(f'  幾何尺寸: 寬(X) {width} × 高(Y) {height} (共 {height} 層) × 深(Z) {length}')

    print('[3/4] 建構層級數據與材質映射...')
    palette_dict = {
        str(p['id']): {'id': p['id'], 'key': p['key'], 'name': p['name'], 'color': p['color']}
        for p in MC_PALETTE
    }

    total_materials = {}
    layers = []

    for y in range(min_y, max_y + 1):
        layer_idx = y - min_y + 1
        layer_vox = [(v[0], v[2], v) for v in final_voxels if v[1] == y]
        layer_vox.sort(key=lambda item: (item[1], item[0]))

        layer_blocks = []
        layer_mats = {}
        for vx, vz, orig_k in layer_vox:
            c = final_voxels[orig_k]
            mat_id = find_closest_block_id(c)
            local_x = vx - min_x
            local_z = vz - min_z
            layer_blocks.append([int(local_x), int(local_z), int(mat_id)])
            layer_mats[mat_id] = layer_mats.get(mat_id, 0) + 1
            total_materials[mat_id] = total_materials.get(mat_id, 0) + 1

        layers.append({
            'layerIndex': layer_idx,
            'blocks': layer_blocks,
            'materials': layer_mats
        })

    data_payload = {
        'dimensions': {'width': width, 'height': height, 'length': length},
        'totalBlocks': total_blocks,
        'palette': palette_dict,
        'totalMaterials': total_materials,
        'layers': layers
    }

    print('[4/4] 寫入 venusaur_voxel_data.js...')
    target_js = '/home/cliff/Desktop/Pokopia/venusaur_voxel_data.js'
    header = f'''/**
 * 妙蛙花 (Venusaur #003) 3D 方塊建造資料庫 (v4.25.0 高精度足部幾何與立體草皮版)
 * 規格：寬 {width} × 高 {height} × 深 {length} (精準 {height} 層切片)
 * 總方塊數：{total_blocks} 顆角色本體與腳邊立體草皮
 * 特點：左側爪及四足爪背俐落無膨脹，腳邊保留 2 層立體踏地草皮 (半徑 <= 3 格)
 */
const VENUSAUR_VOXEL_DATA = '''

    with open(target_js, 'w', encoding='utf-8') as f:
        f.write(header)
        json.dump(data_payload, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n\nif (typeof module !== "undefined" && module.exports) {\n  module.exports = VENUSAUR_VOXEL_DATA;\n}\n')

    print('🎉 venusaur_voxel_data.js 重建生成成功！')

if __name__ == '__main__':
    generate()
