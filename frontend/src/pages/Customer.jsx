import React from "react";
import PageLayout from "../components/layout/PageLayout";
import Navbar from "../components/layout/Navbar";

function Customer() {
  return (
    <PageLayout
      title="Customer Portal"
      subtitle="Welcome to eKahera customer services"
      showNavbar={true}
      showHeader={true}
      className="min-h-screen"
    >
      <div className="flex flex-col items-center justify-center flex-1 bg-white">
        <h2 className="text-3xl font-bold mb-8">Welcome, Customer!</h2>
        <p className="text-lg text-gray-700">
          This is the customer page. Add your customer features here.
        </p>
      </div>
    </PageLayout>
  );
}

export default Customer;
