/**
 * 本地開發伺服器
 *
 * 用於本地測試 CMS10 API 功能的開發伺服器
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 16:04:00 (UTC+8)
 */

import http from 'http';
import { URL } from 'url';
import main from './main.js';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

/**
 * 模擬 Cloudflare Workers 的 Request 物件
 */
class MockRequest {
  constructor(url, method = 'GET', headers = {}, body = null) {
    this.url = url;
    this.method = method;
    this.headers = new Map(Object.entries(headers));
    this.body = body;

    // 解析 URL 和查詢參數
    const urlObj = new URL(url);
    this.query = Object.fromEntries(urlObj.searchParams);
    this.params = {}; // 會在路由匹配時設定
  }
}

/**
 * 模擬 Cloudflare Workers 的 Response 物件
 */
class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();

    if (init.headers) {
      if (init.headers instanceof Headers) {
        for (const [key, value] of init.headers) {
          this.headers.set(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(init.headers)) {
          this.headers.set(key, value);
        }
      }
    }
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

// 設定全域 Response 類別
global.Response = MockResponse;

/**
 * 處理 HTTP 請求
 */
async function handleRequest(req, res) {
  try {
    const url = `http://${req.headers.host}${req.url}`;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // 建立模擬的 Request 物件
    const mockRequest = new MockRequest(url, req.method, req.headers);

    // 呼叫主要的處理函式
    const response = await main.fetch(mockRequest, {}, {});

    // 設定回應標頭
    res.statusCode = response.status;

    for (const [key, value] of response.headers) {
      res.setHeader(key, value);
    }

    // 確保設定 CORS 標頭
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 回傳回應內容
    const responseText = await response.text();
    res.end(responseText);

  } catch (error) {
    console.error('請求處理錯誤:', error);

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: '內部伺服器錯誤',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, null, 2));
  }
}

/**
 * 建立 HTTP 伺服器
 */
const server = http.createServer(handleRequest);

/**
 * 啟動伺服器
 */
server.listen(PORT, HOST, () => {
  console.log('🚀 Myself-BBS API 本地開發伺服器已啟動');
  console.log(`📍 伺服器地址: http://${HOST}:${PORT}`);
  console.log('');
  console.log('📋 可用的 API 端點:');
  console.log('');
  console.log('🔗 原有 API 端點:');
  console.log(`   GET  http://${HOST}:${PORT}/list/airing`);
  console.log(`   GET  http://${HOST}:${PORT}/list/completed`);
  console.log(`   GET  http://${HOST}:${PORT}/anime/1`);
  console.log(`   GET  http://${HOST}:${PORT}/search/進擊的巨人`);
  console.log('');
  console.log('🆕 CMS10 API 端點:');
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/?ac=list`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/?ac=list&pg=1&limit=20`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/?ac=list&t=1`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/?ac=list&wd=巨人`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/?ac=detail&ids=1,2,3`);
  console.log('');
  console.log('🔧 擴展功能端點:');
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/categories`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/info`);
  console.log(`   GET  http://${HOST}:${PORT}/api.php/provide/vod/health`);
  console.log('');
  console.log('💡 使用 Ctrl+C 停止伺服器');
});

/**
 * 優雅關閉
 */
process.on('SIGINT', () => {
  console.log('\n🛑 正在關閉伺服器...');
  server.close(() => {
    console.log('✅ 伺服器已關閉');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到終止信號，正在關閉伺服器...');
  server.close(() => {
    console.log('✅ 伺服器已關閉');
    process.exit(0);
  });
});

export default server;