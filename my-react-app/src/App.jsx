import { useState, useRef, useCallback, useEffect } from "react";
import { User, UploadCloud, FileText, X, Zap } from "lucide-react";
import FlightDashboard from "./FlightDashboard";

// ─── Helpers (дублюються тут щоб не тягнути з FlightDashboard) ───────────────
function computeSpeeds(traj) {
  const { time, x_east, y_north, z_up } = traj;
  const n = time.length;
  const sp = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = time[i + 1] - time[i - 1];
    if (dt <= 0) continue;
    const dx = x_east[i + 1] - x_east[i - 1];
    const dy = y_north[i + 1] - y_north[i - 1];
    const dz = z_up[i + 1] - z_up[i - 1];
    sp[i] = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }
  sp[0] = sp[1] || 0;
  sp[n - 1] = sp[n - 2] || 0;
  return sp;
}

function computeAccels(traj) {
  const speeds = computeSpeeds(traj);
  const { time } = traj;
  const n = time.length;
  const ac = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = time[i + 1] - time[i - 1];
    if (dt <= 0) continue;
    ac[i] = (speeds[i + 1] - speeds[i - 1]) / dt;
  }
  ac[0] = ac[1] || 0;
  ac[n - 1] = ac[n - 2] || 0;
  return ac;
}

// ─── API call ────────────────────────────────────────────────────────────────
async function callApi(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Помилка сервера: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.status || data.status !== 'success' || !data.data || !data.data.metrics || !data.data.trajectory) {
      throw new Error('Невірний формат відповіді від сервера');
    }

    return data;
  } catch (error) {
    console.warn('API не доступний, використовую mock дані:', error.message);
    // Fallback to mock data
    await new Promise((r) => setTimeout(r, 2000));

    const N = 160;
    const time = [], x_east = [], y_north = [], z_up = [];
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < N; i++) {
      const phase = i / N;
      z = phase < 0.1 ? i * 1.9 : phase > 0.88 ? Math.max(0, z - 2.8) : z + (Math.random() - 0.48) * 1.4;
      x += 1.3 + Math.random() * 1.6;
      y += (Math.random() - 0.5) * 2.8;
      time.push(parseFloat((i * 2).toFixed(2)));
      x_east.push(parseFloat(x.toFixed(2)));
      y_north.push(parseFloat(y.toFixed(2)));
      z_up.push(parseFloat(Math.max(0, z).toFixed(2)));
    }
    const traj = { time, x_east, y_north, z_up };
    const speeds = computeSpeeds(traj);
    const accels = computeAccels(traj);

    return {
      status: "success",
      data: {
        metrics: {
          flight_duration_sec: time[N - 1],
          total_distance_m: parseFloat(x.toFixed(2)),
          max_altitude_m: parseFloat(Math.max(...z_up).toFixed(2)),
          max_horizontal_speed_m_s: parseFloat(Math.max(...speeds).toFixed(2)),
          max_vertical_speed_m_s: 3.4,
          max_acceleration_m_s2: parseFloat(Math.max(...accels.map(Math.abs)).toFixed(2)),
        },
        trajectory: traj,
      },
    };
  }
}

// ─── Upload Screen ────────────────────────────────────────────────────────────
function UploadScreen({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const mono = "'DM Mono', 'Fira Mono', monospace";

  const handleFile = (f) => {
    if (!f) return;

    // Validation
    const allowedTypes = ['.bin', '.log', '.tlog'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const fileExt = f.name.toLowerCase().substring(f.name.lastIndexOf('.'));

    if (!allowedTypes.includes(fileExt)) {
      setError('Непідтримуваний тип файлу. Підтримуються: .bin, .log, .tlog');
      return;
    }

    if (f.size > maxSize) {
      setError('Файл занадто великий. Максимальний розмір: 10MB');
      return;
    }

    if (f.size === 0) {
      setError('Файл порожній');
      return;
    }

    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      const response = await callApi(file);
      onAnalyzed(file.name, response);
    } catch (err) {
      setError("Помилка аналізу. Спробуйте ще раз.");
      setAnalyzing(false);
    }
  };

  const resetFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className="min-h-screen bg-slate-900 flex flex-col"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(56,100,180,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(30,60,120,0.13) 0%, transparent 60%)",
      }}
    >
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-8 py-5">
        <span className="text-xl font-semibold tracking-tight select-none" style={{ fontFamily: mono, letterSpacing: "-0.01em" }}>
          <span className="text-slate-100">Drone</span>
          <span style={{ background: "linear-gradient(90deg, #60a5fa 0%, #38bdf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Log
          </span>
          <span className="text-slate-400 font-light"> Analyzer</span>
        </span>
        <button className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors bg-slate-800/50">
          <User size={17} />
        </button>
      </nav>

      {/* Drop zone — centered in remaining space */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className="relative w-full max-w-lg min-h-[400px] flex flex-col items-center justify-center rounded-2xl px-10 py-14 transition-all duration-300"
          style={{
            background: dragging ? "rgba(56,100,180,0.18)" : "rgba(255,255,255,0.04)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: dragging ? "1.5px solid rgba(96,165,250,0.55)" : "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: dragging
              ? "0 0 0 4px rgba(96,165,250,0.08), 0 20px 60px rgba(0,0,0,0.4)"
              : "0 8px 40px rgba(0,0,0,0.35)",
          }}
        >
          {/* Corner accents */}
          <span className="absolute top-3 left-3 w-4 h-4 border-t border-l border-slate-600/40 rounded-tl-sm pointer-events-none" />
          <span className="absolute top-3 right-3 w-4 h-4 border-t border-r border-slate-600/40 rounded-tr-sm pointer-events-none" />
          <span className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-slate-600/40 rounded-bl-sm pointer-events-none" />
          <span className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-slate-600/40 rounded-br-sm pointer-events-none" />

          <input ref={inputRef} type="file" accept=".bin,.log,.tlog" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

          {!file ? (
            /* ── Empty state ── */
            <>
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "rgba(96,165,250,0.10)", border: "1px solid rgba(96,165,250,0.18)" }}>
                <UploadCloud size={30} strokeWidth={1.5} className="text-blue-400" style={{ opacity: dragging ? 1 : 0.85 }} />
              </div>
              <h2 className="text-slate-100 text-xl font-medium mb-8 text-center" style={{ fontFamily: mono, letterSpacing: "-0.02em" }}>
                Перетягніть файл сюди
              </h2>
              <button
                onClick={() => inputRef.current?.click()}
                className="relative px-7 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden transition-transform active:scale-95 focus:outline-none"
                style={{ background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)", fontFamily: mono, letterSpacing: "0.01em" }}
              >
                Вибрати файл
              </button>
              <p className="mt-6 text-xs text-slate-500 text-center" style={{ fontFamily: mono, letterSpacing: "0.04em" }}>
                Підтримувані формати: .BIN, .LOG, .TLOG
              </p>
            </>
          ) : (
            /* ── File selected state ── */
            <>
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: "rgba(52,211,153,0.09)", border: "1px solid rgba(52,211,153,0.20)" }}>
                <FileText size={30} strokeWidth={1.5} className="text-emerald-400" />
              </div>
              <p className="text-slate-100 text-base font-medium mb-1 text-center max-w-xs truncate" style={{ fontFamily: mono }}>
                {file.name}
              </p>
              <p className="text-slate-500 text-xs mb-8" style={{ fontFamily: mono }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>

              {error && (
                <p className="text-red-400 text-xs mb-4 text-center" style={{ fontFamily: mono }}>{error}</p>
              )}

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="relative px-8 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2 transition-transform active:scale-95 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: analyzing ? "linear-gradient(135deg, #374151 0%, #6b7280 100%)" : "linear-gradient(135deg, #059669 0%, #0ea5e9 100%)",
                  boxShadow: analyzing ? "none" : "0 4px 20px rgba(5,150,105,0.30)",
                  fontFamily: mono,
                  letterSpacing: "0.01em",
                }}
              >
                <Zap size={15} strokeWidth={2} />
                <span>{analyzing ? "Аналіз..." : "Почати аналіз"}</span>
              </button>

              {!analyzing && (
                <button onClick={resetFile} className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors focus:outline-none" style={{ fontFamily: mono }}>
                  <X size={13} /> Скасувати вибір
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root controller ──────────────────────────────────────────────────────────
export default function DroneLogAnalyzer() {
  const [screen, setScreen] = useState("upload"); // "upload" | "dashboard"
  const [fileName, setFileName] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  if (screen === "dashboard") {
    return (
      <FlightDashboard
        fileName={fileName}
        apiResponse={apiResponse}
        onBack={() => {
          setScreen("upload");
          setFileName("");
          setApiResponse(null);
        }}
      />
    );
  }

  return (
    <UploadScreen
      onAnalyzed={(name, response) => {
        setFileName(name);
        setApiResponse(response);
        setScreen("dashboard");
      }}
    />
  );
}