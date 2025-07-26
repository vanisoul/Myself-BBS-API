/**
 * CMS10 錯誤處理和狀態碼對應
 *
 * 此模組包含 CMS10 標準的錯誤處理機制，包括自定義錯誤類別、錯誤工廠函式和錯誤映射
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:45:00 (UTC+8)
 */

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

/**
 * CMS10 自定義錯誤類別
 *
 * @example
 * const error = new Cms10Error(ErrorTypes.INVALID_PARAMETER, "參數格式錯誤", {parameter: "ac"});
 * console.log(error.getCms10Code()); // -1
 */
class Cms10Error extends Error {
  /**
   * 建立 CMS10 錯誤實例
   * @param {string} type - 錯誤類型 (來自 ErrorTypes)
   * @param {string} message - 錯誤訊息
   * @param {Object} details - 錯誤詳細資訊
   */
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
   *
   * @example
   * error.getCms10Code() // 返回: -1, 0, -2 等
   */
  getCms10Code() {
    return ERROR_CODE_MAPPING[this.type] || 0;
  }

  /**
   * 轉換為 CMS10 錯誤回應
   * @returns {Object} CMS10 錯誤回應格式
   *
   * @example
   * error.toCms10Response()
   * // 返回: {code: -1, msg: "參數錯誤", page: 1, pagecount: 0, limit: "20", total: 0, list: []}
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

/**
 * 建立參數錯誤
 * @param {string} paramName - 參數名稱
 * @param {string} reason - 錯誤原因
 * @returns {Cms10Error} 錯誤物件
 *
 * @example
 * createParameterError("ac", "必須為 list 或 detail")
 * // 返回: Cms10Error 實例
 */
function createParameterError(paramName, reason = '參數無效') {
  return new Cms10Error(
    ErrorTypes.INVALID_PARAMETER,
    `參數錯誤：${paramName} ${reason}`,
    { parameter: paramName, reason }
  );
}

/**
 * 建立缺少參數錯誤
 * @param {string} paramName - 參數名稱
 * @returns {Cms10Error} 錯誤物件
 *
 * @example
 * createMissingParameterError("ac")
 * // 返回: Cms10Error 實例
 */
function createMissingParameterError(paramName) {
  return new Cms10Error(
    ErrorTypes.MISSING_PARAMETER,
    `缺少必要參數：${paramName}`,
    { parameter: paramName }
  );
}

/**
 * 建立資料不存在錯誤
 * @param {string} resource - 資源類型
 * @param {string|number} id - 資源 ID
 * @returns {Cms10Error} 錯誤物件
 *
 * @example
 * createDataNotFoundError("anime", 123)
 * // 返回: Cms10Error 實例
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
 *
 * @example
 * createSystemError("網路連線失敗", networkError)
 * // 返回: Cms10Error 實例
 */
function createSystemError(message, originalError = null) {
  return new Cms10Error(
    ErrorTypes.INTERNAL_ERROR,
    `系統錯誤：${message}`,
    { originalError: originalError?.message }
  );
}

/**
 * 建立網路錯誤
 * @param {string} message - 錯誤訊息
 * @param {Error} originalError - 原始錯誤物件
 * @returns {Cms10Error} 錯誤物件
 *
 * @example
 * createNetworkError("API 請求失敗", fetchError)
 * // 返回: Cms10Error 實例
 */
function createNetworkError(message, originalError = null) {
  return new Cms10Error(
    ErrorTypes.NETWORK_ERROR,
    `網路錯誤：${message}`,
    { originalError: originalError?.message }
  );
}

/**
 * 建立資料轉換錯誤
 * @param {string} message - 錯誤訊息
 * @param {Object} data - 相關資料
 * @returns {Cms10Error} 錯誤物件
 *
 * @example
 * createDataConversionError("無法轉換項目", {id: 123})
 * // 返回: Cms10Error 實例
 */
function createDataConversionError(message, data = {}) {
  return new Cms10Error(
    ErrorTypes.DATA_CONVERSION_FAILED,
    `資料轉換失敗：${message}`,
    { data }
  );
}

/**
 * 將一般錯誤映射為 CMS10 錯誤
 * @param {Error} error - 原始錯誤物件
 * @returns {Cms10Error} CMS10 錯誤物件
 *
 * @example
 * mapErrorToCms10(new TypeError("Invalid type"))
 * // 返回: Cms10Error 實例
 */
function mapErrorToCms10(error) {
  if (error instanceof Cms10Error) {
    return error;
  }

  // 根據錯誤類型進行映射
  if (error instanceof TypeError) {
    return createParameterError('type', error.message);
  }

  if (error instanceof RangeError) {
    return new Cms10Error(
      ErrorTypes.PARAMETER_OUT_OF_RANGE,
      `參數超出範圍：${error.message}`,
      { originalError: error.message }
    );
  }

  if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
    return createNetworkError(error.message, error);
  }

  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return new Cms10Error(
      ErrorTypes.TIMEOUT_ERROR,
      `請求逾時：${error.message}`,
      { originalError: error.message }
    );
  }

  // 預設為系統錯誤
  return createSystemError(error.message, error);
}

/**
 * 錯誤訊息本地化
 */
const ErrorMessages = {
  'zh-TW': {
    [ErrorTypes.MISSING_PARAMETER]: '缺少必要參數',
    [ErrorTypes.INVALID_PARAMETER]: '參數格式錯誤',
    [ErrorTypes.PARAMETER_OUT_OF_RANGE]: '參數超出範圍',
    [ErrorTypes.DATA_NOT_FOUND]: '找不到指定的資料',
    [ErrorTypes.DATA_CORRUPTED]: '資料已損壞',
    [ErrorTypes.DATA_CONVERSION_FAILED]: '資料轉換失敗',
    [ErrorTypes.NETWORK_ERROR]: '網路連線錯誤',
    [ErrorTypes.INTERNAL_ERROR]: '系統內部錯誤',
    [ErrorTypes.TIMEOUT_ERROR]: '請求逾時',
    [ErrorTypes.INVALID_OPERATION]: '無效的操作',
    [ErrorTypes.RESOURCE_LIMIT_EXCEEDED]: '資源限制超出'
  },

  'en': {
    [ErrorTypes.MISSING_PARAMETER]: 'Missing required parameter',
    [ErrorTypes.INVALID_PARAMETER]: 'Invalid parameter format',
    [ErrorTypes.PARAMETER_OUT_OF_RANGE]: 'Parameter out of range',
    [ErrorTypes.DATA_NOT_FOUND]: 'Data not found',
    [ErrorTypes.DATA_CORRUPTED]: 'Data corrupted',
    [ErrorTypes.DATA_CONVERSION_FAILED]: 'Data conversion failed',
    [ErrorTypes.NETWORK_ERROR]: 'Network connection error',
    [ErrorTypes.INTERNAL_ERROR]: 'Internal server error',
    [ErrorTypes.TIMEOUT_ERROR]: 'Request timeout',
    [ErrorTypes.INVALID_OPERATION]: 'Invalid operation',
    [ErrorTypes.RESOURCE_LIMIT_EXCEEDED]: 'Resource limit exceeded'
  }
};

/**
 * 獲取本地化錯誤訊息
 * @param {string} errorType - 錯誤類型
 * @param {string} locale - 語言代碼
 * @returns {string} 本地化錯誤訊息
 *
 * @example
 * getLocalizedErrorMessage(ErrorTypes.INVALID_PARAMETER, 'zh-TW')
 * // 返回: "參數格式錯誤"
 */
function getLocalizedErrorMessage(errorType, locale = 'zh-TW') {
  return ErrorMessages[locale]?.[errorType] || ErrorMessages['zh-TW'][errorType] || '未知錯誤';
}

export {
  ErrorTypes,
  ERROR_CODE_MAPPING,
  Cms10Error,
  createParameterError,
  createMissingParameterError,
  createDataNotFoundError,
  createSystemError,
  createNetworkError,
  createDataConversionError,
  mapErrorToCms10,
  ErrorMessages,
  getLocalizedErrorMessage
};