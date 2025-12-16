const { sendContactFormEmail } = require('../utils/emailService');

// Submit contact form
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'All fields are required: name, email, and message'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email address'
      });
    }

    // Send the contact form email
    const emailSent = await sendContactFormEmail({ name, email, message });

    if (!emailSent) {
      return res.status(500).json({
        error: 'Failed to send contact form email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      error: 'An error occurred while processing your request. Please try again later.'
    });
  }
};
