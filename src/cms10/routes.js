/**
 * CMS10 路由定義和整合
 *
 * 此模組定義所有 CMS10 API 路由，並提供與現有路由系統的整合功能
 *
 * @author Myself-BBS API Team
 * @version 1.0.0
 * @date 2025-07-26 15:50:00 (UTC+8)
 */

import { Router } from "itty-router";
import { withErrorHandling } from './middleware.js';
import {
  handleCms10Request,
  getCms10Categories,
  getCms10Info,
  healthCheck
} from './handlers.js';

/**
 * 建立 CMS10 路由器
 * @returns {Router} CMS10 路由器實例
 *
 * @example
 * const cms10Router = createCms10Router();
 * router.all("/api.php/*", cms10Router.handle);
 */
function createCms10Router() {
  const cms10Router = Router();

  // 主要的 CMS10 API 端點
  cms10Router.get("/api.php/provide/vod/", withErrorHandling(async (request) => {
    const { query } = request;
    return await handleCms10Request(query);
  }));

  // 分類列表端點 (擴展功能)
  cms10Router.get("/api.php/provide/vod/categories", withErrorHandling(async (request) => {
    return await getCms10Categories();
  }));

  // API 資訊端點 (擴展功能)
  cms10Router.get("/api.php/provide/vod/info", withErrorHandling(async (request) => {
    return await getCms10Info();
  }));

  // 健康檢查端點 (擴展功能)
  cms10Router.get("/api.php/provide/vod/health", withErrorHandling(async (request) => {
    return await healthCheck();
  }));

  // 處理未知的 CMS10 路由
  cms10Router.all("/api.php/*", withErrorHandling(async (request) => {
    const { createErrorResponse } = await import('./response.js');
    const errorResponse = createErrorResponse(-1, `不支援的 CMS10 端點: ${new URL(request.url).pathname}`);

    const { response } = await import('../response.js');
    return response({
      data: JSON.stringify(errorResponse, null, 2)
    });
  }));

  return cms10Router;
}

/**
 * 整合 CMS10 路由到現有路由器
 * @param {Router} mainRouter - 主要路由器
 * @returns {Router} 整合後的路由器
 *
 * @example
 * const router = Router();
 * integrateCms10Routes(router);
 */
function integrateCms10Routes(mainRouter) {
  const cms10Router = createCms10Router();

  // 將 CMS10 路由整合到主路由器
  mainRouter.all("/api.php/*", cms10Router.handle);

  return mainRouter;
}

/**
 * 建立完整的路由配置
 * @returns {Object} 路由配置物件
 *
 * @example
 * const routeConfig = createRouteConfig();
 * console.log(routeConfig.cms10.endpoints);
 */
function createRouteConfig() {
  return {
    // 現有的 Myself-BBS 路由
    legacy: {
      endpoints: [
        { path: "/list", description: "列表索引" },
        { path: "/list/completed", description: "完結列表" },
        { path: "/list/airing", description: "連載列表" },
        { path: "/anime/all", description: "所有動畫" },
        { path: "/anime/:id", description: "動畫詳情" },
        { path: "/m3u8/:id/:ep", description: "播放地址" },
        { path: "/search/:query", description: "搜尋" }
      ]
    },

    // 新的 CMS10 路由
    cms10: {
      endpoints: [
        {
          path: "/api.php/provide/vod/?ac=list",
          description: "CMS10 列表 API",
          parameters: [
            { name: "ac", required: true, description: "操作類型 (list)" },
            { name: "pg", required: false, description: "頁碼" },
            { name: "limit", required: false, description: "每頁數量" },
            { name: "t", required: false, description: "分類 ID" },
            { name: "wd", required: false, description: "搜尋關鍵字" },
            { name: "h", required: false, description: "更新時間篩選" }
          ]
        },
        {
          path: "/api.php/provide/vod/?ac=detail",
          description: "CMS10 詳情 API",
          parameters: [
            { name: "ac", required: true, description: "操作類型 (detail)" },
            { name: "ids", required: true, description: "ID 列表，逗號分隔" },
            { name: "h", required: false, description: "更新時間篩選" }
          ]
        },
        {
          path: "/api.php/provide/vod/categories",
          description: "分類列表 (擴展)",
          parameters: []
        },
        {
          path: "/api.php/provide/vod/info",
          description: "API 資訊 (擴展)",
          parameters: []
        },
        {
          path: "/api.php/provide/vod/health",
          description: "健康檢查 (擴展)",
          parameters: []
        }
      ]
    }
  };
}

/**
 * 生成路由文件
 * @returns {Object} 路由文件物件
 *
 * @example
 * const docs = generateRouteDocs();
 * console.log(docs.title);
 */
function generateRouteDocs() {
  const config = createRouteConfig();

  return {
    title: "Myself-BBS API 路由文件",
    version: "1.0.0",
    description: "包含原有 API 和新增 CMS10 相容 API 的完整路由文件",
    baseUrl: "https://myself-bbs.jacob.workers.dev",

    sections: [
      {
        title: "原有 API 端點",
        description: "保持向後相容的原有 API 端點",
        endpoints: config.legacy.endpoints.map(endpoint => ({
          ...endpoint,
          fullUrl: `https://myself-bbs.jacob.workers.dev${endpoint.path}`,
          method: "GET"
        }))
      },
      {
        title: "CMS10 相容 API 端點",
        description: "符合 CMS10 標準的新 API 端點",
        endpoints: config.cms10.endpoints.map(endpoint => ({
          ...endpoint,
          fullUrl: `https://myself-bbs.jacob.workers.dev${endpoint.path}`,
          method: "GET"
        }))
      }
    ],

    examples: {
      legacy: [
        {
          title: "獲取連載列表",
          url: "/list/airing",
          description: "獲取所有連載中的動畫列表"
        },
        {
          title: "搜尋動畫",
          url: "/search/進擊的巨人",
          description: "搜尋包含關鍵字的動畫"
        }
      ],
      cms10: [
        {
          title: "CMS10 列表查詢",
          url: "/api.php/provide/vod/?ac=list&pg=1&limit=20",
          description: "獲取第一頁的動畫列表，每頁20項"
        },
        {
          title: "CMS10 分類查詢",
          url: "/api.php/provide/vod/?ac=list&t=1&pg=1",
          description: "獲取動作分類的動畫列表"
        },
        {
          title: "CMS10 搜尋查詢",
          url: "/api.php/provide/vod/?ac=list&wd=巨人&pg=1",
          description: "搜尋包含'巨人'關鍵字的動畫"
        },
        {
          title: "CMS10 詳情查詢",
          url: "/api.php/provide/vod/?ac=detail&ids=1,2,3",
          description: "獲取指定 ID 的動畫詳情"
        }
      ]
    }
  };
}

/**
 * 驗證路由配置
 * @returns {Object} 驗證結果
 *
 * @example
 * const validation = validateRouteConfig();
 * console.log(validation.isValid);
 */
function validateRouteConfig() {
  const config = createRouteConfig();
  const errors = [];
  const warnings = [];

  // 檢查路由重複
  const allPaths = [
    ...config.legacy.endpoints.map(e => e.path),
    ...config.cms10.endpoints.map(e => e.path)
  ];

  const duplicates = allPaths.filter((path, index) => allPaths.indexOf(path) !== index);
  if (duplicates.length > 0) {
    errors.push(`重複的路由路徑: ${duplicates.join(', ')}`);
  }

  // 檢查必要參數
  config.cms10.endpoints.forEach(endpoint => {
    const requiredParams = endpoint.parameters?.filter(p => p.required) || [];
    if (endpoint.path.includes('ac=detail') && !requiredParams.some(p => p.name === 'ids')) {
      warnings.push(`端點 ${endpoint.path} 缺少必要參數 ids 的定義`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalEndpoints: allPaths.length,
      legacyEndpoints: config.legacy.endpoints.length,
      cms10Endpoints: config.cms10.endpoints.length
    }
  };
}

export {
  createCms10Router,
  integrateCms10Routes,
  createRouteConfig,
  generateRouteDocs,
  validateRouteConfig
};