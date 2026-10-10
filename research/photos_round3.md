# 照片第三輪（2026-10-10）：放寬到 NC 授權

使用者同意放寬到 CC BY-NC／CC BY-NC-SA（網站是非商業的個人旅行筆記）；ND 仍不收，因為卡片會把照片裁成 16:9。
來源：Flickr 搜尋（授權篩選含 NC）、Openverse。每張候選都在瀏覽器裡看過，並對照標題、標籤或說明確認拍攝地點。

## 新增 3 張
| 地點 | 作者 | 授權 | 說明 |
|---|---|---|---|
| 森乃園（人形町焙茶） | Richard, enjoy my life! | CC BY-SA 2.0 | 店門口，2013 年 |
| IDÉE SHOP 自由之丘 | Hirotomo Oi | CC BY-NC 2.0 | 咖啡區的甜點，2008 年 |
| かもめブックス（神樂坂） | Moody Man | CC BY-NC 2.0 | 店門看板，2016 年 |

## 找到但沒用
- 鍵屋（根岸）：Flickr 上標「鍵屋」的照片拍的是江戶東京建築園裡移築的舊店舗建築，不是現在營業的根岸店。
- MUJI HOTEL GINZA：只有無印良品賣場照或自拍，沒有飯店本身。
- 猿田彥咖啡：照片主體是可辨識的人臉或杯子特寫，看不出是哪間店。
- isriya 等其他選物店：照片沒寫是哪一間店，無法確認地點。
- 第一輪的かもめブックス候選來自東京設計週會場，不是店面，這次改用確認過的店門照片。

## 因為地點刪除而移掉的照片
Google 星等低於 4.0 的地點已從網站移除（見 `removed_low_rating.md`），它們的照片一併從 `data/photos.json` 移到下面，之後如果加回地點可以直接還原。

```json
{
 "a-muji-atre-oimachi": {
  "u": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Oimachi-STA_atre.jpg/960px-Oimachi-STA_atre.jpg",
  "w": 960,
  "h": 640,
  "lic": "CC BY-SA 4.0",
  "art": "MaedaAkihiko",
  "file": "Oimachi-STA_atre.jpg",
  "pg": "https://commons.wikimedia.org/wiki/File:Oimachi-STA_atre.jpg",
  "cap": "atre 大井町（無印良品在館內）"
 },
 "a-nakanobu-skip-road": {
  "u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nakanobu_skip_road_shinagawa.JPG/960px-Nakanobu_skip_road_shinagawa.JPG",
  "w": 960,
  "h": 1280,
  "lic": "CC BY-SA 3.0",
  "art": "Kentin",
  "file": "Nakanobu_skip_road_shinagawa.JPG",
  "pg": "https://commons.wikimedia.org/wiki/File:Nakanobu_skip_road_shinagawa.JPG"
 },
 "b-kaiseiken": {
  "u": "https://live.staticflickr.com/2812/11530295826_c2eb5fffcd_b.jpg",
  "w": 1024,
  "h": 768,
  "lic": "CC BY 2.0",
  "art": "jlggb",
  "file": "kaiseiken-2013",
  "pg": "https://www.flickr.com/photos/18220837@N03/11530295826",
  "src": "flickr",
  "cap": "店內（2013 年）"
 },
 "c-mikan-shimokita": {
  "u": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/%E5%95%86%E6%A5%AD%E6%96%BD%E8%A8%AD%E3%80%8C%E3%83%9F%E3%82%AB%E3%83%B3%E4%B8%8B%E5%8C%97%E3%80%8D.jpg/960px-%E5%95%86%E6%A5%AD%E6%96%BD%E8%A8%AD%E3%80%8C%E3%83%9F%E3%82%AB%E3%83%B3%E4%B8%8B%E5%8C%97%E3%80%8D.jpg",
  "w": 960,
  "h": 539,
  "lic": "CC0",
  "art": "Souka Kinmei",
  "file": "商業施設「ミカン下北」.jpg",
  "pg": "https://commons.wikimedia.org/wiki/File:%E5%95%86%E6%A5%AD%E6%96%BD%E8%A8%AD%E3%80%8C%E3%83%9F%E3%82%AB%E3%83%B3%E4%B8%8B%E5%8C%97%E3%80%8D.jpg",
  "src": "commons",
  "cap": ""
 }
}
```
