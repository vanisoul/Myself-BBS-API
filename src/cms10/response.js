/**
 * CMS10 回應格式標準化函式
 *
 * 此模組包含建立標準 CMS10 回應格式的所有函式，包括成功回應、錯誤回應和分頁處理
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:41:00 (UTC+8)
 */

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
 *
 * @example
 * createCms10Response({
 *   code: 1,
 *   msg: "數據列表",
 *   page: 1,
 *   pagecount: 5,
 *   limit: "20",
 *   total: 100,
 *   list: [...]
 * })
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

/**
 * 建立成功回應
 * @param {Array} data - 資料陣列
 * @param {Object} pagination - 分頁資訊
 * @param {number} pagination.page - 當前頁碼
 * @param {number} pagination.limit - 每頁數量
 * @param {number} pagination.total - 總資料數量
 * @returns {Object} CMS10 成功回應
 *
 * @example
 * createSuccessResponse([{vod_id: 1, vod_name: "動畫1"}], {page: 1, limit: 20, total: 50})
 * // 返回: {code: 1, msg: "數據列表", page: 1, pagecount: 3, limit: "20", total: 50, list: [...]}
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

/**
 * 建立錯誤回應
 * @param {number} code - 錯誤碼
 * @param {string} message - 錯誤訊息
 * @returns {Object} CMS10 錯誤回應
 *
 * @example
 * createErrorResponse(-1, "參數錯誤：缺少必要參數 ac")
 * // 返回: {code: -1, msg: "參數錯誤：缺少必要參數 ac", page: 1, pagecount: 0, limit: "20", total: 0, list: []}
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

/**
 * 計算分頁資訊
 * @param {number} total - 總資料數量
 * @param {number} page - 當前頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 分頁資訊
 *
 * @example
 * calculatePagination(100, 2, 20)
 * // 返回: {page: 2, limit: 20, total: 100, pagecount: 5, startIndex: 20, endIndex: 40, hasNext: true, hasPrev: true}
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

/**
 * 對資料進行分頁處理
 * @param {Array} data - 原始資料陣列
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 分頁結果
 *
 * @example
 * paginateData([1,2,3,4,5,6,7,8,9,10], 2, 3)
 * // 返回: {data: [4,5,6], pagination: {page: 2, limit: 3, total: 10, pagecount: 4, ...}}
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

/**
 * 驗證 CMS10 項目資料完整性
 * @param {Object} item - CMS10 項目
 * @returns {Object} 驗證結果
 *
 * @example
 * validateCms10Item({vod_id: 1, vod_name: "動畫", type_id: 1, type_name: "動作"})
 * // 返回: {isValid: true, errors: [], warnings: []}
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

/**
 * 驗證 CMS10 回應格式
 * @param {Object} response - CMS10 回應物件
 * @returns {Object} 驗證結果
 *
 * @example
 * validateCms10Response({code: 1, msg: "成功", page: 1, pagecount: 1, limit: "20", total: 1, list: []})
 * // 返回: {isValid: true, errors: []}
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

export {
  createCms10Response,
  createSuccessResponse,
  createErrorResponse,
  calculatePagination,
  paginateData,
  validateCms10Item,
  validateCms10Response
};