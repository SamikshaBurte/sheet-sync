"""Python Vercel Function: the only layer that talks to Google Sheets."""
import json
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google.oauth2 import service_account
from googleapiclient.discovery import build

app = FastAPI()
SHEET_ID = os.getenv("GOOGLE_SHEET_ID", "1nsbiN1FXZa7LekCrP_gdzwjBqiR1RF9AWuJgskIt-Pc")
RANGE = os.getenv("GOOGLE_SHEET_RANGE", "Sheet1!A:C")

class Row(BaseModel):
    id: str
    a: str
    b: str
    c: str
class RowsPayload(BaseModel):
    rows: list[Row]

def sheets_service():
    raw = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not raw and not path:
        raise HTTPException(503, "Google Sheets credentials are not configured")
    info = json.loads(raw) if raw else json.loads(Path(path).read_text(encoding="utf-8"))
    credentials = service_account.Credentials.from_service_account_info(info, scopes=["https://www.googleapis.com/auth/spreadsheets"])
    return build("sheets", "v4", credentials=credentials, cache_discovery=False)

@app.get("/")
def get_rows():
    values = sheets_service().spreadsheets().values().get(spreadsheetId=SHEET_ID, range=RANGE).execute().get("values", [])
    body = values[1:] if values and values[0] == ["A", "B", "C"] else values
    rows = [{"id": f"r{i + 1}", "a": (row + ["", "", ""])[0], "b": (row + ["", "", ""])[1], "c": (row + ["", "", ""])[2]} for i, row in enumerate(body)]
    return {"rows": rows, "mode": "live"}

@app.put("/")
def put_rows(payload: RowsPayload):
    values = [["A", "B", "C"]] + [[row.a, row.b, row.c] for row in payload.rows]
    service = sheets_service()
    service.spreadsheets().values().clear(spreadsheetId=SHEET_ID, range=RANGE, body={}).execute()
    service.spreadsheets().values().update(spreadsheetId=SHEET_ID, range="Sheet1!A1", valueInputOption="USER_ENTERED", body={"values": values}).execute()
    return {"rows": [row.model_dump() for row in payload.rows], "mode": "live"}