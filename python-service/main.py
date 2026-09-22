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
RANGE = os.getenv('GOOGLE_SHEET_RANGE', 'Sheet1!A1:C5')
DEMO_ROWS = [{'id': 'r1', 'a': 'ONe', 'b': 'North', 'c': 'Active'}, {'id': 'r2', 'a': 'Two', 'b': 'South', 'c': 'Active'}, {'id': 'r3', 'a': 'Three', 'b': 'East', 'c': 'Pending'}, {'id': 'r4', 'a': 'Four', 'b': 'West', 'c': 'Active'}]
DEMO_FILE = Path(__file__).parent / 'demo_rows.json'
class Row(BaseModel): id: str; a: str; b: str; c: str
class RowsPayload(BaseModel): rows: list[Row]

def service():
    raw = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON')
    file_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if not raw and not file_path: return None
    info = json.loads(raw) if raw else json.loads(Path(file_path).read_text())
    credentials = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/spreadsheets'])
    return build('sheets', 'v4', credentials=credentials, cache_discovery=False)
def demo_rows():
    if not DEMO_FILE.exists(): DEMO_FILE.write_text(json.dumps(DEMO_ROWS))
    return json.loads(DEMO_FILE.read_text())
def read_rows():
    api = service()
    if not api: return demo_rows(), 'demo'
    values = api.spreadsheets().values().get(spreadsheetId=SHEET_ID, range=RANGE).execute().get('values', [])
    body = values[1:] if values and values[0] == ['A','B','C'] else values
    return [{'id': f'r{i+1}', 'a': (row + ['','',''])[0], 'b': (row + ['','',''])[1], 'c': (row + ['','',''])[2]} for i, row in enumerate(body[:4])], 'live'
@app.get('/rows')
def get_rows():
    rows, mode = read_rows(); return {'rows': rows, 'mode': mode}
@app.put('/rows')
def put_rows(payload: RowsPayload):
    if len(payload.rows) != 4: raise HTTPException(400, 'Exactly four rows are required')
    api = service(); rows = [r.model_dump() for r in payload.rows]
    if not api:
        DEMO_FILE.write_text(json.dumps(rows)); return {'rows': rows, 'mode': 'demo'}
    values = [['A','B','C']] + [[r['a'], r['b'], r['c']] for r in rows]
    api.spreadsheets().values().update(spreadsheetId=SHEET_ID, range=RANGE, valueInputOption='USER_ENTERED', body={'values': values}).execute()
    return {'rows': rows, 'mode': 'live'}
