# 🚀 CMS10 API 本地測試指南

## 📋 快速開始

### 1. 環境準備

確保您的系統已安裝：

- **Node.js**: 18+ 版本
- **pnpm**: 8.15.8+ (推薦) 或 npm

### 2. 安裝依賴

```bash
# 使用 pnpm (推薦)
pnpm install

# 或使用 npm
npm install
```

### 3. 啟動本地伺服器

```bash
# 方法一：使用本地開發伺服器 (推薦用於測試)
npm run dev:local

# 方法二：使用 Cloudflare Workers 開發環境
npm run dev
```

### 4. 驗證服務運行

開啟瀏覽器訪問：

```
http://localhost:3000/api.php/provide/vod/health
```

如果看到健康檢查回應，表示服務正常運行。

## 🧪 自動化測試

### 執行完整的 API 測試

```bash
# 確保伺服器在另一個終端運行
npm run dev:local

# 在新終端執行測試
node test-cms10-api.js
```

### 執行單元測試

```bash
# 執行 CMS10 模組測試
npm run test:cms10

# 監視模式 (開發時使用)
npm run test:cms10:watch

# 生成覆蓋率報告
npm run test:cms10:coverage
```

## 🌐 API 端點測試

### 原有 API 端點 (向後相容)

```bash
# 連載列表
curl "http://localhost:3000/list/airing"

# 完結列表
curl "http://localhost:3000/list/completed"

# 動畫詳情
curl "http://localhost:3000/anime/52369"

# 搜尋功能
curl "http://localhost:3000/search/進擊的巨人"
```

### CMS10 標準 API 端點

#### 列表查詢

```bash
# 基本列表
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist"

# 分頁查詢
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&pg=1&limit=10"

# 分類篩選 (動作分類)
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&t=1"

# 搜尋功能
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&wd=巨人"

# 時間篩選 (最近24小時)
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&h=24"

# 組合查詢
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&t=1&pg=1&limit=5"
```

#### 詳情查詢

```bash
# 單個詳情
curl "http://localhost:3000/api.php/provide/vod/?ac=detail&ids=1"

# 多個詳情
curl "http://localhost:3000/api.php/provide/vod/?ac=detail&ids=1,2,3"
```

### 擴展功能端點

```bash
# 分類列表
curl "http://localhost:3000/api.php/provide/vod/categories"

# API 資訊
curl "http://localhost:3000/api.php/provide/vod/info"

# 健康檢查
curl "http://localhost:3000/api.php/provide/vod/health"
```

## 📊 回應格式驗證

### CMS10 標準回應格式

所有 CMS10 API 都會返回以下格式：

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
      "vod_time": "2025-07-26 16:05:00",
      "vod_remarks": "第25集",
      "vod_play_from": "myself-bbs",
      "vod_pic": "https://example.com/image.jpg"
    }
  ]
}
```

### 詳情回應額外欄位

詳情查詢 (`ac=detail`) 會包含額外欄位：

```json
{
  "vod_area": "日本",
  "vod_lang": "日語",
  "vod_year": "2013",
  "vod_serial": "0",
  "vod_actor": "",
  "vod_director": "荒木哲郎",
  "vod_content": "故事描述...",
  "vod_play_url": "第 01 話$http://localhost:3000/m3u8/1/001#第 02 話$http://localhost:3000/m3u8/1/002"
}
```

## 🚨 錯誤處理測試

### 測試錯誤場景

```bash
# 缺少必要參數
curl "http://localhost:3000/api.php/provide/vod/"

# 無效的操作類型
curl "http://localhost:3000/api.php/provide/vod/?ac=invalid"

# detail 操作缺少 ids
curl "http://localhost:3000/api.php/provide/vod/?ac=detail"

# 無效的頁碼
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&pg=0"

# 無效的分類 ID
curl "http://localhost:3000/api.php/provide/vod/?ac=videolist&t=999"
```

### 錯誤回應格式

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

## 🔧 開發工具

### 使用 Postman 或類似工具

1. 匯入以下環境變數：

   ```
   BASE_URL = http://localhost:3000
   ```

2. 建立測試集合，包含上述所有端點

### 使用瀏覽器開發者工具

1. 開啟瀏覽器開發者工具 (F12)
2. 在 Console 中執行：

```javascript
// 測試 CMS10 列表 API
fetch("http://localhost:3000/api.php/provide/vod/?ac=videolist&limit=5")
  .then((response) => response.json())
  .then((data) => console.log(data));

// 測試 CMS10 詳情 API
fetch("http://localhost:3000/api.php/provide/vod/?ac=detail&ids=1")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 📈 效能測試

### 基本效能測試

```bash
# 使用 curl 測試回應時間
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api.php/provide/vod/?ac=videolist"
```

建立 `curl-format.txt` 檔案：

```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### 並行測試

```bash
# 使用 ab (Apache Bench) 進行壓力測試
ab -n 100 -c 10 "http://localhost:3000/api.php/provide/vod/?ac=videolist"
```

## 🐛 問題排查

### 常見問題

1. **伺服器無法啟動**

   ```bash
   # 檢查端口是否被占用
   lsof -i :3000

   # 使用不同端口
   PORT=3001 npm run dev:local
   ```

2. **模組找不到錯誤**

   ```bash
   # 重新安裝依賴
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **測試失敗**

   ```bash
   # 檢查伺服器是否運行
   curl http://localhost:3000/api.php/provide/vod/health

   # 查看伺服器日誌
   npm run dev:local
   ```

### 除錯模式

```bash
# 啟用詳細日誌
DEBUG=* npm run dev:local

# 或設定環境變數
NODE_ENV=development npm run dev:local
```

## 📝 測試檢查清單

### 功能測試

- [ ] 原有 API 端點正常運作
- [ ] CMS10 列表 API 返回正確格式
- [ ] CMS10 詳情 API 返回正確格式
- [ ] 分頁功能正常
- [ ] 搜尋功能正常
- [ ] 分類篩選正常
- [ ] 錯誤處理正確

### 相容性測試

- [ ] 向後相容性保持
- [ ] CMS10 標準格式符合
- [ ] 所有必要欄位存在
- [ ] 資料類型正確

### 效能測試

- [ ] 回應時間 < 3 秒
- [ ] 記憶體使用正常
- [ ] 並行請求處理正常

## 🚀 部署前檢查

在部署到生產環境前，請確保：

1. **所有測試通過**

   ```bash
   npm run test:cms10
   node test-cms10-api.js
   ```

2. **覆蓋率達標**

   ```bash
   npm run test:cms10:coverage
   # 確保覆蓋率 ≥ 80%
   ```

3. **效能符合要求**

   - 列表查詢 < 3 秒
   - 詳情查詢 < 5 秒
   - 健康檢查 < 1 秒

4. **安全性檢查**
   - 參數驗證正常
   - 錯誤訊息不洩露敏感資訊
   - CORS 設定正確

## 💡 提示和技巧

### 快速測試命令

```bash
# 一鍵測試所有功能
npm run dev:local & sleep 3 && node test-cms10-api.js && kill %1

# 快速健康檢查
curl -s http://localhost:3000/api.php/provide/vod/health | jq .

# 快速格式檢查
curl -s "http://localhost:3000/api.php/provide/vod/?ac=videolist&limit=1" | jq .
```

### 開發建議

1. **使用 JSON 格式化工具**：安裝 `jq` 來格式化 JSON 輸出
2. **設定別名**：在 `.bashrc` 或 `.zshrc` 中設定常用命令別名
3. **使用 API 測試工具**：推薦 Postman、Insomnia 或 REST Client

---

**測試愉快！** 🎉

如有問題，請參考：

- [CMS10 模組文件](src/cms10/README.md)
- [錯誤處理規格](src/cms10/errors.md)
- [API 端點規格](src/cms10/endpoints.md)
