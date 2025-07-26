/**
 * CMS10 第二階段測試執行器
 *
 * 此檔案用於執行 CMS10 第二階段的所有測試，包括單元測試、整合測試和效能測試
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 17:05:00 (UTC+8)
 */

import { runAllTests, runPerformanceTests, TEST_EPISODES, EXPECTED_URLS } from './src/cms10/tests/phase2-tests.js';

/**
 * 主要測試執行函式
 */
async function main() {
  console.log('🎯 CMS10 第二階段功能測試');
  console.log('='.repeat(60));
  console.log(`測試時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);
  console.log('');

  try {
    // 執行功能測試
    const testResults = await runAllTests();

    console.log('\n');

    // 執行效能測試
    const perfResults = await runPerformanceTests();

    // 輸出最終報告
    console.log('\n🏆 最終測試報告');
    console.log('='.repeat(60));

    const successRate = (testResults.passed / testResults.total) * 100;
    const status = successRate >= 90 ? '✅ 優秀' : successRate >= 80 ? '⚠️ 良好' : '❌ 需改進';

    console.log(`功能測試: ${testResults.passed}/${testResults.total} (${successRate.toFixed(1)}%) ${status}`);
    console.log(`轉換效能: 平均 ${perfResults.conversion.averagePerCall.toFixed(2)}ms/次`);
    console.log(`快取效能: 平均 ${perfResults.cache.averagePerCall.toFixed(2)}ms/次`);

    if (testResults.failed === 0) {
      console.log('\n🎉 所有測試通過！第二階段功能已準備就緒。');
      return 0;
    } else {
      console.log(`\n⚠️ 有 ${testResults.failed} 個測試失敗，請檢查錯誤詳情。`);
      return 1;
    }

  } catch (error) {
    console.error('💥 測試執行失敗:', error);
    return 1;
  }
}

/**
 * 快速驗證測試 (用於開發階段)
 */
async function quickTest() {
  console.log('⚡ 快速驗證測試');
  console.log('─'.repeat(30));

  try {
    // 測試格式檢測
    const { detectEpisodesFormat, EPISODE_FORMATS } = await import('./src/cms10/episode-detector.js');

    const playPathDetection = detectEpisodesFormat(TEST_EPISODES.PLAY_PATH_FORMAT);
    const encodedIdDetection = detectEpisodesFormat(TEST_EPISODES.ENCODED_ID_FORMAT);

    console.log(`格式檢測 - Play Path: ${playPathDetection.format === EPISODE_FORMATS.PLAY_PATH ? '✅' : '❌'}`);
    console.log(`格式檢測 - Encoded ID: ${encodedIdDetection.format === EPISODE_FORMATS.ENCODED_ID ? '✅' : '❌'}`);

    // 測試 URL 生成
    const { generatePlayPathUrl, generateEncodedIdUrl } = await import('./src/cms10/url-generators.js');

    const playPathUrl = generatePlayPathUrl('play/46442/001');
    const encodedIdUrl = generateEncodedIdUrl('AgADMg4AAvWkAVc');

    console.log(`URL 生成 - Play Path: ${playPathUrl === EXPECTED_URLS.PLAY_PATH['第 01 話 海的那邊'] ? '✅' : '❌'}`);
    console.log(`URL 生成 - Encoded ID: ${encodedIdUrl === EXPECTED_URLS.ENCODED_ID['第 01 話'] ? '✅' : '❌'}`);

    // 測試轉換器
    const { convertPlayUrlEnhanced } = await import('./src/cms10/converters.js');

    const playPathResult = convertPlayUrlEnhanced(TEST_EPISODES.PLAY_PATH_FORMAT, 46442);
    const encodedIdResult = convertPlayUrlEnhanced(TEST_EPISODES.ENCODED_ID_FORMAT, 12345);

    console.log(`轉換器 - Play Path: ${playPathResult.length > 0 ? '✅' : '❌'}`);
    console.log(`轉換器 - Encoded ID: ${encodedIdResult.length > 0 ? '✅' : '❌'}`);

    console.log('\n✨ 快速驗證完成');

  } catch (error) {
    console.error('❌ 快速驗證失敗:', error.message);
  }
}

/**
 * 展示功能範例
 */
async function showExamples() {
  console.log('📚 CMS10 第二階段功能範例');
  console.log('='.repeat(50));

  try {
    // 範例 1: 格式檢測
    console.log('\n1️⃣ Episodes 格式檢測');
    console.log('─'.repeat(25));

    const { detectEpisodesFormat } = await import('./src/cms10/episode-detector.js');

    const detection1 = detectEpisodesFormat(TEST_EPISODES.PLAY_PATH_FORMAT);
    const detection2 = detectEpisodesFormat(TEST_EPISODES.ENCODED_ID_FORMAT);

    console.log(`Play Path 格式: ${detection1.format} (信心度: ${(detection1.confidence * 100).toFixed(1)}%)`);
    console.log(`Encoded ID 格式: ${detection2.format} (信心度: ${(detection2.confidence * 100).toFixed(1)}%)`);

    // 範例 2: URL 生成
    console.log('\n2️⃣ M3U8 URL 生成');
    console.log('─'.repeat(20));

    const { generatePlayPathUrl, generateEncodedIdUrl } = await import('./src/cms10/url-generators.js');

    console.log('Play Path 範例:');
    console.log(`  輸入: "play/46442/001"`);
    console.log(`  輸出: "${generatePlayPathUrl('play/46442/001')}"`);

    console.log('\nEncoded ID 範例:');
    console.log(`  輸入: "AgADMg4AAvWkAVc"`);
    console.log(`  輸出: "${generateEncodedIdUrl('AgADMg4AAvWkAVc')}"`);

    // 範例 3: 完整轉換
    console.log('\n3️⃣ 完整 vod_play_url 轉換');
    console.log('─'.repeat(30));

    const { convertPlayUrlEnhanced } = await import('./src/cms10/converters.js');

    const result = convertPlayUrlEnhanced(TEST_EPISODES.PLAY_PATH_FORMAT, 46442);
    const parts = result.split('#');

    console.log('轉換結果 (前 2 集):');
    parts.slice(0, 2).forEach((part, index) => {
      const [name, url] = part.split('$');
      console.log(`  ${index + 1}. ${name}`);
      console.log(`     ${url}`);
    });

    // 範例 4: 詳情處理
    console.log('\n4️⃣ CMS10 詳情回應');
    console.log('─'.repeat(20));

    const { convertDetailResponseEnhanced } = await import('./src/cms10/processors.js');

    const testAnime = {
      id: 46442,
      title: "進擊的巨人 最終季",
      category: ["動作", "劇情"],
      episodes: TEST_EPISODES.PLAY_PATH_FORMAT,
      time: Date.now()
    };

    const response = convertDetailResponseEnhanced([testAnime], { quality: '720p' });

    console.log('CMS10 回應結構:');
    console.log(`  code: ${response.code}`);
    console.log(`  msg: "${response.msg}"`);
    console.log(`  total: ${response.total}`);
    // console.log(`  enhanced_features: ${response.enhanced_features ? '✅' : '❌'}`);

    if (response.list && response.list[0]) {
      const item = response.list[0];
      console.log(`  vod_name: "${item.vod_name}"`);
      console.log(`  vod_play_url: "${item.vod_play_url.substring(0, 80)}..."`);
    }

  } catch (error) {
    console.error('❌ 範例展示失敗:', error.message);
  }
}

// 命令列參數處理
const args = process.argv.slice(2);
const command = args[0] || 'test';

switch (command) {
  case 'test':
  case 'all':
    main().then(code => process.exit(code));
    break;

  case 'quick':
    quickTest();
    break;

  case 'examples':
  case 'demo':
    showExamples();
    break;

  case 'help':
    console.log('CMS10 第二階段測試執行器');
    console.log('');
    console.log('用法:');
    console.log('  node test-cms10-phase2.js [command]');
    console.log('');
    console.log('命令:');
    console.log('  test, all     執行完整測試套件 (預設)');
    console.log('  quick         快速驗證測試');
    console.log('  examples      展示功能範例');
    console.log('  help          顯示此說明');
    break;

  default:
    console.error(`未知命令: ${command}`);
    console.error('使用 "help" 查看可用命令');
    process.exit(1);
}