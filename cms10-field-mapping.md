# CMS10 資料欄位映射表

## 規格異動日期時間
**建立日期**: 2025-07-26 15:27:00 (UTC+8)
**版本**: v1.0

## 1. 列表 API 欄位映射

### 1.1 基本回應結構映射

```javascript
// Myself-BBS 原始格式
{
  "data": {
    "meta": {
      "time": 1630391759999,
      "length": 1753
    },
    "data": [...]
  }
}

// CMS10 目標格式
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 88,
  "limit": "20",
  "total": 1753,
  "list": [...]
}
```

### 1.2 映射函式邏輯

```javascript
/**
 * 轉換基本回應結構
 * @param {Object} myselfData - Myself-BBS 原始資料
 * @param {number} page - 當前頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} CMS10 格式回應結構
 */
function convertBaseResponse(myselfData, page = 1, limit = 20) {
  const total = myselfData.data.meta.length;
  const pagecount = Math.ceil(total / limit);

  return {
    code: 1,
    msg: "數據列表",
    page: parseInt(page),
    pagecount: pagecount,
    limit: limit.toString(),
    total: total,
    list: [] // 將由具體映射函式填入
  };
}
```

## 2. 影片資料欄位映射

### 2.1 列表項目映射

| Myself-BBS 欄位 | CMS10 欄位 | 資料類型 | 轉換邏輯 | 範例 |
|-----------------|------------|----------|----------|------|
| `id` | `vod_id` | number | 直接對應 | `12345` |
| `title` | `vod_name` | string | 直接對應 | `"進擊的巨人"` |
| `title` | `vod_en` | string | 直接使用原標題 | `"進擊的巨人"` |
| `image` | `vod_pic` | string | 直接對應 | `"https://example.com/cover.jpg"` |
| `category[0]` | `type_name` | string | 取第一個分類 | `"動作"` |
| `category` | `type_id` | number | 查詢分類映射表 | `1` |
| `ep` | `vod_remarks` | string | 格式化集數資訊 | `"第12集"` |
| `meta.time` | `vod_time` | string | 時間戳轉換 | `"2024-01-15 20:50:19"` |
| - | `vod_play_from` | string | 固定值 | `"myself-bbs"` |

### 2.2 詳情項目額外映射

| Myself-BBS 欄位 | CMS10 欄位 | 資料類型 | 轉換邏輯 | 範例 |
|-----------------|------------|----------|----------|------|
| `description` | `vod_content` | string | 直接對應 | `"故事描述..."` |
| `author` | `vod_director` | string | 直接對應 | `"諫山創"` |
| `premiere[0]` | `vod_year` | string | 取年份並轉為字串 | `"2013"` |
| `episodes` | `vod_play_url` | string | 轉換播放地址格式 | `"第1集$https://..."` |
| - | `vod_area` | string | 根據來源設定 | `"日本"` |
| - | `vod_lang` | string | 根據分類推斷 | `"日語"` |
| - | `vod_serial` | string | 根據狀態設定 | `"0"` |
| - | `vod_actor` | string | 可從其他欄位推導 | `"聲優列表"` |

## 3. 分類系統映射表

### 3.1 動畫分類對應

```javascript
const CATEGORY_MAPPING = {
  // 動作類
  "動作": { type_id: 1, type_name: "動作" },
  "格鬥": { type_id: 1, type_name: "動作" },
  "戰鬥": { type_id: 1, type_name: "動作" },

  // 冒險類
  "冒險": { type_id: 2, type_name: "冒險" },
  "探險": { type_id: 2, type_name: "冒險" },

  // 科幻類
  "科幻": { type_id: 3, type_name: "科幻" },
  "機甲": { type_id: 3, type_name: "科幻" },
  "未來": { type_id: 3, type_name: "科幻" },

  // 奇幻類
  "奇幻": { type_id: 4, type_name: "奇幻" },
  "魔法": { type_id: 4, type_name: "奇幻" },
  "異世界": { type_id: 4, type_name: "奇幻" },

  // 日常類
  "日常": { type_id: 5, type_name: "日常" },
  "校園": { type_id: 5, type_name: "日常" },
  "青春": { type_id: 5, type_name: "日常" },

  // 戀愛類
  "戀愛": { type_id: 6, type_name: "戀愛" },
  "浪漫": { type_id: 6, type_name: "戀愛" },

  // 喜劇類
  "喜劇": { type_id: 7, type_name: "喜劇" },
  "搞笑": { type_id: 7, type_name: "喜劇" },

  // 劇情類
  "劇情": { type_id: 8, type_name: "劇情" },
  "人性": { type_id: 8, type_name: "劇情" },

  // 懸疑類
  "懸疑": { type_id: 9, type_name: "懸疑" },
  "推理": { type_id: 9, type_name: "懸疑" },
  "偵探": { type_id: 9, type_name: "懸疑" },

  // 恐怖類
  "恐怖": { type_id: 10, type_name: "恐怖" },
  "驚悚": { type_id: 10, type_name: "恐怖" },

  // 預設分類
  "其他": { type_id: 99, type_name: "其他" }
};

/**
 * 獲取分類映射
 * @param {Array} categories - Myself-BBS 分類陣列
 * @returns {Object} 包含 type_id 和 type_name 的物件
 */
function getCategoryMapping(categories) {
  if (!categories || categories.length === 0) {
    return CATEGORY_MAPPING["其他"];
  }

  const firstCategory = categories[0];
  return CATEGORY_MAPPING[firstCategory] || CATEGORY_MAPPING["其他"];
}
```

## 4. 時間格式轉換

### 4.1 時間戳轉換函式

```javascript
/**
 * 將 Unix 時間戳轉換為 CMS10 格式
 * @param {number} timestamp - Unix 時間戳 (毫秒)
 * @returns {string} CMS10 時間格式 "YYYY-MM-DD HH:mm:ss"
 */
function convertTimestamp(timestamp) {
  if (!timestamp) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  const date = new Date(timestamp);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 將 premiere 陣列轉換為年份字串
 * @param {Array} premiere - [年, 月, 日] 格式陣列
 * @returns {string} 年份字串
 */
function convertPremiereToYear(premiere) {
  if (!premiere || !Array.isArray(premiere) || premiere.length === 0) {
    return new Date().getFullYear().toString();
  }

  return premiere[0].toString();
}
```

## 5. 播放地址格式轉換

### 5.1 Episodes 轉換邏輯

```javascript
/**
 * 轉換播放地址格式
 * @param {Object} episodes - Myself-BBS episodes 物件
 * @param {number} vodId - 影片 ID
 * @param {string} baseUrl - 基礎 URL
 * @returns {string} CMS10 播放地址格式
 */
function convertPlayUrl(episodes, vodId, baseUrl = "https://myself-bbs.jacob.workers.dev") {
  if (!episodes || typeof episodes !== 'object') {
    return "";
  }

  const playUrls = [];

  for (const [episodeName, episodeData] of Object.entries(episodes)) {
    if (Array.isArray(episodeData) && episodeData.length >= 2) {
      const [id, ep] = episodeData;
      const playUrl = `${baseUrl}/m3u8/${id}/${ep}`;
      playUrls.push(`${episodeName}$${playUrl}`);
    }
  }

  return playUrls.join('#');
}
```

### 5.2 播放地址範例

```javascript
// Myself-BBS 原始格式
{
  "episodes": {
    "第 01 話": ["12345", "001"],
    "第 02 話": ["12345", "002"],
    "第 03 話": ["12345", "003"]
  }
}

// CMS10 轉換後格式
"vod_play_url": "第 01 話$https://myself-bbs.jacob.workers.dev/m3u8/12345/001#第 02 話$https://myself-bbs.jacob.workers.dev/m3u8/12345/002#第 03 話$https://myself-bbs.jacob.workers.dev/m3u8/12345/003"
```

## 6. 完整映射函式

### 6.1 列表項目映射函式

```javascript
/**
 * 轉換列表項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 列表項目
 * @returns {Object} CMS10 格式列表項目
 */
function convertListItem(item) {
  const categoryMapping = getCategoryMapping(item.category);

  return {
    vod_id: item.id,
    vod_name: item.title,
    type_id: categoryMapping.type_id,
    type_name: categoryMapping.type_name,
    vod_en: item.title,
    vod_time: convertTimestamp(item.time || Date.now()),
    vod_remarks: item.ep ? `第${item.ep}集` : "更新中",
    vod_play_from: "myself-bbs",
    vod_pic: item.image || ""
  };
}
```

### 6.2 詳情項目映射函式

```javascript
/**
 * 轉換詳情項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 詳情項目
 * @returns {Object} CMS10 格式詳情項目
 */
function convertDetailItem(item) {
  const categoryMapping = getCategoryMapping(item.category);
  const listItem = convertListItem(item);

  return {
    ...listItem,
    vod_area: "日本",
    vod_lang: "日語",
    vod_year: convertPremiereToYear(item.premiere),
    vod_serial: item.ep ? "0" : "1", // 0=完結, 1=連載中
    vod_actor: "", // 動畫通常沒有演員資訊
    vod_director: item.author || "",
    vod_content: item.description || "",
    vod_play_url: convertPlayUrl(item.episodes, item.id)
  };
}
```

## 7. 輔助函式

### 7.1 資料驗證函式

```javascript
/**
 * 驗證 CMS10 格式資料完整性
 * @param {Object} item - CMS10 格式項目
 * @returns {boolean} 是否通過驗證
 */
function validateCms10Item(item) {
  const requiredFields = ['vod_id', 'vod_name', 'type_id', 'type_name'];

  return requiredFields.every(field =>
    item.hasOwnProperty(field) && item[field] !== null && item[field] !== undefined
  );
}
```

## 8. 使用範例

### 8.1 列表轉換範例

```javascript
// 輸入: Myself-BBS 列表資料
const myselfListData = {
  data: {
    meta: { time: 1630391759999, length: 100 },
    data: [
      {
        id: 12345,
        title: "進擊的巨人",
        category: ["動作", "劇情"],
        ep: 25,
        image: "https://example.com/cover.jpg",
        watch: 148111
      }
    ]
  }
};

// 輸出: CMS10 格式
const cms10ListData = {
  code: 1,
  msg: "數據列表",
  page: 1,
  pagecount: 5,
  limit: "20",
  total: 100,
  list: [
    {
      vod_id: 12345,
      vod_name: "進擊的巨人",
      type_id: 1,
      type_name: "動作",
      vod_en: "進擊的巨人",
      vod_time: "2021-08-31 07:35:59",
      vod_remarks: "第25集",
      vod_play_from: "myself-bbs",
      vod_pic: "https://example.com/cover.jpg"
    }
  ]
};
```

## 9. 注意事項

1. **資料完整性**: 確保所有必要欄位都有預設值
2. **效能考量**: 大量資料轉換時考慮批次處理
3. **錯誤處理**: 對於缺失或異常資料提供適當的預設值
4. **擴展性**: 映射表設計應便於後續維護和擴展
5. **相容性**: 確保轉換後的資料符合 CMS10 標準規範