# CMS10 第二階段：實作計劃和優先級

**規格異動日期時間**: 2025-07-26 16:57:00 (UTC+8)

## 實作優先級

### 🔴 高優先級 (核心功能)

#### 1. Episodes 格式檢測器

**檔案**: `src/cms10/episode-detector.js`
**預估時間**: 30 分鐘
**依賴**: 無

```javascript
// 核心功能：自動識別兩種 episodes 格式
export function detectEpisodesFormat(episodes)
export const EPISODE_FORMATS = { PLAY_PATH, ENCODED_ID, UNKNOWN }
```

#### 2. M3U8 URL 生成器

**檔案**: `src/cms10/url-generators.js`
**預估時間**: 45 分鐘
**依賴**: episode-detector.js

```javascript
// 核心功能：生成兩種格式的 M3U8 URL
export function generatePlayPathUrl(playPath)
export function generateEncodedIdUrl(encodedId)
```

#### 3. 增強版轉換器

**檔案**: `src/cms10/converters.js` (更新)
**預估時間**: 30 分鐘
**依賴**: episode-detector.js, url-generators.js

```javascript
// 核心功能：整合新的 URL 生成邏輯
function convertPlayUrlEnhanced(episodes, vodId, options)
```

### 🟡 中優先級 (整合和優化)

#### 4. 處理器更新

**檔案**: `src/cms10/handlers.js` (更新)
**預估時間**: 20 分鐘
**依賴**: 增強版轉換器

#### 5. 錯誤處理增強

**檔案**: 各模組
**預估時間**: 30 分鐘
**依賴**: 核心功能完成

### 🟢 低優先級 (測試和文件)

#### 6. 測試套件

**檔案**: `src/cms10/tests/phase2-tests.js`
**預估時間**: 60 分鐘
**依賴**: 所有核心功能

#### 7. 文件更新

**檔案**: 各種 .md 檔案
**預估時間**: 30 分鐘
**依賴**: 功能完成

## 詳細實作步驟

### 步驟 1: Episodes 格式檢測器

```javascript
/**
 * src/cms10/episode-detector.js
 *
 * 功能：
 * - 自動檢測 episodes 資料格式
 * - 支援 play_path 和 encoded_id 兩種格式
 * - 提供詳細的格式分析
 */

// 實作重點：
// 1. 正則表達式模式匹配
// 2. 資料驗證和邊界檢查
// 3. 錯誤處理和日誌記錄
```

**驗收標準**:

- ✅ 正確識別 `"play/46442/001"` 格式
- ✅ 正確識別 `"AgADMg4AAvWkAVc"` 格式
- ✅ 處理無效或混合格式
- ✅ 提供詳細的錯誤訊息

### 步驟 2: M3U8 URL 生成器

```javascript
/**
 * src/cms10/url-generators.js
 *
 * 功能：
 * - 生成 vpx 格式的 M3U8 URL
 * - 生成 hls 格式的 M3U8 URL
 * - 支援不同品質選項
 */

// 實作重點：
// 1. URL 模板和參數替換
// 2. 編碼 ID 的分割邏輯
// 3. URL 驗證和格式化
```

**驗收標準**:

- ✅ `"play/46442/001"` → `"https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8"`
- ✅ `"AgADMg4AAvWkAVc"` → `"https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8"`
- ✅ 支援品質參數 (720p, 1080p)
- ✅ 處理無效輸入

### 步驟 3: 增強版轉換器

```javascript
/**
 * src/cms10/converters.js (更新)
 *
 * 功能：
 * - 整合格式檢測和 URL 生成
 * - 保持向後相容性
 * - 批量處理 episodes
 */

// 實作重點：
// 1. 與現有 convertPlayUrl 的整合
// 2. 批量處理和效能優化
// 3. CMS10 格式的正確組裝
```

**驗收標準**:

- ✅ 生成正確的 CMS10 `vod_play_url` 格式
- ✅ 支援集數排序
- ✅ 保持現有功能不受影響
- ✅ 處理空或無效的 episodes

## 測試策略

### 單元測試

```javascript
// 測試檔案結構
src/cms10/tests/
├── episode-detector.test.js
├── url-generators.test.js
├── converters.test.js
└── integration.test.js
```

### 測試案例設計

#### 格式檢測測試

```javascript
describe("Episode Format Detection", () => {
  test("should detect play_path format", () => {
    const episodes = { "第 01 話": "play/46442/001" };
    expect(detectEpisodesFormat(episodes)).toBe("play_path");
  });

  test("should detect encoded_id format", () => {
    const episodes = { "第 01 話": "AgADMg4AAvWkAVc" };
    expect(detectEpisodesFormat(episodes)).toBe("encoded_id");
  });
});
```

#### URL 生成測試

```javascript
describe("URL Generation", () => {
  test("should generate vpx URL correctly", () => {
    const result = generatePlayPathUrl("play/46442/001");
    expect(result).toBe("https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8");
  });

  test("should generate hls URL correctly", () => {
    const result = generateEncodedIdUrl("AgADMg4AAvWkAVc");
    expect(result).toBe("https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8");
  });
});
```

## 風險管控

### 技術風險

#### 🔴 高風險

- **編碼 ID 分割邏輯錯誤**
  - 風險：URL 生成不正確，影響播放功能
  - 緩解：詳細測試和驗證實際案例

#### 🟡 中風險

- **格式檢測誤判**
  - 風險：選擇錯誤的 URL 生成器
  - 緩解：嚴格的正則表達式和邊界測試

#### 🟢 低風險

- **效能影響**
  - 風險：新邏輯增加處理時間
  - 緩解：快取機制和批量處理優化

### 相容性風險

#### 向後相容性

- **現有 API 行為**：確保不影響現有功能
- **資料格式變更**：支援舊格式的平滑過渡
- **錯誤處理**：提供適當的降級機制

## 部署策略

### 階段性部署

#### 階段 1: 核心功能 (MVP)

- 格式檢測器
- URL 生成器
- 基本轉換邏輯

#### 階段 2: 增強功能

- 錯誤處理優化
- 效能優化
- 監控和日誌

#### 階段 3: 完整功能

- 完整測試覆蓋
- 文件更新
- 生產環境驗證

### 功能開關

```javascript
// 支援漸進式啟用新功能
const FEATURE_FLAGS = {
  ENHANCED_PLAY_URL: process.env.ENABLE_ENHANCED_PLAY_URL === "true",
  ENCODED_ID_SUPPORT: process.env.ENABLE_ENCODED_ID === "true",
};
```

## 成功指標

### 功能指標

- ✅ 支援兩種 episodes 格式
- ✅ URL 生成準確率 100%
- ✅ 向後相容性 100%
- ✅ 測試覆蓋率 ≥ 90%

### 效能指標

- ✅ API 回應時間增加 < 10%
- ✅ 記憶體使用增加 < 5%
- ✅ 錯誤率 < 0.1%

### 品質指標

- ✅ 程式碼審查通過
- ✅ 安全性檢查通過
- ✅ 文件完整性檢查通過

## 下一步行動

### 立即行動 (今天)

1. 🚀 **開始實作格式檢測器** - 30 分鐘
2. 🚀 **實作 URL 生成器** - 45 分鐘
3. 🚀 **整合轉換器邏輯** - 30 分鐘

### 短期行動 (本週)

1. 完成處理器更新
2. 建立測試套件
3. 進行整合測試

### 中期行動 (下週)

1. 效能優化
2. 文件完善
3. 生產環境部署

這個實作計劃確保了：

- **清晰的優先級**：先實作核心功能
- **可管理的步驟**：每個步驟都有明確的時間估算
- **風險控制**：識別並緩解主要風險
- **品質保證**：完整的測試和驗證策略
