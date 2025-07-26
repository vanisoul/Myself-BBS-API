/**
 * CMS10 錯誤處理單元測試
 *
 * 測試錯誤處理機制、參數驗證和中介軟體功能
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:54:00 (UTC+8)
 */

import {
  ErrorTypes,
  ERROR_CODE_MAPPING,
  Cms10Error,
  createParameterError,
  createMissingParameterError,
  createDataNotFoundError,
  createSystemError,
  mapErrorToCms10,
  getLocalizedErrorMessage
} from '../errors.js';

import {
  validateParameter,
  validateQuery,
  validateBusinessLogic,
  validateFullQuery,
  validateIds,
  validatePagination,
  validateSearchKeyword
} from '../validators.js';

describe('CMS10 錯誤處理測試', () => {

  describe('Cms10Error 類別測試', () => {
    test('應該正確建立錯誤實例', () => {
      const error = new Cms10Error(
        ErrorTypes.INVALID_PARAMETER,
        '參數錯誤',
        { parameter: 'ac' }
      );

      expect(error.name).toBe('Cms10Error');
      expect(error.type).toBe(ErrorTypes.INVALID_PARAMETER);
      expect(error.message).toBe('參數錯誤');
      expect(error.details).toEqual({ parameter: 'ac' });
      expect(error.timestamp).toBeTruthy();
    });

    test('應該正確獲取 CMS10 狀態碼', () => {
      const paramError = new Cms10Error(ErrorTypes.INVALID_PARAMETER, '參數錯誤');
      const dataError = new Cms10Error(ErrorTypes.DATA_NOT_FOUND, '資料不存在');
      const systemError = new Cms10Error(ErrorTypes.INTERNAL_ERROR, '系統錯誤');

      expect(paramError.getCms10Code()).toBe(-1);
      expect(dataError.getCms10Code()).toBe(-2);
      expect(systemError.getCms10Code()).toBe(0);
    });

    test('應該正確轉換為 CMS10 回應', () => {
      const error = new Cms10Error(ErrorTypes.INVALID_PARAMETER, '參數錯誤');
      const response = error.toCms10Response();

      expect(response).toMatchObject({
        code: -1,
        msg: '參數錯誤',
        page: 1,
        pagecount: 0,
        limit: '20',
        total: 0,
        list: []
      });
    });
  });

  describe('錯誤工廠函式測試', () => {
    test('createParameterError 應該建立參數錯誤', () => {
      const error = createParameterError('ac', '必須為 list 或 detail');

      expect(error).toBeInstanceOf(Cms10Error);
      expect(error.type).toBe(ErrorTypes.INVALID_PARAMETER);
      expect(error.message).toBe('參數錯誤：ac 必須為 list 或 detail');
      expect(error.details.parameter).toBe('ac');
    });

    test('createMissingParameterError 應該建立缺少參數錯誤', () => {
      const error = createMissingParameterError('ids');

      expect(error.type).toBe(ErrorTypes.MISSING_PARAMETER);
      expect(error.message).toBe('缺少必要參數：ids');
    });

    test('createDataNotFoundError 應該建立資料不存在錯誤', () => {
      const error = createDataNotFoundError('anime', 123);

      expect(error.type).toBe(ErrorTypes.DATA_NOT_FOUND);
      expect(error.message).toBe('資料不存在：找不到 anime (ID: 123)');
      expect(error.details).toEqual({ resource: 'anime', id: 123 });
    });

    test('createSystemError 應該建立系統錯誤', () => {
      const originalError = new Error('網路連線失敗');
      const error = createSystemError('API 請求失敗', originalError);

      expect(error.type).toBe(ErrorTypes.INTERNAL_ERROR);
      expect(error.message).toBe('系統錯誤：API 請求失敗');
      expect(error.details.originalError).toBe('網路連線失敗');
    });
  });

  describe('錯誤映射測試', () => {
    test('應該正確映射 TypeError', () => {
      const typeError = new TypeError('Invalid type');
      const cms10Error = mapErrorToCms10(typeError);

      expect(cms10Error).toBeInstanceOf(Cms10Error);
      expect(cms10Error.type).toBe(ErrorTypes.INVALID_PARAMETER);
    });

    test('應該正確映射 RangeError', () => {
      const rangeError = new RangeError('Out of range');
      const cms10Error = mapErrorToCms10(rangeError);

      expect(cms10Error.type).toBe(ErrorTypes.PARAMETER_OUT_OF_RANGE);
    });

    test('應該保持 Cms10Error 不變', () => {
      const originalError = new Cms10Error(ErrorTypes.DATA_NOT_FOUND, '測試');
      const mappedError = mapErrorToCms10(originalError);

      expect(mappedError).toBe(originalError);
    });

    test('應該將未知錯誤映射為系統錯誤', () => {
      const unknownError = new Error('Unknown error');
      const cms10Error = mapErrorToCms10(unknownError);

      expect(cms10Error.type).toBe(ErrorTypes.INTERNAL_ERROR);
    });
  });

  describe('本地化訊息測試', () => {
    test('應該獲取繁體中文錯誤訊息', () => {
      const message = getLocalizedErrorMessage(ErrorTypes.INVALID_PARAMETER, 'zh-TW');
      expect(message).toBe('參數格式錯誤');
    });

    test('應該獲取英文錯誤訊息', () => {
      const message = getLocalizedErrorMessage(ErrorTypes.INVALID_PARAMETER, 'en');
      expect(message).toBe('Invalid parameter format');
    });

    test('應該回退到預設語言', () => {
      const message = getLocalizedErrorMessage(ErrorTypes.INVALID_PARAMETER, 'unknown');
      expect(message).toBe('參數格式錯誤');
    });
  });
});

describe('CMS10 參數驗證測試', () => {

  describe('單個參數驗證測試', () => {
    test('應該驗證必要參數', () => {
      const rule = { required: true, type: 'string' };

      const validResult = validateParameter('ac', 'list', rule);
      expect(validResult.isValid).toBe(true);
      expect(validResult.value).toBe('list');

      const invalidResult = validateParameter('ac', '', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('缺少必要參數：ac');
    });

    test('應該驗證數字類型', () => {
      const rule = { type: 'number', min: 1, max: 100 };

      const validResult = validateParameter('pg', '5', rule);
      expect(validResult.isValid).toBe(true);
      expect(validResult.value).toBe(5);

      const invalidResult = validateParameter('pg', 'abc', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('pg 必須為數字');
    });

    test('應該驗證數字範圍', () => {
      const rule = { type: 'number', min: 1, max: 100 };

      const tooSmallResult = validateParameter('pg', '0', rule);
      expect(tooSmallResult.isValid).toBe(false);
      expect(tooSmallResult.errors).toContain('pg 不能小於 1');

      const tooBigResult = validateParameter('pg', '101', rule);
      expect(tooBigResult.isValid).toBe(false);
      expect(tooBigResult.errors).toContain('pg 不能大於 100');
    });

    test('應該驗證字串長度', () => {
      const rule = { type: 'string', minLength: 2, maxLength: 10 };

      const tooShortResult = validateParameter('wd', 'a', rule);
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('wd 長度不能少於 2 字元');

      const tooLongResult = validateParameter('wd', 'a'.repeat(11), rule);
      expect(tooLongResult.isValid).toBe(false);
      expect(tooLongResult.errors).toContain('wd 長度不能超過 10 字元');
    });

    test('應該驗證枚舉值', () => {
      const rule = { type: 'string', enum: ['list', 'detail'] };

      const validResult = validateParameter('ac', 'list', rule);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateParameter('ac', 'invalid', rule);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('ac 必須為以下值之一：list, detail');
    });

    test('應該驗證正則表達式', () => {
      const rule = { type: 'string', pattern: /^\d+(,\d+)*$/ };

      const validResult = validateParameter('ids', '1,2,3', rule);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validateParameter('ids', 'a,b,c', rule);
      expect(invalidResult.isValid).toBe(false);
    });
  });

  describe('查詢參數驗證測試', () => {
    test('應該驗證有效的查詢參數', () => {
      const query = {
        ac: 'list',
        pg: '1',
        limit: '20',
        t: '1'
      };

      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
      expect(result.params).toMatchObject({
        ac: 'list',
        pg: 1,
        limit: 20,
        t: 1
      });
    });

    test('應該收集所有驗證錯誤', () => {
      const query = {
        ac: 'invalid',
        pg: '0',
        limit: '101'
      };

      const result = validateQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('應該處理可選參數', () => {
      const query = { ac: 'list' };

      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
      expect(result.params.ac).toBe('list');
      expect(result.params.pg).toBeUndefined();
    });
  });

  describe('業務邏輯驗證測試', () => {
    test('detail 操作應該要求 ids 參數', () => {
      const params = { ac: 'detail' };

      const result = validateBusinessLogic(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('detail 操作必須提供 ids 參數');
    });

    test('應該檢查頁碼合理性', () => {
      const params = { ac: 'list', pg: 1001 };

      const result = validateBusinessLogic(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('頁碼過大，建議使用更精確的篩選條件');
    });

    test('應該檢查搜尋關鍵字長度', () => {
      const params = { ac: 'list', wd: 'a' };

      const result = validateBusinessLogic(params);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('搜尋關鍵字至少需要 2 個字元');
    });
  });

  describe('專門驗證器測試', () => {
    test('validateIds 應該驗證 ID 列表', () => {
      const validResult = validateIds('1,2,3');
      expect(validResult.isValid).toBe(true);
      expect(validResult.ids).toEqual([1, 2, 3]);

      const invalidResult = validateIds('1,abc,3');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('無效的 ID: abc');
    });

    test('validateIds 應該檢查重複 ID', () => {
      const result = validateIds('1,2,2,3');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID 列表包含重複項目');
    });

    test('validatePagination 應該驗證分頁參數', () => {
      const validResult = validatePagination(1, 20);
      expect(validResult.isValid).toBe(true);
      expect(validResult.page).toBe(1);
      expect(validResult.limit).toBe(20);

      const invalidResult = validatePagination(0, 101);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('validateSearchKeyword 應該驗證搜尋關鍵字', () => {
      const validResult = validateSearchKeyword('進擊的巨人');
      expect(validResult.isValid).toBe(true);
      expect(validResult.keyword).toBe('進擊的巨人');

      const tooShortResult = validateSearchKeyword('a');
      expect(tooShortResult.isValid).toBe(false);
      expect(tooShortResult.errors).toContain('搜尋關鍵字至少需要 2 個字元');

      const invalidCharsResult = validateSearchKeyword('test<script>');
      expect(invalidCharsResult.isValid).toBe(false);
      expect(invalidCharsResult.errors).toContain('搜尋關鍵字包含無效字元');
    });
  });

  describe('完整驗證流程測試', () => {
    test('應該通過完整的有效查詢驗證', () => {
      const query = {
        ac: 'list',
        pg: '1',
        limit: '20',
        wd: '進擊的巨人'
      };

      const result = validateFullQuery(query);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.businessErrors).toEqual([]);
    });

    test('應該收集參數和業務邏輯錯誤', () => {
      const query = {
        ac: 'detail',
        pg: '0'
      };

      const result = validateFullQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.businessErrors).toContain('detail 操作必須提供 ids 參數');
    });

    test('應該在參數驗證失敗時跳過業務邏輯驗證', () => {
      const query = {
        ac: 'invalid'
      };

      const result = validateFullQuery(query);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.businessErrors).toEqual([]);
    });
  });
});