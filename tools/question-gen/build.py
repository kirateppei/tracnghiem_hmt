import json, re, random, hashlib, unicodedata, shutil, sys
from PIL import Image
sys.path.insert(0, '/tmp/hmt-q')
from text_q import Q as TQ
from img_q import Q as IQ
DOCS = 'docs'
src = open(DOCS + '/questions.js', encoding='utf-8').read()
a = src.index('['); b = src.rindex(']') + 1
bank = json.loads(src[a:b])
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').replace('đ', 'd')
    return set(w for w in re.findall(r'[a-z0-9]+', s) if len(w) > 2)
old = [(q['id'], norm(q['question'])) for q in bank]
def sim(x, y): return len(x & y) / max(1, len(x | y))
rnd = random.Random(20261031)
out, flagged = [], []
existing_ids = {q['id'] for q in bank}
n = 0
def make(cat, diff, qs, opts, expl, media=None):
    global n
    n += 1; qid = f'hq{n}'
    assert qid not in existing_ids
    order = list(range(4)); rnd.shuffle(order)
    q = {'id': qid, 'category': cat, 'question': qs, 'options': [opts[i] for i in order], 'correct': order.index(0), 'group': qid, 'difficulty': diff, 'explanation': expl}
    if media: q['mediaType'], q['mediaData'] = media
    return q
for cat, diff, qs, opts, expl in TQ:
    s = norm(qs); best = max(old, key=lambda o: sim(s, o[1]))
    if sim(s, best[1]) >= 0.55: flagged.append((round(sim(s, best[1]), 2), qs[:70], best[0]))
    out.append(make(cat, diff, qs, opts, expl))
for scene, cat, diff, qs, opts, expl in IQ:
    if scene.startswith('vid_'):
        f = f'tools/question-gen/out/{scene}.mp4'; h = hashlib.md5(open(f, 'rb').read()).hexdigest()[:12]
        shutil.copy(f, f'{DOCS}/media/{h}.mp4'); media = ('video', f'media/{h}.mp4')
    else:
        im = Image.open(f'tools/question-gen/png/{scene}.png').convert('RGB'); tmp = f'tools/question-gen/{scene}.webp'; im.save(tmp, 'WEBP', quality=78, method=6)
        h = hashlib.md5(open(tmp, 'rb').read()).hexdigest()[:12]; shutil.copy(tmp, f'{DOCS}/media/{h}.webp'); media = ('image', f'media/{h}.webp')
    out.append(make(cat, diff, qs, opts, expl, media))
# chất lượng: 4 đáp án khác nhau, không đáp án trùng
for q in out:
    assert len(set(q['options'])) == 4 and q['difficulty'] in ('de', 'tb', 'kho'), q['id']
bank += out
open(DOCS + '/questions.js', 'w', encoding='utf-8').write(src[:a] + json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + src[b:])
from collections import Counter
print('thêm', len(out), 'câu; có hình', sum(1 for q in out if q.get('mediaType') == 'image'), '; video', sum(1 for q in out if q.get('mediaType') == 'video'))
print('mức', Counter(q['difficulty'] for q in out)); print('chủ đề', Counter(q['category'] for q in out))
print('vị trí đáp án đúng', Counter(q['correct'] for q in out))
print('nghi trùng (>=0.55):', len(flagged)); [print(' ', f) for f in flagged]
