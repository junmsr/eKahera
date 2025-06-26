import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function Dashboard() {
  // State for SKU, quantity, transaction number, and products
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [products, setProducts] = useState([]);

  // Generate a random transaction number
  const generateTransactionNumber = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  // When SKU is entered, generate a transaction number
  const handleSkuEnter = (e) => {
    e.preventDefault();
    if (sku.trim() !== '') {
      setTransactionNumber(generateTransactionNumber());
    }
  };

  // When check button is clicked, add a sample product
  const handleAddProduct = () => {
    if (!transactionNumber) return; // Require transaction number first
    setProducts([
      ...products,
      {
        name: 'Sample Product',
        quantity: quantity,
        price: 100,
        total: 100 * quantity,
      },
    ]);
    setSku('');
    setQuantity(1);
  };

  // Calculate total
  const totalAmount = products.reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="min-h-screen bg-[#F6F3FB] p-0 text-gray-800">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-[#A23BEC] text-white px-12 py-6 shadow-lg rounded-b-2xl">
        <div className="text-3xl font-extrabold tracking-wide">eKahera</div>
        <div className="flex items-center gap-6">
          <span className="text-base font-medium bg-white/20 px-5 py-2 rounded-full shadow">CASHIER #0001</span>
          <button className="text-2xl hover:bg-white/30 p-3 rounded-full transition"><span role="img" aria-label="bell">🔔</span></button>
          <button className="text-2xl hover:bg-white/30 p-3 rounded-full transition"><span role="img" aria-label="logout">⎋</span></button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-10 px-12 mt-10">
        {/* Left Panel */}
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col">
          <h2 className="text-xl font-bold border-b-2 border-[#A23BEC] mb-6 pb-2 text-[#A23BEC]">SCAN QR & BARCODE</h2>
          <div className="bg-[#E9D7FB] h-48 rounded-xl flex items-center justify-center mb-8">
            <div className="w-32 h-32 border-4 border-dashed border-[#A23BEC] rounded-xl"></div>
          </div>
          <form onSubmit={handleSkuEnter}>
            <input
              type="text"
              placeholder="Enter SKU Code"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full p-3 border-2 border-[#A23BEC] rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#A23BEC] transition"
            />
            <button
              type="submit"
              className="w-full bg-[#A23BEC] text-white py-3 rounded-lg font-semibold shadow hover:bg-[#8B2BCB] transition mb-6"
            >
              ENTER
            </button>
          </form>
          <div className="flex gap-3 items-center mb-8">
            <label className="font-medium">Quantity:</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="p-2 border-2 border-[#A23BEC] rounded-lg w-20 focus:outline-none"
            />
            <button
              className="bg-[#A23BEC] text-white px-4 py-2 rounded-lg hover:bg-[#8B2BCB] transition"
              onClick={handleAddProduct}
              disabled={!transactionNumber}
              title={!transactionNumber ? "Enter SKU and click ENTER first" : ""}
            >
              ✔
            </button>
          </div>
          <div className="text-center bg-[#F6F3FB] p-4 rounded-xl shadow-inner border">
            <p className="text-xs text-gray-500">TRANSACTION NUMBER</p>
            <p className="text-3xl font-bold text-[#A23BEC] tracking-widest">
              {transactionNumber || "--------"}
            </p>
          </div>
        </div>

        {/* Center Panel */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col">
            <div className="grid grid-cols-4 font-semibold border-b-2 border-[#A23BEC] pb-3 text-[#A23BEC] text-lg">
              <div>Product</div>
              <div>Quantity</div>
              <div>Price</div>
              <div className="flex justify-between pr-4">Total</div>
            </div>
            {/* Product rows */}
            {products.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No products yet.</div>
            ) : (
              products.map((product, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-4 items-center border-b py-5 hover:bg-[#F6F3FB] transition text-base"
                >
                  <div>{product.name}</div>
                  <div>{product.quantity}</div>
                  <div>₱{product.price}</div>
                  <div className="flex justify-between items-center pr-4">
                    ₱{product.total}
                    <span className="flex gap-2">
                      <button className="text-[#A23BEC] hover:bg-[#F6F3FB] p-2 rounded transition">
                        <FaEdit />
                      </button>
                      <button className="text-red-500 hover:bg-[#F6F3FB] p-2 rounded transition">
                        <FaTrash />
                      </button>
                    </span>
                  </div>
                </div>
              ))
            )}
            <div className="pt-20"></div>
            {/* Total Bar */}
            <div className="mt-6 bg-[#F6F3FB] rounded-xl p-4 text-right font-bold text-2xl text-[#A23BEC] shadow-inner border">
              TOTAL: ₱{totalAmount}
            </div>
          </div>

          {/* Bottom Buttons - as a card, inline with grid */}
          <div className="bg-white p-6 rounded-2xl shadow-xl flex justify-center gap-6">
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
  );
}
