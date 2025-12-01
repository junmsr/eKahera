const pool = require('../config/database');

async function deleteUser(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Delete from logs first
    await client.query('DELETE FROM logs WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM email_notifications WHERE user_id = $1', [userId]);

    // Delete the user
    const deletedUserResult = await client.query(
      'DELETE FROM users WHERE user_id = $1 AND role = \'customer\'',
      [userId]
    );

    await client.query('COMMIT');

    return deletedUserResult.rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error during user cleanup for userId: ${userId}`, error);
    throw error;
  } finally {
    client.release();
  }
}

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const deletedCount = await deleteUser(Number(userId));
    if (deletedCount > 0) {
      res.status(200).json({ message: `User with ID ${userId} deleted successfully.` });
    } else {
      res.status(404).json({ error: `User with ID ${userId} not found or not a customer.` });
    }
  } catch (error) {
    res.status(500).json({ error: 'Cleanup process failed.' });
  }
};
