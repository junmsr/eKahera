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

      <p className="mt-6">
        Please read this agreement ("Terms") carefully. This document governs
        your access to and use of the "eKahera: A Web-Based Store Management
        Platform with Self Checkout", (the "Service").
      </p>

      <p className="mt-4">
        The Service is an unpublished undergraduate capstone project ("Project")
        submitted to the Bicol University College of Science by its student
        developers.
      </p>

      <p className="mt-4">
        By creating an account, accessing the platform, or using the Service,
        you ("User," "You") acknowledge that you have read, understood, and
        agree to be bound by these Terms. If you do not agree, do not access or
        use the Service.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">1. Definitions</h4>
      <p className="mt-2">
        <strong>"Service" or "Platform"</strong>: Refers to the eKahera
        web-based store management and self-checkout application.
      </p>
      <p className="mt-2">
        <strong>"Developers"</strong>: Refers to the authors of the Project:
        Bonaobra, Inocencio, Jazmin, Mendina, and Perez.
      </p>
      <p className="mt-2">
        <strong>"MSME Admin"</strong>: A User, typically a store owner, with
        administrative permissions to manage products, inventory, reports, and
        staff accounts.
      </p>
      <p className="mt-2">
        <strong>"Cashier"</strong>: A User, typically a store employee, with
        permissions to process transactions using the POS interface and verify
        Customer QR codes.
      </p>
      <p className="mt-2">
        <strong>"Customer"</strong>: A User who accesses the mobile-friendly web
        application to scan items, manage a cart, and perform self-checkout.
      </p>
      <p className="mt-2">
        <strong>"Simulated Payment"</strong>: A mock payment feature used to
        demonstrate e-wallet functionality. This feature is for testing only and
        does not process real money.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        2. Nature of the Service
      </h4>
      <p className="mt-2">
        <strong>Academic Project:</strong> The Service is an academic capstone
        project. It is provided "AS IS" and "AS AVAILABLE" for demonstration,
        evaluation, and feedback purposes. It is not a commercial-grade, fully
        supported product.
      </p>
      <p className="mt-2">
        <strong>Open-Source:</strong> The Service was developed as an
        open-source system. Your license to use, modify, and distribute the
        source code is governed by the specific open-source license accompanying
        the Project's code repository (if any). These Terms govern your use of
        the hosted Service, not the source code itself.
      </p>
      <p className="mt-2">
        <strong>Limited Scope:</strong> The Service is designed for small retail
        operations (like convenience stores) and does not cater to restaurants,
        service providers, or businesses with complex logistics.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        3. User Accounts and Roles
      </h4>
      <p className="mt-2">
        <strong>MSME Admin:</strong> By registering a store, you represent that
        you are the owner or authorized representative of that MSME. You are
        solely responsible for all activity under your account, including
        managing product data, pricing, and the creation and conduct of Cashier
        accounts.
      </p>
      <p className="mt-2">
        <strong>Cashier:</strong> Your account is created and managed by an MSME
        Admin. You are responsible for maintaining the confidentiality of your
        login credentials and for all transactions you process.
      </p>
      <p className="mt-2">
        <strong>Customer:</strong> You do not need an account to use the
        self-checkout feature. You are responsible for accurately scanning all
        items using your device's camera.
      </p>

      <h4 className="mt-6 font-semibold text-slate-900">
        4. Critical Disclaimers and Limitations
      </h4>
      <p className="mt-2">
        The Developers provide the Service without warranties of any kind. You
        assume all risks associated with its use.
      </p>
      <p className="mt-2">
        <strong>No Guarantee of Security:</strong> The Service includes basic
        user authentication and role-based access control. However, you
        acknowledge that advanced security measures such as end-to-end
        encryption and penetration testing are beyond the current scope of this
        Project. The Developers are not liable for any data breach, loss, or
        unauthorized access.
      </p>
      <p className="mt-2">
        <strong>Payment is Simulated:</strong> You acknowledge that all e-wallet
        payment integrations (e.g., GCash, Maya) are simulated and for
        demonstration only. The Service cannot and does not process real
        financial transactions. The Developers are not liable for any real funds
        lost or financial information compromised by attempting to use this
        feature.
      </p>
    </BaseModal>
  );
}

export default TermsModal;
