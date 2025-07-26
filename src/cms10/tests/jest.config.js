/**
 * CMS10 模組 Jest 測試配置
 *
 * 專門為 CMS10 模組設計的測試配置，包含適當的環境設定和覆蓋率要求
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:56:00 (UTC+8)
 */

export default {
  // 測試環境
  testEnvironment: 'node',

  // 測試檔案模式
  testMatch: [
    '**/src/cms10/tests/**/*.test.js'
  ],

  // 模組檔案擴展名
  moduleFileExtensions: ['js', 'json'],

  // 轉換設定
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // 模組名稱映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@cms10/(.*)$': '<rootDir>/src/cms10/$1'
  },

  // 設定檔案
  setupFilesAfterEnv: [
    '<rootDir>/src/cms10/tests/setup.js'
  ],

  // 覆蓋率設定
  collectCoverage: true,
  collectCoverageFrom: [
    'src/cms10/**/*.js',
    '!src/cms10/tests/**',
    '!src/cms10/**/*.test.js',
    '!src/cms10/**/*.md'
  ],

  // 覆蓋率閾值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/cms10/converters.js': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/cms10/errors.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/cms10/validators.js': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // 覆蓋率報告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],

  // 覆蓋率輸出目錄
  coverageDirectory: '<rootDir>/coverage/cms10',

  // 測試超時設定
  testTimeout: 10000,

  // 詳細輸出
  verbose: true,

  // 錯誤時停止
  bail: false,

  // 快取設定
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // 清除 mock
  clearMocks: true,
  restoreMocks: true,

  // 全域變數
  globals: {
    'process.env.NODE_ENV': 'test'
  },

  // 忽略模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // 監視模式忽略
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/.git/'
  ]
};