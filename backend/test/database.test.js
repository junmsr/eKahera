const sequelize = require('../src/config/database');

describe('Database Connection', () => {
  it('should connect to the database successfully', async () => {
    try {
      await sequelize.authenticate();
      // If authenticate() does not throw an error, the connection is successful
      expect(true).toBe(true);
    } catch (error) {
      // If there's an error, fail the test
      fail('Database connection failed: ' + error.message);
    }
  });
});
