import React from "react";
import Card from "../../common/Card";

const LogsCard = ({ title, logs = [], searchQuery = "" }) => {
  const filteredLogs = logs.filter((log) => {
    const haystack = Object.values(log)
      .map((v) => String(v ?? ""))
      .join(" ")
      .toLowerCase();
    const needle = String(searchQuery || "").toLowerCase();
    return haystack.includes(needle);
  });

  // Get color based on title
  const getTitleColor = () => {
    switch (title.toUpperCase()) {
      case "CASHIER":
        return "text-blue-600";
      case "ADMIN":
        return "text-purple-600";
      case "USER":
        return "text-green-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <Card className="flex-1 bg-white/80 backdrop-blur-md border border-white/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
      <div className="p-4 sm:p-6">
        <h2
          className={`text-lg sm:text-xl font-bold ${getTitleColor()} mb-4 sm:mb-6 flex items-center gap-2`}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          {title}
          <span className="ml-auto text-sm font-normal text-gray-500">
            ({filteredLogs.length})
          </span>
        </h2>
        <div className="w-full overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-medium">No logs found</p>
              <p className="text-gray-400 text-xs mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No activity recorded"}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:grid md:grid-cols-18 gap-9 font-semibold text-xs text-gray-600 pb-2 border-b-2 border-gray-200 uppercase tracking-wider">
                <span className="md:col-span-3">User ID</span>
                <span className="md:col-span-3">Action</span>
                <span className="md:col-span-3">Time</span>
                <span className="md:col-span-3">Username</span>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id || index}
                    className={`grid md:grid-cols-18 gap-2 py-3 border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200 ${
                      index % 2 === 1 ? "bg-gray-50/50" : "bg-transparent"
                    } md:bg-transparent`}
                  >
                    {/* Mobile stacked layout */}
                    <div className="md:col-span-3">
                      <span className="md:hidden block text-xs text-gray-500 font-medium mb-1">
                        User ID
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {log.id}
                      </span>
                    </div>
                    <div className="md:col-span-6">
                      <span className="md:hidden block text-xs text-gray-500 font-medium mb-1">
                        Action
                      </span>
                      <span className="text-sm text-gray-800 break-words">
                        {log.action}
                      </span>
                    </div>
                    <div className="md:col-span-3">
                      <span className="md:hidden block text-xs text-gray-500 font-medium mb-1">
                        Time
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700">
                        {log.time}
                      </span>
                      <span className="md:hidden block text-xs text-gray-500 font-medium mb-1">
                        Username
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default LogsCard;
