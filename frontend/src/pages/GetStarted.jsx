import React, { useState } from "react";
import GetStartedSingle from "../components/ui/getstarted/GetStartedSingle";
import TermsModal from "../components/modals/TermsModal";
import PrivacyPolicyModal from "../components/modals/PrivacyPolicyModal";

export default function GetStarted() {
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  return (
    <>
      <GetStartedSingle onOpenTerms={() => setOpenTerms(true)} onOpenPrivacy={() => setOpenPrivacy(true)} />
      <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />
      <PrivacyPolicyModal open={openPrivacy} onClose={() => setOpenPrivacy(false)} />
    </>
  );
}
