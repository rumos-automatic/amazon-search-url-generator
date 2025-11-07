/**
 * Amazon Search URL Generator - Scraper.gs
 * Amazonからブランド名とカテゴリをスクレイピング
 */

/**
 * ASINからAmazon商品データを取得
 * Amazon.comのみから取得
 * @param {string} asin - Amazon ASIN
 * @return {Object} {asin, brand, category, source, error}
 */
function getAmazonData(asin) {
  // Amazon.com から取得
  Logger.log(`Fetching from Amazon.com for ASIN: ${asin}`);
  const data = fetchAmazonPage(asin, 'https://www.amazon.com/dp/', 'US');

  if (data.brand && data.brand !== 'N/A' && !data.error) {
    Logger.log(`Successfully fetched from Amazon.com: ${asin}`);
    return data;
  }

  // 失敗時のエラーメッセージを詳細化
  let errorMessage = data.error;
  if (!errorMessage && data.brand === 'N/A') {
    errorMessage = 'HTTP 200 OK だがブランド抽出失敗（3段階フォールバックすべて）';
  } else if (!errorMessage) {
    errorMessage = '不明なエラー';
  }

  Logger.log(`Failed to fetch data from Amazon.com for ASIN: ${asin} - ${errorMessage}`);
  return {
    asin: asin,
    brand: null,
    category: null,
    source: 'US',
    error: errorMessage
  };
}

/**
 * 指定されたAmazonサイトから商品データを取得
 * @param {string} asin - Amazon ASIN
 * @param {string} baseUrl - ベースURL（例: 'https://www.amazon.co.jp/dp/'）
 * @param {string} source - 取得元（'JP' または 'US'）
 * @return {Object} {asin, brand, category, source, error}
 */
function fetchAmazonPage(asin, baseUrl, source) {
  try {
    const url = `${baseUrl}${asin}`;
    Logger.log(`Fetching: ${url}`);

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1'
      }
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      // HTTPステータスコード名を追加
      const statusMessages = {
        403: 'Forbidden (アクセス拒否・レート制限の可能性)',
        404: 'Not Found (商品が存在しない)',
        503: 'Service Unavailable (Amazon一時エラー)',
        500: 'Internal Server Error (Amazonサーバーエラー)',
        429: 'Too Many Requests (リクエスト過多)'
      };
      const statusMessage = statusMessages[statusCode] || `エラー (ステータス: ${statusCode})`;
      const errorMsg = `HTTP ${statusCode}: ${statusMessage}`;

      Logger.log(`${errorMsg} for ${url}`);
      return {
        asin: asin,
        brand: null,
        category: null,
        source: source,
        error: errorMsg
      };
    }

    const html = response.getContentText();

    // ブランド名を抽出（3段階フォールバック）
    let brand = extractBrandFromProductOverview(html);
    if (!brand) {
      brand = extractBrandFromByline(html);
    }
    // Product Details のフォールバックは一時的に無効化（パフォーマンス問題）
    // if (!brand) {
    //   brand = extractBrandFromProductDetails(html);
    // }
    // if (!brand) {
    //   brand = extractManufacturerFromProductDetails(html);
    // }
    if (!brand) {
      brand = extractBrandFromTitle(html);
    }

    // カテゴリを抽出（2段階フォールバック）
    let category = extractCategoryFromDropdown(html);
    if (!category) {
      category = extractCategoryFromNavSubnav(html);
    }

    return {
      asin: asin,
      brand: brand || 'N/A',
      category: category || '',
      source: source,
      error: null
    };

  } catch (error) {
    // エラーメッセージを詳細化
    let errorMsg = error.message || '不明なエラー';

    // タイムアウトエラーを判定
    if (errorMsg.toLowerCase().includes('timeout')) {
      errorMsg = `タイムアウト: ${errorMsg}`;
    } else if (errorMsg.toLowerCase().includes('dns')) {
      errorMsg = `DNS解決エラー: ${errorMsg}`;
    } else if (errorMsg.toLowerCase().includes('network')) {
      errorMsg = `ネットワークエラー: ${errorMsg}`;
    } else {
      errorMsg = `例外エラー: ${errorMsg}`;
    }

    Logger.log(`Error fetching from ${baseUrl}${asin}: ${errorMsg}`);
    return {
      asin: asin,
      brand: null,
      category: null,
      source: source,
      error: errorMsg
    };
  }
}

/**
 * 優先1: productOverview の po-brand テーブル行からブランド名を抽出
 * @param {string} html - HTML文字列
 * @return {string|null} ブランド名
 */
function extractBrandFromProductOverview(html) {
  try {
    // <tr class="...po-brand..."> ... <td class="a-span9"> ... <span>Brand Name</span>
    const pattern = /<tr[^>]*class="[^"]*po-brand[^"]*"[^>]*>[\s\S]*?<td\s+class="a-span9"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const brand = match[1].trim();
      Logger.log(`Brand extracted from productOverview: ${brand}`);
      return brand;
    }
  } catch (error) {
    Logger.log(`Error in extractBrandFromProductOverview: ${error.message}`);
  }
  return null;
}

/**
 * 優先2: bylineInfo から "Visit the {Brand} Store" 形式でブランド名を抽出
 * @param {string} html - HTML文字列
 * @return {string|null} ブランド名
 */
function extractBrandFromByline(html) {
  try {
    // <a id="bylineInfo" ...>Visit the Brand Store</a>
    const pattern = /<a\s+id="bylineInfo"[^>]*>Visit\s+the\s+(.+?)\s+Store<\/a>/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const brand = match[1].trim();
      Logger.log(`Brand extracted from bylineInfo: ${brand}`);
      return brand;
    }
  } catch (error) {
    Logger.log(`Error in extractBrandFromByline: ${error.message}`);
  }
  return null;
}

/**
 * 優先3: productTitle の最初の単語をブランド名として抽出
 * @param {string} html - HTML文字列
 * @return {string|null} ブランド名
 */
function extractBrandFromTitle(html) {
  try {
    // <span id="productTitle" ...>Brand Name Product Title...</span>
    const pattern = /<span\s+id="productTitle"[^>]*>([^<]+)<\/span>/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const title = match[1].trim();
      // 最初の単語を取得
      const firstWord = title.split(/\s+/)[0];
      Logger.log(`Brand extracted from productTitle (first word): ${firstWord}`);
      return firstWord;
    }
  } catch (error) {
    Logger.log(`Error in extractBrandFromTitle: ${error.message}`);
  }
  return null;
}

/**
 * 優先1: 検索ドロップダウンの selected option からカテゴリを抽出
 * @param {string} html - HTML文字列
 * @return {string|null} カテゴリコード（例: "hpc"）
 */
function extractCategoryFromDropdown(html) {
  try {
    // <option selected="selected" ... value="search-alias=hpc">...</option>
    const pattern = /<option[^>]*selected="selected"[^>]*value="search-alias=([^"]+)"/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const category = match[1].trim();
      Logger.log(`Category extracted from dropdown: ${category}`);
      return category;
    }
  } catch (error) {
    Logger.log(`Error in extractCategoryFromDropdown: ${error.message}`);
  }
  return null;
}

/**
 * 優先2: nav-subnav の data-category 属性からカテゴリを抽出
 * @param {string} html - HTML文字列
 * @return {string|null} カテゴリコード
 */
function extractCategoryFromNavSubnav(html) {
  try {
    // <div id="nav-subnav" data-category="hpc">
    const pattern = /id="nav-subnav"[^>]*data-category="([^"]+)"/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const category = match[1].trim();
      Logger.log(`Category extracted from nav-subnav: ${category}`);
      return category;
    }
  } catch (error) {
    Logger.log(`Error in extractCategoryFromNavSubnav: ${error.message}`);
  }
  return null;
}

/**
 * 優先4: Product Details の "Brand Name" 行からブランド名を抽出
 * @param {string} html - HTML文字列
 * @return {string|null} ブランド名
 */
function extractBrandFromProductDetails(html) {
  try {
    // <th>Brand Name</th> <td>Melissa & Doug</td>
    const pattern = /<th[^>]*>[\s\n]*Brand[\s\n]+Name[\s\n]*<\/th>[\s\n]*<td[^>]*>[\s\n]*([^<]+)[\s\n]*<\/td>/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const brand = match[1].trim().replace(/&amp;/g, '&');
      Logger.log(`Brand extracted from Product Details (Brand Name): ${brand}`);
      return brand;
    }
  } catch (error) {
    Logger.log(`Error in extractBrandFromProductDetails: ${error.message}`);
  }
  return null;
}

/**
 * 優先5: Product Details の "Manufacturer" 行からブランド名を抽出
 * @param {string} html - HTML文字列
 * @return {string|null} ブランド名
 */
function extractManufacturerFromProductDetails(html) {
  try {
    // <th>Manufacturer</th> <td>Melissa & Doug</td>
    const pattern = /<th[^>]*>[\s\n]*Manufacturer[\s\n]*<\/th>[\s\n]*<td[^>]*>[\s\n]*([^<]+)[\s\n]*<\/td>/i;
    const match = html.match(pattern);

    if (match && match[1]) {
      const brand = match[1].trim().replace(/&amp;/g, '&');
      Logger.log(`Brand extracted from Product Details (Manufacturer): ${brand}`);
      return brand;
    }
  } catch (error) {
    Logger.log(`Error in extractManufacturerFromProductDetails: ${error.message}`);
  }
  return null;
}
