import urllib.request, json, re, html
import xml.etree.ElementTree as ET

video_id = "5dCjsO8uskA"
url = f"https://www.youtube.com/watch?v={video_id}"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    page_html = resp.read().decode("utf-8")

m = re.search(r"ytInitialPlayerResponse\s*=\s*({.+?});var\s+", page_html) or re.search(r"ytInitialPlayerResponse\s*=\s*({.+?});</script>", page_html)
if m:
    data = json.loads(m.group(1))
    desc = data.get("videoDetails", {}).get("shortDescription", "")
    with open("youtube_desc.txt", "w", encoding="utf-8") as f:
        f.write(desc)
    print("Description saved. Length:", len(desc))
    
    captions = data.get("captions", {}).get("playerCaptionsTracklistRenderer", {}).get("captionTracks", [])
    if captions:
        caption_url = captions[0].get("baseUrl")
        cap_req = urllib.request.Request(caption_url, headers=headers)
        with urllib.request.urlopen(cap_req) as cap_resp:
            cap_xml = cap_resp.read().decode("utf-8")
        
        root = ET.fromstring(cap_xml)
        lines = []
        for text_node in root.findall("text"):
            start = float(text_node.attrib.get("start", 0))
            txt = html.unescape(text_node.text or "")
            txt = txt.replace("\n", " ").strip()
            m_start = int(start // 60)
            s_start = int(start % 60)
            lines.append(f"[{m_start:02d}:{s_start:02d}] {txt}")
        
        with open("youtube_subtitles.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print("Subtitles saved! Total lines:", len(lines))
else:
    print("ytInitialPlayerResponse not found")
