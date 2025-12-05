import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import Background from '../components/layout/Background';
import Card from '../components/common/Card';
import { api } from '../lib/api';
import Loader from '../components/common/Loader';

const ReceiptRow = ({ label, value, isBold }) => (
	<div className="flex justify-between items-center text-sm">
		<div className="text-gray-600">{label}</div>
		<div className={`text-gray-800 ${isBold ? 'font-bold' : ''}`}>{value}</div>
	</div>
);

export default function Receipt() {
	const navigate = useNavigate();
	const receiptRef = useRef(null);
	const params = new URLSearchParams(window.location.search);
	const tn = params.get('tn');
	const fromCustomer = params.get('from') === 'customer';
	const businessId = localStorage.getItem('business_id');
	const user = JSON.parse(sessionStorage.getItem('user') || '{}');

	const [details, setDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (tn) {
			const fetchDetails = async () => {
				try {
					setLoading(true);
					const path = fromCustomer
						? `/sales/public/details/${encodeURIComponent(tn)}`
						: `/sales/details/${encodeURIComponent(tn)}`;
					const data = await api(path);
					setDetails(data);
					setError(null);
				} catch (err) {
					setError(err.message);
					console.error(err);
				} finally {
					setLoading(false);
				}
			};
			fetchDetails();
		} else {
			setError('Transaction number not found.');
			setLoading(false);
		}
	}, [tn, fromCustomer]);

	const payload = useMemo(() => {
		if (!details) return '';
		return JSON.stringify({
			t: 'receipt',
			tn,
			tid: null,
			total: details.total,
			b: businessId ? Number(businessId) : null,
			items: details.items.map(item => ({
				name: item.name,
				quantity: item.quantity,
				price: item.price,
				subtotal: item.subtotal,
			})),
			summary: {
				subtotal: details.subtotal,
				discount: details.discountTotal,
				grandTotal: details.total,
			}
		});
	}, [tn, details, businessId]);

	const qrSrc = useMemo(() => {
		if (!payload) return '';
		const data = encodeURIComponent(payload);
		return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${data}&qzone=2&format=png&_=${Date.now()}`;
	}, [payload]);

	const handlePrint = () => {
		window.print();
	};

	const handleDownload = () => {
		if (typeof html2canvas === 'undefined') {
			alert('Download functionality is unavailable. The html2canvas package might be missing. Please run "npm install html2canvas".');
			return;
		}
		if (receiptRef.current) {
			html2canvas(receiptRef.current, {
				useCORS: true,
				scale: 2, // Higher scale for better quality
			}).then((canvas) => {
				const link = document.createElement('a');
				link.download = `eKahera-Receipt-${tn}.png`;
				link.href = canvas.toDataURL('image/png');
				link.click();
			});
		}
	};

	return (
		<Background variant="gradientBlue" pattern="dots" overlay floatingElements>
			<div className="min-h-screen printable-area">
				<div className="px-4 pt-6 max-w-md mx-auto grid gap-4">
					<Card className="p-6 no-print">
						<div className="text-2xl font-bold text-blue-900">E-Receipt</div>
						<div className="text-blue-700 mt-1">Thank you for your purchase.</div>
					</Card>

					{loading && <Loader />}
					{error && <Card className="p-6 text-red-500">{error}</Card>}

					{details && (
						<Card ref={receiptRef} className="p-3 space-y-3 font-mono bg-white max-w-[57mm] mx-auto">
							{/* Store Info */}
							<div className="text-center border-b pb-4">
								<h2 className="text-sm font-bold">{details.business.name}</h2>
								<p className="text-sm">{details.business.address}</p>
								<p className="text-sm">{details.business.contact}</p>
								{details.business.tin && <p className="text-sm">TIN: {details.business.tin}</p>}
							</div>

							{/* Transaction Details */}
							<div className="space-y-2 border-b pb-4">
								<ReceiptRow label="Receipt No:" value={details.transactionNumber} />
								<ReceiptRow label="Date:" value={new Date(details.date).toLocaleDateString()} />
								<ReceiptRow label="Time:" value={new Date(details.date).toLocaleTimeString()} />
								<ReceiptRow label="Cashier:" value={details.cashierName || 'N/A'} />
								<ReceiptRow label="Payment Method:" value={details.payment.method} />
							</div>

							{/* Itemized List */}
							<div>
								<div className="flex justify-between font-bold text-sm">
									<span>Item</span>
									<span>Total</span>
								</div>
								<div className="border-b border-dashed my-2"></div>
								<div className="space-y-2">
									{details.items.map((item, index) => (
										<div key={index} className="text-sm">
											<div>{item.name}</div>
											<div className="flex justify-between">
												<span className="pl-4">{item.quantity} x ₱{item.price}</span>
												<span>₱{item.subtotal}</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Totals */}
							<div className="space-y-2 border-t pt-4">
								<ReceiptRow label={`Subtotal (${details.totalQuantity} items)`} value={`₱${details.subtotal.toFixed(2)}`} />
								{details.discountTotal > 0 && <ReceiptRow label="Discount" value={`-₱${details.discountTotal.toFixed(2)}`} />}
								<ReceiptRow label="Grand Total" value={`₱${details.total.toFixed(2)}`} isBold />
							</div>

							{/* Payment Summary */}
							{details.payment.amountTendered && (
								<div className="space-y-2 border-t pt-4">
									<ReceiptRow label="Amount Tendered" value={`₱${Number(details.payment.amountTendered).toFixed(2)}`} />
									<ReceiptRow label="Change" value={`₱${Number(details.payment.change).toFixed(2)}`} />
								</div>
							)}

							{/* QR Code */}
							<div className="pt-2 flex flex-col items-center">
								<img src={qrSrc} alt="Receipt QR" className="w-[120px] h-[120px] border rounded bg-white" />
								<div className="text-blue-700 text-xs mt-2 text-center">QR contains a summary of this transaction.</div>
							</div>

							{/* Footer Message */}
							<div className="text-center text-xs pt-4 border-t">
								<p>Thank you for shopping!</p>
								<p className="font-bold">This is not an official receipt.</p>
							</div>
						</Card>
					)}

					<div className="pt-2 pb-6 grid grid-cols-2 gap-4 no-print">
						{fromCustomer ? (
							<>
								<button
									onClick={handleDownload}
									className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
									</svg>
									Download
								</button>
								<button
									onClick={() => navigate('/customer-enter')}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Proceed
								</button>
							</>
						) : (
							<>
								<button
									onClick={handlePrint}
									className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
									</svg>
									Print
								</button>
								<button
									onClick={() => {
										// Navigate back to POS - cashier goes to cashier-pos, admin/business_owner goes to pos
										if (user && user.role === 'cashier') {
											navigate('/cashier-pos');
										} else if (user && (user.role === 'admin' || user.role === 'business_owner')) {
											navigate('/pos');
										} else {
											// Default fallback
											navigate('/pos');
										}
									}}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									Proceed
								</button>
							</>
						)}
					</div>
				</div>
			</div>
			<style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .printable-area {
            padding: 0;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 57mm !important;
          }
          @page {
            size: 57mm auto;
            margin: 0;
            padding: 0;
          }
          * {
            max-width: 57mm !important;
          }
        }
      `}</style>
		</Background>
	);
}
