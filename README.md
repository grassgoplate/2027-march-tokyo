# 東京 2027 春 · 3/17—3/21

三個人的東京五天行程網站，架構沿用同事的旅程規劃 PRD（nz-trip-2026），顏色換成東京配色。

## 結構
- `data/places.json`：唯一資料來源（meta、places、routes）；`culture.json`、`talk.json`、`apps.json`、`facts.json`（已查證事實＋查不到／推翻的說法）
- `_src/*.html`：頁面模板；`_assets/site.css`、`site.js`：共用樣式與腳本
- `research/`：6 個分區研究的原始輸出（a 據點周邊、b 淺草線沿線、c 西側、d 北側下町＋展覽、e 樂園、f 住宿／交通／文化）與 `SPEC.md`
- 根目錄 `*.html`：建好的頁面，可直接 file:// 開或放 GitHub Pages

## 指令
```
python3 _merge.py    # research/*.json → data/*.json（去重、依 routes 標日期、座標檢查）
python3 _build.py    # 組頁面（或 python3 _build.py _src/eat.html）
python3 _check.py    # 每次改完都跑
python3 _measure.py  # 無頭 Chromium 量測手機 390px／桌機 1280px 版面（需要 playwright 與本機 leaflet）
```

## 與 PRD 不同的地方
- 交通是電車，沒有 OSRM 開車路線，`routes` 只有文字方案，沒有 `ROUTESGEO`
- 照片：`data/photos.json` 直接引用 Wikimedia Commons 縮圖（CC0／CC BY／CC BY-SA／公有領域），每張都在瀏覽器裡逐張看過，確認拍的是該地點；作者與授權見 `CREDITS.md`。沒有合適照片的地點用類別圖示代替
- Google 地圖星等：`research/google_ratings.tsv`，2026-10 的快照，比對過店名與地址才收；`_merge.py` 會把它併進 `places.json` 的 `gm` 欄位，Google 地圖連結也改用 place_id 精準開啟
- 人工修正（例如從評論補上的警告）放在 `research/overrides.json`，合併時套用
- 座標多數是研究員從維基百科或車站位置取得，標 `geo_approx` 的在地圖上是虛線圈
- 新增 `zone`（板塊）欄位：依從戶越過去的方便程度排序與上色
- 地圖 pin 依類別上色（景點、展覽、公園、樂園、居酒屋、咖啡、購物、住宿），類別按鈕與地圖圖例都能篩選
