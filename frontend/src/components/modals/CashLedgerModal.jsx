import React, { useState } from "react";
import Modal from "./Modal";

function CashLedgerModal({ isOpen, onClose }) {
  // Tab state: "SUMMARY" or "TRANSACTIONS"
  const [tab, setTab] = useState("SUMMARY");
  // Track which payment type is selected for filtered transactions view
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);

  // Dummy transactions data for demo
  const transactions = [
    { id: 1, type: "Cash on hand", amount: 100, date: "2025-05-25 10:00" },
    { id: 2, type: "Gcash", amount: 50, date: "2025-05-25 11:30" },
    { id: 3, type: "Maya", amount: 75, date: "2025-05-25 13:15" },
  ];

  // Dummy data for payment types
  const paymentTypes = [
    { name: "Cash on hand", balance: 335.0 },
    { name: "Gcash", balance: 150.0 },
    { name: "Maya", balance: 235.0 },
  ];

  // Responsive tab navigation
  const renderTabs = () => (
    // Hide tabs when viewing a specific payment type (redundant UI)
    selectedPaymentType ? null : (
      <div className="flex w-full justify-around mt-8 border-t pt-3">
        <button
          className={`flex flex-col items-center transition ${tab === "SUMMARY" ? "text-blue-700 font-bold" : "text-gray-500 hover:text-blue-700"}`}
          onClick={() => setTab("SUMMARY")}
        >
          <span className="material-icons text-xl mb-1">description</span>
          <span className="text-xs font-medium">Summary</span>
        </button>
        <button
          className={`flex flex-col items-center transition ${tab === "TRANSACTIONS" ? "text-blue-700 font-bold" : "text-gray-500 hover:text-blue-700"}`}
          onClick={() => setTab("TRANSACTIONS")}
        >
          <span className="material-icons text-xl mb-1">swap_horiz</span>
          <span className="text-xs font-medium">Transactions</span>
        </button>
      </div>
    )
  );

  // Summary Page Component
  const renderSummary = () => {
    const totalCash = paymentTypes.reduce((sum, type) => sum + type.balance, 0);

    return (
      <>
      {/* Total Cash */}
      <div className="w-full flex flex-col items-center mb-4">
        <div className="bg-gradient-to-b from-blue-500 to-blue-700 text-white rounded-2xl shadow px-8 py-4 text-center w-full max-w-sm">
          <div className="text-4xl font-bold flex items-center justify-center gap-2">
            <span className="text-3xl">₱</span>{totalCash.toFixed(2)}
          </div>
          <div className="text-sm font-semibold mt-1">Total Cash</div>
        </div>
      </div>
      {/* Date */}
      <div className="flex items-center gap-2 mb-3 text-black">
        <span className="material-icons text-base">calendar_today</span>
        <span className="font-medium text-base">May 25, 2025</span>
      </div>
      {/* Duration Selector
      <div className="flex w-full mb-5">
        <button className="flex-1 border border-blue-500 rounded-l-lg px-2 py-1 bg-blue-600 text-white font-medium text-sm transition-colors duration-150">
          Select Duration
        </button>
        <button className="flex-1 border-t border-b border-r border-blue-500 rounded-r-lg px-2 py-1 bg-white text-blue-700 font-medium text-sm transition-colors duration-150">
          This Day
        </button>
      </div> */}
      {/* Payment Types */}
      <div className="w-full">
        <div className="flex justify-between px-1 mb-2 text-gray-700 text-xs font-semibold">
          <span>Payment Type</span>
          <span>Balance</span>
        </div>
        <div className="flex flex-col gap-2">
          {paymentTypes.map((type) => (
            <button
              key={type.name}
              className="flex justify-between items-center bg-white rounded-xl shadow px-4 py-2 font-medium text-sm hover:bg-blue-50 transition"
              onClick={() => {
                // Open transactions tab filtered by the clicked payment type
                setSelectedPaymentType(type.name);
                setTab('TRANSACTIONS');
              }}
            >
              <span>{type.name}</span>
              <span className="font-bold">₱{type.balance.toFixed(2)}</span>
              <span className="material-icons text-gray-400 ml-2 text-base">chevron_right</span>
            </button>
          ))}
        </div>
      </div>
    </>
    );
  };

  // Transactions Page (optionally filtered by selectedPaymentType)
  const renderTransactions = () => {
    const filtered = selectedPaymentType
      ? transactions.filter(t => t.type === selectedPaymentType)
      : transactions;

    return (
      <div className="w-full flex flex-col items-center mt-2">
        <div className="w-full mb-3 text-blue-700 font-semibold text-lg text-center">
          {selectedPaymentType ? `${selectedPaymentType} Transactions` : 'Transactions'}
        </div>

        {/* Back to summary - always available on the Transactions page */}
        <div className="w-full mb-2">
          <button
            type="button"
            onClick={() => { setSelectedPaymentType(null); setTab('SUMMARY'); }}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to summary
          </button>
        </div>

        <div className="w-full max-h-96 overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-gray-600 border-b">
                <th className="py-2 px-2">Date/Time</th>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="border-b hover:bg-blue-50 transition">
                    <td className="py-2 px-2">{tx.date}</td>
                    <td className="py-2 px-2">{tx.type}</td>
                    <td className="py-2 px-2 text-right font-bold text-blue-700">₱{tx.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cash Ledger" className="max-w-2xl">
      {/* Exit "X" Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 focus:outline-none z-10"
        aria-label="Close"
        type="button"
      >
        ×
      </button>
      <div className="flex flex-col items-center px-6 pb-6 pt-2 relative min-h-[550px]">
        {tab === "SUMMARY" ? renderSummary() : renderTransactions()}
        {renderTabs()}
      </div>
    </Modal>
  );
}

export default CashLedgerModal;