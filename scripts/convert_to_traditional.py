#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OpenCC-based Accurate Traditional Chinese Converter for Pokopia
"""
import re
import os

def load_dict(filepath):
    d = {}
    if not os.path.exists(filepath):
        return d
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('\t')
            if len(parts) >= 2:
                key = parts[0]
                val = parts[1].split(' ')[0] # 取首選繁體
                d[key] = val
    return d

def main():
    print("Loading OpenCC dictionaries...")
    char_dict = load_dict('scripts/STCharacters.txt')
    phrase_dict = load_dict('scripts/STPhrases.txt')

    # 特殊自訂補充詞彙 (Pokopia 專屬家具名詞與遊戲用語)
    custom_dict = {
        "花篱": "花籬",
        "（长）": "（長）",
        "椅子（长）": "長椅",
        "树桩": "樹樁",
        "蘑菇台灯": "蘑菇檯燈",
        "庭园灯": "庭園燈",
        "庭园桌子": "庭園桌子",
        "庭园椅子": "庭園椅子",
        "路灯": "路燈",
        "书架": "書架",
        "手推车": "手推車",
        "平板货车": "平板貨車",
        "推车": "推車",
        "单枝花瓶": "單枝花瓶",
        "装盘的食物": "裝盤的食物",
        "时髦锅": "時髦鍋",
        "平底锅": "平底鍋",
        "沙滩遮阳伞": "沙灘遮陽傘",
        "沙滩椅": "沙灘椅",
        "晴雨飘浮泡泡": "晴雨飄浮泡泡",
        "树果野餐篮": "樹果野餐籃",
        "遗失物": "遺失物",
        "床铺": "床鋪",
        "自然风储物柜": "自然風儲物櫃",
        "充气船": "充氣船",
        "掘山道具": "掘山道具",
        "钢骨": "鋼骨",
        "熔炉": "熔爐",
        "大宝箱": "大寶箱",
        "财宝": "財寶",
        "地图与指南针": "地圖與指南針",
        "总是水润润": "總是水潤潤",
        "总是": "總是",
        "闹钟": "鬧鐘",
        "雅致沙发": "雅緻沙發",
        "细长蜡烛": "細長蠟燭",
        "笔筒": "筆筒",
        "储物柜": "儲物櫃",
        "垃圾桶": "垃圾桶"
    }

    phrase_dict.update(custom_dict)
    sorted_phrases = sorted(phrase_dict.keys(), key=lambda x: len(x), reverse=True)

    print(f"Total phrases: {len(sorted_phrases)}, Total chars: {len(char_dict)}")

    # 處理 data.js
    print("Processing data.js...")
    with open('data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    for phrase in sorted_phrases:
        if phrase in content:
            content = content.replace(phrase, phrase_dict[phrase])

    safe_char_dict = {k: v for k, v in char_dict.items() if ord(k) > 127 and ord(v) > 127}
    safe_table = str.maketrans(safe_char_dict)
    content = content.translate(safe_table)

    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("data.js converted successfully.")

    # 處理 app.js
    print("Processing app.js...")
    with open('app.js', 'r', encoding='utf-8') as f:
        app_content = f.read()
    for phrase in sorted_phrases:
        if phrase in app_content:
            app_content = app_content.replace(phrase, phrase_dict[phrase])
    app_content = app_content.translate(safe_table)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("app.js converted successfully.")

    # 處理 index.html
    print("Processing index.html...")
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    for phrase in sorted_phrases:
        if phrase in html_content:
            html_content = html_content.replace(phrase, phrase_dict[phrase])
    html_content = html_content.translate(safe_table)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    print("index.html converted successfully.")

if __name__ == '__main__':
    main()
