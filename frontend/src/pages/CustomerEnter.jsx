import React, { useState } from 'react';
import Background from '../components/layout/Background';
import ScannerCard from '../components/ui/POS/ScannerCard';
import { useNavigate } from 'react-router-dom';

function parseBusinessId(raw) {
	try {
		const u = new URL(raw);
		return u.searchParams.get('business_id') || u.searchParams.get('b') || u.searchParams.get('store') || raw;
	} catch (_) {
		try {
			const obj = JSON.parse(raw);
			return obj.business_id || obj.businessId || obj.storeId || raw;
		} catch (_) {
			return raw;
		}
	}
}

export default function CustomerEnter() {
	const [paused, setPaused] = useState(false);
	const navigate = useNavigate();

	return (
		<Background variant="gradientBlue" overlay>
			<div className="min-h-screen flex items-center justify-center p-0">
				<div className="w-full h-screen">
					<ScannerCard
						onScan={(result) => {
							const code = result?.[0]?.rawValue;
							if (!code) return;
							setPaused(true);
							const bid = parseBusinessId(code);
							if (bid) {
								localStorage.setItem('business_id', String(bid));
								navigate('/customer');
							}
							setPaused(false);
						}}
						paused={paused}
						onResume={() => setPaused(false)}
						className="w-full h-full"
					/>
				</div>
			</div>
		</Background>
	);
}


