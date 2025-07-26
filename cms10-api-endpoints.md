# CMS10 相容 API 端點結構規劃

## 規格異動日期時間

**建立日期**: 2025-07-26 15:28:00 (UTC+8)
**版本**: v1.0

## 1. API 端點架構概覽

### 1.1 新增 CMS10 相容端點

```
基礎路徑: /api.php/provide/vod/
```

| 端點                       | 功能         | CMS10 標準 | 對應原始端點                      |
| -------------------------- | ------------ | ---------- | --------------------------------- |
| `?ac=videolist`            | 獲取視頻列表 | ✅         | `/list/airing`, `/list/completed` |
| `?ac=detail`               | 獲取視頻詳情 | ✅         | `/anime/{id}`, `/anime/all`       |
| `?ac=videolist&wd={query}` | 搜尋視頻     | ✅         | `/search/{query}`                 |

### 1.2 保留原有端點

為確保向後相容性，保留所有現有端點：

```
/list/airing          - 連載列表
/list/completed       - 完結列表
/anime/{id}           - 特定動畫資訊
/anime/all            - 全部動畫資訊
/search/{query}       - 搜尋功能
/m3u8/{id}/{ep}       - M3U8 播放清單
```

## 2. CMS10 端點詳細規劃

### 2.1 視頻列表端點

**路徑**: `/api.php/provide/vod/?ac=videolist`

#### 2.1.1 支援參數

| 參數  | 類型   | 必填 | 預設值 | 說明          | 實作邏輯           |
| ----- | ------ | ---- | ------ | ------------- | ------------------ |
| `ac`  | string | ✅   | -      | 固定為 `list` | 路由識別           |
| `t`   | number | ❌   | -      | 分類 ID 篩選  | 根據分類映射表篩選 |
| `pg`  | number | ❌   | 1      | 頁碼          | 分頁邏輯實作       |
| `wd`  | string | ❌   | -      | 搜尋關鍵字    | 整合 Fuse.js 搜尋  |
| `h`   | number | ❌   | -      | X 小時內更新  | 根據時間戳篩選     |
| `at`  | string | ❌   | json   | 資料格式      | 固定 JSON          |
| `ids` | string | ❌   | -      | 指定 ID 列表  | 批量查詢邏輯       |

#### 2.1.2 實作邏輯

```javascript
/**
 * 處理 CMS10 列表請求
 * @param {Object} query - 查詢參數
 * @returns {Object} CMS10 格式回應
 */
async function handleCms10List(query) {
  const { t: typeId, pg: page = 1, wd: keyword, h: hours, ids: idList } = query;

  let data;

  // 1. 獲取基礎資料
  if (idList) {
    // 批量查詢指定 ID
    data = await getBatchAnimeData(idList.split(","));
  } else {
    // 獲取全部列表資料
    const [airing, completed] = await Promise.all([getAiringList(), getCompletedList()]);
    data = [...airing.data, ...completed.data];
  }

  // 2. 應用篩選條件
  if (typeId) {
    data = filterByCategory(data, typeId);
  }

  if (keyword) {
    data = searchByKeyword(data, keyword);
  }

  if (hours) {
    data = filterByUpdateTime(data, hours);
  }

  // 3. 分頁處理
  const limit = 20;
  const total = data.length;
  const pagecount = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedData = data.slice(startIndex, startIndex + limit);

  // 4. 轉換為 CMS10 格式
  const cms10List = paginatedData.map(convertListItem);

  return {
    code: 1,
    msg: "數據列表",
    page: parseInt(page),
    pagecount,
    limit: limit.toString(),
    total,
    list: cms10List,
  };
}
```

### 2.2 視頻詳情端點

**路徑**: `/api.php/provide/vod/?ac=detail`

#### 2.2.1 支援參數

| 參數  | 類型   | 必填 | 預設值 | 說明            | 實作邏輯          |
| ----- | ------ | ---- | ------ | --------------- | ----------------- |
| `ac`  | string | ✅   | -      | 固定為 `detail` | 路由識別          |
| `ids` | string | ✅   | -      | 視頻 ID 列表    | 支援單個或多個 ID |
| `h`   | number | ❌   | -      | X 小時內更新    | 時間篩選          |
| `at`  | string | ❌   | json   | 資料格式        | 固定 JSON         |

#### 2.2.2 實作邏輯

```javascript
/**
 * 處理 CMS10 詳情請求
 * @param {Object} query - 查詢參數
 * @returns {Object} CMS10 格式回應
 */
async function handleCms10Detail(query) {
  const { ids: idList, h: hours } = query;

  if (!idList) {
    return {
      code: -1,
      msg: "參數錯誤：缺少 ids 參數",
      page: 1,
      pagecount: 0,
      limit: "20",
      total: 0,
      list: [],
    };
  }

  // 1. 獲取詳情資料
  const ids = idList.split(",");
  const detailPromises = ids.map((id) => getAnime(id));
  const details = await Promise.all(detailPromises);

  // 2. 過濾有效資料
  const validDetails = details.filter((detail) => detail !== null);

  // 3. 時間篩選
  let filteredDetails = validDetails;
  if (hours) {
    filteredDetails = filterByUpdateTime(validDetails, hours);
  }

  // 4. 轉換為 CMS10 格式
  const cms10Details = filteredDetails.map(convertDetailItem);

  return {
    code: 1,
    msg: "數據列表",
    page: 1,
    pagecount: 1,
    limit: "20",
    total: cms10Details.length,
    list: cms10Details,
  };
}
```

## 3. 路由整合規劃

### 3.1 主路由結構

```javascript
// 新增 CMS10 相容路由
router.get("/api.php/provide/vod/", async (request) => {
  const { query } = request;
  const { ac } = query;

  try {
    switch (ac) {
      case "list":
        return response({
          data: JSON.stringify(await handleCms10List(query), null, query.min ? 0 : 2),
        });

      case "detail":
        return response({
          data: JSON.stringify(await handleCms10Detail(query), null, query.min ? 0 : 2),
        });

      default:
        return response({
          data: JSON.stringify(
            {
              code: -1,
              msg: "參數錯誤：不支援的操作類型",
              page: 1,
              pagecount: 0,
              limit: "20",
              total: 0,
              list: [],
            },
            null,
            2,
          ),
        });
    }
  } catch (error) {
    return response({
      data: JSON.stringify(
        {
          code: 0,
          msg: `請求失敗：${error.message}`,
          page: 1,
          pagecount: 0,
          limit: "20",
          total: 0,
          list: [],
        },
        null,
        2,
      ),
    });
  }
});
```

### 3.2 向後相容性保證

```javascript
// 保留所有原有路由
router.get("/list/completed", async (request) => {
  // 原有邏輯保持不變
});

router.get("/list/airing", async (request) => {
  // 原有邏輯保持不變
});

router.get("/anime/:id", async (request) => {
  // 原有邏輯保持不變
});

// ... 其他原有路由
```

## 4. 分頁機制設計

### 4.1 分頁參數處理

```javascript
/**
 * 處理分頁邏輯
 * @param {Array} data - 原始資料陣列
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 分頁結果
 */
function paginateData(data, page = 1, limit = 20) {
  const total = data.length;
  const pagecount = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page: parseInt(page),
      pagecount,
      limit: limit.toString(),
      total,
    },
  };
}
```

### 4.2 分頁快取策略

```javascript
/**
 * 分頁資料快取
 */
const pageCache = new Map();
const CACHE_TTL = 300000; // 5 分鐘

function getCachedPage(cacheKey) {
  const cached = pageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPage(cacheKey, data) {
  pageCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}
```

## 5. 篩選功能實作

### 5.1 分類篩選

```javascript
/**
 * 根據分類 ID 篩選資料
 * @param {Array} data - 原始資料
 * @param {number} typeId - 分類 ID
 * @returns {Array} 篩選後資料
 */
function filterByCategory(data, typeId) {
  return data.filter((item) => {
    const categoryMapping = getCategoryMapping(item.category);
    return categoryMapping.type_id === parseInt(typeId);
  });
}
```

### 5.2 時間篩選

```javascript
/**
 * 根據更新時間篩選資料
 * @param {Array} data - 原始資料
 * @param {number} hours - 小時數
 * @returns {Array} 篩選後資料
 */
function filterByUpdateTime(data, hours) {
  const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

  return data.filter((item) => {
    const updateTime = item.time || item.meta?.time || Date.now();
    return updateTime >= cutoffTime;
  });
}
```

### 5.3 關鍵字搜尋

```javascript
/**
 * 關鍵字搜尋功能
 * @param {Array} data - 原始資料
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Array} 搜尋結果
 */
function searchByKeyword(data, keyword) {
  const fuse = new Fuse(data, {
    includeScore: true,
    keys: ["title", "description", "author"],
    threshold: 0.3,
  });

  const results = fuse.search(keyword);
  return results.map((result) => result.item);
}
```

## 6. 批量查詢功能

### 6.1 批量獲取動畫資料

```javascript
/**
 * 批量獲取動畫詳情
 * @param {Array} ids - ID 陣列
 * @returns {Array} 動畫資料陣列
 */
async function getBatchAnimeData(ids) {
  const promises = ids.map(async (id) => {
    try {
      const data = await getAnime(id);
      return data;
    } catch (error) {
      console.warn(`Failed to fetch anime ${id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((result) => result !== null);
}
```

## 7. 錯誤處理機制

### 7.1 標準錯誤回應

```javascript
/**
 * 建立標準錯誤回應
 * @param {number} code - 錯誤碼
 * @param {string} message - 錯誤訊息
 * @returns {Object} 錯誤回應物件
 */
function createErrorResponse(code, message) {
  return {
    code,
    msg: message,
    page: 1,
    pagecount: 0,
    limit: "20",
    total: 0,
    list: [],
  };
}
```

### 7.2 常見錯誤處理

```javascript
// 參數錯誤
if (!query.ac) {
  return createErrorResponse(-1, "參數錯誤：缺少 ac 參數");
}

// 資料不存在
if (data.length === 0) {
  return createErrorResponse(-2, "資料不存在");
}

// 系統錯誤
try {
  // ... 處理邏輯
} catch (error) {
  return createErrorResponse(0, `系統錯誤：${error.message}`);
}
```

## 8. 效能優化策略

### 8.1 資料預處理

```javascript
/**
 * 預處理資料以提升查詢效能
 */
let preprocessedData = null;
let lastPreprocessTime = 0;
const PREPROCESS_INTERVAL = 600000; // 10 分鐘

async function getPreprocessedData() {
  const now = Date.now();

  if (!preprocessedData || now - lastPreprocessTime > PREPROCESS_INTERVAL) {
    const [airing, completed] = await Promise.all([getAiringList(), getCompletedList()]);

    preprocessedData = {
      all: [...airing.data, ...completed.data],
      byCategory: groupByCategory([...airing.data, ...completed.data]),
      searchIndex: createSearchIndex([...airing.data, ...completed.data]),
    };

    lastPreprocessTime = now;
  }

  return preprocessedData;
}
```

### 8.2 快取策略

```javascript
/**
 * 多層快取策略
 */
const cacheConfig = {
  list: { ttl: 300000, maxSize: 100 }, // 列表快取 5 分鐘
  detail: { ttl: 600000, maxSize: 1000 }, // 詳情快取 10 分鐘
  search: { ttl: 180000, maxSize: 50 }, // 搜尋快取 3 分鐘
};
```

## 9. 測試端點規劃

### 9.1 基本功能測試

```bash
# 列表測試
GET /api.php/provide/vod/?ac=videolist
GET /api.php/provide/vod/?ac=videolist&pg=2
GET /api.php/provide/vod/?ac=videolist&t=1

# 詳情測試
GET /api.php/provide/vod/?ac=detail&ids=12345
GET /api.php/provide/vod/?ac=detail&ids=12345,67890

# 搜尋測試
GET /api.php/provide/vod/?ac=videolist&wd=進擊
```

### 9.2 邊界條件測試

```bash
# 錯誤參數測試
GET /api.php/provide/vod/?ac=invalid
GET /api.php/provide/vod/?ac=detail
GET /api.php/provide/vod/?ac=videolist&pg=999999

# 空資料測試
GET /api.php/provide/vod/?ac=videolist&wd=不存在的關鍵字
GET /api.php/provide/vod/?ac=detail&ids=999999
```

## 10. 部署注意事項

### 10.1 環境變數配置

```javascript
const config = {
  CMS10_ENABLED: true,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 300000,
};
```

### 10.2 監控指標

- API 回應時間
- 快取命中率
- 錯誤率統計
- 分頁查詢效能
- 記憶體使用量

## 11. 向後相容性保證

1. **保留所有原有端點**：確保現有用戶端不受影響
2. **資料格式相容**：原有端點回應格式保持不變
3. **漸進式遷移**：提供遷移指南和過渡期支援
4. **版本標識**：在回應中加入版本資訊便於追蹤

## 12. 未來擴展規劃

1. **更多篩選條件**：年份、地區、語言等
2. **排序功能**：按時間、熱度、評分排序
3. **統計資訊**：分類統計、熱門排行
4. **API 版本控制**：支援多版本 API 並存
