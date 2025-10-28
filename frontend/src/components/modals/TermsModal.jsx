import React, { useEffect } from "react";

function TermsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
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
            <h2 id="terms-title" className="text-base md:text-lg font-semibold text-slate-900">Terms and Conditions</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close terms modal"
            className="h-9 w-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6 text-slate-800 leading-relaxed selection:bg-blue-100 selection:text-blue-900"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <h3 className="text-xl font-extrabold text-slate-900">Terms and Conditions for eKahera</h3>
          <p className="text-slate-600 mt-1">Effective Date: May 1, 2025</p>

          <p className="mt-4">Please read this agreement ("Terms") carefully. This document governs your access to and use of the "eKahera: A Web-Based Store Management Platform with Self Checkout", (the "Service").</p>

          <p className="mt-4">The Service is an unpublished undergraduate capstone project ("Project") submitted to the Bicol University College of Science by its student developers.</p>

          <p className="mt-4">By creating an account, accessing the platform, or using the Service, you ("User," "You") acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not access or use the Service.</p>

          <h4 className="mt-6 font-semibold text-slate-900">1. Definitions</h4>
          <p className="mt-2"><strong>"Service" or "Platform"</strong>: Refers to the eKahera web-based store management and self-checkout application.</p>
          <p className="mt-2"><strong>"Developers"</strong>: Refers to the authors of the Project: Bonaobra, Inocencio, Jazmin, Mendina, and Perez.</p>
          <p className="mt-2"><strong>"MSME Admin"</strong>: A User, typically a store owner, with administrative permissions to manage products, inventory, reports, and staff accounts.</p>
          <p className="mt-2"><strong>"Cashier"</strong>: A User, typically a store employee, with permissions to process transactions using the POS interface and verify Customer QR codes.</p>
          <p className="mt-2"><strong>"Customer"</strong>: A User who accesses the mobile-friendly web application to scan items, manage a cart, and perform self-checkout.</p>
          <p className="mt-2"><strong>"Simulated Payment"</strong>: A mock payment feature used to demonstrate e-wallet functionality. This feature is for testing only and does not process real money.</p>

          <h4 className="mt-6 font-semibold text-slate-900">2. Nature of the Service</h4>
          <p className="mt-2"><strong>Academic Project:</strong> The Service is an academic capstone project. It is provided "AS IS" and "AS AVAILABLE" for demonstration, evaluation, and feedback purposes. It is not a commercial-grade, fully supported product.</p>
          <p className="mt-2"><strong>Open-Source:</strong> The Service was developed as an open-source system. Your license to use, modify, and distribute the source code is governed by the specific open-source license accompanying the Project's code repository (if any). These Terms govern your use of the hosted Service, not the source code itself.</p>
          <p className="mt-2"><strong>Limited Scope:</strong> The Service is designed for small retail operations (like convenience stores) and does not cater to restaurants, service providers, or businesses with complex logistics.</p>

          <h4 className="mt-6 font-semibold text-slate-900">3. User Accounts and Roles</h4>
          <p className="mt-2"><strong>MSME Admin:</strong> By registering a store, you represent that you are the owner or authorized representative of that MSME. You are solely responsible for all activity under your account, including managing product data, pricing, and the creation and conduct of Cashier accounts.</p>
          <p className="mt-2"><strong>Cashier:</strong> Your account is created and managed by an MSME Admin. You are responsible for maintaining the confidentiality of your login credentials and for all transactions you process.</p>
          <p className="mt-2"><strong>Customer:</strong> You do not need an account to use the self-checkout feature. You are responsible for accurately scanning all items using your device's camera.</p>

          <h4 className="mt-6 font-semibold text-slate-900">4. Critical Disclaimers and Limitations</h4>
          <p className="mt-2">The Developers provide the Service without warranties of any kind. You assume all risks associated with its use.</p>
          <p className="mt-2"><strong>No Guarantee of Security:</strong> The Service includes basic user authentication and role-based access control. However, you acknowledge that advanced security measures such as end-to-end encryption and penetration testing are beyond the current scope of this Project. The Developers are not liable for any data breach, loss, or unauthorized access.</p>
          <p className="mt-2"><strong>Payment is Simulated:</strong> You acknowledge that all e-wallet payment integrations (e.g., GCash, Maya) are simulated and for demonstration only. The Service cannot and does not process real financial transactions. The Developers are not liable for any real funds lost or financial information compromised by attempting to use this feature.</p>
          <p className="mt-2"><strong>Internet Dependency:</strong> The Service relies on stable internet connectivity for synchronization. A full offline mode is not included. The Developers are not responsible for any data loss, transaction failure, or service interruption caused by poor connectivity or "brownouts".</p>
          <p className="mt-2"><strong>Risk of Theft:</strong> The self-checkout feature's verification system is basic. The MSME Admin and their staff are solely responsible for store security, monitoring Customers, and preventing theft. The Developers are not liable for any inventory loss or financial damages resulting from theft or customer error during self-checkout.</p>

          <h4 className="mt-6 font-semibold text-slate-900">5. Prohibited Conduct</h4>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Violate any local, national, or international law.</li>
            <li>Upload, post, or transmit any data that is inaccurate, unlawful, or harmful.</li>
            <li>Attempt to bypass, compromise, or reverse-engineer the Service's security features (outside the rights granted by the open-source license).</li>
            <li>Use the Simulated Payment feature in any attempt to commit fraud or mislead others.</li>
            <li>Impersonate any person or entity or falsely state your affiliation with an MSME.</li>
          </ul>

          <h4 className="mt-6 font-semibold text-slate-900">6. No Warranties</h4>
          <p className="mt-2">THE SERVICE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</p>
          <p className="mt-2">THE DEVELOPERS DO NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, BE UNINTERRUPTED, ERROR-FREE, OR SECURE. THE DEVELOPERS DO NOT WARRANT THE ACCURACY OF ANY INVENTORY OR SALES REPORTS GENERATED BY THE SERVICE.</p>

          <h4 className="mt-6 font-semibold text-slate-900">7. Limitation of Liability</h4>
          <p className="mt-2">IN NO EVENT SHALL THE DEVELOPERS, BICOL UNIVERSITY, OR ITS FACULTY  BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM OR IN CONNECTION WITH THE SERVICE OR THE USE THEREOF.</p>
          <p className="mt-2">THIS INCLUDES, BUT IS NOT LIMITED TO: (a) LOSS OF DATA, PROFITS, OR BUSINESS INTERRUPTION; (b) ANY LOSSES DUE TO INVENTORY MISMANAGEMENT OR THEFT; (c) ANY DAMAGES ARISING FROM SERVICE DOWNTIME; OR (d) ANY DAMAGES ARISING FROM A SECURITY BREACH.</p>
          <p className="mt-2">YOUR SOLE AND EXCLUSIVE REMEDY FOR ANY DISSATISFACTION WITH THE SERVICE IS TO STOP USING IT.</p>

          <h4 className="mt-6 font-semibold text-slate-900">8. General Provisions</h4>
          <p className="mt-2"><strong>Governing Law:</strong> These Terms shall be governed by the laws of the Republic of the Philippines.</p>
          <p className="mt-2"><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and the Developers regarding the Service.</p>
          <p className="mt-2"><strong>Severability:</strong> If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>
          <p className="mt-2"><strong>Future Monetization:</strong> The Developers reserve the right to monetize the Project in the future through premium services or subscriptions, though the core features may remain open-source.</p>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white/80 backdrop-blur">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.99]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;


