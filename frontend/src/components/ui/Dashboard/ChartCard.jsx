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
      className={`bg-white/80 backdrop-blur-md border border-white/60 shadow-xl group ${className}`}
      {...props}
    >
      {title && (
        <SectionHeader
          size="md"
          align="left"
          className="text-gray-900 mb-6 font-bold group-hover:text-blue-600 transition-colors duration-300"
        >
          {title}
        </SectionHeader>
      )}
      <div className="relative">
        {children}
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 rounded-lg pointer-events-none"></div>
      </div>
    </Card>
  );
}

export default ChartCard;
