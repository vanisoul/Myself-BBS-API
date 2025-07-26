# CMS10 VOD API 規格文件

## 概述

本文件詳細說明 CMS10 系統中 `/api.php/provide/vod/` 端點下所支援的視頻點播（VOD）API 規格，包含完整的請求參數、回應格式和使用範例。

## 基本資訊

- **基礎 URL**: `http://域名/api.php/provide/vod/`
- **支援格式**: JSON
- **請求方法**: GET
- **編碼**: UTF-8

## API 端點總覽

| 端點            | 功能         | 說明                 |
| --------------- | ------------ | -------------------- |
| `?ac=videolist` | 獲取視頻列表 | 支援分頁、篩選、排序 |
| `?ac=detail`    | 獲取視頻詳情 | 支援單個或批量查詢   |

## 1. 視頻列表 API

### 1.1 基本資訊

- **端點**: `/api.php/provide/vod/?ac=videolist`
- **方法**: GET
- **功能**: 獲取視頻列表，支援分頁、篩選和排序

### 1.2 請求參數

| 參數名 | 類型   | 必填 | 預設值 | 說明                        | 範例      |
| ------ | ------ | ---- | ------ | --------------------------- | --------- |
| `ac`   | string | 是   | -      | 操作類型，固定為 `list`     | `list`    |
| `t`    | number | 否   | -      | 分類 ID，用於篩選特定分類   | `1`       |
| `pg`   | number | 否   | 1      | 頁碼，用於分頁              | `5`       |
| `wd`   | string | 否   | -      | 搜尋關鍵字                  | `動作`    |
| `h`    | number | 否   | -      | 獲取 X 小時內更新的資料     | `24`      |
| `at`   | string | 否   | json   | 資料格式，固定為 `json`     | `json`    |
| `ids`  | string | 否   | -      | 指定視頻 ID，多個用逗號分隔 | `123,456` |

### 1.3 回應格式（JSON）

```json
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 23,
  "limit": "20",
  "total": 449,
  "list": [
    {
      "vod_id": 21,
      "vod_name": "測試影片1",
      "type_id": 6,
      "type_name": "動作片",
      "vod_en": "test-movie-1",
      "vod_time": "2024-01-15 20:50:19",
      "vod_remarks": "超清",
      "vod_play_from": "youku"
    }
  ]
}
```

## 2. 視頻詳情 API

### 2.1 基本資訊

- **端點**: `/api.php/provide/vod/?ac=detail`
- **方法**: GET
- **功能**: 獲取視頻詳細資訊

### 2.2 請求參數

| 參數名 | 類型   | 必填 | 預設值 | 說明                      | 範例      |
| ------ | ------ | ---- | ------ | ------------------------- | --------- |
| `ac`   | string | 是   | -      | 操作類型，固定為 `detail` | `detail`  |
| `ids`  | string | 是   | -      | 視頻 ID，多個用逗號分隔   | `123,567` |
| `h`    | number | 否   | -      | 獲取 X 小時內更新的資料   | `24`      |
| `at`   | string | 否   | json   | 資料格式，固定為 `json`   | `json`    |

### 2.3 回應格式（JSON）

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
      "vod_id": 21,
      "vod_name": "測試影片1",
      "type_id": 6,
      "type_name": "動作片",
      "vod_en": "test-movie-1",
      "vod_time": "2024-01-15 20:50:19",
      "vod_remarks": "超清",
      "vod_play_from": "youku",
      "vod_pic": "https://example.com/poster.jpg",
      "vod_area": "大陸",
      "vod_lang": "國語",
      "vod_year": "2024",
      "vod_serial": "0",
      "vod_actor": "張三,李四",
      "vod_director": "王導演",
      "vod_content": "這是一部精彩的動作片...",
      "vod_play_url": "第1集$http://example.com/play1.mp4"
    }
  ]
}
```

## 3. 視頻搜尋 API

### 3.1 基本資訊

- **端點**: `/api.php/provide/vod/?ac=videolist&wd={關鍵字}`
- **方法**: GET
- **功能**: 根據關鍵字搜尋視頻

### 3.2 請求參數

| 參數名 | 類型   | 必填 | 預設值 | 說明                    | 範例         |
| ------ | ------ | ---- | ------ | ----------------------- | ------------ |
| `ac`   | string | 是   | -      | 操作類型，固定為 `list` | `list`       |
| `wd`   | string | 是   | -      | 搜尋關鍵字              | `復仇者聯盟` |
| `pg`   | number | 否   | 1      | 頁碼                    | `2`          |
| `at`   | string | 否   | json   | 資料格式，固定為 `json` | `json`       |

## 4. 回應欄位說明

### 4.1 基本回應欄位

| 欄位名      | 類型   | 說明               |
| ----------- | ------ | ------------------ |
| `code`      | number | 狀態碼，1 表示成功 |
| `msg`       | string | 回應訊息           |
| `page`      | number | 當前頁碼           |
| `pagecount` | number | 總頁數             |
| `limit`     | string | 每頁資料數量       |
| `total`     | number | 總資料數量         |
| `list`      | array  | 資料列表           |

### 4.2 視頻資料欄位

| 欄位名          | 類型   | 說明          | 範例                                 |
| --------------- | ------ | ------------- | ------------------------------------ |
| `vod_id`        | number | 視頻 ID       | `123`                                |
| `vod_name`      | string | 視頻名稱      | `復仇者聯盟`                         |
| `type_id`       | number | 分類 ID       | `1`                                  |
| `type_name`     | string | 分類名稱      | `動作片`                             |
| `vod_en`        | string | 英文名稱/別名 | `avengers`                           |
| `vod_time`      | string | 更新時間      | `2024-01-15 20:50:19`                |
| `vod_remarks`   | string | 備註/狀態     | `超清`                               |
| `vod_play_from` | string | 播放來源      | `youku`                              |
| `vod_pic`       | string | 海報圖片 URL  | `https://example.com/poster.jpg`     |
| `vod_area`      | string | 地區          | `大陸`                               |
| `vod_lang`      | string | 語言          | `國語`                               |
| `vod_year`      | string | 年份          | `2024`                               |
| `vod_serial`    | string | 集數狀態      | `0`                                  |
| `vod_actor`     | string | 主演          | `張三,李四`                          |
| `vod_director`  | string | 導演          | `王導演`                             |
| `vod_content`   | string | 劇情介紹      | `這是一部精彩的動作片...`            |
| `vod_play_url`  | string | 播放地址      | `第1集$http://example.com/play1.mp4` |

## 5. 狀態碼說明

| 狀態碼 | 說明       |
| ------ | ---------- |
| `1`    | 請求成功   |
| `0`    | 請求失敗   |
| `-1`   | 參數錯誤   |
| `-2`   | 資料不存在 |

## 6. 使用範例

### 6.1 獲取第一頁視頻列表

```bash
curl "http://example.com/api.php/provide/vod/?ac=videolist&pg=1"
```

### 6.2 獲取特定分類的視頻

```bash
curl "http://example.com/api.php/provide/vod/?ac=videolist&t=1&pg=1"
```

### 6.3 獲取視頻詳情

```bash
curl "http://example.com/api.php/provide/vod/?ac=detail&ids=123,456"
```

### 6.4 搜尋視頻

```bash
curl "http://example.com/api.php/provide/vod/?ac=videolist&wd=復仇者聯盟"
```

### 6.5 獲取最近 24 小時更新的視頻

```bash
curl "http://example.com/api.php/provide/vod/?ac=detail&h=24"
```

## 7. 最佳實踐

### 7.1 分頁處理

- 建議每頁資料量不超過 100 筆
- 使用 `pg` 參數進行分頁導航
- 根據 `pagecount` 判斷總頁數

### 7.2 錯誤處理

- 始終檢查回應中的 `code` 欄位
- 根據不同的狀態碼進行相應的錯誤處理
- 實作重試機制處理網路異常

### 7.3 快取策略

- 對於不常變動的資料（如分類列表）建議快取
- 使用 `h` 參數獲取增量更新資料
- 根據業務需求設定合適的快取時間

### 7.4 效能優化

- 使用 `ids` 參數批量獲取詳情，減少請求次數
- 使用 JSON 格式進行資料交換
- 避免頻繁請求，實作適當的請求間隔

## 8. 注意事項

1. **請求頻率限制**: 建議控制請求頻率，避免對伺服器造成過大負載
2. **資料編碼**: 所有資料均為 UTF-8 編碼
3. **時間格式**: 時間欄位格式為 `YYYY-MM-DD HH:mm:ss`
4. **URL 編碼**: 搜尋關鍵字等參數需要進行 URL 編碼
5. **HTTPS 支援**: 建議使用 HTTPS 協定確保資料傳輸安全

## 9. 常見問題

### Q1: 如何獲取所有分類？

A1: 查看系統後台分類設定，或透過管理 API 獲取分類列表。

### Q2: 播放地址格式說明？

A2: `vod_play_url` 格式為 `集數名稱$播放地址`，多集用 `#` 分隔。

### Q3: 如何處理大量資料同步？

A3: 建議使用 `h` 參數進行增量同步，結合本地快取機制。

### Q4: 如何處理分頁資料？

A4: 使用 `pg` 參數進行分頁，根據 `pagecount` 和 `total` 欄位計算總頁數和資料量。

---

**文件版本**: v1.0
**最後更新**: 2025-01-26 15:03:00
**維護者**: 系統管理員
