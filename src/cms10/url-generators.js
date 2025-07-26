/**
 * CMS10 M3U8 URL 生成器
 *
 * 此模組負責根據不同的 episodes 格式生成對應的 M3U8 播放連結
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 16:59:00 (UTC+8)
 */

import { EPISODE_FORMATS } from './episode-detector.js';

/**
 * URL 模板配置
 */
const URL_TEMPLATES = {
  // VPX 格式：https://vpx05.myself-bbs.com/vpx/{path}/{quality}.m3u8
  VPX: 'https://vpx05.myself-bbs.com/vpx/{path}/{quality}.m3u8',

  // HLS 格式：https://vpx05.myself-bbs.com/hls/{segments}/index.m3u8
  HLS: 'https://vpx05.myself-bbs.com/hls/{segments}/index.m3u8'
};

/**
 * 支援的影片品質選項
 */
export const VIDEO_QUALITIES = {
  HD720: '720p',
  HD1080: '1080p',
  SD480: '480p'
};

/**
 * 預設配置
 */
const DEFAULT_CONFIG = {
  quality: VIDEO_QUALITIES.HD720,
  baseUrl: 'https://vpx05.myself-bbs.com',
  timeout: 5000
};

/**
 * 生成 Play Path 格式的 M3U8 URL
 * @param {string} playPath - play/46442/001 格式的路徑
 * @param {Object} options - 生成選項
 * @param {string} options.quality - 影片品質 (720p, 1080p, 480p)
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {string} M3U8 URL
 *
 * @example
 * generatePlayPathUrl("play/46442/001")
 * // 返回: "https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8"
 *
 * @example
 * generatePlayPathUrl("play/46442/001", {quality: "1080p"})
 * // 返回: "https://vpx05.myself-bbs.com/vpx/46442/001/1080p.m3u8"
 */
export function generatePlayPathUrl(playPath, options = {}) {
  // 參數驗證
  if (!playPath || typeof playPath !== 'string') {
    throw new Error('Play path 不能為空且必須為字串');
  }

  const trimmedPath = playPath.trim();

  // 驗證 play path 格式
  if (!trimmedPath.startsWith('play/')) {
    throw new Error(`無效的 play path 格式: ${trimmedPath}`);
  }

  // 提取路徑部分 (移除 "play/" 前綴)
  const pathPart = trimmedPath.substring(5); // 移除 "play/"

  // 驗證路徑格式 (應該是 數字/數字)
  if (!/^\d+\/\d+$/.test(pathPart)) {
    throw new Error(`無效的 play path 格式: ${trimmedPath}，應該為 play/數字/數字`);
  }

  // 合併配置
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };

  // 驗證品質參數
  if (!Object.values(VIDEO_QUALITIES).includes(config.quality)) {
    console.warn(`不支援的影片品質: ${config.quality}，使用預設品質: ${DEFAULT_CONFIG.quality}`);
    config.quality = DEFAULT_CONFIG.quality;
  }

  // 生成 URL
  const url = URL_TEMPLATES.VPX
    .replace('{path}', pathPart)
    .replace('{quality}', config.quality);

  return url;
}

/**
 * 生成 Encoded ID 格式的 M3U8 URL
 * @param {string} encodedId - AgADMg4AAvWkAVc 格式的編碼 ID
 * @param {Object} options - 生成選項
 * @param {string} options.baseUrl - 基礎 URL
 * @returns {string} M3U8 URL
 *
 * @example
 * generateEncodedIdUrl("AgADMg4AAvWkAVc")
 * // 返回: "https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8"
 */
export function generateEncodedIdUrl(encodedId, options = {}) {
  // 參數驗證
  if (!encodedId || typeof encodedId !== 'string') {
    throw new Error('Encoded ID 不能為空且必須為字串');
  }

  const trimmedId = encodedId.trim();

  // 驗證編碼 ID 格式和長度
  if (!/^[A-Za-z0-9_-]+$/.test(trimmedId)) {
    throw new Error(`無效的編碼 ID 格式: ${trimmedId}`);
  }

  if (trimmedId.length < 10) {
    throw new Error(`編碼 ID 長度太短: ${trimmedId}，最少需要 10 個字符`);
  }

  // 合併配置
  const config = {
    ...DEFAULT_CONFIG,
    ...options
  };

  // 分割編碼 ID 生成路徑段
  const segments = splitEncodedId(trimmedId);

  // 生成 URL
  const url = URL_TEMPLATES.HLS.replace('{segments}', segments);

  return url;
}

/**
 * 分割編碼 ID 為路徑段
 * @param {string} encodedId - 編碼 ID
 * @returns {string} 路徑段 (例: Mg/4A/Av/AgADMg4AAvWkAVc)
 *
 * @example
 * splitEncodedId("AgADMg4AAvWkAVc")
 * // 返回: "Mg/4A/Av/AgADMg4AAvWkAVc"
 */
function splitEncodedId(encodedId) {
  if (encodedId.length < 10) {
    throw new Error(`編碼 ID 長度不足，無法分割: ${encodedId}`);
  }

  // 根據規則提取路徑段
  // AgADMg4AAvWkAVc -> Mg/4A/Av/AgADMg4AAvWkAVc
  const segment1 = encodedId.substring(4, 6);   // 第 5-6 字符: Mg
  const segment2 = encodedId.substring(6, 8);   // 第 7-8 字符: 4A
  const segment3 = encodedId.substring(8, 10);  // 第 9-10 字符: Av

  // 驗證分割結果
  if (!segment1 || !segment2 || !segment3) {
    throw new Error(`編碼 ID 分割失敗: ${encodedId}`);
  }

  return `${segment1}/${segment2}/${segment3}/${encodedId}`;
}

/**
 * 根據格式類型選擇對應的 URL 生成器
 * @param {string} format - 格式類型
 * @returns {Function} URL 生成器函式
 *
 * @example
 * const generator = getUrlGenerator("play_path");
 * const url = generator("play/46442/001");
 */
export function getUrlGenerator(format) {
  switch (format) {
    case EPISODE_FORMATS.PLAY_PATH:
      return generatePlayPathUrl;

    case EPISODE_FORMATS.ENCODED_ID:
      return generateEncodedIdUrl;

    default:
      throw new Error(`不支援的格式類型: ${format}`);
  }
}

/**
 * 批量生成 M3U8 URL
 * @param {Object} episodes - Episodes 物件
 * @param {string} format - 格式類型
 * @param {Object} options - 生成選項
 * @returns {Array} URL 生成結果陣列
 *
 * @example
 * batchGenerateUrls({
 *   "第 01 話": "play/46442/001",
 *   "第 02 話": "play/46442/002"
 * }, "play_path")
 * // 返回: [
 * //   {name: "第 01 話", url: "https://...", success: true},
 * //   {name: "第 02 話", url: "https://...", success: true}
 * // ]
 */
export function batchGenerateUrls(episodes, format, options = {}) {
  if (!episodes || typeof episodes !== 'object') {
    throw new Error('Episodes 資料無效');
  }

  const generator = getUrlGenerator(format);
  const results = [];

  for (const [episodeName, episodeValue] of Object.entries(episodes)) {
    try {
      const url = generator(episodeValue, options);
      results.push({
        name: episodeName,
        value: episodeValue,
        url: url,
        success: true,
        error: null
      });
    } catch (error) {
      console.warn(`生成 URL 失敗 (${episodeName}):`, error.message);
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
 * 驗證生成的 URL 格式
 * @param {string} url - 要驗證的 URL
 * @returns {Object} 驗證結果
 *
 * @example
 * validateGeneratedUrl("https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8")
 * // 返回: {isValid: true, type: "vpx", errors: []}
 */
export function validateGeneratedUrl(url) {
  const errors = [];
  let type = 'unknown';

  if (!url || typeof url !== 'string') {
    errors.push('URL 不能為空且必須為字串');
    return { isValid: false, type, errors };
  }

  try {
    const urlObj = new URL(url);

    // 檢查基礎域名
    if (!urlObj.hostname.includes('myself-bbs.com')) {
      errors.push('URL 域名不正確');
    }

    // 檢查協議
    if (urlObj.protocol !== 'https:') {
      errors.push('URL 必須使用 HTTPS 協議');
    }

    // 檢查路徑格式
    const pathname = urlObj.pathname;

    if (pathname.includes('/vpx/') && pathname.endsWith('.m3u8')) {
      type = 'vpx';
      // 驗證 VPX 格式: /vpx/數字/數字/品質.m3u8
      if (!/\/vpx\/\d+\/\d+\/(720p|1080p|480p)\.m3u8$/.test(pathname)) {
        errors.push('VPX URL 路徑格式不正確');
      }
    } else if (pathname.includes('/hls/') && pathname.endsWith('/index.m3u8')) {
      type = 'hls';
      // 驗證 HLS 格式: /hls/段/段/段/ID/index.m3u8
      if (!/\/hls\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/index\.m3u8$/.test(pathname)) {
        errors.push('HLS URL 路徑格式不正確');
      }
    } else {
      errors.push('未知的 URL 格式');
    }

  } catch (error) {
    errors.push(`URL 格式無效: ${error.message}`);
  }

  return {
    isValid: errors.length === 0,
    type,
    errors
  };
}

/**
 * 生成降級 URL (當主要生成失敗時使用)
 * @param {string} episodeName - 集數名稱
 * @param {string} episodeValue - 集數值
 * @param {number} vodId - 影片 ID
 * @returns {string} 降級 URL
 */
export function generateFallbackUrl(episodeName, episodeValue, vodId) {
  // 嘗試從集數名稱中提取數字
  const episodeMatch = episodeName.match(/(\d+)/);
  const episodeNumber = episodeMatch ? episodeMatch[1].padStart(3, '0') : '001';

  // 生成基本的降級 URL
  return `${DEFAULT_CONFIG.baseUrl}/m3u8/${vodId}/${episodeNumber}`;
}

/**
 * URL 生成統計
 */
class UrlGenerationStats {
  constructor() {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      byFormat: {
        [EPISODE_FORMATS.PLAY_PATH]: { total: 0, successful: 0, failed: 0 },
        [EPISODE_FORMATS.ENCODED_ID]: { total: 0, successful: 0, failed: 0 }
      },
      errors: []
    };
  }

  record(format, success, error = null) {
    this.stats.total++;
    this.stats.byFormat[format].total++;

    if (success) {
      this.stats.successful++;
      this.stats.byFormat[format].successful++;
    } else {
      this.stats.failed++;
      this.stats.byFormat[format].failed++;
      if (error) {
        this.stats.errors.push({
          timestamp: new Date().toISOString(),
          format,
          error: error.toString()
        });
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.total > 0 ? (this.stats.successful / this.stats.total) : 0,
      byFormat: Object.fromEntries(
        Object.entries(this.stats.byFormat).map(([format, data]) => [
          format,
          {
            ...data,
            successRate: data.total > 0 ? (data.successful / data.total) : 0
          }
        ])
      )
    };
  }

  reset() {
    this.stats = {
      total: 0,
      successful: 0,
      failed: 0,
      byFormat: {
        [EPISODE_FORMATS.PLAY_PATH]: { total: 0, successful: 0, failed: 0 },
        [EPISODE_FORMATS.ENCODED_ID]: { total: 0, successful: 0, failed: 0 }
      },
      errors: []
    };
  }
}

// 全域統計實例
const urlGenerationStats = new UrlGenerationStats();

/**
 * 帶統計的 URL 生成函式
 * @param {string} episodeValue - Episode 值
 * @param {string} format - 格式類型
 * @param {Object} options - 生成選項
 * @returns {string} 生成的 URL
 */
export function generateUrlWithStats(episodeValue, format, options = {}) {
  try {
    const generator = getUrlGenerator(format);
    const url = generator(episodeValue, options);
    urlGenerationStats.record(format, true);
    return url;
  } catch (error) {
    urlGenerationStats.record(format, false, error);
    throw error;
  }
}

/**
 * 獲取 URL 生成統計
 */
export function getUrlGenerationStats() {
  return urlGenerationStats.getStats();
}

/**
 * 重置 URL 生成統計
 */
export function resetUrlGenerationStats() {
  urlGenerationStats.reset();
}

/**
 * 測試 URL 可訪問性 (可選功能)
 * @param {string} url - 要測試的 URL
 * @param {Object} options - 測試選項
 * @returns {Promise<Object>} 測試結果
 */
export async function testUrlAccessibility(url, options = {}) {
  const config = {
    timeout: 5000,
    method: 'HEAD',
    ...options
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    const response = await fetch(url, {
      method: config.method,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return {
      url,
      accessible: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      error: null
    };

  } catch (error) {
    return {
      url,
      accessible: false,
      status: null,
      statusText: null,
      headers: {},
      error: error.message
    };
  }
}