#!/usr/bin/env python3
"""把 research/*.json（各 subagent 的分區研究）合併成 data/*.json。
用法：python3 _merge.py
- 去重：名稱相同或（座標 350m 內且名稱前 4 字相同）視為同一地點
- 依 routes.json 把行程裡出現的地點標上 day
- 座標檢查：離最近的參考車站超過 2.5km 的列出來人工檢查
"""
import json, glob, math, re, os, sys
R = 'research'
DAYMAP = {}
routes = json.load(open('data/routes.json'))
for r in routes['routes']:
    for o in r['options']:
        for pid in o['main'] + o['alt']:
            DAYMAP.setdefault(pid, r['day'])

REF = {  # 參考座標（車站／地標，大約位置，只用來抓離譜的座標）
 '戶越':(35.6147,139.7164),'五反田':(35.6262,139.7236),'品川':(35.6285,139.7387),'目黑':(35.6339,139.7157),
 '中目黑':(35.6442,139.6987),'代官山':(35.6481,139.7031),'大井町':(35.6065,139.7347),'自由之丘':(35.6075,139.6686),
 '新橋':(35.6663,139.7583),'銀座':(35.6717,139.7650),'日本橋':(35.6820,139.7740),'人形町':(35.6863,139.7826),
 '藏前':(35.7036,139.7907),'淺草':(35.7114,139.7966),'押上':(35.7101,139.8131),'澀谷':(35.6580,139.7016),
 '原宿':(35.6702,139.7027),'表參道':(35.6652,139.7123),'下北澤':(35.6616,139.6680),'三軒茶屋':(35.6437,139.6706),
 '新宿':(35.6900,139.7003),'上野':(35.7138,139.7773),'谷中':(35.7270,139.7685),'神樂坂':(35.7020,139.7400),
 '神田':(35.6917,139.7709),'柴又':(35.7580,139.8752),'清澄白河':(35.6821,139.7988),'六本木':(35.6628,139.7314),
 '豐洲':(35.6549,139.7962),'三鷹':(35.7027,139.5607),'豐島園':(35.7425,139.6475),'舞濱':(35.6365,139.8836),
 '旗の台':(35.6049,139.7025),'泉岳寺':(35.6385,139.7401),'湯島':(35.7078,139.7699),
}
def dist(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2-la1)/2)**2 + math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 6371000*2*math.asin(math.sqrt(h))

def clean(s):
    if not isinstance(s, str): return s
    s = s.replace('Jess 的據點', '戶越據點').replace('Jess的據點', '戶越據點').replace('Jess 和', '我和').replace('Jess', '我們')
    return s.strip()
def deep_clean(o):
    if isinstance(o, dict): return {k: deep_clean(v) for k, v in o.items()}
    if isinstance(o, list): return [deep_clean(v) for v in o]
    return clean(o)

places, culture, talk, apps, facts, unver, over = [], [], [], [], [], [], []
for f in sorted(glob.glob(f'{R}/?.json')):
    code = os.path.basename(f)[0]
    d = deep_clean(json.load(open(f)))
    for p in d.get('places', []):
        p['_r'] = code; places.append(p)
    culture += d.get('culture', []); talk += d.get('talk', []); apps += d.get('apps', [])
    for x in d.get('facts', []): x['r'] = code; facts.append(x)
    for x in d.get('unverified', []): x['r'] = code; unver.append(x)
    for x in d.get('overturned', []): x['r'] = code; over.append(x)

# 去重
out, seen = [], []
for p in places:
    dup = None
    for q in out:
        if p['name'] == q['name'] or (dist((p['lat'],p['lng']),(q['lat'],q['lng'])) < 350 and min(len(p['name']),len(q['name']))>=4 and (p['name'] in q['name'] or q['name'] in p['name'])):
            dup = q; break
    if dup: print('DUP', p['id'], '=>', dup['id']); continue
    out.append(p)
places = out

for p in places:
    p['day'] = DAYMAP.get(p['id'], p.get('day') if p['id'][0] != 'c' else None)
    if p['id'] not in DAYMAP: p['day'] = None   # 只有排進行程的才有日期
    if p['id'].startswith('e-'): p['theme'] = True
    # 卡片正面警告一律以 ⚠️ 開頭
    if p.get('warn') and not p['warn'].startswith('⚠️'): p['warn'] = '⚠️ ' + p['warn']
    p.pop('_r', None)

# Google 地圖星等快照（research/google_ratings.tsv，2026-10 查詢）與人工修正（research/overrides.json）
GM = {}
for line in open(f'{R}/google_ratings.tsv', encoding='utf-8'):
    if line.startswith('#') or not line.strip(): continue
    pid_, r, n, gpid, gname = line.rstrip('\n').split('\t')
    GM[pid_] = {'r': float(r), 'c': int(n), 'n': f'{int(n):,}', 'asof': '2026-10', 'pid': gpid, 'gname': gname}
OV = json.load(open(f'{R}/overrides.json', encoding='utf-8'))
for p in places:
    if p['id'] in GM: p['gm'] = GM[p['id']]
    o = OV.get(p['id'])
    if o:
        if 'warn' in o: p['warn'] = o['warn']
        if 'warn_add' in o: p['warn'] = (p.get('warn', '') + '\n' + o['warn_add']).strip()
        if 'flag' in o: p['flag'] = o['flag']
        for k in ('rs', 'bkq', 'bknote', 'tel'):
            if k in o: p[k] = o[k]
missing_gm = [k for k in GM if k not in {p['id'] for p in places}]
if missing_gm: print('GM ids missing:', missing_gm); sys.exit(1)

# 使用者規則（2026-10-10）：Google 地圖星等低於 4.0 的地點不放（4.0 保留；沒有 Google 星等的不受影響）
MIN_GM = 4.0
low = [p for p in places if p.get('gm') and p['gm']['r'] < MIN_GM]
gone = {p['id'] for p in low}
places = [p for p in places if p['id'] not in gone]
for r in routes['routes']:
    for o in r['options']:
        o['main'] = [x for x in o['main'] if x not in gone]
        o['alt'] = [x for x in o['alt'] if x not in gone]
        if not o['main']: print('ROUTE main 變空的:', r['day'], o['label']); sys.exit(1)
with open(f'{R}/removed_low_rating.md', 'w', encoding='utf-8') as fh:
    fh.write('# Google 星等低於 4.0 而移除的地點\n\n使用者規則：Google 地圖星等 4.0 以下（不含 4.0）的地點不放進網站。星等是 2026/10 用 Google 地圖查詢的快照。\n'
             '沒有單一 Google 地點的街道、商店街，以及沒查星等的地點（例如部分飯店）不受影響。\n\n| 地點 | Google 上的名稱 | 星等 | 評論數 | 原本排在 |\n|---|---|---|---|---|\n')
    for p in sorted(low, key=lambda p: p['gm']['r']):
        days = [f"day{r['day']}{o['label']}" for r in json.load(open('data/routes.json'))['routes'] for o in r['options'] if p['id'] in o['main'] + o['alt']]
        fh.write(f"| {p['zh']} | {p['gm']['gname']} | {p['gm']['r']:.1f} | {p['gm']['n']} | {'、'.join(days) or '—'} |\n")
print('removed <4.0:', len(low), sorted(gone))

# 座標檢查
bad = []
for p in places:
    near = min(REF.items(), key=lambda kv: dist((p['lat'],p['lng']), kv[1]))
    dd = dist((p['lat'],p['lng']), near[1])
    if dd > 2500: bad.append((p['id'], p['town'], near[0], round(dd)))
for b in bad: print('GEO?', *b)

missing = [pid for r in routes['routes'] for o in r['options'] for pid in o['main'] + o['alt'] if pid not in {p['id'] for p in places}]
if missing: print('ROUTE ids missing:', missing); sys.exit(1)

meta = {
 'trip': '東京 2027 春', 'dates': '2027/03/17 — 03/21', 'verified': '2026-10-10',
 'cats': {'sight':'景點','art':'展覽','park':'公園・樂園','eat':'居酒屋・吃','cafe':'咖啡・喫茶','shop':'購物','stay':'住宿','animal':'動物・水族'},
 'zones': {'z1':'據點周邊','z2':'淺草線直通','z3':'西側','z4':'北側下町','z5':'郊外・樂園'},
 'days': routes['days'], 'fx': {'jpy_twd': 0.21, 'note': '假設值，請在頁面上改成實際匯率'},
}
json.dump({'meta': meta, 'places': places, 'routes': routes['routes']}, open('data/places.json','w'), ensure_ascii=False, indent=1)
json.dump({'meta': {'secs': ['etiquette','shrine','food','transport','money','history']}, 'cards': culture}, open('data/culture.json','w'), ensure_ascii=False, indent=1)
json.dump({'meta': {'secs': ['basic','izakaya','shop','transit','shrine','hotel','park','emergency']}, 'entries': talk}, open('data/talk.json','w'), ensure_ascii=False, indent=1)
json.dump({'apps': apps}, open('data/apps.json','w'), ensure_ascii=False, indent=1)
json.dump({'facts': facts, 'unverified': unver, 'overturned': over}, open('data/facts.json','w'), ensure_ascii=False, indent=1)
print(len(places), 'places;', len(culture), 'culture;', len(talk), 'talk;', len(apps), 'apps;', len(facts), 'facts;', len(unver), 'unverified;', len(over), 'overturned')
