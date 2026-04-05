import { MONO } from '../../utils/constants';

export default function SectionLabel({ text, gradient }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
      <div style={{ width: 3, height: 13, background: gradient, borderRadius: 2 }} />
      <span style={{ fontSize: 9, color: "#e2e8f0", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: MONO }}>{text}</span>
    </div>
  );
}
