/**
 * CMS10 錯誤處理中介軟體和日誌記錄
 *
 * 此模組包含錯誤處理中介軟體、日誌記錄器和錯誤統計功能
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:47:00 (UTC+8)
 */

import { response } from '../response.js';
import { Cms10Error, mapErrorToCms10 } from './errors.js';

/**
 * 錯誤日誌記錄器
 */
class ErrorLogger {
  /**
   * 記錄錯誤
   * @param {Error} error - 錯誤物件
   * @param {Object} context - 上下文資訊
   * @param {string} context.url - 請求 URL
   * @param {string} context.method - HTTP 方法
   * @param {Object} context.query - 查詢參數
   * @param {string} context.userAgent - 用戶代理
   * @param {string} context.ip - IP 地址
   *
   * @example
   * ErrorLogger.log(error, {url: '/api.php/provide/vod/', method: 'GET', query: {ac: 'list'}})
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

  /**
   * 記錄效能資訊
   * @param {string} operation - 操作名稱
   * @param {number} duration - 執行時間 (毫秒)
   * @param {Object} metadata - 額外資訊
   *
   * @example
   * ErrorLogger.logPerformance('convertListResponse', 150, {itemCount: 100})
   */
  static logPerformance(operation, duration, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'PERFORMANCE',
      operation,
      duration,
      metadata
    };

    if (duration > 5000) { // 超過 5 秒記錄為警告
      console.warn('效能警告:', JSON.stringify(logEntry, null, 2));
    } else if (duration > 1000) { // 超過 1 秒記錄為資訊
      console.info('效能資訊:', JSON.stringify(logEntry, null, 2));
    }
  }
}

/**
 * 錯誤統計收集器
 */
class ErrorStats {
  constructor() {
    this.stats = new Map();
    this.startTime = Date.now();
  }

  /**
   * 記錄錯誤統計
   * @param {string} errorType - 錯誤類型
   * @param {Object} metadata - 額外資訊
   *
   * @example
   * errorStats.record('INVALID_PARAMETER', {parameter: 'ac'})
   */
  record(errorType, metadata = {}) {
    const current = this.stats.get(errorType) || { count: 0, lastOccurred: null, metadata: [] };
    current.count++;
    current.lastOccurred = new Date().toISOString();
    current.metadata.push({
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // 只保留最近 100 條記錄
    if (current.metadata.length > 100) {
      current.metadata = current.metadata.slice(-100);
    }

    this.stats.set(errorType, current);
  }

  /**
   * 獲取錯誤統計
   * @returns {Object} 錯誤統計資料
   *
   * @example
   * errorStats.getStats()
   * // 返回: {INVALID_PARAMETER: {count: 5, lastOccurred: '2025-07-26T...', metadata: [...]}}
   */
  getStats() {
    const result = {};
    for (const [errorType, data] of this.stats) {
      result[errorType] = {
        count: data.count,
        lastOccurred: data.lastOccurred,
        recentMetadata: data.metadata.slice(-10) // 只返回最近 10 條
      };
    }

    result._summary = {
      totalErrors: Array.from(this.stats.values()).reduce((sum, data) => sum + data.count, 0),
      uniqueErrorTypes: this.stats.size,
      uptime: Date.now() - this.startTime
    };

    return result;
  }

  /**
   * 重置統計
   */
  reset() {
    this.stats.clear();
    this.startTime = Date.now();
  }

  /**
   * 獲取錯誤率
   * @param {number} totalRequests - 總請求數
   * @returns {number} 錯誤率 (0-1)
   *
   * @example
   * errorStats.getErrorRate(1000) // 返回: 0.05 (5% 錯誤率)
   */
  getErrorRate(totalRequests) {
    const totalErrors = Array.from(this.stats.values()).reduce((sum, data) => sum + data.count, 0);
    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }
}

// 全域錯誤統計實例
const errorStats = new ErrorStats();

/**
 * 全域錯誤處理中介軟體
 * @param {Function} handler - 路由處理函式
 * @returns {Function} 包裝後的處理函式
 *
 * @example
 * router.get("/api.php/provide/vod/", withErrorHandling(async (request) => {
 *   // 處理邏輯
 * }));
 */
function withErrorHandling(handler) {
  return async (request) => {
    const startTime = Date.now();

    try {
      const result = await handler(request);

      // 記錄成功的效能資訊
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        ErrorLogger.logPerformance(handler.name || 'anonymous', duration, {
          url: request.url,
          success: true
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 提取請求上下文
      const context = extractRequestContext(request);

      // 記錄錯誤
      ErrorLogger.log(error, context);

      // 記錄效能資訊
      ErrorLogger.logPerformance(handler.name || 'anonymous', duration, {
        url: request.url,
        success: false,
        errorType: error.type || error.name
      });

      // 如果是自定義錯誤，直接轉換
      if (error instanceof Cms10Error) {
        errorStats.record(error.type, {
          url: context.url,
          parameter: error.details?.parameter
        });

        return response({
          data: JSON.stringify(error.toCms10Response(), null, 2)
        });
      }

      // 處理其他類型的錯誤
      const cms10Error = mapErrorToCms10(error);
      errorStats.record(cms10Error.type, {
        url: context.url,
        originalError: error.name
      });

      return response({
        data: JSON.stringify(cms10Error.toCms10Response(), null, 2)
      });
    }
  };
}

/**
 * 提取請求上下文資訊
 * @param {Request} request - 請求物件
 * @returns {Object} 上下文資訊
 *
 * @example
 * extractRequestContext(request)
 * // 返回: {url: '/api.php/provide/vod/', method: 'GET', query: {...}, userAgent: '...', ip: '...'}
 */
function extractRequestContext(request) {
  const url = new URL(request.url);

  return {
    url: url.pathname + url.search,
    method: request.method,
    query: Object.fromEntries(url.searchParams),
    userAgent: request.headers.get('User-Agent') || 'Unknown',
    ip: request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        request.headers.get('X-Real-IP') ||
        'Unknown'
  };
}

/**
 * 建立詳細錯誤回應 (開發模式)
 * @param {Cms10Error} error - 錯誤物件
 * @param {boolean} includeDetails - 是否包含詳細資訊
 * @returns {Object} 詳細錯誤回應
 *
 * @example
 * createDetailedErrorResponse(error, true)
 * // 返回包含除錯資訊的錯誤回應
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

/**
 * 帶重試的資料獲取
 * @param {Function} fetchFunction - 獲取函式
 * @param {number} maxRetries - 最大重試次數
 * @param {number} delay - 重試延遲 (毫秒)
 * @returns {Promise} 獲取結果
 *
 * @example
 * fetchWithRetry(() => getAiringList(), 3, 1000)
 * // 最多重試 3 次，每次延遲 1 秒
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

  throw mapErrorToCms10(lastError);
}

/**
 * 降級處理策略
 * @param {Function} primaryFunction - 主要處理函式
 * @param {Function} fallbackFunction - 降級處理函式
 * @returns {Promise} 處理結果
 *
 * @example
 * withFallback(
 *   () => getDataFromPrimary(),
 *   () => getDataFromCache()
 * )
 */
async function withFallback(primaryFunction, fallbackFunction) {
  try {
    return await primaryFunction();
  } catch (error) {
    console.warn('主要處理失敗，使用降級方案:', error.message);

    try {
      return await fallbackFunction();
    } catch (fallbackError) {
      throw mapErrorToCms10(fallbackError);
    }
  }
}

/**
 * 請求限流中介軟體
 * @param {number} maxRequests - 最大請求數
 * @param {number} windowMs - 時間窗口 (毫秒)
 * @returns {Function} 限流中介軟體
 *
 * @example
 * const rateLimiter = createRateLimiter(100, 60000); // 每分鐘最多 100 個請求
 */
function createRateLimiter(maxRequests = 100, windowMs = 60000) {
  const requests = new Map();

  return (request) => {
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // 清理過期記錄
    if (requests.has(ip)) {
      const userRequests = requests.get(ip).filter(time => time > windowStart);
      requests.set(ip, userRequests);
    } else {
      requests.set(ip, []);
    }

    const userRequests = requests.get(ip);

    if (userRequests.length >= maxRequests) {
      throw new Cms10Error(
        'RESOURCE_LIMIT_EXCEEDED',
        '請求頻率過高，請稍後再試',
        { ip, requestCount: userRequests.length, windowMs }
      );
    }

    userRequests.push(now);
  };
}

export {
  ErrorLogger,
  ErrorStats,
  errorStats,
  withErrorHandling,
  extractRequestContext,
  createDetailedErrorResponse,
  fetchWithRetry,
  withFallback,
  createRateLimiter
};