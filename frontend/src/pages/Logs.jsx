import React, { useEffect, useMemo, useState } from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import Background from "../components/layout/Background";
import LogsCard from "../components/ui/Logs/LogsCard";
import { api } from "../lib/api";

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setError("");
        const token = localStorage.getItem("auth_token");
        const data = await api("/api/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Normalize for UI component
        const normalized = (data || []).map((l) => ({
          id: l.log_id,
          action: l.action || `Action by ${l.username || l.user_id}`,
          time: new Date(l.date_time).toLocaleString(),
          role: (l.role || "").toLowerCase(),
        }));
        setLogs(normalized);
      } catch (err) {
        setError(err.message || "Failed to load logs");
      }
    };
    fetchLogs();
  }, []);

  const cashierLogs = useMemo(() => logs.filter((l) => l.role === "cashier"), [logs]);
  const adminLogs = useMemo(() => logs.filter((l) => l.role === "admin" || l.role === "business_owner"), [logs]);
  return (
    <Background variant="gradientBlue" pattern="dots" floatingElements overlay>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <NavAdmin />
        {/* Main Content */}
        <div className="flex-1 ml-28 flex flex-col h-screen">
          <header className="flex items-center gap-4 px-6 py-3 bg-white/80 shadow-sm border-b border-blue-100 h-[56px] min-h-[56px] max-h-[56px]">
            <span className="text-2xl font-bold text-blue-700 tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 text-white rounded-xl px-3 py-1 text-xl font-bold mr-2">
                eK
              </span>
              LOGS
            </span>
          </header>
          <main className="flex-1 bg-transparent overflow-hidden p-4">
            {error && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}
            <div style={{ display: "flex", gap: "2rem" }}>
              <LogsCard title="CASHIER" logs={cashierLogs} />
              <LogsCard title="ADMIN" logs={adminLogs} />
            </div>
          </main>
        </div>
      </div>
    </Background>
  );
};

export default LogsPage;
