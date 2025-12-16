import React, { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";

const MOCK_LOGS = [
  {
    id: 1,
    username: "Admin",
    role: "admin",
    action: "Updated inventory stock for SKU 1001",
    time: "Oct 24, 2023 10:30 AM",
  },
  {
    id: 2,
    username: "cashier1",
    role: "cashier",
    action: "Processed transaction #T-10023",
    time: "Oct 24, 2023 11:15 AM",
  },
  {
    id: 3,
    username: "Admin",
    role: "admin",
    action: "Added new product 'Demo Cake'",
    time: "Oct 24, 2023 02:00 PM",
  },
];

export default function DemoLogs() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PageLayout
      title="LOGS (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
    >
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-6 font-semibold text-gray-600">User</th>
                <th className="py-3 px-6 font-semibold text-gray-600">Role</th>
                <th className="py-3 px-6 font-semibold text-gray-600">
                  Action
                </th>
                <th className="py-3 px-6 font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium">{log.username}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                        log.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {log.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-700">{log.action}</td>
                  <td className="py-3 px-6 text-gray-500 text-sm">
                    {log.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
