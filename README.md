# Bajaj Earths - Real-Time Google Sheets Sync

A single-page React table that keeps columns **A**, **B**, and **C** synchronized with the supplied Google Sheet. It uses a deliberately simple three-layer architecture: React is the editable UI, Node.js is the public API gateway/static host, and Python owns Google authentication plus the Sheets API call.

## What is included

- Exactly three editable data columns (A, B, C), with add and delete row controls.
- **Edit table → Submit changes** workflow with validation-preserving whole-range writes.
- 2-second polling to detect Google Sheet edits without a browser refresh.
- A safe demo mode, so the interface is immediately demonstrable even before credentials exist.
- No credential is embedded in frontend code or committed to Git.

## Run locally

1. Install Node dependencies: `npm install`.
2. Create a Python virtual environment and install `pip install -r python-service/requirements.txt`.
3. Copy `.env.example` to `.env` and add credentials (details below).
4. Start the Python service: `uvicorn main:app --app-dir python-service --port 8000`.
5. In a second terminal run `npm run dev`, then open `http://localhost:5173`.

Without credentials, the app runs in **demo mode**, persisting edits only in `python-service/demo_rows.json`. This makes the design and Edit/Submit experience immediately testable; it does not claim live Google writes.

## Connect the provided Sheet

1. In Google Cloud Console, create/select a project and enable **Google Sheets API**.
2. Create a service account and JSON key. Do not upload the key to GitHub.
3. Share the Google Sheet with the service-account email as **Editor**.
4. Put either the minified JSON in `GOOGLE_SERVICE_ACCOUNT_JSON` or an absolute local path in `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.
5. Ensure `Sheet1` uses headers `A | B | C` in row 1. The API synchronizes the complete `Sheet1!A:C` range, so rows can be added or deleted.

## Synchronization behavior and limitation

The browser requests `GET /api/rows` every **2 seconds**. The Python service reads the complete `Sheet1!A:C` range, so changes made directly in Google Sheets appear in the page on the next polling cycle without a browser refresh. After Submit, it clears and rewrites the A:C data range from the table, ensuring removed rows do not leave old cell values behind. Typical direct-edit latency is 0-2 seconds plus API response time. Polling is used because Google Sheets does not provide a straightforward first-party cell-change webhook.

## Deploy for free with Render + Vercel

The easiest free deployment pattern for this project is:

- Frontend: Vercel
- Backend: Render
- Google Sheet credentials: environment variables only

This keeps the React app static on Vercel while the Python API reads and writes the Google Sheet from Render.

### 1) Prepare the backend on Render

1. Push this repository to GitHub.
2. In Render, click **New > Web Service** and connect the GitHub repository.
3. Use the following settings:
   - Runtime: Python
   - Root directory: `.`
   - Build command: `pip install -r python-service/requirements.txt`
   - Start command: `uvicorn python-service.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables in Render:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_SHEET_RANGE`
   - `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
5. Copy the deployed Render URL after the service is live.

### 2) Prepare the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. In the Vercel project settings, add:
   - `VITE_API_URL=https://your-render-service.onrender.com`
3. Deploy the frontend.
4. The browser will call the Render API instead of `localhost`.

### 3) Important production note

For local development, the app uses the Node proxy at `/api/rows`.
For production deployment, set `VITE_API_URL` and the frontend calls the live Render backend directly.

### 4) Security

- Never commit the service-account JSON to GitHub.
- Store it in the hosting platform environment variables.
- Do not expose secrets in frontend source code.

### 5) Expected latency

The app uses polling every 2 seconds to fetch the latest sheet values. Changes made directly in Google Sheets appear in the web UI on the next polling interval.
