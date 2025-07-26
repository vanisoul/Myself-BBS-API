/**
 * CMS10 完整轉換流程處理器
 *
 * 此模組包含完整的資料轉換流程，整合篩選、轉換和回應格式化功能
 * 第二階段更新：支援增強版 vod_play_url 處理
 *
 * @author Myself-BBS API Team
 * @version 2.0.0
 * @date 2025-07-26 17:02:00 (UTC+8)
 */

import { batchConvertItems } from './converters.js';
import { createSuccessResponse, createErrorResponse, paginateData } from './response.js';
import { applyFilters } from './filters.js';
import { VIDEO_QUALITIES } from './url-generators.js';
import { EPISODE_FORMATS } from './episode-detector.js';

/**
 * 完整的列表轉換流程
 * @param {Object} myselfData - Myself-BBS 原始資料
 * @param {Object} query - 查詢參數
 * @param {number} query.pg - 頁碼
 * @param {number} query.limit - 每頁數量
 * @param {number} query.t - 分類 ID
 * @param {string} query.wd - 搜尋關鍵字
 * @param {number} query.h - 更新時間篩選 (小時)
 * @param {string} query.ids - ID 列表
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * convertListResponse(myselfData, {pg: 1, limit: 20, t: 1}, {baseUrl: "https://api.example.com"})
 * // 返回: {code: 1, msg: "數據列表", page: 1, pagecount: 5, limit: "20", total: 100, list: [...]}
 */
function convertListResponse(myselfData, query = {}, options = {}) {
  try {
    // 1. 提取和驗證資料
    const items = extractDataItems(myselfData);

    if (!items || items.length === 0) {
      return createErrorResponse(-2, "找不到任何資料");
    }

    // 2. 應用篩選條件
    const filteredItems = applyFilters(items, {
      t: query.t,
      wd: query.wd,
      h: query.h,
      ids: query.ids,
      sort: query.sort || 'time',
      order: query.order || 'desc'
    });

    if (filteredItems.length === 0) {
      return createErrorResponse(-2, "找不到符合條件的資料");
    }

    // 3. 分頁處理
    const { data: paginatedData, pagination } = paginateData(
      filteredItems,
      query.pg || 1,
      query.limit || 20
    );

    // 4. 轉換為 CMS10 格式
    const cms10Items = batchConvertItems(paginatedData, 'list', options);

    // 5. 建立成功回應
    return createSuccessResponse(cms10Items, pagination);

  } catch (error) {
    console.error('列表轉換失敗:', error);
    return createErrorResponse(0, `轉換失敗: ${error.message}`);
  }
}

/**
 * 完整的詳情轉換流程 (增強版)
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {number} query.h - 更新時間篩選 (小時)
 * @param {string} query.quality - 影片品質 (720p, 1080p, 480p)
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @param {boolean} options.useEnhancedPlayUrl - 是否使用增強版 vod_play_url 處理
 * @param {string} options.quality - 預設影片品質
 * @param {boolean} options.enableFallback - 是否啟用降級處理
 * @param {boolean} options.logEpisodeFormat - 是否記錄 episodes 格式檢測日誌
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * convertDetailResponse([detailItem], {h: 24, quality: "1080p"}, {
 *   baseUrl: "https://api.example.com",
 *   useEnhancedPlayUrl: true,
 *   enableFallback: true
 * })
 * // 返回: {code: 1, msg: "數據列表", page: 1, pagecount: 1, limit: "1", total: 1, list: [...]}
 */
function convertDetailResponse(detailItems, query = {}, options = {}) {
  try {
    // 合併預設配置
    const config = {
      baseUrl: "https://myself-bbs.jacob.workers.dev",
      useEnhancedPlayUrl: true,  // 預設啟用增強版功能
      quality: VIDEO_QUALITIES.HD720,
      enableFallback: true,
      logEpisodeFormat: true,
      ...options
    };

    // 從查詢參數中獲取品質設定
    if (query.quality && Object.values(VIDEO_QUALITIES).includes(query.quality)) {
      config.quality = query.quality;
    }

    console.log(`詳情轉換開始 - 增強模式: ${config.useEnhancedPlayUrl}, 品質: ${config.quality}`);

    // 1. 驗證輸入資料
    if (!Array.isArray(detailItems) || detailItems.length === 0) {
      return createErrorResponse(-2, "找不到指定的資料");
    }

    // 2. 過濾有效項目
    const validItems = detailItems.filter(item => item && item.id);

    if (validItems.length === 0) {
      return createErrorResponse(-2, "找不到有效的資料項目");
    }

    console.log(`有效項目數量: ${validItems.length}`);

    // 3. 應用時間篩選 (如果需要)
    let filteredItems = validItems;

    if (query.h) {
      filteredItems = applyFilters(validItems, { h: query.h });

      if (filteredItems.length === 0) {
        return createErrorResponse(-2, "找不到符合時間條件的資料");
      }

      console.log(`時間篩選後項目數量: ${filteredItems.length}`);
    }

    // 4. Episodes 格式分析 (如果啟用增強模式)
    if (config.useEnhancedPlayUrl && config.logEpisodeFormat) {
      analyzeEpisodesFormats(filteredItems);
    }

    // 5. 轉換為 CMS10 格式
    const cms10Items = batchConvertItems(filteredItems, 'detail', config);

    if (cms10Items.length === 0) {
      return createErrorResponse(0, "資料轉換失敗");
    }

    console.log(`成功轉換項目數量: ${cms10Items.length}`);

    // 6. 建立成功回應 (詳情通常不分頁)
    const response = createSuccessResponse(cms10Items, {
      page: 1,
      limit: cms10Items.length,
      total: cms10Items.length
    });

    // 7. 添加增強功能的元資訊
    // if (config.useEnhancedPlayUrl) {
    //   response.enhanced_features = {
    //     vod_play_url_v2: true,
    //     supported_qualities: Object.values(VIDEO_QUALITIES),
    //     current_quality: config.quality,
    //     fallback_enabled: config.enableFallback
    //   };
    // }

    return response;

  } catch (error) {
    console.error('詳情轉換失敗:', error);
    return createErrorResponse(0, `轉換失敗: ${error.message}`);
  }
}

/**
 * 分析 episodes 格式分佈 (用於日誌和監控)
 * @param {Array} items - 項目陣列
 */
function analyzeEpisodesFormats(items) {
  const formatStats = {
    [EPISODE_FORMATS.PLAY_PATH]: 0,
    [EPISODE_FORMATS.ENCODED_ID]: 0,
    [EPISODE_FORMATS.UNKNOWN]: 0,
    total: 0,
    withEpisodes: 0,
    withoutEpisodes: 0
  };

  for (const item of items) {
    formatStats.total++;

    if (!item.episodes || typeof item.episodes !== 'object') {
      formatStats.withoutEpisodes++;
      continue;
    }

    formatStats.withEpisodes++;

    try {
      // 動態導入以避免循環依賴
      import('./episode-detector.js').then(({ detectEpisodesFormatCached }) => {
        const detection = detectEpisodesFormatCached(item.episodes);
        formatStats[detection.format]++;
      });
    } catch (error) {
      console.warn(`Episodes 格式檢測失敗 (ID: ${item.id}):`, error);
      formatStats[EPISODE_FORMATS.UNKNOWN]++;
    }
  }

  console.log('Episodes 格式分析:', {
    總項目數: formatStats.total,
    有Episodes: formatStats.withEpisodes,
    無Episodes: formatStats.withoutEpisodes,
    PlayPath格式: formatStats[EPISODE_FORMATS.PLAY_PATH],
    EncodedID格式: formatStats[EPISODE_FORMATS.ENCODED_ID],
    未知格式: formatStats[EPISODE_FORMATS.UNKNOWN]
  });
}

/**
 * 從 Myself-BBS 資料中提取項目陣列
 * @param {Object} myselfData - Myself-BBS 原始資料
 * @returns {Array} 項目陣列
 *
 * @example
 * extractDataItems({data: {data: [{id: 1, title: "動畫1"}]}})
 * // 返回: [{id: 1, title: "動畫1"}]
 */
function extractDataItems(myselfData) {
  // 處理不同的資料結構
  if (Array.isArray(myselfData)) {
    return myselfData;
  }

  if (myselfData?.data?.data && Array.isArray(myselfData.data.data)) {
    return myselfData.data.data;
  }

  if (myselfData?.data && Array.isArray(myselfData.data)) {
    return myselfData.data;
  }

  if (myselfData?.list && Array.isArray(myselfData.list)) {
    return myselfData.list;
  }

  return [];
}

/**
 * 合併多個資料源
 * @param {Array} dataSources - 資料源陣列
 * @returns {Array} 合併後的項目陣列
 *
 * @example
 * mergeDataSources([airingData, completedData])
 * // 返回: [...airingItems, ...completedItems]
 */
function mergeDataSources(dataSources) {
  if (!Array.isArray(dataSources)) {
    return [];
  }

  const allItems = [];
  const seenIds = new Set();

  for (const dataSource of dataSources) {
    const items = extractDataItems(dataSource);

    for (const item of items) {
      // 避免重複項目
      if (item && item.id && !seenIds.has(item.id)) {
        allItems.push(item);
        seenIds.add(item.id);
      }
    }
  }

  return allItems;
}

/**
 * 處理搜尋請求
 * @param {Array} dataSources - 資料源陣列
 * @param {string} keyword - 搜尋關鍵字
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * processSearchRequest([airingData, completedData], "巨人", {pg: 1, limit: 20})
 * // 返回搜尋結果的 CMS10 回應
 */
function processSearchRequest(dataSources, keyword, query = {}, options = {}) {
  try {
    // 1. 合併所有資料源
    const allItems = mergeDataSources(dataSources);

    if (allItems.length === 0) {
      return createErrorResponse(-2, "沒有可搜尋的資料");
    }

    // 2. 建立包含搜尋關鍵字的查詢參數
    const searchQuery = {
      ...query,
      wd: keyword
    };

    // 3. 使用列表轉換流程處理搜尋
    return convertListResponse({ data: { data: allItems } }, searchQuery, options);

  } catch (error) {
    console.error('搜尋處理失敗:', error);
    return createErrorResponse(0, `搜尋失敗: ${error.message}`);
  }
}

/**
 * 處理分類列表請求
 * @param {Array} dataSources - 資料源陣列
 * @param {number} categoryId - 分類 ID
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * processCategoryRequest([airingData, completedData], 1, {pg: 1, limit: 20})
 * // 返回指定分類的 CMS10 回應
 */
function processCategoryRequest(dataSources, categoryId, query = {}, options = {}) {
  try {
    // 1. 合併所有資料源
    const allItems = mergeDataSources(dataSources);

    if (allItems.length === 0) {
      return createErrorResponse(-2, "沒有可篩選的資料");
    }

    // 2. 建立包含分類篩選的查詢參數
    const categoryQuery = {
      ...query,
      t: categoryId
    };

    // 3. 使用列表轉換流程處理分類篩選
    return convertListResponse({ data: { data: allItems } }, categoryQuery, options);

  } catch (error) {
    console.error('分類處理失敗:', error);
    return createErrorResponse(0, `分類篩選失敗: ${error.message}`);
  }
}

/**
 * 資料品質檢查
 * @param {Array} items - 項目陣列
 * @returns {Object} 品質檢查結果
 *
 * @example
 * checkDataQuality([{id: 1, title: "動畫1"}, {id: null, title: ""}])
 * // 返回: {total: 2, valid: 1, invalid: 1, issues: [...]}
 */
function checkDataQuality(items) {
  if (!Array.isArray(items)) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      issues: ['輸入不是陣列']
    };
  }

  const issues = [];
  let validCount = 0;
  let invalidCount = 0;

  items.forEach((item, index) => {
    const itemIssues = [];

    if (!item) {
      itemIssues.push('項目為空');
    } else {
      if (!item.id) {
        itemIssues.push('缺少 ID');
      }
      if (!item.title) {
        itemIssues.push('缺少標題');
      }
      if (!item.category || !Array.isArray(item.category)) {
        itemIssues.push('缺少或無效的分類');
      }
    }

    if (itemIssues.length > 0) {
      issues.push(`項目 ${index}: ${itemIssues.join(', ')}`);
      invalidCount++;
    } else {
      validCount++;
    }
  });

  return {
    total: items.length,
    valid: validCount,
    invalid: invalidCount,
    issues
  };
}

/**
 * 增強版詳情轉換 (明確啟用所有新功能)
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 */
function convertDetailResponseEnhanced(detailItems, query = {}, options = {}) {
  return convertDetailResponse(detailItems, query, {
    useEnhancedPlayUrl: true,
    enableFallback: true,
    logEpisodeFormat: true,
    quality: query.quality || VIDEO_QUALITIES.HD720,
    ...options
  });
}

/**
 * 傳統詳情轉換 (使用舊版功能，向後相容)
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 */
function convertDetailResponseLegacy(detailItems, query = {}, options = {}) {
  return convertDetailResponse(detailItems, query, {
    useEnhancedPlayUrl: false,
    enableFallback: false,
    logEpisodeFormat: false,
    ...options
  });
}

/**
 * 智慧詳情轉換 (自動選擇最佳處理方式)
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {Object} options - 轉換選項
 * @returns {Object} CMS10 格式回應
 */
function convertDetailResponseSmart(detailItems, query = {}, options = {}) {
  // 檢查是否有新格式的 episodes
  const hasNewFormatEpisodes = detailItems.some(item => {
    if (!item.episodes) return false;

    const episodeValues = Object.values(item.episodes);
    return episodeValues.some(value =>
      typeof value === 'string' &&
      (value.startsWith('play/') || /^[A-Za-z0-9_-]{10,}$/.test(value))
    );
  });

  if (hasNewFormatEpisodes) {
    console.log('檢測到新格式 episodes，使用增強版轉換');
    return convertDetailResponseEnhanced(detailItems, query, options);
  } else {
    console.log('使用傳統格式 episodes，使用標準轉換');
    return convertDetailResponseLegacy(detailItems, query, options);
  }
}

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
};