#!/usr/bin/env python3
"""Nhập bản vẽ PDF vào mục Tài liệu → Bản vẽ NLMT.

Cách dùng:
  python3 tools/add_drawings.py <thư mục chứa PDF>

Với mỗi PDF mới (bỏ file trùng nội dung): chép vào docs/banve/<slug>.pdf, vẽ ảnh xem trước
docs/banve/<slug>.png (poppler + ImageMagick) và ghi vào docs/drawings.js (danh sách GUIDE_DRAWINGS).
Tên hiển thị mặc định lấy từ tên file; sửa title/note trong docs/drawings.js cho đẹp.
Cần: pdftoppm (poppler-utils), convert/identify (ImageMagick).
"""
import hashlib, json, pathlib, re, shutil, subprocess, sys, unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
BANVE = ROOT / 'docs' / 'banve'
LIST = ROOT / 'docs' / 'drawings.js'
HEAD = '/* Danh sách bản vẽ (tạo bởi tools/add_drawings.py; sửa tay title/note được). */\nconst GUIDE_DRAWINGS = '


def load():
    if not LIST.exists():
        return []
    s = LIST.read_text(encoding='utf-8')
    return json.loads(s[s.index('['):].strip().rstrip(';'))


def save(items):
    LIST.write_text(HEAD + json.dumps(items, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')


def slug(name):
    name = re.sub(r'^[0-9a-f]{8}-', '', name.rsplit('.', 1)[0])
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-') or 'ban-ve'


def main():
    src = pathlib.Path(sys.argv[1])
    items = load()
    known = {d['md5'] for d in items if d.get('md5')}
    BANVE.mkdir(parents=True, exist_ok=True)
    added = 0
    for pdf in sorted(src.glob('*.pdf')):
        h = hashlib.md5(pdf.read_bytes()).hexdigest()
        if h in known:
            continue
        base = slug(pdf.name)
        n, k = base, 2
        while (BANVE / (n + '.pdf')).exists():
            n, k = f'{base}-{k}', k + 1
        shutil.copyfile(pdf, BANVE / (n + '.pdf'))
        tmp = BANVE / (n + '.tmp')
        subprocess.run(['pdftoppm', '-r', '220', '-png', '-singlefile', str(BANVE / (n + '.pdf')), str(tmp)],
                       check=True, stderr=subprocess.DEVNULL)
        subprocess.run(['convert', str(tmp) + '.png', '-background', 'white', '-alpha', 'remove', '-resize', '2000x2000>',
                        '-colors', '48', '-strip', '-define', 'png:compression-level=9', str(BANVE / (n + '.png'))], check=True)
        pathlib.Path(str(tmp) + '.png').unlink()
        w, hgt = map(int, subprocess.run(['identify', '-format', '%w %h', str(BANVE / (n + '.png'))],
                                         capture_output=True, text=True, check=True).stdout.split())
        items.append({'file': n, 'title': n.replace('-', ' ').title(), 'note': '', 'landscape': w > hgt, 'md5': h})
        known.add(h)
        added += 1
        print('thêm', n)
    for p in BANVE.iterdir():
        p.chmod(0o644)
    save(items)
    print(f'Đã thêm {added} bản vẽ; tổng {len(items)}.')


if __name__ == '__main__':
    main()
