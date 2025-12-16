import React, { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import DemoNav from "../components/layout/DemoNav";
import Card from "../components/common/Card";

const MOCK_PROFILE = {
  user: {
    first_name: "Demo",
    last_name: "Admin",
    email: "admin@demo.com",
    role: "business_owner",
    contact_number: "09999999999",
  },
  business: {
    business_name: "Demo Store Inc.",
    business_type: "Retail",
    email: "store@demo.com",
    city: "Demo City",
    province: "Demo Province",
  },
};

export default function DemoProfile() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <PageLayout
      title="PROFILE (DEMO)"
      sidebar={<DemoNav />}
      isSidebarOpen={isSidebarOpen}
      setSidebarOpen={setSidebarOpen}
      className="bg-gray-50"
    >
      <div className="p-6 space-y-6">
        <Card className="bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Name
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.user.first_name} {MOCK_PROFILE.user.last_name}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Email
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.user.email}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Role
              </label>
              <p className="text-gray-900 font-medium capitalize">
                {MOCK_PROFILE.user.role.replace("_", " ")}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Contact
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.user.contact_number}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Store Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Business Name
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.business.business_name}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Type
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.business.business_type}
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Location
              </label>
              <p className="text-gray-900 font-medium">
                {MOCK_PROFILE.business.city}, {MOCK_PROFILE.business.province}
              </p>
            </div>
          </div>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only demo profile. Changes
          cannot be saved here.
        </div>
      </div>
    </PageLayout>
  );
}
