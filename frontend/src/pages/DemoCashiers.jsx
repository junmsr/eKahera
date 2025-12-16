import React, { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import Button from "../components/common/Button";

const MOCK_CASHIERS = [
  {
    id: 101,
    name: "John Doe",
    username: "cashier1",
    email: "john@demo.com",
    number: "09123456789",
    status: "ACTIVE",
  },
  {
    id: 102,
    name: "Jane Smith",
    username: "cashier2",
    email: "jane@demo.com",
    number: "09987654321",
    status: "INACTIVE",
  },
];

export default function DemoCashiers() {
  const [cashiers, setCashiers] = useState(MOCK_CASHIERS);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleAdd = () => {
    const newId = Math.max(...cashiers.map((c) => c.id)) + 1;
    const newCashier = {
      id: newId,
      name: `Demo Cashier ${newId}`,
      username: `user${newId}`,
      email: `user${newId}@demo.com`,
      number: "09000000000",
      status: "ACTIVE",
    };
    setCashiers([...cashiers, newCashier]);
    alert("Demo cashier added!");
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this demo cashier?")) {
      setCashiers(cashiers.filter((c) => c.id !== id));
    }
  };

  return (
    <PageLayout
      title="CASHIERS (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      headerActions={
        <Button onClick={handleAdd} className="bg-blue-600 text-white">
          Add Demo Cashier
        </Button>
      }
    >
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 font-semibold text-gray-600">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-600">
                  Username
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashiers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{c.name}</td>
                  <td className="py-3 px-4 text-gray-500">{c.username}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${
                        c.status === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
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
