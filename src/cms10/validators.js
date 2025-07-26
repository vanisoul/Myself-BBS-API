/**
 * CMS10 參數驗證和業務邏輯驗證
 *
 * 此模組包含所有 CMS10 API 參數的驗證邏輯和業務規則檢查
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:46:00 (UTC+8)
 */

import { ErrorTypes, createParameterError, createMissingParameterError } from './errors.js';

/**
 * 參數驗證規則定義
 */
const ValidationRules = {
  ac: {
    required: true,
    type: 'string',
    enum: ['videolist', 'detail'],
    message: 'ac 參數必須為 videolist 或 detail'
  },

  ids: {
    required: false,
    type: 'string',
    pattern: /^\d+(,\d+)*$/,
    message: 'ids 參數格式錯誤，應為數字或逗號分隔的數字列表'
  },

  pg: {
    required: false,
    type: 'number',
    min: 1,
    max: 10000,
    message: 'pg 參數必須為 1-10000 之間的整數'
  },

  t: {
    required: false,
    type: 'number',
    min: 1,
    max: 99,
    message: 't 參數必須為 1-99 之間的整數'
  },

  h: {
    required: false,
    type: 'number',
    min: 1,
    max: 8760, // 一年的小時數
    message: 'h 參數必須為 1-8760 之間的整數'
  },

  wd: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    message: 'wd 參數長度必須為 1-100 字元'
  },

  limit: {
    required: false,
    type: 'number',
    min: 1,
    max: 100,
    message: 'limit 參數必須為 1-100 之間的整數'
  },

  sort: {
    required: false,
    type: 'string',
    enum: ['time', 'title', 'id', 'ep'],
    message: 'sort 參數必須為 time, title, id, ep 之一'
  },

  order: {
    required: false,
    type: 'string',
    enum: ['asc', 'desc'],
    message: 'order 參數必須為 asc 或 desc'
  }
};

/**
 * 驗證單個參數
 * @param {string} name - 參數名稱
 * @param {any} value - 參數值
 * @param {Object} rule - 驗證規則
 * @returns {Object} 驗證結果
 *
 * @example
 * validateParameter('ac', 'list', ValidationRules.ac)
 * // 返回: {isValid: true, errors: [], value: 'list'}
 */
function validateParameter(name, value, rule) {
  const errors = [];

  // 檢查必要參數
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`缺少必要參數：${name}`);
    return { isValid: false, errors };
  }

  // 如果參數不存在且非必要，跳過驗證
  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [] };
  }

  // 類型檢查
  if (rule.type === 'number') {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push(`${name} 必須為數字`);
    } else {
      value = numValue;

      // 範圍檢查
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${name} 不能小於 ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${name} 不能大於 ${rule.max}`);
      }
    }
  }

  // 字串檢查
  if (rule.type === 'string') {
    const strValue = String(value);

    // 長度檢查
    if (rule.minLength !== undefined && strValue.length < rule.minLength) {
      errors.push(`${name} 長度不能少於 ${rule.minLength} 字元`);
    }
    if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
      errors.push(`${name} 長度不能超過 ${rule.maxLength} 字元`);
    }

    // 格式檢查
    if (rule.pattern && !rule.pattern.test(strValue)) {
      errors.push(rule.message || `${name} 格式錯誤`);
    }

    // 枚舉檢查
    if (rule.enum && !rule.enum.includes(strValue)) {
      errors.push(`${name} 必須為以下值之一：${rule.enum.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    value
  };
}

/**
 * 驗證所有參數
 * @param {Object} query - 查詢參數物件
 * @returns {Object} 驗證結果
 *
 * @example
 * validateQuery({ac: 'list', pg: '1', t: '1'})
 * // 返回: {isValid: true, errors: [], params: {ac: 'list', pg: 1, t: 1}}
 */
function validateQuery(query) {
  const errors = [];
  const validatedParams = {};

  for (const [name, rule] of Object.entries(ValidationRules)) {
    const result = validateParameter(name, query[name], rule);

    if (!result.isValid) {
      errors.push(...result.errors);
    } else if (result.value !== undefined) {
      validatedParams[name] = result.value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    params: validatedParams
  };
}

/**
 * 業務邏輯驗證
 * @param {Object} params - 已驗證的參數
 * @returns {Object} 驗證結果
 *
 * @example
 * validateBusinessLogic({ac: 'detail'})
 * // 返回: {isValid: false, errors: ['detail 操作必須提供 ids 參數']}
 */
function validateBusinessLogic(params) {
  const errors = [];

  // detail 操作必須提供 ids
  if (params.ac === 'detail' && !params.ids) {
    errors.push('detail 操作必須提供 ids 參數');
  }

  // 分頁參數合理性檢查
  if (params.pg && params.pg > 1000) {
    errors.push('頁碼過大，建議使用更精確的篩選條件');
  }

  // 搜尋關鍵字長度檢查
  if (params.wd && params.wd.length < 2) {
    errors.push('搜尋關鍵字至少需要 2 個字元');
  }

  // IDs 數量限制檢查
  if (params.ids) {
    const idCount = params.ids.split(',').length;
    if (idCount > 50) {
      errors.push('一次最多只能查詢 50 個 ID');
    }
  }

  // 排序參數組合檢查
  if (params.order && !params.sort) {
    errors.push('指定 order 參數時必須同時指定 sort 參數');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 完整的參數驗證流程
 * @param {Object} query - 查詢參數物件
 * @returns {Object} 完整驗證結果
 *
 * @example
 * validateFullQuery({ac: 'list', pg: '1', wd: 'test'})
 * // 返回: {isValid: true, errors: [], params: {...}, businessErrors: []}
 */
function validateFullQuery(query) {
  // 1. 基本參數驗證
  const paramValidation = validateQuery(query);

  if (!paramValidation.isValid) {
    return {
      isValid: false,
      errors: paramValidation.errors,
      params: {},
      businessErrors: []
    };
  }

  // 2. 業務邏輯驗證
  const businessValidation = validateBusinessLogic(paramValidation.params);

  return {
    isValid: businessValidation.isValid,
    errors: paramValidation.errors,
    params: paramValidation.params,
    businessErrors: businessValidation.errors
  };
}

/**
 * 驗證 ID 列表格式
 * @param {string} idsString - ID 字串
 * @returns {Object} 驗證結果
 *
 * @example
 * validateIds('1,2,3')
 * // 返回: {isValid: true, ids: [1, 2, 3], errors: []}
 */
function validateIds(idsString) {
  const errors = [];

  if (!idsString || typeof idsString !== 'string') {
    errors.push('IDs 參數必須為字串');
    return { isValid: false, ids: [], errors };
  }

  const ids = [];
  const idParts = idsString.split(',');

  for (const idPart of idParts) {
    const trimmedId = idPart.trim();
    const numId = parseInt(trimmedId);

    if (isNaN(numId) || numId <= 0) {
      errors.push(`無效的 ID: ${trimmedId}`);
    } else {
      ids.push(numId);
    }
  }

  // 檢查重複 ID
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    errors.push('ID 列表包含重複項目');
  }

  return {
    isValid: errors.length === 0,
    ids: uniqueIds,
    errors
  };
}

/**
 * 驗證分頁參數
 * @param {number} page - 頁碼
 * @param {number} limit - 每頁數量
 * @returns {Object} 驗證結果
 *
 * @example
 * validatePagination(1, 20)
 * // 返回: {isValid: true, page: 1, limit: 20, errors: []}
 */
function validatePagination(page, limit) {
  const errors = [];
  let validPage = 1;
  let validLimit = 20;

  // 驗證頁碼
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('頁碼必須為大於 0 的整數');
    } else if (pageNum > 10000) {
      errors.push('頁碼不能超過 10000');
    } else {
      validPage = pageNum;
    }
  }

  // 驗證每頁數量
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('每頁數量必須為大於 0 的整數');
    } else if (limitNum > 100) {
      errors.push('每頁數量不能超過 100');
    } else {
      validLimit = limitNum;
    }
  }

  return {
    isValid: errors.length === 0,
    page: validPage,
    limit: validLimit,
    errors
  };
}

/**
 * 驗證搜尋關鍵字
 * @param {string} keyword - 搜尋關鍵字
 * @returns {Object} 驗證結果
 *
 * @example
 * validateSearchKeyword('進擊的巨人')
 * // 返回: {isValid: true, keyword: '進擊的巨人', errors: []}
 */
function validateSearchKeyword(keyword) {
  const errors = [];

  if (!keyword || typeof keyword !== 'string') {
    errors.push('搜尋關鍵字必須為字串');
    return { isValid: false, keyword: '', errors };
  }

  const trimmedKeyword = keyword.trim();

  if (trimmedKeyword.length === 0) {
    errors.push('搜尋關鍵字不能為空');
  } else if (trimmedKeyword.length < 2) {
    errors.push('搜尋關鍵字至少需要 2 個字元');
  } else if (trimmedKeyword.length > 100) {
    errors.push('搜尋關鍵字不能超過 100 個字元');
  }

  // 檢查特殊字元
  const invalidChars = /[<>'"&]/;
  if (invalidChars.test(trimmedKeyword)) {
    errors.push('搜尋關鍵字包含無效字元');
  }

  return {
    isValid: errors.length === 0,
    keyword: trimmedKeyword,
    errors
  };
}

/**
 * 建立參數驗證錯誤
 * @param {Array} errors - 錯誤列表
 * @returns {Error} 參數錯誤物件
 *
 * @example
 * createValidationError(['參數 ac 必須為 list 或 detail'])
 * // 返回: Cms10Error 實例
 */
function createValidationError(errors) {
  const errorMessage = errors.join('; ');
  return createParameterError('validation', errorMessage);
}

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
};