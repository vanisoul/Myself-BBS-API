# CMS10 第二階段：vod_play_url 增強功能規格

## 專案概述

**規格異動日期時間**: 2025-07-26 16:55:00 (UTC+8)

本階段針對 CMS10 API 的 `ac=detail` 端點進行增強，實作完整的 `vod_play_url` 處理邏輯，支援兩種不同的 episodes 資料格式，並生成對應的 M3U8 播放連結。

## 需求分析

### 1. Episodes 資料格式

#### 格式 1：Play 路徑格式

```json
{
  "episodes": {
    "第 01 話 海的那邊": "play/46442/001",
    "第 02 話 暗夜列車": "play/46442/002",
    "第 03 話 希望之門": "play/46442/003",
    "第 04 話 手手相傳": "play/46442/004"
  }
}
```

**轉換規則**：

- 輸入：`"play/46442/001"`
- 輸出：`"https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8"`
- 邏輯：移除 `play/` 前綴，添加基礎 URL 和 `/720p.m3u8` 後綴

#### 格式 2：編碼 ID 格式

```json
{
  "episodes": {
    "第 01 話": "AgADMg4AAvWkAVc",
    "第 02 話": "AgADsA0AAjef-VU",
    "第 03 話": "AgADfAwAAqLbQVY"
  }
}
```

**轉換規則**：

- 輸入：`"AgADMg4AAvWkAVc"`
- 輸出：`"https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8"`
- 邏輯：將編碼 ID 按特定規則分割並組成 HLS 路徑

### 2. CMS10 vod_play_url 格式

最終輸出格式應符合 CMS10 標準：

```
第 01 話$https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8#第 02 話$https://vpx05.myself-bbs.com/vpx/46442/002/720p.m3u8
```

## 技術設計

### 1. Episodes 格式檢測機制

```javascript
/**
 * 檢測 episodes 資料格式
 * @param {Object} episodes - Episodes 物件
 * @returns {string} 格式類型 ('play_path' | 'encoded_id' | 'unknown')
 */
function detectEpisodesFormat(episodes)
```

**檢測邏輯**：

- 如果值包含 `"play/"` 前綴 → `play_path` 格式
- 如果值為純字母數字編碼 → `encoded_id` 格式
- 其他情況 → `unknown` 格式

### 2. M3U8 URL 生成器

#### 格式 1 處理器

```javascript
/**
 * 處理 play_path 格式的 episodes
 * @param {string} playPath - play/46442/001 格式的路徑
 * @returns {string} M3U8 URL
 */
function generatePlayPathUrl(playPath)
```

#### 格式 2 處理器

```javascript
/**
 * 處理 encoded_id 格式的 episodes
 * @param {string} encodedId - AgADMg4AAvWkAVc 格式的編碼 ID
 * @returns {string} M3U8 URL
 */
function generateEncodedIdUrl(encodedId)
```

**編碼 ID 分割邏輯**：

- `AgADMg4AAvWkAVc` → `Mg/4A/Av/AgADMg4AAvWkAVc`
- 取編碼 ID 的第 5-6、7-8、9-10 字符作為路徑分段

### 3. 增強版 convertPlayUrl 函式

```javascript
/**
 * 增強版播放地址轉換函式
 * @param {Object} episodes - 集數物件
 * @param {number|string} vodId - 影片 ID
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @param {string} options.quality - 影片品質 (720p, 1080p)
 * @returns {string} CMS10 播放地址格式
 */
function convertPlayUrlEnhanced(episodes, vodId, options = {})
```

## 實作計劃

### 階段 1：核心函式實作

1. **episodes 格式檢測器**

   - 實作 `detectEpisodesFormat()` 函式
   - 支援兩種格式的自動識別
   - 添加錯誤處理和邊界情況

2. **URL 生成器**
   - 實作 `generatePlayPathUrl()` 函式
   - 實作 `generateEncodedIdUrl()` 函式
   - 實作編碼 ID 分割邏輯

### 階段 2：轉換器更新

1. **更新 convertPlayUrl 函式**

   - 整合新的格式檢測和 URL 生成邏輯
   - 保持向後相容性
   - 添加詳細的錯誤處理

2. **更新 convertToDetailItem 函式**
   - 使用增強版的 convertPlayUrl
   - 確保正確處理兩種格式

### 階段 3：處理器整合

1. **更新 CMS10 詳情處理器**
   - 確保 `handleCms10Detail()` 使用新的轉換邏輯
   - 添加格式檢測日誌
   - 優化錯誤回應

### 階段 4：測試和驗證

1. **單元測試**

   - 測試兩種 episodes 格式
   - 測試邊界情況和錯誤處理
   - 測試 URL 生成正確性

2. **整合測試**
   - 測試完整的 API 流程
   - 驗證 CMS10 回應格式
   - 測試實際播放連結

## 品質保證

### 1. 錯誤處理

- 無效的 episodes 格式處理
- 網路錯誤和超時處理
- 資料轉換失敗的降級處理

### 2. 效能考量

- 批量處理多個 episodes
- 快取機制優化
- 記憶體使用優化

### 3. 相容性

- 保持與現有 API 的向後相容
- 支援舊版本的 episodes 格式
- 平滑的功能升級

## 測試案例

### 測試案例 1：Play Path 格式

```javascript
// 輸入
const episodes = {
  "第 01 話 海的那邊": "play/46442/001",
  "第 02 話 暗夜列車": "play/46442/002",
};

// 預期輸出
const expected =
  "第 01 話 海的那邊$https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8#第 02 話 暗夜列車$https://vpx05.myself-bbs.com/vpx/46442/002/720p.m3u8";
```

### 測試案例 2：Encoded ID 格式

```javascript
// 輸入
const episodes = {
  "第 01 話": "AgADMg4AAvWkAVc",
  "第 02 話": "AgADsA0AAjef-VU",
};

// 預期輸出
const expected =
  "第 01 話$https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8#第 02 話$https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8";
```

## 交付成果

1. **增強版轉換器模組** (`src/cms10/converters.js`)
2. **格式檢測器** (`src/cms10/episode-detector.js`)
3. **URL 生成器** (`src/cms10/url-generators.js`)
4. **更新的處理器** (`src/cms10/handlers.js`)
5. **測試套件** (`src/cms10/tests/phase2-tests.js`)
6. **技術文件** (`src/cms10/phase2-documentation.md`)

## 時程規劃

- **階段 1-2**: 核心功能實作 (預估 2-3 小時)
- **階段 3**: 處理器整合 (預估 1 小時)
- **階段 4**: 測試和驗證 (預估 1-2 小時)
- **總計**: 4-6 小時完成所有功能

## 風險評估

### 高風險

- 編碼 ID 分割邏輯的正確性
- 不同格式混合使用的處理

### 中風險

- 新舊格式的相容性問題
- 效能影響評估

### 低風險

- 測試覆蓋率不足
- 文件更新延遲

## 成功標準

1. ✅ 支援兩種 episodes 格式的自動檢測
2. ✅ 正確生成對應的 M3U8 播放連結
3. ✅ 保持 100% 向後相容性
4. ✅ 測試覆蓋率達到 90% 以上
5. ✅ API 回應時間不超過現有基準的 110%
6. ✅ 完整的技術文件和使用範例
