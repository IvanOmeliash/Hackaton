import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FlightLogUploader from './App.jsx'
import FlightDashboard from './FlightDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FlightLogUploader />
  </StrictMode>,
)
