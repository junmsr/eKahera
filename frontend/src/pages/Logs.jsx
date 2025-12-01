import React, { useEffect, useMemo, useState, useRef } from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import { BiRefresh } from "react-icons/bi";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import { api, authHeaders } from "../lib/api";

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError("");
      const token = sessionStorage.getItem("auth_token");
      const data = await api("/api/logs", {
        headers: authHeaders(token),
      });
      const normalized = (data || []).map((l) => ({
        id: l.log_id,
        userId: l.user_id,
        username: l.username || "",
        action: l.action || `Action by ${l.username || l.user_id}`,
        time: l.date_time
          ? new Date(l.date_time).toLocaleString()
          : "Invalid date",
        dateTime: l.date_time,
        role: (l.role === "business_owner"
          ? "admin"
          : l.role || ""
        ).toLowerCase(),
      }));
      setLogs(normalized);
    } catch (err) {
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (roleFilter !== "all") {
      filtered = filtered.filter((l) => l.role === roleFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.action || "").toLowerCase().includes(query) ||
          (l.username || "").toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [logs, roleFilter, searchQuery, sortOrder]);

  const exportToCSV = () => {
    try {
      const headers = ["User ID", "Username", "Role", "Action", "Time"];

      const csvRows = [
        headers.join(","),
        ...filteredLogs.map((log) => {
          const row = [
            log.userId || log.id || "",
            `"${(log.username || "").replace(/"/g, '""')}"`,
            log.role || "",
            `"${(log.action || "").replace(/"/g, '""')}"`,
            `"${(log.time || "").replace(/"/g, '""')}"`,
          ];
          return row.join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");

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

      try {
        await api("/api/logs", {
          method: "DELETE",
          headers: authHeaders(token),
        });
      } catch (deleteErr) {
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

      await fetchLogs();
    } catch (err) {
      setError("Failed to clear logs");
    } finally {
      setClearing(false);
    }
  };

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "cashier", label: "Cashier" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
  ];

  const selectedRole = roleOptions.find(
    (option) => option.value === roleFilter
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={fetchLogs}
        disabled={loading}
        title="Refresh Logs"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md"
      >
        <BiRefresh className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
      </button>

      <Button
        onClick={exportToCSV}
        variant="secondary"
        size="md"
        className="flex items-center gap-2"
        disabled={filteredLogs.length === 0 || loading}
      >
        Export
      </Button>
    </div>
  );

  return (
    <PageLayout
      title="LOGS"
      sidebar={<NavAdmin />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="h-screen overflow-hidden"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-4 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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

          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto pl-4 pr-10 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{selectedRole.icon}</span>
                  <span>{selectedRole.label}</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setRoleFilter(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors duration-150 ${
                        roleFilter === option.value
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700"
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
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
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              Sort ({sortOrder === "asc" ? "Oldest" : "Newest"})
            </Button>
            <Button
              onClick={exportToCSV}
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
              disabled={filteredLogs.length === 0 || loading}
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="min-w-full bg-white/80 backdrop-blur-md rounded-xl overflow-hidden hidden sm:table">
            <thead className="bg-gray-100/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {log.userId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.role === "admin" || log.role === "business_owner"
                            ? "bg-purple-100 text-purple-800"
                            : log.role === "cashier"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.time}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile Card View */}
        <div className="flex-1 overflow-y-auto sm:hidden space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 animate-pulse"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white/80 backdrop-blur-md rounded-xl">
              No logs found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200/50 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {log.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {log.userId}
                    </div>
                  </div>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                      log.role === "admin" || log.role === "business_owner"
                        ? "bg-purple-100 text-purple-800"
                        : log.role === "cashier"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {log.role}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-2">{log.action}</p>
                <div className="text-xs text-gray-500 text-right border-t border-gray-200/50 pt-2 mt-2">
                  {log.time}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-2 mt-4">
            <svg
              className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-sm font-medium text-red-700">
              {(() => {
                try {
                  const parsed = JSON.parse(error);
                  return parsed.error || parsed.message || error;
                } catch {
                  return error;
                }
              })()}
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default LogsPage;
