#!/usr/bin/env python3
"""
build_offline_pack.py
將 Pokopia 專案封裝為完全獨立自包含的離線隨身包 (dist_offline/)，
並壓製為 pokopia_offline_ipad.zip 置於桌面。
"""

import os
import shutil
import zipfile
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DIST_DIR = BASE_DIR / "dist_offline"
ZIP_OUTPUT = Path("/home/cliff/Desktop/pokopia_offline_ipad.zip")

CORE_FILES = [
    "app.js",
    "firebase.js",
    "index.css",
    "manifest.json",
    "sw.js",
    "data.js",
    "recipe_db.js",
    "recipe.js",
    "preferences_db.js",
    "region_data.js",
    "autofarm_data.js",
    "video_data.js",
    "habitat_5x5_data.js",
    "buzz_voxel_data.js",
    "bulbasaur_voxel_data.js",
    "bulbasaur28_v2_voxel_data.js",
    "bulbasaur28_voxel_data.js",
    "ivysaur_voxel_data.js",
    "ivysaur40_voxel_data.js",
    "venusaur80_voxel_data.js",
    "venusaur80_v2_voxel_data.js",
    "venusaur_voxel_data.js",
    "voxel_editor.js"
]

def build_dist():
    print("📦 正在組裝獨立離線包 dist_offline/ ...")
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. 複製核心 JS 與 CSS
    for fname in CORE_FILES:
        src = BASE_DIR / fname
        if src.exists():
            shutil.copy2(src, DIST_DIR / fname)
        else:
            print(f"⚠️ 警告：找不到 {fname}")

    # 2. 複製 libs/ (Three.js 等)
    libs_src = BASE_DIR / "libs"
    libs_dst = DIST_DIR / "libs"
    if libs_src.exists():
        shutil.copytree(libs_src, libs_dst)
        print("  ✓ 已複製 libs/ (Three.js 離線函式庫)")
    else:
        print("❌ 錯誤：找不到 libs/ 目錄！")

    # 3. 複製 assets/ (包含圖標與已下載的 videos/)
    assets_src = BASE_DIR / "assets"
    assets_dst = DIST_DIR / "assets"
    if assets_src.exists():
        shutil.copytree(assets_src, assets_dst)
        print("  ✓ 已複製 assets/ (圖示與離線影音資產)")

    # 4. 處理 index.html (注入離線模式標記與替換本地 libs 相對路徑)
    index_src = BASE_DIR / "index.html"
    index_content = index_src.read_text(encoding="utf-8")

    # 替換 CDN Three.js 為本地 libs
    index_content = index_content.replace(
        'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
        'libs/three.min.js'
    )
    index_content = index_content.replace(
        'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
        'libs/OrbitControls.js'
    )

    # 在 <head> 開頭注入 window.POKOPIA_OFFLINE = true
    offline_tag = '\n  <script>window.POKOPIA_OFFLINE = true;</script>\n'
    index_content = index_content.replace('<head>', '<head>' + offline_tag, 1)

    # 寫入 dist_offline/index.html
    (DIST_DIR / "index.html").write_text(index_content, encoding="utf-8")
    print("  ✓ 已產生離線專屬 index.html (注入 POKOPIA_OFFLINE 標記與本地 libs 相對路徑)")

    # 5. 加入極簡一鍵啟動指引說明檔 README_IPAD.txt
    readme_text = """Pokopia iPad 離線隨身包使用指南 (飛航模式 15 小時完全支援)
================================================================

1. 【在 iPad 上直接瀏覽 (推薦)】
   - 您可以使用 iPad 上的免費 App「Documents by Readdle」(App Store 免費下載)。
   - 透過 AirDrop 將 pokopia_offline_ipad.zip 傳送至 iPad，選擇以「Documents」開啟並解壓縮。
   - 點擊「index.html」即可在零網路的飛航模式下順暢使用全功能：
     * 3D 角色藍圖 (巴斯光年、妙蛙種子、妙蛙草、妙蛙花全部 9 大模型)
     * 16 部 720p 參考攻略長影片
     * 47 部 5x5 棲息地 Shorts 浮動彈窗秒開
     * 所有資料 100% 離線即時保存於 iPad 本機。

2. 【在筆電 / 電腦離線瀏覽】
   - 直接解壓縮資料夾後，使用 Chrome / Edge / Safari 雙擊打開「index.html」即可直接使用！

祝您旅途愉快！
"""
    (DIST_DIR / "README_IPAD.txt").write_text(readme_text, encoding="utf-8")
    print("  ✓ 已產生 README_IPAD.txt 指引說明")

def create_zip():
    print(f"\n📦 正在將 dist_offline/ 壓製為桌面 ZIP：{ZIP_OUTPUT} ...")
    if ZIP_OUTPUT.exists():
        ZIP_OUTPUT.unlink()

    # 使用 zip 指令保持效能與權限
    cmd = ["zip", "-r", "-q", str(ZIP_OUTPUT), "."]
    subprocess.run(cmd, cwd=str(DIST_DIR), check=True)
    zip_size_mb = ZIP_OUTPUT.stat().st_size / (1024 * 1024)
    print(f"🎉 成功在桌面產出隨身包：{ZIP_OUTPUT.name} (檔案大小: {zip_size_mb:.2f} MB)")

if __name__ == "__main__":
    build_dist()
    create_zip()

