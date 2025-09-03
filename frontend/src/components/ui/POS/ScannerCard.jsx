import React, { useState } from 'react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { Scanner } from '@yudiel/react-qr-scanner';

/**
 * Scanner Card Component
 * QR and barcode scanner interface
 */
function ScannerCard({ 
  onScan,
  paused,
  onResume,
  textMain = 'text-blue-800',
  className = '',
  ...props
}) {
  const [facingMode, setFacingMode] = useState('user');

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };
  return (
    <Card 
      className={`flex-shrink-0 emphasized-card ${className}`} 
      variant="glass" 
      microinteraction 
      {...props}
    >
      <div className="flex flex-col items-center shadow-2xl">
        <div className={`w-full text-center mb-2 font-bold text-lg tracking-wide ${textMain}`}>SCAN QR & BARCODE</div>
        <div className="w-56 h-55 bg-gradient-to-b from-blue-100/60 to-blue-200/60 rounded-2xl flex items-center justify-center border-2 border-blue-300/40 mb-2 overflow-hidden relative">
          <Scanner
            onScan={onScan}
            onError={err => console.error(err)}
            paused={paused}
            constraints={{ facingMode }}
            styles={{
              container: { width: '100%', height: '100%', borderRadius: '1rem', overflow: 'visible' },
              video: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '1rem',
                backgroundColor: 'black',
              },
            }}
            classNames={{ container: 'w-full h-full' }}
            formats={['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar', 'data_matrix', 'pdf417']}
          />
          <Button
            label={facingMode === 'user' ? 'Rear' : 'Front'}
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 z-10"
            onClick={toggleCamera}
            microinteraction
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
      </div>
    </Card>
  );
}

export default ScannerCard; 