import { useEffect, useRef } from "react";

const SPEED_COLORSCALE = [
  [0.0,  "#1e40af"],
  [0.15, "#2563eb"],
  [0.3,  "#0ea5e9"],
  [0.45, "#06b6d4"],
  [0.55, "#10b981"],
  [0.65, "#f59e0b"],
  [0.8,  "#ef4444"],
  [1.0,  "#dc2626"],
];

function computeSpeeds(traj) {
  const { time, x_east, y_north, z_up } = traj;
  const n = time.length;
  const speeds = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = time[i + 1] - time[i - 1];
    if (dt <= 0) continue;
    const dx = x_east[i + 1] - x_east[i - 1];
    const dy = y_north[i + 1] - y_north[i - 1];
    const dz = z_up[i + 1] - z_up[i - 1];
    speeds[i] = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }
  speeds[0] = speeds[1];
  speeds[n - 1] = speeds[n - 2];
  return speeds;
}

export default function Flight3DView({ trajectory }) {
  const ref = useRef();

  useEffect(() => {
    if (!trajectory || !window.Plotly) return;
    const { time, x_east, y_north, z_up } = trajectory;
    const speeds = computeSpeeds(trajectory);
    const maxSpeed = Math.max(...speeds, 1);

    const tooltipText = time.map((t, i) =>
      `t: ${t}s<br>E: ${x_east[i].toFixed(1)}m  N: ${y_north[i].toFixed(1)}m<br>Alt: ${z_up[i].toFixed(1)}m<br>Speed: ${speeds[i].toFixed(2)} m/s`
    );

    const trace = {
      type: "scatter3d",
      mode: "lines+markers",
      x: x_east,
      y: y_north,
      z: z_up,
      text: tooltipText,
      hovertemplate: "%{text}<extra></extra>",
      line: {
        color: speeds,
        colorscale: SPEED_COLORSCALE,
        width: 4,
        cmin: 0,
        cmax: maxSpeed,
      },
      marker: {
        size: 2.5,
        color: speeds,
        colorscale: SPEED_COLORSCALE,
        cmin: 0,
        cmax: maxSpeed,
        opacity: 0.7,
      },
    };

    // Start / End markers
    const startMarker = {
      type: "scatter3d",
      mode: "markers+text",
      x: [x_east[0]],
      y: [y_north[0]],
      z: [z_up[0]],
      text: ["START"],
      textposition: "top center",
      textfont: { color: "#22c55e", size: 10, family: "DM Mono, monospace" },
      marker: { size: 7, color: "#22c55e", symbol: "circle", opacity: 1 },
      hovertemplate: "START<br>Alt: %{z:.1f}m<extra></extra>",
    };

    const endMarker = {
      type: "scatter3d",
      mode: "markers+text",
      x: [x_east[x_east.length - 1]],
      y: [y_north[y_north.length - 1]],
      z: [z_up[z_up.length - 1]],
      text: ["END"],
      textposition: "top center",
      textfont: { color: "#f87171", size: 10, family: "DM Mono, monospace" },
      marker: { size: 7, color: "#f87171", symbol: "circle", opacity: 1 },
      hovertemplate: "END<br>Alt: %{z:.1f}m<extra></extra>",
    };

    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor:  "rgba(0,0,0,0)",
      margin: { l: 0, r: 0, t: 0, b: 0 },
      showlegend: false,
      scene: {
        bgcolor: "rgba(0,0,0,0)",
        xaxis: {
          title: { text: "East (m)", font: { color: "#334155", size: 10, family: "DM Mono, monospace" } },
          gridcolor: "rgba(255,255,255,0.05)",
          zerolinecolor: "rgba(255,255,255,0.1)",
          tickfont: { color: "#334155", size: 9, family: "DM Mono, monospace" },
          backgroundcolor: "rgba(255,255,255,0.01)",
          showbackground: true,
        },
        yaxis: {
          title: { text: "North (m)", font: { color: "#334155", size: 10, family: "DM Mono, monospace" } },
          gridcolor: "rgba(255,255,255,0.05)",
          zerolinecolor: "rgba(255,255,255,0.1)",
          tickfont: { color: "#334155", size: 9, family: "DM Mono, monospace" },
          backgroundcolor: "rgba(255,255,255,0.01)",
          showbackground: true,
        },
        zaxis: {
          title: { text: "Alt (m)", font: { color: "#334155", size: 10, family: "DM Mono, monospace" } },
          gridcolor: "rgba(255,255,255,0.05)",
          zerolinecolor: "rgba(255,255,255,0.1)",
          tickfont: { color: "#334155", size: 9, family: "DM Mono, monospace" },
          backgroundcolor: "rgba(10,15,26,0.4)",
          showbackground: true,
        },
        camera: {
          eye: { x: 1.4, y: -1.4, z: 0.9 },
          up: { x: 0, y: 0, z: 1 },
        },
        aspectmode: "data",
      },
      coloraxis: {
        colorscale: SPEED_COLORSCALE,
        cmin: 0,
        cmax: maxSpeed,
        colorbar: {
          title: { text: "m/s", font: { color: "#475569", size: 10, family: "DM Mono, monospace" }, side: "right" },
          tickfont: { color: "#475569", size: 9, family: "DM Mono, monospace" },
          len: 0.5, thickness: 10,
          bgcolor: "rgba(0,0,0,0)",
          bordercolor: "rgba(255,255,255,0.07)",
          x: 1.01,
        },
      },
    };

    const config = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
      responsive: true,
    };

    window.Plotly.react(ref.current, [trace, startMarker, endMarker], layout, config);
  }, [trajectory]);

  return (
    <div
      ref={ref}
      style={{ width: "100%", height: "100%" }}
    />
  );
}