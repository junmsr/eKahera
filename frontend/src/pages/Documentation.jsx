import React from "react";
import PageLayout from "../components/layout/PageLayout";

function Documentation() {
  return (
    <PageLayout
      showNavbar={true}
      showFooter={true}
      showHeader={false}
      navbarVariant="default"
      footerVariant="default"
      className="bg-white min-h-screen"
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            eKahera User Manual
          </h1>
          <p className="text-lg text-gray-600">
            Complete guide to using the eKahera POS and inventory management system
          </p>
        </div>

        <div className="space-y-8">
          {/* Getting Started */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              1. Getting Started
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  1.1 Account Setup
                </h3>
                <p className="text-gray-600 mb-2">
                  To begin using eKahera, you need to create an account and set up your store:
                </p>
                
                {/* Get Started Screenshots - All Steps */}
                <div className="mb-6 space-y-6">
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Step 1: Account Information</h4>
                    <img
                      src="/get-started-step-1-account.png"
                      alt="Account Information form - First step of registration"
                      className="w-full rounded-lg shadow-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center italic">
                      Enter your personal details including email, name, username, mobile number, and create a secure password.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Step 2: OTP Verification</h4>
                    <img
                      src="/get-started-step-2-otp.png"
                      alt="OTP Verification step - Email verification"
                      className="w-full rounded-lg shadow-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center italic">
                      Verify your email address by entering the 4-character code sent to your email.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Step 3: Business Details</h4>
                    <img
                      src="/get-started-step-3-business.png"
                      alt="Business Details form - Business information and location"
                      className="w-full rounded-lg shadow-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center italic">
                      Provide your business information including name, type, email, and complete location details.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Step 4: Document Upload</h4>
                    <img
                      src="/get-started-step-4-documents.png"
                      alt="Document Upload step - Business verification documents"
                      className="w-full rounded-lg shadow-lg border border-gray-200"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center italic">
                      Upload required business documents for verification and accept terms and conditions.
                    </p>
                  </div>
                </div>
                
                <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
                  <li>Visit the eKahera website and click "Get Started"</li>
                  <li>Fill out the registration form with your business details</li>
                  <li>Upload required business documents for verification</li>
                  <li>Wait for account approval (usually within 24-48 hours)</li>
                  <li>Complete initial store setup including location and basic information</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  1.2 System Requirements
                </h3>
                <ul className="list-disc list-inside text-gray-600 ml-4">
                  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Stable internet connection</li>
                  <li>Printer for receipts (optional but recommended)</li>
                  <li>Barcode scanner (optional for faster inventory management)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Dashboard Overview */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              2. Dashboard Overview
            </h2>
            <p className="text-gray-600 mb-4">
              The dashboard is your central hub for monitoring business performance and accessing key features.
            </p>
            
            {/* Dashboard Screenshot */}
            <div className="mb-6">
              <img
                src="/dashboard-screenshot.png"
                alt="eKahera Dashboard showing key metrics, charts, and business reports"
                className="w-full rounded-lg shadow-lg border border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                The dashboard provides a comprehensive view of your business performance with real-time metrics and visualizations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Key Metrics
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Total Sales:</strong> Today's revenue from all transactions</li>
                  <li><strong>Transaction Count:</strong> Number of sales made today</li>
                  <li><strong>Top Products:</strong> Best-selling items</li>
                  <li><strong>Low Stock Alerts:</strong> Items that need restocking</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Quick Actions
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li><strong>Start POS:</strong> Begin a new sales session</li>
                  <li><strong>View Inventory:</strong> Check stock levels and manage products</li>
                  <li><strong>Manage Cashiers:</strong> Add or remove staff accounts</li>
                  <li><strong>View Reports:</strong> Access detailed sales and inventory reports</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Point of Sale (POS) */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              3. Point of Sale (POS)
            </h2>
            
            {/* POS Screenshot */}
            <div className="mb-6">
              <img
                src="/pos-screenshot.png"
                alt="eKahera Point of Sale interface showing product scanner, cart, and checkout options"
                className="w-full rounded-lg shadow-lg border border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                The POS interface allows you to quickly scan products, manage cart items, and process payments.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  3.1 Starting a Sale
                </h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
                  <li>Click "Start POS" from the dashboard or navigate to the POS page</li>
                  <li>Scan or manually enter product barcodes/SKU</li>
                  <li>Adjust quantities if needed</li>
                  <li>Apply discounts if applicable</li>
                  <li>Process payment when ready</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  3.2 Payment Methods
                </h3>
                <p className="text-gray-600 mb-2">eKahera supports multiple payment methods:</p>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li><strong>Cash:</strong> Enter amount received, system calculates change</li>
                  <li><strong>Card:</strong> Process through integrated payment gateway</li>
                  <li><strong>Digital Wallets:</strong> Support for popular mobile payment apps</li>
                  <li><strong>Split Payments:</strong> Combine multiple payment methods for one transaction</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  3.3 Receipt Generation
                </h3>
                <p className="text-gray-600">
                  Receipts are automatically generated after each successful transaction.
                  You can print receipts directly or email them to customers.
                </p>
              </div>
            </div>
          </section>

          {/* Inventory Management */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              4. Inventory Management
            </h2>
            
            {/* Inventory Screenshot */}
            <div className="mb-6">
              <img
                src="/inventory-screenshot.png"
                alt="eKahera Inventory Management interface showing product list, search, and management options"
                className="w-full rounded-lg shadow-lg border border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                The Inventory page provides a comprehensive view of all your products with search, filter, and management capabilities.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  4.1 Adding Products
                </h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
                  <li>Navigate to Inventory from the main menu</li>
                  <li>Click "Add New Product"</li>
                  <li>Enter product details: name, SKU, price, category</li>
                  <li>Set initial stock quantity</li>
                  <li>Upload product image (optional)</li>
                  <li>Save the product</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  4.2 Stock Management
                </h3>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li><strong>Stock Updates:</strong> Automatically updated with each sale</li>
                  <li><strong>Low Stock Alerts:</strong> Get notified when items reach minimum threshold</li>
                  <li><strong>Stock Adjustments:</strong> Manually adjust quantities for corrections</li>
                  <li><strong>Inventory Reports:</strong> View detailed stock reports and trends</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  4.3 Categories and Organization
                </h3>
                <p className="text-gray-600">
                  Organize products into categories for easier management and reporting.
                  Categories help with inventory tracking and sales analysis.
                </p>
              </div>
            </div>
          </section>

          {/* Cashier Management */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              5. Cashier Management
            </h2>
            
            {/* Cashiers Screenshot */}
            <div className="mb-6">
              <img
                src="/cashiers-screenshot.png"
                alt="eKahera Cashier Management interface showing staff list and management options"
                className="w-full rounded-lg shadow-lg border border-gray-200"
              />
              <p className="text-sm text-gray-500 mt-2 text-center italic">
                Manage your staff members, assign roles, and control access permissions from the Cashiers page.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  5.1 Adding Cashiers
                </h3>
                <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
                  <li>Go to Cashiers section from the dashboard</li>
                  <li>Click "Add New Cashier"</li>
                  <li>Enter staff details: name, email, role</li>
                  <li>Set permissions and access levels</li>
                  <li>Send invitation to create account</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  5.2 Role Permissions
                </h3>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li><strong>Admin:</strong> Full access to all features</li>
                  <li><strong>Cashier:</strong> POS operations and basic inventory viewing</li>
                  <li><strong>Manager:</strong> Sales reports and inventory management</li>
                  <li><strong>Viewer:</strong> Read-only access to reports and analytics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Reports and Analytics */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              6. Reports and Analytics
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  6.1 Available Reports
                </h3>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li><strong>Sales Reports:</strong> Daily, weekly, monthly sales data</li>
                  <li><strong>Product Performance:</strong> Best-selling items and trends</li>
                  <li><strong>Inventory Reports:</strong> Stock levels and movement</li>
                  <li><strong>Cashier Performance:</strong> Individual staff sales metrics</li>
                  <li><strong>Financial Reports:</strong> Revenue, profit, and expense tracking</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  6.2 Exporting Data
                </h3>
                <p className="text-gray-600">
                  All reports can be exported in CSV, Excel, or PDF formats for external analysis
                  or record-keeping.
                </p>
              </div>
            </div>
          </section>

          {/* Mobile Features */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              7. Mobile Features
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  7.1 Mobile Scanner
                </h3>
                <p className="text-gray-600 mb-2">
                  Use your smartphone's camera to scan barcodes for quick inventory management:
                </p>
                
                {/* Customer Mobile View Screenshot */}
                <div className="mb-4 flex justify-center">
                  <div className="w-full max-w-xs">
                    <img
                      src="/customer-mobile-view.png"
                      alt="Customer mobile view - Store QR code scanner for self-checkout"
                      className="w-full rounded-lg shadow-lg border border-gray-200"
                      style={{ maxHeight: '600px', objectFit: 'contain' }}
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center italic">
                      Customers can scan the store's QR code using their mobile device to access the self-checkout system.
                    </p>
                  </div>
                </div>
                
                <ol className="list-decimal list-inside text-gray-600 space-y-1 ml-4">
                  <li>Access mobile scanner from the main menu</li>
                  <li>Grant camera permissions</li>
                  <li>Scan product barcodes</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  7.2 Customer Portal
                </h3>
                <p className="text-gray-600">
                  Customers can view their purchase history and receipts through the mobile app
                  or web portal.
                </p>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              8. Troubleshooting
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Common Issues
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700">Login Problems:</p>
                    <p className="text-gray-600">Check your email for password reset instructions or contact support.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Payment Processing Issues:</p>
                    <p className="text-gray-600">Verify your payment gateway settings and ensure internet connectivity.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Inventory Sync Issues:</p>
                    <p className="text-gray-600">Check your internet connection and try refreshing the page.</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Printer Not Working:</p>
                    <p className="text-gray-600">Ensure the printer is connected and has paper. Check printer settings.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Getting Help
                </h3>
                <p className="text-gray-600">
                  For additional support, contact our team at ekahera.business@gmail.com
                  or call +63 970 846 8324.
                </p>
              </div>
            </div>
          </section>

          {/* Security and Best Practices */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              9. Security and Best Practices
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Account Security
                </h3>
                <ul className="list-disc list-inside text-gray-600 ml-4 space-y-1">
                  <li>Use strong, unique passwords</li>
                  <li>Enable two-factor authentication when available</li>
                  <li>Log out when not using the system</li>
                  <li>Regularly update your password</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Data Backup
                </h3>
                <p className="text-gray-600">
                  eKahera automatically backs up your data. However, we recommend exporting
                  important reports regularly for additional security.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Compliance
                </h3>
                <p className="text-gray-600">
                  Ensure your business complies with local regulations regarding data privacy,
                  financial transactions, and consumer protection.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}

export default Documentation;
