/**
 * CMS10 資料篩選和搜尋功能
 *
 * 此模組包含對 Myself-BBS 資料進行篩選、搜尋和排序的所有功能函式
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:42:00 (UTC+8)
 */

import { CATEGORY_MAPPING } from './converters.js';

/**
 * 根據分類 ID 篩選項目
 * @param {Array} items - 項目陣列
 * @param {number|string} typeId - 分類 ID
 * @returns {Array} 篩選後的項目陣列
 *
 * @example
 * filterByCategory([{category: ["動作"]}, {category: ["戀愛"]}], 1)
 * // 返回: [{category: ["動作"]}]
 */
function filterByCategory(items, typeId) {
  if (!Array.isArray(items) || !typeId) {
    return items;
  }

  const targetTypeId = parseInt(typeId);

  // 建立反向映射表 (type_id -> category names)
  const reverseMapping = {};
  for (const [categoryName, mapping] of Object.entries(CATEGORY_MAPPING)) {
    reverseMapping[mapping.type_id] = categoryName;
  }

  const targetCategoryName = reverseMapping[targetTypeId];
  if (!targetCategoryName) {
    return [];
  }

  return items.filter(item => {
    if (!item.category || !Array.isArray(item.category)) {
      return false;
    }
    return item.category.includes(targetCategoryName);
  });
}

/**
 * 根據關鍵字搜尋項目
 * @param {Array} items - 項目陣列
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Array} 搜尋結果陣列
 *
 * @example
 * searchByKeyword([{title: "進擊的巨人"}, {title: "鬼滅之刃"}], "巨人")
 * // 返回: [{title: "進擊的巨人"}]
 */
function searchByKeyword(items, keyword) {
  if (!Array.isArray(items) || !keyword || typeof keyword !== 'string') {
    return items;
  }

  const searchTerm = keyword.toLowerCase().trim();
  if (searchTerm.length === 0) {
    return items;
  }

  return items.filter(item => {
    // 搜尋標題
    if (item.title && item.title.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // 搜尋描述
    if (item.description && item.description.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // 搜尋作者
    if (item.author && item.author.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // 搜尋分類
    if (item.category && Array.isArray(item.category)) {
      return item.category.some(cat =>
        cat && cat.toLowerCase().includes(searchTerm)
      );
    }

    return false;
  });
}

/**
 * 根據更新時間篩選項目
 * @param {Array} items - 項目陣列
 * @param {number|string} hours - 小時數 (篩選最近 N 小時內更新的項目)
 * @returns {Array} 篩選後的項目陣列
 *
 * @example
 * filterByUpdateTime([{time: Date.now()}, {time: Date.now() - 86400000}], 12)
 * // 返回最近 12 小時內更新的項目
 */
function filterByUpdateTime(items, hours) {
  if (!Array.isArray(items) || !hours) {
    return items;
  }

  const hoursNum = parseInt(hours);
  if (isNaN(hoursNum) || hoursNum <= 0) {
    return items;
  }

  const cutoffTime = Date.now() - (hoursNum * 60 * 60 * 1000);

  return items.filter(item => {
    const itemTime = item.time || item.updated_at || item.created_at;
    if (!itemTime) {
      return false;
    }

    const timestamp = typeof itemTime === 'number' ? itemTime : new Date(itemTime).getTime();
    return timestamp >= cutoffTime;
  });
}

/**
 * 根據 ID 列表篩選項目
 * @param {Array} items - 項目陣列
 * @param {string} idsString - 逗號分隔的 ID 字串
 * @returns {Array} 篩選後的項目陣列
 *
 * @example
 * filterByIds([{id: 1}, {id: 2}, {id: 3}], "1,3")
 * // 返回: [{id: 1}, {id: 3}]
 */
function filterByIds(items, idsString) {
  if (!Array.isArray(items) || !idsString) {
    return items;
  }

  const ids = idsString.split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id));

  if (ids.length === 0) {
    return [];
  }

  return items.filter(item => {
    const itemId = parseInt(item.id);
    return ids.includes(itemId);
  });
}

/**
 * 排序項目
 * @param {Array} items - 項目陣列
 * @param {string} sortBy - 排序欄位 ('time', 'title', 'id', 'ep')
 * @param {string} order - 排序順序 ('asc', 'desc')
 * @returns {Array} 排序後的項目陣列
 *
 * @example
 * sortItems([{id: 3, title: "C"}, {id: 1, title: "A"}], 'title', 'asc')
 * // 返回: [{id: 1, title: "A"}, {id: 3, title: "C"}]
 */
function sortItems(items, sortBy = 'time', order = 'desc') {
  if (!Array.isArray(items)) {
    return [];
  }

  const sortedItems = [...items];
  const isAscending = order.toLowerCase() === 'asc';

  sortedItems.sort((a, b) => {
    let valueA, valueB;

    switch (sortBy) {
      case 'time':
        valueA = a.time || a.updated_at || a.created_at || 0;
        valueB = b.time || b.updated_at || b.created_at || 0;
        break;

      case 'title':
        valueA = (a.title || '').toLowerCase();
        valueB = (b.title || '').toLowerCase();
        break;

      case 'id':
        valueA = parseInt(a.id) || 0;
        valueB = parseInt(b.id) || 0;
        break;

      case 'ep':
        valueA = parseInt(a.ep) || 0;
        valueB = parseInt(b.ep) || 0;
        break;

      default:
        return 0;
    }

    if (valueA < valueB) {
      return isAscending ? -1 : 1;
    }
    if (valueA > valueB) {
      return isAscending ? 1 : -1;
    }
    return 0;
  });

  return sortedItems;
}

/**
 * 組合篩選器 - 應用多個篩選條件
 * @param {Array} items - 原始項目陣列
 * @param {Object} filters - 篩選條件
 * @param {number} filters.t - 分類 ID
 * @param {string} filters.wd - 搜尋關鍵字
 * @param {number} filters.h - 更新時間 (小時)
 * @param {string} filters.ids - ID 列表
 * @param {string} filters.sort - 排序欄位
 * @param {string} filters.order - 排序順序
 * @returns {Array} 篩選和排序後的項目陣列
 *
 * @example
 * applyFilters(items, {t: 1, wd: "巨人", h: 24, sort: "time", order: "desc"})
 * // 返回篩選後的項目陣列
 */
function applyFilters(items, filters = {}) {
  if (!Array.isArray(items)) {
    return [];
  }

  let filteredItems = [...items];

  // 應用分類篩選
  if (filters.t) {
    filteredItems = filterByCategory(filteredItems, filters.t);
  }

  // 應用關鍵字搜尋
  if (filters.wd) {
    filteredItems = searchByKeyword(filteredItems, filters.wd);
  }

  // 應用時間篩選
  if (filters.h) {
    filteredItems = filterByUpdateTime(filteredItems, filters.h);
  }

  // 應用 ID 篩選
  if (filters.ids) {
    filteredItems = filterByIds(filteredItems, filters.ids);
  }

  // 應用排序
  if (filters.sort) {
    filteredItems = sortItems(filteredItems, filters.sort, filters.order);
  }

  return filteredItems;
}

/**
 * 獲取可用的分類列表
 * @returns {Array} 分類列表
 *
 * @example
 * getAvailableCategories()
 * // 返回: [{type_id: 1, type_name: "動作"}, {type_id: 2, type_name: "冒險"}, ...]
 */
function getAvailableCategories() {
  return Object.values(CATEGORY_MAPPING);
}

/**
 * 統計項目分類分佈
 * @param {Array} items - 項目陣列
 * @returns {Object} 分類統計
 *
 * @example
 * getCategoryStats([{category: ["動作"]}, {category: ["動作", "冒險"]}])
 * // 返回: {"動作": 2, "冒險": 1}
 */
function getCategoryStats(items) {
  if (!Array.isArray(items)) {
    return {};
  }

  const stats = {};

  items.forEach(item => {
    if (item.category && Array.isArray(item.category)) {
      item.category.forEach(cat => {
        stats[cat] = (stats[cat] || 0) + 1;
      });
    }
  });

  return stats;
}

export {
  filterByCategory,
  searchByKeyword,
  filterByUpdateTime,
  filterByIds,
  sortItems,
  applyFilters,
  getAvailableCategories,
  getCategoryStats
};