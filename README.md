# Bajaj Earths - Real-Time Google Sheets Sync

This project is a React + Google Sheets app that keeps columns A, B, and C synchronized with a Google Sheet.

The current production setup is Vercel-only: the frontend is served by Vercel and the API is implemented as a Vercel serverless route in [api/rows.js](api/rows.js). The app still reads and writes the Google Sheet using the Google Sheets API and a service-account JSON stored as a Vercel environment variable.

## Included features

- Editable table with A, B, and C columns
- Add-row and remove-row controls
- Submit changes to Google Sheets
- Polling every 2 seconds to detect direct edits in the sheet
- Demo fallback when credentials are not configured

## Local run instructions

### 1) Install Node packages

```powershell
cd "D:\bajaj earth assignment project"
npm install
```

### 2) Create and activate the Python environment

```powershell
cd "D:\bajaj earth assignment project"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r python-service\requirements.txt
```

### 3) Create a local env file

Copy [.env.example](.env.example) to `.env` and fill in the real values.

Example:

```env
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SHEET_RANGE=Sheet1!A:C
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

> Do not commit `.env` to GitHub.

### 4) Start the backend

Open one terminal and run:

```powershell
cd "D:\bajaj earth assignment project\python-service"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Then verify it is running:

```powershell
curl http://127.0.0.1:8000/rows
```

### 5) Start the frontend

Open a second terminal and run:

```powershell
cd "D:\bajaj earth assignment project"
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Google Sheets setup

1. Enable the Google Sheets API in Google Cloud Console.
2. Create a service account and JSON key.
3. Share the target Google Sheet with the service account email as Editor.
4. Put the service-account JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Make sure the sheet header row contains `A`, `B`, `C` in row 1.

## Synchronization behavior

The app polls the sheet every 2 seconds and refreshes the browser table automatically. When you click Submit, the app clears and rewrites the `A:C` range with the current edited rows.

## Vercel-only deployment

This project is designed to deploy entirely on Vercel.

### Required Vercel environment variables

Add these in the Vercel project settings:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_RANGE`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

Do not add `VITE_API_URL` for the Vercel-only version because the app calls `/api/rows` directly.

### Vercel build settings

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

### API route behavior

The app uses [api/rows.js](api/rows.js) as the API endpoint, so the browser calls:

```text
/api/rows
```

This route performs the live read/write to Google Sheets and returns JSON for the frontend.

## Security notes

- Never commit the service account JSON to GitHub.
- Use Vercel environment variables for secrets.
- Keep `.env` and any service-account JSON file outside the repository.

## Expected result

Once the Vercel deployment is live and the env vars are configured correctly, the page should load real data from the Google Sheet, and edits from the browser should update the sheet through the Vercel API route.
