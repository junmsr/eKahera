import React, { useEffect } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";

function PrivacyPolicyModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const footerContent = (
    <Button
      label="Close"
      variant="primary"
      onClick={onClose}
      className="w-full"
    />
  );

  return (
    <BaseModal
      isOpen={open}
      onClose={onClose}
      title="Privacy Policy"
      subtitle="How we protect your information"
      icon={
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      }
      footer={footerContent}
      size="full"
      contentClassName="leading-relaxed text-slate-800 selection:bg-blue-100 selection:text-blue-900"
    >
      <h3 className="text-2xl font-bold text-slate-900">
        Privacy Policy for eKahera
      </h3>
      <p className="text-slate-600 mt-2">Effective Date: May 1, 2025</p>

      <p className="mt-6">
        This Privacy Policy describes how the "eKahera: A Web-Based Store
        Management Platform with Self Checkout" (the "Service" or "Platform")
        collects, uses, and protects your information. This Service is an
        unpublished undergraduate capstone project ("Project") developed by
        students of the Bicol University College of Science.
      </p>

      <p className="mt-4">
        By creating an account or using this Service, you agree to the
        collection and use of information in accordance with this policy.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        1. Information We Collect
      </h4>
      <p className="mt-2">
        We collect several types of information to provide and improve our
        Service.
      </p>

      <p className="mt-3 font-medium text-slate-900">
        A. Information You Provide
      </p>
      <p className="mt-2">
        <strong>MSME Admin & Store Information:</strong> When an MSME Owner
        registers a store, we collect information necessary for verification and
        account setup. This may include your name, store name, contact
        information, and business details.
      </p>
      <p className="mt-2">
        <strong>Cashier Information:</strong> MSME Admins create accounts for
        their staff. This information is limited to what is needed for
        role-based access, such as a name and login credentials.
      </p>
      <p className="mt-2">
        <strong>User Authentication Data:</strong> To secure your account, we
        use Firebase for user authentication, which may manage your email
        address and password.
      </p>

      <p className="mt-3 font-medium text-slate-900">
        B. Information Generated Through Use
      </p>
      <p className="mt-2">
        <strong>Inventory Data:</strong> We collect and store all product
        information you add to the Platform, including product names, barcode
        details, prices, and stock levels.
      </p>
      <p className="mt-2">
        <strong>Transaction Data:</strong> The Service logs all sales
        transactions. This includes items sold, quantities, total price, and a
        timestamp. This data is used to generate sales reports.
      </p>
      <p className="mt-2">
        <strong>Customer Self-Checkout Data:</strong> When a Customer uses the
        self-checkout feature, the Service temporarily collects their shopping
        cart information (scanned items and quantities) to process the
        transaction.
      </p>
      <p className="mt-2">
        <strong>QR Code Verification Data:</strong> The system generates a
        unique QR code for each transaction, which is used by a Cashier to
        verify the purchase.
      </p>

      <p className="mt-3 font-medium text-slate-900">
        C. What We DO NOT Collect
      </p>
      <p className="mt-2">
        <strong>No Customer Personal Information:</strong> The Customer
        self-checkout feature is designed to be used without requiring the
        Customer to create an account or provide any personal information (like
        name or phone number).
      </p>
      <p className="mt-2">
        <strong>No Real Financial Information:</strong> The e-wallet payment
        features (e.g., GCash, Maya) are simulated for demonstration purposes
        only. We do not collect, process, or store any real financial data,
        credit card numbers, or e-wallet account details.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        2. How We Use Your Information
      </h4>
      <p className="mt-2">
        <strong>To Provide and Maintain the Service:</strong> To operate the
        POS, manage inventory, and enable the self-checkout and verification
        systems.
      </p>
      <p className="mt-2">
        <strong>To Manage Accounts:</strong> To authenticate and manage access
        for MSME Admins and Cashiers based on their roles.
      </p>
      <p className="mt-2">
        <strong>For MSME Operations:</strong> To allow MSME Admins to track
        sales, monitor inventory, receive low-stock alerts, and generate
        business reports.
      </p>
      <p className="mt-2">
        <strong>For Academic Evaluation:</strong> As a capstone project, data
        may be used by the Developers and faculty of the Bicol University IT
        Department for testing, debugging, and evaluating the system's
        performance and functional suitability against the project's objectives.
      </p>
    </BaseModal>
  );
}

export default PrivacyPolicyModal;
