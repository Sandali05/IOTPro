import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import { AlertTriangle, Droplets, Thermometer } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const firebaseConfig = {
  apiKey: "AIzaSyDAFSgFeYvjZz3Un0_8iaTM7BgAF7wymwk",
  authDomain: "fire-monitoring-system-e0752.firebaseapp.com",
  databaseURL:
    "https://fire-monitoring-system-e0752-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fire-monitoring-system-e0752",
  storageBucket: "fire-monitoring-system-e0752.appspot.com",
  messagingSenderId: "212281652347",
  appId: "1:212281652347:web:944cd1774802f7eb155ede",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return Object.values(value);
}

function normalize(entry = {}) {
  const rawTs = entry.timestamp ?? entry.updated_at ?? [entry.date, entry.time].filter(Boolean).join(" ");
  const parsed = Number(rawTs);
  const timestampMs = Number.isFinite(parsed) ? parsed : Date.parse(rawTs || "");
  return {
    timestamp: rawTs || "--",
    timestampMs: Number.isFinite(timestampMs) ? timestampMs : 0,
    temperature: Number(entry.temperature ?? entry.temp ?? 0),
    humidity: Number(entry.humidity ?? entry.hum ?? 0),
    status: String(entry.status || "normal"),
    warning: String(entry.warning || "--"),
    gasLevel: Number(entry.gas_level ?? entry.gas_value ?? entry.gas ?? 0),
    fridgeDuration: Number(entry.fridge_door_open_duration ?? entry.open_duration ?? 0),
  };
}

function forecastNextHour(tempRows, gasRows, fridgeRows) {
  const base = tempRows.slice().reverse();
  if (!base.length) return [];

  const featureRows = base.map((row, i) => ({
    t: i + 1,
    temp: row.temperature,
    humidity: row.humidity,
    gas: gasRows[i]?.gasLevel || 0,
    fridge: fridgeRows[i]?.fridgeDuration || 0,
  }));

  const n = featureRows.length;
  const tAvg = featureRows.reduce((s, p) => s + p.t, 0) / n;
  const yAvg = featureRows.reduce((s, p) => s + p.temp, 0) / n;
  const slope =
    featureRows.reduce((s, p) => s + (p.t - tAvg) * (p.temp - yAvg), 0) /
    (featureRows.reduce((s, p) => s + (p.t - tAvg) ** 2, 0) || 1);

  const humidityImpact = featureRows.reduce((s, p) => s + p.humidity, 0) / n > 70 ? -0.2 : 0.2;
  const gasImpact = featureRows.reduce((s, p) => s + p.gas, 0) / n > 65 ? 0.4 : 0;
  const fridgeImpact = featureRows.reduce((s, p) => s + p.fridge, 0) / n > 20 ? -0.3 : 0;

  const lastTemp = featureRows[n - 1].temp;
  const start = base[base.length - 1]?.timestampMs || Date.now();

  return Array.from({ length: 6 }, (_, i) => {
    const minute = (i + 1) * 10;
    const projected = lastTemp + slope * (i + 1) + humidityImpact + gasImpact + fridgeImpact;
    return {
      minute,
      time: new Date(start + minute * 60 * 1000).toLocaleTimeString(),
      temperature: Number(projected.toFixed(1)),
    };
  });
}

function Gauge({ title, value, unit, color }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ background: "#494949", borderRadius: 18, padding: 16 }}>
      <div style={{ color: "#fff", marginBottom: 12, fontWeight: 600 }}>{title}</div>
      <div style={{ height: 14, background: "#2f2f2f", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} />
      </div>
      <div style={{ marginTop: 10, color: "#fff", fontSize: 30, fontWeight: 700 }}>
        {value}
        {unit}
      </div>
    </div>
  );
}

export default function TempHumDashboardUI() {
  const [latest, setLatest] = useState({});
  const [historyRows, setHistoryRows] = useState([]);
  const [analysis, setAnalysis] = useState({});
  const [gasRows, setGasRows] = useState([]);
  const [fridgeRows, setFridgeRows] = useState([]);

  useEffect(() => {
    const unsubLatest = onValue(ref(db, "TempnHumData/latest"), (snap) => {
      setLatest(snap.val() || {});
    });

    const unsubHistory = onValue(ref(db, "TempnHumData/history"), (snap) => {
      const rows = toArray(snap.val())
        .map(normalize)
        .sort((a, b) => b.timestampMs - a.timestampMs);
      setHistoryRows(rows);
    });

    const unsubAnalysis = onValue(ref(db, "TempnHumData/analysis"), (snap) => {
      setAnalysis(snap.val() || {});
    });

    const unsubGas = onValue(ref(db, "gassensorData/history"), (snap) => {
      setGasRows(toArray(snap.val()).map(normalize).sort((a, b) => b.timestampMs - a.timestampMs));
    });

    const unsubFridge = onValue(ref(db, "FridgeDoor/history"), (snap) => {
      setFridgeRows(toArray(snap.val()).map(normalize).sort((a, b) => b.timestampMs - a.timestampMs));
    });

    return () => {
      unsubLatest();
      unsubHistory();
      unsubAnalysis();
      unsubGas();
      unsubFridge();
    };
  }, []);

  const latest5 = useMemo(() => historyRows.slice(0, 5), [historyRows]);

  const liveTemp = Number(latest.temperature ?? latest5[0]?.temperature ?? 0);
  const liveHum = Number(latest.humidity ?? latest5[0]?.humidity ?? 0);

  const analysisForecast = toArray(analysis.forecast || analysis.predictions).map((row, i) => ({
    time: row.time || `${(i + 1) * 10} min`,
    temperature: Number(row.temperature ?? row.temp ?? 0),
  }));

  const fallback = useMemo(
    () => forecastNextHour(latest5, gasRows.slice(0, 5), fridgeRows.slice(0, 5)),
    [latest5, gasRows, fridgeRows]
  );

  const forecast = analysisForecast.length ? analysisForecast.slice(0, 6) : fallback;
  const risk =
    analysis.predicted_risk ||
    analysis.tinyml_risk ||
    analysis.tree_risk ||
    (forecast[forecast.length - 1]?.temperature >= 38 ? "high" : "normal");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#2f2f2f",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h2 style={{ margin: "0 0 16px" }}>Humidity and Temperature Monitoring</h2>

        <div
          style={{
            background: risk === "high" ? "#fca5a5" : "#86efac",
            color: "#18181b",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangle size={18} />
          <span>
            Next hour risk: <strong>{String(risk)}</strong>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 14 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Droplets size={18} /> Humidity Meter
            </div>
            <Gauge title="Humidity" value={Math.round(liveHum)} unit="%" color="#22c55e" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Thermometer size={18} /> Temperature Meter
            </div>
            <Gauge
              title="Temperature"
              value={Math.round(liveTemp)}
              unit="°C"
              color="#f97316"
            />
          </div>

          <div style={{ background: "#494949", borderRadius: 18, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Next Hour Temperature Forecast</div>
            <div style={{ height: 230 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <CartesianGrid stroke="#666" strokeOpacity={0.25} vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#d4d4d8", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#d4d4d8", fontSize: 12 }} />
                  <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ background: "#494949", borderRadius: 18, padding: 16, marginTop: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>
            Humidity and Temperature Sensor Live Data (latest 5 rows)
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["timestamp", "temperature", "humidity", "status", "warning"].map((h) => (
                  <th
                    key={h}
                    style={{ textAlign: "left", paddingBottom: 10, borderBottom: "1px solid #666" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(latest5.length ? latest5 : [normalize({})]).map((row, i) => (
                <tr key={`${row.timestamp}-${i}`}>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #666" }}>{row.timestamp}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #666" }}>{row.temperature}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #666" }}>{row.humidity}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #666" }}>{row.status}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid #666" }}>{row.warning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
