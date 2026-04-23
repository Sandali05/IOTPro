import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";
import {
  Bell,
  Flame,
  Refrigerator,
  Droplets,
  Shield,
  Gauge,
  Moon,
  Sun,
  Home,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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

const defaultRows = [
  {
    timestamp: "--",
    raw: "--",
    intensity: "--",
    status: "SAFE",
    triggered: "false",
    level: "NONE",
  },
];

function getTheme(mode) {
  const dark = mode === "dark";

  return {
    mode,
    pageBg: dark ? "#2b2b2b" : "#f3f4f6",
    shellBg: dark ? "#3a3a3a" : "#ffffff",
    mainBg: dark ? "#3f3f3f" : "#f8fafc",
    sidebarBg: dark ? "#323232" : "#e5e7eb",
    sidebarIconBg: dark ? "#27272a" : "#ffffff",
    sidebarIconBorder: dark ? "#3f3f46" : "#d1d5db",
    sidebarText: dark ? "#d4d4d8" : "#374151",
    headerBorder: dark ? "rgba(113,113,122,0.3)" : "rgba(209,213,219,0.8)",
    textMain: dark ? "#ffffff" : "#111827",
    textSoft: dark ? "#e4e4e7" : "#374151",
    textMuted: dark ? "#a1a1aa" : "#6b7280",
    cardBg: dark ? "#4a4a4a" : "#ffffff",
    footerBg: dark ? "#585858" : "#e5e7eb",
    pillBg: dark ? "#52525b" : "#e5e7eb",
    chartBg: dark ? "#454545" : "#f3f4f6",
    tableBorder: dark ? "#5b5b5b" : "#d1d5db",
    inputBg: dark ? "#3f3f3f" : "#ffffff",
    shadow: dark
      ? "0 20px 40px rgba(0,0,0,0.3)"
      : "0 20px 40px rgba(0,0,0,0.12)",
  };
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  theme,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        color: theme.sidebarText,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          border: `1px solid ${theme.sidebarIconBorder}`,
          background: theme.sidebarIconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...(active
            ? {
                border: "1px solid rgba(163,230,53,0.5)",
                background: theme.mode === "dark" ? "#3f3f46" : "#dcfce7",
                color: "#65a30d",
              }
            : {}),
        }}
      >
        <Icon size={20} />
      </div>
      <span>{label}</span>
    </button>
  );
}

function HalfGauge({ value, theme, title, subtitle, type = "flame" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  const cx = 140;
  const cy = 135;
  const r = 90;
  const strokeWidth = 26;

  const pointAt = (deg, radius = r) => {
    const rad = (Math.PI / 180) * deg;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  };

  const buildArcPath = (startDeg, endDeg, steps = 40) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const deg = startDeg + ((endDeg - startDeg) * i) / steps;
      points.push(pointAt(deg));
    }
    return points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  };

  const flameSegments = [
    { start: 180, end: 135, color: "#cbe98d" },
    { start: 135, end: 55, color: "#e9bf56" },
    { start: 55, end: 0, color: "#f85a14" },
  ];

  const signalSegments = [
    { start: 180, end: 120, color: "#29c75f" },
    { start: 120, end: 0, color: "#d1d5db" },
  ];

  const segments = type === "signal" ? signalSegments : flameSegments;
  const pointerDeg = 180 - (safeValue / 100) * 180;
  const pointer = pointAt(pointerDeg, 70);

  return (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: "24px",
        padding: "20px",
        boxShadow: theme.shadow,
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: theme.textMain,
          textAlign: title.includes("Signal") ? "center" : "left",
        }}
      >
        {title}
      </h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg width="280" height="175" viewBox="0 0 280 175">
          <path
            d={buildArcPath(180, 0)}
            fill="none"
            stroke={theme.mode === "dark" ? "#666666" : "#d9d9d9"}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />

          {segments.map((seg, i) => (
            <path
              key={i}
              d={buildArcPath(seg.start, seg.end)}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ))}

          <line
            x1={cx}
            y1={cy}
            x2={pointer.x}
            y2={pointer.y}
            stroke={theme.textMain}
            strokeWidth="7"
            strokeLinecap="round"
          />

          <circle cx={cx} cy={cy} r="11" fill={theme.textMain} />
        </svg>

        <div
          style={{
            marginTop: "-4px",
            fontSize: title.includes("Signal") ? "56px" : "52px",
            fontWeight: 700,
            color: theme.textMain,
            lineHeight: 1,
          }}
        >
          {safeValue}%
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "15px",
            color: theme.textMuted,
            fontWeight: title.includes("Signal") ? 600 : 400,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function GaugeCard({ value = 18, theme }) {
  return (
    <HalfGauge
      value={value}
      theme={theme}
      title="Flame Indicator"
      subtitle="flame_intensity (%)"
      type="flame"
    />
  );
}

function SignalStrengthCard({ value = 46, theme }) {
  return (
    <HalfGauge
      value={value}
      theme={theme}
      title="Sensor Signal Strength Indicator"
      subtitle="Medium Flame Signal (%)"
      type="signal"
    />
  );
}

function ChartCard({ chartData, theme }) {
  return (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: "24px",
        padding: "20px",
        boxShadow: theme.shadow,
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: theme.textMain,
        }}
      >
        Fire Detection in last 24 hours
      </h3>

      <div
        style={{
          position: "relative",
          height: "260px",
          borderRadius: "18px",
          overflow: "hidden",
          background: theme.chartBg,
          border: `1px solid ${theme.headerBorder}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "33%",
            background: "rgba(74, 222, 128, 0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "33%",
            top: 0,
            bottom: 0,
            width: "22%",
            background: "rgba(245, 158, 11, 0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "45%",
            background: "rgba(239, 68, 68, 0.12)",
          }}
        />

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid stroke="#666" strokeOpacity={0.25} vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: theme.textMuted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: theme.textMuted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke={theme.textMain}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute",
            left: "14%",
            top: "62%",
            color: theme.textMain,
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Safe
        </div>
        <div
          style={{
            position: "absolute",
            left: "40%",
            top: "38%",
            color: theme.textMain,
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Warning
        </div>
        <div
          style={{
            position: "absolute",
            right: "16%",
            top: "22%",
            color: theme.textMain,
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          Danger
        </div>
      </div>
    </div>
  );
}

function AlertsCard({ alerts, theme }) {
  return (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: "24px",
        padding: "20px",
        boxShadow: theme.shadow,
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: theme.textMain,
        }}
      >
        Recent alerts
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {alerts.length === 0 ? (
          <div style={{ color: theme.textMuted }}>No recent alerts</div>
        ) : (
          alerts.map((alert, index) => (
            <div key={`${alert.title}-${index}`}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  lineHeight: 1.3,
                  color: theme.textMain,
                }}
              >
                {alert.title}
              </div>
              <div style={{ marginTop: "4px", color: theme.textMuted }}>
                {alert.time}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LiveTableCard({ rows, theme }) {
  return (
    <div
      style={{
        background: theme.cardBg,
        borderRadius: "24px",
        padding: "20px",
        boxShadow: theme.shadow,
        boxSizing: "border-box",
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontSize: "14px",
          fontWeight: 600,
          color: theme.textMain,
        }}
      >
        Fire Detecting Sensor Live Data
      </h3>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: theme.textMain,
            fontSize: "14px",
          }}
        >
          <thead>
            <tr>
              {[
                "timestamp",
                "flame_raw_value",
                "flame_intensity (%)",
                "fire_status",
                "alert_triggered",
                "alert_level",
              ].map((head) => (
                <th
                  key={head}
                  style={{
                    paddingBottom: "12px",
                    textAlign: "left",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                  }}
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    fontSize: "13px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.timestamp}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    textAlign: "center",
                  }}
                >
                  {row.raw}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    textAlign: "center",
                  }}
                >
                  {row.intensity}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {row.status}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    textAlign: "center",
                  }}
                >
                  {row.triggered}
                </td>
                <td
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.tableBorder}`,
                    color: theme.textSoft,
                    textAlign: "center",
                  }}
                >
                  {row.level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BottomStatus({
  esp32Status,
  lastUpdate,
  wifiStrength,
  dateTime,
  cloudConnected,
  theme,
}) {
  return (
    <div
      style={{
        marginTop: "16px",
        overflow: "hidden",
        borderBottomLeftRadius: "20px",
        borderBottomRightRadius: "20px",
        background: theme.footerBg,
        color: theme.textSoft,
        fontSize: "14px",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: "16px",
          padding: "16px 24px",
        }}
      >
        <div>ESP32 : {esp32Status}</div>
        <div>Last Update : {lastUpdate}</div>
        <div>Wifi strength : {wifiStrength}</div>
        <div style={{ textAlign: "right" }}>Date/Time : {dateTime}</div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${theme.headerBorder}`,
          padding: "16px 24px",
        }}
      >
        Cloud Connection :{" "}
        <span
          style={
            cloudConnected
              ? {
                  background: "rgba(74, 222, 128, 0.12)",
                  color: "#86efac",
                  padding: "4px 10px",
                  borderRadius: "8px",
                }
              : {
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "#fca5a5",
                  padding: "4px 10px",
                  borderRadius: "8px",
                }
          }
        >
          {cloudConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
}

export default function FireDashboardUI() {
  const [mode, setMode] = useState("dark");
  const [activePage, setActivePage] = useState("fire");
  const [fireData, setFireData] = useState(null);
  const [rows, setRows] = useState(defaultRows);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [chartPoints, setChartPoints] = useState([
    { time: "00:00:01", intensity: 18 },
  ]);

  const [timeFilter, setTimeFilter] = useState("live");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const theme = useMemo(() => getTheme(mode), [mode]);

  useEffect(() => {
    const monitorRef = ref(db, "fire_monitoring");

    const unsub = onValue(
      monitorRef,
      (snapshot) => {
        const data = snapshot.val();
        setFireData(data);
        setCloudConnected(!!data);

        if (!data) return;

        const liveIntensity =
          typeof data.flame_intensity === "number"
            ? data.flame_intensity
            : typeof data.intensity_percent === "number"
            ? data.intensity_percent
            : typeof data.sensor_value === "number"
            ? data.sensor_value === 0
              ? 88
              : 18
            : 18;

        const browserTime = new Date().toLocaleTimeString();
        const browserDateTime = new Date().toLocaleString();

        setChartPoints((prev) => {
          const updated = [...prev, { time: browserTime, intensity: liveIntensity }];
          return updated.slice(-12);
        });

        setRows((prev) => {
          const newRow = {
            timestamp: browserDateTime,
            raw: data.sensor_value ?? "--",
            intensity: liveIntensity,
            status: (data.status || "SAFE").toUpperCase(),
            triggered: data.alert_triggered ? "true" : "false",
            level: (data.alert_level || "NONE").toUpperCase(),
          };

          const first = prev[0];
          if (
            first &&
            first.raw === newRow.raw &&
            first.intensity === newRow.intensity &&
            first.status === newRow.status &&
            first.triggered === newRow.triggered &&
            first.level === newRow.level
          ) {
            return [{ ...first, timestamp: browserDateTime }, ...prev.slice(1)];
          }

          return [newRow, ...prev].slice(0, 6);
        });
      },
      (error) => {
        console.error("Firebase read error:", error);
        setCloudConnected(false);
      }
    );

    return () => unsub();
  }, []);

  const intensityPercent = useMemo(() => {
    if (!fireData) return 18;
    if (typeof fireData.flame_intensity === "number") return fireData.flame_intensity;
    if (typeof fireData.intensity_percent === "number") return fireData.intensity_percent;
    if (typeof fireData.sensor_value === "number") return fireData.sensor_value === 0 ? 88 : 18;
    return 18;
  }, [fireData]);

  const signalStrength = useMemo(() => {
    if (!fireData) return 46;
    if (typeof fireData.signal_strength === "number") return fireData.signal_strength;
    if (typeof fireData.flame_intensity === "number") return fireData.flame_intensity;
    return 46;
  }, [fireData]);

  const statusText = fireData?.status || fireData?.flame_status || "No fire Detected";
  const fireCount = fireData?.fire_count ?? 0;
  const esp32Status = fireData?.esp32_status || "ONLINE";
  const wifiStrength = fireData?.wifi_strength || "Strong";
  const lastUpdate = new Date().toLocaleTimeString();
  const dateTime = new Date().toLocaleString();

  const alertLevel =
    fireData?.alert_level ||
    fireData?.intensity ||
    (intensityPercent >= 70 ? "HIGH" : intensityPercent >= 35 ? "WARNING" : "NONE");

  const alerts = useMemo(() => {
    const merged = [];
    if ((statusText || "").toLowerCase().includes("fire")) {
      merged.push({
        title: `Fire Alert - ${alertLevel}`,
        time: new Date().toLocaleTimeString(),
      });
    }
    if (fireCount > 0) {
      merged.push({
        title: `${fireCount} fire event(s) today`,
        time: new Date().toLocaleTimeString(),
      });
    }
    if (merged.length === 0) {
      merged.push({ title: "No recent alerts", time: "--" });
    }
    return merged;
  }, [statusText, alertLevel, fireCount]);

  const bannerStyle = useMemo(() => {
    if ((statusText || "").toLowerCase().includes("fire")) {
      return { background: "#ef4444", color: "white" };
    }
    if (intensityPercent >= 70) {
      return { background: "#fb923c", color: "#18181b" };
    }
    return { background: "#8bd48b", color: "#18181b" };
  }, [statusText, intensityPercent]);

  const historyText =
    fireCount > 0 ? `${fireCount} fire event(s) detected today.` : "No History.";

  const chartData = useMemo(() => {
    if (!chartPoints || chartPoints.length === 0) {
      return [
        { time: "00:00:01", intensity: 18 },
        { time: "00:00:03", intensity: 22 },
        { time: "00:00:05", intensity: 30 },
        { time: "00:00:07", intensity: 55 },
        { time: "00:00:09", intensity: 82 },
        { time: "00:00:11", intensity: 40 },
      ];
    }
    return chartPoints;
  }, [chartPoints]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const rowStatus = String(row.status || "").toLowerCase();
      const rowLevel = String(row.level || "").toLowerCase();
      const rowRaw = String(row.raw || "").toLowerCase();
      const rowIntensity = String(row.intensity || "").toLowerCase();
      const rowTime = String(row.timestamp || "").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || rowStatus === statusFilter.toLowerCase();

      const q = searchText.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        rowStatus.includes(q) ||
        rowLevel.includes(q) ||
        rowRaw.includes(q) ||
        rowIntensity.includes(q) ||
        rowTime.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [rows, statusFilter, searchText]);

  const filteredChartData = useMemo(() => {
    let data = [...chartData];

    if (timeFilter === "live") {
      data = data.slice(-6);
    } else if (timeFilter === "1h") {
      data = data.slice(-10);
    } else if (timeFilter === "24h") {
      data = data.slice(-12);
    }

    return data;
  }, [chartData, timeFilter]);

  const renderPageContent = () => {
    if (activePage !== "fire") {
      return (
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "24px",
            padding: "40px",
            boxShadow: theme.shadow,
            color: theme.textMain,
            textAlign: "center",
            fontSize: "22px",
            fontWeight: 600,
          }}
        >
          {activePage.toUpperCase()} Dashboard Coming Soon
        </div>
      );
    }

    return (
      <>
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderRadius: "16px",
            padding: "16px 20px",
            fontWeight: 500,
            ...bannerStyle,
          }}
        >
          <Shield size={18} />
          <span>System status : {statusText}</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "16px",
            background: theme.cardBg,
            borderRadius: "16px",
            padding: "14px 16px",
            boxShadow: theme.shadow,
            boxSizing: "border-box",
          }}
        >
          <input
            type="text"
            placeholder="Search status, level, value..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${theme.tableBorder}`,
              background: theme.inputBg,
              color: theme.textMain,
              minWidth: "240px",
              outline: "none",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${theme.tableBorder}`,
              background: theme.inputBg,
              color: theme.textMain,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="safe">Safe</option>
            <option value="warning">Warning</option>
            <option value="fire detected">Fire Detected</option>
          </select>

          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: `1px solid ${theme.tableBorder}`,
              background: theme.inputBg,
              color: theme.textMain,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="live">Live</option>
            <option value="1h">Last 1 Hour</option>
            <option value="24h">Last 24 Hours</option>
          </select>

          <button
            onClick={() => {
              setSearchText("");
              setStatusFilter("all");
              setTimeFilter("live");
            }}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              background: "#3b82f6",
              color: "#ffffff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reset
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr 1fr",
            gap: "16px",
          }}
        >
          <GaugeCard value={intensityPercent} theme={theme} />
          <SignalStrengthCard value={signalStrength} theme={theme} />
          <ChartCard chartData={filteredChartData} theme={theme} />
          <AlertsCard alerts={alerts} theme={theme} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
            marginTop: "16px",
          }}
        >
          <LiveTableCard rows={filteredRows} theme={theme} />
        </div>

        <div
          style={{
            marginTop: "16px",
            background: theme.cardBg,
            borderRadius: "24px",
            padding: "20px",
            border: "4px solid #3b82f6",
            boxSizing: "border-box",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "14px",
              fontWeight: 600,
              color: theme.textMain,
            }}
          >
            Past Fire Detection History
          </h3>
          <div style={{ fontSize: "22px", color: theme.textSoft }}>
            {historyText}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.pageBg,
        padding: "16px",
        color: theme.textMain,
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1380px",
          margin: "0 auto",
          background: theme.shellBg,
          borderRadius: "28px",
          overflow: "hidden",
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <aside
            style={{
              width: "78px",
              background: theme.sidebarBg,
              padding: "20px 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: mode === "dark" ? "white" : "#111827",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "26px",
                alignItems: "center",
                width: "100%",
              }}
            >
              <SidebarItem
                icon={Home}
                label="HOME"
                active={activePage === "home"}
                theme={theme}
                onClick={() => setActivePage("home")}
              />
              <SidebarItem
                icon={Gauge}
                label="GAS"
                active={activePage === "gas"}
                theme={theme}
                onClick={() => setActivePage("gas")}
              />
              <SidebarItem
                icon={Refrigerator}
                label="Fridge"
                active={activePage === "fridge"}
                theme={theme}
                onClick={() => setActivePage("fridge")}
              />
              <SidebarItem
                icon={Flame}
                label="Fire"
                active={activePage === "fire"}
                theme={theme}
                onClick={() => setActivePage("fire")}
              />
              <SidebarItem
                icon={Droplets}
                label="Humidity"
                active={activePage === "humidity"}
                theme={theme}
                onClick={() => setActivePage("humidity")}
              />
            </div>
          </aside>

          <main style={{ flex: 1, background: theme.mainBg }}>
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: `1px solid ${theme.headerBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  color: theme.textMain,
                }}
              >
                Smart Kitchen Monitoring System
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                }}
              >
                <span style={{ fontSize: "14px", color: theme.textSoft }}>
                  cafe 99 &amp; Banana Brothers
                </span>
                <Bell size={20} color={theme.textMain} />
              </div>
            </header>

            <div style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 500,
                    color: theme.textMain,
                  }}
                >
                  {activePage === "fire"
                    ? "Fire Level Monitoring"
                    : `${activePage.toUpperCase()} Dashboard`}
                </h2>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      borderRadius: "999px",
                      background: theme.pillBg,
                      padding: "10px 16px",
                      fontSize: "14px",
                      color: theme.textMain,
                    }}
                  >
                    Status :{" "}
                    <span style={{ color: "#4ade80" }}>{esp32Status}</span>
                  </div>

                  <button
                    onClick={() => setMode(mode === "dark" ? "light" : "dark")}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px",
                      borderRadius: "50%",
                    }}
                  >
                    {mode === "dark" ? (
                      <Moon size={24} color={theme.textMain} />
                    ) : (
                      <Sun size={24} color={theme.textMain} />
                    )}
                  </button>
                </div>
              </div>

              {renderPageContent()}

              <BottomStatus
                esp32Status={esp32Status}
                lastUpdate={lastUpdate}
                wifiStrength={wifiStrength}
                dateTime={dateTime}
                cloudConnected={cloudConnected}
                theme={theme}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}