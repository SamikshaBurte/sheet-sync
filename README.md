# Bajaj Earths - Real-Time Google Sheets Sync

A single-page React table that keeps columns **A**, **B**, and **C** synchronized with the supplied Google Sheet. It uses a deliberately simple three-layer architecture: React is the editable UI, Node.js is the public API gateway/static host, and Python owns Google authentication plus the Sheets API call.

## What is included

- Exactly three editable data columns (A, B, C) and four demonstration rows.
- **Edit table → Submit changes** workflow with validation-preserving whole-range writes.
- 5-second polling to detect Google Sheet edits without a browser refresh.
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
5. Ensure `Sheet1!A1:C5` holds the headers `A | B | C` followed by four data rows. The API will update this exact range, avoiding duplicate rows.

## Synchronization behavior and limitation

The browser requests `GET /api/rows` every **5 seconds**. The Python service reads `Sheet1!A1:C5`; therefore changes made directly in Google Sheets appear in the page on the next polling cycle, without refresh. After Submit, the Python service atomically updates the same fixed range using `USER_ENTERED`, then returns the saved rows to the frontend. Typical direct-edit latency is 0–5 seconds plus API response time. Polling is intentionally used here because Google Sheets does not provide a straightforward first-party cell-change webhook; it is reliable for this small fixed table and easy to deploy.

## Deploy for free with Vercel

This repository is configured for a single Vercel project: `api/rows.js` is the Node.js public API gateway and `api/sheet.py` is the Python Google Sheets function. The React page calls the Node route, which calls the Python route. This preserves the assignment's React + Node.js + Python architecture in one free deployment.

1. Push this folder to a new GitHub repository, then import that repository at Vercel.
2. In Vercel **Settings → Environment Variables**, add `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE`, and `GOOGLE_SERVICE_ACCOUNT_JSON` for Production, Preview, and Development.
3. For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the entire contents of the service-account JSON key as one value. Never create a `VITE_*` variable for it and never commit the file.
4. Deploy. Vercel builds the Vite frontend and detects the Node and Python functions in `api/`.

Vercel's Python Functions support FastAPI and are available on all plans (currently beta), which makes this suitable for the small demonstration app. For a production system, use a dedicated backend with monitoring and secret rotation.
