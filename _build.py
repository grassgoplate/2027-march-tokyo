#!/usr/bin/env python3
"""把 _src/*.html 模板組成根目錄的 HTML（可直接 file:// 開，也可放 GitHub Pages）。
用法：python3 _build.py            # 全部頁面
      python3 _build.py _src/eat.html  # 單頁
模板第一行：<!--PAGE title="…" desc="…"-->，其餘是 <main> 內容。
佔位符：<!--TKCSS--> <!--TKJS--> <!--LEAFLET--> <!--NAV--> <!--TABBAR--> <!--FOOT-->
        <!--PLACES--> <!--FACTS--> <!--CULTURE--> <!--TALK--> <!--APPS-->  {{n:鍵}} 數量
"""
import json, re, sys, os, html
ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

PAGES = [  # (檔名, 名稱, 圖示, 一句話)
 ('index', '總覽', '🏠', ''),
 ('itinerary', '行程', '🗓', '五天的 A／B 方案，每站連到地點卡'),
 ('sights', '景點', '⛩', '神社、寺廟、老街巷弄、美術館與展覽'),
 ('eat', '吃喝', '🍶', '在地居酒屋、橫丁、喫茶店與咖啡'),
 ('shop', '購物', '🛍', '無印良品、選物店、文具、雜貨'),
 ('parks', '樂園', '🏰', '哈利波特影城 vs 迪士尼樂園／海洋'),
 ('book', '需預約', '🎟', '門票開賣時間與要先買的東西'),
 ('stay', '住宿', '🛏', '戶越附近的平價飯店候選'),
 ('culture', '文化', '📜', '參拜、居酒屋、退稅等規矩'),
 ('talk', '會話', '💬', '可以按播放的日語句子'),
 ('prepare', '行前', '🧳', '交通卡、機票追蹤、入境、勾選清單'),
 ('apps', 'App', '📱', '出發前要裝的 App（iPhone 為主）'),
]
TABS = [('itinerary', '行程', '🗓'), ('sights', '景點', '⛩'), ('eat', '吃喝', '🍶'), ('parks', '樂園', '🏰')]

def load(p): return json.load(open(p, encoding='utf-8'))
places = load('data/places.json'); facts = load('data/facts.json')
culture = load('data/culture.json'); talk = load('data/talk.json'); apps = load('data/apps.json')
photos = load('data/photos.json')   # Wikimedia Commons／Flickr 開放授權照片（直接引用，授權與作者一起顯示）
PL = places['places']
COUNT = {
 'all': len(PL),
 'sights': sum(1 for p in PL if p['cat'] in ('sight', 'art', 'park') and not p.get('theme')),
 'eat': sum(1 for p in PL if p['cat'] in ('eat', 'cafe')),
 'shop': sum(1 for p in PL if p['cat'] == 'shop'),
 'parks': sum(1 for p in PL if p.get('theme')),
 'book': sum(1 for p in PL if p.get('bookable')),
 'stay': sum(1 for p in PL if p['cat'] == 'stay'),
 'culture': len(culture['cards']), 'talk': len(talk['entries']), 'apps': len(apps['apps']),
 'itinerary': len(places['meta']['days']), 'prepare': 0,
 'warn': sum(1 for p in PL if p.get('warn') or p['flag'] in ('warn', 'closed')),
 'overturned': len(facts['overturned']), 'unverified': len(facts['unverified']),
}

def jscript(id_, obj):
    s = json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    return f'<script type="application/json" id="{id_}">{s}</script>'

CSS = '<style>' + open('_assets/site.css', encoding='utf-8').read() + '</style>'
JS = '<script>' + open('_assets/site.js', encoding='utf-8').read().replace('</script', '<\\/script') + '</script>'
LEAFLET = ('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">'
           '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>')

def nav(cur):
    links = ''.join(f'<a class="navlink" href="{n}.html"{" aria-current=page" if n == cur else ""}>{t}</a>' for n, t, _, _ in PAGES)
    return ('<header class="top"><div class="wrap"><a class="brand" href="index.html"><span class="torii" aria-hidden="true"></span>東京 2027</a>'
            '<nav class="scroller" aria-label="分頁"><button class="arrow l" type="button" aria-label="往左捲">‹</button>'
            f'<div class="track">{links}</div><button class="arrow r" type="button" aria-label="往右捲">›</button></nav></div></header>')

def tabbar(cur):
    t = ''.join(f'<a href="{n}.html"{" aria-current=page" if n == cur else ""}><span class="i" aria-hidden="true">{i}</span>{lab}</a>' for n, lab, i in TABS)
    sheet = ''.join(f'<a href="{n}.html"><span style="font-size:20px" aria-hidden="true">{i}</span>{lab}</a>' for n, lab, i, _ in PAGES)
    return (f'<nav class="tabbar" aria-label="常用分頁">{t}<button type="button" id="more-btn" aria-expanded="false" aria-controls="more-sheet"><span class="i" aria-hidden="true">☰</span>更多</button></nav>'
            f'<div class="sheet" id="more-sheet" hidden><div class="panel" role="dialog" aria-label="全部分頁"><div class="grid">{sheet}</div>'
            '<button type="button" class="btn ghost close">關閉</button></div></div>')

def foot():
    v = places['meta']['verified']
    links = '　'.join(f'<a href="{n}.html">{t}</a>' for n, t, _, _ in PAGES)
    return ('<footer><div class="wrap">'
            f'<p><b>查證日期：</b>{v}。營業時間、票價、規則到 2027 年 3 月可能改變，訂票或出發前請再看官網。</p>'
            '<p><b>評分：</b>只有研究時親眼看到的才寫，並標明來源與日期，是當時的快照。</p>'
            '<p><b>地圖：</b>圖磚 &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors，地圖程式 Leaflet。虛線圈是「大約位置」，導航請按卡片上的 Google 地圖。</p>'
            f'<p><b>照片：</b>{len(photos)} 張，{sum(1 for v in photos.values() if v.get("src")=="flickr")} 張來自 Flickr、其餘來自 Wikimedia Commons，授權都是 CC0、CC BY、CC BY-SA 或公有領域；每張都人工看過，確認拍的是該地點。作者與授權寫在每張照片下方，完整清單見 <a href="CREDITS.md">CREDITS.md</a>。沒有合適照片的地點用類別圖示代替。</p>'
            '<p><b>Google 星等：</b>2026/10 在 Google 地圖上查到的快照，之後會變動；查不到或對不上店名的就不寫。</p>'
            '<p><b>資料：</b><a href="data/places.json">data/places.json</a> 是唯一資料來源；架構沿用同事的 PRD。</p>'
            f'<p>{links}</p></div></footer>')

def build(src):
    name = os.path.splitext(os.path.basename(src))[0]
    raw = open(src, encoding='utf-8').read()
    m = re.match(r'<!--PAGE title="([^"]*)" desc="([^"]*)"-->\s*', raw)
    if not m: raise SystemExit(f'{src}: 第一行缺 <!--PAGE ...-->')
    title, desc, body = m.group(1), m.group(2), raw[m.end():]
    body = re.sub(r'\{\{n:(\w+)\}\}', lambda mm: str(COUNT[mm.group(1)]), body)
    body = re.sub(r'\{\{ph:([\w-]+)\}\}', lambda mm: html.escape(photos[mm.group(1)]['u']), body)
    rep = {
     '<!--NAV-->': nav(name), '<!--TABBAR-->': tabbar(name), '<!--FOOT-->': foot(),
     '<!--PLACES-->': jscript('data-places', places) + jscript('data-photos', photos), '<!--FACTS-->': jscript('data-facts', facts),
     '<!--CULTURE-->': jscript('data-culture', culture), '<!--TALK-->': jscript('data-talk', talk),
     '<!--APPS-->': jscript('data-apps', apps),
    }
    need_map = 'tk-places' in body
    for k, v in rep.items(): body = body.replace(k, v)
    out = ('<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8">'
           '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
           f'<title>{html.escape(title)}</title><meta name="description" content="{html.escape(desc)}">'
           '<meta name="theme-color" content="#1f3a5f">'
           '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;700&display=swap">'
           + CSS + (LEAFLET if need_map else '') + '</head><body>' + body + JS + '</body></html>')
    left = re.findall(r'<!--(?:TKCSS|TKJS|LEAFLET|NAV|TABBAR|FOOT|PLACES|FACTS|CULTURE|TALK|APPS)-->|\{\{(?:n|ph):[\w-]+\}\}', out)
    if left: raise SystemExit(f'{src}: 還有沒替換的佔位符 {left}')
    open(f'{name}.html', 'w', encoding='utf-8').write(out)
    print(f'built {name}.html  {len(out)//1024} KB')

def credits():
    names = {p['id']: p['zh'] for p in PL}
    lines = ['# 照片來源與授權', '',
             '照片來自 Wikimedia Commons 與 Flickr，網站直接引用原站的圖片網址，沒有修改內容。',
             '授權只收 CC0、CC BY、CC BY-SA、公有領域。每張都在建置前人工看過，確認拍的是該地點。', '',
             '| 地點 | 來源 | 檔案／標題 | 作者 | 授權 |', '|---|---|---|---|---|']
    for pid, ph in sorted(photos.items()):
        lines.append(f"| {names.get(pid, pid)} | {'Flickr' if ph.get('src') == 'flickr' else 'Wikimedia Commons'} | [{ph['file']}]({ph['pg']}) | {ph['art']} | {ph['lic']} |")
    open('CREDITS.md', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'built CREDITS.md  {len(photos)} photos')

if __name__ == '__main__':
    srcs = sys.argv[1:] or [f'_src/{n}.html' for n, *_ in PAGES]
    for s in srcs: build(s)
    if not sys.argv[1:]: credits()
