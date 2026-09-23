import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1nsbiN1FXZa7LekCrP_gdzwjBqiR1RF9AWuJgskIt-Pc/edit?gid=0#gid=0'
const rowsUrl = `${(import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/rows`

function App() {
  const [rows, setRows] = useState([])
  const [draft, setDraft] = useState([])
  const [editing, setEditing] = useState(false)
  const editingRef = useRef(false)
  const [status, setStatus] = useState({ text: 'Connecting to sheet…', type: 'neutral' })
  const [lastSynced, setLastSynced] = useState('')

  const load = async (quiet = false) => {
    try {
      const response = await fetch(rowsUrl)
      if (!response.ok) throw new Error('Unable to load')
      const data = await response.json()
      setRows(data.rows)
      if (!editingRef.current) setDraft(data.rows)
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      if (!quiet) setStatus({ text: data.mode === 'demo' ? 'Demo mode - add credentials to sync with Google Sheets' : 'Live sync connected', type: data.mode === 'demo' ? 'warning' : 'success' })
    } catch { if (!quiet) setStatus({ text: 'Connection unavailable - retrying automatically', type: 'error' }) }
  }

  useEffect(() => { load(); const id = setInterval(() => load(true), 2000); return () => clearInterval(id) }, [])
  const beginEdit = () => { setDraft(rows.map(row => ({ ...row }))); editingRef.current = true; setEditing(true); setStatus({ text: 'Editing locally - submit to save', type: 'neutral' }) }
  const change = (index, field, value) => setDraft(current => current.map((row, i) => i === index ? { ...row, [field]: value } : row))
  const addRow = () => setDraft(current => [...current, { id: `new-${Date.now()}`, a: '', b: '', c: '' }])
  const removeRow = index => setDraft(current => current.filter((_, i) => i !== index))
  const cancel = () => { editingRef.current = false; setEditing(false); setDraft(rows) }
  const submit = async () => {
    setStatus({ text: 'Saving changes…', type: 'neutral' })
    try {
      const response = await fetch(rowsUrl, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: draft }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      setRows(data.rows); setDraft(data.rows); editingRef.current = false; setEditing(false)
      setStatus({ text: data.mode === 'demo' ? 'Saved in demo mode. Configure Google credentials for live writes.' : 'Saved to Google Sheets successfully', type: data.mode === 'demo' ? 'warning' : 'success' })
    } catch (error) { setStatus({ text: error.message || 'Could not save changes', type: 'error' }) }
  }
  const visible = editing ? draft : rows
  return <main>
    <section className="shell">
      <header><div><p className="eyebrow">BAJAJ EARTHS · SOFTWARE TASK</p><h1>Real-time sheet sync,<br/><em>made simple.</em></h1></div><a href={SHEET_URL} target="_blank" rel="noreferrer" className="sheet-link">Open Google Sheet <span>↗</span></a></header>
      <div className="signal"><span className={`dot ${status.type}`}></span><span>{status.text}</span><span className="sync-time">{lastSynced && `Last checked ${lastSynced}`}</span></div>
      <section className="card"><div className="card-head"><div><h2>Sheet data</h2><p>Polling every 2 seconds for changes made directly in Google Sheets.</p></div><div className="actions">{editing ? <><button className="text" onClick={cancel}>Cancel</button><button className="primary" onClick={submit}>Submit changes</button></> : <button className="primary" onClick={beginEdit}>Edit table</button>}</div></div>
        <div className="table-wrap"><table><thead><tr><th>Row</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>{visible.length ? visible.map((row, index) => <tr key={row.id}><td className="index">{index + 1}</td>{['a','b','c'].map(field => <td key={field}>{editing ? <div className="cell-editor"><input aria-label={`${field} row ${index + 1}`} value={row[field]} onChange={e => change(index, field, e.target.value)} />{field === 'c' && <button className="remove" aria-label={`Delete row ${index + 1}`} onClick={() => removeRow(index)}>×</button>}</div> : row[field]}</td>)}</tr>) : <tr><td colSpan="4" className="empty">No data rows. Add one to begin.</td></tr>}</tbody></table></div>{editing && <button className="add-row" onClick={addRow}>+ Add row</button>}
      </section>
      <footer><span>Two-way synchronization</span><i></i><span>React + Node.js + Python</span><i></i><span>Google Sheets API ready</span></footer>
    </section>
  </main>
}
createRoot(document.getElementById('root')).render(<App />)