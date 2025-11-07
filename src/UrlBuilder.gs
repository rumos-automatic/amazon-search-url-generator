/**
 * Amazon Search URL Generator - UrlBuilder.gs
 * 検索URL生成とHYPERLINK関数作成
 */

/**
 * Amazon検索URLを構築
 * @param {string} brand - ブランド名
 * @param {string} sortParam - ソートパラメータ（例: "date-desc-rank"）
 * @param {string} category - カテゴリコード（例: "hpc"）オプション
 * @return {string} Amazon検索URL
 */
function buildSearchUrl(brand, sortParam, category) {
  if (!brand || brand === 'N/A' || brand.startsWith('エラー:')) {
    return '';
  }

  const baseUrl = 'https://www.amazon.com/s';
  const encodedBrand = encodeSearchTerm(brand);

  // クエリパラメータを構築
  const params = [
    `k=${encodedBrand}`
  ];

  // カテゴリがある場合は追加（iパラメータ形式）
  if (category && category.trim() !== '') {
    params.push(`i=${category}`);
  }

  // ソートパラメータを追加
  params.push(`s=${sortParam}`);

  return `${baseUrl}?${params.join('&')}`;
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
 * HYPERLINK関数の文字列を生成
 * @param {string} url - リンク先URL
 * @param {string} label - 表示ラベル
 * @return {string} =HYPERLINK() 形式の文字列
 */
function createHyperlink(url, label) {
  if (!url || url === '') {
    return '';
  }

  // HYPERLINKの場合、式として返す
  return `=HYPERLINK("${url}", "${label}")`;
}
