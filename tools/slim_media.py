#!/usr/bin/env python3
"""Tách ảnh/video nhúng (data URI) trong docs/questions.js ra file riêng docs/media/.

Chạy: python3 tools/slim_media.py
- PNG -> WebP không mất dữ liệu (PIL), video mp4 giữ nguyên; file trùng nội dung dùng chung một file.
- questions.js chỉ còn đường dẫn "media/xxx.webp". Chạy lại nhiều lần vẫn an toàn.
Cần: Pillow.
"""
import base64, hashlib, io, json, pathlib, re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'docs' / 'questions.js'
OUT = ROOT / 'docs' / 'media'
HEAD = 'const DEFAULT_QUESTIONS = '

s = SRC.read_text(encoding='utf-8')
assert s.startswith(HEAD)
data = json.loads(s[len(HEAD):s.rindex(']') + 1])
OUT.mkdir(exist_ok=True)
seen = {}
n_img = n_vid = 0
for q in data:
    m = q.get('mediaData')
    if not m or not m.startswith('data:'):
        continue
    mime, b64 = re.match(r'data:([^;]+);base64,(.*)$', m, re.S).groups()
    raw = base64.b64decode(b64)
    h = hashlib.md5(raw).hexdigest()[:12]
    if h not in seen:
        if mime.startswith('image/'):
            im = Image.open(io.BytesIO(raw))
            im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
            name = f'{h}.webp'
            im.save(OUT / name, 'WEBP', lossless=True, quality=100, method=6)
            n_img += 1
        elif mime == 'video/mp4':
            name = f'{h}.mp4'
            (OUT / name).write_bytes(raw)
            n_vid += 1
        else:
            raise SystemExit(f'Không hỗ trợ {mime} ở câu {q.get("id")}')
        seen[h] = name
    q['mediaData'] = 'media/' + seen[h]
SRC.write_text(HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(f'ảnh {n_img}, video {n_vid}, file media: {len(seen)}')
