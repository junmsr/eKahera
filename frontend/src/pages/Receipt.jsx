import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import Background from '../components/layout/Background';
import Card from '../components/common/Card';
import { api } from '../lib/api';
import Loader from '../components/common/Loader';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

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


	const handlePrint = () => {
		if (!details) return;
		printThermal(details).catch(err => {
			console.error(err);
			alert('Printer not connected');
		});
	};


	const handleDownload = async () => {
		if (!details || !receiptRef.current) {
			alert('Receipt content not available for download. Please wait for the receipt to load.');
			return;
		}
		
		try {
			const canvas = await html2canvas(receiptRef.current, {
				useCORS: true,
				scale: 2, // Higher scale for better quality
				allowTaint: true,
				backgroundColor: '#ffffff',
				logging: false, // Disable logging for better performance
			});
			
			// Convert canvas to blob for better mobile support
			canvas.toBlob((blob) => {
				if (!blob) {
					alert('Failed to generate receipt image. Please try again.');
					return;
				}

				const fileName = `eKahera-Receipt-${tn || 'receipt'}.png`;
				const url = window.URL.createObjectURL(blob);

				// Check if Web Share API is available and supports files (mobile devices)
				const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
				const hasShareAPI = navigator.share && typeof navigator.share === 'function';
				const hasCanShare = navigator.canShare && typeof navigator.canShare === 'function';

				if (isMobile && hasShareAPI) {
					// Use Web Share API for mobile devices
					const file = new File([blob], fileName, { type: 'image/png' });
					
					// Check if file sharing is supported
					let canShareFile = false;
					if (hasCanShare) {
						try {
							canShareFile = navigator.canShare({ files: [file] });
						} catch (e) {
							// canShare might throw, so we'll try sharing anyway
							canShareFile = true;
						}
					} else {
						// If canShare doesn't exist, try sharing anyway (some browsers support it without canShare)
						canShareFile = true;
					}

					if (canShareFile) {
						navigator.share({
							title: 'Receipt',
							text: `Receipt for transaction ${tn || 'receipt'}`,
							files: [file]
						}).then(() => {
							window.URL.revokeObjectURL(url);
						}).catch((err) => {
							// Share failed (user cancelled or not supported), fallback to download
							console.log('Share failed, falling back to download:', err);
							downloadFile(url, fileName, isMobile);
						});
						return;
					}
				}
				
				// Fallback to download for desktop or mobile without file share support
				downloadFile(url, fileName, isMobile);
			}, 'image/png');
		} catch (error) {
			console.error('Error downloading receipt:', error);
			alert('Failed to download receipt. Please try again.');
		}
	};

	const downloadFile = (url, fileName, isMobile) => {
		const link = document.createElement('a');
		link.download = fileName;
		link.href = url;
		link.style.display = 'none';
		
		if (isMobile) {
			// On mobile, append link and trigger click
			document.body.appendChild(link);
			
			// Use requestAnimationFrame for better mobile compatibility
			requestAnimationFrame(() => {
				try {
					// Try to trigger download
					link.click();
					
					// Clean up after a delay
					setTimeout(() => {
						if (document.body.contains(link)) {
							document.body.removeChild(link);
						}
						window.URL.revokeObjectURL(url);
					}, 200);
				} catch (e) {
					console.error('Download click failed:', e);
					// If click fails, open in new tab as last resort
					window.open(url, '_blank');
					if (document.body.contains(link)) {
						document.body.removeChild(link);
					}
					// Don't revoke URL immediately if opened in new tab
					setTimeout(() => window.URL.revokeObjectURL(url), 1000);
				}
			});
		} else {
			// Desktop: standard download
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			// Clean up after a short delay
			setTimeout(() => window.URL.revokeObjectURL(url), 100);
		}
	};

	const handleProceed = () => {
		// Navigate back to POS - cashier goes to cashier-pos, admin/business_owner goes to pos
		if (fromCustomer) {
			navigate('/customer-enter');
		} else if (user && user.role === 'cashier') {
			navigate('/cashier-pos');
		} else if (user && (user.role === 'admin' || user.role === 'business_owner')) {
			navigate('/pos');
		} else {
			// Default fallback
			navigate('/pos');
		}
	};

	// Set up keyboard shortcuts
	useKeyboardShortcuts(
		[
			{
				key: 'p',
				action: (e) => {
					if (!fromCustomer && !loading && details) {
						e.preventDefault();
						e.stopPropagation();
						handlePrint();
					}
				},
				enabled: !fromCustomer && !loading && details,
				allowWhileTyping: true, // Allow print shortcut even when typing
			},
			{
				key: 'enter',
				action: (e) => {
					e.preventDefault();
					e.stopPropagation();
					handleProceed();
				},
				enabled: !loading && details,
				allowWhileTyping: false,
			},
		],
		[fromCustomer, loading, details, user]
	);

	function buildEscPosReceipt(details) {
		const ESC = '\x1B';
		const GS = '\x1D';

		let r = '';

		r += ESC + '@';                 // init
		r += ESC + 'a' + '\x01';        // center
		r += details.business.name + '\n';
		r += details.business.address + '\n';
		r += details.business.contact + '\n';
		if (details.business.tin) {
			r += 'TIN: ' + details.business.tin + '\n';
		}

		r += '_______________________________\n';

		r += '\n';
		r += ESC + 'a' + '\x00';        // left
		r += 'Receipt #: ' + details.transactionNumber + '\n';
		r += 'Date: ' + new Date(details.date).toLocaleString() + '\n';
		r += 'Cashier: ' + (details.cashierName || 'N/A') + '\n';
		r += 'Payment: ' + details.payment.method + '\n';

		r += 'Item                      Total\n';

		r += '--------------------------------\n';

		details.items.forEach(item => {
			r += item.name + '\n';
			r += `  ${item.quantity} x P${item.price} \t  P${item.subtotal}\n`;
		});

		r += '--------------------------------\n';

		r += `Subtotal: P${details.subtotal.toFixed(2)}\n`;

		if (details.discountTotal > 0) {
			r += `Discount: -P${details.discountTotal.toFixed(2)}\n`;
		}

		r += ESC + 'E' + '\x01';        // bold ON
		r += `TOTAL: P${details.total.toFixed(2)}\n`;
		r += ESC + 'E' + '\x00';        // bold OFF

		if (details.payment.amountTendered) {
			r += `Cash: P${details.payment.amountTendered}\n`;
			r += `Change: P${details.payment.change}\n`;
		}

		r += '\n';
		r += ESC + 'a' + '\x01';
		r += 'THANK YOU\n';
		r += 'This is not an official receipt\n';

		r += '\n\n\n';
		r += GS + 'V' + 'A';            // cut
		console.log(r);
		return r;
		}

	async function printThermal(details) {
		try {
			if (!qz.websocket.isActive()) {
				await qz.websocket.connect();
			}

			const printer = await qz.printers.getDefault();
			console.log(printer); // printer name logger

			const config = qz.configs.create(printer, {
				encoding: 'UTF-8',
				rasterize: false,
				scaleContent: false
			});

			const data = [
				{	
					type: 'raw',
					format: 'command',
					data: buildEscPosReceipt(details)
				}
			];
			await qz.print(config, data);
		} catch (err) {
			console.error('QZ ERROR:', err);
			alert(err.message || 'Printer not connected');
		}
	}


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
								{(details.discountTotal > 0 || details.discount) && (
									<ReceiptRow 
										label={details.discount?.name ? `Discount (${details.discount.name})` : "Discount"} 
										value={`-₱${(details.discountTotal || (details.subtotal - details.total)).toFixed(2)}`} 
									/>
								)}
								<ReceiptRow label="Grand Total" value={`₱${details.total.toFixed(2)}`} isBold />
							</div>

							{/* Payment Summary */}
							{details.payment.amountTendered && (
								<div className="space-y-2 border-t pt-4">
									<ReceiptRow label="Amount Tendered" value={`₱${Number(details.payment.amountTendered).toFixed(2)}`} />
									<ReceiptRow label="Change" value={`₱${Number(details.payment.change).toFixed(2)}`} />
								</div>
							)}

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
									onClick={handleProceed}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									<span className="flex items-center gap-2">
										Proceed
										<span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">Enter</span>
									</span>
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
									<span className="flex items-center gap-2">
										Print
										<span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">P</span>
									</span>
								</button>
								<button
									onClick={handleProceed}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
								>
									<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
									</svg>
									<span className="flex items-center gap-2">
										Proceed
										<span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">Enter</span>
									</span>
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
