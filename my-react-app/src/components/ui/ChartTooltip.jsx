import { MONO } from '../../utils/constants';

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(10,15,26,0.97)", border: "1px solid rgba(96,165,250,0.18)", borderRadius: 8, padding: "7px 11px", fontFamily: MONO, fontSize: 10, color: "#cbd5e1" }}>
      <div style={{ color: "#60a5fa", marginBottom: 3 }}>t = {label}s</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: <b style={{ color: "#e2e8f0" }}>{p.value}</b></div>
      ))}
    </div>
  );
}
