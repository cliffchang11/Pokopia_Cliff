#!/usr/bin/env python3
"""
download_offline_videos.py
批量自動化下載 Pokopia 16 部參考長片與 48 部 5x5 Shorts (720p HD MP4 規格)
"""

import os
import re
import sys
import json
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
REF_VIDEOS_DIR = BASE_DIR / "assets" / "videos" / "reference"
SHORTS_VIDEOS_DIR = BASE_DIR / "assets" / "videos" / "5x5"
YT_DLP = "/tmp/yt-dlp_linux"

REF_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
SHORTS_VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

def extract_reference_video_ids():
    video_data_path = BASE_DIR / "video_data.js"
    content = video_data_path.read_text(encoding="utf-8")
    matches = re.findall(r"videoId:\s*['\"]([a-zA-Z0-9_-]+)['\"]", content)
    unique_ids = []
    for vid in matches:
        if vid not in unique_ids:
            unique_ids.append(vid)
    return unique_ids

def extract_5x5_shorts_ids():
    shorts_data_path = BASE_DIR / "habitat_5x5_data.js"
    content = shorts_data_path.read_text(encoding="utf-8")
    matches = re.findall(r"vid:\s*['\"]([a-zA-Z0-9_-]+)['\"]", content)
    unique_ids = []
    for vid in matches:
        if vid not in unique_ids:
            unique_ids.append(vid)
    return unique_ids

def download_video(vid, output_dir, is_short=False):
    target_mp4 = output_dir / f"{vid}.mp4"
    if target_mp4.exists() and target_mp4.stat().st_size > 1024 * 50:
        print(f"⏩ [已存在跳過] {vid} ({target_mp4.stat().st_size // 1024} KB)")
        return True

    url = f"https://www.youtube.com/shorts/{vid}" if is_short else f"https://www.youtube.com/watch?v={vid}"
    cmd = [
        YT_DLP,
        "-f", "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "--retries", "5",
        "--socket-timeout", "30",
        "-o", str(output_dir / f"{vid}.%(ext)s"),
        url
    ]
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if target_mp4.exists() and target_mp4.stat().st_size > 1024 * 50:
            print(f"✅ [下載完成] {vid} -> {target_mp4.name} ({target_mp4.stat().st_size // 1024} KB)")
            return True
        else:
            # 檢查是否有其他副檔名被合併
            possible = list(output_dir.glob(f"{vid}.*"))
            if possible:
                print(f"⚠️ [下載完成非mp4] {vid} -> {[p.name for p in possible]}")
                return True
            print(f"❌ [下載失敗] {vid}\n輸出: {res.stdout[-300:]}")
            return False
    except Exception as e:
        print(f"❌ [下載異常] {vid}: {e}")
        return False

from concurrent.futures import ThreadPoolExecutor, as_completed

def main():
    print(f"🎬 開始執行 Pokopia 影音離線批量下載作業 (多執行緒加速)...")
    if not os.path.exists(YT_DLP):
        print(f"❌ 找不到 {YT_DLP}，請先確保下載工具就緒！")
        sys.exit(1)

    ref_ids = extract_reference_video_ids()
    shorts_ids = extract_5x5_shorts_ids()
    print(f"📋 清單解析完畢：參考長片 {len(ref_ids)} 部，5x5 Shorts {len(shorts_ids)} 部")

    print(f"\n--- [階段 1/2] 正在並行下載 {len(shorts_ids)} 部 5x5 Shorts ---")
    shorts_success = 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(download_video, vid, SHORTS_VIDEOS_DIR, True): vid for vid in shorts_ids}
        for future in as_completed(futures):
            vid = futures[future]
            try:
                if future.result():
                    shorts_success += 1
            except Exception as e:
                print(f"❌ Shorts 下載異常 {vid}: {e}")

    print(f"\n--- [階段 2/2] 正在並行下載 {len(ref_ids)} 部參考攻略長影片 (720p HD) ---")
    ref_success = 0
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(download_video, vid, REF_VIDEOS_DIR, False): vid for vid in ref_ids}
        for future in as_completed(futures):
            vid = futures[future]
            try:
                if future.result():
                    ref_success += 1
            except Exception as e:
                print(f"❌ 長片下載異常 {vid}: {e}")

    print(f"\n🎉 下載匯報：")
    print(f"   5x5 Shorts: 成功 {shorts_success}/{len(shorts_ids)}")
    print(f"   參考長影片: 成功 {ref_success}/{len(ref_ids)}")

if __name__ == "__main__":
    main()
