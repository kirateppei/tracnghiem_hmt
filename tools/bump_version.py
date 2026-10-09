#!/usr/bin/env python3
"""Đóng dấu phiên bản cho trang web trong docs/ (chạy trước mỗi lần commit khi có sửa trong docs/).

Phiên bản = mã băm nội dung toàn bộ thư mục docs/ (không tính chính các file phiên bản), nên:
- không sửa gì thì phiên bản không đổi; sửa là đổi, không phải nhớ tăng số tay;
- ghi docs/version.js (phiên bản đang chạy), docs/version.json (phiên bản mới nhất, trang sẽ hỏi file này)
  và gắn ?v=<phiên bản> vào các thẻ <script> trong docs/index.html để trình duyệt không dùng bản cũ.

Ví dụ:
  python3 tools/bump_version.py --notes "Thêm xếp hạng theo độ khó"
  python3 tools/bump_version.py --apk-version 1.1.0 --apk-url https://github.com/.../app.apk --apk-notes "Có plugin mới"
Chỉ dùng thư viện chuẩn của Python 3.
"""
import argparse
import datetime
import hashlib
import json
import pathlib
import re

DOCS = pathlib.Path(__file__).resolve().parent.parent / 'docs'
SKIP = {'version.js', 'version.json', '.nojekyll'}
SCRIPT_TAG = re.compile(r'(<script src=")([A-Za-z0-9_.\-]+\.js)(\?v=[0-9a-f]+)?("></script>)')


def content_hash():
    h = hashlib.sha256()
    for p in sorted(DOCS.rglob('*')):
        if not p.is_file() or (p.parent == DOCS and p.name in SKIP):
            continue
        rel = p.relative_to(DOCS).as_posix()
        data = p.read_bytes()
        if rel == 'index.html':
            data = re.sub(rb'\?v=[0-9a-f]{10}', b'', data)  # phần ?v= do chính script này ghi, không tính
        h.update(rel.encode('utf-8') + b'\0' + data + b'\0')
    return h.hexdigest()[:10]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--notes', help='Ghi chú bản mới, hiện trong thanh thông báo trên điện thoại')
    ap.add_argument('--apk-version', help='Số phiên bản app Android mới (ví dụ 1.1.0) để nhắc cài lại app')
    ap.add_argument('--apk-url', help='Liên kết tải file APK mới')
    ap.add_argument('--apk-notes', help='Ghi chú bản app mới')
    args = ap.parse_args()

    vjson = DOCS / 'version.json'
    old = json.loads(vjson.read_text(encoding='utf-8')) if vjson.exists() else {}
    new_hash = content_hash()
    changed = old.get('version') != new_hash
    now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    data = {
        'version': new_hash,
        'date': now if changed else old.get('date', now),
        'notes': args.notes if args.notes is not None else ('' if changed else old.get('notes', '')),
        'apk': dict(old.get('apk') or {'version': '', 'url': '', 'notes': ''}),
    }
    if args.apk_version is not None:
        data['apk']['version'] = args.apk_version
    if args.apk_url is not None:
        data['apk']['url'] = args.apk_url
    if args.apk_notes is not None:
        data['apk']['notes'] = args.apk_notes

    vjson.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (DOCS / 'version.js').write_text(
        'window.APP_VERSION = %s;\nwindow.APP_DATE = %s;\n' % (json.dumps(data['version']), json.dumps(data['date'])),
        encoding='utf-8')

    index = DOCS / 'index.html'
    html = index.read_text(encoding='utf-8')
    html2 = SCRIPT_TAG.sub(lambda m: '%s%s?v=%s%s' % (m.group(1), m.group(2), new_hash, m.group(4)), html)
    if html2 != html:
        index.write_text(html2, encoding='utf-8')

    print('Phiên bản: %s (%s)' % (data['version'], 'MỚI' if changed else 'không đổi'))
    if changed and args.notes is None:
        print('Gợi ý: thêm --notes "..." để điện thoại hiện nội dung bản mới.')


if __name__ == '__main__':
    main()
