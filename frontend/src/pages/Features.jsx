function Features() {
  return (

  <section id="features">
    <div className="w-full max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-6 text-center">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-4xl mb-4">📦</span>
          <h3 className="font-semibold text-lg mb-2">Inventory Management</h3>
          <p className="text-gray-600 text-center">
            Track your products, stock levels, and suppliers with ease.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-4xl mb-4">💰</span>
          <h3 className="font-semibold text-lg mb-2">Sales Analytics</h3>
          <p className="text-gray-600 text-center">
            Get real-time insights and reports on your sales performance.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-4xl mb-4">👥</span>
          <h3 className="font-semibold text-lg mb-2">Customer Management</h3>
          <p className="text-gray-600 text-center">
            Manage your customers, orders, and communications in one place.
          </p>
        </div>
      </div>
    </div>
  </section>
    
  );
}

export default Features;