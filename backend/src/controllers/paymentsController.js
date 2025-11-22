const { createCheckout } = require('../utils/paymongo');

const config = {
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY
};

async function createGcashCheckout(req, res) {
	try {
		const { amount, description, referenceNumber, cancelUrl, successUrl } = req.body;
		if (!amount || !successUrl || !cancelUrl) {
			return res.status(400).json({ error: 'amount, successUrl, cancelUrl are required' });
		}
		const amountCentavos = Math.round(Number(amount) * 100);
		const secretKey = config.PAYMONGO_SECRET_KEY;
		if (!secretKey) return res.status(500).json({ error: 'Missing PayMongo credentials' });

		const session = await createCheckout({
			secretKey,
			amountCentavos,
			description,
			referenceNumber,
			cancelUrl,
			successUrl
		});

		return res.json({
			checkoutUrl: session.data.attributes.checkout_url,
			sessionId: session.data.id
		});
	} catch (err) {
		return res.status(500).json({ error: err.message || 'Failed to create checkout', details: err.details || undefined });
	}
}

async function paymongoWebhook(req, res) {
	// For now, acknowledge receipt. You can verify signature if you enable it.
	try {
		// TODO: handle event types payment.paid, payment.failed etc.
		res.status(200).json({ received: true });
	} catch (_) {
		res.status(200).json({ received: true });
	}
}

module.exports = { createGcashCheckout, paymongoWebhook };


