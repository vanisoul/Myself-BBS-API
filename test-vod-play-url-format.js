/**
 * vod_play_url 格式驗證測試
 *
 * 驗證生成的 vod_play_url 是否符合用戶提供的解析邏輯
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 18:33:00 (UTC+8)
 */

import { convertPlayUrlEnhanced, convertPlayUrl } from './src/cms10/converters.js';

/**
 * 用戶的解析邏輯 (模擬前端解析)
 * @param {string} vodPlayUrl - vod_play_url 字串
 * @returns {Array} 解析出的 URL 陣列
 */
function parseVodPlayUrl(vodPlayUrl) {
  let episodes = [];

  const playSources = vodPlayUrl.split('$$$');
  if (playSources.length > 0) {
    const mainSource = playSources[0];
    const episodeList = mainSource.split('#');
    episodes = episodeList
      .map((ep) => {
        const parts = ep.split('$');
        return parts.length > 1 ? parts[1] : '';
      })
      .filter(
        (url) =>
          url && (url.startsWith('http://') || url.startsWith('https://'))
      );
  }

  return episodes;
}

/**
 * 測試資料
 */
const TEST_EPISODES = {
  // Play Path 格式
  PLAY_PATH: {
    "第 01 話 海的那邊": "play/46442/001",
    "第 02 話 暗夜列車": "play/46442/002",
    "第 03 話 冒險開始": "play/46442/003"
  },

  // Encoded ID 格式
  ENCODED_ID: {
    "第 01 話": "AgADMg4AAvWkAVc",
    "第 02 話": "AgADsA0AAjef-VU",
    "第 03 話": "BgBDNh5BBwXlBWd"
  },

  // 舊格式 (陣列)
  LEGACY: {
    "第 01 話": ["1", "001"],
    "第 02 話": ["1", "002"],
    "第 03 話": ["1", "003"]
  }
};

/**
 * 驗證單個 vod_play_url 格式
 * @param {string} vodPlayUrl - 要驗證的 URL 字串
 * @param {string} testName - 測試名稱
 * @returns {Object} 驗證結果
 */
function validateVodPlayUrlFormat(vodPlayUrl, testName) {
  console.log(`\n🔍 驗證 ${testName}`);
  console.log(`原始 vod_play_url: ${vodPlayUrl.substring(0, 100)}${vodPlayUrl.length > 100 ? '...' : ''}`);

  const result = {
    testName,
    originalUrl: vodPlayUrl,
    isValid: false,
    episodes: [],
    errors: []
  };

  try {
    // 使用用戶的解析邏輯
    const parsedEpisodes = parseVodPlayUrl(vodPlayUrl);
    result.episodes = parsedEpisodes;

    console.log(`解析結果: 找到 ${parsedEpisodes.length} 個有效 URL`);

    // 驗證解析結果
    if (parsedEpisodes.length === 0) {
      result.errors.push('未解析到任何有效的 URL');
    } else {
      // 檢查每個 URL 的格式
      parsedEpisodes.forEach((url, index) => {
        console.log(`  ${index + 1}. ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}`);

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          result.errors.push(`URL ${index + 1} 不是有效的 HTTP/HTTPS 地址: ${url}`);
        }
      });
    }

    // 檢查格式結構
    const playSources = vodPlayUrl.split('$$$');
    console.log(`播放源數量: ${playSources.length}`);

    if (playSources.length > 0) {
      const mainSource = playSources[0];
      const episodeList = mainSource.split('#');
      console.log(`集數數量: ${episodeList.length}`);

      // 檢查每集的格式
      let validEpisodes = 0;
      episodeList.forEach((ep, index) => {
        const parts = ep.split('$');
        if (parts.length >= 2) {
          validEpisodes++;
          console.log(`  集數 ${index + 1}: "${parts[0]}" -> "${parts[1].substring(0, 50)}${parts[1].length > 50 ? '...' : ''}"`);
        } else {
          result.errors.push(`集數 ${index + 1} 格式錯誤: ${ep}`);
        }
      });

      if (validEpisodes === episodeList.length && result.errors.length === 0) {
        result.isValid = true;
        console.log(`✅ 格式驗證通過`);
      } else {
        console.log(`❌ 格式驗證失敗: ${result.errors.length} 個錯誤`);
      }
    }

  } catch (error) {
    result.errors.push(`解析過程出錯: ${error.message}`);
    console.log(`❌ 解析失敗: ${error.message}`);
  }

  return result;
}

/**
 * 測試增強版轉換器
 */
async function testEnhancedConverter() {
  console.log('\n🧪 測試增強版轉換器');
  console.log('='.repeat(50));

  const results = [];

  // 測試 Play Path 格式
  console.log('\n1️⃣ 測試 Play Path 格式');
  const playPathUrl = convertPlayUrlEnhanced(TEST_EPISODES.PLAY_PATH, 46442, {
    quality: '720p',
    enableFallback: true
  });
  results.push(validateVodPlayUrlFormat(playPathUrl, 'Play Path 格式'));

  // 測試 Encoded ID 格式
  console.log('\n2️⃣ 測試 Encoded ID 格式');
  const encodedIdUrl = convertPlayUrlEnhanced(TEST_EPISODES.ENCODED_ID, 12345, {
    enableFallback: true
  });
  results.push(validateVodPlayUrlFormat(encodedIdUrl, 'Encoded ID 格式'));

  return results;
}

/**
 * 測試舊版轉換器
 */
async function testLegacyConverter() {
  console.log('\n🧪 測試舊版轉換器');
  console.log('='.repeat(50));

  const results = [];

  // 測試舊格式
  console.log('\n3️⃣ 測試舊格式 (陣列)');
  const legacyUrl = convertPlayUrl(TEST_EPISODES.LEGACY, 12345);
  results.push(validateVodPlayUrlFormat(legacyUrl, '舊格式 (陣列)'));

  return results;
}

/**
 * 測試多播放源格式
 */
async function testMultiplePlaySources() {
  console.log('\n🧪 測試多播放源格式');
  console.log('='.repeat(50));

  // 模擬多播放源的 vod_play_url
  const multiSourceUrl = [
    "第 01 話$https://vpx05.myself-bbs.com/vpx/46442/001/720p.m3u8",
    "第 02 話$https://vpx05.myself-bbs.com/vpx/46442/002/720p.m3u8"
  ].join('#') + '$$$' + [
    "第 01 話$https://backup.myself-bbs.com/vpx/46442/001/720p.m3u8",
    "第 02 話$https://backup.myself-bbs.com/vpx/46442/002/720p.m3u8"
  ].join('#');

  console.log('\n4️⃣ 測試多播放源格式');
  const result = validateVodPlayUrlFormat(multiSourceUrl, '多播放源格式');

  return [result];
}

/**
 * 主要測試執行函式
 */
async function runAllTests() {
  console.log('🎯 vod_play_url 格式驗證測試');
  console.log('='.repeat(60));
  console.log(`測試時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`);

  const allResults = [];

  try {
    // 執行各項測試
    const enhancedResults = await testEnhancedConverter();
    const legacyResults = await testLegacyConverter();
    const multiSourceResults = await testMultiplePlaySources();

    allResults.push(...enhancedResults, ...legacyResults, ...multiSourceResults);

    // 輸出測試摘要
    console.log('\n🏆 測試結果摘要');
    console.log('='.repeat(60));

    let passed = 0;
    let failed = 0;

    allResults.forEach(result => {
      if (result.isValid) {
        passed++;
        console.log(`✅ ${result.testName} - 通過 (${result.episodes.length} 個 URL)`);
      } else {
        failed++;
        console.log(`❌ ${result.testName} - 失敗`);
        result.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
    });

    const total = passed + failed;
    const successRate = (passed / total) * 100;

    console.log('\n📊 統計資訊');
    console.log(`總測試數: ${total}`);
    console.log(`通過: ${passed}`);
    console.log(`失敗: ${failed}`);
    console.log(`成功率: ${successRate.toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 所有格式驗證通過！vod_play_url 格式符合用戶解析邏輯。');
      return 0;
    } else {
      console.log(`\n⚠️ 有 ${failed} 個測試失敗，需要修復格式問題。`);
      return 1;
    }

  } catch (error) {
    console.error('💥 測試執行失敗:', error);
    return 1;
  }
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().then(code => process.exit(code));
}

export { runAllTests, validateVodPlayUrlFormat, parseVodPlayUrl };