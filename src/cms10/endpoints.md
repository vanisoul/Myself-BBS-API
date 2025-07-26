# CMS10 API 端點實作規格

## 規格異動日期時間

**建立日期**: 2025-07-26 15:51:00 (UTC+8)
**版本**: v1.0.0
**實作狀態**: ✅ 已完成

## 1. 實作概覽

本次實作完成了 CMS10 API 端點的完整功能，包含以下主要組件：

### 1.1 模組結構

```
src/cms10/
├── handlers.js     # API 端點處理器
├── routes.js       # 路由定義和整合
└── endpoints.md    # 本規格文件
```

### 1.2 核心功能

- ✅ CMS10 標準 API 端點實作
- ✅ 路由整合和配置
- ✅ 向後相容性保證
- ✅ 擴展功能端點
- ✅ 健康檢查和監控
- ✅ 完整的錯誤處理
- ✅ 路由文件生成

## 2. API 端點架構

### 2.1 端點分類

```
現有端點 (保留)                    新增 CMS10 端點
├── /list/airing                  ├── /api.php/provide/vod/?ac=videolist
├── /list/completed               ├── /api.php/provide/vod/?ac=videolist
├── /anime/{id}                   ├── /api.php/provide/vod/categories (擴展)
├── /anime/all                    ├── /api.php/provide/vod/info (擴展)
├── /search/{query}               └── /api.php/provide/vod/health (擴展)
└── /m3u8/{id}/{ep}
```

### 2.2 路由優先級

1. **CMS10 路由** (`/api.php/*`) - 最高優先級
2. **原有路由** (其他路徑) - 保持不變
3. **未知路由** (`*`) - 錯誤處理

## 3. CMS10 標準端點

### 3.1 列表 API

```
GET /api.php/provide/vod/?ac=videolist
```

**參數**:

- `ac` (必要): 操作類型，固定為 "list"
- `pg` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20，最大 100
- `t` (可選): 分類 ID，1-99
- `wd` (可選): 搜尋關鍵字，1-100 字元
- `h` (可選): 更新時間篩選，小時數 1-8760

**回應格式**:

```json
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 5,
  "limit": "20",
  "total": 100,
  "list": [
    {
      "vod_id": 1,
      "vod_name": "進擊的巨人",
      "type_id": 1,
      "type_name": "動作",
      "vod_en": "Attack on Titan",
      "vod_time": "2025-07-26 15:51:00",
      "vod_remarks": "第25集",
      "vod_play_from": "myself-bbs",
      "vod_pic": "https://example.com/image.jpg"
    }
  ]
}
```

### 3.2 詳情 API

```
GET /api.php/provide/vod/?ac=videolist&ids=1,2,3
```

**參數**:

- `ac` (必要): 操作類型，固定為 "detail"
- `ids` (必要): ID 列表，逗號分隔，最多 50 個
- `h` (可選): 更新時間篩選，小時數 1-8760

**回應格式**:

```json
{
  "code": 1,
  "msg": "數據列表",
  "page": 1,
  "pagecount": 1,
  "limit": "3",
  "total": 3,
  "list": [
    {
      "vod_id": 1,
      "vod_name": "進擊的巨人",
      "type_id": 1,
      "type_name": "動作",
      "vod_en": "Attack on Titan",
      "vod_time": "2025-07-26 15:51:00",
      "vod_remarks": "已完結",
      "vod_play_from": "myself-bbs",
      "vod_pic": "https://example.com/image.jpg",
      "vod_area": "日本",
      "vod_lang": "日語",
      "vod_year": "2013",
      "vod_serial": "0",
      "vod_actor": "",
      "vod_director": "荒木哲郎",
      "vod_content": "故事描述...",
      "vod_play_url": "第 01 話$https://api.example.com/m3u8/1/001#第 02 話$https://api.example.com/m3u8/1/002"
    }
  ]
}
```

## 4. 擴展功能端點

### 4.1 分類列表

```
GET /api.php/provide/vod/categories
```

**功能**: 獲取所有可用的分類列表
**回應**: 包含所有分類的 CMS10 格式回應

### 4.2 API 資訊

```
GET /api.php/provide/vod/info
```

**功能**: 獲取 API 版本和功能資訊
**回應**: 包含 API 文件和使用說明

### 4.3 健康檢查

```
GET /api.php/provide/vod/health
```

**功能**: 檢查服務健康狀態
**回應**: 包含服務狀態和回應時間

## 5. 處理器實作

### 5.1 handleCms10List 函式

```javascript
async function handleCms10List(query) {
  // 1. 參數驗證
  // 2. 獲取資料源
  // 3. 檢查資料有效性
  // 4. 合併資料源
  // 5. 轉換為 CMS10 格式
}
```

**實作特點**:

- 完整的參數驗證流程
- 多資料源並行獲取
- 容錯處理機制
- 自動資料合併和去重

### 5.2 handleCms10Detail 函式

```javascript
async function handleCms10Detail(query) {
  // 1. 參數驗證
  // 2. 解析 ID 列表
  // 3. 獲取詳情資料
  // 4. 轉換為 CMS10 格式
}
```

**實作特點**:

- ID 列表解析和驗證
- 並行獲取詳情資料
- 部分失敗容錯處理
- 詳情格式轉換

### 5.3 handleCms10Request 主路由器

```javascript
async function handleCms10Request(query) {
  switch (query.ac) {
    case 'list': return await handleCms10List(query);
    case 'detail': return await handleCms10Detail(query);
    default: throw createValidationError([...]);
  }
}
```

**實作特點**:

- 統一的入口點
- 操作類型路由
- 統一錯誤處理

## 6. 路由整合

### 6.1 CMS10 路由器

```javascript
function createCms10Router() {
  const cms10Router = Router();

  // 主要 API 端點
  cms10Router.get("/api.php/provide/vod/", withErrorHandling(handleCms10Request));

  // 擴展功能端點
  cms10Router.get("/api.php/provide/vod/categories", withErrorHandling(getCms10Categories));
  cms10Router.get("/api.php/provide/vod/info", withErrorHandling(getCms10Info));
  cms10Router.get("/api.php/provide/vod/health", withErrorHandling(healthCheck));

  return cms10Router;
}
```

### 6.2 主路由器整合

```javascript
function integrateCms10Routes(mainRouter) {
  const cms10Router = createCms10Router();
  mainRouter.all("/api.php/*", cms10Router.handle);
  return mainRouter;
}
```

**整合特點**:

- 非侵入式整合
- 保持原有路由不變
- 統一的錯誤處理
- 模組化設計

## 7. 錯誤處理整合

### 7.1 中介軟體包裝

所有 CMS10 端點都使用 `withErrorHandling` 中介軟體包裝：

```javascript
cms10Router.get(
  "/api.php/provide/vod/",
  withErrorHandling(async (request) => {
    const { query } = request;
    return await handleCms10Request(query);
  }),
);
```

### 7.2 錯誤回應格式

所有錯誤都轉換為標準 CMS10 格式：

```json
{
  "code": -1,
  "msg": "參數錯誤：ac 參數必須為 list 或 detail",
  "page": 1,
  "pagecount": 0,
  "limit": "20",
  "total": 0,
  "list": []
}
```

## 8. 向後相容性

### 8.1 原有端點保持不變

- `/list/airing` - 連載列表
- `/list/completed` - 完結列表
- `/anime/:id` - 動畫詳情
- `/search/:query` - 搜尋功能
- `/m3u8/:id/:ep` - 播放地址

### 8.2 路由優先級設計

```javascript
// CMS10 路由優先處理
router.all("/api.php/*", cms10Router.handle);

// 原有路由保持不變
router.get("/list/airing", ...);
router.get("/anime/:id", ...);
// ...

// 未知路由處理
router.all("*", ...);
```

## 9. 使用範例

### 9.1 基本列表查詢

```bash
# 獲取第一頁動畫列表
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/?ac=videolist&pg=1&limit=20"

# 搜尋動畫
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/?ac=videolist&wd=巨人"

# 分類篩選
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/?ac=videolist&t=1"
```

### 9.2 詳情查詢

```bash
# 獲取單個動畫詳情
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/?ac=videolist&ids=1"

# 獲取多個動畫詳情
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/?ac=videolist&ids=1,2,3"
```

### 9.3 擴展功能

```bash
# 獲取分類列表
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/categories"

# 獲取 API 資訊
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/info"

# 健康檢查
curl "https://myself-bbs.jacob.workers.dev/api.php/provide/vod/health"
```

## 10. 效能考量

### 10.1 並行處理

- 多資料源並行獲取
- 詳情資料並行查詢
- 非阻塞錯誤處理

### 10.2 快取策略

- 利用現有的資料快取機制
- 避免重複資料獲取
- 智能錯誤恢復

### 10.3 效能指標

- 列表查詢: < 3 秒
- 詳情查詢: < 5 秒
- 健康檢查: < 1 秒
- 錯誤處理: < 100ms

## 11. 安全性考量

### 11.1 參數驗證

- 嚴格的參數類型檢查
- 範圍和長度限制
- 特殊字元過濾

### 11.2 資料安全

- 不洩露內部錯誤資訊
- 統一的錯誤回應格式
- 敏感資料過濾

### 11.3 請求限制

- 支援請求頻率限制
- ID 列表數量限制
- 搜尋關鍵字長度限制

## 12. 監控和日誌

### 12.1 請求日誌

- 完整的請求上下文記錄
- 錯誤分類和統計
- 效能指標收集

### 12.2 健康監控

- 服務可用性檢查
- 資料源連線狀態
- 回應時間監控

## 13. 測試策略

### 13.1 單元測試

- 所有處理器函式
- 路由配置驗證
- 錯誤處理邏輯

### 13.2 整合測試

- 端到端 API 測試
- 錯誤場景測試
- 效能基準測試

### 13.3 相容性測試

- CMS10 標準相容性
- 原有 API 功能驗證
- 跨瀏覽器相容性

## 14. 部署配置

### 14.1 環境變數

```javascript
const DEFAULT_CONFIG = {
  baseUrl: "https://myself-bbs.jacob.workers.dev",
  defaultLimit: 20,
  maxLimit: 100,
  timezone: "Asia/Taipei",
};
```

### 14.2 功能開關

- CMS10 功能可選啟用
- 擴展功能獨立控制
- 錯誤處理級別配置

## 15. 文件生成

### 15.1 路由文件

```javascript
function generateRouteDocs() {
  return {
    title: "Myself-BBS API 路由文件",
    sections: [
      { title: "原有 API 端點", endpoints: [...] },
      { title: "CMS10 相容 API 端點", endpoints: [...] }
    ],
    examples: { legacy: [...], cms10: [...] }
  };
}
```

### 15.2 API 規格

- OpenAPI 3.0 相容格式
- 完整的參數說明
- 回應範例和錯誤碼

## 16. 維護指南

### 16.1 新增端點

1. 在 `handlers.js` 中實作處理器
2. 在 `routes.js` 中添加路由
3. 更新 `index.js` 匯出
4. 添加測試用例
5. 更新文件

### 16.2 修改現有端點

1. 保持向後相容性
2. 更新參數驗證規則
3. 修改處理邏輯
4. 更新測試用例
5. 記錄變更

### 16.3 效能優化

1. 監控回應時間
2. 優化資料獲取邏輯
3. 改善快取策略
4. 減少記憶體使用

## 17. 下一步計劃

### 17.1 立即任務

- [ ] 建立完整測試套件
- [ ] 效能基準測試
- [ ] 文件完善
- [ ] 部署驗證

### 17.2 未來增強

- [ ] GraphQL 支援
- [ ] WebSocket 即時更新
- [ ] 進階快取策略
- [ ] 分散式部署支援

---

**實作狀態**: ✅ CMS10 API 端點已完成
**下一階段**: 🚀 建立測試驗證
**預計完成時間**: 2025-07-26 17:00:00 (UTC+8)
