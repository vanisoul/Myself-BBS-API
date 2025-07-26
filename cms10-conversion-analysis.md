# Myself-BBS API 轉換為 CMS10 規格分析文件

## 規格異動日期時間
**建立日期**: 2025-07-26 15:23:00 (UTC+8)
**版本**: v1.0

## 1. 現有 API 資料結構分析

### 1.1 列表 API 資料格式 (Myself-BBS)

**端點**: `/list/airing`, `/list/completed`

```json
{
  "data": {
    "meta": {
      "time": 1630391759999,
      "length": 1753
    },
    "data": [
      {
        "id": 12345,
        "title": "TITLE",
        "link": "myself-bbs.com link url",
        "ep": 12,
        "image": "half cover image url",
        "watch": 148111
      }
    ]
  }
}
```

### 1.2 動畫詳情 API 資料格式 (Myself-BBS)

**端點**: `/anime/{id}`

```json
{
  "data": {
    "id": 12345,
    "title": "TITLE",
    "category": ["科幻", "冒險"],
    "premiere": [2010, 6, 12],
    "ep": 1,
    "author": "Author",
    "website": "website link",
    "description": "Description",
    "image": "cover image url",
    "episodes": {
      "第 01 話": ["12345", "001"]
    }
  }
}
```

## 2. CMS10 規格要求分析

### 2.1 CMS10 列表 API 格式

**端點**: `/api.php/provide/vod/?ac=list`

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

### 2.2 CMS10 詳情 API 格式

**端點**: `/api.php/provide/vod/?ac=detail`

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

## 3. 資料結構對應關係

### 3.1 基本回應結構對應

| Myself-BBS | CMS10 | 說明 |
|------------|-------|------|
| `data.data` | `list` | 主要資料陣列 |
| `data.meta.length` | `total` | 總資料數量 |
| `data.meta.time` | `vod_time` | 時間戳記 (需轉換格式) |
| - | `code` | 狀態碼 (固定為 1) |
| - | `msg` | 回應訊息 (固定為 "數據列表") |
| - | `page` | 當前頁碼 (需新增分頁邏輯) |
| - | `pagecount` | 總頁數 (需計算) |
| - | `limit` | 每頁數量 (預設 20) |

### 3.2 影片資料欄位對應

| Myself-BBS | CMS10 | 轉換邏輯 |
|------------|-------|----------|
| `id` | `vod_id` | 直接對應 |
| `title` | `vod_name` | 直接對應 |
| `title` | `vod_en` | 可用拼音或英文轉換 |
| `image` | `vod_pic` | 直接對應 |
| `category[0]` | `type_name` | 取第一個分類 |
| `category` | `type_id` | 需建立分類映射表 |
| `premiere[0]` | `vod_year` | 取年份 |
| `description` | `vod_content` | 直接對應 |
| `author` | `vod_director` | 直接對應 |
| `ep` | `vod_remarks` | 格式化為 "第X集" |
| `episodes` | `vod_play_url` | 需轉換為 CMS10 格式 |
| - | `vod_area` | 預設 "日本" (動畫) |
| - | `vod_lang` | 預設 "日語" |
| - | `vod_serial` | 根據狀態設定 |
| - | `vod_actor` | 可從其他欄位推導 |
| - | `vod_play_from` | 預設 "myself-bbs" |
| `meta.time` | `vod_time` | 轉換為 YYYY-MM-DD HH:mm:ss |

## 4. 關鍵轉換挑戰

### 4.1 分類系統對應
- Myself-BBS 使用中文分類陣列
- CMS10 需要 `type_id` 和 `type_name` 對應
- 需建立分類映射表

### 4.2 播放地址格式轉換
- Myself-BBS: `episodes: {"第 01 話": ["12345", "001"]}`
- CMS10: `vod_play_url: "第1集$http://example.com/play1.mp4"`
- 需整合 M3U8 API 產生完整播放地址

### 4.3 時間格式轉換
- Myself-BBS: Unix timestamp (1630391759999)
- CMS10: 字串格式 "2024-01-15 20:50:19"

### 4.4 分頁機制
- Myself-BBS: 無分頁，一次回傳全部資料
- CMS10: 需要 `pg` 參數支援分頁

## 5. 新增功能需求

### 5.1 分頁支援
- 實作 `pg` 參數處理
- 計算 `pagecount` 和分頁邏輯
- 預設每頁 20 筆資料

### 5.2 篩選功能
- 支援 `t` 參數按分類篩選
- 支援 `h` 參數按時間篩選
- 支援 `ids` 參數批量查詢

### 5.3 搜尋增強
- 整合現有 Fuse.js 搜尋
- 支援 `wd` 參數搜尋

## 6. 技術實作考量

### 6.1 向後相容性
- 保留原有 API 端點
- 新增 CMS10 相容端點
- 共用底層資料處理邏輯

### 6.2 效能優化
- 利用現有快取機制
- 分頁資料快取策略
- 減少重複資料處理

### 6.3 錯誤處理
- 統一錯誤回應格式
- 適當的 HTTP 狀態碼
- 詳細的錯誤訊息

## 7. 實作優先順序

1. **高優先級**
   - 基本 CMS10 回應格式轉換
   - 列表和詳情 API 轉換
   - 分類映射表建立

2. **中優先級**
   - 分頁功能實作
   - 搜尋功能整合
   - 播放地址格式轉換

3. **低優先級**
   - 進階篩選功能
   - 效能優化
   - 錯誤處理完善

## 8. 測試策略

### 8.1 相容性測試
- 驗證 CMS10 標準相容性
- 測試各種參數組合
- 確認回應格式正確性

### 8.2 效能測試
- 大量資料處理測試
- 分頁效能測試
- 快取效果驗證

### 8.3 整合測試
- 與現有系統整合測試
- API 端點完整性測試
- 錯誤情況處理測試