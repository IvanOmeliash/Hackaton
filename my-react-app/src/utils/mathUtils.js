export function computeSpeeds(traj) {
  const { time, x_east, y_north, z_up } = traj;
  const n = time.length;
  const sp = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = time[i + 1] - time[i - 1];
    if (dt <= 0) continue;
    const dx = x_east[i + 1] - x_east[i - 1];
    const dy = y_north[i + 1] - y_north[i - 1];
    const dz = z_up[i + 1] - z_up[i - 1];
    sp[i] = Math.sqrt(dx * dx + dy * dy + dz * dz) / dt;
  }
  sp[0] = sp[1] || 0;
  sp[n - 1] = sp[n - 2] || 0;
  return sp;
}

export function computeAccels(traj) {
  const speeds = computeSpeeds(traj);
  const { time } = traj;
  const n = time.length;
  const ac = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const dt = time[i + 1] - time[i - 1];
    if (dt <= 0) continue;
    ac[i] = (speeds[i + 1] - speeds[i - 1]) / dt;
  }
  ac[0] = ac[1] || 0;
  ac[n - 1] = ac[n - 2] || 0;
  return ac;
}
