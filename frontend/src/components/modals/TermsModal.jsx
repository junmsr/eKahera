import React, { useEffect } from "react";
import Button from "../common/Button";
import BaseModal from "./BaseModal";

function TermsModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
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
      title="Terms and Conditions"
      subtitle="Please read carefully before using our service"
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
            d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17c0 5.523 3.592 10 8 10s8-4.477 8-10c0-6.002-4.5-10.747-10-10.747z"
          />
        </svg>
      }
      footer={footerContent}
      size="full"
      contentClassName="leading-relaxed text-slate-800 selection:bg-blue-100 selection:text-blue-900"
    >
      <h3 className="text-2xl font-bold text-slate-900">
        Terms and Conditions for eKahera
      </h3>
      <p className="text-slate-600 mt-2">Effective Date: May 1, 2025</p>

      <h4 className="mt-6 font-semibold text-slate-900">1. Introduction</h4>
      <p className="mt-2">
        Welcome to eKahera ("we," "us," or "our"). eKahera is a Web-Based POS
        and Store Management Platform with a Self-Scanning Feature designed for
        Micro, Small, and Medium Enterprises (MSMEs) in Albay. These Terms and
        Conditions govern your use of our web application and services.
      </p>
      <p className="mt-2">
        By accessing or using eKahera, you agree to be bound by these terms. If
        you disagree with any part of the terms, you may not access the service.
        You acknowledge that this system is an undergraduate capstone project
        presented to the Bicol University College of Science.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        2. User Accounts and Roles
      </h4>
      <p className="mt-2">
        Access to the system is categorized by the following user roles, each
        with specific responsibilities:
      </p>
      <p className="mt-2">
        <strong>Admin/Store Owner:</strong> Responsible for managing inventory,
        store settings, sales monitoring, and team management.
      </p>
      <p className="mt-2">
        <strong>Super Admin:</strong> Oversees store owner applications,
        verifies documents, and manages system-wide settings.
      </p>
      <p className="mt-2">
        <strong>Cashier:</strong> Authorized to access the POS interface to
        manage transactions and verify customer purchases via QR code scanning.
      </p>
      <p className="mt-2">
        <strong>Customer:</strong> Authorized to use the responsive interface
        for self-scanning product barcodes, managing shopping carts, and
        generating transaction QR codes.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        3. Payment and Simulations
      </h4>
      <p className="mt-2">
        <strong>Important Notice Regarding Financial Transactions:</strong>
      </p>
      <p className="mt-2">
        <strong>Simulated Payments:</strong> You explicitly acknowledge that
        eKahera currently uses simulation payments for e-wallets (e.g., GCash,
        Maya). The system mimics the behavior of digital wallets for testing and
        academic purposes only.
      </p>
      <p className="mt-2">
        <strong>No Real Funds:</strong> Actual API integration is limited during
        this prototype phase. No actual financial funds are transferred,
        processed, or stored through the application at this time.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        4. System Requirements and Connectivity
      </h4>
      <p className="mt-2">
        <strong>Internet Connectivity:</strong> eKahera relies on stable
        internet connectivity for cloud-based synchronization to maintain
        consistent performance across users.
      </p>
      <p className="mt-2">
        <strong>Hardware:</strong> The system is designed to be accessible via
        mobile and desktop browsers. External hardware (e.g., barcode scanners,
        receipt printers) is optional, as the system utilizes device cameras for
        scanning.
      </p>
      <p className="mt-2">
        <strong>Offline Limitations:</strong> Users acknowledge that a full
        offline mode is not included in the current version; therefore, we are
        not liable for disruptions caused by unstable internet connections or
        power outages.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        5. Intellectual Property
      </h4>
      <p className="mt-2">
        The eKahera system, including its unique design, source code, and
        "Self-Scanning" methodology, is the intellectual property of the
        researchers: Aaron Stefano F. Bonaobra, Rechelle Grace C. Inocencio,
        Dave Gabriel M. Jazmin, Daryl E. Mendina, and Junmar A. Perez, under the
        guidance of Bicol University.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        6. Limitation of Liability
      </h4>
      <p className="mt-2">
        The system is provided on an "AS IS" and "AS AVAILABLE" basis for
        academic evaluation and pilot testing. We do not warrant that the system
        will be error-free or uninterrupted. We shall not be liable for any data
        discrepancies or operational errors arising from the use of the
        simulated environment.
      </p>
    </BaseModal>
  );
}

export default TermsModal;
