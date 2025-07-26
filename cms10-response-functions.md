# CMS10 回應格式標準化函式

## 規格異動日期時間
**建立日期**: 2025-07-26 15:30:00 (UTC+8)
**版本**: v1.0

## 1. 核心轉換函式

### 1.1 基礎回應結構建構器

```javascript
/**
 * 建立標準 CMS10 回應結構
 * @param {Object} options - 回應選項
 * @param {number} options.code - 狀態碼 (1=成功, 0=失敗, -1=參數錯誤, -2=資料不存在)
 * @param {string} options.msg - 回應訊息
 * @param {number} options.page - 當前頁碼
 * @param {number} options.pagecount - 總頁數
 * @param {string|number} options.limit - 每頁數量
 * @param {number} options.total - 總資料數量
 * @param {Array} options.list - 資料列表
 * @returns {Object} CMS10 標準回應格式
 */
function createCms10Response({
  code = 1,
  msg = "數據列表",
  page = 1,
  pagecount = 1,
  limit = "20",
  total = 0,
  list = []
}) {
  return {
    code,
    msg,
    page: parseInt(page),
    pagecount: parseInt(pagecount),
    limit: limit.toString(),
    total: parseInt(total),
    list
  };
}
```

### 1.2 成功回應建構器

```javascript
/**
 * 建立成功回應
 * @param {Array} data - 資料陣列
 * @param {Object} pagination - 分頁資訊
 * @param {number} pagination.page - 當前頁碼
 * @param {number} pagination.limit - 每頁數量
 * @param {number} pagination.total - 總資料數量
 * @returns {Object} CMS10 成功回應
 */
function createSuccessResponse(data, pagination = {}) {
  const {
    page = 1,
    limit = 20,
    total = data.length
  } = pagination;

  const pagecount = Math.ceil(total / limit);

  return createCms10Response({
    code: 1,
    msg: "數據列表",
    page,
    pagecount,
    limit: limit.toString(),
    total,
    list: data
  });
}
```

### 1.3 錯誤回應建構器

```javascript
/**
 * 建立錯誤回應
 * @param {number} code - 錯誤碼
 * @param {string} message - 錯誤訊息
 * @returns {Object} CMS10 錯誤回應
 */
function createErrorResponse(code, message) {
  const errorMessages = {
    0: "請求失敗",
    [-1]: "參數錯誤",
    [-2]: "資料不存在"
  };

  return createCms10Response({
    code,
    msg: message || errorMessages[code] || "未知錯誤",
    page: 1,
    pagecount: 0,
    limit: "20",
    total: 0,
    list: []
  });
}
```

## 2. 資料轉換函式

### 2.1 列表項目轉換器

```javascript
/**
 * 轉換單個列表項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 列表項目
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式列表項目
 */
function convertToListItem(item, options = {}) {
  const { baseUrl = "https://myself-bbs.jacob.workers.dev" } = options;

  // 獲取分類映射
  const categoryMapping = getCategoryMapping(item.category);

  // 格式化時間
  const vodTime = convertTimestamp(item.time || Date.now());

  // 格式化備註
  const remarks = formatRemarks(item);

  return {
    vod_id: parseInt(item.id),
    vod_name: item.title || "",
    type_id: categoryMapping.type_id,
    type_name: categoryMapping.type_name,
    vod_en: item.title || "",
    vod_time: vodTime,
    vod_remarks: remarks,
    vod_play_from: "myself-bbs",
    vod_pic: item.image || ""
  };
}
```

### 2.2 詳情項目轉換器

```javascript
/**
 * 轉換單個詳情項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 詳情項目
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式詳情項目
 */
function convertToDetailItem(item, options = {}) {
  const { baseUrl = "https://myself-bbs.jacob.workers.dev" } = options;

  // 先轉換為列表項目格式
  const listItem = convertToListItem(item, options);

  // 添加詳情專用欄位
  return {
    ...listItem,
    vod_area: "日本",
    vod_lang: "日語",
    vod_year: convertPremiereToYear(item.premiere),
    vod_serial: determineSerialStatus(item),
    vod_actor: extractActors(item),
    vod_director: item.author || "",
    vod_content: item.description || "",
    vod_play_url: convertPlayUrl(item.episodes, item.id, baseUrl)
  };
}
```

### 2.3 批量轉換器

```javascript
/**
 * 批量轉換列表項目
 * @param {Array} items - Myself-BBS 項目陣列
 * @param {string} type - 轉換類型 ('list' | 'detail')
 * @param {Object} options - 轉換選項
 * @returns {Array} CMS10 格式項目陣列
 */
function batchConvertItems(items, type = 'list', options = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  const converter = type === 'detail' ? convertToDetailItem : convertToListItem;

  return items
    .filter(item => item && item.id) // 過濾無效項目
    .map(item => {
      try {
        return converter(item, options);
      } catch (error) {
        console.warn(`轉換項目失敗 (ID: ${item.id}):`, error);
        return null;
      }
    })
    .filter(item => item !== null); // 移除轉換失敗的項目
}
```

## 3. 輔助轉換函式

### 3.1 分類映射函式

```javascript
/**
 * 分類映射表
 */
const CATEGORY_MAPPING = {
  "動作": { type_id: 1, type_name: "動作" },
  "冒險": { type_id: 2, type_name: "冒險" },
  "科幻": { type_id: 3, type_name: "科幻" },
  "奇幻": { type_id: 4, type_name: "奇幻" },
  "日常": { type_id: 5, type_name: "日常" },
  "戀愛": { type_id: 6, type_name: "戀愛" },
  "喜劇": { type_id: 7, type_name: "喜劇" },
  "劇情": { type_id: 8, type_name: "劇情" },
  "懸疑": { type_id: 9, type_name: "懸疑" },
  "恐怖": { type_id: 10, type_name: "恐怖" },
  "其他": { type_id: 99, type_name: "其他" }
};

/**
 * 獲取分類映射
 * @param {Array} categories - 分類陣列
 * @returns {Object} 分類映射物件
 */
function getCategoryMapping(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return CATEGORY_MAPPING["其他"];
  }

  const firstCategory = categories[0];
  return CATEGORY_MAPPING[firstCategory] || CATEGORY_MAPPING["其他"];
}
```

### 3.2 時間轉換函式

```javascript
/**
 * 轉換時間戳為 CMS10 格式
 * @param {number} timestamp - Unix 時間戳 (毫秒)
 * @returns {string} CMS10 時間格式
 */
function convertTimestamp(timestamp) {
  if (!timestamp || isNaN(timestamp)) {
    timestamp = Date.now();
  }

  const date = new Date(timestamp);

  // 確保日期有效
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // 轉換為台北時區 (UTC+8)
  const taipeiTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

  return taipeiTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 轉換首播日期為年份
 * @param {Array} premiere - [年, 月, 日] 格式
 * @returns {string} 年份字串
 */
function convertPremiereToYear(premiere) {
  if (!premiere || !Array.isArray(premiere) || premiere.length === 0) {
    return new Date().getFullYear().toString();
  }

  const year = parseInt(premiere[0]);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
    return new Date().getFullYear().toString();
  }

  return year.toString();
}
```

### 3.3 播放地址轉換函式

```javascript
/**
 * 轉換播放地址格式
 * @param {Object} episodes - 集數物件
 * @param {number|string} vodId - 影片 ID
 * @param {string} baseUrl - 基礎 URL
 * @returns {string} CMS10 播放地址格式
 */
function convertPlayUrl(episodes, vodId, baseUrl = "https://myself-bbs.jacob.workers.dev") {
  if (!episodes || typeof episodes !== 'object') {
    return "";
  }

  const playUrls = [];

  // 按集數順序排序
  const sortedEpisodes = Object.entries(episodes).sort(([a], [b]) => {
    const numA = extractEpisodeNumber(a);
    const numB = extractEpisodeNumber(b);
    return numA - numB;
  });

  for (const [episodeName, episodeData] of sortedEpisodes) {
    if (Array.isArray(episodeData) && episodeData.length >= 2) {
      const [id, ep] = episodeData;
      const playUrl = `${baseUrl}/m3u8/${id}/${ep}`;
      playUrls.push(`${episodeName}$${playUrl}`);
    }
  }

  return playUrls.join('#');
}

/**
 * 從集數名稱中提取數字
 * @param {string} episodeName - 集數名稱
 * @returns {number} 集數數字
 */
function extractEpisodeNumber(episodeName) {
  const match = episodeName.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}
```

### 3.4 其他輔助函式

```javascript
/**
 * 格式化備註資訊
 * @param {Object} item - 項目資料
 * @returns {string} 格式化後的備註
 */
function formatRemarks(item) {
  if (item.ep && item.ep > 0) {
    return `第${item.ep}集`;
  }

  // 根據狀態判斷
  if (item.status === 'completed') {
    return "已完結";
  } else if (item.status === 'airing') {
    return "連載中";
  }

  return "更新中";
}

/**
 * 判斷連載狀態
 * @param {Object} item - 項目資料
 * @returns {string} 連載狀態 ("0"=完結, "1"=連載中)
 */
function determineSerialStatus(item) {
  // 如果有明確的狀態標識
  if (item.status === 'completed') {
    return "0";
  } else if (item.status === 'airing') {
    return "1";
  }

  // 根據集數判斷 (簡化邏輯)
  if (item.ep && item.ep >= 12) {
    return "0"; // 假設 12 集以上為完結
  }

  return "1"; // 預設為連載中
}

/**
 * 提取演員資訊
 * @param {Object} item - 項目資料
 * @returns {string} 演員列表
 */
function extractActors(item) {
  // 動畫通常沒有演員，可以提取聲優資訊
  if (item.voice_actors && Array.isArray(item.voice_actors)) {
    return item.voice_actors.join(',');
  }

  // 如果有其他相關資訊可以提取
  if (item.cast) {
    return item.cast;
  }

  return ""; // 動畫預設為空
}
```

## 4. 分頁處理函式

### 4.1 分頁計算器

```javascript
/**
 * 計算分頁資訊
 * @param {number} total - 總資料數量
 * @param {number} page - 當前頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 分頁資訊
 */
function calculatePagination(total, page = 1, limit = 20) {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // 限制最大每頁數量
  const totalNum = Math.max(0, parseInt(total));

  const pagecount = Math.ceil(totalNum / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = Math.min(startIndex + limitNum, totalNum);

  return {
    page: pageNum,
    limit: limitNum,
    total: totalNum,
    pagecount,
    startIndex,
    endIndex,
    hasNext: pageNum < pagecount,
    hasPrev: pageNum > 1
  };
}
```

### 4.2 資料分頁器

```javascript
/**
 * 對資料進行分頁處理
 * @param {Array} data - 原始資料陣列
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 分頁結果
 */
function paginateData(data, page = 1, limit = 20) {
  if (!Array.isArray(data)) {
    return {
      data: [],
      pagination: calculatePagination(0, page, limit)
    };
  }

  const pagination = calculatePagination(data.length, page, limit);
  const paginatedData = data.slice(pagination.startIndex, pagination.endIndex);

  return {
    data: paginatedData,
    pagination
  };
}
```

## 5. 完整轉換流程函式

### 5.1 列表轉換流程

```javascript
/**
 * 完整的列表轉換流程
 * @param {Object} myselfData - Myself-BBS 原始資料
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 */
function convertListResponse(myselfData, query = {}, options = {}) {
  try {
    // 1. 提取資料
    const items = myselfData?.data?.data || [];

    // 2. 應用篩選 (如果需要)
    let filteredItems = items;

    if (query.t) {
      filteredItems = filterByCategory(filteredItems, query.t);
    }

    if (query.wd) {
      filteredItems = searchByKeyword(filteredItems, query.wd);
    }

    if (query.h) {
      filteredItems = filterByUpdateTime(filteredItems, query.h);
    }

    if (query.ids) {
      const ids = query.ids.split(',').map(id => parseInt(id));
      filteredItems = filteredItems.filter(item => ids.includes(item.id));
    }

    // 3. 分頁處理
    const { data: paginatedData, pagination } = paginateData(
      filteredItems,
      query.pg,
      query.limit || 20
    );

    // 4. 轉換為 CMS10 格式
    const cms10Items = batchConvertItems(paginatedData, 'list', options);

    // 5. 建立回應
    return createSuccessResponse(cms10Items, pagination);

  } catch (error) {
    console.error('列表轉換失敗:', error);
    return createErrorResponse(0, `轉換失敗: ${error.message}`);
  }
}
```

### 5.2 詳情轉換流程

```javascript
/**
 * 完整的詳情轉換流程
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 */
function convertDetailResponse(detailItems, query = {}, options = {}) {
  try {
    // 1. 過濾有效項目
    const validItems = detailItems.filter(item => item && item.id);

    if (validItems.length === 0) {
      return createErrorResponse(-2, "找不到指定的資料");
    }

    // 2. 應用時間篩選 (如果需要)
    let filteredItems = validItems;

    if (query.h) {
      filteredItems = filterByUpdateTime(filteredItems, query.h);
    }

    // 3. 轉換為 CMS10 格式
    const cms10Items = batchConvertItems(filteredItems, 'detail', options);

    // 4. 建立回應 (詳情通常不分頁)
    return createSuccessResponse(cms10Items, {
      page: 1,
      limit: cms10Items.length,
      total: cms10Items.length
    });

  } catch (error) {
    console.error('詳情轉換失敗:', error);
    return createErrorResponse(0, `轉換失敗: ${error.message}`);
  }
}
```

## 6. 驗證函式

### 6.1 資料完整性驗證

```javascript
/**
 * 驗證 CMS10 項目資料完整性
 * @param {Object} item - CMS10 項目
 * @returns {Object} 驗證結果
 */
function validateCms10Item(item) {
  const errors = [];
  const warnings = [];

  // 必要欄位檢查
  const requiredFields = ['vod_id', 'vod_name', 'type_id', 'type_name'];

  for (const field of requiredFields) {
    if (!item.hasOwnProperty(field) || item[field] === null || item[field] === undefined) {
      errors.push(`缺少必要欄位: ${field}`);
    }
  }

  // 資料類型檢查
  if (item.vod_id && !Number.isInteger(item.vod_id)) {
    errors.push('vod_id 必須為整數');
  }

  if (item.type_id && !Number.isInteger(item.type_id)) {
    errors.push('type_id 必須為整數');
  }

  // 資料格式檢查
  if (item.vod_time && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(item.vod_time)) {
    warnings.push('vod_time 格式不正確，應為 YYYY-MM-DD HH:mm:ss');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

### 6.2 回應格式驗證

```javascript
/**
 * 驗證 CMS10 回應格式
 * @param {Object} response - CMS10 回應物件
 * @returns {Object} 驗證結果
 */
function validateCms10Response(response) {
  const errors = [];

  // 基本結構檢查
  const requiredFields = ['code', 'msg', 'page', 'pagecount', 'limit', 'total', 'list'];

  for (const field of requiredFields) {
    if (!response.hasOwnProperty(field)) {
      errors.push(`回應缺少必要欄位: ${field}`);
    }
  }

  // 資料類型檢查
  if (response.code !== undefined && !Number.isInteger(response.code)) {
    errors.push('code 必須為整數');
  }

  if (response.page !== undefined && !Number.isInteger(response.page)) {
    errors.push('page 必須為整數');
  }

  if (response.list !== undefined && !Array.isArray(response.list)) {
    errors.push('list 必須為陣列');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 7. 使用範例

### 7.1 基本使用範例

```javascript
// 轉換列表資料
const myselfListData = {
  data: {
    meta: { time: Date.now(), length: 100 },
    data: [
      { id: 1, title: "進擊的巨人", category: ["動作"], ep: 25 }
    ]
  }
};

const cms10Response = convertListResponse(myselfListData, { pg: 1 });
console.log(cms10Response);

// 轉換詳情資料
const detailItem = {
  id: 1,
  title: "進擊的巨人",
  category: ["動作", "劇情"],
  description: "故事描述...",
  episodes: { "第 01 話": ["1", "001"] }
};

const cms10Detail = convertDetailResponse([detailItem]);
console.log(cms10Detail);
```

### 7.2 錯誤處理範例

```javascript
// 處理無效資料
try {
  const result = convertListResponse(null);
  console.log(result); // 會回傳錯誤回應
} catch (error) {
  console.error('轉換失敗:', error);
}

// 驗證轉換結果
const response = convertListResponse(data);
const validation = validateCms10Response(response);

if (!validation.isValid) {
  console.error('回應格式錯誤:', validation.errors);
}
```

## 8. 效能優化建議

1. **快取轉換結果**: 對於相同的輸入資料，快取轉換結果
2. **批次處理**: 大量資料時使用批次轉換
3. **延遲載入**: 只在需要時進行詳細轉換
4. **記憶體管理**: 及時清理不需要的中間資料
5. **錯誤恢復**: 單個項目轉換失敗不影響整體流程

## 9. 注意事項

1. **資料完整性**: 確保所有必要欄位都有適當的預設值
2. **錯誤處理**: 妥善處理各種異常情況
3. **效能考量**: 大量資料轉換時注意記憶體使用
4. **相容性**: 確保轉換結果符合 CMS10 標準
5. **可維護性**: 保持函式模組化和可測試性