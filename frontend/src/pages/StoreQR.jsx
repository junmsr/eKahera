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

	const handleDownload = async () => {
		if (!qrSrc) {
			alert('QR code not available for download.');
			return;
		}
		
		try {
			// Fetch the image as a blob to handle CORS
			const response = await fetch(qrSrc);
			if (!response.ok) {
				throw new Error('Failed to fetch QR code image');
			}
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			
			const link = document.createElement('a');
			link.href = url;
			link.download = `store-${businessId || 'qr'}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the object URL
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading QR code:', error);
			alert('Failed to download QR code. Please try again.');
		}
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


