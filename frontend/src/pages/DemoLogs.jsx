import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import DemoNav from "../components/layout/DemoNav";
import { BiRefresh, BiCalendarAlt } from "react-icons/bi";
import PageLayout from "../components/layout/PageLayout";
import Button from "../components/common/Button";
import dayjs from "dayjs";
import DateRangeFilterModal from "../components/modals/DateRangeFilterModal";

const DemoLogsPage = () => {
  const dummyLogs = [
    {
      id: 1,
      userId: 101,
      username: "Admin",
      action: "Updated inventory stock for SKU 1001",
      time: "November 1, 2024 10:30:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(0, "day")
        .hour(10)
        .minute(30)
        .toISOString(),
      role: "admin",
    },
    {
      id: 2,
      userId: 102,
      username: "cashier1",
      action: "Processed transaction #T-10023",
      time: "November 1, 2024 11:15:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(0, "day")
        .hour(11)
        .minute(15)
        .toISOString(),
      role: "cashier",
    },
    {
      id: 3,
      userId: 103,
      username: "customer1",
      action: "Placed order for Product A",
      time: "November 2, 2024 02:00:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(1, "day")
        .hour(14)
        .minute(0)
        .toISOString(),
      role: "customer",
    },
    {
      id: 4,
      userId: 104,
      username: "Admin",
      action: "Added new product 'Demo Cake'",
      time: "November 3, 2024 09:45:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(2, "day")
        .hour(9)
        .minute(45)
        .toISOString(),
      role: "admin",
    },
    {
      id: 5,
      userId: 105,
      username: "cashier2",
      action: "Refunded transaction #T-10045",
      time: "November 4, 2024 03:20:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(3, "day")
        .hour(15)
        .minute(20)
        .toISOString(),
      role: "cashier",
    },
    {
      id: 6,
      userId: 106,
      username: "customer2",
      action: "Viewed product catalog",
      time: "November 5, 2024 04:10:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(4, "day")
        .hour(16)
        .minute(10)
        .toISOString(),
      role: "customer",
    },
    {
      id: 7,
      userId: 107,
      username: "cashier3",
      action: "Applied discount code SAVE20 to transaction #T-10067",
      time: "November 6, 2024 08:30:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(5, "day")
        .hour(8)
        .minute(30)
        .toISOString(),
      role: "cashier",
    },
    {
      id: 8,
      userId: 108,
      username: "Admin",
      action: "Generated sales report for November 2024",
      time: "November 7, 2024 09:15:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(6, "day")
        .hour(9)
        .minute(15)
        .toISOString(),
      role: "admin",
    },
    {
      id: 9,
      userId: 109,
      username: "customer3",
      action: "Updated account information",
      time: "November 8, 2024 11:45:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(7, "day")
        .hour(11)
        .minute(45)
        .toISOString(),
      role: "customer",
    },
    {
      id: 10,
      userId: 110,
      username: "cashier1",
      action: "Voided transaction #T-10089 due to customer request",
      time: "November 9, 2024 02:20:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(8, "day")
        .hour(14)
        .minute(20)
        .toISOString(),
      role: "cashier",
    },
    {
      id: 11,
      userId: 111,
      username: "Admin",
      action: "Modified user permissions for cashier2",
      time: "November 10, 2024 10:00:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(9, "day")
        .hour(10)
        .minute(0)
        .toISOString(),
      role: "admin",
    },
    {
      id: 12,
      userId: 112,
      username: "customer4",
      action: "Added item to wishlist",
      time: "November 11, 2024 01:30:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(10, "day")
        .hour(13)
        .minute(30)
        .toISOString(),
      role: "customer",
    },
    {
      id: 13,
      userId: 113,
      username: "cashier3",
      action: "Processed return for transaction #T-10101",
      time: "November 12, 2024 03:45:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(11, "day")
        .hour(15)
        .minute(45)
        .toISOString(),
      role: "cashier",
    },
    {
      id: 14,
      userId: 114,
      username: "Admin",
      action: "Updated system settings",
      time: "November 13, 2024 09:30:00 AM",
      dateTime: dayjs()
        .startOf("month")
        .add(12, "day")
        .hour(9)
        .minute(30)
        .toISOString(),
      role: "admin",
    },
    {
      id: 15,
      userId: 115,
      username: "customer5",
      action: "Completed purchase of multiple items",
      time: "November 14, 2024 04:15:00 PM",
      dateTime: dayjs()
        .startOf("month")
        .add(13, "day")
        .hour(16)
        .minute(15)
        .toISOString(),
      role: "customer",
    },
  ];

  const [logs, setLogs] = useState(dummyLogs);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("day"),
    rangeType: "Month",
  });
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const dropdownRef = useRef(null);

  const headerDateDisplay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return "Select Range";

    const start = dayjs(dateRange.startDate);
    const end = dayjs(dateRange.endDate);
    const diff = end.diff(start, "day") + 1;

    if (dateRange.rangeType === "Day") {
      return start.format("MMM D, YYYY");
    } else if (dateRange.rangeType === "Week") {
      return `${start.format("MMM D")} - ${end.format(
        "MMM D, YYYY"
      )} (${diff} days)`;
    } else if (dateRange.rangeType === "Month") {
      return `${start.format("MMM YYYY")} (${diff} days)`;
    } else {
      return `${start.format("MMM D, YYYY")} - ${end.format(
        "MMM D, YYYY"
      )} (${diff} days)`;
    }
  }, [dateRange]);

  // Format timestamp with month names instead of numbers
  const formatTimestamp = (dateString) => {
    if (!dateString) return "Invalid date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    const displaySeconds = seconds.toString().padStart(2, "0");

    return `${month} ${day}, ${year} ${displayHours}:${displayMinutes}:${displaySeconds} ${ampm}`;
  };

  const fetchLogs = async () => {
    // Dummy fetch - just set loading briefly
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLogs(dummyLogs);
      setLoading(false);
    }, 500);
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
      filtered = filtered.filter((l) => {
        if (roleFilter === "customer") {
          return l.role === "user" || l.role === "customer";
        }
        return l.role === roleFilter;
      });
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          (l.action || "").toLowerCase().includes(query) ||
          (l.username || "").toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (dateRange.startDate) {
      const startDate = dayjs(dateRange.startDate).startOf("day");
      const endDate = dateRange.endDate
        ? dayjs(dateRange.endDate).endOf("day")
        : dayjs().endOf("day");

      filtered = filtered.filter((log) => {
        const logDate = dayjs(log.dateTime);
        return logDate.isBetween(startDate, endDate, null, "[]");
      });
    }

    // Sort based on sortOrder: "desc" = newest first, "asc" = oldest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [logs, roleFilter, debouncedSearchQuery, sortOrder, dateRange]);

  const exportToCSV = () => {
    try {
      // Export only the filtered logs (which already respect date range, role filter, and search query)
      const logsToExport = filteredLogs;

      if (logsToExport.length === 0) {
        setError("No logs to export for the selected date range");
        return;
      }

      const headers = [
        "Customer ID",
        "Customer Name",
        "Role",
        "Action",
        "Time",
      ];

      const csvRows = [
        headers.join(","),
        ...logsToExport.map((log) => {
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

      // Generate filename with date range if available
      let filename = `logs_export_${new Date().toISOString().split("T")[0]}`;
      if (dateRange.startDate && dateRange.endDate) {
        const startStr = dayjs(dateRange.startDate).format("YYYY-MM-DD");
        const endStr = dayjs(dateRange.endDate).format("YYYY-MM-DD");
        filename = `logs_export_${startStr}_to_${endStr}`;
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
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

    // Dummy clear - just show message
    setClearing(true);
    setError("");
    setTimeout(() => {
      setError("Clear logs feature is disabled in demo mode.");
      setClearing(false);
    }, 500);
  };

  const roleOptions = [
    { value: "all", label: "All Roles" },
    { value: "cashier", label: "Cashier" },
    { value: "admin", label: "Admin" },
    { value: "customer", label: "Customer" },
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

      <button
        onClick={() => setShowFilterModal(true)}
        disabled={loading}
        title="Select Date Range"
        className={`flex items-center gap-1 sm:gap-2 ${
          dateRange.rangeType !== "Custom"
            ? "bg-blue-50 border-blue-200"
            : "bg-white/80 border-gray-200/80"
        } backdrop-blur-sm hover:bg-white text-gray-700 px-2 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-all duration-200 hover:shadow-md`}
      >
        <BiCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
        <span className="hidden sm:inline text-left truncate max-w-[180px]">
          {headerDateDisplay}
        </span>
      </button>
    </div>
  );

  return (
    <PageLayout
      title="LOGS (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="overflow-hidden"
      headerActions={headerActions}
    >
      <div className="h-[calc(100vh-80px)] bg-transparent p-4 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
          <div className="relative flex-1 max-w-xl w-full flex-shrink-0">
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
                  <span>{selectedRole?.icon}</span>
                  <span>{selectedRole?.label}</span>
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
                      <span>{option?.icon}</span>
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

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200/50 h-[calc(100%-150px)] flex-1 min-h-0">
          <div className="h-full overflow-y-auto">
            <table className="w-full bg-white/80 backdrop-blur-md">
              <thead className="bg-gray-100/90 backdrop-blur-md sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
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
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
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
                            log.role === "admin" ||
                            log.role === "business_owner"
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
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden overflow-y-auto space-y-3 h-[calc(100%-150px)]">
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

        {/* Date Range Filter Modal */}
        <DateRangeFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onDateRangeApply={(newDateRange) => {
            setDateRange({
              startDate: newDateRange.startDate,
              endDate: newDateRange.endDate,
              rangeType: newDateRange.rangeType,
            });
            // Trigger a refetch of logs with the new date range
            fetchLogs();
          }}
        />
      </div>
    </PageLayout>
  );
};

export default DemoLogsPage;
