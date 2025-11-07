/**
 * Amazon Search URL Generator - KeepaApi.gs
 * Keepa APIを使用してAmazon商品データを取得
 */

/**
 * Keepa APIでASINから商品データを取得
 * @param {string} asin - Amazon ASIN
 * @return {Object} {asin, brand, category, source, error}
 */
function getAmazonDataViaKeepa(asin) {
  try {
    // 設定からAPI Keyを取得
    const config = loadConfig();
    const apiKey = config.KEEPA_API_KEY;

    if (!apiKey || apiKey === '') {
      return {
        asin: asin,
        brand: null,
        category: null,
        source: 'Keepa',
        error: 'KEEPA_API_KEY が設定されていません'
      };
    }

    // Keepa API リクエスト
    const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asin}`;
    Logger.log(`Fetching from Keepa API: ${asin}`);

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      return {
        asin: asin,
        brand: null,
        category: null,
        source: 'Keepa',
        error: `Keepa API エラー: HTTP ${statusCode}`
      };
    }

    const data = JSON.parse(response.getContentText());

    // エラーチェック
    if (data.error) {
      return {
        asin: asin,
        brand: null,
        category: null,
        source: 'Keepa',
        error: `Keepa API エラー: ${data.error.message || data.error}`
      };
    }

    // トークン残高のログ出力
    if (data.tokensLeft !== undefined) {
      Logger.log(`Keepa tokens remaining: ${data.tokensLeft}`);

      // トークンが不足している場合は特別なエラーを返す
      if (data.tokensLeft === 0) {
        Logger.log(`トークン不足: ASIN ${asin} の処理を中断します`);
        return {
          asin: asin,
          brand: null,
          category: null,
          source: 'Keepa',
          error: 'トークン不足（次回トリガーで再試行）'
        };
      }
    }

    // 製品データを取得
    if (!data.products || data.products.length === 0) {
      return {
        asin: asin,
        brand: null,
        category: null,
        source: 'Keepa',
        error: '製品が見つかりませんでした'
      };
    }

    const product = data.products[0];

    // ブランド名を取得
    const brand = product.brand || 'N/A';

    // ノードIDを取得
    let nodeId = null;
    if (product.rootCategory) {
      nodeId = product.rootCategory;
    } else if (product.categories && product.categories.length > 0) {
      nodeId = product.categories[0];
    }

    // ノードIDをカテゴリコードに変換
    let category = '';
    if (nodeId) {
      category = mapNodeIdToCategoryCode(nodeId);

      // マッピングが見つからない場合は、カテゴリ名から推測（フォールバック）
      if (!category && product.categoryTree && product.categoryTree.length > 0) {
        const categoryName = product.categoryTree[0].name;
        Logger.log(`Fallback to category name: ${categoryName}`);
        category = guessCategoryCodeFromName(categoryName);
      }
    }

    Logger.log(`Success: ASIN=${asin}, Brand=${brand}, NodeID=${nodeId}, Category=${category}`);

    return {
      asin: asin,
      brand: brand,
      category: category,
      source: 'Keepa',
      error: null
    };

  } catch (error) {
    Logger.log(`Error fetching from Keepa API for ASIN ${asin}: ${error.message}`);
    return {
      asin: asin,
      brand: null,
      category: null,
      source: 'Keepa',
      error: `例外エラー: ${error.message}`
    };
  }
}
