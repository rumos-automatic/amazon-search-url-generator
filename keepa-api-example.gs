/**
 * Keepa API 実装例
 * 現在のスクレイピングをKeepa APIで置き換える
 */

/**
 * Keepa APIでASINから商品データを取得
 * @param {string} asin - Amazon ASIN
 * @return {Object} {asin, brand, category, error}
 */
function getAmazonDataViaKeepa(asin) {
  try {
    // API KeyをScript Propertiesから取得（安全な管理）
    const apiKey = PropertiesService.getScriptProperties().getProperty('KEEPA_API_KEY');

    if (!apiKey) {
      return {
        asin: asin,
        brand: null,
        category: null,
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
        error: `Keepa API エラー: ${data.error.message || data.error}`
      };
    }

    // トークン残高のログ出力
    if (data.tokensLeft !== undefined) {
      Logger.log(`Keepa tokens remaining: ${data.tokensLeft}`);
    }

    // 製品データを取得
    if (!data.products || data.products.length === 0) {
      return {
        asin: asin,
        brand: null,
        category: null,
        error: '製品が見つかりませんでした'
      };
    }

    const product = data.products[0];

    // ブランド名を取得
    const brand = product.brand || 'N/A';

    // カテゴリを取得（rootCategory を優先、なければ categories[0]）
    let category = '';
    if (product.rootCategory) {
      category = getCategoryCode(product.rootCategory);
    } else if (product.categories && product.categories.length > 0) {
      category = getCategoryCode(product.categories[0]);
    }

    Logger.log(`Successfully fetched from Keepa API: ${asin}, Brand: ${brand}, Category: ${category}`);

    return {
      asin: asin,
      brand: brand,
      category: category,
      error: null
    };

  } catch (error) {
    Logger.log(`Error fetching from Keepa API for ASIN ${asin}: ${error.message}`);
    return {
      asin: asin,
      brand: null,
      category: null,
      error: `例外エラー: ${error.message}`
    };
  }
}

/**
 * KeepaのカテゴリノードIDをAmazon検索用のカテゴリコードに変換
 * @param {number} nodeId - Keepa カテゴリノードID
 * @return {string} カテゴリコード（例: "tools"）
 */
function getCategoryCode(nodeId) {
  // Keepa カテゴリノードID → Amazon カテゴリコード のマッピング
  // 必要に応じて追加・修正
  const categoryMap = {
    // 例：Tools & Home Improvement
    228013: 'hi',
    511228: 'tools',

    // 例：Health & Household
    3760901: 'hpc',

    // 例：Sports & Outdoors
    3375251: 'sporting',

    // 例：Toys & Games
    165793011: 'toys-and-games',

    // 他のカテゴリは必要に応じて追加
  };

  return categoryMap[nodeId] || nodeId.toString();
}

/**
 * Keepa API Key を設定する（初回のみ実行）
 */
function setKeepaApiKey() {
  const apiKey = 'YOUR_KEEPA_API_KEY_HERE';
  PropertiesService.getScriptProperties().setProperty('KEEPA_API_KEY', apiKey);
  Logger.log('Keepa API Key が設定されました');
}

/**
 * テスト用関数
 */
function testKeepaApi() {
  const testAsin = 'B00U26V4VQ'; // テスト用ASIN
  const result = getAmazonDataViaKeepa(testAsin);
  Logger.log(JSON.stringify(result, null, 2));
}
