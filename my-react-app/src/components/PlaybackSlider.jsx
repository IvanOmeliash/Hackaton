import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { computeSpeeds } from '../utils/mathUtils';
import { MONO } from '../utils/constants';

export default function PlaybackSlider({ trajectory, onIndexChange }) {
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
          <span style={{ fontFamily: MONO, fontSize: 9, color: "#cbd5e1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Playback
          </span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#cbd5e1" }}>
            t: <span style={{ color: "#94a3b8" }}>{trajectory.time[idx]}s</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#cbd5e1" }}>
            alt: <span style={{ color: "#a78bfa" }}>{trajectory.z_up[idx].toFixed(1)}m</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#cbd5e1" }}>
            spd: <span style={{ color: "#f59e0b" }}>{currentSpeed} m/s</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: "#cbd5e1" }}>
            <span style={{ color: "#94a3b8" }}>{pct}%</span>
          </span>
        </div>
      </div>

      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
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
