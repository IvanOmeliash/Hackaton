import { useState, useEffect } from "react";
import {
  LogOut, ChevronLeft, Route, Clock, ArrowUp, ChevronRight,
  FileText, AlertCircle, User, Zap, Calendar, Loader,
} from "lucide-react";
import { MONO } from '../utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("jwt_token")}` };
}

function toApiResponse(detail) {
  return {
    status: "success",
    data: {
      metrics: detail.metrics,       // MetricsDto — assumed same field names
      trajectory: detail.trajectory, // TrajectoryDto — assumed { time, x_east, y_north, z_up }
      aiSummary: detail.aiSummary,   // forwarded so AIAssistantPanel can show it directly
    },
  };
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchMyLogs() {
  const res = await fetch("http://localhost:8080//api/flights", {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json(); // List<FlightSummaryResponse>
}

async function fetchLogById(id) {
  const res = await fetch(`http://localhost:8080//api/flights/${id}`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => `Error ${res.status}`);
    throw new Error(msg);
  }
  return res.json(); // FlightDetailResponse
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  warning:  { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.22)", label: "WARNING"  },
  error:    { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.22)", label: "ERROR"   },
  ok:       { color: "#34d399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.22)",  label: "OK"      },
};
function statusStyle(status) {
  return STATUS_MAP[status?.toLowerCase()] ?? STATUS_MAP.ok;
}

// ─── LogCard ──────────────────────────────────────────────────────────────────
function LogCard({ log, onOpen, index, loading }) {
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), 60 + index * 55);
    return () => clearTimeout(t);
  }, [index]);

  const st = statusStyle(log.status);

  return (
    <div
      onClick={() => !loading && onOpen(log.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? "rgba(96,165,250,0.3)" : st.border}`,
        borderRadius: 12, padding: "14px 18px",
        cursor: loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 14,
        transition: "all 0.22s ease",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(10px)",
        boxShadow: hov ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
      }}
    >
      {/* Icon */}
      <div style={{
        flexShrink: 0, width: 38, height: 38, borderRadius: 10,
        background: st.bg, border: `1px solid ${st.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FileText size={16} color={st.color} strokeWidth={1.5} />
      </div>

      {/* Name + date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "#e2e8f0",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {log.originalFilename}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: "#334155", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}>
          <Calendar size={9} color="#1e3a5f" />
          {fmtDate(log.uploadedAt)}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        fontFamily: MONO, fontSize: 9, letterSpacing: "0.07em",
        color: st.color, background: st.bg,
        border: `1px solid ${st.border}`,
        borderRadius: 6, padding: "3px 8px", flexShrink: 0,
      }}>
        {st.label}
      </div>

      {/* Arrow / spinner */}
      <div style={{ flexShrink: 0, width: 18, display: "flex", justifyContent: "center" }}>
        {loading
          ? <Loader size={13} color="#60a5fa" style={{ animation: "spin 1s linear infinite" }} />
          : <ChevronRight size={14} color={hov ? "#60a5fa" : "#1e293b"} style={{ transition: "color 0.2s, transform 0.2s", transform: hov ? "translateX(2px)" : "none" }} />
        }
      </div>
    </div>
  );
}

// ─── AccountPage ──────────────────────────────────────────────────────────────
// Props:
//   onBack()
//   onLogout()
//   onOpenDashboard(fileName, apiResponse)  ← called after detail fetch succeeds
export default function AccountPage({ onBack, onLogout, onOpenDashboard }) {
  const [logs, setLogs]             = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError]   = useState(null);
  const [openingId, setOpeningId]   = useState(null); // id of card being fetched
  const [detailError, setDetailError] = useState(null);
  const [mounted, setMounted]       = useState(false);

  const userEmail = (() => {
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.email ?? payload.sub ?? null;
    } catch { return null; }
  })();

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
    fetchMyLogs()
      .then(setLogs)
      .catch((e) => setListError(e.message))
      .finally(() => setListLoading(false));
  }, []);

  const handleOpenLog = async (id) => {
    setOpeningId(id);
    setDetailError(null);
    try {
      const detail = await fetchLogById(id);
      onOpenDashboard(detail.originalFilename, toApiResponse(detail));
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setOpeningId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    onLogout?.();
  };

  const warningCount = logs.filter(l => l.status?.toLowerCase() === "warning").length;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f1a",
      backgroundImage: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(29,58,138,0.22) 0%, transparent 55%)",
      color: "#f1f5f9", fontFamily: MONO, display: "flex", flexDirection: "column",
    }}>

      {/* Navbar */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,0.045)",
        background: "rgba(10,15,26,0.88)", backdropFilter: "blur(14px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
            color: "#cbd5e1", cursor: "pointer", fontSize: 11, fontFamily: MONO,
          }}>
            <ChevronLeft size={13} /> Назад
          </button>
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#f1f5f9" }}>Drone</span>
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Log</span>
            <span style={{ color: "#cbd5e1", fontWeight: 400 }}> Analyzer</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)",
            borderRadius: 8, padding: "6px 13px", cursor: "pointer",
            fontFamily: MONO, fontSize: 10, color: "#f87171", transition: "background 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.14)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.07)"}
        >
          <LogOut size={12} /> Вийти
        </button>
      </nav>

      {/* Body */}
      <div style={{
        flex: 1, maxWidth: 860, width: "100%", margin: "0 auto", padding: "28px 24px",
        opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "18px 22px", marginBottom: 28,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, flexShrink: 0,
            background: "linear-gradient(135deg, #1e3a5f, #0c4a6e)",
            border: "1px solid rgba(96,165,250,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={22} color="#38bdf8" strokeWidth={1.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>
              {userEmail ?? "Пілот"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontFamily: MONO, fontSize: 10, color: "#22c55e", letterSpacing: "0.05em" }}>АВТОРИЗОВАНИЙ</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 28, flexShrink: 0 }}>
            {[
              { label: "Польотів",     val: listLoading ? "…" : logs.length,    color: "#f1f5f9" },
              { label: "Попереджень",  val: listLoading ? "…" : warningCount,   color: warningCount > 0 ? "#fbbf24" : "#f1f5f9" },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color, letterSpacing: "-0.03em" }}>{val}</div>
                <div style={{ fontFamily: MONO, fontSize: 9, color: "#334155", letterSpacing: "0.07em", marginTop: 2 }}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 3, height: 13, background: "linear-gradient(180deg,#60a5fa,#38bdf8)", borderRadius: 2 }} />
          <span style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Історія аналізів · {listLoading ? "…" : `${logs.length} записів`}
          </span>
        </div>

        {/* Detail fetch error */}
        {detailError && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)",
            borderRadius: 10, padding: "10px 14px", marginBottom: 12,
            fontFamily: MONO, fontSize: 11, color: "#f87171",
          }}>
            <AlertCircle size={13} /> {detailError}
          </div>
        )}

        {/* List */}
        {listLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 70, borderRadius: 12,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : listError ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)",
            borderRadius: 12, padding: "14px 18px",
            fontFamily: MONO, fontSize: 11, color: "#f87171",
          }}>
            <AlertCircle size={14} /> {listError}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#1e293b" }}>
            <FileText size={36} color="#1e3a5f" strokeWidth={1} style={{ marginBottom: 14 }} />
            <p style={{ fontFamily: MONO, fontSize: 12, color: "#334155" }}>Немає записів польотів</p>
            <p style={{ fontFamily: MONO, fontSize: 10, color: "#1e293b", marginTop: 6 }}>
              Завантажте перший лог-файл для аналізу
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log, i) => (
              <LogCard
                key={log.id}
                log={log}
                index={i}
                loading={openingId === log.id}
                onOpen={handleOpenLog}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:.75; } }
      `}</style>
    </div>
  );
}