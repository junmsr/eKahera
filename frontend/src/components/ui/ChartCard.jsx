import React from 'react';
import Card from './Card';
import SectionHeader from '../layout/SectionHeader';

/**
 * ChartCard Component
 * Provides a consistent layout for dashboard chart sections
 */
function ChartCard({ title, children, ...props }) {
  return (
    <Card variant="gradient" {...props}>
      {title && <SectionHeader size="md" align="left">{title}</SectionHeader>}
      {children}
    </Card>
  );
}

export default ChartCard; 