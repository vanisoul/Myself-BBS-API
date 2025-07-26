/**
 * CMS10 資料轉換核心函式
 *
 * 此模組包含將 Myself-BBS 資料格式轉換為 CMS10 標準格式的所有核心函式
 * 第二階段更新：支援新的 episodes 格式和增強的 vod_play_url 處理
 *
 * @author Myself-BBS API Team
 * @version 2.0.0
 * @date 2025-07-26 17:00:00 (UTC+8)
 */

// 導入新的格式檢測和 URL 生成模組
import {
  detectEpisodesFormatCached,
  EPISODE_FORMATS,
  validateEpisodesData
} from './episode-detector.js';

import {
  generatePlayPathUrl,
  generateEncodedIdUrl,
  getUrlGenerator,
  batchGenerateUrls,
  generateFallbackUrl,
  VIDEO_QUALITIES
} from './url-generators.js';

/**
 * 分類映射表 - 將 Myself-BBS 分類對應到 CMS10 分類系統
 */
const CATEGORY_MAPPING = {
  "動作": { type_id: 1, type_name: "動作" },
  "冒險": { type_id: 2, type_name: "冒險" },
  "科幻": { type_id: 3, type_name: "科幻" },
  "奇幻": { type_id: 4, type_name: "奇幻" },
  "日常": { type_id: 5, type_name: "日常" },
  "戀愛": { type_id: 6, type_name: "戀愛" },
  "喜劇": { type_id: 7, type_name: "喜劇" },
  "劇情": { type_id: 8, type_name: "劇情" },
  "懸疑": { type_id: 9, type_name: "懸疑" },
  "恐怖": { type_id: 10, type_name: "恐怖" },
  "其他": { type_id: 99, type_name: "其他" }
};

/**
 * 獲取分類映射
 * @param {Array} categories - 分類陣列
 * @returns {Object} 分類映射物件，包含 type_id 和 type_name
 *
 * @example
 * getCategoryMapping(["動作", "冒險"])
 * // 返回: { type_id: 1, type_name: "動作" }
 */
function getCategoryMapping(categories) {
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return CATEGORY_MAPPING["其他"];
  }

  const firstCategory = categories[0];
  return CATEGORY_MAPPING[firstCategory] || CATEGORY_MAPPING["其他"];
}

/**
 * 轉換時間戳為 CMS10 格式
 * @param {number} timestamp - Unix 時間戳 (毫秒)
 * @returns {string} CMS10 時間格式 (YYYY-MM-DD HH:mm:ss)
 *
 * @example
 * convertTimestamp(1640995200000)
 * // 返回: "2022-01-01 08:00:00"
 */
function convertTimestamp(timestamp) {
  if (!timestamp || isNaN(timestamp)) {
    timestamp = Date.now();
  }

  let date = new Date(timestamp);

  // 確保日期有效
  if (isNaN(date.getTime())) {
    date = new Date();
  }

  // 轉換為台北時區 (UTC+8)
  const taipeiTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));

  return taipeiTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * 轉換首播日期為年份
 * @param {Array} premiere - [年, 月, 日] 格式的首播日期
 * @returns {string} 年份字串
 *
 * @example
 * convertPremiereToYear([2022, 1, 1])
 * // 返回: "2022"
 */
function convertPremiereToYear(premiere) {
  if (!premiere || !Array.isArray(premiere) || premiere.length === 0) {
    return new Date().getFullYear().toString();
  }

  const year = parseInt(premiere[0]);
  if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 10) {
    return new Date().getFullYear().toString();
  }

  return year.toString();
}

/**
 * 從集數名稱中提取數字
 * @param {string} episodeName - 集數名稱
 * @returns {number} 集數數字
 *
 * @example
 * extractEpisodeNumber("第 01 話")
 * // 返回: 1
 */
function extractEpisodeNumber(episodeName) {
  const match = episodeName.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * 轉換播放地址格式 (舊版本，保持向後相容)
 * @param {Object} episodes - 集數物件
 * @param {number|string} vodId - 影片 ID
 * @param {string} baseUrl - 基礎 URL
 * @returns {string} CMS10 播放地址格式 (集數$地址#格式)
 *
 * @example
 * convertPlayUrl({"第 01 話": ["1", "001"]}, 123, "https://api.example.com")
 * // 返回: "第 01 話$https://api.example.com/m3u8/1/001"
 */
function convertPlayUrl(episodes, vodId, baseUrl = "https://myself-bbs.jacob.workers.dev") {
  if (!episodes || typeof episodes !== 'object') {
    return "";
  }

  const playUrls = [];

  // 按集數順序排序
  const sortedEpisodes = Object.entries(episodes).sort(([a], [b]) => {
    const numA = extractEpisodeNumber(a);
    const numB = extractEpisodeNumber(b);
    return numA - numB;
  });

  for (const [episodeName, episodeData] of sortedEpisodes) {
    if (Array.isArray(episodeData) && episodeData.length >= 2) {
      const [id, ep] = episodeData;
      const playUrl = `${baseUrl}/m3u8/${id}/${ep}`;
      playUrls.push(`${episodeName}$${playUrl}`);
    }
  }

  return playUrls.join('#');
}

/**
 * 增強版播放地址轉換函式 (第二階段新功能)
 * 支援兩種 episodes 格式：play_path 和 encoded_id
 * @param {Object} episodes - 集數物件
 * @param {number|string} vodId - 影片 ID
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @param {string} options.quality - 影片品質 (720p, 1080p, 480p)
 * @param {boolean} options.enableFallback - 是否啟用降級處理
 * @param {boolean} options.validateUrls - 是否驗證生成的 URL
 * @returns {string} CMS10 播放地址格式 (集數$地址#格式)
 *
 * @example
 * // Play Path 格式
 * convertPlayUrlEnhanced({
 *   "第 01 話 海的那邊": "play/46442/001",
 *   "第 02 話 暗夜列車": "play/46442/002"
 * }, 46442)
 * // 返回: "第 01 話 海的那邊$https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8#第 02 話 暗夜列車$https://vpx05.myself-bbs.com/vpx/46442/002/720p.m3u8"
 *
 * @example
 * // Encoded ID 格式
 * convertPlayUrlEnhanced({
 *   "第 01 話": "AgADMg4AAvWkAVc",
 *   "第 02 話": "AgADsA0AAjef-VU"
 * }, 123)
 * // 返回: "第 01 話$https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8#第 02 話$https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8"
 */
function convertPlayUrlEnhanced(episodes, vodId, options = {}) {
  // 預設配置
  const config = {
    baseUrl: "https://myself-bbs.jacob.workers.dev",
    quality: VIDEO_QUALITIES.HD720,
    enableFallback: true,
    validateUrls: false,
    ...options
  };

  // 基本驗證
  if (!episodes || typeof episodes !== 'object') {
    console.warn('Episodes 資料無效，返回空字串');
    return "";
  }

  // 驗證 episodes 資料完整性
  const validation = validateEpisodesData(episodes);
  if (!validation.isValid) {
    console.warn('Episodes 資料驗證失敗:', validation.errors);
    if (!config.enableFallback) {
      return "";
    }
  }

  // 檢測 episodes 格式
  const detection = detectEpisodesFormatCached(episodes);

  console.log(`檢測到 episodes 格式: ${detection.format}, 信心度: ${(detection.confidence * 100).toFixed(1)}%`);

  // 如果格式未知且不啟用降級，返回舊版本處理結果
  if (detection.format === EPISODE_FORMATS.UNKNOWN) {
    console.warn('未知的 episodes 格式，使用舊版本處理邏輯');
    if (config.enableFallback) {
      return convertPlayUrl(episodes, vodId, config.baseUrl);
    } else {
      return "";
    }
  }

  try {
    // 檢查是否為混合格式
    const isMixed = detection.details.isMixed;
    let urlResults = [];

    if (isMixed) {
      // 混合格式：逐個處理每個 episode
      console.log('處理混合格式 episodes');
      urlResults = processMixedFormatEpisodes(episodes, config);
    } else {
      // 單一格式：使用批量處理
      urlResults = batchGenerateUrls(episodes, detection.format, {
        quality: config.quality,
        baseUrl: config.baseUrl
      });
    }

    // 按集數順序排序
    const sortedResults = urlResults.sort((a, b) => {
      const numA = extractEpisodeNumber(a.name);
      const numB = extractEpisodeNumber(b.name);
      return numA - numB;
    });

    const playUrls = [];
    const failedEpisodes = [];

    for (const result of sortedResults) {
      if (result.success && result.url) {
        playUrls.push(`${result.name}$${result.url}`);
      } else {
        failedEpisodes.push(result);

        // 嘗試降級處理
        if (config.enableFallback) {
          try {
            const fallbackUrl = generateFallbackUrl(result.name, result.value, vodId);
            playUrls.push(`${result.name}$${fallbackUrl}`);
            console.warn(`使用降級 URL: ${result.name} -> ${fallbackUrl}`);
          } catch (fallbackError) {
            console.error(`降級處理也失敗: ${result.name}`, fallbackError);
          }
        }
      }
    }

    // 記錄統計資訊
    if (failedEpisodes.length > 0) {
      console.warn(`${failedEpisodes.length} 個 episodes 處理失敗:`, failedEpisodes.map(e => e.name));
    }

    const successRate = (playUrls.length / Object.keys(episodes).length) * 100;
    console.log(`URL 生成成功率: ${successRate.toFixed(1)}% (${playUrls.length}/${Object.keys(episodes).length})`);

    return playUrls.join('#');

  } catch (error) {
    console.error('增強版 URL 轉換失敗:', error);

    // 降級到舊版本處理
    if (config.enableFallback) {
      console.log('降級到舊版本 convertPlayUrl');
      return convertPlayUrl(episodes, vodId, config.baseUrl);
    }

    return "";
  }
}

/**
 * 處理混合格式的 episodes
 * @param {Object} episodes - Episodes 物件
 * @param {Object} config - 配置選項
 * @returns {Array} URL 生成結果陣列
 */
function processMixedFormatEpisodes(episodes, config) {
  const results = [];

  for (const [episodeName, episodeValue] of Object.entries(episodes)) {
    try {
      // 檢測單個 episode 的格式
      const format = detectSingleEpisodeFormat(episodeValue);

      let url = null;
      let success = false;

      if (format === EPISODE_FORMATS.PLAY_PATH) {
        url = generatePlayPathUrl(episodeValue, {
          quality: config.quality,
          baseUrl: config.baseUrl
        });
        success = true;
      } else if (format === EPISODE_FORMATS.ENCODED_ID) {
        url = generateEncodedIdUrl(episodeValue, {
          baseUrl: config.baseUrl
        });
        success = true;
      }

      results.push({
        name: episodeName,
        value: episodeValue,
        url: url,
        success: success,
        error: success ? null : `不支援的格式: ${format}`
      });

    } catch (error) {
      results.push({
        name: episodeName,
        value: episodeValue,
        url: null,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * 檢測單個 episode 值的格式 (內部函式)
 * @param {string} episodeValue - Episode 值
 * @returns {string} 格式類型
 */
function detectSingleEpisodeFormat(episodeValue) {
  if (!episodeValue || typeof episodeValue !== 'string') {
    return EPISODE_FORMATS.UNKNOWN;
  }

  const trimmedValue = episodeValue.trim();

  // 檢測 play_path 格式
  if (/^play\/\d+\/\d+$/.test(trimmedValue)) {
    return EPISODE_FORMATS.PLAY_PATH;
  }

  // 檢測 encoded_id 格式 (長度通常在 10-20 字符之間)
  if (/^[A-Za-z0-9_-]+$/.test(trimmedValue) &&
      trimmedValue.length >= 10 &&
      trimmedValue.length <= 30) {
    return EPISODE_FORMATS.ENCODED_ID;
  }

  return EPISODE_FORMATS.UNKNOWN;
}

/**
 * 智慧播放地址轉換 (自動選擇最佳處理方式)
 * @param {Object} episodes - 集數物件
 * @param {number|string} vodId - 影片 ID
 * @param {Object} options - 轉換選項
 * @returns {string} CMS10 播放地址格式
 */
function convertPlayUrlSmart(episodes, vodId, options = {}) {
  const config = {
    preferEnhanced: true,
    fallbackToLegacy: true,
    ...options
  };

  // 如果偏好使用增強版且 episodes 看起來是新格式
  if (config.preferEnhanced) {
    try {
      const detection = detectEpisodesFormatCached(episodes);

      // 如果檢測到已知格式且信心度足夠高，使用增強版
      if (detection.format !== EPISODE_FORMATS.UNKNOWN && detection.confidence >= 0.7) {
        return convertPlayUrlEnhanced(episodes, vodId, options);
      }
    } catch (error) {
      console.warn('智慧轉換檢測失敗:', error);
    }
  }

  // 降級到舊版本或直接使用舊版本
  if (config.fallbackToLegacy) {
    return convertPlayUrl(episodes, vodId, options.baseUrl);
  }

  return "";
}

/**
 * 格式化備註資訊
 * @param {Object} item - 項目資料
 * @returns {string} 格式化後的備註
 *
 * @example
 * formatRemarks({ep: 12, status: "completed"})
 * // 返回: "第12集"
 */
function formatRemarks(item) {
  if (item.ep && item.ep > 0) {
    return `第${item.ep}集`;
  }

  // 根據狀態判斷
  if (item.status === 'completed') {
    return "已完結";
  } else if (item.status === 'airing') {
    return "連載中";
  }

  return "更新中";
}

/**
 * 判斷連載狀態
 * @param {Object} item - 項目資料
 * @returns {string} 連載狀態 ("0"=完結, "1"=連載中)
 *
 * @example
 * determineSerialStatus({status: "completed"})
 * // 返回: "0"
 */
function determineSerialStatus(item) {
  // 如果有明確的狀態標識
  if (item.status === 'completed') {
    return "0";
  } else if (item.status === 'airing') {
    return "1";
  }

  // 根據集數判斷 (簡化邏輯)
  if (item.ep && item.ep >= 12) {
    return "0"; // 假設 12 集以上為完結
  }

  return "1"; // 預設為連載中
}

/**
 * 提取演員資訊
 * @param {Object} item - 項目資料
 * @returns {string} 演員列表
 *
 * @example
 * extractActors({voice_actors: ["聲優A", "聲優B"]})
 * // 返回: "聲優A,聲優B"
 */
function extractActors(item) {
  // 動畫通常沒有演員，可以提取聲優資訊
  if (item.voice_actors && Array.isArray(item.voice_actors)) {
    return item.voice_actors.join(',');
  }

  // 如果有其他相關資訊可以提取
  if (item.cast) {
    return item.cast;
  }

  return ""; // 動畫預設為空
}

/**
 * 轉換單個列表項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 列表項目
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式列表項目
 *
 * @example
 * convertToListItem({id: 1, title: "進擊的巨人", category: ["動作"]})
 * // 返回: {vod_id: 1, vod_name: "進擊的巨人", type_id: 1, ...}
 */
function convertToListItem(item, options = {}) {
  const { baseUrl = "https://myself-bbs.jacob.workers.dev" } = options;

  // 獲取分類映射
  const categoryMapping = getCategoryMapping(item.category);

  // 格式化時間
  const vodTime = convertTimestamp(item.time || Date.now());

  // 格式化備註
  const remarks = formatRemarks(item);

  return {
    vod_id: parseInt(item.id),
    vod_name: item.title || "",
    type_id: categoryMapping.type_id,
    type_name: categoryMapping.type_name,
    vod_en: item.title || "",
    vod_time: vodTime,
    vod_remarks: remarks,
    vod_play_from: "myself-bbs",
    vod_pic: item.image || ""
  };
}

/**
 * 轉換單個詳情項目為 CMS10 格式
 * @param {Object} item - Myself-BBS 詳情項目
 * @param {Object} options - 轉換選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {Object} CMS10 格式詳情項目
 *
 * @example
 * convertToDetailItem({id: 1, title: "進擊的巨人", episodes: {"第 01 話": ["1", "001"]}})
 * // 返回: {vod_id: 1, vod_name: "進擊的巨人", vod_play_url: "第 01 話$...", ...}
 */
function convertToDetailItem(item, options = {}) {
  const {
    baseUrl = "https://myself-bbs.jacob.workers.dev",
    useEnhancedPlayUrl = true,
    quality = VIDEO_QUALITIES.HD720
  } = options;

  // 先轉換為列表項目格式
  const listItem = convertToListItem(item, options);

  // 選擇播放地址轉換方式
  let vodPlayUrl = "";

  if (useEnhancedPlayUrl) {
    // 使用增強版轉換 (支援新格式)
    vodPlayUrl = convertPlayUrlSmart(item.episodes, item.id, {
      baseUrl,
      quality,
      enableFallback: true,
      preferEnhanced: true
    });
  } else {
    // 使用舊版轉換 (向後相容)
    vodPlayUrl = convertPlayUrl(item.episodes, item.id, baseUrl);
  }

  // 添加詳情專用欄位
  return {
    ...listItem,
    vod_area: "日本",
    vod_lang: "日語",
    vod_year: convertPremiereToYear(item.premiere),
    vod_serial: determineSerialStatus(item),
    vod_actor: extractActors(item),
    vod_director: item.author || "",
    vod_content: item.description || "",
    vod_play_url: vodPlayUrl
  };
}

/**
 * 批量轉換列表項目
 * @param {Array} items - Myself-BBS 項目陣列
 * @param {string} type - 轉換類型 ('list' | 'detail')
 * @param {Object} options - 轉換選項
 * @returns {Array} CMS10 格式項目陣列
 *
 * @example
 * batchConvertItems([{id: 1, title: "動畫1"}, {id: 2, title: "動畫2"}], 'list')
 * // 返回: [{vod_id: 1, vod_name: "動畫1", ...}, {vod_id: 2, vod_name: "動畫2", ...}]
 */
function batchConvertItems(items, type = 'list', options = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  const converter = type === 'detail' ? convertToDetailItem : convertToListItem;

  return items
    .filter(item => item && item.id) // 過濾無效項目
    .map(item => {
      try {
        return converter(item, options);
      } catch (error) {
        console.warn(`轉換項目失敗 (ID: ${item.id}):`, error);
        return null;
      }
    })
    .filter(item => item !== null); // 移除轉換失敗的項目
}

export {
  // 原有函式 (向後相容)
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
  batchConvertItems,

  // 新增的增強版函式 (第二階段)
  convertPlayUrlEnhanced,
  convertPlayUrlSmart
};