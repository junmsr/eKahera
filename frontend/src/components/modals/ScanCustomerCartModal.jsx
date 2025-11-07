import React, { useState } from 'react';
import Modal from './Modal';
import ScannerCard from '../ui/POS/ScannerCard';
import Button from '../common/Button';
import { api } from '../../lib/api';

export default function ScanCustomerCartModal({ isOpen, onClose, onImport }) {
	const [scannerPaused, setScannerPaused] = useState(false);
	const [error, setError] = useState('');
	const token = sessionStorage.getItem('auth_token');

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

	const handleScan = async (result) => {
		const code = result?.[0]?.rawValue;
		if (!code) return;
		setScannerPaused(true);
		setError('');
		try {
			let payload;
			try { payload = JSON.parse(code); } catch (e) { throw new Error('Invalid QR payload'); }
			if (!payload || payload.t !== 'cart' || !Array.isArray(payload.items)) throw new Error('Unsupported QR');

      const { b: businessId, items: compactItems } = payload;
      const cashierBusinessId = user?.businessId || user?.business_id;

      if (businessId && cashierBusinessId && Number(businessId) !== Number(cashierBusinessId)) {
        throw new Error('This QR code is not valid for this store.');
      }

			const fullItems = [];
			for (const it of compactItems) {
				if (!it?.p || !it?.q) continue;
				const product = await api(`/api/products/${encodeURIComponent(it.p)}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				fullItems.push({
					product_id: product.product_id,
					sku: product.sku,
					name: product.product_name,
					quantity: Number(it.q),
					price: Number(product.selling_price || 0)
				});
			}
			if (fullItems.length === 0) throw new Error('No items to import');
			onImport(fullItems);
			onClose();
		} catch (e) {
			setError(e.message || 'Failed to import');
		} finally {
			setScannerPaused(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Scan Customer Cart">
			<div className="space-y-3">
				<div className="text-blue-800">Ask the customer to show their cart QR.</div>
				<div className="h-[50vh]">
					<ScannerCard onScan={handleScan} paused={scannerPaused} onResume={() => setScannerPaused(false)} className="w-full h-full" />
				</div>
				{error && <div className="text-red-700 text-sm">{error}</div>}
				<div className="flex justify-end">
					<Button label="Close" variant="secondary" onClick={onClose} />
				</div>
			</div>
		</Modal>
	);
}


