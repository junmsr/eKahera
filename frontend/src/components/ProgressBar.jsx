import React from 'react';

function ProgressBar({ percent }) {
  return (
    <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden shadow-inner" aria-label="Progress bar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} role="progressbar">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500 rounded-full shadow-md"
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  );
}

export default ProgressBar; 