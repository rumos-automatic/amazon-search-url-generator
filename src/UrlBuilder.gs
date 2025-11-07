/**
 * Amazon Search URL Generator - UrlBuilder.gs
 * 検索URL生成とHYPERLINK関数作成
 */

/**
 * Amazon検索URLを構築
 * @param {string} brand - ブランド名
 * @param {string} sortParam - ソートパラメータ（例: "date-desc-rank"）
 * @param {string} category - カテゴリコード（例: "hpc"）オプション
 * @param {string} urlType - URL生成方式（'brand_filter', 'keyword', 'hybrid'）デフォルト: 'brand_filter'
 * @return {string} Amazon検索URL
 */
function buildSearchUrl(brand, sortParam, category, urlType) {
  if (!brand || brand === 'N/A' || brand.startsWith('エラー:')) {
    return '';
  }

  // デフォルトはブランド絞り込み方式
  urlType = urlType || 'brand_filter';

  const baseUrl = 'https://www.amazon.com/s';
  const encodedBrand = encodeURIComponent(brand);
  const encodedCategory = category && category.trim() !== '' ? encodeURIComponent(category) : '';

  // URL方式に応じて異なるパラメータ構成を生成
  switch(urlType) {
    case 'brand_filter':
      // ブランド絞り込み方式: rh=i:category,p_89:Brand&s=sort
      if (encodedCategory) {
        return `${baseUrl}?rh=i:${encodedCategory},p_89:${encodedBrand}&s=${sortParam}`;
      } else {
        return `${baseUrl}?rh=p_89:${encodedBrand}&s=${sortParam}`;
      }

    case 'hybrid':
      // ハイブリッド方式: k=Brand&rh=p_89:Brand&i=category&s=sort
      const hybridParams = [`k=${encodedBrand}`, `rh=p_89:${encodedBrand}`];
      if (encodedCategory) {
        hybridParams.push(`i=${encodedCategory}`);
      }
      hybridParams.push(`s=${sortParam}`);
      return `${baseUrl}?${hybridParams.join('&')}`;

    case 'keyword':
    default:
      // キーワード検索方式（従来）: k=Brand&i=category&s=sort
      const keywordParams = [`k=${encodedBrand}`];
      if (encodedCategory) {
        keywordParams.push(`i=${encodedCategory}`);
      }
      keywordParams.push(`s=${sortParam}`);
      return `${baseUrl}?${keywordParams.join('&')}`;
  }
}

/**
 * 検索キーワードをURLエンコード
 * スペースは + に変換
 * @param {string} term - 検索キーワード
 * @return {string} エンコードされたキーワード
 */
function encodeSearchTerm(term) {
  // encodeURIComponent を使用し、スペースは + に置換
  return encodeURIComponent(term).replace(/%20/g, '+');
}

/**
 * HYPERLINK関数の文字列を生成（URLのみ表示）
 * @param {string} url - リンク先URL
 * @param {string} label - 表示ラベル（使用されません）
 * @return {string} =HYPERLINK() 形式の文字列
 */
function createHyperlink(url, label) {
  if (!url || url === '') {
    return '';
  }

  // HYPERLINKでURLのみ表示（ラベルなし）
  return `=HYPERLINK("${url}")`;
}
