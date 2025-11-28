const { cleanupPendingTransactions } = require('../utils/cleanup');

exports.triggerCleanup = async (req, res) => {
  try {
    console.log('Manual cleanup process triggered via API.');
    await cleanupPendingTransactions();
    res.status(200).json({ message: 'Cleanup process completed successfully.' });
  } catch (error) {
    console.error('API trigger for cleanup failed:', error);
    res.status(500).json({ error: 'Cleanup process failed.' });
  }
};