import React, { useMemo } from 'react';
import Background from '../components/layout/Background';
import Navbar from '../components/layout/Navbar';
import Card from '../components/common/Card';

export default function Receipt() {
	const params = new URLSearchParams(window.location.search);
	const tn = params.get('tn');
	const tid = params.get('tid');
	const total = params.get('total');
	const businessId = localStorage.getItem('business_id');

	const payload = useMemo(() => {
		return JSON.stringify({ t: 'receipt', tn, tid: tid ? Number(tid) : null, total: total ? Number(total) : 0, b: businessId ? Number(businessId) : null });
	}, [tn, tid, total, businessId]);

	const qrSrc = useMemo(() => {
		const data = encodeURIComponent(payload);
		return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}&qzone=2&format=png&_=${Date.now()}`;
	}, [payload]);

	return (
		<Background variant="gradientBlue" pattern="dots" overlay floatingElements>
			<div className="min-h-screen">
				<div className="pt-20 px-4">
					<Navbar />
				</div>
				<div className="px-4 mt-6 grid gap-4">
					<Card className="p-6">
						<div className="text-2xl font-bold text-blue-900">E-Receipt</div>
						<div className="text-blue-700 mt-1">Thank you for your purchase.</div>
					</Card>
					<Card className="p-6 space-y-3">
						<div className="text-blue-800">Transaction No.: <span className="font-bold">{tn}</span></div>
						<div className="text-blue-800">Total: <span className="font-bold">₱{Number(total || 0).toFixed(2)}</span></div>
						<div className="pt-2">
							<img src={qrSrc} alt="Receipt QR" className="w-[260px] h-[260px] border rounded-xl bg-white" />
							<div className="text-blue-700 text-sm mt-2">QR contains a summary of this transaction.</div>
						</div>
					</Card>
				</div>
			</div>
		</Background>
	);
}


