import { computeSpeeds, computeAccels } from './mathUtils';

export async function exportToPDF(fileName, metrics, trajectory) {
  const loadScript = (src) =>
    new Promise((res) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src;
      s.onload = res;
      document.head.appendChild(s);
    });

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const fetchFont = async (url) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  };

  try {
    const regularB64 = await fetchFont("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf");
    const boldB64 = await fetchFont("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf");
    doc.addFileToVFS("Roboto-Regular.ttf", regularB64);
    doc.addFileToVFS("Roboto-Medium.ttf", boldB64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Medium.ttf", "Roboto", "bold");
  } catch (e) {
    console.warn("Failed to load fonts", e);
  }

  const W = 210, H = 297, M = 15;
  let y = 0;
  const applyDarkBackground = () => {
    doc.setFillColor(10, 15, 26);
    doc.rect(0, 0, W, H, "F");
  };

  const section = (title, topMargin = 0) => {
    y += topMargin;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.setTextColor(191, 219, 254);
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.4);
    doc.line(M + doc.getTextWidth(title.toUpperCase()) + 3, y - 1, W - M, y - 1);
    y += 8;
  };

  applyDarkBackground();

  doc.setFillColor(59, 7, 100);
  doc.rect(0, 0, W, 28, "F");
  doc.setFont("Roboto", "bold");
  doc.setFontSize(22);
  doc.setTextColor(241, 245, 249);
  doc.text("DLA", M, 13);
  doc.setFontSize(10);
  doc.setTextColor(216, 180, 254);
  doc.text("DRONE LOG ANALYZER", M, 20);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Файл: ${fileName}`, W - M, 13, { align: "right" });
  doc.text(`Створено: ${new Date().toLocaleString("uk-UA")}`, W - M, 20, { align: "right" });
  y = 42;

  section("Ключові параметри польоту");

  const metric = (label, value) => {
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(label, M + 4, y);
    doc.setFont("Roboto", "bold");
    doc.setTextColor(241, 245, 249);
    doc.text(String(value), W - M, y, { align: "right" });
    y += 6;
  };

  const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

  metric("Загальна тривалість", fmtDur(metrics.flight_duration_sec) + " хв:с");
  metric("Загальна дистанція польоту", metrics.total_distance_m.toFixed(1) + " м");
  metric("Максимальна висота", metrics.max_altitude_m.toFixed(1) + " м");
  metric("Пікова горизонтальна швидкість", metrics.max_horizontal_speed_m_s.toFixed(2) + " м/с");
  metric("Пікова вертикальна швидкість", metrics.max_vertical_speed_m_s.toFixed(2) + " м/с");
  metric("Перевантаження (прискорення)", metrics.max_acceleration_m_s2.toFixed(2) + " м/с²");

  y += 4;

  section("Технічний висновок", 6);

  const speeds = computeSpeeds(trajectory);
  const accels = computeAccels(trajectory);
  const avgSpeed = (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1);
  const anomalyCount = speeds.filter(s => s > 15).length + accels.filter(a => Math.abs(a) > 5).length;

  let stateConclusion = "Нормальний стан";
  if (anomalyCount > 0 && anomalyCount < 10) stateConclusion = "Значні навантаження, потрібен техогляд";
  if (anomalyCount >= 10) stateConclusion = "КРИТИЧНО! Ризик виходу з ладу двигунів";

  doc.setFillColor(30, 41, 59);
  doc.rect(M, y, W - M * 2, 28, "F");

  doc.setFont("Roboto", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);

  doc.text(`Під час місії дрон покрив дистанцію у ${metrics.total_distance_m.toFixed(0)} м. за ${Math.floor(metrics.flight_duration_sec)} секунд(и).`, M + 4, y + 6);
  doc.text(`Середня швидкість польоту становила ${avgSpeed} м/с.`, M + 4, y + 11);
  doc.text(`Верхня межа стелі склала ${metrics.max_altitude_m.toFixed(1)} м.`, M + 4, y + 16);

  doc.setFont("Roboto", "bold");
  doc.setTextColor(anomalyCount > 0 ? 248 : 34, anomalyCount > 0 ? 113 : 197, anomalyCount > 0 ? 113 : 94);
  doc.text(`СТАН АПАРАТУ: ${stateConclusion}`, M + 4, y + 23);

  y += 40;

  section("Графік висоти (Altitude vs Time)", 8);

  const graphH = 50;
  const graphW = W - M * 2;
  const gx = M;
  const gy = y;

  doc.setFillColor(15, 23, 42);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.rect(gx, gy, graphW, graphH, "FD");

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.2);
  for (let i = 1; i < 5; i++) {
    doc.line(gx, gy + (graphH * i) / 5, gx + graphW, gy + (graphH * i) / 5);
  }

  const MAX_ALT = Math.max(...trajectory.z_up, 10);
  const T_MAX = trajectory.time[trajectory.time.length - 1];

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${MAX_ALT.toFixed(0)}m`, gx - 1, gy + 3, { align: "right" });
  doc.text(`0m`, gx - 1, gy + graphH, { align: "right" });
  doc.text(`0s`, gx, gy + graphH + 4);
  doc.text(`${T_MAX.toFixed(0)}s`, gx + graphW, gy + graphH + 4, { align: "right" });

  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.8);

  const stepChart = Math.max(1, Math.floor(trajectory.time.length / 200));
  let points = [];

  for (let i = 0; i < trajectory.time.length; i += stepChart) {
    const px = gx + (trajectory.time[i] / T_MAX) * graphW;
    const py = gy + graphH - (Math.max(0, trajectory.z_up[i]) / MAX_ALT) * graphH;
    points.push([px, py]);
  }

  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }

  y += graphH + 16;

  if (y > H - 50) {
    doc.addPage();
    applyDarkBackground();
    y = M;
  }

  section("Вибірка телеметрії (крок 10 точок)", 4);

  const cols = ["Час (с)", "Схід (м)", "Північ (м)", "Висота (м)", "Верт. Шв."];
  const colW = [25, 35, 35, 35, 30];
  let cx = M + 4;
  doc.setFont("Roboto", "bold"); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  cols.forEach((c, i) => { doc.text(c, cx, y); cx += colW[i]; });
  y += 3;
  doc.setDrawColor(51, 65, 85); doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFont("Roboto", "normal"); doc.setFontSize(8); doc.setTextColor(203, 213, 225);
  const tableStep = Math.max(1, Math.floor(trajectory.time.length / 25));
  let v_prev = 0;

  for (let i = 0; i < trajectory.time.length; i += tableStep) {
    if (y > H - M) {
      doc.addPage();
      applyDarkBackground();
      y = M + 10;
    }

    const vz = i > 0 ? (trajectory.z_up[i] - trajectory.z_up[i - 1]) / (trajectory.time[i] - trajectory.time[i - 1]) : 0;

    cx = M + 4;
    const row = [
      trajectory.time[i].toFixed(1),
      trajectory.x_east[i].toFixed(1),
      trajectory.y_north[i].toFixed(1),
      trajectory.z_up[i].toFixed(1),
      vz.toFixed(2),
    ];
    row.forEach((val, ci) => { doc.text(val, cx, y); cx += colW[ci]; });
    y += 5;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`DRONELOG ANALYZER PRO · СТОРІНКА ${p}/${totalPages}`, M, H - 8);
  }

  doc.save(`report_${fileName.replace(/\.[^.]+$/, "")}.pdf`);
}
