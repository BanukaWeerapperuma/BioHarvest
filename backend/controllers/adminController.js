import { sendPasswordResetEmail, sendForgotPasswordEmail } from '../utils/emailService.js';

// Reset admin credentials and send email notification
export const resetAdminCredentials = async (req, res) => {
  try {
    const { email, username } = req.body;

    console.log('Reset credentials request received:', { email, username });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Check if email service is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Email service not configured. Missing SMTP_USER or SMTP_PASS in .env file');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file. Contact your system administrator.',
        error: 'Email configuration missing',
      });
    }

    // Send password reset notification email
    try {
      console.log('Attempting to send password reset email to:', email);
      const emailResult = await sendPasswordResetEmail(email, username);
      console.log('Email sent successfully:', emailResult);
      
      res.json({
        success: true,
        message: 'Password reset successful. Email notification has been sent to your email address.',
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
      });
      
      // Return error response so user knows email failed
      let errorMessage = 'Failed to send email notification. ';
      
      if (emailError.message && emailError.message.includes('configuration')) {
        errorMessage += emailError.message;
      } else if (emailError.code === 'EAUTH') {
        errorMessage += 'Email authentication failed. Please check your SMTP credentials.';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage += 'Could not connect to email server. Please check your SMTP settings.';
      } else {
        errorMessage += emailError.message || 'Please check your email configuration.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: 'Email notification failed',
      });
    }
  } catch (error) {
    console.error('Reset credentials error:', error);
    console.error('Full error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing password reset request. Please check server logs for details.',
      error: error.message || 'Unknown error',
    });
  }
};

// Forgot password - send reset instructions via email
export const forgotPassword = async (req, res) => {
  try {
    const { username, email } = req.body;

    console.log('Forgot password request received:', { username, email });

    // Validate inputs
    if (!username || username.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid username',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Check if email service is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Email service not configured. Missing SMTP_USER or SMTP_PASS in .env file');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file. Contact your system administrator.',
        error: 'Email configuration missing',
      });
    }

    // Send forgot password email
    try {
      console.log('Attempting to send forgot password email to:', email);
      await sendForgotPasswordEmail(email, username);
      console.log('Forgot password email sent successfully');
      
      res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email address. Please check your Gmail inbox.',
      });
    } catch (emailError) {
      console.error('Error sending forgot password email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
      });
      
      // Return error response so user knows email failed
      let errorMessage = 'Failed to send password reset email. ';
      
      if (emailError.message && emailError.message.includes('configuration')) {
        errorMessage += emailError.message;
      } else if (emailError.code === 'EAUTH') {
        errorMessage += 'Email authentication failed. Please check your SMTP credentials. ';
        errorMessage += 'For Gmail: Make sure you are using an App Password (not your regular password). ';
        errorMessage += 'Go to: Google Account > Security > 2-Step Verification > App passwords';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage += 'Could not connect to email server. Please check your SMTP settings.';
      } else {
        errorMessage += emailError.message || 'Please check your email configuration.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: 'Email notification failed',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Full error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing forgot password request. Please check server logs for details.',
      error: error.message || 'Unknown error',
    });
  }
};

