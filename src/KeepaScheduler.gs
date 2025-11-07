/**
 * Amazon Search URL Generator - KeepaScheduler.gs
 * Keepa API 自動処理スケジューラ（10分おきのトリガー実行）
 */

/**
 * 10分おきのトリガーで実行されるメイン関数
 * A列にASINがあり、B列が空欄の行を上から順に処理
 * トークンが尽きたら処理を中断し、次回トリガーで再開
 */
function processKeepaScheduled() {
  try {
    const config = loadConfig();
    const sheet = getTargetSheet(config.TARGET_SHEET_NAME);

    if (!sheet) {
      Logger.log('対象シートが見つかりません。');
      return;
    }

    // Keepa APIキーの確認
    if (!config.KEEPA_API_KEY || config.KEEPA_API_KEY === '') {
      Logger.log('KEEPA_API_KEY が設定されていません。処理を中止します。');
      updateHeaderWithTokenInfo(sheet, null, 'API Key未設定');
      return;
    }

    // トークン残数を確認
    const tokensInfo = getKeepaTokensLeft();

    if (!tokensInfo.success) {
      Logger.log(`トークン残数の取得に失敗しました: ${tokensInfo.error}`);
      updateHeaderWithTokenInfo(sheet, null, 'トークン取得失敗');
      return;
    }

    Logger.log(`Keepa トークン残数: ${tokensInfo.tokensLeft}`);

    // トークンがない場合は処理しない
    if (tokensInfo.tokensLeft <= 0) {
      Logger.log('トークンが不足しています。次回トリガーで再試行します。');
      updateHeaderWithTokenInfo(sheet, tokensInfo.tokensLeft, 'トークン不足');
      return;
    }

    // 未処理の行を取得（A列にASIN、B列が空欄）
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('処理対象の行がありません。');
      updateHeaderWithTokenInfo(sheet, tokensInfo.tokensLeft, '処理対象なし');
      return;
    }

    const asinColumn = columnLetterToIndex(config.ASIN_COLUMN);
    const brandColumn = columnLetterToIndex(config.BRAND_COLUMN);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let tokenExhausted = false;
    let currentTokens = tokensInfo.tokensLeft;

    // 上から順に処理
    for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
      const asin = sheet.getRange(rowNum, asinColumn).getValue();

      // ASINが空の場合はスキップ
      if (!asin || asin.toString().trim() === '') {
        continue;
      }

      // 既に処理済み（ブランド列に値がある）の場合はスキップ
      const brandValue = sheet.getRange(rowNum, brandColumn).getValue();
      if (brandValue && brandValue.toString().trim() !== '') {
        continue;
      }

      Logger.log(`Processing row ${rowNum}: ASIN = ${asin}`);

      // Keepa APIでデータ取得
      const data = getAmazonDataViaKeepa(asin);

      // トークンエラーの場合は処理を中断
      if (data.error && data.error.includes('トークン不足')) {
        Logger.log(`トークンが不足しました。行 ${rowNum} で処理を中断します。`);
        tokenExhausted = true;
        currentTokens = 0;
        break;
      }

      // エラーの場合
      if (data.error) {
        Logger.log(`Error for ASIN ${asin}: ${data.error}`);
        writeRowData(sheet, rowNum, config, {
          brand: `エラー: ${data.error}`,
          category: '',
          newUrl: '',
          relevanceUrl: ''
        });
        errorCount++;
      } else {
        // 成功の場合
        const newUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_NEW_PARAM, data.category),
          config.NEW_LABEL
        );
        const relevanceUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_RELEVANCE_PARAM, data.category),
          config.RELEVANCE_LABEL
        );

        writeRowData(sheet, rowNum, config, {
          brand: data.brand,
          category: data.category,
          newUrl: newUrl,
          relevanceUrl: relevanceUrl
        });
        successCount++;
        currentTokens--;  // トークンを1つ消費
      }

      processedCount++;

      // シートに確実に保存
      SpreadsheetApp.flush();

      // 待機（Keepa APIのレート制限対策）
      if (rowNum < lastRow) {
        Utilities.sleep(config.WAIT_TIME_MS || 3000);
      }
    }

    // 処理結果をログ出力
    const status = tokenExhausted ? 'トークン不足で中断' : '処理完了';
    Logger.log(`processKeepaScheduled 完了: 処理=${processedCount}件, 成功=${successCount}件, エラー=${errorCount}件, 状態=${status}`);

    // ヘッダー行のトークン情報を更新
    updateHeaderWithTokenInfo(sheet, currentTokens, status);

  } catch (error) {
    Logger.log(`Error in processKeepaScheduled: ${error.message}`);
  }
}

/**
 * Keepa APIからトークン残数を取得
 * @return {Object} {success: boolean, tokensLeft: number, error: string}
 */
function getKeepaTokensLeft() {
  try {
    const config = loadConfig();
    const apiKey = config.KEEPA_API_KEY;

    if (!apiKey || apiKey === '') {
      return {
        success: false,
        tokensLeft: 0,
        error: 'API Key が設定されていません'
      };
    }

    // ダミーのリクエストでトークン残数を取得
    // Keepa APIはどのエンドポイントでもtokensLeftを返す
    const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=B000000000`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const data = JSON.parse(response.getContentText());

    if (data.tokensLeft !== undefined) {
      return {
        success: true,
        tokensLeft: data.tokensLeft,
        error: null
      };
    }

    return {
      success: false,
      tokensLeft: 0,
      error: 'tokensLeft フィールドが見つかりません'
    };

  } catch (error) {
    Logger.log(`Error in getKeepaTokensLeft: ${error.message}`);
    return {
      success: false,
      tokensLeft: 0,
      error: error.message
    };
  }
}

/**
 * 10分おきのトリガーを設定
 */
function setupKeepaScheduler() {
  try {
    // 既存のトリガーを削除
    removeKeepaScheduler();

    // 新しいトリガーを作成（10分おき）
    ScriptApp.newTrigger('processKeepaScheduled')
      .timeBased()
      .everyMinutes(10)
      .create();

    SpreadsheetApp.getUi().alert(
      'トリガー設定完了',
      '10分おきの自動処理を開始しました。\n\n処理状況はヘッダー行の右端で確認できます。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    Logger.log('Keepa自動処理トリガーを設定しました（10分おき）');

  } catch (error) {
    Logger.log(`Error in setupKeepaScheduler: ${error.message}`);
    SpreadsheetApp.getUi().alert('エラー', `トリガー設定に失敗しました: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Keepa自動処理のトリガーを削除
 */
function removeKeepaScheduler() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let removedCount = 0;

    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'processKeepaScheduled') {
        ScriptApp.deleteTrigger(trigger);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      SpreadsheetApp.getUi().alert(
        'トリガー削除完了',
        `${removedCount}個のトリガーを削除しました。\n\n自動処理が停止されました。`,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      Logger.log(`Keepa自動処理トリガーを${removedCount}個削除しました`);
    } else {
      SpreadsheetApp.getUi().alert(
        '情報',
        'アクティブなトリガーが見つかりませんでした。',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      Logger.log('削除するトリガーが見つかりませんでした');
    }

  } catch (error) {
    Logger.log(`Error in removeKeepaScheduler: ${error.message}`);
    SpreadsheetApp.getUi().alert('エラー', `トリガー削除に失敗しました: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
