# CMS10 測試計劃和驗證方式

## 規格異動日期時間
**建立日期**: 2025-07-26 15:36:00 (UTC+8)
**版本**: v1.0

## 1. 測試策略概覽

### 1.1 測試目標

1. **功能正確性**: 確保 CMS10 API 符合規格要求
2. **資料完整性**: 驗證資料轉換的準確性
3. **相容性**: 確保與 CMS10 標準完全相容
4. **效能穩定性**: 驗證 API 回應時間和穩定性
5. **錯誤處理**: 確保錯誤情況得到正確處理

### 1.2 測試範圍

| 測試類型 | 覆蓋範圍 | 優先級 |
|----------|----------|--------|
| 單元測試 | 資料轉換函式、驗證邏輯 | 高 |
| 整合測試 | API 端點、資料流程 | 高 |
| 相容性測試 | CMS10 標準符合性 | 高 |
| 效能測試 | 回應時間、併發處理 | 中 |
| 錯誤測試 | 異常情況處理 | 中 |
| 回歸測試 | 原有功能保持 | 高 |

## 2. 單元測試計劃

### 2.1 資料轉換函式測試

```javascript
/**
 * 測試資料轉換函式
 */
describe('CMS10 資料轉換', () => {
  describe('convertListItem', () => {
    test('應該正確轉換基本列表項目', () => {
      const input = {
        id: 12345,
        title: "進擊的巨人",
        category: ["動作", "劇情"],
        ep: 25,
        image: "https://example.com/cover.jpg",
        time: 1630391759999
      };

      const expected = {
        vod_id: 12345,
        vod_name: "進擊的巨人",
        type_id: 1,
        type_name: "動作",
        vod_en: "進擊的巨人",
        vod_time: "2021-08-31 07:35:59",
        vod_remarks: "第25集",
        vod_play_from: "myself-bbs",
        vod_pic: "https://example.com/cover.jpg"
      };

      const result = convertListItem(input);
      expect(result).toEqual(expected);
    });

    test('應該處理缺失欄位', () => {
      const input = {
        id: 123,
        title: "測試動畫"
      };

      const result = convertListItem(input);

      expect(result.vod_id).toBe(123);
      expect(result.vod_name).toBe("測試動畫");
      expect(result.type_id).toBe(99); // 預設分類
      expect(result.vod_pic).toBe(""); // 預設空字串
    });
  });

  describe('convertDetailItem', () => {
    test('應該正確轉換詳情項目', () => {
      const input = {
        id: 12345,
        title: "進擊的巨人",
        category: ["動作"],
        description: "故事描述...",
        author: "諫山創",
        premiere: [2013, 4, 7],
        episodes: {
          "第 01 話": ["12345", "001"],
          "第 02 話": ["12345", "002"]
        }
      };

      const result = convertDetailItem(input);

      expect(result.vod_content).toBe("故事描述...");
      expect(result.vod_director).toBe("諫山創");
      expect(result.vod_year).toBe("2013");
      expect(result.vod_play_url).toContain("第 01 話$");
      expect(result.vod_play_url).toContain("#第 02 話$");
    });
  });
});
```

### 2.2 分類映射測試

```javascript
describe('分類映射', () => {
  test('應該正確映射已知分類', () => {
    const testCases = [
      { input: ["動作"], expected: { type_id: 1, type_name: "動作" } },
      { input: ["科幻"], expected: { type_id: 3, type_name: "科幻" } },
      { input: ["戀愛"], expected: { type_id: 6, type_name: "戀愛" } }
    ];

    testCases.forEach(({ input, expected }) => {
      const result = getCategoryMapping(input);
      expect(result).toEqual(expected);
    });
  });

  test('應該處理未知分類', () => {
    const result = getCategoryMapping(["未知分類"]);
    expect(result).toEqual({ type_id: 99, type_name: "其他" });
  });

  test('應該處理空分類', () => {
    const result = getCategoryMapping([]);
    expect(result).toEqual({ type_id: 99, type_name: "其他" });
  });
});
```

### 2.3 時間轉換測試

```javascript
describe('時間轉換', () => {
  test('應該正確轉換時間戳', () => {
    const timestamp = 1630391759999;
    const result = convertTimestamp(timestamp);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test('應該處理無效時間戳', () => {
    const result = convertTimestamp(null);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test('應該正確轉換首播日期', () => {
    const premiere = [2013, 4, 7];
    const result = convertPremiereToYear(premiere);
    expect(result).toBe("2013");
  });
});
```

## 3. 整合測試計劃

### 3.1 API 端點測試

```javascript
describe('CMS10 API 端點', () => {
  describe('GET /api.php/provide/vod/?ac=list', () => {
    test('應該回傳正確的列表格式', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=list&pg=1');
      const data = await response.json();

      expect(data).toHaveProperty('code', 1);
      expect(data).toHaveProperty('msg', '數據列表');
      expect(data).toHaveProperty('page', 1);
      expect(data).toHaveProperty('pagecount');
      expect(data).toHaveProperty('limit', '20');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('list');
      expect(Array.isArray(data.list)).toBe(true);
    });

    test('應該支援分頁參數', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=list&pg=2');
      const data = await response.json();

      expect(data.page).toBe(2);
    });

    test('應該支援分類篩選', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=list&t=1');
      const data = await response.json();

      data.list.forEach(item => {
        expect(item.type_id).toBe(1);
      });
    });

    test('應該支援搜尋功能', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=list&wd=進擊');
      const data = await response.json();

      data.list.forEach(item => {
        expect(item.vod_name).toContain('進擊');
      });
    });
  });

  describe('GET /api.php/provide/vod/?ac=detail', () => {
    test('應該回傳正確的詳情格式', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=detail&ids=12345');
      const data = await response.json();

      expect(data.code).toBe(1);
      expect(data.list.length).toBeGreaterThan(0);

      const item = data.list[0];
      expect(item).toHaveProperty('vod_id');
      expect(item).toHaveProperty('vod_name');
      expect(item).toHaveProperty('vod_content');
      expect(item).toHaveProperty('vod_play_url');
    });

    test('應該支援批量查詢', async () => {
      const response = await fetch('/api.php/provide/vod/?ac=detail&ids=12345,67890');
      const data = await response.json();

      expect(data.list.length).toBeLessThanOrEqual(2);
    });
  });
});
```

### 3.2 錯誤處理測試

```javascript
describe('錯誤處理', () => {
  test('缺少 ac 參數應該回傳錯誤', async () => {
    const response = await fetch('/api.php/provide/vod/');
    const data = await response.json();

    expect(data.code).toBe(-1);
    expect(data.msg).toContain('參數錯誤');
  });

  test('無效的 ac 參數應該回傳錯誤', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=invalid');
    const data = await response.json();

    expect(data.code).toBe(-1);
  });

  test('detail 操作缺少 ids 應該回傳錯誤', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=detail');
    const data = await response.json();

    expect(data.code).toBe(-1);
    expect(data.msg).toContain('ids');
  });

  test('不存在的 ID 應該回傳空列表', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=detail&ids=999999');
    const data = await response.json();

    expect(data.code).toBe(-2);
    expect(data.list.length).toBe(0);
  });
});
```

## 4. CMS10 相容性測試

### 4.1 標準符合性檢查

```javascript
describe('CMS10 標準符合性', () => {
  test('回應格式應該符合 CMS10 標準', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=list');
    const data = await response.json();

    // 檢查必要欄位
    const requiredFields = ['code', 'msg', 'page', 'pagecount', 'limit', 'total', 'list'];
    requiredFields.forEach(field => {
      expect(data).toHaveProperty(field);
    });

    // 檢查資料類型
    expect(typeof data.code).toBe('number');
    expect(typeof data.msg).toBe('string');
    expect(typeof data.page).toBe('number');
    expect(typeof data.pagecount).toBe('number');
    expect(typeof data.limit).toBe('string');
    expect(typeof data.total).toBe('number');
    expect(Array.isArray(data.list)).toBe(true);
  });

  test('列表項目應該包含必要欄位', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=list');
    const data = await response.json();

    if (data.list.length > 0) {
      const item = data.list[0];
      const requiredFields = ['vod_id', 'vod_name', 'type_id', 'type_name'];

      requiredFields.forEach(field => {
        expect(item).toHaveProperty(field);
        expect(item[field]).not.toBeNull();
        expect(item[field]).not.toBeUndefined();
      });
    }
  });

  test('詳情項目應該包含完整欄位', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=detail&ids=12345');
    const data = await response.json();

    if (data.list.length > 0) {
      const item = data.list[0];
      const detailFields = [
        'vod_id', 'vod_name', 'type_id', 'type_name', 'vod_en',
        'vod_time', 'vod_remarks', 'vod_play_from', 'vod_pic',
        'vod_area', 'vod_lang', 'vod_year', 'vod_serial',
        'vod_actor', 'vod_director', 'vod_content', 'vod_play_url'
      ];

      detailFields.forEach(field => {
        expect(item).toHaveProperty(field);
      });
    }
  });
});
```

### 4.2 資料格式驗證

```javascript
describe('資料格式驗證', () => {
  test('時間格式應該正確', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=list');
    const data = await response.json();

    data.list.forEach(item => {
      if (item.vod_time) {
        expect(item.vod_time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      }
    });
  });

  test('播放地址格式應該正確', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=detail&ids=12345');
    const data = await response.json();

    data.list.forEach(item => {
      if (item.vod_play_url) {
        // 檢查格式：集數名稱$播放地址#集數名稱$播放地址
        const urlPattern = /^.+\$.+(\#.+\$.+)*$/;
        expect(item.vod_play_url).toMatch(urlPattern);
      }
    });
  });

  test('ID 應該為正整數', async () => {
    const response = await fetch('/api.php/provide/vod/?ac=list');
    const data = await response.json();

    data.list.forEach(item => {
      expect(Number.isInteger(item.vod_id)).toBe(true);
      expect(item.vod_id).toBeGreaterThan(0);
      expect(Number.isInteger(item.type_id)).toBe(true);
      expect(item.type_id).toBeGreaterThan(0);
    });
  });
});
```

## 5. 效能測試計劃

### 5.1 回應時間測試

```javascript
describe('效能測試', () => {
  test('列表 API 回應時間應該在合理範圍內', async () => {
    const startTime = Date.now();
    const response = await fetch('/api.php/provide/vod/?ac=list');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(5000); // 5 秒內
  });

  test('詳情 API 回應時間應該在合理範圍內', async () => {
    const startTime = Date.now();
    const response = await fetch('/api.php/provide/vod/?ac=detail&ids=12345');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(3000); // 3 秒內
  });

  test('大量資料查詢應該能正常處理', async () => {
    const ids = Array.from({length: 50}, (_, i) => i + 1).join(',');
    const response = await fetch(`/api.php/provide/vod/?ac=detail&ids=${ids}`);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.code).toBe(1);
  });
});
```

### 5.2 併發測試

```javascript
describe('併發測試', () => {
  test('應該能處理併發請求', async () => {
    const requests = Array.from({length: 10}, () =>
      fetch('/api.php/provide/vod/?ac=list&pg=1')
    );

    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## 6. 回歸測試計劃

### 6.1 原有功能測試

```javascript
describe('向後相容性測試', () => {
  test('原有列表端點應該正常工作', async () => {
    const endpoints = [
      '/list/airing',
      '/list/completed'
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('data');
    }
  });

  test('原有動畫端點應該正常工作', async () => {
    const response = await fetch('/anime/12345');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  test('原有搜尋端點應該正常工作', async () => {
    const response = await fetch('/search/進擊');
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');
  });
});
```

## 7. 手動測試清單

### 7.1 基本功能測試

| 測試項目 | 測試步驟 | 預期結果 | 狀態 |
|----------|----------|----------|------|
| 列表查詢 | GET `/api.php/provide/vod/?ac=list` | 回傳 CMS10 格式列表 | ⏳ |
| 分頁功能 | GET `/api.php/provide/vod/?ac=list&pg=2` | 回傳第二頁資料 | ⏳ |
| 分類篩選 | GET `/api.php/provide/vod/?ac=list&t=1` | 回傳指定分類資料 | ⏳ |
| 搜尋功能 | GET `/api.php/provide/vod/?ac=list&wd=進擊` | 回傳搜尋結果 | ⏳ |
| 詳情查詢 | GET `/api.php/provide/vod/?ac=detail&ids=12345` | 回傳詳情資料 | ⏳ |
| 批量查詢 | GET `/api.php/provide/vod/?ac=detail&ids=1,2,3` | 回傳多筆詳情 | ⏳ |

### 7.2 錯誤處理測試

| 測試項目 | 測試步驟 | 預期結果 | 狀態 |
|----------|----------|----------|------|
| 缺少參數 | GET `/api.php/provide/vod/` | code: -1, 參數錯誤 | ⏳ |
| 無效參數 | GET `/api.php/provide/vod/?ac=invalid` | code: -1, 參數錯誤 | ⏳ |
| 資料不存在 | GET `/api.php/provide/vod/?ac=detail&ids=999999` | code: -2, 資料不存在 | ⏳ |
| 無效分頁 | GET `/api.php/provide/vod/?ac=list&pg=abc` | code: -1, 參數錯誤 | ⏳ |

### 7.3 相容性測試

| 測試項目 | 測試步驟 | 預期結果 | 狀態 |
|----------|----------|----------|------|
| 原有端點 | 測試所有原有 API 端點 | 功能正常，格式不變 | ⏳ |
| CMS10 標準 | 驗證回應格式符合 CMS10 規格 | 完全符合標準 | ⏳ |
| 資料完整性 | 檢查轉換後資料的完整性 | 無資料遺失 | ⏳ |

## 8. 測試環境設定

### 8.1 測試資料準備

```javascript
/**
 * 測試資料生成器
 */
class TestDataGenerator {
  static generateAnimeItem(overrides = {}) {
    return {
      id: 12345,
      title: "測試動畫",
      category: ["動作"],
      ep: 12,
      image: "https://example.com/cover.jpg",
      time: Date.now(),
      description: "測試描述",
      author: "測試作者",
      premiere: [2023, 1, 1],
      episodes: {
        "第 01 話": ["12345", "001"]
      },
      ...overrides
    };
  }

  static generateListData(count = 10) {
    return {
      data: {
        meta: { time: Date.now(), length: count },
        data: Array.from({length: count}, (_, i) =>
          this.generateAnimeItem({ id: i + 1, title: `測試動畫 ${i + 1}` })
        )
      }
    };
  }
}
```

### 8.2 測試工具配置

```javascript
// Jest 配置
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## 9. 測試執行計劃

### 9.1 測試階段

| 階段 | 測試類型 | 執行時機 | 負責人 |
|------|----------|----------|--------|
| 開發階段 | 單元測試 | 每次程式碼提交 | 開發者 |
| 整合階段 | 整合測試 | 功能完成後 | 開發者 |
| 測試階段 | 全面測試 | 開發完成後 | 測試人員 |
| 上線前 | 回歸測試 | 部署前 | 測試人員 |

### 9.2 測試指令

```bash
# 執行所有測試
npm test

# 執行單元測試
npm run test:unit

# 執行整合測試
npm run test:integration

# 執行覆蓋率測試
npm run test:coverage

# 執行效能測試
npm run test:performance
```

## 10. 驗收標準

### 10.1 功能驗收標準

- [ ] 所有 CMS10 API 端點正常運作
- [ ] 資料轉換準確無誤
- [ ] 錯誤處理符合規範
- [ ] 原有功能保持不變
- [ ] 效能符合要求

### 10.2 品質驗收標準

- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] 整合測試通過率 100%
- [ ] 無嚴重 Bug
- [ ] 文件完整準確
- [ ] 程式碼符合規範

### 10.3 上線驗收標準

- [ ] 所有測試通過
- [ ] 效能測試達標
- [ ] 安全性檢查通過
- [ ] 監控系統就緒
- [ ] 回滾方案準備完成

## 11. 測試報告模板

### 11.1 測試執行報告

```
# CMS10 轉換測試報告

## 測試概要
- 測試日期：YYYY-MM-DD
- 測試版本：v1.0
- 測試環境：Production/Staging
- 測試人員：XXX

## 測試結果
- 總測試案例：XXX
- 通過案例：XXX
- 失敗案例：XXX
- 通過率：XX%

## 功能測試結果
- [ ] 列表 API
- [ ] 詳情 API
- [ ] 搜尋功能
- [ ] 分頁功能
- [ ] 錯誤處理

## 問題清單
1. 問題描述
   - 嚴重程度：高/中/低
   - 影響範圍：XXX
   - 解決方案：XXX

## 建議
- 改進建議
- 風險評估
- 後續計劃
```

## 12. 持續改進

### 12.1 測試優化

1. **自動化程度提升**: 增加自動化測試覆蓋範圍
2. **測試資料管理**: 建立完整的測試資料集
3. **效能監控**: 建立持續的效能監控機制
4. **錯誤追蹤**: 完善錯誤追蹤和分析系統

### 12.2 品質保證

1. **程式碼審查**: 建立程式碼審查流程
2. **文件維護**: 保持測試文件的更新
3. **知識分享**: 定期進行測試經驗分享
4. **工具升級**: 持續評估和升級測試工具