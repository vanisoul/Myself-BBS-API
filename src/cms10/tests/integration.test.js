/**
 * CMS10 API 整合測試
 *
 * 測試完整的 API 端點功能，包括路由、處理器和錯誤處理的整合
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:55:00 (UTC+8)
 */

import {
  handleCms10Request,
  handleCms10List,
  handleCms10Detail,
  getCms10Categories,
  getCms10Info,
  healthCheck
} from '../handlers.js';

import {
  createCms10Router,
  validateRouteConfig
} from '../routes.js';

// Mock 外部依賴
jest.mock('../../list.js', () => ({
  getAiringList: jest.fn(),
  getCompletedList: jest.fn()
}));

jest.mock('../../anime.js', () => ({
  getAnime: jest.fn()
}));

jest.mock('../../response.js', () => ({
  response: jest.fn((options) => ({
    status: 200,
    headers: new Headers(),
    body: options.data
  }))
}));

import { getAiringList, getCompletedList } from '../../list.js';
import { getAnime } from '../../anime.js';

describe('CMS10 API 整合測試', () => {

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();

    // 設定預設的 mock 回應
    getAiringList.mockResolvedValue({
      data: {
        data: [
          { id: 1, title: '連載動畫1', category: ['動作'], time: Date.now() },
          { id: 2, title: '連載動畫2', category: ['戀愛'], time: Date.now() }
        ]
      }
    });

    getCompletedList.mockResolvedValue({
      data: {
        data: [
          { id: 3, title: '完結動畫1', category: ['科幻'], time: Date.now() },
          { id: 4, title: '完結動畫2', category: ['奇幻'], time: Date.now() }
        ]
      }
    });

    getAnime.mockImplementation((id) => {
      const animeData = {
        1: { id: 1, title: '動畫1詳情', category: ['動作'], episodes: { '第 01 話': ['1', '001'] } },
        2: { id: 2, title: '動畫2詳情', category: ['戀愛'], episodes: { '第 01 話': ['2', '001'] } }
      };
      return Promise.resolve(animeData[id] || null);
    });
  });

  describe('handleCms10List 整合測試', () => {
    test('應該成功處理基本列表請求', async () => {
      const query = { ac: 'list', pg: '1', limit: '20' };

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.msg).toBe('數據列表');
      expect(responseData.list).toHaveLength(4); // 2 連載 + 2 完結
      expect(responseData.total).toBe(4);
    });

    test('應該正確處理分頁', async () => {
      const query = { ac: 'list', pg: '1', limit: '2' };

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.list).toHaveLength(2);
      expect(responseData.page).toBe(1);
      expect(responseData.pagecount).toBe(2);
      expect(responseData.limit).toBe('2');
    });

    test('應該正確處理搜尋', async () => {
      const query = { ac: 'list', wd: '動畫1' };

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list.length).toBeGreaterThan(0);
      // 檢查搜尋結果是否包含關鍵字
      expect(responseData.list.some(item => item.vod_name.includes('動畫1'))).toBe(true);
    });

    test('應該正確處理分類篩選', async () => {
      const query = { ac: 'list', t: '1' }; // 動作分類

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list.every(item => item.type_id === 1)).toBe(true);
    });

    test('應該處理無資料情況', async () => {
      getAiringList.mockResolvedValue({ data: { data: [] } });
      getCompletedList.mockResolvedValue({ data: { data: [] } });

      const query = { ac: 'list' };

      await expect(handleCms10List(query)).rejects.toThrow();
    });

    test('應該處理資料源錯誤', async () => {
      getAiringList.mockRejectedValue(new Error('網路錯誤'));
      getCompletedList.mockRejectedValue(new Error('網路錯誤'));

      const query = { ac: 'list' };

      await expect(handleCms10List(query)).rejects.toThrow();
    });
  });

  describe('handleCms10Detail 整合測試', () => {
    test('應該成功處理詳情請求', async () => {
      const query = { ac: 'detail', ids: '1,2' };

      const result = await handleCms10Detail(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list).toHaveLength(2);
      expect(responseData.list[0]).toHaveProperty('vod_play_url');
      expect(responseData.list[0]).toHaveProperty('vod_content');
    });

    test('應該處理單個 ID', async () => {
      const query = { ac: 'detail', ids: '1' };

      const result = await handleCms10Detail(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list).toHaveLength(1);
      expect(responseData.list[0].vod_id).toBe(1);
    });

    test('應該處理不存在的 ID', async () => {
      getAnime.mockResolvedValue(null);

      const query = { ac: 'detail', ids: '999' };

      await expect(handleCms10Detail(query)).rejects.toThrow();
    });

    test('應該處理部分失敗的情況', async () => {
      getAnime.mockImplementation((id) => {
        if (id === 1) return Promise.resolve({ id: 1, title: '動畫1' });
        if (id === 2) return Promise.reject(new Error('獲取失敗'));
        return Promise.resolve(null);
      });

      const query = { ac: 'detail', ids: '1,2' };

      const result = await handleCms10Detail(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list).toHaveLength(1); // 只有成功的項目
    });

    test('應該驗證 IDs 格式', async () => {
      const query = { ac: 'detail', ids: 'invalid' };

      await expect(handleCms10Detail(query)).rejects.toThrow();
    });
  });

  describe('handleCms10Request 路由測試', () => {
    test('應該正確路由到列表處理器', async () => {
      const query = { ac: 'list' };

      const result = await handleCms10Request(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list).toBeDefined();
    });

    test('應該正確路由到詳情處理器', async () => {
      const query = { ac: 'detail', ids: '1' };

      const result = await handleCms10Request(query);
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.list[0]).toHaveProperty('vod_play_url');
    });

    test('應該處理無效的操作類型', async () => {
      const query = { ac: 'invalid' };

      await expect(handleCms10Request(query)).rejects.toThrow();
    });

    test('應該處理缺少 ac 參數', async () => {
      const query = {};

      await expect(handleCms10Request(query)).rejects.toThrow();
    });
  });

  describe('擴展功能測試', () => {
    test('getCms10Categories 應該返回分類列表', async () => {
      const result = await getCms10Categories();
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.msg).toBe('分類列表');
      expect(responseData.list).toBeInstanceOf(Array);
      expect(responseData.list.length).toBeGreaterThan(0);
      expect(responseData.list[0]).toHaveProperty('type_id');
      expect(responseData.list[0]).toHaveProperty('type_name');
    });

    test('getCms10Info 應該返回 API 資訊', async () => {
      const result = await getCms10Info();
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.msg).toBe('API資訊');
      expect(responseData.list).toHaveLength(1);
      expect(responseData.list[0]).toHaveProperty('name');
      expect(responseData.list[0]).toHaveProperty('version');
      expect(responseData.list[0]).toHaveProperty('endpoints');
    });

    test('healthCheck 應該返回健康狀態', async () => {
      const result = await healthCheck();
      const responseData = JSON.parse(result.body);

      expect(responseData.code).toBe(1);
      expect(responseData.msg).toBe('健康檢查');
      expect(responseData.list[0]).toHaveProperty('status');
      expect(responseData.list[0]).toHaveProperty('services');
      expect(responseData.list[0]).toHaveProperty('responseTime');
    });
  });

  describe('錯誤處理整合測試', () => {
    test('應該正確處理參數驗證錯誤', async () => {
      const query = { ac: 'list', pg: '0' }; // 無效頁碼

      await expect(handleCms10List(query)).rejects.toThrow();
    });

    test('應該正確處理業務邏輯錯誤', async () => {
      const query = { ac: 'detail' }; // 缺少 ids

      await expect(handleCms10Detail(query)).rejects.toThrow();
    });

    test('應該正確處理系統錯誤', async () => {
      getAiringList.mockRejectedValue(new Error('系統錯誤'));
      getCompletedList.mockRejectedValue(new Error('系統錯誤'));

      const query = { ac: 'list' };

      await expect(handleCms10List(query)).rejects.toThrow();
    });
  });

  describe('資料轉換整合測試', () => {
    test('應該正確轉換列表項目格式', async () => {
      const query = { ac: 'list' };

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      const item = responseData.list[0];
      expect(item).toHaveProperty('vod_id');
      expect(item).toHaveProperty('vod_name');
      expect(item).toHaveProperty('type_id');
      expect(item).toHaveProperty('type_name');
      expect(item).toHaveProperty('vod_time');
      expect(item).toHaveProperty('vod_remarks');
      expect(item).toHaveProperty('vod_play_from');
    });

    test('應該正確轉換詳情項目格式', async () => {
      const query = { ac: 'detail', ids: '1' };

      const result = await handleCms10Detail(query);
      const responseData = JSON.parse(result.body);

      const item = responseData.list[0];
      expect(item).toHaveProperty('vod_area');
      expect(item).toHaveProperty('vod_lang');
      expect(item).toHaveProperty('vod_year');
      expect(item).toHaveProperty('vod_serial');
      expect(item).toHaveProperty('vod_play_url');
      expect(item).toHaveProperty('vod_content');
    });

    test('應該正確處理分類映射', async () => {
      const query = { ac: 'list' };

      const result = await handleCms10List(query);
      const responseData = JSON.parse(result.body);

      const actionItem = responseData.list.find(item => item.type_name === '動作');
      expect(actionItem).toBeDefined();
      expect(actionItem.type_id).toBe(1);
    });
  });

  describe('效能測試', () => {
    test('列表請求應該在合理時間內完成', async () => {
      const startTime = Date.now();
      const query = { ac: 'list' };

      await handleCms10List(query);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // 5 秒內完成
    });

    test('詳情請求應該在合理時間內完成', async () => {
      const startTime = Date.now();
      const query = { ac: 'detail', ids: '1,2,3' };

      await handleCms10Detail(query);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // 3 秒內完成
    });
  });
});

describe('CMS10 路由配置測試', () => {

  test('應該建立有效的路由器', () => {
    const router = createCms10Router();
    expect(router).toBeDefined();
    expect(typeof router.handle).toBe('function');
  });

  test('應該通過路由配置驗證', () => {
    const validation = validateRouteConfig();

    expect(validation.isValid).toBe(true);
    expect(validation.errors).toEqual([]);
    expect(validation.summary.totalEndpoints).toBeGreaterThan(0);
    expect(validation.summary.cms10Endpoints).toBeGreaterThan(0);
  });

  test('路由配置應該包含所有必要端點', () => {
    const validation = validateRouteConfig();

    expect(validation.summary.cms10Endpoints).toBeGreaterThanOrEqual(5);
    // 至少包含：list, detail, categories, info, health
  });
});

describe('CMS10 相容性測試', () => {

  test('回應格式應該符合 CMS10 標準', async () => {
    const query = { ac: 'list' };

    const result = await handleCms10List(query);
    const responseData = JSON.parse(result.body);

    // 檢查必要欄位
    expect(responseData).toHaveProperty('code');
    expect(responseData).toHaveProperty('msg');
    expect(responseData).toHaveProperty('page');
    expect(responseData).toHaveProperty('pagecount');
    expect(responseData).toHaveProperty('limit');
    expect(responseData).toHaveProperty('total');
    expect(responseData).toHaveProperty('list');

    // 檢查資料類型
    expect(typeof responseData.code).toBe('number');
    expect(typeof responseData.msg).toBe('string');
    expect(typeof responseData.page).toBe('number');
    expect(typeof responseData.pagecount).toBe('number');
    expect(typeof responseData.limit).toBe('string');
    expect(typeof responseData.total).toBe('number');
    expect(Array.isArray(responseData.list)).toBe(true);
  });

  test('列表項目應該符合 CMS10 格式', async () => {
    const query = { ac: 'list' };

    const result = await handleCms10List(query);
    const responseData = JSON.parse(result.body);

    if (responseData.list.length > 0) {
      const item = responseData.list[0];

      // 檢查必要欄位
      expect(item).toHaveProperty('vod_id');
      expect(item).toHaveProperty('vod_name');
      expect(item).toHaveProperty('type_id');
      expect(item).toHaveProperty('type_name');

      // 檢查資料類型
      expect(typeof item.vod_id).toBe('number');
      expect(typeof item.vod_name).toBe('string');
      expect(typeof item.type_id).toBe('number');
      expect(typeof item.type_name).toBe('string');
    }
  });

  test('詳情項目應該包含額外欄位', async () => {
    const query = { ac: 'detail', ids: '1' };

    const result = await handleCms10Detail(query);
    const responseData = JSON.parse(result.body);

    if (responseData.list.length > 0) {
      const item = responseData.list[0];

      // 檢查詳情專用欄位
      expect(item).toHaveProperty('vod_area');
      expect(item).toHaveProperty('vod_lang');
      expect(item).toHaveProperty('vod_year');
      expect(item).toHaveProperty('vod_serial');
      expect(item).toHaveProperty('vod_play_url');
      expect(item).toHaveProperty('vod_content');
    }
  });
});