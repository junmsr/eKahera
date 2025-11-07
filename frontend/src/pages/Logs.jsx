import React, { useEffect, useMemo, useState } from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import PageLayout from "../components/layout/PageLayout";
import LogsCard from "../components/ui/ContainerLogs/LogsCard";
import Button from "../components/common/Button";
import { api, authHeaders } from "../lib/api";

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("auth_token");
      const data = await api("/api/logs", {
        headers: authHeaders(token),
      });
      // Normalize logs for UI
      const normalized = (data || []).map((l) => ({
        id: l.log_id,
        userId: l.user_id,
        username: l.username || "",
        action: l.action || `Action by ${l.username || l.user_id}`,
        time: new Date(l.date_time).toLocaleString(),
        dateTime: l.date_time,
        role: (l.role || "").toLowerCase(),
      }));
      setLogs(normalized);
    } catch (err) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const cashierLogs = useMemo(
    () => logs.filter((l) => l.role === "cashier"),
    [logs]
  );
  const adminLogs = useMemo(
    () => logs.filter((l) => l.role === "admin" || l.role === "business_owner"),
    [logs]
  );
  const userLogs = useMemo(() => {
    return logs.filter((l) => {
      const role = l.role || "";
      return (
        role !== "cashier" && role !== "admin" && role !== "business_owner"
      );
    });
  }, [logs]);

  const filteredCashierLogs = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    if (!query) return cashierLogs;
    return cashierLogs.filter((l) =>
      (l.action || "").toLowerCase().includes(query)
    );
  }, [cashierLogs, searchQuery]);

  const filteredAdminLogs = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    if (!query) return adminLogs;
    return adminLogs.filter((l) =>
      (l.action || "").toLowerCase().includes(query)
    );
  }, [adminLogs, searchQuery]);

  const filteredUserLogs = useMemo(() => {
    const query = (searchQuery || "").toLowerCase();
    if (!query) return userLogs;
    return userLogs.filter((l) =>
      (l.action || "").toLowerCase().includes(query)
    );
  }, [userLogs, searchQuery]);

  // Export logs to CSV
  const exportToCSV = () => {
    try {
      // Get all logs (not filtered)
      const allLogs = [
        ...cashierLogs.map((l) => ({ ...l, category: "CASHIER" })),
        ...adminLogs.map((l) => ({ ...l, category: "ADMIN" })),
        ...userLogs.map((l) => ({ ...l, category: "USER" })),
      ];

      // Sort by date time (newest first)
      allLogs.sort((a, b) => {
        const dateA = new Date(a.dateTime || a.time);
        const dateB = new Date(b.dateTime || b.time);
        return dateB - dateA;
      });

      // Create CSV headers
      const headers = [
        "Category",
        "User ID",
        "Username",
        "Role",
        "Action",
        "Time",
      ];

      // Create CSV rows
      const csvRows = [
        headers.join(","),
        ...allLogs.map((log) => {
          const row = [
            log.category || "",
            log.userId || log.id || "",
            `"${(log.username || "").replace(/"/g, '""')}"`,
            log.role || "",
            `"${(log.action || "").replace(/"/g, '""')}"`,
            `"${(log.time || "").replace(/"/g, '""')}"`,
          ];
          return row.join(",");
        }),
      ];

      // Create CSV content
      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `logs_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to export logs as CSV");
      console.error("CSV export error:", err);
    }
  };

  // Clear all logs
  const clearLogs = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all logs? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setClearing(true);
      setError("");
      const token = sessionStorage.getItem("auth_token");

      // Try to call delete endpoint, if it doesn't exist, we'll handle it gracefully
      try {
        await api("/api/logs", {
          method: "DELETE",
          headers: authHeaders(token),
        });
      } catch (deleteErr) {
        // If endpoint doesn't exist, show a message
        if (
          deleteErr.message.includes("404") ||
          deleteErr.message.includes("Not Found")
        ) {
          setError(
            "Clear logs endpoint not available. Please contact administrator."
          );
          return;
        }
        throw deleteErr;
      }

      // Refresh logs after clearing
      await fetchLogs();
    } catch (err) {
      setError(err.message || "Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  return (
    <PageLayout
      title="LOGS"
      subtitle="System activity and transaction logs"
      sidebar={<NavAdmin />}
      className="h-screen overflow-hidden"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-4">
        {/* Search and Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Modern Search Bar */}
          <div className="relative flex-1 max-w-xl w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Button
              onClick={fetchLogs}
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
              disabled={loading}
            >
              <svg
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button
              onClick={exportToCSV}
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
              disabled={logs.length === 0 || loading}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as CSV
            </Button>
            <Button
              onClick={clearLogs}
              variant="danger"
              size="md"
              className="flex items-center gap-2"
              disabled={logs.length === 0 || loading || clearing}
            >
              {clearing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Clearing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear Logs
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Logs Grid - 3 columns on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <LogsCard title="CASHIER" logs={filteredCashierLogs} />
          <LogsCard title="ADMIN" logs={filteredAdminLogs} />
          <LogsCard title="USER" logs={filteredUserLogs} />
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default LogsPage;
