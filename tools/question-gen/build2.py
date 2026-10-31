import json, re, random, hashlib, unicodedata, shutil, sys
from PIL import Image
sys.path.insert(0, '/tmp/hmt-q')
from meter_q import Q
DOCS = 'docs'
src = open(DOCS + '/questions.js', encoding='utf-8').read(); a = src.index('['); b = src.rindex(']') + 1
bank = json.loads(src[a:b])
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').replace('đ', 'd')
    return set(w for w in re.findall(r'[a-z0-9]+', s) if len(w) > 2)
old = [(q['id'], norm(q['question'])) for q in bank]
sim = lambda x, y: len(x & y) / max(1, len(x | y))
n = max(int(q['id'][2:]) for q in bank if re.fullmatch(r'hq\d+', q['id']))
rnd = random.Random(20261101); out, flagged, cache = [], [], {}
def media(tag):
    if tag in cache: return cache[tag]
    kind, name = tag.split(':')
    p = f'tools/question-gen/real/{name}.png' if kind == 'real' else f'tools/question-gen/png/{name}.png'
    im = Image.open(p).convert('RGB')
    if im.width > 800: im = im.resize((800, round(im.height * 800 / im.width)))
    if im.height > 1100: im = im.resize((round(im.width * 1100 / im.height), 1100))
    tmp = f'tools/question-gen/{name}.webp'; im.save(tmp, 'WEBP', quality=80, method=6)
    h = hashlib.md5(open(tmp, 'rb').read()).hexdigest()[:12]; shutil.copy(tmp, f'{DOCS}/media/{h}.webp')
    cache[tag] = ('image', f'media/{h}.webp'); return cache[tag]
for tag, cat, diff, qs, opts, expl in Q:
    s = norm(qs); best = max(old, key=lambda o: sim(s, o[1]))
    if sim(s, best[1]) >= 0.5: flagged.append((round(sim(s, best[1]), 2), qs[:60], best[0]))
    n += 1; qid = f'hq{n}'; order = list(range(4)); rnd.shuffle(order)
    q = {'id': qid, 'category': cat, 'question': qs, 'options': [opts[i] for i in order], 'correct': order.index(0), 'group': qid, 'difficulty': diff, 'explanation': expl}
    if tag: q['mediaType'], q['mediaData'] = media(tag)
    assert len(set(q['options'])) == 4
    out.append(q)
bank += out
open(DOCS + '/questions.js', 'w', encoding='utf-8').write(src[:a] + json.dumps(bank, ensure_ascii=False, separators=(',', ':')) + src[b:])
from collections import Counter
print('thêm', len(out), out[0]['id'], '->', out[-1]['id'], '; ảnh thật', sum(1 for t in Q if t[0] and t[0].startswith('real')), '; mô phỏng', sum(1 for t in Q if t[0] and t[0].startswith('scene')), '; tổng', len(bank))
print(Counter(q['difficulty'] for q in out), Counter(q['correct'] for q in out)); print('nghi trùng', flagged)
