import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1nsbiN1FXZa7LekCrP_gdzwjBqiR1RF9AWuJgskIt-Pc/edit?gid=0#gid=0'

function App() {
  const [rows, setRows] = useState([])
  const [draft, setDraft] = useState([])
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState({ text: 'Connecting to sheet…', type: 'neutral' })
  const [lastSynced, setLastSynced] = useState('')

  const load = async (quiet = false) => {
    try {
      const response = await fetch('/api/rows')
      if (!response.ok) throw new Error('Unable to load')
      const data = await response.json()
      setRows(data.rows); if (!editing) setDraft(data.rows)
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      if (!quiet) setStatus({ text: data.mode === 'demo' ? 'Demo mode - add credentials to sync with Google Sheets' : 'Live sync connected', type: data.mode === 'demo' ? 'warning' : 'success' })
    } catch { if (!quiet) setStatus({ text: 'Connection unavailable - retrying automatically', type: 'error' }) }
  }

  useEffect(() => { load(); const id = setInterval(() => load(true), 5000); return () => clearInterval(id) }, [])
  const beginEdit = () => { setDraft(rows.map(row => ({ ...row }))); setEditing(true); setStatus({ text: 'Editing locally - submit to save', type: 'neutral' }) }
  const change = (index, field, value) => setDraft(current => current.map((row, i) => i === index ? { ...row, [field]: value } : row))
  const submit = async () => {
    setStatus({ text: 'Saving changes…', type: 'neutral' })
    try {
      const response = await fetch('/api/rows', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: draft }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      setRows(data.rows); setDraft(data.rows); setEditing(false)
      setStatus({ text: data.mode === 'demo' ? 'Saved in demo mode. Configure Google credentials for live writes.' : 'Saved to Google Sheets successfully', type: data.mode === 'demo' ? 'warning' : 'success' })
    } catch (error) { setStatus({ text: error.message || 'Could not save changes', type: 'error' }) }
  }
  const visible = editing ? draft : rows
  return <main>
    <section className="shell">
      <header><div><p className="eyebrow">BAJAJ EARTHS · SOFTWARE TASK</p><h1>Real-time sheet sync,<br/><em>made simple.</em></h1></div><a href={SHEET_URL} target="_blank" rel="noreferrer" className="sheet-link">Open Google Sheet <span>↗</span></a></header>
      <div className="signal"><span className={`dot ${status.type}`}></span><span>{status.text}</span><span className="sync-time">{lastSynced && `Last checked ${lastSynced}`}</span></div>
      <section className="card"><div className="card-head"><div><h2>Sheet data</h2><p>Polling every 5 seconds for changes made directly in Google Sheets.</p></div><div className="actions">{editing ? <><button className="text" onClick={() => { setEditing(false); setDraft(rows) }}>Cancel</button><button className="primary" onClick={submit}>Submit changes</button></> : <button className="primary" onClick={beginEdit}>Edit table</button>}</div></div>
        <div className="table-wrap"><table><thead><tr><th>Row</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>{visible.map((row, index) => <tr key={row.id}><td className="index">{index + 1}</td>{['a','b','c'].map(field => <td key={field}>{editing ? <input aria-label={`${field} row ${index + 1}`} value={row[field]} onChange={e => change(index, field, e.target.value)} /> : row[field]}</td>)}</tr>)}</tbody></table></div>
      </section>
      <footer><span>Two-way synchronization</span><i></i><span>React + Node.js + Python</span><i></i><span>Google Sheets API ready</span></footer>
    </section>
  </main>
}
createRoot(document.getElementById('root')).render(<App />)
