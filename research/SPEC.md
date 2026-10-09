# 研究規格（所有 subagent 共用）

旅程：2027/3/17（三）～3/21（日），東京，3 位台灣旅客（Jess、哥哥、姑姑），哥哥另有一位男性朋友同行。
據點：Jess 住「戶越站周邊」（都營淺草線 戸越駅／東急池上線 戸越銀座駅）。哥哥與姑姑暫定住五反田／大崎／品川一帶的平價飯店。
預算：中等，能省則省。體力中等。飲食無限制。讀者：三個人一起看，用台灣正體中文。
興趣：拜訪朋友、樂園擇一（主選哈利波特影城，迪士尼樂園／海洋為備案）、道地居酒屋、無印良品、神社、古色古香的巷弄、展覽、文青咖啡廳、選物店。
今天是 2026-10-10。資訊到 2027 年 3 月可能變動，凡有時效性請註明。

## 內容品質規則（必遵守）
1. 優先官方來源；關鍵事實（營業時間、公休、價格、地址、是否仍營業）需兩個獨立來源一致。查不到就不要寫，不要猜。
2. 保留保留語氣（「一般認為」「未查證」「傳說」），不要把不確定寫成確定。
3. 有爭議的說法並列呈現。
4. 警告優先於推薦：已歇業、改裝休館、季節不適合、需排隊數小時、現金限定、不收觀光客等，寫在 `warn` 欄並把 flag 設 warn 或 closed，不可淡化。
5. 文字：具體、短句、台灣用語。避免翻譯腔（「不是 A 而是 B」堆疊、空洞形容詞如「絕美」「必訪」、一連串「的」）。
6. 評分：只在你實際在頁面上看到時才寫 `g`，並寫 src 與 asof；評論數看不到就不要寫，不要編。
7. 座標：從維基百科（ja/en 條目的座標）、官方網站地圖、或可信頁面取得；只知道大概位置時設 `geo_approx: true` 並在 geo_src 說明。不可亂填。

## 輸出：寫成一個 JSON 檔 /home/claude/site/research/<代號>.json
{
  "places": [ PLACE, ... ],
  "culture": [ CARD, ... ],      // 選填
  "talk": [ PHRASE, ... ],       // 選填
  "apps": [ APP, ... ],          // 選填
  "facts": [ {"k":"主題","v":"內容","src":["url","url"]} ],   // 給總覽/行前/行程頁用的已查證事實
  "unverified": [ {"claim":"…","why":"為何不敢寫／找不到第二來源"} ],
  "overturned": [ {"claim":"常見說法","truth":"查證後的實際情況","src":["url"]} ]
}
寫完後用 `python3 -c "import json;json.load(open('檔名'))"` 確認 JSON 合法。

PLACE 欄位：
{
 "id": "代號前綴-英文-kebab，例如 a-togoshi-ginza",
 "name": "日文正式名稱",
 "zh": "繁中名稱（台灣常用譯名）",
 "cat": "sight | eat | cafe | shop | stay | park | art",   // art=美術館/展覽/博物館
 "tags": ["shrine","temple","alley","shotengai","izakaya","yokocho","kissaten","cafe","muji","select","zakka","bookstore","museum","exhibition","garden","view","sakura","budget-hotel", ...],
 "zone": "z1|z2|z3|z4|z5",    // z1 據點周邊(戶越/五反田/品川/大崎/目黑/中目黑/代官山)；z2 淺草線直通(新橋/銀座/日本橋/人形町/淺草橋/藏前/淺草/押上)；z3 西側(澀谷/原宿/表參道/下北澤/三軒茶屋/新宿)；z4 北側下町(上野/谷根千/湯島/神田/神樂坂/池袋等)；z5 郊外與樂園(練馬/舞濱/吉祥寺/三鷹等)
 "town": "區域名，如 戶越銀座",
 "station": "最近車站與路線，如 戸越銀座駅（東急池上線）步行3分",
 "from_base": "從戶越站怎麼去：路線與轉乘（如『淺草線直達，不用轉車』）。分鐘數只有在乘換案內類網站查到才寫，寫『約N分（來源）』",
 "lat": 35.0, "lng": 139.0, "geo_src": "座標來源", "geo_approx": false,
 "q": "Google Maps 搜尋字串（日文名＋區名）",
 "addr": "日文地址",
 "price": "價格（日圓），查不到就省略",
 "hours": "營業時間，查不到就省略",
 "closed": "公休日",
 "flag": "star|ok|warn|info|closed|unverified",   // star=很推薦且已查證
 "warn": "⚠️ 卡片正面警告文字（選填）",
 "bookable": false, "bk": "預約方式與提早多久（選填）",
 "url": "官網",
 "note": "1～3 句具體說明：為什麼值得去、去了做什麼",
 "day": null,          // 建議日：1=3/17 抵達日晚上, 2=3/18, 3=3/19, 4=3/20(六，春分連假首日，人多), 5=3/21 回程日；不確定就 null
 "g": {"r":4.3,"src":"Tabelog","asof":"2026-10"},   // 只在親眼看到時寫
 "buy": ["購物清單項目"],      // 選填，商店用
 "deep": {"lead":"一句話","paras":["段落"],"tips":["實用提醒"]},  // 選填，重點地點才寫
 "src": ["主要來源 url", "第二來源 url"]
}
CARD（文化卡）：{"id","cat":"etiquette|shrine|food|transport|history|money","title","lead","paras":[...],"where":"相關地點或情境","src":[...]}
PHRASE（會話）：{"id","sec":"basic|izakaya|shop|transit|shrine|hotel|park|emergency","t":"日文","say":"假名讀音","roma":"羅馬拼音","zhsound":"中文諧音（選填，不準就省略）","zh":"中文意思","when":"使用情境","note":"選填"}
APP：{"id","name","must":true/false,"dev":"開發者","ios_url":"App Store 網址（必須是你實際打開確認過的 apps.apple.com 網址）","ios_id":"id數字","android_url":"Google Play 網址（確認過才寫）","tw_store":true/false/null,"what":"做什麼","when":"什麼時候用","gotchas":"陷阱","offline":"是否可離線","src":[...],"unknown":"查不到的部分"}
