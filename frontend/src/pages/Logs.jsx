import React, { useEffect, useMemo, useState } from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import PageLayout from "../components/layout/PageLayout";
import LogsCard from "../components/ui/ContainerLogs/LogsCard";
import { api } from "../lib/api";

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");


  const searchBarStyle = {
    width: "100%",
    padding: "0.75rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setError("");
        const token = localStorage.getItem("auth_token");
        const data = await api("/api/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Normalize logs for UI
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

  const filteredCashierLogs = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    if (!query) return cashierLogs;
    return cashierLogs.filter((l) => (l.action || "").toLowerCase().includes(query));
  }, [cashierLogs, searchQuery]);

  const filteredAdminLogs = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    if (!query) return adminLogs;
    return adminLogs.filter((l) => (l.action || "").toLowerCase().includes(query));
  }, [adminLogs, searchQuery]);

  return (
    <PageLayout
      title="LOGS"
      subtitle="System activity and transaction logs"
      sidebar={<NavAdmin />}
      className="h-screen overflow-hidden"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-4">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchBarStyle}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LogsCard title="CASHIER" logs={filteredCashierLogs} />
          <LogsCard title="ADMIN" logs={filteredAdminLogs} />
        </div>
        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default LogsPage;
