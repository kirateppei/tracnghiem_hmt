#!/usr/bin/env python3
"""Tách nhạc nền nhúng (base64) trong docs/music.js ra file mp3 riêng docs/audio/.
Chạy: python3 tools/slim_music.py   (an toàn khi chạy lại)
music.js chỉ còn danh sách bài (id, name, src); trình phát tải nhạc theo kiểu stream."""
import base64, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'music.js'
OUT = ROOT / 'docs' / 'audio'
HEAD = 'const MUSIC_TRACKS = '
s = SRC.read_text(encoding='utf-8')
assert s.startswith(HEAD)
tracks = json.loads(s[len(HEAD):s.rindex(']') + 1])
OUT.mkdir(exist_ok=True)
res = []
for t in tracks:
    if 'b64' in t:
        (OUT / f"{t['id']}.mp3").write_bytes(base64.b64decode(t['b64']))
    res.append({'id': t['id'], 'name': t['name'], 'src': f"audio/{t['id']}.mp3"})
SRC.write_text(HEAD + json.dumps(res, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
print('đã tách', len(res), 'bài')
