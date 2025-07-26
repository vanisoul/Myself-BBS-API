/**
 * CMS10 API 端點處理器
 *
 * 此模組包含所有 CMS10 API 端點的處理邏輯，整合轉換、驗證和錯誤處理功能
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:49:00 (UTC+8)
 */

import { getAiringList, getCompletedList } from '../list.js';
import { getAnime } from '../anime.js';
import { response } from '../response.js';
import {
  validateFullQuery,
  createValidationError,
  createDataNotFoundError,
  createSystemError,
  convertListResponse,
  convertDetailResponse,
  mergeDataSources,
  extractDataItems,
  DEFAULT_CONFIG
} from './index.js';

/**
 * 處理 CMS10 影片列表請求 (包含完整詳情)
 * @param {Object} query - 查詢參數
 * @param {string} query.ac - 操作類型 ('videolist')
 * @param {number} query.pg - 頁碼
 * @param {number} query.limit - 每頁數量
 * @param {number} query.t - 分類 ID
 * @param {string} query.wd - 搜尋關鍵字
 * @param {number} query.h - 更新時間篩選 (小時)
 * @param {string} query.ids - ID 列表 (指定特定影片)
 * @returns {Object} CMS10 格式回應 (包含 vod_play_url)
 *
 * @example
 * handleCms10VideoList({ac: 'videolist', pg: 1, limit: 20, t: 1})
 * // 返回第一頁動作分類的動畫完整詳情列表
 */
async function handleCms10VideoList(query) {
  try {
    // 1. 參數驗證
    const validation = validateFullQuery(query);
    if (!validation.isValid) {
      const allErrors = [...validation.errors, ...validation.businessErrors];
      throw createValidationError(allErrors);
    }

    const params = validation.params;

    // 2. 如果指定了 IDs，獲取特定動畫的詳情
    if (params.ids) {
      return await handleSpecificAnimeDetails(params);
    }

    // 3. 獲取基礎資料源
    const [airingData, completedData] = await Promise.all([
      getAiringList().catch(err => {
        console.warn('獲取連載列表失敗:', err.message);
        return { data: { data: [] } };
      }),
      getCompletedList().catch(err => {
        console.warn('獲取完結列表失敗:', err.message);
        return { data: { data: [] } };
      })
    ]);

    // 4. 檢查資料有效性
    const airingItems = extractDataItems(airingData);
    const completedItems = extractDataItems(completedData);

    if (airingItems.length === 0 && completedItems.length === 0) {
      throw createDataNotFoundError('anime_list', 'all');
    }

    // 5. 合併資料源
    const allData = mergeDataSources([airingData, completedData]);

    if (allData.length === 0) {
      throw createDataNotFoundError('anime', 'any');
    }

    // 6. 獲取每個動畫的詳細資料 (包括 episodes)
    const detailedData = await enrichWithDetailedData(allData, params);

    // 7. 轉換為 CMS10 格式 (使用 detail 模式以包含 vod_play_url)
    const cms10Response = convertDetailResponse(
      detailedData,
      params,
      {
        baseUrl: DEFAULT_CONFIG.baseUrl,
        useEnhancedPlayUrl: true,
        quality: params.quality || '720p'
      }
    );

    return response({
      data: JSON.stringify(cms10Response, null, 2)
    });

  } catch (error) {
    // 錯誤會由中介軟體處理
    throw error;
  }
}

/**
 * 處理指定 ID 的動畫詳情
 * @param {Object} params - 驗證後的參數
 * @returns {Object} CMS10 格式回應
 */
async function handleSpecificAnimeDetails(params) {
  // 解析 ID 列表
  const ids = params.ids.split(',').map(id => parseInt(id.trim()));
  const validIds = ids.filter(id => !isNaN(id) && id > 0);

  if (validIds.length === 0) {
    throw createDataNotFoundError('anime', 'invalid_ids');
  }

  // 獲取詳情資料
  const detailPromises = validIds.map(async (id) => {
    try {
      const animeData = await getAnime(id);
      return animeData;
    } catch (error) {
      console.warn(`獲取動畫詳情失敗 (ID: ${id}):`, error.message);
      return null;
    }
  });

  const detailResults = await Promise.all(detailPromises);
  const validDetails = detailResults.filter(item => item !== null);

  if (validDetails.length === 0) {
    throw createDataNotFoundError('anime_details', validIds.join(','));
  }

  // 轉換為 CMS10 格式
  const cms10Response = convertDetailResponse(
    validDetails,
    params,
    {
      baseUrl: DEFAULT_CONFIG.baseUrl,
      useEnhancedPlayUrl: true,
      quality: params.quality || '720p'
    }
  );

  return response({
    data: JSON.stringify(cms10Response, null, 2)
  });
}

/**
 * 為基礎資料添加詳細資訊 (episodes 等)
 * @param {Array} baseData - 基礎動畫資料
 * @param {Object} params - 查詢參數
 * @returns {Array} 包含詳細資訊的動畫資料
 */
async function enrichWithDetailedData(baseData, params) {
  // 應用篩選和分頁
  const { applyFilters, paginateData } = await import('./index.js');

  // 先篩選
  const filteredItems = applyFilters(baseData, {
    t: params.t,
    wd: params.wd,
    h: params.h,
    sort: params.sort || 'time',
    order: params.order || 'desc'
  });

  // 再分頁
  const { data: paginatedData } = paginateData(
    filteredItems,
    params.pg || 1,
    params.limit || 20
  );

  // 為分頁後的資料獲取詳細資訊
  const detailPromises = paginatedData.map(async (item) => {
    try {
      // 如果已經有 episodes 資料，直接返回
      if (item.episodes) {
        return item;
      }

      // 否則獲取完整詳情
      const detailData = await getAnime(item.id);
      return detailData || item; // 如果獲取失敗，返回原始資料
    } catch (error) {
      console.warn(`獲取動畫詳情失敗 (ID: ${item.id}):`, error.message);
      return item; // 返回原始資料
    }
  });

  const enrichedData = await Promise.all(detailPromises);
  return enrichedData.filter(item => item !== null);
}

// 移除 handleCms10Detail 函式，功能已整合到 handleCms10VideoList

/**
 * 處理 CMS10 搜尋請求 (透過 wd 參數)
 * @param {Object} query - 查詢參數
 * @param {string} query.ac - 操作類型 ('list')
 * @param {string} query.wd - 搜尋關鍵字
 * @param {number} query.pg - 頁碼
 * @param {number} query.limit - 每頁數量
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * handleCms10Search({ac: 'list', wd: '巨人', pg: 1})
 * // 返回包含"巨人"關鍵字的動畫搜尋結果
 */
async function handleCms10Search(query) {
  // 搜尋實際上是影片列表請求的一個特例，使用相同的處理邏輯
  return await handleCms10VideoList(query);
}

/**
 * 處理 CMS10 分類請求 (透過 t 參數)
 * @param {Object} query - 查詢參數
 * @param {string} query.ac - 操作類型 ('list')
 * @param {number} query.t - 分類 ID
 * @param {number} query.pg - 頁碼
 * @param {number} query.limit - 每頁數量
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * handleCms10Category({ac: 'list', t: 1, pg: 1})
 * // 返回動作分類的動畫列表
 */
async function handleCms10Category(query) {
  // 分類篩選實際上是影片列表請求的一個特例，使用相同的處理邏輯
  return await handleCms10VideoList(query);
}

/**
 * 主要的 CMS10 路由處理器
 * @param {Object} query - 查詢參數
 * @returns {Object} CMS10 格式回應
 *
 * @example
 * handleCms10Request({ac: 'list', pg: 1})
 * // 根據 ac 參數路由到對應的處理器
 */
async function handleCms10Request(query) {
  try {
    // 基本參數檢查
    if (!query.ac) {
      throw createValidationError(['缺少必要參數：ac']);
    }

    // 根據操作類型路由
    switch (query.ac) {
      case 'videolist':
        return await handleCms10VideoList(query);

      // 保持向後相容，將 list 重定向到 videolist
      case 'list':
        return await handleCms10VideoList(query);

      default:
        throw createValidationError([`不支援的操作類型：${query.ac}，請使用 'videolist'`]);
    }

  } catch (error) {
    // 錯誤會由中介軟體處理
    throw error;
  }
}

/**
 * 獲取 CMS10 分類列表
 * @returns {Object} 分類列表回應
 *
 * @example
 * getCms10Categories()
 * // 返回所有可用的分類列表
 */
async function getCms10Categories() {
  try {
    const { getAvailableCategories } = await import('./index.js');
    const categories = getAvailableCategories();

    const cms10Response = {
      code: 1,
      msg: "分類列表",
      page: 1,
      pagecount: 1,
      limit: categories.length.toString(),
      total: categories.length,
      list: categories
    };

    return response({
      data: JSON.stringify(cms10Response, null, 2)
    });

  } catch (error) {
    throw createSystemError('獲取分類列表失敗', error);
  }
}

/**
 * 獲取 CMS10 API 資訊
 * @returns {Object} API 資訊回應
 *
 * @example
 * getCms10Info()
 * // 返回 API 版本和功能資訊
 */
async function getCms10Info() {
  try {
    const { CMS10_VERSION } = await import('./index.js');

    const apiInfo = {
      name: "Myself-BBS CMS10 API",
      version: CMS10_VERSION.version,
      buildDate: CMS10_VERSION.buildDate,
      description: CMS10_VERSION.description,
      endpoints: {
        videolist: "/api.php/provide/vod/?ac=videolist",
        specific: "/api.php/provide/vod/?ac=videolist&ids={ids}",
        search: "/api.php/provide/vod/?ac=videolist&wd={keyword}",
        category: "/api.php/provide/vod/?ac=videolist&t={type_id}"
      },
      parameters: {
        ac: "操作類型 (videolist)",
        ids: "ID列表，逗號分隔 (可選，指定特定影片)",
        pg: "頁碼，預設1",
        limit: "每頁數量，預設20，最大100",
        t: "分類ID，1-99",
        wd: "搜尋關鍵字",
        h: "更新時間篩選，小時數",
        quality: "影片品質 (720p, 1080p, 480p)"
      }
    };

    const cms10Response = {
      code: 1,
      msg: "API資訊",
      page: 1,
      pagecount: 1,
      limit: "1",
      total: 1,
      list: [apiInfo]
    };

    return response({
      data: JSON.stringify(cms10Response, null, 2)
    });

  } catch (error) {
    throw createSystemError('獲取API資訊失敗', error);
  }
}

/**
 * 健康檢查端點
 * @returns {Object} 健康狀態回應
 *
 * @example
 * healthCheck()
 * // 返回服務健康狀態
 */
async function healthCheck() {
  try {
    // 檢查基本功能
    const startTime = Date.now();

    // 測試資料源連線
    const testPromises = [
      getAiringList().then(() => true).catch(() => false),
      getCompletedList().then(() => true).catch(() => false)
    ];

    const [airingOk, completedOk] = await Promise.all(testPromises);
    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        airing_list: airingOk ? "ok" : "error",
        completed_list: completedOk ? "ok" : "error"
      },
      version: "1.0.0"
    };

    const cms10Response = {
      code: 1,
      msg: "健康檢查",
      page: 1,
      pagecount: 1,
      limit: "1",
      total: 1,
      list: [healthStatus]
    };

    return response({
      data: JSON.stringify(cms10Response, null, 2)
    });

  } catch (error) {
    throw createSystemError('健康檢查失敗', error);
  }
}

export {
  handleCms10VideoList,
  handleCms10Search,
  handleCms10Category,
  handleCms10Request,
  getCms10Categories,
  getCms10Info,
  healthCheck,
  // 向後相容的別名
  handleCms10VideoList as handleCms10List
};