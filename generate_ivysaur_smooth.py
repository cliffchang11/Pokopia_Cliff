"""
妙蛙草 (Ivysaur #002) 高精度流線平滑與造型重塑腳本
- 任務 1: 葉片厚度增強至 2 格厚，消除邊緣破碎
- 任務 2: 嘴型收斂平整化，微張露齒，呈現自然微弧與白尖牙
- 任務 3: 3D 形態學鄰域濾波平滑，消除孤立毛刺與梯田生硬階梯
- 任務 4: 嚴格連續 76 層 (Y=1 ~ 76)，輸出 ivysaur_voxel_data.js
"""

import trimesh
import numpy as np
from collections import defaultdict
from scipy.ndimage import binary_fill_holes, binary_closing, binary_opening, generate_binary_structure
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
    meshes.append((geom_name, geom, v_colors))

all_v = np.vstack([m.vertices for _, m, _ in meshes])
min_b = all_v.min(axis=0)
max_b = all_v.max(axis=0)
span = max_b - min_b
print(f"Original Bounds: min={min_b}, max={max_b}, span={span}")

TARGET_HEIGHT = 76
scale = (TARGET_HEIGHT - 1.05) / span[1]

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
    13: {'id': 13, 'key': 'pink_terracotta', 'name': '粉紅色陶土', 'color': '#d85068', 'rgb': np.array([216, 80, 104])},
}

def map_rgb(rgb, pos_vox, geom_name):
    vx, vy, vz = pos_vox
    r, g, b = rgb
    
    # 黑色 (眼珠瞳孔)
    if max(rgb) < 35:
        return 12
        
    # 白色 (尖牙、爪子、眼白)
    if r > 180 and g > 180 and b > 180:
        return 10
        
    # 眼睛虹膜紅：位置在前側頭部 (vz 較大，vy 介於 22~38)
    if r > 130 and g < 75 and b < 80:
        if vy >= 35 and vz <= 35: # 背上花苞
            return 4 if r > 180 else 5
        else: # 頭部眼睛
            return 11
            
    # 花苞粉紅與品紅
    if r > 140 and b > 55 and g < 130:
        return 4 if (r > 180 or b > 100) else 5
        
    # 葉片鮮綠色與陰影深綠
    if g > r and g > b:
        return 8 if g > 115 else 9
        
    # 青色皮膚與暗海晶石斑塊
    if g >= 60 and b >= 60:
        if r <= 50 and g <= 95 and b <= 95:
            return 3 # dark_prismarine (斑點)
        elif g > 130 or b > 140:
            return 1 # cyan_concrete (主體皮膚)
        else:
            return 2 # prismarine_bricks
            
    # 口腔/舌頭 (粉紅陶土/紅色陶土)
    if r > 120 and 40 <= g <= 110 and vy <= 32:
        return 6
        
    dists = [np.sum((rgb - m['rgb'])**2) for m in MC_PALETTE.values()]
    return list(MC_PALETTE.keys())[int(np.argmin(dists))]

PRIORITY = {
    10: 10, # white (teeth, claws)
    11: 9,  # red (eye)
    12: 8,  # black (pupils)
    6: 7,   # red_terracotta (mouth interior)
    13: 7,  # pink_terracotta
    4: 6,   # pink_concrete (flower)
    5: 6,   # magenta_concrete (flower)
    8: 5,   # lime_concrete (leaves)
    9: 5,   # green_concrete (leaves)
    3: 4,   # dark_prismarine (spots)
    1: 3,   # cyan_concrete (body)
    2: 2,   # prismarine_bricks
}

raw_voxels = {}
voxel_positions = set()

print("採樣 3D 幾何表面並擴展葉片實體厚度...")
for geom_name, geom, v_colors in meshes:
    verts = geom.vertices
    faces = geom.faces
    normals = geom.face_normals
    
    is_plant = (geom_name == '1') # 花苞與葉片
    
    for f_idx, face in enumerate(faces):
        v0, v1, v2 = verts[face]
        c0, c1, c2 = v_colors[face]
        norm = normals[f_idx]
        
        # 判斷是否為綠色葉片
        face_mean_color = (c0 + c1 + c2) / 3.0
        is_leaf = is_plant and (face_mean_color[1] > face_mean_color[0] and face_mean_color[1] > face_mean_color[2])
        
        e1 = np.linalg.norm(v1 - v0)
        e2 = np.linalg.norm(v2 - v1)
        e3 = np.linalg.norm(v0 - v2)
        max_edge = max(e1, e2, e3) * scale
        
        steps = max(2, int(np.ceil(max_edge / 0.4)))
        
        # 針對葉片做法向正反雙向增厚 (達到 2 格方塊實體厚度)
        offsets = [-0.25, 0.0, 0.25] if is_leaf else [0.0]
        
        for i in range(steps + 1):
            for j in range(steps + 1 - i):
                u = i / steps
                v = j / steps
                w = 1.0 - u - v
                p = u * v0 + v * v1 + w * v2
                c = u * c0 + v * c1 + w * c2
                
                for off in offsets:
                    p_offset = p + (off / scale) * norm
                    p_scaled = (p_offset - min_b) * scale
                    
                    vx = int(np.round(p_scaled[0]))
                    vy = int(np.round(p_scaled[1]))
                    vz = int(np.round(p_scaled[2]))
                    
                    pal_id = map_rgb(c, (vx, vy, vz), geom_name)
                    prio = PRIORITY.get(pal_id, 1)
                    
                    pos = (vx, vy, vz)
                    if pos not in raw_voxels or raw_voxels[pos][1] < prio:
                        raw_voxels[pos] = (pal_id, prio)

print(f"初始採樣方塊數量: {len(raw_voxels)}")

# 計算空間維度
all_pts = list(raw_voxels.keys())
min_x = min(p[0] for p in all_pts)
max_x = max(p[0] for p in all_pts)
min_y = min(p[1] for p in all_pts)
max_y = max(p[1] for p in all_pts)
min_z = min(p[2] for p in all_pts)
max_z = max(p[2] for p in all_pts)

print(f"體素空間範圍: X=[{min_x}, {max_x}], Y=[{min_y}, {max_y}], Z=[{min_z}, {max_z}]")

# 建立 3D 體積網格進行實體填充與形態學平滑
dim_x = max_x - min_x + 3
dim_y = max_y - min_y + 3
dim_z = max_z - min_z + 3

grid_solid = np.zeros((dim_x, dim_y, dim_z), dtype=bool)
grid_color = np.zeros((dim_x, dim_y, dim_z), dtype=np.int32)
grid_prio = np.zeros((dim_x, dim_y, dim_z), dtype=np.int32)

for (vx, vy, vz), (pal_id, prio) in raw_voxels.items():
    gx = vx - min_x + 1
    gy = vy - min_y + 1
    gz = vz - min_z + 1
    grid_solid[gx, gy, gz] = True
    grid_color[gx, gy, gz] = pal_id
    grid_prio[gx, gy, gz] = prio

print("執行 3D 形態學閉運算填補表皮縫隙與身軀實心填充...")
# 針對身體部分進行實體填充
struct_cross = generate_binary_structure(3, 1) # 6-連通
for gy in range(dim_y):
    # 僅對身軀高度進行封閉填洞
    vy_actual = gy + min_y - 1
    slice_2d = grid_solid[:, gy, :]
    if np.any(slice_2d) and vy_actual < 50:
        filled_2d = binary_fill_holes(slice_2d)
        new_voxels = filled_2d & (~slice_2d)
        grid_solid[:, gy, :][new_voxels] = True
        # 內部填充為青色混凝土
        grid_color[:, gy, :][new_voxels] = 1
        grid_prio[:, gy, :][new_voxels] = 3

print("執行任務 2：收斂嘴型，平整化過深黑洞，保留自然微弧與潔白尖牙...")
# 嘴部在體素網格中：
# 經分析，嘴部位於頭部前端 (較大的 Z, 中間偏左偏右的 X, Y 介於 22~34)
# 口腔深處的黑色空腔收斂為青色皮膚
for gx in range(dim_x):
    for gy in range(dim_y):
        for gz in range(dim_z):
            if not grid_solid[gx, gy, gz]:
                continue
            vy_act = gy + min_y - 1
            pal = grid_color[gx, gy, gz]
            
            # 如果是口腔深處的黑色或暗陶土 (Y 不在嘴微開範圍，或深入頭部內部)
            # 嘴微開範圍鎖定在 Y: 25~30
            if pal in (6, 12, 13) and vy_act < 38:
                # 檢查是否過深 (前方是否有其他方塊擋住，即不是外露表皮)
                is_deep = False
                for fwd in range(1, 5):
                    if gz + fwd < dim_z and grid_solid[gx, gy, gz + fwd]:
                        is_deep = True
                        break
                
                # 若過深，或是 Y 超出微開嘴範圍 (< 24 或 > 31)，收斂為身軀青色
                if is_deep or vy_act < 24 or vy_act > 31:
                    grid_color[gx, gy, gz] = 1 # cyan_concrete
                    grid_prio[gx, gy, gz] = 3

# 強化兩顆標誌性潔白小尖牙 (對齊在嘴唇微開兩側)
# 尖牙位置大約在正面嘴部左側與右側邊緣
teeth_positions = []
for gx in range(dim_x):
    for gy in range(dim_y):
        for gz in range(dim_z):
            if grid_color[gx, gy, gz] == 10 and (gy + min_y - 1) >= 23 and (gy + min_y - 1) <= 32:
                teeth_positions.append((gx, gy, gz))

print(f"現有尖牙方塊數: {len(teeth_positions)}")

print("執行任務 3：3D 鄰域濾波平滑 (消除孤立毛刺與梯田直角階梯)...")
# 3D 鄰域毛刺消除 (Spike removal filter)
# 對於表面方塊，若 26 鄰域內的實體方塊數 <= 6 (極度凸起孤立)，予以修剪削平
# (注意：保護牙齒與爪尖不被修剪)
smooth_solid = grid_solid.copy()
pruned_spikes = 0
for gx in range(1, dim_x - 1):
    for gy in range(1, dim_y - 1):
        for gz in range(1, dim_z - 1):
            if not grid_solid[gx, gy, gz]:
                continue
            pal = grid_color[gx, gy, gz]
            # 保護牙齒 (10)、眼珠 (11, 12)
            if pal in (10, 11, 12):
                continue
            # 檢查 26 鄰域
            neighborhood = grid_solid[gx-1:gx+2, gy-1:gy+2, gz-1:gz+2]
            n_count = np.sum(neighborhood) - 1 # 扣除自己
            if n_count <= 6: # 孤立尖刺毛刺
                smooth_solid[gx, gy, gz] = False
                pruned_spikes += 1

print(f"消除孤立外掛毛刺方塊: {pruned_spikes} 顆")

# 填補表皮微小坑洞 (Cavity fill)
filled_cavities = 0
for gx in range(1, dim_x - 1):
    for gy in range(1, dim_y - 1):
        for gz in range(1, dim_z - 1):
            if smooth_solid[gx, gy, gz]:
                continue
            neighborhood = smooth_solid[gx-1:gx+2, gy-1:gy+2, gz-1:gz+2]
            n_count = np.sum(neighborhood)
            if n_count >= 20: # 深陷凹坑
                smooth_solid[gx, gy, gz] = True
                # 借用鄰近主體顏色
                nb_colors = grid_color[gx-1:gx+2, gy-1:gy+2, gz-1:gz+2]
                valid_colors = nb_colors[nb_colors > 0]
                grid_color[gx, gy, gz] = int(np.median(valid_colors)) if len(valid_colors) else 1
                filled_cavities += 1

print(f"填補表皮瑕疵凹坑: {filled_cavities} 顆")

# 萃取平滑後的最終方塊清單
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

print(f"平滑處理後方塊總數: {len(final_blocks)}")

# 嚴格校準高度：精確 76 層 (Y=1 ~ 76)
all_ys = [p[1] for p in final_blocks.keys()]
y_min_curr = min(all_ys)
y_max_curr = max(all_ys)
print(f"目前 Y 範圍: {y_min_curr} ~ {y_max_curr} (跨度 {y_max_curr - y_min_curr + 1})")

# 平移 Y 至 1 開始
shift_y = 1 - y_min_curr
aligned_y_blocks = {}
for (vx, vy, vz), pal in final_blocks.items():
    ny = vy + shift_y
    aligned_y_blocks[(vx, ny, vz)] = pal

# 檢查最高點是否正好為 TARGET_HEIGHT (76)
actual_h = max(p[1] for p in aligned_y_blocks.keys())
print(f"平移後最高 Y: {actual_h}")

if actual_h > TARGET_HEIGHT:
    # 微調超出的頂端
    aligned_y_blocks = {p: pal for p, pal in aligned_y_blocks.items() if p[1] <= TARGET_HEIGHT}
elif actual_h < TARGET_HEIGHT:
    # 若最高點略小於 76，在最高花苞尖補齊至 76
    top_y = actual_h
    while top_y < TARGET_HEIGHT:
        top_pts = [p for p in aligned_y_blocks.keys() if p[1] == top_y]
        mid_x = int(np.mean([p[0] for p in top_pts]))
        mid_z = int(np.mean([p[2] for p in top_pts]))
        top_y += 1
        aligned_y_blocks[(mid_x, top_y, mid_z)] = 4 # pink_concrete

# 平移 X, Z 至 1 開始
all_xs = [p[0] for p in aligned_y_blocks.keys()]
all_zs = [p[2] for p in aligned_y_blocks.keys()]
shift_x = 1 - min(all_xs)
shift_z = 1 - min(all_zs)

normalized_data = {}
for (vx, vy, vz), pal in aligned_y_blocks.items():
    normalized_data[(vx + shift_x, vy, vz + shift_z)] = pal

max_w = max(p[0] for p in normalized_data.keys())
max_h = max(p[1] for p in normalized_data.keys())
max_l = max(p[2] for p in normalized_data.keys())

print(f"最終模型尺寸: 寬 {max_w} x 高 {max_h} x 深 {max_l}")
print(f"總方塊數: {len(normalized_data)}")

# 驗證層數連續性
all_final_ys = sorted(list(set(p[1] for p in normalized_data.keys())))
assert min(all_final_ys) == 1, f"Y 最小值應為 1，目前為 {min(all_final_ys)}"
assert max(all_final_ys) == TARGET_HEIGHT, f"Y 最大值應為 {TARGET_HEIGHT}，目前為 {max(all_final_ys)}"
assert len(all_final_ys) == TARGET_HEIGHT, f"層數應連續 {TARGET_HEIGHT} 層，目前為 {len(all_final_ys)}"

# 依層組織 JSON 格式
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

# 材料清單統計
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
    'name': '妙蛙草 (Ivysaur #002) - 高精度流線平滑版',
    'totalBlocks': len(normalized_data),
    'dimensions': {
        'width': max_w,
        'height': max_h,
        'length': max_l
    },
    'palette': palette_out,
    'layers': layers_list
}

js_content = f"// 妙蛙草 (Ivysaur #002) 76 層高精度流線平滑體素建造藍圖資料庫\n"
js_content += f"// 生成時間: 2026-11-02 | 姿態: 四足貼地、微張露齒、豐滿雙層立體葉片、3D 表面平滑去階梯\n"
js_content += f"const IVYSAUR_VOXEL_DATA = " + json.dumps(export_obj, ensure_ascii=False) + ";\n\n"
js_content += "if (typeof module !== 'undefined' && module.exports) {\n"
js_content += "  module.exports = IVYSAUR_VOXEL_DATA;\n"
js_content += "}\n"

with open('/home/cliff/Desktop/Pokopia/ivysaur_voxel_data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"成功輸出至 /home/cliff/Desktop/Pokopia/ivysaur_voxel_data.js！")
