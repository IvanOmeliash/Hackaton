import { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { computeSpeeds, computeAccels } from '../utils/mathUtils';
import { generateMockResponse } from '../utils/mockData';
import { exportToPDF } from '../utils/pdfExport';
import { MONO } from '../utils/constants';

import Panel from '../components/ui/Panel';
import SectionLabel from '../components/ui/SectionLabel';
import AIAssistantPanel from '../components/AIAssistantPanel';
import Flight3D from '../components/Flight3D';
import PlaybackSlider from '../components/PlaybackSlider';

import DashboardNavbar from '../components/DashboardNavbar';
import MetricsGrid from '../components/MetricsGrid';
import TelemetryCharts from '../components/TelemetryCharts';
import DashboardFooter from '../components/DashboardFooter';

export default function FlightDashboard({ fileName = "mission_042.BIN", apiResponse = null, onBack, onAccount }) {
  const [plotlyReady, setPlotlyReady] = useState(!!window.Plotly);
  const [playbackIndex, setPlaybackIndex] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);

  useEffect(() => {
    if (window.Plotly) return;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/plotly.js-dist@2.27.0/plotly.min.js";
    s.onload = () => setPlotlyReady(true);
    document.head.appendChild(s);
    return () => { try { document.head.removeChild(s); } catch { /* ignore cleanup error */ } };
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
      <DashboardNavbar
        onBack={onBack}
        fileName={fileName}
        pdfExporting={pdfExporting}
        onExportPDF={handleExportPDF}
        onAccount={onAccount}
      />
      <div style={{ flex: 1, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <SectionLabel text="Ключові показники польоту" gradient="linear-gradient(180deg,#3b82f6,#0ea5e9)" />
        <MetricsGrid metrics={metrics} />

        <SectionLabel text="AI Аналітик · Автоматичний звіт" gradient="linear-gradient(180deg,#60a5fa,#818cf8)" />
        <AIAssistantPanel metrics={metrics} trajectory={trajectory} />

        <SectionLabel text="3D-Траєкторія · ENU · Колір = Швидкість" gradient="linear-gradient(180deg,#38bdf8,#06b6d4)" />
        <Panel title="3D Траєкторія польоту · ENU (метри від точки старту)" icon={Box} color="#38bdf8" style={{ height: 430 }}>
          <Flight3D trajectory={trajectory} plotlyReady={plotlyReady} playbackIndex={playbackIndex} />
        </Panel>

        <PlaybackSlider
          trajectory={trajectory}
          onIndexChange={setPlaybackIndex}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, color: "#cbd5e1", letterSpacing: "0.06em" }}>ШВИДКІСТЬ:</span>
          <div style={{ height: 5, flex: 1, maxWidth: 220, borderRadius: 3, background: "linear-gradient(90deg,#1e40af,#0ea5e9,#10b981,#f59e0b,#ef4444)" }} />
          <span style={{ fontSize: 9, color: "#94a3b8" }}>0 → {maxSp.toFixed(1)} м/с</span>
        </div>

        <SectionLabel text="Телеметрія · 2D графіки" gradient="linear-gradient(180deg,#a78bfa,#6366f1)" />
        <TelemetryCharts chartData={chartData} maxAccelAbs={maxAccelAbs} />

        <DashboardFooter />
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
