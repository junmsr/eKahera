import React from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import PageLayout from "../components/layout/PageLayout";
import LogsCard from "../components/ui/Logs/LogsCard";

// Sample data from Figma
const cashierLogs = [
  { id: "0001", action: "Time In", time: "12:24 am" },
  { id: "0001", action: "Time Out", time: "12:24 pm" },
];

const adminLogs = [
  {
    id: "0001",
    action: "Piattos Cheese Flavor (Add Product)",
    time: "12:24 am",
  },
  { id: "0002", action: "Pocari Sweat (Add Product)", time: "12:25 pm" },
  {
    id: "0003",
    action: "Piattos Cheese Flavor (Delete Product)",
    time: "12:33 am",
  },
  { id: "0004", action: "Pocari Sweat (Delete Product)", time: "12:33 pm" },
];

const LogsPage = () => {
  return (
    <PageLayout
      title="LOGS"
      subtitle="System activity and transaction logs"
      sidebar={<NavAdmin />}
      className="h-screen overflow-hidden"
    >
      <div className="flex-1 bg-transparent overflow-hidden p-4">
        <div style={{ display: "flex", gap: "2rem" }}>
          <LogsCard title="CASHIER" logs={cashierLogs} />
          <LogsCard title="ADMIN" logs={adminLogs} />
        </div>
      </div>
    </PageLayout>
  );
};

export default LogsPage;
