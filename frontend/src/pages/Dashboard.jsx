import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F6F3FB] p-0 text-gray-800">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-[#A23BEC] text-white px-10 py-5 shadow-md">
        <div className="text-3xl font-extrabold tracking-wide">eKahera</div>
        <div className="flex items-center gap-6">
          <span className="text-base font-medium bg-white/20 px-4 py-1 rounded-full">CASHIER #0001</span>
          <button className="text-2xl hover:bg-white/20 p-2 rounded transition">🔔</button>
          <button className="text-2xl hover:bg-white/20 p-2 rounded transition">⎋</button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-8 px-10 mt-8">
        {/* Left Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-lg col-span-1">
          <h2 className="text-lg font-semibold border-b-2 border-[#A23BEC] mb-4 pb-2">SCAN QR & BARCODE</h2>
          <div className="bg-[#E9D7FB] h-48 rounded-xl flex items-center justify-center mb-6">
            <div className="w-32 h-32 border-4 border-dashed border-[#A23BEC] rounded-xl"></div>
          </div>

          <input 
            type="text" 
            placeholder="Enter SKU Code" 
            className="w-full p-3 border-2 border-[#A23BEC] rounded mb-3 focus:outline-none focus:ring-2 focus:ring-[#A23BEC]"
          />
          <button className="w-full bg-[#A23BEC] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#8B2BCB] transition mb-5">ENTER</button>

          <div className="flex gap-3 items-center mb-6">
            <label className="font-medium">Quantity:</label>
            <input type="number" className="p-2 border-2 border-[#A23BEC] rounded w-20 focus:outline-none" defaultValue={0} />
            <button className="bg-[#A23BEC] text-white px-4 py-2 rounded-lg hover:bg-[#8B2BCB] transition">✔</button>
          </div>

          <div className="text-center bg-[#F6F3FB] p-4 rounded-x1 shadow-inner">
            <p className="text-xs text-gray-500">TRANSACTION NUMBER</p>
            <p className="text-4xl font-bold text-[#A23BEC] tracking-widest">00846512</p>
          </div>
        </div>

        {/* Center Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-lg col-span-2 flex flex-col justify-between">
          <div>
            <div className="grid grid-cols-4 font-semibold border-b-2 border-[#A23BEC] pb-3 text-[#A23BEC]">
              <div>Product</div>
              <div>Quantity</div>
              <div>Price</div>
              <div className="flex justify-between pr-4">Total <span></span></div>
            </div>
            {/* Sample row */}
            <div className="grid grid-cols-4 items-center border-b py-4 hover:bg-[#F6F3FB] transition">
              <div>Sample Product</div>
              <div>2</div>
              <div>₱100</div>
              <div className="flex justify-between items-center pr-4">
                ₱200
                <span className="flex gap-2">
                  <button className="text-[#A23BEC] hover:bg-[#F6F3FB] p-2 rounded transition"><FaEdit /></button>
                  <button className="text-red-500 hover:bg-[#F6F3FB] p-2 rounded transition"><FaTrash /></button>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-76 text-right font-bold text-xl text-[#A23BEC]">TOTAL: ₱200</div>

           <div className="col-span-3">
    <div className="flex gap-6 justify-center mt-8">
      <button className="bg-[#A23BEC] text-white px-8 py-4 rounded-xl shadow font-semibold hover:bg-[#8B2BCB] transition">
        F1<br /><span className="text-xs font-normal">CASH LEDGER</span>
      </button>
      <button className="bg-[#A23BEC] text-white px-8 py-4 rounded-xl shadow font-semibold hover:bg-[#8B2BCB] transition">
        F2<br /><span className="text-xs font-normal">PRODUCT REFUND</span>
      </button>
      <button className="bg-[#A23BEC] text-white px-8 py-4 rounded-xl shadow font-semibold hover:bg-[#8B2BCB] transition">
        F3<br /><span className="text-xs font-normal">DISCOUNT</span>
      </button>
      <button className="bg-[#A23BEC] text-white px-8 py-4 rounded-xl shadow font-semibold hover:bg-[#8B2BCB] transition">
        F4<br /><span className="text-xs font-normal">PRICE CHECK</span>
      </button>
      <button className="bg-[#8B2BCB] text-white px-10 py-4 rounded-xl shadow font-bold hover:bg-[#A23BEC] transition">
        F5<br /><span className="text-xs font-normal">CHECKOUT</span>
      </button>
    </div>
        </div>
      </div>
</div>
    </div>
  );
}
