// Dashboard.jsx — Part 1/3 (start)
import React, { useState, useEffect, useMemo, useRef } from "react";
import { api, authHeaders } from "../lib/api";
import dayjs from "dayjs"; 
import minMax from "dayjs/plugin/minMax";
import html2canvas from "html2canvas";
import jsPDF from "jspdf"; 

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { useAuth } from "../hooks/useAuth";

// Components
import PageLayout from "../components/layout/PageLayout";
import NavAdmin from "../components/layout/Nav-Admin";
import ChartCard from "../components/ui/Dashboard/ChartCard";
import DashboardStatsCard from "../components/ui/Dashboard/DashboardStatsCard";
import DashboardBusinessReport from "../components/ui/Dashboard/DashboardBusinessReport";
import Button from "../components/common/Button";
import { BiBell, BiRefresh, BiCalendarAlt } from "react-icons/bi";
import NotificationDropdown from "../components/common/NotificationDropdown";
import DateRangeFilterModal from "../components/modals/DateRangeFilterModal";

// Extend the minMax plugin globally for this file
dayjs.extend(minMax);

// Constants
const BLUE_COLORS = ["#2563eb", "#60a5fa", "#93c5fd", "#dbeafe"]; // Blue shades
const SOFT_BLUE = "#3b82f6"; // Tailwind blue-500/600 for lines/accents
const SOFT_GREEN = "#10b981"; // Retain green for profit
const SOFT_PURPLE = "#8b5cf6"; // Retain purple/accent for pie chart variation
const TODAY_START = dayjs().startOf("day");
const TODAY_END = dayjs().endOf("day");

function VisitorsChart({ data, className = "", rangeType = "Custom" }) {
  const getChartTitle = (rangeType) => {
    switch (rangeType) {
      case "Day":
        return "Customer's Transactions for Today";
      case "Week":
        return "Customer's Transactions for 7 days";
      case "Month":
        return "Customer's Transactions for Month";
      case "Custom":
      default:
        return "Customer's Transactions for the selected range";
    }
  };

  return (
    <ChartCard
      title={<span className="text-blue-700">{getChartTitle(rangeType)}</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#374151", fontSize: 14 }} />
            <YAxis tick={{ fill: "#374151", fontSize: 14 }} />
            <Tooltip
              contentStyle={{
                background: "#fff",
                borderColor: "#e5e7eb",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={SOFT_BLUE}
              strokeWidth={3}
              dot={{ r: 5, fill: SOFT_BLUE }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function SalesPieChart({ data, className = "" }) {
  return (
    <ChartCard
      title={<span className="text-blue-700">Sales by Product Category</span>}
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl ${className}`}
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#374151", fontSize: 12 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fill: "#374151", fontSize: 12 }} />
            <Tooltip
              formatter={(value, name, props) => [
                Number(value).toLocaleString(),
                props?.payload?.name,
              ]}
              contentStyle={{
                background: "#fafafa",
                borderColor: SOFT_PURPLE,
                borderRadius: 8,
              }}
            />
            <Legend />
            <Bar dataKey="value" fill={SOFT_BLUE} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [keyMetrics, setKeyMetrics] = useState({
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    grossMargin: 0,
    totalTransactions: 0,
    totalItemsSold: 0,
    averageTransactionValue: 0,
  });

  // State
  const [stats, setStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf("month"),
    endDate: dayjs().endOf("day"),
    rangeType: "Month",
  });
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef(null);
  const { logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [todayHighlight, setTodayHighlight] = useState({
    sales: 0,
    transactions: 0,
    topProduct: "-",
    totalItemsSold: 0,
    averageTransactionValue: 0,
  });
  const [exportingPDF, setExportingPDF] = useState(false);

  // Refs for PDF export
  const dashboardRef = useRef(null);
  const visitorsChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const keyMetricsRef = useRef(null);
  const businessReportRef = useRef(null);

  // Helper function to detect modern CSS color functions
  const hasModernColor = (val = "") => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return (
      lower.includes("oklab") ||
      lower.includes("oklch") ||
      lower.includes("color(") ||
      lower.includes("color-mix") ||
      lower.includes("lab(") ||
      lower.includes("lch(") ||
      lower.includes("hwb(")
    );
  };

  // Normalize any CSS color string to a safe RGB/HEX; returns fallback when unsupported
  const normalizeToRGB = (() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    return (value, fallback = "#ffffff") => {
      if (!value) return fallback;
      try {
        ctx.fillStyle = value;
        return ctx.fillStyle || fallback;
      } catch (_) {
        return fallback;
      }
    };
  })();

  // Fetch Today's data (independent of the main filter)
  useEffect(() => {
    const fetchTodayData = async () => {
      try {
        const token = sessionStorage.getItem("auth_token");
        const todayStr = dayjs().format("YYYY-MM-DD");

        const overview = await api("/api/dashboard/overview", {
          headers: authHeaders(token),
          params: { startDate: todayStr, endDate: todayStr },
        });

        if (overview) {
          setTodayHighlight({
            sales: overview.totalSales || 0,
            transactions: overview.totalTransactions || 0,
            totalItemsSold: overview.totalItemsSold || 0,
            averageTransactionValue: overview.averageTransactionValue || 0,
            topProduct: overview.topProducts?.[0]?.product_name || "-",
          });
        }
      } catch (err) {
        console.error("Failed to fetch today's data", err);
      }
    };
    fetchTodayData();
  }, []);
// Dashboard.jsx — Part 2/3 (middle)
  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch (e) {
      return {};
    }
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Data fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("auth_token");

      const { startDate, endDate, rangeType } = dateRange;

      const formatDate = (date) => dayjs(date).format("YYYY-MM-DD");

      const finalStart = dayjs.min(startDate, endDate);
      const finalEnd = dayjs.max(startDate, endDate);

      const startDateStr = formatDate(finalStart);
      const endDateStr = formatDate(finalEnd);

      console.log("Fetching data for date range:", {
        rangeType,
        formattedStart: startDateStr,
        formattedEnd: endDateStr,
      });

      const [overview, timeseries, pie, oldLowStock] = await Promise.all([
        api("/api/dashboard/overview", {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api(`/api/stats/customers-timeseries`, {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api("/api/stats/sales-by-category", {
          headers: authHeaders(token),
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        }),
        api("/api/products/low-stock", { headers: authHeaders(token) }),
      ]);

      const derived = (timeseries || []).map((d) => ({
        ...d,
        name: d.date || d.name,
        value: Number(d.customers || d.total || d.value || 0),
      }));

      const pieTotal =
        (pie || []).reduce((s, p) => s + Number(p.value || 0), 0) || 1;
      const piePercent = (pie || []).map((p) => ({
        ...p,
        percent: (Number(p.value || 0) / pieTotal) * 100,
      }));

      if (overview) {
        const revenue = Number(overview.totalSales || 0);
        const expenses = Number(overview.totalExpenses || 0);
        const netProfit = revenue - expenses;
        const grossMargin =
          revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
        const totalTransactions = Number(overview.totalTransactions || 0);
        const totalItemsSold = Number(overview.totalItemsSold || 0);
        const avgTxValue = Number(
          overview.averageTransactionValue || revenue / (totalTransactions || 1)
        );
        const topProduct = overview.topProducts?.[0]?.product_name || "-";

        setKeyMetrics({
          revenue,
          expenses,
          netProfit,
          grossMargin,
          totalTransactions,
          totalItemsSold,
          averageTransactionValue: avgTxValue,
        });

        const dateRangeText =
          rangeType === "Day"
            ? finalStart.format("MMM D, YYYY")
            : `${finalStart.format("MMM D")} - ${finalEnd.format(
                "MMM D, YYYY"
              )}`;

        const salesLabel =
          rangeType === "Day"
            ? "Daily Sales"
            : rangeType === "Week"
            ? "7-Day Sales"
            : rangeType === "Month"
            ? "Monthly Sales"
            : "Total Sales";
        const transactionsLabel =
          rangeType === "Day"
            ? "Daily Transactions"
            : rangeType === "Week"
            ? "7-Day Transactions"
            : rangeType === "Month"
            ? "Monthly Transactions"
            : "Total Transactions";

        setStats([
          {
            label: salesLabel,
            value: `₱${revenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            subtext: dateRangeText,
          },
          {
            label: transactionsLabel,
            value: totalTransactions,
            subtext: `${dateRangeText}`,
          },
          {
            label: "Top Product",
            value: topProduct,
            subtext: `Total: ${
              overview.topProducts?.[0]?.total_sold || 0
            } sold`,
          },
          {
            label: "Items Sold",
            value: totalItemsSold,
            subtext: `${totalTransactions} transactions`,
          },
        ]);
      }

      setChartData(derived);
      setPieData(piePercent);

      const lowStock = oldLowStock || [];
      setLowStockProducts(lowStock);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = sessionStorage.getItem("auth_token");
      const resp = await api("/api/logs", { headers: authHeaders(token) });
      const readIds = new Set(
        JSON.parse(sessionStorage.getItem("read_notif_ids") || "[]")
      );
      const deletedIds = new Set(
        JSON.parse(sessionStorage.getItem("deleted_notif_ids") || "[]")
      );
      const mapped = (resp || [])
        .filter((log) => !deletedIds.has(log.log_id))
        .map((log) => ({
          id: log.log_id,
          title: log.action,
          message: `${log.username} (${log.role}) did an action: ${log.action}`,
          time: dayjs(log.date_time).format("MMM D, h:mm A"),
          isRead: readIds.has(log.log_id),
        }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const handleMarkAsRead = (id) => {
    const readIds = JSON.parse(
      sessionStorage.getItem("read_notif_ids") || "[]"
    );
    if (!readIds.includes(id)) {
      sessionStorage.setItem(
        "read_notif_ids",
        JSON.stringify([...readIds, id])
      );
    }
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDeleteNotification = (id) => {
    const deletedIds = JSON.parse(
      sessionStorage.getItem("deleted_notif_ids") || "[]"
    );
    sessionStorage.setItem(
      "deleted_notif_ids",
      JSON.stringify([...deletedIds, id])
    );
    setNotifications((notifs) => notifs.filter((n) => n.id !== id));
    const notif = notifications.find((n) => n.id === id);
    if (notif && !notif.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleMarkAsUnread = (id) => {
    const readIds = JSON.parse(
      sessionStorage.getItem("read_notif_ids") || "[]"
    );
    const filtered = readIds.filter((rid) => rid !== id);
    sessionStorage.setItem("read_notif_ids", JSON.stringify(filtered));
    setNotifications((notifs) =>
      notifs.map((n) => (n.id === id ? { ...n, isRead: false } : n))
    );
    setUnreadCount((c) => c + 1);
  };

  // Robust captureElement that clones and copies computed styles safely (forces RGB colors and strips unsupported effects)
  const captureElement = async (element) => {
    if (!element) return null;

    const normalizeColor = (() => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      return (value, fallback = "#ffffff") => {
        if (!value) return fallback;
        try {
          ctx.fillStyle = value;
          return ctx.fillStyle || fallback;
        } catch (_) {
          return fallback;
        }
      };
    })();

    // Using the top-level hasModernColor function

    const shouldStripBackgroundImage = (value) => {
      if (!value || value === "none") return false;
      const lower = value.toLowerCase();
      return (
        lower.includes("gradient") ||
        lower.includes("image-set") ||
        hasModernColor(lower)
      );
    };

    const stripProps = new Set([
      "box-shadow",
      "filter",
      "backdrop-filter",
      "mix-blend-mode",
      "text-shadow",
    ]);

    const colorProps = new Set([
      "color",
      "background-color",
      "border-color",
      "outline-color",
      "text-decoration-color",
      "column-rule-color",
      "caret-color",
      "accent-color",
      "fill",
      "stroke",
    ]);

    const copyComputedStyles = (source, target) => {
      const computed = window.getComputedStyle(source);

      for (const prop of computed) {
        if (prop.startsWith("--")) continue; // drop CSS variables that may carry modern colors
        if (prop === "background-image" || prop === "background" || prop === "border-image") continue;

        let value = computed.getPropertyValue(prop);
        const priority = computed.getPropertyPriority(prop);

        if (hasModernColor(value) && !colorProps.has(prop)) {
          continue; // skip unsupported color functions on non-color props
        }

        if (colorProps.has(prop)) {
          value = normalizeColor(value, value);
        }

        if (stripProps.has(prop)) {
          value = prop === "mix-blend-mode" ? "normal" : "none";
        }

        target.style.setProperty(prop, value, priority);
      }

      // Force safe backgrounds and borders
      target.style.backgroundColor = normalizeColor(computed.getPropertyValue("background-color"), "#ffffff");
      target.style.backgroundImage = "none";
      target.style.background = normalizeColor(computed.getPropertyValue("background-color"), "#ffffff");
      target.style.borderColor = normalizeColor(computed.getPropertyValue("border-color"), "transparent");
      target.style.boxShadow = "none";
      target.style.filter = "none";
      target.style.mixBlendMode = "normal";
      target.style.textShadow = "none";

      const rect = source.getBoundingClientRect();
      target.style.width = `${rect.width}px`;
      target.style.height = `${rect.height}px`;
      target.style.boxSizing = computed.getPropertyValue("box-sizing") || "border-box";
    };

    const clone = element.cloneNode(true);

    const origNodes = [element, ...Array.from(element.querySelectorAll("*"))];
    const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
    const len = Math.min(origNodes.length, cloneNodes.length);

    for (let i = 0; i < len; i++) {
      try {
        copyComputedStyles(origNodes[i], cloneNodes[i]);
      } catch {
        // Best-effort; skip nodes that fail style copying
      }
    }

    // Sanitize SVG/HTML attributes that may carry modern color functions
    const sanitizeAttributes = (node) => {
      if (!(node instanceof Element)) return;
      const attrs = Array.from(node.attributes || []);
      for (const attr of attrs) {
        const name = attr.name;
        const value = attr.value || "";
        if (hasModernColor(value)) {
          if (
            name === "fill" ||
            name === "stroke" ||
            name === "stop-color" ||
            name === "color"
          ) {
            node.setAttribute(name, normalizeColor(value, "#000000"));
          } else {
            node.removeAttribute(name);
          }
        }
        if (name === "style" && hasModernColor(value)) {
          node.removeAttribute("style");
        }
      }
      // For SVG gradients/defs, disable by forcing fill/stroke to currentColor
      if (node.tagName === "linearGradient" || node.tagName === "radialGradient") {
        node.parentNode && node.parentNode.removeChild(node);
      }
      if (node.tagName === "stop" && node.hasAttribute("stop-color")) {
        node.setAttribute(
          "stop-color",
          normalizeColor(node.getAttribute("stop-color"), "#000000")
        );
      }
    };

    clone.querySelectorAll("*").forEach(sanitizeAttributes);
    sanitizeAttributes(clone);

    const sandbox = document.createElement("div");
    sandbox.style.position = "absolute";
    sandbox.style.left = "-9999px";
    sandbox.style.top = "0";
    sandbox.style.zIndex = "-9999";
    sandbox.style.background = normalizeColor(
      window.getComputedStyle(element).backgroundColor,
      "#ffffff"
    );
    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const canvas = await html2canvas(clone, {
      useCORS: true,
      scale: 2,
      backgroundColor: "#ffffff",
      allowTaint: true,
    });

    document.body.removeChild(sandbox);

    return canvas.toDataURL("image/png");
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const element = document.getElementById("pdf-wrapper");
      if (!element) throw new Error("Dashboard content not found");

      // Create a clone of the element to avoid affecting the original
      const clone = element.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);

      // Create a header with business information
      const header = document.createElement('div');
      header.style.padding = '15px 20px';
      header.style.backgroundColor = '#1a365d';
      header.style.color = 'white';
      header.style.borderBottom = '2px solid #2c5282';
      
      // Format the date range
      const { startDate, endDate, rangeType } = dateRange;
      const formatDate = (date) => dayjs(date).format('MMM D, YYYY');
      const dateRangeText = rangeType === 'Day' 
        ? formatDate(startDate)
        : `${formatDate(startDate)} - ${formatDate(endDate)}`;
      
      // Business information (you can customize these values)
      const businessInfo = {
        name: "eKahera Business",
        address: "123 Business St, City, Country",
        contact: "contact@ekahera.com | +1 234 567 890"
      };

      header.innerHTML = `
        <div style="max-width: 100%; color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: white;">${businessInfo.name}</h1>
            <div style="text-align: right;">
              <div style="font-size: 14px; color: #a0aec0;">Report Period</div>
              <div style="font-weight: 600; font-size: 16px;">${dateRangeText}</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e0;">
            <div>${businessInfo.address}</div>
            <div>${businessInfo.contact}</div>
          </div>
        </div>
      `;

      // Create a summary section
      const summarySection = document.createElement('div');
      summarySection.style.padding = '15px';
      summarySection.style.backgroundColor = '#f7fafc';
      summarySection.style.borderBottom = '1px solid #e2e8f0';
      summarySection.style.marginBottom = '20px';
      
      // Add key metrics to the summary
      summarySection.innerHTML = `
        <h3 style="margin: 0 0 10px 0; color: #2d3748; font-size: 18px;">Key Metrics Summary</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #718096;">Total Revenue</div>
            <div style="font-size: 20px; font-weight: 600; color: #2b6cb0;">${formatCurrency(keyMetrics.revenue)}</div>
          </div>
          <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #718096;">Total Transactions</div>
            <div style="font-size: 20px; font-weight: 600; color: #2f855a;">${keyMetrics.totalTransactions}</div>
          </div>
          <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #718096;">Items Sold</div>
            <div style="font-size: 20px; font-weight: 600; color: #b7791f;">${keyMetrics.totalItemsSold}</div>
          </div>
          <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #718096;">Net Profit</div>
            <div style="font-size: 20px; font-weight: 600; color: #2c5282;">${formatCurrency(keyMetrics.netProfit)}</div>
          </div>
        </div>
      `;

      // Insert the header and summary at the top of the clone
      clone.insertBefore(summarySection, clone.firstChild);
      clone.insertBefore(header, clone.firstChild);

      // Add a footer with page numbers
      const footer = document.createElement('div');
      footer.style.padding = '10px';
      footer.style.backgroundColor = '#f7fafc';
      footer.style.borderTop = '1px solid #e2e8f0';
      footer.style.textAlign = 'center';
      footer.style.fontSize = '10px';
      footer.style.color = '#718096';
      footer.innerText = `Page 1 of 1 • Generated on ${new Date().toLocaleString()}`;
      clone.appendChild(footer);

      // Process all elements for modern color functions
      const allElements = clone.querySelectorAll('*');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        
        // Process background and color properties
        ['background', 'background-color', 'color', 'border', 'border-color'].forEach(prop => {
          try {
            const value = style.getPropertyValue(prop);
            if (value && hasModernColor(value)) {
              el.style.setProperty(prop, 'transparent', 'important');
            }
          } catch (e) {
            console.warn(`Error processing ${prop}:`, e);
          }
        });
      });

      // Capture chart areas separately to ensure they render inside the PDF
      const liveCharts = Array.from(document.querySelectorAll(".chart-export-container"));
      const chartSnapshots = [];
      const chartRestorers = [];
      const sanitizeChartNode = (root) => {
        const colorProps = [
          "color",
          "background-color",
          "border-color",
          "outline-color",
          "text-decoration-color",
          "column-rule-color",
          "caret-color",
          "accent-color",
          "fill",
          "stroke",
        ];
        const extraProps = [
          "background",
          "background-image",
          "border",
          "border-top-color",
          "border-right-color",
          "border-bottom-color",
          "border-left-color",
          "box-shadow",
          "text-shadow",
          "outline-color",
        ];
        const restores = [];
        const normalizeOrStrip = (node, prop, value, priority) => {
          if (!value) return;
          const lower = value.toLowerCase();
          const isGradient = lower.includes("gradient") || lower.includes("image-set");
          if (hasModernColor(lower) || isGradient) {
            const prev = node.style.getPropertyValue(prop);
            restores.push(() => node.style.setProperty(prop, prev || "", priority));
            if (prop.includes("background")) {
              node.style.setProperty(prop, "none", "important");
            } else if (prop.includes("shadow")) {
              node.style.setProperty(prop, "none", "important");
            } else if (prop.includes("border")) {
              node.style.setProperty(prop, normalizeToRGB(value, "#e5e7eb"), "important");
            } else {
              node.style.setProperty(prop, normalizeToRGB(value, "#1f2937"), "important");
            }
          }
        };
        const processNode = (node) => {
          if (!(node instanceof Element)) return;
          const style = window.getComputedStyle(node);
          colorProps.forEach((prop) => {
            const val = style.getPropertyValue(prop);
            if (hasModernColor(val)) {
              const prev = node.style.getPropertyValue(prop);
              restores.push(() => node.style.setProperty(prop, prev || "", style.getPropertyPriority(prop)));
              node.style.setProperty(prop, normalizeToRGB(val, prop.includes("background") ? "#ffffff" : "#1f2937"), "important");
            }
          });
          [...extraProps].forEach((prop) => {
            const val = style.getPropertyValue(prop);
            normalizeOrStrip(node, prop, val, style.getPropertyPriority(prop));
          });
        };
        processNode(root);
        root.querySelectorAll("*").forEach(processNode);
        return () => restores.reverse().forEach((fn) => fn());
      };

      for (const chartNode of liveCharts) {
        let restoreFn = null;
        try {
          restoreFn = sanitizeChartNode(chartNode);
          chartRestorers.push(restoreFn);
          const rect = chartNode.getBoundingClientRect();
          const chartCanvas = await html2canvas(chartNode, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
          });
          chartSnapshots.push({
            dataUrl: chartCanvas.toDataURL("image/png"),
            width: rect.width,
            height: rect.height,
          });
        } catch (e) {
          console.warn("Chart capture failed, falling back to default capture", e);
          chartSnapshots.push(null);
        } finally {
          if (restoreFn) restoreFn();
        }
      }

      // Replace chart containers in the cloned DOM with static images
      const cloneCharts = Array.from(clone.querySelectorAll(".chart-export-container"));
      cloneCharts.forEach((chartNode, idx) => {
        const snapshot = chartSnapshots[idx];
        if (!snapshot || !snapshot.dataUrl) return;
        chartNode.innerHTML = "";
        const img = document.createElement("img");
        img.src = snapshot.dataUrl;
        img.style.width = `${snapshot.width}px`;
        img.style.height = `${snapshot.height}px`;
        img.style.objectFit = "contain";
        img.style.display = "block";
        img.setAttribute("alt", "Chart snapshot");
        chartNode.appendChild(img);
      });

      // Add a small delay to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        removeContainer: true,
        onclone: (clonedDoc) => {
          document.fonts.ready.then(() => {});
        }
      });

      // Remove the clone
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 10, 10, pdfWidth, pdfHeight);
      
      // Set PDF metadata
      const fileName = `eKahera-Report-${dateRange.rangeType}-${dayjs().format('YYYY-MM-DD')}.pdf`;
      pdf.setProperties({
        title: `eKahera Business Report - ${dateRange.rangeType} (${dateRangeText})`,
        subject: `Business Performance Report - ${dateRangeText}`,
        author: 'eKahera Business Intelligence',
        creator: 'eKahera System',
        keywords: 'business,report,sales,metrics,performance'
      });
      
      // Add a watermark (optional)
      pdf.setFontSize(60);
      pdf.setTextColor(240, 240, 240);
      pdf.text('eKahera', 35, 150, { angle: 45 });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Save the PDF
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to generate PDF report. Please try again or contact support.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Fetch filtered data when dateRange changes
  useEffect(() => {
    fetchData();
    fetchNotifications();
  }, [dateRange]);

  // Helper function to format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // New handler to receive selected dates from modal
  const handleDateRangeApply = (newRange) => {
    setDateRange(newRange);
  };

  const headerDateDisplay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return "Select Range";

    const finalStart = dayjs.min(dateRange.startDate, dateRange.endDate);
    const finalEnd = dayjs.max(dateRange.startDate, dateRange.endDate);

    return `${finalStart.format("MMM D")} - ${finalEnd.format("MMM D, YYYY")}`;
  }, [dateRange]);

  // Header actions - REMOVED SELECT DROPDOWN
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={fetchData}
        disabled={loading}
        title="Refresh Data"
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 p-1.5 sm:p-2 rounded-lg border border-gray-200/80 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] shrink-0"
      >
        <BiRefresh
          className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`}
        />
      </button>

      {/* NEW CALENDAR BUTTON */}
      <button
        onClick={() => setShowFilterModal(true)}
        disabled={loading}
        title="Select Date Range"
        className="flex items-center gap-1 sm:gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-700 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200/80 text-xs sm:text-sm font-medium transition-all duration-200 outline-none cursor-pointer hover:shadow-md hover:scale-[1.02] shrink-0"
      >
        <BiCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{headerDateDisplay}</span>
      </button>

      <div className="py-2 flex justify-end gap-2">
        <Button
          onClick={exportToPDF}
          disabled={exportingPDF || loading}
          size="sm"
          variant="primary"
          className="flex items-center gap-2 w-full sm:w-auto shrink-0"
        >
          {exportingPDF ? (
            <>
              <BiRefresh className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Exporting...</span>
              <span className="sm:hidden">...</span>
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
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </Button>
      </div>

      <div className="relative" ref={notificationRef}>
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAsUnread={handleMarkAsUnread}
          onDelete={handleDeleteNotification}
          isOpen={showNotifications}
          onToggle={() => setShowNotifications(!showNotifications)}
          containerRef={notificationRef}
        />
      </div>
    </div>
  );

  return (
    <PageLayout
      title="DASHBOARD"
      subtitle=""
      sidebar={<NavAdmin />}
      headerActions={headerActions}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50 min-h-screen"
    >
      {/* Wrap dashboard content in a stable wrapper we can capture */}
      <div id="pdf-wrapper" ref={dashboardRef}>
        {/* Low Stock Products - Mobile View (Added padding class p-6-safe) */}
        <div className="p-4 lg:hidden">
          {loading ? (
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Low Stock Products
                </h3>
              </div>
              <LowStockList lowStockProducts={lowStockProducts} />
            </div>
          )}
        </div>

        {/* Key Metrics Cards - Optimized for all screens */}
        <div ref={keyMetricsRef} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full px-4 sm:px-6 md:px-8 py-2">
          {/* Card 1: Total Revenue */}
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Total Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(keyMetrics.revenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For selected range
            </p>
          </div>
          {/* Card 2: Operating Expenses */}
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Operating Expenses
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(keyMetrics.expenses)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For selected range
            </p>
          </div>
          {/* Card 3: Net Profit */}
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Net Profit
            </p>
            <p
              className={`text-2xl font-bold ${
                keyMetrics.netProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(Math.abs(keyMetrics.netProfit))}
              {keyMetrics.netProfit < 0 && (
                <span className="text-sm text-red-500 ml-1">(Loss)</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For selected range
            </p>
          </div>
          {/* Card 4: Gross Margin */}
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">
              Gross Margin
            </p>
            <p
              className={`text-2xl font-bold ${
                keyMetrics.grossMargin >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {keyMetrics.grossMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For selected range
            </p>
          </div>
        </div>

        {/* Main Content Area - Optimized for large screen side-by-side layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 md:p-8 pt-0">
          {/* Main Chart Area (8/12 width on large screens) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {loading ? (
              <>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center">
                  <div className="w-full h-64 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 h-[336px] animate-pulse flex items-center justify-center">
                  <div className="w-64 h-64 bg-gray-200 rounded-full"></div>
                </div>
              </>
            ) : (
              <>
                <div
                  ref={visitorsChartRef}
                  className="chart-export-container"
                  data-export-chart="visitors"
                >
                  <VisitorsChart data={chartData} rangeType={dateRange.rangeType} />
                </div>
                <div
                  ref={pieChartRef}
                  className="chart-export-container"
                  data-export-chart="sales-pie"
                >
                  <SalesPieChart data={pieData} />
                </div>
              </>
            )}
          </div>

          {/* Sidebar with Stats and Low Stock (4/12 width on large screens) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {loading ? (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2"></div>
              </div>
            ) : (
              <DashboardStatsCard 
                  stats={todayHighlight}
                  formatCurrency={formatCurrency}
                  rangeType="Today"
              />
            )}

            {/* Low Stock Products - Desktop View */}
            {loading ? (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-pulse hidden lg:block">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md hidden lg:block">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Low Stock Products
                  </h3>
                </div>
                <LowStockList lowStockProducts={lowStockProducts} />
              </div>
            )}
          </div>
        </div>

        {/* Business Report Component - Ensure it uses the full content width */}
        <div ref={businessReportRef} className="w-full px-4 sm:px-6 md:px-8 pb-8">
          <DashboardBusinessReport dateRange={dateRange} />
        </div>

        
        {/* NEW DATE RANGE FILTER MODAL */}
        <DateRangeFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          onDateRangeApply={handleDateRangeApply}
        />
      </div>
    </PageLayout>
  );
}

// LowStockList is kept as a separate component for clean code, as in the original
function LowStockList({ lowStockProducts }) {
  if (lowStockProducts.length === 0) {
    return <p className="text-sm text-gray-500">No products with low stock.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      <li className="py-2 text-sm font-semibold text-gray-600 flex justify-between">
          <span>Product</span>
          <span>Quantity</span>
      </li>
      {lowStockProducts.map((product) => (
        <li
          key={product.product_id}
          className="py-3 flex justify-between items-center"
        >
          <span className="text-sm font-medium text-gray-800">
            {product.product_name}
          </span>
          <span className="text-sm font-bold text-red-600">
            {product.quantity_in_stock} left
          </span>
        </li>
      ))}
    </ul>
  );
}
