#!/usr/bin/env python3
"""每次改完資料或模板都跑：python3 _check.py
檢查資料欄位、警告格式、座標範圍、行程引用、模板 data-keys、站內連結、隱私字串。有錯就 exit 1。"""
import json, re, os, glob, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
err, warn = [], []
P = json.load(open('data/places.json')); F = json.load(open('data/facts.json'))
ids = [p['id'] for p in P['places']]
if len(ids) != len(set(ids)): err.append('地點 id 重複')
REQ = ['id', 'name', 'zh', 'cat', 'zone', 'town', 'lat', 'lng', 'q', 'flag', 'note', 'src']
FLAGS = {'star', 'ok', 'warn', 'info', 'closed', 'unverified'}
for p in P['places']:
    for k in REQ:
        if p.get(k) in (None, '', []): err.append(f"{p['id']}: 缺 {k}")
    if p['flag'] not in FLAGS: err.append(f"{p['id']}: flag 不合法 {p['flag']}")
    if p['cat'] not in P['meta']['cats']: err.append(f"{p['id']}: cat 不合法 {p['cat']}")
    if p['zone'] not in P['meta']['zones']: err.append(f"{p['id']}: zone 不合法")
    if not (35.4 < p['lat'] < 35.9 and 139.4 < p['lng'] < 140.0): err.append(f"{p['id']}: 座標不在東京範圍")
    if p['flag'] in ('warn', 'closed') and not p.get('warn'): warn.append(f"{p['id']}: flag={p['flag']} 但卡片正面沒有 warn 文字")
    if p.get('warn') and not p['warn'].startswith('⚠️'): err.append(f"{p['id']}: warn 沒有以 ⚠️ 開頭")
    for k in ('note', 'warn'):
        t = p.get(k) or ''
        if re.search(r'<(?!/?b>)', t): err.append(f"{p['id']}.{k}: 只允許 <b>")
    if p.get('g') and not (p['g'].get('src') and p['g'].get('asof')): err.append(f"{p['id']}: 評分缺來源或日期")
    if len(p.get('src', [])) < 2 and p['flag'] in ('star',): warn.append(f"{p['id']}: star 但只有 {len(p.get('src', []))} 個來源")
for r in P['routes']:
    for o in r['options']:
        for pid in o['main'] + o['alt']:
            if pid not in ids: err.append(f"行程 day{r['day']}{o['label']}: 找不到 {pid}")
# 模板引用的 facts 鍵
keys = {f['k'] for f in F['facts']}
for t in glob.glob('_src/*.html'):
    s = open(t).read()
    for m in re.finditer(r'data-keys="([^"]+)"', s):
        for k in m.group(1).split('|'):
            if k not in keys: err.append(f'{t}: facts 找不到「{k}」')
# 照片：授權白名單、對得到地點；Google 星等合理
PH = json.load(open('data/photos.json'))
OKLIC = ('CC0', 'CC BY', 'CC BY-SA', 'Public domain', 'PD')
for k, v in PH.items():
    if k not in ids: err.append(f'photos: 找不到地點 {k}')
    if not v.get('lic', '').startswith(OKLIC): err.append(f'photos {k}: 授權不在白名單 {v.get("lic")}')
    if not (v.get('art') and v.get('pg') and v.get('u', '').startswith('https://upload.wikimedia.org/')): err.append(f'photos {k}: 缺作者／來源頁／網址')
for p in P['places']:
    g = p.get('gm')
    if g and not (1 <= g['r'] <= 5 and g['c'] >= 1 and g.get('asof') and g.get('pid')): err.append(f"{p['id']}: gm 格式不對")
# 輸出頁面：站內連結、佔位符、隱私
pages = {os.path.basename(x) for x in glob.glob('*.html')}
for h in sorted(pages):
    s = open(h).read()
    for m in re.finditer(r'href="([a-z]+\.html)', s):
        if m.group(1) not in pages: err.append(f'{h}: 連到不存在的 {m.group(1)}')
    if re.search(r'<!--(PLACES|FACTS|NAV|TABBAR|FOOT|CULTURE|TALK|APPS)-->', s): err.append(f'{h}: 佔位符沒替換')
    if 'Jess' in s: err.append(f'{h}: 出現本名 Jess')
    if re.search(r'朋友家[^。]{0,12}(丁目|\d+-\d+)', s): err.append(f'{h}: 朋友家附近出現地址')
for w in warn: print('WARN', w)
for e in err: print('ERR ', e)
print(f"{len(P['places'])} places, {len(pages)} pages, {len(err)} errors, {len(warn)} warnings")
sys.exit(1 if err else 0)
