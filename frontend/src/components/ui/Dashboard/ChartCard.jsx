import React from "react";
import Card from "../../common/Card";
import SectionHeader from "../../layout/SectionHeader";

/**
 * ChartCard Component
 * Provides a consistent layout for dashboard chart sections
 */
function ChartCard({ title, children, className = "", ...props }) {
  return (
    <Card
      className={`bg-white border border-gray-200 p-6 ${className}`}
      {...props}
    >
      {title && (
        <SectionHeader size="md" align="left" className="text-gray-900 mb-4">
          {title}
        </SectionHeader>
      )}
      {children}
    </Card>
  );
}

export default ChartCard;
