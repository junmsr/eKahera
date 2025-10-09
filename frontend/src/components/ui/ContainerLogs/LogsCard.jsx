import React from "react";

const LogsCard = ({ title, logs, searchQuery }) => {
  const cardStyle = {
    flex: "1",
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  const titleStyle = {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: "1.5rem",
  };

  const headerStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    fontWeight: "bold",
    color: "#555",
    paddingBottom: "0.5rem",
    borderBottom: "2px solid #ddd",
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    padding: "0.75rem 0",
    borderBottom: "1px solid #eee",
  };

  const filteredLogs = logs.filter((log) =>
    Object.values(log)
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <div style={{ width: "100%" }}>
        <div style={headerStyle}>
          <span>User ID</span>
          <span>Action</span>
          <span>Time</span>
        </div>
        {filteredLogs.map((log, index) => (
          <div
            key={index}
            style={{
              ...rowStyle,
              backgroundColor: index % 2 === 1 ? "#f2f2f2" : "transparent",
            }}
          >
            <span>{log.id}</span>
            <span>{log.action}</span>
            <span>{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogsCard;
