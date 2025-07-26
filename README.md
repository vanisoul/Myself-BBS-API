# Myself-BBS API

myself-bbs.com JSON API

## 🚨 重要提醒：CORS 跨域請求

**Myself 的影片資源有 CORS 設定限制**

如果您需要在瀏覽器中進行跨域請求，請安裝以下瀏覽器插件：

- Chrome/Edge: [Allow CORS: Access-Control-Allow-Origin](https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf)

或者使用伺服器端請求來避免 CORS 限制。

## 🛠️ 開發和部署

### 本地開發

#### 方式一：本機單獨運行 (推薦用於開發)

```bash
# 安裝依賴
pnpm install

# 本機運行，不使用 Wrangler
pnpm run dev:local
```

此方式會在 `http://localhost:3000` 啟動本地伺服器，適合快速開發和測試。

#### 方式二：使用 Wrangler 測試

```bash
# 使用 Wrangler 開發模式
pnpm run dev
```

此方式會使用 Cloudflare Workers 的本地模擬環境，更接近生產環境。

### 部署到 Cloudflare Workers

#### 前置準備

1. **設定 Wrangler 配置**

   確認 `wrangler.toml` 中的 `account_id` 是您自己的 Cloudflare Account ID：

   ```toml
   name = "myself-bbs"
   main = "dist/worker.js"
   account_id = "your-cloudflare-account-id"  # 請替換為您的 Account ID
   workers_dev = true
   ```

   > 💡 **如何獲取 Account ID**：
   >
   > 1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   > 2. 在右側邊欄可以看到您的 Account ID

2. **登入 Wrangler**

   ```bash
   # 登入 Cloudflare 帳號
   pnpm run login
   ```

#### 部署步驟

```bash
# 建置並部署到 Cloudflare Workers
pnpm run publish
```

部署成功後，您的 API 將可在以下網址存取：

```
https://myself-bbs.your-subdomain.workers.dev/
```

### 可用的 npm 指令

| 指令                | 說明                           |
| ------------------- | ------------------------------ |
| `npm run dev:local` | 本機單獨運行 (不使用 Wrangler) |
| `npm run dev`       | 使用 Wrangler 開發模式         |
| `npm run build`     | 建置專案                       |
| `npm run publish`   | 部署到 Cloudflare Workers      |
| `npm run login`     | 登入 Cloudflare 帳號           |

---

## 🆕 CMS10 標準 API (推薦使用)

### 列表查詢 API

```bash
GET /api.php/provide/vod/?ac=videolist
```

**支援參數**:

- `ac` (必要): 操作類型，固定為 "videolist"
- `pg` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20，最大 100
- `t` (可選): 分類 ID (1-99)
- `wd` (可選): 搜尋關鍵字
- `h` (可選): 更新時間篩選 (小時)

**使用範例**:

```bash
# 基本列表查詢
http://localhost:3000/api.php/provide/vod/?ac=videolist

# 分頁查詢
http://localhost:3000/api.php/provide/vod/?ac=videolist&pg=2&limit=10

# 分類篩選 (動作類)
http://localhost:3000/api.php/provide/vod/?ac=videolist&t=1

# 搜尋功能
http://localhost:3000/api.php/provide/vod/?ac=videolist&wd=進擊的巨人
```

**CMS10 回應格式**:

```json
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 88,
  "limit": "20",
  "total": 1753,
  "list": [
    {
      "vod_id": 12345,
      "vod_name": "進擊的巨人",
      "type_id": 1,
      "type_name": "動作",
      "vod_en": "進擊的巨人",
      "vod_time": "2024-01-15 20:50:19",
      "vod_remarks": "第25集",
      "vod_play_from": "myself-bbs",
      "vod_pic": "https://example.com/cover.jpg"
    }
  ]
}
```

### 詳情查詢 API

```bash
GET /api.php/provide/vod/?ac=videolist&ids=1,2,3
```

**支援參數**:

- `ac` (必要): 操作類型，固定為 "videolist"
- `ids` (必要): 影片 ID 列表，逗號分隔
- `h` (可選): 更新時間篩選 (小時)

**使用範例**:

```bash
# 單個詳情查詢
http://localhost:3000/api.php/provide/vod/?ac=videolist&ids=12345

# 批量詳情查詢
http://localhost:3000/api.php/provide/vod/?ac=videolist&ids=12345,67890,11111
```

**CMS10 詳情回應格式**:

```json
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 1,
  "limit": "20",
  "total": 1,
  "list": [
    {
      "vod_id": 12345,
      "vod_name": "進擊的巨人",
      "type_id": 1,
      "type_name": "動作",
      "vod_en": "進擊的巨人",
      "vod_time": "2024-01-15 20:50:19",
      "vod_remarks": "第25集",
      "vod_play_from": "myself-bbs",
      "vod_pic": "https://example.com/cover.jpg",
      "vod_area": "日本",
      "vod_lang": "日語",
      "vod_year": "2013",
      "vod_serial": "0",
      "vod_actor": "",
      "vod_director": "諫山創",
      "vod_content": "故事描述...",
      "vod_play_url": "第 01 話$https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8#第 02 話$https://vpx05.myself-bbs.com/hls/fA/wA/Aq/AgADfAwAAqLbQVY/index.m3u8"
    }
  ]
}
```

### 分類系統

CMS10 API 支援以下分類：

| 分類名稱 | type_id | type_name |
| -------- | ------- | --------- |
| 動作     | 1       | 動作      |
| 冒險     | 2       | 冒險      |
| 科幻     | 3       | 科幻      |
| 奇幻     | 4       | 奇幻      |
| 日常     | 5       | 日常      |
| 戀愛     | 6       | 戀愛      |
| 喜劇     | 7       | 喜劇      |
| 劇情     | 8       | 劇情      |
| 懸疑     | 9       | 懸疑      |
| 恐怖     | 10      | 恐怖      |
| 其他     | 99      | 其他      |

### 擴展功能端點

```bash
# 獲取分類列表
GET /api.php/provide/vod/categories

# API 資訊
GET /api.php/provide/vod/info

# 健康檢查
GET /api.php/provide/vod/health
```

### CMS10 錯誤處理

| 狀態碼 | 說明       |
| ------ | ---------- |
| `1`    | 請求成功   |
| `0`    | 系統錯誤   |
| `-1`   | 參數錯誤   |
| `-2`   | 資料不存在 |

---

## 📚 原有 API (向後相容)

## List

### 連載列表

```bash
http://localhost:3000/list/airing
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```

### 完結列表

```bash
http://localhost:3000/list/completed
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```

## Anime

### 特定動畫資訊

```bash
http://localhost:3000/anime/${id}
```

Response Example

```javascript
{
  "data": {
    "id": 12345,
    "title": "TITLE",
    "category": [
      "科幻",
      "冒險"
    ],
    "premiere": [
      2010,
      6,
      12
    ],
    "ep": 1,
    "author": "Author",
    "website": "website link",
    "description": "Description",
    "image": "cover image url",
    "episodes": {
      "第 01 話": [
        "12345",
        "001"
      ]
    }
  }
}
```

### 全部動畫資訊

```bash
http://localhost:3000/anime/all
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1723911473478
    },
    "data": [
      {
        "id": 51872,
        "title": "Wonderful 光之美少女！",
        "category": [
          "子供向",
          "奇幻",
          "冒險"
        ],
        "premiere": [
          2024,
          2,
          4
        ],
        "ep": 0,
        "author": "東堂泉",
        "website": "https://www.toei-anim.co.jp/",
        "description": "犬飼彩羽是住在「動物小鎮」的一位普通國中生。某天，當她與她的寵物狗「麥」散步時，一個神祕生物——「加魯加魯」攻擊了她們。為了保護彩羽，麥化身成人型，並且變身成「光之美少女」進行戰鬥。為了保護所有人免受加魯加魯們的傷害，彩羽、麥以及其他光之美少女們決定一起打倒它們。",
        "image": "https://myself-bbs.com/data/attachment/forum/202402/04/1427209zfau3u3fg0uofv1.jpg",
        "episodes": {
          "第 01 話": "AgADsA0AAjef-VU",
          "第 02 話": "AgADfAwAAqLbQVY",
          "第 03 話": "AgADXA8AAvn8kVY",
          "第 04 話": "AgAD_g0AAqvr2FY",
          "第 05 話": "AgADuhAAAqz4IVc",
          "第 06 話": "AgADUwwAAuT9aFc",
          "第 07 話": "AgAD3AwAAophsFc",
          "第 08 話": "AgAD0QwAAkoRAAFU",
          "第 09 話": "AgADUhIAAja3SFQ",
          "第 10 話": "AgAD_Q0AAt9GkFQ",
          "第 11 話": "AgADEw8AAtHW2VQ",
          "第 12 話": "AgADbQ4AAr_RKVU",
          "第 13 話": "AgADlRAAAnMhcFU",
          "第 14 話": "AgADIREAAhB4uFU",
          "第 15 話": "AgADOw0AAgPzAAFW",
          "第 15.5 話 蠟筆小新 聯動段": "AgADxRMAArlMSVY",
          "第 16 話": "AgADhgsAAqFyUFY",
          "第 17 話": "AgAD4Q8AAkuKmVY",
          "第 18 話": "AgADqxAAAhzP4FY",
          "第 19 話": "AgADwg8AAmRpKVc",
          "第 20 話": "AgADCRIAAnOAcVc",
          "第 21 話": "AgADPw8AAj_NwVc",
          "第 22 話": "AgAD9gwAAofiCFQ"
        }
      },
      ...
    ]
  }
}
```

## Search

```bash
http://localhost:3000/search/${query}
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```
