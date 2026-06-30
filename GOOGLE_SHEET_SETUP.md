# Google Sheets Integration Setup

## Overview
Cart data is automatically synced to your Google Sheet when:
- A product is added to cart
- Checkout is completed

## Step 1: Open Your Google Sheet
Open this sheet in your browser:
https://docs.google.com/spreadsheets/d/1s1avK3wn92KOKIYBB3qn31JsBoQBXoI6-fzdY-SpCso/edit?usp=sharing

## Step 2: Open Apps Script
1. In the Google Sheet, click **Extensions** → **Apps Script**
2. Delete any code in the default `Code.gs` file
3. Paste the code below

## Step 3: Paste This Apps Script Code

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Add headers if first row is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Product', 'Price', 'Quantity', 'Total', 'Action']);
    }

    // Append the data row
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.product || '',
      data.price || 0,
      data.quantity || 1,
      data.total || 0,
      data.action || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'Apps Script is running!' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Step 4: Save the Project
Click **Save** (floppy disk icon) and name the project `RajStudioCartSync`.

## Step 5: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the gear icon (⚙️) next to "Select type" and choose **Web app**
3. Set description: `Cart Sync API`
4. Execute as: **Me**
5. Who has access: **Anyone** (or **Anyone with Google account**)
6. Click **Deploy**
7. Authorize the script when prompted (click through permissions)

## Step 6: Copy the Web App URL
After deployment, you'll see a **Web app URL** like:
```
https://script.google.com/macros/s/AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/exec
```

## Step 7: Update script.js
Open `script.js` in this folder and replace the placeholder URL:

```javascript
// OLD (placeholder):
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// NEW (your actual deployed URL):
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_ACTUAL_DEPLOYMENT_ID/exec';
```

## Step 8: Test
1. Refresh your website (`index.html`)
2. Add a product to cart
3. Check your Google Sheet — a new row should appear!

## Data Columns in Sheet
| Timestamp | Product | Price | Quantity | Total | Action |
|-----------|---------|-------|----------|-------|--------|
| 2026-04-25T10:30:00.000Z | Premium Cotton T-Shirt | 24.99 | 1 | 24.99 | Added to Cart |

## Troubleshooting
- If data doesn't appear, check the browser console (F12) for errors
- Make sure the Web App is deployed with "Anyone" access
- Re-deploy the Apps Script if you make changes to the code

