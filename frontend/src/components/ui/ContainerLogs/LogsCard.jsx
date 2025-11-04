import React from "react";

const LogsCard = ({ title, logs = [], searchQuery = "" }) => {
  const filteredLogs = logs.filter((log) => {
    const haystack = Object.values(log)
      .map((v) => String(v ?? ""))
      .join(" ")
      .toLowerCase();
    const needle = String(searchQuery || "").toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <div className="flex-1 bg-white rounded-2xl p-6 shadow">
      <h2 className="text-xl font-bold text-blue-600 mb-6">{title}</h2>
      <div className="w-full">
        <div className="hidden md:grid md:grid-cols-12 font-semibold text-gray-600 pb-2 border-b-2 border-gray-200">
          <span className="md:col-span-3">User ID</span>
          <span className="md:col-span-6">Action</span>
          <span className="md:col-span-3">Time</span>
        </div>
        {filteredLogs.map((log, index) => (
          <div
            key={index}
            className={`grid md:grid-cols-12 gap-2 py-3 border-b border-gray-100 ${
              index % 2 === 1 ? "bg-gray-50" : "bg-transparent"
            } md:bg-transparent`}
          >
            {/* Mobile stacked layout */}
            <div className="md:col-span-3">
              <span className="md:hidden block text-xs text-gray-500">User ID</span>
              <span className="text-gray-900">{log.id}</span>
            </div>
            <div className="md:col-span-6">
              <span className="md:hidden block text-xs text-gray-500">Action</span>
              <span className="text-gray-800">{log.action}</span>
            </div>
            <div className="md:col-span-3">
              <span className="md:hidden block text-xs text-gray-500">Time</span>
              <span className="text-gray-700">{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsCard;
