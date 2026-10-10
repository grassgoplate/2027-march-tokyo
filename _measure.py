#!/usr/bin/env python3
"""用無頭 Chromium 實際量測版面（不是看截圖）：python3 _measure.py
- 以 getBoundingClientRect / getComputedStyle / elementFromPoint 檢查
- Leaflet 由本機 node_modules 供應（建置環境連不到 CDN），圖磚與字型以空白回應代替
"""
import json, os, sys, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.abspath(__file__))
LEAF = os.environ.get('LEAFLET_DIR', '/tmp/lf/package/dist')
PNG = bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000'
                    '1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')
PAGES = ['index', 'itinerary', 'sights', 'eat', 'shop', 'parks', 'book', 'stay', 'culture', 'talk', 'prepare', 'apps']
VPS = {'mobile': dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=3),
       'desktop': dict(viewport={'width': 1280, 'height': 800})}

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
port = srv.server_address[1]; threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f'http://127.0.0.1:{port}/'

def route(r):
    u = r.request.url
    if 'unpkg.com/leaflet@1.9.4/dist/' in u:
        f = u.split('/dist/')[1]
        return r.fulfill(path=os.path.join(LEAF, f), headers={'Access-Control-Allow-Origin': '*'})
    if 'tile.openstreetmap.org' in u or 'upload.wikimedia.org' in u or 'staticflickr.com' in u: return r.fulfill(body=PNG, content_type='image/png')
    if 'fonts.g' in u: return r.fulfill(body='', content_type='text/css')
    if u.startswith(BASE): return r.continue_()
    return r.abort()

PROBE = r"""() => {
 const vw = innerWidth, out = {};
 out.scrollW = document.documentElement.scrollWidth; out.vw = vw;
 out.overflow = [...document.querySelectorAll('body *')].filter(e => {const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
   if (!r.width || cs.position==='fixed') return false; if (e.closest('.track,.tablewrap,.leaflet-container')) return false; return r.right > vw + 1 || r.left < -1;})
   .slice(0, 5).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right));
 const sel = '.ab,.bk,.fold-h,.pill,.fchip,.btn,.navlink,.arrow,.play,.seg button,.claims summary,.tabbar a,.tabbar button,.stops a,.check label,.tk-search,.pagecards a';
 out.small = [...document.querySelectorAll(sel)].filter(e => {const r = e.getBoundingClientRect(); return r.width && r.height && getComputedStyle(e).visibility!=='hidden' && r.height < 43.5;})
   .slice(0, 6).map(e => e.className + ':' + (e.textContent||'').trim().slice(0, 10) + ' h=' + e.getBoundingClientRect().height.toFixed(1));
 out.inputs = [...document.querySelectorAll('input[type=search],input[type=number]')].map(i => parseFloat(getComputedStyle(i).fontSize)).filter(s => s < 16);
 const tb = document.querySelector('.tabbar'); out.tabbar = tb ? getComputedStyle(tb).display : 'none';
 if (tb && out.tabbar !== 'none') {
   out.tabHits = [...tb.querySelectorAll('a,button')].map(a => {const r = a.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2); return (a.contains(h)?'ok':'BLOCKED') + ':' + Math.round(r.height);});
 }
 const bar = document.querySelector('.tk-bar'); out.barH = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
 out.cards = document.querySelectorAll('.pc').length;
 out.hdrH = Math.round(document.querySelector('.top').getBoundingClientRect().height);
 return out;
}"""

def main():
    bad = 0; report = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for vn, vo in VPS.items():
            ctx = b.new_context(**vo); ctx.route('**/*', route)
            for p in PAGES:
                pg = ctx.new_page(); errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
                pg.goto(BASE + p + '.html'); pg.wait_for_load_state('networkidle')
                r = pg.evaluate(PROBE); r['errors'] = errs
                # 互動：地點瀏覽器
                if pg.query_selector('.tk-places'):
                    if pg.evaluate("document.querySelector('.tk-map').hidden"):
                        pg.click('.tk-places [data-view=map]'); pg.wait_for_timeout(400)
                    m = pg.evaluate("""() => {const m=document.querySelector('.tk-map');const r=m.getBoundingClientRect();
                        return {h:Math.round(r.height),w:Math.round(r.width),leaflet:!!m.querySelector('.leaflet-pane'),markers:m.querySelectorAll('.tkpin').length,legend:!!m.querySelector('.maplegend')&&getComputedStyle(m.querySelector('.maplegend')).display,hidden:m.hidden}}""")
                    r['map'] = m
                    if pg.evaluate("document.querySelector('.tk-listwrap').hidden"): pg.click('.tk-places [data-view=list]'); pg.wait_for_timeout(200)
                    # 第一張卡片的按鈕有沒有被 sticky 篩選列蓋住
                    hit = pg.evaluate("""() => {const b=document.querySelector('.pc .acts .ab');if(!b)return 'nocard';
                        b.closest('.pc').scrollIntoView({block:'start'});let r=b.getBoundingClientRect();if(r.bottom>innerHeight-80){b.scrollIntoView({block:'center'});r=b.getBoundingClientRect();}const h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
                        return b.contains(h)?'ok':'BLOCKED by '+(h&&h.className)}""")
                    r['firstBtn'] = hit
                    # 彩色收合區塊：點開第一個「知識點」，量展開後的高度與按鈕狀態
                    db = pg.query_selector('.pc .f-know .fold-h') or pg.query_selector('.pc .fold-h')
                    if db:
                        db.scroll_into_view_if_needed(); db.click()
                        r['deepOpen'] = pg.evaluate("""() => {const h=document.querySelector('.pc .fold-h[aria-expanded=true]');if(!h)return 0;const b=h.nextElementSibling;return b.hidden?0:Math.round(b.getBoundingClientRect().height)}""")
                    r['bk'] = pg.evaluate("document.querySelectorAll('.pc .bk').length")
                    # 篩選：點第一個板塊 chip
                    z = pg.query_selector('.tk-places .fchip.zone')
                    if z:
                        before = pg.evaluate("document.querySelector('.tk-count').textContent")
                        z.scroll_into_view_if_needed(); z.click(); pg.wait_for_timeout(100)
                        r['zoneFilter'] = before.split('　')[0] + ' → ' + pg.evaluate("document.querySelector('.tk-count').textContent").split('　')[0]
                if p == 'itinerary':
                    r['days'] = pg.evaluate("document.querySelectorAll('.day').length")
                    h = pg.query_selector('.f-alt .fold-h')
                    if h: h.scroll_into_view_if_needed(); h.click(); r['folds'] = pg.evaluate("(()=>{const b=document.querySelector('.f-alt .fold-b');return b.hidden?'closed':'open '+b.querySelectorAll('a').length})()")
                if p == 'talk': r['play'] = pg.evaluate("document.querySelectorAll('.play').length")
                if p == 'prepare':
                    pg.click('#ck-flight-track'); pg.reload(); pg.wait_for_load_state('networkidle')
                    r['checkPersist'] = pg.evaluate("document.getElementById('ck-flight-track').checked")
                if vn == 'mobile':
                    pg.click('#more-btn'); r['sheet'] = pg.evaluate("(()=>{const s=document.querySelector('#more-sheet');const r=s.querySelector('.panel').getBoundingClientRect();return s.hidden?'hidden':Math.round(r.height)})()")
                pg.close()
                problems = []
                if r['scrollW'] > r['vw']: problems.append(f"橫向溢出 scrollW={r['scrollW']}")
                if r['overflow']: problems.append(f"元素超出畫面 {r['overflow']}")
                if r['small']: problems.append(f"觸控目標 <44px {r['small']}")
                if r['inputs']: problems.append(f"輸入框字小於 16px {r['inputs']}")
                if r['errors']: problems.append(f"JS 錯誤 {r['errors'][:3]}")
                if vn == 'mobile' and r['tabbar'] == 'none': problems.append('手機沒有底部分頁列')
                if vn == 'desktop' and r['tabbar'] != 'none': problems.append('桌機不該顯示底部分頁列')
                if any('BLOCKED' in x for x in r.get('tabHits', [])): problems.append(f"分頁列被遮住 {r['tabHits']}")
                if 'map' in r and (r['map']['h'] < 200 or not r['map']['leaflet'] or r['map']['markers'] == 0): problems.append(f"地圖異常 {r['map']}")
                if 'BLOCKED' in str(r.get('firstBtn', '')): problems.append(f"卡片按鈕被遮 {r['firstBtn']}")
                if r.get('deepOpen') == 0: problems.append('收合區塊點了沒有展開')
                if p == 'itinerary' and not str(r.get('folds', '')).startswith('open'): problems.append(f"行程的順路可加沒有展開 {r.get('folds')}")
                if p in ('book', 'parks', 'stay') and not r.get('bk'): problems.append('需預約的卡片沒有訂票按鈕')
                if vn == 'mobile' and r['barH'] > 844 * 0.4: problems.append(f"篩選列太高 {r['barH']}px")
                if p == 'prepare' and not r.get('checkPersist'): problems.append('勾選沒有保存')
                bad += len(problems)
                report[f'{vn}/{p}'] = {k: v for k, v in r.items() if k not in ('overflow', 'small', 'inputs')} | ({'PROBLEMS': problems} if problems else {})
                print(('❌ ' if problems else '✅ ') + f'{vn:7} {p:9}', json.dumps({k: r[k] for k in r if k in ('cards', 'barH', 'map', 'firstBtn', 'zoneFilter', 'deepOpen', 'bk', 'folds', 'days', 'play', 'sheet', 'checkPersist')}, ensure_ascii=False))
                for x in problems: print('     -', x)
            ctx.close()
        b.close()
    json.dump(report, open(os.path.join(ROOT, 'research', 'measure.json'), 'w'), ensure_ascii=False, indent=1)
    print('problems:', bad); sys.exit(1 if bad else 0)

if __name__ == '__main__': main()
