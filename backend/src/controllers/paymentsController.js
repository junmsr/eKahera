const { createCheckout } = require('../utils/paymongo');
const crypto = require('crypto');
const pool = require('../config/database');

const config = {
  PAYMONGO_SECRET_KEY: process.env.PAYMONGO_SECRET_KEY,
  PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET
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
			successUrl,
			paymentMethodTypes: ['gcash']
		});

		return res.json({
			checkoutUrl: session.data.attributes.checkout_url,
			sessionId: session.data.id
		});
	} catch (err) {
		return res.status(500).json({ error: err.message || 'Failed to create checkout', details: err.details || undefined });
	}
}

async function createMayaCheckout(req, res) {
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
			successUrl,
			paymentMethodTypes: ['paymaya']
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
    // Verify webhook signature
    const signature = req.headers['paymongo-signature'];
    const timestamp = req.headers['paymongo-timestamp'];
    const webhookSecret = config.PAYMONGO_WEBHOOK_SECRET;

    if (!signature || !timestamp || !webhookSecret) {
        console.error('Missing required webhook headers or webhook secret');
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        // Verify webhook signature
        const signedPayload = `${timestamp}.${JSON.stringify(req.body)}`;
        const computedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        if (signature !== computedSignature) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process the event
        const event = req.body;
        const eventType = event.data?.attributes?.type;
        const paymentData = event.data?.attributes?.data;

        if (!eventType || !paymentData) {
            console.error('Invalid event data');
            return res.status(400).json({ error: 'Invalid event data' });
        }

        // Handle different event types
        switch (eventType) {
            case 'payment.paid':
                await handleSuccessfulPayment(paymentData);
                break;
            case 'payment.failed':
                await handleFailedPayment(paymentData);
                break;
            case 'payment.refunded':
                await handleRefundedPayment(paymentData);
                break;
            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Error processing webhook' });
    }
}

async function handleSuccessfulPayment(paymentData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update transaction status to 'completed'
        const updateResult = await client.query(
            `UPDATE transactions SET status = $1, updated_at = NOW() WHERE transaction_number = $2 AND status = $3 RETURNING transaction_id`,
            ['completed', paymentData.attributes.reference_number, 'pending']
        );

        if (updateResult.rowCount === 0) {
            console.warn('No pending transaction found with reference:', paymentData.attributes.reference_number);
            return;
        }

        // Update payment record if it exists (payment_status column may not exist, so we'll just log)
        // Note: If you add payment_status column later, uncomment this:
        // await client.query(
        //     `UPDATE transaction_payment 
        //      SET payment_status = 'completed', 
        //          updated_at = NOW()
        //      WHERE transaction_id = $1`,
        //     [updateResult.rows[0].transaction_id]
        // );
        console.log(`Payment reference: ${paymentData.id} for transaction ${updateResult.rows[0].transaction_id}`);

        await client.query('COMMIT');
        console.log(`Successfully processed payment for transaction ${paymentData.attributes.reference_number}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleSuccessfulPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function handleFailedPayment(paymentData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update transaction status to 'failed'
        await client.query(
            `UPDATE transactions SET status = $1, updated_at = NOW() WHERE transaction_number = $2 AND status = $3`,
            ['failed', paymentData.attributes.reference_number, 'pending']
        );

        // Update payment record if it exists (payment_status column may not exist)
        // Note: If you add payment_status column later, uncomment this:
        // await client.query(
        //     `UPDATE transaction_payment 
        //      SET payment_status = 'failed', 
        //          updated_at = NOW()
        //      WHERE transaction_id IN (
        //          SELECT transaction_id FROM transactions 
        //          WHERE transaction_number = $1
        //      )`,
        //     [paymentData.attributes.reference_number]
        // );
        console.log(`Payment failed for transaction ${paymentData.attributes.reference_number}`);

        await client.query('COMMIT');
        console.log(`Marked failed payment for transaction ${paymentData.attributes.reference_number}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleFailedPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function handleRefundedPayment(paymentData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update transaction status to 'refunded'
        await client.query(
            `UPDATE transactions SET status = $1, updated_at = NOW() WHERE transaction_number = $2`,
            ['refunded', paymentData.attributes.reference_number]
        );

        // Update payment record if it exists (payment_status column may not exist)
        // Note: If you add payment_status column later, uncomment this:
        // await client.query(
        //     `UPDATE transaction_payment 
        //      SET payment_status = 'refunded', 
        //          updated_at = NOW()
        //      WHERE transaction_id IN (
        //          SELECT transaction_id FROM transactions 
        //          WHERE transaction_number = $1
        //      )`,
        //     [paymentData.attributes.reference_number]
        // );
        console.log(`Payment refunded for transaction ${paymentData.attributes.reference_number}`);

        await client.query('COMMIT');
        console.log(`Processed refund for transaction ${paymentData.attributes.reference_number}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleRefundedPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { createGcashCheckout, createMayaCheckout, paymongoWebhook };


