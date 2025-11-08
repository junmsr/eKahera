import React, { useMemo, useRef, useState } from 'react';
import Background from '../components/layout/Background';
import Navbar from '../components/layout/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function StoreQR() {
	const user = useMemo(() => {
		try { return JSON.parse(sessionStorage.getItem('user') || '{}'); } catch { return {}; }
	}, []);
	const businessId = user?.businessId || user?.business_id;
	const [nonce, setNonce] = useState(() => String(Date.now()));
	const imgRef = useRef(null);

	const storeUrl = useMemo(() => {
		const url = new URL(window.location.origin + '/enter-store');
		if (businessId) url.searchParams.set('business_id', String(businessId));
		return url.toString();
	}, [businessId]);

	const qrSrc = useMemo(() => {
		const data = encodeURIComponent(storeUrl);
		return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}&qzone=2&format=png&_=${nonce}`;
	}, [storeUrl, nonce]);

	const handleDownload = () => {
		if (!imgRef.current) return;
		const link = document.createElement('a');
		link.href = qrSrc;
		link.download = `store-${businessId || 'qr'}.png`;
		link.target = '_blank';
		link.rel = 'noopener';
		link.click();
	};

	return (
		<Background variant="gradientBlue" pattern="dots" overlay floatingElements>
			<div className="min-h-screen">
				<div className="pt-20 px-4">
					<Navbar />
				</div>
				<div className="px-4 mt-6 grid gap-4">
					<Card className="p-6">
						<div className="text-2xl font-bold text-blue-900">Store QR</div>
						<div className="text-blue-700 mt-1">Customers scan this once when they enter your store.</div>
					</Card>
					<Card className="p-6 flex flex-col items-center gap-4">
						{!businessId ? (
							<div className="text-red-700">Business ID not found. Please ensure you're logged in as an admin.</div>
						) : (
							<>
								<img ref={imgRef} src={qrSrc} alt="Store QR" className="w-[300px] h-[300px] border rounded-xl bg-white" />
								<div className="text-blue-800 break-all text-sm">{storeUrl}</div>
								<div className="flex gap-3">
									<Button label="Download PNG" variant="primary" onClick={handleDownload} />
									<Button label="Regenerate" variant="secondary" onClick={() => setNonce(String(Date.now()))} />
								</div>
							</>
						)}
					</Card>
				</div>
			</div>
		</Background>
	);
}


