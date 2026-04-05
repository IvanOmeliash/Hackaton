import { Route, Clock, ArrowUp, Zap, Activity, TrendingUp } from 'lucide-react';
import StatCard from './ui/StatCard';

function fmtDist(m) {
  return m >= 1000 ? [(m / 1000).toFixed(2), "km"] : [m.toFixed(0), "m"];
}

function fmtDur(s) {
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

export default function MetricsGrid({ metrics }) {
  const [dv, du] = fmtDist(metrics.total_distance_m);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
      <StatCard icon={Route}      label="Дистанція"         value={dv}                                  unit={du}    color="#38bdf8" delay={0}   />
      <StatCard icon={Clock}      label="Тривалість"         value={fmtDur(metrics.flight_duration_sec)} unit="хв:с"  color="#34d399" delay={55}  />
      <StatCard icon={ArrowUp}    label="Макс. висота"       value={metrics.max_altitude_m}              unit="м"     color="#a78bfa" delay={110} />
      <StatCard icon={Zap}        label="Гориз. швидкість"   value={metrics.max_horizontal_speed_m_s}    unit="м/с"   color="#f59e0b" delay={165} />
      <StatCard icon={Activity}   label="Верт. швидкість"    value={metrics.max_vertical_speed_m_s}      unit="м/с"   color="#fb923c" delay={220} />
      <StatCard icon={TrendingUp} label="Макс. прискор."     value={metrics.max_acceleration_m_s2}       unit="м/с²"  color="#f472b6" delay={275} />
    </div>
  );
}
