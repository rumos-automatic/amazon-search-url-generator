function debugHtml() {
  var asin = 'B00000DMD2';
  var url = 'https://www.amazon.com/dp/' + asin;

  var response = UrlFetchApp.fetch(url, {
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

  var html = response.getContentText();

  Logger.log('HTML size: ' + html.length + ' characters');

  // CAPTCHA やブロックページをチェック
  if (html.indexOf('captcha') !== -1 || html.indexOf('CAPTCHA') !== -1) {
    Logger.log('CAPTCHA DETECTED!');
  }
  if (html.indexOf('Robot Check') !== -1 || html.indexOf('robot') !== -1) {
    Logger.log('ROBOT CHECK DETECTED!');
  }
  if (html.indexOf('Access Denied') !== -1) {
    Logger.log('ACCESS DENIED!');
  }

  // 商品ページ要素をチェック
  if (html.indexOf('bylineInfo') !== -1) {
    Logger.log('bylineInfo FOUND!');
    var bylineMatch = html.indexOf('bylineInfo');
    Logger.log('Surrounding: ' + html.substring(bylineMatch, bylineMatch + 300));
  } else {
    Logger.log('bylineInfo NOT FOUND');
  }

  if (html.indexOf('productTitle') !== -1) {
    Logger.log('productTitle FOUND!');
    var titleMatch = html.indexOf('productTitle');
    Logger.log('Surrounding: ' + html.substring(titleMatch, titleMatch + 200));
  } else {
    Logger.log('productTitle NOT FOUND');
  }
}
