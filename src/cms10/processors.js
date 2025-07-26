/**
 * CMS10 完整轉換流程處理器
 *
 * 此模組包含完整的資料轉換流程，整合篩選、轉換和回應格式化功能
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:43:00 (UTC+8)
 */

import { batchConvertItems } from './converters.js';
import { createSuccessResponse, createErrorResponse, paginateData } from './response.js';
import { applyFilters } from './filters.js';

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
 * 完整的詳情轉換流程
 * @param {Array} detailItems - 詳情項目陣列
 * @param {Object} query - 查詢參數
 * @param {number} query.h - 更新時間篩選 (小時)
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * convertDetailResponse([detailItem], {h: 24}, {baseUrl: "https://api.example.com"})
 * // 返回: {code: 1, msg: "數據列表", page: 1, pagecount: 1, limit: "1", total: 1, list: [...]}
 */
function convertDetailResponse(detailItems, query = {}, options = {}) {
  try {
    // 1. 驗證輸入資料
    if (!Array.isArray(detailItems) || detailItems.length === 0) {
      return createErrorResponse(-2, "找不到指定的資料");
    }

    // 2. 過濾有效項目
    const validItems = detailItems.filter(item => item && item.id);

    if (validItems.length === 0) {
      return createErrorResponse(-2, "找不到有效的資料項目");
    }

    // 3. 應用時間篩選 (如果需要)
    let filteredItems = validItems;

    if (query.h) {
      filteredItems = applyFilters(validItems, { h: query.h });

      if (filteredItems.length === 0) {
        return createErrorResponse(-2, "找不到符合時間條件的資料");
      }
    }

    // 4. 轉換為 CMS10 格式
    const cms10Items = batchConvertItems(filteredItems, 'detail', options);

    if (cms10Items.length === 0) {
      return createErrorResponse(0, "資料轉換失敗");
    }

    // 5. 建立成功回應 (詳情通常不分頁)
    return createSuccessResponse(cms10Items, {
      page: 1,
      limit: cms10Items.length,
      total: cms10Items.length
    });

  } catch (error) {
    console.error('詳情轉換失敗:', error);
    return createErrorResponse(0, `轉換失敗: ${error.message}`);
  }
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

export {
  convertListResponse,
  convertDetailResponse,
  extractDataItems,
  mergeDataSources,
  processSearchRequest,
  processCategoryRequest,
  checkDataQuality
};