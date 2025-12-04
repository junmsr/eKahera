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
				vatableSales: details.taxDetails.vatableSales,
				vatAmount: details.taxDetails.vatAmount,
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
						<Card ref={receiptRef} className="p-6 space-y-4 font-mono bg-white">
							{/* Store Info */}
							<div className="text-center border-b pb-4">
								<h2 className="text-xl font-bold">{details.business.name}</h2>
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
								<ReceiptRow label="VATable Sales" value={`₱${details.taxDetails.vatableSales.toFixed(2)}`} />
								<ReceiptRow label="VAT (12%)" value={`₱${details.taxDetails.vatAmount.toFixed(2)}`} />
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
								<img src={qrSrc} alt="Receipt QR" className="w-[200px] h-[200px] border rounded-xl bg-white" />
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
									className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
								>
									Download Receipt
								</button>
								<button
									onClick={() => navigate('/customer-enter')}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
								>
									Scan New Store
								</button>
							</>
						) : (
							<>
								<button
									onClick={handlePrint}
									className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
								>
									Print
								</button>
								<button
									onClick={() => {
										if (user && user.role === 'cashier') navigate('/cashier-pos');
										else navigate('/pos');
									}}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
								>
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
						background-color: #fff;
					}
        }
      `}</style>
		</Background>
	);
}
