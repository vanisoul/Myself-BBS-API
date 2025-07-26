/**
 * CMS10 第二階段功能測試套件
 *
 * 此測試套件涵蓋所有第二階段新增的功能，包括格式檢測、URL 生成和增強版轉換
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 17:03:00 (UTC+8)
 */

// 測試資料
export const TEST_EPISODES = {
  // Play Path 格式測試資料
  PLAY_PATH_FORMAT: {
    "第 01 話 海的那邊": "play/46442/001",
    "第 02 話 暗夜列車": "play/46442/002",
    "第 03 話 希望之門": "play/46442/003",
    "第 04 話 手手相傳": "play/46442/004"
  },

  // Encoded ID 格式測試資料
  ENCODED_ID_FORMAT: {
    "第 01 話": "AgADMg4AAvWkAVc",
    "第 02 話": "AgADsA0AAjef-VU",
    "第 03 話": "AgADfAwAAqLbQVY",
    "第 04 話": "BgBDNg5AAwWlBVd"
  },

  // 混合格式測試資料
  MIXED_FORMAT: {
    "第 01 話": "play/46442/001",
    "第 02 話": "AgADMg4AAvWkAVc",
    "第 03 話": "play/46442/003",
    "第 04 話": "AgADsA0AAjef-VU"
  },

  // 無效格式測試資料
  INVALID_FORMAT: {
    "第 01 話": "invalid/format",
    "第 02 話": "123",
    "第 03 話": "",
    "第 04 話": null
  },

  // 空資料
  EMPTY: {},

  // 舊格式 (陣列格式)
  LEGACY_FORMAT: {
    "第 01 話": ["1", "001"],
    "第 02 話": ["1", "002"],
    "第 03 話": ["1", "003"]
  }
};

// 預期的 URL 結果
export const EXPECTED_URLS = {
  PLAY_PATH: {
    "第 01 話 海的那邊": "https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8",
    "第 02 話 暗夜列車": "https://vpx05.myself-bbs.com/vpx/46442/002/720p.m3u8",
    "第 03 話 希望之門": "https://vpx05.myself-bbs.com/vpx/46442/003/720p.m3u8",
    "第 04 話 手手相傳": "https://vpx05.myself-bbs.com/vpx/46442/004/720p.m3u8"
  },

  ENCODED_ID: {
    "第 01 話": "https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8",
    "第 02 話": "https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8",
    "第 03 話": "https://vpx05.myself-bbs.com/hls/fA/wA/Aq/AgADfAwAAqLbQVY/index.m3u8",
    "第 04 話": "https://vpx05.myself-bbs.com/hls/Ng/5A/Aw/BgBDNg5AAwWlBVd/index.m3u8"
  }
};

// 測試用的動畫詳情資料
export const TEST_ANIME_DETAILS = {
  PLAY_PATH_ANIME: {
    id: 46442,
    title: "進擊的巨人 最終季",
    category: ["動作", "劇情"],
    description: "人類與巨人的最終戰爭",
    author: "諫山創",
    premiere: [2023, 3, 4],
    episodes: TEST_EPISODES.PLAY_PATH_FORMAT,
    time: Date.now()
  },

  ENCODED_ID_ANIME: {
    id: 12345,
    title: "鬼滅之刃",
    category: ["動作", "奇幻"],
    description: "鬼殺隊的戰鬥故事",
    author: "吾峠呼世晴",
    premiere: [2019, 4, 6],
    episodes: TEST_EPISODES.ENCODED_ID_FORMAT,
    time: Date.now()
  },

  MIXED_FORMAT_ANIME: {
    id: 67890,
    title: "混合格式測試動畫",
    category: ["其他"],
    description: "用於測試混合格式的動畫",
    author: "測試作者",
    premiere: [2025, 1, 1],
    episodes: TEST_EPISODES.MIXED_FORMAT,
    time: Date.now()
  }
};

/**
 * 執行所有測試
 */
export async function runAllTests() {
  console.log('🚀 開始執行 CMS10 第二階段測試套件...\n');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // 測試模組列表
  const testModules = [
    { name: 'Episodes 格式檢測器', tests: runEpisodeDetectorTests },
    { name: 'URL 生成器', tests: runUrlGeneratorTests },
    { name: '增強版轉換器', tests: runConverterTests },
    { name: '詳情處理器', tests: runProcessorTests },
    { name: '整合測試', tests: runIntegrationTests }
  ];

  for (const module of testModules) {
    console.log(`📋 測試模組: ${module.name}`);
    console.log('─'.repeat(50));

    try {
      const moduleResults = await module.tests();
      testResults.total += moduleResults.total;
      testResults.passed += moduleResults.passed;
      testResults.failed += moduleResults.failed;
      testResults.errors.push(...moduleResults.errors);

      console.log(`✅ 通過: ${moduleResults.passed}/${moduleResults.total}`);
      if (moduleResults.failed > 0) {
        console.log(`❌ 失敗: ${moduleResults.failed}`);
      }
    } catch (error) {
      console.error(`💥 模組測試失敗: ${error.message}`);
      testResults.errors.push(`${module.name}: ${error.message}`);
    }

    console.log('');
  }

  // 輸出總結
  console.log('📊 測試總結');
  console.log('='.repeat(50));
  console.log(`總測試數: ${testResults.total}`);
  console.log(`通過: ${testResults.passed}`);
  console.log(`失敗: ${testResults.failed}`);
  console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ 錯誤詳情:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  return testResults;
}

/**
 * Episodes 格式檢測器測試
 */
async function runEpisodeDetectorTests() {
  const {
    detectEpisodesFormat,
    EPISODE_FORMATS,
    validateEpisodesData
  } = await import('../episode-detector.js');

  const results = { total: 0, passed: 0, failed: 0, errors: [] };

  // 測試案例
  const testCases = [
    {
      name: 'Play Path 格式檢測',
      episodes: TEST_EPISODES.PLAY_PATH_FORMAT,
      expectedFormat: EPISODE_FORMATS.PLAY_PATH,
      expectedConfidence: 1.0
    },
    {
      name: 'Encoded ID 格式檢測',
      episodes: TEST_EPISODES.ENCODED_ID_FORMAT,
      expectedFormat: EPISODE_FORMATS.ENCODED_ID,
      expectedConfidence: 1.0
    },
    {
      name: '混合格式檢測',
      episodes: TEST_EPISODES.MIXED_FORMAT,
      expectedFormat: EPISODE_FORMATS.UNKNOWN, // 不支援混合格式
      expectedConfidence: 0.5
    },
    {
      name: '無效格式檢測',
      episodes: TEST_EPISODES.INVALID_FORMAT,
      expectedFormat: EPISODE_FORMATS.UNKNOWN,
      expectedConfidence: 0
    },
    {
      name: '空資料檢測',
      episodes: TEST_EPISODES.EMPTY,
      expectedFormat: EPISODE_FORMATS.UNKNOWN,
      expectedConfidence: 0
    }
  ];

  for (const testCase of testCases) {
    results.total++;

    try {
      const detection = detectEpisodesFormat(testCase.episodes);

      if (detection.format === testCase.expectedFormat) {
        results.passed++;
        console.log(`  ✅ ${testCase.name}`);
      } else {
        results.failed++;
        const error = `預期格式: ${testCase.expectedFormat}, 實際格式: ${detection.format}`;
        results.errors.push(`${testCase.name}: ${error}`);
        console.log(`  ❌ ${testCase.name} - ${error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${testCase.name}: ${error.message}`);
      console.log(`  💥 ${testCase.name} - ${error.message}`);
    }
  }

  // 資料驗證測試
  results.total++;
  try {
    const validation = validateEpisodesData(TEST_EPISODES.PLAY_PATH_FORMAT);
    if (validation.isValid) {
      results.passed++;
      console.log(`  ✅ 資料驗證測試`);
    } else {
      results.failed++;
      results.errors.push(`資料驗證失敗: ${validation.errors.join(', ')}`);
      console.log(`  ❌ 資料驗證測試`);
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`資料驗證測試: ${error.message}`);
    console.log(`  💥 資料驗證測試 - ${error.message}`);
  }

  return results;
}

/**
 * URL 生成器測試
 */
async function runUrlGeneratorTests() {
  const {
    generatePlayPathUrl,
    generateEncodedIdUrl,
    batchGenerateUrls,
    validateGeneratedUrl
  } = await import('../url-generators.js');

  const results = { total: 0, passed: 0, failed: 0, errors: [] };

  // Play Path URL 生成測試
  const playPathTests = [
    { input: "play/46442/001", expected: "https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8" },
    { input: "play/12345/999", expected: "https://vpx05.myself-bbs.com/vpx/12345/999/720p.m3u8" }
  ];

  for (const test of playPathTests) {
    results.total++;
    try {
      const url = generatePlayPathUrl(test.input);
      if (url === test.expected) {
        results.passed++;
        console.log(`  ✅ Play Path URL: ${test.input}`);
      } else {
        results.failed++;
        const error = `預期: ${test.expected}, 實際: ${url}`;
        results.errors.push(`Play Path URL (${test.input}): ${error}`);
        console.log(`  ❌ Play Path URL: ${test.input} - ${error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Play Path URL (${test.input}): ${error.message}`);
      console.log(`  💥 Play Path URL: ${test.input} - ${error.message}`);
    }
  }

  // Encoded ID URL 生成測試
  const encodedIdTests = [
    { input: "AgADMg4AAvWkAVc", expected: "https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8" },
    { input: "AgADsA0AAjef-VU", expected: "https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8" }
  ];

  for (const test of encodedIdTests) {
    results.total++;
    try {
      const url = generateEncodedIdUrl(test.input);
      if (url === test.expected) {
        results.passed++;
        console.log(`  ✅ Encoded ID URL: ${test.input}`);
      } else {
        results.failed++;
        const error = `預期: ${test.expected}, 實際: ${url}`;
        results.errors.push(`Encoded ID URL (${test.input}): ${error}`);
        console.log(`  ❌ Encoded ID URL: ${test.input} - ${error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Encoded ID URL (${test.input}): ${error.message}`);
      console.log(`  💥 Encoded ID URL: ${test.input} - ${error.message}`);
    }
  }

  // URL 驗證測試
  const validationTests = [
    { url: "https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8", shouldBeValid: true },
    { url: "https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8", shouldBeValid: true },
    { url: "https://invalid-domain.com/test.m3u8", shouldBeValid: false },
    { url: "not-a-url", shouldBeValid: false }
  ];

  for (const test of validationTests) {
    results.total++;
    try {
      const validation = validateGeneratedUrl(test.url);
      if (validation.isValid === test.shouldBeValid) {
        results.passed++;
        console.log(`  ✅ URL 驗證: ${test.shouldBeValid ? '有效' : '無效'} URL`);
      } else {
        results.failed++;
        const error = `預期: ${test.shouldBeValid ? '有效' : '無效'}, 實際: ${validation.isValid ? '有效' : '無效'}`;
        results.errors.push(`URL 驗證: ${error}`);
        console.log(`  ❌ URL 驗證 - ${error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`URL 驗證: ${error.message}`);
      console.log(`  💥 URL 驗證 - ${error.message}`);
    }
  }

  return results;
}

/**
 * 增強版轉換器測試
 */
async function runConverterTests() {
  const {
    convertPlayUrlEnhanced,
    convertPlayUrlSmart,
    convertToDetailItem
  } = await import('../converters.js');

  const results = { total: 0, passed: 0, failed: 0, errors: [] };

  // 增強版轉換測試
  const conversionTests = [
    {
      name: 'Play Path 格式轉換',
      episodes: TEST_EPISODES.PLAY_PATH_FORMAT,
      vodId: 46442,
      shouldContain: ['第 01 話 海的那邊$https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8']
    },
    {
      name: 'Encoded ID 格式轉換',
      episodes: TEST_EPISODES.ENCODED_ID_FORMAT,
      vodId: 12345,
      shouldContain: ['第 01 話$https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8']
    }
  ];

  for (const test of conversionTests) {
    results.total++;
    try {
      const result = convertPlayUrlEnhanced(test.episodes, test.vodId);

      let passed = true;
      for (const expectedPart of test.shouldContain) {
        if (!result.includes(expectedPart)) {
          passed = false;
          break;
        }
      }

      if (passed) {
        results.passed++;
        console.log(`  ✅ ${test.name}`);
      } else {
        results.failed++;
        const error = `結果不包含預期內容`;
        results.errors.push(`${test.name}: ${error}`);
        console.log(`  ❌ ${test.name} - ${error}`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${test.name}: ${error.message}`);
      console.log(`  💥 ${test.name} - ${error.message}`);
    }
  }

  // 詳情項目轉換測試
  results.total++;
  try {
    const detailItem = convertToDetailItem(TEST_ANIME_DETAILS.PLAY_PATH_ANIME, {
      useEnhancedPlayUrl: true,
      quality: '720p'
    });

    if (detailItem.vod_play_url && detailItem.vod_play_url.length > 0) {
      results.passed++;
      console.log(`  ✅ 詳情項目轉換`);
    } else {
      results.failed++;
      results.errors.push(`詳情項目轉換: vod_play_url 為空`);
      console.log(`  ❌ 詳情項目轉換 - vod_play_url 為空`);
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`詳情項目轉換: ${error.message}`);
    console.log(`  💥 詳情項目轉換 - ${error.message}`);
  }

  return results;
}

/**
 * 詳情處理器測試
 */
async function runProcessorTests() {
  const {
    convertDetailResponseEnhanced,
    convertDetailResponseSmart
  } = await import('../processors.js');

  const results = { total: 0, passed: 0, failed: 0, errors: [] };

  // 增強版詳情處理測試
  const processorTests = [
    {
      name: '增強版詳情處理 - Play Path',
      items: [TEST_ANIME_DETAILS.PLAY_PATH_ANIME],
      query: { quality: '720p' }
    },
    {
      name: '增強版詳情處理 - Encoded ID',
      items: [TEST_ANIME_DETAILS.ENCODED_ID_ANIME],
      query: { quality: '1080p' }
    }
  ];

  for (const test of processorTests) {
    results.total++;
    try {
      const response = test.name.includes('智慧')
        ? convertDetailResponseSmart(test.items, test.query)
        : convertDetailResponseEnhanced(test.items, test.query);

      if (response.code === 1 && response.list && response.list.length > 0) {
        const item = response.list[0];
        if (item.vod_play_url && item.vod_play_url.length > 0) {
          results.passed++;
          console.log(`  ✅ ${test.name}`);
        } else {
          results.failed++;
          results.errors.push(`${test.name}: vod_play_url 為空`);
          console.log(`  ❌ ${test.name} - vod_play_url 為空`);
        }
      } else {
        results.failed++;
        results.errors.push(`${test.name}: 回應格式錯誤`);
        console.log(`  ❌ ${test.name} - 回應格式錯誤`);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${test.name}: ${error.message}`);
      console.log(`  💥 ${test.name} - ${error.message}`);
    }
  }

  return results;
}

/**
 * 整合測試
 */
async function runIntegrationTests() {
  const results = { total: 0, passed: 0, failed: 0, errors: [] };

  // 完整流程測試
  results.total++;
  try {
    // 模擬完整的 API 請求流程
    const { convertDetailResponseEnhanced } = await import('../processors.js');

    const testItems = [
      TEST_ANIME_DETAILS.PLAY_PATH_ANIME,
      TEST_ANIME_DETAILS.ENCODED_ID_ANIME
    ];

    const response = convertDetailResponseEnhanced(testItems, {
      quality: '720p'
    }, {
      baseUrl: 'https://myself-bbs.jacob.workers.dev',
      enableFallback: true
    });

    if (response.code === 1 &&
        response.list &&
        response.list.length === 2
        // &&
        // response.enhanced_features &&
        // response.enhanced_features.vod_play_url_v2
      ) {
      results.passed++;
      console.log(`  ✅ 完整流程整合測試`);
    } else {
      results.failed++;
      results.errors.push(`完整流程整合測試: 回應結構不正確`);
      console.log(`  ❌ 完整流程整合測試 - 回應結構不正確`);
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`完整流程整合測試: ${error.message}`);
    console.log(`  💥 完整流程整合測試 - ${error.message}`);
  }

  // 向後相容性測試
  results.total++;
  try {
    const { convertDetailResponseLegacy } = await import('../processors.js');

    const response = convertDetailResponseLegacy([TEST_ANIME_DETAILS.PLAY_PATH_ANIME]);

    if (response.code === 1 && response.list && response.list.length > 0) {
      results.passed++;
      console.log(`  ✅ 向後相容性測試`);
    } else {
      results.failed++;
      results.errors.push(`向後相容性測試: 舊版功能失效`);
      console.log(`  ❌ 向後相容性測試 - 舊版功能失效`);
    }
  } catch (error) {
    results.failed++;
    results.errors.push(`向後相容性測試: ${error.message}`);
    console.log(`  💥 向後相容性測試 - ${error.message}`);
  }

  return results;
}

/**
 * 效能測試
 */
export async function runPerformanceTests() {
  console.log('⚡ 開始效能測試...\n');

  const { convertPlayUrlEnhanced } = await import('../converters.js');
  const { detectEpisodesFormatCached } = await import('../episode-detector.js');

  // 大量資料測試
  const largeEpisodes = {};
  for (let i = 1; i <= 100; i++) {
    largeEpisodes[`第 ${i.toString().padStart(2, '0')} 話`] = `play/46442/${i.toString().padStart(3, '0')}`;
  }

  // 測試轉換效能
  const startTime = Date.now();

  for (let i = 0; i < 10; i++) {
    convertPlayUrlEnhanced(largeEpisodes, 46442);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`📊 效能測試結果:`);
  console.log(`- 100 集 episodes × 10 次轉換`);
  console.log(`- 總耗時: ${duration}ms`);
  console.log(`- 平均每次: ${(duration / 10).toFixed(2)}ms`);
  console.log(`- 每集平均: ${(duration / 1000).toFixed(2)}ms`);

  // 快取效能測試
  const cacheStartTime = Date.now();

  for (let i = 0; i < 100; i++) {
    detectEpisodesFormatCached(TEST_EPISODES.PLAY_PATH_FORMAT);
  }

  const cacheEndTime = Date.now();
  const cacheDuration = cacheEndTime - cacheStartTime;

  console.log(`\n🗄️ 快取效能測試:`);
  console.log(`- 100 次格式檢測 (相同資料)`);
  console.log(`- 總耗時: ${cacheDuration}ms`);
  console.log(`- 平均每次: ${(cacheDuration / 100).toFixed(2)}ms`);

  return {
    conversion: { duration, averagePerCall: duration / 10 },
    cache: { duration: cacheDuration, averagePerCall: cacheDuration / 100 }
  };
}

// 如果直接執行此檔案，運行所有測試
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}