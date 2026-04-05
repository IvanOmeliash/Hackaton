import { AlertTriangle } from 'lucide-react';

export default function DashboardFooter() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 9, color: "#94a3b8", letterSpacing: "0.05em" }}>DRONELOG ANALYZER · ENU COORDINATE SYSTEM · v2.1</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <AlertTriangle size={10} color="#f59e0b" />
        <span style={{ fontSize: 9, color: "#94a3b8" }}>Demo · дані згенеровані локально</span>
      </div>
    </div>
  );
}
