import { Activity, ArrowUp, TrendingUp } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import Panel from './ui/Panel';
import ChartTooltip from './ui/ChartTooltip';
import { MONO } from '../utils/constants';

export default function TelemetryCharts({ chartData, maxAccelAbs }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Panel title="Висота відносно часу (Altitude vs Time)" icon={ArrowUp} color="#a78bfa">
        <div style={{ height: 210, padding: "12px 8px 4px 0" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 14, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id="gAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} tickLine={false} axisLine={false}
                label={{ value: "час (с)", position: "insideBottom", offset: -4, fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} tickLine={false} axisLine={false} width={34} unit=" м" />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="alt" name="Висота" stroke="#a78bfa" strokeWidth={1.8} fill="url(#gAlt)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Прискорення відносно часу (Acceleration vs Time)" icon={TrendingUp} color="#f472b6">
        <div style={{ height: 210, padding: "12px 8px 4px 0" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 14, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} tickLine={false} axisLine={false}
                label={{ value: "час (с)", position: "insideBottom", offset: -4, fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: MONO }} tickLine={false} axisLine={false} width={36} unit=" м/с²" />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 3" />
              {maxAccelAbs > 3 && <>
                <ReferenceLine y={3}  stroke="rgba(239,68,68,0.28)" strokeDasharray="4 3"
                  label={{ value: "⚠", position: "right", fontSize: 10, fill: "#ef4444", fontFamily: MONO }} />
                <ReferenceLine y={-3} stroke="rgba(239,68,68,0.28)" strokeDasharray="4 3" />
              </>}
              <Line type="monotone" dataKey="accel" name="Прискорення" stroke="#f472b6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
