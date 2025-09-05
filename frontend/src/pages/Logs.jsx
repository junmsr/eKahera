import React from "react";
import NavAdmin from "../components/layout/Nav-Admin";
import Background from "../components/layout/Background";
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
