import React from "react";

const BlueRadialBackground = () => (
  <div
    className="fixed inset-0 z-0 pointer-events-none select-none"
    style={{
      background:
        "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.13) 0%, transparent 80%), url('data:image/svg+xml;utf8,<svg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'><circle cx=\'1\' cy=\'1\' r=\'1\' fill=\'%23bcd0ee\' fill-opacity=\'0.25\'/></svg>') repeat",
    }}
  />
);

export default BlueRadialBackground;
