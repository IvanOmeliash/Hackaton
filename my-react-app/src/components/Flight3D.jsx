import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { computeSpeeds } from '../utils/mathUtils';
import { SPEED_CS, MONO } from '../utils/constants';

export default function Flight3D({ trajectory, plotlyReady, playbackIndex }) {
  const divRef = useRef();
  const hasPlotted = useRef(false);

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
      tickfont: { color: "#cbd5e1", size: 9, family: MF },
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
        xaxis: { ...axBase, title: { text: "East (m)", font: { color: "#cbd5e1", size: 10, family: MF } } },
        yaxis: { ...axBase, title: { text: "North (m)", font: { color: "#cbd5e1", size: 10, family: MF } } },
        zaxis: { ...axBase, title: { text: "Alt (m)", font: { color: "#cbd5e1", size: 10, family: MF } }, backgroundcolor: "rgba(10,15,26,0.45)" },
        camera: { eye: { x: 1.5, y: -1.5, z: 0.85 }, up: { x: 0, y: 0, z: 1 } },
        aspectmode: "data",
      },
      coloraxis: {
        colorscale: SPEED_CS, cmin: 0, cmax: maxSp,
        colorbar: {
          title: { text: "Speed (m/s)", font: { color: "#cbd5e1", size: 9, family: MF }, side: "right" },
          tickfont: { color: "#cbd5e1", size: 8, family: MF },
          len: 0.55, thickness: 8,
          bgcolor: "rgba(0,0,0,0)", bordercolor: "rgba(255,255,255,0.06)", x: 1.0,
        },
      },
    }, { displayModeBar: true, displaylogo: false, modeBarButtonsToRemove: ["toImage", "sendDataToCloud"], responsive: true });

    hasPlotted.current = true;
  }, [trajectory, plotlyReady, playbackIndex]);

  useEffect(() => {
    if (!hasPlotted.current || !window.Plotly || !trajectory || playbackIndex == null) return;
    const { x_east, y_north, z_up } = trajectory;
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
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#cbd5e1", fontSize: 11, fontFamily: MONO }}>
          <RotateCcw size={13} style={{ animation: "spin 1s linear infinite" }} />
          Завантаження 3D рушія…
        </div>
      )}
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
