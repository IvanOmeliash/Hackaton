import { useState, useEffect, useRef, useCallback } from "react";
import {
  User, ChevronLeft, Route, Zap, ArrowUp, Clock,
  Activity, AlertTriangle, CheckCircle, Box, TrendingUp, RotateCcw,
  MessageSquare, Download, Play, Pause, Loader,
} from "lucide-react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

// ─── Speed / Acceleration helpers ─────────────────────────────────────────────
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

// ─── 3D Trajectory (Plotly) ───────────────────────────────────────────────────
const SPEED_CS = [
  [0.0, "#1e40af"], [0.15, "#2563eb"], [0.3, "#0ea5e9"],
  [0.45, "#06b6d4"], [0.55, "#10b981"], [0.65, "#f59e0b"],
  [0.8, "#ef4444"],  [1.0, "#dc2626"],
];

const MONO = "'DM Mono', 'Fira Mono', monospace";

function Flight3D({ trajectory, plotlyReady, playbackIndex }) {
  const divRef = useRef();
  const hasPlotted = useRef(false);

  // Initial full render
  useEffect(() => {
    if (!trajectory || !plotlyReady || !window.Plotly) return;
    const { time, x_east, y_north, z_up } = trajectory;
    const speeds = computeSpeeds(trajectory);
    const maxSp = Math.max(...speeds, 1);
    const MF = "DM Mono, monospace";

    const tipText = time.map((t, i) =>
      `<b>t:</b> ${t}s<br><b>E:</b> ${x_east[i].toFixed(1)}m &nbsp;<b>N:</b> ${y_north[i].toFixed(1)}m<br><b>Alt:</b> ${z_up[i].toFixed(1)}m<br><b>Speed:</b> ${speeds[i].toFixed(2)} m/s`
    );

    const axBase = {
      gridcolor: "rgba(255,255,255,0.05)",
      zerolinecolor: "rgba(255,255,255,0.1)",
      tickfont: { color: "#334155", size: 9, family: MF },
      showbackground: true,
      backgroundcolor: "rgba(255,255,255,0.012)",
    };

    const pIdx = playbackIndex ?? x_east.length - 1;

    window.Plotly.react(divRef.current, [
      {
        type: "scatter3d", mode: "lines",
        x: x_east, y: y_north, z: z_up,
        text: tipText, hovertemplate: "%{text}<extra></extra>",
        line: { color: speeds, colorscale: SPEED_CS, width: 5, cmin: 0, cmax: maxSp },
      },
      {
        type: "scatter3d", mode: "markers",
        x: x_east, y: y_north, z: z_up,
        text: tipText, hovertemplate: "%{text}<extra></extra>",
        marker: { size: 2.5, color: speeds, colorscale: SPEED_CS, cmin: 0, cmax: maxSp, opacity: 0.55 },
      },
      {
        type: "scatter3d", mode: "markers+text",
        x: [x_east[0]], y: [y_north[0]], z: [z_up[0]],
        text: ["▲ START"], textposition: "top center",
        textfont: { color: "#22c55e", size: 10, family: MF },
        marker: { size: 8, color: "#22c55e" },
        hovertemplate: "START · Alt: %{z:.1f}m<extra></extra>",
      },
      {
        type: "scatter3d", mode: "markers+text",
        x: [x_east.at(-1)], y: [y_north.at(-1)], z: [z_up.at(-1)],
        text: ["▼ END"], textposition: "top center",
        textfont: { color: "#f87171", size: 10, family: MF },
        marker: { size: 8, color: "#f87171" },
        hovertemplate: "END · Alt: %{z:.1f}m<extra></extra>",
      },
      // Playback marker (trace index 4)
      {
        type: "scatter3d", mode: "markers",
        x: [x_east[pIdx]], y: [y_north[pIdx]], z: [z_up[pIdx]],
        marker: { size: 10, color: "#facc15", symbol: "circle", opacity: 1, line: { color: "#fff", width: 1.5 } },
        hovertemplate: `Playback · t:${time[pIdx]}s · Alt:${z_up[pIdx].toFixed(1)}m<extra></extra>`,
      },
    ], {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      margin: { l: 0, r: 20, t: 0, b: 0 },
      showlegend: false,
      scene: {
        bgcolor: "rgba(0,0,0,0)",
        xaxis: { ...axBase, title: { text: "East (m)", font: { color: "#475569", size: 10, family: MF } } },
        yaxis: { ...axBase, title: { text: "North (m)", font: { color: "#475569", size: 10, family: MF } } },
        zaxis: { ...axBase, title: { text: "Alt (m)", font: { color: "#475569", size: 10, family: MF } }, backgroundcolor: "rgba(10,15,26,0.45)" },
        camera: { eye: { x: 1.5, y: -1.5, z: 0.85 }, up: { x: 0, y: 0, z: 1 } },
        aspectmode: "data",
      },
      coloraxis: {
        colorscale: SPEED_CS, cmin: 0, cmax: maxSp,
        colorbar: {
          title: { text: "Speed (m/s)", font: { color: "#475569", size: 9, family: MF }, side: "right" },
          tickfont: { color: "#475569", size: 8, family: MF },
          len: 0.55, thickness: 8,
          bgcolor: "rgba(0,0,0,0)", bordercolor: "rgba(255,255,255,0.06)", x: 1.0,
        },
      },
    }, { displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ["toImage", "sendDataToCloud"], responsive: true });

    hasPlotted.current = true;
  }, [trajectory, plotlyReady]);

  // Lightweight update: only move playback marker
  useEffect(() => {
    if (!hasPlotted.current || !window.Plotly || !trajectory || playbackIndex == null) return;
    const { time, x_east, y_north, z_up } = trajectory;
    const i = playbackIndex;
    window.Plotly.restyle(divRef.current, {
      x: [[x_east[i]]],
      y: [[y_north[i]]],
      z: [[z_up[i]]],
    }, [4]);
  }, [playbackIndex, trajectory]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {!plotlyReady && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#334155", fontSize: 11, fontFamily: MONO }}>
          <RotateCcw size={13} style={{ animation: "spin 1s linear infinite" }} />
          Завантаження 3D рушія…
        </div>
      )}
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ─── Mock response ────────────────────────────────────────────────────────────
function generateMockResponse() {
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
  return {
    status: "success",
    data: {
      metrics: {
        flight_duration_sec: time[N - 1],
        total_distance_m: parseFloat(x.toFixed(2)),
        max_altitude_m: parseFloat(Math.max(...z_up).toFixed(2)),
        max_horizontal_speed_m_s: parseFloat(Math.max(...speeds).toFixed(2)),
        max_vertical_speed_m_s: 3.4,
        max_acceleration_m_s2: 4.7,
      },
      trajectory: traj,
    },
  };
}

// ─── UI primitives ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, unit, color, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${color}09` : "rgba(255,255,255,0.025)",
        border: `1px solid ${hov ? color + "42" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12, padding: "15px 17px", position: "relative", overflow: "hidden",
        transition: "all 0.28s ease",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(10px)",
        boxShadow: hov ? `0 0 22px ${color}18` : "none",
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 64, height: 64, background: `radial-gradient(circle at top right, ${color}14, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{ width: 27, height: 27, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={12} color={color} strokeWidth={2} />
        </div>
        <span style={{ fontFamily: MONO, fontSize: 9, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: 25, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.03em" }}>{value}</span>
        {unit && <span style={{ fontFamily: MONO, fontSize: 11, color, opacity: 0.85 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, color = "#60a5fa", children, style = {} }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Icon size={12} color={color} />
        <span style={{ fontFamily: MONO, fontSize: 9, color: "#475569", letterSpacing: "0.09em", textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,15,26,0.97)", border: "1px solid rgba(96,165,250,0.18)", borderRadius: 8, padding: "7px 11px", fontFamily: MONO, fontSize: 10, color: "#64748b" }}>
      <div style={{ color: "#60a5fa", marginBottom: 3 }}>t = {label}s</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <b style={{ color: "#e2e8f0" }}>{p.value}</b></div>
      ))}
    </div>
  );
};

function SectionLabel({ text, gradient }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
      <div style={{ width: 3, height: 13, background: gradient, borderRadius: 2 }} />
      <span style={{ fontSize: 9, color: "#334155", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: MONO }}>{text}</span>
    </div>
  );
}

// ─── AI Assistant Panel ───────────────────────────────────────────────────────
function AIAssistantPanel({ metrics, trajectory }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);

  const generateReport = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setReport("");

    // Detect anomalies locally to feed into the prompt
    const speeds = computeSpeeds(trajectory);
    const accels = computeAccels(trajectory);
    const maxSpeed = Math.max(...speeds);
    const maxAccel = Math.max(...accels.map(Math.abs));
    const altitudes = trajectory.z_up;

    // Detect sharp altitude drops (>5m in one step)
    const altDrops = [];
    for (let i = 1; i < altitudes.length; i++) {
      const drop = altitudes[i - 1] - altitudes[i];
      if (drop > 5) altDrops.push({ t: trajectory.time[i], drop: drop.toFixed(1) });
    }

    const promptData = {
      flight_duration_sec: metrics.flight_duration_sec,
      total_distance_m: metrics.total_distance_m,
      max_altitude_m: metrics.max_altitude_m,
      max_horizontal_speed_m_s: metrics.max_horizontal_speed_m_s,
      max_vertical_speed_m_s: metrics.max_vertical_speed_m_s,
      max_acceleration_m_s2: metrics.max_acceleration_m_s2,
      computed_max_speed_m_s: maxSpeed.toFixed(2),
      computed_max_accel_m_s2: maxAccel.toFixed(2),
      sharp_altitude_drops: altDrops.slice(0, 5),
    };

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `Ти — бортовий аналітик польотних даних дрона. Твоя задача: на основі метрик польоту скласти стислий технічний звіт українською мовою. 

Структура відповіді:
1. **Загальна оцінка польоту** (1-2 речення)
2. **Виявлені аномалії** (якщо є — перерахуй з часовими мітками та описом; якщо нема — вкажи "Аномалій не виявлено")
3. **Ризики та попередження** (якщо перевищення швидкості >15 м/с — WARNING; різке прискорення >5 м/с² — WARNING; різке падіння висоти — CRITICAL)
4. **Рекомендації** (1-3 пункти)

Будь конкретним, технічним та лаконічним. Використовуй технічну термінологію. Відповідь має бути у вигляді простого тексту з мінімальною розміткою.`,
          messages: [
            {
              role: "user",
              content: `Проаналізуй наступні дані польоту дрона та склади звіт:\n\n${JSON.stringify(promptData, null, 2)}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      if (!text) throw new Error("Порожня відповідь від API");
      setReport(text);
      setGenerated(true);
    } catch (err) {
      setError("Не вдалося отримати звіт. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  }, [metrics, trajectory, loading]);

  // Format report text with basic markdown-like styling
  const renderReport = (text) => {
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
      const isBold = line.startsWith("**") || /^\d+\./.test(line);
      const isWarning = line.includes("WARNING") || line.includes("ПОПЕРЕДЖЕННЯ");
      const isCritical = line.includes("CRITICAL") || line.includes("КРИТИЧНО");
      const cleaned = line.replace(/\*\*/g, "");
      return (
        <div key={i} style={{
          fontFamily: MONO, fontSize: 11, lineHeight: 1.7,
          color: isCritical ? "#f87171" : isWarning ? "#fbbf24" : isBold ? "#94a3b8" : "#64748b",
          fontWeight: (isBold || isWarning || isCritical) ? 500 : 400,
          paddingLeft: line.startsWith("  ") || line.startsWith("- ") ? 12 : 0,
        }}>
          {cleaned}
        </div>
      );
    });
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.018)",
      border: "1px solid rgba(96,165,250,0.15)",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(96,165,250,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquare size={12} color="#60a5fa" />
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#475569", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            AI Аналітик · Звіт про політ
          </span>
          {generated && (
            <span style={{
              fontSize: 8, fontFamily: MONO, color: "#22c55e",
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
            }}>ГОТОВО</span>
          )}
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: loading ? "rgba(96,165,250,0.06)" : "rgba(96,165,250,0.12)",
            border: "1px solid rgba(96,165,250,0.25)",
            borderRadius: 7, padding: "5px 12px", cursor: loading ? "not-allowed" : "pointer",
            fontFamily: MONO, fontSize: 10, color: "#60a5fa",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? <><Loader size={10} style={{ animation: "spin 1s linear infinite" }} /> Генерую…</>
            : generated ? <><RotateCcw size={10} /> Оновити</>
            : <><Zap size={10} /> Згенерувати звіт</>
          }
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", minHeight: 80 }}>
        {!generated && !loading && !error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontFamily: MONO, fontSize: 11 }}>
            <MessageSquare size={14} color="#1e3a5f" />
            <span>Натисніть «Згенерувати звіт» для AI-аналізу польоту</span>
          </div>
        )}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[100, 80, 90, 60].map((w, i) => (
              <div key={i} style={{
                height: 10, width: `${w}%`, borderRadius: 5,
                background: "rgba(96,165,250,0.08)",
                animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171", fontFamily: MONO, fontSize: 11 }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}
        {report && !loading && (
          <div style={{ display: "flex", gap: 12 }}>
            {/* Avatar */}
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #1e3a5f, #0c4a6e)",
              border: "1px solid rgba(96,165,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}>
              <MessageSquare size={12} color="#38bdf8" />
            </div>
            {/* Bubble */}
            <div style={{
              flex: 1,
              background: "rgba(10,20,40,0.6)",
              border: "1px solid rgba(96,165,250,0.12)",
              borderRadius: "4px 12px 12px 12px",
              padding: "12px 14px",
            }}>
              {renderReport(report)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Playback Slider ──────────────────────────────────────────────────────────
function PlaybackSlider({ trajectory, onIndexChange }) {
  const n = trajectory.time.length;
  const [idx, setIdx] = useState(n - 1);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);
  const speeds = computeSpeeds(trajectory);
  const currentSpeed = speeds[idx]?.toFixed(2) ?? "0.00";

  const handleChange = (e) => {
    const val = parseInt(e.target.value);
    setIdx(val);
    onIndexChange(val);
  };

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIdx((prev) => {
          const next = prev >= n - 1 ? 0 : prev + 1;
          onIndexChange(next);
          if (next >= n - 1) setPlaying(false);
          return next;
        });
      }, 60);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, n, onIndexChange]);

  const pct = ((idx / (n - 1)) * 100).toFixed(1);

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.055)",
      borderRadius: 12, padding: "10px 16px",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Play / Pause */}
          <button
            onClick={() => setPlaying((p) => !p)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: playing ? "rgba(250,204,21,0.15)" : "rgba(96,165,250,0.12)",
              border: `1px solid ${playing ? "rgba(250,204,21,0.3)" : "rgba(96,165,250,0.25)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {playing
              ? <Pause size={11} color="#facc15" />
              : <Play size={11} color="#60a5fa" />
            }
          </button>
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#334155", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Playback
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#475569" }}>
            t: <span style={{ color: "#94a3b8" }}>{trajectory.time[idx]}s</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#475569" }}>
            alt: <span style={{ color: "#a78bfa" }}>{trajectory.z_up[idx].toFixed(1)}m</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#475569" }}>
            spd: <span style={{ color: "#f59e0b" }}>{currentSpeed} m/s</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#475569" }}>
            <span style={{ color: "#64748b" }}>{pct}%</span>
          </span>
        </div>
      </div>

      {/* Track */}
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* Progress fill */}
        <div style={{
          position: "absolute", left: 0, height: 4, borderRadius: 2,
          width: `${pct}%`,
          background: "linear-gradient(90deg, #1e40af, #0ea5e9, #10b981, #f59e0b, #ef4444)",
          pointerEvents: "none", zIndex: 1,
        }} />
        <input
          type="range" min={0} max={n - 1} step={1} value={idx}
          onChange={handleChange}
          style={{
            width: "100%", position: "relative", zIndex: 2,
            appearance: "none", WebkitAppearance: "none",
            background: "transparent", cursor: "pointer", margin: 0,
          }}
        />
      </div>

      <style>{`
        input[type=range]::-webkit-slider-runnable-track {
          height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #facc15; border: 2px solid #fff; margin-top: -5px;
          box-shadow: 0 0 8px rgba(250,204,21,0.5);
        }
        input[type=range]::-moz-range-track {
          height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px;
        }
        input[type=range]::-moz-range-thumb {
          width: 14px; height: 14px; border-radius: 50%;
          background: #facc15; border: 2px solid #fff;
        }
      `}</style>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportToPDF(fileName, metrics, trajectory) {
  // Load html2canvas + jsPDF from CDN
  const loadScript = (src) =>
    new Promise((res) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      document.head.appendChild(s);
    });

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, M = 14;
  let y = 18;

  // ── Header
  doc.setFillColor(10, 15, 26);
  doc.rect(0, 0, W, 28, "F");
  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.setTextColor(241, 245, 249);
  doc.text("DroneLog Analyzer", M, 12);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Звіт польоту · ${fileName}`, M, 20);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(new Date().toLocaleString("uk-UA"), W - M, 20, { align: "right" });
  y = 36;

  // ── Section helper
  const section = (title) => {
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.line(M + doc.getTextWidth(title.toUpperCase()) + 3, y - 0.5, W - M, y - 0.5);
    y += 6;
  };

  const metric = (label, value, unit = "") => {
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, M + 4, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(226, 232, 240);
    doc.text(`${value} ${unit}`.trim(), W - M, y, { align: "right" });
    y += 5.5;
  };

  // ── Metrics
  section("Ключові показники польоту");
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  metric("Тривалість польоту", fmtDur(metrics.flight_duration_sec), "хв:с");
  metric("Загальна дистанція", metrics.total_distance_m.toFixed(1), "м");
  metric("Максимальна висота", metrics.max_altitude_m, "м");
  metric("Макс. горизонтальна швидкість", metrics.max_horizontal_speed_m_s, "м/с");
  metric("Макс. вертикальна швидкість", metrics.max_vertical_speed_m_s, "м/с");
  metric("Макс. прискорення", metrics.max_acceleration_m_s2, "м/с²");
  y += 4;

  // ── Anomaly detection
  section("Виявлені аномалії");
  const speeds = computeSpeeds(trajectory);
  const accels = computeAccels(trajectory);
  let anomalyCount = 0;

  // Speed spikes
  speeds.forEach((sp, i) => {
    if (sp > 15) {
      doc.setFont("courier", "normal"); doc.setFontSize(9);
      doc.setTextColor(251, 191, 36);
      doc.text(`⚠ WARNING  t=${trajectory.time[i]}s  Швидкість перевищує норму: ${sp.toFixed(1)} м/с`, M + 4, y);
      y += 5; anomalyCount++;
    }
  });

  // Accel spikes
  accels.forEach((ac, i) => {
    if (Math.abs(ac) > 5) {
      doc.setFont("courier", "normal"); doc.setFontSize(9);
      doc.setTextColor(251, 191, 36);
      doc.text(`⚠ WARNING  t=${trajectory.time[i]}s  Різке прискорення: ${ac.toFixed(1)} м/с²`, M + 4, y);
      y += 5; anomalyCount++;
    }
  });

  // Altitude drops
  for (let i = 1; i < trajectory.z_up.length; i++) {
    const drop = trajectory.z_up[i - 1] - trajectory.z_up[i];
    if (drop > 8) {
      doc.setFont("courier", "normal"); doc.setFontSize(9);
      doc.setTextColor(248, 113, 113);
      doc.text(`✖ CRITICAL  t=${trajectory.time[i]}s  Різка втрата висоти: -${drop.toFixed(1)} м`, M + 4, y);
      y += 5; anomalyCount++;
    }
  }

  if (anomalyCount === 0) {
    doc.setFont("courier", "normal"); doc.setFontSize(9);
    doc.setTextColor(34, 197, 94);
    doc.text("✓ Аномалій не виявлено", M + 4, y);
    y += 5;
  }

  y += 4;

  // ── Trajectory summary table
  section("Вибірка траєкторії (кожна 10-а точка)");
  const cols = ["t (с)", "East (м)", "North (м)", "Alt (м)", "Sp (м/с)"];
  const colW = [22, 35, 35, 30, 28];
  let cx = M + 4;
  doc.setFont("courier", "bold"); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
  cols.forEach((c, i) => { doc.text(c, cx, y); cx += colW[i]; });
  y += 4;
  doc.setDrawColor(30, 41, 59); doc.setLineWidth(0.2);
  doc.line(M + 4, y - 1, W - M, y - 1);

  doc.setFont("courier", "normal"); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
  const step = Math.max(1, Math.floor(trajectory.time.length / 20));
  for (let i = 0; i < trajectory.time.length; i += step) {
    if (y > 270) { doc.addPage(); y = 20; }
    cx = M + 4;
    const row = [
      trajectory.time[i].toFixed(1),
      trajectory.x_east[i].toFixed(1),
      trajectory.y_north[i].toFixed(1),
      trajectory.z_up[i].toFixed(1),
      speeds[i].toFixed(2),
    ];
    row.forEach((val, ci) => { doc.text(val, cx, y); cx += colW[ci]; });
    y += 4.5;
  }

  // ── Footer
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("courier", "normal"); doc.setFontSize(7); doc.setTextColor(30, 41, 59);
    doc.text(`DRONELOG ANALYZER · ENU COORDINATE SYSTEM · Стор. ${p}/${pages}`, M, 290);
  }

  doc.save(`dronelog_report_${fileName.replace(/\.[^.]+$/, "")}.pdf`);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FlightDashboard({ fileName = "mission_042.BIN", apiResponse = null, onBack }) {
  const [plotlyReady, setPlotlyReady] = useState(!!window.Plotly);
  const [playbackIndex, setPlaybackIndex] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  useEffect(() => {
    if (window.Plotly) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/plotly.min.js";
    s.onload = () => setPlotlyReady(true);
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch (_) {} };
  }, []);

  const response = apiResponse || generateMockResponse();
  const { metrics, trajectory } = response.data;

  const step = Math.max(1, Math.floor(trajectory.time.length / 100));
  const accels = computeAccels(trajectory);
  const chartData = trajectory.time
    .filter((_, i) => i % step === 0)
    .map((t, idx) => {
      const i = idx * step;
      return {
        t,
        alt: parseFloat(trajectory.z_up[i].toFixed(1)),
        accel: parseFloat(accels[i].toFixed(3)),
      };
    });

  const maxAccelAbs = Math.max(...chartData.map((d) => Math.abs(d.accel)));
  const speeds = computeSpeeds(trajectory);
  const maxSp = Math.max(...speeds, 0);

  const fmtDist = (m) => m >= 1000 ? [(m / 1000).toFixed(2), "km"] : [m.toFixed(0), "m"];
  const [dv, du] = fmtDist(metrics.total_distance_m);
  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

  const handleExportPDF = async () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    try {
      await exportToPDF(fileName, metrics, trajectory);
    } catch (e) {
      console.error("PDF export error:", e);
    }
    setPdfExporting(false);
  };

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
          {onBack && (
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5,
              color: "#64748b", cursor: "pointer", fontSize: 11, fontFamily: MONO,
            }}>
              <ChevronLeft size={13} /> Назад
            </button>
          )}
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#f1f5f9" }}>Drone</span>
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Log</span>
            <span style={{ color: "#334155", fontWeight: 400 }}> Analyzer</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF}
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
          <span style={{ fontSize: 10, color: "#1e293b", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName}</span>
          <button style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <User size={14} color="#64748b" />
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        <SectionLabel text="Ключові показники польоту" gradient="linear-gradient(180deg,#3b82f6,#0ea5e9)" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
          <StatCard icon={Route}      label="Дистанція"         value={dv}                                  unit={du}    color="#38bdf8" delay={0}   />
          <StatCard icon={Clock}      label="Тривалість"         value={fmtDur(metrics.flight_duration_sec)} unit="хв:с"  color="#34d399" delay={55}  />
          <StatCard icon={ArrowUp}    label="Макс. висота"       value={metrics.max_altitude_m}              unit="м"     color="#a78bfa" delay={110} />
          <StatCard icon={Zap}        label="Гориз. швидкість"   value={metrics.max_horizontal_speed_m_s}    unit="м/с"   color="#f59e0b" delay={165} />
          <StatCard icon={Activity}   label="Верт. швидкість"    value={metrics.max_vertical_speed_m_s}      unit="м/с"   color="#fb923c" delay={220} />
          <StatCard icon={TrendingUp} label="Макс. прискор."     value={metrics.max_acceleration_m_s2}       unit="м/с²"  color="#f472b6" delay={275} />
        </div>

        {/* AI Assistant */}
        <SectionLabel text="AI Аналітик · Автоматичний звіт" gradient="linear-gradient(180deg,#60a5fa,#818cf8)" />
        <AIAssistantPanel metrics={metrics} trajectory={trajectory} />

        {/* 3D panel */}
        <SectionLabel text="3D-Траєкторія · ENU · Колір = Швидкість" gradient="linear-gradient(180deg,#38bdf8,#06b6d4)" />
        <Panel title="3D Траєкторія польоту · ENU (метри від точки старту)" icon={Box} color="#38bdf8" style={{ height: 430 }}>
          <Flight3D trajectory={trajectory} plotlyReady={plotlyReady} playbackIndex={playbackIndex} />
        </Panel>

        {/* Playback Slider */}
        <PlaybackSlider
          trajectory={trajectory}
          onIndexChange={setPlaybackIndex}
        />

        {/* Colorscale legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, color: "#334155", letterSpacing: "0.06em" }}>ШВИДКІСТЬ:</span>
          <div style={{ height: 5, flex: 1, maxWidth: 220, borderRadius: 3, background: "linear-gradient(90deg,#1e40af,#0ea5e9,#10b981,#f59e0b,#ef4444)" }} />
          <span style={{ fontSize: 9, color: "#475569" }}>0 → {maxSp.toFixed(1)} м/с</span>
        </div>

        {/* Telemetry charts */}
        <SectionLabel text="Телеметрія · 2D графіки" gradient="linear-gradient(180deg,#a78bfa,#6366f1)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Panel title="Висота відносно часу (Altitude vs Time)" icon={ArrowUp} color="#a78bfa">
            <div style={{ height: 210, padding: "12px 8px 4px 0" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 14, bottom: 10, left: 0 }}>
                  <defs>
                    <linearGradient id="gAlt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#334155", fontFamily: MONO }} tickLine={false} axisLine={false}
                    label={{ value: "час (с)", position: "insideBottom", offset: -4, fontSize: 9, fill: "#334155", fontFamily: MONO }} />
                  <YAxis tick={{ fontSize: 9, fill: "#334155", fontFamily: MONO }} tickLine={false} axisLine={false} width={34} unit=" м" />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="alt" name="Висота" stroke="#a78bfa" strokeWidth={1.8} fill="url(#gAlt)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Прискорення відносно часу (Acceleration vs Time)" icon={TrendingUp} color="#f472b6">
            <div style={{ height: 210, padding: "12px 8px 4px 0" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 14, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#334155", fontFamily: MONO }} tickLine={false} axisLine={false}
                    label={{ value: "час (с)", position: "insideBottom", offset: -4, fontSize: 9, fill: "#334155", fontFamily: MONO }} />
                  <YAxis tick={{ fontSize: 9, fill: "#334155", fontFamily: MONO }} tickLine={false} axisLine={false} width={36} unit=" м/с²" />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 3" />
                  {maxAccelAbs > 3 && <>
                    <ReferenceLine y={3}  stroke="rgba(239,68,68,0.28)" strokeDasharray="4 3"
                      label={{ value: "⚠", position: "right", fontSize: 10, fill: "#ef4444", fontFamily: MONO }} />
                    <ReferenceLine y={-3} stroke="rgba(239,68,68,0.28)" strokeDasharray="4 3" />
                  </>}
                  <Line type="monotone" dataKey="accel" name="Прискорення" stroke="#f472b6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontSize: 9, color: "#1e293b", letterSpacing: "0.05em" }}>DRONELOG ANALYZER · ENU COORDINATE SYSTEM · v2.1</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={10} color="#f59e0b" />
            <span style={{ fontSize: 9, color: "#1e293b" }}>Demo · дані згенеровані локально</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}