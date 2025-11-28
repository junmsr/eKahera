const cron = require('node-cron');
const pool = require('../config/database');

async function cleanupPendingTransactions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find pending transactions older than 24 hours
    const pendingTransactionsRes = await client.query(
      `SELECT transaction_id, customer_user_id FROM transactions
       WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 day'`
    );

    const transactionsToDelete = pendingTransactionsRes.rows;
    if (transactionsToDelete.length === 0) {
      console.log('Cleanup: No pending transactions to delete.');
      await client.query('COMMIT');
      return;
    }

    const transactionIds = transactionsToDelete.map(t => t.transaction_id);
    const userIdsToDelete = transactionsToDelete
      .map(t => t.customer_user_id)
      .filter(id => id != null);

    // Delete from transaction_items and transaction_payment first to respect foreign key constraints
    await client.query('DELETE FROM transaction_items WHERE transaction_id = ANY($1::int[])', [transactionIds]);
    await client.query('DELETE FROM transaction_payment WHERE transaction_id = ANY($1::int[])', [transactionIds]);

    // Delete the transactions
    const deletedTransactionsResult = await client.query(
      'DELETE FROM transactions WHERE transaction_id = ANY($1::int[])',
      [transactionIds]
    );

    let deletedUsersResult = { rowCount: 0 };
    if (userIdsToDelete.length > 0) {
      // Delete from logs first
      await client.query('DELETE FROM logs WHERE user_id = ANY($1::int[])', [userIdsToDelete]);
      await client.query('DELETE FROM email_notifications WHERE user_id = ANY($1::int[])', [userIdsToDelete]);

      // Delete the associated users
      deletedUsersResult = await client.query(
        'DELETE FROM users WHERE user_id = ANY($1::int[]) AND role = \'user\'',
        [userIdsToDelete]
      );
    }

    await client.query('COMMIT');

    console.log(`Cleanup successful:
      - Deleted ${deletedTransactionsResult.rowCount} pending transactions.
      - Deleted ${deletedUsersResult.rowCount} associated users.
    `);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during pending transactions cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

function startPendingTransactionCleanup() {
  // Schedule the task to run every day at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running daily cleanup of pending transactions...');
    cleanupPendingTransactions();
  }, {
    scheduled: true,
    timezone: "Asia/Manila" // Change to your server's timezone
  });

  console.log('Scheduled daily cleanup of pending transactions.');
}

module.exports = {
  cleanupPendingTransactions,
  startPendingTransactionCleanup,
};
