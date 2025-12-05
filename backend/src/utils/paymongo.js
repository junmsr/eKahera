const fetch = require('node-fetch');

function buildAuthHeader(secretKey) {
	const token = Buffer.from(`${secretKey}:`).toString('base64');
	return `Basic ${token}`;
}

async function createCheckout({ secretKey, amountCentavos, description, referenceNumber, cancelUrl, successUrl, paymentMethodTypes }) {
	const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': buildAuthHeader(secretKey)
		},
		body: JSON.stringify({
			data: {
				type: 'checkout_session',
				attributes: {
					line_items: [
						{
							amount: amountCentavos,
							currency: 'PHP',
							name: description || 'Payment',
							quantity: 1
						}
					],
					payment_method_types: paymentMethodTypes,
					reference_number: referenceNumber,
					success_url: successUrl,
					cancel_url: cancelUrl
				}
			}
		})
	});

	const json = await response.json();
	if (!response.ok) {
		const firstDetail = Array.isArray(json?.errors) && json.errors[0]?.detail ? json.errors[0].detail : undefined;
		const err = new Error(firstDetail || 'Failed to create PayMongo checkout');
		err.details = json;
		throw err;
	}
	return json;
}

module.exports = { createCheckout };


