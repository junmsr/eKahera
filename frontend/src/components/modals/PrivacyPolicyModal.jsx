import React, { useEffect } from "react";

function PrivacyPolicyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-4xl md:max-w-5xl rounded-2xl bg-white shadow-[0_20px_60px_rgba(2,6,23,0.35)] border border-slate-200 overflow-hidden"
        style={{ fontFamily: "Inter, sans-serif" }}
        role="document"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white/40 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l7 4v6c0 5-7 10-7 10S5 17 5 12V6l7-4z"/></svg>
            </span>
            <h2 id="privacy-title" className="text-base md:text-lg font-semibold text-slate-900">Privacy Policy</h2>
          </div>
          <button onClick={onClose} aria-label="Close privacy policy" className="h-9 w-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 text-slate-800 leading-relaxed selection:bg-blue-100 selection:text-blue-900"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <h3 className="text-xl font-extrabold text-slate-900">Privacy Policy for eKahera</h3>
          <p className="text-slate-600 mt-1">Effective Date: May 1, 2025</p>

          <p className="mt-4">This Privacy Policy describes how the "eKahera: A Web-Based Store Management Platform with Self Checkout" (the "Service" or "Platform") collects, uses, and protects your information. This Service is an unpublished undergraduate capstone project ("Project") developed by students of the Bicol University College of Science.</p>

          <p className="mt-4">By creating an account or using this Service, you agree to the collection and use of information in accordance with this policy.</p>

          <h4 className="mt-6 font-semibold text-slate-900">1. Information We Collect</h4>
          <p className="mt-2">We collect several types of information to provide and improve our Service.</p>

          <p className="mt-3 font-medium text-slate-900">A. Information You Provide</p>
          <p className="mt-2"><strong>MSME Admin & Store Information:</strong> When an MSME Owner registers a store, we collect information necessary for verification and account setup. This may include your name, store name, contact information, and business details.</p>
          <p className="mt-2"><strong>Cashier Information:</strong> MSME Admins create accounts for their staff. This information is limited to what is needed for role-based access, such as a name and login credentials.</p>
          <p className="mt-2"><strong>User Authentication Data:</strong> To secure your account, we use Firebase for user authentication, which may manage your email address and password.</p>

          <p className="mt-3 font-medium text-slate-900">B. Information Generated Through Use</p>
          <p className="mt-2"><strong>Inventory Data:</strong> We collect and store all product information you add to the Platform, including product names, barcode details, prices, and stock levels.</p>
          <p className="mt-2"><strong>Transaction Data:</strong> The Service logs all sales transactions. This includes items sold, quantities, total price, and a timestamp. This data is used to generate sales reports.</p>
          <p className="mt-2"><strong>Customer Self-Checkout Data:</strong> When a Customer uses the self-checkout feature, the Service temporarily collects their shopping cart information (scanned items and quantities) to process the transaction.</p>
          <p className="mt-2"><strong>QR Code Verification Data:</strong> The system generates a unique QR code for each transaction, which is used by a Cashier to verify the purchase.</p>

          <p className="mt-3 font-medium text-slate-900">C. What We DO NOT Collect</p>
          <p className="mt-2"><strong>No Customer Personal Information:</strong> The Customer self-checkout feature is designed to be used without requiring the Customer to create an account or provide any personal information (like name or phone number).</p>
          <p className="mt-2"><strong>No Real Financial Information:</strong> The e-wallet payment features (e.g., GCash, Maya) are simulated for demonstration purposes only. We do not collect, process, or store any real financial data, credit card numbers, or e-wallet account details.</p>

          <h4 className="mt-6 font-semibold text-slate-900">2. How We Use Your Information</h4>
          <p className="mt-2"><strong>To Provide and Maintain the Service:</strong> To operate the POS, manage inventory, and enable the self-checkout and verification systems.</p>
          <p className="mt-2"><strong>To Manage Accounts:</strong> To authenticate and manage access for MSME Admins and Cashiers based on their roles.</p>
          <p className="mt-2"><strong>For MSME Operations:</strong> To allow MSME Admins to track sales, monitor inventory, receive low-stock alerts, and generate business reports.</p>
          <p className="mt-2"><strong>For Academic Evaluation:</strong> As a capstone project, data may be used by the Developers and faculty of the Bicol University IT Department for testing, debugging, and evaluating the system's performance and functional suitability against the project's objectives.</p>

          <h4 className="mt-6 font-semibold text-slate-900">3. How We Share Your Information</h4>
          <p className="mt-2"><strong>Within Your MSME:</strong> All data (sales, inventory, transactions) for a specific store is accessible to that store's MSME Admin. Cashier accounts can only access information relevant to their role.</p>
          <p className="mt-2"><strong>Third-Party Services:</strong> We use Firebase for user authentication. Your authentication credentials (e.g., email, hashed password) are managed by Firebase. All other data is stored in a PostgreSQL database.</p>
          <p className="mt-2"><strong>Academic Purposes:</strong> The Developers and their faculty advisors  may access system data to evaluate the Project's success, troubleshoot issues, and for academic grading purposes.</p>
          <p className="mt-2"><strong>Legal Requirements:</strong> We do not sell or rent your personal or business data. We will only disclose your information if required to do so by law.</p>

          <h4 className="mt-6 font-semibold text-slate-900">4. Data Security</h4>
          <p className="mt-2">We are committed to protecting your information and complying with data privacy standards. The Service includes security measures such as user authentication and role-based access control to prevent unauthorized access.</p>
          <p className="mt-2">However, you must acknowledge the following:</p>
          <p className="mt-2">The Service is an academic project. Advanced security measures such as end-to-end encryption and comprehensive penetration testing are beyond the current scope of this Project. While we take reasonable steps to secure your data, we cannot guarantee its absolute security. You use this Service at your own risk.</p>

          <h4 className="mt-6 font-semibold text-slate-900">5. Data Retention</h4>
          <p className="mt-2">We will retain your store's operational data (inventory, sales) as long as your MSME account is active on the Platform. As this is a capstone project, all data may be archived or securely deleted after the academic evaluation period is complete.</p>

          <h4 className="mt-6 font-semibold text-slate-900">6. Your Rights</h4>
          <p className="mt-2">MSME Admins have the right to access, review, and update their store information and product inventory directly through the admin interface.</p>
          <p className="mt-2">MSME Admins have the right to create and manage the accounts for their Cashier staff.</p>
          <p className="mt-2">You may request the deletion of your account and associated data by contacting the Developers, subject to our need to retain records for academic purposes.</p>

          <h4 className="mt-6 font-semibold text-slate-900">7. Changes to This Privacy Policy</h4>
          <p className="mt-2">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

          <h4 className="mt-6 font-semibold text-slate-900">8. Contact Us</h4>
          <p className="mt-2">If you have any questions about this Privacy Policy, please contact the project Developers or the Bicol University Information Technology Department.</p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white/80 backdrop-blur">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99]">Close</button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyModal;


