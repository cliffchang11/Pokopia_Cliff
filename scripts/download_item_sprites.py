#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download all official 52poke Item Sprites to assets/item_sprites/
Ensures 100% offline availability, zero 403 hotlink protection issues, and millisecond loading.
"""

import os
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

TARGET_DIR = "assets/item_sprites"
os.makedirs(TARGET_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_url_to_filename_map():
    with open("preferences_db.js", "r", encoding="utf-8") as f:
        text = f.read()
    json_text = text.split("var POKOPIA_PREFERENCES_DB = ", 1)[1].split(";\nif", 1)[0].strip()
    db = json.loads(json_text)

    url_map = {}
    for name, url in db.get("itemIcons", {}).items():
        if not url: continue
        raw_fname = urllib.parse.unquote(url.split("/")[-1])
        clean_fname = raw_fname.replace("/", "_")
        url_map[url] = clean_fname

    for cat, items in db.get("items", {}).items():
        for it in items:
            url = it.get("icon", "")
            if url and url.startswith("http"):
                raw_fname = urllib.parse.unquote(url.split("/")[-1])
                clean_fname = raw_fname.replace("/", "_")
                url_map[url] = clean_fname

    return url_map

def download_one(url, filename):
    dest = os.path.join(TARGET_DIR, filename)
    if os.path.exists(dest) and os.path.getsize(dest) > 200:
        return True, filename, 0  # Already exists

    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = resp.read()
                if len(data) > 100:
                    with open(dest, "wb") as f:
                        f.write(data)
                    return True, filename, len(data)
        except Exception as e:
            time.sleep(0.5 * (attempt + 1))
    return False, filename, 0

def main():
    url_map = get_url_to_filename_map()
    total = len(url_map)
    print(f"Total unique item sprites to download: {total}")

    t0 = time.time()
    success = 0
    failed = []

    with ThreadPoolExecutor(max_workers=24) as executor:
        futures = {executor.submit(download_one, url, fname): (url, fname) for url, fname in url_map.items()}
        for i, fut in enumerate(as_completed(futures), 1):
            ok, fname, size = fut.result()
            if ok:
                success += 1
            else:
                url, _ = futures[fut]
                failed.append((url, fname))
            if i % 100 == 0 or i == total:
                print(f"Progress: {i}/{total} ({success} succeeded, {len(failed)} failed) - elapsed: {time.time()-t0:.1f}s")

    print(f"\nCompleted in {time.time()-t0:.2f}s! Total success: {success}/{total}")
    if failed:
        print(f"Retrying {len(failed)} failed items...")
        for url, fname in failed:
            ok, _, _ = download_one(url, fname)
            if ok: success += 1
        print(f"After retry: {success}/{total}")

    # Save mapping file for quick verification
    mapping_file = os.path.join(TARGET_DIR, "url_to_local.json")
    with open(mapping_file, "w", encoding="utf-8") as f:
        json.dump({u: f"assets/item_sprites/{f}" for u, f in url_map.items()}, f, ensure_ascii=False, indent=2)
    print(f"Mapping saved to {mapping_file}")

    # 自動建立繁體異體字別名檔案拷貝，確保 100% 存在
    existing = os.listdir(TARGET_DIR)
    replacements = [
        ('致', '緻'), ('面', '麵'), ('窑', '窯'), ('弦', '絃'),
        ('烂', '爛'), ('藓', '蘚'), ('垫', '墊'), ('调', '調'), ('长', '長')
    ]
    for orig in list(existing):
        if not orig.endswith('.png'): continue
        alias = orig
        for r1, r2 in replacements:
            alias = alias.replace(r1, r2)
        if alias != orig:
            src_f = os.path.join(TARGET_DIR, orig)
            dst_f = os.path.join(TARGET_DIR, alias)
            if not os.path.exists(dst_f):
                import shutil
                shutil.copyfile(src_f, dst_f)


if __name__ == "__main__":
    main()
