import React from "react";
import { useNavigate } from "react-router-dom";

function SelectRole() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h2 className="text-3xl font-bold mb-8">Select Role</h2>
      <div className="flex gap-8">
        <button
          onClick={() => navigate("/pos")}
          className="bg-blue-600 text-white font-semibold px-10 py-4 rounded-xl shadow-lg text-xl hover:bg-blue-700 transition"
        >
          Cashier
        </button>
        <button
          onClick={() => navigate("/login")}
          className="bg-gray-800 text-white font-semibold px-10 py-4 rounded-xl shadow-lg text-xl hover:bg-gray-900 transition"
        >
          Admin
        </button>
      </div>
    </div>
  );
}

export default SelectRole;