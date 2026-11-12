"""
妙蛙草 (Ivysaur #002) 40 層精巧建造藍圖資料庫生成腳本 (v4.97.0)
- 來源: 任天堂官方原版模型 (Ivysaur.glb)
- 高度鎖定: 嚴格連續 40 層 (Y=1 ~ 40)，四足爪尖貼地於 Y=1
- 特徵繼承: 官方經典閉嘴微露尖牙、紅黑白大眼、暗海晶石斑點、青色混凝土純淨皮膚(無陰影)
- 輸出: ivysaur40_voxel_data.js
"""

import trimesh
import numpy as np
from collections import defaultdict
from scipy.ndimage import binary_fill_holes
import json
import os

glb_path = '/home/cliff/Desktop/Pokopia/scratch/ivysaur_classic_out/Ivysaur.glb'
scene = trimesh.load(glb_path)

meshes = []
for node_name in scene.graph.nodes_geometry:
    transform, geom_name = scene.graph[node_name]
    geom = scene.geometry[geom_name].copy()
    geom.apply_transform(transform)
    meshes.append((geom_name, geom))

mesh_dict = {}
for name, geom in meshes:
    if '46' in name:
        mesh_dict['body'] = geom
    elif '47' in name:
        mesh_dict['eyes'] = geom
    elif '48' in name:
        mesh_dict['leaves'] = geom
    elif '49' in name:
        mesh_dict['flower'] = geom

print("已載入部位:", list(mesh_dict.keys()))

all_verts = np.vstack([m.vertices for m in mesh_dict.values()])
min_b = all_verts.min(axis=0)
max_b = all_verts.max(axis=0)
span = max_b - min_b
print(f"世界座標 Bounds: min={min_b}, max={max_b}, span={span}")

TARGET_HEIGHT = 40
scale = (TARGET_HEIGHT - 1.05) / span[1]
print(f"縮放因子 scale (40層): {scale:.4f}")

# Minecraft 調色盤定義
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
}

# 優先級
PRIORITY = {
    10: 10, # 白 (牙齒、高光點、爪尖)
    12: 9,  # 黑 (瞳孔)
    11: 8,  # 紅 (眼睛虹膜)
    4: 7,   # 粉紅花苞
    5: 7,   # 品紅花瓣分界
    8: 6,   # 淺綠葉片
    9: 6,   # 綠葉陰影
    3: 5,   # 暗海晶石斑點
    1: 4,   # 青色主體皮膚
    2: 3,   # 海晶石磚
}

def sample_texture(tex_img, uv):
    w, h = tex_img.size
    u = uv[0] % 1.0
    v = uv[1] % 1.0
    px = int(np.clip(u * w, 0, w - 1))
    py = int(np.clip((1.0 - v) * h, 0, h - 1))
    return np.array(tex_img.getpixel((px, py))[:3])

raw_voxels = {}

# 1. 取樣身軀 (Body)
print("取樣身軀本體...")
body_geom = mesh_dict['body']
body_tex = body_geom.visual.material.baseColorTexture.convert('RGBA')
b_verts = body_geom.vertices
b_faces = body_geom.faces
b_uvs = body_geom.visual.uv

for face in b_faces:
    v0, v1, v2 = b_verts[face]
    uv0, uv1, uv2 = b_uvs[face]
    
    e1 = np.linalg.norm(v1 - v0) * scale
    e2 = np.linalg.norm(v2 - v1) * scale
    e3 = np.linalg.norm(v0 - v2) * scale
    steps = max(2, int(np.ceil(max(e1, e2, e3) / 0.45)))
    
    for i in range(steps + 1):
        for j in range(steps + 1 - i):
            u = i / steps
            v = j / steps
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            p_scaled = (p - min_b) * scale
            vx = int(np.round(p_scaled[0]))
            vy = int(np.round(p_scaled[1]))
            vz = int(np.round(p_scaled[2]))
            
            # 歸一化比例判定 (0.0 ~ 1.0)
            norm_x = (p[0] - min_b[0]) / span[0]
            norm_y = (p[1] - min_b[1]) / span[1]
            norm_z = (p[2] - min_b[2]) / span[2]
            
            rgb = sample_texture(body_tex, uv)
            r, g, b_col = rgb[0], rgb[1], rgb[2]
            
            # 精確語意色彩解碼
            # A. 爪尖白色
            if norm_y < 0.16 and (r > 160 and g > 160 and b_col > 160):
                pal = 10
            # B. 嘴角立體白獠牙 (臉部前側下緣白點)
            elif (norm_z > 0.68) and (0.35 <= norm_y <= 0.58) and (abs(norm_x - 0.5) > 0.08) and (r > 160 and g > 160 and b_col > 160):
                pal = 10
            # C. 標誌性暗海晶石斑點 (幾何深色區塊，排斥腹部陰影)
            elif (r < 75 and g < 115 and b_col < 105) and (norm_y > 0.22):
                pal = 3
            # D. 身軀純淨青色混凝土 (排斥陰影髒黑)
            else:
                pal = 1
                
            pt = (vx, vy, vz)
            if pt not in raw_voxels or PRIORITY[pal] > PRIORITY[raw_voxels[pt]]:
                raw_voxels[pt] = pal

print(f"身軀體素數量: {len(raw_voxels)}")

# 2. 取樣眼睛 (Eyes)
print("取樣眼睛...")
eyes_geom = mesh_dict['eyes']
eyes_tex = eyes_geom.visual.material.baseColorTexture.convert('RGBA')
e_verts = eyes_geom.vertices
e_faces = eyes_geom.faces
e_uvs = eyes_geom.visual.uv

for face in e_faces:
    v0, v1, v2 = e_verts[face]
    uv0, uv1, uv2 = e_uvs[face]
    
    e1 = np.linalg.norm(v1 - v0) * scale
    e2 = np.linalg.norm(v2 - v1) * scale
    e3 = np.linalg.norm(v0 - v2) * scale
    steps = max(2, int(np.ceil(max(e1, e2, e3) / 0.40)))
    
    for i in range(steps + 1):
        for j in range(steps + 1 - i):
            u = i / steps
            v = j / steps
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            p_scaled = (p - min_b) * scale
            vx = int(np.round(p_scaled[0]))
            vy = int(np.round(p_scaled[1]))
            vz = int(np.round(p_scaled[2]))
            
            rgb = sample_texture(eyes_tex, uv)
            r, g, b_col = rgb[0], rgb[1], rgb[2]
            
            if r > 180 and g > 180 and b_col > 180:
                pal = 10 # 高光白
            elif r > 120 and g < 70 and b_col < 70:
                pal = 11 # 虹膜紅
            elif max(r, g, b_col) < 65:
                pal = 12 # 瞳孔黑
            else:
                pal = 12
                
            pt = (vx, vy, vz)
            raw_voxels[pt] = pal

# 3. 取樣葉片 (Leaves)
print("取樣背部綠葉...")
leaves_geom = mesh_dict['leaves']
leaves_tex = leaves_geom.visual.material.baseColorTexture.convert('RGBA')
l_verts = leaves_geom.vertices
l_faces = leaves_geom.faces
l_uvs = leaves_geom.visual.uv

for face in l_faces:
    v0, v1, v2 = l_verts[face]
    uv0, uv1, uv2 = l_uvs[face]
    
    e1 = np.linalg.norm(v1 - v0) * scale
    e2 = np.linalg.norm(v2 - v1) * scale
    e3 = np.linalg.norm(v0 - v2) * scale
    steps = max(2, int(np.ceil(max(e1, e2, e3) / 0.42)))
    
    for i in range(steps + 1):
        for j in range(steps + 1 - i):
            u = i / steps
            v = j / steps
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            p_scaled = (p - min_b) * scale
            vx = int(np.round(p_scaled[0]))
            vy = int(np.round(p_scaled[1]))
            vz = int(np.round(p_scaled[2]))
            
            rgb = sample_texture(leaves_tex, uv)
            r, g, b_col = rgb[0], rgb[1], rgb[2]
            
            if g > 110 and r < 140:
                pal = 8 # 淺綠色
            else:
                pal = 9 # 深綠色
                
            pt = (vx, vy, vz)
            if pt not in raw_voxels or PRIORITY[pal] >= PRIORITY[raw_voxels[pt]]:
                raw_voxels[pt] = pal

# 4. 取樣花苞 (Flower)
print("取樣粉紅花苞...")
flower_geom = mesh_dict['flower']
flower_tex = flower_geom.visual.material.baseColorTexture.convert('RGBA')
f_verts = flower_geom.vertices
f_faces = flower_geom.faces
f_uvs = flower_geom.visual.uv

for face in f_faces:
    v0, v1, v2 = f_verts[face]
    uv0, uv1, uv2 = f_uvs[face]
    
    e1 = np.linalg.norm(v1 - v0) * scale
    e2 = np.linalg.norm(v2 - v1) * scale
    e3 = np.linalg.norm(v0 - v2) * scale
    steps = max(2, int(np.ceil(max(e1, e2, e3) / 0.42)))
    
    for i in range(steps + 1):
        for j in range(steps + 1 - i):
            u = i / steps
            v = j / steps
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            p_scaled = (p - min_b) * scale
            vx = int(np.round(p_scaled[0]))
            vy = int(np.round(p_scaled[1]))
            vz = int(np.round(p_scaled[2]))
            
            rgb = sample_texture(flower_tex, uv)
            r, g, b_col = rgb[0], rgb[1], rgb[2]
            
            if r > 180 and b_col > 90 and g < 100:
                pal = 4 # 粉紅混凝土
            elif r > 140 and b_col > 60:
                pal = 5 # 品紅混凝土
            else:
                pal = 4
                
            pt = (vx, vy, vz)
            if pt not in raw_voxels or PRIORITY[pal] >= PRIORITY[raw_voxels[pt]]:
                raw_voxels[pt] = pal

print(f"全模型採樣方塊總數: {len(raw_voxels)}")

# 建立體積網格並執行內部實體填充 (Flood-fill Solidify)
xs = [p[0] for p in raw_voxels.keys()]
ys = [p[1] for p in raw_voxels.keys()]
zs = [p[2] for p in raw_voxels.keys()]
min_x, max_x = min(xs), max(xs)
min_y, max_y = min(ys), max(ys)
min_z, max_z = min(zs), max(zs)

dim_x = max_x - min_x + 3
dim_y = max_y - min_y + 3
dim_z = max_z - min_z + 3

grid_solid = np.zeros((dim_x, dim_y, dim_z), dtype=bool)
grid_color = np.zeros((dim_x, dim_y, dim_z), dtype=np.int16)

for (vx, vy, vz), pal in raw_voxels.items():
    gx = vx - min_x + 1
    gy = vy - min_y + 1
    gz = vz - min_z + 1
    grid_solid[gx, gy, gz] = True
    grid_color[gx, gy, gz] = pal

# 內部掏空修補填充 (binary_fill_holes)
print("執行三維內部空洞實心填充...")
filled_solid = binary_fill_holes(grid_solid)
fill_count = np.sum(filled_solid) - np.sum(grid_solid)
print(f"實體化增補內部方塊: {fill_count} 顆")

for gx in range(dim_x):
    for gy in range(dim_y):
        for gz in range(dim_z):
            if filled_solid[gx, gy, gz] and not grid_solid[gx, gy, gz]:
                grid_solid[gx, gy, gz] = True
                grid_color[gx, gy, gz] = 1 # 內核填純淨青色

# 3D 鄰域平滑 (Spike removal filter)
print("執行 3D 鄰域曲面平滑...")
smooth_solid = grid_solid.copy()
pruned_count = 0
for gx in range(1, dim_x - 1):
    for gy in range(1, dim_y - 1):
        for gz in range(1, dim_z - 1):
            if not grid_solid[gx, gy, gz]:
                continue
            pal = grid_color[gx, gy, gz]
            if pal in (10, 11, 12): # 保護五官與牙齒
                continue
            neighborhood = grid_solid[gx-1:gx+2, gy-1:gy+2, gz-1:gz+2]
            n_count = np.sum(neighborhood) - 1
            if n_count <= 6:
                smooth_solid[gx, gy, gz] = False
                pruned_count += 1

print(f"修整毛刺方塊: {pruned_count} 顆")

final_blocks = {}
for gx in range(dim_x):
    for gy in range(dim_y):
        for gz in range(dim_z):
            if smooth_solid[gx, gy, gz]:
                vx = gx + min_x - 1
                vy = gy + min_y - 1
                vz = gz + min_z - 1
                pal = int(grid_color[gx, gy, gz]) if grid_color[gx, gy, gz] > 0 else 1
                final_blocks[(vx, vy, vz)] = pal

# 嚴格校準 1 ~ 40 層
all_ys = [p[1] for p in final_blocks.keys()]
y_min_curr = min(all_ys)
shift_y = 1 - y_min_curr

aligned_blocks = {}
for (vx, vy, vz), pal in final_blocks.items():
    ny = vy + shift_y
    aligned_blocks[(vx, ny, vz)] = pal

actual_h = max(p[1] for p in aligned_blocks.keys())
print(f"目前最高 Y: {actual_h}")
if actual_h > TARGET_HEIGHT:
    aligned_blocks = {p: pal for p, pal in aligned_blocks.items() if p[1] <= TARGET_HEIGHT}
elif actual_h < TARGET_HEIGHT:
    top_y = actual_h
    while top_y < TARGET_HEIGHT:
        top_pts = [p for p in aligned_blocks.keys() if p[1] == top_y]
        mid_x = int(np.mean([p[0] for p in top_pts]))
        mid_z = int(np.mean([p[2] for p in top_pts]))
        top_y += 1
        aligned_blocks[(mid_x, top_y, mid_z)] = 4 # pink_concrete

# 平移 X, Z 自 1 開始
all_xs = [p[0] for p in aligned_blocks.keys()]
all_zs = [p[2] for p in aligned_blocks.keys()]
shift_x = 1 - min(all_xs)
shift_z = 1 - min(all_zs)

normalized_data = {}
for (vx, vy, vz), pal in aligned_blocks.items():
    normalized_data[(vx + shift_x, vy, vz + shift_z)] = pal

max_w = max(p[0] for p in normalized_data.keys())
max_h = max(p[1] for p in normalized_data.keys())
max_l = max(p[2] for p in normalized_data.keys())

print(f"最終模型尺寸: 寬 {max_w} x 高 {max_h} x 深 {max_l}")
print(f"總方塊數: {len(normalized_data)}")

all_final_ys = sorted(list(set(p[1] for p in normalized_data.keys())))
assert min(all_final_ys) == 1, f"Y 最小值應為 1，目前為 {min(all_final_ys)}"
assert max(all_final_ys) == TARGET_HEIGHT, f"Y 最大值應為 {TARGET_HEIGHT}，目前為 {max(all_final_ys)}"
assert len(all_final_ys) == TARGET_HEIGHT, f"應為連續 {TARGET_HEIGHT} 層，目前為 {len(all_final_ys)}"

# 依層組織
layers_dict = defaultdict(list)
for (vx, vy, vz), pal in normalized_data.items():
    layers_dict[vy].append([vx, vz, pal])

layers_list = []
for y in range(1, TARGET_HEIGHT + 1):
    blocks = sorted(layers_dict[y], key=lambda b: (b[1], b[0]))
    mat_counts = defaultdict(int)
    for b in blocks:
        mat_counts[b[2]] += 1
    layers_list.append({
        'layerIndex': y,
        'blocks': blocks,
        'materials': dict(mat_counts)
    })

mat_totals = defaultdict(int)
for b in normalized_data.values():
    mat_totals[b] += 1

palette_out = {}
for pid, pdata in MC_PALETTE.items():
    if pid in mat_totals:
        palette_out[str(pid)] = {
            'id': pdata['id'],
            'key': pdata['key'],
            'name': pdata['name'],
            'color': pdata['color']
        }

export_obj = {
    'name': '妙蛙草 (Ivysaur #002) - 精巧 40 層體素建造藍圖',
    'totalBlocks': len(normalized_data),
    'dimensions': {
        'width': max_w,
        'height': max_h,
        'length': max_l
    },
    'palette': palette_out,
    'layers': layers_list
}

js_content = f"// 妙蛙草 (Ivysaur #002) 精巧 40 層體素建造藍圖資料庫\n"
js_content += f"// 來源: 任天堂官方原版模型 (Ivysaur.glb) 等比重構\n"
js_content += f"// 姿態: 四足貼地 (Y=1)、自然閉嘴微露尖牙、高對比大眼、立體厚葉片、飽滿分瓣花苞\n"
js_content += f"const IVYSAUR_40_VOXEL_DATA = " + json.dumps(export_obj, ensure_ascii=False) + ";\n\n"
js_content += "if (typeof module !== 'undefined' && module.exports) {\n"
js_content += "  module.exports = IVYSAUR_40_VOXEL_DATA;\n"
js_content += "}\n"

with open('/home/cliff/Desktop/Pokopia/ivysaur40_voxel_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"成功輸出至 /home/cliff/Desktop/Pokopia/ivysaur40_voxel_data.js！")
