import { useState, useCallback } from 'react';
import { MessageSquare, Loader, RotateCcw, Zap, AlertTriangle } from 'lucide-react';
import { computeSpeeds, computeAccels } from '../utils/mathUtils';
import { MONO } from '../utils/constants';

export default function AIAssistantPanel({ metrics, trajectory }) {
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);

  const generateReport = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setReport("");

    const speeds = computeSpeeds(trajectory);
    const accels = computeAccels(trajectory);
    const maxSpeed = Math.max(...speeds);
    const maxAccel = Math.max(...accels.map(Math.abs));
    const altitudes = trajectory.z_up;

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

    // TODO: change to Gemini api
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
    } catch {
      setError("Не вдалося отримати звіт. Перевірте підключення.");
    } finally {
      setLoading(false);
    }
  }, [metrics, trajectory, loading]);

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
          color: isCritical ? "#f87171" : isWarning ? "#fbbf24" : isBold ? "#94a3b8" : "#cbd5e1",
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
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(96,165,250,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MessageSquare size={12} color="#60a5fa" />
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#cbd5e1", letterSpacing: "0.09em", textTransform: "uppercase" }}>
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

      <div style={{ padding: "14px 16px", minHeight: 80 }}>
        {!generated && !loading && !error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#cbd5e1", fontFamily: MONO, fontSize: 11 }}>
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
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #1e3a5f, #0c4a6e)",
              border: "1px solid rgba(96,165,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginTop: 2,
            }}>
              <MessageSquare size={12} color="#38bdf8" />
            </div>
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
