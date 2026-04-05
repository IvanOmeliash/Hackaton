import { MONO } from '../../utils/constants';

// eslint-disable-next-line no-unused-vars
export default function Panel({ title, icon: Icon, color = "#60a5fa", children, style = {} }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Icon size={12} color={color} />
        <span style={{ fontFamily: MONO, fontSize: 9, color: "#cbd5e1", letterSpacing: "0.09em", textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
