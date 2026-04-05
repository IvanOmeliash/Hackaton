import { useState, useEffect } from 'react';
import { MONO } from '../../utils/constants';

export default function StatCard({ icon: Icon, label, value, unit, color, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  
  useEffect(() => { 
    const t = setTimeout(() => setVis(true), delay); 
    return () => clearTimeout(t); 
  }, [delay]);

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
        <span style={{ fontFamily: MONO, fontSize: 9, color: "#cbd5e1", letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontFamily: MONO, fontSize: 25, fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.03em" }}>{value}</span>
        {unit && <span style={{ fontFamily: MONO, fontSize: 11, color, opacity: 0.85 }}>{unit}</span>}
      </div>
    </div>
  );
}
