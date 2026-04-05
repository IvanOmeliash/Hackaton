import { computeSpeeds, computeAccels } from './mathUtils';

export function generateMockResponse() {
  const N = 160;
  const time = [], x_east = [], y_north = [], z_up = [];
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < N; i++) {
    const phase = i / N;
    z = phase < 0.1 ? i * 1.9 : phase > 0.88 ? Math.max(0, z - 2.8) : z + (Math.random() - 0.48) * 1.4;
    x += 1.3 + Math.random() * 1.6;
    y += (Math.random() - 0.5) * 2.8;
    time.push(parseFloat((i * 2).toFixed(2)));
    x_east.push(parseFloat(x.toFixed(2)));
    y_north.push(parseFloat(y.toFixed(2)));
    z_up.push(parseFloat(Math.max(0, z).toFixed(2)));
  }
  const traj = { time, x_east, y_north, z_up };
  const speeds = computeSpeeds(traj);
  const accels = computeAccels(traj);
  return {
    status: "success",
    data: {
      metrics: {
        flight_duration_sec: time[N - 1],
        total_distance_m: parseFloat(x.toFixed(2)),
        max_altitude_m: parseFloat(Math.max(...z_up).toFixed(2)),
        max_horizontal_speed_m_s: parseFloat(Math.max(...speeds).toFixed(2)),
        max_vertical_speed_m_s: 3.4,
        max_acceleration_m_s2: parseFloat(Math.max(...accels.map(Math.abs)).toFixed(2)) || 4.7,
      },
      trajectory: traj,
    },
  };
}
