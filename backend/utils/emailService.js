import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Get email configuration from environment variables
const getEmailConfig = () => {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!smtpUser || !smtpPass) {
    throw new Error('Email configuration is missing. Please set SMTP_USER and SMTP_PASS in your .env file.');
  }

  // Remove spaces from app password if present (Gmail app passwords sometimes have spaces)
  const cleanPassword = smtpPass.replace(/\s/g, '');

  const config = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: cleanPassword,
    },
  };

  // Additional Gmail-specific settings
  if (smtpHost.includes('gmail.com')) {
    config.service = 'gmail';
    // Gmail requires TLS
    config.requireTLS = true;
    config.tls = {
      rejectUnauthorized: false, // For development, set to true in production
    };
  }

  return config;
};

// Create transporter with error handling
const createTransporter = () => {
  try {
    const config = getEmailConfig();
    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    throw error;
  }
};

// Function to send password reset notification email
export const sendPasswordResetEmail = async (email, username) => {
  try {
    // Check if email configuration exists
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const errorMsg = 'Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Create transporter
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('Failed to create email transporter:', transporterError);
      throw new Error('Failed to initialize email service. Please check your email configuration.');
    }

    // Verify transporter connection (optional, but helpful for debugging)
    try {
      await transporter.verify();
      console.log('Email server is ready to send messages');
    } catch (verifyError) {
      console.error('Email server verification failed:', verifyError);
      // Don't throw here, just log - sometimes verification fails but sending still works
      console.warn('Warning: Email server verification failed, but attempting to send anyway...');
    }

    const mailOptions = {
      from: `"BioHarvest Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Admin Password Reset Notification - BioHarvest',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #ff6347;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .footer {
              padding: 10px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Notification</h2>
            </div>
            <div class="content">
              <p>Dear ${username},</p>
              <p>This is to notify you that your admin credentials have been reset successfully.</p>
              <div class="warning">
                <strong>⚠️ Important:</strong> Your previous admin credentials have been cleared. 
                You will need to set up new credentials when you next access the admin panel.
              </div>
              <p>If you did not request this password reset, please contact the system administrator immediately.</p>
              <p>Best regards,<br>BioHarvest Admin Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Notification
        
        Dear ${username},
        
        This is to notify you that your admin credentials have been reset successfully.
        
        Important: Your previous admin credentials have been cleared. 
        You will need to set up new credentials when you next access the admin panel.
        
        If you did not request this password reset, please contact the system administrator immediately.
        
        Best regards,
        BioHarvest Admin Team
        
        ---
        This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    console.log('Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      responseMessage: error.responseMessage,
    });

    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      const helpfulMessage = `
Email authentication failed. Common causes:
1. Wrong email address - Make sure SMTP_USER matches your Gmail address exactly
2. Wrong App Password - You must use a Gmail App Password, not your regular password
3. App Password not generated - Go to Google Account > Security > 2-Step Verification > App passwords
4. Spaces in password - Remove any spaces from the App Password in .env file

Current SMTP_USER: ${process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'NOT SET'}
      `.trim();
      console.error(helpfulMessage);
      // Preserve the error code when re-throwing
      const authError = new Error('Email authentication failed. Please check your SMTP credentials. See server logs for details.');
      authError.code = 'EAUTH';
      authError.responseCode = error.responseCode;
      authError.response = error.response;
      throw authError;
    }

    throw error;
  }
};

// Function to send forgot password email with reset instructions
export const sendForgotPasswordEmail = async (email, username) => {
  try {
    // Check if email configuration exists
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      const errorMsg = 'Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Create transporter
    let transporter;
    try {
      transporter = createTransporter();
    } catch (transporterError) {
      console.error('Failed to create email transporter:', transporterError);
      throw new Error('Failed to initialize email service. Please check your email configuration.');
    }

    // Verify transporter connection (optional, but helpful for debugging)
    try {
      await transporter.verify();
      console.log('Email server is ready to send messages');
    } catch (verifyError) {
      console.error('Email server verification failed:', verifyError);
      // Don't throw here, just log - sometimes verification fails but sending still works
      console.warn('Warning: Email server verification failed, but attempting to send anyway...');
    }

    const mailOptions = {
      from: `"BioHarvest Admin" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Instructions - BioHarvest Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            .header {
              background-color: #ff6347;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .footer {
              padding: 10px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .instructions {
              background-color: #f0f0f0;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Password Reset Instructions</h2>
            </div>
            <div class="content">
              <p>Dear ${username},</p>
              <p>You requested to reset your admin password. Your password has been reset and you need to set a new one.</p>
              <div class="warning">
                <strong>⚠️ Important:</strong> Your previous password has been cleared for security reasons.
              </div>
              <div class="instructions">
                <h3>Next Steps:</h3>
                <ol>
                  <li>Go to the admin login page</li>
                  <li>You will be prompted to set up new credentials</li>
                  <li>Enter your username: <strong>${username}</strong></li>
                  <li>Create a new secure password</li>
                  <li>Confirm your new password</li>
                  <li>Select your admin position</li>
                </ol>
              </div>
              <p>If you did not request this password reset, please contact the system administrator immediately.</p>
              <p>Best regards,<br>BioHarvest Admin Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Instructions
        
        Dear ${username},
        
        You requested to reset your admin password. Your password has been reset and you need to set a new one.
        
        Important: Your previous password has been cleared for security reasons.
        
        Next Steps:
        1. Go to the admin login page
        2. You will be prompted to set up new credentials
        3. Enter your username: ${username}
        4. Create a new secure password
        5. Confirm your new password
        6. Select your admin position
        
        If you did not request this password reset, please contact the system administrator immediately.
        
        Best regards,
        BioHarvest Admin Team
        
        ---
        This is an automated message. Please do not reply to this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Forgot password email sent successfully:', info.messageId);
    console.log('Email sent to:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      responseMessage: error.responseMessage,
    });

    // Provide more helpful error messages
    if (error.code === 'EAUTH') {
      const helpfulMessage = `
Email authentication failed. Common causes:
1. Wrong email address - Make sure SMTP_USER matches your Gmail address exactly
2. Wrong App Password - You must use a Gmail App Password, not your regular password
3. App Password not generated - Go to Google Account > Security > 2-Step Verification > App passwords
4. Spaces in password - Remove any spaces from the App Password in .env file

Current SMTP_USER: ${process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '***' : 'NOT SET'}
      `.trim();
      console.error(helpfulMessage);
      // Preserve the error code when re-throwing
      const authError = new Error('Email authentication failed. Please check your SMTP credentials. See server logs for details.');
      authError.code = 'EAUTH';
      authError.responseCode = error.responseCode;
      authError.response = error.response;
      throw authError;
    }

    throw error;
  }
};

