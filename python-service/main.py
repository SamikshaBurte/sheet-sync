import json, os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv(Path(__file__).parent.parent / '.env')
app = FastAPI(title='Bajaj Earths Google Sheets sync service')
SHEET_ID = os.getenv('GOOGLE_SHEET_ID', '1nsbiN1FXZa7LekCrP_gdzwjBqiR1RF9AWuJgskIt-Pc')
RANGE = os.getenv('GOOGLE_SHEET_RANGE', 'Sheet1!A:C')
DEMO_ROWS = [{'id': 'r1', 'a': 'One', 'b': 'North', 'c': 'Active'}, {'id': 'r2', 'a': 'Two', 'b': 'South', 'c': 'Active'}, {'id': 'r3', 'a': 'Three', 'b': 'East', 'c': 'Pending'}, {'id': 'r4', 'a': 'Four', 'b': 'West', 'c': 'Active'}]
DEMO_FILE = Path(__file__).parent / 'demo_rows.json'
class Row(BaseModel): id: str; a: str; b: str; c: str
class RowsPayload(BaseModel): rows: list[Row]


def service():
    raw = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')
    file_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not raw and not file_path:
        return None

    try:
        info = json.loads(raw) if raw else json.loads(Path(file_path).read_text(encoding='utf-8'))
    except Exception as exc:
        raise RuntimeError(f'Invalid Google service-account configuration: {exc}') from exc

    credentials = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/spreadsheets'])
    return build('sheets', 'v4', credentials=credentials, cache_discovery=False)


def demo_rows():
    if not DEMO_FILE.exists():
        DEMO_FILE.write_text(json.dumps(DEMO_ROWS), encoding='utf-8')
    return json.loads(DEMO_FILE.read_text(encoding='utf-8'))


def read_rows():
    api = service()
    if not api:
        return demo_rows(), 'demo'
    values = api.spreadsheets().values().get(spreadsheetId=SHEET_ID, range=RANGE).execute().get('values', [])
    body = values[1:] if values and values[0] == ['A', 'B', 'C'] else values
    return [
        {'id': f'r{i + 1}', 'a': (row + ['', '', ''])[0], 'b': (row + ['', '', ''])[1], 'c': (row + ['', '', ''])[2]}
        for i, row in enumerate(body)
    ], 'live'


@app.get('/rows')
def get_rows():
    rows, mode = read_rows(); return {'rows': rows, 'mode': mode}


@app.put('/rows')
def put_rows(payload: RowsPayload):
    api = service(); rows = [r.model_dump() for r in payload.rows]
    if not api:
        DEMO_FILE.write_text(json.dumps(rows), encoding='utf-8'); return {'rows': rows, 'mode': 'demo'}
    values = [['A', 'B', 'C']] + [[r['a'], r['b'], r['c']] for r in rows]
    api.spreadsheets().values().clear(spreadsheetId=SHEET_ID, range=RANGE, body={}).execute()
    api.spreadsheets().values().update(spreadsheetId=SHEET_ID, range='Sheet1!A1', valueInputOption='USER_ENTERED', body={'values': values}).execute()
    return {'rows': rows, 'mode': 'live'}