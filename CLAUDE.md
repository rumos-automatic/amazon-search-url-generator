# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Google Apps Script (GAS) project that generates Amazon search URLs from ASINs. It retrieves brand names and category information from Amazon products (via Keepa API) and generates filtered search URLs with different sort options (newest/relevance).

**Target Platform**: Amazon.com (US marketplace, domain=1 in Keepa API)
**Main Output**: Google Spreadsheet with HYPERLINK formulas pointing to Amazon search URLs

## Development Commands

### Deployment with clasp

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to Google account
clasp login

# Create new GAS project (if not exists)
clasp create --type sheets --title "Amazon Search URL Generator"

# Push code to GAS
clasp push

# Pull code from GAS
clasp pull
```

### Local Development

- This project has no build step - it's pure Google Apps Script
- Edit `.gs` files in `src/` directory
- Use `clasp push` to deploy changes to Google Apps Script

## Architecture

### Core Data Flow

1. **User Input**: ASINs in column A of "商品データ" (Product Data) sheet
2. **Data Retrieval**: `getAmazonDataViaKeepa(asin)` fetches brand and category from Keepa API
3. **URL Generation**: `buildSearchUrl()` creates 3 types of Amazon search URLs:
   - **Brand Filter** (recommended): `rh=i:category,p_89:Brand` - Uses Amazon's p_89 parameter for exact brand matching
   - **Keyword**: `k=Brand&i=category` - Traditional keyword search
   - **Hybrid**: `k=Brand&rh=p_89:Brand&i=category` - Combines both for strictest filtering
4. **Output**: Writes brand, category, and HYPERLINK formulas to columns B-E

### Module Structure

```
src/
├── Main.gs              # Entry point, menu handlers, batch processing loop
├── KeepaApi.gs          # Keepa API integration, token management
├── CategoryMapping.gs   # NodeID → CategoryCode conversion (89 categories)
├── UrlBuilder.gs        # Amazon search URL construction (3 URL types)
├── SheetManager.gs      # Spreadsheet I/O, sheet initialization
├── Config.gs            # Configuration loader from "設定" sheet
├── KeepaScheduler.gs    # Automated 10-min trigger processing
└── Scraper.gs           # (Legacy) HTML scraping fallback
```

### URL Generation Strategy

The project supports 3 Amazon search URL formats (selected via menu):

1. **Brand Filter** (`brand_filter`): Most reliable, reduces false positives
   - Format: `https://www.amazon.com/s?rh=i:hpc,p_89:CeraVe&s=date-desc-rank`
   - Uses Amazon's `p_89` refinement parameter for exact brand matching

2. **Keyword** (`keyword`): Traditional search, may include unrelated products
   - Format: `https://www.amazon.com/s?k=CeraVe&i=hpc&s=date-desc-rank`
   - Uses keyword search with category filter

3. **Hybrid** (`hybrid`): Strictest filtering, combines both methods
   - Format: `https://www.amazon.com/s?k=CeraVe&rh=p_89:CeraVe&i=hpc&s=date-desc-rank`

### Category Mapping System

**Challenge**: Keepa API returns NodeIDs, but Amazon search URLs require category codes.

**Solution**: Manual mapping table in "カテゴリマッピング" sheet (89 categories covering 95%+ of Amazon)

- Primary: Direct NodeID lookup (e.g., 3760901 → "hpc")
- Fallback: Category name pattern matching in `guessCategoryCodeFromName()`

Key function: `mapNodeIdToCategoryCode(nodeId)` in `CategoryMapping.gs`

### Batch Processing Pattern

To avoid Google Apps Script timeout (6 min limit):

1. Process in batches of 10 items (configurable via BATCH_SIZE)
2. `SpreadsheetApp.flush()` after each batch to persist data
3. Skip already-processed rows (brand column not empty)
4. No completion dialogs (designed for unattended operation)
5. Wait 20 seconds between API calls (WAIT_TIME_MS)

### Configuration System

Settings stored in "設定" (Config) sheet, loaded by `loadConfig()`:

- **Column mappings**: ASIN_COLUMN (A), BRAND_COLUMN (B), etc.
- **Processing**: WAIT_TIME_MS (20000ms), BATCH_SIZE (10)
- **Keepa**: KEEPA_API_KEY (required)
- **URL params**: SORT_NEW_PARAM (date-desc-rank), SORT_RELEVANCE_PARAM (relevanceblender)

Defaults in `getDefaultConfig()` are used if sheet doesn't exist.

## Important Implementation Details

### Keepa API Token Management

- Tokens are consumed per API request (1 token = 1 product)
- Token count returned in API response: `data.tokensLeft`
- **Special handling**: If `tokensLeft === 0`, return special error to skip row (allows retry on next trigger)
- Token info displayed in header row (F column) with timestamp

### Error Handling Strategy

Two types of errors in `KeepaApi.gs`:

1. **Token errors** (`tokensLeft === 0`): Leave brand column empty → row will be retried
2. **Other errors** (API errors, network issues): Write error message to brand column → row marked as processed

This prevents infinite retry loops while allowing recovery from temporary token shortage.

### Row Processing Logic

```javascript
// Skip if ASIN is empty
if (!asin || asin.toString().trim() === '') continue;

// Skip if already processed (brand column has value)
if (isRowProcessed(sheet, rowNum, brandColumn)) continue;

// Process and write data
const data = getDataFunction(asin);
writeRowData(sheet, rowNum, config, data);
```

Key: `isRowProcessed()` checks if brand column is non-empty.

### Google Apps Script Specifics

- **onOpen()**: Adds custom menu "Amazon URL生成" when spreadsheet opens
- **Custom menus**: Call different functions with different `urlType` parameters
- **HYPERLINK formulas**: Generated as strings like `=HYPERLINK("url")` and written via `setFormula()`
- **Column conversion**: `columnLetterToIndex('B')` converts Excel-style letters to 1-based indices

## Testing Strategy

Since this is GAS with tight integration to Google Sheets:

1. Create test spreadsheet with sample ASINs
2. Run menu commands: "ブランド絞り込み", "キーワード検索", "ハイブリッド"
3. Verify outputs in columns B-E
4. Check Logger output via Apps Script IDE (View → Logs)
5. Test token depletion scenario (use low-token API key)

**No unit testing framework** - GAS doesn't support traditional test runners. Use manual testing with real spreadsheets.

## Common Pitfalls

1. **Keepa API Key**: Must be set in "設定" sheet, otherwise all requests fail
2. **Category mapping**: If NodeID not found, category will be empty string (URL still works but won't filter by category)
3. **Timeout**: Processing 50+ ASINs at once may hit 6-min GAS limit. Use automatic scheduler for large batches.
4. **URL encoding**: Brand names with special characters are `encodeURIComponent()`-ed in `buildSearchUrl()`
5. **Spreadsheet flush**: Forgetting `SpreadsheetApp.flush()` means data might not save before timeout

## Keepa API Details

- **Endpoint**: `https://api.keepa.com/product?key={apiKey}&domain=1&asin={asin}`
- **Domain**: 1 = Amazon.com (US)
- **Response fields used**:
  - `products[0].brand` - Brand name
  - `products[0].rootCategory` - Primary category NodeID
  - `products[0].categoryTree[0].name` - Fallback for category guessing
  - `tokensLeft` - Remaining API tokens

## Key Differences from Typical Projects

- **No package.json**: Pure GAS, no npm dependencies
- **No local execution**: Code runs in Google's cloud infrastructure
- **Spreadsheet as database**: All state persisted in Google Sheets cells
- **Manual deployment**: Use clasp or copy-paste into Apps Script IDE
- **Japanese UI**: Menu items and sheet names are in Japanese
