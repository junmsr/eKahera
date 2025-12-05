import React, { useState } from 'react';
import Background from '../components/layout/Background';
import Navbar from '../components/layout/Navbar';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ScannerCard from '../components/ui/POS/ScannerCard';
import { useNavigate } from 'react-router-dom';

function parseBusinessIdFromCode(raw) {
	try {
		// If it's a URL, parse query params
		const url = new URL(raw);
		const bid = url.searchParams.get('business_id') || url.searchParams.get('b') || url.searchParams.get('store');
		if (bid) return bid;
	} catch (_) {
		// not a URL; continue
	}
	// Try JSON payload
	try {
		const obj = JSON.parse(raw);
		if (obj && (obj.business_id || obj.businessId || obj.storeId)) {
			return obj.business_id || obj.businessId || obj.storeId;
		}
	} catch (_) {}
	// Fallback: numeric/string id directly
	return raw;
}

export default function EnterStore() {
	const navigate = useNavigate();
	const [scannerPaused, setScannerPaused] = useState(false);
	const [error, setError] = useState('');

	const handleScan = async (result) => {
		const code = result?.[0]?.rawValue;
		if (!code) return;
		setScannerPaused(true);
		setError('');
		const businessId = parseBusinessIdFromCode(code);
		if (!businessId) {
			setError('Invalid store QR');
			setScannerPaused(false);
			return;
		}
		// Set business ID and generate a transaction number for this session
		localStorage.setItem('business_id', String(businessId));
		// Clear old transaction data
		localStorage.removeItem('provisionalTransactionNumber');
		localStorage.removeItem('customerCart');
		// Generate and save new transaction number
		const timePart = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
		const randPart = Math.floor(1000 + Math.random() * 9000);
		const transactionNumber = `T-${String(businessId).padStart(2, '0')}-${timePart}-${randPart}`;
		localStorage.setItem('provisionalTransactionNumber', transactionNumber);

		// Call backend /public/enter-store to create customer user
		try {
			const response = await fetch("/api/sales/public/enter-store", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ business_id: businessId }),
			});

			if (response.ok) {
				const data = await response.json();
				// Store user_id and username in localStorage for use later
				if (data.user_id) localStorage.setItem("customer_user_id", String(data.user_id));
				if (data.username) localStorage.setItem("customer_username", data.username);
			}
		} catch (err) {
			console.error('Error creating customer user:', err);
			// Continue even if user creation fails
		}

		navigate('/customer');
	};

	return (
		<Background variant="gradientBlue" pattern="dots" overlay floatingElements>
			<div className="min-h-screen">
				<div className="pt-20 px-4">
					<Navbar />
				</div>
				<div className="px-4 mt-6 grid gap-4">
					<Card className="p-6">
						<div className="text-2xl font-bold text-blue-900">Scan Store QR</div>
						<div className="text-blue-700 mt-1">Point your camera at the store QR to start self-checkout.</div>
					</Card>
					{error ? (
						<Card className="p-4 border-red-200">
							<div className="text-red-700">{error}</div>
							<div className="mt-2">
								<Button label="Try again" variant="secondary" onClick={() => { setError(''); setScannerPaused(false); }} />
							</div>
						</Card>
					) : null}
					<div className="h-[60vh]">
						<ScannerCard onScan={handleScan} paused={scannerPaused} onResume={() => setScannerPaused(false)} className="w-full h-full" />
					</div>
				</div>
			</div>
		</Background>
	);
}


