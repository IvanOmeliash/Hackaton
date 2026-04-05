import { User, ChevronLeft, Download, Loader, CheckCircle } from 'lucide-react';
import { MONO } from '../utils/constants';

export default function DashboardNavbar({ onBack, fileName, pdfExporting, onExportPDF }) {
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between",
      padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,0.045)",
      background: "rgba(10,15,26,0.88)", backdropFilter: "blur(14px)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
            color: "#cbd5e1", cursor: "pointer", fontSize: 11, fontFamily: MONO,
          }}>
            <ChevronLeft size={13} /> Назад
          </button>
        )}
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#f1f5f9" }}>Drone</span>
          <span style={{ background: "linear-gradient(90deg,#60a5fa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Log</span>
          <span style={{ color: "#cbd5e1", fontWeight: 400 }}> Analyzer</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* PDF Export Button */}
        <button
          onClick={onExportPDF}
          disabled={pdfExporting}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: pdfExporting ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "5px 12px", cursor: pdfExporting ? "not-allowed" : "pointer",
            fontFamily: MONO, fontSize: 10, color: "#94a3b8",
            transition: "all 0.2s",
          }}
        >
          {pdfExporting
            ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> Генерую PDF…</>
            : <><Download size={11} /> Завантажити звіт PDF</>
          }
        </button>
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)",
          borderRadius: 8, padding: "5px 11px",
        }}>
          <CheckCircle size={10} color="#22c55e" />
          <span style={{ fontSize: 10, color: "#22c55e", letterSpacing: "0.05em" }}>АНАЛІЗ ЗАВЕРШЕНО</span>
        </div>
        <span style={{ fontSize: 10, color: "#cbd5e1", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
        <button style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <User size={14} color="#cbd5e1" />
        </button>
      </div>
    </nav>
  );
}
