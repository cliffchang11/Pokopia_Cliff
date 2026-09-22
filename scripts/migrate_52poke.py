import os
import re
import json
import urllib.request
import concurrent.futures
from PIL import Image

HTML_CACHE = "scripts/52poke_habitats.html"
URL_52POKE = "https://wiki.52poke.com/zh-hant/%E6%A0%96%E6%81%AF%E5%9C%B0%E5%88%97%E8%A1%A8"
ASSETS_DIR = "assets/habitats"
DATA_JS = "data.js"

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

def get_html():
    if os.path.exists(HTML_CACHE) and os.path.getsize(HTML_CACHE) > 50000:
        print(f"Loading HTML from cache: {HTML_CACHE}")
        with open(HTML_CACHE, "r", encoding="utf-8") as f:
            return f.read()
    print(f"Downloading HTML from {URL_52POKE}...")
    req = urllib.request.Request(URL_52POKE, headers=headers)
    html = urllib.request.urlopen(req).read().decode('utf-8')
    with open(HTML_CACHE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Saved cache to {HTML_CACHE} ({len(html)} bytes)")
    return html

def parse_52poke(html):
    rows = re.findall(r'<tr id=\"habitat-([^\"]+)\">(.*?)</tr>', html, re.DOTALL)
    habitats = {}
    for hab_id, row in rows:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', row, re.DOTALL)
        if len(tds) < 5:
            continue
        img_td = tds[1]
        m = re.search(r'/wiki/thumb/([0-9a-f]/[0-9a-f]{2}/[^/\"]+\.webp)/', img_td)
        img_url = ('https://media.52poke.com/wiki/' + m.group(1)) if m else ''
        zh_name = tds[2].strip()
        desc = re.sub(r'<[^>]+>', '', tds[3]).strip()
        details = re.sub(r'<[^>]+>', '', tds[4]).strip()
        pkm_names = re.findall(r'title=\"([^\"]+)（旁支系列）\"', tds[5])
        habitats[hab_id] = {
            'official_id': hab_id,
            'zh_name': zh_name,
            'desc': desc,
            'details': details,
            'img_url': img_url,
            'pokemons': pkm_names
        }
    print(f"Parsed {len(habitats)} habitats from 52poke.")
    return habitats

def download_images(habitats):
    os.makedirs(ASSETS_DIR, exist_ok=True)
    to_download = []
    for hid, hab in habitats.items():
        if not hab['img_url']:
            continue
        dest_filename = f"hab_{hid.lower()}.webp"
        dest_path = os.path.join(ASSETS_DIR, dest_filename)
        hab['local_image'] = dest_path
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
            continue
        to_download.append((hid, hab['img_url'], dest_path))

    print(f"Images to download: {len(to_download)} / {len(habitats)}")

    def dl_one(item):
        hid, url, dest = item
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers=headers)
                data = urllib.request.urlopen(req, timeout=15).read()
                with open(dest, 'wb') as f:
                    f.write(data)
                return hid, True, len(data)
            except Exception as e:
                if attempt == 2:
                    return hid, False, str(e)

    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(dl_one, item) for item in to_download]
        for f in concurrent.futures.as_completed(futures):
            hid, ok, res = f.result()
            if ok:
                success_count += 1
            else:
                print(f"Failed to download {hid}: {res}")

    print(f"Download complete: {success_count} succeeded.")
    
    # Verify local image sizes
    verified = 0
    for hid, hab in habitats.items():
        dest = hab.get('local_image')
        if dest and os.path.exists(dest):
            try:
                im = Image.open(dest)
                hab['img_width'], hab['img_height'] = im.size
                verified += 1
            except Exception as e:
                print(f"Corrupt image {dest}: {e}")
    print(f"Verified {verified} valid WEBP image files locally!")

if __name__ == '__main__':
    html = get_html()
    habs_52 = parse_52poke(html)
    download_images(habs_52)
