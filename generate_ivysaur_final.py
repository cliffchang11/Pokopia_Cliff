"""
妙蛙草 (Ivysaur #002) 體素資料庫生成腳本 (Smash Bros 生動張嘴版)
規格：
- 精準 76 層 (Y=1 ~ 76)
- 造型：張嘴露齒、四足平穩踏地、純淨本體 (第 1 層爪尖貼地，無地表草皮)
- 調色盤：高純度混凝土配色 (青色皮膚、粉紅/品紅花苞、淺綠/綠葉片、白爪齒、紅眼、黑瞳)
- 輸出：ivysaur_voxel_data.js
"""

import trimesh
import numpy as np
from collections import defaultdict
from scipy.ndimage import binary_fill_holes
import json
import os

glb_path = '/home/cliff/Desktop/Pokopia/scratch/ivysaur_out/Super_Smash_Bros_For_Wii_U_-_Ivysaur_Trophy.glb'
scene = trimesh.load(glb_path)

meshes = []
for node_name in scene.graph.nodes_geometry:
    transform, geom_name = scene.graph[node_name]
    geom = scene.geometry[geom_name].copy()
    geom.apply_transform(transform)
    c_visual = geom.visual.to_color()
    v_colors = c_visual.vertex_colors[:, :3]
    meshes.append((geom, v_colors))

all_v = np.vstack([m.vertices for m, _ in meshes])
min_b = all_v.min(axis=0)
max_b = all_v.max(axis=0)
span = max_b - min_b
print(f"Original Bounds: min={min_b}, max={max_b}, span={span}")

TARGET_HEIGHT = 76
scale = (TARGET_HEIGHT - 1.05) / span[1]

# 統一的 Minecraft 混凝土調色盤
MC_PALETTE = {
    1: {'id': 1, 'key': 'cyan_concrete', 'name': '青色混凝土', 'color': '#00a8c8', 'rgb': np.array([0, 168, 200])},
    2: {'id': 2, 'key': 'prismarine_bricks', 'name': '海晶石磚', 'color': '#63ab9e', 'rgb': np.array([99, 171, 158])},
    3: {'id': 3, 'key': 'dark_prismarine', 'name': '暗海晶石', 'color': '#2a554a', 'rgb': np.array([42, 85, 74])},
    4: {'id': 4, 'key': 'pink_concrete', 'name': '粉紅色混凝土', 'color': '#f04070', 'rgb': np.array([240, 64, 112])},
    5: {'id': 5, 'key': 'magenta_concrete', 'name': '品紅色混凝土', 'color': '#e02868', 'rgb': np.array([224, 40, 104])},
    6: {'id': 6, 'key': 'red_terracotta', 'name': '紅色陶土', 'color': '#9e2238', 'rgb': np.array([158, 34, 56])},
    7: {'id': 7, 'key': 'yellow_concrete', 'name': '黃色混凝土', 'color': '#f0b820', 'rgb': np.array([240, 184, 32])},
    8: {'id': 8, 'key': 'lime_concrete', 'name': '淺綠色混凝土', 'color': '#5ea918', 'rgb': np.array([94, 169, 24])},
    9: {'id': 9, 'key': 'green_concrete', 'name': '綠色混凝土', 'color': '#427020', 'rgb': np.array([66, 112, 32])},
    10: {'id': 10, 'key': 'white_concrete', 'name': '白色混凝土', 'color': '#eaeaea', 'rgb': np.array([234, 234, 234])},
    11: {'id': 11, 'key': 'red_concrete', 'name': '紅色混凝土', 'color': '#c02020', 'rgb': np.array([192, 32, 32])},
    12: {'id': 12, 'key': 'black_concrete', 'name': '黑色混凝土', 'color': '#11141a', 'rgb': np.array([17, 20, 26])},
    13: {'id': 13, 'key': 'pink_terracotta', 'name': '粉紅色陶土', 'color': '#d85068', 'rgb': np.array([216, 80, 104])},
}

def map_rgb_to_palette(rgb, pos_vox):
    vx, vy, vz = pos_vox
    r, g, b = rgb
    
    # 黑色 (眼珠瞳孔/暗部)
    if max(rgb) < 35:
        return 12 # black_concrete
        
    # 白色 (尖牙、爪子、眼白)
    if r > 185 and g > 185 and b > 185:
        return 10 # white_concrete
        
    # 眼睛虹膜紅：位置在前側頭部 (vz 較小，vy 介於 20~40)
    # 花苞則在上方背部 (vy >= 35, vz 較大)
    if r > 130 and g < 75 and b < 80:
        if vy >= 35 and vz >= 35: # 背上花苞
            return 4 if r > 180 else 5 # pink_concrete / magenta_concrete
        else: # 頭部眼睛
            return 11 # red_concrete
            
    # 口腔內部與舌頭 (暗紅/粉紅陶土)
    if r > 120 and 40 <= g <= 110 and 50 <= b <= 120 and vy <= 32:
        return 13 # pink_terracotta
        
    # 花苞粉紅與品紅
    if r > 140 and b > 55 and g < 130:
        return 4 if (r > 180 or b > 100) else 5 # pink_concrete / magenta_concrete
        
    # 葉片鮮綠色與陰影深綠
    if g > r and g > b:
        return 8 if g > 115 else 9 # lime_concrete / green_concrete
        
    # 青色皮膚與暗海晶石斑塊
    if g >= 60 and b >= 60:
        if r <= 50 and g <= 95 and b <= 95:
            return 3 # dark_prismarine (斑點)
        elif g > 130 or b > 140:
            return 1 # cyan_concrete (主體皮膚)
        else:
            return 2 # prismarine_bricks
            
    # Fallback
    dists = [np.sum((rgb - m['rgb'])**2) for m in MC_PALETTE.values()]
    return list(MC_PALETTE.keys())[int(np.argmin(dists))]

PRIORITY = {
    10: 10, # white (teeth, claws)
    11: 9,  # red (eye)
    12: 8,  # black (pupils)
    13: 7,  # pink_terracotta (mouth)
    4: 6,   # pink_concrete (flower)
    5: 6,   # magenta_concrete (flower)
    8: 5,   # lime_concrete (leaves)
    9: 5,   # green_concrete (leaves)
    3: 4,   # dark_prismarine (spots)
    1: 3,   # cyan_concrete (body)
    2: 2,   # prismarine_bricks
}

raw_voxels = {}

print("Sampling surface...")
for m_idx, (geom, v_colors) in enumerate(meshes):
    verts = geom.vertices
    faces = geom.faces
    normals = geom.face_normals
    
    for f_idx, face in enumerate(faces):
        v0, v1, v2 = verts[face]
        c0, c1, c2 = v_colors[face]
        norm = normals[f_idx]
        
        e1 = np.linalg.norm(v1 - v0)
        e2 = np.linalg.norm(v2 - v1)
        e3 = np.linalg.norm(v0 - v2)
        max_edge = max(e1, e2, e3) * scale
        
        steps = max(2, int(np.ceil(max_edge / 0.45)))
        
        for i in range(steps + 1):
            for j in range(steps + 1 - i):
                u = i / steps
                v = j / steps
                w = 1.0 - u - v
                p = u * v0 + v * v1 + w * v2
                c = u * c0 + v * c1 + w * c2
                
                p_scaled = (p - min_b) * scale
                p_vox = p_scaled - 0.2 * norm
                
                vx = int(np.floor(p_vox[0]))
                vy = int(np.floor(p_vox[1]))
                vz = int(np.floor(p_vox[2]))
                
                pal_id = map_rgb_to_palette(c, (vx, vy, vz))
                prio = PRIORITY.get(pal_id, 1)
                
                pos = (vx, vy, vz)
                if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                    raw_voxels[pos] = (pal_id, prio)

y_vals = [p[1] for p in raw_voxels.keys()]
y_min = min(y_vals)
y_max = max(y_vals)
print(f"Sampled Y range: {y_min} to {y_max} (total {y_max - y_min + 1})")

# 將 Y 軸平移至 1 ~ 76
shift_y = 1 - y_min
shifted_voxels = {}
for (vx, vy, vz), (pal_id, prio) in raw_voxels.items():
    new_y = vy + shift_y
    if 1 <= new_y <= TARGET_HEIGHT:
        shifted_voxels[(vx, new_y, vz)] = pal_id

# 平移 X 與 Z 至從 1 開始
x_min = min(p[0] for p in shifted_voxels.keys())
z_min = min(p[2] for p in shifted_voxels.keys())
shift_x = 1 - x_min
shift_z = 1 - z_min

normalized_voxels = {}
for (vx, vy, vz), pal_id in shifted_voxels.items():
    normalized_voxels[(vx + shift_x, vy, vz + shift_z)] = pal_id

w_max = max(p[0] for p in normalized_voxels.keys())
h_max = max(p[1] for p in normalized_voxels.keys())
l_max = max(p[2] for p in normalized_voxels.keys())
print(f"Normalized Dimensions: Width={w_max}, Height={h_max}, Length={l_max}")

# 實心填充身軀與花苞
print("Performing solid fill...")
layer_voxels = defaultdict(dict)
for (vx, vy, vz), pal_id in normalized_voxels.items():
    layer_voxels[vy][(vx, vz)] = pal_id

final_voxels = dict(normalized_voxels)
filled_count = 0

for vy, grid in layer_voxels.items():
    if vy < 52: # 身軀內部填充
        xs = [x for x, z in grid.keys()]
        zs = [z for x, z in grid.keys()]
        if not xs or not zs: continue
        min_x, max_x = min(xs), max(xs)
        min_z, max_z = min(zs), max(zs)
        
        nx = max_x - min_x + 1
        nz = max_z - min_z + 1
        
        if nx > 4 and nz > 4:
            mat = np.zeros((nx, nz), dtype=bool)
            for (x, z) in grid.keys():
                mat[x - min_x, z - min_z] = True
            
            filled_mat = binary_fill_holes(mat)
            new_inner = filled_mat & (~mat)
            
            for ix in range(nx):
                for iz in range(nz):
                    if new_inner[ix, iz]:
                        real_x = min_x + ix
                        real_z = min_z + iz
                        pos = (real_x, vy, real_z)
                        if pos not in final_voxels:
                            final_voxels[pos] = 1 # cyan_concrete
                            filled_count += 1

print(f"Solid fill completed. Added {filled_count} blocks. Total blocks: {len(final_voxels)}")

# 驗證層數
all_y = sorted(list(set(p[1] for p in final_voxels.keys())))
print(f"Total layers: {len(all_y)}, min={min(all_y)}, max={max(all_y)}")
assert min(all_y) == 1, f"Expected min Y=1, got {min(all_y)}"
assert max(all_y) == TARGET_HEIGHT, f"Expected max Y={TARGET_HEIGHT}, got {max(all_y)}"
assert len(all_y) == TARGET_HEIGHT, f"Expected continuous {TARGET_HEIGHT} layers, got {len(all_y)}"

# 整理各層方塊與材料統計
layers_output = []
total_materials = defaultdict(int)

for y in range(1, TARGET_HEIGHT + 1):
    blocks_in_layer = []
    layer_mat_counts = defaultdict(int)
    for (vx, vy, vz), pal_id in final_voxels.items():
        if vy == y:
            # 格式：[x, z, block_id] (對齊 bulbasaur / venusaur 格式)
            blocks_in_layer.append([vx, vz, pal_id])
            layer_mat_counts[str(pal_id)] += 1
            total_materials[str(pal_id)] += 1
            
    # 依 X, Z 排序保證切片資料穩定
    blocks_in_layer.sort(key=lambda b: (b[0], b[1]))
    layers_output.append({
        'layerIndex': y,
        'blocks': blocks_in_layer,
        'materials': dict(layer_mat_counts)
    })

# 調色盤輸出 (字串 key 字典)
palette_output = {}
for pid, info in MC_PALETTE.items():
    if str(pid) in total_materials:
        palette_output[str(pid)] = {
            'id': info['id'],
            'key': info['key'],
            'name': info['name'],
            'color': info['color']
        }

output_data = {
    'dimensions': {
        'width': int(w_max),
        'height': int(h_max),
        'length': int(l_max)
    },
    'totalBlocks': len(final_voxels),
    'palette': palette_output,
    'totalMaterials': dict(total_materials),
    'layers': layers_output
}

js_content = f"""/**
 * 妙蛙草 (Ivysaur #002) 3D 方塊建造資料庫 (Smash Bros 生動張嘴版)
 * 規格：寬 {w_max} × 高 {h_max} × 深 {l_max} (精準 {TARGET_HEIGHT} 層切片)
 * 總方塊數：{len(final_voxels)} 顆角色本體
 * 特點：生動張嘴露齒、四足平穩踏地、純淨無草皮 (第 1 層爪尖貼地)
 */
const IVYSAUR_VOXEL_DATA = {json.dumps(output_data, separators=(',', ':'))};
"""

out_file = '/home/cliff/Desktop/Pokopia/ivysaur_voxel_data.js'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\n[SUCCESS] Successfully written {out_file} ({os.path.getsize(out_file)} bytes)")
print("Material Summary:")
for pid_str, count in sorted(total_materials.items(), key=lambda x: -x[1]):
    pinfo = MC_PALETTE[int(pid_str)]
    print(f"  {pinfo['name']} ({pinfo['key']}): {count} blocks")
