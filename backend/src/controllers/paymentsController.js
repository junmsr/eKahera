const { createCheckout, getCheckoutSession } = require('../utils/paymongo');
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
        // Get raw body string for signature verification
        // PayMongo expects the raw body string (not parsed JSON) for signature verification
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : 
                       typeof req.body === 'string' ? req.body : 
                       JSON.stringify(req.body);
        
        // Verify webhook signature using raw body string
        const signedPayload = `${timestamp}.${rawBody}`;
        const computedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        if (signature !== computedSignature) {
            console.error('Invalid webhook signature');
            console.error('Expected:', computedSignature);
            console.error('Received:', signature);
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process the event - parse JSON from raw body
        let event;
        try {
            event = JSON.parse(rawBody);
        } catch (e) {
            console.error('Failed to parse webhook body:', e);
            console.error('Body type:', typeof req.body, 'Is Buffer:', Buffer.isBuffer(req.body));
            return res.status(400).json({ error: 'Invalid JSON in webhook body' });
        }
        
        console.log('Webhook event received:', JSON.stringify(event, null, 2));
        
        // PayMongo webhook structure:
        // event.data.attributes.type = "payment.paid" | "payment.failed" | etc.
        // event.data.attributes.data = payment object
        const eventType = event.data?.attributes?.type;
        const eventData = event.data?.attributes?.data;

        if (!eventType) {
            console.error('Missing event type in webhook. Event structure:', {
                hasData: !!event.data,
                hasAttributes: !!event.data?.attributes,
                eventKeys: Object.keys(event)
            });
            return res.status(400).json({ error: 'Invalid event data: missing type' });
        }

        if (!eventData) {
            console.error('Missing event data in webhook. Event structure:', {
                eventType,
                hasData: !!event.data,
                hasAttributes: !!event.data?.attributes,
                attributesKeys: event.data?.attributes ? Object.keys(event.data.attributes) : []
            });
            return res.status(400).json({ error: 'Invalid event data: missing payment data' });
        }

        // Extract reference_number from the payment or checkout session
        // PayMongo webhook structure: event.data.attributes.data contains the payment object
        // The reference_number is stored in the checkout_session, which we need to look up
        let referenceNumber = null;
        
        console.log('Payment data structure:', {
            paymentId: eventData.id,
            paymentType: eventData.type,
            attributeKeys: Object.keys(eventData.attributes || {}),
            hasCheckoutSessionId: !!eventData.attributes?.checkout_session_id,
            hasSource: !!eventData.attributes?.source,
            hasData: !!eventData.attributes?.data
        });
        
        // Try to get reference_number from payment attributes (if stored in metadata)
        if (eventData.attributes?.metadata?.reference_number) {
            referenceNumber = eventData.attributes.metadata.reference_number;
            console.log('Found reference_number in payment metadata:', referenceNumber);
        } else if (eventData.attributes?.reference_number) {
            referenceNumber = eventData.attributes.reference_number;
            console.log('Found reference_number in payment attributes:', referenceNumber);
        } else {
            // If not in payment, try to get from checkout session
            // PayMongo includes the checkout_session_id in the payment attributes or source
            const checkoutSessionId = eventData.attributes?.checkout_session_id || 
                                     eventData.attributes?.source?.id ||
                                     eventData.attributes?.data?.checkout_session_id;
            
            if (checkoutSessionId) {
                try {
                    console.log('Fetching checkout session:', checkoutSessionId);
                    const session = await getCheckoutSession({
                        secretKey: config.PAYMONGO_SECRET_KEY,
                        sessionId: checkoutSessionId
                    });
                    
                    console.log('Checkout session fetched:', {
                        sessionId: session.data?.id,
                        hasAttributes: !!session.data?.attributes,
                        attributeKeys: session.data?.attributes ? Object.keys(session.data.attributes) : []
                    });
                    
                    // Get reference_number from checkout session
                    if (session.data?.attributes?.reference_number) {
                        referenceNumber = session.data.attributes.reference_number;
                        console.log('Found reference_number from checkout session:', referenceNumber);
                    } else {
                        console.warn('Checkout session does not contain reference_number');
                    }
                } catch (err) {
                    console.error('Error fetching checkout session:', err.message, err.stack);
                }
            } else {
                console.warn('No checkout_session_id found in payment attributes');
            }
        }

        // If we still don't have reference_number, log for debugging
        if (!referenceNumber) {
            console.warn('Reference number not found in webhook payload. Full payment data:', {
                paymentId: eventData.id,
                paymentType: eventData.type,
                attributes: eventData.attributes
            });
        }

        // Handle different event types
        switch (eventType) {
            case 'payment.paid':
                await handleSuccessfulPayment(eventData, referenceNumber);
                break;
            case 'payment.failed':
                await handleFailedPayment(eventData, referenceNumber);
                break;
            case 'payment.refunded':
                await handleRefundedPayment(eventData, referenceNumber);
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

async function handleSuccessfulPayment(paymentData, referenceNumber) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Try to get reference_number from various possible locations
        let transactionNumber = referenceNumber;
        
        if (!transactionNumber) {
            // Try payment attributes
            if (paymentData.attributes?.metadata?.reference_number) {
                transactionNumber = paymentData.attributes.metadata.reference_number;
            } else if (paymentData.attributes?.reference_number) {
                transactionNumber = paymentData.attributes.reference_number;
            } else if (paymentData.attributes?.data?.reference_number) {
                transactionNumber = paymentData.attributes.data.reference_number;
            }
        }

        // If still no reference number, try to match by payment amount and pending status
        // This is a fallback for when reference_number is not available
        let updateResult;
        if (transactionNumber) {
            updateResult = await client.query(
                `UPDATE transactions SET status = $1, updated_at = NOW() 
                 WHERE transaction_number = $2 AND status = $3 
                 RETURNING transaction_id, transaction_number`,
                ['completed', transactionNumber, 'pending']
            );
            
            if (updateResult.rowCount === 0) {
                console.warn(`No pending transaction found with number: ${transactionNumber}`);
            }
        } else {
            // Fallback: Try to match by payment amount and recent pending transactions
            const paymentAmount = paymentData.attributes?.amount ? 
                (paymentData.attributes.amount / 100) : null; // Convert from centavos
            
            if (paymentAmount) {
                console.log(`Attempting to match payment by amount: ${paymentAmount}`);
                // Find pending transactions with matching amount created in last 2 hours
                // Match by exact amount or within 0.01 PHP tolerance
                updateResult = await client.query(
                    `UPDATE transactions SET status = $1, updated_at = NOW() 
                     WHERE status = $2 
                     AND ABS(total_amount - $3) < 0.01
                     AND created_at > NOW() - INTERVAL '2 hours'
                     AND transaction_id IN (
                         SELECT DISTINCT tp.transaction_id 
                         FROM transaction_payment tp 
                         WHERE tp.payment_type IN ('gcash', 'maya', 'paymaya')
                     )
                     ORDER BY created_at DESC
                     RETURNING transaction_id, transaction_number
                     LIMIT 1`,
                    ['completed', 'pending', paymentAmount]
                );
                
                if (updateResult.rowCount > 0) {
                    transactionNumber = updateResult.rows[0].transaction_number;
                    console.log(`Matched payment by amount to transaction: ${transactionNumber}`);
                } else {
                    console.warn(`No pending transaction found matching amount: ${paymentAmount}`);
                }
            } else {
                console.warn('Cannot match payment: no transaction number and no payment amount');
            }
        }

        if (!updateResult || updateResult.rowCount === 0) {
            console.warn('No pending transaction found. Payment data:', {
                referenceNumber: transactionNumber,
                paymentId: paymentData.id,
                amount: paymentData.attributes?.amount,
                attributes: JSON.stringify(paymentData.attributes)
            });
            await client.query('ROLLBACK');
            return;
        }

        console.log(`Payment reference: ${paymentData.id} for transaction ${transactionNumber || updateResult.rows[0].transaction_id}`);

        await client.query('COMMIT');
        console.log(`Successfully processed payment for transaction ${transactionNumber || 'unknown'}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleSuccessfulPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function handleFailedPayment(paymentData, referenceNumber) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Try to get reference_number from various possible locations
        let transactionNumber = referenceNumber;
        
        if (!transactionNumber) {
            if (paymentData.attributes?.metadata?.reference_number) {
                transactionNumber = paymentData.attributes.metadata.reference_number;
            } else if (paymentData.attributes?.reference_number) {
                transactionNumber = paymentData.attributes.reference_number;
            }
        }

        if (transactionNumber) {
            await client.query(
                `UPDATE transactions SET status = $1, updated_at = NOW() 
                 WHERE transaction_number = $2 AND status = $3`,
                ['failed', transactionNumber, 'pending']
            );
            console.log(`Payment failed for transaction ${transactionNumber}`);
        } else {
            console.warn('Could not determine transaction number for failed payment');
        }

        await client.query('COMMIT');
        if (transactionNumber) {
            console.log(`Marked failed payment for transaction ${transactionNumber}`);
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleFailedPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function handleRefundedPayment(paymentData, referenceNumber) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Try to get reference_number from various possible locations
        let transactionNumber = referenceNumber;
        
        if (!transactionNumber) {
            if (paymentData.attributes?.metadata?.reference_number) {
                transactionNumber = paymentData.attributes.metadata.reference_number;
            } else if (paymentData.attributes?.reference_number) {
                transactionNumber = paymentData.attributes.reference_number;
            }
        }

        if (transactionNumber) {
            await client.query(
                `UPDATE transactions SET status = $1, updated_at = NOW() 
                 WHERE transaction_number = $2`,
                ['refunded', transactionNumber]
            );
            console.log(`Payment refunded for transaction ${transactionNumber}`);
        } else {
            console.warn('Could not determine transaction number for refunded payment');
        }

        await client.query('COMMIT');
        if (transactionNumber) {
            console.log(`Processed refund for transaction ${transactionNumber}`);
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in handleRefundedPayment:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { createGcashCheckout, createMayaCheckout, paymongoWebhook };


