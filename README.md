# Bajaj Earths - Real-Time Google Sheets Sync

This repository contains a React frontend, a Node.js API proxy, and a Python FastAPI service for syncing sheet data with Google Sheets.

## Project overview

- Frontend: React + Vite
- Local API: Node.js + Express
- Sync service: Python + FastAPI
- Google integration: Google Sheets API via a service account
- Local default ports:
  - Frontend: http://localhost:5173
  - Node API: http://localhost:3001
  - Python service: http://localhost:8000

The app reads and writes columns A, B, and C from a Google Sheet. If valid Google credentials are not configured, it falls back to demo data so the app still runs locally.

## Prerequisites

Install the following before running the project locally:

- Node.js 18+
- npm
- Python 3.10+
- Git

## Repository structure

- `src/` — React app
- `server/` — Node proxy API server
- `python-service/` — FastAPI Google Sheets sync service
- `api/` — Vercel serverless route used for deployment
- `vite.config.js` — frontend dev server config
- `.env.example` — sample environment variables
- `.env` — local environment file (not committed)

## 1) Clone and open the project

```powershell
cd "E:\bajaj earth assignment"
git clone https://github.com/SamikshaBurte/sheet-sync.git
cd "E:\bajaj earth assignment\sheet-sync"
```

## 2) Install Node packages

```powershell
npm install
```

## 3) Create a Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r python-service\requirements.txt
```

If PowerShell blocks the activation command, run this first:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\.venv\Scripts\Activate.ps1
```

## 4) Create a local environment file

Copy the sample file and fill in the real values:

```powershell
Copy-Item .env.example .env
```

Then update `.env` with values like:

```env
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SHEET_RANGE=Sheet1!A:C
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
# GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json

PYTHON_SERVICE_URL=http://127.0.0.1:8000
PORT=3001
```

Notes:

- Do not commit `.env`.
- Do not store service-account JSON in GitHub.
- If you do not provide valid Google credentials, the app automatically uses demo rows.

## 5) Start the Python sync service manually

Open a terminal and run:

```powershell
cd "E:\bajaj earth assignment\sheet-sync\python-service"
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Verify it is responding:

```powershell
curl http://127.0.0.1:8000/rows
```

## 6) Start the Node API manually

Open a second terminal and run:

```powershell
cd "E:\bajaj earth assignment\sheet-sync"
node server/index.js
```

This starts the Express API on port 3001 and proxies requests to the Python service.

## 7) Start the frontend manually

Open a third terminal and run:

```powershell
cd "E:\bajaj earth assignment\sheet-sync"
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Alternative: run both frontend + API together

This project includes a combined dev script:

```powershell
cd "E:\bajaj earth assignment\sheet-sync"
npm run dev
```

The script runs the Node API and the Vite frontend together through the project scripts defined in `package.json`.

## Google Sheets setup

1. Enable the Google Sheets API in Google Cloud Console.
2. Create a service account and JSON key.
3. Share the target Google Sheet with the service account email as an Editor.
4. Add the service account JSON to `GOOGLE_SERVICE_ACCOUNT_JSON` or point `GOOGLE_APPLICATION_CREDENTIALS` to a local JSON file.
5. Ensure the sheet header row contains `A`, `B`, and `C` in row 1.

## App behavior

- The frontend polls the API every 2 seconds.
- Direct changes in Google Sheets are reflected in the UI.
- Editing in the browser and clicking Submit writes the updated rows back to the sheet.
- If credentials are missing, the app stays in demo mode.

## Vercel deployment

This project is also designed to run in Vercel.

Required environment variables for deployment:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEET_RANGE`
- `GOOGLE_SERVICE_ACCOUNT_JSON`

For Vercel builds, use:

- Build command: `npm run build`
- Output directory: `dist`

## Security notes

- Never commit `.env` or service-account JSON.
- Keep secrets in environment variables only.
- Use `.env.example` as the template for required values.

## Troubleshooting

If the app does not load:

- Make sure the Python service is running on port 8000.
- Make sure the Node API is running on port 3001.
- Confirm the `.env` file exists and contains valid credentials.
- Check the browser console and terminal logs for request failures.

## Result

Once the environment is configured correctly and the servers are running, the app loads Sheet data and synchronizes updates between the browser and Google Sheets.

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
