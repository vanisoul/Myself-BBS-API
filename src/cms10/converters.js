/**
 * CMS10 資料轉換核心函式
 *
 * 此模組包含將 Myself-BBS 資料格式轉換為 CMS10 標準格式的所有核心函式
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:40:00 (UTC+8)
 */

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

  const date = new Date(timestamp);

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
 * 轉換播放地址格式
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
  const { baseUrl = "https://myself-bbs.jacob.workers.dev" } = options;

  // 先轉換為列表項目格式
  const listItem = convertToListItem(item, options);

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
    vod_play_url: convertPlayUrl(item.episodes, item.id, baseUrl)
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
};