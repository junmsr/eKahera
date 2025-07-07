import React from 'react';
import Card from './Card';
import Button from './Button';
import { Scanner } from '@yudiel/react-qr-scanner';

function ScannerCard({ onScan, paused, onResume, cardBg, textMain }) {
  return (
    <Card className={`flex flex-col items-center shadow-2xl flex-shrink-0 ${cardBg} emphasized-card`} microinteraction>
      <div className={`w-full text-center mb-2 font-bold text-lg tracking-wide ${textMain}`}>SCAN QR & BARCODE</div>
      <div className="w-56 h-40 bg-gradient-to-b from-blue-100/60 to-blue-200/60 rounded-2xl flex items-center justify-center border-2 border-blue-300/40 mb-2 overflow-hidden relative">
        <Scanner
          onScan={onScan}
          onError={err => console.error(err)}
          paused={paused}
          constraints={{ facingMode: 'environment' }}
          styles={{
            container: { width: '100%', height: '100%', borderRadius: '1rem', overflow: 'hidden' },
            video: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1rem' },
          }}
          classNames={{ container: 'w-full h-full' }}
          formats={['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'pdf417']}
        />
        {paused && (
          <Button
            label="Resume"
            size="sm"
            variant="secondary"
            className="absolute bottom-2 right-2 z-10"
            onClick={onResume}
            microinteraction
          />
        )}
      </div>
    </Card>
  );
}

export default ScannerCard; 