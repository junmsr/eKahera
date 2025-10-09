import React from "react";
import PageLayout from "../components/layout/PageLayout";
import Navbar from "../components/layout/Navbar";
import MobileScannerView from "../components/ui/Mobile-Scanner/MobileScannerView";

function Customer() {
  return (
    <PageLayout>
        <MobileScannerView />
    </PageLayout>
  );
}

export default Customer;
