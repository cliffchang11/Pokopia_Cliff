#!/usr/bin/env python3
"""
妙蛙種子 (Bulbasaur #001) 28 層精雕超採樣高傳真建造藍圖生成腳本
- 來源: Sketchfab 3D 原版模型 (UID: d2a9a7962613438387880a195cd8a1df)
- 高度鎖定: 嚴格連續 28 層 (Y=1 ~ 28)，四爪尖貼地於 Y=1，球莖頂端於 Y=28
- 特徵處理: 排除伸出的藤鞭，保留圓潤種子球莖、雙眼五官原位平滑鑲嵌、奇數寬度 X=12 中心對稱
- 調色盤: 13 種高傳真貼圖萃取色彩 (薄荷青、斑紋、草綠、緋紅瞳孔、曜石黑瞳)
- 結構: 外殼適度掏空 (1~2格厚實外壁)
- 輸出: bulbasaur28_v2_voxel_data.js
"""

import trimesh
import numpy as np
from PIL import Image
from scipy.sparse import csgraph, csr_matrix
from collections import defaultdict, Counter
import json
import os

GLB_PATH = '/home/cliff/Desktop/Pokopia/scratch/bulba_sketchfab/Bulbasaur_Pokemon_Animated.glb'
OUTPUT_JS = '/home/cliff/Desktop/Pokopia/bulbasaur28_v2_voxel_data.js'

print(f"=== 載入 GLB 模型: {GLB_PATH} ===")
scene = trimesh.load(GLB_PATH)

bodyA = scene.geometry['001BodyA1']
bodyB = scene.geometry['001BodyB1']
eye = scene.geometry['001Eye1']

# 1. 球莖與藤鞭分離：僅保留球莖本體
edges = bodyB.edges_unique
n_verts = len(bodyB.vertices)
adj = csr_matrix((np.ones(len(edges)), (edges[:, 0], edges[:, 1])), shape=(n_verts, n_verts))
n_comp, labels = csgraph.connected_components(adj, directed=False)
bulb_components = [4, 5, 6, 9, 10, 11, 12, 13]
bulb_mask = np.isin(labels, bulb_components)
bulb_faces_mask = bulb_mask[bodyB.faces].all(axis=1)

faces_sub = bodyB.faces[bulb_faces_mask]
bulb_mesh = trimesh.Trimesh(
    vertices=bodyB.vertices,
    faces=faces_sub,
    process=False
)
bulb_mesh.visual = bodyB.visual
bulb_mesh.remove_unreferenced_vertices()

print(f"身體頂點: {len(bodyA.vertices)}, 球莖頂點: {len(bulb_mesh.vertices)}, 眼睛頂點: {len(eye.vertices)}")

# 2. 整體 Bounds 與縮放因子
all_v = np.vstack([bodyA.vertices, bulb_mesh.vertices, eye.vertices])
min_b = all_v.min(axis=0)
max_b = all_v.max(axis=0)
span = max_b - min_b
print(f"原始整體 Bounds: min={min_b}, max={max_b}, span={span}")

TARGET_HEIGHT = 28
# 高度鎖定 Y=1 ~ 28 (垂直跨度 27.0)
scale = 27.0 / span[1]
print(f"高度縮放因子: {scale:.4f}")

# X 軸中心對稱軸鎖定在 X = 12.0
CENTER_X = 12.0
scaled_x_half = (span[0] / 2.0) * scale
print(f"X 軸半寬: {scaled_x_half:.2f} (預期總寬約 {scaled_x_half*2:.1f}，中心 X={CENTER_X})")

# Z 軸平移基準 (從 Z=1 開始)
min_z = min_b[2]

# 3. 高傳真 13 色調色盤定義
PALETTE = {
    1: {'id': 1, 'key': 'skin_light', 'name': '薄荷青光 (皮膚高光)', 'color': '#82b8a4', 'rgb': np.array([130, 184, 164])},
    2: {'id': 2, 'key': 'skin_main', 'name': '薄荷青 (主體皮膚)', 'color': '#62a894', 'rgb': np.array([98, 168, 148])},
    3: {'id': 3, 'key': 'skin_dark', 'name': '深青綠 (皮膚陰影)', 'color': '#478a76', 'rgb': np.array([71, 138, 118])},
    4: {'id': 4, 'key': 'spot_main', 'name': '暗海晶綠 (身體斑紋)', 'color': '#336e5e', 'rgb': np.array([51, 110, 94])},
    5: {'id': 5, 'key': 'spot_dark', 'name': '深墨綠 (斑紋暗部)', 'color': '#214e41', 'rgb': np.array([33, 78, 65])},
    6: {'id': 6, 'key': 'bulb_light', 'name': '嫩草綠 (種子球莖亮部)', 'color': '#82c06e', 'rgb': np.array([130, 192, 110])},
    7: {'id': 7, 'key': 'bulb_main', 'name': '青苔綠 (種子球莖主體)', 'color': '#63a350', 'rgb': np.array([99, 163, 80])},
    8: {'id': 8, 'key': 'bulb_dark', 'name': '濃深綠 (球莖花瓣分界)', 'color': '#457a34', 'rgb': np.array([69, 122, 52])},
    9: {'id': 9, 'key': 'claw_white', 'name': '象牙白 (四足爪尖)', 'color': '#eaeae8', 'rgb': np.array([234, 234, 232])},
    10: {'id': 10, 'key': 'eye_white', 'name': '極光白 (眼睛高光)', 'color': '#f8f9fa', 'rgb': np.array([248, 249, 250])},
    11: {'id': 11, 'key': 'eye_red', 'name': '緋紅 (眼睛虹膜)', 'color': '#b83246', 'rgb': np.array([184, 50, 70])},
    12: {'id': 12, 'key': 'eye_black', 'name': '曜石黑 (瞳孔與眼眶)', 'color': '#182024', 'rgb': np.array([24, 32, 36])},
    13: {'id': 13, 'key': 'mouth_pink', 'name': '粉紅 (嘴角微露)', 'color': '#d26278', 'rgb': np.array([210, 98, 120])},
}

# 優先級定義
PRIORITY = {
    10: 10, # 眼白
    12: 10, # 黑瞳
    11: 9,  # 紅虹膜
    13: 8,  # 粉紅嘴角
    9: 7,   # 爪尖
    5: 6,   # 深斑點
    4: 6,   # 斑點
    8: 5,   # 深球莖
    6: 4,   # 亮球莖
    7: 4,   # 球莖主體
    3: 3,   # 深皮膚
    1: 2,   # 亮皮膚
    2: 2,   # 主皮膚
}

def rgb_to_palette(rgb, part_type):
    r, g, b = rgb[:3]
    if part_type == 'eye':
        # 眼睛判定
        if r > 210 and g > 210 and b > 210:
            return 10 # eye_white
        elif r > 110 and g < 95 and b < 105:
            return 11 # eye_red
        else:
            return 12 # eye_black
    elif part_type == 'bulb':
        # 球莖判定
        dist_6 = np.linalg.norm(rgb - PALETTE[6]['rgb'])
        dist_7 = np.linalg.norm(rgb - PALETTE[7]['rgb'])
        dist_8 = np.linalg.norm(rgb - PALETTE[8]['rgb'])
        dists = [(dist_6, 6), (dist_7, 7), (dist_8, 8)]
        dists.sort()
        return dists[0][1]
    else: # body
        # 爪尖判定: 接近純白且位於身體最底部
        if r > 210 and g > 210 and b > 200:
            return 9 # claw_white
        # 嘴角粉紅
        if r > 160 and g < 110 and b > 90 and b < 140:
            return 13 # mouth_pink
        # 斑點 vs 皮膚
        dist_4 = np.linalg.norm(rgb - PALETTE[4]['rgb'])
        dist_5 = np.linalg.norm(rgb - PALETTE[5]['rgb'])
        dist_1 = np.linalg.norm(rgb - PALETTE[1]['rgb'])
        dist_2 = np.linalg.norm(rgb - PALETTE[2]['rgb'])
        dist_3 = np.linalg.norm(rgb - PALETTE[3]['rgb'])
        dists = [(dist_4, 4), (dist_5, 5), (dist_1, 1), (dist_2, 2), (dist_3, 3)]
        dists.sort()
        return dists[0][1]

# 4. 超高密度表面取樣與顏色萃取
def sample_mesh_surface(mesh, img, part_type, num_samples=250000):
    print(f"-> 正在採樣 {part_type} (採樣數: {num_samples})...")
    pts, face_indices = trimesh.sample.sample_surface(mesh, num_samples)
    bary = trimesh.triangles.points_to_barycentric(triangles=mesh.triangles[face_indices], points=pts)
    uvs = mesh.visual.uv[mesh.faces[face_indices]]
    sample_uvs = np.einsum('ij,ijk->ik', bary, uvs) % 1.0

    arr = np.array(img)
    W, H = img.size
    px = np.clip((sample_uvs[:, 0] * (W - 1)).astype(int), 0, W - 1)
    py = np.clip(((1.0 - sample_uvs[:, 1]) * (H - 1)).astype(int), 0, H - 1)
    colors = arr[py, px, :3]
    return pts, colors

# 採樣各部位
imgA = bodyA.visual.material.baseColorTexture
imgB = bulb_mesh.visual.material.baseColorTexture
imgEye = eye.visual.material.baseColorTexture

ptsA, colA = sample_mesh_surface(bodyA, imgA, 'body', num_samples=280000)
ptsB, colB = sample_mesh_surface(bulb_mesh, imgB, 'bulb', num_samples=180000)
ptsEye, colEye = sample_mesh_surface(eye, imgEye, 'eye', num_samples=80000)

all_pts = []
all_pal = []
all_part = []

for pts, cols, ptype in [(ptsA, colA, 'body'), (ptsB, colB, 'bulb'), (ptsEye, colEye, 'eye')]:
    for p, c in zip(pts, cols):
        pal_id = rgb_to_palette(c, ptype)
        all_pts.append(p)
        all_pal.append(pal_id)
        all_part.append(ptype)

all_pts = np.array(all_pts)
all_pal = np.array(all_pal)

# 5. 映射至體素空間
vx = np.round(CENTER_X + all_pts[:, 0] * scale).astype(int)
vy = np.round(1.0 + (all_pts[:, 1] - min_b[1]) * scale).astype(int)
vz = np.round(1.0 + (all_pts[:, 2] - min_z) * scale).astype(int)

# 限制 Y 在 1~28
vy = np.clip(vy, 1, TARGET_HEIGHT)

# 6. 匯總體素格與優先級覆蓋
voxel_dict = {}

for x, y, z, pal in zip(vx, vy, vz, all_pal):
    key = (x, y, z)
    if key not in voxel_dict:
        voxel_dict[key] = pal
    else:
        cur_pal = voxel_dict[key]
        if PRIORITY[pal] > PRIORITY[cur_pal]:
            voxel_dict[key] = pal

print(f"初階段表面體素數: {len(voxel_dict)}")

# 7. 奇數完美對稱化校正 (以 X=12 為對稱軸)
symmetric_voxels = {}
for (x, y, z), pal in voxel_dict.items():
    dx = x - 12
    mirror_x = 12 - dx
    symmetric_voxels[(x, y, z)] = pal
    # 若對稱側沒有方塊，補上對稱方塊
    if (mirror_x, y, z) not in symmetric_voxels:
        symmetric_voxels[(mirror_x, y, z)] = pal
    else:
        # 若兩側色號不同，優先採用較高優先級顏色
        cur_m_pal = symmetric_voxels[(mirror_x, y, z)]
        if PRIORITY[pal] > PRIORITY[cur_m_pal]:
            symmetric_voxels[(mirror_x, y, z)] = pal
            symmetric_voxels[(x, y, z)] = pal
        else:
            symmetric_voxels[(x, y, z)] = cur_m_pal

print(f"完美鏡像對稱化後體素數: {len(symmetric_voxels)}")

# 8. 結構緊密性與外殼適度掏空 (1~2格厚實外壁)
# 檢查相鄰方塊，如果 6 個方向 (前後左右上下) 全部都是實心體素，且距離空氣 >= 2 格，則進行內部掏空
voxel_set = set(symmetric_voxels.keys())
hollow_voxels = {}

NEIGHBORS_6 = [
    (1, 0, 0), (-1, 0, 0),
    (0, 1, 0), (0, -1, 0),
    (0, 0, 1), (0, 0, -1)
]

for (x, y, z), pal in symmetric_voxels.items():
    # 判斷是否鄰近空氣 (任一鄰居不存在即為表面外殼)
    is_surface = False
    for dx, dy, dz in NEIGHBORS_6:
        if (x + dx, y + dy, z + dz) not in voxel_set:
            is_surface = True
            break
    
    if is_surface:
        hollow_voxels[(x, y, z)] = pal
    else:
        # 第二層厚度保留：如果它的某個鄰居是 surface，它也保留，形成 2 格厚度保證不漏光
        is_subsurface = False
        for dx, dy, dz in NEIGHBORS_6:
            n_pos = (x + dx, y + dy, z + dz)
            for ddx, ddy, ddz in NEIGHBORS_6:
                if (n_pos[0] + ddx, n_pos[1] + ddy, n_pos[2] + ddz) not in voxel_set:
                    is_subsurface = True
                    break
            if is_subsurface:
                break
        
        # 只保留表層與次表層，其餘深層掏空
        if is_subsurface:
            hollow_voxels[(x, y, z)] = pal

print(f"適度掏空後最終體素數: {len(hollow_voxels)} 顆")

# 9. 統計邊界與尺寸
min_x = min(k[0] for k in hollow_voxels.keys())
max_x = max(k[0] for k in hollow_voxels.keys())
min_y = min(k[1] for k in hollow_voxels.keys())
max_y = max(k[1] for k in hollow_voxels.keys())
min_z = min(k[2] for k in hollow_voxels.keys())
max_z = max(k[2] for k in hollow_voxels.keys())

width = max_x - min_x + 1
height = max_y - min_y + 1
length = max_z - min_z + 1

print(f"最終模型尺寸: X={min_x}~{max_x} (寬度 {width}), Y={min_y}~{max_y} (高度 {height}), Z={min_z}~{max_z} (長度 {length})")
print(f"X 中心軸: {(min_x + max_x) / 2.0} (精準中心: 12.0)")

# 10. 組裝 Pokopia JS 格式
layer_dict = defaultdict(dict)
for (x, y, z), pal in hollow_voxels.items():
    layer_dict[int(y)][f"{int(x)},{int(z)}"] = int(pal)


# 對齊 Pokopia 系統標準層格式: { layerIndex, blocks: [[x, z, bid], ...] }
# (VoxelDeltaStore 鏡像 / 水合 / 取色與 app.js 2D/3D 渲染管線皆依賴此格式)
layers_list = []
for y in range(1, TARGET_HEIGHT + 1):
    voxels = layer_dict.get(y, {})
    blocks = []
    for key, pal in voxels.items():
        bx, bz = (int(v) for v in key.split(","))
        blocks.append([bx, bz, int(pal)])
    blocks.sort(key=lambda b: (b[0], b[1]))
    layers_list.append({
        "layerIndex": int(y),
        "blocks": blocks
    })

clean_palette = {}
for k, v in PALETTE.items():
    clean_palette[str(k)] = {
        "id": int(v["id"]),
        "key": str(v["key"]),
        "name": str(v["name"]),
        "color": str(v["color"])
    }

js_data = {
    "name": "妙蛙種子 (28層・超採樣)",
    "totalBlocks": len(hollow_voxels),
    "dimensions": {
        "width": int(width),
        "height": int(height),
        "length": int(length)
    },
    "bounds": {
        "minX": int(min_x),
        "maxX": int(max_x),
        "minY": int(min_y),
        "maxY": int(max_y),
        "minZ": int(min_z),
        "maxZ": int(max_z),
        "centerX": 12
    },
    "palette": clean_palette,
    "layers": layers_list
}

def json_serial(obj):
    if isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Type {type(obj)} not serializable")

# 序列化為 JS
with open(OUTPUT_JS, 'w', encoding='utf-8') as f:
    f.write("/**\n")
    f.write(" * 妙蛙種子 (Bulbasaur #001) 28 層精雕超採樣高傳真建造藍圖\n")
    f.write(f" * 總體素數: {len(hollow_voxels)} 顆，高度: 28 層 (Y=1~28)，寬度: {width}，長度: {length}\n")
    f.write(" * 特色: 3D 原模 Diffuse 紋理採樣、無藤鞭清爽外型、奇數 X=12 軸對稱、適度掏空\n")
    f.write(" */\n")
    f.write("const BULBASAUR_28_V2_VOXEL_DATA = ")
    json.dump(js_data, f, ensure_ascii=False, indent=2, default=json_serial)
    f.write(";\n\n")
    f.write("if (typeof module !== 'undefined' && module.exports) {\n")
    f.write("  module.exports = BULBASAUR_28_V2_VOXEL_DATA;\n")
    f.write("}\n")

print(f"🎉 成功輸出高傳真 28 層妙蛙種子藍圖至: {OUTPUT_JS}")
