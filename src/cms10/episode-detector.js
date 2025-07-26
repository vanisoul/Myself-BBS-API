/**
 * CMS10 Episodes 格式檢測器
 *
 * 此模組負責自動檢測和分析 episodes 資料格式，支援多種格式的自動識別
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 16:58:00 (UTC+8)
 */

/**
 * Episodes 格式類型常數
 */
export const EPISODE_FORMATS = {
  PLAY_PATH: 'play_path',      // play/46442/001 格式
  ENCODED_ID: 'encoded_id',    // AgADMg4AAvWkAVc 格式
  UNKNOWN: 'unknown'           // 未知或無效格式
};

/**
 * 格式檢測規則
 */
const FORMAT_PATTERNS = {
  // play/數字/數字 格式
  PLAY_PATH: /^play\/\d+\/\d+$/,
  // Base64 類似的編碼格式 (字母、數字、- 和 _)
  ENCODED_ID: /^[A-Za-z0-9_-]+$/
};

/**
 * 檢測單個 episode 值的格式
 * @param {string} episodeValue - Episode 值
 * @returns {string} 格式類型
 *
 * @example
 * detectSingleEpisodeFormat("play/46442/001")
 * // 返回: "play_path"
 *
 * @example
 * detectSingleEpisodeFormat("AgADMg4AAvWkAVc")
 * // 返回: "encoded_id"
 */
function detectSingleEpisodeFormat(episodeValue) {
  if (!episodeValue || typeof episodeValue !== 'string') {
    return EPISODE_FORMATS.UNKNOWN;
  }

  const trimmedValue = episodeValue.trim();

  // 檢測 play_path 格式
  if (FORMAT_PATTERNS.PLAY_PATH.test(trimmedValue)) {
    return EPISODE_FORMATS.PLAY_PATH;
  }

  // 檢測 encoded_id 格式 (長度通常在 10-20 字符之間)
  if (FORMAT_PATTERNS.ENCODED_ID.test(trimmedValue) &&
      trimmedValue.length >= 10 &&
      trimmedValue.length <= 30) {
    return EPISODE_FORMATS.ENCODED_ID;
  }

  return EPISODE_FORMATS.UNKNOWN;
}

/**
 * 檢測 episodes 物件的整體格式
 * @param {Object} episodes - Episodes 物件
 * @returns {Object} 檢測結果
 *
 * @example
 * detectEpisodesFormat({
 *   "第 01 話": "play/46442/001",
 *   "第 02 話": "play/46442/002"
 * })
 * // 返回: {
 * //   format: "play_path",
 * //   confidence: 1.0,
 * //   details: {...}
 * // }
 */
export function detectEpisodesFormat(episodes) {
  // 基本驗證
  if (!episodes || typeof episodes !== 'object') {
    return {
      format: EPISODE_FORMATS.UNKNOWN,
      confidence: 0,
      details: {
        error: 'Episodes 資料無效或為空',
        totalEpisodes: 0,
        validEpisodes: 0,
        formatCounts: {}
      }
    };
  }

  const entries = Object.entries(episodes);

  if (entries.length === 0) {
    return {
      format: EPISODE_FORMATS.UNKNOWN,
      confidence: 0,
      details: {
        error: 'Episodes 資料為空',
        totalEpisodes: 0,
        validEpisodes: 0,
        formatCounts: {}
      }
    };
  }

  // 統計各種格式的數量
  const formatCounts = {
    [EPISODE_FORMATS.PLAY_PATH]: 0,
    [EPISODE_FORMATS.ENCODED_ID]: 0,
    [EPISODE_FORMATS.UNKNOWN]: 0
  };

  const detectionResults = [];

  // 檢測每個 episode
  for (const [episodeName, episodeValue] of entries) {
    const detectedFormat = detectSingleEpisodeFormat(episodeValue);
    formatCounts[detectedFormat]++;

    detectionResults.push({
      name: episodeName,
      value: episodeValue,
      format: detectedFormat
    });
  }

  const totalEpisodes = entries.length;
  const validEpisodes = totalEpisodes - formatCounts[EPISODE_FORMATS.UNKNOWN];

  // 決定整體格式
  let dominantFormat = EPISODE_FORMATS.UNKNOWN;
  let confidence = 0;

  if (formatCounts[EPISODE_FORMATS.PLAY_PATH] > 0 && formatCounts[EPISODE_FORMATS.ENCODED_ID] === 0) {
    // 純 play_path 格式
    dominantFormat = EPISODE_FORMATS.PLAY_PATH;
    confidence = formatCounts[EPISODE_FORMATS.PLAY_PATH] / totalEpisodes;
  } else if (formatCounts[EPISODE_FORMATS.ENCODED_ID] > 0 && formatCounts[EPISODE_FORMATS.PLAY_PATH] === 0) {
    // 純 encoded_id 格式
    dominantFormat = EPISODE_FORMATS.ENCODED_ID;
    confidence = formatCounts[EPISODE_FORMATS.ENCODED_ID] / totalEpisodes;
  }

  return {
    format: dominantFormat,
    confidence: confidence,
    details: {
      totalEpisodes,
      validEpisodes,
      formatCounts,
      detectionResults,
      isMixed: (formatCounts[EPISODE_FORMATS.PLAY_PATH] > 0 && formatCounts[EPISODE_FORMATS.ENCODED_ID] > 0),
      hasUnknown: formatCounts[EPISODE_FORMATS.UNKNOWN] > 0
    }
  };
}

/**
 * 驗證 episodes 資料的完整性
 * @param {Object} episodes - Episodes 物件
 * @returns {Object} 驗證結果
 *
 * @example
 * validateEpisodesData({"第 01 話": "play/46442/001"})
 * // 返回: {isValid: true, errors: [], warnings: []}
 */
export function validateEpisodesData(episodes) {
  const errors = [];
  const warnings = [];

  // 基本結構檢查
  if (!episodes) {
    errors.push('Episodes 資料為 null 或 undefined');
    return { isValid: false, errors, warnings };
  }

  if (typeof episodes !== 'object') {
    errors.push('Episodes 資料必須為物件類型');
    return { isValid: false, errors, warnings };
  }

  if (Array.isArray(episodes)) {
    errors.push('Episodes 資料不能為陣列');
    return { isValid: false, errors, warnings };
  }

  const entries = Object.entries(episodes);

  if (entries.length === 0) {
    warnings.push('Episodes 資料為空');
  }

  // 檢查每個 episode
  for (const [episodeName, episodeValue] of entries) {
    if (!episodeName || typeof episodeName !== 'string') {
      errors.push(`無效的 episode 名稱: ${episodeName}`);
    }

    if (!episodeValue || typeof episodeValue !== 'string') {
      errors.push(`無效的 episode 值: ${episodeValue} (名稱: ${episodeName})`);
    }

    if (episodeName && episodeName.trim().length === 0) {
      warnings.push(`Episode 名稱為空字串: "${episodeName}"`);
    }

    if (episodeValue && episodeValue.trim().length === 0) {
      warnings.push(`Episode 值為空字串: "${episodeValue}" (名稱: ${episodeName})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 獲取格式檢測的詳細報告
 * @param {Object} episodes - Episodes 物件
 * @returns {Object} 詳細報告
 *
 * @example
 * getFormatDetectionReport(episodes)
 * // 返回詳細的格式分析報告
 */
export function getFormatDetectionReport(episodes) {
  const validation = validateEpisodesData(episodes);
  const detection = detectEpisodesFormat(episodes);

  return {
    timestamp: new Date().toISOString(),
    validation,
    detection,
    summary: {
      isValid: validation.isValid,
      format: detection.format,
      confidence: detection.confidence,
      totalEpisodes: detection.details.totalEpisodes,
      validEpisodes: detection.details.validEpisodes,
      hasIssues: validation.errors.length > 0 || validation.warnings.length > 0,
      isMixed: detection.details.isMixed
    },
    recommendations: generateRecommendations(validation, detection)
  };
}

/**
 * 根據檢測結果生成建議
 * @param {Object} validation - 驗證結果
 * @param {Object} detection - 檢測結果
 * @returns {Array} 建議列表
 */
function generateRecommendations(validation, detection) {
  const recommendations = [];

  if (!validation.isValid) {
    recommendations.push({
      type: 'error',
      message: '請修正 episodes 資料格式錯誤',
      details: validation.errors
    });
  }

  if (validation.warnings.length > 0) {
    recommendations.push({
      type: 'warning',
      message: '建議檢查 episodes 資料品質',
      details: validation.warnings
    });
  }

  if (detection.confidence < 0.8) {
    recommendations.push({
      type: 'warning',
      message: `格式檢測信心度較低 (${(detection.confidence * 100).toFixed(1)}%)，建議檢查資料一致性`
    });
  }

  if (detection.details.isMixed) {
    recommendations.push({
      type: 'info',
      message: '檢測到混合格式，將使用主要格式進行處理',
      details: `主要格式: ${detection.format}`
    });
  }

  if (detection.details.hasUnknown) {
    recommendations.push({
      type: 'warning',
      message: `發現 ${detection.details.formatCounts[EPISODE_FORMATS.UNKNOWN]} 個無法識別的格式`,
      details: '這些 episodes 可能無法正確處理'
    });
  }

  return recommendations;
}

/**
 * 快取機制 (簡單的 LRU 快取)
 */
class FormatDetectionCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  generateKey(episodes) {
    // 生成基於 episodes 內容的快取鍵
    const entries = Object.entries(episodes || {});
    const sortedEntries = entries.sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(sortedEntries);
  }

  get(episodes) {
    const key = this.generateKey(episodes);
    if (this.cache.has(key)) {
      // 移到最前面 (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(episodes, result) {
    const key = this.generateKey(episodes);

    // 如果快取已滿，刪除最舊的項目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, result);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// 全域快取實例
const formatDetectionCache = new FormatDetectionCache();

/**
 * 帶快取的格式檢測函式
 * @param {Object} episodes - Episodes 物件
 * @returns {Object} 檢測結果
 */
export function detectEpisodesFormatCached(episodes) {
  // 嘗試從快取獲取
  const cached = formatDetectionCache.get(episodes);
  if (cached) {
    return {
      ...cached,
      fromCache: true
    };
  }

  // 執行檢測
  const result = detectEpisodesFormat(episodes);

  // 儲存到快取
  formatDetectionCache.set(episodes, result);

  return {
    ...result,
    fromCache: false
  };
}

/**
 * 清除格式檢測快取
 */
export function clearFormatDetectionCache() {
  formatDetectionCache.clear();
}

/**
 * 獲取快取統計資訊
 */
export function getFormatDetectionCacheStats() {
  return {
    size: formatDetectionCache.size(),
    maxSize: formatDetectionCache.maxSize
  };
}