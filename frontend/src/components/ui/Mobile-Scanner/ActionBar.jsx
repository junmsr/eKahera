import React from 'react';
import Button from '../../common/Button';

function ActionBar({ total, onCancel, onCheckout, disabled = false }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-white/80 backdrop-blur border-t border-blue-100">
      <div className="flex items-center justify-between gap-2">
        <Button label="Cancel" variant="secondary" onClick={onCancel} microinteraction disabled={disabled} />
        <Button label="Check Out" variant="primary" onClick={onCheckout} microinteraction disabled={disabled} />
        <div className="text-right text-sm">
          <div className="text-blue-700">Order Total:</div>
          <div className="text-blue-900 font-extrabold">₱{total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

export default ActionBar;
