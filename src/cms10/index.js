/**
 * CMS10 轉換模組主要入口
 *
 * 此模組匯出所有 CMS10 相關的轉換功能，提供統一的介面
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:47:00 (UTC+8)
 */

// 匯出轉換器相關功能
export {
  CATEGORY_MAPPING,
  getCategoryMapping,
  convertTimestamp,
  convertPremiereToYear,
  extractEpisodeNumber,
  convertPlayUrl,
  formatRemarks,
  determineSerialStatus,
  extractActors,
  convertToListItem,
  convertToDetailItem,
  batchConvertItems
} from './converters.js';

// 匯出回應格式相關功能
export {
  createCms10Response,
  createSuccessResponse,
  createErrorResponse,
  calculatePagination,
  paginateData,
  validateCms10Item,
  validateCms10Response
} from './response.js';

// 匯出篩選器相關功能
export {
  filterByCategory,
  searchByKeyword,
  filterByUpdateTime,
  filterByIds,
  sortItems,
  applyFilters,
  getAvailableCategories,
  getCategoryStats
} from './filters.js';

// 匯出處理器相關功能
export {
  convertListResponse,
  convertDetailResponse,
  convertDetailResponseEnhanced,
  convertDetailResponseLegacy,
  convertDetailResponseSmart,
  extractDataItems,
  mergeDataSources,
  processSearchRequest,
  processCategoryRequest,
  checkDataQuality
} from './processors.js';

// 匯出錯誤處理相關功能
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
} from './errors.js';

// 匯出驗證器相關功能
export {
  ValidationRules,
  validateParameter,
  validateQuery,
  validateBusinessLogic,
  validateFullQuery,
  validateIds,
  validatePagination,
  validateSearchKeyword,
  createValidationError
} from './validators.js';

// 匯出中介軟體相關功能
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
} from './middleware.js';

// 匯出處理器相關功能
export {
  handleCms10List,
  handleCms10Detail,
  handleCms10Search,
  handleCms10Category,
  handleCms10Request,
  getCms10Categories,
  getCms10Info,
  healthCheck
} from './handlers.js';

// 匯出路由相關功能
export {
  createCms10Router,
  integrateCms10Routes,
  createRouteConfig,
  generateRouteDocs,
  validateRouteConfig
} from './routes.js';

/**
 * CMS10 模組版本資訊 (第二階段更新)
 */
export const CMS10_VERSION = {
  version: '2.0.0',
  buildDate: '2025-07-26',
  description: 'Myself-BBS to CMS10 Conversion Module with Enhanced vod_play_url Support',
  features: {
    enhanced_play_url: true,
    episode_format_detection: true,
    multiple_video_qualities: true,
    fallback_support: true,
    url_validation: true
  }
};

/**
 * 預設配置
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://myself-bbs.jacob.workers.dev',
  defaultLimit: 20,
  maxLimit: 100,
  timezone: 'Asia/Taipei'
};