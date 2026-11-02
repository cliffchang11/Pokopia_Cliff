"""
妙蛙草 (Ivysaur #002) 經典閉嘴圖鑑款 76 層體素建造藍圖生成腳本
- 模型來源: 任天堂官方原版提取 (nguyenlouis32, Ivysaur.glb)
- 特徵融合: 雙軌結合 Bloxelizer 35 層體素特徵 (閉嘴微露尖牙、高對比大眼高光、乾淨暗海晶石斑點、2 格立體厚葉片、飽滿分瓣花苞)
- 高度鎖定: 嚴格連續 76 層 (Y=1 ~ 76)，四足爪尖貼地
"""

import trimesh
import numpy as np
from PIL import Image
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

# 分類 4 個部位
# Material #46: 身軀 (Body)
# Material #47: 雙眼 (Eyes)
# Material #48: 葉片 (Leaves)
# Material #49: 花苞 (Flower)

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

TARGET_HEIGHT = 76
scale = (TARGET_HEIGHT - 1.05) / span[1]
print(f"縮放因子 scale: {scale:.4f}")

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
            
            rgb = sample_texture(body_tex, uv)
            r, g, b = rgb
            
            # 爪子與兩側嘴角原生尖牙 (白色)
            # 1. 足底爪尖: vy < 15
            # 2. 兩側嘴角原生立體小虎牙: 左側 X in [32, 37], 右側 X in [60, 65], vy in [16, 20], vz >= 82
            is_claw = (vy < 15)
            is_corner_tooth = (16 <= vy <= 20 and vz >= 82 and (32 <= vx <= 37 or 60 <= vx <= 65))
            if r > 200 and g > 200 and b > 200 and (is_claw or is_corner_tooth):
                pal_id = 10
            else:
                # 排除背光接觸陰影區 (後腿跨下/跨內側、背部與葉片正下方接縫)
                is_groin_shade = (vy < 23 and abs(vx - 50) < 12 and vz < 65)
                is_leaf_underside_shade = (vy >= 33 and 40 <= vz <= 65 and abs(vx - 50) < 18)
                # 排除嘴部深色唇縫紋路 (嘴巴整條紋路 100% 復原為青色皮膚固有色，不誤判為斑點)
                is_mouth_seam = (15 <= vy <= 25 and vz >= 80)
                is_shade_or_seam = is_groin_shade or is_leaf_underside_shade or is_mouth_seam
                
                # 真斑點判定 (暗海晶石斑點: 涵蓋後臀、尾部、側腹、額頭與雙眉紋路)
                # 斑點固有色: R < 98 且 G >= 60 且 B >= 75 且深於皮膚色調 (r + 35 < g)
                is_true_spot = (r < 98 and g >= 60 and b >= 75 and (r + 35 < g))
                
                if is_true_spot and not is_shade_or_seam:
                    pal_id = 3 # dark_prismarine (暗海晶石斑點)
                else:
                    pal_id = 1 # cyan_concrete (純淨青色混凝土皮膚)
                
            prio = PRIORITY[pal_id]
            pos = (vx, vy, vz)
            if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                raw_voxels[pos] = (pal_id, prio)


# 2. 取樣雙眼 (Eyes - 超採樣還原黑框黑瞳、鮮紅虹膜與潔白高光點，眼周青色皮膚 100% 密合填補)
print("取樣雙眼五官 (12x12 超採樣，精確還原斜三角紅眼黑瞳與高光，眼周皮膚無縫密合)...")
eye_geom = mesh_dict['eyes']
eye_tex = eye_geom.visual.material.baseColorTexture.convert('RGBA')
e_verts = eye_geom.vertices
e_faces = eye_geom.faces
e_uvs = eye_geom.visual.uv

for face in e_faces:
    v0, v1, v2 = e_verts[face]
    uv0, uv1, uv2 = e_uvs[face]
    
    # 12x12 超採樣捕捉微小高光與黑眼線
    for u in np.linspace(0.02, 0.98, 12):
        for v in np.linspace(0.02, 0.98 - u, 12):
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            p_scaled = (p - min_b) * scale
            vx = int(np.round(p_scaled[0]))
            vy = int(np.round(p_scaled[1]))
            vz = int(np.round(p_scaled[2]))
            
            rgb = sample_texture(eye_tex, uv)
            r, g, b = rgb
            
            # 1. 潔白高光點 (White Concrete)
            if r > 180 and g > 180 and b > 180:
                pal_id = 10
            # 2. 黑色深邃眼框線與長瞳孔 (Black Concrete)
            elif max(r, g, b) < 70:
                pal_id = 12
            # 3. 鮮紅虹膜 (Red Concrete)
            elif r > 105 and r > g + 25 and r > b + 25:
                pal_id = 11
            # 4. 眼周青色皮膚 (Cyan Concrete - 100% 填滿眼窩，徹底杜絕空洞透底)
            else:
                pal_id = 1
                
            prio = PRIORITY[pal_id]
            pos = (vx, vy, vz)
            if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                raw_voxels[pos] = (pal_id, prio)

# 3. 取樣葉片 (Leaves - 擴展雙層 2 格方塊立體厚度)
print("取樣背部葉片 (立體 2 格厚度)...")
leaf_geom = mesh_dict['leaves']
leaf_tex = leaf_geom.visual.material.baseColorTexture.convert('RGBA')
l_verts = leaf_geom.vertices
l_faces = leaf_geom.faces
l_uvs = leaf_geom.visual.uv
l_norms = leaf_geom.face_normals

for f_idx, face in enumerate(l_faces):
    v0, v1, v2 = l_verts[face]
    uv0, uv1, uv2 = l_uvs[face]
    norm = l_norms[f_idx]
    
    e1 = np.linalg.norm(v1 - v0) * scale
    e2 = np.linalg.norm(v2 - v1) * scale
    e3 = np.linalg.norm(v0 - v2) * scale
    steps = max(2, int(np.ceil(max(e1, e2, e3) / 0.45)))
    
    # 正反向擴展雙層
    offsets = [-0.3, 0.0, 0.3]
    for i in range(steps + 1):
        for j in range(steps + 1 - i):
            u = i / steps
            v = j / steps
            w = 1.0 - u - v
            p = u * v0 + v * v1 + w * v2
            uv = u * uv0 + v * uv1 + w * uv2
            
            rgb = sample_texture(leaf_tex, uv)
            r, g, b = rgb
            # 淺綠 vs 綠色混凝土
            pal_id = 8 if g > 130 else 9
            prio = PRIORITY[pal_id]
            
            for off in offsets:
                p_off = p + (off / scale) * norm
                p_scaled = (p_off - min_b) * scale
                vx = int(np.round(p_scaled[0]))
                vy = int(np.round(p_scaled[1]))
                vz = int(np.round(p_scaled[2]))
                
                pos = (vx, vy, vz)
                if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                    raw_voxels[pos] = (pal_id, prio)

# 4. 取樣背頂大花苞 (Flower)
print("取樣背頂大花苞...")
flower_geom = mesh_dict['flower']
flower_tex = flower_geom.visual.material.baseColorTexture.convert('RGBA')
fl_verts = flower_geom.vertices
fl_faces = flower_geom.faces
fl_uvs = flower_geom.visual.uv

for face in fl_faces:
    v0, v1, v2 = fl_verts[face]
    uv0, uv1, uv2 = fl_uvs[face]
    
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
            
            rgb = sample_texture(flower_tex, uv)
            r, g, b = rgb
            # 品紅 (深色花瓣分界) vs 粉紅混凝土 (花苞主體)
            pal_id = 5 if r < 190 else 4
            prio = PRIORITY[pal_id]
            
            pos = (vx, vy, vz)
            if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                raw_voxels[pos] = (pal_id, prio)

print(f"總取樣表面方塊數: {len(raw_voxels)}")

# 建立 3D 體積網格進行身軀實心填充與形態學平滑
all_pts = list(raw_voxels.keys())
min_x = min(p[0] for p in all_pts)
max_x = max(p[0] for p in all_pts)
min_y = min(p[1] for p in all_pts)
max_y = max(p[1] for p in all_pts)
min_z = min(p[2] for p in all_pts)
max_z = max(p[2] for p in all_pts)

dim_x = max_x - min_x + 3
dim_y = max_y - min_y + 3
dim_z = max_z - min_z + 3

grid_solid = np.zeros((dim_x, dim_y, dim_z), dtype=bool)
grid_color = np.zeros((dim_x, dim_y, dim_z), dtype=np.int32)

for (vx, vy, vz), (pal_id, prio) in raw_voxels.items():
    gx = vx - min_x + 1
    gy = vy - min_y + 1
    gz = vz - min_z + 1
    grid_solid[gx, gy, gz] = True
    grid_color[gx, gy, gz] = pal_id

print("身軀實心填充與花苞內部封閉 (隔離葉片展開高度，杜絕葉下假性填充)...")
for gy in range(dim_y):
    vy_actual = gy + min_y - 1
    # 僅在身軀主體高度 (vy <= 33) 或花苞頂部 (vy >= 47) 執行閉合填充
    # 葉片展開過渡高度 (34 <= vy <= 46) 嚴禁填充，保持葉面中空與綠色葉背純淨
    if vy_actual > 33 and vy_actual < 47:
        continue
    slice_2d = grid_solid[:, gy, :]
    if np.any(slice_2d):
        filled_2d = binary_fill_holes(slice_2d)
        new_voxels = filled_2d & (~slice_2d)
        grid_solid[:, gy, :][new_voxels] = True
        # 身軀內部填青色，花苞內部填粉紅
        fill_color = 4 if vy_actual >= 47 else 1
        grid_color[:, gy, :][new_voxels] = fill_color

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
            # 保護五官、尖牙與爪尖
            if pal in (10, 11, 12):
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

# 嚴格校準 1 ~ 76 層
all_ys = [p[1] for p in final_blocks.keys()]
y_min_curr = min(all_ys)
y_max_curr = max(all_ys)
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
    'name': '妙蛙草 (Ivysaur #002) - 經典閉嘴圖鑑款 (雙軌 76 層版)',
    'totalBlocks': len(normalized_data),
    'dimensions': {
        'width': max_w,
        'height': max_h,
        'length': max_l
    },
    'palette': palette_out,
    'layers': layers_list
}

js_content = f"// 妙蛙草 (Ivysaur #002) 經典閉嘴圖鑑款 76 層體素建造藍圖資料庫\n"
js_content += f"// 來源: 任天堂官方原版模型 (nguyenlouis32) 雙軌融合 Bloxelizer 體素特徵\n"
js_content += f"// 姿態: 四足貼地、自然閉嘴微露尖牙、高對比大眼、2 格立體厚葉片、飽滿分瓣花苞\n"
js_content += f"const IVYSAUR_VOXEL_DATA = " + json.dumps(export_obj, ensure_ascii=False) + ";\n\n"
js_content += "if (typeof module !== 'undefined' && module.exports) {\n"
js_content += "  module.exports = IVYSAUR_VOXEL_DATA;\n"
js_content += "}\n"

with open('/home/cliff/Desktop/Pokopia/ivysaur_voxel_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"成功輸出至 /home/cliff/Desktop/Pokopia/ivysaur_voxel_data.js！")
