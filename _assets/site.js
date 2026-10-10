/* 東京 2027 共用腳本：不需框架，資料由 _build.py 注入 <script type="application/json"> */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// 只允許 <b>：先跳脫，再把 &lt;b&gt; 還原
const rich=s=>esc(s).replace(/&lt;(\/?)b&gt;/g,'<$1b>');
const J=id=>{const el=document.getElementById(id);return el?JSON.parse(el.textContent):null};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

const P=J('data-places'), F=J('data-facts');
const ZC={z1:'var(--z1)',z2:'var(--z2)',z3:'var(--z3)',z4:'var(--z4)',z5:'var(--z5)'};
const ZHEX={z1:'#4f7a3a',z2:'#c93f74',z3:'#2f6aa3',z4:'#a35b28',z5:'#6b4c9a'};
const FLAG={star:['b-star','★ 推薦'],ok:['b-ok','已查證'],warn:['b-warn','⚠️ 注意'],info:['b-info','ℹ️ 資訊'],closed:['b-closed','✖ 休館／歇業'],unverified:['b-unverified','？ 未完全查證']};
const TAGZH={shrine:'神社',temple:'寺廟',alley:'巷弄',shotengai:'商店街',izakaya:'居酒屋',yokocho:'橫丁',kissaten:'喫茶店',cafe:'咖啡',muji:'無印良品',select:'選物',zakka:'雜貨',bookstore:'書店',museum:'美術館・博物館',exhibition:'展覽',garden:'庭園',view:'展望',sakura:'櫻花',history:'歷史',stationery:'文具',tachinomi:'立飲',budget:'平價','budget-hotel':'平價飯店','business-hotel':'商務飯店',retro:'復古',sento:'錢湯',park:'公園','theme-park':'主題樂園',disney:'迪士尼','harry-potter':'哈利波特',tea:'茶',sweets:'甜點',craft:'工藝',roaster:'自家烘焙',goshuin:'御朱印','cash-only':'只收現金',kitchenware:'廚具',oden:'關東煮',standing:'站著喝',motsuyaki:'烤內臟'};
const fxRate=()=>{const v=parseFloat(store.get('fx',null));return isFinite(v)&&v>0?v:(P&&P.meta.fx.jpy_twd)||0.21};
// 價格裡的日圓自動換算台幣（顯示為約略值）
function withTwd(s){
  if(!s)return '';
  return esc(s).replace(/(¥\s?([\d,]+)|([\d,]{3,})\s?(円|日圓|日元))/g,(m,_a,n1,n2)=>{
    const n=parseInt((n1||n2).replace(/,/g,''),10); if(!isFinite(n)||n<100)return m;
    return m+'<span class="small num">（≈NT$'+Math.round(n*fxRate()).toLocaleString()+'）</span>';
  });
}
const gmaps=p=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.q||p.name)+(p.gm&&p.gm.pid?'&query_place_id='+encodeURIComponent(p.gm.pid):'');
const PH=J('data-photos')||{};
// 類別：地圖 pin 顏色與 emoji（樂園另外一類）
const CATS={sight:['⛩️','景點・神社','#c4432c'],art:['🎨','美術館・展覽','#6b4c9a'],park:['🌳','公園','#4f7a3a'],theme:['🏰','樂園','#b07d12'],eat:['🍶','居酒屋・吃','#e0761c'],cafe:['☕','咖啡・喫茶','#7a4e2d'],shop:['🛍️','購物','#2f6aa3'],stay:['🛏️','住宿','#1f3a5f']};
const catOf=p=>p.theme?'theme':p.cat;
const pinSvg=(c,em,approx)=>'<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 2 23.5 2 14.5a13 13 0 0 1 26 0C28 23.5 15 39 15 39z" fill="'+c+'" stroke="#fff" stroke-width="2"'+(approx?' stroke-dasharray="3 2"':'')+'/><circle cx="15" cy="14.5" r="9" fill="#fff"/><text x="15" y="19" text-anchor="middle" font-size="12">'+em+'</text></svg>';
function ratingRows(p){
  let h='';
  if(p.gm&&p.gm.r)h+='<div class="rate"><b class="num">'+esc(p.gm.r.toFixed(1))+'</b><span class="stars" style="--p:'+(p.gm.r/5*100).toFixed(1)+'%" aria-hidden="true">★★★★★</span><span class="num cnt">('+esc(p.gm.n)+')</span><span class="src g">Google</span><span class="asof">'+esc(p.gm.asof.replace('-','/'))+' 查</span></div>';
  if(p.g&&p.g.r)h+='<div class="rate"><b class="num">'+esc(p.g.r)+'</b><span class="src t">'+esc(p.g.src)+'</span><span class="asof">'+esc((p.g.asof||'').replace('-','/'))+' 查</span>'+(p.g.src==='Tabelog'?'<span class="small">（Tabelog 3.5 以上就算高分）</span>':'')+'</div>';
  return h;
}
function photo(p){
  const ph=PH[p.id],c=CATS[catOf(p)]||CATS.sight;
  if(!ph)return '<div class="ph none" style="--cc:'+c[2]+'"><span aria-hidden="true">'+c[0]+'</span><small>這裡還沒有可用授權的照片</small></div>';
  return '<figure class="ph"><img src="'+esc(ph.u)+'" width="'+ph.w+'" height="'+ph.h+'" loading="lazy" decoding="async" alt="'+esc(ph.cap||p.zh)+'" onerror="this.closest(\'figure\').classList.add(\'err\')">'+
    '<figcaption>'+(ph.cap?esc(ph.cap)+' · ':'')+'📷 <a href="'+esc(ph.pg)+'" target="_blank" rel="noopener">'+esc(ph.art)+'</a> · '+esc(ph.lic)+'</figcaption></figure>';
}
const dayLabel=d=>{if(!P||!d)return '';const x=P.meta.days.find(v=>v.d===d);return x?x.date.slice(5).replace('-','/')+'（'+x.wd+'）':''};

/* ---------- 導覽列：橫向捲動箭頭與邊緣淡出 ---------- */
function initScrollers(){
  $$('.scroller').forEach(sc=>{
    if(sc.dataset.init)return;sc.dataset.init=1;
    const tr=$('.track',sc),L=$('.arrow.l',sc),R=$('.arrow.r',sc);
    const upd=()=>{const max=tr.scrollWidth-tr.clientWidth-2;const atL=tr.scrollLeft<=2,atR=tr.scrollLeft>=max;
      sc.classList.toggle('fade-l',!atL);sc.classList.toggle('fade-r',!atR);L.disabled=atL;R.disabled=atR;};
    L.onclick=()=>tr.scrollBy({left:-tr.clientWidth*.7,behavior:'smooth'});
    R.onclick=()=>tr.scrollBy({left:tr.clientWidth*.7,behavior:'smooth'});
    tr.addEventListener('scroll',upd,{passive:true});addEventListener('resize',upd);
    const cur=$('[aria-current=page]',tr);if(cur)tr.scrollLeft=Math.max(0,cur.offsetLeft-tr.clientWidth/2+cur.offsetWidth/2);
    upd();
  });
}
/* ---------- 更多（手機底部選單） ---------- */
function initSheet(){
  const b=$('#more-btn'),s=$('#more-sheet');if(!b||!s)return;
  const open=v=>{s.hidden=!v;b.setAttribute('aria-expanded',v);if(v)$('a',s).focus();};
  b.onclick=()=>open(true);$('.close',s).onclick=()=>open(false);
  s.addEventListener('click',e=>{if(e.target===s)open(false)});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!s.hidden)open(false)});
}

/* ---------- 地點卡片 ---------- */
function card(p){
  const f=FLAG[p.flag]||FLAG.info, z=p.zone, cat=(P.meta.cats[p.cat]||p.cat);
  const meta=[];
  if(p.station)meta.push('<div>🚉 '+esc(p.station)+'</div>');
  if(p.from_base)meta.push('<div>🏠 從戶越：'+esc(p.from_base)+'</div>');
  if(p.hours)meta.push('<div><b>營業</b> '+esc(p.hours)+'</div>');
  if(p.closed)meta.push('<div><b>公休</b> '+esc(p.closed)+'</div>');
  if(p.price)meta.push('<div><b>價格</b> '+withTwd(p.price)+'</div>');
  const hasDeep=p.deep&&(p.deep.lead||(p.deep.paras||[]).length);
  const c=CATS[catOf(p)]||CATS.sight;
  return '<article class="pc'+(p.flag==='closed'?' closed':'')+'" id="p-'+esc(p.id)+'" style="--zc:'+ZC[z]+';--cc:'+c[2]+'" data-id="'+esc(p.id)+'">'+
   photo(p)+'<div class="in">'+
   '<div class="hdr"><span class="cdot" aria-hidden="true"></span><div class="t"><h3>'+esc(p.zh||p.name)+'</h3><div class="jp">'+esc(p.name)+'</div></div><span class="badge '+f[0]+'">'+f[1]+'</span></div>'+
   '<div class="tags" style="gap:6px"><span class="badge b-cat2">'+c[0]+' '+esc(c[1])+'</span><span class="badge b-zone">'+esc(P.meta.zones[z]||z)+'</span><span class="badge b-cat">'+esc(p.town||'')+'</span>'+(p.day?'<span class="badge b-day">🗓 '+dayLabel(p.day)+'</span>':'')+(p.bookable?'<span class="badge b-info">🎟 需預約／購票</span>':'')+'</div>'+
   ratingRows(p)+
   (p.warn?'<div class="warnline">'+p.warn.split('\n').map(rich).join('<br>')+'</div>':'')+
   '<p class="note">'+rich(p.note||'')+'</p>'+
   '<div class="meta">'+meta.join('')+'</div>'+
   (p.bk?'<div class="meta"><div><b>預約</b> '+esc(p.bk)+'</div></div>':'')+
   ((p.tags||[]).length?'<div class="tags">'+p.tags.filter(t=>TAGZH[t]).map(t=>'<span>'+TAGZH[t]+'</span>').join('')+'</div>':'')+
   (p.geo_approx?'<div class="approx">📍 地圖上是大約位置（'+esc(p.geo_src||'')+'），導航請用 Google 地圖按鈕</div>':'')+
   '<div class="acts">'+
     '<button class="ab ab-map" type="button" data-act="locate">🗺️ 在地圖上</button>'+
     '<a class="ab ab-gm" href="'+gmaps(p)+'" target="_blank" rel="noopener">📍 Google Maps</a>'+
     (p.url?'<a class="ab ab-web" href="'+esc(p.url)+'" target="_blank" rel="noopener">🏛️ 官網</a>':'')+
     (hasDeep?'<button class="ab ab-deep" type="button" data-act="deep" aria-expanded="false">📖 深入了解 ▾</button>':'')+
     ((p.buy||[]).length?'<button class="ab ab-buy" type="button" data-act="buy" aria-expanded="false">🛒 購物清單 ▾</button>':'')+
     ((p.src||[]).length?'<button class="ab ab-src" type="button" data-act="src" aria-expanded="false">📚 來源（'+p.src.length+'）▾</button>':'')+
   '</div>'+
   (hasDeep?'<div class="deep" data-part="deep" hidden>'+(p.deep.lead?'<p><b>'+esc(p.deep.lead)+'</b></p>':'')+(p.deep.paras||[]).map(x=>'<p>'+rich(x)+'</p>').join('')+((p.deep.tips||[]).length?'<ul>'+p.deep.tips.map(x=>'<li>'+rich(x)+'</li>').join('')+'</ul>':'')+'</div>':'')+
   ((p.buy||[]).length?'<div class="deep" data-part="buy" hidden><ul>'+p.buy.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'')+
   ((p.src||[]).length?'<div class="deep srcs" data-part="src" hidden><ol>'+p.src.map(u=>'<li><a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(u)+'</a></li>').join('')+'</ol></div>':'')+
   '</div></article>';
}

/* ---------- 地點瀏覽器（篩選＋清單＋地圖） ---------- */
function Browser(root){
  const cats=(root.dataset.cat||'').split(',').filter(Boolean), ids=(root.dataset.ids||'').split(',').filter(Boolean);
  const theme=root.dataset.theme, onlyBook=root.dataset.bookable==='1';
  let all=P.places.filter(p=>(!cats.length||cats.includes(p.cat))&&(!ids.length||ids.includes(p.id))&&(theme==null||(!!p.theme)===(theme==='1'))&&(!onlyBook||p.bookable));
  // 排序：交通方便的板塊在前（z1→z5），同板塊內 推薦 > 已查證 > 其他 > 警告 > 歇業
  const fo={star:0,ok:1,info:2,unverified:3,warn:4,closed:5};
  all.sort((a,b)=>a.zone.localeCompare(b.zone)||(fo[a.flag]-fo[b.flag])||(a.zh||'').localeCompare(b.zh||'','zh-Hant'));
  const filters=(root.dataset.filters||'day,zone,tag,search').split(',');
  const st={day:null,zone:new Set(),cat:new Set(),tag:null,q:'',warn:false,sort:'zone',view:root.dataset.view||'list',shown:24};
  const qs=new URLSearchParams(location.search);
  if(qs.get('day'))st.day=+qs.get('day');
  const tagCount={};all.forEach(p=>(p.tags||[]).forEach(t=>{if(TAGZH[t])tagCount[t]=(tagCount[t]||0)+1}));
  const tags=Object.keys(tagCount).filter(t=>tagCount[t]>=2).sort((a,b)=>tagCount[b]-tagCount[a]).slice(0,14);
  const zones=[...new Set(all.map(p=>p.zone))].sort();
  const days=P.meta.days.filter(d=>all.some(p=>p.day===d.d));
  const catList=Object.keys(CATS).filter(k=>all.some(p=>catOf(p)===k));
  const catChip=k=>'<button type="button" class="fchip cat" style="--c:'+CATS[k][2]+'" data-cat="'+k+'" aria-pressed="false"><span class="pin" aria-hidden="true"></span>'+CATS[k][0]+' '+esc(CATS[k][1])+'</button>';
  let h='<div class="tk-bar">';
  h+='<div class="tk-row">'+(filters.includes('search')?'<input class="tk-search" type="search" placeholder="搜尋名稱、區域、車站…" aria-label="搜尋地點">':'')+
     '<div class="seg" role="group" aria-label="檢視方式"><button type="button" data-view="list">清單</button><button type="button" data-view="map">地圖</button></div></div>';
  const row=(lbl,inner)=>'<div class="scroller tk-scroll"><button class="arrow l" type="button" aria-label="往左捲" style="color:var(--sumi)">‹</button><div class="track tk-row scroll"><span class="lbl">'+lbl+'</span>'+inner+'</div><button class="arrow r" type="button" aria-label="往右捲" style="color:var(--sumi)">›</button></div>';
  if(catList.length>1)h+=row('類別',catList.map(catChip).join(''));
  if(filters.includes('zone')&&zones.length>1)h+=row('板塊',zones.map(z=>'<button type="button" class="fchip zone" style="--c:'+ZHEX[z]+'" data-zone="'+z+'" aria-pressed="false"><span class="dot"></span>'+esc(P.meta.zones[z])+'</button>').join(''));
  if(filters.includes('day')&&days.length)h+=row('日期',['<button type="button" class="fchip" data-day="" aria-pressed="true">全部</button>'].concat(days.map(d=>'<button type="button" class="fchip" data-day="'+d.d+'" aria-pressed="false">'+d.date.slice(5).replace('-','/')+' '+esc(d.title)+'</button>')).join(''));
  if(filters.includes('tag')&&tags.length>1)h+=row('類型','<button type="button" class="fchip" data-tag="" aria-pressed="true">全部</button>'+tags.map(t=>'<button type="button" class="fchip" data-tag="'+t+'" aria-pressed="false">'+TAGZH[t]+'</button>').join('')+'<button type="button" class="fchip" data-warn="1" aria-pressed="false">⚠️ 只看有警告的</button>');
  h+='</div><div class="tk-countrow"><div class="tk-count" aria-live="polite"></div>'+(all.some(p=>p.gm)?'<div class="seg sort" role="group" aria-label="排序"><button type="button" data-sort="zone" aria-pressed="true">🚃 交通方便</button><button type="button" data-sort="rate" aria-pressed="false">⭐ Google 星等</button></div>':'')+'</div><div class="tk-body"><div class="tk-listwrap"><div class="plist"></div><div class="more"><button type="button" class="btn ghost" data-more>顯示更多</button></div></div><div class="tk-map" hidden><div class="nomap">地圖載入中…</div></div></div>';
  root.innerHTML=h;
  const list=$('.plist',root),mapEl=$('.tk-map',root),cnt=$('.tk-count',root),moreB=$('[data-more]',root),body=$('.tk-body',root),lw=$('.tk-listwrap',root);
  let map=null,layer=null,markers={};
  const match=p=>{
    if(st.day&&p.day!==st.day)return false;
    if(st.zone.size&&!st.zone.has(p.zone))return false;
    if(st.cat.size&&!st.cat.has(catOf(p)))return false;
    if(st.tag&&!(p.tags||[]).includes(st.tag))return false;
    if(st.warn&&!(p.warn||p.flag==='warn'||p.flag==='closed'))return false;
    if(st.q){const s=(p.name+p.zh+p.town+(p.station||'')+(p.tags||[]).map(t=>TAGZH[t]||t).join('')+(p.note||'')).toLowerCase();if(!s.includes(st.q.toLowerCase()))return false;}
    return true;
  };
  let cur=[];
  function render(){
    cur=all.filter(match);
    if(st.sort==='rate')cur=cur.slice().sort((a,b)=>((b.gm&&b.gm.r)||0)-((a.gm&&a.gm.r)||0)||((b.gm&&b.gm.c)||0)-((a.gm&&a.gm.c)||0));
    list.innerHTML=cur.slice(0,st.shown).map(card).join('')||'<p class="small">沒有符合條件的地點，請放寬篩選。</p>';
    moreB.parentNode.hidden=cur.length<=st.shown;
    moreB.textContent='顯示更多（還有 '+(cur.length-st.shown)+' 個）';
    cnt.textContent='共 '+cur.length+' 個地點'+(cur.length!==all.length?'（全部 '+all.length+' 個）':'')+(st.sort==='rate'?'（沒有 Google 星等的排最後）':'　交通方便的板塊排前面');
    if(map)drawMarkers();
  }
  function setView(v){
    st.view=v;$$('[data-view]',root).forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===v));
    const wide=matchMedia('(min-width:1100px)').matches;
    if(wide&&root.dataset.split!=='0'){body.classList.add('split');lw.hidden=false;mapEl.hidden=false;}
    else{body.classList.remove('split');lw.hidden=v==='map';mapEl.hidden=v!=='map';}
    if(!mapEl.hidden)ensureMap();
  }
  function ensureMap(){
    if(map){setTimeout(()=>map.invalidateSize(),50);return;}
    if(!window.L){$('.nomap',mapEl).textContent='地圖需要網路連線（Leaflet 與 OpenStreetMap 圖磚未載入）。清單與 Google 地圖按鈕仍可使用。';return;}
    $('.nomap',mapEl).remove();
    map=L.map(mapEl,{scrollWheelZoom:false,tap:true}).setView([35.68,139.74],11);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
    // 戶越據點（只標車站）
    L.circleMarker([35.6147,139.7164],{radius:9,color:'#fff',weight:3,fillColor:'#c4432c',fillOpacity:1}).addTo(map).bindTooltip('戶越站（據點）',{permanent:false});
    layer=L.layerGroup().addTo(map);
    if(catList.length>1){
      const lg=L.control({position:'bottomleft'});
      lg.onAdd=()=>{const d=L.DomUtil.create('div','maplegend');
        d.innerHTML='<b>圖例・點一下篩選</b>'+catList.map(k=>'<button type="button" data-lcat="'+k+'" aria-pressed="'+st.cat.has(k)+'" style="--c:'+CATS[k][2]+'"><span class="pin" aria-hidden="true"></span>'+CATS[k][0]+' '+esc(CATS[k][1])+'</button>').join('');
        L.DomEvent.disableClickPropagation(d);L.DomEvent.disableScrollPropagation(d);
        d.addEventListener('click',e=>{const b=e.target.closest('[data-lcat]');if(b)toggleCat(b.dataset.lcat);});
        return d;};
      lg.addTo(map);
    }
    drawMarkers(true);
  }
  function toggleCat(k){
    st.cat.has(k)?st.cat.delete(k):st.cat.add(k);
    $$('[data-cat="'+k+'"],[data-lcat="'+k+'"]',root).forEach(b=>b.setAttribute('aria-pressed',st.cat.has(k)));
    st.shown=24;render();if(map)drawMarkers(true);
  }
  function drawMarkers(fit){
    layer.clearLayers();markers={};
    cur.forEach(p=>{
      const c=CATS[catOf(p)]||CATS.sight,ph=PH[p.id];
      const m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'tkpin'+(p.geo_approx?' approx':''),html:pinSvg(c[2],c[0],p.geo_approx),iconSize:[30,40],iconAnchor:[15,39],popupAnchor:[0,-34]}),title:p.zh,riseOnHover:true});
      m.bindPopup((ph?'<img class="popimg" src="'+esc(ph.u)+'" alt="" loading="lazy">':'')+'<b>'+c[0]+' '+esc(p.zh)+'</b><br><span class="small">'+esc(p.name)+'</span>'+(p.gm?'<div class="small">⭐ '+p.gm.r.toFixed(1)+'（'+esc(p.gm.n)+'）Google</div>':'')+(p.warn?'<div style="color:#a8381b;margin-top:4px">'+esc(p.warn)+'</div>':'')+(p.geo_approx?'<div class="small">📍 大約位置</div>':'')+
        '<div><a class="pbtn" href="#p-'+esc(p.id)+'" data-goto="'+esc(p.id)+'">📄 看卡片</a><a class="pbtn gm" href="'+gmaps(p)+'" target="_blank" rel="noopener">📍 Google Maps</a></div>');
      // Leaflet 的 popup 會擋住點擊冒泡，所以「看卡片」要自己綁
      m.on('popupopen',ev=>{const a=ev.popup.getElement().querySelector('[data-goto]');if(a)a.onclick=e2=>{e2.preventDefault();map.closePopup();gotoCard(p.id);};});
      m.addTo(layer);markers[p.id]=m;
    });
    if(fit&&cur.length){try{map.fitBounds(L.latLngBounds(cur.map(p=>[p.lat,p.lng])).pad(.08),{maxZoom:15})}catch(e){}}
  }
  function gotoCard(id){
    const i=cur.findIndex(p=>p.id===id);if(i<0)return;
    if(i>=st.shown){st.shown=i+1;render();}
    if(!body.classList.contains('split'))setView('list');
    const el=document.getElementById('p-'+id);if(!el)return;
    el.scrollIntoView({behavior:'smooth',block:'start'});$$('.pc.hl',root).forEach(x=>x.classList.remove('hl'));el.classList.add('hl');
  }
  root.addEventListener('click',e=>{
    const t=e.target.closest('button,a');if(!t||!root.contains(t))return;
    if(t.dataset.view){setView(t.dataset.view);return;}
    if(t.dataset.cat){toggleCat(t.dataset.cat);return;}
    if(t.dataset.sort){st.sort=t.dataset.sort;$$('[data-sort]',root).forEach(b=>b.setAttribute('aria-pressed',b===t));st.shown=24;render();return;}
    if(t.dataset.zone){const z=t.dataset.zone;st.zone.has(z)?st.zone.delete(z):st.zone.add(z);t.setAttribute('aria-pressed',st.zone.has(z));st.shown=24;render();if(map)drawMarkers(true);return;}
    if(t.dataset.day!=null){st.day=t.dataset.day?+t.dataset.day:null;$$('[data-day]',root).forEach(b=>b.setAttribute('aria-pressed',b===t));st.shown=24;render();if(map)drawMarkers(true);return;}
    if(t.dataset.tag!=null){st.tag=t.dataset.tag||null;$$('[data-tag]',root).forEach(b=>b.setAttribute('aria-pressed',b===t));st.shown=24;render();if(map)drawMarkers(true);return;}
    if(t.dataset.warn){st.warn=!st.warn;t.setAttribute('aria-pressed',st.warn);st.shown=24;render();return;}
    if(t.hasAttribute('data-more')){st.shown+=24;render();return;}
    if(t.dataset.goto){e.preventDefault();map&&map.closePopup();gotoCard(t.dataset.goto);return;}
    const c=t.closest('.pc');if(!c)return;
    const act=t.dataset.act;
    if(act==='locate'){setView('map');const m=markers[c.dataset.id];if(m){map.setView(m.getLatLng(),15);m.openPopup();if(!body.classList.contains('split'))mapEl.scrollIntoView({behavior:'smooth',block:'center'});}return;}
    if(act){const part=$('[data-part='+act+']',c);const open=part.hidden;part.hidden=!open;t.setAttribute('aria-expanded',open);t.textContent=t.textContent.replace(open?'▾':'▴',open?'▴':'▾');}
  });
  const si=$('.tk-search',root);if(si){let tm;si.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{st.q=si.value.trim();st.shown=24;render();},150)});}
  if(st.day)$$('[data-day]',root).forEach(b=>b.setAttribute('aria-pressed',(+b.dataset.day||null)===st.day));
  render();setView(st.view);
  let wasWide=matchMedia('(min-width:1100px)').matches;
  addEventListener('resize',()=>{const w=matchMedia('(min-width:1100px)').matches;if(w!==wasWide){wasWide=w;setView(st.view);}});
  // 首頁網址 #p-id 直接跳到卡片
  if(location.hash.startsWith('#p-')){const id=location.hash.slice(3);if(all.some(p=>p.id===id)){st.day=null;render();setTimeout(()=>gotoCard(id),60);}}
}

/* ---------- 行程頁 ---------- */
function renderItinerary(root){
  const byId=Object.fromEntries(P.places.map(p=>[p.id,p]));
  const pageOf=p=>p.theme?'parks.html':({sight:'sights.html',art:'sights.html',park:'sights.html',eat:'eat.html',cafe:'eat.html',shop:'shop.html',stay:'stay.html'}[p.cat]||'index.html');
  const stop=id=>{const p=byId[id];if(!p)return '';return '<li><a href="'+pageOf(p)+'#p-'+esc(id)+'" style="--zc:'+ZC[p.zone]+'"><span class="dot"></span><span>'+esc(p.zh)+'</span>'+(p.warn||p.flag==='warn'||p.flag==='closed'?'<span class="w">⚠️ 看警告</span>':'')+'</a></li>';};
  let h='<nav class="daynav" aria-label="跳到某天">'+P.meta.days.map(d=>'<a class="pill" href="#day'+d.d+'">'+d.date.slice(5).replace('-','/')+'（'+d.wd+'）</a>').join('')+'</nav>';
  P.routes.forEach(r=>{
    const d=P.meta.days.find(x=>x.d===r.day);
    h+='<section class="day" id="day'+r.day+'"><h2 class="dayhd"><span class="date">'+d.date.slice(5).replace('-','/')+'（'+d.wd+'）</span><span>'+esc(d.title)+'</span></h2>'+
      '<p class="lead">'+rich(r.note)+'</p><div class="opts">'+
      r.options.map(o=>'<div class="opt'+(o.rec?' rec':'')+'"><h3><span class="lab">'+esc(o.label)+'</span>'+esc(o.name)+(o.rec?'<span class="badge b-ok">建議</span>':'')+'</h3>'+
        '<div class="small" style="margin:4px 0">'+esc(o.meta)+'</div><p style="margin:.4rem 0">'+rich(o.desc)+'</p>'+
        '<div class="small"><b>主要停留</b></div><ul class="stops">'+o.main.map(stop).join('')+'</ul>'+
        (o.alt.length?'<details style="margin-top:8px"><summary class="pill" style="display:inline-flex">順路可加（'+o.alt.length+'）</summary><ul class="stops">'+o.alt.map(stop).join('')+'</ul></details>':'')+
      '</div>').join('')+'</div>'+
      '<p><a class="btn ghost" href="index.html?day='+r.day+'#map">在地圖上看這天的地點</a></p></section>';
  });
  root.innerHTML=h;
}

/* ---------- 查不到／推翻的說法 ---------- */
function renderClaims(root){
  if(!F)return;const rs=(root.dataset.r||'').split(',');
  const u=F.unverified.filter(x=>rs.includes(x.r)),o=F.overturned.filter(x=>rs.includes(x.r));
  root.innerHTML='<h2>查不到、不敢寫的說法</h2><p class="lead">研究時看到但查不到第二個可靠來源、或來源互相矛盾的說法。這些沒有寫進上面的卡片。</p>'+
   '<details><summary>查證後推翻的常見說法（'+o.length+'）</summary><ul>'+o.map(x=>'<li><b>常見說法：</b>'+esc(x.claim)+'<br><b>實際情況：</b>'+esc(x.truth)+((x.src||[]).length?' <span class="small">（'+x.src.map((s,i)=>'<a href="'+esc(s)+'" target="_blank" rel="noopener">來源'+(i+1)+'</a>').join('、')+'）</span>':'')+'</li>').join('')+'</ul></details>'+
   '<details><summary>查不到、沒寫進去的說法（'+u.length+'）</summary><ul>'+u.map(x=>'<li>'+esc(x.claim)+'<br><span class="small">原因：'+esc(x.why)+'</span></li>').join('')+'</ul></details>';
}
/* ---------- 已查證事實 ---------- */
function renderFacts(root){
  if(!F)return;const ks=(root.dataset.keys||'').split('|').filter(Boolean),rs=(root.dataset.r||'').split(',').filter(Boolean);
  const fs=F.facts.filter(x=>ks.length?ks.includes(x.k):rs.includes(x.r));
  root.innerHTML=fs.map(x=>'<div class="callout info"><h3>'+esc(x.k)+'</h3><p>'+withTwd(x.v)+'</p><div class="small">來源：'+(x.src||[]).map((s,i)=>'<a href="'+esc(s)+'" target="_blank" rel="noopener">'+(i+1)+'</a>').join('、')+'</div></div>').join('');
}

/* ---------- 文化 ---------- */
function renderCulture(root){
  const C=J('data-culture');if(!C)return;const nm={etiquette:'禮儀',shrine:'神社・寺廟',food:'吃喝',transport:'交通',money:'錢與退稅',history:'節日與由來'};
  root.innerHTML=C.meta.secs.filter(s=>C.cards.some(c=>c.cat===s)).map(s=>'<h2>'+nm[s]+'</h2><div class="grid">'+C.cards.filter(c=>c.cat===s).map(c=>
    '<article class="card"><h3>'+esc(c.title)+'</h3><p class="small" style="margin:.3rem 0"><b>'+esc(c.lead)+'</b></p>'+c.paras.map(p=>'<p style="margin:.4rem 0">'+rich(p)+'</p>').join('')+
    (c.where?'<div class="small">📍 '+esc(c.where)+'</div>':'')+((c.src||[]).length?'<div class="small">來源：'+c.src.map((u,i)=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+(i+1)+'</a>').join('、')+'</div>':'<div class="small">沒有官方來源，屬一般經驗，內文已用保留語氣。</div>')+'</article>').join('')+'</div>').join('');
}
/* ---------- 會話 ---------- */
function renderTalk(root){
  const T=J('data-talk');if(!T)return;const nm={basic:'基本',izakaya:'居酒屋',shop:'購物',transit:'交通',shrine:'神社',hotel:'飯店',park:'樂園',emergency:'緊急'};
  const can='speechSynthesis' in window;
  let h=(can?'':'<div class="callout warn"><p>這個瀏覽器不支援語音朗讀，播放按鈕已隱藏。</p></div>')+'<div class="tk-row"><input class="tk-search" type="search" placeholder="搜尋中文或日文…" aria-label="搜尋會話"></div>';
  h+='<div class="daynav">'+T.meta.secs.map(s=>'<a class="pill" href="#sec-'+s+'">'+nm[s]+'</a>').join('')+'</div>';
  h+=T.meta.secs.map(s=>'<section id="sec-'+s+'" class="day"><h2>'+nm[s]+'</h2><div class="grid">'+T.entries.filter(e=>e.sec===s).map(e=>
    '<div class="card phr" data-s="'+esc((e.t+e.zh+e.say+e.roma).toLowerCase())+'">'+(can?'<button class="play" type="button" aria-label="播放：'+esc(e.zh)+'" data-say="'+esc(e.t)+'">▶</button>':'')+
    '<div class="t"><div class="ja" lang="ja">'+esc(e.t)+'</div><div class="say">'+esc(e.say)+' · <i>'+esc(e.roma)+'</i>'+(e.zhsound?' · 諧音：'+esc(e.zhsound):'')+'</div><div><b>'+esc(e.zh)+'</b></div><div class="small">'+esc(e.when||'')+(e.note?'　'+esc(e.note):'')+'</div></div></div>').join('')+'</div></section>').join('');
  root.innerHTML=h;
  const si=$('.tk-search',root);si.addEventListener('input',()=>{const q=si.value.trim().toLowerCase();$$('.phr',root).forEach(c=>c.hidden=q&&!c.dataset.s.includes(q)&&!c.textContent.toLowerCase().includes(q))});
  root.addEventListener('click',e=>{const b=e.target.closest('.play');if(!b)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(b.dataset.say);u.lang='ja-JP';u.rate=.85;
    const v=speechSynthesis.getVoices().find(v=>/^ja/i.test(v.lang));if(v)u.voice=v;$$('.play.on',root).forEach(x=>x.classList.remove('on'));b.classList.add('on');u.onend=u.onerror=()=>b.classList.remove('on');speechSynthesis.speak(u);});
}
/* ---------- App ---------- */
function renderApps(root){
  const A=J('data-apps');if(!A)return;const col=['#1f3a5f','#c4432c','#55753a','#9c7a2c','#6b4c9a','#2f6aa3','#a35b28','#c93f74'];
  const one=(a,i)=>'<article class="card"><div style="display:flex;gap:12px;align-items:flex-start"><div class="apptile" style="background:'+col[i%col.length]+'" aria-hidden="true">'+esc(a.name.replace(/^[^A-Za-z぀-ヿ一-鿿]+/,'').charAt(0))+'</div><div style="min-width:0"><h3>'+esc(a.name)+'</h3><div class="small">'+esc(a.dev||'')+'</div>'+(a.must?'<span class="badge b-star">出發前裝好</span>':'')+'</div></div>'+
    '<p style="margin:.5rem 0"><b>做什麼：</b>'+esc(a.what)+'</p><p style="margin:.3rem 0"><b>什麼時候用：</b>'+esc(a.when)+'</p>'+(a.gotchas?'<div class="warnline">⚠️ '+esc(a.gotchas)+'</div>':'')+
    (a.offline?'<p class="small" style="margin:.4rem 0">離線：'+esc(a.offline)+'</p>':'')+(a.unknown?'<p class="small">查不到：'+esc(a.unknown)+'</p>':'')+
    '<div class="acts">'+(a.ios_url?'<a class="pill" href="'+esc(a.ios_url)+'" target="_blank" rel="noopener">iPhone（App Store）↗</a>':'<span class="small">iPhone 連結未確認，請在 App Store 搜尋名稱</span>')+(a.android_url?'<a class="pill" href="'+esc(a.android_url)+'" target="_blank" rel="noopener">Android（Google Play）↗</a>':'')+'</div></article>';
  const must=A.apps.filter(a=>a.must),opt=A.apps.filter(a=>!a.must);
  root.innerHTML='<h2>出發前一定要裝（'+must.length+'）</h2><div class="grid">'+must.map(one).join('')+'</div><h2>看需要再裝（'+opt.length+'）</h2><div class="grid">'+opt.map((a,i)=>one(a,i+3)).join('')+'</div>';
}
/* ---------- 行前清單（存在這台裝置） ---------- */
function initChecklist(root){
  const k='tk-check',s=store.get(k,{});
  $$('input[type=checkbox]',root).forEach(cb=>{cb.checked=!!s[cb.id];cb.addEventListener('change',()=>{s[cb.id]=cb.checked;store.set(k,s);upd()})});
  const out=$('.ck-count',root);function upd(){if(out){const a=$$('input[type=checkbox]',root);out.textContent='已完成 '+a.filter(x=>x.checked).length+' / '+a.length;}}upd();
}
function initFx(root){
  const i=$('input',root);i.value=fxRate();i.addEventListener('change',()=>{const v=parseFloat(i.value);if(v>0){store.set('fx',v);$('.fx-ok',root).textContent='已儲存，重新整理頁面後所有價格會用新匯率換算。';}});
}

document.addEventListener('DOMContentLoaded',()=>{
  initSheet();
  $$('.tk-places').forEach(Browser);
  $$('.tk-itin').forEach(renderItinerary);
  $$('.tk-claims').forEach(renderClaims);
  $$('.tk-facts').forEach(renderFacts);
  $$('.tk-culture').forEach(renderCulture);
  $$('.tk-talk').forEach(renderTalk);
  $$('.tk-apps').forEach(renderApps);
  $$('.tk-check').forEach(initChecklist);
  $$('.tk-fx').forEach(initFx);
  initScrollers();
});
})();
