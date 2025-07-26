/**
 * CMS10 測試環境設定
 *
 * 為 CMS10 模組測試提供統一的環境設定和工具函式
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:56:00 (UTC+8)
 */

// 設定測試環境變數
process.env.NODE_ENV = 'test';
process.env.TZ = 'Asia/Taipei';

// 全域測試工具
global.testUtils = {
  /**
   * 建立測試用的動畫資料
   * @param {Object} overrides - 覆蓋的屬性
   * @returns {Object} 測試動畫資料
   */
  createMockAnime: (overrides = {}) => ({
    id: 1,
    title: '測試動畫',
    category: ['動作'],
    time: Date.now(),
    image: 'https://example.com/image.jpg',
    description: '測試描述',
    author: '測試作者',
    premiere: [2023, 1, 1],
    episodes: {
      '第 01 話': ['1', '001'],
      '第 02 話': ['1', '002']
    },
    ...overrides
  }),

  /**
   * 建立測試用的查詢參數
   * @param {Object} overrides - 覆蓋的屬性
   * @returns {Object} 測試查詢參數
   */
  createMockQuery: (overrides = {}) => ({
    ac: 'list',
    pg: '1',
    limit: '20',
    ...overrides
  }),

  /**
   * 驗證 CMS10 回應格式
   * @param {Object} response - 回應物件
   * @returns {boolean} 是否符合格式
   */
  validateCms10Response: (response) => {
    const requiredFields = ['code', 'msg', 'page', 'pagecount', 'limit', 'total', 'list'];
    return requiredFields.every(field => response.hasOwnProperty(field));
  },

  /**
   * 驗證 CMS10 列表項目格式
   * @param {Object} item - 列表項目
   * @returns {boolean} 是否符合格式
   */
  validateCms10ListItem: (item) => {
    const requiredFields = ['vod_id', 'vod_name', 'type_id', 'type_name'];
    return requiredFields.every(field => item.hasOwnProperty(field));
  },

  /**
   * 驗證 CMS10 詳情項目格式
   * @param {Object} item - 詳情項目
   * @returns {boolean} 是否符合格式
   */
  validateCms10DetailItem: (item) => {
    const requiredFields = [
      'vod_id', 'vod_name', 'type_id', 'type_name',
      'vod_area', 'vod_lang', 'vod_year', 'vod_serial',
      'vod_play_url', 'vod_content'
    ];
    return requiredFields.every(field => item.hasOwnProperty(field));
  },

  /**
   * 等待指定時間
   * @param {number} ms - 毫秒數
   * @returns {Promise} Promise 物件
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 建立 mock 函式的回應
   * @param {any} data - 回應資料
   * @param {number} delay - 延遲時間 (毫秒)
   * @returns {Promise} Promise 物件
   */
  createMockResponse: (data, delay = 0) => {
    return delay > 0
      ? new Promise(resolve => setTimeout(() => resolve(data), delay))
      : Promise.resolve(data);
  },

  /**
   * 建立 mock 錯誤
   * @param {string} message - 錯誤訊息
   * @param {number} delay - 延遲時間 (毫秒)
   * @returns {Promise} 拒絕的 Promise
   */
  createMockError: (message, delay = 0) => {
    const error = new Error(message);
    return delay > 0
      ? new Promise((_, reject) => setTimeout(() => reject(error), delay))
      : Promise.reject(error);
  }
};

// 全域測試常數
global.testConstants = {
  VALID_CATEGORIES: ['動作', '冒險', '科幻', '奇幻', '日常', '戀愛', '喜劇', '劇情', '懸疑', '恐怖'],
  VALID_AC_VALUES: ['list', 'detail'],
  DEFAULT_BASE_URL: 'https://myself-bbs.jacob.workers.dev',
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 20
};

// 自定義匹配器
expect.extend({
  /**
   * 檢查是否為有效的 CMS10 回應
   */
  toBeValidCms10Response(received) {
    const pass = global.testUtils.validateCms10Response(received);

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid CMS10 response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid CMS10 response`,
        pass: false
      };
    }
  },

  /**
   * 檢查是否為有效的時間格式
   */
  toBeValidTimeFormat(received) {
    const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    const pass = timePattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid time format`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid time format (YYYY-MM-DD HH:mm:ss)`,
        pass: false
      };
    }
  },

  /**
   * 檢查是否為有效的播放地址格式
   */
  toBeValidPlayUrl(received) {
    // 格式: 集數$地址#集數$地址
    const playUrlPattern = /^.+\$.+(\#.+\$.+)*$/;
    const pass = playUrlPattern.test(received);

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid play URL format`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid play URL format (episode$url#episode$url)`,
        pass: false
      };
    }
  }
});

// 設定全域錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 設定測試超時警告
const originalTimeout = setTimeout;
global.setTimeout = (fn, delay, ...args) => {
  if (delay > 5000) {
    console.warn(`Warning: setTimeout with delay ${delay}ms may cause test timeout`);
  }
  return originalTimeout(fn, delay, ...args);
};

// 模擬 console 方法以避免測試輸出污染
const originalConsole = { ...console };
global.mockConsole = () => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
};

global.restoreConsole = () => {
  Object.assign(console, originalConsole);
};

// 測試開始前的設定
beforeEach(() => {
  // 清除所有計時器
  jest.clearAllTimers();

  // 重置日期 mock
  jest.useRealTimers();
});

// 測試結束後的清理
afterEach(() => {
  // 恢復所有 mock
  jest.restoreAllMocks();

  // 清除所有計時器
  jest.clearAllTimers();
});

// 測試套件結束後的清理
afterAll(() => {
  // 恢復 console
  global.restoreConsole();
});

console.log('CMS10 測試環境設定完成');