# CMS10 錯誤處理和狀態碼對應規劃

## 規格異動日期時間
**建立日期**: 2025-07-26 15:33:00 (UTC+8)
**版本**: v1.0

## 1. CMS10 狀態碼規範

### 1.1 標準狀態碼定義

| 狀態碼 | 說明 | 使用場景 | HTTP 狀態碼 |
|--------|------|----------|-------------|
| `1` | 請求成功 | 正常回傳資料 | 200 |
| `0` | 請求失敗 | 系統錯誤、網路錯誤 | 500 |
| `-1` | 參數錯誤 | 缺少必要參數、參數格式錯誤 | 400 |
| `-2` | 資料不存在 | 查詢結果為空、ID 不存在 | 404 |

### 1.2 擴展狀態碼 (可選)

| 狀態碼 | 說明 | 使用場景 |
|--------|------|----------|
| `-3` | 權限不足 | API 限制、存取控制 |
| `-4` | 請求頻率過高 | 速率限制 |
| `-5` | 服務維護中 | 系統維護 |

## 2. 錯誤處理架構

### 2.1 錯誤分類體系

```javascript
/**
 * 錯誤類型枚舉
 */
const ErrorTypes = {
  // 參數相關錯誤
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  PARAMETER_OUT_OF_RANGE: 'PARAMETER_OUT_OF_RANGE',

  // 資料相關錯誤
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_CORRUPTED: 'DATA_CORRUPTED',
  DATA_CONVERSION_FAILED: 'DATA_CONVERSION_FAILED',

  // 系統相關錯誤
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // 業務邏輯錯誤
  INVALID_OPERATION: 'INVALID_OPERATION',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED'
};
```

### 2.2 錯誤對應表

```javascript
/**
 * 錯誤類型到 CMS10 狀態碼的映射
 */
const ERROR_CODE_MAPPING = {
  // 參數錯誤 -> -1
  [ErrorTypes.MISSING_PARAMETER]: -1,
  [ErrorTypes.INVALID_PARAMETER]: -1,
  [ErrorTypes.PARAMETER_OUT_OF_RANGE]: -1,

  // 資料不存在 -> -2
  [ErrorTypes.DATA_NOT_FOUND]: -2,

  // 系統錯誤 -> 0
  [ErrorTypes.NETWORK_ERROR]: 0,
  [ErrorTypes.TIMEOUT_ERROR]: 0,
  [ErrorTypes.INTERNAL_ERROR]: 0,
  [ErrorTypes.DATA_CORRUPTED]: 0,
  [ErrorTypes.DATA_CONVERSION_FAILED]: 0,

  // 業務邏輯錯誤 -> 0
  [ErrorTypes.INVALID_OPERATION]: 0,
  [ErrorTypes.RESOURCE_LIMIT_EXCEEDED]: 0
};
```

## 3. 錯誤處理函式

### 3.1 自定義錯誤類別

```javascript
/**
 * CMS10 自定義錯誤類別
 */
class Cms10Error extends Error {
  constructor(type, message, details = {}) {
    super(message);
    this.name = 'Cms10Error';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  /**
   * 獲取對應的 CMS10 狀態碼
   * @returns {number} CMS10 狀態碼
   */
  getCms10Code() {
    return ERROR_CODE_MAPPING[this.type] || 0;
  }

  /**
   * 轉換為 CMS10 錯誤回應
   * @returns {Object} CMS10 錯誤回應格式
   */
  toCms10Response() {
    return {
      code: this.getCms10Code(),
      msg: this.message,
      page: 1,
      pagecount: 0,
      limit: "20",
      total: 0,
      list: []
    };
  }
}
```

### 3.2 錯誤工廠函式

```javascript
/**
 * 建立參數錯誤
 * @param {string} paramName - 參數名稱
 * @param {string} reason - 錯誤原因
 * @returns {Cms10Error} 錯誤物件
 */
function createParameterError(paramName, reason = '參數無效') {
  return new Cms10Error(
    ErrorTypes.INVALID_PARAMETER,
    `參數錯誤：${paramName} ${reason}`,
    { parameter: paramName, reason }
  );
}

/**
 * 建立資料不存在錯誤
 * @param {string} resource - 資源類型
 * @param {string|number} id - 資源 ID
 * @returns {Cms10Error} 錯誤物件
 */
function createDataNotFoundError(resource, id) {
  return new Cms10Error(
    ErrorTypes.DATA_NOT_FOUND,
    `資料不存在：找不到 ${resource} (ID: ${id})`,
    { resource, id }
  );
}

/**
 * 建立系統錯誤
 * @param {string} message - 錯誤訊息
 * @param {Error} originalError - 原始錯誤物件
 * @returns {Cms10Error} 錯誤物件
 */
function createSystemError(message, originalError = null) {
  return new Cms10Error(
    ErrorTypes.INTERNAL_ERROR,
    `系統錯誤：${message}`,
    { originalError: originalError?.message }
  );
}
```

### 3.3 錯誤處理中介軟體

```javascript
/**
 * 全域錯誤處理中介軟體
 * @param {Function} handler - 路由處理函式
 * @returns {Function} 包裝後的處理函式
 */
function withErrorHandling(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error('API 錯誤:', error);

      // 如果是自定義錯誤，直接轉換
      if (error instanceof Cms10Error) {
        return response({
          data: JSON.stringify(error.toCms10Response(), null, 2)
        });
      }

      // 處理其他類型的錯誤
      const cms10Error = mapErrorToCms10(error);
      return response({
        data: JSON.stringify(cms10Error.toCms10Response(), null, 2)
      });
    }
  };
}
```

## 4. 參數驗證

### 4.1 參數驗證器

```javascript
/**
 * 參數驗證規則
 */
const ValidationRules = {
  ac: {
    required: true,
    type: 'string',
    enum: ['list', 'detail'],
    message: 'ac 參數必須為 list 或 detail'
  },

  ids: {
    required: false,
    type: 'string',
    pattern: /^\d+(,\d+)*$/,
    message: 'ids 參數格式錯誤，應為數字或逗號分隔的數字列表'
  },

  pg: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
    message: 'pg 參數必須為 1-10000 之間的整數'
  },

  t: {
    required: false,
    type: 'number',
    min: 1,
    max: 99,
    message: 't 參數必須為 1-99 之間的整數'
  },

  h: {
    required: false,
    type: 'number',
    min: 1,
    max: 8760, // 一年的小時數
    message: 'h 參數必須為 1-8760 之間的整數'
  },

  wd: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    message: 'wd 參數長度必須為 1-100 字元'
  }
};

/**
 * 驗證單個參數
 * @param {string} name - 參數名稱
 * @param {any} value - 參數值
 * @param {Object} rule - 驗證規則
 * @returns {Object} 驗證結果
 */
function validateParameter(name, value, rule) {
  const errors = [];

  // 檢查必要參數
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`缺少必要參數：${name}`);
    return { isValid: false, errors };
  }

  // 如果參數不存在且非必要，跳過驗證
  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [] };
  }

  // 類型檢查
  if (rule.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${name} 必須為數字`);
    } else {
      value = numValue;

      // 範圍檢查
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${name} 不能小於 ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${name} 不能大於 ${rule.max}`);
      }
    }
  }

  // 字串檢查
  if (rule.type === 'string') {
    const strValue = String(value);

    // 長度檢查
    if (rule.minLength !== undefined && strValue.length < rule.minLength) {
      errors.push(`${name} 長度不能少於 ${rule.minLength} 字元`);
    }
    if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
      errors.push(`${name} 長度不能超過 ${rule.maxLength} 字元`);
    }

    // 格式檢查
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(rule.message || `${name} 格式錯誤`);
    }

    // 枚舉檢查
    if (rule.enum && !rule.enum.includes(strValue)) {
      errors.push(`${name} 必須為以下值之一：${rule.enum.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value
  };
}

/**
 * 驗證所有參數
 * @param {Object} query - 查詢參數物件
 * @returns {Object} 驗證結果
 */
function validateQuery(query) {
  const errors = [];
  const validatedParams = {};

  for (const [name, rule] of Object.entries(ValidationRules)) {
    const result = validateParameter(name, query[name], rule);

    if (!result.isValid) {
      errors.push(...result.errors);
    } else if (result.value !== undefined) {
      validatedParams[name] = result.value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    params: validatedParams
  };
}
```

### 4.2 特殊驗證邏輯

```javascript
/**
 * 業務邏輯驗證
 * @param {Object} params - 已驗證的參數
 * @returns {Object} 驗證結果
 */
function validateBusinessLogic(params) {
  const errors = [];

  // detail 操作必須提供 ids
  if (params.ac === 'detail' && !params.ids) {
    errors.push('detail 操作必須提供 ids 參數');
  }

  // 分頁參數合理性檢查
  if (params.pg && params.pg > 1000) {
    errors.push('頁碼過大，建議使用更精確的篩選條件');
  }

  // 搜尋關鍵字長度檢查
  if (params.wd && params.wd.length < 2) {
    errors.push('搜尋關鍵字至少需要 2 個字元');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 5. 錯誤回應格式化

### 5.1 錯誤訊息本地化

```javascript
/**
 * 錯誤訊息本地化
 */
const ErrorMessages = {
  'zh-TW': {
    [ErrorTypes.MISSING_PARAMETER]: '缺少必要參數',
    [ErrorTypes.INVALID_PARAMETER]: '參數格式錯誤',
    [ErrorTypes.DATA_NOT_FOUND]: '找不到指定的資料',
    [ErrorTypes.NETWORK_ERROR]: '網路連線錯誤',
    [ErrorTypes.INTERNAL_ERROR]: '系統內部錯誤',
    [ErrorTypes.TIMEOUT_ERROR]: '請求逾時'
  },

  'en': {
    [ErrorTypes.MISSING_PARAMETER]: 'Missing required parameter',
    [ErrorTypes.INVALID_PARAMETER]: 'Invalid parameter format',
    [ErrorTypes.DATA_NOT_FOUND]: 'Data not found',
    [ErrorTypes.NETWORK_ERROR]: 'Network connection error',
    [ErrorTypes.INTERNAL_ERROR]: 'Internal server error',
    [ErrorTypes.TIMEOUT_ERROR]: 'Request timeout'
  }
};

/**
 * 獲取本地化錯誤訊息
 * @param {string} errorType - 錯誤類型
 * @param {string} locale - 語言代碼
 * @returns {string} 本地化錯誤訊息
 */
function getLocalizedErrorMessage(errorType, locale = 'zh-TW') {
  return ErrorMessages[locale]?.[errorType] || ErrorMessages['zh-TW'][errorType] || '未知錯誤';
}
```

### 5.2 詳細錯誤資訊

```javascript
/**
 * 建立詳細錯誤回應
 * @param {Cms10Error} error - 錯誤物件
 * @param {boolean} includeDetails - 是否包含詳細資訊
 * @returns {Object} 詳細錯誤回應
 */
function createDetailedErrorResponse(error, includeDetails = false) {
  const baseResponse = error.toCms10Response();

  if (includeDetails && process.env.NODE_ENV === 'development') {
    baseResponse.debug = {
      type: error.type,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack
    };
  }

  return baseResponse;
}
```

## 6. 錯誤監控和日誌

### 6.1 錯誤日誌記錄

```javascript
/**
 * 錯誤日誌記錄器
 */
class ErrorLogger {
  /**
   * 記錄錯誤
   * @param {Error} error - 錯誤物件
   * @param {Object} context - 上下文資訊
   */
  static log(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        type: error.type || 'UNKNOWN',
        stack: error.stack
      },
      context: {
        url: context.url,
        method: context.method,
        query: context.query,
        userAgent: context.userAgent,
        ip: context.ip
      }
    };

    // 根據錯誤嚴重程度選擇日誌級別
    if (error instanceof Cms10Error && error.getCms10Code() === -1) {
      console.warn('參數錯誤:', JSON.stringify(logEntry, null, 2));
    } else if (error instanceof Cms10Error && error.getCms10Code() === -2) {
      console.info('資料不存在:', JSON.stringify(logEntry, null, 2));
    } else {
      console.error('系統錯誤:', JSON.stringify(logEntry, null, 2));
    }
  }
}
```

### 6.2 錯誤統計

```javascript
/**
 * 錯誤統計收集器
 */
class ErrorStats {
  constructor() {
    this.stats = new Map();
  }

  /**
   * 記錄錯誤統計
   * @param {string} errorType - 錯誤類型
   */
  record(errorType) {
    const current = this.stats.get(errorType) || 0;
    this.stats.set(errorType, current + 1);
  }

  /**
   * 獲取錯誤統計
   * @returns {Object} 錯誤統計資料
   */
  getStats() {
    return Object.fromEntries(this.stats);
  }

  /**
   * 重置統計
   */
  reset() {
    this.stats.clear();
  }
}

const errorStats = new ErrorStats();
```

## 7. 實際應用範例

### 7.1 路由錯誤處理

```javascript
/**
 * CMS10 列表端點錯誤處理範例
 */
router.get("/api.php/provide/vod/", withErrorHandling(async (request) => {
  const { query } = request;

  // 1. 參數驗證
  const validation = validateQuery(query);
  if (!validation.isValid) {
    throw createParameterError('query', validation.errors.join('; '));
  }

  // 2. 業務邏輯驗證
  const businessValidation = validateBusinessLogic(validation.params);
  if (!businessValidation.isValid) {
    throw createParameterError('business', businessValidation.errors.join('; '));
  }

  // 3. 處理請求
  const { ac } = validation.params;

  switch (ac) {
    case 'list':
      return await handleCms10List(validation.params);

    case 'detail':
      return await handleCms10Detail(validation.params);

    default:
      throw createParameterError('ac', '不支援的操作類型');
  }
}));
```

### 7.2 資料處理錯誤處理

```javascript
/**
 * 資料轉換錯誤處理範例
 */
async function handleCms10List(params) {
  try {
    // 獲取資料
    const [airing, completed] = await Promise.all([
      getAiringList().catch(err => {
        throw createSystemError('無法獲取連載列表', err);
      }),
      getCompletedList().catch(err => {
        throw createSystemError('無法獲取完結列表', err);
      })
    ]);

    // 檢查資料有效性
    if (!airing?.data?.data || !completed?.data?.data) {
      throw createDataNotFoundError('anime_list', 'all');
    }

    // 合併和處理資料
    const allData = [...airing.data.data, ...completed.data.data];

    if (allData.length === 0) {
      throw createDataNotFoundError('anime', 'any');
    }

    // 轉換為 CMS10 格式
    const result = convertListResponse({ data: { data: allData } }, params);

    return response({
      data: JSON.stringify(result, null, 2)
    });

  } catch (error) {
    // 記錄錯誤
    ErrorLogger.log(error, { operation: 'list', params });
    errorStats.record(error.type || 'UNKNOWN');

    // 重新拋出錯誤讓中介軟體處理
    throw error;
  }
}
```

## 8. 錯誤恢復策略

### 8.1 自動重試機制

```javascript
/**
 * 帶重試的資料獲取
 * @param {Function} fetchFunction - 獲取函式
 * @param {number} maxRetries - 最大重試次數
 * @param {number} delay - 重試延遲 (毫秒)
 * @returns {Promise} 獲取結果
 */
async function fetchWithRetry(fetchFunction, maxRetries = 3, delay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fetchFunction();
    } catch (error) {
      lastError = error;

      if (i < maxRetries) {
        console.warn(`重試 ${i + 1}/${maxRetries}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw createSystemError('重試失敗', lastError);
}
```

### 8.2 降級處理

```javascript
/**
 * 降級處理策略
 * @param {Function} primaryFunction - 主要處理函式
 * @param {Function} fallbackFunction - 降級處理函式
 * @returns {Promise} 處理結果
 */
async function withFallback(primaryFunction, fallbackFunction) {
  try {
    return await primaryFunction();
  } catch (error) {
    console.warn('主要處理失敗，使用降級方案:', error.message);

    try {
      return await fallbackFunction();
    } catch (fallbackError) {
      throw createSystemError('主要和降級處理都失敗', fallbackError);
    }
  }
}
```

## 9. 測試錯誤處理

### 9.1 錯誤場景測試

```javascript
/**
 * 錯誤處理測試用例
 */
const errorTestCases = [
  {
    name: '缺少必要參數',
    query: {},
    expectedCode: -1,
    expectedMessage: /缺少必要參數/
  },

  {
    name: '無效的 ac 參數',
    query: { ac: 'invalid' },
    expectedCode: -1,
    expectedMessage: /ac 參數必須為/
  },

  {
    name: '無效的 ids 格式',
    query: { ac: 'detail', ids: 'abc,def' },
    expectedCode: -1,
    expectedMessage: /ids 參數格式錯誤/
  },

  {
    name: '不存在的資料',
    query: { ac: 'detail', ids: '999999' },
    expectedCode: -2,
    expectedMessage: /資料不存在/
  }
];
```

## 10. 最佳實踐

### 10.1 錯誤處理原則

1. **一致性**: 所有錯誤都使用統一的格式和狀態碼
2. **可讀性**: 錯誤訊息清晰明確，便於理解和除錯
3. **安全性**: 不洩露敏感的系統資訊
4. **可監控性**: 記錄足夠的資訊用於問題追蹤
5. **用戶友好**: 提供有意義的錯誤訊息和建議

### 10.2 效能考量

1. **快速失敗**: 儘早發現和回報錯誤
2. **避免級聯失敗**: 單個組件失敗不影響整體服務
3. **資源清理**: 錯誤發生時及時清理資源
4. **快取錯誤**: 避免重複處理相同的錯誤

### 10.3 維護建議

1. **定期檢查**: 定期檢查錯誤日誌和統計
2. **更新訊息**: 根據用戶反饋更新錯誤訊息
3. **效能監控**: 監控錯誤處理的效能影響
4. **文件更新**: 保持錯誤處理文件的更新