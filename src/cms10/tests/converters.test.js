/**
 * CMS10 轉換器單元測試
 *
 * 測試所有轉換相關的函式，確保資料轉換的正確性和穩定性
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:53:00 (UTC+8)
 */

import {
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
} from '../converters.js';

describe('CMS10 轉換器測試', () => {

  describe('分類映射測試', () => {
    test('應該正確映射已知分類', () => {
      const result = getCategoryMapping(['動作']);
      expect(result).toEqual({ type_id: 1, type_name: '動作' });
    });

    test('應該處理未知分類', () => {
      const result = getCategoryMapping(['未知分類']);
      expect(result).toEqual({ type_id: 99, type_name: '其他' });
    });

    test('應該處理空分類陣列', () => {
      const result = getCategoryMapping([]);
      expect(result).toEqual({ type_id: 99, type_name: '其他' });
    });

    test('應該處理 null 或 undefined', () => {
      expect(getCategoryMapping(null)).toEqual({ type_id: 99, type_name: '其他' });
      expect(getCategoryMapping(undefined)).toEqual({ type_id: 99, type_name: '其他' });
    });

    test('應該取第一個分類', () => {
      const result = getCategoryMapping(['動作', '冒險', '科幻']);
      expect(result).toEqual({ type_id: 1, type_name: '動作' });
    });
  });

  describe('時間轉換測試', () => {
    test('應該正確轉換時間戳', () => {
      const timestamp = 1640995200000; // 2022-01-01 00:00:00 UTC
      const result = convertTimestamp(timestamp);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('應該處理無效時間戳', () => {
      const result = convertTimestamp('invalid');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('應該處理 null 時間戳', () => {
      const result = convertTimestamp(null);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('應該正確轉換首播年份', () => {
      expect(convertPremiereToYear([2022, 1, 1])).toBe('2022');
      expect(convertPremiereToYear([2023])).toBe('2023');
    });

    test('應該處理無效首播日期', () => {
      const currentYear = new Date().getFullYear().toString();
      expect(convertPremiereToYear([])).toBe(currentYear);
      expect(convertPremiereToYear([1800])).toBe(currentYear);
      expect(convertPremiereToYear(['invalid'])).toBe(currentYear);
    });
  });

  describe('集數處理測試', () => {
    test('應該正確提取集數數字', () => {
      expect(extractEpisodeNumber('第 01 話')).toBe(1);
      expect(extractEpisodeNumber('Episode 12')).toBe(12);
      expect(extractEpisodeNumber('EP.25')).toBe(25);
    });

    test('應該處理無數字的集數名稱', () => {
      expect(extractEpisodeNumber('特別篇')).toBe(0);
      expect(extractEpisodeNumber('')).toBe(0);
    });

    test('應該正確轉換播放地址', () => {
      const episodes = {
        '第 01 話': ['1', '001'],
        '第 02 話': ['1', '002']
      };
      const result = convertPlayUrl(episodes, 1, 'https://test.com');
      expect(result).toBe('第 01 話$https://test.com/m3u8/1/001#第 02 話$https://test.com/m3u8/1/002');
    });

    test('應該處理空集數物件', () => {
      expect(convertPlayUrl(null)).toBe('');
      expect(convertPlayUrl({})).toBe('');
    });

    test('應該按集數順序排序', () => {
      const episodes = {
        '第 10 話': ['1', '010'],
        '第 02 話': ['1', '002'],
        '第 01 話': ['1', '001']
      };
      const result = convertPlayUrl(episodes, 1, 'https://test.com');
      expect(result).toContain('第 01 話$');
      expect(result.indexOf('第 01 話')).toBeLessThan(result.indexOf('第 02 話'));
    });
  });

  describe('備註和狀態測試', () => {
    test('應該正確格式化備註', () => {
      expect(formatRemarks({ ep: 12 })).toBe('第12集');
      expect(formatRemarks({ status: 'completed' })).toBe('已完結');
      expect(formatRemarks({ status: 'airing' })).toBe('連載中');
      expect(formatRemarks({})).toBe('更新中');
    });

    test('應該正確判斷連載狀態', () => {
      expect(determineSerialStatus({ status: 'completed' })).toBe('0');
      expect(determineSerialStatus({ status: 'airing' })).toBe('1');
      expect(determineSerialStatus({ ep: 24 })).toBe('0');
      expect(determineSerialStatus({ ep: 6 })).toBe('1');
    });

    test('應該正確提取演員資訊', () => {
      expect(extractActors({ voice_actors: ['聲優A', '聲優B'] })).toBe('聲優A,聲優B');
      expect(extractActors({ cast: '演員列表' })).toBe('演員列表');
      expect(extractActors({})).toBe('');
    });
  });

  describe('項目轉換測試', () => {
    const mockItem = {
      id: 1,
      title: '測試動畫',
      category: ['動作'],
      time: 1640995200000,
      image: 'https://example.com/image.jpg'
    };

    test('應該正確轉換列表項目', () => {
      const result = convertToListItem(mockItem);

      expect(result).toMatchObject({
        vod_id: 1,
        vod_name: '測試動畫',
        type_id: 1,
        type_name: '動作',
        vod_en: '測試動畫',
        vod_play_from: 'myself-bbs',
        vod_pic: 'https://example.com/image.jpg'
      });

      expect(result.vod_time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result.vod_remarks).toBeTruthy();
    });

    test('應該正確轉換詳情項目', () => {
      const detailItem = {
        ...mockItem,
        premiere: [2022, 1, 1],
        description: '測試描述',
        author: '測試作者',
        episodes: { '第 01 話': ['1', '001'] }
      };

      const result = convertToDetailItem(detailItem);

      expect(result).toMatchObject({
        vod_id: 1,
        vod_name: '測試動畫',
        vod_area: '日本',
        vod_lang: '日語',
        vod_year: '2022',
        vod_director: '測試作者',
        vod_content: '測試描述'
      });

      expect(result.vod_play_url).toContain('第 01 話$');
    });

    test('應該處理缺少欄位的項目', () => {
      const incompleteItem = { id: 1 };
      const result = convertToListItem(incompleteItem);

      expect(result.vod_id).toBe(1);
      expect(result.vod_name).toBe('');
      expect(result.type_id).toBe(99); // 預設為其他分類
    });
  });

  describe('批量轉換測試', () => {
    const mockItems = [
      { id: 1, title: '動畫1', category: ['動作'] },
      { id: 2, title: '動畫2', category: ['戀愛'] },
      { id: null, title: '無效動畫' }, // 無效項目
      { id: 3, title: '動畫3', category: ['科幻'] }
    ];

    test('應該正確批量轉換列表項目', () => {
      const result = batchConvertItems(mockItems, 'list');

      expect(result).toHaveLength(3); // 過濾掉無效項目
      expect(result[0].vod_name).toBe('動畫1');
      expect(result[1].vod_name).toBe('動畫2');
      expect(result[2].vod_name).toBe('動畫3');
    });

    test('應該處理空陣列', () => {
      expect(batchConvertItems([])).toEqual([]);
      expect(batchConvertItems(null)).toEqual([]);
      expect(batchConvertItems(undefined)).toEqual([]);
    });

    test('應該過濾無效項目', () => {
      const invalidItems = [
        null,
        undefined,
        {},
        { title: '無ID項目' }
      ];

      const result = batchConvertItems(invalidItems);
      expect(result).toEqual([]);
    });

    test('應該處理轉換錯誤', () => {
      // 模擬轉換錯誤的情況
      const problematicItems = [
        { id: 1, title: '正常動畫', category: ['動作'] },
        { id: 2, title: null, category: ['戀愛'] } // 可能導致錯誤的項目
      ];

      const result = batchConvertItems(problematicItems);
      expect(result.length).toBeGreaterThan(0); // 至少有一個成功轉換
    });
  });

  describe('邊界條件測試', () => {
    test('應該處理極大的 ID', () => {
      const item = { id: Number.MAX_SAFE_INTEGER, title: '測試' };
      const result = convertToListItem(item);
      expect(result.vod_id).toBe(Number.MAX_SAFE_INTEGER);
    });

    test('應該處理特殊字元', () => {
      const item = {
        id: 1,
        title: '測試<>&"\'動畫',
        category: ['動作']
      };
      const result = convertToListItem(item);
      expect(result.vod_name).toBe('測試<>&"\'動畫');
    });

    test('應該處理長字串', () => {
      const longTitle = 'A'.repeat(1000);
      const item = { id: 1, title: longTitle, category: ['動作'] };
      const result = convertToListItem(item);
      expect(result.vod_name).toBe(longTitle);
    });

    test('應該處理複雜的集數結構', () => {
      const complexEpisodes = {
        '第 01 話': ['1', '001'],
        'OVA 1': ['1', 'ova1'],
        '特別篇': ['1', 'special'],
        '第 100 話': ['1', '100']
      };

      const result = convertPlayUrl(complexEpisodes, 1);
      expect(result).toContain('第 01 話$');
      expect(result).toContain('第 100 話$');
    });
  });
});