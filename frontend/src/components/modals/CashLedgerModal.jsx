import React, { useState } from "react";
import BaseModal from "./BaseModal";
import Button from "../common/Button";
import {
  MdAccountBalanceWallet,
  MdSwapHoriz,
  MdDescription,
  MdChevronRight,
} from "react-icons/md";

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

  // Summary Page Component
  const renderSummary = () => {
    const totalCash = paymentTypes.reduce((sum, type) => sum + type.balance, 0);

    return (
      <div className="space-y-6">
        {/* Total Cash Display */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-3xl shadow-xl px-8 py-8 text-center">
          <p className="text-sm font-semibold text-blue-100 mb-2">
            Total Cash on Hand
          </p>
          <div className="text-5xl font-bold flex items-center justify-center gap-2">
            <span className="text-4xl">₱</span>
            {totalCash.toFixed(2)}
          </div>
          <p className="text-blue-100 text-sm mt-3">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Payment Types Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <MdAccountBalanceWallet className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">Payment Methods</h3>
          </div>
          <div className="space-y-3">
            {paymentTypes.map((type) => (
              <button
                key={type.name}
                onClick={() => {
                  setSelectedPaymentType(type.name);
                  setTab("TRANSACTIONS");
                }}
                className="w-full bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-blue-50 hover:to-indigo-50/50 rounded-2xl p-4 border border-gray-200/50 hover:border-blue-300 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-blue-300 group-hover:bg-blue-50 transition-all">
                      <svg
                        className="w-5 h-5 text-gray-600 group-hover:text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-500">View transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        ₱{type.balance.toFixed(2)}
                      </p>
                    </div>
                    <MdChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Transactions Page
  const renderTransactions = () => {
    const filtered = selectedPaymentType
      ? transactions.filter((t) => t.type === selectedPaymentType)
      : transactions;

    return (
      <div className="space-y-4">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedPaymentType(null);
            setTab("SUMMARY");
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Summary
        </button>

        {/* Transactions Title */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100/50">
          <h3 className="font-bold text-lg text-gray-900">
            {selectedPaymentType
              ? `${selectedPaymentType} Transactions`
              : "All Transactions"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200/50 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 font-medium">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200/50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {tx.date}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-green-600">
                        ₱{tx.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Tab button content
  const tabContent = (
    <div className="flex gap-2 border-t border-gray-200/50 pt-4 mt-4">
      <button
        onClick={() => {
          setTab("SUMMARY");
          setSelectedPaymentType(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
          tab === "SUMMARY"
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdDescription className="w-5 h-5" />
        <span>Summary</span>
      </button>
      <button
        onClick={() => {
          setTab("TRANSACTIONS");
          setSelectedPaymentType(null);
        }}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
          tab === "TRANSACTIONS"
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <MdSwapHoriz className="w-5 h-5" />
        <span>Transactions</span>
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Ledger"
      subtitle="View cash balance and payment methods"
      icon={<MdAccountBalanceWallet className="w-6 h-6 text-white" />}
      size="lg"
      contentClassName="space-y-4"
    >
      <div className="space-y-6">
        {tab === "SUMMARY" ? renderSummary() : renderTransactions()}
        {tabContent}
      </div>
    </BaseModal>
  );
}

export default CashLedgerModal;
