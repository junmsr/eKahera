import React, { useMemo } from 'react';
import Modal from './Modal';

export default function CustomerCartQRModal({ isOpen, onClose, cartItems, businessId }) {
	const payload = useMemo(() => {
		const items = (cartItems || []).map(i => ({ p: i.product_id, q: i.quantity }));
		return JSON.stringify({ t: 'cart', b: businessId ? Number(businessId) : null, items });
	}, [cartItems, businessId]);

	const qrSrc = useMemo(() => {
		const data = encodeURIComponent(payload);
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&qzone=2&format=png&_=${Date.now()}`;
	}, [payload]);

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Show this to the cashier">
			<div className="flex flex-col items-center gap-3">
				<img src={qrSrc} alt="Customer Cart QR" className="w-[300px] h-[300px] border rounded-xl bg-white" />
				<div className="text-blue-800 text-sm">Cashier scans this in POS to load your cart.</div>
			</div>
		</Modal>
	);
}


