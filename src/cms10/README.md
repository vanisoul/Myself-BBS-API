# CMS10 轉換模組

將 Myself-BBS API 轉換為符合 CMS10 標準的影片 API 模組。

## 📋 目錄

- [功能特色](#功能特色)
- [快速開始](#快速開始)
- [API 端點](#api-端點)
- [安裝和配置](#安裝和配置)
- [使用範例](#使用範例)
- [測試](#測試)
- [部署](#部署)
- [貢獻指南](#貢獻指南)

## ✨ 功能特色

- 🔄 **完整轉換**: 將 Myself-BBS 資料格式轉換為 CMS10 標準
- 🛡️ **向後相容**: 保持原有 API 端點不變
- 🚀 **高效能**: 優化的資料處理和快取機制
- 🔍 **豐富篩選**: 支援分類、搜尋、時間等多維度篩選
- 📊 **分頁支援**: 完整的分頁功能
- 🛠️ **錯誤處理**: 完善的錯誤處理和驗證機制
- 📝 **完整測試**: 高覆蓋率的測試套件
- 📚 **詳細文件**: 完整的 API 文件和使用指南

## 🚀 快速開始

### 基本使用

```javascript
import { handleCms10Request } from './cms10/index.js';

// 處理 CMS10 列表請求
const listResponse = await handleCms10Request({
  ac: 'list',
  pg: '1',
  limit: '20'
});

// 處理 CMS10 詳情請求
const detailResponse = await handleCms10Request({
  ac: 'detail',
  ids: '1,2,3'
});
```

### 路由整合

```javascript
import { integrateCms10Routes } from './cms10/routes.js';
import { Router } from 'itty-router';

const router = Router();
integrateCms10Routes(router);
```

## 🌐 API 端點

### CMS10 標準端點

#### 列表 API
```
GET /api.php/provide/vod/?ac=list
```

**參數**:
- `ac` (必要): 操作類型，固定為 "list"
- `pg` (可選): 頁碼，預設 1
- `limit` (可選): 每頁數量，預設 20，最大 100
- `t` (可選): 分類 ID，1-99
- `wd` (可選): 搜尋關鍵字
- `h` (可選): 更新時間篩選 (小時)

**範例**:
```bash
# 基本列表
curl "https://api.example.com/api.php/provide/vod/?ac=list"

# 分頁查詢
curl "https://api.example.com/api.php/provide/vod/?ac=list&pg=2&limit=10"

# 分類篩選
curl "https://api.example.com/api.php/provide/vod/?ac=list&t=1"

# 搜尋
curl "https://api.example.com/api.php/provide/vod/?ac=list&wd=進擊的巨人"
```

#### 詳情 API
```
GET /api.php/provide/vod/?ac=detail&ids=1,2,3
```

**參數**:
- `ac` (必要): 操作類型，固定為 "detail"
- `ids` (必要): ID 列表，逗號分隔
- `h` (可選): 更新時間篩選 (小時)

**範例**:
```bash
# 單個詳情
curl "https://api.example.com/api.php/provide/vod/?ac=detail&ids=1"

# 多個詳情
curl "https://api.example.com/api.php/provide/vod/?ac=detail&ids=1,2,3"
```

### 擴展功能端點

#### 分類列表
```
GET /api.php/provide/vod/categories
```

#### API 資訊
```
GET /api.php/provide/vod/info
```

#### 健康檢查
```
GET /api.php/provide/vod/health
```

### 原有端點 (保持不變)

- `GET /list/airing` - 連載列表
- `GET /list/completed` - 完結列表
- `GET /anime/:id` - 動畫詳情
- `GET /search/:query` - 搜尋
- `GET /m3u8/:id/:ep` - 播放地址

## 📦 安裝和配置

### 1. 安裝依賴

```bash
npm install itty-router fuse.js
```

### 2. 環境配置

```javascript
// 配置選項
const config = {
  baseUrl: 'https://your-api-domain.com',
  defaultLimit: 20,
  maxLimit: 100,
  timezone: 'Asia/Taipei'
};
```

### 3. 路由整合

```javascript
// src/main.js
import { Router } from "itty-router";
import { integrateCms10Routes } from "./cms10/routes.js";

const router = Router();
integrateCms10Routes(router);

export default {
  async fetch(request, environment, context) {
    try {
      return await router.handle(request);
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
```

## 💡 使用範例

### 基本轉換

```javascript
import { convertListResponse, convertDetailResponse } from './cms10/index.js';

// 轉換列表資料
const myselfData = {
  data: {
    data: [
      { id: 1, title: "進擊的巨人", category: ["動作"] }
    ]
  }
};

const cms10Response = convertListResponse(myselfData, { pg: 1, limit: 20 });
console.log(cms10Response);
```

### 錯誤處理

```javascript
import { withErrorHandling, createParameterError } from './cms10/index.js';

const handler = withErrorHandling(async (request) => {
  const { query } = request;

  if (!query.ac) {
    throw createParameterError('ac', '為必要參數');
  }

  // 處理邏輯...
});
```

### 參數驗證

```javascript
import { validateFullQuery, createValidationError } from './cms10/index.js';

const validation = validateFullQuery(query);
if (!validation.isValid) {
  throw createValidationError([...validation.errors, ...validation.businessErrors]);
}
```

## 🧪 測試

### 執行測試

```bash
# 執行所有測試
npm run test:cms10

# 執行特定測試
npm run test:cms10 -- converters.test.js

# 監視模式
npm run test:cms10 -- --watch

# 覆蓋率報告
npm run test:cms10 -- --coverage
```

### 測試結構

```
src/cms10/tests/
├── converters.test.js    # 轉換器測試
├── errors.test.js        # 錯誤處理測試
├── integration.test.js   # 整合測試
├── jest.config.js        # Jest 配置
└── setup.js              # 測試環境設定
```

### 覆蓋率要求

- 全域覆蓋率: ≥ 80%
- 核心模組覆蓋率: ≥ 90%

## 🚀 部署

### Cloudflare Workers

```bash
# 建置
npm run build

# 部署
npm run publish
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 環境變數

```bash
NODE_ENV=production
BASE_URL=https://your-api-domain.com
DEFAULT_LIMIT=20
MAX_LIMIT=100
TIMEZONE=Asia/Taipei
```

## 📊 效能指標

- **列表查詢**: < 3 秒
- **詳情查詢**: < 5 秒
- **健康檢查**: < 1 秒
- **錯誤處理**: < 100ms
- **記憶體使用**: 線性增長
- **並行支援**: 是

## 🔧 配置選項

### 預設配置

```javascript
export const DEFAULT_CONFIG = {
  baseUrl: 'https://myself-bbs.jacob.workers.dev',
  defaultLimit: 20,
  maxLimit: 100,
  timezone: 'Asia/Taipei'
};
```

### 自定義配置

```javascript
import { handleCms10Request } from './cms10/index.js';

const customOptions = {
  baseUrl: 'https://custom-domain.com',
  defaultLimit: 50
};

const response = await handleCms10Request(query, customOptions);
```

## 🛠️ 開發指南

### 新增分類

1. 更新 `CATEGORY_MAPPING` 常數
2. 確保 type_id 唯一性
3. 更新測試用例
4. 更新文件

### 新增端點

1. 在 `handlers.js` 中實作處理器
2. 在 `routes.js` 中添加路由
3. 更新 `index.js` 匯出
4. 添加測試用例

### 錯誤處理

1. 使用 `Cms10Error` 類別
2. 選擇適當的錯誤類型
3. 提供清晰的錯誤訊息
4. 添加錯誤測試

## 📚 文件

- [轉換器規格](./converters.md)
- [錯誤處理規格](./errors.md)
- [API 端點規格](./endpoints.md)
- [測試規格](./tests.md)

## 🤝 貢獻指南

### 開發流程

1. Fork 專案
2. 建立功能分支
3. 實作功能和測試
4. 確保測試通過
5. 提交 Pull Request

### 程式碼規範

- 使用 ESLint 和 Prettier
- 遵循現有的命名規範
- 添加適當的註解
- 保持測試覆蓋率

### 提交規範

```
feat: 新增功能
fix: 修復錯誤
docs: 更新文件
test: 添加測試
refactor: 重構程式碼
```

## 📄 授權

MIT License

## 🆘 支援

如有問題或建議，請：

1. 查看文件和 FAQ
2. 搜尋現有 Issues
3. 建立新的 Issue
4. 聯繫維護團隊

## 📈 版本歷史

### v1.0.0 (2025-07-26)

- ✅ 完整的 CMS10 轉換功能
- ✅ 向後相容性保證
- ✅ 完整的錯誤處理機制
- ✅ 高覆蓋率測試套件
- ✅ 詳細的 API 文件

## 🔮 未來計劃

- [ ] GraphQL 支援
- [ ] WebSocket 即時更新
- [ ] 進階快取策略
- [ ] 分散式部署支援
- [ ] 監控和指標收集
- [ ] 自動化效能測試

---

**專案狀態**: ✅ 生產就緒
**維護狀態**: 🟢 積極維護
**最後更新**: 2025-07-26